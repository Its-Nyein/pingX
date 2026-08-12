export const messageFromErrorBody = (
  body: string,
  fallback: string
): string => {
  try {
    const parsed = JSON.parse(body) as { message?: unknown }

    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message
    }
  } catch {
  }

  return fallback
}
