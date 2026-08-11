import { NextResponse, type NextRequest } from "next/server"

/**
 * Route protection.
 *
 * This deliberately does NOT call Better Auth to validate the session. The
 * proxy runs on every matched request, and a full session lookup there means a
 * database round trip per navigation. Instead it checks for the presence of the
 * session cookie as a cheap gate, and the pages themselves do the authoritative
 * `auth.api.getSession` check before rendering anything user-specific.
 *
 * A forged cookie therefore gets past the proxy but not past the page, which is
 * the correct place for the real decision.
 */
const PROTECTED_PREFIXES = ["/dashboard"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  if (!isProtected) return NextResponse.next()

  // Better Auth prefixes the cookie with `__Secure-` when running over HTTPS.
  const hasSession =
    request.cookies.has("better-auth.session_token") ||
    request.cookies.has("__Secure-better-auth.session_token")

  if (!hasSession) {
    const signInUrl = new URL("/sign-in", request.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
