import { isDiscordWebhookUrl } from "@/lib/webhook-url"
import { describe, expect, it } from "vitest"
import { z } from "zod"

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

const URL =
  "https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz1234567890"

const parse = (name: string, target: string) =>
  CHANNEL_INPUT.safeParse({ name, target })

describe("channel input", () => {
  it("accepts a name and a Discord webhook", () => {
    expect(parse("Team alerts", URL).success).toBe(true)
  })

  it("trims both, so a pasted URL with stray whitespace works", () => {
    const result = parse("  Team alerts  ", `  ${URL}  `)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe("Team alerts")
      expect(result.data.target).toBe(URL)
    }
  })

  it("rejects a whitespace-only name, which min(1) alone would allow", () => {
    expect(parse("   ", URL).success).toBe(false)
  })

  it("rejects an empty name", () => {
    expect(parse("", URL).success).toBe(false)
  })

  it("rejects a name over the limit", () => {
    expect(parse("x".repeat(51), URL).success).toBe(false)
    expect(parse("x".repeat(50), URL).success).toBe(true)
  })

  it("rejects a URL that is not a Discord webhook", () => {
    const result = parse("Team", "https://example.com/hook")

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/not a Discord webhook URL/)
    }
  })

  it("rejects the SSRF shapes at the schema boundary", () => {
    expect(parse("Team", "http://localhost/api/webhooks/1/abc").success).toBe(false)
    expect(parse("Team", "https://169.254.169.254/api/webhooks/1/abc").success).toBe(false)
  })
})
