import { createId } from "@paralleldrive/cuid2"
import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core"

import { channels } from "./channels"
import { users } from "./users"

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
    channelId: text("channelId").references(() => channels.id, {
      onDelete: "set null",
    }),
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
