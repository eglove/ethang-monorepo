---
description: Applies CQRS (Hono GET vs write handlers, Drizzle selects vs writes, TanStack queries vs mutations), the Specification Pattern for eligibility/filter logic, TypeScript branded-type Value Objects, and past-tense Domain Event naming. Use during implementation and code review; includes prescriptive (TDD) and defensive (review) guidance.
trigger: model_decision
---

# DDD Tactical Patterns

> Theory: read `resources/ch03-design.md` in the `swebok` skill for CQRS, Specification Pattern,
> Value Object, and Domain Event definitions and rationale (max 3 chapters per task).
> This rule contains only the stack-specific specifics.

Four patterns applied in TypeScript / Hono / Drizzle / TanStack work. Each entry has:
- **Prescriptive** — how to apply it when writing new code (TDD workflow)
- **Defensive** — what to flag during code review

---

## CQRS — Mutations vs Queries

Keep state-changing operations (commands) and reads (queries) on separate paths across every layer.

| Layer | Command (mutation) | Query (read) |
|---|---|---|
| **Hono** | `POST`/`PUT`/`PATCH`/`DELETE` handler | `GET` handler |
| **Drizzle** | `insert` / `update` / `delete` | `select` |
| **TanStack** | `useMutation` | `useQuery` |

### Prescriptive (TDD)

Rules:
- A read path must be side-effect free — a `GET` handler and the `useQuery` calling it must not write
  to the database or mutate server state
- A component that reads data should use `useQuery`, never fire a `useMutation` to fetch it
- A `GET` route named like a command (`/recalculate`, `/refresh`) that writes on read is a smell —
  move the write to a `POST` and let the query re-fetch the updated state

```typescript
// WRONG — using a mutation as a query (POST that just reads)
const { mutate } = useMutation({ mutationFn: () => api.post("/payment-methods/list") });

// RIGHT — query for reads, mutation only to change state
const { data: methods } = useQuery({
  queryKey: ["payments", "methods"],
  queryFn: () => api.get("/payment-methods"),
});
const enroll = useMutation({
  mutationFn: (input) => api.post("/payment-methods", input),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments", "methods"] }),
});
```

### Defensive (Review)

Flag as **Medium** finding:
- A `GET` handler that performs a Drizzle `insert`/`update`/`delete`
- A `useQuery` whose `queryFn` issues a `POST`/`PUT`/`DELETE`, or a `useMutation` used purely to read
- A handler that both reads and writes the same entity in one synchronous request to serve a read

Flag as **Low** finding:
- A read route named with a command verb (`/getAndRefresh`, `/load`) when a plain `GET` would serve

---

## Specification Pattern

Apply when **3 or more conditions** gate the same outcome (eligibility, visibility, filtering, validation).

### Prescriptive (TDD)

1. Name the specification after the business rule (not the technical check):
   `EligibleForBudgetBilling`, `AccountHasOutstandingBalance`, `ServiceEligibleForReconnect`
2. Place it in the feature's domain/service layer as a pure predicate
3. Write the Vitest test first — the spec is just a pure function, trivially testable

```typescript
// src/features/budget-billing/budget-billing-eligibility.ts
export const isEligibleForBudgetBilling = (account: Account): boolean =>
  account.hasBalance &&
  account.serviceType === "ELECTRIC" &&
  !account.isEnrolled;

// Usage in a component — single named condition, not three inline
const eligible = isEligibleForBudgetBilling(account);
return eligible ? <EnrollCta /> : null;
```

### Defensive (Review)

Flag as **Medium** finding:
- The same boolean guard (same 2+ conditions) appears in more than one component or handler
- JSX with a 3+ condition inline guard: `{account.hasBalance && account.type === "ELECTRIC" && !account.enrolled && <Cta/>}`
- Eligibility logic duplicated between production code and test setup (the test is testing the mock,
  not the spec)

Flag as **Low** finding:
- A single complex ternary that could be a named predicate function

---

## Value Objects — TypeScript Branded Types

Apply when a primitive has **domain meaning** beyond its type: account numbers, money amounts, date
ranges, phone numbers, ZIP codes, confirmation numbers.

### Prescriptive (TDD)

Use TypeScript **branded types** for zero-runtime cost:

```typescript
// src/shared/domain-types.ts
export type AccountNumber = string & { readonly _brand: "AccountNumber" };
export type MoneyAmount = number & { readonly _brand: "MoneyAmount" };
export type PhoneNumber = string & { readonly _brand: "PhoneNumber" };

// constructor helpers
export const accountNumber = (s: string): AccountNumber => s as AccountNumber;
export const moneyAmount = (n: number): MoneyAmount => n as MoneyAmount;
```

Rules:
- Create branded types for values that come from API responses or Drizzle rows and must not be mixed
- Keep all branded types in one shared module per package
- Brand at the boundary — wrap the raw value where the Hono handler parses the request or where the
  Drizzle row is mapped to a domain object — so the brand propagates through the rest of the code

### Defensive (Review)

Flag as **High** finding:
- A function that accepts two `string` parameters representing conceptually different domain values in
  the same position (easy accidental swap)
- Currency arithmetic performed on a raw `number` without unit clarity

Flag as **Medium** finding:
- An API response field or Drizzle column typed as bare `string` that carries account number, phone, or
  confirmation data used in domain logic
- A component that formats an account number inline rather than via a typed value

Flag as **Low** finding:
- Raw `string` passed between 3+ layers where a branded type would catch misuse at compile time

---

## Domain Events — Past-Tense Naming

When writing a new state mutation — a Hono write handler, a Drizzle write, or a TanStack mutation — name
it in past tense describing the business event, not the technical operation:

### Prescriptive (TDD)

| Technical name (avoid) | Domain event name (prefer) |
|---|---|
| `updateAutoPay` | `AutoPayEnrollmentChanged` |
| `deleteScheduledPayment` | `ScheduledPaymentCancelled` |
| `setPaperless` | `PaperlessBillingEnrolled` |
| `saveContactInfo` | `ContactInformationUpdated` |
| `disconnectServiceRequest` | `ServiceDisconnectRequested` |

Use the past-tense name for the event the mutation represents — the emitted message, the audit-log
entry, or the `onSuccess` callback the rest of the app reacts to. Keep the imperative form only for the
command/function that triggers it (`submitPayment` dispatches `PaymentSubmitted`).

### Defensive (Review)

Flag as **Medium** finding:
- A new mutation handler uses technical/imperative naming (`update`, `set`, `save`, `delete`) for the
  emitted event when a domain event name exists in the task's AC language
- An event name uses persistence-layer verbs (`insert`, `upsert`, `persist`) — these are
  implementation details, not domain events

Flag as **Low** finding:
- Inconsistent tense within the same bounded context (some events past tense, some imperative) — note
  the inconsistency but don't require immediate refactor of existing names
