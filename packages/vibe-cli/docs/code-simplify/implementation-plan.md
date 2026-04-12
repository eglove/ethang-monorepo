# Implementation Plan: Code Simplify (Stage 8 Rewrite)

## Source Artifacts

| Artifact | Path |
|----------|------|
| Requirements Briefing | `docs/code-simplify/elicitor.md` |
| BDD Scenarios | `docs/code-simplify/bdd.feature` |
| TLA+ Specification | `docs/code-simplify/tla/CodeSimplify.tla` |

## Revision Notes — Debate Objections Addressed

### Round 1 Objections (prior revision)

| # | Objection | Resolution |
|---|-----------|------------|
| 1 | No compound timeout test — all reviewers + moderator timeout simultaneously | Added to Step 4 (review-loop): test that all 8 reviewers timeout AND moderator timeout simultaneously produces pass-with-warning and writes note to user_notes.md |
| 2 | No merge-conflict-on-first-task test — conflict on T1 structurally different from T2+ | Added to Step 8: explicit test for merge conflict on T1 (first task) where feature branch has no prior merges; verifies conflict resolution + double-pass when merge base is pristine |
| 3 | No alternating tier-size E2E test — [3,1,2] pattern exercises worktree/no-worktree transitions | Added to Step 10: E2E integration test with 3-tier [3,1,2] plan exercising worktree→no-worktree→worktree transitions |
| 4 | Resume with partially-merged partially-cleaned state undertested | Added to Step 10: test resume when crash occurred mid-merge (some branches merged, some worktrees still exist) — verifies skip-merged-branches + cleanup of orphan worktrees |
| 5 | No idempotency guarantee for step re-execution in CI | Added to Step 10: idempotency test — re-running a completed tier produces same result (checkpoint already written, worktrees already cleaned); added config snapshot at pipeline start to Step 5 |
| 6 | No rollback strategy for partial step completion | Added to Step 8: rollback test — on unresolvable merge escalation with Stop, verify feature branch is reset to pre-merge state (git reset to checkpoint commit) |
| 7 | T1/T5 dependency fragility — T5 full rewrite may not need T1 first | Restructured: T5 no longer depends on T1. T1 and T5 are now independent in Tier 1. T5 rewrites 8-coding.ps1 from scratch (not a modify), so dead code deletion is a parallel concern |
| 8 | Config mutation mid-pipeline could change maxTiers | Added to Step 5: config snapshot — implementation-plan.json is read once at startup and cached; test that modifying the file mid-pipeline does not change tier count |
| 9 | No test for zero-diff task completion advancing tier | Added to Step 6: test that Claude produces zero diff (no changes) for a task, tier still advances through WorktreeCleanup to next tier |

### Round 2 Objections (this revision)

| # | Objection | Resolution |
|---|-----------|------------|
| R2-1 | Counter-reset assertions missing for ReviewFail transitions | Added to Steps 7 and 9: explicit assertions that wtDoublePassRetries=0, wtConsecPasses=0 on re-entering double-pass after PerWT_ReviewFail; same for glDoublePassRetries=0, glConsecPasses=0 after GlobalReviewFail |
| R2-2 | KeepGoing advancement tests in Step 7 not split by position | Split Step 7 KeepGoing tests into mid-tier (advance to next task with counter resets: wtDoublePassRetries=0, wtConsecPasses=0, wtReviewRounds=0) and last-task (advance to SequentialMerge without counter resets) paths |
| R2-3 | No zero-checkpoint crash test | Added to Step 10: crash before any tier completes (lastCompletedTier=0), --resume starts fresh with warning (TLA+ Resume requires lastCompletedTier > 0) |
| R2-4 | No dedicated ResumeToGlobal test | Added to Step 10: resume when lastCompletedTier=MaxTiers jumps directly to GlobalDoublePass (tests the ResumeToGlobal TLA+ action separately from Resume) |
| R2-5 | S2 (LockHeldDuringExecution) only tested in Step 5 | Added lock-held assertions to Steps 6, 7, 8, and 9 for each new active phase they introduce |
| R2-6 | No input re-validation on resume path | Added to Step 10: resume path re-validates that implementation-plan.json and fixture files still exist before continuing; halt with specific message if files moved/deleted |
| R2-7 | Sub-tier resume granularity gap and merged-branch detection undocumented | Added documentation section "Resume Granularity Design Notes" explaining: (a) resume is tier-granular not sub-tier, (b) partial merge detection uses `git branch --merged` against feature branch, (c) orphan worktree detection uses `git worktree list` |
| R2-8 | WorktreeCleanup ordering unspecified (checkpoint-first vs cleanup-first) | Specified checkpoint-first ordering: write lastCompletedTier marker BEFORE removing worktrees, so crash during cleanup still has a valid checkpoint; added ordering test to Step 8 |

## Resume Granularity Design Notes

### Sub-Tier Resume Granularity Gap

The TLA+ spec models resume at **tier granularity** via `lastCompletedTier`. There is no sub-tier checkpoint (e.g., "completed PerWT_DoublePass for task 2 of 3"). This is an intentional simplification:

- **Trade-off**: Sub-tier checkpoints would add complexity (tracking per-task state, partial review results) for marginal benefit. A tier typically takes minutes, not hours. Re-running a tier from scratch after crash is acceptable.
- **Consequence**: On resume, the entire tier is re-dispatched to Claude. Worktrees from the crashed tier may still exist and must be cleaned up before re-dispatch.

### Merged-Branch Detection on Resume

When resuming after a crash during `SequentialMerge`:
1. Use `git branch --merged <feature-branch>` to identify which worktree branches were already merged.
2. Skip merge for already-merged branches; proceed to next unmerged branch.
3. This is a **best-effort heuristic** — if the feature branch was force-pushed or rebased between crash and resume, detection may be incorrect. The implementation should log which branches it detects as merged vs. pending.

### Orphan Worktree Detection on Resume

When resuming after a crash during `WorktreeCleanup`:
1. Use `git worktree list` to identify remaining worktrees.
2. Remove any worktrees associated with the crashed tier before advancing.
3. Log each worktree removal (or failure) individually.

### WorktreeCleanup Ordering: Checkpoint-First

The `WorktreeCleanup` phase uses **checkpoint-first** ordering:
1. **Write** `lastCompletedTier = currentTier` marker to pipeline.log
2. **Then** remove worktrees

**Rationale**: If the process crashes during worktree removal, the checkpoint is already written. On `--resume`, the pipeline skips the completed tier and cleans up orphan worktrees as part of resume initialization. The alternative (cleanup-first) would risk losing the checkpoint on crash, forcing a full tier re-run even though all merges completed successfully.

## TLA+ State Coverage Matrix

