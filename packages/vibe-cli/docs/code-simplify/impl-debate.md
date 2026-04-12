# Implementation Plan Debate — Code Simplify (Stage 8)

**Date:** 2026-04-11
**Result:** CONSENSUS_REACHED
**Rounds:** 2
**Experts:** expert-tla, expert-tdd, expert-edge-cases, expert-continuous-delivery

---

## Synthesis

### Agreed Recommendation

The implementation plan is **approved with 8 required amendments** before execution. The plan's coverage of all 14 TLA+ states, 44 transitions, 7 safety invariants, and 4 liveness properties is comprehensive and accurate. The 5-tier execution structure is correctly parallelized. The 9 prior debate objections are well-integrated. The following gaps must be closed:

#### Required Amendments (High Consensus — 3+ experts agree)

| # | Amendment | Steps Affected | Endorsed By |
|---|-----------|---------------|-------------|
| 1 | **Add counter-reset assertions to Steps 7 and 9.** After `PerWT_ReviewFail`, explicitly test that `wtDoublePassRetries = 0` and `wtConsecPasses = 0` before re-entering double-pass. After `GlobalReviewFail`, test `glDoublePassRetries = 0` and `glConsecPasses = 0`. | 7, 9 | TLA+, TDD, Edge, CD |
| 2 | **Split KeepGoing advancement tests in Step 7.** Add two distinct tests: (a) `PerWT_ReviewKeepGoing` on a mid-tier task advances to next task's `PerWT_DoublePass` with `wtDoublePassRetries`, `wtConsecPasses`, `wtReviewRounds` all reset to 0; (b) `PerWT_ReviewKeepGoing` on the final task advances to `SequentialMerge`. Current test only covers path (b). | 7 | TLA+, TDD, Edge, CD |
| 3 | **Add zero-checkpoint crash test to Step 10.** Test that crash before any tier completes (`lastCompletedTier = 0`), followed by `--resume`, starts fresh with warning "no checkpoint found." The TLA+ `Resume` action requires `lastCompletedTier > 0`. | 10 | TLA+, TDD, Edge, CD |
| 4 | **Add dedicated ResumeToGlobal test to Step 10.** Test `--resume` when all tiers are complete (`lastCompletedTier = MaxTiers`) jumps directly to `GlobalDoublePass`, not `ClaudeDispatch`. Make this distinct from the existing `TIER_2_COMPLETE` test. | 10 | TLA+, TDD, Edge, CD |
| 5 | **Add S2 (LockHeldDuringExecution) assertions to Steps 6-9.** Currently S2 is only tested in Step 5. Add at least one `lockHeld == TRUE` assertion per step for each new active phase introduced: FixtureCoverage/ClaudeDispatch (Step 6), PerWT_DoublePass/PerWT_Review (Step 7), SequentialMerge/MergeConflictDP (Step 8), GlobalDoublePass/GlobalReview (Step 9). | 6, 7, 8, 9 | TLA+, TDD, Edge |
| 6 | **Add input re-validation on resume path.** On `--resume`, re-validate that `implementation-plan.json` and fixture files still exist before resuming. Resume may skip full `FixtureCoverage` but must not proceed with missing files. Add test to Step 10: corrupt/delete `implementation-plan.json` between crash and resume, verify graceful failure. | 10 | Edge, CD |
| 7 | **Document sub-tier resume granularity gap.** The TLA+ spec models resume at tier granularity (`lastCompletedTier`), but the implementation plan (Step 10) describes detecting already-merged branches within a tier. Add a note in the plan clarifying: (a) how merged-branch detection works (e.g., `git branch --merged`); (b) that this is an implementation enhancement beyond the spec; (c) test explicitly that re-running a partially merged tier skips already-merged branches. | 10 | TLA+, Edge, CD |
| 8 | **Specify WorktreeCleanup ordering (checkpoint vs cleanup).** Clarify whether the tier checkpoint marker is written before or after worktree removal. If checkpoint-first: orphan worktrees possible on crash (resume handles via detection). If cleanup-first: crash loses checkpoint (re-runs entire tier). Either is acceptable but must be documented and tested. | 6, 10 | Edge, CD |

#### Advisory Items (Lower consensus or informational)

| # | Item | Severity | Raised By | Notes |
|---|------|----------|-----------|-------|
| A | Crash budget (MaxCrashes) not addressed in plan | Low | CD, TLA+ | Existing `pipeline-lock.ps1` has `MaxCrashes=3`. TLA+ spec has no crash budget. TDD disagrees this belongs in plan. Consider adding repeated-crash warning. |
| B | Tier 1 parallel tasks could produce semantically broken code after clean merge | Low | Edge | T5 references agents created by T2/T3 in parallel worktrees. Mitigated by global double-pass after Tier 1 merge. TDD, CD disagree this is a plan concern. |
| C | Compound retry budget (5 DP retries x 3 review rounds = 15 per task) | Informational | Edge | By design per TLA+ spec (S3, S4 bound each independently). Finite and always terminates in escalation. |

