import { DISCORD_ID_VALIDATOR } from "@/lib/validators/validator"
import { describe, expect, it } from "vitest"

const accepts = (v: string) => DISCORD_ID_VALIDATOR.safeParse(v).success

describe("DISCORD_ID_VALIDATOR", () => {
  it("accepts a real snowflake", () => {
    expect(accepts("123456789012345678")).toBe(true)
  })

  it("accepts the 17 and 20 digit boundaries", () => {
    expect(accepts("1".repeat(17))).toBe(true)
    expect(accepts("1".repeat(20))).toBe(true)
  })

  it("rejects just outside those boundaries", () => {
    expect(accepts("1".repeat(16))).toBe(false)
    expect(accepts("1".repeat(21))).toBe(false)
  })

  it("accepts an empty string, which means no Discord ID", () => {
    expect(accepts("")).toBe(true)
  })

  it("rejects non-digits", () => {
    expect(accepts("not-a-snowflake")).toBe(false)
    expect(accepts("12345678901234567a")).toBe(false)
    expect(accepts("1234567890123456 8")).toBe(false)
    expect(accepts(" 123456789012345678")).toBe(false)
  })

  it("rejects a snowflake with formatting a user might paste", () => {
    expect(accepts("<@123456789012345678>")).toBe(false)
    expect(accepts("123,456,789,012,345,678")).toBe(false)
  })

  it("says what a valid ID looks like when it rejects", () => {
    const result = DISCORD_ID_VALIDATOR.safeParse("nope")
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Discord ID must be 17-20 digits."
      )
    }
  })
})