### States (Phases)
- `Init` — entry state; models the pre-coding commit gate
- `LockAcquire` — acquire pipeline.lock (or reject if held by another PID)
- `InputValidation` — validate implementation-plan.json and fixture files exist and parse
- `FixtureCoverage` — string-match fixture entries against test files; send gaps to Claude
- `ClaudeDispatch` — dispatch Claude with inline prompt for current tier's tasks
- `PerWT_DoublePass` — per-worktree pnpm test -> pnpm lint x2 consecutive
- `PerWT_Review` — per-worktree reviewer dispatch via review-moderator
- `SequentialMerge` — merge worktree branches to feature branch in task order
- `MergeConflictDP` — double-pass on feature branch after conflict resolution
- `WorktreeCleanup` — remove worktrees; checkpoint lastCompletedTier; advance to next tier or global gates
- `GlobalDoublePass` — pnpm test -> pnpm lint x2 on merged feature branch
- `GlobalReview` — full-diff reviewer dispatch via review-moderator
- `Complete` — terminal success state; lock released
- `Halted` — terminal failure/stop state; lock released

### Transitions (Named Actions)
- `PreCodingGatePass` — clean working tree, proceed to LockAcquire
- `PreCodingGateHalt` — user declines to commit, pipeline halts
- `LockAcquire` — lock acquired, proceed to InputValidation
- `LockAcquireReject` — lock held by other PID, pipeline halts
- `InputValidationPass` — all inputs valid, proceed to FixtureCoverage
- `InputValidationFail` — missing/malformed input, pipeline halts
- `FixtureCoverageCheck` — coverage check completes (gaps sent to Claude), proceed to ClaudeDispatch
- `ClaudeDispatchWithWorktrees` — Claude creates worktrees for tier tasks
- `ClaudeDispatchNoWorktrees` — single-task tier, Claude works on feature branch; routes through WorktreeCleanup
- `PerWT_DoublePassSucceed` — one consecutive pass (increment counter; at 2 -> PerWT_Review)
- `PerWT_DoublePassFail` — test/lint fails, send to Claude, increment retry counter, reset consec
- `PerWT_DoublePassEscalate` — MaxDoublePassRetries reached, prompt user
- `PerWT_DoublePassKeepGoing` — user selects Keep Going, proceed to review
- `PerWT_DoublePassStop` — user selects Stop, pipeline halts
- `PerWT_ReviewPass` — verdict pass, advance to next task or SequentialMerge
- `PerWT_ReviewTimeout` — all reviewers/moderator timed out, treat as pass
- `PerWT_ReviewFail` — blocker found, Claude fixes, re-run double-pass (resets wtDoublePassRetries=0, wtConsecPasses=0)
- `PerWT_ReviewEscalate` — MaxReviewRounds reached, prompt user
- `PerWT_ReviewKeepGoing` — user selects Keep Going, proceed to merge queue
- `PerWT_ReviewStop` — user selects Stop, pipeline halts
- `MergeClean` — no conflicts, advance to next task or WorktreeCleanup
- `MergeConflict` — conflict detected, Claude resolves, enter MergeConflictDP
- `MergeConflictUnresolvable` — Claude cannot resolve, escalate to user
- `MergeEscKeepGoing` — user selects Keep Going, skip merge and continue
- `MergeEscStop` — user selects Stop, pipeline halts
- `MergeDP_Succeed` — post-conflict double-pass succeeds, continue merge sequence
- `MergeDP_Fail` — post-conflict double-pass fails, Claude fixes, retry
- `MergeDP_Escalate` — MaxDoublePassRetries reached after conflict, prompt user
- `MergeDP_KeepGoing` — user selects Keep Going, continue merge sequence
- `MergeDP_Stop` — user selects Stop, pipeline halts
- `WorktreeCleanup` — checkpoint lastCompletedTier (FIRST), then remove worktrees, then advance to next tier or GlobalDoublePass
- `GlobalDP_Succeed` — one consecutive pass (increment counter; at 2 -> GlobalReview)
- `GlobalDP_Fail` — test/lint fails, send to Claude, increment retry counter
- `GlobalDP_Escalate` — MaxDoublePassRetries reached, prompt user
- `GlobalDP_KeepGoing` — user selects Keep Going, proceed to GlobalReview
- `GlobalDP_Stop` — user selects Stop, pipeline halts
- `GlobalReviewPass` — verdict pass, pipeline completes
- `GlobalReviewTimeout` — all reviewers/moderator timed out, treat as pass, pipeline completes
- `GlobalReviewFail` — blocker found, Claude fixes, re-run global double-pass (resets glDoublePassRetries=0, glConsecPasses=0)
- `GlobalReviewEscalate` — MaxReviewRounds reached, prompt user
- `GlobalReviewKeepGoing` — user selects Keep Going, pipeline completes
- `GlobalReviewStop` — user selects Stop, pipeline halts
- `Crash` — unhandled error from any active phase; finally block releases lock; sets crashed=TRUE
- `Resume` — restart from crash at next tier after last checkpoint (requires lastCompletedTier > 0 AND < MaxTiers)
- `ResumeToGlobal` — restart from crash when all tiers were complete (lastCompletedTier = MaxTiers); jump to GlobalDoublePass
- `Done` — terminal stuttering step (Complete or Halted)

### Safety Invariants
- `TypeOK` — all variables within declared type bounds
- `LockReleasedOnTermination` (S1) — lock is always released when phase is Complete or Halted
- `LockHeldDuringExecution` (S2) — lock must be held during all active phases (not Init, LockAcquire, Complete, Halted)
- `DoublePassRetriesInBounds` (S3) — wtDoublePassRetries, mergeDoublePassRetries, glDoublePassRetries never exceed MaxDoublePassRetries
- `ReviewRoundsInBounds` (S4) — wtReviewRounds, glReviewRounds never exceed MaxReviewRounds
- `OutcomeConsistency` (S5) — phase and pipelineOutcome are always consistent
- `ConsecutivePassBound` (S6) — wtConsecPasses, mergeConsecPasses, glConsecPasses never exceed 2
- `NoReReviewAfterConflict` (S7) — from MergeConflictDP, successors are only MergeConflictDP, SequentialMerge, WorktreeCleanup, or Halted

### Liveness Properties
- `EventualTermination` (L1) — pipeline eventually reaches Complete or Halted
- `GlobalReviewLeadsToEnd` (L2) — GlobalReview phase leads to Complete or Halted
- `EscalationEventuallyResolved` (L3) — escalationActive always eventually becomes false
- `LockEventuallyReleased` (L4) — lockHeld always eventually becomes false

---

## Implementation Steps

### Step 1: Delete Dead Stage 8 Code

**Files:**
- `agents/code-writers/` (delete directory)
- `agents/test-writers/` (delete directory)
- `utils/pipeline-state.ps1` (delete)
- `utils/tdd-cleanup.ps1` (delete)

**Description:**
Remove the four items that constitute the complete dead-code deletion set. The code-writers/ and test-writers/ directories contain language-specific writer agents that are replaced by Claude's native dispatch. The pipeline-state.ps1 TLA+-backed state machine and tdd-cleanup.ps1 utility are no longer needed since PowerShell handles only mechanical verification gates. This step must verify that doc-writers/ and experts/ are preserved unchanged.

**Dependencies:** None

