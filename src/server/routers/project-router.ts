import { router } from "../__internals/router"
import { privateProcedure } from "../procedures"
import { db, eventCategories, users } from "@/db"
import { FREE_QUOTA, PRO_QUOTA } from "@/config"
import { getOrRollQuota } from "@/lib/quota"
import { DISCORD_ID_VALIDATOR } from "@/lib/validators/validator"
import { generateApiKey } from "@/lib/api-key"
import { count, eq } from "drizzle-orm"
import { z } from "zod"

export const projectRouter = router({
  getUsage: privateProcedure.query(async ({ c, ctx }) => {
    const { user } = ctx

    const quota = await getOrRollQuota(user.id, user.plan)

    const [{ value: categoryCount }] = await db
      .select({ value: count() })
      .from(eventCategories)
      .where(eq(eventCategories.userId, user.id))

    const limits = user.plan === "PRO" ? PRO_QUOTA : FREE_QUOTA

    return c.superjson({
      categoriesUsed: categoryCount,
      categoriesLimit: limits.maxEventCategories,
      eventsUsed: quota.used,
      eventsLimit: quota.limit,
      resetDate: quota.resetsAt,
    })
  }),

  rotateApiKey: privateProcedure.mutation(async ({ c, ctx }) => {
    const apiKey = generateApiKey()

    await db.update(users).set({ apiKey }).where(eq(users.id, ctx.user.id))

    return c.json({ apiKey })
  }),

  setDiscordId: privateProcedure
    .input(z.object({ discordId: DISCORD_ID_VALIDATOR }))
    .mutation(async ({ c, ctx, input }) => {
      const { user } = ctx
      const { discordId } = input

      await db.update(users).set({ discordId }).where(eq(users.id, user.id))

      return c.json({ success: true })
    }),
})
