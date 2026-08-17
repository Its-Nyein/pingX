import { expect, test } from "@playwright/test"
import "dotenv/config"
import { like } from "drizzle-orm"

import { db } from "../../src/db"
import { eventCategories } from "../../src/db/schema/event-categories"

const EMAIL = process.env.E2E_EMAIL ?? "demo@pingx.local"
const PASSWORD = process.env.E2E_PASSWORD ?? "Demo1234!@#"

const category = `e2e-${Date.now().toString(36)}`

test.describe("the whole loop", () => {
  test("sign in, create a category, send a test event, see it recorded", async ({
    page,
  }) => {
    await page.goto("/sign-in")

    await page.getByLabel("Email", { exact: true }).fill(EMAIL)
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD)
    await page.getByRole("button", { name: /sign in/i }).click()

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })

    await page.getByRole("button", { name: /create category/i }).first().click()
    await page.getByLabel("Name", { exact: true }).fill(category)
    await page.getByRole("button", { name: /^create$/i }).click()

    await expect(page.getByText(category).first()).toBeVisible({
      timeout: 15_000,
    })

    await page.goto(`/dashboard/category/${category}`)

    await expect(
      page.getByRole("heading", { name: new RegExp(`first ${category} event`, "i") })
    ).toBeVisible({ timeout: 15_000 })

    const sendTest = page.getByRole("button", { name: /send test event/i }).first()
    await expect(sendTest).toBeVisible()

    const disabled = await sendTest.isDisabled()

    if (disabled) {
      await expect(page.getByRole("link", { name: /add your discord id/i })).toBeVisible()
      return
    }

    await sendTest.click()

    await expect(
      page.getByText(/test event delivered|couldn't send the test event/i)
    ).toBeVisible({ timeout: 20_000 })

    await expect(page.getByRole("table")).toBeVisible({ timeout: 20_000 })
    await expect(
      page.getByText(/delivered|failed/i).first()
    ).toBeVisible()

    // The category is new, so one send means exactly one row. Counting rows
    // before sending raced the loading state, which renders five skeleton rows.
    const rows = page.locator("tbody tr")
    await expect(rows).toHaveCount(1, { timeout: 20_000 })

    await page.getByRole("button", { name: /send test event/i }).first().click()

    // No reload: the second event must reach the table on its own, whether or
    // not delivery succeeded. Test events are capped at five a minute, so a
    // repeated run can have this send refused before an event is ever stored.
    // That is the rate limiter working, not the bug this guards, so poll for
    // either outcome rather than racing the toast.
    let rateLimited = false

    await expect(async () => {
      rateLimited = (await page.getByText(/test events a minute/i).count()) > 0
      if (rateLimited) return
      expect(await rows.count()).toBe(2)
    }).toPass({ timeout: 20_000 })

    test.skip(rateLimited, "rate limited, so there is no second event to show")
  })

  // The demo account is on the free plan, so it has room for exactly one test
  // category. Cleaning up through the UI only worked when the test passed, so a
  // single failure left the account at its limit and blocked every later run.
  test.afterAll(async () => {
    await db.delete(eventCategories).where(like(eventCategories.name, "e2e-%"))
  })
})
