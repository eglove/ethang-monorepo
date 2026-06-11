export const ch09Management = {
  content: `# Software Engineering Management (SWEBOK v4, Chapter 9)

> SEM = planning, estimating, measuring, controlling, coordinating, leading, and managing risk to deliver software efficiently, effectively, and to stakeholders' benefit. Operates at three levels: organizational/infrastructure management, project management, and measurement program management. Principle: management without measurement = lack of discipline; measurement without management = lack of purpose.

## When to Apply

| Trigger | Action |
|---|---|
| Starting a project or iteration | Initiation + scope definition; feasibility; SDLC selection |
| Planning a sprint or release | Estimation, RACI, risk register update, quality thresholds |
| Mid-project deviation detected | Variance analysis, control process, risk re-assessment |
| Third-party library or supplier onboarded | Acquisition checklist; supply-chain risk controls |
| Project / phase / iteration ends | Closure checklist; retrospective; measurement database update |
| Setting up a measurement program | ISO 15939 four-step procedure |

## Key Definitions

| Term | Definition |
|---|---|
| SEM | Collection of work activities for planning, estimating, measuring, controlling, and managing risk factors for a software project |
| Management | System of processes and controls required to achieve strategic objectives |
| Measurement | Assignment of values/labels to work products, processes, and resources, plus derived models |
| Risk | Effect of uncertainty on objectives — negative (threats) or positive (opportunities) |
| Uncertainty | Lack of information; distinct from risk |
| Risk register | Living document used as risk management tool; repository for all identified risks and supporting data |
| RACI | Responsible (produces), Accountable (checks), Consulted (advises), Informed (kept updated) |
| WBS | Work breakdown structure — organizes tasks; does NOT itself include cost/schedule baselines |
| DevSecOps | Culture + process that aligns Dev/Sec/Ops; automates security at all SDLC phases |
| Variance analysis | Determination of deviation of actual from expected outcomes: cost, schedule, quality |

## SDLC Selection Matrix

| Dimension | Predictive (e.g., waterfall) | Adaptive (e.g., Agile/Scrum) |
|---|---|---|
| Requirements handling | Fully specified upfront | Progressive, emergent |
| Planning emphasis | Detailed up-front scope/cost/schedule | Monitor/control processes; requirements traceability |
| Risk/cost reduction | Detailed plans based on known architecture | Progressive evolution of initial plans |
| Stakeholder involvement | Planned milestones | Continuous |
| Management style | Formal, top-down | Leadership + team collaboration |
| When to choose | Known architecture, stable requirements, regulatory constraints | Rapidly changing requirements, innovation, user-driven product |

## Estimation Procedure

Use multiple techniques and reconcile before committing:

| Step | Action |
|---|---|
| 1 | Collect historical size/effort data from past similar projects |
| 2 | Apply a **calibrated parametric model** using size and historical data (most defensible) |
| 3 | Apply **bottom-up decomposition** — estimates from those who will do the work |
| 4 | Map task dependencies; identify parallel vs. sequential tasks (Gantt chart) |
| 5 | Translate resource requirements (people, tools) into cost estimates |
| 6 | Reconcile differences between techniques; negotiate with stakeholders |
| 7 | Document agreed effort, schedule, and cost with RACI assignments |

Estimation is **iterative** — revisit as requirements evolve. In adaptive SDLCs, derive number of cycles from overall effort/schedule constraint or initial requirements understanding.

## Risk Management Procedure

| Step | Action |
|---|---|
| 1. Identify | List risk factors; consider software-unique risks (scope creep, intangible nature, safety/security) |
| 2. Analyze | Assess probability and potential impact per risk; use expert judgment, historical data, decision trees, simulations |
| 3. Prioritize | Rank by probability × impact |
| 4. Mitigate | Develop strategies to reduce probability and minimize negative impact |
| 5. Record | Enter all risks in a **risk register** |
| 6. Revisit | Review at periodic intervals throughout the SDLC — not only at project start |
| 7. Close | Document abandonment conditions with stakeholders; revisit at each planning cycle |

Risk assessment methods: expert judgment, historical data, decision trees, process simulations, Monte Carlo simulation.

## Software Acquisition Checklist

| Acquisition type | Key controls |
|---|---|
| COTS | License terms; completeness, correctness, consistency with architecture |
| Custom (contracted) | Scope of work; quality requirements in agreement; milestone/delivery penalties |
| Open source | License restrictions; support/maintenance; security vulnerability review |
| SaaS | Cloud hosting terms; data ownership; integration verification |
| Customer-loaned | Integration verification; simulation accuracy |
| **Any third-party library** | Risk + legality + suitability assessment BEFORE integration; technical/procedural controls to filter external repository access (supply-chain security) |

After acquisition: integrate, verify integration correctness against design + requirements, validate intended purpose in intended environment.

## Measurement Program — ISO/IEC/IEEE 15939 Four Steps

### Step 1: Establish Commitment
- Identify organizational objectives driving measurement (e.g., first-to-market, defect reduction)
- Define scope: project, site, or enterprise; consider temporal scope for time-series calibration
- Formally commit resources: funding, training, tools, analyst/librarian roles

### Step 2: Plan the Measurement Process
- Characterize organizational unit (domain, technology, interfaces, structure)
- Identify information needs from goals, constraints, risks, problems — prioritize and document
- Select measures with clear links to information needs; criteria: cost of collection, process disruption, data accuracy ease, analysis/reporting ease
- Define collection, storage, analysis, and reporting procedures; include data configuration management
- Select evaluation criteria based on technical and business objectives
- Get stakeholder review and approval of the measurement plan

### Step 3: Perform the Measurement Process
- Integrate measurement procedures into the software processes they measure
- Collect, verify, and store data; automate via SEM tools where possible
- Aggregate/transform data using rigor appropriate to information needs
- Analyze to produce graphs/numbers/indicators; present conclusions to stakeholders
- Communicate results; data providers and users review for accuracy and actionability

### Step 4: Evaluate Measurement
- Evaluate information products and process against specified criteria
- Use internal review or external audit; gather feedback from measurement users
- Identify potential improvements (format, units, classification)
- Document cost/benefit of improvements; communicate proposed changes to measurement owner
- Record lessons learned

## Decision Checklist

### Must Do
- [ ] Select SDLC model before planning; document rationale against selection criteria
- [ ] Use at least two estimation techniques; reconcile before committing to schedule
- [ ] Create a risk register at project inception; review at every planning cycle
- [ ] Assign RACI to all deliverables
- [ ] Define measurable quality thresholds (not just quality attributes) for each stakeholder requirement
- [ ] Assess risk, legality, and suitability of every third-party library before integration
- [ ] Integrate measurement procedures into the processes they measure (not as a separate audit)
- [ ] Perform variance analysis at each milestone (cost, schedule, quality metrics)
- [ ] Archive project materials and update measurement database at closure
- [ ] Conduct retrospective at every project/phase/iteration closure; record lessons learned

### Must Not Do
- [ ] Never use a single estimation technique or single estimator without reconciliation
- [ ] Never treat risk management as a one-time kickoff activity
- [ ] Never add scope without traceability to a requirement and impact analysis
- [ ] Never collect metrics that map to no actionable decision
- [ ] Never skip supply-chain controls for third-party library/dependency acquisition

## Anti-Patterns

| Anti-Pattern | Consequence | Fix |
|---|---|---|
| Single-point estimation | No uncertainty range; missed commitments | Use 2+ techniques; report range |
| Risk register never updated after kickoff | Emerging risks unmanaged | Review at each planning cycle |
| Scope added without traceability | Budget/schedule overrun; untested code | Require change order + impact analysis |
| Metrics collected with no decision owner | Waste; "measurement theater" | Map each metric to a named decision before collecting |
| Security/quality as final gate | Defects discovered late; expensive rework | Shift left via DevSecOps automated testing |
| Skipping retrospective | Teams repeat same mistakes | Mandate closure retrospective; archive outputs |
| Unfiltered external library access | Supply-chain vulnerabilities | Technical/procedural controls on repository access |

## Standards Referenced

- ISO/IEC/IEEE 15939 — Measurement process standard
- PMBOK® Guide 6th ed. — 10 project management KAs
- IEEE Standard 2675-2021 — DevOps/DevSecOps
`,
  path: "resources/ch09-management.md",
  title: "Software Engineering Management",
  triggers: [
    "estimation",
    "risk-register",
    "RACI",
    "DevSecOps",
    "variance-analysis",
    "planning",
    "retrospective"
  ] as const
};
