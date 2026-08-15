import { PageBody } from "@/components/shell/page-body"
import { PageHeader } from "@/components/shell/page-header"
import { db, eventCategories } from "@/db"
import { requireUser } from "@/lib/session"
import { desc, eq } from "drizzle-orm"
import { ChannelsPageContent } from "./channels-page-content"

const Page = async () => {
  const user = await requireUser()

  const categories = await db
    .select({
      name: eventCategories.name,
      channelId: eventCategories.channelId,
    })
    .from(eventCategories)
    .where(eq(eventCategories.userId, user.id))
    .orderBy(desc(eventCategories.createdAt))

  return (
    <>
      <PageHeader
        title="Channels"
        description="Where pingX delivers. A Discord channel webhook lets a whole team see events without each having an account."
      />

      <PageBody>
        <ChannelsPageContent categories={categories} />
      </PageBody>
    </>
  )
}

export default Page
