# TLA+ Specification: Pair Programming Stage

## Source
Briefing: `docs/questioner-sessions/2026-03-30_pair-programming-stage.md`

## Specification
- **Module:** `PairProgrammingStage.tla`
- **Config:** `MC.cfg` (with `MC.tla` for constant operator overrides)

## Revision History

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | 2026-03-30 | Initial specification |
| v1.1 | 2026-03-30 | Expert review fixes (7 mandatory + 3 additional improvements) |

### v1.1 Changes (Expert Review Fixes)

**High Severity:**
1. **Fix 1:** ReDispatchSession now distinguishes corruption vs logic-error re-dispatch. Logic-error re-dispatch inherits `tddCycle`, `hasFailingTest`, `commitCount`, and `crossReviewCount`. Corruption re-dispatch (via `corruptionFlag`) does a full reset. Two separate actions: `ReDispatchSession` and `ReDispatchSessionCorruption`.
2. **Fix 2:** `TDDCyclesExhausted` at RED now requires `tddCycle[task] > 0` to enter LOCAL_REVIEW. A new action `TDDCyclesExhaustedNoWork` routes to SESSION_FAILED when cycles are exhausted with zero completed work.
3. **Fix 3:** `MergeConflictEscalates` is now guarded by `mergeConflictRetries[task] >= MaxMergeConflictRetries` — escalation only fires after retries are exhausted.

**Medium Severity:**
4. **Fix 4:** Added `commitCount` variable per task, incremented in `MakeTestPass` (after each GREEN->REFACTOR_REVIEW cycle). Safety invariant `CommitCountMatchesCycles` ensures `commitCount = tddCycle` for SESSION_COMPLETE tasks.
5. **Fix 5:** `SessionFails` guard extended to include `TEST_VALIDATION` and `LOCAL_REVIEW` states.
6. **Fix 6:** Added `MergeQueueProgress` liveness property: every QUEUED merge eventually reaches MERGE_COMPLETE, MERGE_CONFLICT, or pipeline HALTED.
7. **Fix 7:** Added dedicated `MaxMergeConflictRetries` constant, replacing the overloaded use of `MaxReDispatches` for merge conflict retries.

**Additional Improvements:**
- Added `haltReason` variable (enum) to distinguish escalation paths: TIER_ALL_FAILED, VERIFICATION_FAILED, GLOBAL_REVIEW_EXHAUSTED, MERGE_CONFLICT_UNRESOLVABLE
- Added `ASSUME \A t \in Tasks : TierOf[t] \in 1..NumTiers` for TierOf validity
- Added `terminalArtifact` boolean set TRUE when pipeline reaches COMPLETE, with safety property `TerminalArtifactOnlyOnComplete`
- Added `SessionFailsCorruption` action to model filesystem corruption failures separately

## States

### Pipeline States
- `CONFIRMATION_GATE` — waiting for user to approve task breakdown before autonomous work
- `TIER_EXECUTING` — dispatching and running pair sessions for the current tier
- `TIER_MERGING` — serialized merge queue processing completed worktrees
- `INTER_TIER_VERIFICATION` — full test suite + type-check after all tier merges
- `GLOBAL_REVIEW` — cross-task integration review after all tiers complete
- `FIX_SESSION` — targeted fix session spawned by failed global review
- `COMPLETE` — pipeline finished successfully (commit on named branch)
- `HALTED` — unrecoverable failure, escalated to user

### Session States (per task)
- `IDLE` — not yet dispatched
- `HANDSHAKE` — test writer proposes increment, code writer confirms
- `RED` — test writer writing a failing test
- `TEST_VALIDATION` — quality gate: test must compile and fail for behavioral reason
- `GREEN` — code writer making the failing test pass
- `REFACTOR_REVIEW` — in-cycle refactor review
- `LOCAL_REVIEW` — 5-point checklist + mutual cross-review
- `SESSION_COMPLETE` — task done, ready for merge
- `SESSION_FAILED` — unrecoverable session error, may be re-dispatched

### Merge States (per task)
- `NOT_QUEUED` — not yet in merge pipeline
- `QUEUED` — waiting for merge queue slot
- `MERGING` — actively merging worktree back to tier branch
- `POST_MERGE_TEST` — running full test suite after merge
- `MERGE_COMPLETE` — successfully merged and verified
- `MERGE_CONFLICT` — merge failed, awaiting resolution or escalation

