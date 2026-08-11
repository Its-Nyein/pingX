import { db, users } from "@/db"
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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    const { userId } = session.metadata || { userId: null }

    if (!userId) {
      console.error("[stripe] checkout.session.completed without userId metadata")
      return new Response("Invalid Metadata", { status: 400 })
    }

    await db.update(users).set({ plan: "PRO" }).where(eq(users.id, userId))
  }

  return new Response("OK")
}
