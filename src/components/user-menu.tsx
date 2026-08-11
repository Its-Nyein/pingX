"use client"

import { SignOutButton } from "@/components/sign-out-button"
import { authClient } from "@/lib/auth-client"

/**
 * Sidebar account block. Replaces Clerk's <UserButton showName />.
 *
 * Better Auth has no drop-in avatar widget, so this renders the identity from
 * the session and puts sign-out next to it.
 */
export const UserMenu = () => {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <div className="flex items-center gap-3">
        <div className="size-8 shrink-0 animate-pulse rounded-full bg-gray-200" />
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
      </div>
    )
  }

  if (!session) return null

  const { name, email, image } = session.user
  const initial = (name || email || "?").charAt(0).toUpperCase()

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {image ? (
          // Plain <img>: avatar URLs come from arbitrary OAuth provider CDNs,
          // which next/image would require enumerating in remotePatterns.
          <img
            src={image}
            alt=""
            className="size-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white">
            {initial}
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-brand-900">{name}</p>
          <p className="truncate text-xs text-zinc-500">{email}</p>
        </div>
      </div>

      <SignOutButton size="sm" variant="ghost" className="shrink-0" />
    </div>
  )
}
