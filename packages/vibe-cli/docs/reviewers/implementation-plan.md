# Implementation Plan: Pipeline Reviewers & Resume

## Source Artifacts

| Artifact | Path |
|----------|------|
| TLA+ Specification | `packages/vibe-cli/docs/reviewers/tla/PipelineReviewers.tla` |
| BDD Scenarios | `packages/vibe-cli/docs/reviewers/bdd.feature` |

---

## TLA+ State Coverage Matrix

### States

- `idle` — Pipeline not running, lock free
- `locked` — Lock acquired, stages not yet started
- `running` — Stages 1-7 executing (or between review gates)
- `preMergeReview` — Pre-merge review gate active, awaiting verdict
- `reviewFix` — Pre-merge review-fix TDD cycle (RED -> GREEN -> CLEANUP)
- `mergeQueue` — Task passed pre-merge review, awaiting merge
- `finalReview` — Post-merge final review gate active, awaiting verdict
- `finalReviewFix` — Final review-fix TDD cycle
- `COMPLETE` — Terminal: all tasks merged and final review passed
- `HALTED` — Terminal: pipeline stopped (exhaustion, timeout, or user stop)

### Transitions

1. `AcquireLock` — idle -> locked
2. `StartRunning` — locked -> running
3. `EnterPreMergeReview` — running -> preMergeReview (when tasksDone < NumTasks)
4. `ReviewVerdict` — nondeterministic pass/fail/retry verdict in preMergeReview or finalReview
5. `HandlePassPreMerge` — preMergeReview -> mergeQueue (on pass)
6. `HandleFailPreMerge` — preMergeReview -> reviewFix (on fail, round < max)
7. `HandleRetryPreMerge` — increment reviewRound in preMergeReview (on retry, round < max)
8. `ReviewFixComplete` — reviewFix -> preMergeReview (fix cycle done, round++)
9. `TddKeepGoingInFix` — increment tddKeepGoingCount in reviewFix
10. `TddKeepGoingExhausted` — reviewFix -> preMergeReview with verdict=fail (TDD cap hit)
11. `TddStopInFix` — reviewFix or finalReviewFix -> HALTED (user stop)
12. `ReviewKeepGoing` — reset reviewRound=0, keepGoingResets++ (on exhaustion + keep going)
13. `ReviewForcedStop` — preMergeReview or finalReview -> HALTED (exhaustion + keep going exhausted)
14. `ReviewStop` — preMergeReview or finalReview -> HALTED (user voluntary stop)
15. `TaskMerged` — mergeQueue -> running, tasksDone++
16. `DiffBaseStale` — mergeQueue -> preMergeReview (stale diff, re-review, round++)
17. `DiffBaseStaleExhausted` — mergeQueue -> HALTED (stale diff, rounds exhausted)
18. `EnterFinalReview` — running -> finalReview (when tasksDone = NumTasks)
19. `HandlePassFinal` — finalReview -> COMPLETE (on pass)
20. `HandleFailFinal` — finalReview -> finalReviewFix (on fail, round < max)
21. `HandleRetryFinal` — increment reviewRound in finalReview (on retry, round < max)
22. `FinalReviewFixComplete` — finalReviewFix -> finalReview (fix cycle done, round++)
23. `TddKeepGoingInFinalFix` — increment tddKeepGoingCount in finalReviewFix
24. `TddKeepGoingExhaustedFinal` — finalReviewFix -> finalReview with verdict=fail (TDD cap hit)
25. `ReviewGateTimeout` — nondeterministic gate timeout event (sets gateTimedOut=TRUE)
26. `GateTimeoutKeepGoing` — reset gate timer, keepGoingResets++, reviewRound=0
27. `GateTimeoutStop` — review state -> HALTED (on gate timeout + stop)
28. `GlobalTimeout` — any active state -> HALTED (global pipeline timeout)
29. `Done` — COMPLETE or HALTED stutter (absorbing)

### Safety Invariants

- **S1 (TerminalIsAbsorbing):** COMPLETE/HALTED states have lockHolder = NULL
- **S2 (LockReleasedInTerminal):** lockHolder = NULL when pipelineState in {COMPLETE, HALTED}
- **S3 (LockHeldWhileActive):** lockHolder = 1 when pipelineState not in {idle, COMPLETE, HALTED}
- **S4 (ReviewRoundBounded):** reviewRound <= MaxReviewRounds
- **S5 (KeepGoingResetsBounded):** keepGoingResets <= MaxKeepGoingResets
- **S6 (TddKeepGoingBounded):** tddKeepGoingCount <= MaxTddKeepGoingPerGate
- **S7 (TaskCountBounded):** tasksDone <= NumTasks
- **S8 (FinalReviewRequiresAllMerged):** finalReview/finalReviewFix only when tasksDone = NumTasks
- **S9 (NoReviewFixWithoutFail):** reviewFix/finalReviewFix entered only after fail verdict consumed
- **S10 (GlobalTimeoutHalts):** globalTimedOut => pipelineState = HALTED
- **S11 (structural):** MaxKeepGoingResets=0 disables Keep Going
- **S12 (structural):** Diff staleness only with NumTasks > 1

### Liveness Properties

- **L1 (EventuallyTerminates):** Pipeline reaches COMPLETE or HALTED
- **L2 (ReviewGateResolves):** preMergeReview eventually leads to mergeQueue, running, or HALTED
- **L2b (FinalReviewResolves):** finalReview eventually leads to COMPLETE or HALTED
- **L3 (AllTasksResolve):** All tasks merge or pipeline halts

---

## Implementation Steps

### Step 1: Review Gate Constants and NumTasks

**Files:**
- `utils/config.ps1` (modify)

**Description:**
Add review gate configuration constants to the existing config system. These constants mirror the TLA+ `CONSTANTS` block: `MaxReviewRounds`, `MaxKeepGoingResets`, `MaxTddKeepGoingPerGate`, `PipelineTimeoutSeconds`, `ReviewGateTimeoutSeconds`, and `NumTasks`. The existing config.ps1 already defines thresholds like `MaxDebateRounds` and `MaxTddCycles`, so these new constants follow the same pattern. `NumTasks` is derived from the tier's task list length at pipeline start and exposed via config so downstream modules can reference it.

**Dependencies:** None

