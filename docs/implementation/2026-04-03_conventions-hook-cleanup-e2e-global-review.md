# Implementation Plan: Conventions Hook, Pipeline Cleanup, E2E Test, Global Review Double-Pass

## Source Artifacts

| Artifact | Path |
|----------|------|
| Briefing | `docs/questioner-sessions/2026-04-03_conventions-hook-cleanup-e2e-global-review.md` |
| Design Consensus | `docs/debate-moderator-sessions/2026-04-03_conventions-hook-cleanup-e2e-global-review.md` |
| TLA+ Specification | `docs/tla-specs/conventions-hook-cleanup-e2e-global-review/` |
| TLA+ Review Consensus | `docs/debate-moderator-sessions/2026-04-03_tla-review-global-review.md` |

## TLA+ State Coverage Matrix

### States

- `"idle"` — Initial state before global review begins
- `"running"` — Actively executing a step within a pass
- `"fixing"` — PM is applying an inline fix after a step's first failure
- `"clean1"` — Pass 1 completed with all steps clean
- `"success"` — Pass 2 completed cleanly; global review passes
- `"restarting"` — Full-sequence restart triggered after a retry failure
- `"exhausted"` — fixCount reached MaxGlobalFixes; pipeline halts

### Transitions

- `StartReview` — idle -> running (enter global review, start pass 1 at step 1)
- `StepClean` — running -> running (current step passes, advance to next step)
- `LastStepCleanPass1` — running -> clean1 (last step passes on pass 1)
- `LastStepCleanPass2` — running -> success (last step passes on pass 2)
- `StartPass2` — clean1 -> running (begin pass 2 at step 1)
- `StepFailFirstAttempt` — running -> fixing (step fails with retryFlag=0)
- `ApplyInlineFix` — fixing -> running (PM fixes inline, re-runs step with retryFlag=1)
- `StepFailAfterRetry` — running -> restarting (step fails with retryFlag=1)
- `RestartSequence` — restarting -> running (fixCount+1 < MaxGlobalFixes, restart from step 1 pass 1)
- `BecomeExhausted` — restarting -> exhausted (fixCount+1 >= MaxGlobalFixes)
- `Stutter` — success/exhausted -> unchanged (terminal state stuttering)

### Safety Invariants

- `TypeOK` — All variables within their declared domains
- `FixCountBounded` — fixCount <= MaxGlobalFixes
- `Pass2RequiresCleanPass1` — passNumber=2 only reachable after clean1
- `RetryCapRespected` — retryFlag in {0, 1}
- `SuccessRequiresPass2` — success implies passNumber=2
- `ExhaustedRequiresMaxFixes` — exhausted implies fixCount=MaxGlobalFixes
- `InlineFixOnlyOnFirstFailure` — fixing implies retryFlag=0
- `NoFixWithoutRunning` — fixing implies currentStep >= 1

### Liveness Properties

- `EventualTermination` — <>(phase = "success" \/ phase = "exhausted")

---

## Implementation Steps

### Step 1: PreToolUse Hook for Conventions Injection

**Files:**
- `.claude/settings.json` (modify)

**Description:**
Add a `PreToolUse` hook entry with an `Agent` matcher that injects `.claude/skills/shared/conventions.md` as `additionalContext`. This makes every agent automatically receive shared conventions without needing an explicit read instruction in each agent file. The hook must be added BEFORE agent file cleanup (per design consensus ordering requirement) so that any mid-implementation interruption does not leave agents with no conventions.md source.

**Dependencies:** None

**Test (write first):**
In `packages/design-pipeline/src/skill-tests/pipeline-e2e.test.ts` (created in Step 7), add a dimension that validates: (1) `.claude/settings.json` has a `PreToolUse` hook entry, (2) the hook uses an `Agent` matcher, (3) the hook's `additionalContext` references `.claude/skills/shared/conventions.md`, and (4) that path resolves to an existing file on disk. For now, write a standalone assertion in the conventions-references test that validates the hook exists in settings.json and the additionalContext path is valid.

**TLA+ Coverage:**
- This step does not map to the GlobalReview.tla spec directly. It is infrastructure (hook wiring) required by the briefing scope items 1 and 4 (design consensus amendment 4: hook path validation).

---

### Step 2: Remove Conventions Read Instructions from 27 Agent Files

