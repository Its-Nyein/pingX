import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
})

export const createCheckoutSession = async ({
  userEmail,
  userId,
}: {
  userEmail: string
  userId: string
}) => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "")
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: "price_1R46flH9ZLlYLuqEkG89YAb2",
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
  })

  return session
}
