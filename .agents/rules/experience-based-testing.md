---
description: experience-based testing, error guessing, exploratory testing, and common defect checklists
trigger: model_decision
---

# Experience-Based Testing

## 1. Domain Theory and Conceptual Foundations
Experience-based testing represents a class of software testing techniques where test cases are derived from the engineer's experience, technical intuition, and historical knowledge of similar systems, technologies, and defect patterns. As detailed in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 4 (Software Testing), experience-based testing is a cognitive, heuristic-driven activity that acts as a vital supplement to formal, specification-based (black-box) and structure-based (white-box) testing techniques. 

If a specification contains gaps, experience-based testing identifies "unknown unknowns"—defects arising from unstated assumptions, complex integration edge cases, and developer mistakes not captured in specifications.

### 1.1 Taxonomy of Experience-Based Techniques
SWEBOK v4 categorizes experience-based testing into three primary methodologies:
- **Error Guessing**: A systematic technique where the engineer designs test cases to target specific defects that are highly probable based on past experience. It relies on a cognitive model of where developers typically make mistakes (e.g., boundary conditions, null references, or framework-specific quirks).
- **Exploratory Testing**: A dynamic testing approach where the design, execution, and logging of tests occur concurrently. Rather than following pre-written scripts, the engineer actively explores the software, using feedback from completed tests to design the next set of tests. Exploratory testing is structured using "charters" and is time-boxed.
- **Checklist-Based Testing**: A technique where the engineer uses a list of defect types to guide testing. These checklists are compiled from historical post-mortems and static analysis.

### 1.2 The Cognitive Psychology of Software Defects
At its core, error guessing leverages an understanding of human cognitive limitations in software engineering. Developers face cognitive overload when managing complex state transitions, asynchronous execution paths, and third-party integrations. This overload manifests in predictable defect clusters. Common cognitive slips in modern TypeScript and Node.js environments include:
- **Mock Hoisting Reference Errors**: When using Vitest for unit testing, call factories passed to `vi.mock` are hoisted to the top of the module scope during compilation. If a mock relies on variables declared in the test file scope before the import statements, a `ReferenceError` is thrown. Resolving this requires importing constructible mock patterns or placing constants in a dedicated, hoisted `test-constants.ts` file.
- **Index Signature Access Violations**: Under strict TypeScript configurations where `noPropertyAccessFromIndexSignature` is enabled, accessing index-signature properties via dot notation (`obj.prop`) fails. Engineers must use bracket notation (`obj["prop"]`) to safely traverse these objects.
- **Date and Timezone Shifts**: Utilizing native JavaScript `Date` constructors leads to flaky, environment-dependent tests due to local timezone offsets on developer machines versus CI/CD build agents. Strict compliance requires using specialized libraries like Luxon (`DateTime`) for parsing and normalization, and banning native date constructors.
- **Isomorphic/Universal Environment Assumptions**: Code designed to run in both Node.js (testing) and browser (runtime) environments often throws `ReferenceError: window is not defined` if it assumes browser globals exist. Safe access requires verifying `globalThis.window` is defined.

### 1.3 Session-Based Test Management (SBTM)
To prevent exploratory testing from degrading into unstructured "ad-hoc" testing, engineers employ the Session-Based Test Management (SBTM) framework. An exploratory session is guided by a Charter:
$$\text{Charter} = \text{Explore } [\text{Target}] \text{ with } [\text{Resources}] \text{ to discover } [\text{Information}]$$

During a session (typically 90 to 120 minutes), the engineer tracks three primary metrics to optimize test efficiency:
- **Product Setup Time ($$T_{\text{setup}}$$)**: The percentage of the session spent configuring the environment or test data.
- **Test Execution Time ($$T_{\text{test}}$$)**: The percentage of the session spent actively executing tests and observing behaviors.
- **Bug Investigation Time ($$T_{\text{bug}}$$)**: The percentage of the session spent diagnosing and documenting discovered faults.

The efficiency of an exploratory session is quantified as:
$$\eta_{\text{session}} = \frac{T_{\text{test}}}{T_{\text{setup}} + T_{\text{test}} + T_{\text{bug}}} \times 100\%$$

High setup times indicate a need for better test automation utilities, while excessively high bug investigation times suggest that the component under test is highly unstable.

### 1.4 Checklist Evolution
Checklist-based testing bridges the gap between ad-hoc testing and formalized test suites. In a SWEBOK-aligned engineering process, every major incident or post-mortem must result in an update to the shared checklist. This prevents organizational memory loss, ensuring that once a defect class is discovered, future agents and developers are prompted to check for it. Checklists should target specific structural code patterns: resource leakages in callbacks, column ordering mismatches in database mocks, and authentication guard failures on web routes.

## 2. Standard Operating Procedures (SOP)
The agent must execute experience-based testing according to the following step-by-step procedures:

### Step 2.1: Analyze Historical Defect Checklists
Before writing any tests or code modifications, the agent must review the project's historical defect checklists and workspace rules. Inspect active rules and identify known failure patterns:
- Scan for Vitest mock rules, typescript strict options, and timezone handling.
- Review recent commit histories and code review feedback to identify recurring defects in modified components.

