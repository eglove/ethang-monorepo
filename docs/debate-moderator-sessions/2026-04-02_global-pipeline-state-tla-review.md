# Debate Session -- Global Pipeline State TLA+ Review

**Date:** 2026-04-02
**Result:** CONSENSUS REACHED
**Rounds:** 2
**Experts:** expert-tla, expert-edge-cases, expert-ddd, expert-tdd, expert-continuous-delivery

---

## Topic

Review the TLA+ specification `GlobalPipelineState.tla` against the agreed design consensus and original briefing. Focus on whether the spec correctly captures all states, transitions, safety properties, and liveness properties.

## Artifacts Reviewed

1. **TLA+ Specification:** `docs/tla-specs/global-pipeline-state/GlobalPipelineState.tla`
2. **TLC Results / README:** `docs/tla-specs/global-pipeline-state/README.md`
3. **Design Consensus:** `docs/debate-moderator-sessions/2026-04-02_global-pipeline-state-design.md`
4. **Original Briefing:** `docs/questioner-sessions/2026-04-02_global-pipeline-state.md`

---

## Round 1

### expert-tla

Position: The spec is a faithful formalization of the design consensus with one structural gap and one liveness concern.

Reasoning: The state model correctly captures all five file lifecycle states (ABSENT, CLEARED, ACCUMULATING, COMPLETE_SNAPSHOT, HALTED_SNAPSHOT) and all transitions from the design. The three-machine decomposition (StateFileLifecycle, SectionOwnership, GitCommitProtocol) is clean and matches the design's three concerns exactly. Safety properties are well-chosen: SectionOwnership (writtenBy[s] in {0, s}), NoStageSkip, FailFastOnClearFailure, TerminalStateOnlyCommit, and UncommittedWarningProtocol all correctly formalize the design consensus.

However, EventualCommit allows gitState = CLEAN as a satisfying terminal condition. This means the liveness property is trivially satisfied if the system clears to a new run without ever committing. The property does not enforce that a commit actually happens -- it allows the system to skip the commit entirely by proceeding to the next run (which resets gitState to CLEAN). This makes EventualCommit weaker than its name suggests.

Additionally, there is no explicit invariant stating that CLEARED implies all sections are EMPTY. ClearOnStart only checks sections from currentStage+1 onward. While the ClearStateFile action does reset all sections, an explicit invariant would document this intent and catch future regressions.

Objections:
- EventualCommit is weaker than the name suggests. It is satisfied even if the commit never happens (because clearing resets gitState to CLEAN). The property should be renamed or strengthened.
- No invariant verifying CLEARED => all sections EMPTY. ClearOnStart is not sufficient -- it only checks sections ahead of the current stage.

Endorsements:
- None (first round)

---

### expert-edge-cases

Position: The spec handles the three critical edge cases from the design debate (clear failure, partial write, uncommitted changes) but has gaps in clearing's git state model and validation failure paths.

Edge Cases Found:
- [Sequence] Halt before any write: HaltPipeline requires currentStage >= 1 but WriteStageResult may not have been called. File is CLEARED with gitState CLEAN, transitions to HALTED_SNAPSHOT with gitState CLEAN. CommitStateFile requires DIRTY, so no commit can happen. Technically correct (nothing to commit) but worth documenting.
- [State modeling] ClearStateFile resets gitState to CLEAN unconditionally. But writing a template file IS a file change -- the physical file is different from the committed version. The cleared file should make gitState DIRTY, not CLEAN.
- [Partial failure] ValidateSection has no failure path. It always succeeds (WRITTEN -> VALIDATED). If validation fails in reality (malformed prior section from a crash), the spec does not capture the halt that should follow.
- [Boundary] NumStages = 1 works correctly -- AdvanceStage is never enabled, CompletePipeline fires after stage 1 writes.

Objections:
- ClearStateFile sets gitState to CLEAN, but the physical act of clearing changes the file, which should make it DIRTY in git.
- ValidateSection has no failure path. A validation failure should trigger HaltPipeline, but the spec does not model this.

Endorsements:
- None (first round)

---

### expert-ddd

Position: The spec uses generic infrastructure naming instead of the domain language agreed in the consensus.

Reasoning: The design consensus explicitly adopted domain naming: the file is a PipelineRunSnapshot, sections are StageResult records. The spec uses "FileStates" and "SectionStates" -- generic infrastructure terms. The variable is named "sections" not "stageResults." The variable "writtenBy" is infrastructure language (who physically wrote) rather than domain language (which stage owns this result).

