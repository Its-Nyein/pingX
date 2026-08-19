"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DELETE_CONFIRMATION } from "@/config"
import { authClient } from "@/lib/auth-client"
import { client } from "@/lib/client"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export const DeleteAccount = () => {
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState("")

  const matches =
    confirmation.trim().toLowerCase() === DELETE_CONFIRMATION.toLowerCase()

  const { mutate: deleteAccount, isPending } = useMutation({
    mutationFn: async () => {
      await client.project.deleteAccount.$post({ confirmation })
    },
    onSuccess: async () => {
      toast.success("Account deleted")

      await authClient.signOut().catch(() => undefined)

      router.push("/")
      router.refresh()
    },
    onError: (error) =>
      toast.error("Couldn't delete the account", {
        description: error.message,
      }),
  })

  return (
    <div className="rounded-md border border-destructive/40 p-4">
      <p className="text-sm font-medium text-foreground">Delete account</p>
      <p className="mt-1 text-sm text-muted-foreground">
        This action cannot be undone. This will permanently delete the item from
        your account.
      </p>

      <Button
        variant="destructive"
        size="sm"
        className="mt-3"
        onClick={() => {
          setConfirmation("")
          setOpen(true)
        }}
      >
        Delete account
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (isPending) return
          setOpen(next)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              item from your account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 pb-4">
            <Label htmlFor="delete-confirmation" className="flex items-center gap-2">
              Type{" "}
              <span className="font-semibold text-foreground">
                "{DELETE_CONFIRMATION}"
              </span>{" "}
              in the box below to continue.
            </Label>
            <Input
              id="delete-confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoComplete="off"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={() => deleteAccount()}
              disabled={!matches || isPending}
            >
              {isPending ? "Deleting..." : "Delete account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
