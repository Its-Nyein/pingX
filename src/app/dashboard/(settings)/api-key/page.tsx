import DashboardPage from "@/components/dashboard-page"
import { requireUser } from "@/lib/session"
import ApiKeySettings from "./api-key-settings"

const Page = async () => {
  const user = await requireUser()

  return (
    <DashboardPage title="API Key">
      <ApiKeySettings apiKey={user.apiKey ?? ""} />
    </DashboardPage>
  )
}

export default Page
