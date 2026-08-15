"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { client } from "@/lib/client"
import { DISCORD_ID_VALIDATOR } from "@/lib/validators/validator"
import { useMutation } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

export const DiscordForm = ({
  discordId: initialDiscordId,
}: {
  discordId: string
}) => {
  const [discordId, setDiscordId] = useState(initialDiscordId)
  const [savedDiscordId, setSavedDiscordId] = useState(initialDiscordId)

  const value = discordId.trim()
  const validation = DISCORD_ID_VALIDATOR.safeParse(value)
  const error = value && !validation.success ? validation.error.issues[0].message : null

  const { mutate, isPending } = useMutation({
    mutationFn: async (discordId: string) => {
      const res = await client.project.setDiscordId.$post({ discordId })
      return await res.json()
    },
    onSuccess: (_data, discordId) => {
      setSavedDiscordId(discordId)
      toast.success("Discord ID saved", {
        description: "Events will arrive in your Discord DMs.",
      })
    },
    onError: (error) => {
      toast.error("Couldn't save Discord ID", {
        description: error.message,
      })
    },
  })

  const unchanged = value === savedDiscordId
  const canSave = Boolean(value) && !error && !unchanged && !isPending

  return (
    <div className="space-y-4">
      <div className="pt-2">
        <Label htmlFor="discordId">Discord ID</Label>
        <Input
          id="discordId"
          className="mt-1"
          value={discordId}
          onChange={(e) => setDiscordId(e.target.value)}
          placeholder="Enter your Discord ID"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "discordId-error" : undefined}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSave) mutate(value)
          }}
        />
        {error ? (
          <p id="discordId-error" className="mt-2 text-sm/6 text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <p className="mt-2 text-sm/6 text-muted-foreground">
        Don&apos;t know how to find your Discord ID?{" "}
        <Link
          href="/dashboard/settings/discord/guide"
          className="text-link hover:text-link"
        >
          Learn how to obtain it here
        </Link>
        .
      </p>

      <div className="pt-4">
        <Button onClick={() => mutate(value)} disabled={!canSave}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
