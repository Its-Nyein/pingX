import { db, users } from "@/db"
import { j } from "./__internals/j"
import { auth } from "@/lib/auth"
import { eq } from "drizzle-orm"
import { HTTPException } from "hono/http-exception"

export const authMiddleware = j.middleware(async ({ c, next }) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })

  if (!session) {
    throw new HTTPException(401, { message: "Unauthorized" })
  }

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

export const baseProcedure = j.procedure
const publicProcedure = baseProcedure
export const privateProcedure = publicProcedure.use(authMiddleware)
