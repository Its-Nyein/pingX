import { db, events } from "@/db"
import type { APIEmbed } from "discord-api-types/v10"
import { evaluateAlertsSafely } from "@/lib/alerts"
import { deliver } from "@/lib/delivery"
import { resolveTarget } from "@/lib/delivery-target"
import { eq } from "drizzle-orm"

export interface DeliverEventInput {
  eventId: string
  categoryId: string | null
  categoryName: string
  channelId: string | null
  userId: string
  discordId: string | null
  embed: APIEmbed
  onError?: (message: string, fields: Record<string, unknown>) => void
}

export type DeliverEventResult =
  | { delivered: true; via: string }
  | { delivered: false; permanent: boolean; reason: string }

export const deliverEvent = async ({
  eventId,
  categoryId,
  categoryName,
  channelId,
  userId,
  discordId,
  embed,
  onError,
}: DeliverEventInput): Promise<DeliverEventResult> => {
  const { transport, channel, label } = await resolveTarget({
    channelId,
    discordId,
  })

  const fail = async (permanent: boolean, reason: string) => {
    await db
      .update(events)
      .set({ deliveryStatus: "FAILED", lastError: reason })
      .where(eq(events.id, eventId))

    onError?.("delivery failed", { eventId, reason, permanent, via: label })

    if (categoryId) {
      await evaluateAlertsSafely({ userId, discordId, categoryId, categoryName })
    }

    return { delivered: false as const, permanent, reason }
  }

  if (!channel.opened) return fail(channel.permanent, channel.reason)

  const outcome = await deliver(transport, channel.channelId, embed)

  if (!outcome.delivered) return fail(outcome.permanent, outcome.reason)

  await db
    .update(events)
    .set({
      deliveryStatus: "DELIVERED",
      deliveredAt: outcome.at,
      lastError: null,
    })
    .where(eq(events.id, eventId))

  if (categoryId) {
    await evaluateAlertsSafely({ userId, discordId, categoryId, categoryName })
  }

  return { delivered: true, via: label }
}
