import { createId } from "@paralleldrive/cuid2"
import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core"

import { users } from "./users"

/**
 * A named bucket that events are grouped under, scoped to a user.
 * Category names are unique per user, not globally.
 */
export const eventCategories = pgTable(
  "EventCategory",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("EventCategory_name_userId_key").on(table.name, table.userId),
  ]
)

export type EventCategory = typeof eventCategories.$inferSelect
export type NewEventCategory = typeof eventCategories.$inferInsert
