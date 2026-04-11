# TLA+ Specification Review — Debate Session

**Date:** 2026-04-11
**Status:** CONSENSUS_REACHED
**Rounds:** 3
**Experts:** expert-tla, expert-bdd, expert-edge-cases
**Artifact:** `docs/cleanup-improvements/tla/CleanupImprovements.tla`
**Reference:** `docs/cleanup-improvements/bdd.feature`

---

## Synthesis — Agreed Recommendation

The TLA+ specification captures the core pipeline orchestration correctly (worktree lifecycle, warden gating, parallel fan-out, atomic completion counting, merge mutex serialization, coverage/TDD dual-cap enforcement, tier advancement, fixture preconditions, and abort+cleanup). The 13 safety properties and 4 liveness properties are well-chosen for the abstraction level.

However, the specification has **3 critical defects**, **3 high-severity gaps**, and **13+ medium/low gaps** relative to the BDD scenarios. The critical defects render the resume path, stale lock detection, and a resume-to-coding-stage transition completely untestable by TLC.

### Priority Actions for Spec Revision

#### CRITICAL (spec defects — TLC cannot verify intended behaviors)

1. **`isResuming` is never set to TRUE — resume path is dead code**
   - `Init` sets `isResuming = FALSE` and no action in `Next` ever sets it to `TRUE`
   - `ResumeAcquireLock` is permanently disabled — TLC never explores resume
   - All resume-related properties (idempotency, stale lock, stage detection) are vacuously true
   - **Fix:** Add `ResumeInit` predicate or make `Init` non-deterministic: `isResuming \in BOOLEAN`

2. **Resume-to-coding-stage deadlock**
   - `ResumeAcquireLock` can set `pipelineStage' = NumStages` while fixtures remain `"missing"`
   - `EnterCodingStage` requires `bddFixture = "valid" /\ tlcFixture = "valid"`
   - `GenerateBDDFixtures`/`GenerateTLCFixtures` require `pipelineStage \in FixtureGenAfter` (stages 2-3)
   - At `NumStages`, no fixture generation is possible and no backward movement exists → **deadlock**
   - **Fix:** `ResumeAcquireLock` must non-deterministically restore fixture state (modeling on-disk existence), or fixture generation must be enabled at any stage during resume

3. **`pipelineLock` never transitions to `"stale"` — stale lock detection is dead code**
   - `AcquireStaleLock` guards on `pipelineLock = "stale"` but no action ever produces this state
   - Lock transitions are only `"free" → "held"` and `"held" → "free"`
   - **Fix:** Add `LockGoesStale` action: `pipelineLock = "held" /\ pipelineLock' = "stale"` (modeling process crash without cleanup)

#### HIGH (behavioral gaps that mask real bugs)

4. **Missing `ReviewGateFail` action — deadlock in `review_gate`**
   - `ReviewGatePass(t)` exists but no `ReviewGateFail(t)`
   - A task in `review_gate` can only exit via pass, abort, or timeout (if extended)
   - WF on `ReviewGatePass` forces eventual passage, masking the gap
   - Combined with L3 not covering `review_gate`, tasks can silently deadlock after passing coverage
   - **Fix:** Add `ReviewGateFail(t)` transitioning back to `executing` or to `failed`

5. **`TaskTimeout` only fires from `"executing"` state**
   - BDD specifies a 30-minute watchdog; tasks can also stall in `coverage_gate`, `review_gate`, `merge_waiting`
   - A task hung in `coverage_gate` due to a crashed coverage tool would be unrecoverable
   - **Fix:** Extend `TaskTimeout` guard to include `coverage_gate`, `review_gate`, `merge_waiting`

6. **No fairness on failure actions — systematic liveness hole**
   - `WorktreeCreationFailed`, `WardenConfigFailed`, `DepsInstallFailed` lack WF/SF in Fairness
   - A task stuck in `worktree_creating` where creation genuinely fails has no guarantee the failure action fires
   - L3 doesn't cover pre-execution states, so this is invisible to liveness checking
   - **Fix:** Add WF for failure actions, extend L3 to cover all non-idle task states
   - **Note:** expert-bdd disagrees on the fix approach — suggests an environment process for failure injection rather than WF on failure actions

#### MEDIUM-HIGH

7. **Merge mutex timeout not modeled**
   - BDD: "Merge mutex acquisition times out after 5 minutes" → task fails
   - Spec: `AcquireMergeMutex` has no timeout — task waits forever if mutex holder is stuck
   - WF on `MergeSuccess` assumes holder eventually completes, but merge can genuinely hang
   - **Fix:** Add `MergeMutexTimeout(t)` action

8. **Lock mutex timeout not modeled (30 seconds)**
   - BDD: System mutex timeout for concurrent `--resume` attempts
   - Spec doesn't model concurrent pipeline invocations at all
   - **Fix:** Add lock acquisition timeout or document single-process scope

