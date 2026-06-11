# Engineering Foundations (SWEBOK v4, Chapter 18)

> Scope: the cross-cutting engineering skills that support every other KA — the engineering decision process, abstraction, empirical methods, statistical analysis, measurement theory, GQM, and root cause analysis. This chapter is the canonical theory owner for RCA method selection and the 5-Whys procedure (referenced by the rca-five-whys skill), the GQM metric-derivation chain, and the measurement-scale rules that constrain which statistics are valid.

## When to Apply

- A bug/defect/regression task: pick an RCA method and run it to find the real problem before coding a fix.
- Designing a metric, coverage gate, or pipeline measurement — derive it via GQM, never measure for curiosity.
- Computing a statistic (mean, median, ratio) over data — first classify the measurement scale to confirm the operation is valid.
- Making a significant engineering decision among options — run the 6-step decision process.
- Running an experiment / A-B comparison — choose designed vs observational vs retrospective and pre-state the hypothesis.

## Key Definitions

| Term | Definition |
|---|---|
| Engineering process | Iterative 6-step decide-and-monitor loop common to all engineering |
| Wicked problem | A problem you can only define by (partly) solving it; solve once to define, again to fix |
| Designed experiment | Manipulates independent variables to test a pre-stated hypothesis for cause-effect |
| Random variable | Real-number outcome of an experiment; discrete (countable) or continuous |
| Measurement scale | Nominal / ordinal / interval / ratio — determines which operations are valid |
| Direct vs derived measure | Direct = single count/observation; derived = combination of direct measures |
| GQM | Goal-Question-Metric: every metric must trace to a goal and support a decision |
| Root cause analysis (RCA) | Class of methods identifying underlying (not symptomatic) causes to prevent recurrence |

## Engineering Decision Process (6 steps)

Iterative — knowledge gained at any step may force re-iteration of an earlier one.

1. **Understand the real problem** — the stated problem is often not the real one; use RCA to find the underlying need.
2. **Define the selection criteria** — identify ALL relevant criteria (financial, regulatory, strategic, quality) up front.
3. **Identify all reasonable, technically feasible solutions** — the best solution is rarely the first idea; enumerate alternatives, prototype to verify feasibility.
4. **Evaluate each alternative against the criteria** — score every feasible option on the same criteria.
5. **Select the preferred alternative** — the one that best satisfies the criteria; record the rationale for high-consequence decisions.
6. **Monitor the performance of the selection** — estimates can be wrong; compare actual to predicted and revisit alternatives if needed.

## Root Cause Analysis — Method Selection

RCA finds why/how an undesirable outcome happened so the cause (not the symptom) is removed. Pick the method by problem shape:

| Method | Direction | Use when | Skip when |
|---|---|---|---|
| **5-Whys** | Backward | Single linear causal chain; fast triage of one defect | Multiple interacting causes — it tunnel-visions on one chain |
| **Change analysis** | Backward | A similar case went well; suspect a recent change/regression — root cause lives in the difference | No good comparison case exists |
| **Cause-and-effect (Ishikawa/fishbone)** | Backward | Several candidate causes across categories (people, process, tools, materials, measurements, environment) | You need AND/OR logic between causes |
| **Fault tree analysis (FTA)** | Backward | Safety/reliability-critical; must distinguish "any one cause" (OR) from "combination required" (AND) | Lightweight single-defect triage (overkill) |
| **FMEA** | Forward | Proactively enumerate how components can fail before failure occurs | Reacting to an outcome that already happened |
| **Cause map / current reality tree** | Both | Need evidence-backed, logic-bound rigor and forward links to org goals | Quick fix; rigor cost not justified |

Selection rules: prefer 5-Whys for one clear chain; switch to fishbone/FTA the moment causes branch; use FTA (not fishbone) when AND-vs-OR between causes changes the fix; use forward FMEA only proactively.

## Full 5-Whys Procedure

Start from the reported symptom and ask "why" iteratively until the root cause is reached:

```
Symptom: {what the user reported}
Why 1:   {immediate cause}
Why 2:   {cause of that cause}
Why 3:   {deeper cause}
...
Root cause: {the thing to actually fix}
```

**Stopping criteria — stop when the answer is ALL of:**
- Within the team's/codebase's control to fix.
- More than a restatement of the symptom ("the code is wrong" is not a root cause).
- Specific enough to point to a file / function / logic path / missing process.
- Removing it plausibly prevents recurrence (not just this instance).

If a "why" branches into multiple independent causes, stop 5-Whys and switch to fishbone or FTA. "Typically 5" is a guideline, not a rule — stop at the criteria, whether that is 3 or 7.

## Root-Cause-Based Improvement (the wrapping loop)

5-Whys identifies a cause; this 6-step loop acts on it:

1. **Select the problem** — prioritize via Pareto (80/20) or frequency-severity; define the problem and its significance.
2. **Gather evidence** about the problem and its causes (logs, repro, history, tests).
3. **Identify the root cause** with one or more techniques above.
4. **Select corrective action(s)** that prevent recurrence, are controllable, meet goals, and create no new problems — greatest control for least cost.
5. **Implement** the corrective action.
6. **Observe** it to confirm efficiency and effectiveness.

## GQM — Metric Derivation Steps

A measurement exists only to support a **decision**. Derive top-down, never bottom-up:

1. **Goal** — state a business/quality goal (e.g., "reduce escaped defects").
2. **Question** — what must we know to judge progress toward the goal? ("Are defects caught before release?")
3. **Metric** — what measurement answers that question? (escaped-defect rate per release).
4. **Tie to a decision** — name the decision the metric drives (gate release / trigger process change). If no decision uses it, do not collect it.

