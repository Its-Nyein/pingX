import { createId } from "@paralleldrive/cuid2"
import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { users } from "./users"

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
  warned80: boolean("warned80").default(false).notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
})

export type Quota = typeof quotas.$inferSelect
export type NewQuota = typeof quotas.$inferInsert
