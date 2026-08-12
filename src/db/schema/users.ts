import { createId } from "@paralleldrive/cuid2"
import { generateApiKey } from "@/lib/api-key"
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { planEnum } from "./enums"

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  image: text("image"),

  plan: planEnum("plan").default("FREE").notNull(),
  apiKey: text("apiKey")
    .notNull()
    .unique()
    .$defaultFn(() => generateApiKey()),
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
