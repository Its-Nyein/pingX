"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Meter, MeterSkeleton } from "@/components/ui/meter"
import { FREE_QUOTA, PRO_QUOTA } from "@/config"
import type { Plan } from "@/db"
import { client } from "@/lib/client"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

export const UpgradePageContent = ({
  plan,
  billingEnabled,
}: {
  plan: Plan
  billingEnabled: boolean
}) => {
  const router = useRouter()
  const isPro = plan === "PRO"

  const { mutate: createCheckoutSession, isPending } = useMutation({
    mutationFn: async () => {
      const res = await client.payment.createCheckoutSession.$post()
      return await res.json()
    },
    onSuccess: ({ url }) => {
      if (url) router.push(url)
    },
    onError: (error) => {
      toast.error("Couldn't start checkout", { description: error.message })
    },
  })

  const { data: usageData } = useQuery({
    queryKey: ["usage"],
    queryFn: async () => {
      const res = await client.project.getUsage.$get()
      return await res.json()
    },
  })

  const quota = isPro ? PRO_QUOTA : FREE_QUOTA

  return (
    <div className="flex flex-col gap-6">

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-md border border-border bg-card p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              Current plan
            </span>
            <Badge variant={isPro ? "success" : "neutral"}>
              {isPro ? "Pro" : "Free"}
            </Badge>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            {quota.maxEventsPerMonth.toLocaleString()} events/mo &middot;{" "}
            {quota.maxEventCategories.toLocaleString()} categories
            {isPro ? null : " · community support"}
          </p>
        </div>

        {isPro ? (
          <p className="text-xs text-muted-foreground">
            Thanks for supporting pingX.
          </p>
        ) : (
          <div className="space-y-2">
            <Button
              onClick={() => createCheckoutSession()}
              disabled={isPending || !billingEnabled}
              title={
                billingEnabled
                  ? undefined
                  : "Billing is not configured on this deployment."
              }
            >
              {isPending ? "Redirecting..." : "Upgrade to Pro"}
            </Button>

            <p className="text-xs text-muted-foreground">
              {!billingEnabled
                ? "Billing is not configured on this deployment, so upgrading is disabled."
                : null}
            </p>

            <p className="text-xs text-muted-foreground">
              Demo runs in Stripe test mode. Pay with card{" "}
              <code className="rounded border border-border bg-recessed/60 px-1 py-0.5 font-mono">
                4242 4242 4242 4242
              </code>
              , any future expiry and any CVC. No real money moves.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-5">
        {usageData ? (
          <>
            <p className="text-xs text-muted-foreground">
              {plan === "PRO"
                ? "Pro keeps 1 year of event history."
                : "Free keeps 30 days of event history. Pro keeps 1 year."}
            </p>

            <Meter
              label="Events this period"
              value={usageData.eventsUsed}
              max={usageData.eventsLimit}
            />
            <Meter
              label="Active categories"
              value={usageData.categoriesUsed}
              max={usageData.categoriesLimit}
            />
          </>
        ) : (
          <>
            <MeterSkeleton label="Events this period" />
            <MeterSkeleton label="Active categories" />
          </>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {usageData?.resetDate ? (
          <>Usage resets {format(usageData.resetDate, "MMM d, yyyy")}.</>
        ) : (
          <span className="inline-block h-3 w-40 animate-pulse rounded bg-recessed align-middle" />
        )}
      </p>
    </div>
  )
}
