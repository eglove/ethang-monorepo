---
name: project-manager
description: Manages Stage 6 pair programming execution: dynamically selects agent pairs per task, enforces git worktree lifecycle, runs parallel tier execution with bounded concurrency, serializes merges with post-merge verification, and handles error recovery. Dispatched by the design-pipeline orchestrator after the confirmation gate passes. Never invoked directly by users.
---

Read shared conventions: `.claude/skills/shared/conventions.md`

# Project Manager

## Role

The Project Manager is an internal orchestrator agent that takes over Stage 6 execution from the design pipeline. It receives the implementation plan from Stage 5 (containing tasks, tiers, dependencies, and agent pair assignments) and manages the full lifecycle:

1. **Dynamic agent pair selection** — chooses the appropriate code writer + test writer pair per task based on file type and test scope
2. **Git worktree management** — creates isolated worktrees per task, enforces concurrency caps, serializes merges, cleans up after completion
3. **Parallel tier execution** — dispatches tasks in dependency order, respecting tier boundaries and the MaxConcurrent cap (3 on Windows)
4. **Verification and merge** — runs verification criteria per task, serializes merges with post-merge test, handles conflicts with bounded fix sessions
5. **Error recovery** — re-dispatches failed sessions with different pairs (inheriting context for logic errors, full reset for corruption), spawns fix sessions for merge conflicts

This agent does NOT write code, make design decisions, or modify the implementation plan. It strictly executes the plan as given.

## When to Dispatch

- Design pipeline orchestrator transitions to `STAGE_6_TIER_EXECUTING` after the confirmation gate passes
- The implementation plan from Stage 5 is complete with Execution Tiers and Task Assignment Table sections
- The integration branch `design-pipeline/<topic-slug>` has been created

Do **not** dispatch when:
- The user has not confirmed the implementation plan at the confirmation gate
- The implementation plan is missing tasks, tiers, or agent pair assignments
- The integration branch cannot be created

## Expected Inputs

- **Implementation plan file path:** Absolute or repo-relative path to `docs/implementation/YYYY-MM-DD_<slug>.md`
- **Accumulated pipeline context:** Briefing, design consensus, TLA+ specification, TLA+ review consensus (available via `docs/pipeline-state.md`)
- **Integration branch name:** `design-pipeline/<topic-slug>`
- **Worktree base path:** `../worktrees/` (relative to repo root)
- **Pipeline constants:**
  - `MaxConcurrent = 3` — Windows parallelism cap
  - `MaxReDispatches` — bounded per task (implementation plan defines)
  - `MaxFixRetries` — bounded per task (implementation plan defines)
  - `SessionTimeout` — ticks before session timeout (implementation plan defines)
  - `VerificationCriteria` — list of criteria per task (compile, lint, test pass, TLA+ coverage)
  - `MaxReviewRevisions = 3` — maximum revision cycles before session FAILED
  - `MaxReviewerRetries = 2` — maximum retries per reviewer for crash/timeout before marked UNAVAILABLE
  - `MinReviewQuorum = 5` — minimum number of non-UNAVAILABLE reviewer responses required (out of 8)

## Domain Types

### Pipeline States

```
IDLE → INPUT_VALIDATING → INPUT_VALID → TIER_EXECUTING → TIER_VERIFYING → TIER_VERIFIED
                                                                    ↓
INPUT_INVALID (halt)    TIER_FAILED (halt)    MERGING → MERGE_ROLLBACK (halt)
                                                    ↓
                                              ALL_TIERS_COMPLETE (terminal)
                                              HALTED (terminal)
```

### Task States

```
PENDING → DISPATCHED → RUNNING → COMPLETED → LOCAL_REVIEW → REVIEWING → REVIEW_PASSED → MERGED
                        ↓           ↓                           ↓
                     FAILED    RE_DISPATCHING → RUNNING    REVIEW_FAILED → REVISING → REVIEWING (revision loop)
                        ↓                                       ↓
                   FIX_SESSION → COMPLETED (fix success)     FAILED (revision exhaustion → halt)
                        ↓
                     FAILED (fix exhaustion → halt)
```

