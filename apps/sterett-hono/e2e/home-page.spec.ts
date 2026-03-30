import { expect, test } from "./fixtures.ts";

const MAIN = "main";
const PROSE = ".prose";

test.describe("homepage", () => {
  test("renders title and navigation", async ({ page }) => {
    await page.goto("/");

    await expect.soft(page).toHaveTitle("Sterett Creek Village Trustee | Home");
    await expect.soft(page.getByRole("navigation")).toBeVisible();
    await expect.soft(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect.soft(page.getByRole("link", { name: "News" })).toBeVisible();
    await expect
      .soft(page.getByRole("link", { name: "Calendar" }))
      .toBeVisible();
  });

  test("renders navigation links", async ({ page }) => {
    await page.goto("/");

    await expect.soft(page.getByRole("link", { name: "Files" })).toBeVisible();
    await expect
      .soft(page.getByRole("link", { name: "Trustees" }))
      .toBeVisible();
  });

  test("renders main content area", async ({ page }) => {
    await page.goto("/");

    await expect.soft(page.locator(MAIN)).toBeVisible();
    await expect.soft(page.locator(PROSE)).toBeVisible();
  });
});
