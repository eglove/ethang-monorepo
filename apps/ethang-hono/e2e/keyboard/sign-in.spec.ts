import { expect, test } from "@playwright/test";

import { routes } from "../../routes.ts";

const AUTH_SIGN_UP_URL = "https://auth.ethang.dev/sign-up";
const MOCK_TOKEN = "mock-token";
const CONTENT_TYPE_JSON = "application/json";

test.describe("sign-in page — keyboard user", () => {
  test("email field is first focusable element", async ({ page }) => {
    await page.goto(routes.signIn);
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Email")).toBeFocused();
  });

  test("password field receives focus after email on Tab", async ({ page }) => {
    await page.goto(routes.signIn);
    await page.getByLabel("Email").focus();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Password")).toBeFocused();
  });

  test("submit button receives focus after password on Tab", async ({ page }) => {
    await page.goto(routes.signIn);
    await page.getByLabel("Password").focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Submit" })).toBeFocused();
  });

  test("Enter on submit button submits the form", async ({ page }) => {
    await page.context().route(AUTH_SIGN_UP_URL, async (route) =>
      route.fulfill({
        body: JSON.stringify({ sessionToken: MOCK_TOKEN }),
        contentType: CONTENT_TYPE_JSON,
        status: 200,
      }),
    );

    await page.goto(routes.signIn);
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: "Submit" }).focus();
    await page.keyboard.press("Enter");

    await page.waitForURL("**/courses");
  });

  test("Space on submit button submits the form", async ({ page }) => {
    await page.context().route(AUTH_SIGN_UP_URL, async (route) =>
      route.fulfill({
        body: JSON.stringify({ sessionToken: MOCK_TOKEN }),
        contentType: CONTENT_TYPE_JSON,
        status: 200,
      }),
    );

    await page.goto(routes.signIn);
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: "Submit" }).focus();
    await page.keyboard.press("Space");

    await page.waitForURL("**/courses");
  });

  test("error message is in the DOM and readable after failed login", async ({ page }) => {
    await page.context().route(AUTH_SIGN_UP_URL, async (route) =>
      route.fulfill({ status: 401 }),
    );

    await page.goto(routes.signIn);
    await page.getByLabel("Email").fill("bad@example.com");
    await page.getByLabel("Password").fill("wrong");
    await page.getByRole("button", { name: "Submit" }).click();

    const errorEl = page.locator("#sign-in-error");
    await expect(errorEl).toBeVisible();
    await expect(errorEl).toHaveText("Failed to sign in");
  });
});
