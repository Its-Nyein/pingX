import { expect, test } from "@playwright/test"

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
      // No Discord ID on the account, so delivery cannot be attempted. The
      // button must explain itself rather than fail silently.
      await expect(page.getByRole("link", { name: /add your discord id/i })).toBeVisible()
      return
    }

    await sendTest.click()

    await expect(
      page.getByText(/test event delivered|couldn't send the test event/i)
    ).toBeVisible({ timeout: 20_000 })

    await page.reload()

    await expect(page.getByRole("table")).toBeVisible({ timeout: 20_000 })
    await expect(
      page.getByText(/delivered|failed/i).first()
    ).toBeVisible()
  })
})
