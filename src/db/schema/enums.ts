import { pgEnum } from "drizzle-orm/pg-core"

export const planEnum = pgEnum("Plan", ["FREE", "PRO"])

export const statusEnum = pgEnum("Status", ["PENDING", "DELIVERED", "FAILED"])

export const alertMetricEnum = pgEnum("AlertMetric", ["FAILED_EVENTS", "ALL_EVENTS"])

export const channelTypeEnum = pgEnum("ChannelType", ["DISCORD_WEBHOOK"])

export type Plan = (typeof planEnum.enumValues)[number]

export type Status = (typeof statusEnum.enumValues)[number]

export type AlertMetric = (typeof alertMetricEnum.enumValues)[number]

export type ChannelType = (typeof channelTypeEnum.enumValues)[number]
