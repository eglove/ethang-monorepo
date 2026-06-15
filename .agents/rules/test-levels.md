---
description: test levels, unit tests, integration tests, and acceptance test boundaries
trigger: model_decision
---

# Test Levels

## 1. Domain Theory and Conceptual Foundations
Software testing is structured into distinct, incremental levels to ensure that defects are captured at the earliest possible stage and that validation occurs at the appropriate scale. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 5 (Software Testing), organizing testing into separate levels helps manage complexity, isolate root causes, and systematically verify compliance with requirements.

### 1.1 SWEBOK Classification of Test Levels
Testing is executed across a hierarchy of four primary levels:
1. **Unit Testing**: Focuses on verifying the smallest testable code units, such as individual functions, helper methods, utility classes, or UI components. Dependencies are replaced with mocks or stubs to isolate the unit's logic.
2. **Integration Testing**: Verifies the interactions, data exchanges, and interface contracts between two or more cooperating modules or subsystems. It tests the boundaries between units.
3. **System Testing**: Evaluates the complete, fully integrated application to verify compliance with both functional specifications (what the system does) and non-functional requirements (security, performance, usability).
4. **User Acceptance Testing (UAT)**: Validates that the system meets user needs, business workflows, and operational requirements, providing the final release gate.

### 1.2 Unit Testing vs. Integration Testing Boundaries
A common failure in software verification is the blurring of boundaries between unit and integration tests:
- **Unit Isolation**: If a test accesses a real database, makes a network request, or reads from the file system, it is NOT a unit test; it is an integration test. Unit tests must be fast, deterministic, and execute entirely in memory.
- **Mocking Strategy**: Mocks should document the dependencies of the unit under test. If a mock is too complex or replicates internal state, it indicates that the code is highly coupled, requiring refactoring.

### 1.3 The V-Model Mapping of Test Levels
SWEBOK highlights the V-Model as a conceptual framework mapping each verification level to its corresponding design phase:
- **Detailed Design** $\longleftrightarrow$ **Unit Testing**: Verifying algorithmic logic matches detailed module designs.
- **System Architecture** $\longleftrightarrow$ **Integration Testing**: Verifying that inter-module communications match the structural architecture.
- **Requirements Elicitation** $\longleftrightarrow$ **System Testing**: Evaluating if the system satisfies user requirements.
- **Business Analysis** $\longleftrightarrow$ **Acceptability (UAT)**: Validating that the product delivers business value.

### 1.4 Test Level Automation and Pipeline Integration
SWEBOK v4 highlights that different test levels demand different automation profiles and execution boundaries to optimize feedback cycles:
- **Unit and Integration levels** must be fully automated, fast, and execute in local development environments and CI pipelines on every code change or pull request. The target execution time for unit tests is milliseconds per test, and seconds for the entire suite, minimizing developer block times.
- **System and UAT levels** may involve slower, semi-automated or scheduled workflows (e.g. running browser simulations, executing end-to-end user journeys, staging deployments, or running dynamic application security testing - DAST). These run on staging environments or nightlies because their execution can take minutes or hours.

### 1.5 The Testing Pyramid vs. The Testing Trophy
When deciding how many tests to write at each level, software engineers reference two main models:
- **The Testing Pyramid (Mike Cohn)**: Recommends writing a large base of unit tests, a moderate layer of integration tests, and a very small top layer of end-to-end (E2E) system tests. This maximizes execution speed and makes isolating defects simple, as failing unit tests point directly to the broken code line.
- **The Testing Trophy (Kent C. Dodds)**: Focuses heavily on the integration testing level for modern web applications. The trophy structure argues that integration tests provide the best balance between confidence and implementation effort, as they verify that multiple modules cooperate correctly without requiring the high maintenance cost and slowness of E2E browser tests, or the brittle mocking of unit tests.

### 1.6 The Sandbox-Level Execution Boundary
When verifying code that executes dynamic, user-provided code, or performs untrusted operations, SWEBOK-aligned test strategies introduce a fifth level: **Sandbox-Level Testing**:
- **Execution Isolation**: The code under test runs inside a secure, sandboxed container with restricted filesystem and network access.
- **Verification Gates**: The test runner monitors CPU time, memory limits, and process lifecycles from outside the sandbox, verifying that the untrusted code cannot crash or compromise the host environment.
- **State Cleanup**: Ensuring the container is torn down and all temporary directories are destroyed after each test case.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures when designing and executing tests at different levels:

### Step 2.1: Author Unit Tests Adjacent to Production Code
Create the unit test file next to the source code file:
- For a source file `src/math-helper.ts`, create `src/math-helper.test.ts`.
- Write unit tests that cover all valid and invalid partitions and boundary values.

### Step 2.2: Mock Dependencies to Ensure Unit Isolation
Use Vitest's mocking tools to isolate the code:
- Import mock classes and functions from dedicated test constants or separate test files to prevent mock hoisting issues.
- Stub external database connectors, API clients, and file system writers:
```typescript
vi.mock("node:fs", () => ({
  writeFileSync: vi.fn(),
}));
```

### Step 2.3: Design and Write Integration Tests
When verifying inter-module contracts:
- Use real dependencies instead of mocks to test interactions.
- Place integration tests in a separate directory (e.g., `tests/integration/` or `src/integration.test.ts`) to keep them distinct from unit suites.
- Assert that data flows correctly across the interfaces.

### Step 2.4: Execute System-Level Verifications
Run the complete workspace verification command to compile, lint, and test the integrated packages:
```bash
rtk pnpm test
rtk pnpm lint
```
- Verify that no type definitions or global configurations are broken across packages.

### Step 2.5: Simulate User Acceptance Testing (UAT)
Conduct manual or automated E2E validations:
- Run browser validation scripts or staging builds.
- Verify that the application flows align with user scenarios defined in requirements.

### Step 2.6: Log Results in the Walkthrough
In the `walkthrough.md` file:
- Explicitly detail which test levels were executed (Unit, Integration, System).
- Record the Vitest execution summaries for each level.

### Step 2.7: Manage Test Assets in SCM
Commit all test files, mocks, and configurations to version control in the same branch as the production changes, ensuring traceability.

### Step 2.8: Align Test Levels with the Change Complexity
Before finalizing the verification, map the test levels to the changes made:
- For simple utility edits, ensure unit tests exist covering boundary inputs.
- For inter-module signature updates, verify that integration contract tests are executed.
- For business workflow changes, run system-level verification across all affected packages.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria regarding test levels:

- [ ] **Unit Tests Isolated**: Are all unit tests free from real network, database, or file system interactions?
- [ ] **Mocks Hoisting Safe**: Are mocked classes imported rather than declared locally to avoid Vitest hoisting errors?
- [ ] **Test File Location**: Are unit tests placed adjacent to the production code files under test?
- [ ] **Integration Tests Separated**: Are integration tests separated from unit tests in name or directory structure?
- [ ] **Real Dependencies in Integration**: Do integration tests utilize real cooperating modules instead of stubbing everything?
- [ ] **System Verification Run**: Was a workspace-level compile, test, and lint check executed successfully?
- [ ] **V-Model Mapping Checked**: Are all tested states aligned with requirements and design specifications?
- [ ] **UAT Staging Documented**: If applicable, is the UAT verification process recorded in `walkthrough.md`?
- [ ] **Living Task List Active**: Are unit, integration, and system verification tasks tracked in `task.md`?
- [ ] **No Secrets committed**: Did the agent verify that no private keys or database passwords were committed in test mocks?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content escaped to prevent string termination?
- [ ] **Index Signature Safety**: Do test files use bracket notation to access properties on index-signature objects?
- [ ] **Sonar Assertions wrapped**: Do test cases verifying that a void method executes without issues wrap the call in `expect(() => ...).not.toThrow()`?
- [ ] **Explicit Member Access**: Are all methods and properties on test level helpers declared with explicit accessibility modifiers?
- [ ] **Task List Sync**: Are all test level creations, executions, and verification audits tracked in `task.md`?
- [ ] **Walkthrough Record Completed**: Does `walkthrough.md` document the test level mapping and results?
- [ ] **Execution Speed Targets Met**: Did the agent verify that unit tests run in milliseconds to keep feedback loops fast?
