---
description: Covers behavior-description test naming, state-machine describe block structure, specific contract assertions, mock setup as dependency documentation, and a completeness self-check. Use when writing or reviewing any test file.
trigger: model_decision
---

# Tests as Executable Documentation

## 1. Domain Theory and Conceptual Foundations
In modern software engineering, test suites serve as the primary source of executable documentation. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 4 (Software Construction) and Chapter 10 (Software Quality), code maintainability is highly dependent on how easily a developer can understand a module's specifications, interfaces, and dependencies. Traditional static documentation (e.g. text files, wiki pages) frequently suffers from "documentation drift"—where the implementation evolves but the documentation remains un-updated, leading to incorrect assumptions and architectural decay.

Executable documentation solves this drift. Because tests are executed continuously in verification pipelines, any change in system behavior that violates the specification will fail the tests, forcing the developer to update the test specifications. A test suite must read like a formal specification, explaining:
1. The functional capabilities and business requirements of the system.
2. The architectural boundaries, interfaces, and data models of the module.
3. The external collaborators, databases, and third-party APIs the module depends on.
4. The error handling protocols, invariants, and pre/post-conditions.

### 1.1 Behavior-Driven Test Naming
Test cases should be named using plain-English behavioral statements rather than technical implementation details. This follows the principles of Behavior-Driven Development (BDD). A test name should state the initial context, the event, and the expected outcome (e.g. "Given an authenticated user, when they click submit with a valid payload, the system shall save the record and return a success token"). If a developer has to read the production code to understand what a test is checking, the test has failed in its documentation role.

### 1.2 Design-by-Contract Verification
Design-by-Contract (DbC) is a software design methodology that prescribes formal, precise, and verifiable interface specifications for software components. Tests document and verify these contracts:
- **Preconditions**: What must be true before a method executes (documented by test setup and parameter ranges). If a precondition is violated, the code must fail predictably (e.g., throwing a validation error).
- **Postconditions**: What the method guarantees to be true upon completion (documented by assertions on outputs and return values).
- **Invariants**: What remains unchanged throughout the execution (documented by assertions on state consistency, verifying that the database or object state has not drifted into an invalid configuration).

### 1.3 AAA (Arrange-Act-Assert) Formatting
Every self-documenting test should follow the Arrange-Act-Assert (AAA) pattern, clearly demarcated by spacing:
- **Arrange**: Set up the SUT and configure mock collaborators. This section acts as documentation of the component's required inputs and dependencies.
- **Act**: Execute the single operation under test. This represents the triggering event.
- **Assert**: Verify the postconditions and expectations. This documents the expected system responses.

By structuring every test according to AAA, any developer reading the code can immediately locate the system's preconditions (Arrange), the triggering operation (Act), and the postconditions being verified (Assert). This pattern minimizes cognitive overhead.

## 2. Standard Operating Procedures (SOP)
The agent must structure test suites to act as readable, self-documenting specifications of the code under test.

### Step 2.1: Structuring Describe Blocks as Outline Specifications
Use nested describe blocks to mirror the logical structure of the component's specification.
1. **Top-Level**: Name the component or service under test.
2. **Second-Level**: Group by state configuration or event category.
3. **Third-Level (Test Block)**: Describe the specific requirement being verified.

```typescript
describe("AccountService", () => {
  describe("when account is active", () => {
    it("should allow withdrawal if balance is sufficient", () => {
      // test body
    });

    it("should reject withdrawal if balance is insufficient", () => {
      // test body
    });
  });

  describe("when account is suspended", () => {
    it("should reject all transactions with AccountSuspendedError", () => {
      // test body
    });
  });
});
```

### Step 2.2: Self-Documenting Mock Setups
Set up mock collaborators to clearly document the external dependencies of the system under test. Mocks should not be black boxes; they should show what inputs are expected and what outputs are returned:
```typescript
class MockPaymentGateway {
  public executePayment = (amount: number): Promise<boolean> => {
    // Documents that the system expects a positive number and returns a boolean
    if (amount <= 0) {
      throw new Error("Invalid amount");
    }
    return Promise.resolve(true);
  };
}
```

### Step 2.3: Comments Bounding Rules
To ensure the test remains clean and readable, never add comments that explain *what* the code does. Add a comment only to explain *why* a non-obvious domain rule or technical workaround is present.
1. **Comment Limit**: Keep comments to a single line starting with `//`.
2. **No Block Comments**: Never use multi-line or block comments (`/* ... */`) in test files.
3. **Mechanics Avoidance**: Never write comments like `// mock the database` or `// assert value is true`.

