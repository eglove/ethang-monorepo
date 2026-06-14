---
description: regression testing, test automation, and change validation
trigger: model_decision
---

# Regression Testing Strategy

## 1. Domain Theory and Conceptual Foundations
Regression testing is a vital quality assurance process defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 5 (Software Testing). It focuses on verifying that modifications to a software system—such as bug fixes, new feature additions, refactoring, or environment configurations—do not adversely affect existing, unmodified parts of the system. In complex systems, changes often trigger unintended side effects due to coupling, hidden dependencies, and state corruption. Regression testing provides a safety net to ensure that software remains stable and backward-compatible throughout its lifecycle.

### 1.1 Types of Regression Issues
Regression defects typically manifest in three categories:
- **Local Regression**: A bug introduced directly within the modified code block.
- **Side-Effect (Remote) Regression**: A bug introduced in an unmodified module that depends on the modified module due to coupling.
- **Performance and Environmental Regression**: A degradation in resource usage or latency caused by changes in data schemas, libraries, or environments.

### 1.2 The Regression Testing Dilemma: Retest-All vs. Selective Testing
As a codebase grows, its test suite expands. Software teams face the "regression testing dilemma": how to balance quality confidence against execution cost and time. SWEBOK outlines three main strategies:
1. **Retest-All Strategy**: Running every test case in the entire repository for every change. While this yields maximum confidence, it becomes computationally and financially prohibitive as test runtimes scale from minutes to hours.
2. **Regression Test Selection (RTS)**: Selecting a subset of the test suite that is relevant to the changed modules.
3. **Test Suite Minimization**: Permanently removing redundant test cases from the suite to reduce the size of the baseline.

### 1.3 Control-Flow and Data-Flow RTS Techniques
To perform Regression Test Selection (RTS) accurately, software engineers rely on two main models:
- **Control Flow Graph (CFG) RTS**: The system creates a control flow graph of the program before and after the change. Tests are selected if their execution path intersects with a node or edge in the CFG that has been modified, added, or deleted.
- **Data Flow Graph (DFG) RTS**: Traces variables from their definitions to their points of use (def-use chains). If a variable definition is changed, all tests that execute code paths containing the corresponding use points are selected for execution.

### 1.4 Mathematical Formulation of RTS Efficacy
To measure the cost-effectiveness of an RTS strategy, developers evaluate the Test Suite Reduction ($$TSR$$) percentage and the Fault Detection Capability ($$FDC$$) preservation:
$$TSR = \left( 1 - \frac{|T_S|}{|T_A|} \right) \times 100\%$$
Where $T_A$ is the complete set of all test cases, and $T_S$ is the selected subset of tests. A successful RTS strategy achieves a high $TSR$ (e.g., $> 70\%$) while maintaining $100\%$ of the $FDC$ for the modified modules.

### 1.5 Test Case Prioritization and the APFD Metric
If running all selected tests is still too slow, test case prioritization orders tests to detect faults as early as possible. SWEBOK outlines the Average Percentage of Faults Detected (APFD) metric to evaluate the quality of a test execution order:
$$APFD = 1 - \frac{T_1 + T_2 + \dots + T_m}{n \times m} + \frac{1}{2n}$$
Where:
- $n$ is the total number of test cases in the suite.
- $m$ is the total number of faults present in the system.
- $T_i$ is the position of the first test case in the ordered test suite that exposes fault $i$ (1-indexed).

Let us walk through a concrete example. Suppose we have a test suite $T = \{t_1, t_2, t_3, t_4, t_5\}$ of $n = 5$ tests, and a set of $m = 3$ faults $F = \{f_1, f_2, f_3\}$.
Suppose the fault detection mapping is:
- $t_1$ detects $\{f_1\}$
- $t_2$ detects $\{f_2\}$
- $t_3$ detects $\{f_1, f_3\}$
- $t_4$ detects $\emptyset$
- $t_5$ detects $\{f_3\}$

If we execute the tests in Order A ($t_1, t_2, t_3, t_4, t_5$):
- Fault $f_1$ is first detected by $t_1$ (index 1).
- Fault $f_2$ is first detected by $t_2$ (index 2).
- Fault $f_3$ is first detected by $t_3$ (index 3).
- The APFD calculation is:
$$APFD_A = 1 - \frac{1 + 2 + 3}{5 \times 3} + \frac{1}{2 \times 5} = 1 - \frac{6}{15} + 0.1 = 1 - 0.4 + 0.1 = 0.70\% \text{ (or } 70\% \text{)}$$

If we execute the tests in Order B ($t_3, t_2, t_1, t_4, t_5$):
- Fault $f_1$ is first detected by $t_3$ (index 1).
- Fault $f_2$ is first detected by $t_2$ (index 2).
- Fault $f_3$ is first detected by $t_3$ (index 1).
- The APFD calculation is:
$$APFD_B = 1 - \frac{1 + 2 + 1}{5 \times 3} + \frac{1}{2 \times 5} = 1 - \frac{4}{15} + 0.1 = 1 - 0.267 + 0.1 = 0.833\% \text{ (or } 83.3\% \text{)}$$

This mathematically proves that Order B is superior at early fault detection, providing faster feedback.