**Files:**
- `.claude/skills/agents/librarian/AGENT.md` (modify)
- `.claude/skills/reviewers/a11y-reviewer/AGENT.md` (modify)
- `.claude/skills/agents/expert-a11y/SKILL.md` (modify)
- `.claude/skills/project-manager/AGENT.md` (modify)
- `.claude/skills/implementation-writer/AGENT.md` (modify)
- `.claude/skills/reviewers/test-reviewer/AGENT.md` (modify)
- `.claude/skills/reviewers/backlog-reviewer/AGENT.md` (modify)
- `.claude/skills/reviewers/security-reviewer/AGENT.md` (modify)
- `.claude/skills/reviewers/type-design-reviewer/AGENT.md` (modify)
- `.claude/skills/reviewers/simplicity-reviewer/AGENT.md` (modify)
- `.claude/skills/reviewers/bug-reviewer/AGENT.md` (modify)
- `.claude/skills/reviewers/artifact-reviewer/AGENT.md` (modify)
- `.claude/skills/agents/expert-ddd/SKILL.md` (modify)
- `.claude/skills/agents/expert-atomic-design/SKILL.md` (modify)
- `.claude/skills/vitest-writer/AGENT.md` (modify)
- `.claude/skills/ui-writer/AGENT.md` (modify)
- `.claude/skills/typescript-writer/AGENT.md` (modify)
- `.claude/skills/trainer/AGENT.md` (modify)
- `.claude/skills/tla-writer/AGENT.md` (modify)
- `.claude/skills/progressive-mapper.md` (modify)
- `.claude/skills/playwright-writer/AGENT.md` (modify)
- `.claude/skills/hono-writer/AGENT.md` (modify)
- `.claude/skills/agents/expert-tla/SKILL.md` (modify)
- `.claude/skills/agents/expert-tdd/SKILL.md` (modify)
- `.claude/skills/agents/expert-performance/SKILL.md` (modify)
- `.claude/skills/agents/expert-lodash/SKILL.md` (modify)
- `.claude/skills/agents/expert-edge-cases/SKILL.md` (modify)
- `.claude/skills/agents/expert-continuous-delivery/SKILL.md` (modify)
- `.claude/skills/agents/expert-bdd/SKILL.md` (modify)

**Description:**
Atomically remove the "Read shared conventions" line (and any variant) from all 29 agent/skill files that currently contain it. Each file has a line like `Read shared conventions: \`.claude/skills/shared/conventions.md\`` near the top. Remove the entire line. The hook from Step 1 now handles conventions injection, so these explicit instructions are redundant.

**Dependencies:** Step 1

