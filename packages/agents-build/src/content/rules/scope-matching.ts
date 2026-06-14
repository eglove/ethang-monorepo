import { defineRule } from "../../define.ts";

export const scopeMatching = defineRule({
  content: `# Scope Matching

## 1. Domain Theory and Conceptual Foundations
Scope matching is the software engineering discipline of aligning the functional and non-functional requirements of a system with the project's resource, budget, and schedule constraints. As described in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Software Requirements and Software Engineering Management chapters, scope matching is a fundamental activity of project planning and requirements engineering. It addresses the "triple constraint" or project management triangle (Scope, Cost, Time), establishing that any change in one factor necessitates adjustment in the others to maintain quality and project feasibility.

### 1.1 The Triple Constraint and Project Feasibility
In software engineering, attempting to implement a scope that exceeds the capacity of the team within a fixed schedule and budget leads to severe failure modes:
- **Design Degradation**: Rushing to meet unrealistic deadlines results in architectural compromises, accumulation of technical debt, and lack of refactoring.
- **Defect Injection**: Higher stress and compression of testing phases lead to critical bugs slipping into production.
- **Team Burnout**: Unsustainable development pace reduces long-term velocity and morale.

SWEBOK v4 emphasizes that project feasibility must be established quantitatively during the requirements phase, rather than treated as a scheduling concern later. The scope must be bounded and matched to the team's historical velocity or resource limitations.

### 1.2 Quantitative Functional Sizing
To match scope to constraints, engineers must measure the "size" of requirements. SWEBOK v4 outlines several sizing methodologies:
1. **Functional Size Measurement (FSM)**: Standardized methods (such as IFPUG Function Points) that measure the size of software by quantifying the user-visible functions. FSM is independent of the technology stack or implementation details.
   - *External Inputs (EI)*: Data entering the system boundary (e.g., forms, API requests).
   - *External Outputs (EO)*: Data leaving the system boundary that involves processing logic (e.g., reports, calculated displays).
   - *External Inquiries (EQ)*: Interactive data retrieval that does not alter system state.
   - *Internal Logical Files (ILF)*: Logical groups of data maintained within the system boundary (e.g., database tables).
   - *External Interface Files (EIF)*: Reference data maintained outside the system boundary.
2. **COSMIC Function Points**: A modern FSM standard (ISO/IEC 19761) that measures software size by counting data movements (entries, exits, reads, writes) between the functional user and the system. It is particularly suited for real-time and embedded systems, where traditional function points are difficult to apply.
3. **Story Points**: A relative estimation technique used in agile frameworks, where requirements (user stories) are assigned points based on complexity, effort, and uncertainty, calibrated against historical baseline tasks.
4. **Lines of Code (LOC)**: A retrospective size measure, generally avoided for initial planning due to high variability across programming languages and coding styles.

By calculating total functional size ($S$) and multiplying it by the team's historical productivity rate ($P$, e.g., hours per function point or velocity in story points per iteration), engineers can estimate the required effort ($E$):
$$E = S \\times P$$
If estimated effort ($E$) exceeds the available capacity ($C$) within the target timeline, the scope must be adjusted downward.

### 1.3 Algorithmic Estimation Models (COCOMO II)
Once functional sizing is complete, software engineers use algorithmic estimation models like COCOMO II (Constructive Cost Model) to translate size into effort and schedule. The basic COCOMO II equation is:
$$Effort = A \\times (Size)^B \\times \\prod_{i=1}^{n} EM_i$$
Where:
- $Size$ is measured in thousands of source lines of code (KSLOC) or converted Function Points.
- $A$ is a constant calibration factor representing baseline productivity.
- $B$ is an exponent representing scale economies or diseconomies. Diseconomies of scale occur when $B > 1.0$, indicating that larger projects require disproportionately more effort due to communication overhead, integration complexity, and coordination costs.
- $EM_i$ are Effort Multipliers representing cost drivers such as developer capability, product complexity, database size, and reliability requirements.
If the calculated Effort exceeds the team's capacity, scope pruning must reduce the $Size$ variable, thereby reducing estimated effort and schedule.

### 1.4 Parkinson's Law and Brooks' Law
When managing project scope, engineers must account for two key empirical laws:
- **Parkinson's Law**: "Work expands so as to fill the time available for its completion." This highlights the risk of gold-plating—adding unrequested features simply because schedule slack exists. Scope matching enforces a strict baseline boundary to prevent this.
- **Brooks' Law**: "Adding human power to a late software project makes it later." This warns against resolving scope mismatches by adding personnel mid-project, due to the communication overhead and training ramp-up costs. Therefore, adjusting the scope is the primary viable mechanism for bringing a late project back on track.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures when executing scope matching in this workspace:

### Step 2.1: Elicit Project Constraints and Resources
Before defining the technical implementation plan, the agent must document all project constraints. This must be written under a "Project Constraints and Bounds" section in the \`implementation_plan.md\`:
- **Schedule**: The target completion date and milestone deadlines.
- **Budget / Resource Capacity**: The available developer hours or agent execution limits (token/cost thresholds).
- **Technical Constraints**: Target environment restrictions (e.g., Cloudflare Worker memory limit of 128MB, database connection pools, cold-start latencies).

### Step 2.2: Perform Quantitative Requirements Sizing
The agent must estimate the relative size of each scenario defined during elicitation. The agent must construct a "Functional Sizing Table" in the \`implementation_plan.md\`:
- Break down the requirements into discrete functional units (e.g., API endpoints, UI views, background workers).
- Assign a complexity weight (Low, Medium, High) or Story Point value to each unit based on database interactions, UI complexity, and algorithmic difficulty.
- Sum the points to establish a total size baseline.

### Step 2.3: Verify Size against Capacity
The agent must compare the total estimated effort against the project constraints:
- Estimate the effort in hours using a calibration factor derived from previous tasks.
- If the required effort is within 80% of the available capacity, the scope is considered "Matched and Feasible".
- If the required effort exceeds 80% of capacity, the agent must flag a "Scope-Constraint Mismatch" warning to the user.

### Step 2.4: Execute Scope Pruning and Negotiation
In the event of a mismatch, the agent must NOT proceed with implementation. The agent must:
- Identify low-priority requirements (e.g., "Could Have" or "Won't Have" items from the prioritization matrix).
- Formulate a proposal for the user, detailing which features can be deferred, simplified, or split into subsequent phases/releases.
- **STOP execution** and explicitly wait for the user to select an option or approve the pruned scope.

### Step 2.5: Freeze Bounded Scope
Once the user approves the scope adjustments, the agent must update the \`implementation_plan.md\` to:
- Document the final approved list of in-scope features.
- Explicitly list "Out of Scope" items to prevent future gold-plating.
- Lock the baseline in the traceability matrix.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria during scope matching activities:

- [ ] **Constraint Elicitation**: Have all schedule, resource, and technical constraints been documented in the plan?
- [ ] **Functional Breakdown**: Is there a complete breakdown of the scope into discrete, estimable functional units?
- [ ] **Relative Sizing**: Has each functional unit been assigned a relative size or complexity weight (e.g., Low/Med/High or Story Points)?
- [ ] **Effort Estimation**: Is there a documented calculation showing the estimated effort based on sizing and productivity?
- [ ] **Mismatch Detection**: Did the agent evaluate whether the required effort fits within the available resource capacity?
- [ ] **Negotiation Proposal**: If a mismatch occurred, did the agent present a clear, actionable pruning proposal to the user?
- [ ] **Gate Intercept**: Did the agent pause and wait for explicit user approval of the scope adjustment before coding?
- [ ] **In-Scope Definition**: Are the approved features clearly listed and mapped to Given-When-Then scenarios?
- [ ] **Out-of-Scope Exclusion**: Is there an explicit list of deferred or out-of-scope items to prevent scope creep?
- [ ] **Parkinson's Law Defense**: Has the agent verified that no features outside the approved scope have been implemented?
- [ ] **Brooks' Law Alignment**: Did the agent avoid suggesting adding external team members as a solution to schedule constraints?
- [ ] **Technical Boundary Verification**: Has the scope been checked against technical constraints (e.g. bundle size, execution timeouts)?
- [ ] **Database Impact Assessed**: Are database operations (schema changes, migration complexity) factored into the size estimates?
- [ ] **Traceability Integration**: Is the approved scope fully mapped to the Traceability Matrix for verification?
- [ ] **Task Checklist Sync**: Does the \`task.md\` checklist contain only tasks that correspond to the approved in-scope features?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **DDD Bounded Context Check**: Has the agent verified that the scope does not cross Bounded Context boundaries without an integration contract?
- [ ] **Quality Attribute Sizing**: Are non-functional requirements (e.g., performance tuning, security scanning) included in the size estimation?
- [ ] **Milestone Partitioning**: For large scopes, has the agent proposed breaking the delivery into smaller, verifiable releases?
- [ ] **COCOMO II Verification**: Have size exponents ($B$) been analyzed to verify whether the project suffers from diseconomies of scale?
- [ ] **COSMIC Alignment**: Have data movements (entries, exits, reads, writes) been counted for real-time and background processes?
- [ ] **Calibrated Productivity**: Has the agent used historical runtimes or velocity metrics to calibrate the productivity factor ($P$)?
- [ ] **Resource Buffer**: Is there a documented 20% resource buffer to account for unforeseen integration blockages?`,
  description:
    "scope matching, project constraints, and requirements prioritization",
  filename: "scope-matching",
  trigger: "model_decision"
});