The `halted` boolean variable is redundant with `fileState = "HALTED_SNAPSHOT"`. Both encode the same concept: the pipeline run has halted. HaltPipeline sets both, CompletePipeline guards against `halted = TRUE`, but this guard is already satisfied by the fileState guard (CompletePipeline requires ACCUMULATING, not HALTED_SNAPSHOT). There is no invariant ensuring `halted = TRUE <=> fileState = "HALTED_SNAPSHOT"`, so they could theoretically disagree.

Objections:
- Generic naming (sections, fileState, writtenBy) instead of domain language from the consensus (stageResults, snapshotState).
- The `halted` boolean is redundant with fileState = "HALTED_SNAPSHOT" and has no consistency invariant.

Endorsements:
- None (first round)

---

### expert-tdd

Position: TLC results are passing but the model checking bounds are not justified, and there is no mapping from formal properties to implementation tests.

Reasoning: TLC verified the production model (6 stages, 2 runs, 4183 states). With MaxRuns = 2, the spec only explores two pipeline runs. The README reports results but does not explain why 2 runs is sufficient. For practitioners reading this spec as documentation, the justification matters.

Each of the 8 safety properties and 2 liveness properties should have a corresponding implementation test. The spec proves these properties hold in the model; the implementation needs Vitest tests that verify they hold in code. A property-to-test mapping section in the README would bridge the gap between formal verification and executable tests.

Objections:
- MaxRuns = 2 is not justified in the README. Why not 3 or 10?
- No mapping from spec properties to implementation tests.

Endorsements:
- None (first round)

---

### expert-continuous-delivery

Position: Machine 3 correctly captures terminal-state-only commits, but ClearStateFile's git state model is wrong.

Reasoning: The design consensus says: (1) commit only at terminal states, (2) warn before clearing if uncommitted changes exist. The spec correctly models both via CommitStateFile and WarnUncommitted/ClearStateFile guards.

However, ClearStateFile sets gitState' = "CLEAN" on success. In a real git workflow, writing a new template file creates an uncommitted change. The spec should set gitState' = "DIRTY" after clearing, not CLEAN. The CLEAN state should only exist for the initial ABSENT state (file never existed). Every subsequent file mutation (clear, stage write) should produce DIRTY.

Objections:
- ClearStateFile should set gitState' = "DIRTY" instead of "CLEAN". Writing the template is a file change that creates an uncommitted modification.

Endorsements:
- None (first round)

---

## Round 1 -- Moderator Analysis

**New objections raised in Round 1:**

1. expert-tla: EventualCommit is weaker than intended (satisfied by CLEAN without actual commit). Missing CLEARED => all sections EMPTY invariant.
2. expert-edge-cases: ClearStateFile gitState should be DIRTY, not CLEAN. ValidateSection has no failure path.
3. expert-ddd: Generic naming instead of domain language. Redundant `halted` boolean with no consistency invariant.
4. expert-tdd: MaxRuns = 2 not justified. No property-to-test mapping.
5. expert-continuous-delivery: ClearStateFile gitState should be DIRTY, not CLEAN.

**Overlap detected:**
- expert-edge-cases and expert-continuous-delivery both identify the ClearStateFile gitState issue.
- expert-tla's EventualCommit concern is related: if clearing sets DIRTY instead of CLEAN, EventualCommit becomes more meaningful.

**No consensus yet -- new objections exist. Proceeding to Round 2.**

---

## Round 2

### expert-tla

Position: Revised. Strengthening original position by endorsing the gitState concern.

Reasoning: The ClearStateFile gitState issue is legitimate. If clearing writes a template file, the physical file changes, so gitState should be DIRTY. Cascading effects: (1) After clearing, gitState = DIRTY means WarnUncommitted becomes relevant before the NEXT clear, which is correct behavior. (2) EventualCommit would need to account for DIRTY after clearing -- stages keep it DIRTY, terminal state triggers commit. This is cleaner. (3) The CLEARED => all sections EMPTY invariant should be added as explicit documentation.

On expert-ddd's `halted` boolean redundancy: the variable is used only in CompletePipeline (guard `halted = FALSE`), which is already enforced by fileState (CompletePipeline requires ACCUMULATING). Recommend adding a consistency invariant `halted = TRUE <=> fileState = "HALTED_SNAPSHOT"` rather than removing it, to preserve readability.

On expert-tdd's MaxRuns concern: the state machine is memoryless between runs -- ClearStateFile resets all state variables. A third run explores the same transitions as the second. MaxRuns = 2 is sufficient; this rationale should be documented in the README.

Objections:
- None new. Prior concerns are addressed if: (1) ClearStateFile gitState fixed to DIRTY, (2) CLEARED-sections invariant added, (3) halted-consistency invariant added, (4) README documents MaxRuns justification.

