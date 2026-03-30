// cspell:ignore viewports
import { expect, test } from "../index.ts";

const NAV_MENU = "#navbar-default";

test.describe("navigation", () => {
  // The hamburger button is md:hidden — only visible on mobile viewports.
  // Playwright's Mobile Chrome / Mobile Safari projects cover this.
  test(
    "hamburger menu button toggles nav menu visibility",
    { tag: "@mobile" },
    async ({ axePage }) => {
      await axePage.goto("/");

      const hamburgerButton = axePage.getByRole("button", {
        name: "Open main menu",
      });

      const navMenu = axePage.locator(NAV_MENU);

      await expect.soft(navMenu).toBeHidden();

      await hamburgerButton.click();
      await expect
        .soft(hamburgerButton)
        .toHaveAttribute("aria-expanded", "true");
      await expect.soft(navMenu).toBeVisible();

      await hamburgerButton.click();
      await expect
        .soft(hamburgerButton)
        .toHaveAttribute("aria-expanded", "false");
      await expect.soft(navMenu).toBeHidden();
    },
  );
});
