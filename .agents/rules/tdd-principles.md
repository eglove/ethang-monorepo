---
description: Covers Red-Green-Refactor scientific method, Vitest it.each parameterized test syntax, unit and integration test conventions, RED/GREEN validation steps, and trust-the-problem hypothesis discipline. Use before writing any tests.
trigger: model_decision
---

# TDD Principles & Test Conventions

> Theory: read `resources/ch05-testing.md` in the `swebok` skill for test-design
> technique definitions (equivalence partitioning, boundary analysis, decision tables) and
> rationale, and `resources/ch04-construction.md` for GREEN-phase minimum-change construction
> rules and defensive programming theory (max 3 chapters per task).
> This rule contains only the stack-specific specifics.

## Scientific Method

Every test is an experiment:

| Phase | Scientific method | TDD |
|-------|------------------|-----|
| Hypothesis | Test name describes expected behavior | Write the test first |
| Experiment | Run it — must fail | RED: failure confirms the hypothesis is testable |
| Conclusion | Code makes it pass | GREEN: production code proves the hypothesis |

If a test passes before writing code, it proves nothing — investigate why.

## Parameterized Tests

Prefer parameterized tests over copy-pasted test bodies. Use Vitest `it.each()`:

```typescript
it.each([
  { input: "",                expected: "required" },
  { input: "ab",              expected: "too short" },
  { input: "a".repeat(100),   expected: "valid" },
  { input: "a".repeat(101),   expected: "too long" },
])("validates name: $input -> $expected", ({ input, expected }) => {
  expect(validateName(input)).toBe(expected);
});
```

For async cases — a Hono route handler, a Drizzle query, a TanStack mutation — keep the case table
the same and `await` inside the body:

```typescript
it.each([
  { status: 200, body: [{ id: 1 }], expected: "ok" },
  { status: 200, body: [],          expected: "empty" },
  { status: 500, body: null,        expected: "error" },
])("GET /accounts with status $status -> $expected", async ({ status, body, expected }) => {
  const res = await app.request("/accounts", {}, mockEnv({ status, body }));
  expect(classify(res)).toBe(expected);
});
```

Drive the table from the state machine (see `tdd-state-coverage`): one row per state, one per guard
evaluated both ways. Never copy-paste a test body to change a single input value.

## Test Layers

- **Unit tests** — isolate the smallest unit; mock collaborators. Pure predicates, data mappers, validators, and component logic.
- **Integration tests** — verify a feature flow through real collaborators with only the boundary mocked.

There is no browser end-to-end layer in this monorepo — do not attempt one.

## Unit Test Conventions

- Framework: Vitest 4
- Structure: `describe("unitName")` > `describe("method or behavior")` > `it("input -> expected output")`
- Parameterized coverage: `it.each([...])` — never copy-paste test bodies
- Co-location: `feature.test.ts` alongside `feature.ts`
- Mocking: `vi.fn()`, `vi.spyOn()`, `vi.mock()` for module boundaries
- For CQRS, Specification Pattern, branded-type Value Objects, and Domain Event naming: read `ddd-tactical`

## Integration Test Conventions

Wire real collaborators together; mock only at the outermost boundary.

**React + TanStack:** render the component inside a real `QueryClientProvider` with a fresh `QueryClient` per test; mock `fetch` (or the API client) at the network boundary only — never mock the query hooks or the components under test. File naming: `feature.integration.test.ts` co-located with source.

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

**Hono + Drizzle:** exercise the app through `app.request()` with the Drizzle layer pointed at a test database (in-memory SQLite / D1 binding); assert on the real `Response`. Mock only external upstream services, not the database.

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

## Red-Green-Refactor Process

1. Read the existing source files (or confirm they do not yet exist) before writing tests.
2. Write unit tests from the plan's unit inventory — happy path, error paths, boundary values, every branch both true AND false.
3. Write integration tests from the plan's integration inventory — end-to-end flows through real collaborators.
4. Run each file with RED verification (no coverage):
   `pnpm --filter <package> exec vitest run <path/to/file.test.ts> --no-coverage`
5. Confirm every failure is meaningful — an assertion about missing behavior, not a setup/import error.
6. Write the minimum production code to make the tests pass (GREEN).
7. Verify all tests pass: `pnpm --filter <package> test`
8. Verify 100% code coverage on new/changed code.
9. Refactor code while keeping tests green (reduce complexity, remove duplication, follow design rules).

## Trust the Problem, Verify the Solution

When a task description or GitHub issue proposes a specific fix (e.g., "change X to Y", "add a null check in Z"):

- **Trust the problem statement** — symptoms, repro steps, expected vs actual behavior. These are your requirements.
- **Treat the proposed solution as a hypothesis** — the author may not have full codebase context. They may be describing a symptom fix, not a root cause fix.
- **Verify independently** — trace the code to confirm the proposed fix addresses the actual root cause and doesn't introduce side effects.
- **If the proposed fix is wrong**, document why and propose the correct fix. Do not silently implement a fix you believe is incorrect.
