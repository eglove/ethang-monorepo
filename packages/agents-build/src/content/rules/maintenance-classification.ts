import { defineRule } from "../../define.ts";

export const maintenanceClassification = defineRule({
  content: `# Maintenance Classification

## 1. Domain Theory and Conceptual Foundations
Software maintenance is not a homogeneous activity; rather, it is a collection of diverse engineering practices aimed at keeping a software system operational, secure, and aligned with evolving business needs. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 12 (Software Maintenance) and the ISO/IEC 14764 standard, maintenance modifications are systematically classified into four distinct categories. Proper classification is essential for budgeting engineering resources, managing technical debt, and understanding the lifecycle dynamics of software evolution.

### 1.1 Lehman's Laws of Software Evolution
To understand the necessity of maintenance classification, we must reference Lehman's Laws of Software Evolution, which state that:
- **Law of Continuing Change**: An active system must undergo continuous adaptation to remain satisfactory in its environment.
- **Law of Increasing Complexity**: As a system evolves, its complexity increases unless active work is done to maintain or reduce it.

Classifying maintenance allows teams to balance work that adds feature value against work that prevents system decay.

### 1.2 The Four SWEBOK Maintenance Classifications
SWEBOK v4 groups maintenance into four categories based on their intent and trigger:
1. **Corrective Maintenance**: Reactive modification of a software product performed after delivery to correct discovered problems. This is triggered by reported defects (e.g. crash logs, database constraint failures, validation leaks).
2. **Adaptive Maintenance**: Modification of a software product performed after delivery to keep a software product usable in a changed or changing environment. This is triggered by external environmental shifts, such as operating system upgrades, node runtime updates, third-party library API deprecations, or security protocol revisions.
3. **Perfective Maintenance**: Modification of a software product after delivery to improve performance, usability, or maintainability. Unlike adaptive or corrective, perfective changes are not triggered by errors or environments, but by internal goals to enhance quality (e.g. database index optimization, code simplification, UX responsiveness).
4. **Preventive Maintenance**: Modification of a software product after delivery to detect and correct latent faults in the software product before they become active faults. This is proactive engineering (e.g. resolving linter warnings, fixing static analysis vulnerabilities, addressing technical debt hotspots, or conducting security audits).

### 1.3 Quantitative Tracking of Maintenance Effort
Organizations track maintenance efforts using the Maintenance Category Ratio ($$MCR$$) to evaluate software health:
$$MCR_{type} = \\left( \\frac{\\text{Hours spent on } \\text{type} \\text{ maintenance}}{\\text{Total maintenance hours}} \\right) \\times 100\\%$$

A system spending $> 80\\%$ of its time on reactive Corrective Maintenance is highly unstable, whereas a healthy, mature engineering team strives to increase the ratio of Preventive and Perfective Maintenance.

### 1.4 Advanced Software Evolution: Further Laws of Lehman
While the first two laws of Lehman are widely cited, SWEBOK v4 notes that subsequent laws also govern software maintenance:
- **Law of Self-Regulation**: Software evolution processes are self-regulating, with system metrics (like defect inflow rate and release intervals) showing normal distributions.
- **Law of Conservation of Organizational Stability**: The average activity rate in an evolutionary lifecycle is invariant over the lifetime of the system, meaning resource allocation must be carefully balanced.
- **Law of Conservation of Familiarity**: The amount of content added in each release must be managed to maintain developer familiarity and prevent a sudden spike in regression defect density.

### 1.5 Software Maintainability and Defect Inflow Metrics
To measure the impact of perfective and preventive maintenance, teams evaluate the Maintainability Index ($$MI$$), a composite metric calculated as:
$$MI = 171 - 5.2 \\times \\ln(V) - 0.23 \\times G - 16.2 \\times \\ln(LOC) + 50 \\times \\sin(\\sqrt{2.4 \\times C})$$
Where:
- $V$ is Halstead Volume (program size and vocabulary complexity).
- $G$ is Cyclomatic Complexity (control flow paths).
- $LOC$ is Lines of Code.
- $C$ is the percentage of comment lines.
An $MI > 85$ indicates highly maintainable code. Perfective refactoring aims to increase the Halstead and Cyclomatic efficiency, keeping the $MI$ high and reducing the Defect Inflow Rate ($$DIR$$).

### 1.6 The Impact of Maintenance Category on Quality and System Lifespan
SWEBOK v4 emphasizes that a software system's lifespan is highly correlated with the distribution of its maintenance activities:
- **Corrective Dominance**: Indicates a system with high technical debt, low automated test coverage, and a fragile architecture where changes trigger frequent regression faults.
- **Adaptive Dominance**: Suggests a system operating in a highly volatile external environment or using rapidly changing dependencies. It demands high effort just to maintain status quo.
- **Perfective and Preventive Dominance**: Reflects a healthy product lifecycle where engineers actively invest in lowering complexity, refactoring code, and preventing defects. This preserves developer velocity and extends system longevity.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures when classifying and executing maintenance:

### Step 2.1: Analyze the Scope of the Change Request
Review the user request, issue tracker, or task description:
- Identify the trigger: Is the change responding to a bug report, a library update request, a performance complaint, or a lint clean-up effort?

### Step 2.2: Assign the Correct Maintenance Classification
Apply the SWEBOK taxonomy to categorize the task:
- **Corrective**: Select this if the task is fixing an active failure or bug.
- **Adaptive**: Select this if the task is updating a library (e.g. upgrading Vitest/TypeScript) or adjusting to API schema updates.
- **Perfective**: Select this if the task is refactoring working code to improve performance or readability.
- **Preventive**: Select this if the task is fixing static analysis issues (eslint, tsc warnings) or adding tests to address latent risks.

### Step 2.3: Document the Classification in the Task List
In the \`task.md\` and \`implementation_plan.md\` files:
- Clearly label the change with its SWEBOK maintenance category.
- Trace the requirement back to the SCM change request.

### Step 2.4: Apply Class-Specific Construction Rules
Follow the specific engineering disciplines required by the classification:
- **For Corrective/Preventive**: Apply Test-Driven Development (TDD). Write a failing test first, then write the code to fix it.
- **For Adaptive**: Run compatibility builds and dependency audit checks:
\`\`\`bash
rtk pnpm audit
\`\`\`
- **For Perfective**: Verify that changes do not alter functional behavior. Run regression test suites before and after refactoring to ensure they remain green.

### Step 2.5: Verify the Build and Quality Gates
Regardless of classification, compile the package and run static analysis:
\`\`\`bash
rtk pnpm --filter @ethang/agents-build build
rtk pnpm --filter @ethang/agents-build lint
\`\`\`

### Step 2.6: Log Results in the Release Walkthrough
In the \`walkthrough.md\` file:
- Document the maintenance type and the verified outcomes.
- Record any lessons learned during the maintenance lifecycle (e.g., environmental issues encountered during adaptive changes).

### Step 2.7: Technical Debt and Backlog Logging
To prevent system decay:
- Audit static analysis metrics (such as SonarCloud dashboard results or linter output).
- Categorize open issues and technical debt items as either perfective maintenance (code refactoring for cleaner architecture) or preventive maintenance (addressing security warnings or adding test coverage).
- Log these items in the project's technical backlog for future iterations, ensuring that technical debt is monitored quantitatively.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria regarding maintenance classification:

- [ ] **Maintenance Type Categorized**: Has the change request been explicitly categorized into one of the four SWEBOK maintenance types?
- [ ] **Trigger Identified**: Did the agent identify the trigger (bug report, library upgrade, refactoring goal) of the change?
- [ ] **TDD for Corrective Tasks**: Was TDD (red-green-refactor) used for corrective and preventive maintenance tasks?
- [ ] **No Regression for Perfective**: Did the agent confirm that perfective refactoring did not alter functional behavior (tests remained green)?
- [ ] **Dependency Audit for Adaptive**: Was a dependency safety audit run during adaptive library updates?
- [ ] **Lehman's Complexity Managed**: Has the agent verified that the change does not introduce unnecessary architectural complexity?
- [ ] **Lockfile Sync Maintained**: Did adaptive updates update and sync the \`pnpm-lock.yaml\` file?
- [ ] **Task List Classification**: Are all tasks in \`task.md\` labeled with their maintenance classification?
- [ ] **No Code Quality Degradation**: Did the linter and typechecker pass with zero warnings post-maintenance?
- [ ] **Safe Git Reverts**: Were specific files restored using targeted \`git restore\` rather than global resets?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content escaped to prevent string termination?
- [ ] **Walkthrough Record Completed**: Does \`walkthrough.md\` document the maintenance category and verification commands?
- [ ] **Index Signature Safety**: Do maintenance scripts use bracket notation to access properties on index-signature config objects?
- [ ] **Sonar Assertions wrapped**: Do test cases verifying that a void method executes without issues wrap the call in \`expect(() => ...).not.toThrow()\`?
- [ ] **Explicit Member Access**: Are all methods and properties on maintenance helper classes declared with explicit accessibility modifiers?
- [ ] **Task List Sync**: Are all maintenance tasks, class tracking, and linter checks tracked in \`task.md\`?`,
  description:
    "maintenance classification, corrective, adaptive, perfective, and preventive maintenance",
  filename: "maintenance-classification",
  trigger: "model_decision"
});
