import { addMonths, startOfMonth } from "date-fns"
import { router } from "../__internals/router"
import { privateProcedure } from "../procedures"
import { db, eventCategories, quotas, users } from "@/db"
import { FREE_QUOTA, PRO_QUOTA } from "@/config"
import { and, count, eq } from "drizzle-orm"
import { z } from "zod"

export const projectRouter = router({
  getUsage: privateProcedure.query(async ({ c, ctx }) => {
    const { user } = ctx

    const currentDate = startOfMonth(new Date())

    const [quota] = await db
      .select()
      .from(quotas)
      .where(
        and(
          eq(quotas.userId, user.id),
          eq(quotas.month, currentDate.getMonth() + 1),
          eq(quotas.year, currentDate.getFullYear())
        )
      )
      .limit(1)

    const eventCount = quota?.count ?? 0

    const [{ value: categoryCount }] = await db
      .select({ value: count() })
      .from(eventCategories)
      .where(eq(eventCategories.userId, user.id))

    const limits = user.plan === "PRO" ? PRO_QUOTA : FREE_QUOTA

    const resetDate = addMonths(currentDate, 1)

    return c.superjson({
      categoriesUsed: categoryCount,
      categoriesLimit: limits.maxEventCategories,
      eventsUsed: eventCount,
      eventsLimit: limits.maxEventsPerMonth,
      resetDate,
    })
  }),

  setDiscordId: privateProcedure
    .input(z.object({ discordId: z.string().max(20) }))
    .mutation(async ({ c, ctx, input }) => {
      const { user } = ctx
      const { discordId } = input

      await db.update(users).set({ discordId }).where(eq(users.id, user.id))

      return c.json({ success: true })
    }),
})
