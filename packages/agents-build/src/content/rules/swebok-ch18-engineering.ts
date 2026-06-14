import { defineRule } from "../../define.ts";

export const swebokCh18Engineering = defineRule({
  content: `# Engineering Foundations (SWEBOK v4, Chapter 18)

> Scope: cross-cutting engineering skills supporting every other KA — decision process, abstraction, empirical methods, statistical analysis, measurement theory, GQM, and root cause analysis. Canonical theory owner for RCA (5-Whys), GQM, and measurement-scale rules.

## When to Apply

- Defect/regression task: run RCA to find the real problem before coding.
- Designing a metric/gate: derive via GQM; never measure for curiosity.
- Computing a statistic: classify the measurement scale to confirm the operation is valid.
- Making engineering decisions: run the 6-step decision process.
- Running experiments: pre-state the hypothesis and choose the study type.

## Key Definitions

| Term | Definition |
|---|---|
| Engineering process | Iterative 6-step decide-and-monitor loop common to all engineering |
| Wicked problem | Problem you can only define by (partly) solving it; solve once to define, again to fix |
| Designed experiment | Manipulates independent variables to test a pre-stated hypothesis |
| Measurement scale | Nominal, ordinal, interval, or ratio — determines valid operations |
| GQM | Goal-Question-Metric: every metric must trace to a goal and support a decision |
| RCA | Identifying underlying (not symptomatic) causes to prevent recurrence |

## Engineering Decision Process (6 steps)

1. **Understand the real problem**: Stated problem is often a symptom; use RCA.
2. **Define selection criteria**: Identify all criteria (cost, regulatory, quality) up front.
3. **Identify feasible solutions**: Enumerate alternatives; prototype to verify.
4. **Evaluate alternatives**: Score every feasible option against the same criteria.
5. **Select preferred alternative**: Record the rationale for high-consequence decisions.
6. **Monitor performance**: Compare actual to predicted; revisit alternatives if needed.

## Root Cause Analysis — Method Selection

| Method | Direction | Use when | Skip when |
|---|---|---|---|
| **5-Whys** | Backward | Single linear causal chain; fast defect triage | Multiple interacting causes |
| **Change analysis** | Backward | Recent regression; similar baseline exists | No good comparison case exists |
| **Fishbone** | Backward | Several candidate causes across categories | You need AND/OR logic between causes |
| **Fault tree (FTA)** | Backward | Safety/reliability-critical; need AND/OR logic | Simple defect triage (overkill) |
| **FMEA** | Forward | Proactively finding failure modes | Reacting to an outcome that happened |

Prefer 5-Whys for one chain; switch to fishbone/FTA when causes branch; use FTA when AND-vs-OR matters.

## 5-Whys Procedure

Ask "why" iteratively until the root cause is reached:
\`\`\`
Symptom -> Why 1 -> Why 2 -> Why 3 -> Root cause
\`\`\`

**Stopping criteria — stop when the answer is:**
- Within the team's control to fix.
- More than a restatement of the symptom.
- Specific enough to point to a file / logic path / process.
- Removing it plausibly prevents recurrence.

Stop and switch to fishbone/FTA if a "why" branches. "Typically 5" is a guideline, not a rule.

## Root-Cause-Based Improvement

1. **Select the problem**: Prioritize via Pareto (80/20) or frequency-severity.
2. **Gather evidence**: Collect logs, repros, and tests.
3. **Identify root cause** using 5-Whys, fishbone, or FTA.
4. **Select corrective action** that prevents recurrence with lowest cost.
5. **Implement** the corrective action.
6. **Observe** it to confirm effectiveness.

## GQM — Metric Derivation

Metrics exist only to support a **decision**. Derive top-down:
1. **Goal**: State business/quality goal (e.g., "reduce escaped defects").
2. **Question**: What must we know to judge progress? ("Are defects caught before release?")
3. **Metric**: What measurement answers that? (escaped-defect rate per release).
4. **Decision**: Tie to a decision (e.g., gate release). If no decision uses it, do not collect it.

| Metric | Decision supported |
|---|---|
| Test coverage % | Merge gate: is the suite adequate? |
| Defect density | Release-readiness decision |
| Build failure rate | Process-improvement trigger |
| MTTR | Operations SLA decisions |

## Measurement Scales — Valid Operations

The result scale can be **no higher than the most primitive scale** in the manipulation.

| Scale | Valid operations | Valid statistics | Examples |
|---|---|---|---|
| **Nominal** | =, ≠, count | Mode, frequency | Job title, defect category |
| **Ordinal** | + ordering (>, <) | Median, percentile (no mean/SD) | Severity, CMMI levels |
| **Interval** | + add, subtract | Mean, SD, correlation (no ratios) | Temp (°C/°F), calendar dates |
| **Ratio** | + multiply, divide | All statistics | Defect count, money, duration, Kelvin |

**Hard rules:**
- Never compute mean or SD of ordinal data — use the **median** (e.g. severity).
- Never form a ratio on interval data — 0 is arbitrary, not absence.
- Catch invalid arithmetic (e.g. averaging severity codes) in code review.
- Use non-numeric labels (e.g., initial, repeatable) for ordinal values to prevent accidental arithmetic.

### Direct vs Derived & Reliability/Validity

- **Direct measure**: Single count/observation (e.g. number of defects).
- **Derived measure**: Combination of direct measures (e.g. defect density).
- **Reliability**: Consistency on repeated measurements (quantified via SD/mean; smaller is more reliable).
- **Validity**: Degree to which it measures what it intends to.

## Empirical Methods & Statistics

| Study type | Description | Best for |
|---|---|---|
| **Designed experiment** | Manipulate independent variables; tests pre-stated hypothesis | Cause-effect |
| **Observational study** | Observe in real-world context without manipulation | How/why questions |
| **Retrospective study** | Analyze archived historical data | Trends and prediction |

**Hypothesis testing**: H₀ = no change, H₁ = effect. Reject H₀ only if the statistic falls in the critical region.
- **Type I error (α)**: Rejecting H₀ when it is true (false positive). Limit to ≤5%.
- **Type II error (β)**: Accepting H₀ when it is false (false negative).
- **Power (1 - β)**: Probability of correctly rejecting H₀. Pre-specify sample size to maximize power.
- **Correlation ≠ causation**: Correlation measures linear association; regression measures relationship strength.

## Abstraction, Models & Wicked Problems

- Work at one abstraction level at a time, connected by standard interfaces (APIs).
- Models can be **iconic** (looks like it), **analogic** (behaves like it), or **symbolic** (equations/UML).
- Software design is a **wicked problem**: expect to solve it once to understand it, then again to fix it.

## Decision Checklist

### Must Do
- Run the 6-step decision process for significant choices; include a do-nothing alternative.
- Run RCA and reach a root cause meeting all stopping criteria before fixing a bug.
- Choose RCA method by problem shape (linear -> 5-Whys; branching -> fishbone; AND/OR -> FTA).
- Classify the measurement scale before any statistic; use median (not mean) on ordinal data.
- Derive metrics top-down via GQM and link each to a decision.
- Pre-state the hypothesis and sample size before running an experiment.

### Must Not Do
- Do not fix the stated symptom without finding the underlying root cause.
- Do not compute mean/SD on ordinal data or ratios on interval data.
- Do not collect a metric that supports no decision.
- Do not treat correlation as causation.

## Anti-Patterns

| Anti-pattern | Consequence |
|---|---|
| Fixing symptom, skipping RCA | Root cause persists; defect recurs |
| 5-Whys on multi-cause problem | Tunnel-visions one chain, misses contributing causes |
| Averaging ordinal data | Statistically invalid; arithmetic distance is undefined |
| Vanity metrics | Wasted effort; real signal buried |
| Post-hoc hypothesis | Inflates false-positive rate |
| Skipping do-nothing alternative | Misses cases where no action is best |
`,
  description:
    "Engineering Foundations: empirical methods, root cause analysis, and measurement",
  filename: "swebok-ch18-engineering",
  trigger: "model_decision"
});
