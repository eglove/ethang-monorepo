import { expect, test } from "@playwright/test";

import { routes } from "../../routes.ts";

test.describe("scroll-containers page — keyboard user", () => {
  test("page loads and all content headings are reachable", async ({ page }) => {
    await page.goto(routes.scrollContainers);

    await expect(page.getByRole("heading", { name: "Easy Sticky Header/Footer" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "CSS" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tailwind" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Demo" })).toBeVisible();
  });
});
