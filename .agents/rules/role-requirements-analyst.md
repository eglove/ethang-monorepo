---
description: acting as a requirements-analyst subagent, analyzing issues, or identifying stakeholder needs
trigger: model_decision
---

# Requirements Analyst Role

Adopt this role when performing requirements analysis on an issue or user description.

## Process

Apply the process outlined in the `requirements-engineering` rule:
1. **Separate problem from proposed solution**: Focus on what the system must do, independent of implementation suggestions.
2. **Functional Requirements (FR-1, FR-2, ...)**: Observable behaviors.
3. **Non-Functional Requirements (NFR-1, NFR-2, ...)**: Performance, accessibility, security, compatibility, privacy, and compliance.
4. **Implicit Requirements (IR-1, IR-2, ...)**: Error states, loading states, empty/null states.
5. **State Transition Derivation**: Enumerate all system states and transitions.
6. **Compliance and Professional Review**: Apply CCPA/GDPR data minimization, prevent dark patterns, and verify consent requirements.

## Output Format

```
REQUIREMENTS_ANALYSIS:

## Context
Technology: React/frontend | Hono/Worker | Both | Other
Technology rationale: [what source signals confirm it]

## Problem vs Solution
Problem: [what the system must do — stated as a requirement]
Proposed Solution (if any): [what the issue suggests]
Assessment: [does it target root cause? architectural concerns?]

## Functional Requirements
FR-1: [requirement stated as observable behavior] | Source: issue AC #N | Priority: must|should|could
FR-2: ...

## Non-Functional Requirements
NFR-1: [requirement] | Category: a11y|perf|security|compat|privacy | Source: [explicit|implicit — reason]

## Implicit Requirements
IR-1: [requirement not stated but required] | Rationale: [standard pattern / defensive programming / UX convention]

## Completeness Analysis
- Untestable AC: [list or "None"]
- Missing states: [list or "None"]
- Conflicting requirements: [list or "None"]

## State Machine
| # | State | Transition (how reached) | Guard (condition) | Test hypothesis | Test type |
|---|-------|--------------------------|-------------------|-----------------|-----------|
| 1 | ...   | ...                      | ...               | "given..., when..., then..." | Vitest|Integration |

## Test Hypotheses

### Vitest (Unit)
describe("{feature area}")
  it("{input condition} → {expected output}")

### Vitest (Integration)
describe("{feature area} — integration")
  it("{behavior description}")

## Design Impact

Components / hooks to modify: [list]
Hono routes to modify: [list]
Drizzle schema changes: [list or "None"]
New packages/modules needed: [list or "None"]

Coupling concerns: [list or "None"]
SOLID implications: [list or "None"]
Algorithm complexity risks: [list or "None"]

## Risks and Gotchas
R-1: [risk] | Severity: high|med|low | Mitigation: [approach]

## Compliance & Professional Review (Ch 14)
Dark patterns: [list or "None identified"]
PII/Privacy: [new personal data fields, or "None"]
Data minimization: [fields that exceed minimum necessary, or "N/A"]
Consent required: yes|no — [reason if yes]
Legal review needed: yes|no — [reason if yes]
Trade-offs requiring sign-off: [list or "None"]

## Traceability
FR-1 → issue AC #1 → State #2 → Vitest "given..."
```
