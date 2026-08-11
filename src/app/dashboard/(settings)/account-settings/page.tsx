import DashboardPage from "@/components/dashboard-page"
import { requireUser } from "@/lib/session"
import { SettingPageContent } from "./setting-page-content"

const Page = async () => {
  const user = await requireUser()

  return (
    <DashboardPage title="Account Settings">
      <SettingPageContent discordId={user.discordId ?? ""} />
    </DashboardPage>
  )
}

export default Page
