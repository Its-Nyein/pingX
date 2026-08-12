import { describe, expect, it } from "vitest"
import {
  crossedWarnThreshold,
  currentPeriod,
  isStale,
  limitFor,
  nextReset,
  WARN_THRESHOLD,
} from "@/lib/quota-period"
import { FREE_QUOTA, PRO_QUOTA } from "@/config"

describe("currentPeriod", () => {
  it("uses UTC, not local time", () => {
    expect(currentPeriod(new Date("2026-01-31T23:30:00.000Z"))).toEqual({
      year: 2026,
      month: 1,
    })
  })

  it("returns a 1-based month", () => {
    expect(currentPeriod(new Date("2026-08-11T00:00:00.000Z")).month).toBe(8)
    expect(currentPeriod(new Date("2026-12-01T00:00:00.000Z")).month).toBe(12)
  })
})

describe("isStale - the bug this PR fixes", () => {
  const period = { year: 2026, month: 8 }

  it("is false within the same period, so the count keeps incrementing", () => {
    expect(isStale({ year: 2026, month: 8 }, period)).toBe(false)
  })

  it("is true in a new month, triggering a reset", () => {
    expect(isStale({ year: 2026, month: 7 }, period)).toBe(true)
  })

  it("is true across a year boundary (Dec 2025 -> Jan 2026)", () => {
    expect(isStale({ year: 2025, month: 12 }, { year: 2026, month: 1 })).toBe(
      true
    )
  })

  it("is true for the same month number in a different year", () => {
    expect(isStale({ year: 2025, month: 8 }, period)).toBe(true)
  })

  it("is true when the stored period is in the future", () => {
    expect(isStale({ year: 2027, month: 1 }, period)).toBe(true)
  })
})

describe("nextReset", () => {
  it("is midnight UTC on the first of the following month", () => {
    expect(nextReset({ year: 2026, month: 8 }).toISOString()).toBe(
      "2026-09-01T00:00:00.000Z"
    )
  })

  it("rolls into the next year from December", () => {
    expect(nextReset({ year: 2026, month: 12 }).toISOString()).toBe(
      "2027-01-01T00:00:00.000Z"
    )
  })

  it("is strictly after any instant within its own period", () => {
    const period = { year: 2026, month: 2 }
    const lastInstant = new Date("2026-02-28T23:59:59.999Z")
    expect(nextReset(period).getTime()).toBeGreaterThan(lastInstant.getTime())
  })
})

describe("limitFor", () => {
  it("maps FREE to the free monthly limit", () => {
    expect(limitFor("FREE")).toBe(FREE_QUOTA.maxEventsPerMonth)
  })

  it("maps PRO to the pro monthly limit", () => {
    expect(limitFor("PRO")).toBe(PRO_QUOTA.maxEventsPerMonth)
  })

  it("gives PRO a strictly higher limit than FREE", () => {
    expect(limitFor("PRO")).toBeGreaterThan(limitFor("FREE"))
  })
})

describe("crossedWarnThreshold", () => {
  const limit = 100
  const at80 = Math.ceil(limit * WARN_THRESHOLD)

  it("is false below the threshold", () => {
    expect(crossedWarnThreshold(at80 - 1, limit, false)).toBe(false)
  })

  it("is true exactly at the threshold", () => {
    expect(crossedWarnThreshold(at80, limit, false)).toBe(true)
  })

  it("is true above the threshold", () => {
    expect(crossedWarnThreshold(limit, limit, false)).toBe(true)
  })

  it("is false once already warned, so the notice fires only once per period", () => {
    expect(crossedWarnThreshold(at80 + 5, limit, true)).toBe(false)
  })

  it("rounds up, so small limits still warn before the cap", () => {
    expect(crossedWarnThreshold(2, 3, false)).toBe(false)
    expect(crossedWarnThreshold(3, 3, false)).toBe(true)
  })

  it("is false when the limit is zero, rather than dividing by it", () => {
    expect(crossedWarnThreshold(0, 0, false)).toBe(false)
  })
})
