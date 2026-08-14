import type { DeliveryTransport } from "@/lib/delivery"
import { markWarned } from "@/lib/quota"
import { WARN_THRESHOLD } from "@/lib/quota-period"

interface SendQuotaWarningInput {
  discord: DeliveryTransport
  channelId: string
  userId: string
  used: number
  limit: number
}

export const sendQuotaWarning = async ({
  discord,
  channelId,
  userId,
  used,
  limit,
}: SendQuotaWarningInput): Promise<void> => {
  try {
    await discord.sendEmbed(channelId, {
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