**Test (write first):**
Test that `Get-PipelineConfig` returns all review gate constants with correct default values (MaxReviewRounds=3, MaxKeepGoingResets=3, MaxTddKeepGoingPerGate=5). Test that environment variable overrides work for each constant (e.g., `$env:VIBE_MAX_REVIEW_ROUNDS=5` overrides the default). Test that zero values are accepted (MaxKeepGoingResets=0 disables Keep Going per S11). **Boundary: test MaxReviewRounds=0** — assert it is accepted and means immediate escalation on first fail/retry verdict (no review-fix cycles allowed). Test NumTasks derivation: assert NumTasks >= 1, test with NumTasks=1 (single-task tier) and NumTasks=3 (multi-task tier). Test that NumTasks=0 throws a validation error. **UNCHANGED: config constants are immutable after initialization — test that mutation attempts throw.**

**TLA+ Coverage:**
- Constants: `MaxReviewRounds`, `MaxKeepGoingResets`, `MaxTddKeepGoingPerGate`, `NumTasks`
- Invariant: S11 (MaxKeepGoingResets=0 disables Keep Going — structural)

---

### Step 2: Pipeline State Type and Initial State

**Files:**
- `utils/pipeline-state.ps1` (create)

**Description:**
Define the pipeline state enum and a factory function that creates a fresh pipeline state object. The state object holds all 10 TLA+ variables: `pipelineState`, `lockHolder`, `reviewRound`, `keepGoingResets`, `tddKeepGoingCount`, `verdict`, `tasksDone`, `gateTimedOut`, `globalTimedOut`, `reviewGateType`. The initial state matches TLA+ `Init`: idle, all counters zero, no lock, no timeouts.

**Dependencies:** Step 1

**Test (write first):**
Test that `New-PipelineState` returns an object with all 10 fields matching the TLA+ Init state: pipelineState="idle", lockHolder=NULL, reviewRound=0, keepGoingResets=0, tddKeepGoingCount=0, verdict=NULL, tasksDone=0, gateTimedOut=FALSE, globalTimedOut=FALSE, reviewGateType="none". Test the TypeOK invariant: pipelineState is one of the 10 valid values, reviewRound is in 0..MaxReviewRounds, keepGoingResets in 0..MaxKeepGoingResets, etc. Test that the state object is a mutable hashtable (not frozen). **UNCHANGED: creating a state object does not modify any external state or files.**

**TLA+ Coverage:**
- State: `idle` (Init)
- Invariant: TypeOK (type invariant on all variables)
- All 10 VARIABLES declared

---

### Step 3: Pipeline Lock Manager and StartRunning

**Files:**
- `utils/pipeline-lock.ps1` (create)

**Description:**
Implement pipeline mutual exclusion using a lock file mechanism. `Enter-PipelineLock` acquires the lock (idle -> locked), `Exit-PipelineLock` releases it. The lock file contains the PID of the holding process. Lock acquisition fails if the lock is already held by a live process. Lock release sets lockHolder to NULL. Also implement `Start-PipelineRunning` which transitions locked -> running (the `StartRunning` TLA+ action). This maps directly to `AcquireLock`, `StartRunning`, and the lock release in terminal transitions.

**Dependencies:** Step 2

**Test (write first):**
Test `Enter-PipelineLock` (AcquireLock): transitions state from idle to locked and sets lockHolder=1. Assert **UNCHANGED: reviewRound, keepGoingResets, tddKeepGoingCount, verdict, tasksDone, gateTimedOut, globalTimedOut, reviewGateType** are all preserved at their Init values. Test that acquiring when already locked throws an error. Test `Exit-PipelineLock`: sets lockHolder to NULL. Test that stale lock files (dead PID) are cleaned up. Test `Start-PipelineRunning` (StartRunning): transitions from locked to running, lockHolder stays 1. Assert **UNCHANGED: lockHolder, reviewRound, keepGoingResets, tddKeepGoingCount, verdict, tasksDone, gateTimedOut, globalTimedOut, reviewGateType** are all preserved. Test invariant S3: lockHolder=1 when state is active. Test invariant S2: lockHolder=NULL in terminal states.

**TLA+ Coverage:**
- Transition: `AcquireLock`, `StartRunning`
- State: `idle`, `locked`, `running`
- Invariant: S2 (LockReleasedInTerminal), S3 (LockHeldWhileActive)

---

### Step 4: Review Verdict Data Model

**Files:**
- `utils/review-verdict.ps1` (create)

**Description:**
Define the review verdict structure and parsing logic. A verdict is one of: `pass`, `fail`, `retry` (or NULL when no verdict pending). The `retry` verdict models moderator timeout, JSON parse failure, or schema violation — all treated identically as "try again." This module also validates verdict schema (guards against invalid verdicts).

**Dependencies:** None

**Test (write first):**
Test that `New-ReviewVerdict` with "pass", "fail", "retry" returns valid verdict objects. Test that invalid verdict strings throw. Test that NULL verdict is the default. Test parsing from moderator JSON output: valid JSON -> verdict, malformed JSON -> retry, timeout -> retry, schema violation -> retry. **UNCHANGED: verdict creation is a pure function — no pipeline state mutations.**

**TLA+ Coverage:**
- Variable: `verdict` (NULL | "pass" | "fail" | "retry")
- Transition: `ReviewVerdict` (nondeterministic verdict generation)

---

### Step 5: Review Gate Engine — Core Loop

**Files:**
- `utils/review-gate.ps1` (create)

**Description:**
The central review gate orchestrator. `Invoke-ReviewGate` takes a gate type ("preMerge" or "final"), invokes the review moderator, receives a verdict, and dispatches to the appropriate handler. This is the main loop of the review gate: enter gate -> get verdict -> handle verdict -> repeat or exit. The engine is parameterized by gate type so both pre-merge and final reviews share one code path, honoring the TLA+ symmetry between the two gates. The verdict retrieval step enforces the timeout guards from `ReviewVerdict`: verdicts are only solicited when `~gateTimedOut` and `~globalTimedOut`.

**Dependencies:** Steps 2, 4

