import { bigint, integer, pgTable, text } from "drizzle-orm/pg-core"

export const rateLimits = pgTable("RateLimit", {
  key: text("key").primaryKey(),
  windowStart: bigint("windowStart", { mode: "number" }).notNull(),
  count: integer("count").default(0).notNull(),
})

export type RateLimit = typeof rateLimits.$inferSelect
