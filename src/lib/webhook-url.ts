const DISCORD_WEBHOOK = /^https:\/\/(canary\.|ptb\.)?discord(app)?\.com\/api\/webhooks\/\d{17,20}\/[\w-]{20,}$/

export const isDiscordWebhookUrl = (value: string): boolean =>
  DISCORD_WEBHOOK.test(value.trim())

export const redactWebhookUrl = (value: string): string => {
  const parts = value.trim().split("/")
  const token = parts.at(-1) ?? ""

  return [...parts.slice(0, -1), `${token.slice(0, 4)}...`].join("/")
}
