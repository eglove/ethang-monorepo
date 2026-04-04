---
name: design-pipeline
description: Orchestrates a strict 7-stage sequential pipeline from requirements elicitation through expert debate, TLA+ formal verification, expert review, implementation planning, autonomous pair programming execution, and post-execution fork-join (PlantUML + librarian). Dispatches questioner, debate-moderator, tla-writer, implementation-writer, writer agent pairs, and librarian in guaranteed order.
---

# Design Pipeline

## Role

The Design Pipeline is a state-machine orchestrator that drives a design idea through seven mandatory sequential stages: requirements elicitation, expert design debate, formal TLA+ specification, expert review of that specification, a step-by-step implementation plan, autonomous pair programming execution, and a post-execution fork-join (PlantUML diagram update + librarian index update). No stage can be skipped or reordered. Each stage receives the full accumulated output of every prior stage. The orchestrator itself makes no design decisions -- it tracks pipeline state, passes context forward, and presents user choices at error and revision points.

No single agent can do this alone because each stage requires a different capability (interviewing, multi-expert debate, formal verification, structured planning, parallel TDD execution) and the handoff contracts between them must be enforced.

## When to Use

- User invokes `/design-pipeline [seed]`
- User wants a complete design-through-implementation-plan workflow with formal verification
- Any situation where skipping stages (debate, TLA+, review) would be unacceptable

## Trigger

`/design-pipeline [seed]`

If `seed` is provided, it is passed to the questioner as the starting context. If omitted, the questioner opens with its default question.

## Pipeline Stages

```
Stage 1: Questioner            ─── elicit requirements
    │
    ▼
Stage 2: Debate-Moderator      ─── design debate with selected experts
    │
    ▼
Stage 3: TLA-Writer            ─── formal TLA+ specification
    │
    ▼
Stage 4: Debate-Moderator      ─── same experts review TLA+ spec
    │
    ▼
Stage 5: Implementation-Writer  ─── step-by-step implementation plan + tiers + agent pairs
    │
    ▼
    ┌─── Confirmation Gate ───┐
    │  User reviews plan,     │
    │  tiers, agent pairings  │
    └─────────┬───────────────┘
              ▼
Stage 6: Pair Programming      ─── autonomous TDD execution via agent pairs
    │
    ▼
Stage 7: Fork-Join             ─── PlantUML diagram + librarian index (parallel)
```

## State Machine

The orchestrator is a state machine with these states:

### Stages 1-5 States

| State | Description |
|---|---|
| `STAGE_1_QUESTIONER` | Eliciting requirements via questioner |
| `STAGE_2_DESIGN_DEBATE` | Running design debate via debate-moderator |
| `STAGE_3_TLA_WRITER` | Writing and verifying TLA+ spec |
| `STAGE_4_TLA_REVIEW` | Running TLA+ review debate via debate-moderator |
| `STAGE_5_IMPLEMENTATION` | Generating implementation plan |

### Stage 6 States

| State | Description |
|---|---|
| `STAGE_6_CONFIRMATION_GATE` | User reviews task breakdown, tiers, agent pairings before execution |
| `STAGE_6_TIER_EXECUTING` | Dispatching and running parallel pair sessions for current tier |
| `STAGE_6_TIER_MERGING` | Serialized merge queue processing completed sessions into tier branch |
| `STAGE_6_INTER_TIER_VERIFICATION` | Full test suite + type-check after all tier merges complete |
| `STAGE_6_GLOBAL_REVIEW` | Cross-task integration review after all tiers complete |
| `STAGE_6_FIX_SESSION` | Targeted fix session spawned from failed global review |
| `STAGE_6_REVIEWING` | All 9 reviewers dispatched and running in parallel |
| `STAGE_6_REVIEW_PASSED` | All responded reviewers passed with quorum met |
| `STAGE_6_REVIEW_FAILED` | At least one responded reviewer failed |
| `STAGE_6_REVISING` | Pair session revising based on reviewer findings |

### Terminal States

| State | Description |
|---|---|
| `COMPLETE` | All stages finished, terminal artifact committed on named branch |
| `HALTED` | Pipeline stopped by user or unrecoverable error |

### Valid Transitions (Stages 1-5)

```
STAGE_1_QUESTIONER     → STAGE_2_DESIGN_DEBATE         (questioner completes)
STAGE_1_QUESTIONER     → HALTED                        (user abandons)
STAGE_2_DESIGN_DEBATE  → STAGE_3_TLA_WRITER            (consensus or user accepts partial)
STAGE_2_DESIGN_DEBATE  → HALTED                        (user stops at stalemate)
STAGE_3_TLA_WRITER     → STAGE_4_TLA_REVIEW            (TLC passes or user accepts as-is)
STAGE_3_TLA_WRITER     → STAGE_3_TLA_WRITER            (retry tla-writer)
STAGE_3_TLA_WRITER     → STAGE_1_QUESTIONER             (back to questioner, restart)
STAGE_4_TLA_REVIEW     → STAGE_5_IMPLEMENTATION         (review passes or user accepts as-is)
STAGE_4_TLA_REVIEW     → STAGE_3_TLA_WRITER             (back to tla-writer, then re-review)
STAGE_4_TLA_REVIEW     → STAGE_1_QUESTIONER             (back to questioner, restart)
STAGE_5_IMPLEMENTATION → STAGE_6_CONFIRMATION_GATE      (plan delivered with tiers + agent pairs)
```

