# TLA+ Specification Review — Code Simplify (Stage 8)

**Date:** 2026-04-11
**Result:** CONSENSUS_REACHED
**Rounds:** 1
**Experts:** expert-tla, expert-bdd, expert-edge-cases

---

## Synthesis

### Agreed Recommendation

The TLA+ specification is a solid structural model of the Stage 8 pipeline's control flow, with well-chosen safety and liveness properties. However, it contains **one critical spec bug** and **several significant gaps** that should be addressed before the spec is considered a trustworthy formal model of the BDD scenarios.

**Critical fix required:**
- The no-worktree path (`ClaudeDispatchNoWorktrees`) jumps directly to `GlobalDoublePass`, bypassing `WorktreeCleanup` — the only transition that advances tiers. For multi-tier plans where any tier has exactly 1 task, remaining tiers are silently skipped.

**Significant gaps to address:**
- No crash/finally-block transition (crash can happen in any active phase; `Halt` is only reachable via escalation-Stop paths)
- No timeout modeling (reviewer 600s, moderator 300s, all-timeout-pass-with-warning path)
- No resume/crash recovery modeling (--resume enters mid-pipeline, could violate safety invariants)
- Dead `"PreCodingGate"` value in `Phases` set (defined but never assigned)
- No safety property asserting "no re-review after conflict resolution"

**Acceptable abstractions (documented, not blocking):**
- Logging/markers, user_notes.md, file operations, and malformed reviewer responses are data-plane concerns reasonably excluded from the control-flow model
- Stale lock abstraction (lockPID ∈ 0..1) loses dead-PID distinction but is acceptable
- Fairness asymmetry (WF on KeepGoing but not Stop) is a valid modeling choice

### Unresolved Dissents

None. All experts reached consensus.

---

## Expert Final Positions

### expert-tla

**Position:** The spec is solid and largely faithful, but has several gaps — most notably missing the PreCodingGate phase label, lacking a crash/finally-block transition, and omitting resume/logging entirely.

**Key findings:**
1. `"PreCodingGate"` is defined in `Phases` set but no action ever assigns it — dead unreachable value
2. No crash recovery / finally-block transition; `Halt` only reachable via specific escalation-Stop paths
3. No --resume / logging model (8 BDD scenarios unrepresented)
4. No reviewer timeout modeling (600s/300s/all-timeout paths)
5. No user_notes.md accumulation tracking
6. No file deletion/creation modeling
7. `ClaudeDispatchNoWorktrees` with multi-tier plans skips remaining tiers
8. `PerWT_ReviewFail` guard logic is correct (verified: escalation at round=MaxReviewRounds is right)
9. No malformed reviewer JSON response modeling
10. Fairness on both `ClaudeDispatchWithWorktrees` and `ClaudeDispatchNoWorktrees` is technically fine (WF "continuously enabled" semantics handle it)

**Endorsements:** Uniform escalation pattern, multi-tier loop, S2 lock discipline, consecutive pass counter logic, MergeConflictDP no-re-review, Done stuttering step, comprehensive TypeOK.

### expert-bdd

**Position:** The spec captures core control flow and safety/liveness well, but omits several BDD-described behaviors that are data-plane concerns or involve crash recovery semantics.

**Key findings:**
1. PreCodingGate before LockAcquire ordering — questioned but ultimately acknowledged as reasonable (halting for dirty tree before acquiring lock avoids unnecessary lock acquisition)
2. Crash recovery (--resume) entirely unmodeled — second entry path into state machine
3. Stale lock reclamation abstracted away — lockPID ∈ 0..1 loses dead-PID distinction
4. Reviewer timeouts not modeled (600s/300s/all-timeout)
5. Malformed reviewer response unmodeled
6. user_notes.md write semantics unmodeled
7. File deletion/creation outside spec scope
8. "No re-review after conflict" is implicitly correct but not a named safety property
9. Empty fixture file behavior collapsed into single always-proceed transition
10. Fairness only includes KeepGoing (not Stop) — reasonable but should be documented

