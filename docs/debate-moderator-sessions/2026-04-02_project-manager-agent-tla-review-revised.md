# Debate Moderator Session — Project Manager Agent TLA+ Review (REVISED)

**Date:** 2026-04-02
**Stage:** Stage 4 — TLA+ Review Debate (RE-REVIEW after tla-writer revision)
**Result:** CONSENSUS REACHED
**Rounds:** 2
**Experts:** expert-tla, expert-tdd, expert-edge-cases, expert-bdd, expert-continuous-delivery

---

## Synthesis

### Agreed Recommendation

The revised TLA+ specification **substantially addresses** the 8 prior objections, with the following residual findings:

**FULLY ADDRESSED (3 of 8):**

| # | Objection | Status | Evidence |
|---|-----------|--------|----------|
| 2 | Merge-before-verify gap | ADDRESSED | `MergeTask` line 462: `verifiedCriteria[task] = VerificationCriteria` guard; `VerificationBeforeAdvance` invariant |
| 3 | taskDeps never checked | ADDRESSED | `DispatchAgentPair` line 292: `\A dep \in taskDeps[task] : taskState[dep] \in {"COMPLETED", "MERGED", "SKIPPED"}` |
| 7 | Dead states unreachable | ADDRESSED | `BeginTierVerification` (TIER_EXECUTING -> TIER_VERIFYING), `BeginMerging` (TIER_VERIFIED -> MERGING), `BeginRollback` (MERGING -> MERGE_ROLLBACK) |

**PARTIALLY ADDRESSED (4 of 8):**

| # | Objection | Status | Residual Issue |
|---|-----------|--------|----------------|
| 1 | MaxConcurrent not enforced | PARTIALLY | `ConcurrentSessionsBounded` invariant defined (line 666) but NOT listed in .cfg INVARIANTS |
| 4 | VerificationFail race | PARTIALLY | Guards improved (no active sessions, all completed tasks failed), but `VerificationFail` fires from `TIER_EXECUTING` while `VerificationPass` fires from `TIER_VERIFYING` — state asymmetry |
| 5 | Missing task completion liveness | PARTIALLY | `TaskEventuallyTerminal` defined (line 676) but NOT listed in .cfg PROPERTIES |
| 6 | Missing success scenario liveness | PARTIALLY | `EventuallyComplete` defined (line 680) but NOT listed in .cfg PROPERTIES |

**NOT ADDRESSED (1 of 8):**

| # | Objection | Status | Residual Issue |
|---|-----------|--------|----------------|
| 8 | MergeStrategy unused | NOT ADDRESSED | Line 463 references `MergeStrategy` but only as a trivial type guard (`MergeStrategy \in {"PER_TASK", "PER_TIER", "DEFERRED"}`) that is always true. No behavioral branching based on strategy value. |

### Residual Findings Summary

1. **Config activation gap:** Three new invariants/properties (`ConcurrentSessionsBounded`, `TaskEventuallyTerminal`, `EventuallyComplete`) are defined in the .tla file but not activated in the .cfg file. The .cfg only lists the original 9 invariants and no PROPERTY entries. This means TLC will not check these during model checking.

2. **VerificationFail state asymmetry:** `VerificationFail` fires from `TIER_EXECUTING` (line 439) while `VerificationPass` fires from `TIER_VERIFYING` (line 426). The `BeginTierVerification` action correctly transitions to `TIER_VERIFYING`, but `VerificationFail` was not updated to fire from `TIER_VERIFYING`. This means verification failure can still occur before the pipeline enters the verifying state, which is a minor correctness concern.

3. **MergeStrategy trivial reference:** The `MergeStrategy` constant is referenced in `MergeTask` line 463 as `/\ MergeStrategy \in {"PER_TASK", "PER_TIER", "DEFERRED"}`. Since `MergeStrategy` is a CONSTANT, this is a type-level assertion that is always true if the constant is properly bound. It does not influence which merge behavior occurs. The spec does not model per-task vs. per-tier vs. deferred merge timing.

---

### Expert Final Positions

**expert-tla**

