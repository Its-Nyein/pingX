import { PageBody } from "@/components/shell/page-body"
import { PageHeader } from "@/components/shell/page-header"
import { requireUser } from "@/lib/session"
import { UpgradePageContent } from "./upgrade-page-content"

const Page = async () => {
  const user = await requireUser()

  return (
    <>
      <PageHeader
        title="Billing"
        description="Your current plan and this period's usage."
      />

      <PageBody narrow>
        <UpgradePageContent plan={user.plan} />
      </PageBody>
    </>
  )
}

export default Page