Anti-pattern: "measurement for the merely curious" — metrics gathered because they are easy/interesting, supporting no decision. They waste effort and bury real signals.

| Metric | Decision it supports |
|---|---|
| Test coverage % | Merge gate: is the suite adequate? |
| Defect density (defects/KLOC) | Release-readiness decision |
| Build failure rate | Process-improvement trigger |
| MTTR | Operations SLA decisions |

## Measurement Scales — Which Statistics Are Valid

Classify the scale BEFORE any statistic. Rule: the result scale can be **no higher than the most primitive scale** in the manipulation.

| Scale | Valid operations | Valid statistics | Examples |
|---|---|---|---|
| **Nominal** | =, ≠, count | Mode, frequency | Job title, SDLC model, defect category |
| **Ordinal** | + ordering (>, <) | + **median**, percentile (NOT mean/SD) | Severity (critical/major/minor), CMMI levels, race place |
| **Interval** | + add, subtract | + mean, SD, correlation, regression (NOT ratios) | °C / °F, calendar dates |
| **Ratio** | + multiply, divide | All statistics | Defect count, money, length, Kelvin, time |

**Hard rules:**
- Never compute a mean or SD of ordinal data — use the **median** (e.g., "average CMMI level = 1.763" is invalid). Median needs only ordering, not arithmetic distance.
- Never form a ratio on interval data — 0 is arbitrary, not absence ("30°C is not twice as hot as 15°C").
- Programming languages enforce NONE of this — int/float behave as ratio scales and silently allow invalid arithmetic on ordinal codes (severity 1/2/3). Catch it in code review.
- Use non-numeric labels (initial/repeatable/defined/managed/optimizing) for ordinal values to block accidental arithmetic.

### Direct vs derived & reliability/validity

| Concept | Definition | Notes |
|---|---|---|
| Direct measure | Single count/observation | Number of defects found |
| Derived measure | Combination of direct measures per a defined method | Defect density; avg repair hours/defect |
| Reliability | Consistent results on repeated measurement | Quantify via variation index = SD/mean (smaller = more reliable); assess via test-retest, split-halves |
| Validity | Measures what it intends to | Construct, criteria, content validity |

## Empirical Methods & Statistics

| Study type | Description | Best for |
|---|---|---|
| **Designed experiment** | Manipulate independent variables; requires a clear pre-stated hypothesis | Establishing cause-effect |
| **Observational / case study** | Observe in real-world context without manipulation; includes context | How/why questions; behavior can't be controlled |
| **Retrospective study** | Analyze archived historical data | Trends/prediction; limited by data quality |

**Hypothesis testing:** H₀ = no change, H₁ = effect (one- or two-sided). Reject H₀ only if the statistic falls in the critical region.

| Decision vs reality | H₀ true | H₀ false |
|---|---|---|
| Accept H₀ | Correct | Type II error (β) |
| Reject H₀ | Type I error (α) | Correct (power = 1 − β) |

Maximize power (1 − β) while holding α ≤ 5%; pre-specify hypothesis, sample size, and α before collecting data. **Correlation ≠ causation** — the correlation coefficient ([−1, +1]) measures linear association only; regression's R² ([0, 1]) measures relationship strength, not cause.

## Abstraction, Models & Wicked Problems

- Work at one abstraction level at a time, connected by standard interfaces (APIs).
- Three model types: **iconic** (looks like it — scale model), **analogic** (behaves like it — wind-tunnel model/simulation), **symbolic** (equations — F = ma, UML).
- Alternate abstractions (class + state + sequence diagram) complement, not nest — keep them in sync.
- Software design is a **wicked problem**: expect to solve it once to understand it, then again to fix it — iteration is the nature of design, not failure.

## Decision Checklist

**Must Do**
- Run the 6-step decision process for any significant choice; always include a do-nothing alternative.
- For a bug task, run RCA and reach a root cause meeting all stopping criteria before writing the fix.
- Pick the RCA method by problem shape (one chain → 5-Whys; branching → fishbone; AND/OR matters → FTA).
- Classify the measurement scale before any statistic; use median (not mean) on ordinal data.
- Derive metrics top-down via GQM and name the decision each one drives.
- Pre-state the hypothesis, sample size, and α before running an experiment.

**Must Not Do**
- Do not fix the stated symptom without confirming the underlying root cause.
- Do not compute mean/SD on ordinal data or ratios on interval data.
- Do not collect a metric that supports no decision ("merely curious").
- Do not treat correlation as causation.
- Do not form a hypothesis post-hoc from data already seen (cherry-picking).

## Anti-Patterns

| Anti-pattern | Why it fails |
|---|---|
| Fixing the symptom, skipping RCA | Root cause persists; defect recurs |
| 5-Whys on a multi-cause problem | Tunnel-visions one chain, misses contributing causes (use fishbone/FTA) |
| Averaging ordinal data (avg CMMI/severity) | Statistically invalid; arithmetic distance is undefined |
| Ratio on interval data ("twice as hot") | 0 is arbitrary, not absence |
| Treating correlation as causation | Wrong intervention chosen |
| Vanity metrics with no linked decision | Wasted effort; real signal buried |
| Post-hoc hypothesis from collected data | Inflates false-positive rate; not science |
| Skipping the do-nothing alternative | Misses cases where no action is best |
| Not monitoring after selection | Bad estimates never corrected; no learning loop |

## Standards Referenced

| Standard | Purpose |
|---|---|
| ISO/IEC/IEEE 24765:2017 | Systems and Software Engineering — Vocabulary |
| DOE-NE-STD-1004-92 | Root Cause Analysis Guidance Document |
