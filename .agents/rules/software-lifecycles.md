---
description: software lifecycles, development models, agile iterations, and phase entry/exit criteria
trigger: model_decision
---

# Software Lifecycles

## 1. Domain Theory and Conceptual Foundations
A software lifecycle model (also known as a Software Life Cycle Model, or SLCM) defines the structured phases, activities, and iteration boundaries through which a software product is conceived, developed, verified, maintained, and retired. As detailed in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 8 (Software Engineering Process) and Chapter 7 (Software Engineering Management), the selection of an SLCM is a foundational engineering decision that dictates how risk is managed, how quality is assured, and how progress is measured.

### 1.1 Taxonomy of Life Cycle Models
SWEBOK v4 categorizes software lifecycle models into three primary families:
- **Predictive (Sequential/Waterfall)**: Characterized by a linear sequence of phases (Requirements, Design, Construction, Testing, Maintenance) where each phase must be completed before the next begins. It is highly disciplined but vulnerable to requirements volatility.
- **Iterative and Incremental (Evolutionary)**: Develops the system through repeated cycles (iterations) and in small portions (increments). This includes the **Spiral Model**, which is driven by continuous risk analysis, allowing prototypes to be developed and evaluated at each iteration.
- **Adaptive (Agile)**: Emphasizes evolutionary development, rapid delivery, and extreme flexibility. Agile lifecycles (such as Scrum or Kanban) assume that requirements are emergent and cannot be fully specified upfront. They rely on short iterations and continuous user checkpoints.

### 1.2 Mathematical Decision Model for Lifecycle Selection
To choose the appropriate lifecycle model, engineering organizations evaluate project parameters. Let:
- $R$ be requirements stability (measured from $0.0$ to $1.0$, where $1.0$ is completely static).
- $K$ be technical complexity and architectural uncertainty ($0.0$ to $1.0$, where $1.0$ indicates completely novel architecture).
- $T$ be the team's familiarity with the technology stack ($0.0$ to $1.0$, where $1.0$ is highly expert).
- $V$ be the required market velocity and frequency of delivery ($0.0$ to $1.0$, where $1.0$ is continuous deployment).

The Lifecycle Choice Index ($LC$) is formulated as:
$$LC = w_1 \cdot R - w_2 \cdot K + w_3 \cdot T - w_4 \cdot V$$

Where $w_i$ are weight coefficients. If $LC \gg 0$, a predictive or sequential model is optimal. If $LC \ll 0$, an adaptive, agile model is mandatory to mitigate technical and requirements volatility.

### 1.3 Phase Gates: Entry and Exit Criteria
A fundamental SWEBOK-aligned process control is the enforcement of **Phase Gates**. No lifecycle phase may begin or end without satisfying objective, verifiable criteria:
- **Entry Criteria**: The prerequisites that must be satisfied before starting a phase (e.g., "Detailed Design cannot start until the Software Requirements Specification is signed off and the Interface Control Documents are drafted").
- **Exit Criteria**: The quality and completion gates that must be satisfied before a phase is declared complete (e.g., "Construction is complete only when the code compiles with zero warnings, unit test coverage exceeds $90\%$, and a peer walkthrough has verified compliance with clean code rules").

### 1.4 Monorepo Lifecycles and Release Train Management
In a monorepo containing multiple packages, lifecycle models can be configured independently per package. A legacy core database package may follow a disciplined, incremental lifecycle with extensive regression testing gates, while a user-facing web template package follows a rapid, agile release train. Release engineering must coordinate these independent lifecycles through automated versioning, package isolation, and shared integration gates.

### 1.5 The Spiral Model and Risk-Driven Lifecycles
Coined by Barry Boehm, the Spiral Model organizes development as a series of evolutionary cycles. Each loop of the spiral is divided into four distinct quadrants:
1. **Determine Objectives**: Identify target features, constraints, and alternative approaches.
2. **Evaluate Alternatives and Resolve Risks**: Perform cost-benefit analyses, build prototypes, and run key experiments to isolate technical uncertainties.
3. **Develop and Test**: Construct the code increment and run unit and integration tests.
4. **Plan Next Iteration**: Review progress with stakeholders and prepare for the next cycle.

The spiral model is driven entirely by risk: iterations are structured to resolve the highest-exposure risks first before major capital is committed to construction.

### 1.6 Hybrid Lifecycle Models
Modern enterprise software architectures frequently adopt hybrid models. In a hybrid setup, database and API layers follow a disciplined, sequential V-Model lifecycle to prevent costly breaking modifications, while frontend components follow an adaptive Scrum or Kanban lifecycle. This balances stability with delivery speed.