**Test (write first):**
- `tests/dead-code-deletion.Tests.ps1` (create)
- Assert `agents/code-writers/` directory does not exist
- Assert `agents/test-writers/` directory does not exist
- Assert `utils/pipeline-state.ps1` does not exist
- Assert `utils/tdd-cleanup.ps1` does not exist
- Assert `agents/doc-writers/` directory still exists with its original files
- Assert `agents/experts/` directory still exists with its original files

**TLA+ Coverage:**
- Prerequisite: Enables the rewrite by removing replaced code. No direct phase mapping — this is a structural prerequisite.

---

### Step 2: Create 8 Reviewer Agent Definitions

**Files:**
- `agents/reviewers/a11y.md` (create)
- `agents/reviewers/ai-agent.md` (create)
- `agents/reviewers/bug.md` (create)
- `agents/reviewers/compliance.md` (create)
- `agents/reviewers/security.md` (create)
- `agents/reviewers/simplicity.md` (create)
- `agents/reviewers/test.md` (create)
- `agents/reviewers/type-design.md` (create)

**Description:**
Create the 8 specialized reviewer agent markdown files. Each reviewer receives a diff as input and returns structured JSON with a `findings` array. Each finding has fields: `severity` (critical|high|medium|low), `description`, `files`, `suggestion`. The agents are dispatched in parallel by the review-moderator. Individual reviewer timeout is 600s (ReviewerTimeout).

**Dependencies:** None

**Test (write first):**
- `tests/reviewer-agents.Tests.ps1` (create)
- Assert all 8 agent files exist at `agents/reviewers/<name>.md`
- Assert each file is non-empty
- Assert each file contains instructions for JSON output format with `findings` array
- Assert each file specifies the expected finding fields: severity, description, files, suggestion
- Assert each file specifies the severity enum: critical, high, medium, low

**TLA+ Coverage:**
- Transition: `PerWT_ReviewPass`, `PerWT_ReviewFail`, `PerWT_ReviewTimeout` — reviewers produce findings consumed by these transitions
- Transition: `GlobalReviewPass`, `GlobalReviewFail`, `GlobalReviewTimeout` — same reviewers used at global level

---

### Step 3: Create Review-Moderator Agent

**Files:**
- `agents/review-moderator.md` (create)

**Description:**
Create the review-moderator agent that orchestrates reviewer dispatch. The moderator: (1) pre-filters the 8 reviewers based on diff content to exclude irrelevant reviewers, (2) dispatches selected reviewers in parallel, (3) waits for responses or timeout (ReviewerTimeout=600s per reviewer), (4) handles malformed responses by logging warning and skipping, (5) consolidates findings into a verdict: "fail" if any critical/high finding exists, "pass" otherwise, with medium/low findings flagged as notes. Moderator's own timeout is 300s (ReviewModeratorTimeout). If all reviewers time out, verdict is "pass" with warning.

**Dependencies:** None

**Test (write first):**
- `tests/review-moderator-agent.Tests.ps1` (create)
- Assert `agents/review-moderator.md` exists
- Assert file contains pre-filter logic instructions
- Assert file specifies parallel dispatch of selected reviewers
- Assert file specifies consolidation rules (critical/high -> fail, medium/low -> notes)
- Assert file specifies verdict output format: "pass" or "fail"
- Assert file specifies timeout handling: skip timed-out reviewers, all-timeout -> pass with warning
- Assert file specifies malformed response handling: log warning, skip reviewer

**TLA+ Coverage:**
- Transition: `PerWT_ReviewPass`, `PerWT_ReviewFail`, `PerWT_ReviewTimeout` — moderator produces verdict
- Transition: `GlobalReviewPass`, `GlobalReviewFail`, `GlobalReviewTimeout` — same moderator at global level
- Invariant: `ReviewRoundsInBounds` (S4) — moderator participates in the review round cycle

---

### Step 4: Create Review-Loop Utility

**Files:**
- `utils/review-loop.ps1` (create)

**Description:**
Create the PowerShell utility that manages reviewer dispatch, consolidation, retry cycles, and user_notes.md writing. Exports two functions: `Invoke-ReviewLoop` (dispatches review-moderator with a diff, handles pass/fail/timeout, manages review round counting and escalation) and `Write-UserNotes` (creates or appends to `docs/<feature>/user_notes.md` with reviewer name, severity, description, and suggestion; marks escalated blockers as "Unresolved Escalated Blocker"). The loop enforces MaxReviewRounds=3 per gate. On fail verdict, returns blocker details for Claude to fix. On pass with notes, writes notes to user_notes.md. On clean pass (0 findings), does not touch user_notes.md.

**Dependencies:** 2, 3 (needs reviewer agent files and moderator to exist for dispatch)

**Test (write first):**
- `tests/review-loop.Tests.ps1` (create)
- Test `Invoke-ReviewLoop` dispatches review-moderator agent with the provided diff
- Test that verdict "pass" with 0 findings returns pass and does NOT modify user_notes.md
- Test that verdict "pass" with non-blocking notes returns pass AND appends notes to user_notes.md
- Test that each appended note includes reviewer name, severity, description, suggestion
- Test that verdict "fail" returns fail with blocker details
- Test that `Invoke-ReviewLoop` tracks review round count and escalates at MaxReviewRounds=3
- Test that on escalation + Keep Going, `Write-UserNotes` appends unresolved blocker with "Unresolved Escalated Blocker" marker
- Test that user_notes.md is created on first write if it doesn't exist
- Test that subsequent writes append without modifying prior entries
- Test that reviewer timeout (600s) logs warning and consolidates remaining results
- Test that moderator timeout (300s) treats as pass with warning
- **[R1-1] Test compound timeout: all 8 reviewers timeout simultaneously AND moderator timeout fires — verify produces pass-with-warning verdict, logs warning for each timed-out reviewer, and writes compound timeout note to user_notes.md**
- Test that malformed reviewer response logs warning and is skipped

**TLA+ Coverage:**
- State: `PerWT_Review` — review loop runs per-worktree
- State: `GlobalReview` — review loop runs at global level
- Transition: `PerWT_ReviewPass` — clean pass or pass-with-notes
- Transition: `PerWT_ReviewTimeout` — timeout handling path (including compound timeout)
- Transition: `PerWT_ReviewFail` — blocker found, return to caller for fix cycle
- Transition: `PerWT_ReviewEscalate` — MaxReviewRounds reached
- Transition: `PerWT_ReviewKeepGoing` — escalation resolved with Keep Going
- Transition: `PerWT_ReviewStop` — escalation resolved with Stop
- Transition: `GlobalReviewPass`, `GlobalReviewTimeout`, `GlobalReviewFail`, `GlobalReviewEscalate`, `GlobalReviewKeepGoing`, `GlobalReviewStop` — same logic at global level
- Invariant: `ReviewRoundsInBounds` (S4) — enforced by round counter in loop

---

### Step 5: Rewrite 8-coding.ps1 — Pipeline Lock, Pre-Coding Gate, Input Validation, Config Snapshot

**Files:**
- `stages/8-coding.ps1` (modify — begin rewrite)
- `tests/coding-stage.Tests.ps1` (modify — rewrite tests)

