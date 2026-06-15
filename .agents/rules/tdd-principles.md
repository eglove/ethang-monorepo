---
description: Covers Red-Green-Refactor scientific method, Vitest it.each parameterized test syntax, unit and integration test conventions, RED/GREEN validation steps, and trust-the-problem hypothesis discipline. Use before writing any tests.
trigger: model_decision
---

# TDD Principles & Test Conventions

## 1. Domain Theory and Conceptual Foundations
Test-Driven Development (TDD) represents a software construction practice where verification drives design. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 5 (Software Testing) and Chapter 4 (Software Construction), TDD shifts testing from a post-facto verification stage to an active design phase. This ensures that all code is testable, decoupled, and directly traceable to specified requirements.

### 1.1 The Scientific Method and Falsifiability
TDD operates as an application of the scientific method:
1. **Hypothesis**: The test case acts as a formal hypothesis of the system's behavior (e.g., "Given X, the SUT shall produce Y").
2. **Experimentation (RED Phase)**: The test is executed against the system *before* any implementation code is modified. The test must fail. This falsification step (derived from Karl Popper's falsifiability criterion in the philosophy of science) verifies that the test is capable of detecting faults. A test that passes before any code is changed is scientifically invalid; it does not verify anything.
3. **Conclusion (GREEN Phase)**: The minimal production code is written to make the test pass. The passing test proves the correctness of the implementation.
4. **Refinement (REFACTOR Phase)**: The implementation is cleaned and optimized, keeping the test suite green to verify that no regressions are introduced.

### 1.2 Test Double Taxonomy
SWEBOK v4 Chapter 5 defines various categories of test doubles used to stand in for real collaborators during unit testing:
- **Dummy**: Objects that are passed around but never actually used or invoked. Usually, they are used to satisfy parameter lists.
- **Stub**: Provides canned answers to calls made during the test, usually not responding to anything outside what's programmed for the test.
- **Spy**: Stubs that also record metadata about how they were called (e.g., call count, arguments received).
- **Mock**: Objects pre-programmed with expectations that form a specification of the calls they are expected to receive. They verify interaction protocols.
- **Fake**: Have working implementations, but usually take shortcuts that make them unsuitable for production (e.g., an in-memory database).

### 1.3 State-Space Coverage vs. Path Coverage
Testing adequacy cannot be measured by code path coverage (lines, branches) alone. SWEBOK v4 Chapter 5 emphasizes that statement coverage can be high while critical boundary conditions and input states remain untested. High-integrity testing requires covering the entire state-space of the inputs, including:
- **Normal Range**: Valid inputs within expected parameters.
- **Boundary Limits**: Inputs at the exact edges of valid domains (e.g., empty strings, maximum numbers, zero).
- **Error Conditions**: Invalid types, network failures, database errors, and timeouts.
- **Asynchronous States**: Parallel operations, race conditions, and loading/error states.

## 2. Standard Operating Procedures (SOP)
The agent must execute these procedures when designing, writing, and executing tests in this workspace.

### Step 2.1: Structuring Vitest Unit Tests
Write unit tests using Vitest, grouping behaviors using nesting and descriptive strings:
1. **Nesting**: Group tests under a top-level `describe("moduleName")`, followed by a sub-`describe("methodName")`, and individual `it("should...")` blocks.
2. **Behavior Descriptions**: Avoid vague test names. Write names as clear requirements (e.g., `it("should return false when input is an empty string")`).
3. **Arrow Functions**: Ensure all test blocks, hooks (`beforeEach`), and helpers are written using arrow functions:
   ```typescript
   describe("validateInput", () => {
     it("should return false when input is undefined", () => {
       const result = validateInput(undefined);
       expect(result).toBe(false);
     });
   });
   ```

### Step 2.2: Parameterized Testing via it.each()
Avoid copy-pasting test blocks. Use Vitest's `it.each()` to cover the input state-space in a structured table:
```typescript
it.each([
  { expected: false, input: undefined },
  { expected: false, input: "" },
  { expected: true, input: "valid-account" }
])("validateInput($input) -> $expected", ({ input, expected }) => {
  expect(validateInput(input)).toBe(expected);
});
```

### Step 2.3: Writing React/TanStack Query Integration Tests
When writing integration tests for React components that use TanStack Query:
1. **Isolate Client**: Instantiates a fresh `QueryClient` inside each test to prevent cross-test cache contamination.
2. **Provide Context**: Wrap the rendered component in a `QueryClientProvider`.
3. **Mock at the Boundary**: Mock the network fetch boundary using `vi.spyOn(globalThis, "fetch")`. Never mock the TanStack query hooks or components.
   ```typescript
   import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
   import { render, screen } from "@testing-library/react";

   describe("AccountList (integration)", () => {
     it("should render loaded accounts from mock network", async () => {
       const queryClient = new QueryClient({
         defaultOptions: { queries: { retry: false } }
       });
       
       vi.spyOn(globalThis, "fetch").mockResolvedValue(
         new Response(JSON.stringify([{ balance: 100, id: "1" }]), { status: 200 })
       );

       render(
         <QueryClientProvider client={queryClient}>
           <AccountList />
         </QueryClientProvider>
       );

       expect(await screen.findByText("$100.00")).toBeInTheDocument();
     });
   });
   ```

### Step 2.4: Running RED-Phase Tests
Before writing any production code, run Vitest to verify the test fails:
```bash
rtk pnpm --filter <package-name> exec vitest run <path/to/file.test.ts> --no-coverage
```
Verify that the failure is due to a failing assertion (e.g., expected true, received false), not a TypeScript compile error, import error, or syntax fault.

### Step 2.5: The Refactor Phase (Fearless Refactoring)
Once the tests are green, the refactoring phase begins. Clean and optimize code with absolute confidence:
1. **Identify Code Smells**: Check for long methods, duplicate code blocks, magic numbers, or poor naming.
2. **Refactor Safely**: Modify the code to improve its structure.
3. **Verify Functionality**: Run the tests continuously during refactoring. If a test fails, the refactoring step is broken—stop and resolve the drift before proceeding.

### Step 2.6: Comprehensive TDD Example
Below is an example of a complete TDD cycle, building a simple premium user validator class:

```typescript
import { vi } from "vitest";

interface UserAccount {
  id: string;
  balance: number;
  isPremium: boolean;
}

class UserValidator {
  private thresholdBalance: number;

  public constructor(thresholdBalance: number) {
    this.thresholdBalance = thresholdBalance;
  }

  public evaluatePremiumStatus = (user: UserAccount | undefined): boolean => {
    if (undefined === user) {
      return false;
    }
    const currentBalance = user["balance"];
    return currentBalance >= this.thresholdBalance;
  };
}

describe("UserValidator Premium Checks", () => {
  it.each([
    { expected: true, user: { id: "1", balance: 500, isPremium: false } },
    { expected: false, user: { id: "2", balance: 100, isPremium: false } },
    { expected: false, user: undefined }
  ])("should evaluate premium status to $expected", ({ user, expected }) => {
    const validator = new UserValidator(300);
    const result = validator.evaluatePremiumStatus(user);
    expect(result).toBe(expected);
  });

  it("should execute void method checks without throwing", () => {
    const validator = new UserValidator(300);
    expect(() => {
      validator.evaluatePremiumStatus(undefined);
    }).not.toThrow();
  });
});
```

## 3. Agent Compliance Checklist
The agent must verify compliance with the following TDD principles during coding and verification:

- [ ] **Red-Phase Executed**: Was the test executed and observed to fail before modifying production code?
- [ ] **Falsification Confirmed**: Did the test fail for the expected assertion reason during the RED phase?
- [ ] **Minimal implementation**: Was only the minimum production code written to satisfy the failing test?
- [ ] **Unit Isolation**: Do all unit tests isolate the SUT by replacing dependencies with stubs or mocks?
- [ ] **Integration Boundary**: Do integration tests mock only external network or database boundaries?
- [ ] **Query client cleanup**: In React tests, is a fresh `QueryClient` created for each test case?
- [ ] **Vitest Parameterization**: Are all multi-input test variations organized using `it.each()` tables?
- [ ] **No Copy-Pasted Tests**: Did the agent verify that no duplicate test blocks exist in the file?
- [ ] **Behavior Naming**: Are all test descriptions written as plain-English user-visible behaviors?
- [ ] **Arrow Functions Enforced**: Are all describe blocks, test blocks, and hook callbacks arrow functions?
- [ ] **No Explicit Return Types**: Do all TypeScript test methods and helpers omit explicit return types?
- [ ] **Explicit Member Modifiers**: Are all members of mock classes decorated with public/private accessibility?
- [ ] **Bracket notation**: Are dynamic property accesses on index-signature types written using bracket notation?
- [ ] **Void assertion wrapping**: Are tests for void functions wrapped in `expect(() => ...).not.toThrow()`?
- [ ] **Test Co-location**: Is the test file co-located in the same directory as the source file (e.g., `*.test.ts`)?
- [ ] **No Weakened Tests**: Did the agent verify that no existing assertions were deleted or weakened?
- [ ] **Coverage Gate ratchet**: Did the agent verify that coverage met or exceeded the established threshold?
- [ ] **No Forbidden Terminology**: Has the test code been scanned to ensure zero forbidden words are present?
- [ ] **No Git Commit executed**: Did the agent ensure that no commits or pushes were made to git?
- [ ] **SWEBOK Construction Alignment**: Does the test design conform to SWEBOK v4 Chapter 4/5 guidelines?
- [ ] **Test Double Suitability**: Did the agent select the appropriate test double (stub, spy, mock, fake) based on the collaborator relationship?
- [ ] **Refactor Phase Verified**: Were tests executed continuously during refactoring to guarantee no regressions?
- [ ] **Karl Popper Falsifiability**: Was the RED phase test failure verified to be due to assertion failure rather than a syntax or compile error?
