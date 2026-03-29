import type { Page } from "@playwright/test";

export const AUTH_VERIFY_URL = "https://auth.ethang.dev/verify";
// The auth service uses /sign-up as its authentication endpoint (not /sign-in)
export const AUTH_SIGN_UP_URL = "https://auth.ethang.dev/sign-up";
export const MOCK_USER_ID = "test-user-regression-123";
export const MOCK_TRACKED_URL =
  "https://frontendmasters.com/courses/deep-javascript-v3/";
export const MOCK_SESSION_TOKEN = "mock-session-token-value";
export const CONTENT_TYPE_JSON = "application/json";

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

export const mockSignInSuccess = async (
  page: Page,
  token = MOCK_SESSION_TOKEN,
) =>
  page.context().route(AUTH_SIGN_UP_URL, async (route) =>
    route.fulfill({
      body: JSON.stringify({ sessionToken: token }),
      contentType: CONTENT_TYPE_JSON,
      status: 200,
    }),
  );

export const mockSignInError = async (page: Page) =>
  page
    .context()
    .route(AUTH_SIGN_UP_URL, async (route) => route.fulfill({ status: 401 }));

export const mockCourseStatusUpdate = async (
  page: Page,
  { id, status }: { id: string; status: string },
) =>
  page
    .context()
    .route(`**/api/course-tracking/${MOCK_USER_ID}/**`, async (route) =>
      route.fulfill({
        body: JSON.stringify({
          data: {
            courseUrl: MOCK_TRACKED_URL,
            id,
            status,
            userId: MOCK_USER_ID,
          },
          status: 200,
        }),
        contentType: CONTENT_TYPE_JSON,
        status: 200,
      }),
    );
