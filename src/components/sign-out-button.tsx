"use client"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export const SignOutButton = ({
  className,
  size = "sm",
  variant = "outline",
}: {
  className?: string
  size?: "sm" | "lg" | "default" | "icon"
  variant?: "outline" | "ghost" | "default" | "destructive" | "link" | "secondary"
}) => {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const handleSignOut = async () => {
    setIsPending(true)

    const { error } = await authClient.signOut()

    if (error) {
      toast.error(error.message ?? "Could not sign out.")
      setIsPending(false)
      return
    }

    // refresh() re-runs the server components that read the session, so the
    // navbar and any protected page reflect the signed-out state immediately.
    router.push("/")
    router.refresh()
  }

  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      onClick={handleSignOut}
      disabled={isPending}
    >
      {isPending ? "Signing out..." : "Sign Out"}
    </Button>
  )
}
