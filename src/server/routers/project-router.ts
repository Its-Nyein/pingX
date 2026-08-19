import { router } from "../__internals/router"
import { privateProcedure } from "../procedures"
import { db, eventCategories, users } from "@/db"
import { DELETE_CONFIRMATION, FREE_QUOTA, PRO_QUOTA } from "@/config"
import { getOrRollQuota } from "@/lib/quota"
import { DISCORD_ID_VALIDATOR } from "@/lib/validators/validator"
import { generateApiKey } from "@/lib/api-key"
import { count, eq } from "drizzle-orm"
import { HTTPException } from "hono/http-exception"
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

  updateProfile: privateProcedure
    .input(z.object({ name: z.string().trim().min(2).max(50) }))
    .mutation(async ({ c, ctx, input }) => {
      await db
        .update(users)
        .set({ name: input.name })
        .where(eq(users.id, ctx.user.id))

      return c.json({ success: true })
    }),

  deleteAccount: privateProcedure
    .input(z.object({ confirmation: z.string() }))
    .mutation(async ({ c, ctx, input }) => {
      if (input.confirmation.trim().toLowerCase() !== DELETE_CONFIRMATION.toLowerCase()) {
        throw new HTTPException(400, {
          message: `Type "${DELETE_CONFIRMATION}" to delete your account.`,
        })
      }

      await db.delete(users).where(eq(users.id, ctx.user.id))

      return c.json({ success: true })
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