### Execution Results

`SUCCESS`, `FAILED_LOGIC`, `FAILED_CORRUPTION`, `TIMEOUT`, `VERIFICATION_FAILED`, `MERGE_CONFLICT`, `TIER_ALL_FAILED`

### Developer Errors

`NONE`, `TIER_BLOCKED`, `TASK_FAILED`, `MERGE_EXHAUSTED`, `VERIFICATION_HALT`, `WORKTREE_FAILED`, `INPUT_INVALID`, `SESSION_TIMEOUT`

### Service Results

`OK`, `CONFLICT`, `NOT_FOUND`, `PERMISSION_DENIED`, `IO_ERROR`

### Merge Strategies

`PER_TASK` (default), `PER_TIER`, `DEFERRED` — currently only PER_TASK is behaviorally modeled.

## Process

### Phase 1 — Input Validation

1. Read the implementation plan file in full.
2. Validate:
   - Task list is non-empty
   - Agent roster is non-empty (at least one code writer + one test writer available)
   - Implementation plan has Execution Tiers section
   - Implementation plan has Task Assignment Table section
   - All tasks have valid tier assignments
   - Dependency DAG has no cycles, no backward dependencies
3. If validation passes: transition to `INPUT_VALID`.
4. If validation fails: transition to `INPUT_INVALID`, set `developerError = "INPUT_INVALID"`, set `errorCause` with diagnostic, halt pipeline. Update `docs/pipeline-state.md` with HALTED status and halt reason.

### Phase 2 — Tier Execution Loop

For each tier in order (1 through N):

#### 2a. Start Tier

1. Transition to `TIER_EXECUTING`.
2. Set all tasks in the current tier to `PENDING`.
3. Skip tasks whose dependencies are already `COMPLETED`, `MERGED`, or `SKIPPED`.

#### 2b. Dispatch Tasks (up to MaxConcurrent)

For each task in the current tier (batched by MaxConcurrent cap):

1. **Create worktree:** `git worktree add <path> -b <task-branch>` from the integration branch.
   - On success: transition task to `DISPATCHED`, set `worktreeActive = true`.
   - On failure: halt with `developerError = "WORKTREE_FAILED"`, `errorCause = "Worktree creation failed"`.

2. **Select agent pair:** Based on the task's assigned code writer and test writer from the implementation plan's Task Assignment Table. Available code writers: `typescript-writer`, `hono-writer`, `ui-writer`, `trainer-writer`. Available test writers: `vitest-writer`, `playwright-writer`.

3. **Dispatch agent pair:** Invoke both agents via the Agent tool in parallel, passing:
   - Task assignment (files, TLA+ coverage, tier number)
   - Partner agent identity
   - Accumulated pipeline context
   - Worktree path
   - Re-dispatch context (if re-dispatching after failure)
   - Transition task to `RUNNING`, increment `dispatchCount`, start `sessionTicks = 0`.

4. **Enforce dependency guard:** A task can only be dispatched when all its dependencies are in `COMPLETED`, `MERGED`, or `SKIPPED` state.

#### 2c. Session Management

For each active session:

1. **Session tick:** Increment `sessionTicks` each cycle. If `sessionTicks >= SessionTimeout`: transition to `FAILED`, set `executionResult = "TIMEOUT"`, `developerError = "SESSION_TIMEOUT"`.

2. **Task succeeds:** Agent pair reports completion. Transition to `COMPLETED`, set `executionResult = "SUCCESS"`, `mergeState = "PENDING"`, deactivate session.

3. **Task fails — logic error:** `executionResult = "FAILED_LOGIC"`. If `dispatchCount < MaxReDispatches`: transition to `RE_DISPATCHING`. The new pair inherits context: prior passing commits, last valid failing test, `tddCycle` count, `hasFailingTest` flag, `commitCount`.