### Step 2.4: Given-When-Then BDD Mapping
When translating requirements to tests, map BDD specifications directly to AAA structures:
- **Given** (context) maps to **Arrange**.
- **When** (event) maps to **Act**.
- **Then** (expectation) maps to **Assert**.

### Step 2.5: Self-Documenting Test Suite Example
Below is a complete, self-documenting test suite illustrating these rules in practice.

```typescript
import { vi } from "vitest";

interface Transaction {
  id: string;
  amount: number;
  type: "deposit" | "withdrawal";
}

class LedgerService {
  private transactions: Transaction[];

  public constructor() {
    this.transactions = [];
  }

  public postTransaction = (tx: Transaction): void => {
    // Precondition check
    if (tx["amount"] <= 0) {
      throw new Error("Amount must be positive");
    }
    this.transactions.push(tx);
  };

  public getTransactions = (): Transaction[] => {
    return this.transactions;
  };
}

describe("LedgerService Specifications", () => {
  describe("Posting Transactions (DbC Verification)", () => {
    it("should record transaction when amount is positive", () => {
      // Arrange
      const service = new LedgerService();
      const tx: Transaction = { id: "tx-1", amount: 150, type: "deposit" };

      // Act
      service.postTransaction(tx);

      // Assert (Postcondition)
      const list = service.getTransactions();
      expect(list).toHaveLength(1);
      expect(list[0]?.["amount"]).toBe(150);
    });

    it("should throw error when amount is negative", () => {
      // Arrange
      const service = new LedgerService();
      const tx: Transaction = { id: "tx-2", amount: -50, type: "withdrawal" };

      // Act & Assert (Precondition violation check)
      expect(() => {
        service.postTransaction(tx);
      }).toThrow("Amount must be positive");
    });
  });
});
```

## 3. Agent Compliance Checklist
The agent must verify that the test suite serves as executable documentation prior to task completion:

- [ ] **Descriptive Naming**: Are all test cases named using plain-English behavioral requirements?
- [ ] **No Vague Names**: Are vague names like `should work`, `test-case`, or `edge-case` completely avoided?
- [ ] **Describe Outlining**: Do nested describe blocks form a readable outline of the feature's specifications?
- [ ] **DbC Assertions**: Do assertions explicitly verify preconditions, postconditions, and invariants?
- [ ] **Collaborator Documentation**: Do mocks clearly document the interfaces and outputs of external systems?
- [ ] **No Code Explanatory Comments**: Are comments explaining code mechanics omitted from test files?
- [ ] **Comment Limit Confirmed**: Are all remaining comments single-line (`//`) and restricted only to explaining "why"?
- [ ] **No Block Comments**: Did the agent verify that there are no block comments in the test files?
- [ ] **Self-Contained Setup**: Can a new developer understand the module's dependencies by reading the test setup?
- [ ] **Co-located placement**: Is the test file co-located next to the corresponding source file?
- [ ] **Arrow Functions Enforced**: Are all describe blocks, tests, and mock methods written using arrow functions?
- [ ] **No Explicit Return Types**: Do all TypeScript test helpers rely on type inference rather than declaring return types?
- [ ] **Explicit Member Modifiers**: Do all mock classes use explicit public/private modifiers for properties?
- [ ] **Bracket notation**: Are dynamic property checks on test results written using bracket notation?
- [ ] **Void assertion wrapping**: Are void method assertions wrapped in `expect(() => ...).not.toThrow()`?
- [ ] **No Forbidden Terminology**: Has the test file been scanned to verify zero forbidden words are present?
- [ ] **No Git Commit executed**: Did the agent ensure that no git commits or pushes were executed?
- [ ] **SWEBOK Quality Alignment**: Does the test documentation structure align with SWEBOK v4 Chapter 4/10 standards?
- [ ] **AAA Formatting Applied**: Are Arrange, Act, and Assert blocks clearly separated by line breaks?
- [ ] **Living Spec Verification**: Was the test suite run successfully to verify that documentation matches behavior?
- [ ] **Documentation Drift Prevented**: Are all requirement modifications immediately reflected in updated test cases?
- [ ] **Given-When-Then Mapping**: Are BDD requirements explicitly traceable to their corresponding test blocks?
