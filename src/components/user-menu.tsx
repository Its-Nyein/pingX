"use client"

import { SignOutButton, useSignOut } from "@/components/sign-out-button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { Gem, Key, LogOut, Settings } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

const MENU_LINKS = [
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  { href: "/dashboard/api-key", icon: Key, label: "Tokens" },
  { href: "/dashboard/upgrade", icon: Gem, label: "Billing" },
]

export const UserMenu = ({ compact = false }: { compact?: boolean }) => {
  const { data: session, isPending } = authClient.useSession()
  const { signOut, isPending: isSigningOut } = useSignOut()
  const [open, setOpen] = useState(false)
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  if (isPending) {
    return (
      <div className="flex items-center gap-3">
        <div className="size-7 shrink-0 animate-pulse rounded-full bg-recessed" />
        {!compact ? (
          <div className="h-4 w-24 animate-pulse rounded bg-recessed" />
        ) : null}
      </div>
    )
  }

  if (!session) return null

  const { name, email, image } = session.user
  const initial = (name || email || "?").charAt(0).toUpperCase()

  const avatar = image ? (
    <img src={image} alt="" className="size-7 shrink-0 rounded-full object-cover" />
  ) : (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-recessed text-xs font-semibold text-muted-foreground">
      {initial}
    </span>
  )

  if (!compact) {
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {avatar}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {name}
            </p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>

        <SignOutButton size="sm" variant="ghost" className="shrink-0" />
      </div>
    )
  }

  return (
    <>
      <div className="relative" ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${email}`}
        className="flex items-center rounded-full transition-opacity hover:opacity-80 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {avatar}
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-sm"
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-sm font-medium text-foreground">
              {name}
            </p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>

          <div className="p-1">
            {MENU_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-recessed focus-visible:bg-recessed focus-visible:outline-hidden"
              >
                <item.icon className="size-4 shrink-0 text-muted-foreground" />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-border p-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                setConfirmingSignOut(true)
              }}
              disabled={isSigningOut}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10 focus-visible:bg-destructive/10 focus-visible:outline-hidden",
                isSigningOut && "opacity-50"
              )}
            >
              <LogOut className="size-4 shrink-0" />
              {isSigningOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </div>
      ) : null}
      </div>

      <ConfirmDialog
        open={confirmingSignOut}
        onOpenChange={setConfirmingSignOut}
        title="Sign out"
        description="Are you sure you want to sign out? You will need to sign in again to access your account."
        confirmLabel="Sign out"
        destructive
        pending={isSigningOut}
        onConfirm={signOut}
      />
    </>
  )
}
