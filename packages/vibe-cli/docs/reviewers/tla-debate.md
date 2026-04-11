# TLA+ Specification Review — Debate Session

**Date:** 2026-04-10
**Topic:** Review PipelineReviewers.tla against BDD scenarios for correctness
**Result:** CONSENSUS_REACHED
**Rounds:** 1
**Experts:** expert-tla, expert-bdd, expert-edge-cases

---

## Synthesis

### Agreed Recommendation

The TLA+ specification correctly models the **core state-machine skeleton** — lock lifecycle, review gate flow, counter interactions (reviewRound, keepGoingResets, tddKeepGoingCount), timeout hierarchy, absorbing terminal states, and liveness guarantees. The nondeterministic abstraction of reviewer agents into a single verdict (pass/fail/retry) is appropriate. However, the spec has **5 high/medium-priority behavioral gaps** that should be addressed before the spec can be considered a faithful formal model of the BDD scenarios:

1. **Add diff-base staleness modeling** — a transition from mergeQueue back to preMergeReview that counts against MaxReviewRounds (BDD lines 575-601)
2. **Add timeout guards to TddKeepGoingExhausted/TddKeepGoingExhaustedFinal** — add `~gateTimedOut /\ ~globalTimedOut` to prevent a race between TDD exhaustion and timeout handling
3. **Fix potential ReviewKeepGoing + gateTimedOut deadlock** — if ReviewKeepGoing fires while gateTimedOut=TRUE, the reset review can never get a verdict (ReviewVerdict requires `~gateTimedOut`). Either add `~gateTimedOut` as a guard on ReviewKeepGoing, or reset gateTimedOut in ReviewKeepGoing
4. **Clarify ReviewStop vs ReviewForcedStop redundancy** — ReviewStop has no keepGoingResets guard, making ReviewForcedStop dead code. Either remove ReviewForcedStop or add `keepGoingResets < MaxKeepGoingResets` as a guard on ReviewStop (to model user voluntary stop before exhaustion)
5. **Tighten invariant bounds** — KeepGoingResetsBounded and TddKeepGoingBounded use `+1` slack that weakens their ability to catch off-by-one errors

### Acceptable Abstractions (not requiring changes)

The following BDD areas are intentionally not modeled and all experts agree the omissions are appropriate:

- Reviewer JSON schema/parse/schema-violation details (abstracted to nondeterministic verdict)
- Review-moderator pre-filter/consolidation internals (abstracted to verdict output)
- ReviewModeratorTimeout vs ReviewerTimeout distinction (collapsed into ReviewGateTimeout)
- user_notes.md accumulation (implementation concern)
- Pipeline log phase markers (implementation concern)
- CLI refactor and --resume logic (implementation concern)
- Config load-time validation (CONSTANTS assumed valid)
- review-loop.ps1 orchestration (implementation concern)

### Lower-Priority Gaps (acknowledged but not blocking)

- Concurrent pre-merge reviews for parallel tasks within a tier (spec processes sequentially)
- Feature branch HEAD verification before final review fix cycle
- Merge queue interaction (MaxMergeRetries, merge conflicts, post-merge verify failures)
- Agent-writer tasks skipping review gate
- Stale lock detection from crashed processes
- Resume state reconstruction correctness as a refinement property
- GateTimeoutKeepGoing resets reviewRound to 0 (BDD only specifies timer reset — ambiguous whether round reset is intended)
- Gate timeout and review-round Keep Going sharing the keepGoingResets counter (BDD does not clarify if separate budgets are needed)

---

## Round 1 Transcripts

### expert-tla

**Position:** The specification correctly models the core state machine skeleton — lock lifecycle, review gate flow, timeout hierarchy, and bounded counters — but it omits several behavioral domains from the BDD scenarios and contains a handful of formal issues that weaken its safety and liveness guarantees.

**Reasoning:** The spec captures the high-level pipeline flow well: idle → locked → running → preMergeReview → mergeQueue → running (loop over tasks) → finalReview → COMPLETE, with HALTED as an absorbing failure state. The timeout hierarchy (gate vs. global), the Keep Going mechanism, and TDD keep-going counters are all represented. The fairness condition WF_vars(Next) over the entire Next relation is reasonable for ensuring liveness. However, the BDD scenarios describe a significantly richer behavioral surface than what the TLA+ spec models.

**Objections:**

