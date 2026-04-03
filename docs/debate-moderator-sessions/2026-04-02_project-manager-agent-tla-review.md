# Debate Moderator Session — Project Manager Agent TLA+ Review

**Date:** 2026-04-02
**Stage:** Stage 4 — TLA+ Review Debate
**Result:** CONSENSUS REACHED
**Rounds:** 3
**Experts:** expert-tla, expert-tdd, expert-edge-cases, expert-bdd, expert-continuous-delivery

---

## Synthesis

### Agreed Recommendation

The TLA+ specification is **largely well-aligned** with the design consensus and briefing, but has the following gaps that should be addressed before the spec is considered complete:

1. **Missing `MaxConcurrent` enforcement:** The constant `MaxConcurrent` is declared but never used in any action or invariant. The design explicitly mentions parallel execution bounded by `MaxConcurrent`, but the spec allows unlimited concurrent sessions. A safety invariant should constrain the number of simultaneously active sessions.

2. **`MergeStrategy` constant unused:** The `MergeStrategy` type is defined but no action references it. The design consensus (recommendation #6) explicitly calls out merge timing as unresolved. The spec should either model merge strategy selection or remove the constant.

3. **`TIER_VERIFYING` and `MERGING`/`MERGE_ROLLBACK` states unreachable:** These states exist in `PipelineStates` but no action transitions into them. `VerificationPass` jumps directly from `TIER_EXECUTING` to `TIER_VERIFIED`, skipping `TIER_VERIFYING`. Merge actions transition directly without using `MERGING` or `MERGE_ROLLBACK` states. These are dead states that inflate the state space without adding coverage.

4. **`taskDeps` never checked:** The `taskDeps` variable is declared and initialized but no action checks dependency satisfaction before dispatching. The briefing mentions "tasks, tiers, dependencies" as inputs, and the design consensus notes dependency ordering. The spec should guard `CreateWorktree`/`DispatchAgentPair` with a dependency-satisfaction check.

5. **`VerificationFail` can fire prematurely:** The `VerificationFail` action can trigger on any completed task whose criteria are not yet fully checked, even while `RunVerification` is still in progress. This creates a race where verification can fail before all criteria have been evaluated. The design consensus (recommendation #4) requires explicit verification contracts.

6. **No liveness property for task completion:** `EventuallyTerminal` and `SessionProgress` are the only liveness properties. There is no property guaranteeing that every task eventually reaches a terminal task state (completed, failed, or skipped). The design consensus (recommendation #10) requires a success scenario.

7. **`AdvanceTier` uses `CHOOSE` non-deterministically:** The `NextTier` function uses `CHOOSE n \in TierIds : n > t` which picks an arbitrary next tier. If tiers are not consecutive integers, this could skip tiers. The briefing implies sequential tier execution.

8. **Missing safety property: no merge before verification:** The design consensus emphasizes verification before merge. While `MergeAfterCompletion` checks that merge follows task completion, there is no invariant ensuring verification passed before merge occurs.

---

### Expert Final Positions

**expert-tla**
Position: The spec is structurally sound with good coverage of the core state machine, but has several modeling gaps.
Key reasoning: The spec correctly models the input validation, session lifecycle, error recovery, and merge conflict paths. The property set covers key safety concerns (bounded retries, timeout enforcement, error observability, corruption handling). However, unused constants (`MaxConcurrent`, `MergeStrategy`), dead states (`TIER_VERIFYING`, `MERGING`, `MERGE_ROLLBACK`), and the missing dependency check are significant gaps. The `VerificationFail` race condition is a correctness concern. The spec needs a `MaxConcurrentEnforced` invariant and a `NoMergeBeforeVerification` safety property.
Endorsed: expert-tdd (missing task completion liveness), expert-edge-cases (dependency check gap, verification race), expert-bdd (success scenario property), expert-continuous-delivery (merge-before-verify gap).

**expert-tdd**
Position: Supportive of the spec's testability structure, but concerned about missing liveness guarantees.
Key reasoning: The invariants in the .cfg file are well-chosen for safety properties. `DispatchBounded`, `FixRetryBounded`, and `SessionTimeoutEnforced` directly correspond to testable contracts from the design consensus. However, the spec lacks a liveness property for task completion — something like `\A t \in TaskIds : taskState[t] = "PENDING" ~> taskState[t] \in {"COMPLETED", "FAILED", "SKIPPED"}`. Without this, the model checker cannot verify that tasks make progress. The design consensus recommendation #10 (success scenario) maps directly to this gap.
Endorsed: expert-tla (unused constants, dead states), expert-bdd (success scenario), expert-edge-cases (dependency check).

**expert-edge-cases**
Position: The spec covers most failure modes from the design consensus but misses the dependency ordering edge case.
Key reasoning: The briefing explicitly lists "task with zero dependencies placed in later tier" as an edge case. The spec has a `taskDeps` variable but never uses it to guard dispatch. This means the spec allows dispatching a task before its dependencies are satisfied — a direct contradiction of the tiered execution model. Additionally, the `VerificationFail` action can fire while verification is still running (before all criteria are checked), which is a race condition the design consensus warned about (recommendation #4). The `SessionTimeoutExpired` action correctly handles the timeout case from recommendation #1, and `InputsInvalid` handles recommendation #2 (input validation).
Endorsed: expert-tla (dependency check gap, verification race), expert-tdd (task completion liveness), expert-continuous-delivery (merge timing ambiguity).

**expert-bdd**
Position: The spec models internal mechanics well but lacks an observable success scenario property.
Key reasoning: The `ErrorObservability` invariant is excellent — it ensures that any non-NONE error has a cause and tier/task reference. This directly addresses design consensus recommendation #9 (developer-observable error states). However, there is no property that captures "all tiers complete successfully." The `AllTiersComplete` action exists, but no temporal property asserts that this state is eventually reached under normal conditions. The design consensus recommendation #10 (success scenario) needs a corresponding liveness property: `EventuallyComplete == (pipelineState = "INPUT_VALID") ~> (pipelineState = "ALL_TIERS_COMPLETE")`.
Endorsed: expert-tla (dead states reduce spec clarity), expert-tdd (task completion liveness), expert-edge-cases (verification race).

**expert-continuous-delivery**
Position: The spec models the core pipeline correctly but has a merge-before-verify gap.
Key reasoning: The design consensus recommendation #6 (merge timing) is partially addressed — the spec has `MergeTask`, `MergeConflict`, `RollbackMerge`, and `FixSessionSucceed/Fail` actions. However, there is no invariant preventing merge before verification passes. `MergeAfterCompletion` only checks that the task is completed, not that verification passed. A task could be completed but not yet verified, and the spec allows merging it. This contradicts the design consensus requirement that verification precedes merge. Additionally, the `MergeStrategy` constant is defined but unused — the spec should model whether merges are per-task, per-tier, or deferred.
Endorsed: expert-tla (merge-before-verify gap, unused MergeStrategy), expert-edge-cases (dependency check), expert-bdd (success scenario).

---

### Unresolved Dissents
_none — consensus reached_

---

## Detailed Findings

### States: Coverage Analysis

**States from Design Present in Spec:**
- IDLE, INPUT_VALIDATING, INPUT_VALID, INPUT_INVALID — input validation flow (recommendations #1, #2)
- TIER_EXECUTING, TIER_VERIFYING, TIER_VERIFIED, TIER_FAILED — tier lifecycle
- MERGING, MERGE_ROLLBACK — merge states (defined but unreachable)
- ALL_TIERS_COMPLETE, HALTED — terminal states
- Task states: PENDING, DISPATCHED, RUNNING, COMPLETED, FAILED, RE_DISPATCHING, FIX_SESSION, MERGED, SKIPPED — full task lifecycle

**Dead States (no action transitions into them):**
- `TIER_VERIFYING` — `VerificationPass` jumps from `TIER_EXECUTING` to `TIER_VERIFIED`
- `MERGING` — merge actions transition directly without this intermediate state
- `MERGE_ROLLBACK` — `RollbackMerge` transitions to `TIER_FAILED`, not `MERGE_ROLLBACK`

**Missing States:**
- None identified. All states from the briefing and design consensus are represented.

### Transitions: Coverage Analysis

**Transitions from Design Present in Spec:**
- IDLE -> INPUT_VALIDATING -> INPUT_VALID/INPUT_INVALID — input validation
- INPUT_VALID -> TIER_EXECUTING — StartNextTier
- TIER_EXECUTING -> TIER_VERIFIED — VerificationPass
- TIER_VERIFIED -> TIER_EXECUTING (next tier) — AdvanceTier
- TIER_EXECUTING -> TIER_FAILED — TierAllFailed
- TIER_VERIFIED -> ALL_TIERS_COMPLETE — AllTiersComplete
- Any non-terminal -> HALTED — HaltPipeline
- Task: PENDING -> DISPATCHED -> RUNNING -> COMPLETED/FAILED/RE_DISPATCHING/FIX_SESSION
- RE_DISPATCHING -> RUNNING — ReDispatch
- FIX_SESSION -> COMPLETED/HALTED — FixSessionSucceed/FixSessionFail
- PENDING -> HALTED (worktree failure) — CreateWorktreeFails
- RUNNING -> HALTED (corruption) — TaskFailCorruption

**Missing Transitions:**
- Dependency-satisfied check before dispatch (taskDeps is never consulted)
- Merge strategy selection (MergeStrategy constant is unused)

### Safety Properties: Analysis

**Properties in Spec (Invariants):**
1. `TypeOK` — all variables have correct types
2. `DispatchBounded` — dispatch count bounded by MaxReDispatches
3. `FixRetryBounded` — fix retry count bounded by MaxFixRetries
4. `SessionTimeoutEnforced` — session ticks bounded by SessionTimeout
5. `ErrorObservability` — errors have cause and tier/task reference
6. `MergeAfterCompletion` — merge only after task completion
7. `VerificationBeforeAdvance` — verification complete before tier advance
8. `CorruptionHaltsImmediately` — corruption causes immediate halt
9. `NoReDispatchAfterCorruption` — no re-dispatch after corruption
10. `MergedTasksSubset` — merged tasks are subset of completed tasks

**Missing Safety Properties:**
1. `MaxConcurrentEnforced` — number of active sessions <= MaxConcurrent
2. `NoMergeBeforeVerification` — merge only after verification passes
3. `DependenciesSatisfied` — task dispatched only after all dependencies completed
4. `NoVerificationRace` — verification cannot fail while still in progress

### Liveness Properties: Analysis

**Properties in Spec:**
1. `EventuallyTerminal` — pipeline eventually reaches terminal state
2. `SessionProgress` — active sessions eventually complete

**Missing Liveness Properties:**
1. `TaskEventuallyTerminal` — each task eventually reaches COMPLETED, FAILED, or SKIPPED
2. `EventuallyComplete` — pipeline eventually reaches ALL_TIERS_COMPLETE from INPUT_VALID (success scenario)
3. `TierEventuallyAdvances` — verified tiers eventually advance to next tier

### Contradictions with Design Consensus

| Design Consensus Item | Spec Status | Notes |
|---|---|---|
| #1 Timeout constant | ADDRESSED | `SessionTimeout` constant + `SessionTimeoutExpired` action + `SessionTimeoutEnforced` invariant |
| #2 Input validation | ADDRESSED | `ValidateInputs`, `InputsValid`, `InputsInvalid` actions |
| #3 Typed execution result | PARTIALLY | `ExecutionResult` type exists but is string-based, not a typed domain model |
| #4 Explicit verification criteria | PARTIALLY | `VerificationCriteria` constant exists, but `VerificationFail` has race condition |
| #5 Error classification | ADDRESSED | `TaskFailLogic` vs `TaskFailCorruption` as separate actions |
| #6 Merge strategy/timing | NOT ADDRESSED | `MergeStrategy` constant defined but unused |
| #7 Concurrent write protection | NOT ADDRESSED | `MaxConcurrent` constant defined but unused; no concurrency guard |
| #8 Domain service interfaces | N/A | TLA+ models behavior, not implementation architecture |
| #9 Developer-observable errors | ADDRESSED | `ErrorObservability` invariant |
| #10 Success scenario | NOT ADDRESSED | No liveness property for successful completion |

---

## Round Transcripts

### Round 1

**expert-tla**

Position: The spec is structurally sound with good coverage of the core state machine, but has several modeling gaps that should be addressed.

Reasoning: Let me systematically evaluate the spec against the briefing and design consensus.

The spec correctly models: input validation (IDLE -> INPUT_VALIDATING -> INPUT_VALID/INPUT_INVALID), tier execution (StartNextTier, AdvanceTier), session lifecycle (DispatchAgentPair, SessionTick, SessionTimeoutExpired, TaskSucceed, TaskFailLogic, TaskFailCorruption), error recovery (ReDispatch, TierAllFailed), verification (RunVerification, VerificationPass, VerificationFail), merge handling (MergeTask, MergeConflict, RollbackMerge, FixSessionSucceed, FixSessionFail), and terminal states (AllTiersComplete, HaltPipeline, Terminated).

The property set is well-chosen: `DispatchBounded`, `FixRetryBounded`, `SessionTimeoutEnforced` cover the bounded retry contracts. `ErrorObservability` ensures errors are developer-readable. `CorruptionHaltsImmediately` and `NoReDispatchAfterCorruption` handle the error classification from design consensus #5.

However, I found several gaps:
1. `MaxConcurrent` is declared as a constant but never used in any action or invariant. The briefing mentions MaxConcurrent as a pipeline constant for parallel execution limits.
2. `MergeStrategy` is defined but never referenced by any action.
3. `TIER_VERIFYING`, `MERGING`, and `MERGE_ROLLBACK` states are defined but no action transitions into them — they are dead states.
4. `taskDeps` is declared but never checked before dispatching tasks.
5. `VerificationFail` can fire while `RunVerification` is still in progress — a race condition.

Objections:
- [unused constant] MaxConcurrent is declared but never enforced — the spec allows unlimited concurrent sessions.
- [dead states] TIER_VERIFYING, MERGING, MERGE_ROLLBACK inflate state space without adding coverage.
- [missing guard] taskDeps is never consulted — tasks can be dispatched before dependencies are satisfied.
- [race condition] VerificationFail can fire before all criteria are checked.

Endorsements:
- None

---

**expert-tdd**

Position: Supportive of the spec's testability structure, but concerned about missing liveness guarantees for task completion.

Reasoning: From a TDD perspective, the invariants in the .cfg file are excellent test contracts. `DispatchBounded` maps to "dispatch count never exceeds MaxReDispatches" — a clear test scenario. `SessionTimeoutEnforced` maps to "session ticks never exceed SessionTimeout" — another clear test. These are the kind of properties that give confidence in the spec.

However, the spec lacks a liveness property for task completion. The design consensus recommendation #10 asks for a success scenario — what does "done" look like? The spec has `EventuallyTerminal` (pipeline reaches terminal state) but this is satisfied by reaching HALTED, which is not the success case. We need `\A t \in TaskIds : taskState[t] = "PENDING" ~> taskState[t] \in {"COMPLETED", "FAILED", "SKIPPED"}` to verify that tasks make progress.

I also endorse expert-tla's findings on unused constants and dead states. These are spec quality issues that make the model harder to understand and verify.

Objections:
- [missing liveness] No property guaranteeing tasks eventually reach a terminal state.
- [success scenario] EventuallyTerminal is satisfied by HALTED — not the success case.

Endorsements:
- expert-tla: Unused constants (MaxConcurrent, MergeStrategy) and dead states (TIER_VERIFYING, MERGING, MERGE_ROLLBACK) are spec quality issues.

---

**expert-edge-cases**

Position: The spec covers most failure modes but misses the dependency ordering edge case entirely.

Reasoning: The briefing explicitly lists "task with zero dependencies placed in later tier" as an edge case. The spec has a `taskDeps` variable initialized to empty sets, but no action ever checks it. This means the spec allows dispatching task B before task A completes, even if task B depends on task A. This is a direct contradiction of the tiered execution model where dependencies determine tier placement.

Additionally, the `VerificationFail` action has a subtle race: it fires when `verifiedCriteria[task] /= VerificationCriteria` for any completed task. But `RunVerification` adds criteria one at a time. So if task1 has criteria {compile, lint} and only compile has been checked, VerificationFail can fire even though lint hasn't been evaluated yet. The fix is to guard VerificationFail with a condition that verification is complete but failed.

I also note that `SessionTimeoutExpired` correctly handles the timeout case from design consensus #1, and `InputsInvalid` handles #2. `TaskFailLogic` vs `TaskFailCorruption` handles #5. But #6 (merge timing), #7 (concurrent writes), and #10 (success scenario) are not addressed.

Objections:
- [dependency check] taskDeps is never consulted — tasks can be dispatched out of order.
- [verification race] VerificationFail can fire before all criteria are evaluated.
- [merge timing] MergeStrategy constant is unused — spec doesn't model per-task vs per-tier vs deferred.

Endorsements:
- expert-tla: Dead states and unused constants are spec quality issues.
- expert-tdd: Missing task completion liveness property.

---

**expert-bdd**

Position: The spec models internal mechanics well but lacks an observable success scenario property.

Reasoning: The `ErrorObservability` invariant is excellent — it ensures that any non-NONE developerError has a non-empty errorCause and a valid errorTier or errorTask. This directly addresses design consensus recommendation #9 (developer-observable error states). A developer reading the error output can always determine what went wrong, where, and why.

However, there is no property capturing the success scenario from recommendation #10. The design consensus asks: "what does 'done' look like from the developer's perspective?" The spec should have a liveness property like `EventuallyComplete == (pipelineState = "INPUT_VALID") ~> (pipelineState = "ALL_TIERS_COMPLETE")`. This asserts that if the pipeline starts with valid inputs, it eventually completes all tiers successfully.

The `AllTiersComplete` action correctly checks that all tasks are in {COMPLETED, MERGED, SKIPPED} and all merges are in {MERGED, NONE}. This is a good success condition. But without a liveness property asserting it is eventually reached, the model checker cannot verify the happy path.

Objections:
- [no success liveness] No property asserting ALL_TIERS_COMPLETE is eventually reached from valid inputs.
- [dead states] TIER_VERIFYING, MERGING, MERGE_ROLLBACK are defined but unreachable — confusing for readers.

Endorsements:
- expert-tla: Dead states reduce spec clarity.
- expert-tdd: Task completion liveness is needed for the success scenario.

---

**expert-continuous-delivery**

Position: The spec models the core pipeline correctly but has a merge-before-verify gap.

Reasoning: The design consensus recommendation #6 calls out merge timing as critical. The spec has merge actions (MergeTask, MergeConflict, RollbackMerge) but no invariant preventing merge before verification passes. `MergeAfterCompletion` only checks that the task state is COMPLETED or MERGED — it does not check that `verifiedCriteria[task] = VerificationCriteria`. This means the spec allows merging a task that has completed but not yet been verified.

This is a direct contradiction of the design consensus, which states: "Define what 'verification' means for inter-tier checks — is it compilation, linting, test pass rate, or all three? Each criterion needs a pass/fail contract." The spec models verification criteria checking but does not gate merge on verification completion.

Additionally, `MaxConcurrent` is unused (endorse expert-tla). The briefing mentions MaxConcurrent as a pipeline constant for parallel execution. The spec should have an invariant like `MaxConcurrentEnforced == Cardinality({t \in TaskIds : sessionActive[t]}) <= MaxConcurrent`.

Objections:
- [merge-before-verify] No invariant preventing merge before verification passes.
- [MaxConcurrent unused] Parallel execution limit is not enforced.

Endorsements:
- expert-tla: Unused MergeStrategy constant and dead states.
- expert-edge-cases: Dependency check gap.

---

### Round 2

**expert-tla**

Position: Maintaining all findings. Endorse all other experts' primary objections.

Reasoning: Round 1 reveals strong convergence. All experts agree on: unused constants (MaxConcurrent, MergeStrategy), dead states (TIER_VERIFYING, MERGING, MERGE_ROLLBACK), missing dependency check, and missing success scenario liveness.

I additionally endorse expert-continuous-delivery's merge-before-verify gap. The `MergeAfterCompletion` invariant is too weak — it should be `MergeAfterVerification`: merge only after verifiedCriteria[task] = VerificationCriteria.

I also note that the `AdvanceTier` action uses `CHOOSE n \in TierIds : n > t` which picks an arbitrary next tier. If TierIds = {1, 2} and currentTier = 1, CHOOSE could pick 2 (correct). But if TierIds = {1, 3} (non-consecutive), CHOOSE could pick 3, skipping tier 2. The briefing implies sequential tier execution. This is a minor concern given the .cfg uses consecutive integers, but worth noting.

Objections:
- [unused constant] MaxConcurrent declared but never enforced (maintained)
- [unused constant] MergeStrategy declared but never referenced (maintained)
- [dead states] TIER_VERIFYING, MERGING, MERGE_ROLLBACK unreachable (maintained)
- [missing guard] taskDeps never consulted before dispatch (maintained)
- [race condition] VerificationFail can fire before all criteria checked (maintained)
- [merge-before-verify] No invariant preventing merge before verification (new, endorsed from expert-continuous-delivery)

Endorsements:
- expert-tdd: Missing task completion liveness property.
- expert-edge-cases: Dependency check gap and verification race.
- expert-bdd: Missing success scenario liveness property.
- expert-continuous-delivery: Merge-before-verify gap and MaxConcurrent enforcement.

---

**expert-tdd**

Position: Maintaining conditional support. Endorse expert-continuous-delivery on merge-before-verify.

Reasoning: The merge-before-verify gap is a direct testability concern. If the spec allows merge before verification, then any test of the "verify then merge" contract is incomplete. The invariant should be strengthened to `MergeAfterVerification == \A t \in TaskIds : mergeState[t] = "MERGED" => verifiedCriteria[t] = VerificationCriteria`.

I maintain my liveness objection. The .cfg file should include:
- `PROPERTY TaskEventuallyTerminal` — each task progresses
- `PROPERTY EventuallyComplete` — pipeline reaches ALL_TIERS_COMPLETE from valid inputs

Objections:
- [missing liveness] No task completion liveness (maintained)
- [success scenario] No EventuallyComplete property (maintained)
- [merge-before-verify] MergeAfterCompletion too weak (new, endorsed)

Endorsements:
- expert-tla: All findings including merge-before-verify.
- expert-continuous-delivery: Merge-before-verify gap.

---

**expert-edge-cases**

Position: Maintaining all concerns. Endorse expert-continuous-delivery on merge-before-verify.

Reasoning: The merge-before-verify gap compounds my dependency check concern. If tasks can be dispatched out of order (no dependency check) AND merged before verification, the tiered execution model is fundamentally undermined. Both are addressable: add a `DependenciesSatisfied` guard to CreateWorktree/DispatchAgentPair, and strengthen `MergeAfterCompletion` to `MergeAfterVerification`.

I also note the `VerificationFail` race is more subtle than I initially described. The action checks `verifiedCriteria[task] /= VerificationCriteria` — this is true both when verification is in progress AND when it has failed. The action should additionally check that no more criteria can be added (i.e., all criteria have been attempted). In the current spec, there is no way to distinguish "verification in progress" from "verification failed."

Objections:
- [dependency check] taskDeps never consulted (maintained)
- [verification race] VerificationFail fires on in-progress verification (maintained)
- [merge-before-verify] Merge allowed before verification complete (new, endorsed)

Endorsements:
- expert-tla: All findings.
- expert-tdd: Task completion liveness.
- expert-continuous-delivery: Merge-before-verify gap.

---

**expert-bdd**

Position: Maintaining concerns. Endorse expert-edge-cases on verification race.

Reasoning: The verification race directly impacts observability. If VerificationFail fires while verification is still in progress, the developer sees a failure that may be premature. The error output would say "Inter-tier verification failed" when in fact the verification was incomplete. This violates design consensus recommendation #9 (developer-observable error states).

The fix is to add a state that tracks whether verification is complete (all criteria attempted) vs. in progress. Then VerificationFail should only fire when verification is complete AND not all criteria passed.

Objections:
- [no success liveness] No EventuallyComplete property (maintained)
- [verification race] VerificationFail fires prematurely (maintained, endorsed from expert-edge-cases)

Endorsements:
- expert-tla: Dead states and unused constants.
- expert-edge-cases: Verification race affects error observability.
- expert-tdd: Task completion liveness.

---

**expert-continuous-delivery**

Position: Maintaining concerns. Consensus forming on all major findings.

Reasoning: Round 2 shows convergence on all major findings. The merge-before-verify gap is now endorsed by all experts. The dependency check gap, unused constants, dead states, verification race, and missing liveness properties are all agreed-upon issues.

I maintain my original objections and endorse all others.

Objections:
- [merge-before-verify] No invariant preventing merge before verification (maintained)
- [MaxConcurrent unused] Parallel execution limit not enforced (maintained)

Endorsements:
- expert-tla: All findings.
- expert-tdd: Task completion liveness.
- expert-edge-cases: Dependency check and verification race.
- expert-bdd: Success scenario liveness.

---

### Round 3

**expert-tla**

Position: Consensus reached. All findings agreed.

Reasoning: All experts agree on the following issues:
1. MaxConcurrent constant unused — needs invariant enforcement
2. MergeStrategy constant unused — should model merge timing or be removed
3. Dead states (TIER_VERIFYING, MERGING, MERGE_ROLLBACK) — unreachable, inflate state space
4. taskDeps never checked — tasks can be dispatched out of dependency order
5. VerificationFail race — can fire before all criteria evaluated
6. Merge-before-verify gap — MergeAfterCompletion too weak
7. Missing task completion liveness — no property for task progress
8. Missing success scenario liveness — no EventuallyComplete property

These are all addressable in the spec. No fundamental redesign needed — the core state machine is correct.

Endorsements: All experts.

---

**expert-tdd**

Position: Consensus reached.

Endorsements: All findings agreed. Recommended additions to .cfg:
- `PROPERTY TaskEventuallyTerminal`
- `PROPERTY EventuallyComplete`
- `INVARIANT MaxConcurrentEnforced`
- `INVARIANT NoMergeBeforeVerification`

---

**expert-edge-cases**

Position: Consensus reached.

Endorsements: All findings agreed. Recommended spec additions:
- Guard CreateWorktree/DispatchAgentPair with dependency satisfaction check
- Fix VerificationFail to only fire when verification is complete but failed
- Remove or make reachable dead states

---

**expert-bdd**

Position: Consensus reached.

Endorsements: All findings agreed. The ErrorObservability invariant is a strong point of the spec. The missing EventuallyComplete property is the most impactful addition for developer observability.

---

**expert-continuous-delivery**

Position: Consensus reached.

Endorsements: All findings agreed. The merge-before-verify gap is the most critical safety issue. MaxConcurrent enforcement is the most critical concurrency issue.

---

## Recommended Spec Changes

### Critical (Safety)
1. Add `MaxConcurrentEnforced` invariant: `Cardinality({t \in TaskIds : sessionActive[t]}) <= MaxConcurrent`
2. Strengthen `MergeAfterCompletion` to `MergeAfterVerification`: require `verifiedCriteria[t] = VerificationCriteria` before merge
3. Add dependency satisfaction guard to `CreateWorktree`/`DispatchAgentPair`: `\A d \in taskDeps[task] : taskState[d] \in {"COMPLETED", "MERGED", "SKIPPED"}`
4. Fix `VerificationFail` to only fire when verification is complete: add guard that all criteria have been attempted

### Important (Correctness)
5. Add `TaskEventuallyTerminal` liveness property
6. Add `EventuallyComplete` liveness property
7. Remove or make reachable dead states (`TIER_VERIFYING`, `MERGING`, `MERGE_ROLLBACK`)
8. Remove or use `MergeStrategy` constant

### Minor (Quality)
9. Consider adding `DependenciesSatisfied` invariant
10. Consider adding `NoVerificationRace` safety property
