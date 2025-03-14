import { z } from "zod";

export const EVENT_CATEGORY_VALIDATOR = z
    .string()
    .min(1, "Category name is required")
    .regex(/^[a-zA-Z0-9-]+$/, "Category name can only contain letters, numbers, and hyphens")