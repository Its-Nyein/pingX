"use client"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export const useSignOut = () => {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const signOut = async () => {
    setIsPending(true)

    const { error } = await authClient.signOut()

    if (error) {
      toast.error(error.message ?? "Could not sign out.")
      setIsPending(false)
      return
    }

    toast.success("Signed out.")

    router.push("/")
    router.refresh()
  }

  return { signOut, isPending }
}

export const SignOutButton = ({
  className,
  size = "sm",
  variant = "outline",
}: {
  className?: string
  size?: "sm" | "lg" | "default" | "icon"
  variant?: "outline" | "ghost" | "default" | "destructive" | "link" | "secondary"
}) => {
  const { signOut, isPending } = useSignOut()

  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      onClick={signOut}
      disabled={isPending}
    >
      {isPending ? "Signing out..." : "Sign Out"}
    </Button>
  )
}
