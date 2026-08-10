import { createId } from "@paralleldrive/cuid2"
import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { planEnum } from "./enums"

/**
 * Mirrors the "User" table as created by prisma/migrations/20250209165354_init.
 *
 * Every identifier is spelled out because Prisma created them quoted and
 * mixed-case; relying on Drizzle's implicit key-to-column mapping would be
 * correct here only by coincidence, and would silently drift if a key is renamed.
 *
 * `quotoaLimit` reproduces the typo in the original schema on purpose - it is
 * the real column name.
 */
export const users = pgTable(
  "User",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    externalId: text("externalId").unique("User_externalId_key"),
    quotoaLimit: integer("quotoaLimit").notNull(),
    plan: planEnum("plan").default("FREE").notNull(),
    email: text("email").notNull().unique("User_email_key"),
    apiKey: text("apiKey")
      .notNull()
      .unique("User_apiKey_key")
      .$defaultFn(() => createId()),
    discordId: text("discordId"),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull(),
    // Prisma's @updatedAt is application-managed: the column has no database
    // default, so a value is supplied on insert and refreshed on update.
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [index("User_email_apiKey_idx").on(table.email, table.apiKey)]
)

/** Replaces the `User` type previously imported from @prisma/client. */
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