**Description:**
Begin the rewrite of 8-coding.ps1 (from ~28KB to target <10KB). This step implements the first three pipeline phases plus config snapshot: (1) Pre-coding commit gate — checks `git status` for uncommitted changes; if dirty, prompts user to commit or halt. (2) Pipeline lock — acquires `pipeline.lock` using existing `utils/pipeline-lock.ps1`; rejects if held by live PID; reclaims stale locks with warning. (3) Input validation — validates implementation-plan.json exists, parses as JSON, has non-empty tiers array, each tier has non-empty tasks array; validates fixture file existence. (4) **Config snapshot** — reads and caches implementation-plan.json into an in-memory object at startup; all subsequent tier/task references use this cached snapshot, not the file. This prevents mid-pipeline config mutation from changing maxTiers or task counts. The entire script is wrapped in a `try/finally` block where `finally` always releases the lock (Crash transition). Verbose logging to console and pipeline.log simultaneously. The `--resume` flag is accepted as a parameter.

**Dependencies:** None *(CHANGED: removed dependency on Step 1 — this is a full rewrite, not a patch)*

**Test (write first):**
- Rewrite `tests/coding-stage.Tests.ps1`:
- Test clean working tree passes pre-coding gate
- Test dirty working tree prompts user; accept -> commit and proceed; decline -> halt with message
- Test pipeline.lock created with current PID on start
- Test pipeline.lock released on successful completion
- Test pipeline.lock released on halt (user Stop)
- Test pipeline.lock released on crash (finally block)
- Test concurrent run rejected with error mentioning existing PID
- Test stale lock (dead PID) is reclaimed with warning
- Test implementation-plan.json not found -> halt with specific message
- Test implementation-plan.json malformed JSON -> halt with message
- Test implementation-plan.json empty tiers array -> halt with message
- Test tier with zero tasks -> halt with message
- Test fixture file not found -> halt with message
- Test lock is held during InputValidation phase (S2)
- Test pipelineOutcome consistent with phase (S5)
- **[R1-8] Test config snapshot immutability: modify implementation-plan.json after pipeline starts (add a tier mid-run); verify pipeline uses original tier count, not mutated file**
- **[R1-5] Test idempotency: calling the config snapshot loader twice with the same file returns identical cached object (pointer equality)**

**TLA+ Coverage:**
- State: `Init` — pre-coding gate
- State: `LockAcquire` — lock acquisition
- State: `InputValidation` — input file validation
- Transition: `PreCodingGatePass` — clean tree proceeds
- Transition: `PreCodingGateHalt` — user declines commit
- Transition: `LockAcquire` — lock acquired successfully
- Transition: `LockAcquireReject` — concurrent run rejected
- Transition: `InputValidationPass` — all inputs valid
- Transition: `InputValidationFail` — missing/malformed inputs
- Transition: `Crash` — finally block releases lock
- Invariant: `LockReleasedOnTermination` (S1) — finally block ensures release
- Invariant: `LockHeldDuringExecution` (S2) — lock held from LockAcquire through active phases
- Invariant: `OutcomeConsistency` (S5) — phase/outcome always consistent

---

### Step 6: 8-coding.ps1 — Fixture Coverage and Claude Dispatch

**Files:**
- `stages/8-coding.ps1` (modify — add fixture coverage + dispatch)

**Description:**
Add fixture coverage check and Claude dispatch to 8-coding.ps1. (1) Fixture coverage: load BDD and TLA+ fixture JSON files; for each entry, search test file contents for literal string match; collect uncovered entries; if both files empty, skip with warnings; if coverage gaps exist, include uncovered list in Claude prompt. (2) Claude dispatch: construct inline prompt with implementation-plan.json contents (from cached snapshot), feature docs path, fixture files, and uncovered fixture list; dispatch Claude for current tier; after Claude completes, check for worktrees. (3) Tier loop: if worktrees exist, proceed to per-worktree gates; if no worktrees (single-task tier), route through WorktreeCleanup for proper tier advancement; after WorktreeCleanup, advance to next tier or GlobalDoublePass. Resume markers (>>> MARKER) are written at fixture coverage completion and after each tier.

**Dependencies:** 5

**Test (write first):**
- Test all fixtures covered -> check passes, proceed to Claude dispatch
- Test missing BDD fixtures -> uncovered list sent to Claude prompt
- Test missing TLA+ fixtures -> uncovered list sent to Claude prompt
- Test empty BDD fixture file -> skip with warning, TLA+ still checked
- Test empty TLA+ fixture file -> skip with warning, BDD still checked
- Test both fixture files empty -> skip both with warnings, proceed
- Test Claude receives implementation-plan.json content and feature docs path in prompt
- Test Claude receives both fixture file references in prompt
- Test worktrees detected after Claude dispatch -> proceed to PerWT_DoublePass
- Test no worktrees after single-task dispatch -> route through WorktreeCleanup
- Test single-task tier with no worktrees still advances to next tier (not premature GlobalDoublePass)
- Test multi-tier plan: tier 2 not dispatched until tier 1 fully merged and cleaned up
- Test resume marker written after fixture coverage check
- Test resume marker written after each tier completion
- **[R1-9] Test zero-diff task completion: Claude produces no changes for a task, verify tier still advances through WorktreeCleanup to next tier (no stuck pipeline)**
- **[R2-5] Test lock is held during FixtureCoverage phase (S2) — assert lockHeld=TRUE when phase=FixtureCoverage**
- **[R2-5] Test lock is held during ClaudeDispatch phase (S2) — assert lockHeld=TRUE when phase=ClaudeDispatch**
- **[R2-5] Test lock is held during WorktreeCleanup phase (S2) — assert lockHeld=TRUE when phase=WorktreeCleanup**

**TLA+ Coverage:**
- State: `FixtureCoverage` — fixture string-match check
- State: `ClaudeDispatch` — inline prompt dispatch
- State: `WorktreeCleanup` — tier checkpoint and advancement
- Transition: `FixtureCoverageCheck` — always proceeds (gaps sent to Claude)
- Transition: `ClaudeDispatchWithWorktrees` — Claude creates worktrees
- Transition: `ClaudeDispatchNoWorktrees` — single-task, no worktrees, routes through WorktreeCleanup
- Transition: `WorktreeCleanup` — checkpoint lastCompletedTier; advance tier or go to GlobalDoublePass
- Transition: `Resume` — resume marker enables crash recovery
- Transition: `ResumeToGlobal` — resume when all tiers complete
- Invariant: `LockHeldDuringExecution` (S2) — lock held during FixtureCoverage, ClaudeDispatch, WorktreeCleanup

---

### Step 7: 8-coding.ps1 — Per-Worktree Double-Pass and Review

**Files:**
- `stages/8-coding.ps1` (modify — add per-worktree gates)

**Description:**
Add per-worktree verification gates. For each worktree: (1) Double-pass: run `pnpm test` then `pnpm lint` in the worktree; both must pass twice consecutively (wtConsecPasses reaches 2). On failure, send error output to Claude to fix, reset consecutive counter, increment retry counter. At MaxDoublePassRetries=5, escalate to user (Keep Going -> log to user_notes.md and proceed to review; Stop -> halt). (2) Review: call `Invoke-ReviewLoop` from review-loop.ps1 with the worktree diff. On pass, advance to next task's double-pass or to SequentialMerge. On fail, Claude fixes via TDD, then re-run double-pass and re-review (with counter resets: wtDoublePassRetries=0, wtConsecPasses=0 per TLA+ PerWT_ReviewFail). At MaxReviewRounds=3, escalate. (3) Task iteration: process tasks 1..totalTasks sequentially within the tier.

