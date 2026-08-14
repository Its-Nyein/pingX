import { db, alertHistory, alertRules, eventCategories, events } from "@/db"
import type { AlertMetric } from "@/db/schema/enums"
import { describeRule, shouldTrigger, windowStart } from "@/lib/alert-rule"
import type { DeliveryTransport, DirectMessageTransport } from "@/lib/delivery"
import { deliver, openDirectMessage } from "@/lib/delivery"
import { and, count, eq, gte, isNull, or } from "drizzle-orm"

export { ALERT_LIMITS, describeRule } from "@/lib/alert-rule"

interface EvaluateInput {
  userId: string
  discordId: string | null
  categoryId: string
  categoryName: string
  transport: DeliveryTransport & DirectMessageTransport
  now?: Date
}

export const evaluateAlerts = async ({
  userId,
  discordId,
  categoryId,
  categoryName,
  transport,
  now = new Date(),
}: EvaluateInput): Promise<{ triggered: number }> => {
  const rules = await db
    .select()
    .from(alertRules)
    .where(
      and(
        eq(alertRules.userId, userId),
        eq(alertRules.enabled, true),
        or(
          isNull(alertRules.eventCategoryId),
          eq(alertRules.eventCategoryId, categoryId)
        )
      )
    )

  if (rules.length === 0) return { triggered: 0 }

  let triggered = 0

  for (const rule of rules) {
    const since = windowStart(rule, now)

    const scope = rule.eventCategoryId
      ? eq(events.eventCategoryId, rule.eventCategoryId)
      : eq(events.userId, userId)

    const [{ value: observed }] = await db
      .select({ value: count() })
      .from(events)
      .where(
        and(
          scope,
          gte(events.createdAt, since),
          rule.metric === "FAILED_EVENTS"
            ? eq(events.deliveryStatus, "FAILED")
            : undefined
        )
      )

    if (!shouldTrigger(rule, observed, now)) continue

    await db
      .update(alertRules)
      .set({ lastTriggeredAt: now })
      .where(eq(alertRules.id, rule.id))

    await db.insert(alertHistory).values({ alertRuleId: rule.id, observed })

    triggered += 1

    if (!discordId) continue

    const channel = await openDirectMessage(transport, discordId)
    if (!channel.opened) continue

    await deliver(transport, channel.channelId, {
      title: "pingX alert",
      description: describeRule(
        rule.metric as AlertMetric,
        rule.threshold,
        rule.windowMinutes,
        rule.eventCategoryId ? categoryName : null
      ),
      fields: [
        { name: "Observed", value: String(observed), inline: true },
        { name: "Threshold", value: String(rule.threshold), inline: true },
      ],
      timestamp: now.toISOString(),
    })
  }

  return { triggered }
}

export const countRules = async (userId: string): Promise<number> => {
  const [{ value }] = await db
    .select({ value: count() })
    .from(alertRules)
    .where(eq(alertRules.userId, userId))

  return value
}

export const categoryNameFor = async (
  categoryId: string | null
): Promise<string | null> => {
  if (!categoryId) return null

  const [row] = await db
    .select({ name: eventCategories.name })
    .from(eventCategories)
    .where(eq(eventCategories.id, categoryId))
    .limit(1)

  return row?.name ?? null
}
