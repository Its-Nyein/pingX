import DashboardPage from "@/components/dashboard-page";
import { db } from "@/db";
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation";

const Page = async () => {

    const auth = await currentUser();
    if(!auth) {
        redirect("/sign-in")
    }

    const user = db.user.findUnique({
        where: {
            externalId: auth.id
        }
    })
    if(!user) {
        redirect("/welcome")
    }

  return (
    <DashboardPage title="Dashboard">
        Welcome to dashboard
    </DashboardPage>
  )
}

export default Page