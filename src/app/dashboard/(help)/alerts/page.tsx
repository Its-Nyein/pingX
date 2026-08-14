import { PageBody } from "@/components/shell/page-body"
import { PageHeader } from "@/components/shell/page-header"
import { db, eventCategories } from "@/db"
import { requireUser } from "@/lib/session"
import { asc, eq } from "drizzle-orm"
import { AlertsPageContent } from "./alerts-page-content"

const Page = async () => {
  const user = await requireUser()

  const categories = await db
    .select({ name: eventCategories.name })
    .from(eventCategories)
    .where(eq(eventCategories.userId, user.id))
    .orderBy(asc(eventCategories.name))

  return (
    <>
      <PageHeader
        title="Alerts"
        description="Get a direct message when your events say something is wrong."
      />

      <PageBody>
        <AlertsPageContent categories={categories.map((c) => c.name)} />
      </PageBody>
    </>
  )
}

export default Page
