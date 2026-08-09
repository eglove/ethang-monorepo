import { expect, test } from "./fixtures.ts";

test("collects JS and CSS coverage on the home page", async ({ page }) => {
  await page.goto("http://localhost:3000");

  await expect(page.locator("title")).toContainText("ethang-start");

  // Trigger some interactions to increase JS execution paths
  const profileCard = page.getByRole("heading", { name: /profile/iu });
  await expect(profileCard).toBeVisible();
});
