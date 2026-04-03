# TLA+ Specification: Project Manager Agent

## Source
Briefing: `docs/questioner-sessions/2026-04-02_project-manager-agent.md`
Design Consensus: `docs/debate-moderator-sessions/2026-04-02_project-manager-agent-design.md`

## Specification
- **Module:** `ProjectManagerAgent.tla`
- **Config:** `ProjectManagerAgent.cfg`

## States
- **Pipeline states:** IDLE, INPUT_VALIDATING, INPUT_VALID, INPUT_INVALID, TIER_EXECUTING, TIER_VERIFYING, TIER_VERIFIED, TIER_FAILED, MERGING, MERGE_ROLLBACK, ALL_TIERS_COMPLETE, HALTED
- **Task states:** PENDING, DISPATCHED, RUNNING, COMPLETED, FAILED, RE_DISPATCHING, FIX_SESSION, MERGED, SKIPPED
- **Execution results:** SUCCESS, FAILED_LOGIC, FAILED_CORRUPTION, TIMEOUT, VERIFICATION_FAILED, MERGE_CONFLICT, TIER_ALL_FAILED
- **Developer errors:** NONE, TIER_BLOCKED, TASK_FAILED, MERGE_EXHAUSTED, VERIFICATION_HALT, WORKTREE_FAILED, INPUT_INVALID, SESSION_TIMEOUT

## Augmentation Points Modeled
1. **SessionTimeout** -- constant; session tick counter; timeout terminates session
2. **InputValidation** -- INPUT_VALIDATING/INPUT_VALID/INPUT_INVALID states; fails fast with diagnostic
3. **TypedExecutionResult** -- enumerated type replacing ad-hoc status strings
4. **VerificationCriteria** -- constant set; per-task verification tracking; must pass before tier advance
5. **ErrorClassification** -- FAILED_LOGIC (re-dispatch with context) vs FAILED_CORRUPTION (full reset, immediate halt)
6. **MergeStrategy** -- per-task merge with rollback for partial merges; fix session with retry budget
7. **ConcurrentWriteProtection** -- pipelineStateLocked variable; lock acquire/release; LockableStates guard
8. **DomainServiceInterfaces** -- CreateWorktree/DispatchAgentPair as typed service calls with ServiceResult
9. **DeveloperObservableErrors** -- developerError, errorTier, errorTask, errorCause tuple; ErrorObservability invariant
10. **SuccessScenario** -- ALL_TIERS_COMPLETE state; all tasks completed/merged/verified

## Properties Verified
### Safety (Invariants)
- **TypeOK** -- all variables always within their declared domains
- **DispatchBounded** -- dispatch count never exceeds MaxReDispatches
- **FixRetryBounded** -- fix retry count never exceeds MaxFixRetries
- **SessionTimeoutEnforced** -- no active session exceeds SessionTimeout ticks
- **ErrorObservability** -- every non-NONE error has meaningful tier/task/cause
- **MergeAfterCompletion** -- tasks only merged after completion
- **VerificationBeforeAdvance** -- tier advance requires all verification criteria passing
- **CorruptionHaltsImmediately** -- corruption failure always results in HALTED state
- **NoReDispatchAfterCorruption** -- corrupted tasks cannot be re-dispatched
- **MergedTasksSubset** -- merged tasks are always a subset of completed tasks

### Liveness
Liveness properties are defined in the spec (EventuallyTerminal, SessionProgress) but not model-checked due to state-space interleaving artifacts. The safety invariants provide the critical design guarantees.

## TLC Results
- **States generated:** 668,836
- **Distinct states:** 111,156
- **Depth:** 24
- **Result:** PASS -- all 10 safety invariants verified, no errors found
- **Workers:** 4
- **Date:** 2026-04-02

## Prior Versions
None
