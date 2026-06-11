export const ch01Requirements = {
  content: `# Software Requirements (SWEBOK v4, Chapter 1)

> Scope: developing software requirements (elicitation → analysis → specification → validation) and managing them over service life (scrubbing, change control, scope matching). A requirement is a property that must be exhibited to solve a real-world problem. The two field failure modes are **incompleteness** (needed requirements never surfaced) and **ambiguity** (one statement, multiple interpretations). Wrong requirements cascade into exponentially expensive rework downstream.

## When to Apply

- Analyzing a task or GitHub issue: classify each line item, surface tacit requirements, detect ambiguity/incompleteness before estimating or coding.
- Writing acceptance criteria: convert a story into testable ATDD/BDD scenarios (the RED tests of TDD).
- Reviewing scope: confirm every change traces to a stated requirement and every requirement is testable.
- Handling change: route a mid-flight scope change through change control / backlog instead of silently absorbing it.

## Key Definitions

| Term | Definition | Decision use |
|---|---|---|
| Functional requirement | Observable behavior: a policy enforced or a process carried out | Survives the **Perfect Technology Filter** (still needed even with infinite-speed, zero-cost, never-fail hardware) |
| Nonfunctional requirement | Constrains the technologies / quality of the solution | Fails the filter → it is a constraint, not a behavior |
| Technology constraint (NFR) | Mandates or prohibits a named technology/platform | e.g., "must run on Cloudflare Workers", "no blocking I/O" |
| Quality-of-service constraint (NFR) | Acceptable performance level (response time, throughput, reliability, scalability, accuracy, safety, security) | Must be quantified to be testable |
| Derived requirement | Imposed inside the team by a design decision, not by an external stakeholder | Architect's pattern choice = requirement for the sub-team building each part |
| System vs software requirement | System = whole (HW+SW+people); software = one element | Some software reqs are derived from system reqs |
| Project requirement | Constrains the project (cost, schedule, staffing, training, migration) | Captured in a charter; out of scope for product behavior |

## Requirement Classification (run this first on every task)

1. Would it still be stated on infinite/free/perfect hardware? → **Functional** (a policy or process). Else → **Nonfunctional**.
2. If nonfunctional: names a specific technology? → **Technology constraint**. Specifies a performance level? → **QoS constraint** (quantify it).
3. Is the line a *solution* dressed up as a need? → apply 5-Whys before accepting it.

## Elicitation — Source & Technique Selection

| Source class | Where to look | Fit technique |
|---|---|---|
| Stakeholders (clients, customers, users, SMEs, ops, regulators) | People who pay for / decide on / use / are affected by the system | Interviews, workshops, brainstorming, protocol analysis, focus groups, questionnaires, user story mapping, design thinking |
| Tacit / hard-to-articulate work | Users who can't describe their own tasks | Observation, apprenticing, exploratory prototyping (low- then high-fidelity) |
| Non-person sources | Prior versions, defect-tracking DB, interfacing systems, competitor benchmarking, QFD House of Quality, ISO/IEC 25010 quality model, standards & regulations | Decomposition (capabilities → epics → features → stories), task analysis, literature search |

Rule: elicitation is **not passive** — many requirements are tacit. Run a stakeholder analysis so output is not biased toward the loudest stakeholder class.

## Analysis — Quality Criteria (the testable bar)

| Each requirement must be | Means |
|---|---|
| Unambiguous | Interpretable in exactly one way |
| Testable / quantified | Compliance or noncompliance can be demonstrated ("fast" fails; "≤200ms at 500 concurrent users" passes) |
| Binding | Client will pay for it and is unwilling to ship without it |
| Atomic | One decision per requirement |
| True & in stakeholder vocabulary | Reflects an actual need; acceptable to all stakeholders |

The **set** must be: complete (covers boundary, exception, and security cases), concise, internally consistent, externally consistent (matches source material), feasible within constraints.

- **5-Whys**: when a requirement looks like a solution, ask "Why is this the requirement?" Stop at "If that isn't done, the stakeholder's problem is not solved" (usually 2–3 cycles).
- **Conflict resolution**: (1) negotiate a consensus, traceable back to the customer; or (2) product-family split — separate invariant requirements (all agree) from variant requirements (conflict), design to invariants and design-for-change on variants.

## Specification — Approach Selection

| Approach | Form | Use when |
|---|---|---|
| Unstructured natural language | "The system shall…", business rules | Low risk, shared domain familiarity |
| Structured natural language | Actor-action ("When X, the system shall Y unless Z"), use case template, user story, decision table | Need more precision without modeling overhead |
| Acceptance criteria (ATDD) | Test cases that read as requirements | TDD flow; requirements drive RED tests |
| BDD | Given/When/Then scenarios per story | Business reviewers prefer it; less technical than ATDD |
| Model-based (UML/SysML) | Structural (class/ER) + behavioral (state, sequence, activity) models | Complex policy/process; want mechanically-derivable tests |

**ATDD loop:** (1) pick a unit of functionality; (2) engineers + business (+ QA) agree the test cases **before** any design/code; (3) at least one acceptance test **must fail** on existing software — that failure grants permission to write code; iterate to green, refactor, return to step 1.

**BDD:** story "As a <role> I want <capability> so that <benefit>", then a *comprehensive* set of scenarios "Given <context> When <stimulus> Then <outcome>" — include sufficient-balance, insufficient-balance, disabled-card, etc. Acceptance tests fall straight out of the scenarios. ATDD/BDD kill ambiguity; pair with coverage criteria (boundary value, pairwise, domain testing) to attack incompleteness.

**Model formality spectrum:** Agile sketch → semiformal (UML) → formal (Z, VDM, SDL). More formal = less ambiguous, more concise, more mechanically test-derivable, but harder for non-technical readers. State models yield positive tests per defined transition and negative tests from undefined state/event combinations.

## Validation

| Method | What it catches |
|---|---|
| Requirements review (multi-perspective) | Clients check needs met; req engineers check clarity/standards; designers check sufficiency to build from. Give reviewers a checklist / definition-of-done |
| Simulation & execution | Hand-execute a formal/model-based spec against demo scenarios to convince nontechnical stakeholders |
| Prototyping | Expose engineer assumptions (esp. dynamic UI behavior); beware cosmetic distraction and cost |

## Management

- **Scrubbing**: find the smallest simply-stated set that meets needs; drop out-of-scope / low-ROI / unimportant items; simplify over-complex ones. (Plan-based: just before validation review. Agile: implicit in sprint planning.)
- **Change control (plan-based)**: request → optional impact analysis → accept/reject/defer by responsible party → notify affected stakeholders → track to closure. Accepting a change = accepting its schedule/resource/scope impact (ideally quantified in functional size units).
- **Change control (Agile)**: any change is a backlog item; "accepted" only when prioritized into a sprint.
- **Scope matching**: if scope exceeds cost/schedule/staffing, reduce scope (drop lowest-priority), increase capacity, or negotiate a mix.

## Prioritization & Traceability

- Factors: value/desirability/satisfaction **and** dissatisfaction-if-absent (**Kano** — a feature users never request can still be high priority because its absence enrages them); cost to deliver; cost to maintain; technical risk; adoption risk.
- Objective function example: \`Priority = Value × (1 − Risk) / Cost\`. Express as enumerated (must/should/nice), numeric (1–10), or ordered list. Group by similar priority rather than debating tiny differences.
- **Tracing** serves two purposes: (1) accounting — every requirement has a satisfying design element and every design element has a justifying requirement; (2) impact analysis — trace a changed requirement forward (design → code → tests) to size the change footprint. Maintain it **bidirectionally**: backward to source docs/standards, forward to design, code, tests, and user manual.
- **Stability/volatility**: tag likely-to-change requirements so the design can isolate change.

## Decision Checklist

**Must Do**
- Classify every task line item via the Perfect Technology Filter before estimating.
- Quantify every QoS/acceptance criterion; reject "fast", "easy", "intuitive".
- Apply 5-Whys when a requirement reads as a solution.
- Write acceptance criteria as ATDD/BDD scenarios; ensure at least one fails before code (RED).
- Cover boundary, exception, and security cases — not just the happy path.
- State security/safety requirements explicitly and testably.
- Maintain bidirectional traceability: requirement ↔ design ↔ code ↔ test.
- Route mid-flight scope changes through change control / backlog with impact noted.

**Must Not Do**
- Accept solutions stated as requirements without finding the underlying problem.
- Gold-plate beyond stated requirements without stakeholder agreement.
- Accept a change without assessing scope/schedule/cost impact.
- Review from a single perspective (only technical, or only business).
- Prioritize on satisfaction alone (ignoring Kano dissatisfaction).
- Leave a design element in place with no traceable requirement.

## Anti-Patterns

| Anti-pattern | Correction |
|---|---|
| Solution stated as requirement | 5-Whys to the real problem |
| Untestable requirement ("user-friendly") | Quantify a measurable acceptance criterion |
| Happy-path-only coverage | Add boundary, exception, security scenarios |
| Silent scope creep | Change control / backlog item with impact analysis |
| Single-perspective review | Client + engineer + designer review |
| Satisfaction-only prioritization | Add Kano dissatisfaction dimension |
| Gold-plating | Trace every built element back to a requirement |

## Standards Referenced

| Standard | Purpose |
|---|---|
| ISO/IEC/IEEE 29148 | Requirements engineering processes; documentation templates |
| ISO/IEC 25010 (SQuaRE) | System & software quality models / QoS characteristics |
| ISO/IEC/IEEE 24765 | Systems & software engineering vocabulary |
`,
  path: "resources/ch01-requirements.md",
  title: "Software Requirements",
  triggers: [
    "requirement",
    "elicitation",
    "acceptance-criteria",
    "ATDD",
    "BDD",
    "stakeholder",
    "traceability",
    "change-control"
  ] as const
};
