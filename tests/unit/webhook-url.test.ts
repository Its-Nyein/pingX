import { isDiscordWebhookUrl, redactWebhookUrl } from "@/lib/webhook-url"
import { describe, expect, it } from "vitest"

const VALID =
  "https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz1234567890"

describe("isDiscordWebhookUrl", () => {
  it("accepts a real webhook URL", () => {
    expect(isDiscordWebhookUrl(VALID)).toBe(true)
  })

  it("accepts the discordapp and canary hosts Discord still hands out", () => {
    expect(isDiscordWebhookUrl(VALID.replace("discord.com", "discordapp.com"))).toBe(true)
    expect(isDiscordWebhookUrl(VALID.replace("https://", "https://canary."))).toBe(true)
  })

  it("tolerates surrounding whitespace from a paste", () => {
    expect(isDiscordWebhookUrl(`  ${VALID}  `)).toBe(true)
  })

  it("rejects anything that is not a Discord webhook", () => {
    expect(isDiscordWebhookUrl("https://example.com/api/webhooks/1/abc")).toBe(false)
    expect(isDiscordWebhookUrl("not a url")).toBe(false)
    expect(isDiscordWebhookUrl("")).toBe(false)
  })

  it("rejects http and internal hosts, which is the SSRF case", () => {
    expect(isDiscordWebhookUrl(VALID.replace("https", "http"))).toBe(false)
    expect(isDiscordWebhookUrl("https://localhost/api/webhooks/1/abc")).toBe(false)
    expect(isDiscordWebhookUrl("https://169.254.169.254/api/webhooks/1/abc")).toBe(false)
  })

  it("rejects a lookalike host", () => {
    expect(
      isDiscordWebhookUrl(VALID.replace("discord.com", "discord.com.evil.io"))
    ).toBe(false)
  })
})

describe("redactWebhookUrl", () => {
  it("keeps the URL recognisable while hiding the token", () => {
    const redacted = redactWebhookUrl(VALID)

    expect(redacted).toContain("123456789012345678")
    expect(redacted).not.toContain("abcdefghijklmnopqrstuvwxyz1234567890")
    expect(redacted.endsWith("abcd...")).toBe(true)
  })
})
