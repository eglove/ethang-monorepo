---
description: requirements change control, change requests, and scope agreement
trigger: model_decision
---

# Requirements Change Control

## 1. Domain Theory and Conceptual Foundations
Managing changes to the established requirements baseline is a core discipline of software engineering, essential to prevent scope creep, maintain stakeholder alignment, and ensure project success. In the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 1, requirements change control is defined as a systematic process under the umbrella of Requirements Management. It establishes a formal mechanism for proposing, evaluating, approving, and tracking modifications to a system's requirements after a baseline has been formally agreed upon and frozen.

### 1.1 Requirements Volatility and Core Drivers
Requirements volatility—the tendency of requirements to change over time—is an inherent characteristic of software development. Volatility arises from multiple factors:
- **Evolution of Business Goals**: Shifts in market conditions, competitor actions, or corporate strategy.
- **Improved Stakeholder Understanding**: As users interact with prototypes or early releases, they gain a clearer understanding of their own needs and system capabilities.
- **Technological and Environmental Changes**: Updates to underlying operating systems, hardware platforms, network infrastructure, or third-party APIs.
- **Regulatory and Compliance Updates**: Changes in legislation, security standards, or privacy laws (such as GDPR, CCPA, or HIPAA).

Uncontrolled requirements changes lead to "scope creep," where the project's features expand without corresponding adjustments to budget, timeline, or resources. This frequently results in late delivery, budget overruns, design degradation, and high defect rates.

To quantify requirements volatility, software engineers use the volatility rate formula:
$$V = \frac{R_{added} + R_{modified} + R_{deleted}}{R_{total}} \times 100\%$$
Where:
- $R_{added}$ is the number of requirements added.
- $R_{modified}$ is the number of requirements modified.
- $R_{deleted}$ is the number of requirements deleted.
- $R_{total}$ is the total number of requirements in the baseline.
A high volatility rate ($V > 20\%$) during active development indicates instability and necessitates stricter change control gates.

### 1.2 The Requirements Baseline and SCM
To manage volatility, software engineers establish a **Requirements Baseline**. A baseline is a snapshot of the approved requirements at a specific point in time. Once frozen, any change to the baseline must go through the formal Change Control process, which is integrated with Software Configuration Management (SCM). SCM provides the infrastructure for versioning requirements documents, maintaining change histories, and establishing configuration audits.

The Change Control process comprises the following phases:
1. **Change Request Submission**: The initiator documents the proposed change, including its description, rationale, priority, and source.
2. **Technical and Project Impact Analysis**: Engineers analyze the proposal to determine its effects on the software architecture, codebase, database schemas, APIs, test suites, schedule, budget, resource allocation, and quality attributes (performance, security, usability).
3. **Evaluation and Decision**: A Change Control Board (CCB)—consisting of key stakeholders, project managers, and lead architects—reviews the change request and impact analysis to accept, reject, defer, or request modification of the change.
4. **Implementation and Verification**: If approved, the codebase, schemas, and tests are updated. The changes are verified against the new requirements, and regression testing is performed to ensure existing functionality remains intact.
5. **Baseline Update**: The requirements specification, traceability matrix, and project plans are updated to reflect the new baseline.

In Domain-Driven Design (DDD), requirements change control is crucial for maintaining the integrity of Bounded Contexts. A change in requirements may alter the Ubiquitous Language or necessitate changes to API contracts between contexts. Such changes must be managed carefully to prevent upstream/downstream context corruption.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures when managing requirements changes in this workspace:

### Step 2.1: Formal Submission of a Change Request
When a modification, addition, or deletion of a feature is proposed, the agent must document this request. The agent must update the `implementation_plan.md` by adding a dedicated section titled "Change Request [ID]" under "Requirements Change Control". This section must capture:
- **Change Description**: Clear, unambiguous prose describing the requested modification.
- **Rationale**: The business or technical reason driving the change.
- **Source**: Who or what initiated the change.
- **Impacted Requirements**: A list of existing requirements from the baseline that are affected.

