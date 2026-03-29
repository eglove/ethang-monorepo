import { expect, test } from "@playwright/test";

test.describe("home page — keyboard user", () => {
  test("all links are keyboard accessible", async ({ page }) => {
    await page.goto("/");

    const allLinks = page.getByRole("link");
    const count = await allLinks.count();

    for (let i = 0; i < count; i++) {
      await allLinks.nth(i).focus();
      await expect(allLinks.nth(i)).toBeFocused();
    }
  });
});
