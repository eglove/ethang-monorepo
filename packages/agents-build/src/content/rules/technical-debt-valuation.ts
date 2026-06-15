import { defineRule } from "../../define.ts";

export const technicalDebtValuation = defineRule({
  content: `# Technical Debt Valuation

## 1. Domain Theory and Conceptual Foundations
Technical debt is a central concept in software engineering management and software maintenance. First coined by Ward Cunningham, the metaphor describes the long-term consequences of choosing a quick, suboptimal design or implementation workaround (borrowing capital) over a well-architected, extensible solution. As detailed in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 12 (Software Maintenance) and Chapter 7 (Software Engineering Management), technical debt represents the accrued cost of additional rework that will be required in the future if the suboptimal implementation remains.

### 1.1 The Financial Metaphor: Principal and Interest
Technical debt is quantitatively modeled using two components:
- **Principal ($$P$$)**: The estimated development effort (measured in person-hours or story points) required to refactor the suboptimal code to meet target quality standards. Paying the principal means refactoring the code.
- **Interest ($$I$$)**: The ongoing operational overhead, increased bug rate, and development velocity drag imposed by the suboptimal code on subsequent feature implementations. Interest is paid continuously in the form of extra time spent working around poor designs or debugging regression faults.

### 1.2 Mathematical Valuation and Cost-Benefit Analysis (CBA)
To make rational business decisions regarding when to pay off technical debt, engineering managers calculate the Return on Investment ($$ROI$$) of refactoring:
- Let $P$ be the principal (refactoring cost).
- Let $I_y$ be the annual interest cost (extra hours spent per year due to the debt).
- Let $L$ be the remaining expected lifespan of the software package in years.

The total cost of keeping the debt is:
$$Cost_{\\text{debt}} = I_y \\times L$$

Refactoring is financially viable and has a positive $ROI$ if the cost of paying the principal is less than the cumulative interest over the software's lifespan:
$$P < I_y \\times L$$

The $ROI$ of refactoring is formulated as:
$$ROI = \\frac{(I_y \\times L) - P}{P} \\times 100\\%$$

If the $ROI$ is highly positive, refactoring must be scheduled immediately. If the software is nearing retirement ($L \\approx 0$), it is more economical to carry the debt than to pay the principal.

### 1.3 Martin's Technical Debt Quadrant
Technical debt is categorized based on intent and foresight:
1. **Reckless and Deliberate**: Writing messy code because "we don't have time for design." This represents poor engineering discipline.
2. **Prudent and Deliberate**: Intentionally taking a shortcut to meet a critical market release deadline, while planning to refactor it immediately afterward.
3. **Reckless and Inadvertent**: Producing poor code due to ignorance of design patterns or coding standards.
4. **Prudent and Inadvertent**: Discovering a better design approach only after implementing the current system, learning through the development process.

### 1.4 Software Entropy and Systemic Decay
If technical debt is left unmanaged, the system experiences "software entropy"—a state of increasing disorder where even simple features become risky and expensive to implement. SWEBOK v4 notes that keeping a **Technical Debt Register** (a catalog of known shortcuts, legacy packages, and test gaps) is essential for preventing entropy from making a system unmaintainable.

### 1.5 The Technical Debt Velocity Model
To understand why carrying interest on technical debt is dangerous, teams model developer velocity decay over time. As cumulative technical debt $TD(t)$ grows, the actual team velocity $V(t)$ decreases exponentially:
$$V(t) = V_0 \\cdot e^{-\\alpha \\cdot TD(t)}$$
Where:
- $V_0$ is the baseline velocity of a clean codebase.
- $\\alpha$ is the drag coefficient representing the level of coupling and dependency complexity in the codebase.
- $TD(t)$ is the total accumulated technical debt at time $t$.

This mathematical model explains the common industry phenomenon where software teams slow down to a crawl as codebases age, proving that investing in preventive maintenance and paying off the principal is a prerequisite for maintaining long-term development speed.

### 1.6 Monorepo-Specific Technical Debt Containment
In large-scale monorepos, technical debt in one package can easily leak and affect adjacent packages. SWEBOK-aligned monorepos employ strict containment rules to isolate debt:
- **Dependency Boundaries**: Enforcing strict import boundaries using static analyzers. A package must not import internal files of another package directly; it must consume it only through its public API exports.
- **Independent Versioning**: Allowing packages within the monorepo to be versioned independently. This prevents "dependency lock," where upgrading a library in one package forces a breaking upgrade across the entire repository.
- **Quality Gates Per Package**: Configuring independent lint and test criteria. A legacy package carrying technical debt should not block developer velocity in clean, newly authored packages.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures to value and manage technical debt:

### Step 2.1: Identify and Audit Technical Debt Items
Conduct codebase scans to discover shortcuts or compromises:
- Locate TODOs, deprecated method calls, or un-refactored files.
- Inspect static analysis reports (such as SonarCloud issue logs) to find code duplication, high complexity, and coverage gaps.

### Step 2.2: Log Debt in the Technical Debt Register
For every identified debt item, create a record capturing:
- A unique identifier and description of the workaround.
- The location of the code (file path and line numbers).
- The category (deliberate or inadvertent).

### Step 2.3: Estimate the Principal
Evaluate the cost of the fix:
- Outline the refactoring steps required to bring the code to standard.
- Estimate the person-hours or story points ($P$) needed to write the refactored code and update the test suite.

### Step 2.4: Estimate the Interest and Velocity Drag
Analyze the ongoing impact of the debt:
- Estimate the frequency with which developers modify or interact with the debt-laden module.
- Compute the annual interest ($I_y$) in hours based on extra debugging cycles and workaround code overhead.

### Step 2.5: Calculate the ROI
Compute the cost-benefit metric:
- Estimate the remaining lifespan ($L$) of the package.
- Apply the $ROI$ formula to evaluate if the refactoring has a positive payoff.

### Step 2.6: Prioritize and Schedule Refactoring Cycles
Sort the Technical Debt Register:
- Prioritize items with high positive $ROI$ and high interest (which cause the most drag).
- Include high-priority refactoring tasks in the active sprint backlog or task lists:
\`\`\`markdown
- [ ] R8.1: Refactor database client to eliminate content coupling (Maint Type: Preventive, Principal: 4h)
\`\`\`

### Step 2.7: Execute the Refactoring and Verify Payoff
Write the clean code using perfective maintenance disciplines:
- Run the full regression test suite to ensure no functional behavior is altered:
\`\`\`bash
rtk pnpm test
rtk pnpm lint
\`\`\`
- Update the Technical Debt Register, marking the item as resolved, and log the verified improvements.

### Step 2.8: Monitor Technical Debt Metrics
After refactoring is complete:
- Inspect static code metrics (e.g. cyclomatic complexity, Halstead volume) to verify that the maintainability index has improved.
- Check that the velocity drag has decreased and that the refactored code passes all lint and compiler checks.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria regarding technical debt valuation:

- [ ] **Shortcut Identified**: Did the agent explicitly identify and document any workaround or code shortcut introduced?
- [ ] **Logged in Register**: Is the workaround recorded in the project's technical debt register or \`walkthrough.md\`?
- [ ] **Principal Estimated**: Did the agent estimate the effort ($P$) required to implement the target solution?
- [ ] **Interest Estimated**: Was the velocity drag or failure risk ($I_y$) of carrying the debt evaluated?
- [ ] **ROI Computed**: Is a quantitative ROI or cost-benefit analysis documented for refactoring candidates?
- [ ] **Quadrant Classified**: Was the debt classified according to Martin's Technical Debt Quadrant?
- [ ] **Backlog Sync**: Are high-drag debt items scheduled in the active \`task.md\` under perfective/preventive tasks?
- [ ] **Regression Testing Boundary Run**: Did the agent execute tests before and after refactoring to ensure zero regressions?
- [ ] **Typecheck and Lint Clean**: Did the refactored code compile and lint with zero warning-level issues?
- [ ] **No Destructive Reverts**: Were code reverts done via targeted \`git restore\` rather than destructive resets?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content escaped to prevent string termination?
- [ ] **Walkthrough Record Completed**: Does \`walkthrough.md\` record the refactoring verification logs and metrics?
- [ ] **Index Signature Safety**: Do technical debt audit scripts use bracket notation to access properties on index-signature objects?
- [ ] **Sonar Assertions wrapped**: Do test cases verifying that a void method executes without issues wrap the call in \`expect(() => ...).not.toThrow()\`?
- [ ] **Explicit Member Access**: Are all methods and properties on refactoring helper classes declared with explicit accessibility modifiers?
- [ ] **Task List Sync**: Are all technical debt assessments, principal estimates, and sprint integrations tracked in \`task.md\`?`,
  description:
    "technical debt cost valuation, documenting workarounds, and refactoring cycles",
  filename: "technical-debt-valuation",
  trigger: "model_decision"
});
