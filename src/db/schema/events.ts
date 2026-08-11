import { createId } from "@paralleldrive/cuid2"
import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { statusEnum } from "./enums"
import { eventCategories } from "./event-categories"
import { users } from "./users"

/**
 * A single delivered (or attempted) notification.
 *
 * `eventCategoryId` is nullable and set null on delete, so deleting a category
 * keeps its history rather than destroying it.
 */
export const events = pgTable(
  "Event",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    data: jsonb("data").notNull(),
    formattedMessage: text("formattedMessage").notNull(),
    deliveryStatus: statusEnum("deliveryStatus").default("PENDING").notNull(),
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
  (table) => [index("Event_createdAt_idx").on(table.createdAt)]
)

export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
