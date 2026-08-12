import { FREE_QUOTA, PRO_QUOTA } from "@/config"
import { categoryLimitFor, slotsRemaining } from "@/lib/quota-period"
import { describe, expect, it } from "vitest"

describe("categoryLimitFor", () => {
  it("gives each plan its configured category limit", () => {
    expect(categoryLimitFor("FREE")).toBe(FREE_QUOTA.maxEventCategories)
    expect(categoryLimitFor("PRO")).toBe(PRO_QUOTA.maxEventCategories)
  })

  it("gives PRO more room than FREE", () => {
    expect(categoryLimitFor("PRO")).toBeGreaterThan(categoryLimitFor("FREE"))
  })
})

describe("slotsRemaining", () => {
  it("counts the headroom left under the limit", () => {
    expect(slotsRemaining(0, 3)).toBe(3)
    expect(slotsRemaining(2, 3)).toBe(1)
  })

  it("is zero exactly at the limit", () => {
    expect(slotsRemaining(3, 3)).toBe(0)
  })

  it("does not go negative when already over the limit", () => {
    expect(slotsRemaining(5, 3)).toBe(0)
  })

  it("is zero for a limit of zero", () => {
    expect(slotsRemaining(0, 0)).toBe(0)
  })
})

describe("quickstart headroom", () => {
  const quickstart = (existing: string[], plan: "FREE" | "PRO") =>
    ["sale", "marketing", "support"]
      .filter((name) => !existing.includes(name))
      .slice(0, slotsRemaining(existing.length, categoryLimitFor(plan)))

  it("adds all three for a new FREE user", () => {
    expect(quickstart([], "FREE")).toEqual(["sale", "marketing", "support"])
  })

  it("adds only what fits when the user is near the limit", () => {
    expect(quickstart(["orders", "signups"], "FREE")).toEqual(["sale"])
  })

  it("adds nothing at the limit", () => {
    expect(quickstart(["a", "b", "c"], "FREE")).toEqual([])
  })

  it("skips categories the user already has, so a second click is a no-op", () => {
    expect(quickstart(["sale", "marketing", "support"], "FREE")).toEqual([])
  })

  it("does not re-add an existing name using freed headroom", () => {
    expect(quickstart(["sale"], "FREE")).toEqual(["marketing", "support"])
  })
})
