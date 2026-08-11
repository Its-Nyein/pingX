import { PageBody } from "@/components/shell/page-body"
import { PageHeader } from "@/components/shell/page-header"
import { requireUser } from "@/lib/session"
import { SettingPageContent } from "./setting-page-content"

const Page = async () => {
  const user = await requireUser()

  return (
    <>
      <PageHeader
        title="Settings"
        description="Where pingX delivers your event notifications."
      />

      <PageBody narrow>
        <SettingPageContent discordId={user.discordId ?? ""} />
      </PageBody>
    </>
  )
}

export default Page