**Endorsements:** Uniform escalation pattern, multi-tier loop, no-worktree path, S2 lock discipline, MergeConflictDP no-re-review, Done stuttering step, consecutive pass counter.

### expert-edge-cases

**Position:** The spec is a solid skeleton but has at least 10 concrete gaps, most critically around timeouts, resume/crash recovery, and the no-worktrees multi-tier bug.

**Key findings:**
1. No timeout modeling at all (NumReviewers constant declared but unused)
2. No resume/crash recovery modeling (cannot verify resumed states satisfy safety invariants)
3. **CRITICAL: ClaudeDispatchNoWorktrees skips ALL remaining tiers** — tier advancement only in WorktreeCleanup, which is bypassed
4. Same as #3 — reinforced: "For a plan with MaxTiers > 1, if any tier has exactly 1 task, remaining tiers are silently skipped"
5. PreCodingGate collapses 3-step user interaction into single nondeterministic step
6. No crash-from-any-state transition (finally-block lock release unverifiable)
7. Malformed reviewer response unmodeled
8. File operation invariants entirely absent
9. Logging markers unmodeled (foundation of resume mechanism)
10. Fairness may allow infinite stuttering before escalation fires (no WF on fail/escalate actions)
11. Pre-filter-excludes-all-reviewers indistinguishable from all-empty-findings in spec

**Endorsements:** S1-S6 safety properties, escalation pattern with ~escalationActive guards, MergeConflictDP separate retry counter, MergeConflictUnresolvable transition, Done stuttering step, L3 + WF(KeepGoing) for escalation resolution.

---

## Endorsement Map

| Point | Endorsed by |
|---|---|
| Uniform escalation pattern (6 escalation points) | expert-tla, expert-bdd, expert-edge-cases |
| Multi-tier loop (WorktreeCleanup → ClaudeDispatch) | expert-tla, expert-bdd |
| S2 LockHeldDuringExecution correctness | expert-tla, expert-bdd |
| Consecutive pass counter (count to 2, reset on fail) | expert-tla, expert-bdd |
| MergeConflictDP no-re-review modeling | expert-tla, expert-bdd, expert-edge-cases |
| Done stuttering step | expert-tla, expert-bdd, expert-edge-cases |
| TypeOK comprehensiveness | expert-tla |
| MergeConflictUnresolvable distinct transition | expert-edge-cases |
| S1-S6 safety properties well-formulated | expert-edge-cases |

---

## Deduplicated Objections (by severity)

### Critical (spec bug)

| # | Objection | Raised by |
|---|---|---|
| C1 | `ClaudeDispatchNoWorktrees` bypasses `WorktreeCleanup`, the only tier-advancement transition. Multi-tier plans with any single-task tier silently skip remaining tiers. | expert-tla, expert-edge-cases |

### Significant (missing behavioral paths)

| # | Objection | Raised by |
|---|---|---|
| S1 | No crash/finally-block transition. `Halt` is only reachable via escalation-Stop. Crashes from arbitrary phases cannot release the lock. | expert-tla, expert-edge-cases |
| S2 | No timeout modeling (ReviewerTimeout 600s, ModeratorTimeout 300s, all-timeout-pass path). | expert-tla, expert-bdd, expert-edge-cases |
| S3 | No --resume/crash recovery modeling. Resume enters mid-pipeline and could violate safety invariants (e.g., S2 lock held). | expert-tla, expert-bdd, expert-edge-cases |
| S4 | `"PreCodingGate"` in `Phases` set is dead — no action assigns it. | expert-tla |
| S5 | No named safety property for "no re-review after conflict resolution" — correct by construction but fragile. | expert-bdd |

### Moderate (data-plane / acceptable abstraction)