Position: The revision is a significant improvement. The core state machine now has correct reachability for all declared states, and the dependency check and merge-before-verify fixes are correct.

Reasoning: The three fully-addressed items (merge-before-verify, dependency check, dead states) are the most structurally significant. The `BeginTierVerification`, `BeginMerging`, `BeginRollback`, and `AfterMergeComplete` actions correctly wire up the previously dead states. The `MergeTask` guard on `verifiedCriteria[task] = VerificationCriteria` is the correct fix for merge-before-verify. The dependency guard in `DispatchAgentPair` is minimal and correct.

Residual concerns: (1) The .cfg file does not activate the new invariants/properties — this is a configuration oversight, not a spec error, but it means model checking will not verify them. (2) `VerificationFail` still fires from `TIER_EXECUTING` rather than `TIER_VERIFYING`. The guard `\A t \in TaskIds : (taskTier[t] = currentTier) => ~sessionActive[t]` ensures no sessions are active, which is good, but the state mismatch means the pipeline can halt from TIER_EXECUTING without ever entering TIER_VERIFYING. (3) `MergeStrategy` is trivially referenced.

Objections:
- [config gap] New invariants/properties not activated in .cfg
- [state asymmetry] VerificationFail fires from TIER_EXECUTING, not TIER_VERIFYING
- [trivial reference] MergeStrategy referenced but not behaviorally used

Endorsements:
- expert-tdd: Config activation gap for liveness properties
- expert-edge-cases: VerificationFail state asymmetry
- expert-continuous-delivery: MergeStrategy trivial reference

---

**expert-tdd**

Position: Supportive of the revision. The new invariants and properties are well-defined.

Reasoning: From a testability perspective, the addition of `ConcurrentSessionsBounded`, `TaskEventuallyTerminal`, and `EventuallyComplete` provides the missing test contracts. `ConcurrentSessionsBounded` directly tests the parallel execution bound. `TaskEventuallyTerminal` tests that every task makes progress. `EventuallyComplete` tests the happy path.

However, these are only useful if TLC actually checks them. The .cfg file (lines 13-22) lists 9 INVARIANT entries but does not include `ConcurrentSessionsBounded`, `TaskEventuallyTerminal`, or `EventuallyComplete`. Nor does it have any PROPERTY entries. This is a configuration oversight that renders the new definitions inert during model checking.

The fix is straightforward: add `INVARIANT ConcurrentSessionsBounded` and `PROPERTY TaskEventuallyTerminal`, `PROPERTY EventuallyComplete` to the .cfg file.

Objections:
- [config gap] ConcurrentSessionsBounded, TaskEventuallyTerminal, EventuallyComplete not in .cfg

Endorsements:
- expert-tla: All residual findings
- expert-bdd: EventuallyComplete is essential for developer observability

---

**expert-edge-cases**

Position: The revision addresses most edge cases correctly. One residual race remains.

Reasoning: The dependency check in `DispatchAgentPair` is correct — it guards dispatch on all dependencies being in a terminal state. The merge-before-verify guard is correct. The dead states are now reachable.

The `VerificationFail` race is improved but not fully resolved. The original race was: VerificationFail could fire while RunVerification was still adding criteria. The revised guard `\A t \in TaskIds : (taskTier[t] = currentTier) => ~sessionActive[t]` ensures no sessions are active, which means all tasks have completed or failed. But VerificationFail still fires from `TIER_EXECUTING`, not `TIER_VERIFYING`. The correct flow should be: TIER_EXECUTING -> BeginTierVerification -> TIER_VERIFYING -> VerificationPass or VerificationFail. Currently, VerificationFail can bypass TIER_VERIFYING entirely.

This is a minor issue because the guard on no active sessions ensures verification has had a chance to complete. But the state machine semantics are inconsistent: success goes through TIER_VERIFYING, failure does not.

Objections:
- [state asymmetry] VerificationFail bypasses TIER_VERIFYING state

Endorsements:
- expert-tla: State asymmetry and config gap
- expert-tdd: Config activation gap

---

**expert-bdd**

Position: The revision improves observability. The missing EventuallyComplete activation in .cfg is the most impactful residual issue.

