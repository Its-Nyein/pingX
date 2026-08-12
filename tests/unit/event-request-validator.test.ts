import { describe, expect, it } from "vitest"
import { z } from "zod"
import { EVENT_CATEGORY_VALIDATOR } from "@/lib/validators/validator"

const REQUEST_VALIDATOR = z
  .object({
    category: EVENT_CATEGORY_VALIDATOR,
    data: z
      .record(z.string(), z.string().or(z.number()).or(z.boolean()))
      .optional(),
    description: z.string().optional(),
  })
  .strict()

describe("REQUEST_VALIDATOR — accepts", () => {
  it("a full payload with all optional fields", () => {
    const result = REQUEST_VALIDATOR.safeParse({
      category: "sale",
      description: "New sale came in",
      data: { plan: "PRO", amount: 52.99, isTrial: false },
    })

    expect(result.success).toBe(true)
    expect(result.data?.data).toEqual({
      plan: "PRO",
      amount: 52.99,
      isTrial: false,
    })
  })

  it("category alone, with data and description omitted", () => {
    const result = REQUEST_VALIDATOR.safeParse({ category: "sale" })

    expect(result.success).toBe(true)
    expect(result.data?.data).toBeUndefined()
    expect(result.data?.description).toBeUndefined()
  })

  it("an empty data object", () => {
    expect(
      REQUEST_VALIDATOR.safeParse({ category: "sale", data: {} }).success
    ).toBe(true)
  })
})

describe("REQUEST_VALIDATOR — rejects", () => {
  it("a missing category", () => {
    const result = REQUEST_VALIDATOR.safeParse({ description: "no category" })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(["category"])
  })

  it("an entirely empty body", () => {
    expect(REQUEST_VALIDATOR.safeParse({}).success).toBe(false)
  })

  it("a non-object body", () => {
    expect(REQUEST_VALIDATOR.safeParse("sale").success).toBe(false)
    expect(REQUEST_VALIDATOR.safeParse(null).success).toBe(false)
  })

  it("a nested object inside data — only scalars are allowed", () => {
    const result = REQUEST_VALIDATOR.safeParse({
      category: "sale",
      data: { nested: { deep: "value" } },
    })

    expect(result.success).toBe(false)
  })

  it("an array inside data", () => {
    expect(
      REQUEST_VALIDATOR.safeParse({ category: "sale", data: { xs: [1, 2] } })
        .success
    ).toBe(false)
  })

  it("a non-string description", () => {
    expect(
      REQUEST_VALIDATOR.safeParse({ category: "sale", description: 42 }).success
    ).toBe(false)
  })

  it("unknown top-level keys, because the schema is .strict()", () => {
    const result = REQUEST_VALIDATOR.safeParse({
      category: "sale",
      unexpected: "field",
    })

    expect(result.success).toBe(false)
  })
})
