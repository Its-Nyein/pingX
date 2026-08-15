import { channels, db, eventCategories } from "@/db"
import { EVENT_CATEGORY_VALIDATOR } from "@/lib/validators/validator"
import { isDiscordWebhookUrl, redactWebhookUrl } from "@/lib/webhook-url"
import { and, asc, eq } from "drizzle-orm"
import { HTTPException } from "hono/http-exception"
import { z } from "zod"
import { router } from "../__internals/router"
import { privateProcedure } from "../procedures"

const MAX_CHANNELS = 5

const CHANNEL_INPUT = z.object({
  name: z.string().trim().min(1, "Give the channel a name").max(50),
  target: z
    .string()
    .trim()
    .min(1, "Paste the webhook URL")
    .max(500)
    .refine(isDiscordWebhookUrl, {
      message:
        "That is not a Discord webhook URL. Copy it from Server Settings, Integrations, Webhooks.",
    }),
})

export const channelRouter = router({
  listChannels: privateProcedure.query(async ({ c, ctx }) => {
    const rows = await db
      .select()
      .from(channels)
      .where(eq(channels.userId, ctx.user.id))
      .orderBy(asc(channels.createdAt))

    return c.superjson({
      channels: rows.map((channel) => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        target: redactWebhookUrl(channel.target),
      })),
      limit: MAX_CHANNELS,
    })
  }),

  listAssignments: privateProcedure.query(async ({ c, ctx }) => {
    const rows = await db
      .select({
        name: eventCategories.name,
        channelId: eventCategories.channelId,
      })
      .from(eventCategories)
      .where(eq(eventCategories.userId, ctx.user.id))
      .orderBy(asc(eventCategories.name))

    return c.superjson({ categories: rows })
  }),

  createChannel: privateProcedure
    .input(CHANNEL_INPUT)
    .mutation(async ({ c, ctx, input }) => {
      const existing = await db
        .select({ id: channels.id })
        .from(channels)
        .where(eq(channels.userId, ctx.user.id))

      if (existing.length >= MAX_CHANNELS) {
        throw new HTTPException(403, {
          message: `You can have ${MAX_CHANNELS} channels. Delete one first.`,
        })
      }

      const [channel] = await db
        .insert(channels)
        .values({
          userId: ctx.user.id,
          type: "DISCORD_WEBHOOK",
          name: input.name,
          target: input.target,
        })
        .returning({ id: channels.id })

      return c.json({ id: channel.id })
    }),

  deleteChannel: privateProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ c, ctx, input }) => {
      const deleted = await db
        .delete(channels)
        .where(and(eq(channels.id, input.id), eq(channels.userId, ctx.user.id)))
        .returning({ id: channels.id })

      if (deleted.length === 0) {
        throw new HTTPException(404, { message: "Channel not found" })
      }

      return c.json({ success: true })
    }),

  assignChannel: privateProcedure
    .input(
      z.object({
        categoryName: EVENT_CATEGORY_VALIDATOR,
        channelId: z.string().min(1).nullable(),
      })
    )
    .mutation(async ({ c, ctx, input }) => {
      if (input.channelId) {
        const [channel] = await db
          .select({ id: channels.id })
          .from(channels)
          .where(
            and(
              eq(channels.id, input.channelId),
              eq(channels.userId, ctx.user.id)
            )
          )
          .limit(1)

        if (!channel) {
          throw new HTTPException(404, { message: "Channel not found" })
        }
      }

      const updated = await db
        .update(eventCategories)
        .set({ channelId: input.channelId })
        .where(
          and(
            eq(eventCategories.name, input.categoryName),
            eq(eventCategories.userId, ctx.user.id)
          )
        )
        .returning({ id: eventCategories.id })

      if (updated.length === 0) {
        throw new HTTPException(404, {
          message: `You do not have a category named "${input.categoryName}".`,
        })
      }

      return c.json({ success: true })
    }),
})