| # | Objection | Raised by |
|---|---|---|
| M1 | No logging/markers modeling (foundation of resume mechanism). | expert-tla, expert-bdd, expert-edge-cases |
| M2 | No user_notes.md state tracking (KeepGoing → write coupling unverified). | expert-tla, expert-bdd |
| M3 | No file operation modeling (4 deletions, 2 preservations, 2 creations). | expert-tla, expert-bdd, expert-edge-cases |
| M4 | No malformed reviewer response modeling. | expert-tla, expert-bdd, expert-edge-cases |
| M5 | Stale lock abstraction (lockPID ∈ 0..1) loses dead-PID distinction. | expert-bdd |
| M6 | Fairness asymmetry (WF on KeepGoing, not Stop) — valid but should be documented. | expert-bdd, expert-edge-cases |
| M7 | PreCodingGate collapses 3-step user interaction; cannot verify no pipeline action during user prompt. | expert-edge-cases |
| M8 | Pre-filter-excludes-all-reviewers indistinguishable from all-empty-findings. | expert-edge-cases |

---

## Suggested Fixes (prioritized)

### 1. Fix the multi-tier no-worktree bug (C1)

Add a tier-advancement transition after `GlobalDoublePass`/`GlobalReview` for the no-worktree path, or route the no-worktree path through `WorktreeCleanup` even when no cleanup is needed. Example:

```tla
ClaudeDispatchNoWorktrees ==
    /\ phase = "ClaudeDispatch"
    /\ currentTier <= MaxTiers
    /\ totalTasks = 1
    /\ phase' = "WorktreeCleanup"  \* Route through cleanup for tier advancement
    /\ hasWorktrees' = FALSE
    /\ UNCHANGED <<...>>
```

Or add a separate `NoWT_GlobalGate` phase that advances tiers before entering GlobalDoublePass.

### 2. Add a crash transition (S1)

```tla
CrashFromAnyActivePhase ==
    /\ phase \notin {"Init", "Complete", "Halted"}
    /\ lockHeld
    /\ Halt
    /\ UNCHANGED <<escalationActive, userChoice>>
```

This models the BDD's "finally block releases lock on crash" and allows TLC to verify S1 under crashes.

### 3. Remove dead `"PreCodingGate"` from Phases set (S4)

Simply remove the string from the `Phases` set definition since no action uses it.

### 4. Add a safety property for no-re-review-after-conflict (S5)

```tla
NoReReviewAfterConflict ==
    (phase = "MergeConflictDP") => (phase' # "PerWT_Review")
```

### 5. Document fairness assumptions (M6)

Add a comment block explaining that WF on KeepGoing (not Stop) means liveness is proven under the assumption the user eventually cooperates. Termination via Stop is still possible but not guaranteed by fairness.

---

## Round 1 Transcript

### expert-tla — Round 1

**Position:** The spec is solid and largely faithful but has several gaps — missing PreCodingGate phase label, lacking crash/finally-block transition, and omitting resume/logging.

**Objections:** 11 raised (see expert final position above)

**Endorsements:** Uniform escalation, multi-tier loop, S2 lock discipline, consec pass counter, MergeConflictDP, Done step, TypeOK.

### expert-bdd — Round 1

**Position:** The spec captures core control flow and safety/liveness well, but omits data-plane and crash recovery behaviors.

**Objections:** 10 raised (see expert final position above)

**Endorsements:** Uniform escalation, multi-tier loop, no-worktree path, S2 lock discipline, MergeConflictDP, Done step, consec pass counter.

### expert-edge-cases — Round 1

**Position:** Solid skeleton with at least 10 concrete gaps, most critically the no-worktrees multi-tier bug.

**Objections:** 11 raised (see expert final position above)

**Endorsements:** S1-S6, escalation pattern, MergeConflictDP, MergeConflictUnresolvable, Done step, L3 + WF(KeepGoing).

---

## Metadata

- **Date:** 2026-04-11
- **Topic:** TLA+ spec review against BDD scenarios for vibe-cli Stage 8 Code Simplify
- **Experts selected:** expert-tla, expert-bdd, expert-edge-cases
- **Round count:** 1
- **Result:** CONSENSUS_REACHED
- **Consensus trigger:** No new objections between experts; all findings complementary
