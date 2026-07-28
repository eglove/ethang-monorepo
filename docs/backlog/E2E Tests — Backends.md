---
tags: [backlog, testing, e2e, backend]
status: todo
priority: high
created: 2026-07-26
---

# E2E Tests — Backends

## Goal

Add end-to-end tests for all backend services. The tests exercise real HTTP endpoints against a test database.

## Plan

### Phase 1: Test Infrastructure

1. Audit all backend services and their endpoints.
2. Create a shared test harness:
   - Set up and tear down the test database (D1 local, Postgres test instance, etc.).
   - Create test auth tokens.
   - Create a shared HTTP client (fetch wrapper with auth).
   - Create fixture factories for test data.
3. Add test scripts to each backend `package.json`.

### Phase 2: Per-Backend Tests

For each backend service:

1. Write a health-check test.
2. Write CRUD tests for each resource.
3. Write auth and authorization tests (unauthorized, forbidden, etc.).
4. Write error-case tests (invalid input, missing fields, etc.).
5. Write concurrency tests if applicable.

### Phase 3: CI Integration

1. Add backend E2E jobs to the CI pipeline.
2. Provision test databases in CI.
3. Set timeouts appropriate for the CI environment.

## Verification

- `pnpm -r test:e2e` passes for all backends.
- All endpoints are covered for happy path and error cases.
- Auth enforcement is verified.

## Related

- [[Playwright Testing — Frontends]] (shared test user, similar CI patterns)
