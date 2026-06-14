---
description: effort estimation, COCOMO, function points, and historical calibration
trigger: model_decision
---

# Effort Estimation

## 1. Domain Theory and Conceptual Foundations
Effort estimation is the software engineering process of predicting the development effort (person-hours or story points), calendar schedule, and resource costs required to build or modify a software system. As detailed in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 7 (Software Engineering Management), estimation is a critical management activity. It provides the empirical baseline necessary for project planning, feasibility analysis, resource allocation, and commitments to stakeholders. 

Estimation is not a static event; it is an iterative activity that must be calibrated continuously as requirements evolve and more information about the system becomes available.

### 1.1 Estimation Methodologies
SWEBOK v4 categorizes estimation techniques into three main families:
- **Judgmental Estimation (Expert Opinion)**: Relies on the experience and technical intuition of one or more senior engineers. To reduce individual bias, teams employ structured group consensus techniques such as the **Wideband Delphi** method or Planning Poker, where estimates are shared anonymously, discussed, and converged over multiple rounds.
- **Analogy-Based Estimation**: Compares the proposed task against historical records of completed tasks with similar architectural designs, complexities, and team structures. This relies on an organization maintaining a historical database of actual development metrics.
- **Parametric and Algorithmic Models**: Uses mathematical formulas to calculate effort based on size and complexity parameters.

### 1.2 The Constructive Cost Model (COCOMO II)
The most widely researched algorithmic model is the Constructive Cost Model (COCOMO), developed by Barry Boehm. The basic formula models effort ($E$) in person-months as a function of software size:
$$E = a \cdot (KLOC)^b \cdot EAF$$

Where:
- $KLOC$ is the estimated thousands of lines of source code.
- $a$ and $b$ are scaling coefficients determined by the project mode (Organic, Semidetached, or Embedded), reflecting the complexity, regulatory constraints, and execution context.
- $EAF$ is the Effort Adjustment Factor, calculated as the product of cost drivers (e.g., product reliability requirements, database size, developer capability, and tool usage).

The development time ($D$) in calendar months is then derived from the effort:
$$D = c \cdot E^d$$

Where $c$ and $d$ are constants defined by the project mode.

### 1.3 Function Point Analysis (FPA)
To avoid the vulnerability of estimating lines of code before construction, teams use Function Point Analysis (FPA) to measure functional size. FPA calculates Unadjusted Function Points ($UFP$) by enumerating and weighting five components:
1. **External Inputs (EI)**: Screen inputs, file transfers, or API payloads that write or modify data.
2. **External Outputs (EO)**: Reports, data exports, or payloads sent to downstream systems.
3. **External Inquiries (EQ)**: Read-only query actions that retrieve data without side effects.
4. **Internal Logical Files (ILF)**: Shared databases or state-store tables maintained by the application.
5. **External Interface Files (EIF)**: Databases or schemas referenced but not owned by the application.

Functional size ($FS$) in Function Points is formulated as:
$$FS = UFP \cdot ValueAdjustmentFactor$$

### 1.4 Work Breakdown Structure (WBS)
For task-level engineering, developers build a Work Breakdown Structure (WBS). The WBS decomposes the high-level goal into hierarchical, independent work packages. Bottom-up estimation is then conducted on the leaf nodes:
$$Effort_{\text{total}} = \sum_{i=1}^{n} Effort(WBS_i) + RiskContingency$$

A common failure is omitting testing overhead, code inspections, and environment setup times from the individual $WBS_i$ packages.

### 1.5 The Cone of Uncertainty
The Cone of Uncertainty describes the evolution of estimation accuracy over the software lifecycle. At the project's inception (before requirements are defined), estimates can vary by a factor of 4x (ranging from $0.25\times$ to $4.0\times$ the actual effort). As requirements are clarified and design representations are completed, the variance narrows:
$$Variance(t) \to 1.0 \text{ as } t \to \text{Release}$$

Estimates must be treated as ranges that narrow as the project moves down the cone.

### 1.6 Absolute vs. Relative Sizing Units
Engineering teams distinguish between absolute sizing (person-hours, days) and relative sizing (story points). Relative sizing using the Fibonacci sequence ($1, 2, 3, 5, 8, 13, 21$) abstracts developer velocity. It focuses solely on three vectors: the complexity of the code, the effort required, and the inherent technical risks.

## 2. Standard Operating Procedures (SOP)
The agent must execute effort estimation according to the following step-by-step procedures:

### Step 2.1: Decompose the Task into a WBS
Before committing to an estimate:
- Break down the feature or bug fix into component-level work packages.
- Ensure no individual work package exceeds 8 hours of development time. If a package is larger, decompose it further.

