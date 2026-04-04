# Implementation Plan: PlantUML Enforcement, Freeform Questioner, Librarian Agent, Accessibility Expert/Reviewer

## Source Artifacts

| Artifact | Path |
|----------|------|
| Briefing | `docs/questioner-sessions/2026-04-03_plantuml-questioner-librarian-a11y.md` |
| Design Consensus | `docs/debate-moderator-sessions/2026-04-03_plantuml-questioner-librarian-a11y-design.md` |
| TLA+ Specification | `docs/tla-specs/plantuml-questioner-librarian-a11y/PipelineEnhancements.tla` |
| TLA+ Review Consensus | `docs/debate-moderator-sessions/2026-04-03_tla-re-review-plantuml-questioner-librarian-a11y.md` |

## TLA+ State Coverage Matrix

### States

Pipeline stage values (`pipelineStage`):
- `1` -- Stage 1 Questioner
- `2` -- Stage 2 Expert selection and debate
- `3` -- Stage 3 TLA+ specification (abstracted in AdvanceMiddleStages)
- `4` -- Stage 4 TLA+ review (abstracted in AdvanceMiddleStages)
- `5` -- Stage 5 Implementation planning (abstracted in AdvanceMiddleStages)
- `6` -- Stage 6 Review gate
- `7` -- Stage 7 Fork-join (PlantUML + Librarian)
- `8` -- Done (pipeline complete)

Questioner states:
- `questionerDone = FALSE` -- questioner active
- `questionerDone = TRUE` -- questioner finished
- `completenessChecked = FALSE` -- completeness check not yet run
- `completenessChecked = TRUE` -- completeness check passed (or forced at MaxTurns)

Review gate states:
- `reviewGatePassed = FALSE` -- gate not yet passed
- `reviewGatePassed = TRUE` -- quorum reached, gate passed

Stage 7 fork-join states:
- `plantumlDone = FALSE` -- PlantUML not yet complete
- `plantumlDone = TRUE` -- PlantUML complete
- `librarianDone = FALSE` -- librarian not yet complete
- `librarianDone = TRUE` -- librarian complete
- `stage7Committed = FALSE` -- atomic commit not yet made
- `stage7Committed = TRUE` -- atomic commit complete

Librarian index states (`librarianIndex`):
- `"valid"` -- index is current and correct
- `"stale"` -- index is outdated but structurally sound
- `"partial"` -- index has incomplete entries
- `"corrupt"` -- index is unreadable or malformed

Librarian split states:
- `librarianSplit = FALSE` -- no split has occurred
- `librarianSplit = TRUE` -- category file exceeded SplitThreshold and was split

Topic kind values (`topicKind`):
- `"frontend"` -- a11y expert relevant
- `"backend"` -- a11y expert not relevant
- `"mixed"` -- a11y expert relevant

Deployment states:
- `quorumDeployed = FALSE` -- quorum formula + a11y reviewer not yet deployed
- `quorumDeployed = TRUE` -- deployed atomically
- `deployedItems` subsets of `{"quorum_formula", "a11y_reviewer", "plantuml", "librarian", "questioner"}`

### Transitions

1. `QuestionerAsk` -- questioner takes a freeform turn (increments questionerTurns)
2. `QuestionerCompletenessCheck` -- questioner runs self-check for gaps
3. `QuestionerFinishVoluntary` -- questioner finishes after completeness check, advances to stage 2
4. `QuestionerForceStop` -- questioner hits MaxTurns hard cap, forced to stage 2
5. `SelectExperts` -- selects experts for debate; includes a11y expert when topic is frontend/mixed
6. `AdvanceMiddleStages` -- advances pipeline through stages 2-5 (abstracted)
7. `SubmitReview(r)` -- a reviewer submits their review at stage 6
8. `PassReviewGate` -- review gate passes when quorum reached (ceil(2n/3)), advances to stage 7
9. `PlantUMLComplete` -- PlantUML diagram step completes in stage 7
10. `LibrarianUpdate` -- librarian updates index with token tracking and conditional split
11. `LibrarianConsultWithDegradedIndex` -- librarian handles stale/partial/corrupt index gracefully
12. `Stage7Commit` -- atomic commit after both PlantUML and librarian complete, advances to stage 8
13. `DeployQuorumAndA11y` -- deploys quorum formula and a11y reviewer atomically at stage 8

