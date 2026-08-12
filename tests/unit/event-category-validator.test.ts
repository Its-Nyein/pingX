import { describe, expect, it } from "vitest"
import { EVENT_CATEGORY_VALIDATOR } from "@/lib/validators/validator"

describe("EVENT_CATEGORY_VALIDATOR — accepts", () => {
  it.each([
    ["lowercase letters", "sale"],
    ["uppercase letters", "SALE"],
    ["mixed case", "NewSale"],
    ["digits", "tier2"],
    ["digits only", "2026"],
    ["internal hyphens", "new-user-signup"],
    ["a single character", "a"],
    ["leading and trailing hyphens", "-sale-"],
  ])("%s: %j", (_label, value) => {
    expect(EVENT_CATEGORY_VALIDATOR.safeParse(value).success).toBe(true)
  })
})

describe("EVENT_CATEGORY_VALIDATOR — rejects", () => {
  it("an empty string", () => {
    const result = EVENT_CATEGORY_VALIDATOR.safeParse("")

    expect(result.success).toBe(false)
    expect(result.error?.issues.map((i) => i.message)).toContain(
      "Category name is required"
    )
  })

  it.each([
    ["a space", "new sale"],
    ["an underscore", "new_sale"],
    ["a dot", "sale.completed"],
    ["a slash", "sale/eu"],
    ["an emoji", "sale🎉"],
    ["an accented character", "vente-café"],
    ["a colon", "sale:eu"],
  ])("%s: %j", (_label, value) => {
    const result = EVENT_CATEGORY_VALIDATOR.safeParse(value)

    expect(result.success).toBe(false)
    expect(result.error?.issues.map((i) => i.message)).toContain(
      "Category name can only contain letters, numbers, and hyphens"
    )
  })

  it("a non-string value", () => {
    expect(EVENT_CATEGORY_VALIDATOR.safeParse(123).success).toBe(false)
    expect(EVENT_CATEGORY_VALIDATOR.safeParse(null).success).toBe(false)
  })
})
