export const ch07Maintenance = {
  content: `# Software Maintenance (SWEBOK v4, Chapter 7)

> Software maintenance is the totality of activities required to provide cost-effective support for software in operation. It spans pre-delivery activities (planning, maintainability design, transition logistics) and post-delivery activities (modification, surveillance, training, help desk). Key standard: **ISO/IEC/IEEE 14764**.

## When to Apply

Invoke this chapter when:
- Classifying an incoming modification request (MR) or problem report (PR) by category
- Performing impact analysis before implementing a change
- Triaging technical debt for prioritization
- Deciding whether to refactor vs. rewrite vs. leave-as-is
- Planning maintenance cost estimation or staffing
- Selecting maintenance metrics or tools

---

## Key Definitions

| Term | Definition (ISO/IEC/IEEE 14764) |
|---|---|
| **Corrective** | Reactive repair of a discovered defect after delivery |
| **Preventive** | Fix latent faults before they occur in the live system |
| **Adaptive** | Keep software usable in an evolving environment (OS upgrades, API changes) |
| **Additive** | Add new functions/features — relatively large additions or changes |
| **Perfective** | Improve documentation, performance, maintainability, or other attributes |
| **Emergency** | Unscheduled temporary fix to keep a system operational; pending corrective maintenance |
| **Maintainability** | Capability of software to be modified (corrections, improvements, environment adaptation) |
| **Technical debt** | Effort required to fix problems remaining in code when an application is initially released |
| **MR** | Modification Request — formal request to change the software |
| **PR** | Problem Report — incident or defect report triggering investigation |

> **Key finding (Lehman):** Maintenance IS evolutionary development. Over 80% of maintenance effort is enhancement and adaptation — not bug fixing. Cost reporting that aggregates all categories masks this reality.

---

## Maintenance Category Decision Table

Use this to classify any incoming request before starting work:

| Question | Yes → | No → |
|---|---|---|
| Is it repairing a discovered defect? | **Corrective** | → next |
| Is it fixing a latent fault before it surfaces? | **Preventive** | → next |
| Is it adapting to an environment change (OS, platform, API)? | **Adaptive** | → next |
| Does it add entirely new functions with large scope? | **Additive** | → next |
| Does it improve quality attributes (perf, docs, maintainability) without adding new functions? | **Perfective** | → next |
| Is it an unscheduled fix to keep the system running temporarily? | **Emergency** (requires follow-up corrective ticket) | Re-evaluate |

> **Additive vs. Perfective distinction:** Additive provides entirely new functions or features (relatively large additions). Perfective improves existing attributes without adding new capability.

---

## Impact Analysis Procedure (ISO/IEC/IEEE 14764 §5.1.6)

Run for every MR/PR before implementation. Severity of the PR guides timing (critical PRs → immediate; low → scheduled release).

**Step 1 — Enter SCM process.** The change request must be translated into software terms and formally entered into configuration management before analysis begins.

**Step 2 — Identification and categorization.** Apply the MR/PR identification scheme; categorize and prioritize using established criteria.

**Step 3 — Scope affected components.** Identify all systems, products, and artifacts impacted by the change request.

**Step 4 — Estimate resources.** Determine effort, timeline, cost, testing scope, and personnel required.

**Step 5 — Assess risks.** Identify risks to performance, safety, security, and schedule from making the change.

**Step 6 — Plan work-arounds.** Determine if temporary operator work-arounds are needed; document them and track through to removal.

**Step 7 — Determine follow-up feedback.** Specify what feedback will be provided to users after the change is implemented.

**Step 8 — Recommend course of action.** Develop potential solutions and recommend the best option based on impact findings.

> MR above agreed size, effort, or complexity → reject maintenance; reroute to development project.

---

## Technical Debt Triage

Technical debt should not be addressed in isolation — examine root causes alongside the debt items.

**Four questions to answer before prioritizing debt work (ISO/IEC/IEEE 14764 §8.8.3.6):**

| Question | Why it matters |
|---|---|
| What is the quality of the current software? | Establishes baseline; size/complexity/flaw counts |
| What is the extent of the technical debt? | Quantifies scope; tooling provides violation counts |
| What are the potential savings from quality investment? | Determines ROI of remediation |
| What is the impact of current quality issues on the business? | Connects debt to business risk |

**Three investigation areas when addressing debt:**

| Area | Decision |
|---|---|
| Code quality vs. relevance | Not all debt is equally urgent — deprioritize debt in code scheduled for retirement |
| Alignment with organizational objectives | Architecture should reflect current org goals; misaligned architecture = forced debt |
| Process loss | Team/process issues (skills gaps, no peer review) may be root cause — fix process, not just code |

> Team or process issues often contribute to unplanned work alongside technical debt. Fix process defects alongside code defects.

---

## Refactoring Go/No-Go Criteria

Refactoring reorganizes a program WITHOUT changing observable behavior. It reduces technical debt and improves internal structure but does not add or remove features.

| Condition | Decision |
|---|---|
| Code is scheduled for retirement within one release cycle | **No-Go** — effort wasted |
| Behavior change is also required in the same commit | **No-Go** — split into separate commits; mixing makes causality untraceable |
| Aging legacy code must be replaced entirely | **Reengineering** (not refactoring) — reconstitution in a new form |
| CI pipeline complexity is growing, slowing builds | **Go** — continuous refactoring reduces growing complexity |
| Technical debt is blocking new feature development | **Go** — pay down before the blocked feature, not after |
| Refactoring would exceed agreed maintenance size/effort | **Reroute to development** via MR process |

---

## Management Issues

### Organizational Structure Decision

| Option | Advantage | Disadvantage |
|---|---|---|
| Developer maintains own code | No handoff friction; full context | New development disrupted by failures; knowledge silo risk |
| Separate maintenance team | Specialists; clear ownership | Handoff process needed; maintainers may leave for "interesting" work |
| Product team (Agile single team) | Rapid response to user change | Maintenance competes with features for iteration priority |

> Decision is case-by-case. Delegate to experienced group regardless of structure; maintain quality documentation of all changes.

### Planning Perspectives

Maintenance planning operates at four levels:

| Level | Scope |
|---|---|
| Business planning | Organizational budget, staffing, financial resources |
| Maintenance planning | Transition plan; scope, processes, costs, org identification |
| Release/version planning | MR dates, conflicts, risk assessment, back-out plan, stakeholder notification |
| MR planning | Individual impact analysis (see procedure above) |

> **Start maintenance planning during development**, not after delivery. The maintenance plan must specify how users will request modifications and report problems.

---

## Maintenance Measurements

Track by category — not just totals. Aggregating hides where spending goes.

| Measure | What it reveals |
|---|---|
| Effort by category (corrective/preventive/adaptive/additive/perfective) | Distribution of maintenance spending |
| Number of MRs/PRs per period | Demand rate; trend signals quality decay |
| Effort per MR/PR | Efficiency; outliers signal complexity problems |
| Complexity and technical debt scores | Maintainability trajectory |
| Reliability (maturity, availability, fault tolerance, recoverability) | Operational health |
| Size (LOC, functional size) | Growth rate; Lehman's Continuing Growth law in practice |

---

## Maintenance Techniques Summary

| Technique | Purpose | Key constraint |
|---|---|---|
| **Program comprehension** | Understand software before modifying it | Largest time sink in maintenance; aids: code browsers, call graphs, documentation |
| **Refactoring** | Improve internal structure without behavior change | Separate commits from behavioral changes |
| **Reengineering** | Reconstitute aging software in a new form | Not the same as refactoring; used for legacy replacement |
| **Reverse engineering** | Recover specifications/design from existing code | Passive — does not change software; types: re-documentation, design recovery, data RE |
| **Visualization** | Dependency analysis, evolution tracing, runtime dynamics | Active research area; supports cognitive performance under complex analysis |
| **CI/CD** | Automated build/test/deploy pipeline | Continuous refactoring integral to managing growing CI complexity |

---

## Decision Checklist

**Must Do:**
- [ ] Classify every MR/PR by maintenance category before starting work
- [ ] Run the full impact analysis procedure (§5.1.6) before implementation — including SCM entry, scope, resources, risks, work-arounds, and follow-up feedback
- [ ] Create a follow-up corrective ticket for every emergency fix
- [ ] Track all work-arounds through to removal — never leave them permanently
- [ ] Refactor in commits separate from behavioral changes
- [ ] Measure and report maintenance effort broken down by category
- [ ] Start maintenance planning during software development, not after delivery
- [ ] Regression test every modification
- [ ] Address technical debt root causes (process/skills gaps), not just code symptoms

**Must Not Do:**
- [ ] Mix behavior changes and refactoring in the same commit
- [ ] Skip impact analysis for "small" changes
- [ ] Leave emergency fixes permanently without replacement
- [ ] Report only total maintenance costs without category breakdown
- [ ] Treat refactoring as equivalent to reengineering — they have different go/no-go triggers
- [ ] Address technical debt in isolation from process/team root causes

---

## Anti-Patterns

| Anti-Pattern | Consequence |
|---|---|
| Behavioral change + refactoring in same commit | Untraceable causality; regression source unknown |
| No impact analysis before "small" change | Small changes cause large failures |
| Emergency fix never replaced | Technical debt compounds; workaround becomes permanent architecture |
| Only total maintenance cost reported | Masks that 80%+ of spend is enhancement, not bug-fixing |
| Technical debt addressed in big-bang effort | Misses process root causes; debt reaccumulates |
| Maintenance planning deferred until post-delivery | Cost estimation and SLA terms undefined; transition uncontrolled |
| Treating maintenance as "just bug fixing" | Mismatch in staffing, budgeting, and architecture decisions |

---

## Standards Referenced

- **ISO/IEC/IEEE 14764** — Software Life Cycle Processes: Maintenance (primary standard)
- **ISO/IEC/IEEE 12207** — Software Life Cycle Processes (maintenance as technical process)
- **ISO 25010** — Maintainability characteristics: Modularity, Reusability, Analyzability, Modifiability, Testability, Supportability
- **IEEE Std 2675-2021** — DevOps: Building Reliable and Secure Systems
`,
  path: "resources/ch07-maintenance.md",
  title: "Software Maintenance",
  triggers: [
    "maintenance",
    "technical-debt",
    "refactoring",
    "Lehman",
    "impact-analysis",
    "reengineering",
    "corrective",
    "perfective"
  ] as const
};
