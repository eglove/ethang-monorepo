---
description: test completion criteria, test coverage targets, and objective verification
trigger: model_decision
---

# Test Completion Criteria

## 1. Domain Theory and Conceptual Foundations
Test completion criteria (or test exit criteria) establish the objective, quantitative metrics and halt conditions under which software testing activities can safely terminate. As outlined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 5 (Software Testing), testing must not be concluded based on subjective, qualitative estimates (such as "I have tested it enough" or "the code looks stable"). Instead, teams must satisfy predefined quantitative quality gates, including structural code coverage metrics, mutation testing survival scores, and reliability model thresholds.

### 1.1 The Necessity of Objective Exit Criteria
Testing is theoretically infinite, as there is an astronomical number of possible input combinations and state sequences. Without explicit exit criteria, software development projects face two major failure risks:
- **Under-Testing**: Releasing software with undetected defects, resulting in production failures, security vulnerabilities, and high maintenance costs.
- **Over-Testing**: Spending excessive time and resources testing minor details that do not add value, leading to delayed releases and missed market opportunities.

### 1.2 Coverage-Based Completion Criteria
Structural code coverage measures the percentage of code elements executed by the test suite:
- **Statement Coverage**: The percentage of source statements executed. While a baseline, statement coverage is weak because it ignores branch decisions.
- **Branch (Decision) Coverage**: The percentage of control-flow branches (e.g., `if` conditions, `switch` statements) evaluated to both true and false. Branch coverage is a robust quality gate, typically targeted at $\ge 80\%$.
- **Path Coverage**: The percentage of all unique execution paths through a module. Exhaustive path coverage is often impossible due to loops, but critical paths must be mapped and fully tested.

### 1.3 Fault-Based and Mutation Completion Criteria
Rather than measuring which lines of code were executed, fault-based criteria evaluate the test suite's capacity to detect faults:
- **Fault Seeding (Error Seeding)**: Intentionally inserting a known number of dummy bugs into the codebase. The proportion of seeded bugs found by the tests is used to estimate the number of real, unseeded bugs remaining.
- **Mutation Score Gate**: Demanding that the test suite kill a predefined percentage of automatically generated code mutants (e.g., Mutation Score $\ge 85\%$, as analyzed in mutation adequacy rules). This confirms that tests contain active assertions verifying correct logic.

### 1.4 Software Reliability Growth Models (SRGMs)
For large-scale or mission-critical systems, completion criteria are modeled statistically using Software Reliability Growth Models (SRGMs). These models analyze historical test execution time and defect discovery trends to estimate the remaining defect count and predict failure rates.
The **Goel-Okumoto Non-Homogeneous Poisson Process (NHPP)** model is formulated as:
$$m(t) = a(1 - e^{-bt})$$
Where:
- $m(t)$ is the expected cumulative number of faults detected by cumulative testing time $t$.
- $a$ is the expected total number of faults to be eventually detected in the system.
- $b$ is the fault detection rate per fault.

The failure intensity function $\lambda(t)$, which represents the rate of change of expected faults, is the derivative:
$$\lambda(t) = a \cdot b \cdot e^{-bt}$$

Under this model, testing activities can be safely terminated when the failure intensity $\lambda(t)$ falls below a target failure intensity threshold $\lambda_0$, indicating that the mean time to failure (MTTF) has reached acceptable standards:
$$MTTF(t) = \frac{1}{\lambda(t)}$$

### 1.5 Quality Gates and Defect Backlog Criteria
A successful release requires meeting strict defect backlog constraints:
- **Zero Open Blocker/Critical Defects**: No defect that halts core workflows, compromises security, or causes data corruption may remain open.
- **100% Automated Test Pass Rate**: Every unit, integration, and end-to-end test registered in the regression suite must execute successfully.
- **Predefined Quality Gate Alignment**: Package-specific coverage and performance metrics must be fully satisfied before code can be merged.

### 1.6 Technical Exception and Deviation Management
In real-world engineering, there are scenarios where a quality gate cannot be satisfied due to legacy code constraints, third-party library boundaries, or un-testable environmental factors. SWEBOK v4 dictates that quality gates must not be silently bypassed. Instead, teams must execute a formal deviation process:
- **Risk Assessment**: Document the specific code segment that fails the quality gate and evaluate the technical risk of leaving it un-tested.
- **Mitigation Plan**: Implement alternative controls, such as runtime logging, circuit breakers, or manual monitoring.
- **Formal Sign-Off**: The engineering lead or QA manager must review the risk analysis and explicitly approve the deviation before merging.

