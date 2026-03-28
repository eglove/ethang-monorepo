# Playwright + axe Setup for ethang-hono

**Date:** 2026-03-27
**Status:** Approved

## Overview

Add Playwright end-to-end testing to `apps/ethang-hono` with cross-browser coverage (desktop + mobile) and automatic accessibility (a11y) checking via `@axe-core/playwright` on every test that interacts with a page.

The server is **not** managed by Playwright — it must be started manually (`pnpm dev`) before running e2e tests.

## Architecture

### Config (`playwright.config.ts`)

Lives at the root of `apps/ethang-hono/`. Key settings:

- `baseURL: http://localhost:8787` (wrangler dev default port)
- `testDir: ./e2e`
- No `webServer` block — manual server start required
- `reporter: ['html', 'list']`
- `use.trace: 'on-first-retry'`

### Projects (browsers)

| Name | Engine | Device |
|------|--------|--------|
| `chromium` | Chromium | Desktop |
| `firefox` | Firefox | Desktop |
| `webkit` | WebKit | Desktop |
| `Mobile Chrome` | Chromium | Pixel 7 |
| `Mobile Safari` | WebKit | iPhone 15 |

Mobile projects use Playwright's built-in `devices` descriptors which set viewport, user agent, and touch capabilities automatically.

### Directory Structure

```
apps/ethang-hono/
  e2e/
    fixtures/
      axe-fixture.ts    ← extends test with axePage fixture
    index.ts            ← re-exports test + expect for use in all e2e files
  playwright.config.ts
```

### The `axePage` Fixture (`e2e/fixtures/axe-fixture.ts`)

Extends Playwright's built-in `test` object with an `axePage` fixture that wraps `page`. After each test, the fixture:

1. Calls `injectAxe(page)` to inject the axe-core runtime into the page
2. Calls `checkA11y(page)` to run the accessibility audit
3. Any axe violations cause the test to fail with axe's built-in violation output

All e2e test files import `test` and `expect` from `e2e/index.ts` (not from `@playwright/test` directly), so every test automatically has access to the `axePage` fixture.

### Entry Point (`e2e/index.ts`)

Re-exports the extended `test` and `expect` from the axe fixture. This is the single import point for all e2e tests — following the same pattern as Playwright's own fixture docs.

## Dependencies

New devDependencies in `apps/ethang-hono/package.json`:

- `@playwright/test` — Playwright test runner
- `@axe-core/playwright` — axe accessibility integration for Playwright

## Scripts

New script added to `apps/ethang-hono/package.json`:

```json
"test:e2e": "playwright test"
```

## Error Handling

- If the server is not running, Playwright will fail immediately with a connection error on the first test — no special handling needed
- axe violations produce structured output via `@axe-core/playwright`'s built-in error formatting — violations are human-readable in the test failure output and the HTML report

## Out of Scope

- No dedicated a11y smoke suite (Approach C was considered and declined)
- No CI pipeline changes (not requested)
- No authentication setup for protected routes
