"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { client } from "@/lib/client"
import { useMutation } from "@tanstack/react-query"
import {
  AlertTriangleIcon,
  CheckIcon,
  ClipboardIcon,
  RotateCcwIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

const ApiKeySettings = ({ apiKey: initialApiKey }: { apiKey: string }) => {
  const router = useRouter()
  const [apiKey, setApiKey] = useState(initialApiKey)
  const [copySuccess, setCopySuccess] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const copyApi = () => {
    navigator.clipboard.writeText(apiKey)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  const { mutate: rotate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await client.project.rotateApiKey.$post()
      return (await res.json()) as { apiKey: string }
    },
    onSuccess: ({ apiKey }) => {
      setApiKey(apiKey)
      setConfirmOpen(false)
      router.refresh()

      toast.success("API key regenerated", {
        description: "The previous key stopped working immediately.",
      })
    },
    onError: (error) => {
      toast.error("Couldn't regenerate the key", {
        description: error.message,
      })
    },
  })

  return (
    <Card className="max-w-xl w-full">
      <div>
        <Label>Your API Key</Label>
        <div className="mt-1 relative">
          <Input type="password" value={apiKey} readOnly />
          <div className="absolute space-x-0.5 inset-y-0 right-0 flex items-center">
            <Button
              variant="ghost"
              onClick={copyApi}
              aria-label="Copy API key"
              className="p-1 w-10 focus:outline-hidden focus:ring-2 focus:ring-ring"
            >
              {copySuccess ? (
                <CheckIcon className="size-4 text-foreground" />
              ) : (
                <ClipboardIcon className="size-4 text-foreground" />
              )}
            </Button>
          </div>
        </div>

        <p className="flex mt-2 text-sm/6 text-muted-foreground gap-2 items-center">
          <AlertTriangleIcon className="size-4 text-danger" />
          Keep your key secret safe and do not share with others.
        </p>

        <div className="mt-6 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Leaked or pasted somewhere public? Regenerate it.
          </p>

          <Button
            variant="outline"
            onClick={() => setConfirmOpen(true)}
            disabled={isPending}
          >
            <RotateCcwIcon className="size-4" />
            {isPending ? "Regenerating..." : "Regenerate"}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Regenerate API key?"
        description="The current key stops working straight away. Any integration still sending events with it will start receiving 401s until you paste in the new one."
        confirmLabel="Regenerate"
        destructive
        pending={isPending}
        onConfirm={() => rotate()}
      />
    </Card>
  )
}

export default ApiKeySettings
