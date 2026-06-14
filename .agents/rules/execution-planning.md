---
description: architecture design, execution planning, detailed design, threat modeling, or creating execution-plan.md
trigger: model_decision
---

# Execution Planning & Architecture

Use this rule to plan feature implementation, design software architecture, perform threat modeling, and structure the test inventory (SWEBOK Ch 2, Ch 3, Ch 13).

## Architecture & Design Planning

1. **Strategic Domain Context:** Apply a DDD strategic lens (see `ddd-strategic`) to map the bounded context, ubiquitous-language delta, and domain events.
2. **State Machine Table:** Derive the behavioral model (see `tdd-state-coverage`) with preconditions, postconditions, reachability, and invariants.
3. **Test Inventory:** Define Vitest unit and integration tests (see `tdd-principles`) addressing happy paths, boundary conditions, and error branches.
4. **Cloudflare Platform Selection:**
   - Select correct Cloudflare products (KV vs D1 vs R2, Pages vs Workers, Durable Objects, Workflows).
   - Review architectural decisions against production Workers patterns (no global state dependencies, correct binding usage, CPU time limits).

## STRIDE Threat Modeling (SWEBOK Ch 13)

Perform threat modeling across all trust boundaries:
- Client ↔ Worker (HTTP/WebSocket)
- Worker ↔ Database (Drizzle/D1)
- Worker ↔ Storage (KV/R2/Durable Objects)
- Worker ↔ Third-Party APIs

Enumerate threats using STRIDE:
- **Spoofing**: Impersonating users/services.
- **Tampering**: Modifying data at rest or in transit.
- **Repudiation**: Inability to audit actions.
- **Information Disclosure**: Unauthorized data leaks.
- **Denial of Service**: Service degradation.
- **Elevation of Privilege**: Gaining unauthorized permissions.

## Execution Plan Artifact (`execution-plan.md`)

Write the plan to the issue directory: `{output-path}/execution-plan.md`.

### Document Template

```markdown
# Execution Plan: {ISSUE_KEY} — {title}

## Context
Task: [title]
Type: Bug | Feature
AC summary: [key acceptance criteria]
Affected files: [paths]
Gotchas to watch: [from research]

## DDD Analysis
Bounded context: [name]
Cross-context: yes | no
Ubiquitous language delta: [mismatches or "None"]
Domain events: [event names or "None identified"]

## State Machine
| # | State | Transition | Guard | Test hypothesis | Test type |
|---|-------|------------|-------|-----------------|-----------|

## RED — Unit Tests
Test inventory:
- src/path/feature.test.ts
  - it("returns X when Y")
  - it.each([...])("handles boundary case %s")

## RED — Integration Tests
Test inventory:
- src/path/feature.integration.test.ts
  - it("renders list after load")

## STRIDE Threat Model
### Architecture Trust Boundaries
[List boundaries]

### Threat Analysis
| # | Threat Category | Component / Boundary | Threat Description | Severity | Mitigation Required |
|---|----------------|---------------------|-------------------|----------|---------------------|
| T1 | Spoofing | ... | ... | HIGH/MED/LOW | [mitigation] |

### Security Requirements
SR-1: [derived from threat] | Implements: T[N] | Priority: must|should|could

## GREEN — Implementation Plan
- src/path/feature.ts — add function X that does Y
- src/path/route.ts — add GET /accounts handler
```
