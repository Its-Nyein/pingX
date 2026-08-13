"use client"

import { Button } from "@/components/ui/button"
import { client } from "@/lib/client"
import { useMutation } from "@tanstack/react-query"
import { Send } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export const SendTestEventButton = ({
  categoryName,
  hasDiscordId,
  size = "default",
  onSent,
}: {
  categoryName: string
  hasDiscordId: boolean
  size?: "sm" | "default"
  onSent?: () => void
}) => {
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      await client.category.sendTestEvent.$post({ name: categoryName })
    },
    onSuccess: () => {
      toast.success("Test event delivered", {
        description: "Check your Discord DMs.",
      })
      onSent?.()
    },
    onError: (error) => {
      toast.error("Couldn't send the test event", {
        description: error.message,
      })
    },
  })

  if (!hasDiscordId) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size={size}
          disabled
          title="pingX needs your Discord ID before it can deliver anything."
        >
          <Send className="size-4" />
          Send test event
        </Button>

        <Link
          href="/dashboard/account-settings"
          className="text-sm text-link hover:underline"
        >
          Add your Discord ID
        </Link>
      </div>
    )
  }

  return (
    <Button size={size} onClick={() => mutate()} disabled={isPending}>
      <Send className="size-4" />
      {isPending ? "Sending..." : "Send test event"}
    </Button>
  )
}
