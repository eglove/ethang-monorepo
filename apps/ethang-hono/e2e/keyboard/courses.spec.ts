import { expect, test } from "@playwright/test";

import { routes } from "../../routes.ts";
import {
  MOCK_TRACKED_URL,
  MOCK_USER_ID,
  mockCourseStatusUpdate,
  mockTrackingApi,
  mockVerifyOk,
  setAuthCookie,
} from "../helpers/courses-auth-helpers.ts";

const COMPLETION_BUTTON = ".course-completion-button";

test.describe("courses page — keyboard user (unauthenticated)", () => {
  test("sign-in link is reachable via keyboard and activates on Enter", async ({
    page,
  }) => {
    await page.goto(routes.courses, { waitUntil: "networkidle" });

    const signInLink = page.getByRole("link", {
      name: "Sign In To Track Changes",
    });
    await signInLink.focus();
    await expect(signInLink).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/sign-in/u);
  });
});

test.describe("courses page — keyboard user (authenticated)", () => {
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

  test("completion buttons are focusable", async ({ page }) => {
    const firstButton = page.locator(COMPLETION_BUTTON).first();
    await firstButton.focus();
    await expect(firstButton).toBeFocused();
  });

  test("Enter on completion button triggers status update", async ({
    page,
  }) => {
    await mockCourseStatusUpdate(page, { id: "t2", status: "Complete" });

    const firstButton = page.locator(COMPLETION_BUTTON).first();
    await firstButton.focus();
    await page.keyboard.press("Enter");

    await expect(firstButton).toHaveClass(/bg-brand/u);
  });

  test("Space on completion button triggers status update", async ({
    page,
  }) => {
    await mockCourseStatusUpdate(page, { id: "t3", status: "Revisit" });

    const firstButton = page.locator(COMPLETION_BUTTON).first();
    await firstButton.focus();
    await page.keyboard.press("Space");

    await expect(firstButton).toHaveClass(/bg-warning/u);
  });
});
