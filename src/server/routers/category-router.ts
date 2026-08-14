import { db, eventCategories, events } from "@/db";
import { router } from "../__internals/router";
import { privateProcedure } from "../procedures";
import { startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { and, count, countDistinct, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { EVENT_CATEGORY_VALIDATOR } from "@/lib/validators/validator";
import { categoryLimitFor, slotsRemaining } from "@/lib/quota";
import { consumeRateLimit } from "@/lib/rate-limit";
import { RATE_LIMIT } from "@/config";
import { isUniqueViolation } from "@/lib/db-error";
import { isSearchable, likePattern } from "@/lib/search";
import { retentionCutoff } from "@/lib/retention";
import { DiscordClient } from "@/lib/discord-client";
import { deliver, openDirectMessage } from "@/lib/delivery";
import { evaluateAlertsSafely } from "@/lib/alerts";
import { formatDiscordEmbed, type EventData } from "@/lib/format-discord-embed";
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

        const retainedFrom = retentionCutoff(ctx.user.plan, now)

        const ownedEvents = and(
            inArray(events.eventCategoryId, categoryIds),
            gte(events.createdAt, retainedFrom)
        )

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
        .input(z.object({ name: EVENT_CATEGORY_VALIDATOR }))
        .mutation(async ({c, input, ctx}) => {
            const { name } = input;

            const deleted = await db
                .delete(eventCategories)
                .where(
                    and(
                        eq(eventCategories.name, name),
                        eq(eventCategories.userId, ctx.user.id)
                    )
                )
                .returning({ id: eventCategories.id })

            if (deleted.length === 0) {
                throw new HTTPException(404, {
                    message: `You do not have a category named "${name}".`
                })
            }

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
                return c.json({ success: true, count: 0 })
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

            return c.json({ success: true, count: categories.length})
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
                    .where(
                        and(
                            eq(events.eventCategoryId, category.id),
                            gte(events.createdAt, retentionCutoff(ctx.user.plan))
                        )
                    )

                const hasEvents = eventsCount > 0;
                return c.json({ hasEvents })
            }),

        sendTestEvent: privateProcedure
            .input(z.object({ name: EVENT_CATEGORY_VALIDATOR }))
            .mutation(async ({c, ctx, input}) => {
                const { user } = ctx

                if (!user.discordId) {
                    throw new HTTPException(400, {
                        message: "Add your Discord ID in settings before sending a test event."
                    })
                }

                const rate = await consumeRateLimit(
                    `test:${user.id}`,
                    RATE_LIMIT.testEventsPerMinute
                )

                if (!rate.allowed) {
                    throw new HTTPException(429, {
                        message: `Only ${rate.limit} test events a minute. Try again in ${rate.retryAfter}s.`
                    })
                }

                const [category] = await db
                    .select()
                    .from(eventCategories)
                    .where(
                        and(
                            eq(eventCategories.name, input.name),
                            eq(eventCategories.userId, user.id)
                        )
                    )
                    .limit(1)

                if (!category) {
                    throw new HTTPException(404, {
                        message: `You do not have a category named "${input.name}".`
                    })
                }

                const data = {
                    test: true,
                    source: "pingX dashboard",
                }

                const [event] = await db
                    .insert(events)
                    .values({
                        name: category.name,
                        userId: user.id,
                        data,
                        eventCategoryId: category.id,
                    })
                    .returning()

                const discord = new DiscordClient(process.env.DISCORD_BOT_TOKEN)
                const channel = await openDirectMessage(discord, user.discordId)

                if (!channel.opened) {
                    await db
                        .update(events)
                        .set({ deliveryStatus: "FAILED", lastError: channel.reason })
                        .where(eq(events.id, event.id))

                await evaluateAlertsSafely({
                    userId: user.id,
                    discordId: user.discordId,
                    categoryId: category.id,
                    categoryName: category.name,
                })
                    throw new HTTPException(channel.permanent ? 422 : 502, {
                        message: channel.reason
                    })
                }

                const outcome = await deliver(
                    discord,
                    channel.channelId,
                    formatDiscordEmbed({
                        categoryName: category.name,
                        description: "Test event sent from your pingX dashboard.",
                        data,
                    })
                )

                if (!outcome.delivered) {
                    await db
                        .update(events)
                        .set({ deliveryStatus: "FAILED", lastError: outcome.reason })
                        .where(eq(events.id, event.id))

                await evaluateAlertsSafely({
                    userId: user.id,
                    discordId: user.discordId,
                    categoryId: category.id,
                    categoryName: category.name,
                })
                    throw new HTTPException(outcome.permanent ? 422 : 502, {
                        message: outcome.reason
                    })
                }

                await db
                    .update(events)
                    .set({
                        deliveryStatus: "DELIVERED",
                        deliveredAt: outcome.at,
                        lastError: null,
                    })
                    .where(eq(events.id, event.id))

                return c.json({ eventId: event.id })
            }),

        getEventSeries: privateProcedure
            .input(z.object({
                name: EVENT_CATEGORY_VALIDATOR,
                timeRange: z.enum(["today", "week", "month"]),
            }))
            .query(async ({c, ctx, input}) => {
                const { name, timeRange } = input

                const now = new Date()
                const startDate =
                    timeRange === "today"
                        ? startOfDay(now)
                        : timeRange === "week"
                          ? startOfWeek(now, { weekStartsOn: 0 })
                          : startOfMonth(now)

                const categoryIds = db
                    .select({ id: eventCategories.id })
                    .from(eventCategories)
                    .where(
                        and(
                            eq(eventCategories.name, name),
                            eq(eventCategories.userId, ctx.user.id)
                        )
                    )

                const bucket = timeRange === "today" ? "hour" : "day"

                const rows = await db
                    .select({
                        bucket: sql<string>`date_trunc(${bucket}, ${events.createdAt})::text`,
                        delivered: sql<number>`count(*) filter (where ${events.deliveryStatus} = 'DELIVERED')`.mapWith(Number),
                        failed: sql<number>`count(*) filter (where ${events.deliveryStatus} = 'FAILED')`.mapWith(Number),
                    })
                    .from(events)
                    .where(
                        and(
                            inArray(events.eventCategoryId, categoryIds),
                            gte(events.createdAt, startDate),
                            gte(events.createdAt, retentionCutoff(ctx.user.plan, now))
                        )
                    )
                    .groupBy(sql`1`)
                    .orderBy(sql`1`)

                return c.superjson({ series: rows, bucket })
            }),

        resendEvent: privateProcedure
            .input(z.object({ eventId: z.string().min(1) }))
            .mutation(async ({c, ctx, input}) => {
                const { user } = ctx

                if (!user.discordId) {
                    throw new HTTPException(400, {
                        message: "Add your Discord ID in settings before resending."
                    })
                }

                const [event] = await db
                    .select()
                    .from(events)
                    .where(and(eq(events.id, input.eventId), eq(events.userId, user.id)))
                    .limit(1)

                if (!event) {
                    throw new HTTPException(404, { message: "Event not found" })
                }

                if (event.deliveryStatus === "DELIVERED") {
                    throw new HTTPException(409, {
                        message: "That event was already delivered."
                    })
                }

                const discord = new DiscordClient(process.env.DISCORD_BOT_TOKEN)
                const channel = await openDirectMessage(discord, user.discordId)

                if (!channel.opened) {
                    await db
                        .update(events)
                        .set({ deliveryStatus: "FAILED", lastError: channel.reason })
                        .where(eq(events.id, event.id))

                await evaluateAlertsSafely({
                    userId: user.id,
                    discordId: user.discordId,
                    categoryId: event.eventCategoryId!,
                    categoryName: event.name,
                })
                    throw new HTTPException(channel.permanent ? 422 : 502, {
                        message: channel.reason
                    })
                }

                const outcome = await deliver(
                    discord,
                    channel.channelId,
                    formatDiscordEmbed({
                        categoryName: event.name,
                        data: event.data as EventData,
                        timestamp: event.createdAt,
                    })
                )

                if (!outcome.delivered) {
                    await db
                        .update(events)
                        .set({ deliveryStatus: "FAILED", lastError: outcome.reason })
                        .where(eq(events.id, event.id))

                await evaluateAlertsSafely({
                    userId: user.id,
                    discordId: user.discordId,
                    categoryId: event.eventCategoryId!,
                    categoryName: event.name,
                })
                    throw new HTTPException(outcome.permanent ? 422 : 502, {
                        message: outcome.reason
                    })
                }

                await db
                    .update(events)
                    .set({
                        deliveryStatus: "DELIVERED",
                        deliveredAt: outcome.at,
                        lastError: null,
                    })
                    .where(eq(events.id, event.id))

                return c.json({ success: true })
            }),

        getEventsByCategoryName: privateProcedure
        .input(z.object({
                name: EVENT_CATEGORY_VALIDATOR,
                page: z.number().int().min(1),
                limit: z.number().int().min(1).max(50),
                timeRange: z.enum(["today", "week" , "month"]),
                search: z.string().max(100).optional(),
                status: z.array(z.enum(["PENDING", "DELIVERED", "FAILED"])).optional()
            })
        )
        .query(async ({c, ctx, input}) => {
            const {name, page, limit, timeRange, search, status} = input;

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

            const retainedFrom = retentionCutoff(ctx.user.plan, now)

            const matchesSearch = search && isSearchable(search)
                ? sql`(${events.data}::text ILIKE ${likePattern(search)} OR ${events.name} ILIKE ${likePattern(search)})`
                : undefined

            const beforeStatus = and(
                inArray(events.eventCategoryId, categoryIds),
                gte(events.createdAt, startDate),
                gte(events.createdAt, retainedFrom),
                matchesSearch
            )

            const inRange = and(
                beforeStatus,
                status && status.length
                    ? inArray(events.deliveryStatus, status)
                    : undefined
            )

            const rangeFieldKeys = db
                .select({
                    key: sql<string>`jsonb_object_keys(case when jsonb_typeof(${events.data}) = 'object' then ${events.data} else '{}'::jsonb end)`.as("key"),
                })
                .from(events)
                .where(inRange)
                .as("range_field_keys")

            const statusCountsQuery = db
                .select({
                    status: events.deliveryStatus,
                    value: count(),
                })
                .from(events)
                .where(beforeStatus)
                .groupBy(events.deliveryStatus)

            const [eventList, eventsCount, uniqueFieldCount, statusRows] = await Promise.all([
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
                    .select({ value: countDistinct(rangeFieldKeys.key) })
                    .from(rangeFieldKeys)
                    .then(([row]) => row?.value ?? 0),
                statusCountsQuery
            ])

            const statusCounts = Object.fromEntries(
                statusRows.map((row) => [row.status, row.value])
            ) as Record<string, number>
            return c.superjson({
                events: eventList,
                eventsCount,
                statusCounts,
                uniqueFieldCount
            })
        })
})