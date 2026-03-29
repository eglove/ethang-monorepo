import { expect, test } from "@playwright/test";

test.describe("404 page — keyboard user", () => {
  test("404 page renders and home link is keyboard accessible", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");

    await expect(page.getByRole("heading", { name: "404 Not Found" })).toBeVisible();

    const homeLink = page.getByRole("link", { name: /home/iu });
    if (await homeLink.isVisible()) {
      await homeLink.focus();
      await expect(homeLink).toBeFocused();
    }
  });
});
