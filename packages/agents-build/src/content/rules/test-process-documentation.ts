import { defineRule } from "../../define.ts";

export const testProcessDocumentation = defineRule({
  content: `# Test Process Documentation

## 1. Domain Theory and Conceptual Foundations
Test process documentation provides a formal, structured framework for planning, executing, and monitoring software verification activities. As described in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 5 (Software Testing), documentation ensures that testing is reproducible, auditable, and aligned with stakeholder quality expectations. Without comprehensive documentation, software verification degenerates into ad-hoc debugging, resulting in untraceable coverage gaps, flaky executions, and unrepeatable test environments.

### 1.1 The SWEBOK Hierarchy of Test Documentation
SWEBOK v4, drawing on standard quality standards (such as ISO/IEC/IEEE 29119), structures test documentation into a clear hierarchy of artifacts:
1. **Organizational Test Policy**: Defines the high-level quality goals, regulatory compliance requirements, and testing philosophy of the organization.
2. **Test Strategy**: Outlines the general testing techniques, tools, and environments to be utilized across projects.
3. **Master Test Plan (MTP)**: Specifies the scope, approach, resources, schedule, and risk management plan for a specific project.
4. **Test Design Specification**: Identifies the test conditions and associated features that must be verified.
5. **Test Case Specification**: Defines the exact inputs, execution conditions, and expected outcomes for a single test case.
6. **Test Procedure Specification**: A step-by-step instruction set showing how to run the test cases (often automated via scripts).
7. **Test Log**: A chronological, immutable record of test execution events, capturing pass/fail states, timestamps, and error traces.
8. **Test Summary Report (Verification Report)**: A final evaluation summarizing testing results, coverage metrics, and open defect lists.

### 1.2 Mathematical Metrics for Documentation and Defect Tracking
Test documentation provides the raw data needed to compute quantitative quality metrics. SWEBOK highlights key indicators for evaluating release readiness:
- **Defect Density ($$DD$$)**: Measures the number of defects found per unit of size:
$$DD = \\frac{\\text{Confirmed Defects}}{\\text{Size of Codebase (KLOC)}}$$
- **Test Case Effectiveness ($$TCE$$)**: Evaluates the bug-finding capability of the suite:
$$TCE = \\left( \\frac{\\text{Defects Found by Tests}}{\\text{Total Defects Found (including Production)}} \\right) \\times 100\\%$$
- **Requirements Coverage ($$RC$$)**: Traces requirements to verified tests:
$$RC = \\left( \\frac{\\text{Requirements Verified by } \\ge 1 \\text{ Test}}{\\text{Total Requirements}} \\right) \\times 100\\%$$

Maintaining high Requirements Coverage and Test Case Effectiveness is impossible without tracing tests back to requirements specifications through rigorous documentation.

### 1.3 Version Control (SCM) Integration for Test Assets
A critical principle of modern software engineering is that test assets—including test plan documents, test scripts, seed databases, mock configurations, and environment setups—must be treated as primary software artifacts. They must reside in the same Software Configuration Management (SCM) repository as the production code. This integration ensures that:
- **Reproducibility**: Every code commit is paired with the exact version of the tests designed to verify it.
- **Traceability**: Changes in business code are accompanied by matching changes in test scripts, preventing test suites from falling out of sync.
- **Continuous Execution**: CI/CD pipelines can automatically locate and run tests corresponding to the modified branch.

### 1.4 Egoless Programming and Collaborative Quality Control
First introduced by Gerald Weinberg, "egoless programming" is a cooperative methodology where software developers view code not as personal intellectual property, but as a shared team asset. SWEBOK v4 emphasizes that formal walkthroughs, technical reviews, and inspections are core components of quality assurance. The goal is to identify defects and design gaps constructively, without finger-pointing.
- **Peer Walkthroughs**: Meetings where the author leads colleagues through a document or code block to explain design intent and find logical flaws.
- **Code Reviews**: Static analysis of pull requests to check for style guide adherence, performance bottlenecks, and security vulnerabilities.
- **Design Review Checklists**: Enforcing standardized criteria before code merges, ensuring that code is examined objectively.

### 1.5 Defect Classification and Status Tracking
A vital part of test process documentation is the structured reporting and tracking of defects. SWEBOK v4 emphasizes that defect reports must capture standardized fields to facilitate root cause analysis (RCA) and resolution:
- **Unique Identifier**: A tracking token to isolate the issue.
- **Severity vs. Priority**: Severity measures the technical impact of the defect on the system (e.g., Crash, Functional Block, Cosmetic), whereas Priority defines the business urgency of the fix (e.g., High, Medium, Low).
- **Steps to Reproduce**: Detailed, deterministic actions required to trigger the defect, including input parameters, preconditions, and postconditions.
- **Observed vs. Expected Behavior**: Contrast between what occurred and what the specifications defined.
- **Traceability Link**: Association with the specific test case and requirement that revealed the failure.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures to document and review testing processes:

### Step 2.1: Document the Testing Plan in the Implementation Plan
Before writing production code, define the verification strategy in the \`implementation_plan.md\`:
- Create a **Verification Plan** section listing the target packages and modules.
- Specify the automated test suites that will be created or updated.
- Detail the manual verification steps, including environment configurations and API endpoints.

### Step 2.2: Document Test Cases within Code Specifications
Write self-documenting tests using descriptive name blocks that serve as executable documentation:
- Structure tests using clear, behavior-driven descriptions (e.g., \`describe("Authentication Service", ...)\` and \`it("should reject login if password does not match", ...)\`).
- Document complex mock setups with comments, explaining what external service behavior is being simulated.
- Group tests logically, placing unit tests adjacent to the source code file under test (e.g., \`src/auth.ts\` and \`src/auth.test.ts\`).

### Step 2.3: Maintain the Living Task List
Use the \`task.md\` file to track testing activities:
- Mark tasks as in-progress (\`[/]\`) when executing test suites or writing new test cases.
- Mark tasks as completed (\`[x]\`) only after compilation, linting, and tests pass successfully.
- Record any test failures, flaky tests, and regression fixes as sub-items in the list.

### Step 2.4: Version Control All Test Configurations
Ensure all testing dependencies and environment properties are checked into SCM:
- Update lockfiles (\`pnpm-lock.yaml\`) and configuration files (\`vitest.config.ts\`, \`tsconfig.json\`) to match dependency upgrades.
- Check in mock datasets and database seeding scripts to the workspace. Do not store database secrets or private API keys in version control.

### Step 2.5: Document Verification Outcomes in the Walkthrough
After completing development, create or update the \`walkthrough.md\` to record results:
- Document which tests were run and provide the exact commands used.
- Paste the full output of the test execution, including the pass/fail count and coverage results.
- Include visual assets (such as screenshots or terminal logs) to prove that UI changes or API endpoints function correctly.

### Step 2.6: Participate in Egoless Peer Reviews
When submitting changes:
- Describe the implementation decisions and design rationale in the pull request description.
- Invite peer review and address comments constructively.
- If peer reviews reveal gaps in test coverage, write the missing tests, rerun the suites, and update the walkthrough.

### Step 2.7: Defect Lifecycle Logging and Reporting
When a test run fails, or a defect is uncovered during manual verification:
- Document the defect in the active walkthrough or incident log, capturing the exact steps to reproduce, the actual output, and the expected outcome.
- Trace the defect to its root cause using the 5-Whys methodology if it represents a systemic failure.
- Ensure the fix is accompanied by a new unit test, and update the verification logs once the test passes successfully.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria regarding test process documentation:

- [ ] **Verification Plan Created**: Is a clear verification plan documented in \`implementation_plan.md\`?
- [ ] **Living Task List Active**: Are all testing tasks tracked as checklist items in \`task.md\`?
- [ ] **Walkthrough Record Completed**: Does \`walkthrough.md\` document the final test runs, commands, and outputs?
- [ ] **Self-Documenting Tests**: Do test cases use descriptive, behavior-driven names to document expected module behavior?
- [ ] **Mocks Explained**: Are complex mock setups documented with comments explaining the dependency behavior being simulated?
- [ ] **SCM-Aligned Configurations**: Are all test configurations (\`tsconfig.json\`, \`vitest.config.ts\`) version-controlled?
- [ ] **No Secrets in SCM**: Has the agent verified that no secrets, database passwords, or private API keys are checked into SCM?
- [ ] **Egoless Feedback Addressed**: Were peer review comments and design suggestions addressed constructively?
- [ ] **Defect Metric Checked**: If required by the package, was the defect density or test coverage percentage calculated?
- [ ] **Requirements Traced**: Are all features in the requirements traced to specific unit or integration test cases?
- [ ] **No Git Reset Abuse**: Did the agent use targeted \`git restore\` instead of global hard resets to revert test changes?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content escaped to prevent string termination?
- [ ] **Parameterized it.each Used**: Are parameterized test cases used and documented for multi-state validation?
- [ ] **Sonar Assertions wrapped**: Do test cases verifying that a void method executes without issues wrap the call in \`expect(() => ...).not.toThrow()\`?
- [ ] **Explicit Member Access**: Are all methods and properties on test logger classes declared with explicit accessibility modifiers?
- [ ] **Index Signature Safety**: Do test files use bracket notation to access properties on index-signature objects?`,
  description:
    "test process, test documentation, and configuration management for tests",
  filename: "test-process-documentation",
  trigger: "model_decision"
});
