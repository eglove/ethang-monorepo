# Debate Session -- Global Pipeline State TLA+ Re-Review (v2)

**Date:** 2026-04-02
**Result:** CONSENSUS REACHED
**Rounds:** 1
**Experts:** expert-tla, expert-edge-cases, expert-continuous-delivery

---

## Topic

Re-review the revised TLA+ specification `GlobalPipelineState.tla` after applying all fixes from the first review. Verify correctness of applied fixes and check for newly introduced issues.

## Artifacts Reviewed

1. **Revised TLA+ Specification:** `docs/tla-specs/global-pipeline-state/GlobalPipelineState.tla`
2. **Updated README:** `docs/tla-specs/global-pipeline-state/README.md`
3. **Design Consensus:** `docs/debate-moderator-sessions/2026-04-02_global-pipeline-state-design.md`
4. **First Review:** `docs/debate-moderator-sessions/2026-04-02_global-pipeline-state-tla-review.md`
5. **Original Briefing:** `docs/questioner-sessions/2026-04-02_global-pipeline-state.md`

## Fixes Under Verification

| # | Fix | Source |
|---|-----|--------|
| 1 | ClearStateFile sets gitState to DIRTY (was CLEAN) | First review, HIGH priority |
| 2 | ClearedSectionsEmpty invariant added | First review, hardening |
| 3 | HaltedConsistency invariant added | First review, hardening |
| 4 | UncommittedWarningProtocol updated (cascading from gitState fix) | Cascading change |
| 5 | README enhancements (MaxRuns justification, clearFailed deadlock) | First review, documentation |

---

## Round 1

### expert-tla

Position: All five fixes are correctly applied. The spec is sound. No new issues introduced.

Reasoning:

**Fix 1 -- ClearStateFile gitState = DIRTY (line 119):** Correctly applied. The action now sets `gitState' = "DIRTY"` on successful clear. This accurately models that writing a template file to disk creates an uncommitted git change. The cascading effect is clean: after clearing, gitState = DIRTY means the file is recognized as modified, and WarnUncommitted becomes relevant before the next clear if the state is not committed.

**Fix 2 -- ClearedSectionsEmpty (lines 281-282):** Correctly applied. The invariant `fileState = "CLEARED" => \A s \in Stages : sections[s] = "EMPTY"` documents the meaning of CLEARED and catches any future regression that might allow a CLEARED file to retain populated sections. This is trivially implied by ClearStateFile's action (which resets all sections to EMPTY) but making it an explicit invariant is correct practice.

**Fix 3 -- HaltedConsistency (lines 287-288):** Correctly applied. The biconditional `halted = TRUE <=> fileState = "HALTED_SNAPSHOT"` prevents the redundant boolean from diverging from the file state. Verification: HaltPipeline sets both `halted' = TRUE` and `fileState' = "HALTED_SNAPSHOT"`. ClearStateFile resets `halted' = FALSE` and transitions fileState to CLEARED. CompletePipeline guards `halted = FALSE` and sets fileState to COMPLETE_SNAPSHOT. No action sets one without the other.

**Fix 4 -- UncommittedWarningProtocol (lines 308-309):** The updated invariant `warned = TRUE => gitState \in {"DIRTY", "COMMITTED"}` is correct. Trace verification:

- WarnUncommitted requires `gitState = "DIRTY"` (line 199), so warned can only become TRUE when gitState is DIRTY.
- CommitStateFile changes gitState from DIRTY to COMMITTED (line 209) but does not reset warned. So warned = TRUE with gitState = COMMITTED is reachable and valid.
- ClearStateFile resets `warned' = FALSE` (line 120) whenever it fires. So warned is always FALSE after clearing.
- No path exists where warned = TRUE and gitState = CLEAN. CLEAN is only the initial state (Init, line 92), and warned starts FALSE.

The invariant is correct and could theoretically be tightened to just `{"DIRTY"}` since the COMMITTED case is only reachable if WarnUncommitted fired before CommitStateFile without an intervening ClearStateFile. However, including COMMITTED is the defensive and correct choice -- it documents the real reachable state space.

**Fix 5 -- README:** MaxRuns = 2 justification (memoryless between runs) is documented at README lines 54-55. clearFailed deadlock as intentional is documented at README lines 57-58. TLC results show 10 invariants + 2 liveness properties passing on both models. All correct.

