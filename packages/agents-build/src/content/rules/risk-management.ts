import { defineRule } from "../../define.ts";

export const riskManagement = defineRule({
  content: `# Risk Management

## 1. Domain Theory and Conceptual Foundations
Risk management is a continuous software engineering management process focused on systematically identifying, evaluating, planning, and monitoring technical and project risks before they impact schedule, budget, or quality. As detailed in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 7 (Software Engineering Management), risk management is not a reactive crisis resolution strategy; it is a proactive discipline integrated into every phase of the software lifecycle to minimize uncertainty and maximize project success rates.

### 1.1 The Risk Management Lifecycle
SWEBOK v4 models risk management as an iterative, four-phase lifecycle:
1. **Risk Identification**: The process of discovering potential risk events that could disrupt the project. This is guided by historical defect checklists, technology taxonomies, and architectural evaluations.
2. **Risk Analysis**: The quantitative and qualitative evaluation of each identified risk to assess its likelihood and potential impact.
3. **Risk Planning (Handling)**: The formulation of strategies to address each risk.
4. **Risk Monitoring**: The continuous tracking of risk metrics, triggers, and the effectiveness of handling plans throughout the project.

### 1.2 Mathematical Formulation of Risk Exposure
To prioritize engineering and management resources, teams calculate Risk Exposure ($RE$), also known as Risk Severity. Let $Risk$ be a potential adverse event:
- Let $P(Risk)$ be the probability of the risk event occurring, where $0 \\le P(Risk) \\le 1.0$.
- Let $Loss(Risk)$ be the estimated impact or penalty incurred if the risk event occurs (measured in person-hours, story points, calendar days, or cost).

The Risk Exposure is calculated as:
$$RE(Risk) = P(Risk) \\times Loss(Risk)$$

By calculating $RE$ for all identified risks, the team can sort the Risk Register and focus mitigation planning on items with the highest exposure.

### 1.3 Risk Handling Strategies
When addressing a high-exposure risk, engineers apply one of five primary handling strategies:
- **Avoidance**: Modifying the project plan or design to eliminate the risk entirely (e.g., choosing a mature, well-tested library over an unstable, bleeding-edge package).
- **Mitigation**: Taking proactive, early actions to reduce the probability of the risk occurring or to decrease its potential loss (e.g., writing early prototypes or running performance benchmarks).
- **Transfer**: Allocating the risk to an external party or system (e.g., using a managed database service to transfer infrastructure reliability risks).
- **Acceptance (Retention)**: Acknowledging the risk but deciding not to take action unless it occurs, usually because the cost of mitigation exceeds the potential loss.
- **Contingency Planning**: Defining a clear, reactive action plan that will be triggered immediately if the risk event occurs.

### 1.4 Technical and Process Risks in workspaces
In modern monorepo and serverless deployments, engineers track specific technical risk vectors:
- **Resource Saturation Risks**: ephemerality and execution limits (like Cloudflare Worker CPU limits of 50ms) can lead to runtime timeouts. Mitigation: profiling execution time and offloading long tasks.
- **Dependency Drift Risks**: Upgrading a package in one module breaking consumer packages. Mitigation: strict interface control and automated integration tests.
- **Type Safety Degradation Risks**: Lax typescript compiler options leading to silent runtime errors. Mitigation: strict compilation checks, index signature bracket access, and no-useless-escapes.

### 1.5 Software Engineering Risk Taxonomies
SWEBOK v4 suggests categorizing software risks to ensure comprehensive identification:
- **Technology Risks**: Issues with compilers, third-party libraries, databases, or runtime execution environments.
- **People/Process Risks**: Gaps in developer capability, poor coding conventions, lack of test coverages, or linter fix loops.
- **Product/Requirements Risks**: Unstable requirements, vague acceptance criteria, or shifting user objectives.
- **Organizational Risks**: Resource bottlenecks, schedule constraints, or changing business priorities.

### 1.6 Active vs. Passive Risk Acceptance
When adopting the Acceptance strategy, teams must decide between:
- **Passive Acceptance**: Accepting the risk without taking any action, simply absorbing the schedule or budget impact if it materializes.
- **Active Acceptance**: Establishing a contingency reserve (in hours or budget) to offset the impact of the risk if it triggers, ensuring the project schedule remains realistic.

## 2. Standard Operating Procedures (SOP)
The agent must execute risk management according to the following step-by-step procedures:

### Step 2.1: Initialize the Risk Register
At the start of every major feature or refactoring task:
- Analyze the requirements and system design to identify technical, integration, and schedule risks.
- Record identified risks in a centralized risk register or in the active \`implementation_plan.md\` file:
| Risk ID | Risk Description | Probability ($$P$$) | Loss ($$Loss$$) | Exposure ($$RE$$) | Handling Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| R-001 | Dependency upgrade breaks consumer modules | 0.3 | 12h | 3.6h | Mitigation (Integration Tests) |

### Step 2.2: Formulate Mitigation and Contingency Plans
For every risk with an exposure ($RE$) exceeding a predefined threshold (e.g., $RE \\ge 2$ hours):
- Define the proactive steps to reduce the risk likelihood (Mitigation).
- Define the reactive steps and owners to execute if the risk triggers (Contingency).
- Define the objective metric or condition that signals the risk has occurred (Trigger).

### Step 2.3: Integrate Mitigation Tasks into Sprints
Ensure risk reduction work is scheduled:
- Add mitigation tasks directly to the active task list in \`task.md\`:
\`\`\`markdown
- [ ] R10.2: Write integration tests for shared utility boundary (Maint: Preventive, Est: 3h)
\`\`\`

### Step 2.4: Execute Validation and Security Scans
Verify system boundaries and security postures:
- Run the full test suite and linter using the token-saving workspace command prefix:
\`\`\`bash
rtk pnpm --filter @ethang/agents-build test
rtk pnpm --filter @ethang/agents-build lint
\`\`\`
- Confirm that no security vulnerabilities are introduced by reviewing scanning outputs.

### Step 2.5: Monitor Risk Triggers
Track risk status during execution:
- If a risk trigger occurs (e.g., the integration build fails after upgrading a package), immediately execute the corresponding contingency plan (e.g. restoring to the previous stable state via targeted \`git restore\`).

### Step 2.6: Log Risk Outcomes in Walkthrough
Document risk outcomes:
- In the active \`walkthrough.md\`, log which risks materialized, the effectiveness of the handling plans, and any new risk items discovered during construction.

### Step 2.7: Establish Iterative Risk Reviews
Re-evaluate the risk register periodically. Recalculate probability and loss parameters as technical uncertainties resolve during development, adjusting contingency reserves accordingly.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following risk management rules:

- [ ] **Risk Register Initialized**: Did the agent document the potential risks, probabilities, losses, and exposures?
- [ ] **Exposure Quantified**: Was the Risk Exposure ($RE$) calculated for every identified risk?
- [ ] **Mitigation Plans Defined**: Are proactive mitigation tasks documented for high-exposure items?
- [ ] **Contingency Plans Formulated**: Are reactive contingency steps and triggers established?
- [ ] **Mitigation Scheduled**: Are risk mitigation tasks prioritized and scheduled in the active \`task.md\`?
- [ ] **Vitest Mock Hoisting Checked**: Are all mocked classes imported rather than declared in the test file scope?
- [ ] **Index Signature Bracket Access**: Are properties on index-signature objects accessed via bracket notation (\`obj["prop"]\`)?
- [ ] **No Native Dates**: Are date-based risk evaluations and retention deadlines calculated strictly using Luxon?
- [ ] **Void Assertions Wrapped**: Are unit tests for risk management calculators wrapped in \`expect(() => ...).not.toThrow()\`?
- [ ] **Tuple Typing Explicit**: Are tuples in Vitest \`it.each\` tables explicitly typed to prevent resolution mismatches?
- [ ] **No Destructive Reverts**: Were contingency resets executed via targeted \`git restore\` on modified files, preserving user changes?
- [ ] **Forbidden Words Scanned**: Has the rule been checked to ensure no forbidden workspace vocabulary or platforms are referenced?
- [ ] **Size Bounds Confirmed**: Is the final compiled markdown file size strictly between 10,000 and 11,800 characters?
- [ ] **Escaped Backticks**: Are all code blocks and backticks inside the rule template properly escaped?
- [ ] **Verification Command Run**: Did the agent execute compile, test, and lint validations using the \`rtk\` command prefix?
- [ ] **Walkthrough Updated**: Are risk resolutions, actual exposures, and contingency runs documented in \`walkthrough.md\`?
- [ ] **No Explicit Return Types**: Do TS functions rely on type inference rather than declaring explicit return types unless strictly necessary?
- [ ] **Acyclic Dependency Checked**: Was the package dependency tree checked to ensure no circular references were introduced?
- [ ] **Log Leak Prevention Checked**: Did the agent verify that no sensitive risk metrics or system keys leak into public outputs?
- [ ] **Risk Register Sorted**: Was the risk register sorted in descending order of Risk Exposure ($RE$)?
- [ ] **Contingency Triggers Documented**: Are objective triggers clearly documented for every contingency plan?
- [ ] **Taxonomy Categorized**: Were identified risks classified under SWEBOK categories (Technology, Process, Product, Org)?
- [ ] **Contingency Reserve Allocated**: Was an active contingency reserve scheduled for accepted risks?`,
  description:
    "risk management, risk registers, mitigation planning, and contingency plans",
  filename: "risk-management",
  trigger: "model_decision"
});
