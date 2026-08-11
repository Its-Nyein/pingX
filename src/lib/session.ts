import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

/**
 * Server-side session helpers.
 *
 * Because pingX's application columns live on Better Auth's `user` table, the
 * session user already carries plan, apiKey, quotoaLimit and discordId - there
 * is no second lookup to map an external id onto a local row, which is what the
 * Clerk integration needed.
 */
export const getSession = async () =>
  auth.api.getSession({ headers: await headers() })

export const getCurrentUser = async () => (await getSession())?.user ?? null

/**
 * For pages that cannot render without a user. Redirects instead of returning
 * null, so callers get a non-nullable user.
 */
export const requireUser = async (redirectTo = "/sign-in") => {
  const user = await getCurrentUser()
  if (!user) redirect(redirectTo)
  return user
}
