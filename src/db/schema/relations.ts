import { relations } from "drizzle-orm"

import { eventCategories } from "./event-categories"
import { events } from "./events"
import { quotas } from "./quotas"
import { users } from "./users"

/**
 * Relations are metadata for the relational query API (db.query.*). They emit
 * no SQL and are not part of the migration diff.
 */
export const usersRelations = relations(users, ({ many }) => ({
  eventCategories: many(eventCategories),
  events: many(events),
  quotas: many(quotas),
}))

export const eventCategoriesRelations = relations(
  eventCategories,
  ({ one, many }) => ({
    user: one(users, {
      fields: [eventCategories.userId],
      references: [users.id],
    }),
    events: many(events),
  })
)

export const eventsRelations = relations(events, ({ one }) => ({
  user: one(users, {
    fields: [events.userId],
    references: [users.id],
  }),
  eventCategory: one(eventCategories, {
    fields: [events.eventCategoryId],
    references: [eventCategories.id],
  }),
}))

export const quotasRelations = relations(quotas, ({ one }) => ({
  user: one(users, {
    fields: [quotas.userId],
    references: [users.id],
  }),
}))
