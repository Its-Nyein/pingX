import { createId } from "@paralleldrive/cuid2"
import { foreignKey, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { users } from "./users"

/**
 * Mirrors the "Quota" table.
 *
 * NOTE ON A KNOWN SCHEMA DRIFT
 * ----------------------------
 * prisma/schema.prisma declares `userId String @unique`, but no migration ever
 * created that index: 20250209165354_init omits it and 20250314102710_ only
 * touches "EventCategory". This file therefore declares the table as the
 * database actually is - with no unique constraint on "userId" - because
 * schema-to-database parity is the invariant here, not schema-to-Prisma parity.
 *
 * The upsert in src/app/api/v1/events/route.ts needs that constraint to exist
 * (Postgres raises 42P10 for ON CONFLICT against a non-unique column). The
 * additive migration that creates it lives in
 * drizzle/manual/0001_add_quota_userid_unique.sql and has NOT been applied.
 * Once it is applied, add `.unique("Quota_userId_key")` to the userId column
 * below so generate/pull stay in agreement with the database.
 */
export const quotas = pgTable(
  "Quota",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("userId").notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    count: integer("count").default(0).notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [
    foreignKey({
      name: "Quota_userId_fkey",
      columns: [table.userId],
      foreignColumns: [users.id],
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
)

export type Quota = typeof quotas.$inferSelect
export type NewQuota = typeof quotas.$inferInsert
