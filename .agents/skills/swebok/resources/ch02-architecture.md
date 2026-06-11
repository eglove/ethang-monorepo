# Software Architecture (SWEBOK v4, Chapter 2)

> Scope: the fundamental concepts/properties of a system in its environment — its elements, their relationships, and the principles of its design and evolution (separated from Software Design Ch 3 in v4). This chapter is the theory owner for view/viewpoint selection, architecture pattern/style selection, ASR identification, architecture evaluation methods, and architectural-debt signals that the review-design-checklist overlay applies to layer/coupling reviews.

## When to Apply

- Choosing or reviewing the large-scale structure of a system (styles, patterns, layering, microservice/MFE boundaries).
- Identifying which requirements are architecturally significant (ASRs) and tracing them to structure.
- Selecting a view/viewpoint set to document or review a system for specific stakeholder concerns.
- Choosing an architecture evaluation method (ATAM vs SAAM vs QAW vs active review) for a milestone.
- Detecting architectural technical debt and deciding whether to track/pay it down.
- Reviewing whether quality attributes (security, performance, reliability) are addressed at the architecture level, not deferred to construction.

## Key Definitions

| Term | Definition |
|---|---|
| Architecture (of a system) | Fundamental concepts or properties of a system in its environment, embodied in its elements, relationships, and principles of design and evolution (ISO/IEC/IEEE 42010). |
| Architecture Description (AD) | Work product documenting an architecture; blueprint for construction and basis for test, QA, certification, deployment, operation, evolution. |
| ASR (Architecturally Significant Requirement) | Any requirement that influences a system's architecture; reflects the design problems the architecture must solve. |
| Concern | Any stakeholder interest/issue (functional, non-functional, or constraint); not static — evolves over the life cycle. |
| View / Viewpoint | A view represents aspects of an architecture addressing concerns; a viewpoint documents the conventions for creating/interpreting/using that view. |
| Style vs Pattern | Style = manner of construction giving large-scale (whole-system) organization; pattern = solution to a recurring problem, need not apply to the whole system. |
| Reference Architecture (RA) | An architecture constraining/guiding other architectures across a domain or product family. |
| Architecture rationale | Recorded WHY: assumptions, alternatives considered, trade-offs/criteria, and rejected options. |
| Architectural technical debt | Deferred decisions that compromise future maintainability/evolvability; has economic impact, typically paid by others. |

## Views & Viewpoints — Selection

A view answers a stakeholder concern; the viewpoint is its reusable convention. Select the minimum set of viewpoints that cover the live concerns — separating concerns by view manages understandability and complexity.

### Common viewpoints (pick by concern)

| Viewpoint | Use when the concern is… |
|---|---|
| Module | Implementation structure: modules and their organization |
| Component & connector (C&C) | Large-scale runtime organization and interactions |
| Logical | Fundamental domain concepts and capability |
| Scenarios / use cases | How users interact with the system (integrates other views) |
| Information | Key information elements, how accessed and stored |
| Deployment | How the system is configured and deployed for operation |

Specialized viewpoints also exist for availability, behavior, communications, exception handling, performance, reliability, safety, security. Clements' **viewtypes** group all viewpoints three ways: module, component-and-connector, allocation.

> The Kruchten **4+1** model (logical, process, physical, development + scenarios) is the classic example view set; scenarios integrate the other four.

### Two ways to build a multi-view AD

| Approach | Mechanism | Trade-off |
|---|---|---|
| Synthetic | Build each view independently; integrate via correspondence rules / traceability | More expressive; risk of inter-view inconsistency (the "multiple views problem") |
| Projective | Derive every view mechanically from one unified "uber model" | Limits inconsistency; limited by what the single model can express |

Decision rule: with multiple independent views you MUST maintain explicit linkages/traceability or the views drift out of sync.

## Pattern / Style Selection

Style = whole-system organization; pattern = recurring-problem solution at any scale. Both draw vocabulary from a viewpoint. Choose by the dominant structural concern:

| Category | Styles/Patterns | Choose when… |
|---|---|---|
| General structures | layered, call-and-return, pipes-and-filters, blackboard, services/microservices | partitioning a whole system into cooperating parts |
| Distributed systems | client-server, n-tier, broker, publish-subscribe, point-to-point, REST | components run/communicate across process or network boundaries |
| Method-driven | object-oriented, event-driven, data flow | the dominant paradigm is objects, events, or data transformation |
| User-computer interaction | MVC, presentation-abstraction-control | separating UI from domain/control logic |
| Adaptive systems | microkernel, reflection, meta-level | the system must be extended/reconfigured at runtime |
| Virtual machines | interpreters, rule-based, process control | behavior is defined by rules/programs the system executes |

## ASR Identification & the Design Loop

