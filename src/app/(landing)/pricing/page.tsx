"use client"

import { MaxWidthWrapper } from "@/components/max-width-wrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FREE_QUOTA, PRO_QUOTA } from "@/config"
import { authClient } from "@/lib/auth-client"
import { client } from "@/lib/client"
import { useMutation } from "@tanstack/react-query"
import { Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const INCLUDED_FEATURES = [
  `${PRO_QUOTA.maxEventsPerMonth.toLocaleString()} real-time events per month`,
  `${PRO_QUOTA.maxEventCategories} event categories`,
  "Advanced analytics and insights",
  "Priority support",
]

const Page = () => {
  const { data: session } = authClient.useSession()
  const user = session?.user
  const isPro = user?.plan === "PRO"
  const router = useRouter()

  const { mutate: createCheckoutSession, isPending } = useMutation({
    mutationFn: async () => {
      const res = await client.payment.createCheckoutSession.$post()
      return res.json()
    },
    onSuccess: ({ url }) => {
      if (url) {
        router.push(url)
        return
      }
      toast.error("Could not start checkout. Please try again.")
    },
    onError: () => {
      toast.error("Could not start checkout. Please try again.")
    },
  })

  const handleGetAccess = () => {
    if (!user) {
      router.push("/sign-in?intent=upgrade")
      return
    }
    createCheckoutSession()
  }

  return (
    <div className="bg-background py-24 sm:py-32">
      <MaxWidthWrapper>
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
            Simple no-tricks pricing
          </h1>
          <p className="mt-4 text-base leading-relaxed text-pretty text-muted-foreground">
            We hate subscriptions, and chances are you do too. That&apos;s why
            pingX is lifetime access for a one-time payment.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl overflow-hidden rounded-lg border border-border bg-card lg:grid-cols-[1.4fr_1fr]">
          <div className="p-8 sm:p-10">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Lifetime access
              </h2>
              {isPro ? <Badge variant="success">Current plan</Badge> : null}
            </div>

            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Invest once in pingX and transform how you monitor your SaaS. Get
              instant alerts, track critical metrics and never miss a beat in
              your business growth.
            </p>

            <div className="mt-8 flex items-center gap-4">
              <h3 className="shrink-0 text-xs font-semibold uppercase tracking-wide text-link">
                What&apos;s included
              </h3>
              <span className="h-px flex-1 bg-border" />
            </div>

            <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {INCLUDED_FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2.5 text-sm text-muted-foreground"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success-tint">
                    <Check className="size-3 text-success" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            <p className="mt-6 text-xs text-muted-foreground">
              Free plan includes {FREE_QUOTA.maxEventsPerMonth.toLocaleString()}{" "}
              events per month and {FREE_QUOTA.maxEventCategories} categories.
            </p>
          </div>

          <div className="flex flex-col justify-center border-border bg-recessed/50 p-8 text-center max-lg:border-t lg:border-l sm:p-10">
            <p className="text-sm font-medium text-muted-foreground">
              Pay once, own forever
            </p>

            <p className="mt-3 flex items-baseline justify-center gap-x-2">
              <span className="text-5xl font-semibold tracking-tight tabular-nums text-foreground">
                $10
              </span>
              <span className="text-sm font-medium tracking-wide text-muted-foreground">
                USD
              </span>
            </p>

            <Button
              onClick={handleGetAccess}
              disabled={isPending || isPro}
              size="lg"
              className="mt-6 w-full"
            >
              {isPro
                ? "You have Pro"
                : isPending
                  ? "Redirecting..."
                  : user
                    ? "Get pingX"
                    : "Sign in to upgrade"}
            </Button>

            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Secure payment via Stripe. Start monitoring in minutes.
            </p>
          </div>
        </div>
      </MaxWidthWrapper>
    </div>
  )
}

export default Page
