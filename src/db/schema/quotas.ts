import { createId } from "@paralleldrive/cuid2"
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { users } from "./users"

/**
 * Per-user event quota.
 *
 * `userId` is unique, so a user has exactly one quota row. That is what the
 * upsert in src/app/api/v1/events/route.ts conflicts on. The original Prisma
 * schema declared this constraint but never migrated it, which left the live
 * database without it; on a fresh database it is created properly here.
 *
 * Note this means the counter is carried across months rather than one row per
 * month - `year` and `month` record when the row was last reset, they are not
 * part of the key. That is the pre-existing behaviour, preserved.
 */
export const quotas = pgTable("Quota", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("userId")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  count: integer("count").default(0).notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
})

export type Quota = typeof quotas.$inferSelect
export type NewQuota = typeof quotas.$inferInsert
