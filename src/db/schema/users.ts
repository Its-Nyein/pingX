import { createId } from "@paralleldrive/cuid2"
import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { planEnum } from "./enums"

/**
 * The `user` table is Better Auth's core user model, extended with pingX's
 * application fields.
 *
 * There is deliberately only one user table. The columns above the divider are
 * the ones Better Auth requires and manages; the ones below are pingX's, and are
 * declared to Better Auth through `user.additionalFields` in src/lib/auth.ts.
 * Both halves must stay in sync with that config - Better Auth validates writes
 * against it, so a column here without a matching entry there is invisible to
 * the auth layer.
 *
 * `quotoaLimit` reproduces the original misspelling. It is load-bearing across
 * the app and renaming it is a separate change.
 */
export const users = pgTable("user", {
  // --- Better Auth core ---------------------------------------------------
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  image: text("image"),

  // --- pingX application fields -------------------------------------------
  quotoaLimit: integer("quotoaLimit").default(100).notNull(),
  plan: planEnum("plan").default("FREE").notNull(),
  apiKey: text("apiKey")
    .notNull()
    .unique()
    .$defaultFn(() => createId()),
  discordId: text("discordId"),

  createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
