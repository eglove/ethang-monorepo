# Tests as Executable Documentation

> Theory: read `resources/ch04-construction.md` in the `swebok` skill for Design-by-Contract,
> assertion theory, and test-first construction discipline (max 3 chapters per task).
> This skill contains only the stack-specific specifics.

Tests are living specifications. Someone reading only the test file should understand what the feature
does, what contracts it enforces, and what external systems it depends on.

## Rules

### Tests Follow the Scientific Method

Each test is an experiment:

- **Hypothesis** — The test name describes expected behavior before code exists
- **Experiment** — RED: run it, it must fail to confirm the hypothesis is testable
- **Conclusion** — GREEN: production code makes it pass, proving the hypothesis

If a test passes before writing code, it proves nothing — investigate why.

### Test Names Are Behavior Descriptions

Write test names as user-visible behaviors in plain English. They complete the sentence "It is true that…"

**Bad:**
- `it("payment test")`
- `it("should work")`
- `it("issue-1234")`
- `it("handles edge case")`

**Good:**
- `it("customer can submit payment with valid credit card and sees confirmation")`
- `it("submitting payment with expired card shows inline validation error")`
- `it("payment form pre-fills saved billing address from account profile")`
- `it("session timeout during payment redirects to login with return URL preserved")`

Names must not reference issue numbers or requirement IDs — describe the behavior, not the ticket.

### Describe Blocks Are Feature Outlines

Structure `describe` as a table of contents for the feature. Nest by concern so reading names alone
reveals the feature's scope.

```typescript
describe("Submit Payment", () => {
  describe("Happy Path", () => {
    it("customer submits payment with valid card and sees confirmation", () => {});
    it("confirmation page shows transaction ID and amount", () => {});
  });
  describe("Validation", () => {
    it("expired card shows expiration error on card field", () => {});
    it("missing CVV prevents submission and highlights CVV field", () => {});
  });
  describe("Edge Cases", () => {
    it("session timeout during submission redirects to login", () => {});
    it("double-click submit only processes one payment", () => {});
  });
});
```

### Describe Blocks Can Mirror State Machines

When a feature has distinct states (loading, loaded, error, empty), structure describe blocks to match.
This makes it obvious which states are tested and which are not.

```typescript
describe("Account List", () => {
  describe("Loading state", () => {
    it("shows skeleton placeholder while the query is pending", () => {});
  });
  describe("Loaded state (has data)", () => {
    it("displays an account card for each account returned", () => {});
    it("each card shows account number and balance", () => {});
  });
  describe("Empty state (no data)", () => {
    it("shows 'no accounts found' message when the API returns an empty array", () => {});
  });
  describe("Error state", () => {
    it("shows error banner when the API returns 500", () => {});
    it("shows retry button that re-fetches accounts", () => {});
  });
  describe("Transitions", () => {
    it("retry from error state returns to loading then loaded", () => {});
    it("navigating away and back reloads from loading state", () => {});
  });
});
```

Reading the describe tree reveals the state machine: four states (loading, loaded, empty, error) and
two transitions (retry, re-navigation). A developer adding a new state (e.g., "offline") knows exactly
where to add the describe block.

### Assertions Document Contracts

Each assertion states a system guarantee. Prefer specific assertions that would break if the contract
changes over generic "is present" checks.

**Bad:** `expect(screen.queryByTestId("result")).toBeInTheDocument()`
**Good:** `expect(screen.getByText("Payment of $42.50 confirmed")).toBeInTheDocument()`

For a Hono handler or Drizzle query, assert the shape and values, not just truthiness:

**Bad:** `expect(res.ok).toBe(true)`
**Good:** `expect(await res.json()).toEqual({ id: 1, balance: 157.50 })`

Add a brief comment only when the *why* is non-obvious:

```typescript
// the API returns the new balance after the payment is applied
expect(await res.json()).toMatchObject({ balance: 157.50 });
```

### Mocks Document Dependencies

Mock setup is dependency documentation. Name mock helpers to show what external systems the feature
touches.

```typescript
// feature depends on: payment gateway, account service, notification service
mockPaymentGatewayApproval();
mockAccountBalanceLookup({ balance: 200.0 });
mockNotificationPreferences({ email: true });
```

### Comments

Never add a comment that explains what the code does. Add a single `//` line only when the *why* is
non-obvious — a hidden domain constraint, a subtle invariant, or a domain concept the test name alone
cannot convey. Hard cap: one `//` line. No block comments.

Bad — explains test mechanics:
```typescript
// mock the payment API to return a 200 response
```

Good — domain constraint the name can't capture:
```typescript
// a billing freeze blocks payment submission — account state-machine constraint
```

---

## Self-Check

Before finishing a test file, verify:

1. Can someone who has never seen the app understand the feature by reading test names alone?
2. Do describe blocks read as a feature outline?
3. Do assertions state what the system guarantees, not just that something exists?
4. Do mocks make it clear what external systems are involved?
5. Would a new developer know where to add a test for a new requirement?
6. If the feature has distinct states (loading, loaded, error, empty, etc.), do describe blocks mirror
   those states? Could you draw the state diagram from the test structure?