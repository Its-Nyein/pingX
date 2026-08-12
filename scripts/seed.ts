import "dotenv/config"

import { db, eventCategories, events, users } from "@/db"
import { auth } from "@/lib/auth"
import { and, eq } from "drizzle-orm"

const SEED_EMAIL = process.env.SEED_EMAIL ?? "demo@pingx.local"
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "Demo1234!@#"
const SEED_NAME = "pingX Demo"

const CATEGORIES = [
  { name: "sale", emoji: "💰" },
  { name: "sign-up", emoji: "🎉" },
  { name: "error", emoji: "🚨" },
] as const

type CategoryName = (typeof CATEGORIES)[number]["name"]

const EVENT_SHAPES: Record<CategoryName, () => Record<string, string | number | boolean>> = {
  sale: () => ({
    plan: pick(["PRO", "PRO", "LIFETIME"]),
    amount: Number((Math.random() * 90 + 10).toFixed(2)),
    email: `customer${rand(1, 400)}@example.com`,
    currency: "USD",
  }),
  "sign-up": () => ({
    email: `user${rand(1, 900)}@example.com`,
    source: pick(["organic", "twitter", "referral", "producthunt"]),
    verified: Math.random() > 0.3,
  }),
  error: () => ({
    message: pick([
      "Timeout contacting upstream",
      "Rate limit exceeded",
      "Invalid webhook signature",
      "Database connection reset",
    ]),
    statusCode: pick([500, 502, 504, 429]),
    path: pick(["/api/v1/events", "/api/webhooks/stripe", "/dashboard"]),
  }),
}

const EVENT_COUNT = 50
const SPREAD_DAYS = 60

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(xs: readonly T[]): T {
  return xs[Math.floor(Math.random() * xs.length)]
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error(
      "Refusing to seed: NODE_ENV=production. This script writes demo data."
    )
    process.exit(1)
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env first.")
    process.exit(1)
  }

  console.log(`Seeding as ${SEED_EMAIL}\n`)

  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, SEED_EMAIL))
    .limit(1)

  let createdUser = false

  if (!user) {
    await auth.api.signUpEmail({
      body: { name: SEED_NAME, email: SEED_EMAIL, password: SEED_PASSWORD },
    })

    ;[user] = await db
      .select()
      .from(users)
      .where(eq(users.email, SEED_EMAIL))
      .limit(1)

    createdUser = true
  }

  if (!user) {
    console.error("Could not create or find the seed user.")
    process.exit(1)
  }

  console.log(`${createdUser ? "Created" : "Reusing"} user ${user.id}`)

  for (const { name } of CATEGORIES) {
    await db
      .insert(eventCategories)
      .values({ name, userId: user.id })
      .onConflictDoNothing()
  }

  const categories = await db
    .select()
    .from(eventCategories)
    .where(eq(eventCategories.userId, user.id))

  console.log(`Categories: ${categories.map((c) => c.name).join(", ")}`)

  const existing = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.userId, user.id))
    .limit(1)

  if (existing.length > 0) {
    console.log("Events already present — skipping event generation.\n")
  } else {
    const rows = Array.from({ length: EVENT_COUNT }, () => {
      const category = pick(categories)
      const shape = EVENT_SHAPES[category.name as CategoryName] ?? EVENT_SHAPES.sale
      const data = shape()

      const createdAt = new Date(
        Date.now() - rand(0, SPREAD_DAYS) * 86_400_000 - rand(0, 86_399) * 1000
      )

      const failureRate = category.name === "error" ? 0.4 : 0.12

      return {
        name: category.name,
        data,
        deliveryStatus: (Math.random() < failureRate
          ? "FAILED"
          : "DELIVERED") as "FAILED" | "DELIVERED",
        userId: user!.id,
        eventCategoryId: category.id,
        createdAt,
        updatedAt: createdAt,
      }
    })

    await db.insert(events).values(rows)

    const failed = rows.filter((r) => r.deliveryStatus === "FAILED").length
    console.log(
      `Events: ${rows.length} over ${SPREAD_DAYS} days (${
        rows.length - failed
      } delivered, ${failed} failed)\n`
    )
  }

  console.log("─".repeat(56))
  console.log("  Sign in     ", SEED_EMAIL)
  console.log("  Password    ", SEED_PASSWORD)
  console.log("  API key     ", user.apiKey)
  console.log("─".repeat(56))
  console.log(`
Try the ingestion API:

  curl -X POST http://localhost:3000/api/v1/events \\
    -H "Authorization: Bearer ${user.apiKey}" \\
    -H "Content-Type: application/json" \\
    -d '{"category":"sale","data":{"plan":"PRO","amount":52.99}}'

Delivery needs a Discord bot token and your Discord ID in account settings —
see the README. Without it the event is stored and marked FAILED.
`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nSeed failed:", error)
    process.exit(1)
  })
