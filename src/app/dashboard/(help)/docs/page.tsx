import { PageBody } from "@/components/shell/page-body"
import { PageHeader } from "@/components/shell/page-header"
import { FREE_QUOTA, PRO_QUOTA, RATE_LIMIT, RETENTION } from "@/config"
import { appUrl } from "@/lib/app-url"
import { requireUser } from "@/lib/session"
import Link from "next/link"
import type { ReactNode } from "react"

const Code = ({ children }: { children: ReactNode }) => (
  <code className="rounded border border-border bg-recessed/60 px-1.5 py-0.5 font-mono text-xs text-foreground">
    {children}
  </code>
)

const Block = ({ children }: { children: string }) => (
  <pre className="mt-4 overflow-x-auto rounded-md border border-border bg-recessed/40 p-4 font-mono text-xs leading-relaxed text-foreground">
    {children}
  </pre>
)

const Section = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) => (
  <section className="rounded-lg border border-border bg-card p-6 sm:p-8">
    <h2 className="text-lg font-semibold tracking-tight text-foreground">
      {title}
    </h2>
    <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
      {children}
    </div>
  </section>
)

const RESPONSES: { code: string; meaning: string }[] = [
  { code: "200", meaning: "Delivered to your Discord DMs." },
  { code: "401", meaning: "Missing, malformed or unknown API key." },
  { code: "403", meaning: "No Discord ID on your account yet." },
  { code: "404", meaning: "You have no category with that name." },
  { code: "413", meaning: "Body is larger than 16 KB." },
  {
    code: "422",
    meaning:
      "Body failed validation, or Discord refused permanently — for example you do not accept DMs from the server.",
  },
  { code: "429", meaning: "Monthly quota reached, or more than 60 requests in a minute." },
  { code: "502", meaning: "Stored, but Discord could not be reached. Resend it from the category page." },
]

const Page = async () => {
  await requireUser()
  const base = appUrl()

  return (
    <>
      <PageHeader
        title="Documentation"
        description="Everything pingX does is one endpoint. Send it an event, get a Discord DM."
      />

      <PageBody>
        <div className="space-y-4">
          <Section title="Send an event">
            <p>
              One <Code>POST</Code> to <Code>/api/v1/events</Code>, authenticated
              with the key from{" "}
              <Link href="/dashboard/api-key" className="text-link">
                Tokens
              </Link>
              . The <Code>category</Code> must already exist on your account.
            </p>
            <Block>{`curl -X POST ${base}/api/v1/events \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "category": "sale",
    "description": "New Pro subscriber",
    "data": { "plan": "PRO", "amount": 49 }
  }'`}</Block>
            <p>
              <Code>description</Code> and <Code>data</Code> are optional. Every
              key in <Code>data</Code> becomes a field on the Discord embed and a
              column on the category page.
            </p>
          </Section>

          <Section title="Responses">
            <p>
              An event is stored before delivery is attempted, so a failure is
              never a lost event — it appears on the category page marked{" "}
              <span className="font-medium text-danger">Failed</span> with the
              reason, and can be resent from there.
            </p>
            <dl className="mt-4 divide-y divide-border overflow-hidden rounded-md border border-border">
              {RESPONSES.map((response) => (
                <div key={response.code} className="flex gap-4 px-4 py-3">
                  <dt className="w-12 shrink-0 font-mono text-xs text-foreground">
                    {response.code}
                  </dt>
                  <dd className="text-sm text-muted-foreground">
                    {response.meaning}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section title="Read your events back">
            <p>
              <Code>GET /api/v1/events</Code> lists your events newest first,
              with the same key and the same rate limit. Filter with{" "}
              <Code>category</Code>, <Code>status</Code> and <Code>search</Code>{" "}
              - a substring match against the payload, two characters or more -
              and page with{" "}
              <Code>limit</Code> (1-100, default 30) and the <Code>cursor</Code>{" "}
              returned as <Code>nextCursor</Code>.
            </p>
            <Block>{`curl "${base}/api/v1/events?status=FAILED&limit=50" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</Block>
            <p>
              Paging is keyset rather than offset, so pages cannot repeat or skip
              rows when new events arrive while you are reading.{" "}
              <Code>nextCursor</Code> is <Code>null</Code> on the last page.
            </p>
          </Section>

          <Section title="Limits">
            <p>
              Free allows {FREE_QUOTA.maxEventsPerMonth} events a month across{" "}
              {FREE_QUOTA.maxEventCategories} categories. Pro allows{" "}
              {PRO_QUOTA.maxEventsPerMonth} across{" "}
              {PRO_QUOTA.maxEventCategories}. The monthly count resets at the
              start of each calendar month, UTC.
            </p>
            <p>
              Free keeps {RETENTION.freeDays} days of event history and Pro keeps
              a year. Older events stop appearing in the dashboard and the API,
              and are deleted {RETENTION.graceDays} days after that.
            </p>
            <p>
              Every plan is limited to {RATE_LIMIT.requestsPerMinute} requests a
              minute per key. Exceeding it returns <Code>429</Code> with a{" "}
              <Code>Retry-After</Code> header telling you how long to wait.
            </p>
          </Section>

          <Section title="Before anything arrives">
            <p>
              Delivery needs your Discord ID, which lives in{" "}
              <Link href="/dashboard/account-settings" className="text-link">
                Settings
              </Link>
              . If you have not found it yet, the{" "}
              <Link
                href="/dashboard/account-settings/discord-id"
                className="text-link"
              >
                step-by-step guide
              </Link>{" "}
              takes about a minute — and explains why a correct ID can still fail
              if the bot has never shared a server with you.
            </p>
          </Section>

          <Section title="Being told when something is wrong">
            <p>
              An <Link href="/dashboard/alerts" className="text-link">alert rule</Link>{" "}
              sends you a direct message when a threshold is met - say five
              failed events in an hour. pingX checks after each event it
              receives, so an alert arrives while the incident is happening
              rather than on a schedule.
            </p>
            <p>
              A rule will not fire again until its window has passed, so one
              incident is one message rather than one per event.
            </p>
          </Section>

          <Section title="Keeping your key safe">
            <p>
              A key only sends events. It cannot change your account, delete
              categories or start a checkout, so pasting it into a server-side
              integration is safe. It is still a secret: anyone holding it can
              send events as you and consume your quota.
            </p>
            <p>
              If it leaks, regenerate it from{" "}
              <Link href="/dashboard/api-key" className="text-link">
                Tokens
              </Link>
              . The old key stops working immediately.
            </p>
          </Section>
        </div>
      </PageBody>
    </>
  )
}

export default Page
