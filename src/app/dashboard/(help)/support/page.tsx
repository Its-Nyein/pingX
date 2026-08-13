import { PageBody } from "@/components/shell/page-body"
import { PageHeader } from "@/components/shell/page-header"
import { requireUser } from "@/lib/session"
import { Bug, LifeBuoy, Mail, ShieldAlert } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

const SUPPORT_EMAIL = "nyeinphyoaung.edu@gmail.com"

const Channel = ({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon
  title: string
  children: ReactNode
  action: ReactNode
}) => (
  <div className="flex flex-col rounded-lg border border-border bg-card p-6 sm:p-8">
    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-info-tint text-link">
      <Icon aria-hidden className="size-3.5" />
    </span>

    <p className="mt-4 text-lg font-semibold tracking-tight text-foreground">
      {title}
    </p>
    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
      {children}
    </p>

    <div className="mt-4 text-sm">{action}</div>
  </div>
)

const Page = async () => {
  const user = await requireUser()

  const mailto = (subject: string) =>
    `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      `\n\n---\nAccount: ${user.email}\nPlan: ${user.plan}`
    )}`

  return (
    <>
      <PageHeader
        title="Support"
        description="pingX is built and maintained by one person, so these are honest expectations rather than a support desk."
      />

      <PageBody>
        <div className="grid gap-4 lg:grid-cols-3">
          <Channel
            icon={LifeBuoy}
            title="Something is not working"
            action={
              <a href={mailto("[pingX] Help")} className="text-link">
                Email support
              </a>
            }
          >
            Check the{" "}
            <Link href="/dashboard/docs" className="text-link">
              documentation
            </Link>{" "}
            first — most questions are a missing Discord ID or a category name
            that does not match. If it is neither, send the event ID from the
            category page and what you expected to happen.
          </Channel>

          <Channel
            icon={Bug}
            title="Report a bug"
            action={
              <a href={mailto("[pingX] Bug report")} className="text-link">
                Report it
              </a>
            }
          >
            The two things that make a bug fixable are what you did and what
            happened instead. A failed event shows its reason on the category
            page — including that is usually enough to find the cause.
          </Channel>

          <Channel
            icon={ShieldAlert}
            title="Security"
            action={
              <a href={mailto("[pingX security]")} className="text-link">
                Report privately
              </a>
            }
          >
            Please do not report a security problem in public. Email it with
            steps to reproduce and I will acknowledge within a week. If you
            think your API key has leaked, regenerate it from{" "}
            <Link href="/dashboard/api-key" className="text-link">
              Tokens
            </Link>{" "}
            first — that takes effect immediately.
          </Channel>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Mail aria-hidden className="size-4 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              What to expect
            </span>
          </div>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            One person answers these, so replies take days rather than hours.
            Events are never lost while you wait: an event that fails to deliver
            is still stored, keeps the reason it failed, and can be resent from
            the category page once the cause is fixed.
          </p>
        </div>
      </PageBody>
    </>
  )
}

export default Page
