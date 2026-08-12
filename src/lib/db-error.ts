const UNIQUE_VIOLATION = "23505"

export const isUniqueViolation = (error: unknown): boolean => {
  let current = error

  for (let depth = 0; current && depth < 5; depth++) {
    if (
      typeof current === "object" &&
      "code" in current &&
      (current as { code?: unknown }).code === UNIQUE_VIOLATION
    ) {
      return true
    }

    current = (current as { cause?: unknown }).cause
  }

  return false
}
