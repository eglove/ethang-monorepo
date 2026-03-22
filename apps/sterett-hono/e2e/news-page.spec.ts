import { expect, test } from "./fixtures.ts";

test.describe("News Page", () => {
  test("renders title and navigation", async ({ page }) => {
    await page.goto("/news");

    await expect(page).toHaveTitle("Sterett Creek Village Trustee | News");
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("renders heading", async ({ page }) => {
    await page.goto("/news");

    await expect(
      page.getByRole("heading", { name: "News & Events" }),
    ).toBeVisible();
  });

  test("renders content or empty state", async ({ page }) => {
    await page.goto("/news");

    const items = page.locator("main .rounded-xl");
    const hasItems = 0 < (await items.count());

    await (hasItems
      ? expect(items.first()).toBeVisible()
      : expect(page.getByText("No upcoming news or events.")).toBeVisible());
  });
});