### Valid Transitions (Stage 6)

```
STAGE_6_CONFIRMATION_GATE       → STAGE_6_TIER_EXECUTING         (user confirms — UserConfirms)
STAGE_6_CONFIRMATION_GATE       → HALTED                        (user rejects plan)
STAGE_6_TIER_EXECUTING          → STAGE_6_TIER_MERGING           (all sessions done — BeginTierMerging)
STAGE_6_TIER_EXECUTING          → HALTED                        (all sessions failed — TierAllFailed)
STAGE_6_TIER_MERGING            → STAGE_6_INTER_TIER_VERIFICATION (all merges done — BeginInterTierVerification)
STAGE_6_TIER_MERGING            → HALTED                        (merge conflict unresolvable — MergeConflictEscalates)
STAGE_6_INTER_TIER_VERIFICATION → STAGE_6_TIER_EXECUTING         (passes, more tiers — VerificationPasses)
STAGE_6_INTER_TIER_VERIFICATION → STAGE_6_GLOBAL_REVIEW          (passes, last tier — VerificationPasses)
STAGE_6_INTER_TIER_VERIFICATION → HALTED                        (fails — VerificationFails)
STAGE_6_GLOBAL_REVIEW           → COMPLETE                      (passes — GlobalReviewPasses)
STAGE_6_GLOBAL_REVIEW           → STAGE_6_FIX_SESSION            (fails, under cap — GlobalReviewFails)
STAGE_6_GLOBAL_REVIEW           → HALTED                        (fails, cap reached — GlobalReviewExhausted)
STAGE_6_FIX_SESSION             → STAGE_6_GLOBAL_REVIEW          (fix done — FixSessionComplete)
STAGE_6_TIER_MERGING            → STAGE_6_REVIEWING               (all merges done, reviewers dispatched — BeginReviewing)
STAGE_6_REVIEWING               → STAGE_6_REVIEW_PASSED           (all responded reviewers passed, quorum met — ReviewQuorumPassed)
STAGE_6_REVIEWING               → STAGE_6_REVIEW_FAILED           (at least one reviewer failed — ReviewerFailed)
STAGE_6_REVIEW_PASSED           → STAGE_6_INTER_TIER_VERIFICATION (review gate cleared — ReviewGateCleared)
STAGE_6_REVIEW_FAILED           → STAGE_6_REVISING                (findings sent to pair session — BeginRevision)
STAGE_6_REVISING                → STAGE_6_REVIEWING               (revision complete, re-review — ResubmitForReview)
STAGE_6_REVISING                → HALTED                         (MaxReviewRevisions reached — ReviewRevisionsExhausted)
```

## Pipeline State File

**Location:** `docs/pipeline-state.md` -- the single source of truth for live pipeline state. Replaces the former session index.

### Clear on Start

At the start of each pipeline run, overwrite the state file with the template (CLEARED state). The template contains section headers for each stage with empty values. If the clear operation fails (disk full, permission error, file locked), do not start the pipeline -- fail-fast.

### Uncommitted-Change Warning

Before clearing, check `git status` on the state file. If there are uncommitted changes, warn the user. Do not block -- warn only.

### Section-Scoped Ownership

Each stage writes only its own StageResult section. Cross-section writes are domain invariant violations. The orchestrator writes only the run-level metadata and the Git section.

### Schema Validation

Each stage validates that the state file is well-formed (all prior StageResult sections are present and parseable) before writing its own section.

### Terminal-State-Only Commits

The state file is committed only when the pipeline reaches a terminal state (COMPLETE or HALTED). Intermediate states are transient and not committed. One meaningful commit per pipeline run.

## Stage Execution

### Stage 1 — Questioner

Invoke the questioner skill (`.claude/skills/questioner/SKILL.md`) via the Agent tool. CRITICAL! Do NOT dispatch a new agent for every question, the questioner should ask all questions in the same session.

**Input:** User seed (if provided), plus the following role framing:

```
You are being called from the /design-pipeline orchestrator. This is a pipeline run. After sign-off, save the briefing file but do not dispatch any downstream agents. Return the briefing content and file path to the caller.
```

**Output expected:** Briefing file path + briefing content.

**On completion:** Add briefing to accumulated context. Advance to `STAGE_2_DESIGN_DEBATE`.

**On abandonment:** If the user stops mid-session without sign-off, the questioner saves a partial briefing marked `[INCOMPLETE]`. The orchestrator transitions to `HALTED`.

