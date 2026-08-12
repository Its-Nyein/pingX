import { db, eventCategories, events } from "@/db";
import { router } from "../__internals/router";
import { privateProcedure } from "../procedures";
import { startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { and, count, countDistinct, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { EVENT_CATEGORY_VALIDATOR } from "@/lib/validators/validator";
import { categoryLimitFor, slotsRemaining } from "@/lib/quota";
import { isUniqueViolation } from "@/lib/db-error";
import { HTTPException } from "hono/http-exception";

export const categoryRouter = router({
    getEventCategories: privateProcedure.query(async ({c, ctx}) => {
        const now = new Date();
        const firstDayOfMonth = startOfMonth(now);

        const categories = await db
            .select({
                id: eventCategories.id,
                name: eventCategories.name,
                updatedAt: eventCategories.updatedAt,
                createdAt: eventCategories.createdAt,
            })
            .from(eventCategories)
            .where(eq(eventCategories.userId, ctx.user.id))
            .orderBy(desc(eventCategories.updatedAt))

        const categoryIds = categories.map((category) => category.id)

        const ownedEvents = inArray(events.eventCategoryId, categoryIds)

        const totalsQuery = db
            .select({
                categoryId: events.eventCategoryId,
                eventsCount: sql<number>`count(*) filter (where ${events.createdAt} >= ${firstDayOfMonth})`.mapWith(Number),
                lastPing: sql<Date | null>`max(${events.createdAt})`.mapWith(events.createdAt),
            })
            .from(events)
            .where(ownedEvents)
            .groupBy(events.eventCategoryId)

        const fieldKeys = db
            .select({
                categoryId: events.eventCategoryId,
                key: sql<string>`jsonb_object_keys(case when jsonb_typeof(${events.data}) = 'object' then ${events.data} else '{}'::jsonb end)`.as("key"),
            })
            .from(events)
            .where(and(ownedEvents, gte(events.createdAt, firstDayOfMonth)))
            .as("field_keys")

        const uniqueFieldsQuery = db
            .select({
                categoryId: fieldKeys.categoryId,
                uniqueFieldCount: countDistinct(fieldKeys.key),
            })
            .from(fieldKeys)
            .groupBy(fieldKeys.categoryId)

        const [totals, uniqueFields] = categoryIds.length
            ? await Promise.all([totalsQuery, uniqueFieldsQuery])
            : [[], []]

        const totalsById = new Map(totals.map((row) => [row.categoryId, row]))
        const uniqueFieldsById = new Map(
            uniqueFields.map((row) => [row.categoryId, row.uniqueFieldCount])
        )

        const categoriesWithCount = categories.map((category) => ({
            ...category,
            uniqueFieldCount: uniqueFieldsById.get(category.id) ?? 0,
            eventsCount: totalsById.get(category.id)?.eventsCount ?? 0,
            lastPing: totalsById.get(category.id)?.lastPing ?? null,
        }))

        return c.superjson({ categories: categoriesWithCount})
    }),

    deleteCategory: privateProcedure
        .input(z.object({ name: z.string() }))
        .mutation(async ({c, input, ctx}) => {
            const { name } = input;

            await db
                .delete(eventCategories)
                .where(
                    and(
                        eq(eventCategories.name, name),
                        eq(eventCategories.userId, ctx.user.id)
                    )
                )

            return c.json({success: true})
        }),

    createEventCategory: privateProcedure
        .input(z.object({
            name: EVENT_CATEGORY_VALIDATOR
        }))
        .mutation(async ({c, ctx, input}) => {
            const { user } = ctx;
            const { name } = input;

            const limit = categoryLimitFor(user.plan)
            const [{ value: used }] = await db
                .select({ value: count() })
                .from(eventCategories)
                .where(eq(eventCategories.userId, user.id))

            if (slotsRemaining(used, limit) === 0) {
                const planLabel = user.plan === "PRO" ? "Pro" : "Free"

                throw new HTTPException(403, {
                    message: `${planLabel} plan allows ${limit} categories. Delete one or upgrade.`
                })
            }

            try {
                const [eventCategory] = await db
                    .insert(eventCategories)
                    .values({
                        name: name.toLowerCase(),
                        userId: user.id
                    })
                    .returning()

                return c.json({ eventCategory })
            } catch (error) {
                if (isUniqueViolation(error)) {
                    throw new HTTPException(409, {
                        message: `You already have a category named "${name.toLowerCase()}".`
                    })
                }

                throw error
            }
        }),

        insertQuickstartCategories: privateProcedure.mutation(async ({c, ctx}) => {
            const limit = categoryLimitFor(ctx.user.plan)

            const existing = await db
                .select({ name: eventCategories.name })
                .from(eventCategories)
                .where(eq(eventCategories.userId, ctx.user.id))

            const alreadyHave = new Set(existing.map((category) => category.name))

            const wanted = ["sale", "marketing", "support"]
                .filter((name) => !alreadyHave.has(name))
                .slice(0, slotsRemaining(existing.length, limit))

            if (wanted.length === 0) {
                return c.json({ succcess: true, count: 0 })
            }

            const categories = await db
                .insert(eventCategories)
                .values(
                    wanted.map(name => ({
                        name,
                        userId: ctx.user.id
                    }))
                )
                .onConflictDoNothing()
                .returning({id: eventCategories.id})

            return c.json({ succcess: true, count: categories.length})
        }),

        pollCategory: privateProcedure
            .input(z.object({ name: EVENT_CATEGORY_VALIDATOR}))
            .query(async ({c, ctx, input}) => {
                const { name } = input;

                const [category] = await db
                    .select({id: eventCategories.id})
                    .from(eventCategories)
                    .where(
                        and(
                            eq(eventCategories.name, name),
                            eq(eventCategories.userId, ctx.user.id)
                        )
                    )
                    .limit(1)

                if(!category) {
                    throw new HTTPException(404, {
                        message: `Category ${name} not found`
                    })
                }

                const [{value: eventsCount}] = await db
                    .select({value: count()})
                    .from(events)
                    .where(eq(events.eventCategoryId, category.id))

                const hasEvents = eventsCount > 0;
                return c.json({ hasEvents })
            }),

        getEventsByCategoryName: privateProcedure
        .input(z.object({
                name: EVENT_CATEGORY_VALIDATOR,
                page: z.number().int().min(1),
                limit: z.number().int().min(1).max(50),
                timeRange: z.enum(["today", "week" , "month"])
            })
        )
        .query(async ({c, ctx, input}) => {
            const {name, page, limit, timeRange} = input;

            const now = new Date()
            let startDate: Date

            switch(timeRange) {
                case "today":
                    startDate = startOfDay(now)
                    break;
                case "week":
                    startDate = startOfWeek(now, { weekStartsOn: 0 })
                    break;
                case "month":
                    startDate = startOfMonth(now)
                    break;
            }

            const categoryIds = db
                .select({id: eventCategories.id})
                .from(eventCategories)
                .where(
                    and(
                        eq(eventCategories.name, name),
                        eq(eventCategories.userId, ctx.user.id)
                    )
                )

            const inRange = and(
                inArray(events.eventCategoryId, categoryIds),
                gte(events.createdAt, startDate)
            )

            const [eventList, eventsCount, uniqueFieldCount] = await Promise.all([
                db
                    .select()
                    .from(events)
                    .where(inRange)
                    .orderBy(desc(events.createdAt), desc(events.id))
                    .offset((page - 1) * limit)
                    .limit(limit),
                db
                    .select({value: count()})
                    .from(events)
                    .where(inRange)
                    .then(([row]) => row.value),
                db
                    .selectDistinct({data: events.data})
                    .from(events)
                    .where(inRange)
                    .then((rows) => {
                        const fieldNames = new Set<string>();
                        rows.forEach((event) => {
                            Object.keys(event.data as object).forEach((name) => {
                                fieldNames.add(name)
                            })
                        })
                        return fieldNames.size
                    })
            ])
            return c.superjson({
                events: eventList,
                eventsCount,
                uniqueFieldCount
            })
        })
})