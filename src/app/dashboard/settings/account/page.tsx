import { SettingsSection } from "@/components/shell/settings-section"
import { SignOutButton } from "@/components/sign-out-button"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FREE_QUOTA, PRO_QUOTA } from "@/config"
import { retentionLabel } from "@/lib/retention"
import { requireUser } from "@/lib/session"
import Link from "next/link"

const Page = async () => {
  const user = await requireUser()

  const isPro = user.plan === "PRO"
  const limits = isPro ? PRO_QUOTA : FREE_QUOTA

  return (
    <SettingsSection
      title="Account"
      description="Your plan, what it allows, and how to leave."
    >
      <div className="space-y-6">
        <div className="rounded-md border border-border p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                {isPro ? "Pro" : "Free"} plan
              </p>
              <p className="text-sm text-muted-foreground">
                {limits.maxEventsPerMonth.toLocaleString()} events a month,{" "}
                {limits.maxEventCategories} categories,{" "}
                {retentionLabel(user.plan)}.
              </p>
            </div>

            {!isPro ? (
              <Button asChild size="sm" className="ml-auto">
                <Link href="/dashboard/upgrade">Upgrade</Link>
              </Button>
            ) : null}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">API key</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Keys live on their own page, where you can copy or regenerate them.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/dashboard/api-key">Manage tokens</Link>
          </Button>
        </div>

        <Separator />

        <div>
          <p className="text-sm font-medium text-foreground">Sign out</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ends this session on this device. Your events and settings are kept.
          </p>
          <div className="mt-3">
            <SignOutButton size="sm" />
          </div>
        </div>
      </div>
    </SettingsSection>
  )
}

export default Page