1. **ReviewStop undermines Keep Going logic.** ReviewStop has the same precondition as ReviewKeepGoing and ReviewForcedStop but has NO guard on keepGoingResets. This makes ReviewForcedStop entirely redundant — the system can always choose to halt even when keep-going resets remain.
2. **GateTimeoutStop lacks keepGoingResets exhaustion guard.** Same issue as ReviewStop — allows halting on timeout even when keep-going resets remain, losing the forced-vs-voluntary distinction.
3. **Reviewer agent output, parse failures, schema violations, and moderator logic are entirely absent.** The spec collapses all reviewer/moderator behavior into a single nondeterministic ReviewVerdict. While abstracting the JSON details is fine, the spec cannot distinguish moderator parse failure (retry) from legitimate "fail" verdict (fix cycle) at the action level.
4. **Diff-base staleness detection is missing.** No model of diff-base state or staleness detection. Once HandlePassPreMerge fires, no path back to preMergeReview.
5. **ReviewerTimeout vs. ReviewModeratorTimeout vs. ReviewGateTimeout hierarchy collapsed.** Only gate-level and global timeouts modeled.
6. **user_notes.md accumulation unmodeled.**
7. **Pipeline log / resume support unmodeled.**
8. **Config validation unmodeled.**
9. **Agent-writer tasks skipping review gate unmodeled.** Spec forces every task through EnterPreMergeReview.
10. **Review-fix commits accumulate without rollback is implicit but not verifiable.** Spec has no notion of commits.
11. **TddKeepGoingExhausted verdict="fail" can trigger HandleFailPreMerge.** When TDD exhaustion fires, it returns to preMergeReview with verdict="fail" and incremented round. If round is still < MaxReviewRounds, HandleFailPreMerge fires and enters another fix cycle — potentially ignoring the TDD exhaustion escalation signal.
12. **KeepGoingResetsBounded and TddKeepGoingBounded use +1 slack.** The +1 weakens these invariants — they will never catch an off-by-one error in transition guards.
13. **ReviewVerdict uses UNCHANGED <<>> (empty tuple).** Technically valid but misleading.
14. **Mutual exclusion missing stale lock detection and concurrent write serialization.**
15. **GlobalTimeoutHalts is trivially satisfied by construction.**

**Endorsements:**
- Absorbing terminal states correctly modeled (Done action)
- Lock lifecycle invariants clean and correct
- FinalReviewRequiresAllMerged correctly ensures final review only after all tasks merged
- Task counting with mergeQueue → running loop correct
- Pre-merge vs. final review gate distinction well-modeled with reviewGateType
- Keep Going mechanism correctly resets reviewRound and tddKeepGoingCount
- Liveness properties well-chosen
- State space appropriately bounded for TLC feasibility

---

### expert-bdd

**Position:** The TLA+ spec faithfully captures the control-flow skeleton and counter-interaction invariants of the review gate system, but it intentionally abstracts away approximately 40% of the BDD scenario surface — most of which is implementation-level detail appropriate to omit from a formal model. However, there are several behavioral gaps where the spec's abstractions lose testable state-machine behaviors.

**Reasoning:** Detailed traceability analysis of all 27 BDD feature areas against the spec's actions, finding most counter-interaction scenarios well-covered, with key gaps in diff-staleness, concurrency, and merge queue modeling.

**Objections:**

1. **Diff-base staleness (BDD lines 575-601) entirely absent.** Once HandlePassPreMerge fires, no path back to preMergeReview. The spec should add a DiffBaseStale action with re-review semantics.
2. **Merge queue interaction (BDD lines 607-645) overly simplified.** MaxMergeRetries counter and escalation path for merge exhaustion not captured.
3. **Concurrent pre-merge reviews for parallel tasks not modeled.** BDD describes concurrent reviews for T1 and T2 in same tier. Spec processes tasks sequentially (EnterPreMergeReview blocks on pipelineState = "running").
4. **Final review fix verifies feature branch HEAD (BDD lines 678-682, 1571-1576) not modeled.** HandleFailFinal unconditionally transitions to finalReviewFix with no branch-state verification.
5. **TddKeepGoingExhausted sets verdict="fail" which may start another fix cycle instead of escalating.** When round + 1 is still < MaxReviewRounds, HandleFailPreMerge fires, which may not match the BDD's intent of "review-level escalation."
6. **--resume state reconstruction (BDD lines 1205-1323) has no TLA+ representation.** Could be expressed as a refinement property.

**Endorsements:**
- Counter interaction correctness is the spec's strongest contribution
- Termination guarantees formally verified via liveness properties
- Nondeterministic timeout model is elegant
- FinalReviewRequiresAllMerged invariant directly encodes BDD requirement
- Symmetric modeling of pre-merge and final review gates
- NoReviewFixWithoutFail is a good defensive property

---

### expert-edge-cases

**Position:** The TLA+ spec is a strong model of the BDD scenarios' counter-interaction logic and termination guarantees, but it contains several fencepost and behavioral gaps that could permit behaviors the BDD scenarios explicitly prohibit or fail to model failure paths.

