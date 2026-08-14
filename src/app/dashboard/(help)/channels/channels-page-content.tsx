"use client"

import { EmptyState } from "@/components/shell/empty-state"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { client } from "@/lib/client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Hash, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

const DIRECT_MESSAGE = "__dm__"

export const ChannelsPageContent = ({
  categories,
}: {
  categories: { name: string; channelId: string | null }[]
}) => {
  const queryClient = useQueryClient()

  const [name, setName] = useState("")
  const [target, setTarget] = useState("")
  const [deleting, setDeleting] = useState<string | null>(null)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["channels"] })
    queryClient.invalidateQueries({ queryKey: ["channel-categories"] })
  }

  const { data } = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const res = await client.channel.listChannels.$get()
      return await res.json()
    },
  })

  const { mutate: createChannel, isPending: isCreating } = useMutation({
    mutationFn: async () => {
      await client.channel.createChannel.$post({ name, target })
    },
    onSuccess: () => {
      toast.success("Channel added")
      setName("")
      setTarget("")
      invalidate()
    },
    onError: (error) =>
      toast.error("Couldn't add the channel", { description: error.message }),
  })

  const { mutate: deleteChannel, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      await client.channel.deleteChannel.$post({ id })
    },
    onSuccess: () => {
      toast.success("Channel deleted", {
        description: "Categories using it fall back to your Discord DM.",
      })
      setDeleting(null)
      invalidate()
    },
    onError: (error) =>
      toast.error("Couldn't delete the channel", { description: error.message }),
  })

  const { mutate: assignChannel } = useMutation({
    mutationFn: async ({
      categoryName,
      channelId,
    }: {
      categoryName: string
      channelId: string | null
    }) => {
      await client.channel.assignChannel.$post({ categoryName, channelId })
    },
    onSuccess: () => {
      toast.success("Delivery target updated")
      invalidate()
    },
    onError: (error) =>
      toast.error("Couldn't update delivery", { description: error.message }),
  })

  const channels = data?.channels ?? []
  const atLimit = data ? channels.length >= data.limit : false

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Add a channel
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          A Discord channel webhook delivers events where your team can see
          them, rather than to your direct messages. Create one in Discord under
          Server Settings, Integrations, Webhooks, then paste the URL here.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="channel-name">Name</Label>
            <Input
              id="channel-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Team alerts"
              className="mt-1 h-9"
            />
          </div>

          <div>
            <Label htmlFor="channel-url">Webhook URL</Label>
            <Input
              id="channel-url"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="mt-1 h-9"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            onClick={() => createChannel()}
            disabled={isCreating || atLimit || !name.trim() || !target.trim()}
          >
            {isCreating ? "Adding..." : "Add channel"}
          </Button>

          {atLimit ? (
            <p className="text-xs text-muted-foreground">
              Channel limit reached. Delete one to add another.
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Your channels
        </h2>

        {channels.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Hash}
              title="No channels yet"
              description="Every category delivers to your Discord DM until you add one."
            />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {channels.map((channel) => (
              <li key={channel.id} className="flex items-center gap-3 py-3">
                <Hash aria-hidden className="size-4 text-muted-foreground" />

                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{channel.name}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {channel.target}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleting(channel.id)}
                  aria-label="Delete channel"
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Where each category delivers
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Anything left on Discord DM goes to you personally.
        </p>

        <ul className="mt-4 divide-y divide-border">
          {categories.map((category) => (
            <li
              key={category.name}
              className="flex flex-wrap items-center gap-3 py-3"
            >
              <span className="text-sm text-foreground">{category.name}</span>

              <div className="ml-auto w-56">
                <Select
                  value={category.channelId ?? DIRECT_MESSAGE}
                  onValueChange={(value) =>
                    assignChannel({
                      categoryName: category.name,
                      channelId: value === DIRECT_MESSAGE ? null : value,
                    })
                  }
                >
                  <SelectTrigger size="sm" className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DIRECT_MESSAGE}>Discord DM</SelectItem>
                    {channels.map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        {channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete channel?"
        description="Categories delivering here fall back to your Discord DM. Events already sent are unaffected."
        confirmLabel="Delete"
        destructive
        pending={isDeleting}
        onConfirm={() => deleting && deleteChannel(deleting)}
      />
    </div>
  )
}