Endorsements:
- expert-edge-cases: ClearStateFile gitState should be DIRTY. Most impactful finding.
- expert-continuous-delivery: Same gitState concern from the CD perspective.
- expert-ddd: The `halted` boolean redundancy. Consistency invariant is the right fix.

---

### expert-edge-cases

Position: Satisfied on gitState consensus. Withdrawing ValidateSection objection.

Reasoning: The council is converging on ClearStateFile gitState = DIRTY. The ValidateSection concern is a valid implementation concern but not a modeling concern -- the spec abstracts validation as always succeeding, which is a valid modeling choice. The validation failure edge case should be tested in implementation tests, not in the TLA+ spec.

The clearFailed = TRUE state is a deadlock (no transitions out). This is intentional (fail-fast means stop), but there is no liveness property covering it. The Progress property only covers CLEARED -> terminal. A failed clear never reaches CLEARED. This is correct behavior but should be documented in the README as intentional.

Objections:
- None new. Withdrawing ValidateSection objection. clearFailed deadlock is by design; recommend documenting.

Endorsements:
- expert-tla: State machine is memoryless between runs, so MaxRuns = 2 is sufficient.
- expert-continuous-delivery: ClearStateFile gitState fix.
- expert-ddd: `halted` consistency invariant.

---

### expert-ddd

Position: Unchanged on naming. Satisfied on `halted` consistency invariant approach.

Reasoning: expert-tla's suggestion to add a consistency invariant rather than removing the variable is pragmatic. It preserves readability while preventing inconsistency. The naming concern is non-blocking for a TLA+ spec -- it does not affect verification correctness. If the spec is treated as living documentation, domain naming would improve accessibility, but this is a style recommendation, not a blocking objection.

Objections:
- None new. Naming concern is non-blocking.

Endorsements:
- expert-tla: Consistency invariant for `halted` is the right approach.
- expert-edge-cases: Withdrawing ValidateSection was correct -- the spec is an abstraction.

---

### expert-tdd

Position: Satisfied on MaxRuns justification. Maintaining property-to-test mapping as non-blocking enhancement.

Reasoning: expert-tla's memoryless-between-runs argument is convincing. ClearStateFile resets all state variables, so a third run adds no new reachable states. The README should document this rationale. The property-to-test mapping is a documentation enhancement, not a spec change.

Objections:
- None new.

Endorsements:
- expert-tla: Memoryless-between-runs argument for MaxRuns = 2.
- expert-edge-cases: ClearStateFile gitState fix.
- expert-continuous-delivery: ClearStateFile gitState fix.

---

### expert-continuous-delivery

Position: Satisfied. The gitState fix is the key deliverable.

Reasoning: The council has converged on ClearStateFile setting gitState = DIRTY. With this fix, the git lifecycle becomes: CLEAN (initial, file never existed) -> DIRTY (after any file write) -> COMMITTED (after explicit commit at terminal state). This correctly models the CD lifecycle. Expert-edge-cases' note about clearFailed deadlock being intentional should be documented.

Objections:
- None new.

Endorsements:
- expert-tla: Full state model analysis and memoryless-between-runs argument.
- expert-edge-cases: clearFailed deadlock documentation.

---

## Round 2 -- Moderator Analysis

**New objections raised in Round 2:** None.

All prior objections are resolved, addressed by recommended changes, or acknowledged as non-blocking. No expert raised a new concern.

**Consensus reached after Round 2.**

---

## Agreed Recommendation

The TLA+ specification `GlobalPipelineState.tla` is a faithful formalization of the design consensus with **one correctness issue** and **three documentation/hardening improvements**.

### 1. FIX: ClearStateFile should set gitState to DIRTY, not CLEAN

**Priority: HIGH (correctness)**

The ClearStateFile action sets `gitState' = "CLEAN"` on success. In reality, writing a template file to disk changes the file, producing an uncommitted git change. The spec should set `gitState' = "DIRTY"` after clearing. The CLEAN state should only be reachable as the initial state (file never existed) or via explicit commit.

This fix also strengthens EventualCommit: with gitState = DIRTY after clearing, the liveness property becomes more meaningful because the system cannot reach CLEAN without an actual commit.

**Impact on other properties:** WarnUncommitted and the ClearStateFile guard (`gitState /= "DIRTY" \/ warned = TRUE`) may need adjustment. After a commit at terminal state, gitState = COMMITTED. Then ClearStateFile fires with gitState = COMMITTED, which passes the guard (not DIRTY). After clearing, gitState = DIRTY. This is correct.

For the ABSENT -> CLEARED initial transition: gitState starts CLEAN, ClearStateFile fires, gitState' = DIRTY. WarnUncommitted guard (`gitState /= "DIRTY" \/ warned = TRUE`) -- since gitState is CLEAN (ABSENT state), the guard passes. After clearing, gitState = DIRTY. This is correct for the first run.

