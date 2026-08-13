import { db, users, webhookEvents } from "@/db"
import { stripe } from "@/lib/stripe"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import Stripe from "stripe"

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!secret) {
    console.error(
      "[stripe] STRIPE_WEBHOOK_SECRET is not set. Run `npm run stripe:listen` and copy the whsec_... it prints."
    )
    return new Response("Webhook secret not configured", { status: 500 })
  }

  const body = await req.text()
  const signature = (await headers()).get("stripe-signature")

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, secret)
  } catch (err) {
    console.error("[stripe] signature verification failed", err)
    return new Response("Invalid signature", { status: 400 })
  }

  // Stripe retries any non-2xx, so a handler that is not idempotent runs
  // again. Claiming the id first means a duplicate delivery does nothing.
  const claimed = await db
    .insert(webhookEvents)
    .values({ id: event.id, type: event.type })
    .onConflictDoNothing()
    .returning({ id: webhookEvents.id })

  if (claimed.length === 0) {
    return new Response("Already processed")
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      const { userId } = session.metadata || { userId: null }

      if (!userId) {
        console.error("[stripe] checkout.session.completed without userId metadata")
        return new Response("Invalid Metadata", { status: 400 })
      }

      await db.update(users).set({ plan: "PRO" }).where(eq(users.id, userId))
    }

    // A refund or a won dispute means the customer no longer paid for Pro.
    // Without these the plan never returns to FREE.
    if (event.type === "charge.refunded" || event.type === "charge.dispute.created") {
      const charge =
        event.type === "charge.refunded"
          ? (event.data.object as Stripe.Charge)
          : ((event.data.object as Stripe.Dispute).charge as Stripe.Charge | string)

      const chargeId = typeof charge === "string" ? charge : charge.id
      const full = await stripe.charges.retrieve(chargeId)
      const userId = full.metadata?.userId

      if (!userId) {
        console.error(`[stripe] ${event.type} without userId metadata`, chargeId)
        return new Response("OK")
      }

      await db.update(users).set({ plan: "FREE" }).where(eq(users.id, userId))
    }
  } catch (error) {
    // Release the claim so Stripe's retry can have another go, otherwise a
    // transient failure would be swallowed by the idempotency check.
    await db.delete(webhookEvents).where(eq(webhookEvents.id, event.id))
    throw error
  }

  return new Response("OK")
}
