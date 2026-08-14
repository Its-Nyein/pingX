import { db, alertHistory, alertRules, eventCategories } from "@/db"
import { ALERT_LIMITS, describeRule } from "@/lib/alert-rule"
import { countRules } from "@/lib/alerts"
import { EVENT_CATEGORY_VALIDATOR } from "@/lib/validators/validator"
import { and, desc, eq } from "drizzle-orm"
import { HTTPException } from "hono/http-exception"
import { z } from "zod"
import { router } from "../__internals/router"
import { privateProcedure } from "../procedures"

const RULE_INPUT = z.object({
  categoryName: EVENT_CATEGORY_VALIDATOR.optional(),
  metric: z.enum(["FAILED_EVENTS", "ALL_EVENTS"]),
  threshold: z
    .number()
    .int()
    .min(ALERT_LIMITS.minThreshold)
    .max(ALERT_LIMITS.maxThreshold),
  windowMinutes: z
    .number()
    .int()
    .min(ALERT_LIMITS.minWindowMinutes)
    .max(ALERT_LIMITS.maxWindowMinutes),
})

export const alertRouter = router({
  listRules: privateProcedure.query(async ({ c, ctx }) => {
    const rules = await db
      .select({
        id: alertRules.id,
        metric: alertRules.metric,
        threshold: alertRules.threshold,
        windowMinutes: alertRules.windowMinutes,
        enabled: alertRules.enabled,
        lastTriggeredAt: alertRules.lastTriggeredAt,
        categoryName: eventCategories.name,
      })
      .from(alertRules)
      .leftJoin(
        eventCategories,
        eq(alertRules.eventCategoryId, eventCategories.id)
      )
      .where(eq(alertRules.userId, ctx.user.id))
      .orderBy(desc(alertRules.createdAt))

    return c.superjson({
      rules: rules.map((rule) => ({
        ...rule,
        description: describeRule(
          rule.metric,
          rule.threshold,
          rule.windowMinutes,
          rule.categoryName
        ),
      })),
      limit: ALERT_LIMITS.maxRulesPerUser,
    })
  }),

  createRule: privateProcedure
    .input(RULE_INPUT)
    .mutation(async ({ c, ctx, input }) => {
      const used = await countRules(ctx.user.id)

      if (used >= ALERT_LIMITS.maxRulesPerUser) {
        throw new HTTPException(403, {
          message: `You can have ${ALERT_LIMITS.maxRulesPerUser} alert rules. Delete one first.`,
        })
      }

      let eventCategoryId: string | null = null

      if (input.categoryName) {
        const [category] = await db
          .select({ id: eventCategories.id })
          .from(eventCategories)
          .where(
            and(
              eq(eventCategories.name, input.categoryName),
              eq(eventCategories.userId, ctx.user.id)
            )
          )
          .limit(1)

        if (!category) {
          throw new HTTPException(404, {
            message: `You do not have a category named "${input.categoryName}".`,
          })
        }

        eventCategoryId = category.id
      }

      const [rule] = await db
        .insert(alertRules)
        .values({
          userId: ctx.user.id,
          eventCategoryId,
          metric: input.metric,
          threshold: input.threshold,
          windowMinutes: input.windowMinutes,
        })
        .returning({ id: alertRules.id })

      return c.json({ id: rule.id })
    }),

  toggleRule: privateProcedure
    .input(z.object({ id: z.string().min(1), enabled: z.boolean() }))
    .mutation(async ({ c, ctx, input }) => {
      const updated = await db
        .update(alertRules)
        .set({ enabled: input.enabled })
        .where(
          and(eq(alertRules.id, input.id), eq(alertRules.userId, ctx.user.id))
        )
        .returning({ id: alertRules.id })

      if (updated.length === 0) {
        throw new HTTPException(404, { message: "Alert rule not found" })
      }

      return c.json({ success: true })
    }),

  deleteRule: privateProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ c, ctx, input }) => {
      const deleted = await db
        .delete(alertRules)
        .where(
          and(eq(alertRules.id, input.id), eq(alertRules.userId, ctx.user.id))
        )
        .returning({ id: alertRules.id })

      if (deleted.length === 0) {
        throw new HTTPException(404, { message: "Alert rule not found" })
      }

      return c.json({ success: true })
    }),

  recentTriggers: privateProcedure.query(async ({ c, ctx }) => {
    const rows = await db
      .select({
        id: alertHistory.id,
        observed: alertHistory.observed,
        triggeredAt: alertHistory.triggeredAt,
        metric: alertRules.metric,
        threshold: alertRules.threshold,
        windowMinutes: alertRules.windowMinutes,
        categoryName: eventCategories.name,
      })
      .from(alertHistory)
      .innerJoin(alertRules, eq(alertHistory.alertRuleId, alertRules.id))
      .leftJoin(
        eventCategories,
        eq(alertRules.eventCategoryId, eventCategories.id)
      )
      .where(eq(alertRules.userId, ctx.user.id))
      .orderBy(desc(alertHistory.triggeredAt))
      .limit(20)

    return c.superjson({ triggers: rows })
  }),
})