#### MEDIUM

9. **Coverage tool crash not distinguished from low coverage**
   - BDD: tool crash does NOT count against coverage iteration cap
   - Spec: `CoverageGateFail` always increments `coverageIter`
   - **Fix:** Add `CoverageToolCrash(t)` action that doesn't increment `coverageIter`

10. **`apiRetries` conflates merge retries with Claude API retries**
    - Spec uses `apiRetries` only for merge conflict retries
    - BDD specifies separate Claude API retry logic (5 attempts, exponential backoff, 429/500 vs 400 distinction)
    - **Fix:** Separate into `mergeRetries` and `apiRetries` counters, or document the abstraction

11. **Resume doesn't model tier-level granularity**
    - BDD: resume into stage 8 at specific tier/task, skip already-merged tasks
    - Spec: `ResumeAcquireLock` only sets `pipelineStage`, leaves `currentTier = 0` and all tasks `idle`
    - **Fix:** `ResumeAcquireLock` should non-deterministically restore `currentTier`, `tierComplete`, and per-task states

12. **`AbortCleanup` doesn't clear `mergeState` for terminated tasks**
    - After abort: `taskState = "failed"` but `mergeState = "waiting"` or `"merging"` — inconsistent
    - BDD: "Reset-MergeQueue clears pending merge entries when a tier is aborted"
    - **Fix:** Set `mergeState` to `"failed"` for all active merge-state tasks in `AbortCleanup`

13. **No `deps_installing` skip path**
    - BDD: "pnpm install is skipped when no pnpm-lock.yaml exists"
    - Spec always transitions through `deps_installing`
    - **Fix:** Add `DepsSkipped(t)` from `warden_configuring` directly to `executing`

14. **Double Ctrl+C force exit unmodeled**
    - BDD: Second Ctrl+C bypasses cleanup entirely
    - Spec: `WF_vars(AbortCleanup)` guarantees cleanup always completes (L2)
    - Spec overpromises on liveness — L2 is stronger than the real system provides
    - **Fix:** Document as intentional limitation, or add `ForceExit` action

15. **`AbortCleanup` doesn't update `completionCounter`**
    - After abort, counter doesn't reflect newly-failed tasks
    - Cosmetically inconsistent; no property violation since pipeline is done
    - **Fix:** Update counter in `AbortCleanup`, or document counter as undefined post-abort

16. **Claude API retry semantics absent**
    - BDD has 9 scenarios covering exponential backoff, HTTP status differentiation, per-task independence
    - Spec doesn't model LLM call retries at all
    - **Fix:** Consider adding API retry counter per task during `executing` phase

#### LOW

17. **Unreachable `"escalated"` task state** — in `TaskStates` enum but no action transitions to it. Remove or model Read-Escalation branching.

18. **S9 `FixturesPrecondition` too narrow** — only checks `executing`/`coverage_gate`; should cover all active coding-stage states.

19. **L3 `TasksEventuallyTerminate` too narrow** — starts from `executing`; should cover `worktree_creating`, `warden_configuring`, `deps_installing`.

20. **Zero test files causing gate failure not modeled** — spec's `CoverageGatePass` non-deterministically passes regardless of test file existence.

21. **Idempotency tokens oversimplified** — spec uses `{stage, status}` pairs; BDD has per-invocation UUID tokens with artifact existence checks.

22. **Pipeline.log write failure not modeled** — BDD says log write failure halts pipeline.

23. **Fixture committed to branch before worktree creation not modeled** — spec tracks fixture as "valid" but doesn't distinguish "generated" from "committed to git."

24. **`TierAllFailed` leaves `tierComplete[currentTier] = FALSE`** — tier is never marked complete before abort.

25. **Feature branch divergence warning on `--resume`** — implementation concern, not state-machine property.

26. **Windows MAX_PATH validation** — implementation detail below spec abstraction level.

27. **Item 3 implementation writer paths** — data-flow concern, not state-machine property.

28. **Simultaneous dual-cap exhaustion** — benign non-determinism; both `CoverageCapExhausted` and `TDDCapExhausted` lead to same `"failed"` outcome.

29. **`isResuming` in UNCHANGED doubles state space** — TLC performance concern; dead variable occupies state space.

---

## Per-Expert Final Positions

### expert-tla (Round 3)
The spec is structurally sound in its core orchestration logic but has 3 critical dead-code defects (`isResuming`, stale lock, resume deadlock) that render TLC verification incomplete. The resume path is entirely unexercised. Priority: fix Init/environment actions to make all three lock states and the resume path reachable, then address ReviewGateFail and timeout coverage.