**Dependencies:** 5, 4 (needs review-loop.ps1 for Invoke-ReviewLoop)

**Test (write first):**
- Test double-pass succeeds on first attempt (2 consecutive passes)
- Test test failure sends error to Claude, resets consec to 0, increments retry
- Test lint failure on second pass resets consec to 0, increments retry
- Test MaxDoublePassRetries=5 triggers escalation with last error output
- Test Keep Going after double-pass escalation logs to user_notes.md and proceeds to review
- Test Stop after double-pass escalation halts pipeline and releases lock
- Test review pass advances to next task or SequentialMerge
- Test review fail triggers Claude fix -> double-pass -> re-review cycle
- **[R2-1] Test review fail counter resets: after PerWT_ReviewFail, assert wtDoublePassRetries=0 AND wtConsecPasses=0 before re-entering double-pass (per TLA+ PerWT_ReviewFail action)**
- Test MaxReviewRounds=3 triggers escalation
- **[R2-2] Test KeepGoing mid-tier (currentTask < totalTasks): after review escalation + Keep Going, assert advance to next task AND counter resets (wtDoublePassRetries=0, wtConsecPasses=0, wtReviewRounds=0)**
- **[R2-2] Test KeepGoing last-task (currentTask = totalTasks): after review escalation + Keep Going, assert advance to SequentialMerge WITHOUT resetting wtDoublePassRetries/wtConsecPasses/wtReviewRounds (per TLA+ PerWT_ReviewKeepGoing ELSE branch)**
- Test Stop after review escalation halts pipeline and releases lock
- Test tasks iterate 1..totalTasks within a tier
- Test wtDoublePassRetries never exceeds MaxDoublePassRetries (S3)
- Test wtReviewRounds never exceeds MaxReviewRounds (S4)
- Test wtConsecPasses never exceeds 2 (S6)
- **[R2-5] Test lock is held during PerWT_DoublePass phase (S2) — assert lockHeld=TRUE when phase=PerWT_DoublePass**
- **[R2-5] Test lock is held during PerWT_Review phase (S2) — assert lockHeld=TRUE when phase=PerWT_Review**

**TLA+ Coverage:**
- State: `PerWT_DoublePass` — double-pass verification loop
- State: `PerWT_Review` — reviewer dispatch per worktree
- Transition: `PerWT_DoublePassSucceed` — consecutive pass increment
- Transition: `PerWT_DoublePassFail` — failure with retry
- Transition: `PerWT_DoublePassEscalate` — max retries reached
- Transition: `PerWT_DoublePassKeepGoing` — user continues past failure
- Transition: `PerWT_DoublePassStop` — user halts
- Transition: `PerWT_ReviewPass` — review passes, advance
- Transition: `PerWT_ReviewTimeout` — timeout treated as pass
- Transition: `PerWT_ReviewFail` — blocker triggers fix cycle (resets wtDoublePassRetries=0, wtConsecPasses=0)
- Transition: `PerWT_ReviewEscalate` — max rounds reached
- Transition: `PerWT_ReviewKeepGoing` — user continues past blockers (mid-tier resets counters; last-task does not)
- Transition: `PerWT_ReviewStop` — user halts
- Invariant: `DoublePassRetriesInBounds` (S3) — wtDoublePassRetries <= MaxDoublePassRetries
- Invariant: `ReviewRoundsInBounds` (S4) — wtReviewRounds <= MaxReviewRounds
- Invariant: `ConsecutivePassBound` (S6) — wtConsecPasses <= 2
- Invariant: `LockHeldDuringExecution` (S2) — lock held during PerWT_DoublePass, PerWT_Review

---

### Step 8: 8-coding.ps1 — Sequential Merge, Conflict Resolution, and Rollback

**Files:**
- `stages/8-coding.ps1` (modify — add merge logic)

**Description:**
Add sequential merge of worktree branches to the feature branch. Merges in task order (T1 first, T2 second, etc.). (1) Clean merge: proceed to next task. (2) Merge conflict: send conflict details to Claude to resolve; after resolution, run double-pass on feature branch (MergeConflictDP). The double-pass has its own retry counter (mergeDoublePassRetries, max 5) and consecutive pass counter. On success, continue merge sequence — NO re-review after conflict resolution (S7). On MaxDoublePassRetries, escalate. (3) Unresolvable conflict: Claude signals it cannot resolve; escalate to user with conflicting files listed. (4) **Rollback on Stop**: when user selects Stop after unresolvable conflict or merge DP escalation, `git reset --hard` to the pre-merge checkpoint commit (recorded before merge sequence begins) to leave the feature branch in a known-good state. (5) WorktreeCleanup with **checkpoint-first ordering**: write `lastCompletedTier` marker BEFORE removing worktrees, so crash during cleanup still has a valid checkpoint; then remove all worktrees; log warnings for failures but never halt.

**Dependencies:** 7

**Test (write first):**
- Test worktrees merge in task number order (T1, T2, T3)
- Test clean merge proceeds without intervention
- Test merge conflict sent to Claude for resolution
- Test double-pass runs on feature branch after conflict resolution
- Test double-pass failure after conflict resolution sends output to Claude
- Test MaxDoublePassRetries after conflict resolution escalates to user
- Test Keep Going after merge conflict escalation continues merge sequence
- Test Stop after merge conflict escalation halts pipeline
- Test unresolvable conflict escalates with conflicting file list
- Test NO re-review after conflict resolution (S7) — verify next phase is SequentialMerge or WorktreeCleanup, never a review phase
- Test bulk worktree cleanup removes all worktrees after merge
- Test worktree cleanup failure logs warning and continues (does not halt)
- Test no worktrees -> skip per-worktree gates, proceed to global double-pass
- Test mergeDoublePassRetries never exceeds MaxDoublePassRetries (S3)
- Test mergeConsecPasses never exceeds 2 (S6)
- **[R1-2] Test merge conflict on first task (T1): conflict on T1 when feature branch has no prior merges; verify conflict resolution + double-pass succeeds with pristine merge base**
- **[R1-2] Test merge conflict on T2+ after T1 merged cleanly: verify conflict resolution uses post-T1-merge state as base**
- **[R1-6] Test rollback on Stop: pre-merge checkpoint commit is recorded; on Stop after unresolvable conflict, feature branch is reset to checkpoint; verify `git log` shows checkpoint as HEAD**
- **[R1-6] Test rollback preserves prior tier merges: rollback only undoes current tier's partial merges, not prior completed tiers**
- **[R2-5] Test lock is held during SequentialMerge phase (S2) — assert lockHeld=TRUE when phase=SequentialMerge**
- **[R2-5] Test lock is held during MergeConflictDP phase (S2) — assert lockHeld=TRUE when phase=MergeConflictDP**
- **[R2-8] Test checkpoint-first ordering: assert lastCompletedTier marker is written to pipeline.log BEFORE any worktree removal begins; simulate crash after checkpoint but before cleanup, verify --resume skips tier and cleans orphans**