**EventualCommit post-fix analysis:** With gitState = DIRTY after clearing (Fix 1), the CLEAN state is only reachable at Init (ABSENT state). After the first ClearStateFile, gitState never returns to CLEAN -- it cycles between DIRTY and COMMITTED. The EventualCommit property `fileState \in {"COMPLETE_SNAPSHOT", "HALTED_SNAPSHOT"} ~> gitState \in {"COMMITTED", "CLEAN"}` effectively requires COMMITTED for all post-initial states. The first review's concern about EventualCommit being "weaker than intended" is resolved. The CLEAN disjunct is harmless (unreachable in post-initial states) and the property name is now accurate.

Objections: None.

Endorsements: None (first round).

---

### expert-edge-cases

Position: All fixes are correctly applied. No new edge cases introduced. The spec is tighter than v1.

Edge Case Verification:

**[State transition] ClearStateFile ABSENT -> CLEARED with gitState fix:** In the initial state, gitState = CLEAN. ClearStateFile fires (line 109 guard: `gitState /= "DIRTY" \/ warned = TRUE` -- CLEAN is not DIRTY, so the left disjunct is TRUE). On success, gitState becomes DIRTY. This is correct -- the first-ever clear creates an uncommitted file.

**[Cycle] Terminal -> Clear -> Accumulate -> Terminal cycle with git states:** After a complete run: fileState = COMPLETE_SNAPSHOT, gitState = DIRTY (from stage writes). CommitStateFile fires: gitState = COMMITTED. ClearStateFile fires (gitState = COMMITTED, not DIRTY, guard passes): gitState' = DIRTY, warned' = FALSE. Stages write (gitState stays DIRTY). Terminal reached: gitState still DIRTY. Correct cycle.

**[Edge case] Terminal -> Clear WITHOUT commit:** After a complete run: fileState = COMPLETE_SNAPSHOT, gitState = DIRTY. User does NOT commit. ClearStateFile guard: `gitState /= "DIRTY" \/ warned = TRUE`. gitState IS DIRTY and warned = FALSE, so the guard FAILS. WarnUncommitted must fire first (sets warned = TRUE). Then ClearStateFile can fire. This is the correct uncommitted-change-warning behavior from the design consensus.

**[Edge case] HaltPipeline before any stage writes:** fileState = CLEARED, currentStage = 1 (after StartRun), no WriteStageResult called. HaltPipeline fires: fileState = HALTED_SNAPSHOT, halted = TRUE, currentStage = 0. HaltedConsistency: halted = TRUE <=> fileState = HALTED_SNAPSHOT -- satisfied. gitState is DIRTY (from ClearStateFile). CommitStateFile can fire (HALTED_SNAPSHOT + DIRTY). Correct.

**[Edge case] ClearedSectionsEmpty after ClearStateFile from HALTED_SNAPSHOT:** Suppose prior run halted at stage 2 (sections[1] = WRITTEN, sections[2] = EMPTY, ...). ClearStateFile fires: sections reset to all EMPTY. fileState = CLEARED. ClearedSectionsEmpty: fileState = CLEARED => all sections EMPTY. Satisfied. Correct.

**[New issue check] Does the gitState fix create any unreachable states or deadlocks?** No. The only change is CLEAN -> DIRTY in ClearStateFile's success branch. This strictly increases the reachable state space (DIRTY is now reachable from ClearStateFile as well as WriteStageResult). No transitions are removed. The clearFailed intentional deadlock is unchanged.

Objections: None.

Endorsements: None (first round).

---

### expert-continuous-delivery

Position: The git lifecycle is now correct. All fixes are properly applied. The CD model is sound.

Reasoning:

**Git lifecycle post-fix:** The git state now follows the correct CD pattern:
1. CLEAN -- only at Init (file never existed)
2. DIRTY -- after any file mutation (clear, stage write)
3. COMMITTED -- after explicit commit at terminal state

No action ever resets gitState to CLEAN after initialization. This is correct: once a file exists in the working tree, it is either committed or has uncommitted changes. The concept of CLEAN (matching the committed version exactly) is only valid before the file is first created.

**Commit-before-clear enforcement:** The ClearStateFile guard `gitState /= "DIRTY" \/ warned = TRUE` (line 109) correctly models the CD workflow: if there are uncommitted changes, warn the user before overwriting them. The guard allows clearing from CLEAN (initial state only) and COMMITTED (previous run was committed) without warning. From DIRTY, the warning must fire first. This matches the design consensus.

**README documentation:** The clearFailed deadlock documentation (line 57-58) is important for CD: it means the pipeline will not silently proceed with a stale state file if the clear operation fails. This is the correct fail-fast behavior for a CD pipeline.

