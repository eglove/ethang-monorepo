---
trigger: always_on
---

# Test-Driven Development (Red -> Green -> Refactor)

## 1. Domain Theory and Conceptual Foundations
Test-Driven Development (TDD) is a software construction process that reorganizes the relationship between design, implementation, and verification. Rather than treating verification as a post-facto quality gate, TDD integrates verification directly into the design phase. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 4 (Software Construction) and Chapter 5 (Software Testing), TDD is a core construction practice that drives code quality and design simplicity. By writing tests before writing the corresponding production code, engineers establish a formal specification of the system's expected behavior, preventing design creep and ensuring high testability.

### 1.1 The Scientific Method and Falsifiability
At its core, TDD is an application of the scientific method to software development. Each test case represents a hypothesis: "The system under test, when subjected to stimulus X under conditions Y, will produce outcome Z."
In scientific inquiry, a hypothesis must be falsifiable. If a test is written *after* the production code is implemented, there is a risk that the test is unconsciously tailored to match the code's actual behavior, rather than its specified behavior. A test that passes on its very first run before any production code is modified is scientifically invalid—it fails to prove that the test is capable of detecting a defect. The "Red" phase of TDD is the falsification step; running the test and observing it fail confirms that the test is a valid detector for the specified behavior. Without this Red step, the engineer has no empirical evidence that the test validates the system's compliance.

### 1.2 State Space Coverage vs. Code Path Coverage
Traditional testing approaches often rely on code path coverage (e.g., statement coverage, branch coverage) as the primary metric of test adequacy. However, SWEBOK v4 Chapter 5 notes that path coverage can be deceptive; a system can have 100% statement coverage while failing to handle critical input states, boundary conditions, or race conditions.
TDD prioritizes state-space coverage over line coverage. State-space coverage requires identifying all distinct inputs, boundary configurations, and error conditions a unit can receive:
1. Valid inputs within normal operating bounds.
2. Invalid inputs (empty, null, undefined).
3. Boundary values at the edge of input domains (e.g., $N = 0$, $N = 	ext{max}$).
4. Error states, exceptions, and network timeouts.
5. Asynchronous state transitions and race conditions.
Designing tests to explore these dimensions ensures that the system behaves deterministically under all scenarios.

### 1.3 Refactoring and Technical Debt Minimization
Refactoring is the process of changing a software system in such a way that it does not alter the external behavior of the code, yet improves its internal structure. SWEBOK v4 Chapter 4 highlights refactoring as a key discipline for managing technical debt. In the TDD cycle, refactoring is not an optional cleanup step; it is the phase where architectural design decisions are refined. Because the test suite is already "Green" (passing), the engineer can aggressively restructure the code—simplifying complex conditional structures, removing duplication, renaming variables, and improving modularity—with absolute confidence that no regressions are being introduced.

### 1.4 Architectural Feedback Loops
TDD acts as a diagnostic tool for architectural quality. If a class or function is difficult to test, it is typically a sign of poor design—such as high coupling, low cohesion, or hidden dependencies. When an engineer is forced to write a test first, they are immediately exposed to the ergonomics of the API they are designing. This early feedback loop drives the creation of decoupled, modular components that communicate via clean interfaces rather than concrete, hard-to-mock implementations.

### 1.5 Test Double Taxonomy and Mocking Strategies
In unit and integration testing, isolating the unit under test from its dependencies is critical. SWEBOK v4 Chapter 5 defines various categories of test doubles used to stand in for real collaborators:
- **Dummy**: Passed around but never actually used (e.g., to fill parameter lists).
- **Stub**: Provides canned answers to calls made during the test.
- **Spy**: Stubs that also record invocation metadata (e.g., call counts).
- **Mock**: Programmed with expectations to verify specific interaction protocols.
- **Fake**: Working implementations with shortcuts unsuitable for production (e.g., in-memory DB).
Choosing the correct test double is essential for preventing fragile tests that break during refactoring. Mocks should be reserved for verifying interactions across system boundaries, while stubs and fakes are preferred for querying state or providing test context.



## 2. Standard Operating Procedures (SOP)

### Step 2.1: The Red Phase (Hypothesis Design)
Before writing any production code, draft a failing test:
1. Define the interface or function signature of the unit under test.
2. Write a test case that calls this unit with a specific input.
3. Assert the expected output or behavior using clear, descriptive assertions.
4. Execute the test runner (e.g., Vitest) and verify that the test fails.
5. Confirm that the test fails for the expected reason (e.g., the function returns undefined or throws a method-not-implemented error), not due to syntax or import issues.

### Step 2.2: The Green Phase (Conclusion Implementation)
Write the minimum amount of production code required to make the failing test pass:
1. Avoid designing ahead or writing generic utility methods that are not yet required.
2. Use hardcoded return values if that is the simplest way to satisfy the test case.
3. Run the test runner and verify that the test transitions from Red to Green.
4. Do not proceed to the next feature until the current test is passing.

