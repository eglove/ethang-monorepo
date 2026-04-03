# Implementation Plan — Project Manager Agent

**Date:** 2026-04-02
**Stage:** Stage 5 — Implementation Planning
**Status:** COMPLETE
**Artifact:** docs/implementation/2026-04-02_project-manager-agent.md

---

## TLA+ State-to-Task Mapping Audit

Every state and transition in `ProjectManagerAgent.tla` has been mapped to at least one implementation step. The mapping is shown below.

### Pipeline States

| TLA+ State | Mapped Task(s) |
|---|---|
| IDLE | T-01 (Initialize) |
| INPUT_VALIDATING | T-02 (Validate Inputs) |
| INPUT_VALID | T-02 (Validate Inputs) |
| INPUT_INVALID | T-03 (Handle Invalid Input) |
| TIER_EXECUTING | T-05 (Start Tier), T-07 (Dispatch), T-12 (Advance Tier) |
| TIER_VERIFYING | T-09 (Run Verification) |
| TIER_VERIFIED | T-10 (Verification Pass), T-12 (Advance Tier) |
| TIER_FAILED | T-14 (Tier All Failed) |
| MERGING | T-11 (Begin Merging) |
| MERGE_ROLLBACK | T-16 (Begin Rollback) |
| ALL_TIERS_COMPLETE | T-13 (All Tiers Complete) |
| HALTED | T-03, T-08, T-14, T-15, T-17 (all error paths) |

### Task States

| TLA+ State | Mapped Task(s) |
|---|---|
| PENDING | T-05 (Start Tier), T-06 (Create Worktree) |
| DISPATCHED | T-06 (Create Worktree) |
| RUNNING | T-07 (Dispatch Agent Pair) |
| COMPLETED | T-08 (Task Succeed) |
| FAILED | T-08 (Task Fail Corruption), T-14 (Tier All Failed) |
| RE_DISPATCHING | T-08 (Task Fail Logic) |
| FIX_SESSION | T-15 (Merge Conflict -> Fix Session) |
| MERGED | T-11 (Merge Task) |
| SKIPPED | T-05 (Start Tier — dependency skip logic) |

### Transitions (Actions)

| TLA+ Action | Mapped Task(s) |
|---|---|
| ValidateInputs | T-02 |
| InputsValid | T-02 |
| InputsInvalid | T-03 |
| HaltPipeline | T-04 (generic halt) |
| AcquireStateLock / ReleaseStateLock | T-01 (lock infrastructure) |
| StartNextTier | T-05 |
| AdvanceTier | T-12 |
| CreateWorktree | T-06 |
| CreateWorktreeFails | T-06 |
| DispatchAgentPair | T-07 |
| SessionTick | T-07 (timeout tracking) |
| SessionTimeoutExpired | T-08 |
| TaskSucceed | T-08 |
| TaskFailLogic | T-08 |
| TaskFailCorruption | T-08 |
| ReDispatch | T-08 |
| TierAllFailed | T-14 |
| RunVerification | T-09 |
| VerificationPass | T-10 |
| VerificationFail | T-10 |
| MergeTask | T-11 |
| MergeConflict | T-15 |
| RollbackMerge | T-16 |
| FixSessionSucceed | T-15 |
| FixSessionFail | T-15 |
| AllTiersComplete | T-13 |
| BeginTierVerification | T-09 |
| BeginMerging | T-11 |
| BeginRollback | T-16 |
| AfterMergeComplete | T-12 |

### Unmapped States

**None.** All 12 pipeline states, 9 task states, and 29 actions are covered.

---

## Execution Tiers

Tasks are grouped into 5 tiers by dependency order. Each tier must complete before the next can begin.

### Tier 1 — Foundation (No Dependencies)

Infrastructure types, domain model, state file writer, lock mechanism, and input validation. These are pure modules with no dependencies on other implementation tasks.

### Tier 2 — Core Execution (Depends on Tier 1)

Git worktree service interface, agent dispatch service interface, session management with timeout tracking, and the main tier execution loop. These depend on the domain model and types from Tier 1.

### Tier 3 — Verification and Merge (Depends on Tier 2)

Verification runner, merge orchestration (per-task merge with conflict detection), and fix session handling. These depend on the execution loop and service interfaces from Tier 2.

### Tier 4 — Error Handling and Recovery (Depends on Tiers 1-3)

All error paths: tier-all-failed, verification failure halt, corruption halt, merge rollback, and the generic halt pipeline action. These depend on understanding all success paths to correctly wire failure transitions.

### Tier 5 — Integration and Completion (Depends on Tiers 1-4)

Tier advancement logic, all-tiers-complete terminal state, pipeline state updates to `docs/pipeline-state.md`, and the AGENT.md specification file that ties everything together. Depends on all prior tiers being implemented.

---

## Task Assignment Table

