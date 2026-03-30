import { expect, test } from "@playwright/test";

const NOT_FOUND_ROUTE = "/this-route-does-not-exist";
const OPEN_MAIN_MENU = "Open main menu";

test.describe("404 page — keyboard user", () => {
  test("404 heading is visible", async ({ page }) => {
    await page.goto(NOT_FOUND_ROUTE);

    await expect
      .soft(page.getByRole("heading", { name: "404 Not Found" }))
      .toBeVisible();
  });

  test(
    "nav links are keyboard accessible",
    { tag: "@desktop" },
    async ({ page }) => {
      await page.goto(NOT_FOUND_ROUTE);

      const homeNavLink = page.getByRole("link", { name: "Home" });
      await homeNavLink.focus();
      await expect.soft(homeNavLink).toBeFocused();
    },
  );

  test(
    "nav links are keyboard accessible on mobile",
    { tag: "@mobile" },
    async ({ page }) => {
      await page.goto(NOT_FOUND_ROUTE);

      await page.getByRole("button", { name: OPEN_MAIN_MENU }).click();

      const homeNavLink = page.getByRole("link", { name: "Home" });
      await homeNavLink.focus();
      await expect.soft(homeNavLink).toBeFocused();
    },
  );
});
