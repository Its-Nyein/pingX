import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const webhookEvents = pgTable("WebhookEvent", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  processedAt: timestamp("processedAt", { precision: 3, mode: "date" })
    .defaultNow()
    .notNull(),
})

export type WebhookEvent = typeof webhookEvents.$inferSelect
