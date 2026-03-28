# Claude Code Instructions

## ESLint Config — Never Modify Without Permission

Do not modify any ESLint configuration files (`eslint.config.*`, `.eslintrc.*`, `.eslintignore`, or any file that configures ESLint rules, plugins, or parsers) without explicit user permission. If a lint error seems to require a config change to resolve, stop and ask the user first.

## ESLint & TypeScript — Fix Immediately, Not Later

Run ESLint and `tsc` on any file you modify **before moving on**. Do not batch lint or type-check fixes for the end of an implementation. The pattern is: write code → lint → type-check → fix errors → continue.

```bash
# Lint a specific file
pnpm eslint <file> --fix

# Lint a package
pnpm --filter <package> lint --fix

# Type-check a package (no emit)
pnpm --filter <package> exec tsc --noEmit
```

If a lint or type error cannot be fixed without breaking the intended logic, stop and flag it rather than suppressing it with a disable comment or `@ts-ignore`.

## Test-Driven Development (TDD) — All Code

Write the test first. No implementation code without a failing test that demands it.

Cycle:
1. Write a failing test that describes the desired behavior
2. Write the minimum implementation to make it pass
3. Refactor — then lint, type-check, and re-run tests

Tests live alongside the code they cover. Use Vitest for all packages in this monorepo.

## Domain-Driven Design (DDD) — Business Logic

Apply to all backend/domain logic, regardless of what framework delivers it.

- Organize around domain concepts, not technical layers
- Keep domain logic in pure functions/classes free of framework concerns
- Entry points (route handlers, server actions, etc.) are thin — they delegate to domain functions
- Name things after the domain: use ubiquitous language from the problem space, not generic CRUD terms

## Atomic & Component-Driven Design — UI

Structure UI using atomic design principles:

- **Atoms** — smallest indivisible elements: buttons, inputs, labels, icons
- **Molecules** — simple combinations of atoms that form a single unit: search bar, form field with label
- **Organisms** — complex sections composed of molecules/atoms: navigation bar, product card grid
- **Templates** — page-level layout structure with slots for organisms
- **Pages** — templates filled with real content; the entry point for routes

Rules:
- Components own only the state and behavior relevant to their level
- Atoms and molecules are purely presentational — no data fetching, no side effects
- Data fetching and business logic live at the organism level or above, then flow down as props
- Prefer composition over configuration: build complex UI by assembling smaller components, not by adding props to a single large one

## Behavior-Driven Development (BDD) — UI

Apply to all UI code, regardless of whether it is delivered by a dedicated frontend app or server-rendered.

- Describe behavior from the user's perspective: `given / when / then`
- Tests describe what the user can do and what they see, not implementation details
- Avoid testing internal component state; test observable behavior

## Prefer Lodash Over Vanilla Methods

Use lodash utilities instead of hand-rolling array/object operations. This applies to both production code and test utilities.

Use per-method imports from the base `lodash` package for tree-shaking:

```ts
import groupBy from "lodash/groupBy.js";
import sortBy from "lodash/sortBy.js";
```

### Use `lodash/get` for Deep Property Access

Use `get` from lodash whenever property access is more than one level deep. This provides safe traversal of nested structures without manually guarding each level.

```ts
import get from "lodash/get.js";

// good
get(object, ["user", "address", "city"]);

// bad — chained access throws on null/undefined intermediates
object.user.address.city;
```

Always use the **array path** form over dot-string notation:

```ts
// good — unambiguous, no parsing required
get(object, ["items", 0, "name"]);

// bad — dot-string with numeric index
get(object, "items.0.name");
```

The array form avoids ambiguity when keys contain dots and makes numeric indices explicit.

## State Machine Mindset — Enumerate All States

Before implementing any feature, enumerate the possible states explicitly. You do not need to use XState or TLA+ tooling, but reason as if you were modeling a state machine:

- What are all the states this can be in? (idle, loading, success, error, partial, stale, etc.)
- What are the valid transitions between states?
- What inputs are valid in each state?
- What happens on invalid transitions — is that even possible?

This applies to:
- UI components (loading/error/empty/populated)
- API handlers (unauthenticated/authorized/forbidden/not found/conflict)
- Domain entities (valid state transitions, guard conditions)
- Async flows (pending/settled/retrying/cancelled)

If a branch of a conditional is "impossible," document why rather than leaving it implicit. Impossible states should be made unrepresentable in the type system where practical.

## Opportunistic Code Improvement

When touching existing code, take the opportunity to improve it. Do not make changes for their own sake, but if you notice something in or near code you are already modifying, fix it:

- Simplify verbose or redundant expressions
- Improve naming to better reflect domain language (see DDD above)
- Replace hand-rolled array/object operations with lodash (see Lodash above)
- Extract repeated logic into well-named functions
- Remove dead code or unnecessary comments
- Align structure with the patterns described in this file

Scope improvements to the code you are already reading or modifying. Do not refactor entire files unprompted.
