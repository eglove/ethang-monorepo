import type { Page } from "@playwright/test";

import { routes } from "../../routes.ts";
import {
  MOCK_TRACKED_URL,
  MOCK_USER_ID,
  mockTrackingApi,
  mockVerifyOk,
  setAuthCookie,
  type Tracking,
} from "../helpers/courses-auth-helpers.ts";
import { expect, test } from "../index.ts";

const PROGRESS_BAR = "#course-progress-bar";
const SIGN_IN_PROMPT = "#sign-in-prompt";
const AUTH_HEADER = "#auth-section-header";
const COMPLETION_BUTTON = ".course-completion-button";
const HIDDEN_BUTTON = ".course-completion-button.hidden";

const mockPutTracking = async (page: Page, tracking: Tracking) =>
  page
    .context()
    .route(
      new RegExp(`/api/course-tracking/${MOCK_USER_ID}/`, "u"),
      async (route) =>
        route.fulfill({
          body: JSON.stringify({ data: tracking, status: 200 }),
          contentType: "application/json",
          status: 200,
        }),
    );

test.describe("courses page — unauthenticated", () => {
  test("hides completion buttons and progress bar", async ({ axePage }) => {
    await axePage.goto(routes.courses, { waitUntil: "networkidle" });

    await expect(axePage.locator(HIDDEN_BUTTON).first()).not.toBeVisible();
    await expect(axePage.locator(COMPLETION_BUTTON).first()).toHaveClass(
      /hidden/u,
    );
    await expect(axePage.locator(PROGRESS_BAR)).not.toBeVisible();
  });

  test("shows sign-in prompt", async ({ axePage }) => {
    await axePage.goto(routes.courses, { waitUntil: "networkidle" });

    await expect(
      axePage.getByRole("link", { name: "Sign In To Track Changes" }),
    ).toBeVisible();
    await expect(axePage.locator(SIGN_IN_PROMPT)).toBeVisible();
  });

  test("hides Your Progress header", async ({ axePage }) => {
    await axePage.goto(routes.courses, { waitUntil: "networkidle" });

    await expect(axePage.locator(AUTH_HEADER)).not.toBeVisible();
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

  test("shows progress bar", async ({ axePage }) => {
    await expect(axePage.locator(PROGRESS_BAR)).toBeVisible();
  });

  test("hides sign-in prompt", async ({ axePage }) => {
    await expect(axePage.locator(SIGN_IN_PROMPT)).not.toBeVisible();
  });

  test("shows Your Progress header", async ({ axePage }) => {
    await expect(axePage.locator(AUTH_HEADER)).toBeVisible();
  });

  test("reveals all completion buttons", async ({ axePage }) => {
    await expect(axePage.locator(HIDDEN_BUTTON)).toHaveCount(0);
  });

  test("applies Revisit status styling to tracked course button", async ({
    axePage,
  }) => {
    const revisitButton = axePage.locator(
      `${COMPLETION_BUTTON}[data-course-url="${MOCK_TRACKED_URL}"]`,
    );
    await expect(revisitButton).toHaveClass(/bg-warning/u);
  });

  test("applies Complete status styling to tracked course button", async ({
    axePage,
  }) => {
    // WebKit requires routes to be registered before navigation. Use a fresh
    // goto instead of unrouteAll + reload so the mocks are active from the start.
    await axePage.context().unrouteAll({ behavior: "wait" });
    await mockVerifyOk(axePage);
    await mockTrackingApi(axePage, [
      {
        courseUrl: MOCK_TRACKED_URL,
        id: "t1",
        status: "Complete",
        userId: MOCK_USER_ID,
      },
    ]);
    await setAuthCookie(axePage);
    await axePage.goto(routes.courses, { waitUntil: "networkidle" });

    const completeButton = axePage.locator(
      `${COMPLETION_BUTTON}[data-course-url="${MOCK_TRACKED_URL}"]`,
    );
    await expect(completeButton).toHaveClass(/bg-brand/u);
  });
});

test.describe("courses page — completion button interactions", () => {
  // Playwright WebKit cannot intercept PUT requests to localhost — the network
  // stack bypasses context/page-level route handlers for same-host PUT requests.
  // These tests are fully covered by Chromium and Firefox; skipping on webkit
  // avoids false failures caused by the confirmed Playwright limitation.

  test("clicking a completion button applies Revisit styling after API responds", async ({
    axePage,
    browserName,
  }) => {
    test.skip(
      "webkit" === browserName,
      "WebKit cannot intercept PUT to localhost",
    );
    await mockVerifyOk(axePage);
    await mockTrackingApi(axePage, []);
    await mockPutTracking(axePage, {
      courseUrl: MOCK_TRACKED_URL,
      id: "t2",
      status: "Revisit",
      userId: MOCK_USER_ID,
    });
    await setAuthCookie(axePage);
    await axePage.goto(routes.courses, { waitUntil: "networkidle" });

    const button = axePage.locator(COMPLETION_BUTTON).first();
    await button.click();

    await expect(button).toHaveClass(/bg-warning/u);
    await expect(button).not.toBeDisabled();
  });

  test("clicking a completion button applies Complete styling after API responds", async ({
    axePage,
    browserName,
  }) => {
    test.skip(
      "webkit" === browserName,
      "WebKit cannot intercept PUT to localhost",
    );
    await mockVerifyOk(axePage);
    await mockTrackingApi(axePage, []);
    await mockPutTracking(axePage, {
      courseUrl: MOCK_TRACKED_URL,
      id: "t3",
      status: "Complete",
      userId: MOCK_USER_ID,
    });
    await setAuthCookie(axePage);
    await axePage.goto(routes.courses, { waitUntil: "networkidle" });

    const button = axePage.locator(COMPLETION_BUTTON).first();
    await button.click();

    await expect(button).toHaveClass(/bg-brand/u);
    await expect(button).not.toBeDisabled();
  });

  test("completion button is disabled and shows spinner while request is in flight", async ({
    axePage,
    browserName,
  }) => {
    test.skip(
      "webkit" === browserName,
      "WebKit cannot intercept PUT to localhost",
    );
    await mockVerifyOk(axePage);
    await mockTrackingApi(axePage, []);

    // Use a Promise that resolves when the route handler is invoked, so we can
    // hold the in-flight request open until we are ready to release it.
    let resolveRoute!: () => void;
    const routeHandlerFired = new Promise<void>((outerResolve) => {
      void axePage.route(
        new RegExp(`/api/course-tracking/${MOCK_USER_ID}/`, "u"),
        async (route) => {
          await new Promise<void>((resolve) => {
            resolveRoute = resolve;
            outerResolve();
          });
          await route.fulfill({
            body: JSON.stringify({
              data: {
                courseUrl: MOCK_TRACKED_URL,
                id: "t4",
                status: "Complete",
                userId: MOCK_USER_ID,
              },
              status: 200,
            }),
            contentType: "application/json",
            status: 200,
          });
        },
      );
    });

    await setAuthCookie(axePage);
    await axePage.goto(routes.courses, { waitUntil: "networkidle" });

    const button = axePage.locator(COMPLETION_BUTTON).first();
    await button.click();

    await expect(button).toBeDisabled();
    await expect(button).toHaveClass(/animate-spin/u);

    // Wait until the route handler has been invoked and resolveRoute is set
    // before releasing the in-flight request.
    await routeHandlerFired;
    resolveRoute();

    await expect(button).not.toBeDisabled();
    await expect(button).not.toHaveClass(/animate-spin/u);
  });

  test("progress bar percentages update after completion button click", async ({
    axePage,
    browserName,
  }) => {
    test.skip(
      "webkit" === browserName,
      "WebKit cannot intercept PUT to localhost",
    );
    await mockVerifyOk(axePage);
    await mockTrackingApi(axePage, []);
    await mockPutTracking(axePage, {
      courseUrl: MOCK_TRACKED_URL,
      id: "t5",
      status: "Complete",
      userId: MOCK_USER_ID,
    });
    await setAuthCookie(axePage);
    await axePage.goto(routes.courses, { waitUntil: "networkidle" });

    const completeProgress = axePage.locator("#complete-progress");
    const button = axePage.locator(COMPLETION_BUTTON).first();
    await button.click();

    await expect(completeProgress).not.toHaveClass(/hidden/u);
  });
});

test.describe("courses page — stale cache regression", () => {
  test("hides auth UI when cookie removed after authenticated cache entry", async ({
    axePage,
  }) => {
    await mockVerifyOk(axePage);
    await mockTrackingApi(axePage, []);
    await setAuthCookie(axePage);
    await axePage.goto(routes.courses, { waitUntil: "networkidle" });
    await expect(axePage.locator(PROGRESS_BAR)).toBeVisible();

    await axePage.context().clearCookies();
    await axePage.context().unrouteAll({ behavior: "wait" });
    await axePage.goto(routes.courses, { waitUntil: "networkidle" });

    await expect(axePage.locator(PROGRESS_BAR)).not.toBeVisible();
    await expect(axePage.locator(SIGN_IN_PROMPT)).toBeVisible();
    await expect(axePage.locator(COMPLETION_BUTTON).first()).toHaveClass(
      /hidden/u,
    );
  });

  test("shows auth UI and applies statuses when navigating from another page", async ({
    axePage,
  }) => {
    // Set mocks and cookie before any navigation so they are active for the
    // entire test — Firefox and WebKit require routes to be registered before
    // the page navigates for context.route() to intercept correctly.
    await mockVerifyOk(axePage);
    await mockTrackingApi(axePage, [
      {
        courseUrl: MOCK_TRACKED_URL,
        id: "t1",
        status: "Revisit",
        userId: MOCK_USER_ID,
      },
    ]);
    await setAuthCookie(axePage);
    // Navigate to home first to simulate arriving from another page, then go
    // to /courses — this is what the stale cache regression is testing.
    await axePage.goto("/", { waitUntil: "networkidle" });
    await axePage.goto(routes.courses, { waitUntil: "networkidle" });

    await expect(axePage.locator(PROGRESS_BAR)).toBeVisible();
    await expect(axePage.locator(AUTH_HEADER)).toBeVisible();
    await expect(axePage.locator(SIGN_IN_PROMPT)).not.toBeVisible();

    const revisitButton = axePage.locator(
      `${COMPLETION_BUTTON}[data-course-url="${MOCK_TRACKED_URL}"]`,
    );
    await expect(revisitButton).toHaveClass(/bg-warning/u);
  });
});