### 1.6 The Pesticide Paradox and Test Suite Maintenance
The Pesticide Paradox states that "every method you use to prevent or find bugs leaves a residue of subtler bugs against which the method is ineffectual." In testing, running the same set of regression tests repeatedly will eventually fail to discover new defects. To combat this, test suites must undergo continuous maintenance:
- **Test Retirement**: Obsolete tests verifying deprecated functions or dead code must be deleted to prevent execution bloat.
- **Test Rework**: Modifying tests when business requirements or database schemas change.
- **Test Addition**: Incorporating new test cases from bug fixes to serve as permanent regression blocks.

### 1.7 Flaky Test Management and Quarantine Protocols
A flaky test is a test that exhibits non-deterministic behavior, passing and failing on the same code commit without any changes. Flakiness is typically caused by race conditions, asynchronous timing, network calls, shared global state, or unseeded database states. Flaky tests erode developer trust in the CI/CD pipeline. SWEBOK highlights the necessity of a quarantine protocol:
- **Detection**: Automatically flag tests that fail and then pass on retry.
- **Isolation**: Move flaky tests out of the critical merge path to a quarantined test suite that does not block builds.
- **Resolution**: Refactor quarantined tests to eliminate timing issues, enforce clean setups, or use reliable mocks before returning them to the main regression suite.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures to plan and execute regression testing:

### Step 2.1: Identify Modified Files and Modules
Determine the exact boundary of the changes by analyzing the local git status:
```bash
rtk git status
```
- Note all files in the diff. Identify which packages are affected in the monorepo structure.

### Step 2.2: Perform Regression Test Selection (RTS)
Analyze the import graph and package dependencies of the modified code:
- Identify the unit tests directly associated with the modified files (e.g., `my-file.test.ts` for `my-file.ts`).
- Trace upstream dependencies: identify which modules or routes consume the modified code.
- Compile a list of tests that must be executed to verify both local correctness and side-effect safety.

### Step 2.3: Run Local Unit and Integration Regression Tests
Execute the selected tests locally using the package-specific test runner:
```bash
rtk pnpm --filter <package-name> exec vitest run src/path/to/test.test.ts
```
- Verify that all local tests pass (green). Do not proceed to build pipelines if local tests fail.

### Step 2.4: Execute Change Validation in the CI/CD Monorepo Context
Run package-level linting, typechecking, and building to ensure no type regressions are introduced:
```bash
rtk pnpm --filter <package-name> build
```
- Ensure compiling works without warning-level errors or type mismatches.
- Perform a package-level lint check:
```bash
rtk pnpm --filter <package-name> lint
```

### Step 2.5: Handle Test Failures and Regression Fixes
If a regression test fails:
- Determine if the failure is due to an intentional behavior change (demanding test updates) or an actual defect (demanding code fixes).
- If it is a defect, revert the breaking change or implement the fix, then rerun the regression tests.
- If it is a flaky test, quarantine the test file, open a tracking task, and rewrite the asynchronous or state setup code. Do not use random delays or retry loops to mask the failure.

### Step 2.6: Environmental and Configuration Regression Verification
Check for regressions introduced by dependency updates or configuration file edits:
- Inspect changes in package lockfiles (`pnpm-lock.yaml`) or workspace configurations.
- Run typechecks and builds across all packages that depend on the modified package to verify that no breaking changes leaked across package boundaries.

### Step 2.7: Final System-Level Verification
Run the verification script across the monorepo boundaries to ensure overall system stability:
```bash
rtk pnpm test
```
- Confirm that all global checks pass before initiating pull requests or requesting peer reviews.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria regarding regression testing:

- [ ] **RTS Analysis Done**: Has the agent identified all modified files and their direct/indirect dependencies?
- [ ] **Local Unit Tests Run**: Were local unit tests executed for all modified code modules?
- [ ] **Upstream Dependency Tests Run**: Were tests for dependent components selected and executed?
- [ ] **CI/CD Build Simulation**: Did the agent run package compilation (`build`) to check for build-time regressions?
- [ ] **Typecheck Verification**: Was type integrity checked using the TypeScript compiler (`tsc` or `pnpm build`)?
- [ ] **APFD Ordering Considered**: Are test cases ordered in a way that executes fast, high-coverage unit tests before slow integration tests?
- [ ] **No Flaky Workarounds**: Did the agent avoid using arbitrary sleep timeouts (`setTimeout`) to bypass async timing issues?
- [ ] **Quarantine Protocol Followed**: Are flaky tests quarantined rather than ignored or repeatedly retried in hopes of a green run?
- [ ] **Test Minimization**: Has the agent verified that new tests do not duplicate existing coverage states?
- [ ] **Bug Regression Test Added**: If fixing a bug, was a specific regression test case added to prevent its recurrence?
- [ ] **No Git Revert Abuse**: Did the agent avoid running global resets (`git reset --hard`), using targeted `git restore` on specific files instead?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content escaped to prevent string termination?
- [ ] **Walkthrough Verification**: Does the `walkthrough.md` document which regression tests were run and their outcomes?
- [ ] **Task List Sync**: Do tasks in `task.md` include steps for RTS analysis, local test execution, and CI/CD validation?
- [ ] **Index Signature Safety**: Do regression test files use bracket notation to access properties on index-signature objects?
- [ ] **Sonar Assertions wrapped**: Do test cases verifying that a void method executes without issues wrap the call in `expect(() => ...).not.toThrow()`?
- [ ] **Explicit Member Access**: Are all methods and properties on regression test helpers declared with explicit accessibility modifiers?