**UncommittedWarningProtocol:** The invariant correctly captures that warned is a flag that is only meaningful when gitState is DIRTY or COMMITTED. After clearing resets both warned and transitions gitState to DIRTY, the flag is in a known state. There is no scenario where the warned flag persists across a clean lifecycle boundary.

Objections: None.

Endorsements: None (first round).

---

## Round 1 -- Moderator Analysis

**New objections raised in Round 1:** None.

All three experts independently verified the five fixes and found them correctly applied. No expert raised any new objection or identified any issue introduced by the revisions. All experts confirmed the cascading UncommittedWarningProtocol update is correct.

**Consensus reached after Round 1.**

---

## Agreed Recommendation

The revised TLA+ specification `GlobalPipelineState.tla` is correct and complete. All five fixes from the first review have been properly applied:

### 1. ClearStateFile gitState = DIRTY -- VERIFIED CORRECT

Line 119: `gitState' = "DIRTY"` correctly models that writing a template file creates an uncommitted change. The cascading effect on EventualCommit resolves the first review's concern: CLEAN is now unreachable after initialization, so the liveness property effectively requires an actual commit.

### 2. ClearedSectionsEmpty invariant -- VERIFIED CORRECT

Lines 281-282: Correctly documents the meaning of CLEARED and catches future regressions. Trivially implied by ClearStateFile's action but valuable as an explicit invariant.

### 3. HaltedConsistency invariant -- VERIFIED CORRECT

Lines 287-288: The biconditional prevents the redundant `halted` boolean from diverging from fileState. All actions that set one also set the other.

### 4. UncommittedWarningProtocol update -- VERIFIED CORRECT

Lines 308-309: `warned = TRUE => gitState \in {"DIRTY", "COMMITTED"}` is correct. Traced all paths: warned becomes TRUE only via WarnUncommitted (requires DIRTY); CommitStateFile can transition to COMMITTED without resetting warned; ClearStateFile resets both. No path to warned = TRUE with gitState = CLEAN exists.

### 5. README enhancements -- VERIFIED CORRECT

MaxRuns = 2 justification (memoryless between runs), clearFailed deadlock documentation (intentional fail-fast), and updated TLC results (10 invariants + 2 liveness on both models) are all present and accurate.

### No New Issues

No expert identified any issue introduced by the revisions. The spec is internally consistent and all 10 invariants + 2 liveness properties pass TLC on both models.

---

## Expert Final Positions

**expert-tla**
Position: The spec is sound. All fixes correctly applied. EventualCommit is now effectively strong (CLEAN unreachable post-init). UncommittedWarningProtocol cascading update is correct -- traced all paths.
Key reasoning: The gitState fix (CLEAN -> DIRTY in ClearStateFile) is the structural change; the other fixes are additive invariants that document intent and catch regressions. The cascading update to UncommittedWarningProtocol is necessary and correct because COMMITTED is reachable with warned = TRUE (WarnUncommitted fires, then CommitStateFile fires without an intervening clear).
Endorsed: expert-edge-cases (thorough edge case verification of the git lifecycle), expert-continuous-delivery (CD lifecycle model confirmation)

**expert-edge-cases**
Position: No new edge cases introduced. All previously identified edge cases remain correctly handled. The spec is tighter than v1.
Key reasoning: Verified the five critical edge cases: initial clear (ABSENT -> CLEARED), terminal-to-clear cycle with commit, terminal-to-clear without commit (warning required), halt before any writes, and cleared-sections-empty after clearing from halted state. All behave correctly with the gitState fix.
Endorsed: expert-tla (EventualCommit analysis showing CLEAN is unreachable post-init), expert-continuous-delivery (git lifecycle correctness)

**expert-continuous-delivery**
Position: The git lifecycle model is now correct and matches real CD workflows. Every file mutation produces DIRTY. Only explicit commits produce COMMITTED. CLEAN is the initial-only state.
Key reasoning: The commit-before-clear enforcement via the ClearStateFile guard is correct. The README documentation of intentional deadlocks and MaxRuns bounds provides the context a CD engineer needs to trust the model.
Endorsed: expert-tla (UncommittedWarningProtocol trace), expert-edge-cases (cycle verification)

---

## Endorsement Map

| Expert | Endorsed By |
|---|---|
| expert-tla (EventualCommit analysis, protocol trace) | expert-edge-cases, expert-continuous-delivery |
| expert-edge-cases (edge case verification, cycle testing) | expert-tla, expert-continuous-delivery |
| expert-continuous-delivery (CD lifecycle model) | expert-tla, expert-edge-cases |

---

**Session saved to:** docs/debate-moderator-sessions/2026-04-02_global-pipeline-state-tla-review-v2.md
