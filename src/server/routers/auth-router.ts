import { currentUser } from "@clerk/nextjs/server";
import { router } from "../__internals/router";
import { publicProcedure } from "../procedures";
import { db } from "@/db";

export const dynamic = "force-dynamic"

export const authRouter = router({
    getDatabaseSyncStatus: publicProcedure.query(async ({c, ctx}) => {
        const auth = await currentUser();

        if(!auth) {
            return c.json({isSynced: false})
        }

        // important await it ensures the database operation completes before moving on to the next steps. 
        // Without it, Prisma won't wait for the query to resolve and will move forward, leading to unexpected behavior.
        const user = await db.user.findFirst({
            where: {externalId: auth.id}
        })

        if(!user) {
            await db.user.create({
                data: {
                    quotoaLimit: 100,
                    externalId: auth.id,
                    email: auth.emailAddresses[0].emailAddress
                }
            })
            return c.json({isSynced: true})
        }
        return c.json({isSynced: true})
    })
})