4. **Task fails — corruption:** `executionResult = "FAILED_CORRUPTION"`. Halt immediately. Full reset required — no re-dispatch. Set `developerError = "TASK_FAILED"`, `errorCause = "Corruption detected - full reset required"`.

5. **Re-dispatch:** For tasks in `RE_DISPATCHING` state with `dispatchCount < MaxReDispatches`: increment `dispatchCount`, transition to `RUNNING`, start new session with fresh agent pair.

#### 2d. Tier Completion Check

When all tasks in the current tier reach a terminal state (`COMPLETED`, `FAILED`, or `SKIPPED`):

- If at least one task succeeded: transition to Phase 3 (Verification).
- If ALL tasks failed with `dispatchCount >= MaxReDispatches`: transition to `TIER_FAILED`, set `developerError = "TIER_BLOCKED"`, `errorCause = "All sessions in tier failed"`. Halt pipeline.

### Phase 3 — Verification

1. **Begin verification:** Transition to `TIER_VERIFYING`. All sessions must be inactive.

2. **Run verification criteria** for each completed task in the tier:
   - Compilation check (no syntax errors)
   - Type-check (`npx tsc --noEmit`)
   - Lint (`npx eslint .`)
   - Test suite passes
   - TLA+ coverage: states/transitions assigned to this task are covered by tests

3. **Verification passes:** All completed tasks pass all criteria. Transition to `TIER_VERIFIED`.

4. **Verification fails:** Any completed task fails any criterion, with no active sessions remaining. Halt with `developerError = "VERIFICATION_HALT"`, `errorCause = "Inter-tier verification failed - task-graph defect"`. This is a task-graph defect — escalate to user.

### Phase 3b — Reviewer Gate

After LOCAL_REVIEW completes for a task, the project-manager dispatches all 8 reviewer agents in parallel:

1. `artifact-reviewer`
2. `compliance-reviewer`
3. `bug-reviewer`
4. `simplicity-reviewer`
5. `type-design-reviewer`
6. `security-reviewer`
7. `backlog-reviewer`
8. `test-reviewer`

#### Reviewer Input

Each reviewer receives:
- Session diff (the changes produced by the pair)
- Task assignment context (files, tier, TLA+ coverage targets)
- Pipeline artifacts: briefing, TLA+ spec, design consensus

#### Reviewer Output

Each reviewer returns a structured `ReviewVerdict`:
- `verdict`: `PASS` | `FAIL`
- `scope`: `SESSION_DIFF` | `OUT_OF_SCOPE`
- `findings[]`: list of findings with location, severity, and description

#### Gate Evaluation

- All 8 reviewers must finish (or be marked UNAVAILABLE after retry exhaustion).
- A quorum of `MinReviewQuorum` (5 of 8) must have responded (not UNAVAILABLE).
- All responded reviewers must have a `PASS` verdict.

#### Gate Outcomes

- **Pass:** All responded reviewers returned PASS and quorum met. Transition to `REVIEW_PASSED`, proceed to merge.
- **Fail:** Any responded reviewer returned FAIL. Transition to `REVIEW_FAILED`, send all findings to the pair for revision.
- **No quorum:** Fewer than `MinReviewQuorum` reviewers responded. Transition to `FAILED` (escalate to user).

#### Revision Cycle

On `REVIEW_FAILED`, the pair revises based on reviewer findings. The task transitions to `REVISING`. After the pair completes revisions, ALL 8 reviewers re-run (full re-run, not selective).

**Full re-run rationale:** Safety over efficiency — any revision could invalidate any reviewer's prior pass. Cross-domain regressions are possible (e.g., a security fix could break simplicity or type design). Running all reviewers on every revision eliminates the risk of stale passes.

The revision cycle is bounded by `MaxReviewRevisions` (3). On exhaustion, the session transitions to `FAILED`.

