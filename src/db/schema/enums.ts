import { pgEnum } from "drizzle-orm/pg-core"

/**
 * Postgres enum types created by the original Prisma migration.
 * Names and member order must match the live database exactly.
 */
export const planEnum = pgEnum("Plan", ["FREE", "PRO"])

export const statusEnum = pgEnum("Status", ["PENDING", "DELIVERED", "FAILED"])
