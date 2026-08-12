import type { APIEmbed } from "discord-api-types/v10"

export type EventData = Record<string, string | number | boolean>

export interface FormatDiscordEmbedInput {
  categoryName: string
  description?: string
  data?: EventData
  timestamp?: Date
}

export const formatDiscordEmbed = ({
  categoryName,
  description,
  data,
  timestamp = new Date(),
}: FormatDiscordEmbedInput): APIEmbed => ({
  title: `${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}`,
  description: description || `A new ${categoryName} event has occurred`,
  timestamp: timestamp.toISOString(),
  fields: Object.entries(data || {}).map(([key, value]) => ({
    name: key,
    value: String(value),
    inline: false,
  })),
})