| Task ID | Title | Tier | Code Writer | Test Writer | Dependencies | Rationale |
|---|---|---|---|---|---|---|
| T-01 | Domain Types and State Model | 1 | types-writer | vitest-writer | None | Defines all enumerated types (PipelineStates, TaskStates, ExecutionResult, DeveloperError, ServiceResult, MergeStrategy) and the typed domain model. Maps directly to TLA+ type definitions (lines 14-82). Foundation for all other tasks. |
| T-02 | Input Validation | 1 | types-writer | vitest-writer | T-01 | Implements ValidateInputs, InputsValid, InputsInvalid actions. Validates TaskIds non-empty, AgentRoster non-empty, implementation plan parseable. Transitions IDLE -> INPUT_VALIDATING -> INPUT_VALID or INPUT_INVALID. Maps to TLA+ lines 170-203. |
| T-03 | Invalid Input Handling | 1 | types-writer | vitest-writer | T-02 | Handles INPUT_INVALID terminal path: sets developerError="INPUT_INVALID", errorCause with diagnostic message, releases lock, halts pipeline. Maps to TLA+ InputsInvalid action. Provides fast-fail behavior from design consensus #2. |
| T-04 | Generic Halt Pipeline | 1 | types-writer | vitest-writer | T-01 | Implements HaltPipeline action: transitions any non-terminal, non-validating state to HALTED, releases lock. Used by all error paths as the terminal escape. Maps to TLA+ lines 205-213. |
| T-05 | Tier Start and Task Initialization | 2 | types-writer | vitest-writer | T-01, T-02 | Implements StartNextTier: transitions INPUT_VALID -> TIER_EXECUTING, sets all tasks in current tier to PENDING. Also handles dependency-based skip logic (tasks whose deps are already COMPLETED/MERGED/SKIPPED). Maps to TLA+ lines 233-241. |
| T-06 | Git Worktree Service | 2 | types-writer | vitest-writer | T-01, T-05 | Implements CreateWorktree and CreateWorktreeFails actions. Domain service interface for git worktree create/checkout. On success: PENDING -> DISPATCHED, worktreeActive=true. On failure: halts with WORKTREE_FAILED. Maps to TLA+ lines 253-280. Implements domain service extraction from design consensus #8. |
| T-07 | Agent Pair Dispatch and Session Management | 2 | types-writer | vitest-writer | T-01, T-05, T-06 | Implements DispatchAgentPair and SessionTick. Selects agent pair from roster, dispatches via Agent tool, increments dispatchCount, starts session timeout tracking. Guards on dependency completion (all deps in COMPLETED/MERGED/SKIPPED). Maps to TLA+ lines 282-310. Implements domain service extraction from design consensus #8. |
| T-08 | Task Outcome Handling (Succeed/Fail/Re-dispatch/Timeout) | 2 | types-writer | vitest-writer | T-01, T-07 | Implements TaskSucceed, TaskFailLogic, TaskFailCorruption, ReDispatch, SessionTimeoutExpired. Four outcome paths: (1) success -> COMPLETED, mergeState=PENDING; (2) logic error -> RE_DISPATCHING if under MaxReDispatches; (3) corruption -> FAILED, halt immediately; (4) timeout -> FAILED, SESSION_TIMEOUT. Maps to TLA+ lines 312-398. Implements error classification from design consensus #5 and timeout from #1. |
| T-09 | Tier Verification | 3 | types-writer | vitest-writer | T-01, T-07, T-08 | Implements BeginTierVerification, RunVerification, and verification criteria checking. Transitions TIER_EXECUTING -> TIER_VERIFYING when all tier tasks are terminal. Runs each verification criterion (compile, lint, etc.) per task. Maps to TLA+ lines 414-437, 562-571. Implements explicit verification criteria from design consensus #4. |
| T-10 | Verification Pass/Fail Decision | 3 | types-writer | vitest-writer | T-09 | Implements VerificationPass and VerificationFail. If all completed tasks pass all criteria: TIER_VERIFYING -> TIER_VERIFIED. If any task fails verification with no active sessions: halt with VERIFICATION_HALT. Maps to TLA+ lines 426-455. Note: implements the residual fix from TLA+ review — VerificationFail fires from TIER_EXECUTING as specified (state asymmetry acknowledged). |
| T-11 | Merge Orchestration | 3 | types-writer | vitest-writer | T-01, T-06, T-09, T-10 | Implements BeginMerging, MergeTask. Transitions TIER_VERIFIED -> MERGING when pending merges exist. Merges per-task after verification pass. Guard: verifiedCriteria[task] = VerificationCriteria (merge-before-verify). Maps to TLA+ lines 457-472, 573-579. Implements merge strategy from design consensus #6 and merge-before-verify from TLA+ review objection #2. |
| T-12 | Tier Advancement and Post-Merge | 3 | types-writer | vitest-writer | T-05, T-11 | Implements AdvanceTier and AfterMergeComplete. After all merges complete: MERGING -> TIER_EXECUTING. After verification: TIER_VERIFIED -> TIER_EXECUTING with next tier's tasks set to PENDING. Maps to TLA+ lines 243-251, 591-598. |
| T-13 | All Tiers Complete | 5 | types-writer | vitest-writer | T-10, T-12 | Implements AllTiersComplete: when pipelineState=TIER_VERIFIED and all tasks are COMPLETED/MERGED/SKIPPED with all merges done, transition to ALL_TIERS_COMPLETE. Releases lock, clears developerError. Maps to TLA+ lines 549-560. Implements success scenario from design consensus #10. |
| T-14 | Tier All Failed | 4 | types-writer | vitest-writer | T-08 | Implements TierAllFailed: when all tasks in current tier are FAILED or RE_DISPATCHING with dispatchCount >= MaxReDispatches, transition to TIER_FAILED. Sets developerError=TIER_BLOCKED, errorTier=currentTier. Maps to TLA+ lines 400-412. |
| T-15 | Merge Conflict and Fix Session | 4 | types-writer | vitest-writer | T-11 | Implements MergeConflict, FixSessionSucceed, FixSessionFail. On merge conflict: increment fixRetryCount, transition task to FIX_SESSION, spawn fresh agent pair. On fix success: COMPLETED, mergeState=PENDING (retry merge). On fix exhaustion (>= MaxFixRetries): halt with MERGE_EXHAUSTED. Maps to TLA+ lines 474-520. Implements merge conflict handling from briefing and fix session retry budget. |
| T-16 | Merge Rollback | 4 | types-writer | vitest-writer | T-11, T-15 | Implements BeginRollback and RollbackMerge. When fix retries exhausted during merging: transition to MERGE_ROLLBACK, remove task from mergedTasks, set mergeState=ROLLED_BACK, transition to TIER_FAILED. Maps to TLA+ lines 493-507, 581-589. Implements rollback strategy from design consensus #2 (expert-continuous-delivery). |
| T-17 | State Lock and Concurrent Write Protection | 1 | types-writer | vitest-writer | T-01 | Implements AcquireStateLock, ReleaseStateLock, LockableStates guard. Single-writer pattern: lock acquired before state transitions, released on terminal states. Prevents concurrent writes to pipeline-state.md. Maps to TLA+ lines 216-231. Implements concurrent write protection from design consensus #7. |
| T-18 | AGENT.md Specification File | 5 | types-writer | vitest-writer | T-01 through T-17 | The final `.claude/skills/project-manager/AGENT.md` file. Encodes the complete behavioral specification: all tiers, all tasks, all error paths, all state transitions. Serves as the executable specification for the project-manager agent. References all domain types, service interfaces, and verification criteria defined in prior tasks. |

