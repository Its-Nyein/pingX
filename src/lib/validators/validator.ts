import { z } from "zod";

export const EVENT_CATEGORY_VALIDATOR = z
    .string()
    .min(1, "Category name is required")
    .regex(/^[a-zA-Z0-9-]+$/, "Category name can only contain letters, numbers, and hyphens")

export const DISCORD_ID_VALIDATOR = z
    .string()
    .regex(
        /^(?:\d{17,20})?$/,
        "Discord ID must be 17-20 digits."
    )
