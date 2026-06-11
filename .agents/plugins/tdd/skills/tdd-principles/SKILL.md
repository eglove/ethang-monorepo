---
name: tdd-principles
description: Covers Red-Green-Refactor scientific method, Vitest it.each parameterized test syntax, and trust-the-problem hypothesis discipline. Use before writing any tests; defer test-design theory and GREEN construction rules to the swebok skill (Ch 5, Ch 4).
---

# TDD Principles

> Theory: read `resources/ch05-testing.md` in the `swebok` skill for test-design
> technique definitions (equivalence partitioning, boundary analysis, decision tables) and
> rationale, and `resources/ch04-construction.md` for GREEN-phase minimum-change construction
> rules and defensive programming theory (max 3 chapters per task).
> This skill contains only the stack-specific specifics.

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

## Trust the Problem, Verify the Solution

When a task description or GitHub issue proposes a specific fix (e.g., "change X to Y", "add a null
check in Z"):

- **Trust the problem statement** — symptoms, repro steps, expected vs actual behavior. These are
  your requirements.
- **Treat the proposed solution as a hypothesis** — the author may not have full codebase context.
  They may be describing a symptom fix, not a root cause fix.
- **Verify independently** — trace the code to confirm the proposed fix addresses the actual root
  cause and doesn't introduce side effects.
- **If the proposed fix is wrong**, document why and propose the correct fix. Do not silently
  implement a fix you believe is incorrect.
