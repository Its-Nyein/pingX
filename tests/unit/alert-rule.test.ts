import {
  describeRule,
  isInCooldown,
  shouldTrigger,
  windowStart,
} from "@/lib/alert-rule"
import { describe, expect, it } from "vitest"

const NOW = new Date("2026-08-14T12:00:00.000Z")
const minutesAgo = (n: number) => new Date(NOW.getTime() - n * 60_000)

const rule = (over: Partial<Parameters<typeof shouldTrigger>[0]> = {}) => ({
  threshold: 5,
  windowMinutes: 60,
  enabled: true,
  lastTriggeredAt: null,
  ...over,
})

describe("windowStart", () => {
  it("looks back by the rule's window", () => {
    expect(windowStart({ windowMinutes: 60 }, NOW).toISOString()).toBe(
      minutesAgo(60).toISOString()
    )
  })
})

describe("shouldTrigger", () => {
  it("fires at the threshold", () => {
    expect(shouldTrigger(rule(), 5, NOW)).toBe(true)
  })

  it("fires above the threshold", () => {
    expect(shouldTrigger(rule(), 9, NOW)).toBe(true)
  })

  it("stays quiet below it", () => {
    expect(shouldTrigger(rule(), 4, NOW)).toBe(false)
  })

  it("stays quiet when disabled, however bad it gets", () => {
    expect(shouldTrigger(rule({ enabled: false }), 500, NOW)).toBe(false)
  })
})

describe("cooldown", () => {
  it("holds off inside the window, so one incident is one message", () => {
    const recent = rule({ lastTriggeredAt: minutesAgo(30) })

    expect(isInCooldown(recent, NOW)).toBe(true)
    expect(shouldTrigger(recent, 100, NOW)).toBe(false)
  })

  it("fires again once the window has passed", () => {
    const old = rule({ lastTriggeredAt: minutesAgo(61) })

    expect(isInCooldown(old, NOW)).toBe(false)
    expect(shouldTrigger(old, 5, NOW)).toBe(true)
  })

  it("treats a rule that has never fired as ready", () => {
    expect(isInCooldown(rule(), NOW)).toBe(false)
  })

  it("uses the rule's own window, not a fixed one", () => {
    const short = rule({ windowMinutes: 15, lastTriggeredAt: minutesAgo(20) })
    const long = rule({ windowMinutes: 360, lastTriggeredAt: minutesAgo(20) })

    expect(isInCooldown(short, NOW)).toBe(false)
    expect(isInCooldown(long, NOW)).toBe(true)
  })
})

describe("describeRule", () => {
  it("reads as a sentence for a scoped rule", () => {
    expect(describeRule("FAILED_EVENTS", 5, 60, "sale")).toBe(
      "5 or more failed events in sale within 1 hour"
    )
  })

  it("says so when the rule covers everything", () => {
    expect(describeRule("ALL_EVENTS", 100, 1440, null)).toBe(
      "100 or more events across all categories within 24 hours"
    )
  })

  it("keeps minutes when they do not divide into hours", () => {
    expect(describeRule("FAILED_EVENTS", 3, 15, "error")).toBe(
      "3 or more failed events in error within 15 minutes"
    )
  })
})
