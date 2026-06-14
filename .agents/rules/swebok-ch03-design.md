---
description: "Software Design: design principles, patterns, and domain-driven design"
trigger: model_decision
---

# Software Design (SWEBOK v4, Chapter 3)

> Scope: transforming requirements into implementable specifications across three stages — architectural (Ch 2), high-level, and detailed design. Canonical theory owner for SOLID, Design by Contract, coupling/cohesion, design patterns, and DDD patterns.

## When to Apply

- Choosing/reviewing module/class structure, interfaces, or responsibilities (SOLID, coupling, cohesion).
- Selecting a design pattern or strategy (OO, event-driven, DDD, CBD) for a feature.
- Reviewing public methods for contracts (preconditions, postconditions, invariants).
- Naming state actions/selectors, identifying bounded contexts, or encapsulating eligibility rules.
- Recording design decisions (ADR) or evaluating a design against requirements.

## Key Definitions

- **SDD (Software Design Description)**: Blueprint/model facilitating analysis, implementation, and decisions.
- **Design Stages**: System-in-environment (architectural); top-level structure & component interfaces (high-level); internal structure sufficient for construction (detailed).
- **Coupling**: Interdependence among modules (minimize).
- **Cohesion**: Strength of association of elements within a module (maximize).
- **Aspect**: Property affecting performance/semantics across components (crosscutting).
- **Design Rationale**: Recorded "why" of a decision (assumptions, alternatives, trade-offs).
- **Wicked Problem**: Design problem defined only by solving it; demands iteration.

## Design Principles

- **Abstraction**: Expose only information relevant to the purpose; identify common properties.
- **Separation of Concerns (SoC)**: One concern per module for isolated reasoning.
- **Modularization**: Split software into named units with well-defined interfaces (SRP).
- **Encapsulation / Information Hiding**: Hide non-essential details; clients access via interface.
- **Separation of Interface & Implementation**: Define component by public interface; isolate clients from implementation.
- **Low Coupling / High Cohesion**: Minimize cross-module dependence; maximize relatedness within a module.
- **Uniformity**: Common solutions (naming, conventions, ordering) for recurring problems.
- **Completeness**: Cover all characteristics, modes, states, and requirements.
- **Verifiability**: Ensure enough information exists to verify design against requirements.

### SOLID (class/OO design)

- **S — Single Responsibility**: One reason to change per module. *Red flag: class mixing HTTP + business logic + formatting.*
- **O — Open/Closed**: Extend without modifying existing code. *Red flag: new case forces editing switch/if chain.*
- **L — Liskov Substitution**: Subtypes substitutable for base types. *Red flag: subclass throws on method parent promises.*
- **I — Interface Segregation**: Clients don't depend on methods they don't use. *Red flag: implements 8-method interface, uses 2.*
- **D — Dependency Inversion**: Depend on abstractions, not concretions. *Red flag: concrete class instantiated directly.*

### SOFA (method design)
Short · One thing · Few arguments · Abstraction-level consistency. Apply to method-level review (long methods, many params).

### Design by Contract
Public methods have preconditions (valid inputs) and postconditions (caller guarantees). Classes have invariants. Make state transitions explicit; model an FSM when states > 2.

### Ethically Aligned Design (IEEE 7000-2021)
For autonomous/AI/high-social-impact systems: human rights, well-being, data agency, effectiveness, transparency, accountability, awareness of misuse, competence.

## Coupling & Cohesion Metrics
Object-oriented design measures computed on a class diagram: coupling between objects, response-for-a-class, depth of inheritance tree, weighted methods per class (high values signal refactor candidates). Uniformity, complexity, and lines per method supplement them. Decision rule: adding imports increases coupling; scattering related logic decreases cohesion.

## Design Patterns
A pattern is a common solution to a common problem.
- **Creational** (builder, factory, prototype, singleton): How objects are created.
- **Structural** (adapter, bridge, composite, decorator, façade, flyweight, proxy): Composing objects/interfaces or wrapping behavior.
- **Behavioral** (command, interpreter, iterator, mediator, memento, observer, pub/sub, state, strategy, template, visitor): Interacting objects, varying algorithms, or reacting to events.

