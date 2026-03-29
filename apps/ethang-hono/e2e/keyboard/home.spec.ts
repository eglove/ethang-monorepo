import { expect, test } from "@playwright/test";

test.describe("home page — keyboard user", () => {
  test("all links are keyboard accessible", async ({ page }) => {
    await page.goto("/");

    const allLinks = page.getByRole("link");
    const count = await allLinks.count();

    for (let index = 0; index < count; index++) {
      await allLinks.nth(index).focus();
      await expect(allLinks.nth(index)).toBeFocused();
    }
  });
});
