import type { AlertMetric } from "@/db/schema/enums"

export const ALERT_LIMITS = {
  minThreshold: 1,
  maxThreshold: 1000,
  minWindowMinutes: 5,
  maxWindowMinutes: 1440,
  maxRulesPerUser: 10,
} as const

export interface EvaluableRule {
  threshold: number
  windowMinutes: number
  enabled: boolean
  lastTriggeredAt: Date | null
}

export const windowStart = (
  rule: Pick<EvaluableRule, "windowMinutes">,
  now: Date = new Date()
): Date => new Date(now.getTime() - rule.windowMinutes * 60_000)

export const isInCooldown = (
  rule: Pick<EvaluableRule, "windowMinutes" | "lastTriggeredAt">,
  now: Date = new Date()
): boolean => {
  if (!rule.lastTriggeredAt) return false

  return rule.lastTriggeredAt > windowStart(rule, now)
}

export const shouldTrigger = (
  rule: EvaluableRule,
  observed: number,
  now: Date = new Date()
): boolean => {
  if (!rule.enabled) return false
  if (observed < rule.threshold) return false

  return !isInCooldown(rule, now)
}

export const describeRule = (
  metric: AlertMetric,
  threshold: number,
  windowMinutes: number,
  categoryName: string | null
): string => {
  const what = metric === "FAILED_EVENTS" ? "failed events" : "events"
  const where = categoryName ? `in ${categoryName}` : "across all categories"
  const when =
    windowMinutes % 60 === 0
      ? `${windowMinutes / 60} hour${windowMinutes === 60 ? "" : "s"}`
      : `${windowMinutes} minutes`

  return `${threshold} or more ${what} ${where} within ${when}`
}