**Reasoning:** Traced each of 12 key edge cases through the spec's action guards. Confirmed several fencepost scenarios are correct (MaxReviewRounds=3, MaxKeepGoingResets=0, MaxReviewRounds=1, mixed retry/fix rounds, TDD accumulation). Found issues in timeout guard interactions and counter reset semantics.

**Objections:**

1. **TddKeepGoingExhausted/TddKeepGoingExhaustedFinal lack ~gateTimedOut /\ ~globalTimedOut guards.** Creates a race between TDD exhaustion and timeout handling when both are enabled simultaneously.
2. **GateTimeoutKeepGoing shares keepGoingResets counter with ReviewKeepGoing.** BDD does not explicitly address whether these should share a budget. A user exhausting gate timeout Keep Going budget gets forced stop on review-round exhaustion without being offered Keep Going.
3. **GateTimeoutKeepGoing resets reviewRound to 0.** BDD only says "the review gate wall-clock timer resets" and "the review resumes from a fresh review." Resetting reviewRound may be more generous than the BDD intends.
4. **ReviewKeepGoing does not reset gateTimedOut.** If ReviewKeepGoing fires while gateTimedOut=TRUE, the reset review can never get a verdict (ReviewVerdict requires ~gateTimedOut). Potential deadlock path.
5. **Diff-base staleness re-review resets reviewRound via EnterPreMergeReview instead of counting against MaxReviewRounds.** EnterPreMergeReview always resets reviewRound to 0, but BDD says re-review should count against MaxReviewRounds.
6. **ReviewGateResolves liveness includes "running" as target state.** Not wrong (reachable through mergeQueue) but weaker than necessary.

**Endorsements:**
- Absorbing terminal states verified correct — no action in Next escapes COMPLETE/HALTED
- MaxKeepGoingResets=0 structurally disables Keep Going (confirmed correct)
- Mixed retry/fix rounds sharing counter (confirmed correct)
- TDD Keep Going accumulates across fix cycles (confirmed correct)
- TDD cap exhaustion escalates to review level (confirmed correct)
- Global timeout not reset by Keep Going (confirmed correct)
- Global timeout overrides active gate timeout (confirmed correct)
- MaxReviewRounds=1 immediate escalation (confirmed correct)

---

## Endorsement Map

| Expert | Endorses |
|--------|----------|
| expert-tla | Absorbing states, lock lifecycle, FinalReviewRequiresAllMerged, liveness properties |
| expert-bdd | Counter interactions, termination guarantees, timeout model, symmetric gate modeling |
| expert-edge-cases | Absorbing states, MaxKeepGoingResets=0, mixed rounds, TDD accumulation, global timeout |

All three experts endorse:
- Absorbing terminal states
- Counter interaction correctness (reviewRound, keepGoingResets, tddKeepGoingCount)
- Global timeout modeling
- Liveness/termination guarantees
- FinalReviewRequiresAllMerged safety property

---

## Priority Action Items

| # | Priority | Issue | Raised By | BDD Lines |
|---|----------|-------|-----------|-----------|
| 1 | **High** | Diff-base staleness missing (mergeQueue → preMergeReview path) | All 3 | 575-601 |
| 2 | **High** | TddKeepGoingExhausted lacks timeout guards (~gateTimedOut /\ ~globalTimedOut) | edge-cases, tla | 942-949 |
| 3 | **High** | ReviewKeepGoing + gateTimedOut=TRUE creates deadlock (verdict blocked) | edge-cases | 848-852 |
| 4 | **Medium** | ReviewStop makes ReviewForcedStop redundant (no keepGoingResets guard) | tla | 903-911 |
| 5 | **Medium** | Invariant bounds use +1 slack, weakening off-by-one detection | tla | — |
| 6 | **Medium** | Concurrent pre-merge reviews not modeled (sequential task processing) | bdd | 96-100, 1126-1132 |
| 7 | **Medium** | Feature branch HEAD verification before final fix cycle missing | bdd | 678-682, 1571-1576 |
| 8 | **Low** | Merge queue MaxMergeRetries counter and escalation path missing | bdd | 607-645 |
| 9 | **Low** | GateTimeoutKeepGoing resets reviewRound (ambiguous in BDD) | edge-cases | 435-441 |
| 10 | **Low** | Gate/review Keep Going sharing keepGoingResets counter (ambiguous in BDD) | edge-cases | 435-441, 882-886 |

---

## Metadata

- **Moderator:** Debate Moderator (neutral)
- **Date:** 2026-04-10
- **Artifact:** docs/reviewers/tla/PipelineReviewers.tla
- **Reference:** docs/reviewers/bdd.feature
- **Elicitor:** docs/reviewers/elicitor.md
- **Round count:** 1
- **Consensus:** Reached (no new objections after round 1 — all experts converge on the same core findings with complementary supplementary observations)
