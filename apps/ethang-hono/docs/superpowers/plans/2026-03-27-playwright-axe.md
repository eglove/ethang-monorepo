# Playwright + axe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Playwright e2e testing to `apps/ethang-hono` with cross-browser/mobile coverage and automatic axe accessibility checking via a custom `axePage` fixture.

**Architecture:** A custom Playwright fixture extends the built-in `page` with post-test axe injection and auditing. All e2e tests import from a single `e2e/index.ts` barrel that exports the extended `test` and `expect`. No server management — `wrangler dev` must be running on port 8787 before running tests.

**Tech Stack:** `@playwright/test`, `@axe-core/playwright`, Playwright device descriptors for mobile emulation.

---

## File Map

| Path | Action | Purpose |
|------|--------|---------|
| `apps/ethang-hono/package.json` | Modify | Add devDependencies + `test:e2e` script |
| `apps/ethang-hono/playwright.config.ts` | Create | Browser projects, baseURL, no webServer |
| `apps/ethang-hono/e2e/fixtures/axe-fixture.ts` | Create | Extended `test` with `axePage` + afterEach axe |
| `apps/ethang-hono/e2e/index.ts` | Create | Re-exports `test` + `expect` for e2e files |
| `apps/ethang-hono/e2e/home.spec.ts` | Create | Smoke test verifying the fixture wires up |

---

## Task 1: Install dependencies

**Files:**
- Modify: `apps/ethang-hono/package.json`

- [ ] **Step 1: Install `@playwright/test` and `@axe-core/playwright`**

Run from the monorepo root:
```bash
pnpm --filter ethang-hono add -D @playwright/test @axe-core/playwright
```

Expected: Both packages appear under `devDependencies` in `apps/ethang-hono/package.json`.

- [ ] **Step 2: Install Playwright browser binaries**

```bash
pnpm --filter ethang-hono exec playwright install
```

Expected: Chromium, Firefox, and WebKit binaries download to Playwright's cache. This also installs the Android and iOS emulator dependencies used by the mobile device descriptors.

- [ ] **Step 3: Commit**

```bash
git add apps/ethang-hono/package.json pnpm-lock.yaml
git commit -m "chore(ethang-hono): install @playwright/test and @axe-core/playwright"
```

---

## Task 2: Create `playwright.config.ts`

**Files:**
- Create: `apps/ethang-hono/playwright.config.ts`

- [ ] **Step 1: Write the config**

Create `apps/ethang-hono/playwright.config.ts`:

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  reporter: [["html"], ["list"]],
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:8787",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 15"] },
    },
  ],
});
```

- [ ] **Step 2: Verify Playwright recognises the config**

```bash
pnpm --filter ethang-hono exec playwright test --list
```

Expected output: Playwright lists 0 tests (no test files yet) but prints the 5 projects without errors:
```
Listing tests:
  chromium
  firefox
  webkit
  Mobile Chrome
  Mobile Safari
```

If Playwright cannot find the config or reports an error, double-check the file is at `apps/ethang-hono/playwright.config.ts` (not inside `src/`).

- [ ] **Step 3: Lint and type-check**

```bash
pnpm --filter ethang-hono lint --fix
pnpm --filter ethang-hono exec tsc --noEmit
```

Expected: No errors. If ESLint reports errors in `playwright.config.ts` that require config changes, stop and ask the user — do not modify `eslint.config.ts` without permission.

- [ ] **Step 4: Commit**

```bash
git add apps/ethang-hono/playwright.config.ts
git commit -m "feat(ethang-hono): add playwright.config.ts with 5 browser projects"
```

---

## Task 3: Create the axe fixture and index barrel

**Files:**
- Create: `apps/ethang-hono/e2e/fixtures/axe-fixture.ts`
- Create: `apps/ethang-hono/e2e/index.ts`

- [ ] **Step 1: Create `e2e/fixtures/axe-fixture.ts`**

```typescript
import { checkA11y, injectAxe } from "@axe-core/playwright";
import { expect, test as base } from "@playwright/test";
import type { Page } from "@playwright/test";

export const test = base.extend<{ axePage: Page }>({
  axePage: async ({ page }, use) => {
    await use(page);
    await injectAxe(page);
    await checkA11y(page);
  },
});

