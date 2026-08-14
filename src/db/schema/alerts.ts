import { createId } from "@paralleldrive/cuid2"
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

import { alertMetricEnum } from "./enums"
import { eventCategories } from "./event-categories"
import { users } from "./users"

export const alertRules = pgTable(
  "AlertRule",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventCategoryId: text("eventCategoryId").references(
      () => eventCategories.id,
      { onDelete: "cascade" }
    ),
    metric: alertMetricEnum("metric").notNull(),
    threshold: integer("threshold").notNull(),
    windowMinutes: integer("windowMinutes").notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    lastTriggeredAt: timestamp("lastTriggeredAt", {
      precision: 3,
      mode: "date",
    }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [index("AlertRule_userId_idx").on(table.userId)]
)

export const alertHistory = pgTable(
  "AlertHistory",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    alertRuleId: text("alertRuleId")
      .notNull()
      .references(() => alertRules.id, { onDelete: "cascade" }),
    observed: integer("observed").notNull(),
    triggeredAt: timestamp("triggeredAt", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("AlertHistory_rule_triggeredAt_idx").on(
      table.alertRuleId,
      table.triggeredAt.desc()
    ),
  ]
)

export type AlertRule = typeof alertRules.$inferSelect
export type AlertHistoryEntry = typeof alertHistory.$inferSelect
