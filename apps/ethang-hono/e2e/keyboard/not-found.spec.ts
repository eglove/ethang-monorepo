import { expect, test } from "@playwright/test";

test.describe("404 page — keyboard user", () => {
  test("404 heading is visible and nav links are keyboard accessible", async ({
    page,
  }) => {
    await page.goto("/this-route-does-not-exist");

    await expect(
      page.getByRole("heading", { name: "404 Not Found" }),
    ).toBeVisible();

    // The 404 page has no page-specific interactive elements, but the nav
    // links (Home, Blog, Tips, Courses) must be keyboard accessible.
    const homeNavLink = page.getByRole("link", { name: "Home" });
    await homeNavLink.focus();
    await expect(homeNavLink).toBeFocused();
  });
});
