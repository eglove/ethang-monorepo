import { expect, test } from "./fixtures.ts";

test.describe("Trustees Page", () => {
  test("renders title and navigation", async ({ page }) => {
    await page.goto("/trustees");

    await expect(page).toHaveTitle("Sterett Creek Village Trustee | Trustees");
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("renders heading", async ({ page }) => {
    await page.goto("/trustees");

    await expect(page.getByRole("heading", { name: "Trustees" })).toBeVisible();
  });

  test("renders trustee cards", async ({ page }) => {
    await page.goto("/trustees");

    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator(".grid")).toBeVisible();
  });
});
