---
description: "End-to-end enterprise SDLC pipeline (SWEBOK v4 / ISO 12207): Concept → Maintenance Triage (defects) → Requirements → Architecture+STRIDE Threat Model → TDD Red/Green → Verification (SonarCloud gate + OWASP review + DDD refactor) → Transition (wrangler/GHA artifacts + traceability report). Use for all production feature and maintenance work."
name: tdd
---

# SWEBOK Enterprise Lifecycle Pipeline v2

A multi-agent, enterprise-grade software development lifecycle (SDLC) pipeline based on IEEE SWEBOK v4.0 and ISO/IEC/IEEE 12207 Technical Processes. Integrates Test-Driven Development (TDD), Domain-Driven Design (DDD), DevSecOps (STRIDE + OWASP), and software quality measurement within a formal engineering process.

The main agent orchestrates specialized subagents (via `define_subagent` and `invoke_subagent`), produces native artifacts for approval gates (via `write_to_file` with `ArtifactMetadata`), and coordinates work through `send_message`. Follow every stage in order — do not skip or abbreviate.

**Mandatory user gates:** Stage 2 (Requirements Validation) and Stage 3 (Design + Threat Model Verification). Both use artifacts with `RequestFeedback: true`.

**Automatic hard gates:** Stage 5 SonarCloud quality gate and Security OWASP review — pipeline must not advance to Stage 6 if either fails.

> **Alternative invocation modes:**
> - For large multi-file tasks, use `/teamwork-preview` to launch a full autonomous team.
> - For unattended overnight execution, combine with `/goal`.

---

## Stage 1: Concept Phase (Business Analysis & Stakeholder Needs)

**ISO/IEC/IEEE 12207: 6.4.1 Business or mission analysis, 6.4.2 Stakeholder needs definition**
**SWEBOK KA: Software Engineering Management, Software Engineering Economics**

Use the `/grill-me` slash command to interview the user. Identify:
- The business problem or mission need
- Stakeholders and their success criteria
- Constraints (time, budget, compliance, platform)
- Initial risks

**Defect detection:** If the task is a bug or contains the words "defect", "regression", "fix", or "incident" — flag it as `TYPE: Maintenance` and proceed to **Stage 1.5** before Stage 2. Otherwise, set `TYPE: Feature` and skip Stage 1.5.

If additional clarification is needed, use `ask_question` — one question at a time, recommended option first.

Summarize back to the user: mission objective, stakeholder needs, technology context, linked issues. Ask: "Does this look right?" Wait for confirmation.

> Produces: `BUSINESS_OBJECTIVE`, `STAKEHOLDER_NEEDS`, `TECH_CONTEXT`, `TASK_TYPE`

---

## Stage 1.5: Maintenance Triage (Defects & Corrective Work Only)

**ISO/IEC/IEEE 12207: 6.4.13 Maintenance**
**SWEBOK KA: Software Maintenance (Ch 7), Engineering Foundations**

**Skip this stage if `TASK_TYPE = Feature`.**

Apply SWEBOK Ch 7 maintenance classification. Categorize the work as exactly one of:
- **Corrective** — fixing a confirmed fault (bug)
- **Adaptive** — modifying software to work in a changed environment (dependency upgrade, API change)
- **Perfective** — improving performance or maintainability without changing behavior
- **Preventive** — proactively reducing future fault risk (refactor, hardening)

Then perform Root Cause Analysis using the [rca](resources/rca.md) and [rca-five-whys](resources/rca-five-whys.md) resources:
- Separate the reported symptom from the underlying fault
- Run the 5-Whys to trace the fault to its origin
- Scan git history for the introducing commit
- Identify all affected components (ripple analysis)

> Produces: `MAINTENANCE_CLASS`, `RCA_FINDINGS`, `AFFECTED_COMPONENTS`

---

## Stage 2: Development Phase — Requirements (Software Requirements Definition)

**ISO/IEC/IEEE 12207: 6.4.3 System/software requirements definition**
**SWEBOK KA: Software Requirements (Ch 1), Software Engineering Professional Practice (Ch 14)**

Fan out research in parallel using `invoke_subagent` (research type):

- **Subagent A — Context:** For each linked issue, fetch and summarize. Follow external URLs (docs, RFCs, design docs) via `search_web` and `read_url_content`.
- **Subagent B — Code Analysis:** Trace data flow end-to-end for affected code paths.
  - Frontend: components → hooks → query client → fetch → API route
  - Workers: route handler → middleware → service → repository → D1/KV/R2

