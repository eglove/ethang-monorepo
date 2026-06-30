# spec-to-architecture

Automatically transforms BDD specification documents into a C4 Model architecture design and a formal TLA+ specification with model checking results.

This skill runs automatically after `/specification` completes, reading the `.feature` Gherkin files from the spec directory and producing two downstream artifacts: an architectural design document (C4 Model with Mermaid diagrams) and a raw TLA+ formal specification verified by TLC.

## Documents

| Document | Description |
|----------|-------------|
| [requirements.md](requirements.md) | SWEBOk v4 Chapter 1 / ISO/IEC 29148 compliant requirements specification |
| [bdd/normal-course.feature](bdd/normal-course.feature) | Happy-path scenarios for skill behavior |
| [bdd/exceptions.feature](bdd/exceptions.feature) | Error paths, failure modes, and exception handling |
| [bdd/boundaries.feature](bdd/boundaries.feature) | Boundary value analysis and edge cases |

## Traceability Matrix

| Req ID | Description | BDD Scenario | Architecture | TLA+ |
|--------|-------------|-------------|-------------|------|
| REQ-F001 | Auto-invoke after /specification | F001 | — | — |
| REQ-F002 | Parse all BDD feature files | F002 | — | — |
| REQ-F003 | Generate C4 architecture | F003 | system-context.md, container.md | — |
| REQ-F004 | Generate TLA+ spec | F004 | — | CONSTANTS, VARIABLES, Init, Next, Spec |
| REQ-F005 | Extract state from Given | F005 | — | VARIABLES |
| REQ-F006 | Extract actions from When | F006 | — | Next predicates |
| REQ-F007 | Extract invariants from Then | F007 | — | INVARIANT |
| REQ-F008 | Extract temporal properties | F008 | — | ACTION/temporal |
| REQ-F009 | Generate TLC config | F009 | — | .cfg file |
| REQ-F010 | Execute TLC | F010 | — | TLC-output.log |
| REQ-F011 | Auto-fix and re-run | F011 | — | iterative TLC |
| REQ-F012 | Skip unmappable scenarios | F004 | — | unmapped log |
| REQ-NF001 | Pipeline speed ≤30s | — | — | — |
| REQ-NF002 | Monitor TLC for divergence | NF001 | — | agent-monitored |
| REQ-NF003 | No input size limits | — | — | — |
| REQ-NF004 | Spec correctness | — | — | TLC pass |
| REQ-NF005 | Architecture readability 2–4pp | — | page budget | — |

## Open Questions & Assumptions

1. **TLC convergence heuristic**: How many iterations constitute "no progress"? Assumed: agent judgment based on error type change across iterations.
2. **Fairness**: Should weak/strong fairness be auto-added to liveness checking, or only when explicit in BDD?
3. **CONSTANTS sizing**: Default 2–3 elements per set may be insufficient for some invariants; should the skill attempt multiple sizes?
4. **TLA+ module naming**: Should the module name match the feature name, or use a namespaced convention like `FeatureName_tla`?