### Halt Reasons
- `NONE` — pipeline not halted
- `TIER_ALL_FAILED` — all sessions in a tier failed
- `VERIFICATION_FAILED` — inter-tier verification detected cross-tier defect
- `GLOBAL_REVIEW_EXHAUSTED` — global review fix iterations exhausted
- `MERGE_CONFLICT_UNRESOLVABLE` — merge conflict retries exhausted

## Properties Verified

### Safety (Invariants) — 14 total
- **TypeOK** — all variables remain within their declared domains
- **SerializedMergeQueue** — at most one task is actively merging at any time
- **TDDOrdering** — every GREEN phase has a preceding failing test (hasFailingTest = TRUE)
- **GlobalFixBounded** — global review fix iterations never exceed MaxGlobalFixes
- **CrossReviewBounded** — cross-review iterations per session never exceed MaxCrossReview
- **TierOrderingValid** — no active session belongs to a tier other than currentTier
- **ConcurrencyBounded** — active session count never exceeds MaxConcurrent (worktree cap)
- **CompletionRequiresConfirmation** — pipeline cannot reach COMPLETE without user confirmation
- **NoMergeDuringExecution** — no merge activity while sessions are running in TIER_EXECUTING
- **ReDispatchBounded** — re-dispatch count per task never exceeds MaxReDispatches
- **CommitCountMatchesCycles** — for SESSION_COMPLETE tasks, commitCount equals tddCycle (v1.1)
- **MergeConflictRetriesBounded** — merge conflict retries bounded by MaxMergeConflictRetries (v1.1)
- **TerminalArtifactOnlyOnComplete** — terminalArtifact is TRUE only when pipeline is COMPLETE (v1.1)
- **HaltReasonConsistent** — haltReason is not NONE whenever pipeline is HALTED (v1.1)

### Liveness — 4 total
- **SessionTerminates** — every dispatched session eventually reaches SESSION_COMPLETE, SESSION_FAILED, or pipeline HALTED
- **TierTerminates** — every TIER_EXECUTING phase eventually transitions to TIER_MERGING or HALTED
- **PipelineTerminates** — once confirmed, the pipeline eventually reaches COMPLETE or HALTED
- **MergeQueueProgress** — every QUEUED merge eventually reaches MERGE_COMPLETE, MERGE_CONFLICT, or pipeline HALTED (v1.1)

## TLC Results

### v1.1: Full model (3 tasks — 2 in tier 1, 1 in tier 2)
- **States generated:** 815,352
- **Distinct states:** 593,318
- **Result:** PASS (all 14 invariants + 4 liveness properties)
- **Search depth:** 76
- **Workers:** 4
- **Duration:** 55 seconds
- **Date:** 2026-03-30

### Model Parameters
| Constant | Value | Meaning |
|----------|-------|---------|
| Tasks | {t1, t2, t3} | 3 tasks total |
| TierOf | t1->1, t2->1, t3->2 | 2 parallel in tier 1, 1 in tier 2 |
| NumTiers | 2 | 2 execution tiers |
| MaxConcurrent | 2 | Windows worktree cap |
| MaxGlobalFixes | 2 | Global review fix iterations |
| MaxCrossReview | 1 | Cross-review iterations per session |
| MaxTDDCycles | 2 | TDD cycles per session |
| MaxValidationRetries | 1 | Test validation retries per cycle |
| MaxReDispatches | 1 | Re-dispatch attempts per task |
| MaxMergeConflictRetries | 1 | Merge conflict resolution attempts (v1.1) |

## Design Findings

### v1.0 Findings
During model checking, the initial specification revealed that test validation retries were unbounded, creating a potential livelock where a session could loop between RED and TEST_VALIDATION indefinitely. This was resolved by adding `MaxValidationRetries` as a bounded counter with exhaustion leading to SESSION_FAILED. Similarly, re-dispatches and merge conflict retries were bounded to ensure all loops are finite, which is required for the liveness properties to hold.

### v1.1 Findings
The expert review identified that the original `ReDispatchSession` action incorrectly reset all session state, contradicting the design requirement that re-dispatched sessions inherit prior progress (passing commits, TDD cycle count). The revised spec models two distinct re-dispatch paths: logic-error re-dispatch (inherits context) and corruption re-dispatch (full reset). The `MergeConflictEscalates` action was also found to be unguarded, allowing immediate escalation without attempting resolution first — this is now guarded by retry exhaustion. The state space grew from 278,642 to 593,318 distinct states due to the additional variables and actions.

## Prior Versions
None (v1.1 is an in-place revision of v1.0)
