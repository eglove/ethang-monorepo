---
description: test-first programming, TDD loops, and construction feedback
trigger: model_decision
---

# Test-First Programming

## 1. Domain Theory and Conceptual Foundations
Test-first programming—commonly referred to as Test-Driven Development (TDD)—is a disciplined software construction process where automated test cases are written prior to the corresponding production code. As outlined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 6 (Software Construction), TDD is not merely a testing technique but a design methodology that guides construction, establishes code contracts, and ensures rapid feedback.

### 1.1 The Red-Green-Refactor Lifecycle
The TDD process follows a strict, repeating three-phase cycle:
1. **Red**: Write a single, failing unit test that specifies a desired improvement or new capability. The test must fail when executed, proving that the capability does not yet exist or that the bug is reproducible.
2. **Green**: Write the absolute minimum amount of production code required to make the failing test pass. The focus is strictly on correctness and achieving a green status, ignoring performance and refactoring concerns for the moment.
3. **Refactor**: Improve the design, readability, and structure of both the production and test code while keeping the test suite green. This includes removing duplication, simplifying conditionals, clarifying naming, and ensuring single responsibility.

### 1.2 The Scientific Method Analogy
TDD can be modeled as an application of the scientific method to software construction:
- **Hypothesis**: The unit test represents a hypothesis about how the system should behave under specific conditions.
- **Experiment**: Running the test and observing it fail (Red) confirms that the hypothesis is testable and that the current codebase does not satisfy it. If the test passes before code is written, the experiment is invalid (e.g., the test is a false positive or the behavior already exists).
- **Conclusion**: Writing production code and watching the test pass (Green) proves the hypothesis correct, establishing a verified baseline.

### 1.3 State Coverage vs. Line Coverage
While line coverage measures which lines of code were executed, **state coverage** measures whether the tests cover all possible logical states, boundary inputs, and transitions. Test-first programming requires developers to design tests for:
- Nominal inputs (valid data paths).
- Boundary values (minimum, maximum, and empty states).
- Error pathways (exceptions, resource timeouts, and network failures).
- Concurrency and race conditions (e.g., duplicate submissions).

### 1.4 API Design and Client-First Perspective
Writing tests first forces the developer to adopt the perspective of the **client** of the API. Before implementing a class or function, the developer must decide how it will be imported, instantiated, and called. This drives:
- Smaller, more focused interfaces (since complex interfaces are harder to test).
- Reduced coupling (since coupled classes are difficult to isolate in unit tests).
- Explicit contract documentation (since the test suite serves as executable documentation of the API).

### 1.5 Mocks, Stubs, and Spies (Test Doubles)
TDD requires isolating the unit under test from its dependencies using test doubles:
- **Stubs**: Provide canned answers to calls made during the test, usually not responding to anything outside what's programmed for the test. Used to simulate database records or API responses.
- **Mocks**: Objects pre-programmed with expectations which form a specification of the calls they are expected to receive. Mocks verify behavioral contracts (e.g., asserting that a mailer service was invoked exactly once with specific arguments). Developers can use dynamic mock generation (e.g., `vi.fn()` or `vi.mock()`) or write explicit manual stub classes.
- **Mock Hoisting Safeguards**: Under frameworks like Vitest, calls to `vi.mock` are hoisted to the very top of the ES module block prior to evaluation. If a mock reference relies on variables declared in the test file scope, it throws a runtime `ReferenceError`. To prevent this, mock classes must be imported rather than declared as variables/classes in the test file scope.
- **Constructible Mock Patterns**: When mocking classes in tests to comply with `max-classes-per-file` rules, standard ES6 class mock definitions should be isolated to their own separate files (one class per file, and nothing else), rather than using arrow functions.
- **Resolving String Duplication**: Centralizing duplicate string literals in a dedicated `test-constants.ts` file successfully addresses SonarQube's `sonar/no-duplicate-string` rule. Since imports are hoisted, these constants can be cleanly referenced in both `vi.mock` factories and test cases.
- **Spies**: Stubs that also record some information based on how they were called (e.g., storing the number of invocations or arguments passed).
In TDD, stubs and mocks prevent tests from making real database or network connections, ensuring unit tests run within milliseconds.

