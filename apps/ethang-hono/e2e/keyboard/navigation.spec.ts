// cspell:ignore viewports
import { expect, test } from "@playwright/test";

const ARIA_EXPANDED = "aria-expanded";
const HAMBURGER_BUTTON_NAME = "Open main menu";
const MOBILE_ONLY_MESSAGE = "Hamburger menu only appears on mobile viewports";
const NAV_MENU = "#navbar-default";

test.describe("navigation hamburger menu — keyboard user (mobile)", () => {
  test("hamburger button is focusable and toggles menu with Enter", async ({
    isMobile,
    page,
  }) => {
    test.skip(!isMobile, MOBILE_ONLY_MESSAGE);

    await page.goto("/");

    const hamburgerButton = page.getByRole("button", {
      name: HAMBURGER_BUTTON_NAME,
    });
    await hamburgerButton.focus();
    await expect(hamburgerButton).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(hamburgerButton).toHaveAttribute(ARIA_EXPANDED, "true");
    await expect(page.locator(NAV_MENU)).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(hamburgerButton).toHaveAttribute(ARIA_EXPANDED, "false");
    await expect(page.locator(NAV_MENU)).toBeHidden();
  });

  test("hamburger button toggles menu with Space", async ({
    isMobile,
    page,
  }) => {
    test.skip(!isMobile, MOBILE_ONLY_MESSAGE);

    await page.goto("/");

    const hamburgerButton = page.getByRole("button", {
      name: HAMBURGER_BUTTON_NAME,
    });
    await hamburgerButton.focus();
    await page.keyboard.press("Space");
    await expect(hamburgerButton).toHaveAttribute(ARIA_EXPANDED, "true");
    await expect(page.locator(NAV_MENU)).toBeVisible();
  });
});