---

## Per-Expert Final Positions

### expert-tla (Round 2)
**Position:** Conditionally Approve (3 maintained objections, all addressed by amendments 1-4)

**Maintained:** Counter reset tests (A), KeepGoing branching (B), zero-checkpoint resume (C)
**Endorsed from others:** TDD #1 (S2 across steps), TDD #2 (ResumeToGlobal), TDD #6 (Step 8 redundant test), Edge O3 (per-task checkpoint), Edge O5 (no-worktree counter reset), CD #1 (crash budget), CD #2 (resume marker gap)
**Disagreed:** Edge O2 (resume skips validation — by design per spec), Edge O6 (cleanup atomicity — operational not correctness)

### expert-tdd (Round 2)
**Position:** Conditionally Approve (4 required changes)

**Maintained:** S2 across steps (#1), ResumeToGlobal test (#2)
**Withdrew:** Steps 2-3 test content (#4 — correct for declarative files), Step 8 redundant test (#6 — different entry contexts)
**Endorsed from others:** TLA+ A (counter reset), TLA+ B (KeepGoing), TLA+ C (zero-checkpoint), CD #2 (resume marker gap)
**Disagreed:** Edge O1 (prompt engineering not TDD), Edge O4 (by design), CD #1 (not in spec/BDD)

### expert-edge-cases (Round 2)
**Position:** Conditional Approve (4 maintained, 1 modified, 1 withdrawn)

**Maintained:** O1 (reduced to Medium), O2 (High — resume skips validation), O3 (Medium — sub-tier checkpoint gap), O6 (Low — atomicity gap)
**Modified:** O4 merged with TDD #5 (KeepGoing counter reset)
**Withdrew:** O5 (no-worktree counter reset — false alarm, counters irrelevant on that path)
**Endorsed from others:** TLA+ A, B, C; TDD #1, #2; CD #1 (partial), CD #2

### expert-continuous-delivery (Round 2)
**Position:** Conditionally Approve (2 blocking objections)

**Maintained:** Crash budget (#1 narrowed), Resume marker gap (#2)
**Withdrew:** Test file append strategy (#3 — misread, files are separate per step)
**Endorsed from others:** TLA+ A, B, C; TDD #2, #3; Edge O2, O3, O6
**Disagreed:** TDD #1 (S2 structurally held, redundant to re-test), Edge O1 (out of scope), Edge O4 (bounded by spec)

---

## Endorsement Map

| Objection | TLA+ | TDD | Edge | CD |
|-----------|------|-----|------|----|
| Counter reset on ReviewFail (TLA+ A = TDD 3) | AUTHOR | ENDORSE | ENDORSE | ENDORSE |
| KeepGoing task advancement (TLA+ B = TDD 5) | AUTHOR | ENDORSE | ENDORSE | ENDORSE |
| Zero-checkpoint resume (TLA+ C) | AUTHOR | ENDORSE | ENDORSE | ENDORSE |
| ResumeToGlobal dedicated test (TDD 2) | ENDORSE | AUTHOR | ENDORSE | ENDORSE |
| S2 lock held across steps (TDD 1) | ENDORSE | AUTHOR | ENDORSE | DISAGREE |
| Resume skips validation (Edge O2) | DISAGREE | — | AUTHOR | ENDORSE |
| Sub-tier checkpoint gap (Edge O3) | ENDORSE | — | AUTHOR | ENDORSE |
| WorktreeCleanup atomicity (Edge O6) | DISAGREE | — | AUTHOR | ENDORSE |
| Crash budget (CD 1) | ENDORSE | DISAGREE | PARTIAL | AUTHOR |
| Resume marker gap (CD 2) | ENDORSE | ENDORSE | ENDORSE | AUTHOR |

---

## Round 1 Transcript

### expert-tla — Round 1
**Position:** Conditionally Approve
**Objections:**
- A: PerWT_ReviewFail counter reset semantics under-specified in Step 7 tests (wtDoublePassRetries and wtConsecPasses must reset to 0; same for GlobalReviewFail in Step 9)
- B: PerWT_ReviewKeepGoing task advancement logic not tested (mid-tier vs last-task branching)
- C: Resume precondition lastCompletedTier > 0 not tested for zero-checkpoint crash
**Endorsements:** ClaudeDispatchNoWorktrees routing fix, NoReReviewAfterConflict testing, coverage matrix accuracy, tier parallelization, rollback strategy, config snapshot, dual Resume paths

### expert-tdd — Round 1
**Position:** Strong overall with 6 objections
**Objections:**
- 1: S2 (LockHeldDuringExecution) only tested in Step 5, not Steps 6-9
- 2: ResumeToGlobal has no dedicated test
- 3: PerWT_ReviewFail counter reset not tested (same as TLA+ A)
- 4: Steps 2-3 test content not behavior (flagged, no action needed)
- 5: PerWT_ReviewKeepGoing counter reset not tested (same as TLA+ B)
- 6: Step 8 redundant "no worktrees" test; should be guard assertion
**Endorsements:** Objection resolution thoroughness, systematic invariant coverage, test-first discipline, liveness via integration tests, coverage matrix as audit tool

### expert-edge-cases — Round 1
**Position:** Well-aligned with 6 edge cases
**Objections:**
- O1: Tier 1 parallel tasks — semantically broken code after clean merge (Significant)
- O2: Resume skips InputValidation and FixtureCoverage (Significant)
- O3: No per-task merge checkpoint — partial merge on resume (Significant)
- O4: Compound retry budget — 15 retries per task, no aggregate limit (Moderate)
- O5: ClaudeDispatchNoWorktrees doesn't reset per-worktree counters (Moderate)
- O6: Crash during WorktreeCleanup — atomicity gap (Minor)
**Endorsements:** ClaudeDispatchNoWorktrees routing, Crash/Resume design, ResumeToGlobal, NoReReviewAfterConflict formulation, Fairness specification, single-task tiers in Tiers 3-5

### expert-continuous-delivery — Round 1
**Position:** Conditionally Approve
**Objections:**
- 1: Crash budget (MaxCrashes=3) not addressed in plan
- 2: Resume marker gap between final tier completion and GlobalDoublePass start
- 3: Test file append strategy risky for multi-agent parallel execution
**Endorsements:** T6/T7 serialization fix, config snapshot, production-grade lock implementation, ClaudeDispatchNoWorktrees routing, rollback design, try/finally crash contract

---

## Round 2 Transcript

### expert-tla — Round 2
**Position:** Conditionally Approve (maintained with reinforced confidence)
**Maintained:** A, B, C (all three)
**Endorsed:** TDD 1, 2, 6; Edge O3, O5; CD 1, 2
**Disagreed:** Edge O2 (by design per spec), Edge O6 (operational not correctness)
**Withdrawn:** None
**New objections:** None

### expert-tdd — Round 2
**Position:** Conditionally Approve (4 required changes)
**Maintained:** 1 (S2 across steps), 2 (ResumeToGlobal)
**Endorsed:** TLA+ A, B, C; CD 2; partial CD 3
**Disagreed:** Edge O1 (prompt engineering), Edge O4 (by design), Edge O5 (irrelevant), CD 1 (not in spec)
**Withdrawn:** 4 (content testing correct for .md files), 6 (different entry contexts, both worth keeping)
**New objections:** None

### expert-edge-cases — Round 2
**Position:** Conditional Approve (4 maintained, 1 modified, 1 withdrawn)
**Maintained:** O1 (Medium), O2 (High), O3 (Medium), O6 (Low)
**Modified:** O4 (merged with TDD 5)
**Endorsed:** TLA+ A, B, C; TDD 1, 2; CD 1 (partial), CD 2
**Disagreed:** TDD 4 (content testing correct), CD 3 (separate files)
**Withdrawn:** O5 (counters irrelevant on no-worktree path)
**New objections:** None

### expert-continuous-delivery — Round 2
**Position:** Conditionally Approve (2 blocking)
**Maintained:** 1 (crash budget, narrowed), 2 (resume marker gap)
**Endorsed:** TLA+ A, B, C; TDD 2, 3; Edge O2, O3, O6
**Disagreed:** TDD 1 (structurally held), Edge O1 (out of scope), Edge O4 (bounded)
**Withdrawn:** 3 (misread — files are separate)
**New objections:** None

---

## Metadata

- **Date:** 2026-04-11
- **Topic:** Review implementation plan (implementation-plan.md) against TLA+ specification (CodeSimplify.tla) for vibe-cli Stage 8 "Code Simplify" pipeline
- **Context:** Stage 8 rewrite — PowerShell pipeline with Claude dispatch, git worktrees, double-pass verification, reviewer dispatch, sequential merge, crash recovery
- **Experts selected:** expert-tla, expert-tdd, expert-edge-cases, expert-continuous-delivery
- **Selection rationale:** No UI components — expert-a11y excluded. Pipeline + formal spec + testing + edge cases = selected roster.
- **Round count:** 2
- **Result:** CONSENSUS_REACHED (no new objections in Round 2)
- **Source artifacts:** docs/code-simplify/elicitor.md, docs/code-simplify/bdd.feature, docs/code-simplify/tla/CodeSimplify.tla, docs/code-simplify/implementation-plan.md
