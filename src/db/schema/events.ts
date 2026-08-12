import { createId } from "@paralleldrive/cuid2"
import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { statusEnum } from "./enums"
import { eventCategories } from "./event-categories"
import { users } from "./users"

export const events = pgTable(
  "Event",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    data: jsonb("data").notNull(),
    deliveryStatus: statusEnum("deliveryStatus").default("PENDING").notNull(),
    deliveredAt: timestamp("deliveredAt", { precision: 3, mode: "date" }),
    lastError: text("lastError"),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventCategoryId: text("eventCategoryId").references(
      () => eventCategories.id,
      { onDelete: "set null" }
    ),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("Event_createdAt_idx").on(table.createdAt),
    index("Event_eventCategoryId_createdAt_idx").on(
      table.eventCategoryId,
      table.createdAt.desc()
    ),
    index("Event_userId_idx").on(table.userId),
  ]
)

export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
