---
description: Guided implementation and development skill enforcing strict TDD, coding standards, and ESLint auto-fix loop guards.
name: sdlc-3
---

# Standalone SDLC Phase 3 (sdlc-3) - Guided Implementation & Verification

This skill guides an AI developer agent through implementing a designed feature while enforcing a strict Red-Green-Refactor TDD loop, coding standards, and linter safeguards.

---

## Phase 3 & 4 Reference & Alignment
This skill aligns with the following Phase 3 (Implementation) and Phase 4 (Verification) guidelines:
- [philosophy](file:///.agents/rules/philosophy.md) - Strict lifecycle execution, complete feedback loops, and user checkpoints.
- [workspace-tools](file:///.agents/rules/workspace-tools.md) - Prioritize WebStorm MCP, ripgrep, jq, and Everything Search. Use `rtk` command prefixes.
- [eslint-self-learning](file:///.agents/rules/eslint-self-learning.md) - Resolving lint issues, TypeScript check violations, and syntax errors.
- [maintainability-clean-code](file:///.agents/rules/maintainability-clean-code.md) - Descriptive naming, single responsibility.
- [table-driven-construction](file:///.agents/rules/table-driven-construction.md) - Lookup tables and state transition maps.
- [concurrency-control](file:///.agents/rules/concurrency-control.md) - Concurrency primitives, locks, and thread safety.
- [boolean-logic](file:///.agents/rules/boolean-logic.md) - Logic simplification and De Morgan's laws.
- [exception-handling-policy](file:///.agents/rules/exception-handling-policy.md) - Exception handling and central logging policies.
- [intellectual-property](file:///.agents/rules/intellectual-property.md) - Compliance with open source licenses and IP attribution.
- [privacy-data-protection](file:///.agents/rules/privacy-data-protection.md) - PII protection and data minimization.
- [tdd-discipline](file:///.agents/rules/tdd-discipline.md) - Red-Green-Refactor method.
- [tdd-principles](file:///.agents/rules/tdd-principles.md) - Parameterized tests, RED/GREEN validation, and trust-the-problem discipline.
- [tdd-state-coverage](file:///.agents/rules/tdd-state-coverage.md) - State tables, FSM enumerations, and async/form/auth scenarios.
- [tdd-test-as-documentation](file:///.agents/rules/tdd-test-as-documentation.md) - Descriptive naming, mock setups, and contract validation.
- [test-first-programming](file:///.agents/rules/test-first-programming.md) - Test-first coding loops and immediate design feedback.
- [test-levels](file:///.agents/rules/test-levels.md) - Defining boundaries for unit, integration, and acceptance tests.
- [test-completion-criteria](file:///.agents/rules/test-completion-criteria.md) - Objective code coverage and verification targets.
- [test-process-documentation](file:///.agents/rules/test-process-documentation.md) - Configuration management and documentation for test suites.
- [boundary-value-analysis](file:///.agents/rules/boundary-value-analysis.md) - Test design for boundary and off-by-one errors.
- [equivalence-partitioning](file:///.agents/rules/equivalence-partitioning.md) - Input domain partitions to optimize testing coverage.
- [mutation-testing-adequacy](file:///.agents/rules/mutation-testing-adequacy.md) - Verifying assertion adequacy via mutation analysis.
- [regression-testing-strategy](file:///.agents/rules/regression-testing-strategy.md) - Running regression suites on modification.
- [experience-based-testing](file:///.agents/rules/experience-based-testing.md) - Error guessing, checklists, and exploratory testing.
- [formal-methods](file:///.agents/rules/formal-methods.md) - Specifications, pre/post-conditions, and mathematical verification.
- [state-based-modeling](file:///.agents/rules/state-based-modeling.md) - FSM modeling and state transition verification.
- [verification](file:///.agents/rules/verification.md) - Executing builds, tests, and lint checks.
- [verification-vs-validation](file:///.agents/rules/verification-vs-validation.md) - Conformance to specs vs. user correctness.
- [linter-quality-gates](file:///.agents/rules/linter-quality-gates.md) - Static analysis checks.
- [security-vulnerability-scanning](file:///.agents/rules/security-vulnerability-scanning.md) - `pnpm audit` and vulnerability fixes.
- [empirical-experiments](file:///.agents/rules/empirical-experiments.md) - Statistical analysis and benchmarking.

---

## Step-by-Step Execution Plan

### Step 1: Pre-Implementation Graph Validation
1. Before writing any code, locate the feature requirements and design files under `docs/<feature-name>/`.
2. Run the command:
   ```bash
   rtk sara check
   ```
3. If the graph validation fails (e.g., broken links, loops, or orphaned design elements) or if requirements/design files do not exist, you must halt execution immediately and notify the developer. Do not make any code changes.

### Step 2: Strict TDD Verification Loop
For every code modification or feature implementation:
1. **Red Phase**:
   - Write a failing unit test in the same directory as the target source file (with a `*.test.ts` suffix).
   - The test must describe the expected behavior and verify state coverage.
   - Run the command to verify it fails:
     ```bash
     rtk pnpm --filter <package> test
     ```
   - Confirm it fails due to expected assertion failures, not syntax or import errors.
2. **Green Phase**:
   - Implement the minimal production code in the target source file to satisfy the failing test.
   - Run the test suite again and verify that the test transitions from Red to Green.
3. **Refactor Phase**:
   - Clean, optimize, and refactor the code (e.g., remove duplicate strings, extract helper functions).
   - Ensure all helper functions are written using arrow functions and do not declare explicit return types.
   - Add explicit accessibility modifiers (`public`/`private`/`protected`) to all class properties and methods.
   - Run the test suite continuously to verify that all tests remain green.

### Step 3: Coding Standards Enforcement
All implementation code must adhere strictly to these project standards:
1. **Arrow Functions**: Use arrow functions over function declarations:
   - `const fn = () => {};` (Compliant)
   - `function fn() {}` (Non-Compliant)
2. **Class Accessibility**: Annotate all class members, constructor parameters, and properties with explicit modifiers (`public`/`private`/`protected`).
3. **Index Signature Access**: Access properties of index-signature objects (e.g., `Record<string, any>` or `any`) using bracket notation:
   - `obj["prop"]` (Compliant)
   - `obj.prop` (Non-Compliant)
4. **Yoda Comparisons**: Place constants on the left side of comparison statements:
   - `undefined === value` (Compliant)
   - `value === undefined` (Non-Compliant)
5. **No Native Date**: Native JavaScript `Date` constructor and methods are banned. Always use Luxon (`DateTime`) for date handling.
6. **Type Inference**: Avoid declaring explicit return types on TypeScript functions unless strictly necessary.

### Step 4: ESLint Auto-Fix Loop Guard
1. Run ESLint checks on the modified files.
2. If linting errors or warnings are found, execute the autofix command up to a maximum of 3 rounds:
   ```bash
   rtk pnpm --filter <package> lint --fix
   ```
3. If linting issues persist after 3 autofix iterations, halt execution immediately, present the issues to the developer, and wait for human intervention. Do not attempt further automated edits.

### Step 5: Final Graph Verification
1. After completing implementation, compilation, and linter passes, run:
   ```bash
   rtk sara check
   ```
2. Verify that the complete requirements, design, and implementation graph remains intact and valid.
