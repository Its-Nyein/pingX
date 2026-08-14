import { db, channels } from "@/db"
import { DiscordClient } from "@/lib/discord-client"
import { openDirectMessage } from "@/lib/delivery"
import type { ChannelOutcome, DeliveryTransport } from "@/lib/delivery"
import { WebhookClient } from "@/lib/webhook-client"
import { eq } from "drizzle-orm"

export interface ResolvedTarget {
  transport: DeliveryTransport
  channel: ChannelOutcome
  label: string
}

export const resolveTarget = async ({
  channelId,
  discordId,
}: {
  channelId: string | null
  discordId: string | null
}): Promise<ResolvedTarget> => {
  if (channelId) {
    const [channel] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1)

    if (channel) {
      return {
        transport: new WebhookClient(channel.target),
        channel: { opened: true, channelId: "webhook" },
        label: channel.name,
      }
    }
  }

  const discord = new DiscordClient(process.env.DISCORD_BOT_TOKEN)

  if (!discordId) {
    return {
      transport: discord,
      channel: {
        opened: false,
        permanent: true,
        reason: "No Discord ID on your account, and no channel on this category.",
      },
      label: "Discord DM",
    }
  }

  return {
    transport: discord,
    channel: await openDirectMessage(discord, discordId),
    label: "Discord DM",
  }
}