export { expect };
```

How this works: `base.extend` creates a new test object that adds the `axePage` fixture. When a test uses `axePage`, Playwright passes the built-in `page` to the test. After the test body finishes, the code after `await use(page)` runs — injecting axe into the page DOM and then running the audit. Any axe violations throw an error with a human-readable list of violations, which Playwright surfaces as a test failure.

- [ ] **Step 2: Create `e2e/index.ts`**

```typescript
export { expect, test } from "./fixtures/axe-fixture.ts";
```

All e2e test files import `test` and `expect` from this file, never directly from `@playwright/test`. This ensures the extended test object (with the `axePage` fixture) is always in scope.

- [ ] **Step 3: Lint and type-check**

```bash
pnpm --filter ethang-hono lint --fix
pnpm --filter ethang-hono exec tsc --noEmit
```

Expected: No errors. If ESLint complains about `.spec.ts` files needing the same rule overrides as `.test.ts` files, stop and ask the user before modifying `eslint.config.ts`.

- [ ] **Step 4: Commit**

```bash
git add apps/ethang-hono/e2e/
git commit -m "feat(ethang-hono): add axePage fixture with automatic axe a11y checking"
```

---

## Task 4: Write smoke test and verify end-to-end

**Files:**
- Create: `apps/ethang-hono/e2e/home.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/ethang-hono/e2e/home.spec.ts`:

```typescript
import { expect, test } from "./index.ts";

test("home page loads and passes a11y", async ({ axePage }) => {
  const response = await axePage.goto("/");
  expect(response?.status()).toBe(200);
});
```

This test navigates to `/` (which resolves to `http://localhost:8787/` via `baseURL`), asserts a 200 response, and then has axe run automatically in the fixture teardown.

- [ ] **Step 2: Verify the test fails gracefully without the server**

Make sure `wrangler dev` is **not** running, then run:

```bash
pnpm --filter ethang-hono exec playwright test --project=chromium
```

Expected: Test fails with a connection refused error — this confirms the "no server auto-start" requirement is correct.

- [ ] **Step 3: Start the dev server manually, then run all browser projects**

In a separate terminal, start the server:
```bash
pnpm --filter ethang-hono dev
```

Wait for wrangler to print `Ready on http://localhost:8787`, then run:

```bash
pnpm --filter ethang-hono exec playwright test
```

Expected: 5 passing tests (one per project). Playwright prints a summary like:
```
  5 passed (12s)
```

If axe reports violations, fix the underlying HTML accessibility issue rather than suppressing the axe check.

- [ ] **Step 4: Lint and type-check**

```bash
pnpm --filter ethang-hono lint --fix
pnpm --filter ethang-hono exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add apps/ethang-hono/e2e/home.spec.ts
git commit -m "test(ethang-hono): add e2e smoke test for home page with axe a11y"
```

---

## Task 5: Add `test:e2e` script to `package.json`

**Files:**
- Modify: `apps/ethang-hono/package.json`

- [ ] **Step 1: Add the script**

In `apps/ethang-hono/package.json`, add to the `scripts` block:

```json
"test:e2e": "playwright test"
```

The full scripts block should look like:

```json
"scripts": {
  "cf-typegen": "wrangler types --env-interface CloudflareBindings",
  "deploy": "bun ./build.ts && bun scripts/stamp-sw.ts && wrangler deploy --minify",
  "dev": "run-p tailwind wrangler:dev",
  "drizzle:generate": "drizzle-kit generate",
  "lint": "eslint . --fix",
  "tailwind": "tailwindcss -i ./src/index.css -o ./public/index.css --watch",
  "test": "pnpm test:vitest",
  "test:e2e": "playwright test",
  "test:vitest": "vitest run --coverage",
  "wrangler:dev": "wrangler dev"
}
```

- [ ] **Step 2: Verify the script runs**

With `wrangler dev` running on port 8787:

```bash
pnpm --filter ethang-hono test:e2e
```

Expected: Same 5 passing tests as Task 4 Step 3.

- [ ] **Step 3: Commit**

```bash
git add apps/ethang-hono/package.json
git commit -m "chore(ethang-hono): add test:e2e script for playwright"
```
