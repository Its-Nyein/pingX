"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { client } from "@/lib/client"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export const ProfileForm = ({
  name: initialName,
  email,
}: {
  name: string
  email: string
}) => {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [saved, setSaved] = useState(initialName)

  const value = name.trim()
  const tooShort = value.length > 0 && value.length < 2
  const canSave = value.length >= 2 && value !== saved

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      await client.project.updateProfile.$post({ name: value })
    },
    onSuccess: () => {
      setSaved(value)
      router.refresh()
      toast.success("Profile updated")
    },
    onError: (error) =>
      toast.error("Couldn't save your profile", { description: error.message }),
  })

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={tooShort}
          aria-describedby={tooShort ? "displayName-error" : undefined}
          className="mt-1"
        />
        {tooShort ? (
          <p id="displayName-error" className="mt-2 text-sm text-destructive">
            Use at least 2 characters.
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Shown in the sidebar and on your account menu.
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} readOnly disabled className="mt-1" />
        <p className="mt-2 text-sm text-muted-foreground">
          Your sign-in address. Changing it is not supported yet.
        </p>
      </div>

      <Button onClick={() => mutate()} disabled={!canSave || isPending}>
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </div>
  )
}
