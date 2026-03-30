// cspell:ignore viewports
import { expect, test } from "@playwright/test";

const ARIA_EXPANDED = "aria-expanded";
const HAMBURGER_BUTTON_NAME = "Open main menu";
const NAV_MENU = "#navbar-default";

test.describe("navigation hamburger menu — keyboard user (mobile)", () => {
  test(
    "hamburger button is focusable and toggles menu with Enter",
    { tag: "@mobile" },
    async ({ page }) => {
      await page.goto("/");

      const hamburgerButton = page.getByRole("button", {
        name: HAMBURGER_BUTTON_NAME,
      });
      await hamburgerButton.focus();
      await expect.soft(hamburgerButton).toBeFocused();

      await page.keyboard.press("Enter");
      await expect.soft(hamburgerButton).toHaveAttribute(ARIA_EXPANDED, "true");
      await expect.soft(page.locator(NAV_MENU)).toBeVisible();

      await page.keyboard.press("Enter");
      await expect
        .soft(hamburgerButton)
        .toHaveAttribute(ARIA_EXPANDED, "false");
      await expect.soft(page.locator(NAV_MENU)).toBeHidden();
    },
  );

  test(
    "hamburger button toggles menu with Space",
    { tag: "@mobile" },
    async ({ page }) => {
      await page.goto("/");

      const hamburgerButton = page.getByRole("button", {
        name: HAMBURGER_BUTTON_NAME,
      });
      await hamburgerButton.focus();
      await page.keyboard.press("Space");
      await expect.soft(hamburgerButton).toHaveAttribute(ARIA_EXPANDED, "true");
      await expect.soft(page.locator(NAV_MENU)).toBeVisible();
    },
  );
});
