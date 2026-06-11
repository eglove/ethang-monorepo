export const ch05Testing = {
  content: `# Software Testing (SWEBOK v4, Chapter 5)

> Scope: dynamic validation that a system under test (SUT) shows expected behavior on a finite, deliberately selected set of test cases. Owns the test-design techniques (specification-based, structure-based, experience-based, fault/mutation), test levels, regression strategy, test measures, and how to derive tests from state models. The theory the tdd-principles and tdd-state-coverage overlays build on.

## When to Apply

- Choosing which test-design technique to use for a given input or feature.
- Building a test inventory or state table (use the "Deriving Tests from State Models" section).
- Deciding test level (unit / integration / system / acceptance) for a change.
- Setting a regression strategy or judging when testing is "enough."
- Evaluating test-suite quality (coverage, mutation score, fault density).

## Key Definitions

| Term | Meaning |
|---|---|
| **SUT** | Tested object — program, component, microservice, system, system-of-systems, ecosystem |
| **Test case** | Specification of ALL entities needed to execute: input values, timing/state preconditions, procedure, expected outcomes. Inputs alone are insufficient when behavior depends on state or environment |
| **Test suite** | A set of test cases |
| **Oracle** | Any agent (human/mechanical) that returns a pass/fail/inconclusive verdict; sources: unambiguous spec, behavioral model, code annotations |
| **Error / Fault / Failure** | Error = human action producing a wrong result; Fault (defect) = imperfection in the work product; Failure = runtime deviation from expected behavior. A fault may never cause a failure |
| **Adequacy criterion** | Decides when a test suite is sufficient ("how much is enough") |
| **Selection criterion** | Decides which test cases to pick ("which cases"); different criteria yield vastly different effectiveness |
| **Testability** | (1) ease of satisfying a coverage criterion; (2) likelihood a suite exposes a failure if the SUT is faulty |
| **Infeasible path** | Control-flow path no input can exercise; managing them cuts wasted effort and security risk |

Limits: exhaustive testing is never feasible. Testing shows the **presence** of faults, never their **absence** (Dijkstra). A failure's causing fault cannot always be unequivocally identified.

## Choosing a Test Level

Four stages — none imply a development process and none ranks above the others. Pick by what the test targets.

| Level | Target | Performer | Choose when |
|---|---|---|---|
| **Unit** | Individually testable element in isolation (subprogram, component) | Usually the code author | Verifying one function/class with dependencies mocked |
| **Integration** | Interactions among elements (components, modules, subsystems, external interfaces) | Development team | Verifying collaboration/data exchange; strategies: top-down, bottom-up, mixed (sandwiched), big bang. Continuous — run at each stage |
| **System** | Whole-SUT behavior; non-functional reqs (security, privacy, speed, accuracy, reliability) | Dedicated test team | Assessing end-to-end behavior + NFRs |
| **Acceptance** | Deployment readiness vs requirements and end-user expectations | End-users (or with them) | Confirming the SUT does what it was built for. ATDD: define acceptance tests BEFORE implementing |

## Selecting a Test-Design Technique

Techniques differ in HOW the suite is selected. Combine them — functional (spec-based) and structural (structure-based) are complements that use different information and reveal different faults.

### Specification-based (black-box) — derive from input/output behavior, no code knowledge

| Technique | Use when | How |
|---|---|---|
| **Equivalence partitioning** | Input domain splits into classes that behave the same | Partition into classes (valid, invalid, boundary); test ≥1 representative per class |
| **Boundary value analysis** | Faults cluster at extremes | Test on/near each boundary. Robustness extension: also test just OUTSIDE the domain |
| **Combinatorial** | Multiple parameters interact | All-Combinations (every combo), Pair-Wise (every value pair — aka OAT), Each Choice (each value once), Base Choice (vary one from a base), t-wise (t-way combos) |
| **Decision table** | Logical rules map conditions → actions | Enumerate every condition combination as a row; one test per row |
| **Cause-effect graphing** | Many input conditions drive outputs | Map causes→effects via a logic graph; derive combinations systematically |
| **State transition** | Behavior depends on state/history | Model as FSM; cover states + transitions to a chosen level (see next section) |
| **Scenario-based** | Validating workflows/business processes | Cover typical AND alternate workflows from a model |
| **Syntax (formal-spec)** | Spec exists in a formal language | Auto-derive functional cases; the spec also serves as oracle |
| **Random** | Cheap automation over a known domain | Sample inputs randomly; adaptive random uses distance for diversity. **Fuzz testing** = random invalid/unexpected inputs for cybersecurity |
| **Forcing exception** | Negative paths matter | Design cases to force each exception class (data, overflow, protection, underflow) |

### Structure-based (white-box) — derive from code/structure

| Technique | How / criterion strength |
|---|---|
| **Control flow** | Cover statements → branches → decisions → conditions → MC/DC. Adequacy in %: 100% branch = every branch taken ≥1×. Path testing is strongest but infeasible with loops |
| **Data flow** | Annotate flow graph with define/use/kill. Criteria (weak→strong): All-Definitions, All-C-Uses, All-P-Uses, All-Uses, **All-DU-Paths** (strongest) |
| **Reference model** | Flow graph: directed graph, nodes = statements/sequences, arcs = control transfer; used to visualize the above |

### Experience-based — derive from tester knowledge

- **Error guessing** — anticipate plausible faults from project fault history + expertise.
- **Exploratory** — simultaneous learning + design + execution; cases evolve from observed behavior. Standard in Agile/shift-left.
- **Ad hoc** variants: Monkey (random events), Pair/Buddy (one runs, one analyzes), Gamification, Quick (tiny suite, fast critical-issue detection), **Smoke / Build-Verification** (core functions work; gate before fuller testing — special case of Quick, common in CI).

### Fault-based and mutation

- **Mutation testing** — generate mutants (small syntactic changes to the "gold" SUT). Each test runs on gold + all mutants; a mutant detected is **killed**. **Mutation score = killed / generated** (higher = stronger suite). Rests on the **coupling effect**: catching simple syntactic faults catches complex real ones. Needs many auto-generated mutants. Applications: suite evaluation, fuzz generation, metamorphic testing for ML.
- **ODC (Orthogonal Defect Classification)** — capture semantic defect info to cut root-cause-analysis time.

### Usage-based

- **Operational profile** — generate cases weighted by real usage frequency to estimate field reliability; statistical sampling simulates many cases. Applied mostly at acceptance.

## Deriving Tests from State Models

Model the feature as a finite-state machine (states, transitions, guards, terminal states), then map each state-table row to the test-design technique that covers it. This is the bridge tdd-state-coverage builds its state-table template on.

| Test-design technique | How it applies to the state table |
|---|---|
| **Equivalence partitioning** | Each state groups inputs that produce the same behavior. One test per state = one test per equivalence class. |
| **Boundary analysis** | Guard conditions have thresholds — test at the boundary. E.g. \`data.length > 0\` → test with 0 items AND 1 item. |
| **Decision tables** | When multiple guards combine (e.g. \`isAdmin && hasFeatureFlag\`), enumerate the combinations as rows. |
| **State transition testing** | The table itself. Every row = a state or transition to cover; test each guard both true and false. |

## Regression and Test Selection

- **Regression testing** — selective retesting after a modification to confirm no unintended effects and that previously passing tests still pass. Fundamental to Agile, DevOps, TDD, CI. Run after integration, before deploy.
- **Test selection** — reduce suite cardinality while keeping coverage/fault-detection (pick the change-affected subset).
- **Minimization** — remove redundant cases per a criterion.
- **Prioritization** — order so high-value cases run first (by coverage, fault-detection rate, similarity, risk); similarity-based prioritization runs most-dissimilar cases first via a distance function.
- Trade-off: assurance of full regression vs. resources — selection/minimization/prioritization manage it.

## Objectives of Testing (selection cues)

| Objective | When it is the goal |
|---|---|
| Conformance / correctness / functional | Verify spec is implemented correctly |
| Compliance | Adherence to a law/regulation (forced by an external body) |
| Installation | Verify in the target operational environment post-deploy |
| Alpha / beta | Uncontrolled trial — small selected group / larger representative users |
| Non-functional | Performance, load, stress, volume, failover/recovery, reliability, compatibility, scalability, elasticity, security, privacy, usability |
| Security | Confidentiality/integrity/availability + negative (misuse/abuse) testing |
| Interface / API | Correct data + control exchange between components |
| Usability | Ease of learning/use; functions, docs, error recovery |

## Test Measures and Stopping

- **Coverage** — 0–100% excluding infeasible tests; e.g. % branches in the flow graph, % functional requirements exercised. Structure-based coverage usually needs SUT instrumentation.
- **Evaluate the SUT:** shift-left KPIs (deployment frequency, lead time, MTTR, change failure rate); **fault density** = faults found / SUT size (also fault depth, fault multiplicity); reliability via growth models (failure-count vs time-between-failure).
- **Evaluate the tests:** **fault injection** (seed faults, measure % detected — use with care, risk of leaving them in); **mutation score**; relative effectiveness (tests-to-first-failure, faults-found ratio, reliability gain).
- **Stop when** thoroughness measures (coverage, fault-density/reliability estimates) are met AND the cost/risk of remaining failures is below the cost of continuing — coverage alone is not sufficient.
- **Process measures:** specified/executed/passed/failed counts, residual risk, cumulative defects open/closed, defect detection percentage.

## Test Process (essentials)

- **Three process layers:** organizational (policies, strategies), management (planning, monitoring/control, completion), dynamic (design/implementation, environment setup, execution, incident reporting).
- **Execution = controlled experiment** — document precisely enough that another person can replicate the result; use a clearly defined SUT version. A/B testing fits acceptance.
- **Incident reporting** — record when/who/what-config; not all unexpected outcomes are faults; reports feed change management.
- **Reusability** — store classified test knowledge in a repository so tests can be re-derived when requirements/design change; pivotal for product-line and regression.

## Decision Checklist

**Must Do**
- Write at least one FAILING test (RED) before production code (TDD/ATDD).
- Give every test an oracle — assert an expected outcome.
- Cover valid, invalid, boundary, empty/null/undefined, error, and concurrent states.
- Pick the technique by input shape: equivalence/boundary for ranges, decision table for combined rules, state-transition for stateful flows.
- Isolate units (mock dependencies); use real collaborators for integration.
- Run the regression suite in CI on every commit; run smoke tests after each build.
- Measure coverage; justify any uncovered path.
- Use parameterized tests (\`it.each\` in Vitest) for multi-input coverage.

**Must Not Do**
- Ship trivially-true assertions or tests that exercise only the mock.
- Treat 100% line coverage as done while branch/state coverage is 0% (coverage theater).
- Defer non-functional (performance, security, privacy) tests until production fails.
- Leave tests order-/state-dependent.
- Skip boundary, null, and error-state cases.
- Use \`waitForTimeout()\`/sleep instead of waiting for the actual triggering event.

## Anti-Patterns

| Anti-pattern | Fix |
|---|---|
| Trivially-true assertions | Assert the specific contract |
| Testing the mock, not behavior | Assert real outputs/state changes |
| Coverage theater (line ✓, branch/state ✗) | Add branch + state-table cases |
| No isolation (order/state-dependent) | Reset state; mock dependencies |
| Test-after only (no shift-left) | Write the failing test first |
| Missing boundary/null/error cases | Apply boundary + equivalence partitioning |
| \`waitForTimeout()\`/sleep | Wait for the triggering event/condition |
| Skipping the empty/forbidden/rollback state | Enumerate via the state table |

## Standards Referenced

| Standard | Purpose |
|---|---|
| ISO/IEC/IEEE 29119 (parts 1–5) | Software testing — process, documentation, techniques, keyword-driven |
| ISO/IEC 25010:2023 | Quality model — testable quality characteristics |
| ISO/IEC/IEEE 24765 | Vocabulary (regression, back-to-back testing definitions) |
`,
  path: "resources/ch05-testing.md",
  title: "Software Testing",
  triggers: [
    "test",
    "coverage",
    "mock",
    "regression",
    "mutation",
    "equivalence-partitioning",
    "boundary-value",
    "shift-left"
  ] as const
};
