import { db, rateLimits } from "@/db"
import { RATE_LIMIT } from "@/config"
import {
  isOverLimit,
  retryAfterSeconds,
  windowStartMs,
} from "@/lib/rate-limit-window"
import { sql } from "drizzle-orm"

export {
  isOverLimit,
  RATE_LIMIT_WINDOW_MS,
  retryAfterSeconds,
  windowStartMs,
} from "@/lib/rate-limit-window"

export interface RateLimitResult {
  allowed: boolean
  count: number
  limit: number
  retryAfter: number
}

export const consumeRateLimit = async (
  key: string,
  limit: number = RATE_LIMIT.requestsPerMinute,
  now: Date = new Date()
): Promise<RateLimitResult> => {
  const windowStart = windowStartMs(now)

  const [row] = await db
    .insert(rateLimits)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE
          WHEN ${rateLimits.windowStart} = ${windowStart}
          THEN ${rateLimits.count} + 1
          ELSE 1
        END`,
        windowStart: sql`${windowStart}`,
      },
    })
    .returning()

  return {
    allowed: !isOverLimit(row.count, limit),
    count: row.count,
    limit,
    retryAfter: retryAfterSeconds(windowStart, now),
  }
}
