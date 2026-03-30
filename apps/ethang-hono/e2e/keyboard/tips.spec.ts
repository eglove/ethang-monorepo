import { expect, test } from "@playwright/test";

import { routes } from "../../routes.ts";

const SCROLL_CONTAINERS_TITLE = "Easy Sticky Header/Footer";

test.describe("tips page — keyboard user", () => {
  test("tip links are keyboard accessible and navigable with Enter", async ({
    page,
  }) => {
    await page.goto(routes.tips);

    const scrollContainersLink = page.getByRole("link", {
      name: SCROLL_CONTAINERS_TITLE,
    });
    await scrollContainersLink.focus();
    await expect.soft(scrollContainersLink).toBeFocused();
    await page.keyboard.press("Enter");

    await expect
      .soft(page.getByRole("heading", { name: SCROLL_CONTAINERS_TITLE }))
      .toBeVisible();
  });
});