**Test (write first):**
In `packages/design-pipeline/src/skill-tests/pipeline-e2e.test.ts` (Step 7), the 7th dimension (negative cleanup assertion) scans all `.md` files under `.claude/skills/` and asserts that NONE contain a line matching `Read shared conventions` or similar variants. Additionally, update the existing `conventions-references.test.ts` to remove or invert its assertions (it currently asserts that files DO contain the reference — after cleanup, it must assert they do NOT, or be deleted in favor of the e2e test's negative assertion).

**TLA+ Coverage:**
- This step does not map to the GlobalReview.tla spec directly. It is the cleanup task from briefing scope item 2.

---

### Step 3: Remove "Feature Development Agents" Section from conventions.md

**Files:**
- `.claude/skills/shared/conventions.md` (modify)

**Description:**
Remove the "Feature Development Agents" section from conventions.md. This section references `feature-dev` skill agents (code-architect, code-explorer, code-reviewer) which are not part of the design pipeline and should not be injected into every agent's context. Per the briefing, this removal is scoped only to conventions.md.

**Dependencies:** None

**Test (write first):**
Write a test assertion that reads `.claude/skills/shared/conventions.md` and asserts it does NOT contain the string "Feature Development Agents". Also assert it does NOT contain "feature-dev:code-architect", "feature-dev:code-explorer", or "feature-dev:code-reviewer".

**TLA+ Coverage:**
- This step does not map to the GlobalReview.tla spec directly. It is briefing scope item 3.

---

### Step 4: Remove "Review Gate Quorum Formula" from conventions.md and Add Breadcrumb

**Files:**
- `.claude/skills/shared/conventions.md` (modify)

**Description:**
Remove the "Review Gate Quorum Formula" section from conventions.md. The quorum formula is now owned solely by the project-manager, which injects it at dispatch time. Per the design consensus, add a breadcrumb comment in place of the removed section: a one-line note stating that the quorum formula is now owned by `project-manager/AGENT.md`. This aids discoverability for future maintainers.

**Dependencies:** None

**Test (write first):**
Write a test assertion that reads `.claude/skills/shared/conventions.md` and asserts it does NOT contain "Review Gate Quorum Formula" as a heading. Assert it DOES contain a breadcrumb mentioning "project-manager" and "quorum". Verify the file does not contain `ceil(2n/3)` (the formula itself should live only in the project-manager).

**TLA+ Coverage:**
- This step does not map to the GlobalReview.tla spec directly. It is briefing scope item 4.

---

### Step 5: Document Double-Pass Protocol in project-manager/AGENT.md

**Files:**
- `.claude/skills/project-manager/AGENT.md` (modify)

**Description:**
Add a "Global Review Double-Pass Protocol" section to the project-manager AGENT.md that documents the full-sequence double-pass behavior verified by the TLA+ spec. This section encodes the state machine: the 3-step sequence (test -> lint -> tsc), the two-consecutive-clean-passes requirement, the per-step retry cap of 1, the full-sequence restart on second failure, and the MaxGlobalFixes(3) cap. This is the canonical runtime documentation that the project-manager agent follows during Stage 6 global review.

The protocol maps directly to the TLA+ specification's 7 states and 11 transitions:
- `idle`: PM has not started global review
- `running`: PM is executing a step (test/lint/tsc) within a pass
- `fixing`: PM is applying an inline fix after the step's first failure
- `clean1`: Pass 1 completed with all steps eventually passing
- `success`: Pass 2 completed; global review passes
- `restarting`: Full-sequence restart after a retry failure; fixCount increments
- `exhausted`: fixCount >= MaxGlobalFixes(3); pipeline halts with GLOBAL_REVIEW_EXHAUSTED

Safety properties to document as explicit rules:
- fixCount never exceeds MaxGlobalFixes (FixCountBounded)
- Pass 2 only begins after clean pass 1 (Pass2RequiresCleanPass1)
- Each step gets at most 1 inline fix per pass (RetryCapRespected, InlineFixOnlyOnFirstFailure)
- Success requires completing pass 2 (SuccessRequiresPass2)
- Exhausted only when fixCount = MaxGlobalFixes (ExhaustedRequiresMaxFixes)

**Dependencies:** None

**Test (write first):**
Write test assertions that read `project-manager/AGENT.md` and verify:
1. Contains "Global Review Double-Pass Protocol" heading
2. Contains all 7 state names: idle, running, fixing, clean1, success, restarting, exhausted
3. Contains "MaxGlobalFixes" with value "3"
4. Contains "per-step retry cap" or equivalent (retryFlag semantics)
5. Contains "test", "lint", "tsc" as the 3-step sequence
6. Contains "GLOBAL_REVIEW_EXHAUSTED" halt condition

**TLA+ Coverage:**
- State: `"idle"`, `"running"`, `"fixing"`, `"clean1"`, `"success"`, `"restarting"`, `"exhausted"`
- Transition: `StartReview`, `StepClean`, `LastStepCleanPass1`, `LastStepCleanPass2`, `StartPass2`, `StepFailFirstAttempt`, `ApplyInlineFix`, `StepFailAfterRetry`, `RestartSequence`, `BecomeExhausted`, `Stutter`
- Invariant: `TypeOK`, `FixCountBounded`, `Pass2RequiresCleanPass1`, `RetryCapRespected`, `SuccessRequiresPass2`, `ExhaustedRequiresMaxFixes`, `InlineFixOnlyOnFirstFailure`, `NoFixWithoutRunning`
- Property: `EventualTermination`

---

### Step 6: Document Double-Pass Protocol in design-pipeline/SKILL.md

**Files:**
- `.claude/skills/design-pipeline/SKILL.md` (modify)

**Description:**
Add or update documentation in the design-pipeline SKILL.md to reference the global review double-pass protocol. This provides the orchestrator-level view: after Stage 6 pair programming completes all tiers, the project-manager runs the global review double-pass before declaring Stage 6 complete. Reference the project-manager's protocol section as the canonical implementation. This ensures the pipeline skill file documents the existence of the double-pass as a Stage 6 sub-phase.

**Dependencies:** Step 5

**Test (write first):**
Write a test assertion that reads `design-pipeline/SKILL.md` and verifies it contains a reference to "double-pass" or "Global Review" in the context of Stage 6. Assert it references the project-manager as the executor of the global review.

**TLA+ Coverage:**
- This step provides the orchestrator-level documentation for the same states and transitions covered by Step 5. No new TLA+ coverage beyond Step 5.

---

### Step 7: Pipeline E2E Test with 7 Validation Dimensions

**Files:**
- `packages/design-pipeline/src/skill-tests/pipeline-e2e.test.ts` (create)

**Description:**
Create the comprehensive pipeline e2e test that validates cross-agent wiring with 7 dimensions. This is a structural test that reads the filesystem and parses markdown — no mocking, no runtime execution. It runs in milliseconds. The 7 dimensions are:

1. **Stage ordering:** Validate that the design-pipeline SKILL.md lists stages 1-7 in the correct order with correct agent assignments.
2. **Agent file existence:** For every agent referenced by the pipeline, verify its AGENT.md or SKILL.md file exists on disk.
3. **Handoff contracts:** For each agent SKILL.md/AGENT.md, verify it has a "Handoff" section, each handoff target references a file that exists on disk, and the stage-to-agent mapping is bidirectional.
4. **State transitions:** Validate that the pipeline state file template covers all stages (1-7) with Status, Artifact, and Timestamp fields.
5. **Reviewer roster:** Validate that the project-manager references all 9 reviewers (including a11y-reviewer) and the reviewer agent files exist.
6. **Stage-to-agent mapping:** Validate the bijective mapping between pipeline stages and dispatched agents.
7. **Negative cleanup assertion:** Scan all `.md` files under `.claude/skills/` and assert NONE contain a "Read shared conventions" instruction. This catches incomplete cleanup from Step 2.

Additionally, validate the PreToolUse hook (design consensus amendment 4): the hook exists in settings.json, uses an Agent matcher, its additionalContext path resolves to an existing file.

**Dependencies:** Steps 1, 2, 5

**Test (write first):**
This step IS the test. The test file itself is the deliverable. Write the test file with all 7 dimensions as separate `describe` blocks. Each dimension has multiple `it` assertions. Use the existing skill-tests as pattern reference (filesystem reads, lodash utilities, vitest assertions).

**TLA+ Coverage:**
- Invariant: `TypeOK` (structural type validation via stage ordering and state transition completeness)
- Property: `EventualTermination` (structural validation that terminal states exist and are reachable via state transition completeness)
- The negative cleanup assertion validates that the infrastructure change (hook injection replacing per-file instructions) is complete.

---

### Step 8: Update or Remove conventions-references.test.ts

**Files:**
- `packages/design-pipeline/src/skill-tests/conventions-references.test.ts` (modify)

**Description:**
The existing `conventions-references.test.ts` asserts that 11 specific agent files DO contain a conventions.md reference in their first 20 lines. After Step 2 removes these references, this test will fail. Update this test to either: (a) invert its assertions (assert files do NOT contain the reference, complementing the e2e test's negative assertion), or (b) remove the file entirely if the e2e test's dimension 7 fully subsumes it. The recommended approach is to replace the "contains a reference" assertion with a "does NOT contain a reference" assertion, and rename the describe block to clarify the intent.

**Dependencies:** Steps 2, 7

**Test (write first):**
This step modifies an existing test file. The "test" is the updated assertions themselves. After modification, running `vitest` on this file should pass with the conventions.md references removed from agent files.

**TLA+ Coverage:**
- No direct TLA+ coverage. This is test infrastructure maintenance ensuring CI remains green after cleanup.

---

## State Coverage Audit

All TLA+ states, transitions, and properties are covered by the implementation plan.

**Coverage mapping summary:**

| TLA+ Element | Type | Covered By |
|---|---|---|
| `"idle"` | State | Step 5 |
| `"running"` | State | Step 5 |
| `"fixing"` | State | Step 5 |
| `"clean1"` | State | Step 5 |
| `"success"` | State | Step 5 |
| `"restarting"` | State | Step 5 |
| `"exhausted"` | State | Step 5 |
| `StartReview` | Transition | Step 5 |
| `StepClean` | Transition | Step 5 |
| `LastStepCleanPass1` | Transition | Step 5 |
| `LastStepCleanPass2` | Transition | Step 5 |
| `StartPass2` | Transition | Step 5 |
| `StepFailFirstAttempt` | Transition | Step 5 |
| `ApplyInlineFix` | Transition | Step 5 |
| `StepFailAfterRetry` | Transition | Step 5 |
| `RestartSequence` | Transition | Step 5 |
| `BecomeExhausted` | Transition | Step 5 |
| `Stutter` | Transition | Step 5 |
| `TypeOK` | Invariant | Steps 5, 7 |
| `FixCountBounded` | Invariant | Step 5 |
| `Pass2RequiresCleanPass1` | Invariant | Step 5 |
| `RetryCapRespected` | Invariant | Step 5 |
| `SuccessRequiresPass2` | Invariant | Step 5 |
| `ExhaustedRequiresMaxFixes` | Invariant | Step 5 |
| `InlineFixOnlyOnFirstFailure` | Invariant | Step 5 |
| `NoFixWithoutRunning` | Invariant | Step 5 |
| `EventualTermination` | Property | Steps 5, 7 |

**Note on coverage concentration:** The TLA+ spec models the Global Review Double-Pass Protocol, which is entirely documented in the project-manager AGENT.md (Step 5). Steps 1-4 and 6-8 implement infrastructure changes (hook, cleanup, e2e test) that are scoped by the briefing but outside the TLA+ model. The TLA+ spec was deliberately scoped to the double-pass protocol only (the most state-heavy and termination-critical component). All other scope items are verified by the e2e test (Step 7) at the structural level.

---

## Execution Tiers

### Tier 1: Independent Foundation (no dependencies between tasks)

Steps 1, 3, 4, and 5 have no inter-dependencies. They modify different files and can execute in parallel. Step 1 modifies settings.json, Steps 3-4 modify different sections of conventions.md (but same file -- must be serialized; see note below), and Step 5 modifies project-manager/AGENT.md.

**File overlap note:** Steps 3 and 4 both modify `.claude/skills/shared/conventions.md`. To avoid race conditions, they are combined into a single task (T2) assigned to one agent pair.

| Task ID | Step | Title |
|---------|------|-------|
| T1 | Step 1 | PreToolUse Hook for Conventions Injection |
| T2 | Steps 3 + 4 | Remove Feature Dev Section + Quorum Section from conventions.md |
| T3 | Step 5 | Document Double-Pass Protocol in project-manager/AGENT.md |

### Tier 2: Dependent Cleanup (depends on Tier 1 -- hook must exist before removing instructions)

Step 2 depends on Step 1 (hook must be in place before removing the per-file instructions). Step 6 depends on Step 5 (PM protocol must be documented before the SKILL.md references it).

| Task ID | Step | Title |
|---------|------|-------|
| T4 | Step 2 | Remove Conventions Read Instructions from 29 Agent Files |
| T5 | Step 6 | Document Double-Pass Protocol in design-pipeline/SKILL.md |

### Tier 3: E2E Validation (depends on Tiers 1 and 2 -- all changes must be complete before validation)

Steps 7 and 8 depend on Steps 1, 2, and 5. The e2e test validates the final state of all prior changes. The conventions-references test update depends on Step 2's cleanup being complete.

| Task ID | Step | Title |
|---------|------|-------|
| T6 | Step 7 | Pipeline E2E Test with 7 Validation Dimensions |
| T7 | Step 8 | Update conventions-references.test.ts |

---

## Task Assignment Table

| Task ID | Title | Tier | Code Writer | Test Writer | Dependencies | Rationale |
|---------|-------|------|-------------|-------------|--------------|-----------|
| T1 | PreToolUse Hook for Conventions Injection | 1 | trainer-writer | vitest-writer | None | Hook is a .claude/settings.json artifact; trainer-writer owns all .claude/ directory files. |
| T2 | Remove Feature Dev + Quorum Sections from conventions.md | 1 | trainer-writer | vitest-writer | None | conventions.md lives under .claude/skills/shared/; trainer-writer owns .claude/ artifacts. |
| T3 | Document Double-Pass Protocol in project-manager/AGENT.md | 1 | trainer-writer | vitest-writer | None | AGENT.md is a .claude/ skill artifact; the protocol documentation maps all TLA+ states. |
| T4 | Remove Conventions Read Instructions from 29 Agent Files | 2 | trainer-writer | vitest-writer | T1 | All 29 files are .claude/ skill/agent artifacts; trainer-writer handles the atomic removal. |
| T5 | Document Double-Pass in design-pipeline/SKILL.md | 2 | trainer-writer | vitest-writer | T3 | SKILL.md is a .claude/ pipeline artifact; references T3's protocol section. |
| T6 | Pipeline E2E Test with 7 Validation Dimensions | 3 | vitest-writer | vitest-writer | T1, T4, T3 | The deliverable IS the test file; vitest-writer is both code and test writer for pure test artifacts. |
| T7 | Update conventions-references.test.ts | 3 | vitest-writer | vitest-writer | T4, T6 | Existing test file update; vitest-writer owns test modifications. |

**Note on T6 and T7 pairing:** The pairing rule requires exactly 1 code writer + 1 test writer. For tasks where the deliverable IS a test file, the vitest-writer serves as both the code writer (writing the test code) and test writer (the test validates itself by passing). This is the standard pattern for pure test-file tasks in this pipeline.