### Stage 2 — Design Debate

Invoke the debate-moderator skill (`.claude/skills/orchestrators/debate-moderator/SKILL.md`) via the Agent tool.

**Input:**
- **Topic:** The full briefing content from Stage 1
- **Context:** `"Debate the design described in this briefing. Focus on correctness, trade-offs, and gaps. Evaluate whether the proposed states, transitions, error handling, and scope are complete and sound."`

**Output expected:** Debate synthesis (consensus or partial consensus) + session file path.

**On consensus:** Add design consensus synthesis to accumulated context. Advance to `STAGE_3_TLA_WRITER`.

**On partial consensus (stalemate at round 5):** Present the partial consensus to the user with:

```
The design debate ended with partial consensus after 5 rounds.

Unresolved dissents:
<list from synthesis>

Options:
  (a) Proceed to TLA+ specification with partial consensus
  (b) Stop the pipeline here

Which option?
```

If `(a)`: Add partial consensus to accumulated context. Advance to `STAGE_3_TLA_WRITER`.
If `(b)`: Transition to `HALTED`.

### Stage 3 — TLA+ Writer

Invoke the tla-writer agent (`.claude/skills/tla-writer/AGENT.md`) via the Agent tool.

**Input:** The briefing file path, plus the design consensus synthesis as additional context:

```
Design consensus from expert debate:
<design consensus synthesis>

Use this consensus alongside the briefing to write the TLA+ specification. The experts agreed on the above design — the spec should formally model it.
```

**Output expected:** TLA+ spec files (.tla, .cfg, README) + TLC results + output directory path.

**On TLC pass:** Add TLA+ spec content and TLC results to accumulated context. Advance to `STAGE_4_TLA_REVIEW`.