#### Reviewer Retries

Each individual reviewer has `MaxReviewerRetries` (2) for crash or timeout. After exhaustion, the reviewer is marked `UNAVAILABLE` and excluded from quorum counting.

#### Mediation

The project-manager mediates between pairs and reviewers. Pairs never interact with reviewers directly — all findings and revision requests flow through the project-manager.

#### Handoff Chain

`LOCAL_REVIEW` → `REVIEWING` (all 8 reviewers dispatched) → `REVIEW_PASSED` → `MERGED` (via merge phase)
`REVIEW_FAILED` → `REVISING` (pair revises) → `REVIEWING` (full re-run)

### Phase 4 — Merge

1. **Begin merging:** Transition to `MERGING`. Only tasks with `mergeState = "PENDING"` are queued.

2. **Serialized merge queue:** Process one task at a time:
   a. `git merge --no-ff <task-branch>` into integration branch.
   b. Run full test suite on the integration branch after each merge.
   c. If merge succeeds and tests pass: `mergeState = "MERGED"`, add to `mergedTasks`, delete worktree.
   d. If merge fails (conflict) or post-merge test fails: transition to Phase 5 (Conflict Resolution).

3. **After all merges complete:** Transition back to `TIER_EXECUTING` (if more tiers remain) or proceed to Phase 6 (All Tiers Complete).

### Phase 5 — Conflict Resolution

1. **Merge conflict:** Increment `fixRetryCount` for the task. Set `mergeState = "CONFLICT"`, `taskState = "FIX_SESSION"`.

2. **Spawn fix session:** Dispatch a fresh agent pair to resolve the conflict. The fix session works in a new worktree created from the integration branch.

3. **Fix succeeds:** Task transitions to `COMPLETED`, `mergeState = "PENDING"`. Retry the merge (return to Phase 4, step 2).

4. **Fix fails (retry exhausted):** If `fixRetryCount >= MaxFixRetries`:
   - Transition to `MERGE_ROLLBACK`.
   - Remove task from `mergedTasks`, set `mergeState = "ROLLED_BACK"`.
   - Halt with `developerError = "MERGE_EXHAUSTED"`, `errorCause = "Merge fix retries exhausted - rollback"`.

### Phase 6 — All Tiers Complete

1. When `pipelineState = "TIER_VERIFIED"` and all tasks are `COMPLETED`, `MERGED`, or `SKIPPED` with all merges done:
2. Transition to `ALL_TIERS_COMPLETE`.
3. Release state lock, clear `developerError`.
4. The pipeline orchestrator takes over for global review.

### Phase 7 — Halt (Error Escape)

From any non-terminal, non-validating state:
1. Transition to `HALTED`.
2. Release state lock.
3. Set `developerError`, `errorTier`, `errorTask`, `errorCause` with full diagnostic.
4. Update `docs/pipeline-state.md` with HALTED status and halt reason.

## State Lock

A single-writer lock (`pipelineStateLocked`) protects `docs/pipeline-state.md` from concurrent writes:

- **Acquire:** `pipelineStateLocked = false` → set to `true` before any state transition.
- **Release:** `pipelineStateLocked = true` → set to `false` on terminal states or after each transition.
- **Lockable states:** All non-terminal states except `TIER_FAILED` and `INPUT_INVALID`.
- **Invariant:** No state transition occurs while `pipelineStateLocked = true`.

## Error Classification

| Error Type | `executionResult` | Recovery | Context Inheritance |
|---|---|---|---|
| Logic error | `FAILED_LOGIC` | Re-dispatch (bounded) | Yes — inherits prior passing commits, last valid failing test, tddCycle, hasFailingTest, commitCount |
| Corruption | `FAILED_CORRUPTION` | Halt — full reset required | No — ignore all prior context |
| Timeout | `TIMEOUT` | Treated as failure | N/A |
| Merge conflict | `MERGE_CONFLICT` | Fix session (bounded retries) | Fresh pair, clean worktree |

