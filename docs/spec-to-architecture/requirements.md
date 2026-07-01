# spec-to-architecture — Software Requirements Specification

| Field       | Value                              |
|-------------|------------------------------------|
| **Feature** | spec-to-architecture              |
| **Version** | 1.0.0                              |
| **Date**    | 2026-06-29                         |
| **Status**  | Draft                              |
| **Standard**| SWEBOK v4 Chapter 1 / ISO/IEC 29148 |

---

## 1. Stakeholders

| Stakeholder class | Concern                                  |
|-------------------|------------------------------------------|
| AI code-generation agents | Consume TLA+ specs and C4 architecture docs to produce implementations |
| AI code-review agents     | Verify implementations against formal specs and architectural boundaries |
| Formal methods engineers  | Review and extend TLA+ specifications            |
| Developers                | Understand architecture and formal requirements |

---

## 2. Functional Requirements

| ID        | Type | Requirement | Rationale | Priority | Acceptance Criteria |
|-----------|------|-------------|-----------|----------|---------------------|
| REQ-F001  | F | The skill SHALL automatically invoke after `/specification` completes successfully. | Eliminates manual trigger; ensures pipeline continuity. | MUST | Given `/specification` finishes, when the pipeline triggers, then `spec-to-architecture` runs without user intervention. |
| REQ-F002  | F | The skill SHALL read BDD `.feature` files (normal-course, exceptions, boundaries) from the existing `/docs/<feature-name>/bdd/` directory. | BDD files are the input artifact from the prior specification phase. | MUST | Given a feature directory with `.feature` files, when the skill runs, then it correctly identifies and parses all three feature files. |
| REQ-F003  | F | The skill SHALL generate a C4 Model architecture document with Mermaid diagrams at System Context and Container levels. | Provides high-level architectural design per SWEBOK Chapter 3 definitions. | MUST | Given BDD scenarios, when architecture generation runs, then `architecture/system-context.md` and `architecture/container.md` contain valid Mermaid diagrams and component descriptions. |
| REQ-F004  | F | The skill SHALL generate a raw TLA+ specification (`.tla` file) containing CONSTANTS, VARIABLES, Init, Next, Spec, invariants, and temporal properties. | Produces a formal model suitable for model checking with TLC. | MUST | Given BDD scenarios, when TLA+ generation runs, then the `.tla` file is syntactically valid and compiles under TLC. |
| REQ-F005  | F | The skill SHALL extract state variables from BDD `Given` clauses. | Given clauses define preconditions and system state, which map directly to TLA+ state variables. | MUST | Given a BDD scenario with a `Given` clause referencing an entity, when extracted, then the TLA+ VARIABLES declaration includes that entity. |
| REQ-F006  | F | The skill SHALL extract actions and state transitions from BDD `When` clauses. | When clauses describe actions that change system state. | MUST | Given a BDD scenario with a `When` clause, when extracted, then the TLA+ Next disjunction includes a corresponding action predicate. |
| REQ-F007  | F | The skill SHALL extract safety invariants from BDD `Then` clauses. | Then clauses define what must be true, mapping to TLA+ invariants. | MUST | Given a BDD scenario with a `Then` clause asserting a condition, when extracted, then the TLA+ spec includes a corresponding `Invariants` declaration. |
| REQ-F008  | F | The skill SHALL extract temporal/liveness properties from sequenced BDD scenarios or explicit temporal keywords (eventually, until, leads-to). | Some BDD scenarios describe liveness requirements (e.g., eventual consistency). | SHOULD | Given a BDD scenario describing eventual behavior, when extracted, then the TLA+ spec includes a temporal property with `<>[]` or `[]<>` operators. |
| REQ-F009  | F | The skill SHALL generate a TLC configuration file (`.cfg`) with CONSTANTS model values, invariants to check, and temporal properties to verify. | TLC requires concrete bounded values and explicit lists of what to verify. | MUST | Given a TLA+ spec with CONSTANTS `Users`, `Resources`, when config is generated, then the `.cfg` file assigns `Users = {u1, u2}`, `Resources = {r1, r2}` and lists all invariants and properties. |
| REQ-F010  | F | The skill SHALL execute TLC model checker against the TLA+ specification using `tla2tools.jar`. | Produces verification results (pass/fail, counterexamples). | MUST | Given a valid `.tla` and `.cfg`, when TLC runs, then `TLC-output.log` captures full model checking output. |
| REQ-F011  | F | The skill SHALL auto-fix the TLA+ specification on TLC failure, re-run TLC, and monitor for convergence. | Formal specs are hard to get right first time; iterative fixing improves correctness. | MUST | Given a TLA+ spec that produces a TLC error, when auto-fix runs, then the spec is modified and TLC re-executed until convergence or the agent detects no progress. |
| REQ-F012  | F | The skill SHALL map as many BDD scenarios as possible to TLA+ and skip scenarios that do not map (e.g., UI interactions, database CRUD). | Not all behavior is amenable to formal modeling. | SHOULD | Given a BDD scenario describing UI rendering, when mapping runs, then the scenario is logged as unmapped and TLA+ generation continues. |

---

## 3. Non-Functional Requirements

| ID        | Type | Requirement | Scale | Meter | Target | Minimum | Rationale |
|-----------|------|-------------|-------|-------|--------|---------|-----------|
| REQ-NF001 | NF | Pipeline execution time for parse + architecture + TLA+ generation (excluding TLC) | seconds | Wall-clock time from skill start to `.tla` file written | ≤ 30s | ≤ 120s | Users expect near-real-time feedback for spec-to-architecture transformation. |
| REQ-NF002 | NF | TLC model checking SHALL be monitored for resource exhaustion | boolean | Agent detects unbounded state space or excessive runtime | Agent stops TLC if no progress after reasonable interval | N/A | TLC can run forever on unbounded state; must be bounded by agent judgment. |
| REQ-NF003 | NF | BDD input size handling | scenarios | Count of Gherkin scenarios processed | No upper limit | No upper limit | Skill must handle arbitrary input sizes. |
| REQ-NF004 | NF | TLA+ spec correctness | boolean | TLC reports no errors, no invariant violations, no deadlock where not expected | All checks pass | Spec compiles and TLC runs to completion | The core value proposition is a formally verified spec. |
| REQ-NF005 | NF | Generated architecture readability | pages | Number of pages in C4 documentation per feature | Concise: 2–4 pages | ≤ 8 pages | Architecture docs should be scannable by downstream AI agents and humans. |

---

## 4. Traceability Matrix

| Req ID | BDD Scenario | Architecture Artifact | TLA+ Element |
|--------|--------------|-----------------------|--------------|
|--------|-------------|----------------------|--------------|
| REQ-F001 | F001 | — | — |
| REQ-F002 | F002 | — | — |
| REQ-F003 | F003 | system-context.md, container.md | — |
| REQ-F004 | F004 | — | CONSTANTS, VARIABLES, Init, Next, Spec |
| REQ-F005 | F005 | — | VARIABLES from Given clauses |
| REQ-F006 | F006 | — | Next action predicates from When clauses |
| REQ-F007 | F007 | — | Invariants from Then clauses |
| REQ-NF002 | NF001 | — | TLC monitoring |

---

## 5. SWEBOK References

| Chapter | Relevance |
|---------|-----------|
| Ch 1 — Software Requirements | Requirements elicitation, specification format, traceability |
| Ch 3 — Software Design | Architecture design stage, high-level design, SDD |
| Ch 5 — Software Testing | Traceability from requirements to test cases (TLC verification) |
| Ch 11 — Models & Methods | Modeling formalisms, state machines, analysis of models |
