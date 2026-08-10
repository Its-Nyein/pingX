import { createId } from "@paralleldrive/cuid2"
import {
  foreignKey,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

import { users } from "./users"

/**
 * Mirrors the "EventCategory" table.
 *
 * The (name, userId) unique index was added by
 * prisma/migrations/20250314102710_, which also dropped the non-unique index
 * of the same columns. Foreign keys are declared through the `foreignKey`
 * builder so the constraint name and referential actions match what Prisma
 * emitted (ON DELETE RESTRICT ON UPDATE CASCADE); Drizzle's inline
 * `.references()` would name it differently and default to NO ACTION.
 */
export const eventCategories = pgTable(
  "EventCategory",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    userId: text("userId").notNull(),
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
    foreignKey({
      name: "EventCategory_userId_fkey",
      columns: [table.userId],
      foreignColumns: [users.id],
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
)

/** Replaces the `EventCategory` type previously imported from @prisma/client. */
export type EventCategory = typeof eventCategories.$inferSelect
export type NewEventCategory = typeof eventCategories.$inferInsert
