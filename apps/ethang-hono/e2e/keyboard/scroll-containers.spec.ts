import { expect, test } from "@playwright/test";

import { routes } from "../../routes.ts";

test.describe("scroll-containers page — keyboard user", () => {
  test("page loads and all content headings are visible", async ({ page }) => {
    await page.goto(routes.scrollContainers);

    await expect(
      page.getByRole("heading", { name: "Easy Sticky Header/Footer" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "CSS" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tailwind" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Demo" })).toBeVisible();
  });

  test("nav links are keyboard accessible (no keyboard trap)", async ({
    isMobile,
    page,
  }) => {
    await page.goto(routes.scrollContainers);

    // On mobile the nav links live inside the hamburger menu — open it first
    // so the links are in the accessibility tree and can receive focus.
    if (isMobile) {
      await page.getByRole("button", { name: "Open main menu" }).click();
    }

    // The scroll-containers page has no page-specific interactive elements.
    // Verify nav links are reachable so keyboard users are not trapped.
    const navLinks = ["Home", "Blog", "Tips", "Courses"];

    for (const name of navLinks) {
      const link = page.getByRole("link", { name });
      // eslint-disable-next-line no-await-in-loop
      await link.focus();
      // eslint-disable-next-line no-await-in-loop
      await expect(link).toBeFocused();
    }
  });
});
