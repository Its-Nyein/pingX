import DashboardPage from "@/components/dashboard-page";
import { db } from "@/db";
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation";
import { DashboardContent } from "./dashboard-content";

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
        <DashboardContent/>
    </DashboardPage>
  )
}

export default Page