import type { Page } from "@playwright/test";

export const AUTH_VERIFY_URL = "https://auth.ethang.dev/verify";
export const MOCK_USER_ID = "test-user-regression-123";
export const MOCK_TRACKED_URL =
  "https://frontendmasters.com/courses/deep-javascript-v3/";

export type Tracking = {
  courseUrl: string;
  id: string;
  status: string;
  userId: string;
};

export const mockVerifyOk = async (page: Page) =>
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

export const mockTrackingApi = async (page: Page, trackings: Tracking[]) =>
  page
    .context()
    .route(`**/api/course-tracking/${MOCK_USER_ID}`, async (route) =>
      route.fulfill({
        body: JSON.stringify({ data: trackings, status: 200 }),
        contentType: "application/json",
        status: 200,
      }),
    );

export const setAuthCookie = async (page: Page) =>
  page.context().addCookies([
    {
      domain: "localhost",
      name: "ethang-auth-token",
      path: "/",
      value: "mock-token-value",
    },
  ]);
