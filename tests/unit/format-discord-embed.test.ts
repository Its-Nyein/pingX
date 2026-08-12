import { describe, expect, it } from "vitest"
import { formatDiscordEmbed } from "@/lib/format-discord-embed"

const AT = new Date("2026-08-11T12:45:00.000Z")

describe("formatDiscordEmbed — title", () => {
  it("capitalises the first letter of the category", () => {
    expect(formatDiscordEmbed({ categoryName: "sale", timestamp: AT }).title).toBe(
      "Sale"
    )
  })

  it("leaves the rest of the category untouched", () => {
    expect(
      formatDiscordEmbed({ categoryName: "new-USER", timestamp: AT }).title
    ).toBe("New-USER")
  })

  it("handles a single-character category without dropping it", () => {
    expect(formatDiscordEmbed({ categoryName: "a", timestamp: AT }).title).toBe(
      "A"
    )
  })
})

describe("formatDiscordEmbed — description", () => {
  it("uses the supplied description", () => {
    expect(
      formatDiscordEmbed({
        categoryName: "sale",
        description: "New sale came in",
        timestamp: AT,
      }).description
    ).toBe("New sale came in")
  })

  it("falls back to a generated sentence when omitted", () => {
    expect(
      formatDiscordEmbed({ categoryName: "sale", timestamp: AT }).description
    ).toBe("A new sale event has occurred")
  })

  it("falls back when the description is an empty string, matching the original || behaviour", () => {
    expect(
      formatDiscordEmbed({
        categoryName: "sale",
        description: "",
        timestamp: AT,
      }).description
    ).toBe("A new sale event has occurred")
  })
})

describe("formatDiscordEmbed — fields", () => {
  it("maps each data entry to a non-inline field, preserving key order", () => {
    const embed = formatDiscordEmbed({
      categoryName: "sale",
      data: { plan: "PRO", amount: 52.99 },
      timestamp: AT,
    })

    expect(embed.fields).toEqual([
      { name: "plan", value: "PRO", inline: false },
      { name: "amount", value: "52.99", inline: false },
    ])
  })

  it("stringifies numbers and booleans", () => {
    const embed = formatDiscordEmbed({
      categoryName: "sale",
      data: { amount: 0, isTrial: false },
      timestamp: AT,
    })

    expect(embed.fields?.map((f) => f.value)).toEqual(["0", "false"])
  })

  it("returns an empty field list when data is omitted", () => {
    expect(
      formatDiscordEmbed({ categoryName: "sale", timestamp: AT }).fields
    ).toEqual([])
  })
})

describe("formatDiscordEmbed — timestamp", () => {
  it("serialises to an ISO 8601 string", () => {
    expect(
      formatDiscordEmbed({ categoryName: "sale", timestamp: AT }).timestamp
    ).toBe("2026-08-11T12:45:00.000Z")
  })

  it("defaults to now when no timestamp is given", () => {
    const before = Date.now()
    const embed = formatDiscordEmbed({ categoryName: "sale" })
    const after = Date.now()

    const at = new Date(embed.timestamp!).getTime()
    expect(at).toBeGreaterThanOrEqual(before)
    expect(at).toBeLessThanOrEqual(after)
  })
})
