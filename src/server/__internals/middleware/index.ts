
import { MiddlewareHandler } from "hono"
import { HTTPException } from "hono/http-exception"
import { parseSuperJSON } from "./utils"

export const queryParsingMiddleware: MiddlewareHandler = async (c, next) => {
  const rawQuery = c.req.query()
  const parsedQuery: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(rawQuery)) {
    parsedQuery[key] = parseSuperJSON(value)
  }

  c.set("parsedQuery", parsedQuery)
  await next()
}

export const bodyParsingMiddleware: MiddlewareHandler = async (c, next) => {
  let rawBody: unknown

  try {
    rawBody = await c.req.json()
  } catch {
    throw new HTTPException(400, { message: "Invalid JSON body" })
  }

  if (typeof rawBody !== "object" || rawBody === null || Array.isArray(rawBody)) {
    throw new HTTPException(400, { message: "Body must be a JSON object" })
  }

  const parsedBody: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(rawBody)) {
    parsedBody[key] = parseSuperJSON(value as any)
  }

  c.set("parsedBody", parsedBody)
  await next()
}