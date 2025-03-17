import { db } from "@/db";
import { router } from "../__internals/router";
import { privateProcedure } from "../procedures";
import { startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { z } from "zod";
import { EVENT_CATEGORY_VALIDATOR } from "@/lib/validators/validator";
import { HTTPException } from "hono/http-exception";

export const categoryRouter = router({
    getEventCategories: privateProcedure.query(async ({c, ctx}) => {
        const now = new Date();
        const firstDayOfMonth = startOfMonth(now);

        const categories = await db.eventCategory.findMany({
            where: {userId: ctx.user.id},
            select: {
                id: true,
                name: true,
                updatedAt: true,
                createdAt: true,
            },
            orderBy: {updatedAt: "desc"},
        })

        const categoriesWithCount = await Promise.all(
            categories.map(async category => {
                const now = new Date();
                const firstDayOfMonth = startOfMonth(now);

                const [uniqueFieldCount, eventsCount, lastPing] = await Promise.all([
                    db.event.findMany({
                        where: {
                            eventCategory: {id: category.id},
                            createdAt: {gte: firstDayOfMonth},
                        },
                        select: {data: true},
                        distinct: ["data"],
                    }).then((events) => {
                        const fieldNames = new Set<string>();
                        events.forEach((e) => {
                            Object.keys(e.data as object).forEach(
                                (fieldName) => {
                                    fieldNames.add(fieldName)
                                }
                            )
                        })
                        return fieldNames.size;
                    }),
                    db.event.count({
                        where: {
                            eventCategory: {id: category.id},
                            createdAt: {gte: firstDayOfMonth},
                        }
                    }),
                    db.event.findFirst({
                        where: {
                            eventCategory: {id: category.id},
                        },
                        orderBy: {createdAt: "desc"},
                        select: {createdAt: true},
                    })
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

            await db.eventCategory.delete({
                where: {name_userId: {name, userId: ctx.user.id}}
            })

            return c.json({success: true})
        }),

    createEventCategory: privateProcedure
        .input(z.object({
            name: EVENT_CATEGORY_VALIDATOR
        }))
        .mutation(async ({c, ctx, input}) => {
            const { user } = ctx;
            const { name } = input;

            const eventCategory = await db.eventCategory.create({
                data: {
                    name: name.toLowerCase(),
                    userId: user.id
                }
            })

            return c.json({ eventCategory })
        }),

        insertQuickstartCategories: privateProcedure.mutation(async ({c, ctx}) => {
            const categories = await db.eventCategory.createMany({
                data: [
                    {name: "sale"},
                    {name: "marketing"},
                    {name: "support"},
                ].map(category => ({
                    ...category,
                    userId: ctx.user.id
                }))
            })

            return c.json({ succcess: true, count: categories.count})
        }),

        pollCategory: privateProcedure
            .input(z.object({ name: EVENT_CATEGORY_VALIDATOR}))
            .query(async ({c, ctx, input}) => {
                const { name } = input;
                
                const category = await db.eventCategory.findUnique({
                    where: {name_userId: {name, userId: ctx.user.id}},
                    include: {
                        _count: {
                            select: {events: true}
                        }
                    }
                })

                if(!category) {
                    throw new HTTPException(404, {
                        message: `Category ${name} not found`
                    })
                }

                const hasEvents = category._count.events > 0;
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

            const [events, eventsCount, uniqueFieldCount] = await Promise.all([
                db.event.findMany({
                    where: {
                        eventCategory: {name, userId: ctx.user.id},
                        createdAt: {gte: startDate}
                    },
                    skip: (page - 1) * limit,
                    take: limit,
                    orderBy: {createdAt: "desc"}
                }),
                db.event.count({
                    where: {
                        eventCategory: {name, userId: ctx.user.id},
                        createdAt: {gte: startDate}
                    }
                }),
                db.event.findMany({
                    where: {
                        eventCategory: {name, userId: ctx.user.id},
                        createdAt: {gte: startDate}
                    },
                    select: {
                        data: true
                    },
                    distinct: ["data"]
                }).then((events) => {
                    const fieldNames = new Set<string>();
                    events.forEach((event) => {
                        Object.keys(event.data as object).forEach((name) => {
                            fieldNames.add(name)
                        })
                    })
                    return fieldNames.size
                })
            ])
            return c.superjson({
                events,
                eventsCount,
                uniqueFieldCount
            })
        })
})