**TLA+ Coverage:**
- State: `SequentialMerge` — ordered merge of worktree branches
- State: `MergeConflictDP` — double-pass after conflict resolution
- State: `WorktreeCleanup` — bulk cleanup after merge (checkpoint-first)
- Transition: `MergeClean` — no conflicts
- Transition: `MergeConflict` — conflict triggers Claude resolution + double-pass
- Transition: `MergeConflictUnresolvable` — Claude cannot resolve, escalate
- Transition: `MergeEscKeepGoing` — user continues past unresolvable conflict
- Transition: `MergeEscStop` — user halts (with rollback)
- Transition: `MergeDP_Succeed` — post-conflict double-pass passes
- Transition: `MergeDP_Fail` — post-conflict double-pass fails, retry
- Transition: `MergeDP_Escalate` — max retries after conflict
- Transition: `MergeDP_KeepGoing` — user continues past failure
- Transition: `MergeDP_Stop` — user halts (with rollback)
- Transition: `WorktreeCleanup` — checkpoint-first: write lastCompletedTier, then remove worktrees
- Invariant: `NoReReviewAfterConflict` (S7) — successor of MergeConflictDP is never a review phase
- Invariant: `DoublePassRetriesInBounds` (S3) — mergeDoublePassRetries <= MaxDoublePassRetries
- Invariant: `ConsecutivePassBound` (S6) — mergeConsecPasses <= 2
- Invariant: `LockHeldDuringExecution` (S2) — lock held during SequentialMerge, MergeConflictDP

---

### Step 9: 8-coding.ps1 — Global Double-Pass, Global Review, and Completion

**Files:**
- `stages/8-coding.ps1` (modify — add global gates + completion)

**Description:**
Add global verification gates after all tiers are merged. (1) Global double-pass: `pnpm test` -> `pnpm lint` x2 consecutive on the feature branch. Same retry/escalation model as per-worktree (MaxDoublePassRetries=5). (2) Global review: call `Invoke-ReviewLoop` with the full feature branch diff against base branch. On fail, Claude fixes via TDD, re-run global double-pass, re-review (with counter resets: glDoublePassRetries=0, glConsecPasses=0 per TLA+ GlobalReviewFail). MaxReviewRounds=3. (3) Completion: on global review pass, release lock, log `>>> PIPELINE COMPLETE` marker. On Stop at any global gate, release lock, log `>>> PIPELINE HALTED` marker.

**Dependencies:** 8

**Test (write first):**
- Test global double-pass succeeds after 2 consecutive passes
- Test global double-pass failure sends output to Claude
- Test MaxDoublePassRetries=5 at global level escalates to user
- Test Keep Going after global double-pass escalation logs and proceeds to global review
- Test Stop after global double-pass escalation halts and releases lock
- Test global reviewers dispatched with full diff against base branch
- Test global review pass completes Stage 8 and releases lock
- Test global review blocker triggers fix cycle (Claude fix -> double-pass -> re-review)
- **[R2-1] Test global review fail counter resets: after GlobalReviewFail, assert glDoublePassRetries=0 AND glConsecPasses=0 before re-entering global double-pass (per TLA+ GlobalReviewFail action)**
- Test MaxReviewRounds=3 at global level escalates to user
- Test Keep Going at global level logs issues and completes
- Test Stop at global level halts and releases lock
- Test `>>> PIPELINE COMPLETE` marker logged on success
- Test `>>> PIPELINE HALTED` marker logged on stop
- Test pipeline.lock is released in all terminal paths (S1)
- Test glDoublePassRetries never exceeds MaxDoublePassRetries (S3)
- Test glReviewRounds never exceeds MaxReviewRounds (S4)
- Test glConsecPasses never exceeds 2 (S6)
- Test phase=Complete implies pipelineOutcome=complete (S5)
- Test phase=Halted implies pipelineOutcome=halted (S5)
- **[R2-5] Test lock is held during GlobalDoublePass phase (S2) — assert lockHeld=TRUE when phase=GlobalDoublePass**
- **[R2-5] Test lock is held during GlobalReview phase (S2) — assert lockHeld=TRUE when phase=GlobalReview**

**TLA+ Coverage:**
- State: `GlobalDoublePass` — feature branch verification
- State: `GlobalReview` — full-diff reviewer dispatch
- State: `Complete` — terminal success
- State: `Halted` — terminal failure (also covered by prior steps)
- Transition: `GlobalDP_Succeed` — consecutive pass increment
- Transition: `GlobalDP_Fail` — failure with retry
- Transition: `GlobalDP_Escalate` — max retries reached
- Transition: `GlobalDP_KeepGoing` — user continues
- Transition: `GlobalDP_Stop` — user halts
- Transition: `GlobalReviewPass` — review passes, complete
- Transition: `GlobalReviewTimeout` — timeout treated as pass, complete
- Transition: `GlobalReviewFail` — blocker triggers fix cycle (resets glDoublePassRetries=0, glConsecPasses=0)
- Transition: `GlobalReviewEscalate` — max rounds reached
- Transition: `GlobalReviewKeepGoing` — user continues, complete
- Transition: `GlobalReviewStop` — user halts
- Transition: `Done` — terminal stuttering step
- Invariant: `LockReleasedOnTermination` (S1)
- Invariant: `DoublePassRetriesInBounds` (S3) — glDoublePassRetries
- Invariant: `ReviewRoundsInBounds` (S4) — glReviewRounds
- Invariant: `OutcomeConsistency` (S5)
- Invariant: `ConsecutivePassBound` (S6) — glConsecPasses
- Invariant: `LockHeldDuringExecution` (S2) — lock held during GlobalDoublePass, GlobalReview
- Liveness: `EventualTermination` (L1) — pipeline reaches Complete or Halted
- Liveness: `GlobalReviewLeadsToEnd` (L2) — GlobalReview leads to terminal

---

### Step 10: 8-coding.ps1 — Logging, Resume Markers, Crash Recovery, and Integration Tests

**Files:**
- `stages/8-coding.ps1` (modify — add logging/resume infrastructure)
- `tests/coding-integration.Tests.ps1` (modify — rewrite integration tests)

**Description:**
Add verbose logging and crash recovery to 8-coding.ps1. (1) Dual-output logging: all messages go to both console and pipeline.log simultaneously. (2) Resume markers: `>>> MARKER <PHASE_NAME>` entries at major checkpoints: pre-coding gate pass, each tier completion (TIER_N_COMPLETE), global double-pass complete (GLOBAL_DOUBLEPASS_COMPLETE), pipeline complete/halted. Each marker includes timestamp and phase name. (3) `--resume` support: on startup with --resume flag, **re-validate inputs** (implementation-plan.json and fixture files must still exist), then read last marker from pipeline.log; resume from the appropriate phase. If no pipeline.log exists, start fresh with warning. Resume reclaims stale lock. Resume detects existing worktrees and informs Claude of their state. (4) Resume during merge: detect which branches are already merged (via `git branch --merged`) and skip completed merges. (5) File size validation: final 8-coding.ps1 must be under 10KB. (6) **Idempotency**: re-running a completed tier (checkpoint already written, worktrees already cleaned) is a no-op — the tier is skipped with a log message. (7) **Zero-checkpoint resume**: when lastCompletedTier=0 (no tier completed), --resume starts a fresh run with warning. (8) **ResumeToGlobal**: when lastCompletedTier=MaxTiers, --resume jumps directly to GlobalDoublePass.

