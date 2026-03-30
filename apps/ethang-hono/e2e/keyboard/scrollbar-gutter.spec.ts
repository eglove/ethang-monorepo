import { expect, test } from "@playwright/test";

import { routes } from "../../routes.ts";

const WITH_EXAMPLE = "#scrollbar-gutter-with-example";
const WITHOUT_EXAMPLE = "#scrollbar-gutter-without-example";
const SHOW_EXTRA_CONTENT = "Show extra content";

test.describe("scrollbar-gutter page — keyboard user", () => {
  test("show extra content button is focusable", async ({ page }) => {
    await page.goto(routes.scrollbarGutter);
    const button = page.getByRole("button", { name: SHOW_EXTRA_CONTENT });
    await button.focus();
    await expect.soft(button).toBeFocused();
  });

  test("enter on show button reveals demo content", async ({ page }) => {
    await page.goto(routes.scrollbarGutter);
    const button = page.getByRole("button", { name: SHOW_EXTRA_CONTENT });
    await button.focus();
    await page.keyboard.press("Enter");

    await expect.soft(page.locator(WITH_EXAMPLE)).toBeVisible();
    await expect.soft(page.locator(WITHOUT_EXAMPLE)).toBeVisible();
  });

  test("space on show button reveals demo content", async ({ page }) => {
    await page.goto(routes.scrollbarGutter);
    const button = page.getByRole("button", { name: SHOW_EXTRA_CONTENT });
    await button.focus();
    await page.keyboard.press("Space");

    await expect.soft(page.locator(WITH_EXAMPLE)).toBeVisible();
    await expect.soft(page.locator(WITHOUT_EXAMPLE)).toBeVisible();
  });

  test("enter on hide button hides demo content again", async ({ page }) => {
    await page.goto(routes.scrollbarGutter);
    await page.getByRole("button", { name: SHOW_EXTRA_CONTENT }).focus();
    await page.keyboard.press("Enter");

    const hideButton = page.getByRole("button", { name: "Hide extra content" });
    await hideButton.focus();
    await page.keyboard.press("Enter");

    await expect.soft(page.locator(WITH_EXAMPLE)).toBeHidden();
    await expect.soft(page.locator(WITHOUT_EXAMPLE)).toBeHidden();
  });
});
