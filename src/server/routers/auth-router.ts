import { router } from "../__internals/router";
import { publicProcedure } from "../procedures";

export const authRouter = router({
    getDatabaseSyncStatus: publicProcedure.query(({c}) => {
        console.log("Received request for getDatabaseSyncStatus");
        return c.json({ status: "success"})
    })
})