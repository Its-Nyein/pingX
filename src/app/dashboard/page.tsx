import DashboardPage from "@/components/dashboard-page"
import { db, users } from "@/db"
import { eq } from "drizzle-orm"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { DashboardContent } from "./dashboard-content"
import { CreateEventCategoryModal } from "@/components/create-event-category-modal"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { createCheckoutSession } from "@/lib/stripe"
import { PaymentSuccessModal } from "@/components/payment-success-modal"

interface PageProps {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined
  }>
}

const Page = async (props: PageProps) => {
  const searchParams = await props.searchParams;
  const auth = await currentUser()
  if (!auth) {
    redirect("/sign-in")
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.externalId, auth.id))
    .limit(1)

  if (!user) {
    redirect("/welcome")
  }

  const intent = searchParams.intent

  if (intent === "upgrade") {
    const session = await createCheckoutSession({
      userEmail: user.email,
      userId: user.id,
    })

    if (session.url) redirect(session.url)
  }

  const success = searchParams.success

  return (
    <>
      {success ? <PaymentSuccessModal /> : null}

      <DashboardPage
        cta={
          <CreateEventCategoryModal>
            <Button className="w-full sm:w-fit">
              <PlusIcon className="size-4 mr-2" />
              Add Category
            </Button>
          </CreateEventCategoryModal>
        }
        title="Dashboard"
      >
        <DashboardContent />
      </DashboardPage>
    </>
  )
}

export default Page
