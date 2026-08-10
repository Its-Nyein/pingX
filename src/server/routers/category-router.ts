import { db, eventCategories, events } from "@/db";
import { router } from "../__internals/router";
import { privateProcedure } from "../procedures";
import { startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { and, count, desc, eq, gte, inArray } from "drizzle-orm";
import { z } from "zod";
import { EVENT_CATEGORY_VALIDATOR } from "@/lib/validators/validator";
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

        const categoriesWithCount = await Promise.all(
            categories.map(async category => {
                const now = new Date();
                const firstDayOfMonth = startOfMonth(now);

                // `eventCategory: { id }` was a relation filter on the owning
                // category, which is the same as filtering the foreign key.
                const thisMonth = and(
                    eq(events.eventCategoryId, category.id),
                    gte(events.createdAt, firstDayOfMonth)
                )

                const [uniqueFieldCount, eventsCount, lastPing] = await Promise.all([
                    db
                        .selectDistinct({data: events.data})
                        .from(events)
                        .where(thisMonth)
                        .then((rows) => {
                            const fieldNames = new Set<string>();
                            rows.forEach((e) => {
                                Object.keys(e.data as object).forEach(
                                    (fieldName) => {
                                        fieldNames.add(fieldName)
                                    }
                                )
                            })
                            return fieldNames.size;
                        }),
                    db
                        .select({value: count()})
                        .from(events)
                        .where(thisMonth)
                        .then(([row]) => row.value),
                    db
                        .select({createdAt: events.createdAt})
                        .from(events)
                        .where(eq(events.eventCategoryId, category.id))
                        .orderBy(desc(events.createdAt))
                        .limit(1)
                        .then(([row]) => row ?? null)
                ])

                return {
                    ...category,
                    uniqueFieldCount,
                    eventsCount,
                    lastPing: lastPing?.createdAt || null,
                }
            })
        )

        // superjson is a helper function that serializes the response
        // superjson properly handle dates but json.stringify does not
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

            const [eventCategory] = await db
                .insert(eventCategories)
                .values({
                    name: name.toLowerCase(),
                    userId: user.id
                })
                .returning()

            return c.json({ eventCategory })
        }),

        insertQuickstartCategories: privateProcedure.mutation(async ({c, ctx}) => {
            const categories = await db
                .insert(eventCategories)
                .values(
                    [
                        {name: "sale"},
                        {name: "marketing"},
                        {name: "support"},
                    ].map(category => ({
                        ...category,
                        userId: ctx.user.id
                    }))
                )
                .returning({id: eventCategories.id})

            // Prisma's createMany returned { count }; the typo in the response
            // key is preserved so the client contract does not change.
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

                // Stands in for Prisma's `_count: { events: true }` include.
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
                page: z.number(),
                limit: z.number().max(50),
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

            // `eventCategory: { name, userId }` was a relation filter. Kept as a
            // subquery on the category rather than a join, so each result row
            // stays a flat Event exactly as before. (name, userId) is unique, so
            // the subquery yields at most one id.
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
                    .orderBy(desc(events.createdAt))
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