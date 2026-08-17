import { expect, test } from "@playwright/test"

test.use({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
})

const AUTH_PAGES = ["/sign-in", "/sign-up"]

test.describe("iOS does not zoom the page when a field is focused", () => {
  for (const path of AUTH_PAGES) {
    test(`every input on ${path} is at least 16px on a touch device`, async ({
      page,
    }) => {
      await page.goto(path)

      const sizes = await page
        .locator("input")
        .evaluateAll((inputs) =>
          (inputs as HTMLInputElement[]).map((input) => ({
            name: input.getAttribute("name") ?? input.type,
            fontSize: parseFloat(getComputedStyle(input).fontSize),
          }))
        )

      expect(sizes.length).toBeGreaterThan(0)

      for (const { name, fontSize } of sizes) {
        expect(
          fontSize,
          `${name} is ${fontSize}px; iOS Safari zooms the page when a focused field is under 16px`
        ).toBeGreaterThanOrEqual(16)
      }
    })
  }

  test("focusing a field does not push the layout wider than the screen", async ({
    page,
  }) => {
    await page.goto("/sign-in")

    await page.getByRole("textbox", { name: "Email" }).click()

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )

    expect(overflow).toBe(0)
  })

  test("a small text utility on a field cannot reintroduce the zoom", async ({
    page,
  }) => {
    await page.goto("/sign-in")

    const sizes = await page.evaluate(() =>
      ["text-xs", "text-sm", "text-base"].map((className) => {
        const input = document.createElement("input")
        input.className = className
        document.body.appendChild(input)
        const fontSize = parseFloat(getComputedStyle(input).fontSize)
        input.remove()
        return { className, fontSize }
      })
    )

    for (const { className, fontSize } of sizes) {
      expect(
        fontSize,
        `an input carrying ${className} computes to ${fontSize}px on a phone`
      ).toBeGreaterThanOrEqual(16)
    }
  })
})
