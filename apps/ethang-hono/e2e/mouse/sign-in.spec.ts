/* eslint-disable lodash/prefer-lodash-method -- Playwright Locator.fill() is not Array.prototype.fill */
import find from "lodash/find.js";

import { routes } from "../../routes.ts";
import {
  AUTH_SIGN_UP_URL,
  CONTENT_TYPE_JSON,
  MOCK_SESSION_TOKEN,
  mockSignInError,
  mockSignInSuccess,
  mockTrackingApi,
  mockVerifyOk,
} from "../helpers/courses-auth-helpers.ts";
import { expect, test } from "../index.ts";

const MOCK_EMAIL = "test@example.com";

test("sign-in page loads and passes a11y", async ({ axePage }) => {
  const response = await axePage.goto(routes.signIn);
  expect(response?.status()).toBe(200);
});

test("sign-in form has accessible email and password fields", async ({
  axePage,
}) => {
  await axePage.goto(routes.signIn);
  await expect(axePage.getByLabel("Email")).toBeVisible();
  await expect(axePage.getByLabel("Password")).toBeVisible();
  await expect(axePage.getByRole("button", { name: "Submit" })).toBeVisible();
});

test.describe("sign-in form — submission behavior", () => {
  test("successful sign-in sets auth cookie and redirects to /courses", async ({
    axePage,
  }) => {
    await mockSignInSuccess(axePage);
    // Mock the verify and tracking endpoints so the courses client does not
    // delete the auth cookie when it checks the token after redirect.
    await mockVerifyOk(axePage);
    await mockTrackingApi(axePage, []);

    await axePage.goto(routes.signIn, { waitUntil: "networkidle" });
    await axePage.getByLabel("Email").fill(MOCK_EMAIL);
    await axePage.getByLabel("Password").fill("password123");
    await axePage.getByRole("button", { name: "Submit" }).click();

    await axePage.waitForURL("**/courses");

    const cookies = await axePage.context().cookies();
    const authCookie = find(cookies, (c) => "ethang-auth-token" === c.name);
    expect(authCookie?.value).toBe(MOCK_SESSION_TOKEN);
  });

  test("failed sign-in shows error message", async ({ axePage }) => {
    await mockSignInError(axePage);

    await axePage.goto(routes.signIn);
    await axePage.getByLabel("Email").fill(MOCK_EMAIL);
    await axePage.getByLabel("Password").fill("wrong-password");
    await axePage.getByRole("button", { name: "Submit" }).click();

    const errorElement = axePage.locator("#sign-in-error");
    await expect(errorElement).toBeVisible();
    await expect(errorElement).toHaveText("Failed to sign in");
  });

  test("submit button is disabled while request is in flight", async ({
    axePage,
  }) => {
    let resolveRoute!: () => void;
    await axePage.context().route(AUTH_SIGN_UP_URL, async (route) => {
      await new Promise<void>((resolve) => {
        resolveRoute = resolve;
      });
      await route.fulfill({
        body: JSON.stringify({ sessionToken: MOCK_SESSION_TOKEN }),
        contentType: CONTENT_TYPE_JSON,
        status: 200,
      });
    });
    // Mock verify and tracking so the courses client does not delete the auth
    // cookie after the redirect, leaving the page in an unexpected state.
    await mockVerifyOk(axePage);
    await mockTrackingApi(axePage, []);

    await axePage.goto(routes.signIn, { waitUntil: "networkidle" });
    await axePage.getByLabel("Email").fill(MOCK_EMAIL);
    await axePage.getByLabel("Password").fill("password");

    const submitButton = axePage.getByRole("button", { name: "Submit" });
    await submitButton.click();

    await expect(submitButton).toBeDisabled();

    resolveRoute();
    await axePage.waitForURL("**/courses");
  });
});
