# E2E A11y Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand ethang-hono's Playwright e2e suite to cover all client-side JS interactions, broken link detection, keyboard navigation, and NVDA screen reader journeys — organized into three user-type directories (`mouse/`, `keyboard/`, `screen-reader/`).

**Architecture:** Move existing specs into `e2e/mouse/`, add `e2e/keyboard/` and `e2e/screen-reader/` directories, and create `e2e/broken-links.spec.ts` at the root. A separate `playwright.screen-reader.config.ts` handles NVDA-specific configuration (headless: false, extended timeouts) while the main `playwright.config.ts` handles all other test types using per-project `testMatch`.

**Tech Stack:** Playwright, @guidepup/playwright, @guidepup/guidepup, @axe-core/playwright, TypeScript, Vitest (unit), Hono, Node 24 native fetch.

---

## File Map

### Create
- `e2e/mouse/home.spec.ts` — home page mouse tests (moved from `e2e/home.spec.ts`)
- `e2e/mouse/blog.spec.ts` — blog mouse tests (moved from `e2e/blog.spec.ts`)
- `e2e/mouse/courses.spec.ts` — courses unauthenticated mouse tests (moved from `e2e/courses.spec.ts`)
- `e2e/mouse/courses-auth.spec.ts` — courses auth + completion button click tests (moved + expanded from `e2e/courses-auth.spec.ts`)
- `e2e/mouse/sign-in.spec.ts` — sign-in page + form submission tests (moved + expanded from `e2e/sign-in.spec.ts`)
- `e2e/mouse/not-found.spec.ts` — 404 tests (moved from `e2e/not-found.spec.ts`)
- `e2e/mouse/scrollbar-gutter.spec.ts` — toggle tests (moved from `e2e/scrollbar-gutter.spec.ts`)
- `e2e/mouse/scroll-containers.spec.ts` — scroll containers tests (moved from `e2e/scroll-containers.spec.ts`)
- `e2e/mouse/tips.spec.ts` — tips index tests (moved from `e2e/tips.spec.ts`)
- `e2e/mouse/navigation.spec.ts` — hamburger menu mobile mouse tests (new)
- `e2e/keyboard/sign-in.spec.ts` — sign-in form keyboard navigation (new)
- `e2e/keyboard/courses.spec.ts` — courses page keyboard navigation (new)
- `e2e/keyboard/scrollbar-gutter.spec.ts` — toggle button keyboard access (new)
- `e2e/keyboard/navigation.spec.ts` — hamburger menu keyboard access on mobile (new)
- `e2e/keyboard/home.spec.ts` — home page keyboard navigation (new)
- `e2e/keyboard/blog.spec.ts` — blog page keyboard navigation (new)
- `e2e/keyboard/tips.spec.ts` — tips page keyboard navigation (new)
- `e2e/keyboard/scroll-containers.spec.ts` — scroll containers keyboard (new)
- `e2e/keyboard/not-found.spec.ts` — 404 keyboard navigation (new)
- `e2e/screen-reader/sign-in.spec.ts` — sign-in NVDA assertions (new)
- `e2e/screen-reader/courses.spec.ts` — courses page NVDA assertions (new)
- `e2e/screen-reader/scrollbar-gutter.spec.ts` — toggle NVDA assertions (new)
- `e2e/screen-reader/navigation.spec.ts` — hamburger NVDA assertions (new)
- `e2e/screen-reader/home.spec.ts` — home page NVDA assertions (new)
- `e2e/screen-reader/blog.spec.ts` — blog page NVDA assertions (new)
- `e2e/screen-reader/tips.spec.ts` — tips page NVDA assertions (new)
- `e2e/screen-reader/scroll-containers.spec.ts` — scroll containers NVDA assertions (new)
- `e2e/screen-reader/not-found.spec.ts` — 404 NVDA assertions (new)
- `e2e/helpers/courses-auth-helpers.ts` — shared mock helpers for courses auth (used in mouse, keyboard, screen-reader)
- `e2e/broken-links.spec.ts` — broken link detection across all pages (new)
- `playwright.screen-reader.config.ts` — NVDA-specific playwright config (new)

### Modify
- `playwright.config.ts` — add per-project testMatch for mouse/keyboard/broken-links
- `apps/ethang-hono/routes.ts` — add `signIn: "/sign-in"` entry
- `apps/ethang-hono/src/components/courses/course-completion.client.ts` — delete `setupVideoDialog` dead code

### Delete
- `e2e/home.spec.ts`
- `e2e/blog.spec.ts`
- `e2e/courses.spec.ts`
- `e2e/courses-auth.spec.ts`
- `e2e/sign-in.spec.ts`
- `e2e/not-found.spec.ts`
- `e2e/scrollbar-gutter.spec.ts`
- `e2e/scroll-containers.spec.ts`
- `e2e/tips.spec.ts`

---

## Task 1: Install guidepup and update package.json scripts

**Files:**
- Modify: `apps/ethang-hono/package.json`

- [ ] **Step 1: Install guidepup packages**

Run from `apps/ethang-hono/`:
```bash
pnpm add -D @guidepup/playwright @guidepup/guidepup
```

- [ ] **Step 2: Add test:e2e:sr script to package.json**

In `apps/ethang-hono/package.json`, update the `scripts` section to add:
```json
"test:e2e:sr": "playwright test --config=playwright.screen-reader.config.ts"
```

Final scripts section:
```json
"scripts": {
  "cf-typegen": "wrangler types --env-interface CloudflareBindings",
  "deploy": "bun ./build.ts && bun scripts/stamp-sw.ts && wrangler deploy --minify",
  "dev": "run-p tailwind wrangler:dev",
  "drizzle:generate": "drizzle-kit generate",
  "lint": "eslint . --fix && pnpm tsc --noEmit",
  "tailwind": "tailwindcss -i ./src/index.css -o ./public/index.css --watch",
  "test": "pnpm test:vitest",
  "test:e2e": "playwright test",
  "test:e2e:sr": "playwright test --config=playwright.screen-reader.config.ts",
  "test:vitest": "vitest run --coverage",
  "wrangler:dev": "wrangler dev"
}
```

- [ ] **Step 3: Create playwright.screen-reader.config.ts**

