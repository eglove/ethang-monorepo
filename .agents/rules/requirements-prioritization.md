---
description: requirements prioritization scale, MoSCoW, numerical scale, and value-cost tradeoffs
trigger: model_decision
---

# Requirements Prioritization

## 1. Domain Theory and Conceptual Foundations
Requirements prioritization is the systematic process of evaluating and ranking software requirements to determine their implementation sequence. As described in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 1, prioritization is a critical requirements management activity. It resolves resource conflicts, manages project schedule constraints, and maximizes the business value delivered in each software release. Prioritization balances competing criteria, such as stakeholder desires, technical feasibility, cost, risk, and logical dependencies.

### 1.1 Multi-Dimensional Prioritization Criteria
To perform rigorous prioritization, engineers must evaluate requirements along several distinct dimensions:
- **Value/Benefit**: The positive impact of the requirement on business operations, customer satisfaction, or revenue.
- **Cost**: The effort, resources, and time required to design, implement, and test the feature.
- **Technical Risk**: The uncertainty associated with the technology stack, architectural compatibility, or integration requirements.
- **Complexity**: The algorithmic or logical difficulty of the implementation, which directly correlates with potential defect density.
- **Logical Dependencies**: The relationship where a requirement (e.g., "Export Reports") cannot be implemented before its prerequisite (e.g., "Database Storage") is completed.

### 1.2 Prioritization Methodologies
Several standard methodologies are used in software engineering to organize and rank requirements:
1. **MoSCoW Taxonomy**:
   - **Must Have**: Critical, non-negotiable requirements. Without these, the release cannot function or is legally/operationally non-compliant.
   - **Should Have**: Important requirements that add significant value but can be deferred or worked around temporarily if schedule constraints arise.
   - **Could Have**: Desirable features ("nice-to-haves") that are implemented only if surplus resources and schedule slack exist.
   - **Won't Have**: Deferred requirements that are explicitly excluded from the current release or iteration, although they may be considered for future planning.
2. **Value-vs-Cost Matrix**: A 2x2 grid used to visualize tradeoffs:
   - *High Value, Low Cost*: "Quick Wins" - prioritized immediately.
   - *High Value, High Cost*: "Strategic Projects" - carefully planned and scheduled.
   - *Low Value, Low Cost*: "Fill-Ins" - done when resources are idle.
   - *Low Value, High Cost*: "Thankless Tasks" / "Money Pits" - generally avoided or cancelled.
3. **Analytic Hierarchy Process (AHP)**: A mathematical approach that uses pairwise comparison matrices to calculate relative weights for requirements, minimizing subjectivity. AHP compares each requirement against every other requirement in pairs to determine which is more important and by how much, using a scale of 1 to 9. The eigenvalues of the comparison matrix are calculated to derive the priority vector. To ensure validity, the Consistency Ratio ($CR$) is calculated:
   $$CI = \frac{\lambda_{max} - n}{n-1}$$
   $$CR = \frac{CI}{RI}$$
   Where $CI$ is the Consistency Index, $\lambda_{max}$ is the maximum eigenvalue, $n$ is the number of requirements compared, and $RI$ is the Random Index. A $CR < 0.10$ indicates acceptable consistency in pairwise comparisons.
4. **Priority Score Calculation**: A quantitative formula to rank requirements mathematically:
   $$Priority\_Score = \frac{Value}{Cost \times Risk}$$
   Where Value, Cost, and Risk are scored on a standard scale (e.g., 1 to 5). Higher scores denote higher priority.

### 1.3 Kano Model Integration
The Kano Model classifies requirements based on customer perception and emotional response:
- **Must-Be (Basic Quality)**: Threshold requirements that are taken for granted. If missing, the customer is extremely dissatisfied, but their presence does not increase satisfaction. These map directly to MoSCoW "Must Have" requirements.
- **One-Dimensional (Performance)**: Requirements where satisfaction is linear to the level of implementation (e.g., system speed, storage size). These map to MoSCoW "Should Have" requirements.
- **Attractive (Excitement)**: Unexpected features that surprise and delight the user. If missing, there is no dissatisfaction. These map to MoSCoW "Could Have" requirements.
- **Indifferent**: Features that the user does not care about, which should be categorized as "Won't Have" to prevent resource waste.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures when prioritizing requirements in this workspace:

