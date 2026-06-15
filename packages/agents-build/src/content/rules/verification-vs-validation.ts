import { defineRule } from "../../define.ts";

export const verificationVsValidation = defineRule({
  content: `# Verification vs. Validation

## 1. Domain Theory and Conceptual Foundations
Verification and Validation (V&V) are two distinct but complementary disciplines within software quality assurance. As detailed in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 10 (Software Quality) and Chapter 4 (Software Testing), V&V activities are conducted throughout the software lifecycle to ensure that the final product meets both its technical specifications and its stakeholders' operational needs. While often grouped together, they target fundamentally different questions about software correctness.

### 1.1 Core Definitions
The distinction between verification and validation is best summarized by Barry Boehm's classic formulations:
- **Verification**: Evaluates whether a software work product conforms to the specifications and technical constraints established in prior development phases. It answers the question: *"Are we building the product right?"*
- **Validation**: Evaluates whether the completed software satisfies the customer's intended use and business domain requirements in its target operational environment. It answers the question: *"Are we building the right product?"*

### 1.2 Mathematical Formulation of Correctness
The difference between verification and validation can be modeled using formal logic and set theory:
- Let $P$ be the physical program implementation.
- Let $S$ be the formal technical specification.
- Let $U$ be the user's actual, real-world operational needs and expectations.

Verification is the process of proving that the program implementation is consistent with the specification:
$$P \\models S$$

Validation is the process of proving that the program implementation satisfies the user's actual needs:
$$P \\approx U$$

A critical vulnerability in software engineering is assuming that $P \\models S \\implies P \\approx U$. If the technical specification ($S$) is incomplete, outdated, or contains design defects, the program can be $100\\%$ verified (conforming to $S$) while failing validation (failing to satisfy $U$). Therefore, both activities are mandatory.

### 1.3 The V-Model Mapping
The V-Model of software development illustrates how verification and validation map to different stages of the software lifecycle, showing the relationship between design phases and verification/validation gates:
- **Requirements Analysis ($R_2$)** $\\leftrightarrow$ **User Acceptance Testing (Validation)**: Verifying that business goals are met.
- **Architectural Design ($R_1$)** $\\leftrightarrow$ **Integration & System Testing (Validation/Verification)**: Ensuring subsystems cooperate correctly.
- **Detailed Design ($R_0$)** $\\leftrightarrow$ **Unit Testing (Verification)**: Confirming individual code units satisfy design contracts.

### 1.4 Verification and Validation Techniques
SWEBOK v4 divides V&V techniques into static (evaluating artifacts without execution) and dynamic (evaluating systems through execution):
- **Static Verification**: Includes compiler checks, TypeScript typechecking, linting, formal inspections, and static analysis scans.
- **Dynamic Verification**: Includes unit tests, integration tests, and regression tests that assert specific code path coverage and boundary correctness.
- **Static Validation**: Includes requirement reviews with stakeholders, BDD scenario reviews, and prototype feedback sessions.
- **Dynamic Validation**: Includes user acceptance testing (UAT), usability testing, field trials, and beta testing programs in simulated or live operational environments.

### 1.5 Independent Verification and Validation (IV&V)
Independent Verification and Validation (IV&V) is a process where V&V activities are conducted by an organization that is technically, managerially, and financially independent of the development organization. SWEBOK v4 notes that IV&V increases the objectivity of evaluations, makes the discovery of subtle design flaws more probable, and is highly recommended (and often regulatory-mandated) for safety-critical, high-reliability systems.

### 1.6 Fault, Error, and Failure Lifecycle
To optimize testing, engineers study the transition from static defect to external failure:
- **Fault (Defect)**: A static flaw in the software code or design (e.g., an off-by-one loop condition).
- **Error**: An incorrect internal state of the running program caused by the execution of a fault (e.g., an array index out of bounds exception inside an event loop).
- **Failure**: An external, observable deviation of the system behavior from its expected output (e.g., a system crash or incorrect data displayed on a user dashboard).

Verification activities target the detection and removal of Faults and Errors during construction, whereas Validation is focused on ensuring that no user-facing Failures occur in the target environment.

## 2. Standard Operating Procedures (SOP)
The agent must execute verification and validation according to the following step-by-step procedures:

### Step 2.1: Establish Verification and Validation Plans
For every change request:
- Define the verification criteria: What technical specifications, lint rules, and test coverages must be met?
- Define the validation criteria: What user stories, acceptance criteria, and operational workflows must be satisfied?

### Step 2.2: Execute Static Verification Gates
Before compiling code, run static analysis checks:
- Verify that TypeScript files compile without errors and that strict index-signature property checks are enforced.
- Run the workspace linter using the token-saving command prefix:
\`\`\`bash
rtk pnpm --filter @ethang/agents-build lint
\`\`\`

### Step 2.3: Execute Dynamic Verification (Unit and Integration Testing)
Write and run automated tests to verify code-level contracts:
- Write failing unit tests first to demonstrate the implementation contract (Red-Green-Refactor).
- Ensure all test assertions satisfy strict guidelines (e.g. wrapping void execution assertions in \`expect(() => ...).not.toThrow()\`).
- Run tests:
\`\`\`bash
rtk pnpm --filter @ethang/agents-build test
\`\`\`

### Step 2.4: Execute Dynamic Validation (BDD and Acceptance Criteria)
Verify that the implementation satisfies stakeholder requirements:
- Write Given-When-Then behavioral scenarios mapping directly to user acceptance criteria.
- Execute acceptance tests in an environment that matches production configuration as closely as possible.

### Step 2.5: Implement Mandatory User Checkpoints
Adhere to workspace check-in policies:
- When a change affects user-visible layouts, workflows, or configurations, present the changes clearly to the user.
- Wait for explicit user validation and approval before completing the task.

### Step 2.6: Log and Report V&V Results in Walkthrough
Document all verification and validation findings in \`walkthrough.md\`:
- Log compiler outputs, test pass rates, and coverage metrics (Verification).
- Log user feedback, acceptance criteria checklists, and UAT outcomes (Validation).

### Step 2.7: Incorporate Independent Reviews
Ensure that all verification results (test coverages, lint reports) and validation outcomes (BDD test logs) are verified by an independent peer or reviewer before code integration. This peer check ensures independent oversight and acts as a final validation quality gate for the product.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following verification and validation rules:

- [ ] **Verification Criteria Defined**: Did the agent define clear unit, lint, and compile specifications?
- [ ] **Validation Criteria Defined**: Were user-facing acceptance criteria and BDD scenarios established?
- [ ] **Static Verification Completed**: Did the agent run typescript compilation and lint checks?
- [ ] **Dynamic Verification Completed**: Were automated unit tests executed with zero failures?
- [ ] **User Checkpoint Passed**: Did the agent pause and obtain user approval for any user-facing changes?
- [ ] **Vitest Mock Hoisting Checked**: Are all mocked classes imported rather than declared in the test file scope?
- [ ] **Index Signature Bracket Access**: Are properties on index-signature objects accessed via bracket notation (\`obj["prop"]\`)?
- [ ] **No Native Dates**: Does the code use Luxon (\`DateTime\`) for all date operations?
- [ ] **Void Assertions Wrapped**: Are unit test cases for void methods wrapped in \`expect(() => ...).not.toThrow()\`?
- [ ] **Tuple Typing Explicit**: Are tuples in Vitest \`it.each\` tables explicitly typed to prevent resolution mismatches?
- [ ] **No Destructive Reverts**: Were code reverts restricted to targeted \`git restore\` on modified files, preserving user changes?
- [ ] **Forbidden Words Scanned**: Has the rule been checked to ensure no forbidden workspace vocabulary or platforms are referenced?
- [ ] **Size Bounds Confirmed**: Is the final compiled markdown file size strictly between 10,000 and 11,800 characters?
- [ ] **Escaped Backticks**: Are all code blocks and backticks inside the rule template properly escaped?
- [ ] **Verification Command Run**: Did the agent execute tests and linter using the \`rtk\` command prefix?
- [ ] **Walkthrough Updated**: Are verification logs and validation results recorded in \`walkthrough.md\`?
- [ ] **Models Applied**: Were mathematical models of correctness ($P \\models S$ vs $P \\approx U$) referenced in the design?
- [ ] **BDD Scenarios Documented**: Were Given-When-Then BDD scenarios mapped to user acceptance criteria?
- [ ] **No Explicit Return Types**: Do TS functions rely on type inference rather than declaring explicit return types unless strictly necessary?
- [ ] **UAT Feedback Logged**: Was stakeholder feedback logged to ensure validation objectives were fully satisfied?
- [ ] **Fault-Failure Path Analyzed**: Did the agent trace potential faults to their runtime error states and failure points?`,
  description:
    "verification and validation definitions, spec conformance vs. user correctness",
  filename: "verification-vs-validation",
  trigger: "model_decision"
});