### Safety Invariants

1. `TypeOK` -- all variables within declared type bounds
2. `QuorumFloorGuard` -- when n >= 1, quorum >= 1 (no vacuous gate passage)
3. `QuorumAtTwoIsUnanimity` -- at n=2, quorum=2 (documented intentional unanimity)
4. `QuestionerBounded` -- questionerTurns <= MaxTurns
5. `QuestionerCompletenessRequired` -- questionerDone implies completenessChecked
6. `Stage7AtomicCommit` -- stage7Committed implies both plantumlDone and librarianDone
7. `AtomicQuorumDeployment` -- quorum_formula and a11y_reviewer always deployed together
8. `A11ySelectionCriteria` -- a11y expert selected when topic is frontend-relevant
9. `ReviewGateNonVacuous` -- reviewGatePassed implies at least 1 review submitted
10. `QuestionerMinOneQuestion` -- questionerDone implies questionerTurns >= 1
11. `DeploymentRequiresReviewGate` -- quorumDeployed implies reviewGatePassed

### Liveness Properties

1. `QuestionerTerminates` -- questioner eventually finishes (<>(questionerDone))
2. `PipelineCompletes` -- pipeline eventually reaches stage 8 (<>(pipelineStage = 8))
3. `ForkJoinCompletes` -- after both tasks done, commit eventually happens ((plantumlDone /\ librarianDone) ~> stage7Committed)
4. `StageMonotonicity` -- pipeline stage never decreases ([][pipelineStage' >= pipelineStage]_pipelineStage)

---

## Implementation Steps

### Step 1: Quorum formula as pure function with floor guard

**Files:**
- `.claude/skills/shared/quorum.md` (create)

**Description:**
Define the quorum formula `ceil(2n/3)` with the precondition `n >= 1` as a shared specification owned by the review gate. This is the formula that the design-pipeline orchestrator and all reviewers reference. The formula is documented as a Markdown specification (not executable code) because the pipeline is agent-driven, not compiled. Includes the documented n=2 unanimity behavior per amendment 8.

**Dependencies:** None

**Test (write first):**
Write a vitest test at `docs/tla-specs/plantuml-questioner-librarian-a11y/quorum.test.ts` that imports a pure TypeScript function `quorum(n: number): number` from a companion file, and asserts: quorum(1)=1, quorum(2)=2, quorum(3)=2, quorum(8)=6, quorum(9)=6. Also assert that quorum(0) throws an error (floor guard). This test validates the formula before the specification is written into agent artifacts.

**TLA+ Coverage:**
- Helper: `Quorum(n)`
- Invariant: `QuorumFloorGuard`
- Invariant: `QuorumAtTwoIsUnanimity`

---

### Step 2: Freeform questioner SKILL.md rewrite

**Files:**
- `.claude/skills/questioner/SKILL.md` (modify)

**Description:**
Replace the fixed 10-branch decision tree (Purpose, Artifact type, Trigger, Inputs, Outputs, Ecosystem placement, Handoff, Error states, Naming, Scope) with freeform discovery. Retain structural rules: one question per message with recommendation, resolve upstream before downstream, Phase 1/2/3/4 lifecycle (Orient, Question, Sign-Off, Save-and-Dispatch). Add completeness check before sign-off: the questioner reviews accumulated answers and asks itself whether any obvious dimension was never addressed. Add hard turn cap (MaxTurns, configurable, default 50). At MaxTurns, the questioner must stop and proceed to sign-off regardless of completeness.

**Dependencies:** None

**Test (write first):**
Write a vitest test that reads the questioner SKILL.md file contents and asserts: (a) no mention of the fixed decision tree branches as mandatory ordered steps, (b) presence of "completeness check" or "completeness self-check" text, (c) presence of a hard turn cap with a numeric value, (d) retention of "one question per message" rule, (e) retention of Phase 1/2/3/4 lifecycle names.

**TLA+ Coverage:**
- Transition: `QuestionerAsk`
- Transition: `QuestionerCompletenessCheck`
- Transition: `QuestionerFinishVoluntary`
- Transition: `QuestionerForceStop`
- Invariant: `QuestionerBounded`
- Invariant: `QuestionerCompletenessRequired`
- Invariant: `QuestionerMinOneQuestion`
- Liveness: `QuestionerTerminates`

---

### Step 3: Expert-a11y SKILL.md (debate expert)

**Files:**
- `.claude/skills/agents/expert-a11y/SKILL.md` (create)

**Description:**
Create the accessibility expert agent that participates in debate stages (Stage 2 design debate, Stage 4 TLA+ review). Expertise: WCAG 2.2 AA baseline + WAI-ARIA 1.2 component patterns. References WCAG success criteria by number and cites ARIA Authoring Practices Guide. Follows the same SKILL.md structure as existing experts (expert-ddd, expert-tla, etc.). Conditional selection: the debate-moderator selects this expert when the topic involves UI/frontend components.

**Dependencies:** None

**Test (write first):**
Write a vitest test that reads the expert-a11y SKILL.md and asserts: (a) file exists at the expected path, (b) contains "WCAG 2.2" and "AA" references, (c) contains "WAI-ARIA 1.2" reference, (d) follows the standard expert SKILL.md frontmatter schema (name, description fields), (e) does not claim to be a reviewer (it is an expert, not a reviewer).

**TLA+ Coverage:**
- Transition: `SelectExperts` (a11y expert in expert pool)
- Invariant: `A11ySelectionCriteria`
- State: `topicKind` values ("frontend", "mixed" trigger inclusion)

---

### Step 4: A11y-reviewer AGENT.md (review gate reviewer)

**Files:**
- `.claude/skills/reviewers/a11y-reviewer/AGENT.md` (create)

**Description:**
Create the 9th reviewer agent that participates in Stage 6 review gate. Evaluates implementation diffs for WCAG 2.2 AA compliance and WAI-ARIA 1.2 pattern correctness. Follows the same AGENT.md structure as existing reviewers (artifact-reviewer, security-reviewer, etc.). Reports PASS/FAIL verdict with scope (SESSION_DIFF or OUT_OF_SCOPE for non-UI changes).

**Dependencies:** None

**Test (write first):**
Write a vitest test that reads the a11y-reviewer AGENT.md and asserts: (a) file exists at the expected path, (b) contains "WCAG 2.2" and "AA" references, (c) contains "WAI-ARIA 1.2" reference, (d) follows the standard reviewer AGENT.md frontmatter schema, (e) mentions PASS/FAIL verdict output, (f) mentions OUT_OF_SCOPE for non-UI diffs.

**TLA+ Coverage:**
- Transition: `SubmitReview(r)` (a11y reviewer as a member of Reviewers set)
- Transition: `PassReviewGate` (a11y reviewer contributes to quorum count)
- Invariant: `ReviewGateNonVacuous`

---

### Step 5: Quorum formula and reviewer roster atomic update

**Files:**
- `.claude/skills/design-pipeline/SKILL.md` (modify)
- `.claude/skills/shared/conventions.md` (modify)

**Description:**
Update the design-pipeline orchestrator to use the quorum formula `ceil(2n/3)` instead of the fixed quorum of 5. Update the reviewer roster from 8 to 9 (adding a11y-reviewer). Both changes must occur in the same step (atomic deployment per amendment 5). Update shared conventions to document the quorum formula ownership in the review gate specification. Document that at n=2, ceil(4/3)=2 requires unanimity (amendment 8).

**Dependencies:** Step 1, Step 4

**Test (write first):**
Write a vitest test that: (a) reads the design-pipeline SKILL.md and asserts the reviewer list contains exactly 9 entries including "a11y-reviewer", (b) asserts presence of quorum formula "ceil(2n/3)" or equivalent description, (c) asserts no hardcoded quorum value of 5 remains, (d) reads shared conventions and asserts quorum formula documentation exists with n=2 unanimity note.

**TLA+ Coverage:**
- Invariant: `AtomicQuorumDeployment`
- Transition: `DeployQuorumAndA11y`
- State: `quorumDeployed = TRUE`
- State: `deployedItems` containing both "quorum_formula" and "a11y_reviewer"
- Invariant: `DeploymentRequiresReviewGate`

---

### Step 6: Debate-moderator expert selection criteria for a11y

**Files:**
- `.claude/skills/orchestrators/debate-moderator/SKILL.md` (modify)

**Description:**
Update the debate-moderator's expert selection logic (`selectExperts(topic)`) to include defined criteria for when expert-a11y is selected. Selection triggers: topic involves UI components, frontend rendering, user interaction patterns, or accessibility concerns. When the topic is purely backend (database, API logic, infrastructure), expert-a11y is not selected. When the topic is mixed (backend + frontend), expert-a11y is included. These criteria make the selection testable per amendment 6.

**Dependencies:** Step 3

**Test (write first):**
Write a vitest test that reads the debate-moderator SKILL.md and asserts: (a) expert-a11y appears in the expert selection section, (b) selection criteria keywords are present (e.g., "UI", "frontend", "component", "accessibility"), (c) exclusion criteria for backend-only topics are documented, (d) mixed-scope inclusion is documented.

**TLA+ Coverage:**
- Transition: `SelectExperts`
- Invariant: `A11ySelectionCriteria`
- Helper: `A11yRelevant(tk)` -- frontend/mixed triggers inclusion

---

### Step 7: Librarian agent AGENT.md

**Files:**
- `.claude/skills/agents/librarian/AGENT.md` (create)

**Description:**
Create the librarian agent definition. Role: maintain a dense, machine-readable codebase index at `docs/librarian/`. The index follows a Shared Kernel pattern (amendment 4) with a defined contract: Markdown table schema with columns Path, Kind, Summary, Updated. Root file: `docs/librarian/INDEX.md` (the index of category sub-files). Split threshold: configurable, default 2,000 tokens per category file (amendment 7). When a category file exceeds the threshold, the librarian splits it into narrower sub-categories and updates INDEX.md. The agent handles stale/partial/corrupt index gracefully by falling back to direct file reads. Committed to git. Runs at Stage 7 of the pipeline, parallel with PlantUML.

**Dependencies:** None

**Test (write first):**
Write a vitest test that reads the librarian AGENT.md and asserts: (a) file exists, (b) mentions "Shared Kernel" pattern, (c) defines Markdown table schema with columns Path, Kind, Summary, Updated, (d) specifies split threshold as configurable with default value, (e) describes graceful degradation for stale/partial/corrupt index states, (f) references `docs/librarian/INDEX.md` as root file.

**TLA+ Coverage:**
- Transition: `LibrarianUpdate`
- Transition: `LibrarianConsultWithDegradedIndex`
- State: `librarianIndex` values ("valid", "stale", "partial", "corrupt")
- State: `librarianSplit` (TRUE when tokens > SplitThreshold)
- State: `librarianTokens` tracking

---

### Step 8: Librarian index seed files

**Files:**
- `docs/librarian/INDEX.md` (create)
- `docs/librarian/packages.md` (create)
- `docs/librarian/skills.md` (create)

**Description:**
Create the initial librarian index structure. INDEX.md is the root file listing all category sub-files. Each category sub-file is a Markdown table with columns: Path, Kind, Summary, Updated. Start with two categories (packages, skills) populated with current repository entries. This provides the initial "valid" state for the librarian index. The old internal_map file (if any) is deleted and zero references remain.

**Dependencies:** Step 7

**Test (write first):**
Write a vitest test that: (a) reads `docs/librarian/INDEX.md` and asserts it contains a table with at least two category entries (packages, skills), (b) reads `docs/librarian/packages.md` and asserts it contains a Markdown table with headers Path, Kind, Summary, Updated, (c) reads `docs/librarian/skills.md` and asserts the same schema, (d) asserts no file in `.claude/` references "internal_map".

**TLA+ Coverage:**
- State: `librarianIndex = "valid"` (initial valid state)
- State: `librarianTokens = 0` (initial state before update)

---

### Step 9: Shared conventions -- librarian consult-first pattern

**Files:**
- `.claude/skills/shared/conventions.md` (modify)

**Description:**
Add the "consult first" instruction to shared conventions: before performing broad file searches, agents should consult `docs/librarian/INDEX.md` to locate relevant category files. This is advisory, not blocking -- if the index is missing or corrupt, agents fall back to direct file reads. Document the librarian as an explicit Shared Kernel with the Markdown table schema as its contract (amendment 4). The pattern is added to shared conventions (not per-agent) per the briefing.

**Dependencies:** Step 7, Step 8

**Test (write first):**
Write a vitest test that reads shared conventions and asserts: (a) presence of "consult first" or "consult-first" instruction, (b) reference to `docs/librarian/INDEX.md`, (c) mention of fallback to direct file reads when index is unavailable, (d) mention of "Shared Kernel" as the named pattern.

**TLA+ Coverage:**
- Transition: `LibrarianConsultWithDegradedIndex` (graceful degradation)
- State: `librarianIndex` degraded states handled via fallback

---

### Step 10: Stage 7 in design-pipeline orchestrator

**Files:**
- `.claude/skills/design-pipeline/SKILL.md` (modify)

**Description:**
Add Stage 7 to the design-pipeline orchestrator. Stage 7 runs after Stage 6 completes (review gate passed). It is a fork-join: PlantUML diagram update and librarian index update run in parallel. Both must complete before a single atomic commit is made (amendment 3). Neither task blocks pipeline COMPLETE status on failure -- PlantUML failure is non-fatal (diagram is informational) and librarian failure falls back to direct reads. The commit strategy: both tasks stage their changes, then a single commit is made after the fork-join completes. Update the pipeline state machine, stage descriptions, and the PlantUML diagram section of SKILL.md.

**Dependencies:** Step 5, Step 7

**Test (write first):**
Write a vitest test that reads the design-pipeline SKILL.md and asserts: (a) Stage 7 exists with "PlantUML" and "librarian" as parallel tasks, (b) fork-join pattern is described (both must complete before commit), (c) single atomic commit strategy is documented, (d) pipeline stage count is 7 (not 6), (e) Stage 7 follows Stage 6 in the stage sequence, (f) error states document non-fatal failure for both tasks.

**TLA+ Coverage:**
- Transition: `PlantUMLComplete`
- Transition: `LibrarianUpdate`
- Transition: `LibrarianConsultWithDegradedIndex`
- Transition: `Stage7Commit`
- Invariant: `Stage7AtomicCommit`
- Liveness: `ForkJoinCompletes`
- State: `pipelineStage = 7`
- State: `pipelineStage = 8`
- Liveness: `PipelineCompletes`
- Liveness: `StageMonotonicity`

---

### Step 11: Delete old internal_map references

**Files:**
- Various files in `.claude/` (modify -- remove references to internal_map)

**Description:**
Search the entire `.claude/` directory for any references to "internal_map" or the old internal map file. Remove all references. The librarian index at `docs/librarian/` replaces this mechanism. Verify zero references remain after cleanup.

**Dependencies:** Step 8

**Test (write first):**
Write a vitest test that recursively reads all files in `.claude/` and asserts none contain the string "internal_map" (case-insensitive).

**TLA+ Coverage:**
- State: `librarianIndex = "valid"` (the librarian index replaces internal_map; no stale references should exist)

---

### Step 12: Quorum formula companion TypeScript function

**Files:**
- `docs/tla-specs/plantuml-questioner-librarian-a11y/quorum.ts` (create)

**Description:**
Create the companion TypeScript implementation of the quorum formula for use by the vitest test in Step 1. This is a pure function: `export function quorum(n: number): number` that computes `Math.ceil((2 * n) / 3)` with a precondition check that throws if `n < 1`. This file lives alongside the TLA+ spec as a reference implementation, not as production runtime code.

**Dependencies:** None

**Test (write first):**
The test from Step 1 (`quorum.test.ts`) is the test for this step. It is written first and this implementation makes it pass.

**TLA+ Coverage:**
- Helper: `Quorum(n)`
- Invariant: `QuorumFloorGuard`
- Invariant: `QuorumAtTwoIsUnanimity`

---

## State Coverage Audit

### States -- Verification

| State | Covered By |
|-------|-----------|
| `pipelineStage = 1` | Step 2 (questioner) |
| `pipelineStage = 2` | Step 6 (expert selection) |
| `pipelineStage = 3..5` | Step 10 (AdvanceMiddleStages is abstracted; pipeline SKILL.md already defines these) |
| `pipelineStage = 6` | Step 5 (review gate quorum) |
| `pipelineStage = 7` | Step 10 (Stage 7 fork-join) |
| `pipelineStage = 8` | Step 10 (Stage7Commit advances to 8) |
| `questionerDone` | Step 2 |
| `completenessChecked` | Step 2 |
| `reviewGatePassed` | Step 5 |
| `plantumlDone` | Step 10 |
| `librarianDone` | Step 7, Step 10 |
| `stage7Committed` | Step 10 |
| `librarianIndex` (all 4 values) | Step 7, Step 8, Step 9 |
| `librarianSplit` | Step 7 |
| `librarianTokens` | Step 7 |
| `topicKind` (all 3 values) | Step 3, Step 6 |
| `selectedExperts` | Step 6 |
| `quorumDeployed` | Step 5 |
| `deployedItems` | Step 5 |
| `reviews` | Step 4, Step 5 |

### Transitions -- Verification

| Transition | Covered By |
|-----------|-----------|
| `QuestionerAsk` | Step 2 |
| `QuestionerCompletenessCheck` | Step 2 |
| `QuestionerFinishVoluntary` | Step 2 |
| `QuestionerForceStop` | Step 2 |
| `SelectExperts` | Step 3, Step 6 |
| `AdvanceMiddleStages` | Step 10 (existing pipeline stages 2-5) |
| `SubmitReview(r)` | Step 4 |
| `PassReviewGate` | Step 5 |
| `PlantUMLComplete` | Step 10 |
| `LibrarianUpdate` | Step 7, Step 10 |
| `LibrarianConsultWithDegradedIndex` | Step 7, Step 9 |
| `Stage7Commit` | Step 10 |
| `DeployQuorumAndA11y` | Step 5 |

### Safety Invariants -- Verification

| Invariant | Verified By |
|-----------|------------|
| `TypeOK` | All steps (structural validation in each test) |
| `QuorumFloorGuard` | Step 1, Step 12 (quorum.test.ts asserts quorum(0) throws) |
| `QuorumAtTwoIsUnanimity` | Step 1, Step 12 (quorum.test.ts asserts quorum(2)=2) |
| `QuestionerBounded` | Step 2 (test asserts hard turn cap presence) |
| `QuestionerCompletenessRequired` | Step 2 (test asserts completeness check before sign-off) |
| `Stage7AtomicCommit` | Step 10 (test asserts single atomic commit after fork-join) |
| `AtomicQuorumDeployment` | Step 5 (test asserts both quorum formula and reviewer in same step) |
| `A11ySelectionCriteria` | Step 6 (test asserts selection criteria) |
| `ReviewGateNonVacuous` | Step 4, Step 5 (reviewer exists, quorum >= 1) |
| `QuestionerMinOneQuestion` | Step 2 (questioner must ask at least one question) |
| `DeploymentRequiresReviewGate` | Step 5 (deployment in pipeline after review gate) |

### Liveness Properties -- Verification

| Property | Verified By |
|----------|------------|
| `QuestionerTerminates` | Step 2 (hard turn cap guarantees termination) |
| `PipelineCompletes` | Step 10 (Stage 7 -> stage 8 transition) |
| `ForkJoinCompletes` | Step 10 (atomic commit after both tasks complete) |
| `StageMonotonicity` | Step 10 (stage sequence only advances) |

All TLA+ states, transitions, and properties are covered by the implementation plan.

---

## Execution Tiers

### Tier 1: Foundation (independent artifacts, no cross-dependencies)

Steps 1, 2, 3, 4, 7, and 12 have no dependencies on each other. They create independent artifacts: quorum spec, questioner rewrite, expert-a11y, a11y-reviewer, librarian agent definition, and quorum TypeScript function. No file overlaps exist within this tier.

| Task ID | Step | Title |
|---------|------|-------|
| T1 | Step 1 | Quorum formula specification |
| T2 | Step 2 | Freeform questioner SKILL.md rewrite |
| T3 | Step 3 | Expert-a11y SKILL.md |
| T4 | Step 4 | A11y-reviewer AGENT.md |
| T5 | Step 7 | Librarian agent AGENT.md |
| T6 | Step 12 | Quorum TypeScript companion function |

### Tier 2: Wiring and index (depends on Tier 1 -- needs agent definitions and quorum spec)

Steps 5, 6, 8, and 11 depend on Tier 1 outputs. Step 5 modifies design-pipeline SKILL.md (depends on Steps 1, 4). Step 6 modifies debate-moderator SKILL.md (depends on Step 3). Step 8 creates librarian seed files (depends on Step 7). Step 11 cleans up internal_map references (depends on Step 8). Note: Steps 5 and 6 both modify shared conventions -- Step 5 adds quorum documentation, Step 6 does not touch conventions. No file overlap within this tier.

| Task ID | Step | Title |
|---------|------|-------|
| T7 | Step 5 | Quorum formula and reviewer roster atomic update |
| T8 | Step 6 | Debate-moderator a11y selection criteria |
| T9 | Step 8 | Librarian index seed files |
| T10 | Step 11 | Delete old internal_map references |

### Tier 3: Integration (depends on Tier 2 -- needs roster, index, and conventions updates)

Steps 9 and 10 depend on multiple Tier 2 outputs. Step 9 modifies shared conventions (depends on Steps 7, 8). Step 10 modifies design-pipeline SKILL.md (depends on Steps 5, 7). File overlap: Steps 9 and 10 do NOT overlap -- Step 9 modifies conventions.md, Step 10 modifies design-pipeline SKILL.md. However, Step 5 (Tier 2) already modifies both files. Since Tier 2 completes before Tier 3 starts, this is safe.

| Task ID | Step | Title |
|---------|------|-------|
| T11 | Step 9 | Shared conventions consult-first pattern |
| T12 | Step 10 | Stage 7 in design-pipeline orchestrator |

---

## Task Assignment Table

| Task ID | Title | Tier | Code Writer | Test Writer | Dependencies | Rationale |
|---------|-------|------|-------------|-------------|--------------|-----------|
| T1 | Quorum formula specification | 1 | trainer-writer | vitest-writer | None | Agent/skill artifact defining a shared spec in `.claude/skills/shared/`. |
| T2 | Freeform questioner SKILL.md rewrite | 1 | trainer-writer | vitest-writer | None | Modifying a SKILL.md file in `.claude/skills/`; vitest validates structure. |
| T3 | Expert-a11y SKILL.md | 1 | trainer-writer | vitest-writer | None | Creating a new expert SKILL.md in `.claude/skills/agents/`. |
| T4 | A11y-reviewer AGENT.md | 1 | trainer-writer | vitest-writer | None | Creating a new reviewer AGENT.md in `.claude/skills/reviewers/`. |
| T5 | Librarian agent AGENT.md | 1 | trainer-writer | vitest-writer | None | Creating a new agent AGENT.md in `.claude/skills/agents/`. |
| T6 | Quorum TypeScript companion function | 1 | typescript-writer | vitest-writer | None | Pure TypeScript function with unit tests; no agent artifact. |
| T7 | Quorum formula + reviewer roster atomic update | 2 | trainer-writer | vitest-writer | T1, T4 | Modifying SKILL.md and conventions.md in `.claude/skills/`; atomic deployment requires trainer. |
| T8 | Debate-moderator a11y selection criteria | 2 | trainer-writer | vitest-writer | T3 | Modifying debate-moderator SKILL.md; expert selection logic is agent configuration. |
| T9 | Librarian index seed files | 2 | trainer-writer | vitest-writer | T5 | Creating Markdown index files in `docs/librarian/`; structural validation via vitest. |
| T10 | Delete old internal_map references | 2 | trainer-writer | vitest-writer | T9 | Cleaning up references in `.claude/` agent artifacts. |
| T11 | Shared conventions consult-first pattern | 3 | trainer-writer | vitest-writer | T5, T9 | Modifying shared conventions Markdown; advisory pattern documentation. |
| T12 | Stage 7 in design-pipeline orchestrator | 3 | trainer-writer | vitest-writer | T7, T5 | Modifying the pipeline orchestrator SKILL.md; fork-join stage definition. |

---

## Blockers

- **T1** (quorum spec) blocks T7 (atomic update)
- **T3** (expert-a11y) blocks T8 (selection criteria)
- **T4** (a11y-reviewer) blocks T7 (atomic update)
- **T5** (librarian agent) blocks T9 (seed files), T11 (conventions), T12 (Stage 7)
- **T7** (atomic update) blocks T12 (Stage 7 pipeline)
- **T9** (seed files) blocks T10 (cleanup), T11 (conventions)