### 2. ADD: Invariant -- CLEARED implies all sections EMPTY

```tla
ClearedSectionsEmpty ==
    fileState = "CLEARED" => \A s \in Stages : sections[s] = "EMPTY"
```

This invariant is trivially true given ClearStateFile's action, but making it explicit documents the intent and catches future regressions.

### 3. ADD: Invariant -- halted consistency

```tla
HaltedConsistency ==
    halted = TRUE <=> fileState = "HALTED_SNAPSHOT"
```

The `halted` boolean is redundant with fileState but improves readability. A consistency invariant prevents them from diverging.

### 4. DOCUMENT: README enhancements

- **MaxRuns = 2 justification:** The state machine is memoryless between runs -- ClearStateFile resets all variables. A third run explores the same state space as the second.
- **clearFailed deadlock:** The clearFailed = TRUE state is intentionally a deadlock (no outgoing transitions). This is the fail-fast behavior from the design consensus. No liveness guarantee applies.
- **Property-to-test mapping (optional):** For each safety/liveness property, document the corresponding implementation test scenario.

### Non-Blocking Recommendations

- **Domain naming:** The spec uses generic terms (sections, fileState, writtenBy) where the design consensus adopted domain terms (stageResults, snapshotState, PipelineRunSnapshot). This is a style improvement, not a correctness issue.
- **EventualCommit naming:** Consider renaming to EventualCommitOrNextRun to accurately reflect what the property proves.

---

## Expert Final Positions

**expert-tla**
Position: The spec is sound with the gitState fix applied. All safety and liveness properties correctly formalize the design consensus once ClearStateFile sets DIRTY instead of CLEAN.
Key reasoning: The three-machine decomposition, state enumeration, and safety properties are correct. The gitState fix is the only correctness issue. The consistency invariant for `halted` and the CLEARED-sections invariant are hardening additions. MaxRuns = 2 is justified by the memoryless-between-runs property of ClearStateFile.
Endorsed: expert-edge-cases (gitState fix), expert-continuous-delivery (gitState fix), expert-ddd (halted consistency)

**expert-edge-cases**
Position: The spec addresses all three critical edge cases from the design debate once the gitState fix is applied. Validation failure is correctly abstracted out of the formal model.
Key reasoning: Clear failure is modeled (clearFailed + fail-fast). Uncommitted changes are modeled (WarnUncommitted + ClearStateFile guard). The gitState fix is the most impactful change. ValidateSection's always-succeeds model is a valid abstraction for the formal spec.
Endorsed: expert-tla (memoryless argument), expert-continuous-delivery (gitState fix), expert-ddd (halted consistency)

**expert-ddd**
Position: The spec is functionally correct. Domain naming is a non-blocking style improvement.
Key reasoning: The `halted` boolean redundancy is the only structural concern. A consistency invariant resolves it. Domain naming (stageResults vs sections) would improve the spec as documentation but does not affect verification.
Endorsed: expert-tla (consistency invariant approach), expert-edge-cases (ValidateSection withdrawal)

**expert-tdd**
Position: TLC results are credible once MaxRuns = 2 is justified in the README.
Key reasoning: The memoryless-between-runs argument is convincing. The property-to-test mapping is a valuable documentation enhancement. The gitState fix is the top priority.
Endorsed: expert-tla (memoryless argument), expert-edge-cases (gitState fix), expert-continuous-delivery (gitState fix)

**expert-continuous-delivery**
Position: Machine 3 (GitCommitProtocol) correctly models the CD lifecycle once ClearStateFile sets DIRTY.
Key reasoning: Every file mutation should produce DIRTY. Only explicit commits produce COMMITTED. CLEAN is the initial state only. The clearFailed deadlock is correct fail-fast behavior.
Endorsed: expert-tla (full state analysis), expert-edge-cases (clearFailed documentation)

---

## Endorsement Map

| Expert | Endorsed By |
|---|---|
| expert-tla (memoryless argument, consistency invariants) | expert-edge-cases, expert-tdd, expert-ddd, expert-continuous-delivery |
| expert-edge-cases (gitState fix, clearFailed documentation) | expert-tla, expert-tdd, expert-continuous-delivery |
| expert-ddd (halted consistency, naming) | expert-tla, expert-edge-cases |
| expert-tdd (MaxRuns justification, property-to-test mapping) | expert-tla |
| expert-continuous-delivery (gitState as CD lifecycle) | expert-tla, expert-edge-cases, expert-tdd |

---

**Session saved to:** docs/debate-moderator-sessions/2026-04-02_global-pipeline-state-tla-review.md
