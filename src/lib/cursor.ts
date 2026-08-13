export interface EventCursor {
  createdAt: Date
  id: string
}

const SEPARATOR = "|"

export const encodeCursor = (cursor: EventCursor): string =>
  Buffer.from(
    `${cursor.createdAt.toISOString()}${SEPARATOR}${cursor.id}`,
    "utf8"
  ).toString("base64url")

export const decodeCursor = (raw: string): EventCursor | null => {
  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8")
    const separator = decoded.indexOf(SEPARATOR)

    if (separator === -1) return null

    const createdAt = new Date(decoded.slice(0, separator))
    const id = decoded.slice(separator + 1)

    if (Number.isNaN(createdAt.getTime()) || !id) return null

    return { createdAt, id }
  } catch {
    return null
  }
}
