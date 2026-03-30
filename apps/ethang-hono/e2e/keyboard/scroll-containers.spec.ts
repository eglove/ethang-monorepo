import { expect, test } from "@playwright/test";

import { routes } from "../../routes.ts";

const NAV_LINKS = ["Home", "Blog", "Tips", "Courses"];
const OPEN_MAIN_MENU = "Open main menu";

test.describe("scroll-containers page — keyboard user", () => {
  test("page loads and all content headings are visible", async ({ page }) => {
    await page.goto(routes.scrollContainers);

    await expect
      .soft(page.getByRole("heading", { name: "Easy Sticky Header/Footer" }))
      .toBeVisible();
    await expect.soft(page.getByRole("heading", { name: "CSS" })).toBeVisible();
    await expect
      .soft(page.getByRole("heading", { name: "Tailwind" }))
      .toBeVisible();
    await expect
      .soft(page.getByRole("heading", { name: "Demo" }))
      .toBeVisible();
  });

  test(
    "nav links are keyboard accessible (no keyboard trap)",
    { tag: "@desktop" },
    async ({ page }) => {
      await page.goto(routes.scrollContainers);

      for (const name of NAV_LINKS) {
        const link = page.getByRole("link", { name });
        // eslint-disable-next-line no-await-in-loop
        await link.focus();
        // eslint-disable-next-line no-await-in-loop
        await expect.soft(link).toBeFocused();
      }
    },
  );

  test(
    "nav links are keyboard accessible on mobile (no keyboard trap)",
    { tag: "@mobile" },
    async ({ page }) => {
      await page.goto(routes.scrollContainers);

      await page.getByRole("button", { name: OPEN_MAIN_MENU }).click();

      for (const name of NAV_LINKS) {
        const link = page.getByRole("link", { name });
        // eslint-disable-next-line no-await-in-loop
        await link.focus();
        // eslint-disable-next-line no-await-in-loop
        await expect.soft(link).toBeFocused();
      }
    },
  );
});
