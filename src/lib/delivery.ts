import type { APIEmbed } from "discord-api-types/v10"

export interface DeliveryTransport {
  sendEmbed(channelId: string, embed: APIEmbed): Promise<unknown>
}

export interface DirectMessageTransport {
  createDM(userId: string): Promise<{ id: string }>
}

export type ChannelOutcome =
  | { opened: true; channelId: string }
  | { opened: false; permanent: boolean; reason: string }

export type DeliveryOutcome =
  | { delivered: true; at: Date }
  | { delivered: false; permanent: boolean; reason: string }

const DISCORD_CODES: Record<number, string> = {
  50007: "The recipient does not accept direct messages from this server.",
  50001: "The bot does not have access to that channel.",
  10013: "That Discord user no longer exists.",
  50033: "Discord does not recognise that user ID. Check it in settings.",
}

const statusOf = (error: unknown): number | undefined => {
  if (typeof error !== "object" || error === null) return undefined

  const status = (error as { status?: unknown }).status
  return typeof status === "number" ? status : undefined
}

const codeOf = (error: unknown): number | undefined => {
  if (typeof error !== "object" || error === null) return undefined

  const code = (error as { code?: unknown }).code
  return typeof code === "number" ? code : undefined
}

export const isPermanent = (error: unknown): boolean => {
  const status = statusOf(error)
  if (status === undefined) return false

  return status >= 400 && status < 500 && status !== 429
}

export const describeFailure = (error: unknown): string => {
  const code = codeOf(error)
  if (code !== undefined && code in DISCORD_CODES) return DISCORD_CODES[code]

  const status = statusOf(error)

  if (status === 429) return "Rate limited by Discord."
  if (status !== undefined && status >= 500) return `Discord returned ${status}.`
  if (status !== undefined) return `Discord rejected the message (${status}).`

  if (error instanceof Error && error.message) return error.message

  return "Delivery failed for an unknown reason."
}

export const deliver = async (
  transport: DeliveryTransport,
  channelId: string,
  embed: APIEmbed,
  now: () => Date = () => new Date()
): Promise<DeliveryOutcome> => {
  try {
    await transport.sendEmbed(channelId, embed)
    return { delivered: true, at: now() }
  } catch (error) {
    return {
      delivered: false,
      permanent: isPermanent(error),
      reason: describeFailure(error),
    }
  }
}

export const openDirectMessage = async (
  transport: DirectMessageTransport,
  discordId: string
): Promise<ChannelOutcome> => {
  try {
    const channel = await transport.createDM(discordId)
    return { opened: true, channelId: channel.id }
  } catch (error) {
    return {
      opened: false,
      permanent: isPermanent(error),
      reason: describeFailure(error),
    }
  }
}