---

## TLA+ Invariant-to-Test Mapping

Each safety invariant verified by TLC must have a corresponding test:

| Invariant | Test Coverage |
|---|---|
| TypeOK | T-01 tests: all enum values, all variable types |
| DispatchBounded | T-08 tests: dispatchCount never exceeds MaxReDispatches |
| FixRetryBounded | T-15 tests: fixRetryCount never exceeds MaxFixRetries |
| SessionTimeoutEnforced | T-08 tests: sessionTicks never exceeds SessionTimeout |
| ErrorObservability | T-03, T-08, T-14, T-15, T-16 tests: every non-NONE error has tier/task/cause |
| MergeAfterCompletion | T-11 tests: merge only allowed when taskState=COMPLETED and verifiedCriteria complete |
| VerificationBeforeAdvance | T-10 tests: TIER_VERIFIED only when all criteria pass |
| CorruptionHaltsImmediately | T-08 tests: corruption always results in HALTED state |
| NoReDispatchAfterCorruption | T-08 tests: corrupted tasks cannot transition to RE_DISPATCHING |
| MergedTasksSubset | T-11 tests: mergedTasks is always a subset of completed tasks |
| ConcurrentSessionsBounded | T-07 tests: active sessions never exceed MaxConcurrent |

---

## Residual TLA+ Review Items (Deferred)

The following items from the TLA+ review consensus are acknowledged but deferred to future iterations:

1. **VerificationFail state asymmetry** — Currently fires from TIER_EXECUTING rather than TIER_VERIFYING. The guard (no active sessions) ensures correctness, but the state machine semantics are inconsistent with VerificationPass. Deferred because the guard provides sufficient safety.

2. **MergeStrategy trivial reference** — The constant is referenced but not behaviorally branched on. The current implementation uses per-task merge (the only strategy modeled). Supporting per-tier and deferred strategies requires additional state machine complexity.

3. **Config activation gap** — ConcurrentSessionsBounded, TaskEventuallyTerminal, and EventuallyComplete are defined in the .tla but not activated in the .cfg. This is a TLC configuration concern, not an implementation concern.

---

## Notes

- The output of this plan is the AGENT.md file at `.claude/skills/project-manager/AGENT.md`, not pipeline execution.
- "types-writer" and "vitest-writer" are placeholder agent roles — the actual project-manager will select from the available agent roster at execution time.
- All tasks write to the project-manager's own specification, not to application code. The AGENT.md is the deliverable.
