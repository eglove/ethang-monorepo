import { expect, test } from "@playwright/test";

import { routes } from "../../routes.ts";
import {
  mockSignInError,
  mockSignInSuccess,
} from "../helpers/courses-auth-helpers.ts";

const SIGN_IN_ERROR = "#sign-in-error";

test.describe("sign-in page — keyboard user", () => {
  test("email field is focusable", async ({ page }) => {
    await page.goto(routes.signIn);
    await page.getByLabel("Email").focus();
    await expect.soft(page.getByLabel("Email")).toBeFocused();
  });

  test("password field receives focus after email on Tab", async ({ page }) => {
    await page.goto(routes.signIn);
    await page.getByLabel("Email").focus();
    await page.keyboard.press("Tab");
    await expect.soft(page.getByLabel("Password")).toBeFocused();
  });

  test("submit button receives focus after password on Tab", async ({
    page,
  }) => {
    await page.goto(routes.signIn);
    await page.getByLabel("Password").focus();
    await page.keyboard.press("Tab");
    await expect
      .soft(page.getByRole("button", { name: "Submit" }))
      .toBeFocused();
  });

  test.describe("submit button key activation", () => {
    test.beforeEach(async ({ page }) => {
      await mockSignInSuccess(page);
      await page.goto(routes.signIn, { waitUntil: "load" });
      // eslint-disable-next-line lodash/prefer-lodash-method
      await page.getByLabel("Email").fill("test@example.com");
      // eslint-disable-next-line lodash/prefer-lodash-method
      await page.getByLabel("Password").fill("password");
      await page.getByRole("button", { name: "Submit" }).focus();
    });

    test("enter submits the form", async ({ page }) => {
      await page.keyboard.press("Enter");
      await expect.soft(page).toHaveURL(/courses/u);
    });

    test("space submits the form", async ({ page }) => {
      await page.keyboard.press("Space");
      await expect.soft(page).toHaveURL(/courses/u);
    });
  });

  test("error message is in the DOM and readable after failed login", async ({
    page,
  }) => {
    await mockSignInError(page);

    await page.goto(routes.signIn);
    // eslint-disable-next-line lodash/prefer-lodash-method
    await page.getByLabel("Email").fill("bad@example.com");
    // eslint-disable-next-line lodash/prefer-lodash-method
    await page.getByLabel("Password").fill("wrong");
    await page.getByRole("button", { name: "Submit" }).click();

    const errorElement = page.locator(SIGN_IN_ERROR);
    await expect.soft(errorElement).toBeVisible();
    await expect.soft(errorElement).toHaveText("Failed to sign in");
  });
});