**Dependencies:** 9

**Test (write first):**
- Rewrite `tests/coding-integration.Tests.ps1`:
- Test log entries appear on both console and pipeline.log
- Test resume markers written at pre-coding gate pass
- Test resume markers written after each tier completion (TIER_N_COMPLETE)
- Test resume marker written after global double-pass (GLOBAL_DOUBLEPASS_COMPLETE)
- Test `>>> PIPELINE COMPLETE` marker on success
- Test `>>> PIPELINE HALTED` marker on stop
- Test --resume reads last marker from pipeline.log
- Test --resume with TIER_1_COMPLETE resumes from tier 2 dispatch
- Test --resume with TIER_2_COMPLETE resumes from global double-pass
- Test --resume with no pipeline.log starts fresh with warning
- Test --resume reclaims stale lock with current PID
- Test --resume detects existing worktrees and informs Claude
- Test --resume during merge phase skips already-merged branches
- Test 8-coding.ps1 file size is under 10KB
- Test 8-coding.ps1 contains inline Claude prompt (not agent .md references for implementation)
- **[R1-3] E2E integration test — alternating tier-size [3,1,2] plan:** 3-task tier (worktrees created, per-WT gates, sequential merge, cleanup) -> 1-task tier (no worktrees, routes through WorktreeCleanup) -> 2-task tier (worktrees created again). Verify worktree/no-worktree/worktree transition completes successfully
- **[R1-4] Test resume with partially-merged partially-cleaned state:** crash after T1 merged but T2 not yet merged, worktrees for T2+ still exist; --resume skips T1 merge, resumes T2 merge, cleans orphan worktrees
- **[R1-4] Test resume with worktree cleanup partially complete:** crash during worktree removal — some worktrees deleted, some remaining; --resume detects orphan worktrees and cleans them before advancing
- **[R1-5] Test idempotency of completed tier re-execution:** re-running with TIER_1_COMPLETE marker when tier 1 is already complete skips tier 1 entirely with log message, proceeds to tier 2
- **[R2-3] Test zero-checkpoint crash recovery: crash before any tier completes (lastCompletedTier=0); --resume starts fresh run from Init with warning "No completed tier checkpoint found, starting fresh" (TLA+ Resume requires lastCompletedTier > 0)**
- **[R2-4] Test ResumeToGlobal: crash after all tiers complete (lastCompletedTier=MaxTiers); --resume jumps directly to GlobalDoublePass, skipping all tier dispatch; assert global counters reset (glDoublePassRetries=0, glConsecPasses=0, glReviewRounds=0, glReviewVerdict="none") per TLA+ ResumeToGlobal action**
- **[R2-6] Test input re-validation on resume: delete implementation-plan.json between crash and resume; --resume halts with "Required file missing" message instead of proceeding with stale state**
- **[R2-6] Test input re-validation on resume: delete fixture file between crash and resume; --resume halts with "Required fixture file missing" message**
- **End-to-end integration test:** Full pipeline run with mock Claude: Init -> LockAcquire -> InputValidation -> FixtureCoverage -> ClaudeDispatch -> PerWT_DoublePass -> PerWT_Review -> SequentialMerge -> WorktreeCleanup -> GlobalDoublePass -> GlobalReview -> Complete
- **End-to-end integration test:** Crash mid-tier, resume from checkpoint, complete successfully
- Test escalation is always eventually resolved (L3) — mock escalation responses
- Test lock is always eventually released (L4) — verify across all test paths

**TLA+ Coverage:**
- Transition: `Resume` — restart from crash at next tier after last checkpoint (lastCompletedTier > 0 AND < MaxTiers)
- Transition: `ResumeToGlobal` — restart when all tiers complete (lastCompletedTier = MaxTiers), jump to GlobalDoublePass
- Variable: `lastCompletedTier` — checkpoint written by WorktreeCleanup (checkpoint-first ordering)
- Variable: `crashed` — set by Crash, cleared by Resume/ResumeToGlobal
- Liveness: `EventualTermination` (L1) — end-to-end integration test
- Liveness: `GlobalReviewLeadsToEnd` (L2) — end-to-end integration test
- Liveness: `EscalationEventuallyResolved` (L3) — escalation always resolves
- Liveness: `LockEventuallyReleased` (L4) — lock always released

---

## State Coverage Audit

All TLA+ states, transitions, and properties are covered by the implementation plan.

### States: All 14 Covered
| State | Step(s) |
|-------|---------|
| Init | 5 |
| LockAcquire | 5 |
| InputValidation | 5 |
| FixtureCoverage | 6 |
| ClaudeDispatch | 6 |
| PerWT_DoublePass | 7 |
| PerWT_Review | 4, 7 |
| SequentialMerge | 8 |
| MergeConflictDP | 8 |
| WorktreeCleanup | 6, 8 |
| GlobalDoublePass | 9 |
| GlobalReview | 4, 9 |
| Complete | 9 |
| Halted | 5, 7, 8, 9 |

### Transitions: All 44 Covered
| Transition | Step(s) |
|------------|---------|
| PreCodingGatePass | 5 |
| PreCodingGateHalt | 5 |
| LockAcquire | 5 |
| LockAcquireReject | 5 |
| InputValidationPass | 5 |
| InputValidationFail | 5 |
| FixtureCoverageCheck | 6 |
| ClaudeDispatchWithWorktrees | 6 |
| ClaudeDispatchNoWorktrees | 6 |
| PerWT_DoublePassSucceed | 7 |
| PerWT_DoublePassFail | 7 |
| PerWT_DoublePassEscalate | 7 |
| PerWT_DoublePassKeepGoing | 7 |
| PerWT_DoublePassStop | 7 |
| PerWT_ReviewPass | 4, 7 |
| PerWT_ReviewTimeout | 4, 7 |
| PerWT_ReviewFail | 4, 7 |
| PerWT_ReviewEscalate | 4, 7 |
| PerWT_ReviewKeepGoing | 4, 7 |
| PerWT_ReviewStop | 7 |
| MergeClean | 8 |
| MergeConflict | 8 |
| MergeConflictUnresolvable | 8 |
| MergeEscKeepGoing | 8 |
| MergeEscStop | 8 |
| MergeDP_Succeed | 8 |
| MergeDP_Fail | 8 |
| MergeDP_Escalate | 8 |
| MergeDP_KeepGoing | 8 |
| MergeDP_Stop | 8 |
| WorktreeCleanup | 6, 8 |
| GlobalDP_Succeed | 9 |
| GlobalDP_Fail | 9 |
| GlobalDP_Escalate | 9 |
| GlobalDP_KeepGoing | 9 |
| GlobalDP_Stop | 9 |
| GlobalReviewPass | 4, 9 |
| GlobalReviewTimeout | 4, 9 |
| GlobalReviewFail | 4, 9 |
| GlobalReviewEscalate | 4, 9 |
| GlobalReviewKeepGoing | 4, 9 |
| GlobalReviewStop | 9 |
| Crash | 5, 10 |
| Resume | 10 |
| ResumeToGlobal | 10 |
| Done | 9 |

