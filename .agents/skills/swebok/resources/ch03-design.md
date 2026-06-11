# Software Design (SWEBOK v4, Chapter 3)

> Scope: transforming requirements into implementable specifications across three stages — architectural (Ch 2), high-level (external-facing structure), and detailed (internal component design). This chapter is the canonical theory owner for SOLID, Design by Contract, coupling/cohesion, design-pattern selection, and the DDD strategic + tactical patterns that the ddd-* and review-design-checklist overlays apply to code.

## When to Apply

- Choosing or reviewing module/class structure, interfaces, or responsibilities (SOLID, coupling, cohesion).
- Selecting a design pattern or design strategy (OO, event-driven, DDD, CBD) for a feature.
- Reviewing public methods for contracts (preconditions/postconditions/invariants).
- Naming state actions/selectors, identifying bounded contexts, or encapsulating eligibility rules (DDD patterns).
- Recording design decisions (ADR / design rationale) or evaluating a design against requirements.

## Key Definitions

| Term | Definition |
|---|---|
| SDD (Software Design Description) | Blueprint/model of the system created to facilitate analysis, planning, implementation, decision-making (ISO/IEC/IEEE 24765). |
| Architectural / High-level / Detailed design | Three stages: system-in-environment (Ch 2); outward-facing top-level structure + component interfaces; inward-facing internal structure sufficient to construct each module. |
| Coupling | Measure of interdependence among modules; design methods advocate loose/weak coupling. |
| Cohesion | Measure of strength of association of elements within a module; maximize it. |
| Aspect (crosscutting concern) | A property affecting performance/semantics across components — not a unit of functional decomposition. |
| Design rationale | Recorded WHY of a decision: assumptions, alternatives, trade-offs, and rejected options. |
| Wicked problem | A design problem fully defined only by solving it; demands iteration. |

## Design Principles — Decision Criteria

Apply these when structuring or reviewing modules:

| Principle | Apply when / Decision rule |
|---|---|
| Abstraction | Expose only information relevant to the purpose; hide the rest. Identify properties common to superficially different entities. |
| Separation of Concerns (SoC) | One concern per module so each can be reasoned about in isolation. |
| Modularization | Split large software into named units with well-defined interfaces; Parnas: each module has a single responsibility. |
| Encapsulation / Information Hiding | Make non-essential information inaccessible; clients touch only the interface. |
| Separation of interface & implementation | Define a component by its public interface; isolate clients from construction details. |
| Low coupling / High cohesion | Minimize cross-module dependence; maximize relatedness within a module. |
| Uniformity | Common solutions for recurring problems — naming, notation, interface, ordering — via conventions. |
| Completeness | Cover all important characteristics of an abstraction AND all modes/states/requirements. |
| Verifiability | Ensure enough information exists to verify the design vs. requirements; critical for high-assurance software. |

### SOLID (class/OO design) — what to flag

| Letter | Rule | Red flag |
|---|---|---|
| S — Single Responsibility | One reason to change per module | Class mixes HTTP + business logic + formatting |
| O — Open/Closed | Extend without modifying existing code | New case forces editing an existing switch/if chain |
| L — Liskov Substitution | Subtypes substitutable for base types | Subclass throws on a method the parent promises |
| I — Interface Segregation | Clients don't depend on methods they don't use | Implements 8-method interface, uses 2 |
| D — Dependency Inversion | Depend on abstractions, not concretions | Concrete class instantiated directly instead of injected |

### SOFA (method design)
Short · One thing · Few arguments · Abstraction-level consistency. Apply to method-level review (long methods, many params, mixed abstraction levels).

### Design by Contract
A non-trivial public method has a **precondition** (what inputs are valid), a **postcondition** (what the caller is guaranteed back), and the class has **invariants** (what is always true of an instance). Make state transitions explicit — when a type has >2 states, model an FSM instead of scattered boolean flags. (Formal specification languages express pre/postconditions, invariants, type checking.)

### Ethically Aligned Design (IEEE 7000-2021)
For autonomous/AI/high-social-impact systems: human rights, well-being, data agency, effectiveness, transparency, accountability, awareness of misuse, competence.

## Coupling & Cohesion Metrics

Object-oriented design measures computed on a class diagram:

- **Coupling between objects, response-for-a-class, depth of inheritance tree, weighted methods per class** — high values signal refactor candidates.
- **Per-class internal content** and **code complexity** (lines per method, number of messages sent) supplement the structural measures.
- **Function-based (structured) measures** are computed on a structure chart for top-down decompositions.

Decision rule: a change that adds new cross-module imports INCREASES coupling; related logic scattered across files (or unrelated logic merged) DECREASES cohesion — both are review findings.

## Design Patterns — Selection Guidance

A pattern is "a common solution to a common problem in a given context". Pick by intent:

| Category | Patterns | Choose when the problem is… |
|---|---|---|
| Creational | builder, factory, prototype, singleton | how an object is created / which concrete type / single shared instance |
| Structural | adapter, bridge, composite, decorator, façade, flyweight, proxy | composing/relating objects, adapting interfaces, wrapping behavior |
| Behavioral | command, interpreter, iterator, mediator, memento, observer, peer-to-peer, publish-subscribe, state, strategy, template, visitor | how objects interact, vary algorithms, or react to events |

Architectural styles are patterns "in the large." Patterns also establish solution vocabulary and document decisions — use the pattern name in the ADR.