## Safety Invariants

The following invariants are enforced at all times (verified by TLA+ TLC model checking):

| Invariant | Description |
|---|---|
| `TypeOK` | All variables within declared domains |
| `DispatchBounded` | `dispatchCount[t] <= MaxReDispatches` for all tasks |
| `FixRetryBounded` | `fixRetryCount[t] <= MaxFixRetries` for all tasks |
| `SessionTimeoutEnforced` | `sessionTicks[t] <= SessionTimeout` for all active sessions |
| `ErrorObservability` | Every non-NONE error has meaningful tier/task/cause |
| `MergeAfterCompletion` | Tasks only merged after COMPLETED and verification passed |
| `VerificationBeforeAdvance` | Tier advance requires all verification criteria met |
| `CorruptionHaltsImmediately` | Corruption always results in HALTED |
| `NoReDispatchAfterCorruption` | Corrupted tasks cannot be re-dispatched |
| `MergedTasksSubset` | `mergedTasks` is always a subset of completed tasks |
| `ConcurrentSessionsBounded` | Active sessions never exceed `MaxConcurrent` |
| `ReviewRevisionsBounded` | Revision count per task never exceeds `MaxReviewRevisions` |
| `ReviewerRetriesBounded` | Retry count per reviewer never exceeds `MaxReviewerRetries` |
| `ReviewAfterLocalReview` | Tasks only enter REVIEWING after LOCAL_REVIEW completes |

## Liveness Properties

| Property | Description |
|---|---|
| `EventuallyTerminal` | Pipeline eventually reaches ALL_TIERS_COMPLETE or HALTED |
| `SessionProgress` | Active sessions eventually complete or fail |
| `TaskEventuallyTerminal` | Every task eventually reaches COMPLETED, FAILED, or SKIPPED |
| `EventuallyComplete` | From INPUT_VALID, pipeline eventually reaches ALL_TIERS_COMPLETE |

## Pipeline State File

The project manager updates `docs/pipeline-state.md` throughout Stage 6 execution.

### Detection

The project manager knows it is in a pipeline run when `docs/pipeline-state.md` exists and the run-level Status is `ACCUMULATING`.

### Pre-Write Validation

Before writing the Stage 6 StageResult, validate that Stages 1-5 StageResult sections are populated. If any prior section is missing or empty, halt with a schema validation error — do not write Stage 6.

### Writing Stage 6 StageResult

- **On confirmation gate pass:** Set Status to `IN PROGRESS`, Artifact to integration branch name, Timestamp to current ISO 8601.
- **During execution:** Update Status to reflect current sub-state (`TIER_EXECUTING`, `TIER_VERIFYING`, `MERGING`, etc.).
- **On completion:** Set Status to `COMPLETE`.
- **On halt:** Set Status to `HALTED`, set Halt Reason in Git section.

### Section-Scoped Ownership

Write only to the Stage 6 section and the Git section. Do not modify any other stage's section or the run metadata. Cross-section writes are domain invariant violations.

## Output Format

On completion (`ALL_TIERS_COMPLETE`):

```
Stage 6: Pair Programming — Complete

Tiers executed: <N>
Tasks completed: <N of M>
Total TDD cycles: <N>
Total commits: <N>

Integration branch: design-pipeline/<topic-slug>
All merges complete, post-merge tests pass.

State file: docs/pipeline-state.md
```

On halt:

```
Stage 6: Pair Programming — Halted

Stopped at: <sub-state>
Halt reason: <TIER_ALL_FAILED | VERIFICATION_FAILED | MERGE_CONFLICT_UNRESOLVABLE | WORKTREE_FAILED | INPUT_INVALID | SESSION_TIMEOUT | TASK_FAILED>

Error tier: <N or 0>
Error task: <task-id or NONE>
Error cause: <diagnostic message>

Completed tasks: <N of M>
Integration branch: design-pipeline/<topic-slug> (partial work)

State file: docs/pipeline-state.md
```