Load and follow the [requirements-analyst](resources/requirements-analyst.md) resource. Apply SWEBOK Ch 1 (requirements elicitation, analysis, specification, validation) and Ch 14 (ethics, privacy, compliance). For `TYPE: Maintenance` tasks, feed `RCA_FINDINGS` in as authoritative context — requirements must address the root cause, not the symptom.

Load and follow the [requirements-writer](resources/requirements-writer.md) resource to produce the specification.

**Produce the Software Requirements Specification (SRS) as a native CLI artifact:**

Use `write_to_file` to create `requirements.md` in the artifact directory with:
- `ArtifactMetadata.UserFacing: true`
- `ArtifactMetadata.RequestFeedback: true`
- `ArtifactMetadata.Summary`: full summary of all FRs, NFRs, implicit requirements, compliance findings, and state machine.

**This is a hard gate.** Wait for user approval. Rework and re-present on feedback until approved.

> Produces: `requirements.md` (native artifact, user-approved)

---

## Stage 3: Development Phase — Architecture & Design + Threat Modeling

**ISO/IEC/IEEE 12207: 6.4.4 Architecture definition, 6.4.5 Design definition**
**SWEBOK KA: Software Architecture (Ch 2), Software Design (Ch 3), Computing Foundations / Security (Ch 13)**

**Fan out two subagents in parallel:**

**Subagent A — Planner (Architecture & Design):**
Load and follow the [planner](resources/planner.md) resource. Apply SWEBOK Ch 2 (Software Architecture) and Ch 3 (Software Design). Define architecture and detailed design using DDD strategic patterns (see [ddd-strategic](resources/ddd-strategic.md)). Derive the behavioral model via state machine table (see [tdd-state-coverage](resources/tdd-state-coverage.md)). Formulate the unit and integration test inventories.

For Cloudflare features: load the `cloudflare` skill to select the correct platform products (KV vs D1 vs R2, Workers vs Pages, Durable Objects, etc.) and then load the `workers-best-practices` skill to validate the detailed architectural decisions against production Workers patterns before presenting the plan.

**Subagent B — Security Analyst (STRIDE Threat Modeling):**
Load and follow the [security-analyst](resources/security-analyst.md) resource in **Stage 3 mode**. Perform STRIDE threat modeling across all trust boundaries identified in the architecture. Produce the `THREAT_MODEL` including security requirements (SR-N) that must be addressed in Stage 4.

Wait for both subagents to report back before continuing.

Before presenting, verify the plan includes at least one test and the threat model has no unmitigated CRITICAL threats.

**Produce the Architecture, Design & Security Plan as a native CLI artifact:**

Use `write_to_file` to create `execution-plan.md` in the artifact directory with:
- `ArtifactMetadata.UserFacing: true`
- `ArtifactMetadata.RequestFeedback: true`
- `ArtifactMetadata.Summary`: architecture decisions, DDD analysis, state machine, test inventory, implementation plan, and STRIDE threat model summary.

**This is a hard gate.** Wait for the user to click **Proceed** before writing any code. Everything above is read-only; first write happens only after approval.

> Produces: `execution-plan.md` (native artifact), `THREAT_MODEL`

---

## Stage 4: Development Phase — Construction & Integration (TDD Red/Green)

**ISO/IEC/IEEE 12207: 6.4.7 Implementation, 6.4.8 Integration**
**SWEBOK KA: Software Construction (Ch 4), Software Testing (Ch 5)**

Apply SWEBOK Ch 4 (Software Construction) using Test-Driven Development.

**RED — Test Construction:**
Use `define_subagent` to create a **test-writer** subagent. Include the [test-writer](resources/test-writer.md) role instructions, along with [tdd-principles](resources/tdd-principles.md) and [tdd-test-as-documentation](resources/tdd-test-as-documentation.md). Feed the approved test inventory plus any security requirements (SR-N) from the `THREAT_MODEL` that require test coverage.

The subagent writes unit and integration tests. When it reports back, verify RED:
`pnpm --filter <package> exec vitest run <path/to/file.test.ts> --no-coverage`

Every test must fail for the *right* reason — an assertion about missing behavior, not a setup or import error. Send corrections back to the subagent if not.

> Produces: `TEST_WRITER_RED_RESULTS`

**GREEN — Code Construction & Integration:**
**Checkpoint:** confirm tests are failing correctly before writing any production code.

Use `define_subagent` to create an **implementer** subagent. Include the [implementer](resources/implementer.md) role instructions. Feed `TEST_WRITER_RED_RESULTS` plus the STRIDE security mitigations from `THREAT_MODEL`. The subagent writes minimum production code to make all tests pass, integrating the components and implementing STRIDE mitigations.