**On TLC failure (unresolvable after tla-writer's internal 4-tier error handling):** Present to the user:

```
TLA+ model checking failed and could not be resolved by the tla-writer.

Failure details:
<violation and counterexample from tla-writer output>

Options:
  (a) Back to questioner — restart pipeline from Stage 1 (overwrites previous outputs)
  (b) Retry tla-writer — re-run Stage 3
  (c) Accept as-is — proceed to TLA+ review with the unverified spec

Which option?
```

If `(a)`: Reset accumulated context. Transition to `STAGE_1_QUESTIONER`.
If `(b)`: Re-run Stage 3 with the same accumulated context.
If `(c)`: Add unverified spec to accumulated context (marked as `[UNVERIFIED]`). Advance to `STAGE_4_TLA_REVIEW`.

### Stage 4 — TLA+ Review Debate

Invoke the debate-moderator skill (`.claude/skills/orchestrators/debate-moderator/SKILL.md`) via the Agent tool.

**Input:**
- **Topic:** The TLA+ specification content (full .tla file) plus the briefing and design consensus
- **Context:** `"Review this TLA+ specification against the agreed design consensus and original briefing. Focus on whether the spec correctly captures all states, transitions, safety properties, and liveness properties. Identify any states or transitions from the design that are missing from the spec, any properties that should be verified but are not, and any spec behaviors that contradict the design."`

**Output expected:** Review debate synthesis + session file path.

**On consensus (no objections to spec):** Add TLA+ review consensus to accumulated context. Advance to `STAGE_5_IMPLEMENTATION`.

**On objections (consensus with concerns, or partial consensus):** Present to the user:

```
The TLA+ review debate raised objections:

<objections from synthesis>

Options:
  (a) Back to tla-writer — revise the spec, then re-run review (Stage 3 → Stage 4)
  (b) Back to questioner — restart pipeline from Stage 1 (overwrites previous outputs)
  (c) Accept as-is — proceed to implementation planning

Which option?
```

If `(a)`: Append review objections to accumulated context so tla-writer can address them. Transition to `STAGE_3_TLA_WRITER`.
If `(b)`: Reset accumulated context. Transition to `STAGE_1_QUESTIONER`.
If `(c)`: Add review consensus (with objections noted) to accumulated context. Advance to `STAGE_5_IMPLEMENTATION`.

### Stage 5 — Implementation Writer

Invoke the implementation-writer agent (`.claude/skills/implementation-writer/AGENT.md`) via the Agent tool.

**Input:** The full accumulated context:

```
Briefing:
<briefing content>

Design Consensus:
<design consensus synthesis>

TLA+ Specification:
<.tla file content>

TLC Results:
<TLC output summary>

TLA+ Review Consensus:
<review consensus synthesis>

Generate a step-by-step implementation plan. Every state and transition in the TLA+ specification must map to at least one implementation step. Flag any unmapped states before presenting the plan.
```

**Output expected:** Implementation plan saved to `docs/implementation/` + file path. Plan includes Execution Tiers and Task Assignment Table sections.

**On completion:** Add implementation plan path to accumulated context. Transition to `STAGE_6_CONFIRMATION_GATE`.

### Stage 6 — Pair Programming

Stage 6 is a multi-phase autonomous execution stage. It reads the implementation plan from Stage 5 (including execution tiers and task assignments) and executes the plan using parallel pair programming sessions. The orchestrator manages worktrees, dispatches agent pairs, enforces TDD discipline, serializes merges, and runs cross-tier verification.

**TLA+ Specification:** `docs/tla-specs/pair-programming-stage/PairProgrammingStage.tla`

#### Stage 6 State File Updates

1. After the confirmation gate is passed (user confirms), write the Stage 6 StageResult to `docs/pipeline-state.md` with **Status:** `IN PROGRESS`, **Artifact:** the integration branch name (`design-pipeline/<topic-slug>`), and **Timestamp:** the current ISO-8601 timestamp.
2. Before writing, validate that all prior StageResult sections (Stages 1-5) are populated. If any prior section is missing or empty, halt with a schema validation error -- do not write Stage 6.
3. Write only to the Stage 6 section -- section-scoped ownership applies. Do not modify any other stage's section.
4. Update the Stage 6 Status throughout execution: `IN PROGRESS` during tier execution, `COMPLETE` on success, `HALTED` on failure.

#### 6a. Confirmation Gate (STAGE_6_CONFIRMATION_GATE)

Before any autonomous work begins, present the full task breakdown to the user:

```
Stage 6: Pair Programming — Confirmation Gate

Implementation Plan: <path>
Tiers: <count>
Tasks: <count>

<Task Assignment Table from the implementation plan>

The above tasks will be executed autonomously using pair programming sessions.
Each pair session runs in an isolated git worktree. Maximum 3 concurrent worktrees (Windows cap).

Options:
  (a) Confirm — begin autonomous execution
  (b) Reject — halt pipeline

Which option?
```

If `(a)`: Set `confirmed = TRUE`. Create an integration branch: `design-pipeline/<topic-slug>`. Transition to `STAGE_6_TIER_EXECUTING` with `currentTier = 1`.
If `(b)`: Transition to `HALTED`.

**Invariant enforced:** `CompletionRequiresConfirmation` -- COMPLETE is unreachable without user confirmation.

#### 6a-dispatch. Project-Manager Dispatch

After the user confirms at the STAGE_6_CONFIRMATION_GATE, dispatch the project-manager agent to take over all Stage 6 execution:

1. Create the integration branch: `design-pipeline/<topic-slug>`
2. Dispatch the project-manager agent (`.claude/skills/project-manager/AGENT.md`) via the Agent tool
3. Pass the following to the project-manager:
   - **Implementation plan** file path (from Stage 5)
   - **Full accumulated pipeline context**: briefing (Stage 1), design consensus (Stage 2), TLA+ spec (Stage 3), TLA+ review (Stage 4), implementation plan (Stage 5)
   - **Integration branch** name (`design-pipeline/<topic-slug>`)
4. The project-manager takes over all Stage 6 execution: tier management, worktree lifecycle, pair dispatch, reviewer gate, and merge queue

The orchestrator does not directly manage tier execution, merging, or pair sessions. After dispatching the project-manager, the orchestrator waits for the project-manager to report completion or failure, then transitions to `COMPLETE` or `HALTED` accordingly.

#### 6b. Tier Execution (STAGE_6_TIER_EXECUTING)

For the current tier, dispatch all assigned tasks in parallel (up to MaxConcurrent = 3):

1. **Validate task graph:** Before dispatching, verify no cycles in the dependency DAG, no backward dependencies, no file overlap within the tier. If validation fails, HALT.
2. **Create worktrees:** For each task in the tier, create a git worktree branching from the integration branch: `git worktree add <path> -b <task-branch>`.
3. **Dispatch agent pairs:** For each task, invoke the assigned code writer and test writer agents via the Agent tool, passing:
   - Task assignment (files, TLA+ coverage, tier number)
   - Partner agent identity
   - Accumulated pipeline context
   - Worktree path
   - Re-dispatch context (if re-dispatching after failure)

**Concurrency cap:** `ActiveSessionCount <= MaxConcurrent` (3 on Windows). If more tasks exist in the tier than the cap allows, dispatch in batches.

**Invariants enforced:**
- `ConcurrencyBounded` -- never more than MaxConcurrent active sessions
- `TierOrderingValid` -- only tasks from currentTier are dispatched

##### Ping-Pong TDD Protocol (per session)

Each pair session follows this state machine:

```
HANDSHAKE → RED → TEST_VALIDATION → GREEN → REFACTOR_REVIEW → HANDSHAKE (loop)
                                                                    │
                                                              LOCAL_REVIEW
                                                                    │
                                                            SESSION_COMPLETE
```

**States:**

| State | Actor | Activity |
|---|---|---|
| `HANDSHAKE` | Test writer | Proposes next increment; code writer confirms or adjusts |
| `RED` | Test writer | Writes a failing test |
| `TEST_VALIDATION` | Test writer | Validates: test compiles, fails for behavioral reason, non-trivial |
| `GREEN` | Code writer | Writes minimum implementation to make test pass |
| `REFACTOR_REVIEW` | Test writer | Reviews implementation, proposes refactoring |
| `LOCAL_REVIEW` | Both | 5-point checklist + mutual cross-review |
| `SESSION_COMPLETE` | -- | Task done, ready for merge |
| `SESSION_FAILED` | -- | Unrecoverable error, awaiting re-dispatch |

**Key invariants:**
- `TDDOrdering` -- GREEN is only reachable when `hasFailingTest = TRUE`. The code writer cannot write implementation without a valid failing test.
- `CommitCountMatchesCycles` -- each TDD cycle (RED-GREEN-REFACTOR) produces exactly one commit. `commitCount = tddCycle` for complete sessions.

**Test quality gate (TEST_VALIDATION):**
1. Test compiles (no syntax errors)
2. Test fails for behavioral reasons (feature missing, not test broken)
3. Test uses non-trivial inputs
4. If validation fails, test writer revises (bounded by MaxValidationRetries)
5. If retries exhausted, SESSION_FAILED

**Local self-review (LOCAL_REVIEW):**
1. All tests pass
2. Type-check passes
3. Lint passes
4. TLA+ states/transitions assigned to this task are covered
5. No files in broken state
6. Mutual cross-review: test writer reviews code, code writer reviews tests
7. If issues found, return to HANDSHAKE for fix cycle (bounded by MaxCrossReview)
8. If cross-review exhausted, SESSION_FAILED

**Invariant enforced:** `CrossReviewBounded` -- cross-review iterations never exceed MaxCrossReview.

##### Commit Strategy

- **One commit per TDD cycle:** Each RED-GREEN-REFACTOR produces a commit in the worktree branch
- **No squash on tier branches:** Preserve the full TDD commit history for auditability and `git bisect`
- **Merge to integration branch:** Use `--no-ff` merge so `git log --first-parent` reads cleanly

##### Session Completion

When all sessions in the tier reach SESSION_COMPLETE or SESSION_FAILED:
- If at least one session succeeded: transition to `STAGE_6_TIER_MERGING`
- If ALL sessions failed: transition to `HALTED` with `haltReason = TIER_ALL_FAILED`

**Invariant enforced:** `NoMergeDuringExecution` -- no merge activity while sessions are still running.

##### Session Failure and Re-Dispatch

When a session fails:

1. **Archive worktree diff** to a temporary location for diagnostics
2. **Delete the worktree** to prevent disk/path conflicts
3. **Clean the tier branch** of any partial artifacts from the failed attempt
4. **Re-dispatch with a different agent pair** (if `reDispatchCount < MaxReDispatches`):
   - **Logic error (corruptionFlag = FALSE):** Inherit context -- prior passing commits, last valid failing test, tddCycle count, hasFailingTest flag, commitCount. The new pair picks up where the failed pair left off.
   - **Corruption (corruptionFlag = TRUE):** Full reset -- ignore all prior context, start from scratch in a clean worktree.
5. If re-dispatch limit reached, mark task as SESSION_FAILED permanently

**Invariant enforced:** `ReDispatchBounded` -- re-dispatches per task never exceed MaxReDispatches.

#### 6c. Tier Merging (STAGE_6_TIER_MERGING)

Merge all SESSION_COMPLETE worktrees into the integration branch using a serialized queue:

1. **Queue all completed tasks** for merge
2. **Process one at a time** (serialized -- `mergeQueueBusy` flag):
   a. `git merge --no-ff <task-branch>` into integration branch
   b. Run full test suite after each individual merge (post-merge test)
   c. If post-merge test passes: `MERGE_COMPLETE`, proceed to next in queue
   d. If merge fails (conflict): `MERGE_CONFLICT`
   e. If post-merge test fails: `MERGE_CONFLICT` (treat as conflict)
3. **Conflict resolution:**
   - Attempt auto-merge first
   - If auto-merge fails, spawn a fix session with a fresh agent pair
   - Bounded by MaxMergeConflictRetries per task
   - If retries exhausted: `HALTED` with `haltReason = MERGE_CONFLICT_UNRESOLVABLE`
4. **Cleanup:** Delete worktrees after successful merge

**Invariants enforced:**
- `SerializedMergeQueue` -- at most one task MERGING at a time
- `MergeConflictRetriesBounded` -- conflict retries per task never exceed MaxMergeConflictRetries

When all merges complete, transition to `STAGE_6_INTER_TIER_VERIFICATION`.

#### 6d. Inter-Tier Verification (STAGE_6_INTER_TIER_VERIFICATION)

After all merges for a tier complete:

1. Run full test suite on the integration branch
2. Run type-check (`npx tsc --noEmit`)
3. Run lint (`npx eslint .`)

If all pass:
- If more tiers remain: advance `currentTier`, create worktrees from the verified integration branch, transition to `STAGE_6_TIER_EXECUTING`
- If this was the last tier: transition to `STAGE_6_GLOBAL_REVIEW`

If any fail: transition to `HALTED` with `haltReason = VERIFICATION_FAILED`. Cross-tier verification failure indicates a task-graph defect (Stage 5 got the dependencies wrong) -- escalate to user.

**Invariant enforced:** `TierOrderingValid` -- no tier N+1 executes before tier N is verified.

#### 6e. Global Review — Double-Pass Protocol (STAGE_6_GLOBAL_REVIEW)

After all tiers are merged and verified, the project-manager executes the Global Review Double-Pass Protocol. The canonical specification lives in `.claude/skills/project-manager/AGENT.md` under the "Global Review Double-Pass Protocol" section, formally verified by `docs/tla-specs/conventions-hook-cleanup-e2e-global-review/GlobalReview.tla`.

The double-pass runs a 3-step sequence (test, lint, tsc) twice consecutively:

1. **Pass 1:** Execute all 3 steps. If a step fails, the project-manager applies at most 1 inline fix per step (per-step retry cap). If the retry also fails, the entire sequence restarts (fixCount increments).
2. **Pass 2:** Re-execute all 3 steps. Both passes must complete cleanly for the global review to pass.

Additionally, the global review includes:
- **Cross-task integration check:** imports resolve, shared types are consistent, API contracts match
- **TLA+ coverage audit:** every state, transition, and invariant from the spec is covered by at least one test

If both passes complete cleanly: transition to `COMPLETE`. Set `terminalArtifact = TRUE`.

If any step fails after retry and `fixCount < MaxGlobalFixes(3)`: restart the full sequence from pass 1, step 1.

If `fixCount >= MaxGlobalFixes(3)`: transition to `HALTED` with `haltReason = GLOBAL_REVIEW_EXHAUSTED`.

**Invariants enforced:**
- `GlobalFixBounded` -- fixCount never exceeds MaxGlobalFixes (3)
- `Pass2RequiresCleanPass1` -- pass 2 only begins after a complete clean pass 1
- `TerminalArtifactOnlyOnComplete` -- terminalArtifact is TRUE only when pipeline is COMPLETE

#### 6f. Fix Session (STAGE_6_FIX_SESSION)

Spawn a targeted fix session for the failing issue:

1. Create a worktree from the integration branch
2. Dispatch an agent pair to fix the specific failure
3. On completion, merge back and transition to `STAGE_6_GLOBAL_REVIEW` for re-verification

#### 6g. Terminal Artifact

On `COMPLETE`, the terminal artifact is a commit on the named branch `design-pipeline/<topic-slug>`. This is durable -- a crash or timeout cannot lose the work. Commit `docs/pipeline-state.md` as part of the terminal artifact. The state file records the final pipeline state for archival via git history.

**Invariant enforced:** `HaltReasonConsistent` -- when HALTED, haltReason is always set to a non-NONE value. Commit `docs/pipeline-state.md` with the HALTED status and halt reason. The state file records why the pipeline stopped.

### Stage 7 — Fork-Join (PlantUML + Librarian)

Stage 7 runs after Stage 6 completes (all tiers executed, review gate passed). It is a fork-join: the PlantUML diagram update and the librarian index update run in parallel. Both must complete before a single atomic commit is made.

#### Fork-Join Structure

```
Stage 6 COMPLETE
    │
    ├─── PlantUML diagram update (parallel)
    │
    ├─── Librarian index update  (parallel)
    │
    ▼
Both complete → single atomic commit → Stage 7 COMPLETE → Pipeline COMPLETE
```

#### PlantUML Task

Updates the `design-pipeline.puml` diagram if structural changes occurred during the pipeline run. Uses the `changeFlag` mechanism described below. Failure is non-fatal -- the diagram is informational. If PlantUML fails, log a warning and continue.

#### Librarian Task

Dispatches the librarian agent (`.claude/skills/agents/librarian/AGENT.md`) to update `docs/librarian/` with any files created or modified during the pipeline run. Failure is non-fatal -- if the librarian fails, agents fall back to direct file reads.

#### Atomic Commit Strategy

Both tasks stage their changes independently. After both tasks complete (or fail gracefully), a single atomic commit captures all Stage 7 outputs. The commit message includes both PlantUML and librarian changes.

#### Error Handling

Neither task blocks the pipeline COMPLETE status on failure:
- **PlantUML failure:** Non-fatal. The diagram is informational only. Log a warning.
- **Librarian failure:** Non-fatal. The index is advisory. Agents fall back to direct file reads.

If both tasks fail, Stage 7 still transitions to COMPLETE with a warning noting both failures.

### PlantUML Diagram Update

The orchestrator tracks structural pipeline changes using a `changeFlag` boolean. `changeFlag` starts `FALSE` at the beginning of each pipeline run. Any stage that modifies pipeline structure sets `changeFlag = TRUE`. Structural changes include: a new expert is added to the roster, a stage role or responsibilities change, a new stage is added or removed, or stage ordering changes. **At most one structural change is captured per write cycle.** Subsequent structural changes during an active `.puml` update are silently dropped.

At pipeline completion (`COMPLETE` state), if `changeFlag = TRUE`:

1. Write the updated pipeline diagram to a temp file: `design-pipeline.puml.tmp`
2. Rename `design-pipeline.puml.tmp` → `design-pipeline.puml` (atomic rename)
3. If the rename fails, the original `design-pipeline.puml` remains unchanged
4. If `changeFlag = FALSE`, skip the update entirely — do not create spurious diffs

#### Worktree Management

- **Create:** `git worktree add ../worktrees/<task-id> -b <task-branch>` from the integration branch
- **Cleanup on success:** Delete worktree after merge completes
- **Cleanup on failure:** Archive diff, then delete worktree before re-dispatch
- **Windows cap:** Maximum 3 concurrent worktrees due to MAX_PATH limits, I/O contention from parallel `node_modules` resolution, and Windows Defender scanning

#### Constants

| Constant | Value | Rationale |
|---|---|---|
| MaxConcurrent | 3 | Windows parallelism cap |
| MaxGlobalFixes | 3 | Hard cap on global review fix iterations |
| MaxCrossReview | bounded | Prevents infinite cross-review loops |
| MaxValidationRetries | bounded | Prevents infinite test validation loops |
| MaxReDispatches | bounded | Prevents infinite re-dispatch loops |
| MaxMergeConflictRetries | bounded | Prevents infinite merge conflict resolution |
| MaxReviewRevisions | 3 | Max full review-revision cycles per task |
| MaxReviewerRetries | 2 | Max retries per reviewer on crash/timeout |
| MinReviewQuorum | ceil(2n/3) | Quorum formula: ceil(2n/3) where n = number of non-UNAVAILABLE reviewers. See `.claude/skills/shared/quorum.md`. At n=9, quorum=6. At n=2, quorum=2 (unanimity). |

#### Reviewer Roster

The review gate dispatches the following 9 reviewers in parallel:

1. `artifact-reviewer`
2. `compliance-reviewer`
3. `bug-reviewer`
4. `simplicity-reviewer`
5. `type-design-reviewer`
6. `security-reviewer`
7. `backlog-reviewer`
8. `test-reviewer`
9. `a11y-reviewer`

#### ReviewVerdict Schema

Each reviewer returns a structured ReviewVerdict:

| Field | Type | Description |
|---|---|---|
| `verdict` | `PASS \| FAIL` | Whether the reviewer approves the session diff |
| `scope` | `SESSION_DIFF \| OUT_OF_SCOPE` | Whether findings are within the session diff or outside it |
| `findings` | `Finding[]` | Array of issues found during review |

**Finding structure:**

| Field | Type | Description |
|---|---|---|
| `file` | string | File path relative to worktree root |
| `line` | number | Line number of the issue |
| `issue` | string | Description of the problem |
| `recommendation` | string | Suggested fix |
| `severity` | `ERROR \| WARNING` | Severity level |

#### Safety Invariants (TLA+ spec)

| Invariant | Description |
|---|---|
| `TypeOK` | All variables within declared domains |
| `SerializedMergeQueue` | At most one task MERGING at a time |
| `TDDOrdering` | GREEN requires hasFailingTest = TRUE |
| `GlobalFixBounded` | globalFixCount <= MaxGlobalFixes |
| `CrossReviewBounded` | crossReviewCount <= MaxCrossReview per task |
| `TierOrderingValid` | Active sessions belong to currentTier only |
| `ConcurrencyBounded` | Active sessions <= MaxConcurrent |
| `CompletionRequiresConfirmation` | COMPLETE requires confirmed = TRUE |
| `NoMergeDuringExecution` | No merge activity during TIER_EXECUTING |
| `ReDispatchBounded` | reDispatchCount <= MaxReDispatches per task |
| `CommitCountMatchesCycles` | commitCount = tddCycle for SESSION_COMPLETE tasks |
| `MergeConflictRetriesBounded` | mergeConflictRetries <= MaxMergeConflictRetries |
| `TerminalArtifactOnlyOnComplete` | terminalArtifact TRUE only when COMPLETE |
| `HaltReasonConsistent` | haltReason != NONE when HALTED |
| `ReviewRevisionsBounded` | reviewRevisionCount <= MaxReviewRevisions per task |
| `ReviewerRetriesBounded` | reviewerRetryCount <= MaxReviewerRetries per reviewer |
| `ReviewQuorumRequired` | REVIEW_PASSED requires at least MinReviewQuorum responding reviewers |

#### Liveness Properties (TLA+ spec)

| Property | Description |
|---|---|
| `SessionTerminates` | Every dispatched session eventually reaches SESSION_COMPLETE, SESSION_FAILED, or HALTED |
| `TierTerminates` | Every TIER_EXECUTING eventually reaches TIER_MERGING or HALTED |
| `PipelineTerminates` | Confirmed pipeline eventually reaches COMPLETE or HALTED |
| `MergeQueueProgress` | Every QUEUED merge eventually reaches MERGE_COMPLETE, MERGE_CONFLICT, or HALTED |

## Loop Policy

There are no hard caps on revision loops. The user is the circuit breaker. The orchestrator tracks every loop iteration. Each entry records which stage triggered the loop, where it returned to, the reason, and a timestamp. This provides a full audit trail without imposing arbitrary limits.

## Error Handling Summary

| Stage | Error Condition | User Options |
|---|---|---|
| 1 | User abandons questioner | Pipeline halts. No resume. |
| 2 | Stalemate (round 5, partial consensus) | (a) Proceed to Stage 3 with partial consensus, (b) Stop |
| 3 | TLC failure, unresolvable | (a) Back to Stage 1, (b) Retry Stage 3, (c) Accept as-is |
| 4 | Review produces objections | (a) Back to Stage 3 then 4, (b) Back to Stage 1, (c) Accept as-is |
| 5 | Unmapped TLA+ states | Implementation-writer flags them; user decides whether to accept or loop back |
| 6 | User rejects at confirmation gate | Pipeline halts. |
| 6 | Session failure | Re-dispatch with different pair (inherits context). If re-dispatch limit reached, task stays failed. |
| 6 | All sessions in tier failed | Pipeline halts (TIER_ALL_FAILED). |
| 6 | Merge conflict (auto-merge fails) | Fix session with fresh pair (bounded retries). If exhausted, pipeline halts (MERGE_CONFLICT_UNRESOLVABLE). |
| 6 | Inter-tier verification fails | Pipeline halts (VERIFICATION_FAILED). Task-graph defect — escalate to user. |
| 6 | Global review fails | Spawn fix session (up to 3). If cap reached, pipeline halts (GLOBAL_REVIEW_EXHAUSTED). |

## Output Locations

Each stage saves outputs to its own directory per existing conventions:

| Stage | Output Directory |
|---|---|
| Questioner | `docs/questioner-sessions/` |
| Design Debate | `docs/debate-moderator-sessions/` |
| TLA+ Writer | `docs/tla-specs/` |
| TLA+ Review | `docs/debate-moderator-sessions/` |
| Implementation Plan | `docs/implementation/` |
| Pair Programming | Named branch: `design-pipeline/<topic-slug>` |
| Pipeline State | `docs/pipeline-state.md` |

## Handoff

- **Receives from:** User (via `/design-pipeline [seed]`)
- **Passes to:** User (committed code on named branch)
- **Format:** Inline summary of final results pointing to all stage outputs

On `COMPLETE`, present to the user:

```
Design Pipeline Complete — <Topic>

Stage outputs:
  1. Briefing:            <path>
  2. Design Debate:       <path>
  3. TLA+ Specification:  <path>
  4. TLA+ Review:         <path>
  5. Implementation Plan: <path>
  6. Code Branch:         design-pipeline/<topic-slug>

Tiers executed: <N>
Tasks completed: <N of M>
Total TDD cycles: <N>
Total commits: <N>
Global fix iterations: <N of 3>

State file: docs/pipeline-state.md

All code is committed on branch design-pipeline/<topic-slug>.
All tests, type-check, and lint pass. TLA+ coverage audit passed.
```

On `HALTED`, present to the user:

```
Design Pipeline Halted — <Topic>

Stopped at: <stage name and sub-state>
Halt reason: <TIER_ALL_FAILED | VERIFICATION_FAILED | GLOBAL_REVIEW_EXHAUSTED | MERGE_CONFLICT_UNRESOLVABLE | user rejection>

Completed stage outputs are listed above.
State file: docs/pipeline-state.md
Partial work (if any) is on branch: design-pipeline/<topic-slug>
To restart, run /design-pipeline again.
```

## Constraints

- The orchestrator does not form opinions, write code, or make design decisions
- No stage can be skipped or run out of order
- The orchestrator never modifies files created by downstream agents
- Sessions cannot be resumed -- if halted, start a new `/design-pipeline` run
- Stage 6 requires user confirmation before any autonomous work begins (confirmation gate)
- Maximum 3 concurrent worktrees on Windows (MaxConcurrent = 3)
- Maximum 3 global review fix iterations (MaxGlobalFixes = 3) -- hard cap, then escalate to user
- Cross-review iterations are bounded per session (MaxCrossReview)
- Re-dispatches are bounded per task (MaxReDispatches)
- Merge conflict retries are bounded per task (MaxMergeConflictRetries)
- The terminal artifact is a commit on a named branch -- not uncommitted files
- Writer agents are internal only (AGENT.md, not SKILL.md) -- never invoked directly by users
