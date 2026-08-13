import {
  isOverLimit,
  RATE_LIMIT_WINDOW_MS,
  retryAfterSeconds,
  windowResetsAtMs,
  windowStartMs,
} from "@/lib/rate-limit-window"
import { describe, expect, it } from "vitest"

const at = (iso: string) => new Date(iso)

describe("windowStartMs", () => {
  it("floors to the start of the window", () => {
    expect(windowStartMs(at("2026-08-12T10:00:37.482Z"))).toBe(
      at("2026-08-12T10:00:00.000Z").getTime()
    )
  })

  it("is stable for every instant inside one window", () => {
    const a = windowStartMs(at("2026-08-12T10:00:00.000Z"))
    const b = windowStartMs(at("2026-08-12T10:00:59.999Z"))

    expect(a).toBe(b)
  })

  it("moves to the next window on the boundary", () => {
    const a = windowStartMs(at("2026-08-12T10:00:59.999Z"))
    const b = windowStartMs(at("2026-08-12T10:01:00.000Z"))

    expect(b - a).toBe(RATE_LIMIT_WINDOW_MS)
  })

  // The upsert compares stored window against current to choose between
  // incrementing and resetting. An integer has no serialization ambiguity;
  // a timestamp did, and every second request reset its own counter.
  it("is a plain integer", () => {
    expect(Number.isInteger(windowStartMs(at("2026-08-12T10:00:37.482Z")))).toBe(
      true
    )
  })
})

describe("isOverLimit", () => {
  it("allows counts up to and including the limit", () => {
    expect(isOverLimit(1, 3)).toBe(false)
    expect(isOverLimit(3, 3)).toBe(false)
  })

  it("blocks the first request past it", () => {
    expect(isOverLimit(4, 3)).toBe(true)
  })
})

describe("retryAfterSeconds", () => {
  it("counts the seconds left in the window", () => {
    const start = windowStartMs(at("2026-08-12T10:00:00.000Z"))

    expect(retryAfterSeconds(start, at("2026-08-12T10:00:15.000Z"))).toBe(45)
  })

  // Retry-After: 0 tells a client to retry immediately, which would hammer a
  // limiter that has just refused it.
  it("never returns less than one second", () => {
    const start = windowStartMs(at("2026-08-12T10:00:00.000Z"))

    expect(retryAfterSeconds(start, at("2026-08-12T10:00:59.999Z"))).toBe(1)
    expect(retryAfterSeconds(start, at("2026-08-12T10:01:30.000Z"))).toBe(1)
  })

  it("agrees with the window reset time", () => {
    const start = windowStartMs(at("2026-08-12T10:00:00.000Z"))

    expect(windowResetsAtMs(start)).toBe(start + RATE_LIMIT_WINDOW_MS)
  })
})