### Safety Invariants: All 7 Covered
| Invariant | Step(s) |
|-----------|---------|
| TypeOK | 5-10 (enforced by PowerShell parameter types and validation) |
| LockReleasedOnTermination (S1) | 5, 9 |
| LockHeldDuringExecution (S2) | 5, 6, 7, 8, 9 |
| DoublePassRetriesInBounds (S3) | 7, 8, 9 |
| ReviewRoundsInBounds (S4) | 4, 7, 9 |
| OutcomeConsistency (S5) | 5, 9 |
| ConsecutivePassBound (S6) | 7, 8, 9 |
| NoReReviewAfterConflict (S7) | 8 |

### Liveness Properties: All 4 Covered
| Property | Step(s) |
|----------|---------|
| EventualTermination (L1) | 9, 10 (E2E integration tests) |
| GlobalReviewLeadsToEnd (L2) | 9, 10 (E2E integration tests) |
| EscalationEventuallyResolved (L3) | 10 (integration tests with mock escalation) |
| LockEventuallyReleased (L4) | 10 (integration tests verify all paths) |

### Debate Objection Coverage

#### Round 1
| Objection | Step(s) | Test(s) |
|-----------|---------|---------|
| 1. Compound timeout | 4 | Compound timeout test in review-loop |
| 2. Merge conflict on T1 | 8 | T1-specific and T2+ merge conflict tests |
| 3. Alternating tier-size E2E | 10 | [3,1,2] tier pattern E2E test |
| 4. Partial resume state | 10 | Partially-merged + partially-cleaned resume tests |
| 5. Idempotency | 5, 10 | Config snapshot idempotency + completed tier re-execution |
| 6. Rollback strategy | 8 | Rollback on Stop tests + prior tier preservation |
| 7. T1/T5 dependency | 5 | T5 moved to Tier 1 (no dependency on T1) |
| 8. Config mutation | 5 | Config snapshot immutability test |
| 9. Zero-diff advancement | 6 | Zero-diff task still advances tier test |

#### Round 2
| Objection | Step(s) | Test(s) |
|-----------|---------|---------|
| R2-1. Counter-reset assertions | 7, 9 | ReviewFail counter resets (wt and global) |
| R2-2. KeepGoing path split | 7 | Mid-tier (with resets) and last-task (without resets) |
| R2-3. Zero-checkpoint crash | 10 | lastCompletedTier=0, --resume starts fresh |
| R2-4. ResumeToGlobal | 10 | lastCompletedTier=MaxTiers jumps to GlobalDoublePass |
| R2-5. S2 in all active phases | 6, 7, 8, 9 | Lock-held assertions per phase |
| R2-6. Input re-validation on resume | 10 | Missing plan/fixture file halts resume |
| R2-7. Resume granularity docs | N/A | "Resume Granularity Design Notes" section |
| R2-8. WorktreeCleanup ordering | 8 | Checkpoint-first ordering test |

---

## Execution Tiers

### Tier 1: Cleanup, Agent Definitions, and Entry Point

| Task ID | Step | Title |
|---------|------|-------|
| T1 | Step 1 | Delete dead Stage 8 code |
| T2 | Step 2 | Create 8 reviewer agent definitions |
| T3 | Step 3 | Create review-moderator agent |
| T5 | Step 5 | Rewrite 8-coding.ps1 — lock, pre-coding gate, input validation, config snapshot |

### Tier 2: Utility and Dispatch (depends on Tier 1)

| Task ID | Step | Title |
|---------|------|-------|
| T4 | Step 4 | Create review-loop utility |
| T6 | Step 6 | 8-coding.ps1 — fixture coverage and Claude dispatch |
| T7 | Step 7 | 8-coding.ps1 — per-worktree double-pass and review |

### Tier 3: Merge Logic (depends on Tier 2)

| Task ID | Step | Title |
|---------|------|-------|
| T8 | Step 8 | 8-coding.ps1 — sequential merge, conflict resolution, rollback |

### Tier 4: Global Gates and Completion (depends on Tier 3)

| Task ID | Step | Title |
|---------|------|-------|
| T9 | Step 9 | 8-coding.ps1 — global double-pass, global review, completion |

### Tier 5: Logging, Resume, and Integration Tests (depends on Tier 4)

| Task ID | Step | Title |
|---------|------|-------|
| T10 | Step 10 | 8-coding.ps1 — logging, resume markers, crash recovery, integration tests |

---

## Task Assignment Table

| Task ID | Title | Tier | Code Writer | Test Writer | Dependencies | Rationale |
|---------|-------|------|-------------|-------------|--------------|-----------|
| T1 | Delete dead Stage 8 code | 1 | powershell-writer | pester-writer | None | PowerShell script to delete directories/files; Pester validates absence |
| T2 | Create 8 reviewer agent definitions | 1 | agent-writer | pester-writer | None | Agent .md files require agent-writer; Pester validates file structure |
| T3 | Create review-moderator agent | 1 | agent-writer | pester-writer | None | Agent .md file for moderator orchestration; Pester validates structure |
| T5 | Rewrite 8-coding.ps1 — lock, gate, validation, config snapshot | 1 | powershell-writer | pester-writer | None | PowerShell stage script; Pester tests pipeline entry phases; no T1 dependency — full rewrite |
| T4 | Create review-loop utility | 2 | powershell-writer | pester-writer | T2, T3 | PowerShell module with exported functions; Pester unit tests |
| T6 | 8-coding.ps1 — fixture coverage and dispatch | 2 | powershell-writer | pester-writer | T5 | Extends stage script with fixture check, Claude dispatch, and S2 assertions for 3 phases |
| T7 | 8-coding.ps1 — per-worktree gates | 2 | powershell-writer | pester-writer | T5, T4 | Extends stage script with per-WT double-pass, review loops, counter-reset assertions, and S2 assertions |
| T8 | 8-coding.ps1 — sequential merge, rollback | 3 | powershell-writer | pester-writer | T7 | Extends stage script with merge logic, conflict resolution, rollback, checkpoint-first ordering, and S2 assertions |
| T9 | 8-coding.ps1 — global gates and completion | 4 | powershell-writer | pester-writer | T8 | Extends stage script with global verification, terminal states, counter-reset assertions, and S2 assertions |
| T10 | 8-coding.ps1 — logging, resume, integration | 5 | powershell-writer | pester-writer | T9 | Adds cross-cutting logging/resume; full E2E integration tests including zero-checkpoint, ResumeToGlobal, input re-validation, and all objection scenarios |
