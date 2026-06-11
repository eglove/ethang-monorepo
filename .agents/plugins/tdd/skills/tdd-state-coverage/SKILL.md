---
name: tdd-state-coverage
description: Covers FSM enumeration (states, transitions, guards, terminal states), the state table template, a completeness checklist, common web app patterns (async loading, form lifecycle, auth-gated, optimistic UI, toggles), and Vitest it.each generation from state tables. Use before building any test inventory.
---

# State Machine Coverage

> Theory: read `resources/ch05-testing.md` in the `swebok` skill for the "Deriving Tests from
> State Models" mapping table and test-design technique definitions, and
> `resources/ch11-models.md` for FSM completeness criteria (max 3 chapters per task).
> This skill contains only the stack-specific specifics.

A systematic approach to test completeness. Before listing test cases, enumerate every **state**,
**transition**, and **guard** the feature can have. The test inventory then writes itself — one test
per state, one per transition, one per guard (both true and false).

## The Mental Model

Every feature is a state machine:

- **States** — what the UI/system looks like at rest (e.g., loading, loaded, empty, error)
- **Transitions** — actions that move between states (user clicks, API responses, timers, route changes)
- **Guards** — conditions that gate a transition (e.g., `form.formState.isValid`, `data.length > 0`, feature flag on)
- **Terminal states** — states with no outgoing transitions (success screen, redirect away, error dead-end)

## How to Derive States

### 1. Read the AC/requirements

Each acceptance criterion implies at least one state or transition.

> "Customer sees confirmation after payment"

→ States: `form-ready`, `submitting`, `confirmed`. Transitions: submit → submitting → confirmed.

### 2. Read the code (diff or source)

| Code pattern | What it introduces |
|--------------|--------------------|
| `if/else`, `switch`, ternary | Guard (branch = guard evaluated two ways) |
| Conditional JSX (`{cond ? <A/> : <B/>}`, `{cond && <A/>}`) | State (each render branch = a state) |
| TanStack Query `isPending` / `isLoading` | States: loading / not-loading |
| TanStack Query `isError` / `error` | State: error |
| TanStack Query `data` settled | Transition: async result arrives |
| Router navigation (`navigate`, `<Navigate/>`) | Transition to a different view state |
| Hono handler / `fetch` / Drizzle query | Transition: request → response (success or error) |

### 3. Identify terminal states

States with no outgoing transitions: success confirmation, error dead-end with no retry, redirect to
external page. Every terminal state needs a test that reaches it and verifies no further action is
possible (or that the correct redirect occurs).

### 4. Identify the initial state

What does the user see on page load before any interaction? What conditions determine *which* initial
state? (e.g., feature flag on/off, authenticated/anonymous, data pre-cached in the query client or not)

## State Table Template

Include this table in execution plans. Every row must map to at least one test case.

```markdown
| # | State | How to reach (transition) | Guard | Test case(s) |
|---|-------|--------------------------|-------|--------------|
| 1 | initial-loading | Page load | -- | "shows spinner on first load" |
| 2 | data-loaded | API 200 | data.length > 0 | "shows account list after data loads" |
| 3 | empty-state | API 200 | data.length === 0 | "shows 'no accounts' message when list empty" |
| 4 | error-state | API 500 | -- | "shows error banner when API fails" |
| 5 | submitting | Click submit | form valid | "submit button disabled during submission" |
| 6 | success | API 201 | -- | "confirmation appears after submit" |
```

### Completeness Checklist

After filling the table, verify:

- [ ] Every state has >=1 test that reaches it
- [ ] Every transition has >=1 test that triggers it
- [ ] Every guard is tested with condition=true AND condition=false
- [ ] Every terminal state is verified as terminal (no further action, or correct redirect)
- [ ] The initial state is tested (what appears before any interaction)

## Common Web App State Patterns

### Async data loading
`initial → loading → loaded | error | empty`

Guards: data presence, error type. **Common miss:** the empty-state (API succeeds but returns no data).

### Form lifecycle
`pristine → dirty → valid | invalid → submitting → success | server-error`

Guards: field validity, network availability. **Common miss:** server-error after client-side validation passes.

### Auth-gated features
`unauthenticated → redirecting → authenticated → authorized | forbidden`

Guards: token present, role check. **Common miss:** forbidden state (wrong role, not just missing auth).

### Optimistic UI
`idle → optimistic-update → confirmed | rollback`

Guards: mutation success/failure. **Common miss:** rollback state after a TanStack optimistic mutation fails (`onError` reverting the cache).

### Toggle/flag features
`feature-off | feature-on`

Guards: feature flag value, admin config. **Common miss:** testing the off state (only testing when the feature is enabled).

## Parameterized Tests from State Tables

Convert state table rows directly into Vitest `it.each()` cases:

```typescript
const states = [
  { name: "loading",  status: undefined, body: undefined, expected: "spinner visible" },
  { name: "loaded",   status: 200,       body: [{ id: 1 }], expected: "data table visible" },
  { name: "empty",    status: 200,       body: [],          expected: "'no results' message" },
  { name: "error",    status: 500,       body: null,        expected: "error banner visible" },
] as const;

it.each(states)("$name state: $expected", async ({ status, body }) => {
  // configure mock, render or request, assert
});
```

## Applying to Reviews

When new code is added in a revision, enumerate the NEW states and transitions it introduces. Check
whether existing tests already reach those states. The gap is any state or transition with no covering
test — that's where to add tests.
