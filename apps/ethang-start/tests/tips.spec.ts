import forEach from "lodash/forEach.js";

import { expect, test } from "./fixtures.ts";

const TIPS_URL = "/tips";

test.describe("Tips index — structure", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TIPS_URL);
  });

  test("has the expected document title", async ({ page }) => {
    await expect(page.title()).resolves.toBe("EthanG");
  });

  test("renders a main landmark", async ({ page }) => {
    const main = page.getByRole("main");
    await expect(main).toBeVisible();
  });

  test("displays the Tips heading", async ({ page }) => {
    const heading = page.getByRole("heading", { level: 1, name: "Tips" });
    await expect(heading).toBeVisible();
  });

  test("marks the Tips navigation link as active", async ({ page }) => {
    const tipsLink = page.getByRole("link", { name: "Tips" });
    await expect(tipsLink).toBeVisible();
    await expect(tipsLink).toHaveAttribute("href", TIPS_URL);
  });
});

test.describe("Tips index — tip links", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TIPS_URL);
  });

  forEach(
    [
      { href: "/tips/scroll-containers", name: "Easy Sticky Header/Footer" },
      { href: "/tips/scrollbar-gutter", name: "scrollbar-gutter" }
    ] as const,
    ({ href, name }) => {
      test(`shows the '${name}' tip link`, async ({ page }) => {
        const link = page.getByRole("link", { name });
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute("href", href);
      });
    }
  );
});