### 1.7 Verification vs. Validation Completion Criteria
SWEBOK v4 makes a clear distinction between verification and validation:
- **Verification Completion**: Confirms that the software was built correctly according to the system specifications. Exit criteria for verification focus on internal structural metrics, compiler correctness, typecheck validation, and unit/integration test coverage.
- **Validation Completion**: Confirms that the right software was built, ensuring it satisfies the customer's actual operational needs and business goals. Exit criteria for validation focus on user acceptance testing (UAT), usability audits, scenario-based walkthroughs, and business rule confirmation.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures to verify test completion:

### Step 2.1: Verify 100% Test Pass Rate
Execute the automated test suite locally:
```bash
rtk pnpm test
```
- Ensure that every single test passes. If any test fails, analyze the failure, apply a fix, and rerun the suite. Do not proceed with code coverage checks until the pass rate is 100%.

### Step 2.2: Generate and Review Code Coverage Reports
Run the coverage analysis tool on the modified packages:
```bash
rtk pnpm --filter <package-name> exec vitest run --coverage
```
- Inspect the output report (usually under `coverage/index.html`).
- Verify that statement coverage and branch coverage meet or exceed the package thresholds (typically 90% statement and 80% branch).

### Step 2.3: Verify Mutation Testing Adequacy
For critical modules, execute the mutation runner to ensure high assertion strength:
```bash
rtk pnpm --filter <package-name> exec stryker run
```
- Confirm that the mutation score satisfies the defined adequacy gate (e.g., $\ge 85\%$).
- If mutants survive, add the missing assertions and rerun the tool.

### Step 2.4: Inspect the Defect Backlog and Open Issues
Review the open bug tracker or issue log:
- Confirm that all blockers, critical issues, and major regressions discovered during verification are resolved and verified.
- If minor issues remain open, confirm they are documented, assigned a priority, and scheduled for post-release cycles.

### Step 2.5: Execute technical Exception Protocol for Unmet Gates
If a specific coverage or mutation gate cannot be met:
- Document the justification inside the active `implementation_plan.md` under a dedicated "Exceptions and Risk Analysis" section.
- Outline the risk of failure, why the code cannot be easily refactored for testing, and how runtime monitoring will mitigate the risk.
- Obtain explicit approval from the user or team lead before proceeding.

### Step 2.6: Create the Walkthrough Document
Compile all verification data into the `walkthrough.md` file:
- Record the exact Vitest and Stryker commands used.
- Include terminal code blocks showing the 100% pass rate, coverage percentages, and mutation scores.
- Document any approved deviations or risk assessments.

### Step 2.7: Security and Vulnerability Scanning Completion Gates
Before finishing verification, run static analysis and vulnerability scans on dependencies:
- Execute the package audit command:
```bash
rtk pnpm audit
```
- Verify that there are zero high or critical security vulnerabilities detected. If vulnerabilities are found, resolve them by updating dependencies or applying overrides before proceeding to release.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria regarding test completion:

- [ ] **100% Pass Rate Verified**: Did the agent confirm that all unit and integration tests run and pass without failures?
- [ ] **Coverage Gates Checked**: Did the agent run coverage commands and verify that statement and branch coverage meet project gates?
- [ ] **Mutation Gates Met**: Was mutation testing executed and the mutation score checked against quality standards?
- [ ] **No Subjective Termination**: Has the agent avoided stopping testing based on subjective "looks good" judgments?
- [ ] **Blocker-Free Backlog**: Are all blocker and critical defects fully resolved and verified before release?
- [ ] **Deviation Protocol Followed**: If any quality gate was not met, is there a risk assessment and mitigation plan documented?
- [ ] **E2E / System Verification**: Were system-level or integration tests executed to supplement unit coverage?
- [ ] **Walkthrough Created**: Does `walkthrough.md` present the quantitative proof of test completion (pass rates, coverage, mutation)?
- [ ] **SCM Sync Verified**: Are all test script modifications and configuration changes fully version-controlled?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content escaped to prevent string termination?
- [ ] **Reliability Models Understood**: Has the agent evaluated if statistical reliability modeling (e.g., failure intensity) is required for the release?
- [ ] **No Flaky Workarounds**: Did the agent fix underlying race conditions rather than using arbitrary retries to force a green test pass?
- [ ] **Sonar Assertions wrapped**: Do test cases verifying that a void method executes without issues wrap the call in `expect(() => ...).not.toThrow()`?
- [ ] **Explicit Member Access**: Are all methods and properties on completion helper classes declared with explicit accessibility modifiers?
- [ ] **Index Signature Safety**: Do completion verification scripts use bracket notation to access properties on index-signature objects?
- [ ] **Task List Sync**: Are all verification, coverage, and mutation tasks recorded and checked off in `task.md`?