## Design Strategies — Selection Matrix

Choose the organizing theme that matches the dominant concern:

| Strategy | Use when |
|---|---|
| Function-Oriented (Structured) | Functional decomposition dominates; produces DFDs top-down |
| Data-Centered | Data structures drive the design; derive transforms from input/output shapes |
| Object-Oriented (OOD) | Domain has clear objects/roles; apply SOLID + responsibility-driven design |
| User-Centered | UX/user flows are the primary risk; prototype and evaluate vs. requirements |
| Component-Based (CBD) | Reuse/independent deployment via standardized component model + interfaces |
| Event-Driven | Components react to events via indirect invocation; pub/sub + topics decouple producers/consumers for scalable systems |
| Aspect-Oriented (AOD) | Crosscutting concerns (logging, security) span many modules |
| Constraint-Based | Constraints prune an infeasible design space; force a few early decisions |
| Domain-Driven (DDD) | A domain-specific shared language must drive objects/roles/events/activities (see DDD sections) |

General strategies: divide-and-conquer, stepwise refinement, top-down vs. bottom-up, heuristics, iterative/incremental.

## DDD Strategic Patterns (theory)

Owned here; the ddd-strategic skill applies these operationally.

- **Bounded context** — a logical boundary within which one domain model is consistent. A change touching two contexts is a coupling risk to flag.
- **Ubiquitous language** — the shared vocabulary between domain experts and code. Divergence between task terms and code terms is where defects hide; record the delta.
- **Domain event** — a fact that something happened in the domain, named in **past tense** (e.g., `PaymentSubmitted`). Distinct from a **command** (imperative, triggers a process) and a **query** (reads state).
- **Context boundary crossing** — modifying two contexts' models in one handler, importing across context folders, or adding a field to one context's model for another's need.

## DDD Tactical Patterns (theory)

Owned here; the ddd-tactical skill maps these to state management, branded types, and review red flags.

- **CQRS** — commands (state mutations) and queries (state reads) are separate concerns. A query must be a pure read with no side effects; never mix a read and a mutation in one operation for the same data.
- **Specification Pattern** — encapsulate a business rule (typically 3+ conditions gating one outcome: eligibility, visibility, filtering, validation) as a named predicate with one `isSatisfiedBy(candidate): boolean` method, replacing scattered inline booleans.
- **Value Object** — an immutable typed wrapper for a primitive that carries domain meaning (account number, money, date range); equal by value, not reference. Prevents primitive obsession.
- **Domain Event** — see strategic section; the tactical concern is naming state-mutation handlers in past tense for the business occurrence, not the persistence/technical operation.

## Recording Designs

Capture (1) problem vocabulary, (2) solution vocabulary, (3) major decisions, (4) rationale per non-trivial decision — including **rejected** alternatives so they aren't re-litigated. Notations: structural (class/object, component, CRC, deployment, ERD, IDL, structure chart) and behavioral (activity, interaction/sequence, DFD, decision table, flowchart, state/statechart, formal spec, pseudocode/PDL). UML spans both, all stages.

## Quality Analysis & Evaluation

- **Design reviews / audits** — comprehensive examination of status, requirements coverage, open issues; a *functional audit* targets a set list of characteristics.
- **Static analysis** — non-executing: fault-tree analysis, automated cross-checking, design vulnerability (security) analysis, formal design analysis.
- **Simulation & prototyping** — dynamic performance/feasibility evaluation.
- **Requirements tracing** — each requirement maps to a design element and vice versa.
- **V&V roles** — verification (satisfies stated requirements), validation (meets stakeholder expectations), certification (third-party attestation).

## Decision Checklist

Must Do:
- Give each module a single clear responsibility; interact only through defined interfaces.
- Document rationale for every non-trivial decision (ADR), including rejected alternatives.
- Define preconditions/postconditions/invariants for non-trivial public methods.
- Enumerate all modes, states, and transitions; model an FSM when states > 2.
- Define the error/exception-handling strategy at design level.
- Address all quality attributes (security, performance, reliability, variability), not just functional behavior.
- Name domain-event mutations in past tense; keep selectors (queries) pure.

Must Not Do:
- Create god classes (low cohesion, high coupling) or instantiate concretions where injection is appropriate.
- Bypass interfaces to reach a module's internals or cross bounded contexts implicitly.
- Leave empty catch blocks or silently swallow errors.
- Scatter a 3+-condition eligibility rule as inline booleans instead of a Specification.
- Pass raw primitives where a domain value (account number, money) demands a typed/branded value.

## Anti-Patterns

| Anti-pattern | Why it's wrong |
|---|---|
| God class | Low cohesion + high coupling; violates SRP |
| Concrete instantiation / interface bypass | Tight coupling, untestable, violates DIP |
| Empty/silent catch | Hides faults; no recovery or diagnosis |
| Design by coincidence | Works without intentional structure; brittle to change |
| Happy-path-only design | Missing state/transition and exception coverage |
| Undocumented rationale | Decisions become mysteries; rejected options get re-litigated |
| Inline eligibility soup | 3+ duplicated conditions instead of a named Specification |
| Primitive obsession | Domain values passed as raw string/number; easy accidental swap |

## Standards Referenced

| Standard | Purpose |
|---|---|
| ISO/IEC/IEEE 24765:2017 | Systems and Software Engineering Vocabulary |
| IEEE Std 7000-2021 | Model Process for Addressing Ethical Concerns during System Design |
