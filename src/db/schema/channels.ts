import { createId } from "@paralleldrive/cuid2"
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { channelTypeEnum } from "./enums"
import { users } from "./users"

export const channels = pgTable(
  "Channel",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: channelTypeEnum("type").notNull(),
    name: text("name").notNull(),
    target: text("target").notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("Channel_userId_idx").on(table.userId)]
)

export type Channel = typeof channels.$inferSelect
