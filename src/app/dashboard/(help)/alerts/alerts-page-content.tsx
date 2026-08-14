"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EmptyState } from "@/components/shell/empty-state"
import { client } from "@/lib/client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { BellRing, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

type Metric = "FAILED_EVENTS" | "ALL_EVENTS"

const WINDOWS = [
  { label: "15 minutes", value: 15 },
  { label: "1 hour", value: 60 },
  { label: "6 hours", value: 360 },
  { label: "24 hours", value: 1440 },
]

export const AlertsPageContent = ({
  categories,
}: {
  categories: string[]
}) => {
  const queryClient = useQueryClient()

  const [metric, setMetric] = useState<Metric>("FAILED_EVENTS")
  const [threshold, setThreshold] = useState(5)
  const [windowMinutes, setWindowMinutes] = useState(60)
  const [categoryName, setCategoryName] = useState("")
  const [deleting, setDeleting] = useState<string | null>(null)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["alert-rules"] })
    queryClient.invalidateQueries({ queryKey: ["alert-triggers"] })
  }

  const { data } = useQuery({
    queryKey: ["alert-rules"],
    queryFn: async () => {
      const res = await client.alert.listRules.$get()
      return await res.json()
    },
  })

  const { data: history } = useQuery({
    queryKey: ["alert-triggers"],
    queryFn: async () => {
      const res = await client.alert.recentTriggers.$get()
      return await res.json()
    },
  })

  const { mutate: createRule, isPending: isCreating } = useMutation({
    mutationFn: async () => {
      await client.alert.createRule.$post({
        metric,
        threshold,
        windowMinutes,
        ...(categoryName ? { categoryName } : {}),
      })
    },
    onSuccess: () => {
      toast.success("Alert rule created")
      invalidate()
    },
    onError: (error) =>
      toast.error("Couldn't create the rule", { description: error.message }),
  })

  const { mutate: toggleRule } = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      await client.alert.toggleRule.$post({ id, enabled })
    },
    onSuccess: invalidate,
    onError: (error) =>
      toast.error("Couldn't update the rule", { description: error.message }),
  })

  const { mutate: deleteRule, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      await client.alert.deleteRule.$post({ id })
    },
    onSuccess: () => {
      toast.success("Alert rule deleted")
      setDeleting(null)
      invalidate()
    },
    onError: (error) =>
      toast.error("Couldn't delete the rule", { description: error.message }),
  })

  const rules = data?.rules ?? []
  const atLimit = data ? rules.length >= data.limit : false

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          New alert rule
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          pingX checks after each event it receives and sends you a direct
          message when a rule matches. It will not fire again until the window
          has passed, so one incident is one message.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label htmlFor="metric">When</Label>
            <select
              id="metric"
              value={metric}
              onChange={(e) => setMetric(e.target.value as Metric)}
              className="mt-1 h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground"
            >
              <option value="FAILED_EVENTS">Failed events</option>
              <option value="ALL_EVENTS">All events</option>
            </select>
          </div>

          <div>
            <Label htmlFor="threshold">Reach</Label>
            <Input
              id="threshold"
              type="number"
              min={1}
              max={1000}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="mt-1 h-9"
            />
          </div>

          <div>
            <Label htmlFor="window">Within</Label>
            <select
              id="window"
              value={windowMinutes}
              onChange={(e) => setWindowMinutes(Number(e.target.value))}
              className="mt-1 h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground"
            >
              {WINDOWS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="category">In</Label>
            <select
              id="category"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground"
            >
              <option value="">All categories</option>
              {categories.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            onClick={() => createRule()}
            disabled={isCreating || atLimit}
            title={atLimit ? `You can have ${data?.limit} rules.` : undefined}
          >
            {isCreating ? "Creating..." : "Create rule"}
          </Button>

          {atLimit ? (
            <p className="text-xs text-muted-foreground">
              Rule limit reached. Delete one to add another.
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Your rules
        </h2>

        {rules.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={BellRing}
              title="No alert rules yet"
              description="Create one above and pingX will tell you when something changes."
            />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {rules.map((rule) => (
              <li
                key={rule.id}
                className="flex flex-wrap items-center gap-3 py-3"
              >
                <Checkbox
                  checked={rule.enabled}
                  onCheckedChange={(checked) =>
                    toggleRule({ id: rule.id, enabled: Boolean(checked) })
                  }
                  aria-label={rule.enabled ? "Disable rule" : "Enable rule"}
                />

                <div className="min-w-0 flex-1">
                  <p
                    className={
                      rule.enabled
                        ? "text-sm text-foreground"
                        : "text-sm text-muted-foreground line-through"
                    }
                  >
                    {rule.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {rule.lastTriggeredAt
                      ? `Last fired ${formatDistanceToNow(new Date(rule.lastTriggeredAt))} ago`
                      : "Never fired"}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleting(rule.id)}
                  aria-label="Delete rule"
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {history?.triggers.length ? (
        <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Recently fired
          </h2>

          <ul className="mt-4 divide-y divide-border">
            {history.triggers.map((trigger) => (
              <li key={trigger.id} className="flex items-center gap-3 py-2.5">
                <span className="text-sm text-foreground">
                  {trigger.observed}{" "}
                  {trigger.metric === "FAILED_EVENTS" ? "failures" : "events"}
                  {trigger.categoryName ? ` in ${trigger.categoryName}` : ""}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(trigger.triggeredAt))} ago
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete alert rule?"
        description="You will stop being notified when this condition is met. Its trigger history is removed too."
        confirmLabel="Delete"
        destructive
        pending={isDeleting}
        onConfirm={() => deleting && deleteRule(deleting)}
      />
    </div>
  )
}
