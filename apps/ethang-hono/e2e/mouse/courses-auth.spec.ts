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

test.describe("courses page — completion button interactions", () => {
  const mockPutTracking = async (page: Page, tracking: Tracking) =>
    page
      .context()
      .route(`**/api/course-tracking/${MOCK_USER_ID}/**`, async (route) =>
        route.fulfill({
          body: JSON.stringify({ data: tracking, status: 200 }),
          contentType: "application/json",
          status: 200,
        }),
      );

  test.beforeEach(async ({ page }) => {
    await mockVerifyOk(page);
    await mockTrackingApi(page, []);
    await setAuthCookie(page);
    await page.goto(routes.courses, { waitUntil: "networkidle" });
  });

  test("clicking a completion button applies Revisit styling after API responds", async ({
    page,
  }) => {
    await mockPutTracking(page, {
      courseUrl: MOCK_TRACKED_URL,
      id: "t2",
      status: "Revisit",
      userId: MOCK_USER_ID,
    });

    const button = page.locator(COMPLETION_BUTTON).first();
    await button.click();

    await expect(button).toHaveClass(/bg-warning/u);
    await expect(button).not.toBeDisabled();
  });

  test("clicking a completion button applies Complete styling after API responds", async ({
    page,
  }) => {
    await mockPutTracking(page, {
      courseUrl: MOCK_TRACKED_URL,
      id: "t3",
      status: "Complete",
      userId: MOCK_USER_ID,
    });

    const button = page.locator(COMPLETION_BUTTON).first();
    await button.click();

    await expect(button).toHaveClass(/bg-brand/u);
    await expect(button).not.toBeDisabled();
  });

  test("completion button is disabled and shows spinner while request is in flight", async ({
    page,
  }) => {
    let resolveRoute!: () => void;
    await page
      .context()
      .route(`**/api/course-tracking/${MOCK_USER_ID}/**`, async (route) => {
        await new Promise<void>((resolve) => {
          resolveRoute = resolve;
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
      });

    const button = page.locator(COMPLETION_BUTTON).first();
    await button.click();

    await expect(button).toBeDisabled();
    await expect(button).toHaveClass(/animate-spin/u);

    resolveRoute();

    await expect(button).not.toBeDisabled();
    await expect(button).not.toHaveClass(/animate-spin/u);
  });

  test("progress bar percentages update after completion button click", async ({
    page,
  }) => {
    await mockPutTracking(page, {
      courseUrl: MOCK_TRACKED_URL,
      id: "t5",
      status: "Complete",
      userId: MOCK_USER_ID,
    });

    const completeProgress = page.locator("#complete-progress");
    const button = page.locator(COMPLETION_BUTTON).first();
    await button.click();

    await expect(completeProgress).not.toHaveClass(/hidden/u);
  });
});

test.describe("courses page — stale cache regression", () => {
  test("hides auth UI when cookie removed after authenticated cache entry", async ({
    page,
  }) => {
    await mockVerifyOk(page);
    await mockTrackingApi(page, []);
    await setAuthCookie(page);
    await page.goto(routes.courses, { waitUntil: "networkidle" });
    await expect(page.locator(PROGRESS_BAR)).toBeVisible();

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