## Design Strategies
- **Function-Oriented**: Functional decomposition; top-down DFDs.
- **Data-Centered**: Data structures drive design; transforms derived from input/output shapes.
- **Object-Oriented**: Domain objects/roles; SOLID + responsibility-driven.
- **User-Centered**: UX/user flows are primary risk; prototyping.
- **Component-Based**: Reuse/independent deployment via standardized components + interfaces.
- **Event-Driven**: Decoupled pub/sub + topics for scalable systems.
- **Aspect-Oriented**: Crosscutting concerns (logging, security) spanning modules.
- **Constraint-Based**: Constraints prune design space; force early decisions.
- **Domain-Driven**: Domain shared language drives objects/roles/events/activities (see DDD).

## DDD Strategic Patterns (theory)
- **Bounded Context**: Logical boundary within which domain model is consistent.
- **Ubiquitous Language**: Shared vocabulary between domain experts and code.
- **Domain Event**: Fact that something happened (past-tense, e.g., `PaymentSubmitted`). Distinct from command and query.
- **Context Boundary Crossing**: Modifying two contexts' models in one handler, cross-context imports, or cross-context fields.

## DDD Tactical Patterns (theory)
- **CQRS**: Commands (mutations) and queries (reads) are separate. Queries must be pure and side-effect free.
- **Specification Pattern**: Encapsulate a business rule (3+ conditions gating one outcome) as a named predicate with one `isSatisfiedBy(candidate)` method.
- **Value Object**: Immutable typed wrapper for a primitive carrying domain meaning (equal by value, not reference).
- **Domain Event**: Naming state-mutation handlers in past tense for business occurrence, not technical operation.

## Recording Designs
Capture problem/solution vocabulary, major decisions, and rationale (ADR) — including rejected alternatives. Notations: structural (class, component, deployment, ERD, structure chart) and behavioral (activity, interaction/sequence, DFD, statechart, formal spec, pseudocode).

## Quality Analysis & Evaluation
- **Design Reviews / Audits**: Examine status, requirements coverage, open issues.
- **Static Analysis**: Fault-tree, automated cross-checking, security vulnerability, formal analysis.
- **Simulation & Prototyping**: Dynamic performance/feasibility evaluation.
- **Requirements Tracing**: Bidirectional mapping between requirements and design elements.
- **V&V Roles**: Verification (satisfies requirements) and Validation (meets expectations).

## Decision Checklist

Must Do:
- Give each module a single clear responsibility; interact only through defined interfaces.
- Document rationale for every non-trivial decision (ADR), including rejected alternatives.
- Define preconditions/postconditions/invariants for non-trivial public methods.
- Enumerate all modes, states, and transitions; model an FSM when states > 2.
- Define the error/exception-handling strategy at design level.
- Address all quality attributes (security, performance, reliability, variability).
- Name domain-event mutations in past tense; keep selectors (queries) pure.

Must Not Do:
- Create god classes or instantiate concretions where injection is appropriate.
- Bypass interfaces to reach a module's internals or cross bounded contexts implicitly.
- Leave empty catch blocks or silently swallow errors.
- Scatter a 3+-condition eligibility rule as inline booleans instead of a Specification.
- Pass raw primitives where a domain value (account number, money) demands a typed/branded value.

## Anti-Patterns
- **God class**: Low cohesion + high coupling; violates SRP.
- **Concrete instantiation / interface bypass**: Tight coupling, untestable, violates DIP.
- **Empty/silent catch**: Hides faults; no recovery or diagnosis.
- **Design by coincidence**: Works without intentional structure; brittle.
- **Happy-path-only design**: Missing state/transition and exception coverage.
- **Undocumented rationale**: Decisions become mysteries; rejected options re-litigated.
- **Inline eligibility soup**: 3+ duplicated conditions instead of a named Specification.
- **Primitive obsession**: Domain values passed as raw string/number; easy accidental swap.

## Standards Referenced
- **ISO/IEC/IEEE 24765**: Systems and Software Engineering Vocabulary.
- **IEEE Std 7000**: Ethical Concerns during System Design.
