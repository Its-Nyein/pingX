import DashboardPage from "@/components/dashboard-page";
import { db, eventCategories, events } from "@/db";
import { getCurrentUser } from "@/lib/session";
import { and, count, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CategoryPageContent } from "./category-page-content";

interface PageProps {
    params: Promise<{
        name: string | string[] | undefined;
    }>
}

const Page = async (props: PageProps) => {
    const params = await props.params;

    if(typeof params.name !== 'string') {
        return notFound();
    }

    const user = await getCurrentUser();
    if(!user) {
        return notFound();
    }

    const [category] = await db
        .select()
        .from(eventCategories)
        .where(
            and(
                eq(eventCategories.name, params.name),
                eq(eventCategories.userId, user.id)
            )
        )
        .limit(1)

    if(!category) {
        return notFound();
    }

    const [{ value: eventsCount }] = await db
        .select({ value: count() })
        .from(events)
        .where(eq(events.eventCategoryId, category.id))

    const hasEvents = eventsCount > 0;

    return (
        <DashboardPage title={`${category.name} events`}>
            <CategoryPageContent hasEvents={hasEvents} category={category}/>
        </DashboardPage>
    )
}

export default Page