### expert-bdd (Round 3)
The resume path in the TLA+ spec is critically under-specified relative to the BDD scenarios. The BDD describes a rich resume protocol (fixture validation, tier/task-level granularity, counter reset, idempotency tokens) that the spec reduces to a single non-deterministic stage jump. ~40% of BDD scenario surface area (error handling, timeouts, operational edge cases) is not represented in the spec. The spec is a good safety/liveness skeleton but needs targeted amendments for behavioral fidelity.

### expert-edge-cases (Round 3)
The most dangerous gaps are where TLC will silently report "no violations found" while the real system can deadlock — specifically the unreachable resume/stale-lock paths and the missing timeout modeling. The spec's fairness assumptions on success paths without corresponding failure fairness creates blind spots where pre-execution failures (worktree, warden, deps) can silently stall. The review gate deadlock (no ReviewGateFail + WF forcing passage) is an overly optimistic model that masks a real implementation risk.

---

## Endorsement Map

| Finding | expert-tla | expert-bdd | expert-edge-cases |
|---|---|---|---|
| C1: isResuming dead code | **AUTHOR** | ENDORSE | STRONGLY ENDORSE |
| C2: Resume deadlock | ENDORSE | ENDORSE | **AUTHOR** |
| C3: Stale lock dead code | **AUTHOR** | ENDORSE | ENDORSE |
| H4: ReviewGateFail missing | ENDORSE | ENDORSE | ENDORSE |
| H5: TaskTimeout too narrow | ENDORSE | **AUTHOR** | ENDORSE |
| H6: No fairness on failures | ENDORSE | PARTIAL (disagrees on fix) | **AUTHOR** |
| MH7: Merge mutex timeout | ENDORSE | ENDORSE | ENDORSE |
| MH8: Lock mutex timeout | ENDORSE | ENDORSE | DISAGREE (Very Low) |
| M9: Coverage tool crash | ENDORSE | ENDORSE | ENDORSE |
| M10: apiRetries conflation | ENDORSE | PARTIAL | ENDORSE |
| M11: Resume tier granularity | ENDORSE | **AUTHOR** | ENDORSE |
| M12: mergeState in AbortCleanup | **AUTHOR** | ENDORSE | ENDORSE |
| M13: deps_installing skip | **AUTHOR** | ENDORSE | ENDORSE |
| M14: Double Ctrl+C | ENDORSE | ENDORSE | ENDORSE |
| M15: AbortCleanup counter | ENDORSE | ENDORSE | **AUTHOR** |

---

## Unresolved Minor Disagreements

1. **Fairness on failure actions (H6 fix approach):** expert-bdd argues WF on failure actions would force failures to happen, which is wrong; an environment process for failure injection is preferred. expert-edge-cases argues WF is the pragmatic TLA+ modeling approach. Both agree the liveness gap exists.

2. **Lock mutex timeout severity:** expert-edge-cases rates Very Low (outside spec abstraction); expert-tla rates Medium-High. The spec doesn't model concurrent invocations, making this more of a scoping question than a severity question.

3. **Fixture state on resume:** expert-bdd suggests non-deterministic fixture state restoration; expert-edge-cases argues regeneration (existing GenerateBDDFixtures/GenerateTLCFixtures) is the correct model. Both approaches fix the deadlock but differ in modeling philosophy.

---

## Round-by-Round Transcript

### Round 1
All three experts independently identified 13-15 issues each, with ~80% overlap. Key shared findings: missing ReviewGateFail, unreachable "escalated" state, coverage tool crash conflation, merge mutex timeout, apiRetries conflation, double Ctrl+C, pipeline.log write failure. expert-edge-cases uniquely identified the resume-to-coding-stage deadlock.

### Round 2
expert-tla discovered two new CRITICAL findings: `isResuming` is never set to TRUE (resume path dead code) and `pipelineLock` never transitions to "stale" (stale lock dead code). expert-bdd identified resume tier-level granularity gap. expert-edge-cases identified systematic liveness hole from missing fairness on failure actions. Strong mutual endorsement on Round 1 findings.

### Round 3
Minimal new findings (all Low severity). Strong convergence on priority list. Minor disagreement on fairness approach for failure actions. Consensus reached on the problem set and severity ordering.

---

## Metadata
- **Date:** 2026-04-11
- **Spec file:** `docs/cleanup-improvements/tla/CleanupImprovements.tla` (884 lines)
- **BDD file:** `docs/cleanup-improvements/bdd.feature` (2011 lines, ~160 scenarios)
- **Experts selected:** expert-tla, expert-bdd, expert-edge-cases (autonomous selection)
- **Round count:** 3
- **Result:** CONSENSUS_REACHED
- **Critical defects found:** 3
- **High-severity gaps:** 3
- **Medium gaps:** 8
- **Low gaps:** 13+