### Step 2.2: Construct an Error-Guessing Matrix
Create a structured lookup table mapping high-risk code constructs to potential defect hypotheses:
| Code Construct | Defect Hypothesis | Test Verification Strategy |
| :--- | :--- | :--- |
| Mocked Classes | `ReferenceError` due to hoisting | Verify mock factories use imported variables or hoisted `test-constants.ts` |
| Index Signatures | Compiler error on dot notation | Assert properties are accessed via bracket notation (`obj["prop"]`) |
| Date Parsing | Flaky runs due to local timezones | Enforce Luxon `DateTime` and mock system clocks in tests |
| Universal SDKs | Node environment crashes on `window` | Wrap global accesses in checks for `globalThis.window` |
| Loop Traversals | Non-null assertion failures on arrays | Avoid index accesses with non-null assertions; use `for-of` |

### Step 2.3: Define Exploratory Charters
When testing a new feature or complex refactoring, write a time-boxed exploratory charter. Define the target area, the techniques to be used (e.g. boundary exploration, error injection), and the specific information to collect. Example:
```markdown
Charter: Explore the Hono router route-matching logic with boundary inputs to discover route collision faults.
```

### Step 2.4: Execute Exploratory Sessions and Log Anomalies
Execute the exploratory charter. Interact with the system, inject invalid inputs, simulate network latency, and force error states:
- Keep a real-time log of actions, observations, and system outputs.
- If an anomaly is found, perform root cause analysis (using a 5-Whys methodology) to isolate the defect before writing a bug report.

### Step 2.5: Document New Defect Patterns
When a unique defect is discovered and verified, add it to the shared defect checklist. This ensures the organization learns from the defect and prevents it from recurring. Define:
- The symptom and its technical root cause.
- The specific rule or code pattern that was violated.
- An example of the incorrect code versus the corrected code.

### Step 2.6: Write Automated Regression Tests
Translate the experience-based findings into automated unit or integration tests to solidify the quality gate:
- Implement failing test cases first to prove the defect exists (following Red-Green-Refactor disciplines).
- Run the targeted tests using the workspace token-saving command prefix:
```bash
rtk pnpm --filter @ethang/agents-build test src/content/rules/experience-based-testing.test.ts
```
- Ensure all test assertions satisfy strict code quality gates (e.g. wrapping void executions in `expect(() => ...).not.toThrow()`).

### Step 2.7: Refactor and Verify
Refactor the production code to resolve the defect and verify the fix:
- Confirm all tests pass.
- Run typecheck and lint checks:
```bash
rtk pnpm --filter @ethang/agents-build lint
```
- Document the entire experience-based testing process, findings, and automated test cases in the project's `walkthrough.md` file. Calibrate metrics by automating setups if setup time exceeds 20%.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following experience-based testing rules:

- [ ] **Historical Audit Performed**: Did the agent read the workspace rules and checklists before designing test cases?
- [ ] **Error Guessing Matrix Constructed**: Was a structured matrix of common defect hypotheses created for the target code?
- [ ] **Charter Formulated**: Was a clear, time-boxed exploratory charter written for testing activities?
- [ ] **Vitest Mock Hoisting Checked**: Are all mocked classes imported rather than declared in the test file scope?
- [ ] **Index Signature Bracket Access**: Are properties on index-signature objects accessed via bracket notation (`obj["prop"]`)?
- [ ] **No Native Dates**: Does the code use Luxon (`DateTime`) for all date operations, completely avoiding native `Date` constructors?
- [ ] **Global Window Stubbing**: Are universal properties accessed via `globalThis.window.location.href` after checking if `globalThis.window` is defined?
- [ ] **Cognitive Complexity Managed**: Are complex test helper loops split into distinct search and extraction phases?
- [ ] **Safe Array Traversal**: Do all array traversal loops avoid non-null assertions and use safe iterator loops or slicing?
- [ ] **Void Assertions Wrapped**: Are test cases verifying void methods wrapped in `expect(() => ...).not.toThrow()`?
- [ ] **Tuple Typing Explicit**: Are tuples in Vitest `it.each` tables explicitly typed to prevent resolution mismatches?
- [ ] **No Destructive Reverts**: Were code reverts restricted to targeted `git restore` on modified files, preserving user changes?
- [ ] **Forbidden Words Scanned**: Has the rule been checked to ensure no forbidden workspace vocabulary or platforms are referenced?
- [ ] **Size Constraint Verified**: Is the final compiled markdown file size strictly between 10,000 and 11,800 characters?
- [ ] **Escaped Backticks**: Are all code blocks and backticks inside the rule template properly escaped?
- [ ] **TDD Loop Completed**: Were the automated tests written and verified in a Red-Green-Refactor sequence?
- [ ] **Verification Command Run**: Did the agent execute the tests and linter using the `rtk` command prefix?
- [ ] **Walkthrough Updated**: Is the exploratory session log and automated test coverage summarized in `walkthrough.md`?
- [ ] **Checklist Expansion Verified**: Did the agent expand the shared defect checklist when a new defect class was identified?
- [ ] **Session Duration Tracked**: Was the exploratory testing time-boxed and tracked with metric records?
