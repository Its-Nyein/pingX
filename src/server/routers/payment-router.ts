import { createCheckoutSession, isBillingConfigured } from "@/lib/stripe";
import { HTTPException } from "hono/http-exception";
import { router } from "../__internals/router";
import { privateProcedure } from "../procedures";

export const paymentRouter = router({
    createCheckoutSession: privateProcedure.mutation(async({c, ctx}) => {
        if (!isBillingConfigured) {
            throw new HTTPException(503, {
                message: "Billing is not configured on this deployment."
            })
        }

        const {user} = ctx;

        const session = await createCheckoutSession({
            userEmail: user.email,
            userId: user.id
        })

        return c.json({url: session.url})
    }),

    getUserPlan: privateProcedure.query(async({c, ctx}) => {
        const { user } = ctx;
        return c.json({ plan: user.plan})
    })
})