### Step 2.2: Perform Historical Calibration
Evaluate the proposed work packages against past performance:
- Search the repository history to locate similar commits or features.
- Compare estimated time against the actual time logged for those historical changes.

### Step 2.3: Compute Effort with Three-Point Estimating
To account for uncertainty, calculate a three-point estimate for each WBS item:
- **Optimistic Estimate ($$o$$)**: The effort required if everything goes perfectly.
- **Most Likely Estimate ($$m$$)**: The realistic effort under ordinary conditions.
- **Pessimistic Estimate ($$p$$)**: The effort required if major technical risks materialize.

The expected effort ($E_{t}$) and variance ($V_{t}$) are formulated using beta-distribution formulas (PERT):
$$E_{t} = \frac{o + 4m + p}{6}$$
$$V_{t} = \left(\frac{p - o}{6}\right)^2$$

### Step 2.4: Integrate Risk and Quality Gates
Add overhead multipliers:
- Add a $20\%$ multiplier to cover peer reviews, manual checkpoints, and testing cycles.
- If the task involves modifying shared interface contracts or database schemas, add a $1.25\times$ complexity multiplier.
- Verify that testing and verification execution commands are incorporated in the task lists:
```bash
rtk pnpm --filter @ethang/agents-build test
```

### Step 2.5: Document Estimates in Task Lists
Record the estimates in the active `task.md` file:
- Break down items clearly, associating estimates with each task:
```markdown
- [ ] R10.1: Implement database column migration (Maint: Adaptive, Est: 4h)
```

### Step 2.6: Monitor Actuals and Refine Estimates
Track execution:
- If a task exceeds its estimated expected effort ($E_{t}$) by more than $30\%$, pause execution, document the variance root cause in `walkthrough.md`, and update the remaining task estimates.

### Step 2.7: Calibrate Along the Cone of Uncertainty
Re-evaluate estimates at key milestones. As specifications are clarified and early unit tests are implemented, update the pessimistic bounds in the active task register.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following effort estimation rules:

- [ ] **WBS Decomposed**: Did the agent break down the task into hierarchical work packages under 8 hours each?
- [ ] **Three-Point Estimating Applied**: Were optimistic, pessimistic, and most likely values documented?
- [ ] **PERT Effort Calculated**: Was the expected effort ($E_{t}$) calculated using the beta-distribution formula?
- [ ] **Risk Multiplier Added**: Were complexity multipliers applied for shared interface or database modifications?
- [ ] **Historical Calibration Documented**: Did the agent reference past tasks or commits to calibrate estimates?
- [ ] **Testing Overhead Factored**: Was a 20% quality gate overhead added to the overall estimate?
- [ ] **No Native Dates**: Are project schedules, target dates, and calendar timezones parsed using Luxon?
- [ ] **Index Signature Safety**: Do resource allocation parsers access properties on index-signature objects via bracket notation?
- [ ] **Void Assertions Wrapped**: Are unit tests for estimation helpers wrapped in `expect(() => ...).not.toThrow()`?
- [ ] **Tuple Typing Explicit**: Are tuples in Vitest `it.each` tables explicitly typed to prevent resolution mismatches?
- [ ] **No Destructive Reverts**: Were code reverts restricted to targeted `git restore` on modified files, preserving user changes?
- [ ] **Forbidden Words Scanned**: Has the rule been checked to ensure no forbidden workspace vocabulary or platforms are referenced?
- [ ] **Size Bounds Confirmed**: Is the final compiled markdown file size strictly between 10,000 and 11,800 characters?
- [ ] **Escaped Backticks**: Are all code blocks and backticks inside the rule template properly escaped?
- [ ] **Verification Command Run**: Did the agent execute compile, test, and lint validations using the `rtk` command prefix?
- [ ] **Walkthrough Updated**: Are estimation assumptions, PERT calculations, and actual time logs documented in `walkthrough.md`?
- [ ] **Task List Integrated**: Are all estimates tracked under active entries in `task.md`?
- [ ] **No Explicit Return Types**: Do TS functions rely on type inference rather than declaring explicit return types unless strictly necessary?
- [ ] **Acyclic Dependency Checked**: Was the package dependency tree checked to ensure no circular references were introduced?
- [ ] **Variance Logged**: If actual hours deviated from estimates, was a 5-Whys root cause analysis logged in the walkthrough?
- [ ] **Relative Sizing Documented**: Were complex epics estimated using story points before decomposing into hourly sub-tasks?
- [ ] **Cone Calibration Completed**: Were estimates re-calibrated as the development progressed down the Cone of Uncertainty?