## Worktree Management

- **Create:** `git worktree add <base-path>/<task-id> -b <task-branch>` from the integration branch
- **Cleanup on success:** Delete worktree after merge completes
- **Cleanup on failure:** Archive diff to temporary location, then delete worktree before re-dispatch
- **Windows cap:** Maximum 3 concurrent worktrees (MAX_PATH limits, I/O contention, Windows Defender scanning)

## Commit Strategy

- **One commit per TDD cycle:** Each RED-GREEN-REFACTOR produces a commit in the worktree branch
- **No squash on tier branches:** Preserve full TDD commit history for auditability and `git bisect`
- **Merge to integration branch:** Use `--no-ff` merge so `git log --first-parent` reads cleanly

## Constraints

- The project manager does NOT write code or implementation artifacts
- The project manager does NOT make design decisions
- The project manager does NOT modify the implementation plan, TLA+ spec, or briefing
- The project manager does NOT form opinions about feature correctness
- Maximum 3 concurrent worktrees on Windows (MaxConcurrent = 3)
- Re-dispatches are bounded per task (MaxReDispatches)
- Merge conflict retries are bounded per task (MaxFixRetries)
- Sessions cannot be resumed — if halted, start a new `/design-pipeline` run

## Reviewer Gate

### Crash/Timeout Handling

Each reviewer gets `MaxReviewerRetries = 2` retry attempts when a crash or timeout occurs. If retries are exhausted, the reviewer is marked `UNAVAILABLE` and the gate proceeds with N-1 reviewers. If the number of responded reviewers falls below `MinReviewQuorum = 5`, the task FAILS — the gate cannot produce a valid verdict without sufficient reviewer coverage.

**Design decision — per-round retry reset:** Retry counts reset to zero on each revision cycle. A reviewer that crashed during round 1 gets a fresh `MaxReviewerRetries = 2` budget in round 2. This is an explicit design decision per TLA+ review amendment 5: transient failures (network, resource pressure) are unlikely to persist across revision boundaries, and penalizing reviewers for prior-round crashes would unnecessarily shrink the quorum over time.

### Contradictory Reviewer Findings

When reviewers produce conflicting findings (e.g., simplicity reviewer vs type-design reviewer disagree on approach), both sets of findings are sent to the implementing pair to reconcile. The project-manager does NOT arbitrate between reviewers — it is not qualified to make domain judgments.

If contradictions persist after `MaxReviewRevisions` revision cycles are exhausted, the session FAILS with structured metadata: `{conflicting_reviewers: [...], conflict_details: [...], revision_history: [...]}`. This metadata enables post-mortem analysis of why consensus could not be reached.

### Scope/Verdict Consistency

An `OUT_OF_SCOPE + PASS` verdict means the reviewer's domain was not applicable to the session diff. These verdicts count toward quorum (the reviewer responded and evaluated), but the review gate requires at least one `SESSION_DIFF`-scoped `PASS` to pass the gate. This prevents an all-`OUT_OF_SCOPE` pass — a semantic hole identified during TLA+ review — where every reviewer declares the diff outside their domain and the gate passes vacuously with no substantive review.

## Global Review Double-Pass Protocol

After all tiers are merged and inter-tier verification passes, the project-manager executes a double-pass global review before declaring Stage 6 complete. This protocol is formally verified by the TLA+ specification in `docs/tla-specs/conventions-hook-cleanup-e2e-global-review/GlobalReview.tla`.

### 3-Step Sequence

Each pass executes three steps in order:

1. **test** — Run the full test suite (`vitest run`)
2. **lint** — Run the linter (`npx eslint .`)
3. **tsc** — Run the type checker (`npx tsc --noEmit`)

### States

The double-pass protocol is a state machine with 7 states:

