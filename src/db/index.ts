import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

import * as schema from "./schema"

/**
 * Drizzle client over Neon's HTTP driver.
 *
 * neon-http is the right fit here: it is stateless, which suits the serverless
 * request model, and this application issues no interactive transactions. If a
 * transaction is ever needed, switch to drizzle-orm/neon-serverless (WebSocket),
 * which supports them.
 *
 * The schema is passed so the relational query API (db.query.*) is available.
 */
const sql = neon(process.env.DATABASE_URL!)

export const db = drizzle({ client: sql, schema })

export * from "./schema"
