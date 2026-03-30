import { expect, test } from "@playwright/test";

import { routes } from "../../routes.ts";

test.describe("blog listing page — keyboard user", () => {
  test("rss Feed link is keyboard accessible", async ({ page }) => {
    await page.goto(routes.blog);

    const rssLink = page.getByRole("link", { name: "RSS Feed" });
    await rssLink.focus();
    await expect.soft(rssLink).toBeFocused();
  });

  test("blog post links are keyboard accessible", async ({ page }) => {
    await page.goto(routes.blog);

    const firstPostLink = page.locator(`a[href^="${routes.blog}/"]`).first();
    await firstPostLink.focus();
    await expect.soft(firstPostLink).toBeFocused();
    await page.keyboard.press("Enter");

    await expect.soft(page).toHaveURL(new RegExp(`${routes.blog}/`, "u"));
  });
});