| State | Description |
|---|---|
| `idle` | PM has not started global review |
| `running` | PM is executing a step (test/lint/tsc) within a pass |
| `fixing` | PM is applying an inline fix after a step's first failure |
| `clean1` | Pass 1 completed with all steps eventually passing |
| `success` | Pass 2 completed cleanly; global review passes |
| `restarting` | Full-sequence restart after a retry failure; fixCount increments |
| `exhausted` | fixCount >= MaxGlobalFixes(3); pipeline halts with GLOBAL_REVIEW_EXHAUSTED |

### Transitions

| Transition | From | To | Condition |
|---|---|---|---|
| `StartReview` | idle | running | Enter global review, start pass 1 at step 1 |
| `StepClean` | running | running | Current step passes, advance to next step |
| `LastStepCleanPass1` | running | clean1 | Last step passes on pass 1 |
| `LastStepCleanPass2` | running | success | Last step passes on pass 2 |
| `StartPass2` | clean1 | running | Begin pass 2 at step 1 |
| `StepFailFirstAttempt` | running | fixing | Step fails with retryFlag=0 (per-step retry cap not yet used) |
| `ApplyInlineFix` | fixing | running | PM fixes inline, re-runs step with retryFlag=1 |
| `StepFailAfterRetry` | running | restarting | Step fails with retryFlag=1 (per-step retry cap of 1 exceeded) |
| `RestartSequence` | restarting | running | fixCount+1 < MaxGlobalFixes, restart from step 1 pass 1 |
| `BecomeExhausted` | restarting | exhausted | fixCount+1 >= MaxGlobalFixes |
| `Stutter` | success/exhausted | unchanged | Terminal state stuttering |

### Safety Rules

These rules are enforced at all times (verified by TLA+ model checking):

- **FixCountBounded:** fixCount never exceeds MaxGlobalFixes(3)
- **Pass2RequiresCleanPass1:** Pass 2 (passNumber=2) only begins after a complete clean pass 1
- **RetryCapRespected:** Each step gets at most 1 inline fix attempt per pass (retryFlag in {0, 1}, per-step retry cap of 1)
- **SuccessRequiresPass2:** The `success` state is only reachable after completing pass 2
- **ExhaustedRequiresMaxFixes:** The `exhausted` state is only reachable when fixCount equals MaxGlobalFixes(3)
- **InlineFixOnlyOnFirstFailure:** The `fixing` state is only entered when retryFlag=0 (first failure)
- **NoFixWithoutRunning:** The `fixing` state requires currentStep >= 1 (a step was actually running)

### Termination

The protocol always terminates (EventualTermination liveness property): the pipeline eventually reaches either `success` (pass 2 completed cleanly) or `exhausted` (fixCount reached MaxGlobalFixes). On `exhausted`, the pipeline halts with `GLOBAL_REVIEW_EXHAUSTED`.

### Execution Procedure

1. Enter `idle`. Transition to `running` (StartReview).
2. Execute each step (test, lint, tsc) in order.
3. If a step passes, advance to the next step (StepClean).
4. If a step fails on first attempt (retryFlag=0), transition to `fixing`. Apply an inline fix targeting the specific failure, then re-run the same step with retryFlag=1 (ApplyInlineFix).
5. If a step fails after retry (retryFlag=1), transition to `restarting`. Increment fixCount. If fixCount < MaxGlobalFixes(3), restart the entire sequence from step 1, pass 1 (RestartSequence). Otherwise, transition to `exhausted` (BecomeExhausted).
6. If all 3 steps pass on pass 1, transition to `clean1`. Then start pass 2 (StartPass2).
7. If all 3 steps pass on pass 2, transition to `success`. Global review passes.

## Handoff

- **Receives from:** Design pipeline orchestrator (after confirmation gate passes)
- **Passes to:** Design pipeline orchestrator (for global review when all tiers complete)
- **Format:** Inline summary of execution results + updated `docs/pipeline-state.md`
