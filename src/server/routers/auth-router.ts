import { currentUser } from "@clerk/nextjs/server";
import { router } from "../__internals/router";
import { publicProcedure } from "../procedures";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic"

export const authRouter = router({
    getDatabaseSyncStatus: publicProcedure.query(async ({c, ctx}) => {
        const auth = await currentUser();

        if(!auth) {
            return c.json({isSynced: false})
        }

        // important await it ensures the database operation completes before moving on to the next steps.
        // Without it, the query won't have resolved before the next step runs, leading to unexpected behavior.
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.externalId, auth.id))
            .limit(1)

        if(!user) {
            await db.insert(users).values({
                quotoaLimit: 100,
                externalId: auth.id,
                email: auth.emailAddresses[0].emailAddress
            })
            return c.json({isSynced: true})
        }
        return c.json({isSynced: true})
    })
})