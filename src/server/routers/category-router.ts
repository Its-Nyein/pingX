import { db } from "@/db";
import { router } from "../__internals/router";
import { privateProcedure } from "../procedures";
import { startOfMonth } from "date-fns";

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
    })
})