Create `apps/ethang-hono/playwright.screen-reader.config.ts`:
```typescript
import { defineConfig, devices } from "@playwright/test";
import { screenReaderConfig } from "@guidepup/playwright";

export default defineConfig({
  ...screenReaderConfig,
  reporter: [["html"], ["list"]],
  retries: 2,
  testDir: "./e2e/screen-reader",
  timeout: 5 * 60 * 1000,
  use: {
    baseURL: "http://localhost:8787",
    headless: false,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "screen-reader",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

- [ ] **Step 4: Update playwright.config.ts**

Replace the entire contents of `apps/ethang-hono/playwright.config.ts`:
```typescript
import { defineConfig, devices } from "@playwright/test";

const DESKTOP_MOBILE_BROWSERS = [
  { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  { name: "webkit", use: { ...devices["Desktop Safari"] } },
  { name: "Mobile Chrome", use: { ...devices["Pixel 7"] } },
  { name: "Mobile Safari", use: { ...devices["iPhone 15"] } },
] as const;

export default defineConfig({
  fullyParallel: true,
  reporter: [["html"], ["list"]],
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:8787",
    trace: "on-first-retry",
  },
  projects: [
    ...DESKTOP_MOBILE_BROWSERS.map((b) => ({
      ...b,
      name: `mouse-${b.name}`,
      testMatch: "**/mouse/**/*.spec.ts",
    })),
    ...DESKTOP_MOBILE_BROWSERS.map((b) => ({
      ...b,
      name: `keyboard-${b.name}`,
      testMatch: "**/keyboard/**/*.spec.ts",
    })),
    {
      name: "broken-links",
      testMatch: "**/broken-links.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

- [ ] **Step 5: Verify config is valid**

Run from `apps/ethang-hono/`:
```bash
pnpm playwright test --list 2>&1 | head -30
```
Expected: lists test files without errors.

- [ ] **Step 6: Commit**
```bash
git add apps/ethang-hono/package.json apps/ethang-hono/playwright.config.ts apps/ethang-hono/playwright.screen-reader.config.ts
git commit -m "chore(ethang-hono): install guidepup and restructure playwright config by user type"
```

---

## Task 2: Delete setupVideoDialog dead code

**Files:**
- Modify: `apps/ethang-hono/src/components/courses/course-completion.client.ts`

- [ ] **Step 1: Locate and remove setupVideoDialog**

In `apps/ethang-hono/src/components/courses/course-completion.client.ts`, delete the entire `setupVideoDialog` function (roughly lines 247–271) and update the bottom block.

Remove this entire block:
```typescript
const setupVideoDialog = () => {
  const dialog = document.querySelector<HTMLDialogElement>("#video-dialog");
  const outer = document.querySelector<HTMLButtonElement>(
    "#video-dialog-outer",
  );
  const inner = document.querySelector<HTMLButtonElement>(
    "#video-dialog-inner",
  );

  outer?.addEventListener("click", () => {
    if (dialog) {
      dialog.showModal();
      dialog.classList.remove("hidden");
      dialog.classList.add("grid");
    }
  });

  inner?.addEventListener("click", () => {
    if (dialog) {
      dialog.close();
      dialog.classList.remove("grid");
      dialog.classList.add("hidden");
    }
  });
};
```

Replace the bottom block from:
```typescript
if ("loading" === document.readyState) {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises,@typescript-eslint/strict-void-return
  document.addEventListener("DOMContentLoaded", init);
} else {
  await init();
  setupVideoDialog();
}
```
To:
```typescript
if ("loading" === document.readyState) {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises,@typescript-eslint/strict-void-return
  document.addEventListener("DOMContentLoaded", init);
} else {
  await init();
}
```

- [ ] **Step 2: Run lint to verify no errors**
```bash
cd apps/ethang-hono && pnpm lint
```
Expected: no errors.

- [ ] **Step 3: Commit**
```bash
git add apps/ethang-hono/src/components/courses/course-completion.client.ts
git commit -m "refactor(ethang-hono): remove dead setupVideoDialog code from course-completion"
```

---

## Task 3: Add /sign-in to routes.ts

**Files:**
- Modify: `apps/ethang-hono/routes.ts`

- [ ] **Step 1: Add signIn route**

Replace the entire contents of `apps/ethang-hono/routes.ts`:
```typescript
export const rootUrl = "https://ethang.dev/";

export const routes = {
  blog: "/blog",
  courses: "/courses",
  scrollbarGutter: "/tips/scrollbar-gutter",
  scrollContainers: "/tips/scroll-containers",
  signIn: "/sign-in",
  tips: "/tips",
};
```

- [ ] **Step 2: Commit**
```bash
git add apps/ethang-hono/routes.ts
git commit -m "chore(ethang-hono): add signIn route to routes.ts"
```

---

## Task 4: Create shared courses auth helpers

**Files:**
- Create: `apps/ethang-hono/e2e/helpers/courses-auth-helpers.ts`

These helpers are reused in mouse, keyboard, and screen-reader specs.

- [ ] **Step 1: Create helpers file**

Create `apps/ethang-hono/e2e/helpers/courses-auth-helpers.ts`:
```typescript
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
```

- [ ] **Step 2: Commit**
```bash
git add apps/ethang-hono/e2e/helpers/courses-auth-helpers.ts
git commit -m "chore(ethang-hono): add shared courses auth helpers for e2e tests"
```

---

## Task 5: Move existing e2e specs into e2e/mouse/

This is a move + minor update (imports). No behavior change — existing tests must still pass.

**Files:**
- Create: all `e2e/mouse/*.spec.ts` files listed in File Map
- Delete: all root-level `e2e/*.spec.ts` files listed in File Map

- [ ] **Step 1: Create e2e/mouse/home.spec.ts**
```typescript
import { expect, test } from "../index.ts";

test("home page loads and passes a11y", async ({ axePage }) => {
  const response = await axePage.goto("/");
  expect(response?.status()).toBe(200);
});
```

- [ ] **Step 2: Create e2e/mouse/not-found.spec.ts**
```typescript
import { expect, test } from "../index.ts";

test("unknown route shows 404 page and passes a11y", async ({ axePage }) => {
  const response = await axePage.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(
    axePage.getByRole("heading", { name: "404 Not Found" }),
  ).toBeVisible();
});
```

- [ ] **Step 3: Create e2e/mouse/scroll-containers.spec.ts**
```typescript
import { routes } from "../../routes.ts";
import { expect, test } from "../index.ts";

test("scroll-containers page loads and passes a11y", async ({ axePage }) => {
  const response = await axePage.goto(routes.scrollContainers);
  expect(response?.status()).toBe(200);
  await expect(
    axePage.getByRole("heading", { name: "Easy Sticky Header/Footer" }),
  ).toBeVisible();
});

test("scroll-containers page shows CSS and Tailwind code examples", async ({
  axePage,
}) => {
  await axePage.goto(routes.scrollContainers);
  await expect(axePage.getByRole("heading", { name: "CSS" })).toBeVisible();
  await expect(
    axePage.getByRole("heading", { name: "Tailwind" }),
  ).toBeVisible();
  await expect(axePage.getByRole("heading", { name: "Demo" })).toBeVisible();
});
```

- [ ] **Step 4: Create e2e/mouse/tips.spec.ts**
```typescript
import { routes } from "../../routes.ts";
import { expect, test } from "../index.ts";

const SCROLL_CONTAINERS_TITLE = "Easy Sticky Header/Footer";
const SCROLLBAR_GUTTER_TITLE = "scrollbar-gutter";

test("tips index loads and lists all tips", async ({ axePage }) => {
  const response = await axePage.goto(routes.tips);
  expect(response?.status()).toBe(200);
  await expect(
    axePage.getByRole("link", { name: SCROLL_CONTAINERS_TITLE }),
  ).toBeVisible();
  await expect(
    axePage.getByRole("link", { name: SCROLLBAR_GUTTER_TITLE }),
  ).toBeVisible();
});

test("navigating to scroll-containers tip loads the page", async ({
  axePage,
}) => {
  await axePage.goto(routes.tips);
  await axePage.getByRole("link", { name: SCROLL_CONTAINERS_TITLE }).click();
  await expect(
    axePage.getByRole("heading", { name: SCROLL_CONTAINERS_TITLE }),
  ).toBeVisible();
});

test("navigating to scrollbar-gutter tip loads the page", async ({
  axePage,
}) => {
  await axePage.goto(routes.tips);
  await axePage.getByRole("link", { name: SCROLLBAR_GUTTER_TITLE }).click();
  await expect(
    axePage.getByRole("heading", { name: SCROLLBAR_GUTTER_TITLE }),
  ).toBeVisible();
});
```

- [ ] **Step 5: Create e2e/mouse/scrollbar-gutter.spec.ts**
```typescript
import { routes } from "../../routes.ts";
import { expect, test } from "../index.ts";

test("scrollbar-gutter page loads and passes a11y", async ({ axePage }) => {
  const response = await axePage.goto(routes.scrollbarGutter);
  expect(response?.status()).toBe(200);
  await expect(
    axePage.getByRole("heading", { name: "scrollbar-gutter" }),
  ).toBeVisible();
});

test("Show Extra Content button reveals hidden demo content", async ({
  axePage,
}) => {
  await axePage.goto(routes.scrollbarGutter);

  const withExample = axePage.locator("#scrollbar-gutter-with-example");
  const withoutExample = axePage.locator(
    "#scrollbar-gutter-without-example",
  );

  await expect(withExample).toBeHidden();
  await expect(withoutExample).toBeHidden();

  await axePage
    .getByRole("button", { name: "Show extra content" })
    .click();

  await expect(withExample).toBeVisible();
  await expect(withoutExample).toBeVisible();
});

test("Hide extra content button hides demo content", async ({ axePage }) => {
  await axePage.goto(routes.scrollbarGutter);

  await axePage
    .getByRole("button", { name: "Show extra content" })
    .click();

  await axePage
    .getByRole("button", { name: "Hide extra content" })
    .click();

  await expect(
    axePage.locator("#scrollbar-gutter-with-example"),
  ).toBeHidden();
  await expect(
    axePage.locator("#scrollbar-gutter-without-example"),
  ).toBeHidden();
});
```

- [ ] **Step 6: Create e2e/mouse/courses.spec.ts**
```typescript
import { routes } from "../../routes.ts";
import { expect, test } from "../index.ts";

test("courses page loads and passes a11y", async ({ axePage }) => {
  const response = await axePage.goto(routes.courses);
  expect(response?.status()).toBe(200);
  await expect(
    axePage.getByRole("heading", { name: "Recommended Courses" }),
  ).toBeVisible();
});

test("courses page shows sign-in link when unauthenticated", async ({
  axePage,
}) => {
  await axePage.goto(routes.courses);
  await expect(
    axePage.getByRole("link", { name: "Sign In To Track Changes" }),
  ).toBeVisible();
});
```

- [ ] **Step 7: Create e2e/mouse/blog.spec.ts**
```typescript
import type { GetBlogs } from "../../src/models/get-blogs.ts";

import { routes } from "../../routes.ts";
import { sanityClient } from "../../src/clients/sanity.ts";
import { expect, test } from "../index.ts";

test("blog listing page loads and passes a11y", async ({ axePage }) => {
  const response = await axePage.goto(routes.blog);
  expect(response?.status()).toBe(200);
  await expect(axePage.getByRole("heading", { name: "Blog" })).toBeVisible();
  await expect(axePage.getByRole("link", { name: "RSS Feed" })).toBeVisible();
});

const blogs = await sanityClient.fetch<GetBlogs>(
  `*[_type == "blog"] { slug }`,
);

for (const blog of blogs) {
  const slug = blog.slug.current;
  test(`blog post /${slug} loads and passes a11y`, async ({ axePage }) => {
    const response = await axePage.goto(`${routes.blog}/${slug}`);
    expect(response?.status()).toBe(200);
  });
}
```

- [ ] **Step 8: Create e2e/mouse/courses-auth.spec.ts**

This is the full existing `courses-auth.spec.ts` content, refactored to use the shared helpers, plus the new completion button click tests:

```typescript
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
      .route(
        `**/api/course-tracking/${MOCK_USER_ID}/**`,
        async (route) =>
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
```

- [ ] **Step 9: Create e2e/mouse/sign-in.spec.ts**
```typescript
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
  await expect(
    axePage.getByRole("button", { name: "Submit" }),
  ).toBeVisible();
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
    await page.context().route(AUTH_SIGN_UP_URL, async (route) =>
      route.fulfill({ status: 401 }),
    );

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
```

- [ ] **Step 10: Create e2e/mouse/navigation.spec.ts**

This tests the hamburger menu toggle which only appears on mobile viewports (Tailwind `md:hidden`):
```typescript
import { expect, test } from "../index.ts";

// The hamburger button is md:hidden — only visible on mobile viewports.
// Playwright's Mobile Chrome / Mobile Safari projects cover this.
test("hamburger menu button toggles nav menu visibility", async ({
  axePage,
}) => {
  await axePage.goto("/");

  const hamburgerButton = axePage.getByRole("button", {
    name: "Open main menu",
  });

  // Only run on mobile viewports where the button is visible
  const isVisible = await hamburgerButton.isVisible();
  if (!isVisible) return;

  const navMenu = axePage.locator("#navbar-default");

  await expect(navMenu).toBeHidden();

  await hamburgerButton.click();
  await expect(hamburgerButton).toHaveAttribute("aria-expanded", "true");
  await expect(navMenu).toBeVisible();

  await hamburgerButton.click();
  await expect(hamburgerButton).toHaveAttribute("aria-expanded", "false");
  await expect(navMenu).toBeHidden();
});
```

- [ ] **Step 11: Delete old root-level spec files**
```bash
cd apps/ethang-hono
rm e2e/home.spec.ts e2e/blog.spec.ts e2e/courses.spec.ts e2e/courses-auth.spec.ts e2e/sign-in.spec.ts e2e/not-found.spec.ts e2e/scrollbar-gutter.spec.ts e2e/scroll-containers.spec.ts e2e/tips.spec.ts
```

- [ ] **Step 12: Run mouse tests to verify all pass**
```bash
cd apps/ethang-hono && pnpm test:e2e --project=mouse-chromium 2>&1 | tail -20
```
Expected: all green, no failures.

- [ ] **Step 13: Commit**
```bash
git add apps/ethang-hono/e2e/
git commit -m "refactor(ethang-hono): move e2e specs to mouse/ and add completion button + sign-in submission tests"
```

---

## Task 6: Create e2e/broken-links.spec.ts

**Files:**
- Create: `apps/ethang-hono/e2e/broken-links.spec.ts`

- [ ] **Step 1: Create the broken-links spec**

Create `apps/ethang-hono/e2e/broken-links.spec.ts`:
```typescript
// cspell:ignore ethang
import type { GetBlogs } from "../src/models/get-blogs.ts";

import { expect, test } from "@playwright/test";

import { routes } from "../routes.ts";
import { sanityClient } from "../src/clients/sanity.ts";

const LINK_TIMEOUT_MS = 10_000;
const USER_AGENT = "Mozilla/5.0 ethang-link-checker";

type BrokenLink = {
  pages: Array<{ page: string; text: string }>;
  status: "timeout" | number;
  url: string;
};

const checkUrl = async (url: string): Promise<"timeout" | number> => {
  const headController = new AbortController();
  const headTimeout = setTimeout(
    () => { headController.abort(); },
    LINK_TIMEOUT_MS,
  );

  try {
    const headResponse = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      method: "HEAD",
      redirect: "manual",
      signal: headController.signal,
    });
    clearTimeout(headTimeout);

    if (headResponse.ok) return headResponse.status;

    // HEAD succeeded but non-2xx — try GET as fallback
    const getController = new AbortController();
    const getTimeout = setTimeout(
      () => { getController.abort(); },
      LINK_TIMEOUT_MS,
    );

    try {
      const getResponse = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        method: "GET",
        redirect: "manual",
        signal: getController.signal,
      });
      clearTimeout(getTimeout);
      return getResponse.status;
    } catch (getError) {
      clearTimeout(getTimeout);
      if (getError instanceof Error && "AbortError" === getError.name) {
        return "timeout";
      }
      throw getError;
    }
  } catch (headError) {
    clearTimeout(headTimeout);
    if (headError instanceof Error && "AbortError" === headError.name) {
      return "timeout";
    }
    // Server refused HEAD entirely — try GET
    const getController = new AbortController();
    const getTimeout = setTimeout(
      () => { getController.abort(); },
      LINK_TIMEOUT_MS,
    );
    try {
      const getResponse = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        method: "GET",
        redirect: "manual",
        signal: getController.signal,
      });
      clearTimeout(getTimeout);
      return getResponse.status;
    } catch (getError) {
      clearTimeout(getTimeout);
      if (getError instanceof Error && "AbortError" === getError.name) {
        return "timeout";
      }
      throw getError;
    }
  }
};

const blogs = await sanityClient.fetch<GetBlogs>(
  `*[_type == "blog"] { slug }`,
);

const ALL_PAGES = [
  "/",
  routes.blog,
  routes.courses,
  routes.signIn,
  routes.tips,
  routes.scrollbarGutter,
  routes.scrollContainers,
  ...blogs.map((b) => `${routes.blog}/${b.slug.current}`),
];

test("no broken links across all pages", async ({ page }) => {
  // Map<url, Array<{ page, text }>> — deduplicated by URL
  const linkMap = new Map<string, Array<{ page: string; text: string }>>();

  for (const pageUrl of ALL_PAGES) {
    await page.goto(pageUrl, { waitUntil: "networkidle" });

    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
        .filter((a) => a.href.startsWith("http"))
        .map((a) => ({
          href: a.href,
          text: (
            a.textContent?.trim() ??
            a.getAttribute("aria-label") ??
            a.getAttribute("title") ??
            ""
          ).slice(0, 80),
        })),
    );

    for (const { href, text } of links) {
      if (!linkMap.has(href)) {
        linkMap.set(href, []);
      }

      const occurrences = linkMap.get(href)!;

      if (!occurrences.some((o) => o.page === pageUrl)) {
        occurrences.push({ page: pageUrl, text });
      }
    }
  }

  const brokenLinks: BrokenLink[] = [];

  for (const [url, pages] of linkMap) {
    const status = await checkUrl(url);
    const isOk =
      "timeout" !== status && status >= 200 && 300 > status;

    if (!isOk) {
      brokenLinks.push({ pages, status, url });
    }
  }

  const message = brokenLinks
    .map(({ url, status, pages }) =>
      [
        `[${status}] ${url}`,
        ...pages.map(({ page: p, text }) => `  - "${text}" on ${p}`),
      ].join("\n"),
    )
    .join("\n\n");

  expect(
    brokenLinks,
    `Broken links found:\n\n${message}`,
  ).toHaveLength(0);
});
```

- [ ] **Step 2: Run broken links test**
```bash
cd apps/ethang-hono && pnpm test:e2e --project=broken-links 2>&1 | tail -30
```
Expected: passes (or reveals actual broken links to fix).

- [ ] **Step 3: Commit**
```bash
git add apps/ethang-hono/e2e/broken-links.spec.ts
git commit -m "test(ethang-hono): add broken links e2e test across all pages"
```

---

## Task 7: Create keyboard tests

**Files:**
- Create: all `e2e/keyboard/*.spec.ts` files

Keyboard tests use plain `@playwright/test` — no axe fixture needed (axe is covered in mouse tests).

- [ ] **Step 1: Create e2e/keyboard/sign-in.spec.ts**
```typescript
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

  test("password field receives focus after email on Tab", async ({
    page,
  }) => {
    await page.goto(routes.signIn);
    await page.getByLabel("Email").focus();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Password")).toBeFocused();
  });

  test("submit button receives focus after password on Tab", async ({
    page,
  }) => {
    await page.goto(routes.signIn);
    await page.getByLabel("Password").focus();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Submit" }),
    ).toBeFocused();
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

  test("error message is in the DOM and readable after failed login", async ({
    page,
  }) => {
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
```

- [ ] **Step 2: Create e2e/keyboard/courses.spec.ts**
```typescript
import { expect, test } from "@playwright/test";

import { routes } from "../../routes.ts";
import {
  MOCK_TRACKED_URL,
  MOCK_USER_ID,
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
    await page
      .context()
      .route(
        `**/api/course-tracking/${MOCK_USER_ID}/**`,
        async (route) =>
          route.fulfill({
            body: JSON.stringify({
              data: {
                courseUrl: MOCK_TRACKED_URL,
                id: "t2",
                status: "Complete",
                userId: MOCK_USER_ID,
              },
              status: 200,
            }),
            contentType: "application/json",
            status: 200,
          }),
      );

    const firstButton = page.locator(COMPLETION_BUTTON).first();
    await firstButton.focus();
    await page.keyboard.press("Enter");

    await expect(firstButton).toHaveClass(/bg-brand/u);
  });

  test("Space on completion button triggers status update", async ({
    page,
  }) => {
    await page
      .context()
      .route(
        `**/api/course-tracking/${MOCK_USER_ID}/**`,
        async (route) =>
          route.fulfill({
            body: JSON.stringify({
              data: {
                courseUrl: MOCK_TRACKED_URL,
                id: "t3",
                status: "Revisit",
                userId: MOCK_USER_ID,
              },
              status: 200,
            }),
            contentType: "application/json",
            status: 200,
          }),
      );

    const firstButton = page.locator(COMPLETION_BUTTON).first();
    await firstButton.focus();
    await page.keyboard.press("Space");

    await expect(firstButton).toHaveClass(/bg-warning/u);
  });
});
```

- [ ] **Step 3: Create e2e/keyboard/scrollbar-gutter.spec.ts**
```typescript
import { expect, test } from "@playwright/test";

import { routes } from "../../routes.ts";

test.describe("scrollbar-gutter page — keyboard user", () => {
  test("Show extra content button is focusable", async ({ page }) => {
    await page.goto(routes.scrollbarGutter);

    const button = page.getByRole("button", { name: "Show extra content" });
    await button.focus();
    await expect(button).toBeFocused();
  });

  test("Enter on show button reveals demo content", async ({ page }) => {
    await page.goto(routes.scrollbarGutter);

    const button = page.getByRole("button", { name: "Show extra content" });
    await button.focus();
    await page.keyboard.press("Enter");

    await expect(
      page.locator("#scrollbar-gutter-with-example"),
    ).toBeVisible();
    await expect(
      page.locator("#scrollbar-gutter-without-example"),
    ).toBeVisible();
  });

  test("Space on show button reveals demo content", async ({ page }) => {
    await page.goto(routes.scrollbarGutter);

    const button = page.getByRole("button", { name: "Show extra content" });
    await button.focus();
    await page.keyboard.press("Space");

    await expect(
      page.locator("#scrollbar-gutter-with-example"),
    ).toBeVisible();
    await expect(
      page.locator("#scrollbar-gutter-without-example"),
    ).toBeVisible();
  });

  test("Enter on hide button hides demo content again", async ({ page }) => {
    await page.goto(routes.scrollbarGutter);

    await page
      .getByRole("button", { name: "Show extra content" })
      .focus();
    await page.keyboard.press("Enter");

    const hideButton = page.getByRole("button", {
      name: "Hide extra content",
    });
    await hideButton.focus();
    await page.keyboard.press("Enter");

    await expect(
      page.locator("#scrollbar-gutter-with-example"),
    ).toBeHidden();
    await expect(
      page.locator("#scrollbar-gutter-without-example"),
    ).toBeHidden();
  });
});
```

- [ ] **Step 4: Create e2e/keyboard/navigation.spec.ts**
```typescript
import { expect, test } from "@playwright/test";

test.describe("navigation hamburger menu — keyboard user (mobile)", () => {
  test("hamburger button is focusable and toggles menu with Enter", async ({
    page,
  }) => {
    await page.goto("/");

    const hamburgerButton = page.getByRole("button", {
      name: "Open main menu",
    });

    // Only mobile viewports show the hamburger (md:hidden)
    const isVisible = await hamburgerButton.isVisible();
    if (!isVisible) return;

    await hamburgerButton.focus();
    await expect(hamburgerButton).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(hamburgerButton).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#navbar-default")).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(hamburgerButton).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#navbar-default")).toBeHidden();
  });

  test("hamburger button toggles menu with Space", async ({ page }) => {
    await page.goto("/");

    const hamburgerButton = page.getByRole("button", {
      name: "Open main menu",
    });

    const isVisible = await hamburgerButton.isVisible();
    if (!isVisible) return;

    await hamburgerButton.focus();
    await page.keyboard.press("Space");
    await expect(hamburgerButton).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#navbar-default")).toBeVisible();
  });
});
```

- [ ] **Step 5: Create e2e/keyboard/home.spec.ts**
```typescript
import { expect, test } from "@playwright/test";

test.describe("home page — keyboard user", () => {
  test("all links are keyboard accessible", async ({ page }) => {
    await page.goto("/");

    // Collect all links via Tab and verify each is focusable
    const allLinks = page.getByRole("link");
    const count = await allLinks.count();

    for (let i = 0; i < count; i++) {
      await allLinks.nth(i).focus();
      await expect(allLinks.nth(i)).toBeFocused();
    }
  });
});
```

- [ ] **Step 6: Create e2e/keyboard/blog.spec.ts**
```typescript
import { expect, test } from "@playwright/test";

import { routes } from "../../routes.ts";

test.describe("blog listing page — keyboard user", () => {
  test("RSS Feed link is keyboard accessible", async ({ page }) => {
    await page.goto(routes.blog);

    const rssLink = page.getByRole("link", { name: "RSS Feed" });
    await rssLink.focus();
    await expect(rssLink).toBeFocused();
  });

  test("blog post links are keyboard accessible", async ({ page }) => {
    await page.goto(routes.blog);

    const firstPostLink = page.getByRole("link").nth(1);
    await firstPostLink.focus();
    await expect(firstPostLink).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(new RegExp(`${routes.blog}/`, "u"));
  });
});
```

- [ ] **Step 7: Create e2e/keyboard/tips.spec.ts**
```typescript
import { expect, test } from "@playwright/test";

import { routes } from "../../routes.ts";

test.describe("tips page — keyboard user", () => {
  test("tip links are keyboard accessible and navigable with Enter", async ({
    page,
  }) => {
    await page.goto(routes.tips);

    const scrollContainersLink = page.getByRole("link", {
      name: "Easy Sticky Header/Footer",
    });
    await scrollContainersLink.focus();
    await expect(scrollContainersLink).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(
      page.getByRole("heading", { name: "Easy Sticky Header/Footer" }),
    ).toBeVisible();
  });
});
```

- [ ] **Step 8: Create e2e/keyboard/scroll-containers.spec.ts**
```typescript
import { expect, test } from "@playwright/test";

import { routes } from "../../routes.ts";

test.describe("scroll-containers page — keyboard user", () => {
  test("page loads and all content headings are reachable", async ({
    page,
  }) => {
    await page.goto(routes.scrollContainers);

    await expect(
      page.getByRole("heading", { name: "Easy Sticky Header/Footer" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "CSS" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Tailwind" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Demo" })).toBeVisible();
  });
});
```

- [ ] **Step 9: Create e2e/keyboard/not-found.spec.ts**
```typescript
import { expect, test } from "@playwright/test";

test.describe("404 page — keyboard user", () => {
  test("404 page renders and home link is keyboard accessible", async ({
    page,
  }) => {
    await page.goto("/this-route-does-not-exist");

    await expect(
      page.getByRole("heading", { name: "404 Not Found" }),
    ).toBeVisible();

    const homeLink = page.getByRole("link", { name: /home/iu });
    if (await homeLink.isVisible()) {
      await homeLink.focus();
      await expect(homeLink).toBeFocused();
    }
  });
});
```

- [ ] **Step 10: Run keyboard tests to verify they pass**
```bash
cd apps/ethang-hono && pnpm test:e2e --project=keyboard-chromium 2>&1 | tail -20
```
Expected: all green.

- [ ] **Step 11: Commit**
```bash
git add apps/ethang-hono/e2e/keyboard/
git commit -m "test(ethang-hono): add keyboard navigation e2e tests for all pages"
```

---

## Task 8: Create screen reader tests

**Files:**
- Create: all `e2e/screen-reader/*.spec.ts` files

Screen reader tests use `nvdaTest` from `@guidepup/playwright`. NVDA must be running on the local Windows machine. These tests are run with `pnpm test:e2e:sr` (not the default `test:e2e`).

- [ ] **Step 1: Create e2e/screen-reader/sign-in.spec.ts**
```typescript
import { nvdaTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";

import { routes } from "../../routes.ts";

test.describe("sign-in page — screen reader (NVDA)", () => {
  test("announces page heading", async ({ page, nvda }) => {
    await page.goto(routes.signIn, { waitUntil: "load" });
    await nvda.navigateToWebContent();

    await nvda.perform(nvda.keyboardCommands.moveToNextHeading);
    expect(await nvda.lastSpokenPhrase()).toContain("Sign In");
  });

  test("announces Email field label when focused", async ({ page, nvda }) => {
    await page.goto(routes.signIn, { waitUntil: "load" });
    await nvda.navigateToWebContent();

    // Tab to the email input
    await nvda.press("Tab");
    expect(await nvda.lastSpokenPhrase()).toContain("Email");
  });

  test("announces Password field label when focused", async ({
    page,
    nvda,
  }) => {
    await page.goto(routes.signIn, { waitUntil: "load" });
    await nvda.navigateToWebContent();

    await nvda.press("Tab");
    await nvda.press("Tab");
    expect(await nvda.lastSpokenPhrase()).toContain("Password");
  });

  test("announces Submit button when focused", async ({ page, nvda }) => {
    await page.goto(routes.signIn, { waitUntil: "load" });
    await nvda.navigateToWebContent();

    await nvda.press("Tab");
    await nvda.press("Tab");
    await nvda.press("Tab");
    expect(await nvda.lastSpokenPhrase()).toContain("Submit");
  });

  test("announces error message after failed submission", async ({
    page,
    nvda,
  }) => {
    await page.context().route("https://auth.ethang.dev/sign-up", async (route) =>
      route.fulfill({ status: 401 }),
    );

    await page.goto(routes.signIn, { waitUntil: "load" });
    await page.getByLabel("Email").fill("bad@example.com");
    await page.getByLabel("Password").fill("wrong");
    await page.getByRole("button", { name: "Submit" }).click();

    await page.locator("#sign-in-error").waitFor({ state: "visible" });

    // Navigate to the error element
    await nvda.navigateToWebContent();
    let found = false;
    for (let i = 0; i < 10; i++) {
      await nvda.next();
      const phrase = await nvda.lastSpokenPhrase();
      if (phrase.includes("Failed to sign in")) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});
```

- [ ] **Step 2: Create e2e/screen-reader/courses.spec.ts**
```typescript
import { nvdaTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";

import { routes } from "../../routes.ts";
import {
  MOCK_USER_ID,
  MOCK_TRACKED_URL,
  mockTrackingApi,
  mockVerifyOk,
  setAuthCookie,
} from "../helpers/courses-auth-helpers.ts";

const COMPLETION_BUTTON = ".course-completion-button";

test.describe("courses page — screen reader (NVDA, unauthenticated)", () => {
  test("announces Recommended Courses heading", async ({ page, nvda }) => {
    await page.goto(routes.courses, { waitUntil: "load" });
    await nvda.navigateToWebContent();

    await nvda.perform(nvda.keyboardCommands.moveToNextHeading);
    expect(await nvda.lastSpokenPhrase()).toContain("Recommended Courses");
  });

  test("announces sign-in link when unauthenticated", async ({
    page,
    nvda,
  }) => {
    await page.goto(routes.courses, { waitUntil: "networkidle" });
    await nvda.navigateToWebContent();

    let found = false;
    for (let i = 0; i < 30; i++) {
      await nvda.next();
      const phrase = await nvda.lastSpokenPhrase();
      if (phrase.includes("Sign In To Track Changes")) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});

test.describe("courses page — screen reader (NVDA, authenticated)", () => {
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
  });

  test("announces Your Progress heading when authenticated", async ({
    page,
    nvda,
  }) => {
    await page.goto(routes.courses, { waitUntil: "networkidle" });
    await nvda.navigateToWebContent();

    let found = false;
    for (let i = 0; i < 10; i++) {
      await nvda.perform(nvda.keyboardCommands.moveToNextHeading);
      const phrase = await nvda.lastSpokenPhrase();
      if (phrase.includes("Your Progress")) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  test("announces completion button label when focused", async ({
    page,
    nvda,
  }) => {
    await page.goto(routes.courses, { waitUntil: "networkidle" });
    await nvda.navigateToWebContent();

    // Tab until we reach a completion button
    let found = false;
    for (let i = 0; i < 40; i++) {
      await nvda.press("Tab");
      const phrase = await nvda.lastSpokenPhrase();
      // Completion buttons should announce their purpose
      if (phrase.toLowerCase().includes("button")) {
        const firstButton = page.locator(COMPLETION_BUTTON).first();
        if (await firstButton.evaluate((el) => document.activeElement === el)) {
          found = true;
          break;
        }
      }
    }
    expect(found).toBe(true);
  });
});
```

- [ ] **Step 3: Create e2e/screen-reader/scrollbar-gutter.spec.ts**
```typescript
import { nvdaTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";

import { routes } from "../../routes.ts";

test.describe("scrollbar-gutter page — screen reader (NVDA)", () => {
  test("announces page heading", async ({ page, nvda }) => {
    await page.goto(routes.scrollbarGutter, { waitUntil: "load" });
    await nvda.navigateToWebContent();

    await nvda.perform(nvda.keyboardCommands.moveToNextHeading);
    expect(await nvda.lastSpokenPhrase()).toContain("scrollbar-gutter");
  });

  test("announces Show extra content button", async ({ page, nvda }) => {
    await page.goto(routes.scrollbarGutter, { waitUntil: "load" });
    await nvda.navigateToWebContent();

    let found = false;
    for (let i = 0; i < 20; i++) {
      await nvda.press("Tab");
      const phrase = await nvda.lastSpokenPhrase();
      if (
        phrase.toLowerCase().includes("show extra content") &&
        phrase.toLowerCase().includes("button")
      ) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  test("announces Hide extra content button after toggle", async ({
    page,
    nvda,
  }) => {
    await page.goto(routes.scrollbarGutter, { waitUntil: "load" });

    // Click to toggle
    await page.getByRole("button", { name: "Show extra content" }).click();

    await nvda.navigateToWebContent();

    let found = false;
    for (let i = 0; i < 20; i++) {
      await nvda.press("Tab");
      const phrase = await nvda.lastSpokenPhrase();
      if (
        phrase.toLowerCase().includes("hide extra content") &&
        phrase.toLowerCase().includes("button")
      ) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});
```

- [ ] **Step 4: Create e2e/screen-reader/navigation.spec.ts**
```typescript
import { nvdaTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";

test.describe("navigation hamburger — screen reader (NVDA, mobile)", () => {
  test("announces Open main menu button and expanded state", async ({
    page,
    nvda,
  }) => {
    await page.goto("/", { waitUntil: "load" });

    const hamburgerButton = page.getByRole("button", {
      name: "Open main menu",
    });

    // Only mobile viewports render the button
    const isVisible = await hamburgerButton.isVisible();
    if (!isVisible) return;

    await nvda.navigateToWebContent();

    let found = false;
    for (let i = 0; i < 20; i++) {
      await nvda.press("Tab");
      const phrase = await nvda.lastSpokenPhrase();
      if (phrase.toLowerCase().includes("open main menu")) {
        found = true;

        // Activate the button and verify expanded state is announced
        await nvda.act();
        const expandedPhrase = await nvda.lastSpokenPhrase();
        expect(expandedPhrase.toLowerCase()).toContain("expanded");

        break;
      }
    }
    expect(found).toBe(true);
  });
});
```

- [ ] **Step 5: Create e2e/screen-reader/home.spec.ts**
```typescript
import { nvdaTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";

test.describe("home page — screen reader (NVDA)", () => {
  test("announces main heading", async ({ page, nvda }) => {
    await page.goto("/", { waitUntil: "load" });
    await nvda.navigateToWebContent();

    await nvda.perform(nvda.keyboardCommands.moveToNextHeading);
    const phrase = await nvda.lastSpokenPhrase();
    expect(phrase).toBeTruthy();
    expect(phrase.toLowerCase()).toContain("heading");
  });

  test("navigation links are announced with accessible names", async ({
    page,
    nvda,
  }) => {
    await page.goto("/", { waitUntil: "load" });
    await nvda.navigateToWebContent();

    const phrases: string[] = [];
    for (let i = 0; i < 10; i++) {
      await nvda.press("Tab");
      phrases.push(await nvda.lastSpokenPhrase());
    }

    // At least one nav link should be announced
    const hasLink = phrases.some((p) => p.toLowerCase().includes("link"));
    expect(hasLink).toBe(true);
  });
});
```

- [ ] **Step 6: Create e2e/screen-reader/blog.spec.ts**
```typescript
import { nvdaTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";

import { routes } from "../../routes.ts";

test.describe("blog listing page — screen reader (NVDA)", () => {
  test("announces Blog heading", async ({ page, nvda }) => {
    await page.goto(routes.blog, { waitUntil: "load" });
    await nvda.navigateToWebContent();

    await nvda.perform(nvda.keyboardCommands.moveToNextHeading);
    expect(await nvda.lastSpokenPhrase()).toContain("Blog");
  });

  test("announces RSS Feed link", async ({ page, nvda }) => {
    await page.goto(routes.blog, { waitUntil: "load" });
    await nvda.navigateToWebContent();

    let found = false;
    for (let i = 0; i < 20; i++) {
      await nvda.press("Tab");
      const phrase = await nvda.lastSpokenPhrase();
      if (phrase.toLowerCase().includes("rss feed")) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});
```

- [ ] **Step 7: Create e2e/screen-reader/tips.spec.ts**
```typescript
import { nvdaTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";

import { routes } from "../../routes.ts";

test.describe("tips page — screen reader (NVDA)", () => {
  test("announces Tips heading", async ({ page, nvda }) => {
    await page.goto(routes.tips, { waitUntil: "load" });
    await nvda.navigateToWebContent();

    await nvda.perform(nvda.keyboardCommands.moveToNextHeading);
    const phrase = await nvda.lastSpokenPhrase();
    expect(phrase.toLowerCase()).toContain("tip");
  });

  test("tip links are announced with accessible names", async ({
    page,
    nvda,
  }) => {
    await page.goto(routes.tips, { waitUntil: "load" });
    await nvda.navigateToWebContent();

    let scrollContainersFound = false;
    let scrollbarGutterFound = false;

    for (let i = 0; i < 20; i++) {
      await nvda.press("Tab");
      const phrase = await nvda.lastSpokenPhrase();
      if (phrase.toLowerCase().includes("sticky")) scrollContainersFound = true;
      if (phrase.toLowerCase().includes("scrollbar-gutter")) scrollbarGutterFound = true;
      if (scrollContainersFound && scrollbarGutterFound) break;
    }

    expect(scrollContainersFound).toBe(true);
    expect(scrollbarGutterFound).toBe(true);
  });
});
```

- [ ] **Step 8: Create e2e/screen-reader/scroll-containers.spec.ts**
```typescript
import { nvdaTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";

import { routes } from "../../routes.ts";

test.describe("scroll-containers page — screen reader (NVDA)", () => {
  test("announces Easy Sticky Header/Footer heading", async ({
    page,
    nvda,
  }) => {
    await page.goto(routes.scrollContainers, { waitUntil: "load" });
    await nvda.navigateToWebContent();

    await nvda.perform(nvda.keyboardCommands.moveToNextHeading);
    expect(await nvda.lastSpokenPhrase()).toContain("Sticky");
  });

  test("announces CSS, Tailwind, and Demo section headings", async ({
    page,
    nvda,
  }) => {
    await page.goto(routes.scrollContainers, { waitUntil: "load" });
    await nvda.navigateToWebContent();

    const headings: string[] = [];
    for (let i = 0; i < 5; i++) {
      await nvda.perform(nvda.keyboardCommands.moveToNextHeading);
      headings.push(await nvda.lastSpokenPhrase());
    }

    expect(headings.some((h) => h.includes("CSS"))).toBe(true);
    expect(headings.some((h) => h.includes("Tailwind"))).toBe(true);
    expect(headings.some((h) => h.includes("Demo"))).toBe(true);
  });
});
```

- [ ] **Step 9: Create e2e/screen-reader/not-found.spec.ts**
```typescript
import { nvdaTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";

test.describe("404 page — screen reader (NVDA)", () => {
  test("announces 404 Not Found heading", async ({ page, nvda }) => {
    await page.goto("/this-route-does-not-exist", { waitUntil: "load" });
    await nvda.navigateToWebContent();

    await nvda.perform(nvda.keyboardCommands.moveToNextHeading);
    expect(await nvda.lastSpokenPhrase()).toContain("404");
  });
});
```

- [ ] **Step 10: Run screen reader tests (requires NVDA running locally)**
```bash
cd apps/ethang-hono && pnpm test:e2e:sr 2>&1 | tail -30
```
Expected: all green. Note: NVDA must be installed and running. Tests run headful (headless: false).

- [ ] **Step 11: Commit**
```bash
git add apps/ethang-hono/e2e/screen-reader/
git commit -m "test(ethang-hono): add NVDA screen reader e2e tests for all pages"
```

---

## Self-Review

### Spec Coverage Check

| Requirement | Task |
|---|---|
| Install guidepup | Task 1 |
| Remove setupVideoDialog dead code | Task 2 |
| Add /sign-in to routes | Task 3 |
| Shared auth helpers | Task 4 |
| Move existing specs to mouse/ | Task 5 |
| Sign-in form submission (success + error + loading) | Task 5, Step 9 |
| Course completion button click (Revisit, Complete, spinner, progress bar) | Task 5, Step 8 |
| Navigation hamburger menu (mouse) | Task 5, Step 10 |
| Broken links (all pages, HEAD→GET, deduplicated, 10s timeout, error report) | Task 6 |
| Keyboard: sign-in (Tab order, Enter, Space, error readable) | Task 7, Step 1 |
| Keyboard: courses (auth + unauth) | Task 7, Step 2 |
| Keyboard: scrollbar-gutter (Enter + Space on toggle) | Task 7, Step 3 |
| Keyboard: navigation hamburger (Enter + Space) | Task 7, Step 4 |
| Keyboard: home, blog, tips, scroll-containers, not-found | Task 7, Steps 5–9 |
| Screen reader: sign-in | Task 8, Step 1 |
| Screen reader: courses (auth + unauth) | Task 8, Step 2 |
| Screen reader: scrollbar-gutter | Task 8, Step 3 |
| Screen reader: navigation | Task 8, Step 4 |
| Screen reader: home, blog, tips, scroll-containers, not-found | Task 8, Steps 5–9 |
| Playwright config by user type | Task 1 |
| Screen reader uses Chromium only | Task 1 (screen-reader.config.ts) |
| Mouse + keyboard run all 5 browsers | Task 1 (playwright.config.ts) |
| broken-links runs Chromium only | Task 1 (playwright.config.ts) |