### Step 2.2: Technical and Architectural Impact Analysis
The agent must analyze the workspace to determine the technical consequences of the proposed change. This analysis must be documented in the `implementation_plan.md` and include:
- **Affected Code Modules**: Specific files, components, and classes that require modification.
- **Database Schema Changes**: New tables, columns, indexes, or migrations required.
- **API and Interface Impact**: Changes to API endpoints, payloads, request/response models, or event schemas.
- **Quality Attribute Impact**: Assessment of how the change affects performance, security, availability, and maintainability.
- **Dependency Analysis**: Identification of upstream or downstream modules that might break due to this change.

### Step 2.3: Project Constraint and Effort Estimation
The agent must estimate the resources required to implement the change:
- **Effort Estimate**: Estimated coding and testing hours.
- **Schedule Impact**: Any potential delays to the target completion date.
- **Test Strategy**: The specific unit, integration, and regression tests that must be created or updated.

### Step 2.4: Obtaining Stakeholder (User) Approval
The agent must present the completed Change Request and Impact Analysis to the user. The agent must:
- Highlight any high-risk changes, such as breaking database migrations or modifications to public API contracts.
- Present clear options if trade-offs are required (e.g., swapping a new feature for an existing low-priority baseline item).
- **STOP execution** and explicitly wait for the user to reply with "approved" or provide feedback before modifying any production code or test files.

### Step 2.5: Baselining and Traceability Matrix Update
Upon receiving user approval, the agent must:
- Update the primary requirements list in the `implementation_plan.md` to reflect the new approved baseline.
- Update the Traceability Matrix to map the new/modified requirements to their target code files and test cases.
- Update the `task.md` checklist to add execution steps for the approved change.

### Step 2.6: Execution, Verification, and Walkthrough Documentation
- Implement the approved changes in a Test-Driven Development (TDD) loop: write failing tests, implement the code, and refactor.
- Run the full test suite to verify no regressions were introduced.
- Document the completed change in the `walkthrough.md` artifact, detailing the differences between the previous baseline and the new baseline.

### Step 2.7: Selective Revert Strategy
If the change request is rejected or cancelled during development, the agent must restore the workspace to the prior clean baseline. The agent must NOT use global commands like `git reset --hard` or `git checkout -- .` which might wipe out unrelated user work. Instead, the agent must run:
```bash
rtk git restore <specific_file_path>
```
to revert only the files that were modified as part of the cancelled change request.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria during requirements change control activities:

- [ ] **Baseline Identification**: Has the current frozen baseline been clearly referenced before initiating the change control process?
- [ ] **Change Request Documentation**: Is the change request documented with a description, rationale, source, and affected requirements?
- [ ] **Code Impact Scanned**: Has the codebase been searched (using WebStorm search or ripgrep) to identify all files that will be modified?
- [ ] **Schema Impact Evaluated**: Have database migrations and column alterations been identified and documented in the impact analysis?
- [ ] **API Interface Audit**: Has the agent verified if the change affects public API contracts, and are these contract changes documented?
- [ ] **Quality Attribute Assessment**: Has the impact on system performance, security, and maintainability been analyzed and written down?
- [ ] **Effort and Schedule Estimations**: Are there concrete estimates for the hours and schedule impact in the analysis?
- [ ] **Dependency Path Analysis**: Have all upstream and downstream dependencies that could be broken by the change been checked?
- [ ] **User Gate Intercept**: Did the agent stop execution and wait for explicit user approval before making any code modifications?
- [ ] **Baseline Requirements Update**: Have the modified requirements been incorporated into the main requirements section of the plan?
- [ ] **Traceability Matrix Alignment**: Has the traceability matrix been updated to link the new requirements to files and tests?
- [ ] **Task Checklist Update**: Has the `task.md` file been updated with the specific engineering steps for this change?
- [ ] **TDD Implementation Loop**: Were failing unit/integration tests written before implementing the production code changes?
- [ ] **Full Regression Execution**: Was the entire test suite run and verified green to prove no regression exists?
- [ ] **Walkthrough Update**: Has the `walkthrough.md` been updated to contrast the old baseline against the new changes?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Targeted Restore Execution**: In the event of revert, has the agent used specific file-level restore commands rather than a global reset?
- [ ] **Ubiquitous Language Review**: Has the agent verified that any terminology changes are reflected in the glossary and approved by the user?
- [ ] **Configuration Auditing**: Has the agent verified that the version tags or commits correspond exactly to the approved change requests?
