import { db, quotas } from "@/db"
import type { Plan } from "@/db"
import {
  currentPeriod,
  isStale,
  limitFor,
  nextReset,
  type QuotaPeriod,
} from "@/lib/quota-period"
import { eq, sql } from "drizzle-orm"

export {
  categoryLimitFor,
  crossedWarnThreshold,
  currentPeriod,
  isStale,
  limitFor,
  nextReset,
  slotsRemaining,
  WARN_THRESHOLD,
  type QuotaPeriod,
} from "@/lib/quota-period"

export interface QuotaState {
  used: number
  limit: number
  year: number
  month: number
  warned80: boolean
  resetsAt: Date
}

const stateOf = (
  period: QuotaPeriod,
  limit: number,
  used: number,
  warned80: boolean
): QuotaState => ({
  used,
  limit,
  year: period.year,
  month: period.month,
  warned80,
  resetsAt: nextReset(period),
})

export const getOrRollQuota = async (
  userId: string,
  plan: Plan,
  now: Date = new Date()
): Promise<QuotaState> => {
  const period = currentPeriod(now)
  const limit = limitFor(plan)

  const [row] = await db
    .select()
    .from(quotas)
    .where(eq(quotas.userId, userId))
    .limit(1)

  if (!row) return stateOf(period, limit, 0, false)

  if (isStale({ year: row.year, month: row.month }, period)) {
    await db
      .update(quotas)
      .set({ count: 0, warned80: false, year: period.year, month: period.month })
      .where(eq(quotas.userId, userId))

    return stateOf(period, limit, 0, false)
  }

  return stateOf(period, limit, row.count, row.warned80)
}

export const incrementQuota = async (
  userId: string,
  now: Date = new Date()
): Promise<{ used: number; warned80: boolean }> => {
  const { year, month } = currentPeriod(now)

  const [row] = await db
    .insert(quotas)
    .values({ userId, year, month, count: 1, warned80: false })
    .onConflictDoUpdate({
      target: quotas.userId,
      set: {
        count: sql`CASE
          WHEN ${quotas.year} = ${year} AND ${quotas.month} = ${month}
          THEN ${quotas.count} + 1
          ELSE 1
        END`,
        warned80: sql`CASE
          WHEN ${quotas.year} = ${year} AND ${quotas.month} = ${month}
          THEN ${quotas.warned80}
          ELSE false
        END`,
        year: sql`${year}`,
        month: sql`${month}`,
      },
    })
    .returning()

  return { used: row.count, warned80: row.warned80 }
}

export const markWarned = async (userId: string): Promise<void> => {
  await db.update(quotas).set({ warned80: true }).where(eq(quotas.userId, userId))
}
