import { createId } from "@paralleldrive/cuid2"

export const generateApiKey = (): string => createId()
