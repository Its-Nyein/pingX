import { isUniqueViolation } from "@/lib/db-error"
import { describe, expect, it } from "vitest"

const drizzleWrapped = () => {
  const driverError = Object.assign(new Error("duplicate key value"), {
    code: "23505",
    constraint: "EventCategory_name_userId_key",
  })

  return Object.assign(new Error("Failed query: insert into ..."), {
    cause: driverError,
  })
}

describe("isUniqueViolation", () => {
  it("finds 23505 on the error itself", () => {
    expect(isUniqueViolation(Object.assign(new Error("x"), { code: "23505" }))).toBe(
      true
    )
  })

  it("finds 23505 through Drizzle's wrapper", () => {
    expect(isUniqueViolation(drizzleWrapped())).toBe(true)
  })

  it("finds 23505 nested several levels down", () => {
    const deep = { cause: { cause: { cause: { code: "23505" } } } }
    expect(isUniqueViolation(deep)).toBe(true)
  })

  it("rejects other Postgres error codes", () => {
    expect(isUniqueViolation({ code: "23503" })).toBe(false)
    expect(isUniqueViolation({ cause: { code: "23502" } })).toBe(false)
  })

  it("rejects errors with no code at all", () => {
    expect(isUniqueViolation(new Error("connection reset"))).toBe(false)
  })

  it("handles null, undefined and primitives without throwing", () => {
    expect(isUniqueViolation(null)).toBe(false)
    expect(isUniqueViolation(undefined)).toBe(false)
    expect(isUniqueViolation("23505")).toBe(false)
    expect(isUniqueViolation(23505)).toBe(false)
  })

  it("does not loop forever on a self-referencing cause", () => {
    const looping: { cause?: unknown } = {}
    looping.cause = looping

    expect(isUniqueViolation(looping)).toBe(false)
  })
})