When it reports back, verify GREEN:
- `pnpm --filter <package> exec vitest run <path/to/file.test.ts>`
- `pnpm --filter <package> test`

> Produces: `GREEN_RESULTS`

---

## Stage 5: Production Phase — Verification & Validation

**ISO/IEC/IEEE 12207: 6.4.9 Verification, 6.4.11 Validation**
**SWEBOK KA: Software Quality (Ch 12), Software Testing (Ch 5), Software Engineering Measurement (Ch 8), Computing Foundations / Security (Ch 13)**

With tests green, first commit the changes, push them to a remote PR branch, and wait for the remote CI pipeline/checks to finish before checking for Sonar issues.

Define and fan out relevant subagent reviewers in parallel. In addition to the three listed below, dynamically create other domain-specific review subagents as needed:

**Subagent A — Quality Analyst (Measurement & Quality Gate):**
Load and follow the [quality-analyst](resources/quality-analyst.md) resource. Run SonarCloud quality gate check, validate test coverage (100% on new/changed code), perform validation traceability against the approved `requirements.md`. For frontend features, apply the `web-perf` skill to audit Core Web Vitals.

**Subagent B — Security Analyst (OWASP Top 10 Review):**
Load and follow the [security-analyst](resources/security-analyst.md) resource in **Stage 5 mode**. Review all changed files against OWASP Top 10. Verify every HIGH and CRITICAL STRIDE mitigation from the `THREAT_MODEL` was implemented in Stage 4.

**Subagent C — DDD Refactoring (Software Maintenance):**
Load and follow the [ddd-tactical](resources/ddd-tactical.md) resource. Review the GREEN code and identify refactoring opportunities: CQRS separation, Specification Pattern (3+ condition guards), branded Value Objects, past-tense Domain Event naming, dead code elimination, and complexity reduction. Apply improvements while keeping tests green; re-run `pnpm --filter <package> test` after each change.

Wait for all reviewers to report back.

**Automatic hard gates (non-negotiable before Stage 6):**
1. **SonarCloud quality gate must be PASS** — if FAIL, identify and fix issues, re-run until green.
2. **OWASP Security review must PASS** — if CRITICAL or HIGH findings remain, fix them and re-run. Confirm STRIDE mitigations are all verified.

If any issues, bugs, code smells, or security vulnerabilities are found during Stage 5, write failing red tests for those issues and return to Stage 4 to implement fixes.

> Produces: `QUALITY_ANALYSIS`, `OWASP_REVIEW`, `REFACTORED_CODE`

---

## Stage 6: Utilization & Support Phase (Transition & Maintenance Handoff)

**ISO/IEC/IEEE 12207: 6.4.10 Transition, 6.4.12 Operation, 6.4.13 Maintenance**
**SWEBOK KA: Software Engineering Operations (Ch 10), Software Maintenance (Ch 7)**

Prepare the software for transition to the operational environment.

**Generate transition artifacts using installed skills:**

1. **Deployment configuration:** Load the `wrangler` skill to generate a correctly-formed `wrangler.jsonc` configuration stub and a GitHub Actions workflow YAML (`.github/workflows/<feature-name>.yml`) targeting this monorepo's Cloudflare deployment pattern. Present these as inline code blocks for the user to review and integrate.

2. **Final transition report** — provide inline to the user:

```
TRANSITION_REPORT:

## Stakeholder Needs Satisfaction (Validation)
For each STAKEHOLDER_NEED from Stage 1: [need] → satisfied by [FR-N] → verified by [test name] ✅/❌

## Requirements Traceability (Verification)
For each FR-N: [requirement] → implemented in [file] → covered by [test] → SonarCloud: [pass/fail] ✅/❌

## Security Summary
STRIDE threats identified: [N] | Mitigated: [N] | Deferred: [N]
OWASP findings: [N] CRITICAL | [N] HIGH | [N] MEDIUM | [N] LOW resolved

## Quality Gate Summary
SonarCloud: PASSED | Coverage: [X%] | Bugs: [N] | Vulnerabilities: [N] | Tech Debt Rating: [A-E]

## Deployment Artifacts Generated
- wrangler.jsonc stub: [inline or file path]
- GitHub Actions workflow: [inline or file path]

## Maintenance Handoff
Maintenance class (if applicable): Corrective | Adaptive | Perfective | Preventive
Technical debt deferred: [list or "None"]
Recommended next maintenance actions: [list]
```

---
