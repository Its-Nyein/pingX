import { FREE_QUOTA, PRO_QUOTA } from "@/config"
import type { Plan } from "@/db/schema/enums"

export interface QuotaPeriod {
  year: number
  month: number
}

export const currentPeriod = (now: Date = new Date()): QuotaPeriod => ({
  year: now.getUTCFullYear(),
  month: now.getUTCMonth() + 1,
})

export const nextReset = (period: QuotaPeriod): Date =>
  new Date(Date.UTC(period.year, period.month, 1))

export const isStale = (
  stored: QuotaPeriod,
  period: QuotaPeriod = currentPeriod()
): boolean => stored.year !== period.year || stored.month !== period.month

export const limitFor = (plan: Plan): number =>
  plan === "PRO" ? PRO_QUOTA.maxEventsPerMonth : FREE_QUOTA.maxEventsPerMonth

export const WARN_THRESHOLD = 0.8

export const crossedWarnThreshold = (
  used: number,
  limit: number,
  alreadyWarned: boolean
): boolean =>
  !alreadyWarned && limit > 0 && used >= Math.ceil(limit * WARN_THRESHOLD)