ASRs are the requirements that shape structure. Architecture analysis identifies concerns and context, then produces ASRs, initial system-wide decisions, and overarching principles. When requirements + constraints can't all be met, **negotiate** to modify needs rather than silently overconstrain.

Iterative loop (often concurrent at multiple granularities):

| Activity | Produces |
|---|---|
| Analysis | ASRs, system-wide decisions, principles from context |
| Synthesis | Candidate solutions to ASRs; trade-offs across interacting solutions; feeds elaborated ASRs back to analysis |
| Evaluation | Validation that solutions satisfy ASRs; identifies when/where rework is needed |

Context affects how much architecture to do: traditional life cycle = explicit design stage; product line/family = baseline architecture then per-product; agile = architecture may "emerge" from code (adequate for user-centric info systems, **risky for embedded/cyber-physical/safety-critical** where critical properties aren't in user stories). Fairbanks' risk-driven rule: do **just enough**.

Document every non-trivial decision with rationale and rejected alternatives — so they aren't re-litigated, and so changed conditions can trigger a revisit.

## Evaluation Method Selection

Evaluation validates ASR satisfaction; typically done by third parties at milestones. Pick the method by what you need to learn:

| Method | Use when you need to… | Notes |
|---|---|---|
| ATAM (Tradeoff Analysis) | Analyze trade-offs among competing quality attributes | Quality-attribute utility tree + scenarios; the trade-off analysis is the point |
| SAAM (Architecture Analysis) | Run a simpler/earlier scenario-based evaluation | Predecessor to ATAM |
| QAW (Quality Attribute Workshop) | Identify and prioritize quality concerns up front (pre-architecture) | Collaborative stakeholder workshop |
| Active review (Parnas/Weiss) | Get real information instead of rubber-stamp checklists | Each item demands a specific reviewer activity |
| Use-case tracing | Check completeness/consistency | Trace each use-case step to the architecture elements involved |

A "good" architecture is robust over its lifetime, fit for use, feasible/cost-effective to build, and clear to builders/users/maintainers — and must address the **consequences of concern interactions** (a secure architecture may be too costly; an easy-to-build one may not be maintainable).

## Architecture Metrics

Structural (lifted from design/code metrics) — high values flag refactor/debt:

- Component dependency, cyclicity, cyclomatic complexity
- Internal module complexity, module coupling and cohesion
- Levels of nesting
- Compliance with required patterns, styles, and APIs

DevOps process metrics indicate architectural health: **lead time for changes, deployment frequency, mean time to restore service (MTTR), change failure rate**.

## Architectural Debt Signals

Track and schedule paydown when you see: a first release built with little concern for modularity; new functionality only addable via extensive refactoring; rising defect injection on change; team/communication structure fighting the intended architecture (Conway's Law mismatch). Debt does not disappear on its own; analyze it like any concern using models and viewpoints.

## Decision Checklist

Must Do:
- Identify ASRs explicitly and keep them traceable to architecture elements.
- Address security, safety, reliability, and other dominating quality attributes at the architecture level.
- Select a minimal viewpoint set covering the live stakeholder concerns; maintain cross-view traceability.
- Document every non-trivial decision with rationale and rejected alternatives.
- Evaluate the architecture at defined milestones (ATAM/SAAM/QAW/active review) — don't assume goodness emerged.
- Track architectural technical debt as explicit work items with cost and risk.
- Match team/communication structure to the intended architecture (Conway's Law).

Must Not Do:
- Defer quality-attribute concerns to construction and hope they emerge.
- Ship a single-view AD that ignores other stakeholders' concerns.
- Let independent views drift without linkages/traceability.
- Leave architectural decisions undocumented or rationale-free.
- Rely on emergent/agile architecture for embedded, cyber-physical, or safety-critical systems.
- Accrue architectural debt silently with no tracking or paydown plan.

## Anti-Patterns

| Anti-pattern | Why it's wrong |
|---|---|
| No architecture documentation | Team systems lose shared understanding; onboarding and evolution suffer |
| Undocumented rationale | Future teams repeat rejected alternatives; can't tell when to revisit |
| Conway's Law mismatch | Team structure fights the intended architecture; structure degrades |
| Silent architectural debt | No tracking, no paydown; compounds and is paid by others |
| Single-view AD | Fails to address differing stakeholder concerns |
| Functional-only architecture | Ignores quality attributes (security, performance, reliability) |
| Big-bang design, no iterative evaluation | No analysis→synthesis→evaluation loop; defects found too late |
| Emergent architecture for safety-critical | Critical properties absent from user stories never get designed in |

## Standards Referenced

| Standard | Purpose |
|---|---|
| ISO/IEC/IEEE 42010:2011 | Systems and software engineering — Architecture description (view/viewpoint/AD vocabulary) |
| ISO/IEC/IEEE 24765:2017 | Systems and Software Engineering Vocabulary |
