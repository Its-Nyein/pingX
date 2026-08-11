import { createAuthClient } from "better-auth/react"

/**
 * Browser-side auth client. In the browser the origin is authoritative; on the
 * server (during prerender) fall back to the configured base URL.
 */
export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL,
})

export const { signIn, signUp, signOut, useSession } = authClient
