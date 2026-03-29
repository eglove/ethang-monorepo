import { expect, test } from "./fixtures.ts";

const MAIN = "main";
const GRID = ".grid";

test.describe("trustees Page", () => {
  test("renders title and navigation", async ({ page }) => {
    await page.goto("/trustees");

    await expect
      .soft(page)
      .toHaveTitle("Sterett Creek Village Trustee | Trustees");
    await expect.soft(page.getByRole("navigation")).toBeVisible();
  });

  test("renders heading", async ({ page }) => {
    await page.goto("/trustees");

    await expect
      .soft(page.getByRole("heading", { name: "Trustees" }))
      .toBeVisible();
  });

  test("renders trustee cards", async ({ page }) => {
    await page.goto("/trustees");

    await expect.soft(page.locator(MAIN)).toBeVisible();
    await expect.soft(page.locator(GRID)).toBeVisible();
  });
});
