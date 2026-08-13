import { RETENTION } from "@/config"
import {
  cleanupCutoff,
  isWithinRetention,
  retentionCutoff,
  retentionDaysFor,
  retentionLabel,
} from "@/lib/retention"
import { describe, expect, it } from "vitest"

const NOW = new Date("2026-08-13T12:00:00.000Z")
const daysBefore = (days: number) =>
  new Date(NOW.getTime() - days * 86_400_000)

describe("retentionDaysFor", () => {
  it("gives each plan its configured window", () => {
    expect(retentionDaysFor("FREE")).toBe(RETENTION.freeDays)
    expect(retentionDaysFor("PRO")).toBe(RETENTION.proDays)
  })

  it("gives PRO the longer window", () => {
    expect(retentionDaysFor("PRO")).toBeGreaterThan(retentionDaysFor("FREE"))
  })
})

describe("retentionCutoff", () => {
  it("is the window measured back from now", () => {
    expect(retentionCutoff("FREE", NOW).toISOString()).toBe(
      daysBefore(RETENTION.freeDays).toISOString()
    )
  })
})

describe("isWithinRetention", () => {
  it("keeps an event inside the window visible", () => {
    expect(isWithinRetention(daysBefore(29), "FREE", NOW)).toBe(true)
  })

  it("hides an event past the window", () => {
    expect(isWithinRetention(daysBefore(31), "FREE", NOW)).toBe(false)
  })

  it("keeps an event exactly on the boundary", () => {
    expect(isWithinRetention(daysBefore(RETENTION.freeDays), "FREE", NOW)).toBe(
      true
    )
  })

  it("still shows a PRO user an event a Free user would have lost", () => {
    const old = daysBefore(90)

    expect(isWithinRetention(old, "FREE", NOW)).toBe(false)
    expect(isWithinRetention(old, "PRO", NOW)).toBe(true)
  })
})

describe("cleanupCutoff", () => {
  it("lags the visibility window by the grace period", () => {
    expect(cleanupCutoff("FREE", NOW).toISOString()).toBe(
      daysBefore(RETENTION.freeDays + RETENTION.graceDays).toISOString()
    )
  })

  it("is always older than the visibility cutoff, so nothing is deleted while still shown", () => {
    for (const plan of ["FREE", "PRO"] as const) {
      expect(cleanupCutoff(plan, NOW).getTime()).toBeLessThan(
        retentionCutoff(plan, NOW).getTime()
      )
    }
  })

  it("leaves an event that just fell out of view intact", () => {
    const justHidden = daysBefore(RETENTION.freeDays + 1)

    expect(isWithinRetention(justHidden, "FREE", NOW)).toBe(false)
    expect(justHidden.getTime()).toBeGreaterThan(
      cleanupCutoff("FREE", NOW).getTime()
    )
  })
})

describe("retentionLabel", () => {
  it("reads as user-facing copy", () => {
    expect(retentionLabel("FREE")).toBe("30-day event history")
    expect(retentionLabel("PRO")).toBe("1-year event history")
  })
})
