import { openDirectMessage } from "@/lib/delivery"
import { DiscordClient } from "@/lib/discord-client"
import { markWarned } from "@/lib/quota"
import { WARN_THRESHOLD } from "@/lib/quota-period"

interface SendQuotaWarningInput {
  discordId: string | null
  userId: string
  used: number
  limit: number
}

export const sendQuotaWarning = async ({
  discordId,
  userId,
  used,
  limit,
}: SendQuotaWarningInput): Promise<void> => {
  if (!discordId) return

  try {
    const discord = new DiscordClient(process.env.DISCORD_BOT_TOKEN)
    const channel = await openDirectMessage(discord, discordId)

    if (!channel.opened) return

    await discord.sendEmbed(channel.channelId, {
      title: "Quota warning",
      description: `You've used ${Math.round(
        WARN_THRESHOLD * 100
      )}% of your monthly pingX quota.`,
      timestamp: new Date().toISOString(),
      fields: [
        { name: "Used", value: `${used} of ${limit}`, inline: true },
        {
          name: "Remaining",
          value: String(Math.max(0, limit - used)),
          inline: true,
        },
      ],
    })

    await markWarned(userId)
  } catch (error) {
    console.error("[quota] failed to send 80% warning", error)
  }
}
