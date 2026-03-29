import { expect, test } from "@playwright/test";

import { routes } from "../../routes.ts";

const WITH_EXAMPLE = "#scrollbar-gutter-with-example";
const WITHOUT_EXAMPLE = "#scrollbar-gutter-without-example";
const SHOW_EXTRA_CONTENT = "Show extra content";

test.describe("scrollbar-gutter page — keyboard user", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(routes.scrollbarGutter);
  });

  test("Show extra content button is focusable", async ({ page }) => {
    const button = page.getByRole("button", { name: SHOW_EXTRA_CONTENT });
    await button.focus();
    await expect(button).toBeFocused();
  });

  test("Enter on show button reveals demo content", async ({ page }) => {
    const button = page.getByRole("button", { name: SHOW_EXTRA_CONTENT });
    await button.focus();
    await page.keyboard.press("Enter");

    await expect(page.locator(WITH_EXAMPLE)).toBeVisible();
    await expect(page.locator(WITHOUT_EXAMPLE)).toBeVisible();
  });

  test("Space on show button reveals demo content", async ({ page }) => {
    const button = page.getByRole("button", { name: SHOW_EXTRA_CONTENT });
    await button.focus();
    await page.keyboard.press("Space");

    await expect(page.locator(WITH_EXAMPLE)).toBeVisible();
    await expect(page.locator(WITHOUT_EXAMPLE)).toBeVisible();
  });

  test("Enter on hide button hides demo content again", async ({ page }) => {
    await page.getByRole("button", { name: SHOW_EXTRA_CONTENT }).focus();
    await page.keyboard.press("Enter");

    const hideButton = page.getByRole("button", { name: "Hide extra content" });
    await hideButton.focus();
    await page.keyboard.press("Enter");

    await expect(page.locator(WITH_EXAMPLE)).toBeHidden();
    await expect(page.locator(WITHOUT_EXAMPLE)).toBeHidden();
  });
});
