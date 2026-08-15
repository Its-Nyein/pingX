import { PageBody } from "@/components/shell/page-body"
import { PageHeader } from "@/components/shell/page-header"
import { requireUser } from "@/lib/session"
import { cn } from "@/lib/utils"
import { ArrowLeft, MousePointerClick, Save, ToggleRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

const Path = ({ children }: { children: ReactNode }) => (
  <span className="font-medium text-foreground">{children}</span>
)

const Code = ({ children }: { children: ReactNode }) => (
  <code className="rounded border border-border bg-recessed/60 px-1.5 py-0.5 font-mono text-xs text-foreground">
    {children}
  </code>
)

const STEPS: {
  icon: LucideIcon
  title: string
  body: ReactNode
}[] = [
  {
    icon: ToggleRight,
    title: "Turn on Developer Mode",
    body: (
      <>
        In Discord, open <Path>User Settings</Path> - the cog beside your name -
        then <Path>Advanced</Path>, and switch on <Path>Developer Mode</Path>. It
        adds the copy-ID options to right-click menus and changes nothing else
        about your account.
      </>
    ),
  },
  {
    icon: MousePointerClick,
    title: "Copy your user ID",
    body: (
      <>
        Right-click your own name or avatar anywhere - a message you sent, or
        your card in the member list - and choose <Path>Copy User ID</Path>. You
        now have a 17 to 20 digit number on your clipboard, something like{" "}
        <Code>123456789012345678</Code>.
      </>
    ),
  },
  {
    icon: Save,
    title: "Paste it into settings",
    body: (
      <>
        Paste it into the Discord ID field on{" "}
        <Link href="/dashboard/settings/discord" className="text-link">
          Settings
        </Link>{" "}
        and save. pingX delivers every matching event to you as a direct
        message.
      </>
    ),
  },
]

const StepCard = ({
  step,
  index,
  className,
}: {
  step: (typeof STEPS)[number]
  index: number
  className?: string
}) => (
  <div
    className={cn(
      "flex flex-col rounded-lg border border-border bg-card p-6 sm:p-8",
      className
    )}
  >
    <div className="flex items-center gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-info-tint text-link">
        <step.icon aria-hidden className="size-3.5" />
      </span>
      <span className="text-xs font-semibold uppercase tracking-wide text-link">
        Step {index + 1}
      </span>
    </div>

    <p className="mt-4 text-lg font-semibold tracking-tight text-foreground">
      {step.title}
    </p>
    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
      {step.body}
    </p>
  </div>
)

const Page = async () => {
  await requireUser()

  return (
    <>
      <PageHeader
        title="Find your Discord ID"
        description="Your Discord ID is the number that tells pingX where to deliver your events. It takes about a minute to find."
      />

      <PageBody>
        <ol className="grid gap-4 lg:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex">
              <StepCard step={step} index={i} className="w-full" />
            </li>
          ))}
        </ol>

        <div className="mt-4 rounded-lg border border-border bg-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-warning opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-warning" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Worth knowing
            </span>
          </div>

          <p className="mt-4 text-lg font-semibold tracking-tight text-foreground">
            A correct ID is not always enough
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Discord does not let a bot message someone it has never shared a
            server with. If events arrive marked{" "}
            <span className="font-medium text-danger">Failed</span> even though
            your ID is right, join a server the pingX bot is in, then enable{" "}
            <Path>Privacy &amp; Safety → direct messages from server members</Path>{" "}
            there. Events are stored either way, so nothing is lost while you
            sort it out.
          </p>
        </div>

        <Link
          href="/dashboard/settings/discord"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Back to settings
        </Link>
      </PageBody>
    </>
  )
}

export default Page
