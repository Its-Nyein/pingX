import { RETENTION } from "@/config"
import type { Plan } from "@/db/schema/enums"

const DAY_MS = 86_400_000

export const retentionDaysFor = (plan: Plan): number =>
  plan === "PRO" ? RETENTION.proDays : RETENTION.freeDays

export const retentionCutoff = (plan: Plan, now: Date = new Date()): Date =>
  new Date(now.getTime() - retentionDaysFor(plan) * DAY_MS)

export const cleanupCutoff = (plan: Plan, now: Date = new Date()): Date =>
  new Date(
    now.getTime() - (retentionDaysFor(plan) + RETENTION.graceDays) * DAY_MS
  )

export const isWithinRetention = (
  createdAt: Date,
  plan: Plan,
  now: Date = new Date()
): boolean => createdAt >= retentionCutoff(plan, now)

export const retentionLabel = (plan: Plan): string =>
  plan === "PRO" ? "1-year event history" : "30-day event history"
