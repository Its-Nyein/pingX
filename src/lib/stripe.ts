import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-07-29.dahlia",
  typescript: true,
})

const PRO_PRICE_ID = "price_1R46flH9ZLlYLuqEkG89YAb2"

export const createCheckoutSession = async ({
  userEmail,
  userId,
}: {
  userEmail: string
  userId: string
}) => {
  const price = process.env.STRIPE_PRICE_ID ?? PRO_PRICE_ID

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "")

  if (!appUrl) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL is not set. Stripe rejects a checkout session whose success_url is not an absolute URL."
    )
  }

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price,
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${appUrl}/dashboard?success=true`,
    cancel_url: `${appUrl}/pricing`,
    customer_email: userEmail,
    metadata: {
      userId,
    },
    // Session metadata does not reach the charge. A PaymentIntent copies its
    // metadata to the charge it creates, so the refund and dispute webhooks
    // need it set here to know whose plan to downgrade.
    payment_intent_data: {
      metadata: {
        userId,
      },
    },
  })

  return session
}
