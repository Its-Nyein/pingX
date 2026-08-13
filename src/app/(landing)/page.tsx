import MockDiscordUI from "@/components/mock-discord-ui"
import Button from "../../components/button"
import { MaxWidthWrapper } from "../../components/max-width-wrapper"
import {
  AlertTriangle,
  Check,
  CreditCard,
  TrendingUp,
  UserPlus,
} from "lucide-react"
import Link from "next/link"
import { AnimatedList } from "@/components/ui/animated-list"
import DiscordMessage from "@/components/discord-message"
import { PINGX_AVATAR } from "@/lib/avatar"
import { appUrl } from "@/lib/app-url"
import { cn } from "@/lib/utils"
import type { ComponentType, ReactNode } from "react"
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

const FEED = [
  {
    icon: UserPlus,
    tint: "bg-success-tint text-success",
    title: "New user signed up",
    meta: "nyeindev@gmail.com",
    time: "12:45",
  },
  {
    icon: CreditCard,
    tint: "bg-warning-tint text-warning",
    title: "Payment received",
    meta: "$10.00 · PRO plan",
    time: "01:00",
  },
  {
    icon: TrendingUp,
    tint: "bg-info-tint text-link",
    title: "Revenue milestone",
    meta: "$5,000 MRR · +8.2%",
    time: "05:11",
  },
  {
    icon: AlertTriangle,
    tint: "bg-danger-tint text-danger",
    title: "Quota exceeded",
    meta: "100 / 100 events used",
    time: "06:30",
  },
]

const EVENT_TYPES = [
  "sale",
  "signup",
  "churn",
  "refund",
  "milestone",
  "error",
  "invite",
  "upgrade",
  "quota",
]

const PROPERTIES = [
  { key: "plan", value: '"PRO"', accent: true },
  { key: "amount", value: "52.99", accent: false },
  { key: "email", value: '"pingx@..."', accent: true },
  { key: "seats", value: "12", accent: false },
]

const BentoCard = ({
  title,
  description,
  className,
  children,
}: {
  title: string
  description: string
  className?: string
  children: ReactNode
}) => (
  <div
    className={cn(
      "flex flex-col rounded-lg border border-border bg-card p-6 sm:p-8",
      className
    )}
  >
    <p className="text-lg font-semibold tracking-tight text-foreground">
      {title}
    </p>
    <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
      {description}
    </p>
    <div className="mt-6 flex-1">{children}</div>
  </div>
)

