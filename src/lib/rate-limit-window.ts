export const RATE_LIMIT_WINDOW_MS = 60_000

export const windowStartMs = (
  now: Date = new Date(),
  windowMs: number = RATE_LIMIT_WINDOW_MS
): number => Math.floor(now.getTime() / windowMs) * windowMs

export const windowResetsAtMs = (
  windowStart: number,
  windowMs: number = RATE_LIMIT_WINDOW_MS
): number => windowStart + windowMs

export const isOverLimit = (count: number, limit: number): boolean =>
  count > limit

export const retryAfterSeconds = (
  windowStart: number,
  now: Date = new Date(),
  windowMs: number = RATE_LIMIT_WINDOW_MS
): number =>
  Math.max(
    1,
    Math.ceil((windowResetsAtMs(windowStart, windowMs) - now.getTime()) / 1000)
  )
