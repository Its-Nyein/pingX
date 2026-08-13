export type LogLevel = "info" | "warn" | "error"

export interface LogFields {
  [key: string]: unknown
}

const SINKS: Record<LogLevel, (message: string) => void> = {
  info: console.info,
  warn: console.warn,
  error: console.error,
}

export const formatLog = (
  level: LogLevel,
  scope: string,
  message: string,
  fields: LogFields = {}
): string => {
  const parts = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) =>
      typeof value === "string" || typeof value === "number" || typeof value === "boolean"
        ? `${key}=${value}`
        : `${key}=${safeStringify(value)}`
    )

  return [`[${scope}]`, message, ...parts].join(" ")
}

const safeStringify = (value: unknown): string => {
  if (value instanceof Error) return value.message

  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return "[unserialisable]"
  }
}

export const createLogger = (scope: string, base: LogFields = {}) => {
  const log = (level: LogLevel) => (message: string, fields: LogFields = {}) =>
    SINKS[level](formatLog(level, scope, message, { ...base, ...fields }))

  return {
    info: log("info"),
    warn: log("warn"),
    error: log("error"),
    with: (extra: LogFields) => createLogger(scope, { ...base, ...extra }),
  }
}

export const newRequestId = (): string =>
  globalThis.crypto?.randomUUID?.().slice(0, 8) ??
  Math.random().toString(36).slice(2, 10)
