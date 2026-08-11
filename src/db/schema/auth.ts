import { createId } from "@paralleldrive/cuid2"
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { users } from "./users"

/**
 * Better Auth's session, account and verification tables.
 *
 * These are owned by Better Auth - it reads and writes them directly through
 * the Drizzle adapter. Do not add application columns here; put those on
 * `users` and declare them in `user.additionalFields` instead.
 *
 * Column names match Better Auth's field names exactly. The adapter addresses
 * columns by those names, so renaming one silently breaks auth at runtime
 * rather than at compile time.
 *
 * All three cascade on user delete: removing a user must not strand their
 * sessions or linked provider accounts.
 */
export const sessions = pgTable("session", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expiresAt", { precision: 3, mode: "date" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
})

export const accounts = pgTable("account", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt", {
    precision: 3,
    mode: "date",
  }),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", {
    precision: 3,
    mode: "date",
  }),
  scope: text("scope"),
  idToken: text("idToken"),
  // Only set for email/password accounts; OAuth accounts leave this null.
  password: text("password"),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
})

export const verifications = pgTable("verification", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt", { precision: 3, mode: "date" }).notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
})

export type Session = typeof sessions.$inferSelect
export type Account = typeof accounts.$inferSelect
export type Verification = typeof verifications.$inferSelect
