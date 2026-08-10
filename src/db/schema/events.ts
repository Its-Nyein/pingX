import { createId } from "@paralleldrive/cuid2"
import {
  foreignKey,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

import { statusEnum } from "./enums"
import { eventCategories } from "./event-categories"
import { users } from "./users"

/**
 * Mirrors the "Event" table.
 *
 * `eventCategoryId` is nullable and its foreign key is ON DELETE SET NULL,
 * which is what lets a category be deleted while its events are retained.
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
    userId: text("userId").notNull(),
    eventCategoryId: text("eventCategoryId"),
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
    foreignKey({
      name: "Event_userId_fkey",
      columns: [table.userId],
      foreignColumns: [users.id],
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      name: "Event_eventCategoryId_fkey",
      columns: [table.eventCategoryId],
      foreignColumns: [eventCategories.id],
    })
      .onDelete("set null")
      .onUpdate("cascade"),
  ]
)

/** Replaces the `Event` type previously imported from @prisma/client. */
export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
