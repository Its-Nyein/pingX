import { PageBody } from "@/components/shell/page-body"
import { PageHeader } from "@/components/shell/page-header"
import { requireUser } from "@/lib/session"
import ApiKeySettings from "./api-key-settings"

const Page = async () => {
  const user = await requireUser()

  return (
    <>
      <PageHeader
        title="Tokens"
        description="Use this token to authenticate requests to the pingX events API."
      />

      <PageBody narrow>
        <ApiKeySettings apiKey={user.apiKey ?? ""} />
      </PageBody>
    </>
  )
}

export default Page
