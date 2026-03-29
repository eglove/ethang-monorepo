// cspell:ignore viewports
import { expect, test } from "../index.ts";

// The hamburger button is md:hidden — only visible on mobile viewports.
// Playwright's Mobile Chrome / Mobile Safari projects cover this.
test("hamburger menu button toggles nav menu visibility", async ({
  axePage,
  isMobile,
}) => {
  test.skip(!isMobile, "Hamburger menu only appears on mobile viewports");

  await axePage.goto("/");

  const hamburgerButton = axePage.getByRole("button", {
    name: "Open main menu",
  });

  const navMenu = axePage.locator("#navbar-default");

  await expect(navMenu).toBeHidden();

  await hamburgerButton.click();
  await expect(hamburgerButton).toHaveAttribute("aria-expanded", "true");
  await expect(navMenu).toBeVisible();

  await hamburgerButton.click();
  await expect(hamburgerButton).toHaveAttribute("aria-expanded", "false");
  await expect(navMenu).toBeHidden();
});
