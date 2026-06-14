import { defineRule } from "../../define.ts";

export const swebokCh05Testing = defineRule({
  content: `# Software Testing (SWEBOK v4, Chapter 5)

> Scope: dynamic validation that a system under test (SUT) shows expected behavior on a finite, deliberately selected set of test cases. Owns test-design techniques, test levels, regression strategy, test measures, and deriving tests from state models. Canonical theory owner for tdd-principles and tdd-state-coverage.

## When to Apply

- Choosing a test-design technique for a feature or input.
- Building a test inventory or state table.
- Deciding test level (unit, integration, system, acceptance).
- Setting a regression strategy or deciding when testing is complete.
- Evaluating test-suite quality (coverage, mutation score, fault density).

## Key Definitions

- **SUT**: System Under Test (program, component, service, ecosystem).
- **Test Case**: Input values, preconditions, procedure, and expected outcomes. Inputs alone are insufficient.
- **Oracle**: Agent (human/mechanical) returning a pass/fail/inconclusive verdict.
- **Error / Fault / Failure**: Error = human mistake; Fault = defect in code; Failure = runtime deviation. A fault may not cause a failure.
- **Adequacy Criterion**: Decides when a test suite is sufficient.
- **Selection Criterion**: Decides which test cases to pick.
- **Testability**: Ease of satisfying coverage, and likelihood of exposing a failure if faulty.
- **Infeasible Path**: Control-flow path that cannot be exercised by any input.

Limits: Exhaustive testing is infeasible. Testing shows presence of faults, not absence.

## Test Levels

- **Unit**: Individually testable elements in isolation. Dev-driven. Pre-check functions/classes with mocked dependencies.
- **Integration**: Interactions among elements (subsystems, API, DB). Dev/test team. Top-down, bottom-up, or sandwich. Continuous.
- **System**: Whole-SUT behavior, including non-functional requirements (performance, security, usability).
- **Acceptance**: Readiness vs. expectations/requirements. User-driven. ATDD: define acceptance tests BEFORE implementation.

## Selecting a Test-Design Technique

### Specification-based (Black-box)
- **Equivalence Partitioning**: Split inputs into classes; test one representative per class.
- **Boundary Value Analysis**: Test extremes/boundaries and robustness (just outside).
- **Combinatorial**: Test parameter interactions. All-Combinations, Pair-Wise (OAT), Each Choice, Base Choice.
- **Decision Table**: Enumerate condition combinations as rows; one test per row.
- **Cause-Effect Graphing**: Map logical cause/effect combinations to test cases.
- **State Transition**: Cover states and transitions in an FSM (see state tables).
- **Scenario-based**: Cover typical and alternate workflows.
- **Syntax / Random**: Derive from formal specs, or sample randomly (fuzz testing).
- **Forcing Exception**: Design cases to force exception classes (overflow, protection).

### Structure-based (White-box)
- **Control Flow**: Statement → Branch/Decision → Condition → MC/DC. Path testing is strongest.
- **Data Flow**: Annotate flow graph with define/use/kill. All-Defs, All-Uses, All-DU-Paths.
- **Reference Model**: Visualizing control transfer via directed graphs.

### Experience-based & Ad Hoc
- **Error Guessing**: Target plausible faults from experience and history.
- **Exploratory**: Simultaneous learning, test design, and execution.
- **Ad Hoc Variants**: Monkey, Pair/Buddy, Gamification, Smoke/Build-Verification (core functions gate).

### Fault-based & Mutation
- **Mutation Testing**: Synthesize mutants. Catching mutants evaluates suite strength. Mutation score = killed / generated.
- **ODC (Orthogonal Defect Classification)**: Categorize defects to cut root-cause analysis time.

### Usage-based
- **Operational Profile**: Weight tests by usage frequency to estimate field reliability.

## Deriving Tests from State Models
Model the feature as a finite-state machine (states, transitions, guards, terminal states), then map each state-table row to the test-design technique that covers it:
- **Equivalence Partitioning**: Each state groups inputs that produce the same behavior.
- **Boundary Analysis**: Test guard condition thresholds (e.g., \`length > 0\` → test with 0 and 1).
- **Decision Tables**: Enumerate condition combinations for complex guards.
- **State Transition Testing**: Test every row/transition, covering both true and false guards.

## Regression and Test Selection
- **Regression testing**: Selective retesting after modification to confirm no unintended effects.
- **Test selection**: Reduce suite cardinality while keeping coverage/fault-detection.
- **Minimization**: Remove redundant cases per a criterion.
- **Prioritization**: Order cases (by coverage, risk, or similarity distance) so high-value runs first.

## Objectives of Testing
- **Conformance / Correctness**: Verify correct spec implementation.
- **Compliance**: Adherence to laws or regulations.
- **Installation**: Verify in target operational environment post-deploy.
- **Alpha / Beta**: Trial with small selected group / larger user pool.
- **Non-Functional**: Load, stress, recovery, reliability, scale, security, privacy.
- **Interface / API**: Correct exchange between components.
- **Usability**: Ease of learning, function, and error recovery.

## Test Measures and Stopping
- **Coverage**: Branch, decision, statement, or requirements coverage.
- **SUT Metrics**: Fault density (faults/size), MTTR, failure rate.
- **Test Metrics**: Fault injection rate, mutation score, tests-to-first-failure.
- **Stopping Rule**: Stop when coverage/reliability targets are met and cost of remaining failures is below cost of continuing.

## Test Process
- **Layers**: Organizational (policies), management (planning, metrics), dynamic (setup, run, report).
- **Execution**: Run tests as controlled, replicable experiments.
- **Incident Reporting**: Replicable logs for configuration, environment, and defects.
- **Reusability**: Store test assets in a repository for regression.

## Decision Checklist

Must Do:
- Write at least one FAILING test (RED) before production code (TDD/ATDD).
- Give every test an oracle — assert an expected outcome.
- Cover valid, invalid, boundary, empty/null/undefined, error, and concurrent states.
- Pick the technique by input shape: equivalence/boundary for ranges, decision table for combined rules, state-transition for stateful flows.
- Isolate units (mock dependencies); use real collaborators for integration.
- Run the regression suite in CI on every commit; run smoke tests after each build.
- Measure coverage; justify any uncovered path.
- Use parameterized tests (\`it.each\` in Vitest) for multi-input coverage.

Must Not Do:
- Ship trivially-true assertions or tests that exercise only the mock.
- Treat 100% line coverage as done while branch/state coverage is 0% (coverage theater).
- Defer non-functional (performance, security, privacy) tests until production fails.
- Leave tests order-/state-dependent.
- Skip boundary, null, and error-state cases.
- Use \`waitForTimeout()\`/sleep instead of waiting for the actual triggering event.

## Anti-Patterns
- **Trivially-true assertions**: Fix by asserting specific contracts.
- **Testing the mock**: Fix by asserting real output/state changes.
- **Coverage theater**: Line coverage high, but branch/state coverage low.
- **No isolation**: Order- or state-dependent tests.
- **Test-after only**: Write failing test first (shift-left).
- **Missing boundaries**: Neglecting null/empty/error cases.
- **waitForTimeout()**: Use event/condition triggers instead of sleep.
- **Skipping rollback state**: Enumerate via state table.

## Standards Referenced
- **ISO/IEC/IEEE 29119**: Testing processes, documentation, and techniques.
- **ISO/IEC 25010**: Quality characteristics model.
- **ISO/IEC/IEEE 24765**: Vocabulary.
`,
  description:
    "Software Testing: unit, integration, system testing, and test coverage",
  filename: "swebok-ch05-testing",
  trigger: "model_decision"
});