### 1.6 TDD as an Enablement for Refactoring and Documentation
Without a comprehensive test suite, developers suffer from the "fear of changing code" anti-pattern, where legacy code is left un-refactored because engineers cannot predict the side effects of modifications. TDD addresses this by creating a safety net:
- The suite of unit tests validates that the system's observable behavior remains unchanged during internal restructuring.
- Engineers can refactor complex conditionals, eliminate duplicate code, and update dependencies with confidence.
- If a refactoring change breaks an existing behavior, the safety net alerts the developer instantly, preventing regression defects from reaching version control.
- **TDD as Documentation**: The test file serves as the definitive reference manual for the code. It records developer intent and specifications, remaining fully accurate and verified on every execution cycle.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures to execute TDD:

### Step 2.1: Write a Failing Unit Test
Before modifying or writing any production code, create or open the matching test file (e.g., `*.test.ts` next to the target module):
- Define a clear, descriptive test name outlining the expected behavior (e.g., `it("should throw a ValidationError when email is invalid", () => { ... })`).
- Write the test assertions, instantiating the class and invoking the method under test.

### Step 2.2: Execute the Test and Observe it Fail
Run the targeted test suite using the workspace runner:
```bash
rtk pnpm --filter @ethang/agents-build exec vitest run src/path/to/module.test.ts
```
- Verify that the test fails (Red) and that the failure message is directly related to the missing capability (not a syntax or compile error).

### Step 2.3: Implement the Minimum Production Code
Write the simplest production code that makes the test pass:
- Do not write extra functions, handle hypothetical edge cases, or optimize loops yet.
- Focus exclusively on resolving the specific assertion failure.
- Run the test suite and confirm that it turns green.

### Step 2.4: Refactor the Code
Clean up the implementation while running the tests continuously:
- Extract helper functions to simplify long methods.
- Rename variables to match the domain's ubiquitous language.
- Audit imports to ensure no architectural boundaries are violated.
- Verify that all tests remain green after each minor refactor.

### Step 2.5: Expand State Coverage
Write additional tests to cover boundaries and edge cases:
- Use Vitest `it.each` tables to parameterize inputs and expected outputs.
- Test empty inputs, null values, and maximum constraints.
- Once all states are green and fully refactored, compile and lint the package.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria regarding test-first programming:

- [ ] **Failing Test First**: Did the agent write a failing unit test before modifying any production code?
- [ ] **Verified Test Failure**: Was the test executed and confirmed to fail with a relevant assertion message?
- [ ] **Minimum Code to Pass**: Is the production code limited to the minimum necessary to satisfy the test assertion?
- [ ] **Refactoring Phase Executed**: Was the code refactored for readability and simplicity after turning green?
- [ ] **Tests Kept Green**: Did the agent verify that the test suite remained green throughout the refactoring phase?
- [ ] **State Coverage Applied**: Do the tests cover multiple input states, including nominal, boundary, and error cases?
- [ ] **it.each Parameterized Table**: Are parameterized test tables (`it.each`) used to cover multiple data permutations?
- [ ] **No False Positives**: Has the agent verified that the test does not pass prior to the production code changes?
- [ ] **Isolated Unit Boundaries**: Are external network, database, and system calls mocked out in the unit tests?
- [ ] **Descriptive Test Naming**: Do test names clearly describe the expected behavior and system state?
- [ ] **Test File Location**: Is the test file located next to or in the same package as the code under test?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content escaped to prevent string termination?
- [ ] **Error Path Tests**: Are there explicit tests asserting that exceptions are thrown and handled correctly?
- [ ] **Sonar Assertions wrapped**: Do test cases verifying that a void method executes without issues wrap the call in `expect(() => ...).not.toThrow()`?
- [ ] **Walkthrough Verification**: Does the `walkthrough.md` document the red, green, and refactor stages?
- [ ] **Task List Sync**: Do tasks in `task.md` break down the feature implementation into red, green, and refactor steps?
- [ ] **TypeScript Null Checks**: Are test assertions compatible with strict null checks (e.g., using optional chaining)?
- [ ] **Explicit Member Access**: Are all methods and properties on test utility modules declared with explicit accessibility modifiers?
