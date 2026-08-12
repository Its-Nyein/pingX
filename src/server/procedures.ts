import { db, users } from "@/db"
import { j } from "./__internals/j"
import { auth } from "@/lib/auth"
import { eq } from "drizzle-orm"
import { HTTPException } from "hono/http-exception"

const authMiddleware = j.middleware(async ({ c, next }) => {
  const authHeader = c.req.header("Authorization")

  if (authHeader) {
    const apiKey = authHeader.split(" ")[1] // bearer <API_KEY>

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.apiKey, apiKey))
      .limit(1)

    if (user) return next({ user })
  }

  // Falls back to the browser session. Better Auth reads its cookie off the
  // request headers, which Hono exposes directly - there is no need to go
  // through next/headers here.
  const session = await auth.api.getSession({ headers: c.req.raw.headers })

  if (!session) {
    throw new HTTPException(401, { message: "Unauthorized" })
  }

  // The session user is Better Auth's shape. Downstream procedures expect the
  // full database row, so it is loaded by id rather than passed through.
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!user) {
    throw new HTTPException(401, { message: "Unauthorized" })
  }

  return next({ user })
})

/**
 * Public (unauthenticated) procedures
 *
 * This is the base piece you use to build new queries and mutations on your API.
 */
export const baseProcedure = j.procedure
export const publicProcedure = baseProcedure
export const privateProcedure = publicProcedure.use(authMiddleware)