Reasoning: The `EventuallyComplete` property (line 680) asserts that valid inputs eventually lead to ALL_TIERS_COMPLETE. This is the success scenario from design consensus recommendation #10. Without this property activated in the .cfg, the model checker cannot verify the happy path. A developer running TLC will not know whether the pipeline can actually succeed.

The `ErrorObservability` invariant (unchanged from the original) remains a strong point. The `VerificationBeforeAdvance` invariant is a good addition that ensures TIER_VERIFIED state implies all completed tasks have been fully verified.

Objections:
- [config gap] EventuallyComplete not in .cfg — model checker cannot verify success path

Endorsements:
- expert-tla: All residual findings
- expert-tdd: Config activation gap for all new properties

---

**expert-continuous-delivery**

Position: The revision is a solid improvement. The MergeStrategy trivial reference is a CD concern.

Reasoning: The merge-before-verify fix is the most critical safety improvement. The `MergeTask` action now requires `verifiedCriteria[task] = VerificationCriteria` before merging, which directly addresses the CD safety concern from the original review.

The `MergeStrategy` constant is referenced in `MergeTask` line 463 as `/\ MergeStrategy \in {"PER_TASK", "PER_TIER", "DEFERRED"}`. This is a type assertion that is always true — it does not influence behavior. From a CD perspective, the merge timing question (per-task vs. per-tier vs. deferred) remains unanswered in the spec. The `MergeTask` action merges one task at a time (per-task), but the spec does not model the alternative strategies or their failure modes.

The `ConcurrentSessionsBounded` invariant is important for CD safety — it ensures parallel execution does not exceed resource limits. But it is not activated in the .cfg.

Objections:
- [trivial reference] MergeStrategy referenced but not behaviorally used
- [config gap] ConcurrentSessionsBounded not in .cfg

Endorsements:
- expert-tla: All residual findings
- expert-tdd: Config activation gap

---

## Recommended Follow-up Actions

### Critical (Model Checking Correctness)
1. Add `INVARIANT ConcurrentSessionsBounded` to .cfg file
2. Add `PROPERTY TaskEventuallyTerminal` to .cfg file
3. Add `PROPERTY EventuallyComplete` to .cfg file

### Important (State Machine Consistency)
4. Move `VerificationFail` to fire from `TIER_VERIFYING` state instead of `TIER_EXECUTING`, or rename to `VerificationFailEarly` to distinguish from post-verification failure

### Minor (Spec Quality)
5. Either remove `MergeStrategy` constant or model strategy-dependent behavior (e.g., conditional merge timing based on strategy value)

---

## Mapping: Prior Objections to Revision Status

| # | Prior Objection | Status | Notes |
|---|----------------|--------|-------|
| 1 | MaxConcurrent not enforced | PARTIALLY ADDRESSED | Invariant defined but not in .cfg |
| 2 | Merge-before-verify gap | ADDRESSED | MergeTask gated on verifiedCriteria |
| 3 | taskDeps never checked | ADDRESSED | DispatchAgentPair guards on deps |
| 4 | VerificationFail race | PARTIALLY ADDRESSED | Guards improved, state asymmetry remains |
| 5 | Missing task completion liveness | PARTIALLY ADDRESSED | Property defined but not in .cfg |
| 6 | Missing success scenario liveness | PARTIALLY ADDRESSED | Property defined but not in .cfg |
| 7 | Dead states unreachable | ADDRESSED | BeginTierVerification, BeginMerging, BeginRollback added |
| 8 | MergeStrategy unused | NOT ADDRESSED | Trivial type guard, no behavioral impact |

---

## Metadata

- **Date:** 2026-04-02
- **Topic:** project-manager-agent-tla-review-revised
- **Experts selected:** expert-tla, expert-tdd, expert-edge-cases, expert-bdd, expert-continuous-delivery
- **Round count:** 2
- **Result status:** CONSENSUS REACHED
- **Prior review artifact:** docs/debate-moderator-sessions/2026-04-02_project-manager-agent-tla-review.md
- **Revised spec artifact:** docs/tla-specs/project-manager-agent/ProjectManagerAgent.tla
