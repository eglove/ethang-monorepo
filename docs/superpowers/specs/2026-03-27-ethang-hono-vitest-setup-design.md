# ethang-hono Vitest Setup

**Date:** 2026-03-27

## Summary

Add Vitest with v8 coverage to `apps/ethang-hono`, following the existing monorepo pattern established in `apps/sterett-hono`.

## Context

`ethang-hono` is a Hono app deployed on Cloudflare Workers. It uses server-side JSX rendering (Hono's JSX, not React DOM). There are no existing tests. The sister app `sterett-hono` already has Vitest + `@vitest/coverage-v8` configured and serves as the canonical reference.

## Decisions

- **Test environment:** Node (default). Hono JSX renders to HTML strings server-side — no DOM environment (jsdom, happy-dom) is needed. E2E/interaction tests will be handled separately in a future effort.
- **Coverage provider:** v8.
- **Auto-update thresholds:** Enabled. Thresholds start at 0 so they ratchet up automatically as tests are added.
- **Test file patterns:** `src/**/*.test.{ts,tsx}` — includes both plain TS logic and JSX component tests.
- **Coverage include:** `src/**/*.{ts,tsx}` — instruments all source files for coverage.

## Files to Change

### `apps/ethang-hono/vitest.config.ts` (new)

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        autoUpdate: true,
        branches: 0,
        functions: 0,
        lines: 0,
        statements: 0,
      },
    },
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

### `apps/ethang-hono/package.json` (modified)

Add to `devDependencies` (match `sterett-hono` versions):
- `@vitest/coverage-v8: ^4.1.2`
- `vitest: ^4.1.2`

Add to `scripts`:
- `"test": "vitest run --coverage"`
- `"test:vitest": "vitest run --coverage"`

## Out of Scope

- E2E tests (Playwright or similar) — future work.
- Test helper setup files — not needed until patterns emerge.
- jsdom / happy-dom — not needed for SSR Hono JSX.