### Step 2.1: Document the Prioritization Matrix
The agent must construct a "Prioritization Matrix" table in the `implementation_plan.md` listing all requirement IDs (e.g., `REQ-01`, `REQ-02`) generated during elicitation. The table must contain the following columns:
- **Requirement ID**
- **Description**
- **Value (1-5)**: 1 (Minimal value) to 5 (Critical business value).
- **Cost (1-5)**: 1 (Very low effort) to 5 (Extremely high effort).
- **Risk (1-5)**: 1 (No risk/well understood) to 5 (High technical risk/experimental).
- **Calculated Priority Score**: Derived via $Score = Value / (Cost \times Risk)$.
- **MoSCoW Classification**

### Step 2.2: Resolve Logical Dependencies
Before finalizing the prioritization, the agent must identify and map dependencies:
- For every requirement, list any prerequisite requirement IDs.
- Ensure that no prerequisite requirement has a lower MoSCoW classification than its dependent requirement. For example, if `REQ-02` depends on `REQ-01`, and `REQ-02` is classified as a "Must Have", then `REQ-01` MUST also be classified as a "Must Have".

### Step 2.3: Apply MoSCoW Classifications
The agent must assign MoSCoW categories based on the Priority Score and logical dependencies:
- Classify high-score, dependency-free requirements as "Must Have".
- Calibrate the classifications to ensure that "Must Have" requirements do not exceed 60% of the total estimated project effort (leaving 40% contingency capacity for schedule variations).

### Step 2.4: Present Prioritization to User
The agent must present the completed Prioritization Matrix to the user:
- Highlight the deferred items classified as "Won't Have".
- Clearly explain the rationale for any high-value requirements classified as "Should Have" or "Could Have" due to cost or risk constraints.
- **STOP execution** and explicitly wait for the user to approve the prioritization list before updating `task.md` or beginning implementation.

### Step 2.5: Align Task Checklist and Release Planning
Once approved, the agent must:
- Update the `task.md` checklist, ordering the tasks sequentially according to the approved prioritization.
- Ensure that all "Must Have" tasks are grouped at the top of the checklist and marked for immediate execution.
- Add "Should Have" and "Could Have" tasks below, separated by horizontal dividers.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria during requirements prioritization:

- [ ] **Elicitation Sync**: Are all requirement IDs from the elicitation phase represented in the Prioritization Matrix?
- [ ] **Multi-Dimensional Scoring**: Has each requirement been scored individually for Value, Cost, and Risk?
- [ ] **Priority Score Calculation**: Is the mathematical Priority Score ($Value / (Cost \times Risk)$) calculated for each row?
- [ ] **MoSCoW Classification**: Has every requirement been assigned a MoSCoW category (Must/Should/Could/Won't)?
- [ ] **Dependency Audit**: Has the agent verified that no dependent requirement has a higher priority than its prerequisite?
- [ ] **Effort Calibration**: Have the "Must Have" requirements been budgeted to consume no more than 60% of available resources?
- [ ] **Deferred Features Listed**: Are "Won't Have" requirements explicitly documented as deferred features?
- [ ] **User Prioritization Gate**: Did the agent stop execution and wait for explicit user approval of the matrix before coding?
- [ ] **Task List Alignment**: Are the tasks in `task.md` sorted according to the approved priority ranking?
- [ ] **Gold-Plating Check**: Has the agent verified that no low-priority features are implemented ahead of "Must Have" features?
- [ ] **Risk Mitigation Sync**: Are requirements with high risk scores mapped to early-spike tasks to reduce uncertainty?
- [ ] **Database Dependency Check**: Are database schema modifications scheduled before API and UI implementations?
- [ ] **Non-Functional Prioritization**: Are non-functional requirements (e.g. security patches) prioritized alongside functional features?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Traceability Integration**: Is the prioritization state reflected in the Traceability Matrix?
- [ ] **Pruning Options**: In case of resource constraints, did the agent present clear tradeoff choices for scope pruning?
- [ ] **Context Boundary Check**: Are prioritization rankings consistent across all Bounded Context integrations?
- [ ] **TDD Scheduling**: Are the test-writing phases scheduled in line with the priority order?
- [ ] **Kano Model Mapping**: Has every requirement been audited to check its Kano classification (Must-Be, Performance, Attractive)?
- [ ] **Consistency Check**: If AHP was used, is the Consistency Ratio ($CR$) documented as less than 0.10?
- [ ] **Prerequisite Scheduling**: Have prerequisite database structures or SDK integrations been scheduled as early tasks?
- [ ] **Out-of-Scope Enforcement**: Have all requirements marked "Won't Have" been explicitly barred from code implementation?
