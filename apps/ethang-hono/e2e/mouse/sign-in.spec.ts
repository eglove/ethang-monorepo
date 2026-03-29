import { routes } from "../../routes.ts";
import { expect, test } from "../index.ts";

const AUTH_SIGN_UP_URL = "https://auth.ethang.dev/sign-up";
const MOCK_SESSION_TOKEN = "mock-session-token-value";
const CONTENT_TYPE_JSON = "application/json";

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
    page,
  }) => {
    await page.context().route(AUTH_SIGN_UP_URL, async (route) =>
      route.fulfill({
        body: JSON.stringify({ sessionToken: MOCK_SESSION_TOKEN }),
        contentType: CONTENT_TYPE_JSON,
        status: 200,
      }),
    );

    await page.goto(routes.signIn);
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Submit" }).click();

    await page.waitForURL("**/courses");

    const cookies = await page.context().cookies();
    const authCookie = cookies.find((c) => "ethang-auth-token" === c.name);
    expect(authCookie?.value).toBe(MOCK_SESSION_TOKEN);
  });

  test("failed sign-in shows error message", async ({ page }) => {
    await page
      .context()
      .route(AUTH_SIGN_UP_URL, async (route) => route.fulfill({ status: 401 }));

    await page.goto(routes.signIn);
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page.locator("#sign-in-error")).toBeVisible();
    await expect(page.locator("#sign-in-error")).toHaveText(
      "Failed to sign in",
    );
  });

  test("submit button is disabled while request is in flight", async ({
    page,
  }) => {
    let resolveRoute!: () => void;
    await page.context().route(AUTH_SIGN_UP_URL, async (route) => {
      await new Promise<void>((resolve) => {
        resolveRoute = resolve;
      });
      await route.fulfill({
        body: JSON.stringify({ sessionToken: MOCK_SESSION_TOKEN }),
        contentType: CONTENT_TYPE_JSON,
        status: 200,
      });
    });

    await page.goto(routes.signIn);
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password");

    const submitButton = page.getByRole("button", { name: "Submit" });
    await submitButton.click();

    await expect(submitButton).toBeDisabled();

    resolveRoute();
    await page.waitForURL("**/courses");
  });
});
