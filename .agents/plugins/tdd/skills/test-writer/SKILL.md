---
name: test-writer
description: "Adopt this role when the tdd-pipeline directs you to write RED tests: produces failing Vitest unit and integration tests (React + TanStack, Hono + Drizzle) that fail for the right reason. Use during the RED step of the TDD pipeline."
---

# Role: Test Writer (RED)

Adopt this role when the tdd-pipeline directs you to **write RED tests**. You write unit and
integration tests with Vitest from the execution plan's test inventory. Every test must fail before any
implementation exists — and fail for the *right* reason (an assertion about missing behavior, not a
setup or import error).

Apply `tdd-principles` (scientific method, `it.each` parameterization), `tdd-test-as-documentation`
(behavior-description naming, describe-block structure, contract assertions), and `tdd-state-coverage`
(one test per state, per transition, per guard both ways) throughout.

## Test Layers

Write every layer the plan calls for. Document any skipped layer with a one-line reason.

- **Unit tests** — always available. Isolate the smallest unit; mock collaborators. Pure predicates,
  data mappers, validators, and component logic.
- **Integration tests** — verify a feature flow through real collaborators with only the boundary
  mocked.

There is no browser end-to-end layer in this monorepo — do not attempt one.

## Unit Test Conventions

- Framework: Vitest 4
- Structure: `describe("unitName")` > `describe("method or behavior")` > `it("input -> expected output")`
- Parameterized coverage: `it.each([...])` — never copy-paste test bodies
- Co-location: `feature.test.ts` alongside `feature.ts`
- Mocking: `vi.fn()`, `vi.spyOn()`, `vi.mock()` for module boundaries
- For CQRS, Specification Pattern, branded-type Value Objects, and Domain Event naming: read
  `ddd-tactical`

## Integration Test Conventions

Wire real collaborators together; mock only at the outermost boundary.

**React + TanStack:** render the component inside a real `QueryClientProvider` with a fresh
`QueryClient` per test; mock `fetch` (or the API client) at the network boundary only — never mock the
query hooks or the components under test. File naming: `feature.integration.test.ts` co-located with
source.

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

describe("AccountList (integration)", () => {
  it("loads and renders account data end-to-end", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ id: 1, balance: 157.5 }]), { status: 200 }),
    );

    render(
      <QueryClientProvider client={client}>
        <AccountList />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("$157.50")).toBeInTheDocument();
  });
});
```

**Hono + Drizzle:** exercise the app through `app.request()` with the Drizzle layer pointed at a test
database (in-memory SQLite / D1 binding); assert on the real `Response`. Mock only external upstream
services, not the database.

```typescript
describe("GET /accounts (integration)", () => {
  it("returns the seeded account row", async () => {
    const db = await seedTestDb([{ id: 1, balance: 157.5 }]);
    const res = await app.request("/accounts", {}, { DB: db });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 1, balance: 157.5 }]);
  });
});
```

## TDD Process

1. Read the existing source files (or confirm they do not yet exist) before writing tests
2. Write unit tests from the plan's unit inventory — happy path, error paths, boundary values, every
   branch both true AND false
3. Write integration tests from the plan's integration inventory — end-to-end flows through real
   collaborators
4. Run each file with RED verification (no coverage):
   `pnpm --filter <package> exec vitest run <path/to/file.test.ts> --no-coverage`
5. Confirm every failure is meaningful — an assertion about missing behavior, not a setup/import error

## Output

```
TEST_WRITER_RED_RESULTS:

## Unit Tests
Files created/modified:
- src/path/feature.test.ts — N tests

Test run output:
[raw vitest output — do not filter or truncate]

RED verification:
- Total: N | Failing: N (all)
- Failure reasons:
  - "returns X when Y" — Expected: X, Received: [undefined | current wrong value]

## Integration Tests
Files created/modified:
- src/path/feature.integration.test.ts — N tests
[or: "Integration skipped: {reason}"]

Test run output:
[raw vitest output or "N/A — skipped"]

RED verification:
- Total: N | Failing: N (all)
[or "N/A — skipped"]
```
