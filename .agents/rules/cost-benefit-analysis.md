---
description: cost-benefit analysis, buy vs build, ROI evaluation, and technical debt valuation
trigger: model_decision
---

# Cost-Benefit Analysis

## 1. Domain Theory and Conceptual Foundations
Cost-Benefit Analysis (CBA) is a systematic, quantitative process used to evaluate the economic feasibility, return on investment (ROI), and long-term trade-offs of engineering decisions. As detailed in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 12 (Software Engineering Economics) and Chapter 13 (Software Engineering Management), software decisions must not be made solely on technical elegance. Instead, they must be justified by evaluating their lifecycle costs, risks, and alignment with business objectives.

### 1.1 Time Value of Money and Financial Metrics
A fundamental concept in software economics is the time value of money—the principle that a dollar today is worth more than a dollar in the future. To evaluate multi-year projects, engineers utilize several key financial metrics:

1. **Net Present Value (NPV)**: Sums the present value of all cash flows (benefits $B_t$ and costs $C_t$) over $n$ time periods, discounted at rate $r$:
$$NPV = \sum_{t=0}^{n} \frac{B_t - C_t}{(1 + r)^t}$$
A positive NPV indicates that the project is financially viable.

2. **Return on Investment (ROI)**: A ratio of the net benefits to the total costs, expressed as a percentage:
$$ROI = \frac{\text{Total Benefits} - \text{Total Costs}}{\text{Total Costs}} \times 100\%$$

3. **Payback Period**: The amount of time required to recover the initial investment costs. Shorter payback periods represent lower financial risk.

4. **Internal Rate of Return (IRR)**: The discount rate at which the NPV of all cash flows equals zero. A higher IRR makes a project more attractive.

### 1.2 Buy vs. Build Analysis and Weighted Utility Matrices
When acquiring new capabilities, organizations face a choice between building custom software or buying commercial off-the-shelf (COTS) software.
- **Building Custom Solutions**: Offers maximum control, customizability, and integration flexibility. However, it incurs high upfront development costs, long delivery timelines, and permanent maintenance overhead. SWEBOK notes that maintenance typically represents $60\%$ to $80\%$ of a custom application's total lifecycle cost.
- **Buying COTS / SaaS**: Minimizes time-to-market and upfront development costs, transferring maintenance responsibility to the vendor. However, it introduces licensing fees, vendor lock-in risks, and potential integration difficulties.

To evaluate these choices objectively, engineers construct a weighted utility matrix where technical, business, and financial criteria are scored and multiplied by their importance weight:
$$\text{Weighted Score} = \sum_{i=1}^{m} w_i \times S_i$$
where $w_i$ is the weight of criterion $i$ (summing to $1.0$) and $S_i$ is the option's score for that criterion.

### 1.3 Technical Debt Valuation
Technical debt represents the future cost of choosing an easy, short-term solution over a better, long-term approach. It is valued using two components:
- **Principal**: The cost to refactor the suboptimal code to meet high standards (e.g. the developer hours required to rewrite a module).
- **Interest**: The ongoing extra effort required to maintain, test, and develop features around the suboptimal code.
$$\text{Total Cost of Debt} = \text{Principal} + \sum_{t=1}^{n} \text{Interest}_t$$

If the interest paid over time exceeds the principal required to resolve the debt, refactoring is economically justified.

### 1.4 Software Cost Estimation and COCOMO II
To input accurate values into a CBA, engineers must estimate development effort. The Constructive Cost Model (COCOMO II) is a standard parametric model used for this purpose:
$$\text{Effort} = A \times (\text{Size})^B \times \prod_{i=1}^{17} M_i$$
Where:
- $\text{Effort}$ is measured in Person-Months (PM).
- $A$ is a constant multiplier (typically $2.94$).
- $\text{Size}$ is measured in KSLOC (Thousands of Source Lines of Code) or Function Points.
- $B$ is a scaling exponent representing system scale economies (typically between $1.01$ and $1.26$). If $B > 1.0$, the project exhibits diseconomies of scale due to integration and communication overhead.
- $M_i$ are 17 effort multipliers (cost drivers) such as product reliability, database size, complexity, and developer experience.

### 1.5 Opportunity Cost and Cost of Delay (CoD)
- **Opportunity Cost**: The loss of potential gain from other alternatives when one alternative is chosen. For example, if two senior developers spend three months building an internal feature, the opportunity cost is the value of the revenue-generating customer features they could have built instead.
- **Cost of Delay (CoD)**: The financial impact of delaying a product release or architectural improvement. It is calculated as the weekly or monthly revenue or cost savings lost by not having the feature live:
$$\text{CoD} = \text{Value per Time Unit} \times \text{Delay Duration}$$

## 2. Standard Operating Procedures (SOP)
The agent must execute cost-benefit and buy-vs-build evaluations according to the following procedures:

### Step 2.1: Enforce the CBA Calculations for Large Architectural Migrations
For example, when migrating from a self-hosted database to a managed cloud database:
1. **Estimate Upfront Costs (Year 0)**:
   - Migration development effort (e.g. 80 hours at $75/hour = $6,000).
   - Integration and testing effort (e.g. 40 hours = $3,000).
2. **Estimate Operational Costs (Years 1-3)**:
   - Self-hosted database: compute hosting, storage, and database administrator maintenance time (e.g., $500/month hosting + 10 hours/month maintenance = $15,000/year).
   - Managed cloud database: managed fee + compute + storage (e.g., $800/month = $9,600/year).
3. **Calculate the ROI**:
   - Total Cost of Self-Hosted database over 3 years: $45,000.
   - Total Cost of Managed database over 3 years: $9,000 (upfront) + $28,800 (operational) = $37,800.
   - Net Benefit: $45,000 - $37,800 = $7,200.
   - $ROI = \frac{$7,200}{$37,800} \times 100\% \approx 19.0\%$.
   - Document this quantitative breakdown in the implementation plan.

### Step 2.2: Perform a Buy vs. Build Assessment
When choosing between a custom implementation and an external dependency:
- Construct a decision matrix comparing:
  - Custom Build: Upfront effort, ongoing maintenance, opportunity cost of developer time.
  - Buy/SaaS: License cost, configuration time, vendor support, risk of vendor deprecation.
- If the external library is open-source (OSS), verify its license compliance using:
```bash
rtk pnpm audit
```

### Step 2.3: Calculate Technical Debt Interest
Prior to scheduling refactoring tasks:
- Estimate the principal: hours required to complete the refactoring.
- Estimate the interest: hours lost per sprint due to bugs, slow builds, or complex code pathing.
- Document this comparison in the implementation plan to justify the refactoring work.

### Step 2.4: Document the Economic Justification
- Create or update the [implementation_plan.md](file:///C:/Users/glove/.gemini/antigravity/brain/22cf77fe-0f6e-4156-adcf-97f72484c4fa/implementation_plan.md) with a "Cost-Benefit Analysis" section.
- Summarize the NPV, ROI, and payback period calculations.
- Present the findings to the user for formal approval before writing code.

### Step 2.5: Verify Code Performance to Ensure Cost Targets
After implementation:
- Run verification suites to ensure no performance degradation (which would increase operational hosting costs):
```bash
rtk pnpm --filter @ethang/agents-build build
rtk pnpm --filter @ethang/agents-build test
rtk pnpm --filter @ethang/agents-build lint
```

## 3. Agent Compliance Checklist
The agent must verify compliance with the following cost-benefit analysis rules:

- [ ] **CBA Documented in Plan**: Did the agent include a quantitative cost-benefit summary for the proposed change?
- [ ] **Buy vs Build Matrix Created**: Was a formal buy-vs-build matrix written for new library integrations?
- [ ] **NPV and ROI Calculated**: Are the financial returns calculated using standard discounting formulas?
- [ ] **Maintenance Overhead Factored**: Did the cost estimation include long-term maintenance costs ($60\%$-$80\%$ of lifecycle)?
- [ ] **Open-Source License Audited**: Was the license of any external library validated to ensure zero legal cost risk?
- [ ] **Principal and Interest Estimated**: Did the agent calculate both components of technical debt before refactoring?
- [ ] **Opportunity Costs Analyzed**: Was the value of developer time redirected from other features included in the cost?
- [ ] **Hosting/Compute Costs Included**: Are cloud operational expenses and database costs modeled?
- [ ] **No Forbidden Terminology**: Has the rule been scanned to ensure no banned words are present?
- [ ] **No Native Dates Used**: Are timeline schedules and payback intervals computed using Luxon (`DateTime`)?
- [ ] **Size Bounds Confirmed**: Is the compiled markdown file size strictly between 10,000 and 11,800 characters?
- [ ] **Escaped Backticks**: Are all code blocks and backticks inside the rule template properly escaped?
- [ ] **Verification Command Run**: Did the agent run verification (build, test, lint) using the `rtk` command prefix?
- [ ] **Walkthrough Updated**: Are cost justifications, benchmark logs, and build results documented in `walkthrough.md`?
- [ ] **Index Signature Bracket Access**: Are dynamic properties on index-signature objects accessed via bracket notation?
- [ ] **Void Assertions Wrapped**: Are unit test cases verifying lack of exceptions wrapped in `expect(() => ...).not.toThrow()`?
- [ ] **Arrow Functions Enforced**: Are all function declarations defined as arrow functions?
- [ ] **Tuple Typing Explicit**: Are tuples in Vitest `it.each` tables explicitly typed to prevent compiler resolution mismatches?
- [ ] **Transition Costs Factored**: Were costs to migrate existing databases or legacy APIs accounted for in the CBA?
- [ ] **Risk Contingency Allocated**: Is a buffer percentage (e.g. $20\%$) added to estimation schedules to account for unknowns?
- [ ] **User Feedback Obtained**: Did the agent pause for explicit user confirmation on the CBA before starting work?