**Test (write first):**
Test `Invoke-ReviewGate -GateType "preMerge"` (EnterPreMergeReview): resets reviewRound=0, keepGoingResets=0, tddKeepGoingCount=0, verdict=NULL, gateTimedOut=FALSE, reviewGateType="preMerge". Assert **UNCHANGED: lockHolder, tasksDone, globalTimedOut**. Test `Invoke-ReviewGate -GateType "final"` (EnterFinalReview): same resets, reviewGateType="final". Assert **UNCHANGED: lockHolder, tasksDone, globalTimedOut**. Test that the gate loops until a terminal condition (pass, exhaustion, or timeout).

**Specific verdict sequence tests with expected state traces:**
1. Mock moderator returns ["pass"] → assert state trace: preMergeReview → (verdict="pass") → mergeQueue.
2. Mock moderator returns ["fail", "pass"] → assert: preMergeReview → reviewFix → preMergeReview (round=1) → (verdict="pass") → mergeQueue.
3. Mock moderator returns ["retry", "retry", "retry"] with MaxReviewRounds=3 → assert: rounds increment to 3, then escalation triggered.
4. Mock moderator returns ["fail"] with MaxReviewRounds=0 → assert: **immediate escalation** with no fix cycle entered (boundary test for objection #7).

**Timeout guard tests (ReviewVerdict):** Test that when gateTimedOut=TRUE, the engine does NOT solicit a new verdict but instead routes to gate timeout escalation. Test that when globalTimedOut=TRUE, the engine does NOT solicit a new verdict but transitions to HALTED. Assert **UNCHANGED for ReviewVerdict: pipelineState, lockHolder, keepGoingResets, tddKeepGoingCount, tasksDone, gateTimedOut, globalTimedOut, reviewGateType** (verdict is the only variable that changes).

**TLA+ Coverage:**
- Transition: `EnterPreMergeReview`, `EnterFinalReview`, `ReviewVerdict`
- State: `preMergeReview`, `finalReview`
- Variable: `reviewGateType`

---

### Step 6: Verdict Handling — Pass, Fail, Retry (Pre-Merge)

**Files:**
- `utils/review-gate.ps1` (modify)

**Description:**
Implement the three verdict handlers for the pre-merge gate. **Pass:** transition to mergeQueue, clear verdict, set reviewGateType to "none". **Fail:** if reviewRound < MaxReviewRounds, transition to reviewFix; otherwise trigger escalation. **Retry:** if reviewRound < MaxReviewRounds, increment reviewRound, clear verdict, and loop back for another review attempt.

**Dependencies:** Step 5

**Test (write first):**
Test HandlePassPreMerge: state transitions to mergeQueue, verdict=NULL, reviewGateType="none". Assert **UNCHANGED: lockHolder, reviewRound, keepGoingResets, tddKeepGoingCount, tasksDone, gateTimedOut, globalTimedOut**. Test HandleFailPreMerge: state transitions to reviewFix when round < max; verdict is consumed (set to NULL). Assert **UNCHANGED: lockHolder, reviewRound, keepGoingResets, tddKeepGoingCount, tasksDone, gateTimedOut, globalTimedOut, reviewGateType**. Test HandleRetryPreMerge: reviewRound increments by 1, verdict=NULL, state stays preMergeReview. Assert **UNCHANGED: pipelineState, lockHolder, keepGoingResets, tddKeepGoingCount, tasksDone, gateTimedOut, globalTimedOut, reviewGateType**. Test that fail/retry at round=MaxReviewRounds does NOT enter reviewFix (guard check). Test **MaxReviewRounds=0 boundary:** first fail or retry verdict immediately triggers escalation — no fix cycle, no retry. Verify invariant S4: reviewRound never exceeds MaxReviewRounds.

**TLA+ Coverage:**
- Transition: `HandlePassPreMerge`, `HandleFailPreMerge`, `HandleRetryPreMerge`
- State: `preMergeReview`, `mergeQueue`, `reviewFix`
- Invariant: S4 (ReviewRoundBounded)

---

### Step 7: Review-Fix Cycle

**Files:**
- `utils/review-fix.ps1` (create)

**Description:**
Implement the review-fix TDD cycle (RED -> GREEN -> CLEANUP abstracted as one step). When a review fails, the fix cycle runs the coding agent to address review findings, then returns to the review gate. On completion, reviewRound increments and the gate re-enters the review state with verdict=NULL. The fix cycle respects both gate and global timeout guards.

**Dependencies:** Steps 5, 6

**Test (write first):**
Test ReviewFixComplete: state transitions from reviewFix to preMergeReview, reviewRound increments by 1, verdict=NULL. Assert **UNCHANGED: lockHolder, keepGoingResets, tddKeepGoingCount, tasksDone, gateTimedOut, globalTimedOut, reviewGateType**. Test that fix cycle is skipped when gateTimedOut=TRUE. Test that fix cycle is skipped when globalTimedOut=TRUE. Test invariant S9: reviewFix is only entered after a fail verdict was consumed. Test **tddKeepGoingCount stickiness across fix re-entries:** when a fix completes and re-enters preMergeReview, then fails again and re-enters reviewFix, assert tddKeepGoingCount retains its value from the previous fix cycle (it is NOT reset by ReviewFixComplete — only gate-level resets clear it). Mock the TDD loop to return success/failure.

**TLA+ Coverage:**
- Transition: `ReviewFixComplete`
- State: `reviewFix`
- Invariant: S9 (NoReviewFixWithoutFail)

---

### Step 8: TDD Keep Going and Exhaustion in Fix

**Files:**
- `utils/review-fix.ps1` (modify)

**Description:**
Add TDD Keep Going counter management within the review-fix cycle. When TDD exhausts its cycles within a fix, the user can choose "Keep Going" (incrementing tddKeepGoingCount) up to MaxTddKeepGoingPerGate. When the TDD cap is reached, the fix escalates: state returns to preMergeReview with verdict="fail" and reviewRound increments. User can also choose "Stop" to halt immediately. Note: tddKeepGoingCount is sticky within a gate — it survives fix re-entries and is only reset by gate-level events (EnterPreMergeReview, EnterFinalReview, ReviewKeepGoing, GateTimeoutKeepGoing).

**Dependencies:** Step 7

**Test (write first):**
Test TddKeepGoingInFix: tddKeepGoingCount increments by 1, state stays reviewFix. Assert **UNCHANGED: pipelineState, lockHolder, reviewRound, keepGoingResets, verdict, tasksDone, gateTimedOut, globalTimedOut, reviewGateType**. Test at count < MaxTddKeepGoingPerGate, Keep Going is allowed. Test TddKeepGoingExhausted: when count >= MaxTddKeepGoingPerGate, state transitions to preMergeReview, verdict="fail", reviewRound increments. Assert **UNCHANGED: lockHolder, keepGoingResets, tddKeepGoingCount, tasksDone, gateTimedOut, globalTimedOut, reviewGateType**. Test TddStopInFix: state transitions to HALTED, lockHolder=NULL. Assert **UNCHANGED: reviewRound, keepGoingResets, tddKeepGoingCount, verdict, tasksDone, gateTimedOut, globalTimedOut, reviewGateType**. Test that TDD actions are blocked when gateTimedOut=TRUE or globalTimedOut=TRUE. Test **sticky exhaustion across fix re-entries:** set tddKeepGoingCount=3, complete fix, re-enter reviewFix via another fail — assert count is still 3 and only 2 more Keep Going selections remain (assuming MaxTddKeepGoingPerGate=5). Verify invariant S6: tddKeepGoingCount <= MaxTddKeepGoingPerGate.

**TLA+ Coverage:**
- Transition: `TddKeepGoingInFix`, `TddKeepGoingExhausted`, `TddStopInFix`
- Variable: `tddKeepGoingCount`
- Invariant: S6 (TddKeepGoingBounded)

---

### Step 9: Review Round Exhaustion and Keep Going Escalation

**Files:**
- `utils/review-gate.ps1` (modify)

**Description:**
When reviewRound reaches MaxReviewRounds with a fail or retry verdict, the user is offered an escalation choice. **Keep Going:** resets reviewRound to 0, increments keepGoingResets, resets tddKeepGoingCount to 0, clears gate timeout flag, and re-enters the review gate. **Stop:** transitions to HALTED. **Forced Stop:** when keepGoingResets reaches MaxKeepGoingResets, the pipeline halts automatically with no user prompt. The keepGoingResets counter is shared between ReviewKeepGoing and GateTimeoutKeepGoing — both transitions increment the same counter and both are bounded by MaxKeepGoingResets.

**Dependencies:** Steps 5, 6

**Test (write first):**
Test ReviewKeepGoing: reviewRound resets to 0, keepGoingResets increments, tddKeepGoingCount resets to 0, gateTimedOut resets to FALSE, verdict=NULL, state stays in review. Assert **UNCHANGED: pipelineState, lockHolder, tasksDone, globalTimedOut, reviewGateType**. Test ReviewStop: state transitions to HALTED, lockHolder=NULL. Assert **UNCHANGED: reviewRound, keepGoingResets, tddKeepGoingCount, verdict, tasksDone, gateTimedOut, globalTimedOut, reviewGateType**. Test ReviewForcedStop: when keepGoingResets >= MaxKeepGoingResets, state transitions to HALTED without prompting, lockHolder=NULL. Assert **UNCHANGED: reviewRound, keepGoingResets, tddKeepGoingCount, verdict, tasksDone, gateTimedOut, globalTimedOut, reviewGateType**. Test that Keep Going is available only when keepGoingResets < MaxKeepGoingResets. Test that both fail and retry verdicts can trigger escalation. Test **shared keepGoingResets counter:** after ReviewKeepGoing increments keepGoingResets to 1, then a gate timeout fires and GateTimeoutKeepGoing increments to 2 — assert total is 2, not 1 (counters are shared, not independent). Test **MaxReviewRounds=0 boundary:** first fail or retry at round 0 immediately triggers escalation. Verify invariant S5: keepGoingResets <= MaxKeepGoingResets.

**TLA+ Coverage:**
- Transition: `ReviewKeepGoing`, `ReviewForcedStop`, `ReviewStop`
- Variable: `keepGoingResets`
- Invariant: S5 (KeepGoingResetsBounded)

---

### Step 10: Merge Queue and Task Counting

**Files:**
- `utils/merge-queue.ps1` (modify)

**Description:**
Extend the existing merge queue to integrate with the review gate lifecycle. After a task passes pre-merge review and enters the merge queue, `TaskMerged` increments tasksDone and transitions back to running. The merge queue now tracks the task count for determining when to enter the final review gate (tasksDone = NumTasks). NumTasks is read from the config established in Step 1.

**Dependencies:** Steps 6, 2

**Test (write first):**
Test TaskMerged: tasksDone increments by 1, state transitions to running. Assert **UNCHANGED: lockHolder, reviewRound, keepGoingResets, tddKeepGoingCount, verdict, gateTimedOut, globalTimedOut, reviewGateType**. Test that after all tasks merged (tasksDone = NumTasks), the pipeline is in a state eligible for EnterFinalReview. Test that tasksDone never exceeds NumTasks (invariant S7). Test with NumTasks=1 (single task) and NumTasks=3 (multi-task tier). Test boundary: NumTasks=1 means one pass-merge cycle enters final review.

**TLA+ Coverage:**
- Transition: `TaskMerged`
- State: `mergeQueue`, `running`
- Variable: `tasksDone`
- Invariant: S7 (TaskCountBounded)

---

### Step 11: Diff-Base Staleness Detection

**Files:**
- `utils/diff-staleness.ps1` (create)

**Description:**
Implement diff-base staleness checks in the merge queue. When NumTasks > 1, a task that passed review may have a stale diff if another task merged concurrently. `Test-DiffStaleness` compares the review-time diff base with the current feature branch HEAD. If semantically changed: re-review (DiffBaseStale — back to preMergeReview, round++). If identical: proceed with merge. If stale at round limit: halt (DiffBaseStaleExhausted). Single-task tiers skip this check entirely.

**Dependencies:** Step 10

**Test (write first):**
Test DiffBaseStale: when diff is stale with semantic changes, state transitions to preMergeReview, reviewRound increments, verdict=NULL, gateTimedOut resets to FALSE, reviewGateType="preMerge". Assert **UNCHANGED: lockHolder, keepGoingResets, tddKeepGoingCount, tasksDone, globalTimedOut** — staleness re-review preserves both keepGoingResets and tddKeepGoingCount (they are NOT reset on DiffBaseStale, only on gate-level resets). Test DiffBaseStaleExhausted: when stale and reviewRound >= MaxReviewRounds, state transitions to HALTED, lockHolder=NULL. Assert **UNCHANGED: reviewRound, keepGoingResets, tddKeepGoingCount, verdict, tasksDone, gateTimedOut, globalTimedOut, reviewGateType**. Test that single-task tiers (NumTasks=1) always skip staleness check. Test invariant S12: staleness re-review only possible with NumTasks > 1. Mock git diff comparison.

**TLA+ Coverage:**
- Transition: `DiffBaseStale`, `DiffBaseStaleExhausted`
- State: `mergeQueue`
- Invariant: S12 (DiffStalenessRequiresMultipleTasks)

---

### Step 12: Final Review Gate — Verdict Handling

**Files:**
- `utils/review-gate.ps1` (modify)

**Description:**
Implement verdict handlers for the final review gate, mirroring the pre-merge handlers. **Pass:** transition to COMPLETE, release lock, set reviewGateType to "none". **Fail:** if round < max, transition to finalReviewFix. **Retry:** if round < max, increment reviewRound. The entry condition is enforced: final review is only entered when tasksDone = NumTasks.

**Dependencies:** Steps 5, 10

**Test (write first):**
Test HandlePassFinal: state transitions to COMPLETE, lockHolder=NULL, reviewGateType="none". Assert **UNCHANGED: reviewRound, keepGoingResets, tddKeepGoingCount, verdict, tasksDone, gateTimedOut, globalTimedOut**. Test HandleFailFinal: state transitions to finalReviewFix when round < max, verdict=NULL. Assert **UNCHANGED: lockHolder, reviewRound, keepGoingResets, tddKeepGoingCount, tasksDone, gateTimedOut, globalTimedOut, reviewGateType**. Test HandleRetryFinal: reviewRound increments, state stays finalReview, verdict=NULL. Assert **UNCHANGED: pipelineState, lockHolder, keepGoingResets, tddKeepGoingCount, tasksDone, gateTimedOut, globalTimedOut, reviewGateType**. Test EnterFinalReview guard: only allowed when tasksDone = NumTasks. Test **MaxReviewRounds=0 boundary:** first fail or retry in final review immediately triggers escalation. Verify invariant S8: finalReview/finalReviewFix only when tasksDone = NumTasks. Verify invariants S1/S2: COMPLETE is terminal with lockHolder=NULL.

**TLA+ Coverage:**
- Transition: `EnterFinalReview`, `HandlePassFinal`, `HandleFailFinal`, `HandleRetryFinal`
- State: `finalReview`, `finalReviewFix`, `COMPLETE`
- Invariant: S1 (TerminalIsAbsorbing), S2 (LockReleasedInTerminal), S8 (FinalReviewRequiresAllMerged)

---

### Step 13: Final Review-Fix Cycle with TDD Escalation

**Files:**
- `utils/review-fix.ps1` (modify)

**Description:**
Extend the review-fix module to handle the final review-fix cycle. `FinalReviewFixComplete` transitions from finalReviewFix to finalReview with round increment. TDD Keep Going and exhaustion work identically to the pre-merge fix cycle, using the same tddKeepGoingCount counter. TddStopInFix already handles both reviewFix and finalReviewFix.

**Dependencies:** Steps 7, 8, 12

**Test (write first):**
Test FinalReviewFixComplete: state transitions from finalReviewFix to finalReview, reviewRound increments, verdict=NULL. Assert **UNCHANGED: lockHolder, keepGoingResets, tddKeepGoingCount, tasksDone, gateTimedOut, globalTimedOut, reviewGateType**. Test TddKeepGoingInFinalFix: tddKeepGoingCount increments, state stays finalReviewFix. Assert **UNCHANGED: pipelineState, lockHolder, reviewRound, keepGoingResets, verdict, tasksDone, gateTimedOut, globalTimedOut, reviewGateType**. Test TddKeepGoingExhaustedFinal: when count >= MaxTddKeepGoingPerGate, state transitions to finalReview with verdict="fail", reviewRound increments. Assert **UNCHANGED: lockHolder, keepGoingResets, tddKeepGoingCount, tasksDone, gateTimedOut, globalTimedOut, reviewGateType**. Test that TddStopInFix works from finalReviewFix (transitions to HALTED, lockHolder=NULL). Assert **UNCHANGED: reviewRound, keepGoingResets, tddKeepGoingCount, verdict, tasksDone, gateTimedOut, globalTimedOut, reviewGateType**. Test timeout guards on all actions: gateTimedOut=TRUE or globalTimedOut=TRUE blocks fix completion and TDD escalation.

**TLA+ Coverage:**
- Transition: `FinalReviewFixComplete`, `TddKeepGoingInFinalFix`, `TddKeepGoingExhaustedFinal`
- State: `finalReviewFix`

---

### Step 14: Review Gate Timeout

**Files:**
- `utils/review-timeout.ps1` (create)

**Description:**
Implement the review gate wall-clock timeout. A background timer starts when a review gate is entered. When it fires, `gateTimedOut` is set to TRUE. The timeout only fires during review states (preMergeReview, reviewFix, finalReview, finalReviewFix), not when gate or global timeout has already fired. The timeout is implemented as a PowerShell timer job or stopwatch check at each loop iteration.

**Dependencies:** Steps 5, 1

**Test (write first):**
Test ReviewGateTimeout: gateTimedOut transitions to TRUE. Assert **UNCHANGED: pipelineState, lockHolder, reviewRound, keepGoingResets, tddKeepGoingCount, verdict, tasksDone, globalTimedOut, reviewGateType**. Test that timeout only fires when gateTimedOut=FALSE and globalTimedOut=FALSE. Test that timeout only fires during review states (preMergeReview, reviewFix, finalReview, finalReviewFix). Test that once gateTimedOut=TRUE, further review actions (verdict, fix) are blocked. **Test gate timeout during fix states:** when timeout fires during reviewFix, assert state stays reviewFix (timeout sets flag but doesn't transition); when timeout fires during finalReviewFix, assert state stays finalReviewFix. The routing back to parent review state happens in gate timeout escalation (Step 15), not here. Mock timer to fire deterministically.

**TLA+ Coverage:**
- Transition: `ReviewGateTimeout`
- Variable: `gateTimedOut`

---

### Step 15: Gate Timeout Escalation

**Files:**
- `utils/review-timeout.ps1` (modify)

**Description:**
When the gate timeout fires, the user is offered escalation. **Keep Going:** resets gateTimedOut to FALSE, increments keepGoingResets, resets reviewRound to 0 and tddKeepGoingCount to 0, verdict=NULL. State transitions to the appropriate review state based on reviewGateType (preMerge -> preMergeReview, final -> finalReview). **Stop:** transitions to HALTED. The keepGoingResets counter is shared with ReviewKeepGoing (Step 9) — both increment the same counter.

**Dependencies:** Step 14

**Test (write first):**
Test GateTimeoutKeepGoing: gateTimedOut resets to FALSE, keepGoingResets increments, reviewRound=0, tddKeepGoingCount=0, verdict=NULL. Assert **UNCHANGED: lockHolder, tasksDone, globalTimedOut, reviewGateType**. Test that state routes correctly based on reviewGateType ("preMerge" -> preMergeReview, "final" -> finalReview). **Test gate timeout escalation from fix states:** when gateTimedOut fires during reviewFix (reviewGateType="preMerge"), GateTimeoutKeepGoing routes to preMergeReview (not back to reviewFix). When gateTimedOut fires during finalReviewFix (reviewGateType="final"), GateTimeoutKeepGoing routes to finalReview. Test that Keep Going is only available when keepGoingResets < MaxKeepGoingResets. Test **shared counter with ReviewKeepGoing:** if ReviewKeepGoing already incremented keepGoingResets to 2, GateTimeoutKeepGoing sees keepGoingResets=2 and has only MaxKeepGoingResets-2 resets remaining. Test GateTimeoutStop: state transitions to HALTED, lockHolder=NULL. Assert **UNCHANGED: reviewRound, keepGoingResets, tddKeepGoingCount, verdict, tasksDone, gateTimedOut, globalTimedOut, reviewGateType**. Test that global timeout blocks gate timeout handling (~globalTimedOut guard).

**TLA+ Coverage:**
- Transition: `GateTimeoutKeepGoing`, `GateTimeoutStop`
- Invariant: S5 (KeepGoingResetsBounded)

---

### Step 16: Global Pipeline Timeout

**Files:**
- `utils/global-timeout.ps1` (create)

**Description:**
Implement the global pipeline timeout. A timer starts when the pipeline leaves idle state and fires after PipelineTimeoutSeconds. When it fires, globalTimedOut is set to TRUE, state transitions to HALTED, and the lock is released. This overrides any other state — it fires from any active state except idle, COMPLETE, or HALTED.

**Dependencies:** Steps 2, 3

**Test (write first):**
Test GlobalTimeout: globalTimedOut transitions to TRUE, state transitions to HALTED, lockHolder=NULL. Assert **UNCHANGED: reviewRound, keepGoingResets, tddKeepGoingCount, verdict, tasksDone, gateTimedOut, reviewGateType**. Test that it only fires from active states (not idle, COMPLETE, HALTED). Test that ~globalTimedOut guard prevents double-fire. Test invariant S10: globalTimedOut => pipelineState = HALTED. Test that once global timeout fires, all review actions are blocked (verdict, fix, etc.). Mock timer to fire deterministically.

**TLA+ Coverage:**
- Transition: `GlobalTimeout`
- Variable: `globalTimedOut`
- Invariant: S10 (GlobalTimeoutHalts)

---

### Step 17: Terminal State Absorption

**Files:**
- `utils/pipeline-state.ps1` (modify)

**Description:**
Ensure COMPLETE and HALTED are absorbing states — no transitions out. The `Done` stutter step in TLA+ means the state machine stays in terminal states indefinitely. In implementation: `Test-PipelineTerminal` returns TRUE for COMPLETE/HALTED. All transition functions check this guard first. Terminal states always have lockHolder=NULL.

**Dependencies:** Steps 2, 3

**Test (write first):**
Test that `Test-PipelineTerminal` returns TRUE for COMPLETE and HALTED, FALSE for all other 8 states. Test that calling any transition function (AcquireLock, EnterPreMergeReview, etc.) from a terminal state throws or no-ops. Test that COMPLETE has lockHolder=NULL. Test that HALTED has lockHolder=NULL. Assert **UNCHANGED vars for Done:** all 10 variables are identical before and after the stutter step. Test invariants S1 and S2.

**TLA+ Coverage:**
- Transition: `Done`
- State: `COMPLETE`, `HALTED`
- Invariant: S1 (TerminalIsAbsorbing), S2 (LockReleasedInTerminal)

---

### Step 18: Pipeline Orchestrator Integration

**Files:**
- `stages/8-coding.ps1` (modify)
- `utils/task-runner.ps1` (modify)

**Description:**
Wire the review gate engine into the existing stage-8 coding pipeline. After each task's cleanup loop completes, call `Invoke-ReviewGate -GateType "preMerge"`. After all tasks merge, call `Invoke-ReviewGate -GateType "final"`. The task-runner now tracks tasksDone and dispatches to the merge queue. This step integrates all prior components into the live pipeline flow: AcquireLock at start, StartRunning, review gates between tasks, final review after all tasks, terminal state handling. NumTasks is derived from the tier's task list and passed to config at pipeline start.

**Dependencies:** Steps 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17

**Test (write first):**
Test the happy path end-to-end: lock -> running -> pre-merge review (pass) -> merge -> final review (pass) -> COMPLETE. Assert lockHolder=NULL at end, all invariants hold. Test the retry path: pre-merge review (fail) -> fix -> re-review (pass) -> merge. Test the escalation path: review rounds exhausted -> Keep Going -> fresh review -> pass. Test the halt path: all escalation exhausted -> HALTED. Test the timeout path: global timeout -> HALTED. Test **NumTasks boundary:** with NumTasks=1, single task goes through pre-merge then final. With NumTasks=3, all three tasks go through pre-merge sequentially, then one final review. Mock all external dependencies (Claude invocations, git operations). Assert **UNCHANGED preservation** at each transition boundary in the integration sequence.

**TLA+ Coverage:**
- Transition: `AcquireLock`, `StartRunning`, full lifecycle
- State: All 10 states exercised
- Invariant: S3 (LockHeldWhileActive)

---

### Step 19: Liveness Integration Tests

**Files:**
- `tests/review-liveness.Tests.ps1` (create)

**Description:**
End-to-end integration tests that verify the four TLA+ liveness properties. These tests simulate multi-round review scenarios with controlled nondeterminism (mocked verdicts, timeouts, user choices) and assert that the pipeline always terminates. These are the most comprehensive tests — they exercise the entire state space.

**Dependencies:** Step 18

**Test (write first):**
Test L1 (EventuallyTerminates): Run 100 randomized verdict sequences; assert every run reaches COMPLETE or HALTED. Test L2 (ReviewGateResolves): From preMergeReview, all verdict sequences eventually reach mergeQueue, running, or HALTED. Test L2b (FinalReviewResolves): From finalReview, all verdict sequences reach COMPLETE or HALTED. Test L3 (AllTasksResolve): With NumTasks=3, all tasks eventually merge or pipeline halts. Test with MaxReviewRounds=0 (immediate escalation on first fail — fast termination). Test with MaxReviewRounds=1, MaxKeepGoingResets=0 (minimal counters — single round, no keep going). Test with MaxReviewRounds=3, MaxKeepGoingResets=3 (full counters — exercises all escalation paths). Test with NumTasks=1 (no diff staleness possible). Assert that **every terminal state has lockHolder=NULL** (invariant S2 across all randomized runs).

**TLA+ Coverage:**
- Liveness: L1 (EventuallyTerminates), L2 (ReviewGateResolves), L2b (FinalReviewResolves), L3 (AllTasksResolve)

---

## State Coverage Audit

All TLA+ states, transitions, and properties are covered by the implementation plan.

| Element | Type | Covered By |
|---------|------|------------|
| `idle` | State | Steps 2, 3 |
| `locked` | State | Step 3 |
| `running` | State | Steps 3, 5, 10, 18 |
| `preMergeReview` | State | Steps 5, 6, 9 |
| `reviewFix` | State | Steps 7, 8, 14 |
| `mergeQueue` | State | Steps 6, 10, 11 |
| `finalReview` | State | Steps 5, 12 |
| `finalReviewFix` | State | Steps 12, 13, 14 |
| `COMPLETE` | State | Steps 12, 17 |
| `HALTED` | State | Steps 8, 9, 11, 13, 15, 16, 17 |
| `AcquireLock` | Transition | Step 3 |
| `StartRunning` | Transition | Step 3 |
| `EnterPreMergeReview` | Transition | Step 5 |
| `ReviewVerdict` | Transition | Steps 4, 5 |
| `HandlePassPreMerge` | Transition | Step 6 |
| `HandleFailPreMerge` | Transition | Step 6 |
| `HandleRetryPreMerge` | Transition | Step 6 |
| `ReviewFixComplete` | Transition | Step 7 |
| `TddKeepGoingInFix` | Transition | Step 8 |
| `TddKeepGoingExhausted` | Transition | Step 8 |
| `TddStopInFix` | Transition | Steps 8, 13 |
| `ReviewKeepGoing` | Transition | Step 9 |
| `ReviewForcedStop` | Transition | Step 9 |
| `ReviewStop` | Transition | Step 9 |
| `TaskMerged` | Transition | Step 10 |
| `DiffBaseStale` | Transition | Step 11 |
| `DiffBaseStaleExhausted` | Transition | Step 11 |
| `EnterFinalReview` | Transition | Step 5 |
| `HandlePassFinal` | Transition | Step 12 |
| `HandleFailFinal` | Transition | Step 12 |
| `HandleRetryFinal` | Transition | Step 12 |
| `FinalReviewFixComplete` | Transition | Step 13 |
| `TddKeepGoingInFinalFix` | Transition | Step 13 |
| `TddKeepGoingExhaustedFinal` | Transition | Step 13 |
| `ReviewGateTimeout` | Transition | Step 14 |
| `GateTimeoutKeepGoing` | Transition | Step 15 |
| `GateTimeoutStop` | Transition | Step 15 |
| `GlobalTimeout` | Transition | Step 16 |
| `Done` | Transition | Step 17 |
| S1 (TerminalIsAbsorbing) | Invariant | Steps 12, 17 |
| S2 (LockReleasedInTerminal) | Invariant | Steps 3, 17, 19 |
| S3 (LockHeldWhileActive) | Invariant | Steps 3, 18 |
| S4 (ReviewRoundBounded) | Invariant | Step 6 |
| S5 (KeepGoingResetsBounded) | Invariant | Steps 9, 15 |
| S6 (TddKeepGoingBounded) | Invariant | Step 8 |
| S7 (TaskCountBounded) | Invariant | Step 10 |
| S8 (FinalReviewRequiresAllMerged) | Invariant | Step 12 |
| S9 (NoReviewFixWithoutFail) | Invariant | Step 7 |
| S10 (GlobalTimeoutHalts) | Invariant | Step 16 |
| S11 (structural) | Invariant | Step 1 |
| S12 (structural) | Invariant | Step 11 |
| L1 (EventuallyTerminates) | Liveness | Step 19 |
| L2 (ReviewGateResolves) | Liveness | Step 19 |
| L2b (FinalReviewResolves) | Liveness | Step 19 |
| L3 (AllTasksResolve) | Liveness | Step 19 |

### Objection Resolution Traceability

| # | Objection | Resolution | Affected Steps |
|---|-----------|------------|----------------|
| 1 | UNCHANGED assertions in every test | Every step's test description now lists exact UNCHANGED variables from the TLA+ spec | All steps |
| 2 | T10 tier violation (depends on T6 in same tier) | T10 moved to Tier 5; T11/T12 to Tier 6; T13 to Tier 7; T18 to Tier 8; T19 to Tier 9 | Tier structure |
| 3 | ReviewVerdict timeout guards in Step 5 | Step 5 tests now verify ~gateTimedOut and ~globalTimedOut guards with specific routing behavior | Step 5 |
| 4 | StartRunning unit test in Step 3 | Step 3 now covers StartRunning (locked->running) with UNCHANGED assertions | Step 3 |
| 5 | tddKeepGoingCount sticky exhaustion | Steps 7, 8 document and test stickiness across fix re-entries | Steps 7, 8 |
| 6 | Shared keepGoingResets counter | Steps 9, 15 document shared counter and test cross-transition accumulation | Steps 9, 15 |
| 7 | MaxReviewRounds=0 boundary | Steps 5, 6, 9, 12, 19 test immediate escalation on first fail/retry | Steps 5, 6, 9, 12, 19 |
| 8 | Gate timeout during fix states | Steps 14, 15 test timeout in reviewFix/finalReviewFix with parent state routing | Steps 14, 15 |
| 9 | Specific verdict sequences in Step 5 | Step 5 now has 4 specific mock sequences with expected state traces | Step 5 |
| 10 | DiffBaseStale UNCHANGED preservation | Step 11 explicitly tests keepGoingResets and tddKeepGoingCount preservation | Step 11 |
| 11 | Step 4 dependency mismatch | Step 4 markdown now says "None" matching JSON | Step 4 |
| 12 | NumTasks origin and boundary tests | Step 1 declares NumTasks with derivation, validation, and boundary tests | Steps 1, 10, 18 |

---

## Execution Tiers

### Tier 1: Domain Constants and Verdict Model

| Task ID | Step | Title |
|---------|------|-------|
| T1 | Step 1 | Review gate constants and NumTasks |
| T4 | Step 4 | Review verdict data model |

### Tier 2: State Infrastructure (depends on Tier 1)

| Task ID | Step | Title |
|---------|------|-------|
| T2 | Step 2 | Pipeline state type and initial state |

### Tier 3: Lock, Gate Engine, and Timeouts (depends on Tier 2)

| Task ID | Step | Title |
|---------|------|-------|
| T3 | Step 3 | Pipeline lock manager and StartRunning |
| T5 | Step 5 | Review gate engine — core loop |
| T16 | Step 16 | Global pipeline timeout |
| T17 | Step 17 | Terminal state absorption |

### Tier 4: Pre-Merge Verdict Handling (depends on Tier 3)

| Task ID | Step | Title |
|---------|------|-------|
| T6 | Step 6 | Verdict handling — pass, fail, retry (pre-merge) |
| T9 | Step 9 | Review round exhaustion and Keep Going escalation |
| T14 | Step 14 | Review gate timeout |

### Tier 5: Merge Queue and Fix Cycles (depends on Tier 4)

| Task ID | Step | Title |
|---------|------|-------|
| T7 | Step 7 | Review-fix cycle |
| T10 | Step 10 | Merge queue and task counting |
| T15 | Step 15 | Gate timeout escalation |

### Tier 6: Staleness, Final Review, and TDD Escalation (depends on Tier 5)

| Task ID | Step | Title |
|---------|------|-------|
| T8 | Step 8 | TDD Keep Going and exhaustion in fix |
| T11 | Step 11 | Diff-base staleness detection |
| T12 | Step 12 | Final review gate — verdict handling |

### Tier 7: Final Fix Cycle (depends on Tier 6)

| Task ID | Step | Title |
|---------|------|-------|
| T13 | Step 13 | Final review-fix cycle with TDD escalation |

### Tier 8: Pipeline Integration (depends on Tier 7)

| Task ID | Step | Title |
|---------|------|-------|
| T18 | Step 18 | Pipeline orchestrator integration |

### Tier 9: Liveness Verification (depends on Tier 8)

| Task ID | Step | Title |
|---------|------|-------|
| T19 | Step 19 | Liveness integration tests |

---

## Task Assignment Table

| Task ID | Title | Tier | Code Writer | Test Writer | Dependencies | Rationale |
|---------|-------|------|-------------|-------------|--------------|-----------|
| T1 | Review gate constants and NumTasks | 1 | typescript-writer | vitest-writer | None | Config constants with NumTasks derivation |
| T2 | Pipeline state type and initial state | 2 | typescript-writer | vitest-writer | T1 | State model with type invariant, core data structure |
| T3 | Pipeline lock manager and StartRunning | 3 | typescript-writer | vitest-writer | T2 | File-based lock with PID tracking, includes StartRunning |
| T4 | Review verdict data model | 1 | typescript-writer | vitest-writer | None | Verdict enum and parsing, pure domain type |
| T5 | Review gate engine — core loop | 3 | typescript-writer | vitest-writer | T2, T4 | Core state machine loop with timeout guards |
| T6 | Verdict handling — pass/fail/retry | 4 | typescript-writer | vitest-writer | T5 | Verdict dispatch with guard conditions |
| T7 | Review-fix cycle | 5 | typescript-writer | vitest-writer | T5, T6 | TDD fix loop with sticky counter semantics |
| T8 | TDD Keep Going and exhaustion | 6 | typescript-writer | vitest-writer | T7 | Counter management with sticky exhaustion tests |
| T9 | Review round exhaustion and escalation | 4 | typescript-writer | vitest-writer | T5, T6 | Escalation with shared keepGoingResets counter |
| T10 | Merge queue and task counting | 5 | typescript-writer | vitest-writer | T6, T2 | Merge queue extension, task counter |
| T11 | Diff-base staleness detection | 6 | typescript-writer | vitest-writer | T10 | Git diff comparison with UNCHANGED preservation |
| T12 | Final review gate — verdict handling | 6 | typescript-writer | vitest-writer | T5, T10 | Symmetric to pre-merge but with COMPLETE terminal |
| T13 | Final review-fix with TDD escalation | 7 | typescript-writer | vitest-writer | T7, T8, T12 | Reuses fix cycle for final review context |
| T14 | Review gate timeout | 4 | typescript-writer | vitest-writer | T5, T1 | Timer mechanism with fix-state timeout tests |
| T15 | Gate timeout escalation | 5 | typescript-writer | vitest-writer | T14 | Escalation with shared counter and fix-state routing |
| T16 | Global pipeline timeout | 3 | typescript-writer | vitest-writer | T2, T3 | Global timer override, terminal transition |
| T17 | Terminal state absorption | 3 | typescript-writer | vitest-writer | T2, T3 | Guard function for absorbing states |
| T18 | Pipeline orchestrator integration | 8 | typescript-writer | vitest-writer | T3-T17 | Full pipeline wiring, stage-8 modifications |
| T19 | Liveness integration tests | 9 | typescript-writer | vitest-writer | T18 | Randomized E2E verification with boundary configs |

> **Note on agent assignments:** The vibe-cli codebase is PowerShell-based with Pester tests. The agent types listed above follow the standard pipeline assignment schema. When dispatching, the pipeline should map `typescript-writer` -> `powershell-writer` and `vitest-writer` -> `pester-writer` based on the target file extensions (`.ps1` / `.Tests.ps1`).
