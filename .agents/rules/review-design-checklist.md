---
description: reviewing React component design, Hono/Cloudflare Worker routes, Drizzle database queries, or general architecture quality
trigger: model_decision
---

# Design and Quality Review Checklist

> Theory: SWEBOK v4 Ch 3 — SOLID definitions, Design by Contract, coupling/cohesion theory, and DDD pattern definitions. Ch 2 — architecture layer/coupling theory. Ch 16 — algorithm complexity thresholds and data structure selection. Ch 12 — ISO 25010 quality attributes.

Structured checklist for TypeScript Quality and Architecture code review.

## React-Specific Design

- [ ] Components do NOT fetch data directly — data fetching belongs in TanStack Query `queryFn` factories or loader functions, not inside component bodies
- [ ] Business logic NOT in JSX — complex expressions extracted to component methods, custom hooks, or pure utility functions
- [ ] No prop drilling beyond two levels — introduce context or a query/store boundary instead
- [ ] `useEffect` discipline — effects are not used as event handlers; dependencies array is complete and minimal; no derived state computed inside an effect
- [ ] Expensive renders memoized correctly — `useMemo` / `useCallback` applied where referential equality is needed; not applied blindly where it adds overhead without benefit
- [ ] Smart/dumb component separation — container components own data concerns; presentational components receive only typed props
- [ ] No uncontrolled `key` prop abuse — keys are stable identifiers, not array indices for mutable lists
- [ ] TanStack Query cache keys are deterministic and minimal — no unstable object literals or function references in query keys
- [ ] Mutations use `useMutation` and invalidate the correct query keys on success

## Hono / Cloudflare Worker-Specific Design

- [ ] Route handlers are thin — business logic delegated to service or domain functions; handlers only parse, call, and respond
- [ ] Middleware layered at the correct scope — auth/authz middleware applied at the router level, not duplicated inside individual handlers
- [ ] No raw `env` variable reads inside handler bodies — environment bindings accessed through a typed context helper or injected dependency
- [ ] Error handling centralized — a top-level `app.onError` handler formats error responses; individual handlers do not construct error shapes ad-hoc
- [ ] Drizzle queries encapsulated in repository or query functions — SQL expressions not scattered across route handlers
- [ ] No `prepare()`-style raw SQL strings concatenated with user input — always use Drizzle's query builder or parameterized `sql` tagged template
- [ ] Worker CPU time budget respected — no blocking loops, no synchronous file I/O, no heavy crypto in the hot path

## Drizzle-Specific Design

- [ ] Schema definitions are the single source of truth — TypeScript types derived from schema via `$inferSelect` / `$inferInsert`, not manually re-declared
- [ ] No N+1 patterns — related records fetched with joins or `with` clauses, not inside a loop
- [ ] Transactions used correctly — multi-step mutations that must be atomic are wrapped in `db.transaction()`
- [ ] Migration files checked in — every schema change has a corresponding Drizzle migration; no manual DDL applied outside migrations

## Architecture Layer Rules (Ch 2)

### Layer Violations
- [ ] UI code does NOT contain business logic (no fetch calls, no data transformation in components)
- [ ] Route handlers do NOT bypass the service/repository layer (no Drizzle queries inline in `app.get` bodies)
- [ ] Data access logic does NOT leak into service layer — queries encapsulated in repository functions

### Coupling and Cohesion Checks
- [ ] Does this change INCREASE coupling between modules? (new cross-package imports that didn't exist before)
- [ ] Does this change DECREASE cohesion? (related logic scattered across files, or unrelated logic merged into one file)
- [ ] Data flow integrity maintained: component → query hook → API route → service → repository → database (no shortcuts)

### Architectural Boundaries
- [ ] New features respect existing package/module boundaries — no reaching into another package's internals
- [ ] If new package/feature created: has clear responsibility, minimal public API, documented purpose

## Common Anti-Patterns

- [ ] No magic numbers/strings — constants extracted with meaningful names
- [ ] No dead code — unreachable branches, commented-out code, unused imports
- [ ] Cyclomatic complexity reasonable — functions with many branches may need decomposition
- [ ] DRY — three or more identical/near-identical blocks should be extracted (but two is fine)
- [ ] No boolean flag soup — if a function takes 3+ boolean parameters, consider an options object or separate functions

## Domain-Driven Design (DDD)

Apply DDD tactical patterns:

### CQRS
- [ ] TanStack Query selectors (via `select` option or derived hooks) are pure — no mutations triggered from inside a `queryFn`
- [ ] Component event handlers either read cached data (via `useQuery`) OR trigger mutations (via `useMutation`) — not both in the same synchronous operation for the same data
- [ ] New API routes that retrieve-only data (`GET /resources`) have a corresponding query function; flag if a `POST` is used where a `GET` would suffice

### Specification Pattern
- [ ] Complex eligibility or filtering logic (3+ conditions) is encapsulated in a named predicate function or class, not scattered as inline booleans
- [ ] The same boolean guard does not appear in more than one component or route handler
- [ ] JSX conditional blocks do not contain 3+ inline conditions — extract to a named predicate or component method

### Value Objects
- [ ] Domain-meaningful values (account numbers, money amounts, date ranges, phone numbers) use TypeScript branded types, not raw `string` / `number`
- [ ] Functions do not accept two `string` / `number` parameters that represent distinct domain concepts in the same position (easy accidental swap)
- [ ] Currency arithmetic is not performed on untyped `number` values

### Domain Events
- [ ] New TanStack mutation keys and event names for state mutations are named in past tense describing the business occurrence (`payment-submitted`, `account-enrolled`) rather than technical operations (`update-record`, `set-value`)
- [ ] Event names do not use persistence-layer verbs (`insert`, `upsert`, `persist`) — these are implementation details, not domain events
- [ ] Naming tense is consistent within a bounded context — note inconsistencies but do not require immediate refactor of existing names
