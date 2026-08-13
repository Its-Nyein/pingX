import { decodeCursor, encodeCursor } from "@/lib/cursor"
import { describe, expect, it } from "vitest"

const CURSOR = {
  createdAt: new Date("2026-08-12T10:00:00.000Z"),
  id: "evt_abc123",
}

describe("cursor", () => {
  it("round-trips", () => {
    const decoded = decodeCursor(encodeCursor(CURSOR))

    expect(decoded?.id).toBe(CURSOR.id)
    expect(decoded?.createdAt.toISOString()).toBe(CURSOR.createdAt.toISOString())
  })

  it("preserves millisecond precision", () => {
    const precise = {
      createdAt: new Date("2026-08-12T10:00:00.482Z"),
      id: "evt_1",
    }

    expect(decodeCursor(encodeCursor(precise))?.createdAt.getTime()).toBe(
      precise.createdAt.getTime()
    )
  })

  it("is url-safe, so it survives a query string unencoded", () => {
    const encoded = encodeCursor(CURSOR)

    expect(encoded).not.toMatch(/[+/=]/)
    expect(encodeURIComponent(encoded)).toBe(encoded)
  })

  it("handles an id containing the separator", () => {
    const awkward = { createdAt: CURSOR.createdAt, id: "evt|with|pipes" }

    expect(decodeCursor(encodeCursor(awkward))?.id).toBe("evt|with|pipes")
  })

  it("rejects malformed input rather than throwing", () => {
    expect(decodeCursor("not-base64!!")).toBeNull()
    expect(decodeCursor("")).toBeNull()
    expect(decodeCursor(Buffer.from("no-separator").toString("base64url"))).toBeNull()
  })

  it("rejects an unparseable date", () => {
    const bad = Buffer.from("never|evt_1").toString("base64url")

    expect(decodeCursor(bad)).toBeNull()
  })

  it("rejects an empty id", () => {
    const bad = Buffer.from("2026-08-12T10:00:00.000Z|").toString("base64url")

    expect(decodeCursor(bad)).toBeNull()
  })
})
