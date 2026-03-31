# Debate Session — Pair Programming Stage TLA+ Review

**Date:** 2026-03-30
**Result:** CONSENSUS REACHED (with objections — spec revision needed)
**Rounds:** 1
**Experts:** expert-tdd, expert-continuous-delivery, expert-edge-cases

---

## Agreed Recommendation

The TLA+ specification is structurally sound and TLC-verified (334,248 states, 10 safety invariants + 3 liveness properties pass). However, 15 objections were raised where the spec either omits design consensus items or models behavior contradicting the agreed design. The spec should be revised to address the high and medium severity items before proceeding to implementation planning.

### High Severity (contradicts design consensus)

1. **ReDispatchSession full reset contradicts design (consensus items 19-20).** The spec resets `tddCycle`, `hasFailingTest`, and all counters to zero on re-dispatch. The design explicitly requires inheriting passing commits and the failing test, with full reset only on filesystem corruption. Fix: add a corruption flag; on non-corruption re-dispatch, preserve `tddCycle` and `hasFailingTest`.

2. **TDDCyclesExhausted at RED proceeds to LOCAL_REVIEW (no implementations).** A task that exhausts TDD cycles while still in RED has zero completed GREEN phases — no implementation exists to review or merge. Fix: guard with `tddCycle[task] > 0` to enter LOCAL_REVIEW; otherwise route to SESSION_FAILED.

3. **MergeConflictEscalates unguarded (consensus item 12).** The action can fire for any task in MERGE_CONFLICT regardless of retry count. The design says "try to resolve first, escalate only when unresolvable." Fix: guard on `mergeConflictRetries[task] >= MaxReDispatches`.

### Medium Severity (missing design consensus items)

4. **No commit-per-cycle modeling (consensus item 7).** The spec has no variable tracking commits. Each TDD cycle should produce exactly one commit. Fix: add `commitCount` per task, invariant `commitCount[task] = tddCycle[task]` at cycle boundaries.

5. **SessionFails missing TEST_VALIDATION and LOCAL_REVIEW states.** Agent crashes can happen in any state. `SessionFails` only covers `{HANDSHAKE, RED, GREEN, REFACTOR_REVIEW}`. Fix: extend to include TEST_VALIDATION and LOCAL_REVIEW.

6. **No merge queue liveness property.** No property guarantees that a QUEUED task eventually reaches MERGE_COMPLETE or MERGE_CONFLICT. A stuck merge queue would not be detected. Fix: add `MergeQueueProgress == \A task \in Tasks : mergeState[task] = "QUEUED" ~> mergeState[task] \in {"MERGE_COMPLETE", "MERGE_CONFLICT"}`.

7. **No durable terminal artifact modeled (consensus item 27).** The pipeline can reach COMPLETE without any modeled artifact persistence. Fix: add a `terminalArtifact` variable set TRUE at COMPLETE, with a safety invariant.

8. **No unit vs integration test distinction (consensus item 5).** All TDD cycles are homogeneous. The consensus explicitly calls for separating unit and integration test phases.

9. **No rollback path for completed tiers (consensus item 16).** A Tier N+1 session discovering Tier N is wrong can only SESSION_FAIL, not trigger tier-level rollback. VerificationFails only fires during INTER_TIER_VERIFICATION, not during execution.

10. **No haltReason discrimination.** HALTED conflates all escalation paths (all sessions failed, global fix exhausted, verification failed, merge conflict unresolvable). Fix: add `haltReason` variable.

### Low Severity (modeling improvements)

11. **LocalReviewNeedsFix returns to HANDSHAKE — semantic overload.** Review fixes re-enter full TDD negotiation. May want a separate FIX state distinct from new-feature HANDSHAKE.

12. **ContinueTDD routes through HANDSHAKE every cycle.** The design requires handshake per cycle (consensus item 2), so this is actually correct. Flagged for clarification but not a defect.

13. **mergeConflictRetries uses MaxReDispatches constant.** Couples two semantically distinct bounds. Fix: add dedicated MaxMergeConflictRetries constant.

14. **Missing ASSUME for TierOf validity / cycle detection (consensus item 17).** Add: `ASSUME \A t \in Tasks : TierOf[t] \in 1..NumTiers`.

15. **No context budget modeling (consensus item 26).** Acknowledged as intentional abstraction. Document in README as out-of-scope for this spec level.

---

## Expert Final Positions

### expert-tdd
**Position:** Approve with concerns
**Key concerns:** Missing commit-per-cycle, re-dispatch loses work, SessionFails incomplete, TDDCyclesExhausted at RED, no unit/integration distinction
**Endorsed (Round 1):** N/A — single round

### expert-continuous-delivery
**Position:** Approve with concerns
**Key concerns:** Missing commit-per-cycle, re-dispatch loses work, MergeConflictEscalates unguarded, no rollback path, no durable artifact
**Endorsed (Round 1):** N/A — single round

### expert-edge-cases
**Position:** Approve with concerns
**Key concerns:** Re-dispatch full reset, TDDCyclesExhausted at RED, no merge queue liveness, missing cycle detection/context budget/worktree cleanup, mergeConflictRetries constant coupling
**Endorsed (Round 1):** N/A — single round

---

## Consensus Rationale

All three experts independently converged on the same top concerns (re-dispatch semantics, TDDCyclesExhausted, missing commit modeling). The 15 objections span the full surface area of the spec (states, transitions, properties, constants). No new objections would emerge in Round 2 — the three complementary perspectives (TDD methodology, CD pipeline semantics, edge case analysis) collectively cover the specification's domain.

**Recommendation:** Revise the spec to address items 1-7 (high + medium severity), re-run TLC, then proceed to Stage 5 (implementation planning). Items 8-15 can be addressed as part of the implementation plan or deferred to a v2 spec.
