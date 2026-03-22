import { expect, test } from "./fixtures.ts";

test.describe("Homepage", () => {
  test("renders title and navigation", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle("Sterett Creek Village Trustee | Home");
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "News" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Calendar" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Files" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Trustees" })).toBeVisible();
  });

  test("renders main content area", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator(".prose")).toBeVisible();
  });
});