### Step 2.3: The Refactor Phase (Structural Optimization)
Clean and optimize the code while maintaining the Green status:
1. Analyze the newly written code for duplicate strings, magic numbers, or deep nesting.
2. Extract common logic into helper methods or variables, ensuring that all helper functions are written using arrow functions.
3. Ensure no explicit return types are declared on local helper functions, allowing TypeScript to infer the type.
4. Add explicit accessibility modifiers (`public`, `private`, `protected`) to all class members and properties.
5. Run the test suite continuously to guarantee that the refactored code remains functional.

Below is a compliant implementation demonstrating the complete cycle for an input sanitizer class:

```typescript
interface ValidationResult {
  output: string;
  isValid: boolean;
}

class InputSanitizer {
  private defaultReplacement: string;

  public constructor(replacement: string) {
    this.defaultReplacement = replacement;
  }

  public sanitize = (input: string | undefined): ValidationResult => {
    if (undefined === input) {
      return { isValid: false, output: this.defaultReplacement };
    }
    const trimmed = input.trim();
    if ("" === trimmed) {
      return { isValid: false, output: this.defaultReplacement };
    }
    return { isValid: true, output: trimmed };
  };
}

describe("InputSanitizer", () => {
  it.each([
    { input: "  hello  ", expected: "hello", isValid: true },
    { input: undefined, expected: "default", isValid: false },
    { input: "   ", expected: "default", isValid: false }
  ])(
    "should sanitize '$input' to '$expected' with validation '$isValid'",
    ({ input, expected, isValid }) => {
      const sanitizer = new InputSanitizer("default");
      const result = sanitizer.sanitize(input);
      expect(result["output"]).toBe(expected);
      expect(result["isValid"]).toBe(isValid);
    }
  );
});
```

### Step 2.4: Parameterized State Testing
Avoid duplicating test blocks for different inputs. Use parameterized testing (`it.each`) to cover the state space:
1. Define a list of input-output cases representing different boundaries, error paths, and normal scenarios.
2. Use dynamic bracket notation when accessing index-signature properties in tests (e.g., `result["output"]`).
3. Ensure that if a void function is tested to execute without errors, you wrap the call in a try/catch or expect assertion: `expect(() => { fn(); }).not.toThrow();`.

### Step 2.5: Test Placement and Maintenance
1. Place unit test files in the same directory as the source code under test, using the `*.test.ts` suffix.
2. If a test fails after a code change, read the failure carefully before modifying the test. Never weaken or delete a test case to hide a regression; a failing test indicates a broken assumption.

### Step 2.6: Eliminating Test Code Duplication
When multiple test files require identical configuration variables or mocked payloads, centralize those constants in a dedicated testing utility file. Because ES modules hoist imports, importing these values preserves evaluation order and satisfies static code analyzers.

## 3. Agent Compliance Checklist

- [ ] **Red Phase First**: Did you write a failing test and observe it fail before modifying production code?
- [ ] **Hypothesis Verified**: Did the test fail for the expected reason rather than a compile-time or syntax error?
- [ ] **Minimal Green Code**: Did you write only the minimum code needed to pass the failing test?
- [ ] **Refactoring Done**: Did you refactor the code for structure and readability after passing the test?
- [ ] **Tests Kept Green**: Did all tests remain green throughout the entire refactoring phase?
- [ ] **State Space Covered**: Did you cover valid inputs, invalid inputs, boundary values, and error states?
- [ ] **Vitest Parameterization**: Did you use `it.each` to organize multi-input test variations?
- [ ] **Arrow Functions Enforced**: Are all functions in code examples and tests formatted as arrow functions?
- [ ] **No Explicit Return Types**: Did you omit explicit return types on TypeScript function definitions?
- [ ] **Explicit Member Access**: Are all class members annotated with explicit `public` or `private` modifiers?
- [ ] **Bracket Notation Applied**: Did you access properties of index-signature objects using bracket notation?
- [ ] **Assertion in Void Tests**: Did you use `expect(() => ...).not.toThrow()` for asserting error-free void execution?
- [ ] **Test File Location**: Is the test file placed in the same directory as the corresponding source file?
- [ ] **No Weakened Tests**: Did you refrain from weakening assertions to bypass failing tests?
- [ ] **No Forbidden Terminology**: Has the file been scanned to ensure no banned words (e.g. tracking systems) are present?
- [ ] **SWEBOK Standards Alignment**: Does the rule ground TDD concepts in SWEBOK v4 construction and testing domains?
- [ ] **No Duplicate Constants**: Are duplicate test strings centralized in a dedicated constants file if required?
- [ ] **Feedback Loop Monitored**: Did you check that the test difficulty feedback was evaluated to improve design?
- [ ] **Test Double Suitability**: Did you select the appropriate test double (stub, spy, mock, fake) based on the collaborator relationship?
- [ ] **Asserting Void Executions**: Did you wrap void method executions in `expect(() => ...).not.toThrow()`?
- [ ] **SonarQube Duplication Rules**: Did you extract duplicate strings into constants to prevent duplication flags?