## 2. Standard Operating Procedures (SOP)
The agent must execute software lifecycle practices according to the following step-by-step procedures:

### Step 2.1: Evaluate Project Parameters and Justify the SLCM
At the initiation of a new repository or package:
- Assess requirements stability, complexity, and technology familiarity.
- Apply the lifecycle choice evaluation to select the appropriate model (Predictive, Iterative, or Adaptive).
- Document the lifecycle choice and its justification in the project's architectural plan.

### Step 2.2: Define Phase Gate Criteria
Document the entry and exit criteria for each development phase. A typical SWEBOK-aligned construction gate structure is:
- **Construction Entry**: Finalized task list (`task.md`), approved implementation plan (`implementation_plan.md`), and verified interface types.
- **Construction Exit**: $100\%$ code compilation, clean linter and static scans, unit tests passing with target coverage, and completed walkthrough (`walkthrough.md`).

### Step 2.3: Execute Construction Phase Gates
Before completing any engineering task:
- Verify that the code compiles cleanly.
- Run typecheck and lint checks using the token-saving workspace prefix:
```bash
rtk pnpm --filter @ethang/agents-build lint
```
- Run the unit test suite to confirm zero regressions:
```bash
rtk pnpm --filter @ethang/agents-build test
```

### Step 2.4: Execute Validation and User Checkpoint Gates
Prior to release or merging:
- Present the working code, design changes, and verification test results to the user.
- Wait for explicit user approval, satisfying the mandatory validation checkpoint.

### Step 2.5: Document Lifecycle Transitions in Walkthrough
For every completed sprint or lifecycle phase:
- Record phase transition metrics, gate verification logs, and release versions in the active `walkthrough.md` file.

### Step 2.6: Conduct Post-Phase Retrospectives
Upon completing a major release or phase exit, run a retrospective to evaluate process metrics (defect escape rates, velocity drag) and update the project checklists.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following software lifecycle rules:

- [ ] **Lifecycle Model Selected**: Did the agent document and justify the selected lifecycle model?
- [ ] **Entry Criteria Verified**: Were all construction phase entry criteria satisfied before coding began?
- [ ] **Exit Criteria Satisfied**: Were all compilation, linting, and testing gates met before declaring construction complete?
- [ ] **User Checkpoint Passed**: Did the agent obtain explicit user validation before finalizing the lifecycle phase?
- [ ] **Vitest Mock Hoisting Checked**: Are all mocked classes imported rather than declared in the test file scope?
- [ ] **Index Signature Bracket Access**: Are properties on index-signature objects accessed via bracket notation (`obj["prop"]`)?
- [ ] **No Native Dates**: Are lifecycle schedules, milestones, and release windows managed strictly using Luxon?
- [ ] **Void Assertions Wrapped**: Are unit test cases for lifecycle managers wrapped in `expect(() => ...).not.toThrow()`?
- [ ] **Tuple Typing Explicit**: Are tuples in Vitest `it.each` tables explicitly typed to prevent resolution mismatches?
- [ ] **No Destructive Reverts**: Were phase reverts executed via targeted `git restore` on modified files, preserving user changes?
- [ ] **Forbidden Words Scanned**: Has the rule been checked to ensure no forbidden workspace vocabulary or platforms are referenced?
- [ ] **Size Bounds Confirmed**: Is the final compiled markdown file size strictly between 10,000 and 11,800 characters?
- [ ] **Escaped Backticks**: Are all code blocks and backticks inside the rule template properly escaped?
- [ ] **Verification Command Run**: Did the agent execute compile, test, and lint validations using the `rtk` command prefix?
- [ ] **Walkthrough Updated**: Are lifecycle gate logs, test coverage reports, and release versions documented in `walkthrough.md`?
- [ ] **No Explicit Return Types**: Do TS functions rely on type inference rather than declaring explicit return types unless strictly necessary?
- [ ] **Acyclic Dependency Checked**: Was the package dependency tree checked to ensure no circular references were introduced?
- [ ] **Release Train Documented**: If part of a monorepo release train, did the agent verify version alignment across workspace packages?
- [ ] **WBS Tasks Documented**: Are all phase gate tasks and sub-tasks tracked under active entries in `task.md`?
- [ ] **Regression Risks Evaluated**: Were regression risks evaluated using impact analysis prior to starting the coding phase?
- [ ] **Spiral model Quadrants Respected**: Were all four quadrants of the Spiral Model executed during iterative cycles?
- [ ] **Hybrid Boundaries Defined**: Were V-Model versus Agile boundaries clearly identified in multi-tier changes?
