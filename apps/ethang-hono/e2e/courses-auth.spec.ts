import type { Page } from "@playwright/test";

import { routes } from "../routes.ts";
import { expect, test } from "./index.ts";

const AUTH_VERIFY_URL = "https://auth.ethang.dev/verify";
const MOCK_USER_ID = "test-user-regression-123";
const MOCK_TRACKED_URL =
  "https://frontendmasters.com/courses/deep-javascript-v3/";

const PROGRESS_BAR = "#course-progress-bar";
const SIGN_IN_PROMPT = "#sign-in-prompt";
const AUTH_HEADER = "#auth-section-header";
const COMPLETION_BUTTON = ".course-completion-button";
const HIDDEN_BUTTON = ".course-completion-button.hidden";

type Tracking = {
  courseUrl: string;
  id: string;
  status: string;
  userId: string;
};

const mockVerifyOk = async (page: Page) =>
  page.context().route(AUTH_VERIFY_URL, async (route) =>
    route.fulfill({
      body: JSON.stringify({
        email: "test@example.com",
        exp: 9_999_999_999,
        iat: 1_000_000_000,
        sub: MOCK_USER_ID,
        username: "testuser",
      }),
      contentType: "application/json",
      status: 200,
    }),
  );

const mockTrackingApi = async (page: Page, trackings: Tracking[]) =>
  page
    .context()
    .route(`**/api/course-tracking/${MOCK_USER_ID}`, async (route) =>
      route.fulfill({
        body: JSON.stringify({ data: trackings, status: 200 }),
        contentType: "application/json",
        status: 200,
      }),
    );

const setAuthCookie = async (page: Page) =>
  page.context().addCookies([
    {
      domain: "localhost",
      name: "ethang-auth-token",
      path: "/",
      value: "mock-token-value",
    },
  ]);

test.describe("courses page — unauthenticated", () => {
  test("hides completion buttons and progress bar", async ({ page }) => {
    await page.goto(routes.courses, { waitUntil: "networkidle" });

    await expect(page.locator(HIDDEN_BUTTON).first()).not.toBeVisible();
    await expect(page.locator(COMPLETION_BUTTON).first()).toHaveClass(
      /hidden/u,
    );
    await expect(page.locator(PROGRESS_BAR)).not.toBeVisible();
  });

  test("shows sign-in prompt", async ({ page }) => {
    await page.goto(routes.courses, { waitUntil: "networkidle" });

    await expect(
      page.getByRole("link", { name: "Sign In To Track Changes" }),
    ).toBeVisible();
    await expect(page.locator(SIGN_IN_PROMPT)).toBeVisible();
  });

  test("hides Your Progress header", async ({ page }) => {
    await page.goto(routes.courses, { waitUntil: "networkidle" });

    await expect(page.locator(AUTH_HEADER)).not.toBeVisible();
  });
});

test.describe("courses page — authenticated", () => {
  test.beforeEach(async ({ page }) => {
    await mockVerifyOk(page);
    await mockTrackingApi(page, [
      {
        courseUrl: MOCK_TRACKED_URL,
        id: "t1",
        status: "Revisit",
        userId: MOCK_USER_ID,
      },
    ]);
    await setAuthCookie(page);
    await page.goto(routes.courses, { waitUntil: "networkidle" });
  });

  test("shows progress bar", async ({ page }) => {
    await expect(page.locator(PROGRESS_BAR)).toBeVisible();
  });

  test("hides sign-in prompt", async ({ page }) => {
    await expect(page.locator(SIGN_IN_PROMPT)).not.toBeVisible();
  });

  test("shows Your Progress header", async ({ page }) => {
    await expect(page.locator(AUTH_HEADER)).toBeVisible();
  });

  test("reveals all completion buttons", async ({ page }) => {
    await expect(page.locator(HIDDEN_BUTTON)).toHaveCount(0);
  });

  test("applies Revisit status styling to tracked course button", async ({
    page,
  }) => {
    const revisitButton = page.locator(
      `${COMPLETION_BUTTON}[data-course-url="${MOCK_TRACKED_URL}"]`,
    );
    await expect(revisitButton).toHaveClass(/bg-warning/u);
  });

  test("applies Complete status styling to tracked course button", async ({
    page,
  }) => {
    await page.context().unrouteAll({ behavior: "wait" });
    await mockVerifyOk(page);
    await mockTrackingApi(page, [
      {
        courseUrl: MOCK_TRACKED_URL,
        id: "t1",
        status: "Complete",
        userId: MOCK_USER_ID,
      },
    ]);
    await page.reload({ waitUntil: "networkidle" });

    const completeButton = page.locator(
      `${COMPLETION_BUTTON}[data-course-url="${MOCK_TRACKED_URL}"]`,
    );
    await expect(completeButton).toHaveClass(/bg-brand/u);
  });
});

test.describe("courses page — stale cache regression", () => {
  test("hides auth UI when cookie removed after authenticated cache entry", async ({
    page,
  }) => {
    // Step 1: visit as authenticated user — SW caches the page
    await mockVerifyOk(page);
    await mockTrackingApi(page, []);
    await setAuthCookie(page);
    await page.goto(routes.courses, { waitUntil: "networkidle" });
    await expect(page.locator(PROGRESS_BAR)).toBeVisible();

    // Step 2: log out (clear cookie) and navigate again.
    // The SW may serve the stale authenticated HTML, but the script must
    // reconcile to the logged-out state.
    await page.context().clearCookies();
    await page.context().unrouteAll({ behavior: "wait" });
    await page.goto(routes.courses, { waitUntil: "networkidle" });

    await expect(page.locator(PROGRESS_BAR)).not.toBeVisible();
    await expect(page.locator(SIGN_IN_PROMPT)).toBeVisible();
    await expect(page.locator(COMPLETION_BUTTON).first()).toHaveClass(
      /hidden/u,
    );
  });

  test("shows auth UI and applies statuses when navigating from another page", async ({
    page,
  }) => {
    // Simulate arriving at /courses after visiting another page
    await page.goto("/", { waitUntil: "networkidle" });

    await mockVerifyOk(page);
    await mockTrackingApi(page, [
      {
        courseUrl: MOCK_TRACKED_URL,
        id: "t1",
        status: "Revisit",
        userId: MOCK_USER_ID,
      },
    ]);
    await setAuthCookie(page);
    await page.goto(routes.courses, { waitUntil: "networkidle" });

    await expect(page.locator(PROGRESS_BAR)).toBeVisible();
    await expect(page.locator(AUTH_HEADER)).toBeVisible();
    await expect(page.locator(SIGN_IN_PROMPT)).not.toBeVisible();

    const revisitButton = page.locator(
      `${COMPLETION_BUTTON}[data-course-url="${MOCK_TRACKED_URL}"]`,
    );
    await expect(revisitButton).toHaveClass(/bg-warning/u);
  });
});
