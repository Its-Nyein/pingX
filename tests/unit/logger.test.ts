import { formatLog, newRequestId } from "@/lib/logger"
import { describe, expect, it } from "vitest"

describe("formatLog", () => {
  it("prefixes with the scope", () => {
    expect(formatLog("info", "events", "delivered")).toBe("[events] delivered")
  })

  it("appends fields as key=value", () => {
    expect(
      formatLog("error", "events", "delivery failed", {
        requestId: "a1b2c3d4",
        eventId: "evt_1",
      })
    ).toBe("[events] delivery failed requestId=a1b2c3d4 eventId=evt_1")
  })

  // Otherwise a missing optional field prints "key=undefined", which reads as
  // a bug in the log rather than an absent value.
  it("drops undefined and null fields", () => {
    expect(
      formatLog("info", "events", "ok", { a: 1, b: undefined, c: null })
    ).toBe("[events] ok a=1")
  })

  it("uses an Error's message rather than its JSON, which is empty", () => {
    expect(
      formatLog("error", "events", "failed", { error: new Error("boom") })
    ).toBe("[events] failed error=boom")
  })

  it("serialises objects", () => {
    expect(formatLog("info", "events", "ok", { data: { a: 1 } })).toBe(
      '[events] ok data={"a":1}'
    )
  })

  it("does not throw on a circular object", () => {
    const circular: { self?: unknown } = {}
    circular.self = circular

    expect(formatLog("info", "events", "ok", { circular })).toBe(
      "[events] ok circular=[unserialisable]"
    )
  })

  it("keeps booleans and zero, which are meaningful", () => {
    expect(formatLog("info", "events", "ok", { permanent: false, count: 0 })).toBe(
      "[events] ok permanent=false count=0"
    )
  })
})

describe("newRequestId", () => {
  it("is short and unique enough to correlate one request", () => {
    const a = newRequestId()
    const b = newRequestId()

    expect(a).toHaveLength(8)
    expect(a).not.toBe(b)
  })
})
