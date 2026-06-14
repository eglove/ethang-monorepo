import { defineRule } from "../../define.ts";

export const designQualityReviews = defineRule({
  content: `# Design Quality Reviews

## 1. Domain Theory and Conceptual Foundations
Design quality reviews are formal static verification activities conducted to assess the completeness, correctness, and maintainability of a software design prior to coding. As outlined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 2 (Software Design) and Chapter 10 (Software Quality), design reviews serve as a primary verification gate, catching conceptual and architectural defects before they propagate into construction where their remediation cost is exponentially higher.

### 1.1 Technical Reviews, Inspections, and Audits
Static quality verification comprises three primary activities, each with varying degrees of formality:
- **Technical Reviews**: Collaborative meetings where peer engineers evaluate a design's technical feasibility, checking for adherence to standards, architectural constraints, and interface definitions. They are less formal than inspections but follow a structured agenda.
- **Inspections (Fagan Inspections)**: Highly structured, role-based reviews focused on defect detection. The process relies on peer review checklists to compare design artifacts against specifications. It is a mathematical fact that formal inspections discover more defects per hour of effort than dynamic testing.
- **Audits**: Independent assessments conducted by external personnel to verify that development processes, design documentation, and artifacts comply with regulatory, organizational, or project standards.

### 1.2 Conceptual Integrity, Coupling, and Cohesion
Reviewers evaluate designs against core software engineering principles:
- **Conceptual Integrity**: Consistency across the codebase. A system with high conceptual integrity looks as though it was designed by a single mind, using identical naming conventions, architectural patterns, and error handling policies.
- **Coupling and Cohesion**: Verifying that modules exhibit low coupling (minimal interdependencies) and high cohesion (each module has a single, well-defined purpose).
- **Traceability**: Ensuring that every element in the design can be mapped back to a specific requirement, and that every requirement is covered by a design element.

### 1.3 Fagan Inspections and Roles
The **Fagan Inspection** is a highly disciplined defect-detection process consisting of six distinct phases: planning, overview, preparation, inspection meeting, rework, and follow-up. Success depends on participants fulfilling defined, non-overlapping roles:
- **Moderator**: The inspection leader who schedules meetings, controls the pace of review, and ensures the process remains objective and focused on defect discovery rather than styling or personality.
- **Reader**: Paraphrases the design document line-by-line during the meeting, ensuring the team walks through every section.
- **Author**: The engineer who created the design. The author participates to observe feedback but does not lead or moderate the meeting, maintaining an objective stance.
- **Recorder (Scribe)**: Documents all discovered defects, listing their location, severity, and description in a formal defect registry.
- **Inspector**: Peer engineers who analyze the design during preparation and the meeting to find defects, mismatches, or omissions.

### 1.4 Review Checklists and Inspection Metrics
A systematic review relies on checklists and quantified metrics to evaluate progress and verify quality:
- **Checklists**: Structured lists of common design defects compiled from historical project data (e.g., missing API timeouts, lack of database indexes, un-wrapped external dependencies). Checklists guide inspectors to focus on high-value defect categories.
- **Review Speed (Throughput)**: The rate at which the material is examined (e.g., pages of SDD reviewed per hour). SQA studies show that if review speed exceeds a threshold (typically 2-3 pages per hour), defect detection efficiency drops precipitously.
- **Defect Density**: The number of defects discovered per page of design documentation. Anomalously low defect density often signals a superficial review rather than a perfect document, prompting a re-inspection.
- **Preparation Rate**: The amount of time inspectors spend reviewing the SDD individually before the meeting. High preparation rates correlate directly with high-quality defect detection.

### 1.5 SDD Sufficiency and Baselines
A **Software Design Document (SDD)** is sufficient only when it provides enough detail for an engineer to construct the feature without making undocumented design decisions. Reviewers check that:
- **API and Schema Definitions**: All external API interfaces, database schema migrations, and component interactions are fully specified.
- **Dynamic Interaction Models**: Sequence flows, event mappings, and concurrency designs are drawn out to show how components coordinate.
- **State Space**: The state space is completely mapped (including loading, empty, and error states).
- **Baseline Lock**: Once a design passes review, the SDD is baselined and locked under version control. Any subsequent design modifications require a formal change control process, preventing scope creep and uncoordinated code drift.

### 1.6 Defect Classification and Severity Levels
To manage rework effectively, discovered issues must be classified systematically:
- **Defect Classification**: Categorizing defects by their nature (e.g., functional omission, logic error, architectural violation, performance bottleneck, security exposure).
- **Severity Levels**: Assigning severity based on impact:
  - **Critical**: Prevents system execution, compromises data security, or violates core architectural boundaries. Requires immediate rework and re-inspection.
  - **Major**: Degrades system capability, breaks a major functional flow, or creates maintenance challenges. Requires rework before coding begins.
  - **Minor**: Cosmetic inconsistencies, minor style guide violations, or documentation typos. Can be reworked in parallel with construction.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures when conducting design reviews:

### Step 2.1: Establish Review Scope and Roles
Before submitting an implementation plan for review, the agent must define the review structure in the \`implementation_plan.md\`:
- Identify the peer reviewers who will act as inspectors.
- Specify the design artifacts to be reviewed (e.g., database schemas, API route specs, custom adapters).
- Set the review schedule, allowing adequate preparation time for inspectors.

### Step 2.2: Conduct Checklist-Driven SDD Inspection
Inspect the proposed design against the following quality checklist criteria:
- **Requirements Mapping**: Trace each proposed component to a functional requirement.
- **Architectural Coupling**: Verify that outer layers (e.g., HTTP handlers) do not bypass core interfaces.
- **State Coverage**: Check that loading, error, and empty states are mapped for all new UI screens.
- **Error Boundaries**: Ensure try-catch boundaries are defined around all network queries.

### Step 2.3: Document and Log Design Issues
The recorder must write all discovered issues into a formal "Design Issue Registry" in the \`implementation_plan.md\`:
- Label each issue with a unique ID, description, severity level (Critical, Major, Minor), and target resolution criteria.
- Do not proceed to construction if there are unresolved Critical or Major design defects.

### Step 2.4: Execute Rework and Verification Cycles
The author must address the logged defects:
- Modify the SDD or implementation plan to resolve the issue.
- Document the exact changes made in the issue registry.
- Present the modified design to the Moderator to verify that the defects are resolved and check them off the list.

### Step 2.5: Baseline the Design Document
Once all issues are resolved:
- Update the \`implementation_plan.md\` status to "Approved".
- Commit the finalized plan and tasks list to the repository.
- Use this approved plan as the immutable baseline during code implementation.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria regarding design quality reviews:

- [ ] **Inspection Preparation**: Has the agent verified that inspectors have reviewed the design plan prior to the meeting?
- [ ] **Role Assignments**: Are specific roles (Moderator, Reader, Scribe, Author) assigned for the inspection?
- [ ] **Structured Checklist Applied**: Was a structured design checklist used to inspect the design?
- [ ] **Requirements Traceability**: Is every design element traced to a functional requirement in the plan?
- [ ] **Coupling Audit**: Did the agent verify that coupling levels between packages conform to the workspace architecture?
- [ ] **State Space Verification**: Has the design been verified as covering loading, error, and empty states?
- [ ] **Error Boundary Inspections**: Are catch-all error handlers and local try-catch blocks inspected for completeness?
- [ ] **Issue Registry Creation**: Is a formal Design Issue Registry present in the plan listing all discovered defects?
- [ ] **Severity Level Assignment**: Are logged issues assigned a severity level (Critical/Major/Minor)?
- [ ] **Rework Verification**: Has the moderator checked off all rework tasks in the registry before construction starts?
- [ ] **VCS Baseline Commit**: Was the approved design plan committed to the repository to lock the baseline?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content escaped to prevent string termination?
- [ ] **Technology Constraints Check**: Has the design been inspected against environmental size and memory limits?
- [ ] **Walkthrough Verification**: Does the \`walkthrough.md\` trace code components back to the baselined design?
- [ ] **Interface Isolation Check**: Did the agent verify that external libraries are wrapped behind interfaces?
- [ ] **Task List Sync**: Do tasks in \`task.md\` align precisely with the baselined design elements?
- [ ] **Conceptual Integrity Audit**: Has the design been checked for pattern consistency with the rest of the monorepo?
- [ ] **Fagan Inspection Phase Completion**: Have all six phases of the Fagan inspection process been followed and completed?
- [ ] **Explicit Member Access**: Are all methods and properties on design review helper modules declared with explicit accessibility modifiers?`,
  description: "design quality, design reviews, audits, and SDD sufficiency",
  filename: "design-quality-reviews",
  trigger: "model_decision"
});
