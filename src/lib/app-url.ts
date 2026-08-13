const FALLBACK = "https://ping-x.netlify.app"

/**
 * Base URL for snippets shown to the user.
 *
 * NEXT_PUBLIC_APP_URL is inlined at build time, so this resolves to localhost
 * in development and to the deployed host in production. Snippets that
 * hardcode one or the other are wrong in the other place.
 */
export const appUrl = (): string =>
  (process.env.NEXT_PUBLIC_APP_URL ?? FALLBACK).replace(/\/+$/, "")
