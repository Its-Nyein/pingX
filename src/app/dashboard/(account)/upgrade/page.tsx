import DashboardPage from "@/components/dashboard-page";
import { requireUser } from "@/lib/session";
import { UpgradePageContent } from "./upgrade-page-content";

const Page = async () => {
    const user = await requireUser();

    return (
        <DashboardPage title="Pro Membership">
            <UpgradePageContent plan={user.plan}/>
        </DashboardPage>
    )
}

export default Page
