import { expect, test } from "@playwright/test";

import { routes } from "../../routes.ts";
import {
  mockSignInError,
  mockSignInSuccess,
} from "../helpers/courses-auth-helpers.ts";

test.describe("sign-in page — keyboard user", () => {
  test("email field is focusable", async ({ page }) => {
    await page.goto(routes.signIn);
    await page.getByLabel("Email").focus();
    await expect(page.getByLabel("Email")).toBeFocused();
  });

  test("password field receives focus after email on Tab", async ({ page }) => {
    await page.goto(routes.signIn);
    await page.getByLabel("Email").focus();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Password")).toBeFocused();
  });

  test("submit button receives focus after password on Tab", async ({
    page,
  }) => {
    await page.goto(routes.signIn);
    await page.getByLabel("Password").focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Submit" })).toBeFocused();
  });

  test.describe("submit button key activation", () => {
    test.beforeEach(async ({ page }) => {
      await mockSignInSuccess(page);
      await page.goto(routes.signIn, { waitUntil: "networkidle" });
      await page.getByLabel("Email").fill("test@example.com");
      await page.getByLabel("Password").fill("password");
      await page.getByRole("button", { name: "Submit" }).focus();
    });

    test("Enter submits the form", async ({ page }) => {
      await page.keyboard.press("Enter");
      await page.waitForURL("**/courses");
    });

    test("Space submits the form", async ({ page }) => {
      await page.keyboard.press("Space");
      await page.waitForURL("**/courses");
    });
  });

  test("error message is in the DOM and readable after failed login", async ({
    page,
  }) => {
    await mockSignInError(page);

    await page.goto(routes.signIn);
    await page.getByLabel("Email").fill("bad@example.com");
    await page.getByLabel("Password").fill("wrong");
    await page.getByRole("button", { name: "Submit" }).click();

    const errorElement = page.locator("#sign-in-error");
    await expect(errorElement).toBeVisible();
    await expect(errorElement).toHaveText("Failed to sign in");
  });
});
