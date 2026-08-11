import { pgEnum } from "drizzle-orm/pg-core"

/** Billing tier. Mirrored in `user.additionalFields.plan` in src/lib/auth.ts. */
export const planEnum = pgEnum("Plan", ["FREE", "PRO"])

/** Delivery outcome for a single event. */
export const statusEnum = pgEnum("Status", ["PENDING", "DELIVERED", "FAILED"])

export type Plan = (typeof planEnum.enumValues)[number]

export type Status = (typeof statusEnum.enumValues)[number]
