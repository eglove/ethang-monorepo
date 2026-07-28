---
tags: [backlog, testing, playwright, frontend, coverage]
status: todo
priority: high
created: 2026-07-26
---

# Playwright Testing — Frontends

## Goal

Add Playwright end-to-end tests to all frontend applications. Create a test user in the auth database for authenticated flows. Enforce coverage thresholds.

## Plan

### Phase 1: Infrastructure

1. Add Playwright as a dev dependency to each frontend workspace.
2. Create a shared Playwright config (`playwright.config.ts`) in a shared location.
3. Add a test user to the auth database:
   - Create a seed script or migration.
   - The test user must have known credentials, roles, and permissions.
   - Document the test user in the README.
4. Configure CI to run Playwright (headless).

### Phase 2: Per-Frontend Tests

For each frontend app:

1. Write a smoke test. The page loads. No console errors exist.
2. Write an auth test. The login flow works with the test user.
3. Write critical-path tests for key user flows.
4. Write accessibility tests (axe-core via Playwright).

### Phase 3: Coverage

1. Configure Playwright coverage collection (`istanbul` / `v8`).
2. Set coverage thresholds in CI.
3. Integrate coverage reports with existing reporting.

## Verification

- `pnpm -r test:e2e` passes for all frontends.
- Coverage meets the threshold.
- The test user can authenticate and perform all tested flows.

## Related

- [[Frontend Migration to TanStack Start-Astryx]] (coordinate timing — test after or during migration)
- [[E2E Tests — Backends]]