const page = () => {
  const codeSnippet = `await fetch("${appUrl()}/api/v1/events", {
    method: "POST",
    body: JSON.stringify({
      category: "sale",
      data: {
        plan: "PRO",
        email: "pingx@gmail.com.mm",
        amount: 52.99
      }
    }),
    headers: {
      Authorization: "Bearer <YOUR_API_KEY>"
    }
  })`

  return (
    <>
      <section className="relative overflow-hidden bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 size-208 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--color-primary)_0%,transparent_60%)] opacity-10 blur-3xl"
        />

        <MaxWidthWrapper className="relative py-20 sm:py-28">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-cloudflare-orange" />
              Real-time event monitoring
            </span>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-6xl">
              Real-Time SaaS Insights,
              <br />
              <span className="bg-linear-to-r from-primary to-chart-3 bg-clip-text text-transparent">
                Delivered to Your Discord
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
              pingX is the easiest way to monitor your SaaS. Get instant
              notifications for{" "}
              <span className="font-medium text-foreground">
                sales, new users or any other event
              </span>{" "}
              sent directly to your Discord.
            </p>

            <ul className="mt-8 flex flex-col items-start gap-2.5 text-left">
              {[
                "Real-time Discord alerts for critical events",
                "Buy once, use forever",
                "Track sales, new users or any other events",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 text-base text-muted-foreground"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success-tint">
                    <Check className="size-3 text-success" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
              <Button
                href="/sign-up"
                className="h-12 w-full justify-center text-base sm:w-auto"
              >
                Start For Free Today
              </Button>

              <Link
                href="/pricing"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                See pricing
              </Link>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              No credit card required to start.
            </p>
          </div>
        </MaxWidthWrapper>
      </section>

      <section className="relative bg-background pb-16 sm:pb-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-linear-to-b from-primary/8 via-primary/4 to-transparent"
        />
        <div className="relative mx-auto">
          <MaxWidthWrapper>
            <div className="rounded-xl border border-border bg-card/60 p-1.5 shadow-sm backdrop-blur-sm sm:rounded-2xl sm:p-2.5">
              <MockDiscordUI>
                <AnimatedList>
                  <DiscordMessage
                    avatarSrc={PINGX_AVATAR}
                    avatarAlt="pingX avatar"
                    username="ping_X"
                    timestamp="Today at 12:45AM"
                    badgeText="SignUp"
                    badgeColor="#43b581"
                    title="New user signed up"
                    content={{
                      name: "Nyeinn Dev",
                      email: "nyeindev@gmail.com.mm",
                    }}
                  />

                  <DiscordMessage
                    avatarSrc={PINGX_AVATAR}
                    avatarAlt="pingX Avatar"
                    username="ping_X"
                    timestamp="Today at 01:00AM"
                    badgeText="Revenue"
                    badgeColor="#faa61a"
                    title="Payment received"
                    content={{
                      amount: "$10.00",
                      email: "pingx@gmail.com.mm",
                      plan: "PRO",
                    }}
                  />

                  <DiscordMessage
                    avatarSrc={PINGX_AVATAR}
                    avatarAlt="pingX Avatar"
                    username="ping_X"
                    timestamp="Today at 5:11AM"
                    badgeText="Milestone"
                    badgeColor="#5865f2"
                    title="Revenue Milestone Achieved"
                    content={{
                      recurringRevenue: "$5.000 USD",
                      growth: "+8.2%",
                    }}
                  />
                </AnimatedList>
              </MockDiscordUI>
            </div>
          </MaxWidthWrapper>
        </div>
      </section>

      <section className="relative bg-background py-24 sm:py-28">
        <MaxWidthWrapper>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-link">
              Intuitive Monitoring
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
              Stay ahead with real-time insights
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Everything you need to know the moment it happens, without
              building a dashboard for it.
            </p>
          </div>

          <div className="mt-14 grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
            <BentoCard
              className="lg:row-span-2"
              title="Real-time Notifications"
              description="Get notified about critical events the moment they happen, no matter if you're at home or on the go."
            >
              <div className="flex items-center gap-2 pb-3">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-success" />
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  Live feed
                </span>
              </div>

              <ul className="space-y-2">
                {FEED.map((item) => (
                  <li
                    key={item.title}
                    className="flex items-start gap-3 rounded-md border border-border bg-recessed/40 p-3"
                  >
                    <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md", item.tint)}>
                      <item.icon className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {item.title}
                        </p>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {item.time}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.meta}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </BentoCard>

            <BentoCard
              title="Track Any Event"
              description="From new user signups to successful payments, pingX notifies you for all critical events in your SaaS."
            >
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.map((label, i) => (
                  <span
                    key={label}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                      i === 0
                        ? "border-primary/30 bg-info-tint text-link"
                        : "border-border bg-recessed/50 text-muted-foreground"
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-current opacity-60" />
                    {label}
                  </span>
                ))}
              </div>
            </BentoCard>

            <BentoCard
              className="lg:col-start-2 lg:row-start-2"
              title="Track Any Properties"
              description="Add any custom data you like to an event, such as a user email, a purchase amount or an exceeded quota."
            >
              <dl className="divide-y divide-border overflow-hidden rounded-md border border-border bg-recessed/40 font-mono text-xs">
                {PROPERTIES.map(({ key, value, accent }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <dt className="truncate text-muted-foreground">{key}</dt>
                    <dd className={cn("truncate", accent ? "text-link" : "text-foreground")}>
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </BentoCard>

            <BentoCard
              className="lg:row-span-2"
              title="Easy Integration"
              description="Connect pingX with your existing workflows in minutes and call our intuitive logging API from any language."
            >
              <div className="overflow-hidden rounded-md border border-border bg-[#282c34]">
                <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
                  <span className="flex gap-1.5">
                    <span className="size-2 rounded-full bg-white/20" />
                    <span className="size-2 rounded-full bg-white/20" />
                    <span className="size-2 rounded-full bg-white/20" />
                  </span>
                  <span className="ml-1 font-mono text-xs text-white/60">
                    pingx.js
                  </span>
                </div>

                <SyntaxHighlighter
                  language="javascript"
                  style={{
                    ...oneDark,
                    'pre[class*="language-"]': {
                      ...oneDark['pre[class*="language-"]'],
                      background: "transparent",
                      margin: 0,
                      padding: "0.875rem",
                      overflow: "auto",
                    },
                    'code[class*="language-"]': {
                      ...oneDark['code[class*="language-"]'],
                      background: "transparent",
                      fontSize: "0.7rem",
                      lineHeight: 1.6,
                    },
                  }}
                >
                  {codeSnippet}
                </SyntaxHighlighter>
              </div>
            </BentoCard>
          </div>
        </MaxWidthWrapper>
      </section>
    </>
  )
}

export default page
