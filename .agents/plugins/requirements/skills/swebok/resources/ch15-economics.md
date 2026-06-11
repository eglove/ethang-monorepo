# Software Engineering Economics (SWEBOK v4, Chapter 15)

> Applies to all SDLC decisions involving cost, scope, architecture, build-vs-buy, refactor-vs-redevelop, and estimation. Engineering economics is the science of choice — not merely the science of money.

## When to Apply

- Selecting between architectural alternatives or third-party libraries
- Build-vs-buy or refactor-vs-redevelop decisions
- Scoping features against budget/schedule constraints
- Estimating project size, cost, or schedule
- Justifying technical debt payoff with a business case
- Evaluating cloud provider or deployment options with cost trade-offs

---

## Key Definitions

| Term | Definition |
|---|---|
| **Proposal** | Single, binary course of action (do it or don't) |
| **Cash Flow Stream** | All money in/out over time caused by carrying out a proposal |
| **Time-Value of Money** | Same amount of money has different value at different times |
| **Equivalence** | Two cash flows are comparable only when expressed in the same time frame |
| **Basis for Comparison** | Shared reference frame: Present Worth, Future Worth, Annual Equivalent, IRR, Discounted Payback Period |
| **MARR** | Minimum Acceptable Rate of Return — lowest IRR the organization considers a good investment; represents opportunity cost |
| **Sunk Cost** | Past, unrecoverable expenditure — must NOT influence forward decisions |
| **Opportunity Cost** | Value of the alternative foregone when one alternative is chosen |
| **TCO** | Total Cost of Ownership — acquire + activate + operate + maintain + retire |
| **Economic Life** | Point where total cost (frozen assets + operating/maintenance) is minimized |
| **Planning Horizon** | Consistent time frame over which all proposals in a decision are evaluated |
| **SPLC** | Software Product Life Cycle — conceive, build, operate, maintain, retire |
| **SDLC** | Software Development Life Cycle — the initial build phase within the SPLC |
| **Productivity** | Output value ÷ input resources; largest lever = reduce rework (rework often exceeds all other project costs combined) |

---

## Engineering Decision-Making Process

Steps are iterative and may overlap — do not skip any step.

| Step | Key Action | Gate / Pitfall |
|---|---|---|
| 1. Understand the Real Problem | Use 5 Whys or Design Thinking Empathize | Stated problem ≠ real problem |
| 2. Define Selection Criteria | List financial + non-financial (irreducibles) criteria | Too few → underdifferentiates; too many → unwieldy |
| 3. Identify All Feasible Solutions | Brainstorm; use prototyping for technical feasibility | Best solution must be a candidate to be selected |
| 4. Evaluate Each Alternative | Same basis for comparison, same planning horizon, same cost categories for ALL alternatives | Shorter horizon makes that proposal appear artificially better |
| 5. Select the Preferred Alternative | Single criterion → highest IRR/PW; multiple criteria → compensatory or non-compensatory technique | High uncertainty → ranges, sensitivity analysis, delay decision |
| 6. Monitor Performance | Compare estimates to actuals | Without this step, estimation quality never improves |

**High-consequence decisions:** define decision management strategy (roles, procedures, tools); identify relevant stakeholders (ISO 12207 / ISO 15288).

---

## Decision Technique Selection

| Context | Technique | Accept When |
|---|---|---|
| For-profit | IRR, Present Worth, Future Worth | IRR ≥ MARR |
| Nonprofit / Government | Benefit-Cost Analysis | Benefit-Cost Ratio ≥ 1.0 |
| Nonprofit / Government | Cost-Effectiveness Analysis | Fixed-cost: maximize benefit; Fixed-effectiveness: minimize cost |
| Present Economy (no time-value) | Break-Even Analysis | Use level exceeds break-even point for preferred option |
| Present Economy (no time-value) | Optimization Analysis | Find variable value that minimizes total cost |
| Replacement (legacy vs. redevelop) | For-profit process + sunk cost exclusion + salvage value | Exclude all sunk costs; consider lock-in and exit costs |
| Retirement | For-profit process + lock-in analysis | Consider technology dependency and high exit costs |

**Multiple-attribute selection — choose technique category first:**

| Category | Techniques | When |
|---|---|---|
| Compensatory (single figure of merit) | Additive weighting, AHP, Gilb Impact Estimation, SEI ATAM | Trade-offs allowed between criteria |
| Non-compensatory (criteria kept separate) | Dominance, satisficing, lexicography | No trade-offs allowed; each criterion is a hard filter |

**Under uncertainty / risk — at step 5 when estimates are imprecise:**

| Condition | Techniques |
|---|---|
| Probabilities assignable to outcomes | Expected value, Monte Carlo, decision trees, expected value of perfect information |
| Probabilities not assignable | Laplace Rule, Maximin, Maximax, Hurwicz, Minimax Regret |

---

## Estimation Technique Selection

Use **multiple techniques** for high-consequence decisions — convergence builds confidence; divergence signals overlooked factors.

| Technique | Accuracy | Steps / When to Use | Key Limitation |
|---|---|---|---|
| **Expert Judgment** | Lowest | Always available; feed into Wide Band Delphi or Planning Poker for group estimates | Subjective; no documented rationale |
| **Analogy** | Low-medium | (1) Understand thing to estimate; (2) find analogy with known actuals; (3) list differences; (4) estimate magnitude of each difference; (5) build estimate from analogy + adjustments | Requires an appropriate analogy with accurate historical data |
| **Decomposition** (Bottom-up) | Medium | (1) Break into smallest estimable pieces; (2) estimate each; (3) sum; (4) add cross-cutting allowances (requirements, testing, integration, docs) | High effort; systematic bias does NOT cancel — overestimates do not reliably offset underestimates |
| **Parametric** (Statistical) | Highest (when validated) | Count observable factors → plug into validated equation | Requires significant historical data to develop and validate the model |
| **Multiple Estimates** | Depends | Different techniques, possibly different estimators; look for convergence/divergence | Only adds value if techniques are independent; adds cost |

**Code of Ethics §3.09:** Provide realistic quantitative estimates WITH an uncertainty assessment for every project.

---

## TCO Components (Build-vs-Buy)

Always use TCO — never initial cost alone. SPLC operate/maintain/retire phases consume **more total effort** than the SDLC.

| Phase | Typical Cost Items |
|---|---|
| Acquisition | License fees, development cost, integration work |
| Activation | Configuration, data migration, training |
| Operations | Hosting, support, monitoring, security patching |
| Maintenance | Upgrades, bug fixes, new features, vendor lock-in mitigation |
| Retirement | Migration cost, data extraction, decommissioning |

---

## Decision Checklist

### Must Do
- **Document the estimation technique** — single gut-feel numbers are insufficient
- **Use TCO** for all build-vs-buy decisions — include operate, maintain, and retire costs
- **Use multiple estimation techniques** when decision consequences are significant
- **Close the loop**: compare estimates to actuals after completion to improve future estimates
- **Apply all 6 decision-making steps** — never skip "Understand the real problem"
- **Evaluate at least 2 alternatives** against explicit criteria for any significant architectural decision
- **Identify sunk costs explicitly** and exclude them from forward-looking analysis
- **Use the same planning horizon** for all alternatives being compared
- Every metric collected must support a **specific, identified decision**

### Must Not Do
- Do not base decisions on sunk cost ("we already spent 3 months on this approach")
- Do not use single-point estimates without uncertainty ranges for high-consequence decisions
- Do not assess build-vs-buy using only initial development/license cost
- Do not add scope without tracing it to a specific business goal
- Do not collect metrics that drive no decision ("measurement for the merely curious")
- Do not compare proposals over different planning horizons

---

## Anti-Patterns

| Anti-Pattern | Consequence |
|---|---|
| Sunk-cost reasoning | Continuing bad investments because of past spending |
| Single-technique, single-estimator estimation | Systematically biased estimates with no cross-check |
| TCO excludes post-release costs | Systematically underestimates true cost; wrong build-vs-buy decisions |
| Mismatched planning horizons | Shorter-horizon proposal appears artificially cheaper |
| Scope added without traceability | Gold-plating; uncontrolled schedule and budget growth |
| Vanity metrics | Measurement effort wasted on data no one acts on |
| Skipping "Understand the real problem" | Solving the wrong problem optimally |
| Not monitoring selected alternative | Estimation quality never improves; same mistakes repeat |
| Build-vs-buy decided without SPLC cost view | Lock-in and retirement costs discovered too late |

---

## Standards Referenced

- ISO/IEC/IEEE 12207:2017 — Software life cycle processes (decision management strategy)
- ISO/IEC/IEEE 15288:2023 — System life cycle processes (replacement/retirement decisions)
- Software Engineering Code of Ethics §3.09 — realistic estimates with uncertainty assessment
