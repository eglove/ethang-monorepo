# BDD Debate Session — Pipeline Reviewers & Resume

**Date:** 2026-04-10
**Result:** CONSENSUS_REACHED
**Rounds:** 3
**Experts:** expert-bdd, expert-tdd, expert-edge-cases, expert-continuous-delivery, expert-tla

---

## Synthesis

### Agreed Recommendation

The BDD scenarios document is comprehensive and structurally sound — every behavior in the elicitor briefing has at least one scenario, and the review lifecycle state machine is well-defined with explicit guards on all counter-bounded loops. **Conditional approval**: the following gaps must be addressed before the scenarios are implementation-ready.

**Critical (all 5 experts converged):**

1. **Mutual exclusion on pipeline state** — No scenario covers concurrent pipeline instances (`--resume` while active run in progress, two `./vibe.ps1` invocations writing to the same `pipeline.log` and `user_notes.md`). On Windows, concurrent PowerShell file appends without mutex produce corrupted lines. Add scenarios for: lock file acquisition, rejection of concurrent invocations, and resume from concurrency-corrupted log.

2. **TDD Keep Going unbounded within review-fix** — A user can select Keep Going on TDD escalation an unlimited number of times within a single review-fix cycle. The only guard is `ReviewGateTimeout`, but if that is disabled or increased, TDD retries become a liveness hole. Add a `MaxTddKeepGoing` cap or explicitly document dependency on `ReviewGateTimeout` as the termination guarantee.

3. **Diff-base staleness between review and merge** — When T1 merges while T2's review is in progress (or between T2's review pass and merge), T2's reviewed diff may be logically invalidated without producing a git conflict. No scenario covers semantic staleness (review passes on diff D1, but D1 is logically invalidated by another task's merge).

4. **COMPLETE/HALTED must be absorbing terminal states** — No scenario asserts that once the pipeline reaches COMPLETE or HALTED, no further transitions occur. A bug could cause post-completion review dispatch or state corruption by late-arriving concurrent processes.

**High Priority (4/5 experts converged):**

5. **Degenerate config values** — No scenarios for `MaxReviewRounds=1` (immediate escalation on any blocker), `MaxKeepGoingResets=0` (Keep Going never offered), zero-value timeouts (immediate kill), `ReviewGateTimeout < ReviewerTimeout` (gate fires before reviewer timeout). Use Scenario Outlines with Examples tables for boundary testing.

6. **Implementation detail coupling** — Structured Pipeline Log scenarios specify exact log line formats; `--resume` scenarios couple to those formats; `review-loop.ps1` section describes internal script orchestration. Refactor to test observable outcomes ("pipeline resumes at correct phase") rather than serialization formats.

7. **JSON schema validation vs. parse failure** — Scenarios only cover malformed/unparseable JSON. Valid JSON with wrong schema (missing fields, wrong types) is a distinct failure mode common with LLM outputs. Add scenarios for schema-invalid-but-parseable responses from both reviewers and moderator.

8. **Global pipeline wall-clock ceiling** — No termination guarantee across all Keep Going resets. Worst-case: `MaxKeepGoingResets(3) × ReviewGateTimeout(1800s) = 5400s` per gate. Define an absolute wall-clock cap for the entire pipeline run, independent of individual stage timeouts.

**Medium Priority (raised by 2-3 experts):**

9. **Rollback semantics for partial fixes** — If a reviewer-suggested fix is applied and a subsequent cycle fails, no revert mechanism exists. Branch accumulates speculative commits with no squash/revert strategy.

10. **Contradictory reviewer fix instructions** — No conflict resolution priority when reviewers give opposing advice (e.g., "add input validation" vs. "remove this code path").

11. **Retry-vs-refix distinction on resume** — If round 1 was a retry (trigger=retry) and round 2 was post-fix, a crash during round 2 makes it ambiguous whether TDD counters should be fresh or carried. Log markers exist but resume scenarios don't exercise this distinction.

12. **Config validation at load time** — No scenario validates that degenerate parameter combinations are rejected before runtime (fail-fast).

13. **Agent-writer classification guard** — Tasks with `codeWriter="agent-writer"` skip the review gate entirely. No guard verifies the classification is correct; a misclassified task bypasses review.

14. **Heartbeat / liveness check for long-running agents** — Reviewer timeout is a blunt 600s kill. No stall detection for agents producing no output.

**Low Priority (authoring quality):**

15. **No Gherkin tags** — Scenarios lack `@primary`, `@negative`, `@edge_case` etc. tags for selective execution and category coverage verification.

16. **No Scenario Outlines with Examples tables** — Fencepost scenarios for `MaxReviewRounds` and `MaxKeepGoingResets` should be parameterized instead of repeated as separate Scenario blocks.

17. **No Background sections** — Shared Given steps (e.g., "Given a pipeline configuration with default thresholds") are duplicated across scenarios.

18. **Multiple When/Then pairs** — Some scenarios (e.g., TDD phase transitions logged) bundle multiple stimuli/assertions violating single-stimulus-single-outcome discipline.

19. **Sync vs. async reviewer failure** — Process crash and timeout expiry produce different observable behaviors but are conflated.

20. **Behaviors without elicitor traceability** — `ReviewGateTimeout`, `MaxKeepGoingResets`, agent-writer skip, merge queue interaction, corrupted log handling, feature branch HEAD verification were all invented in the BDD doc. These may be good ideas but should be validated with the stakeholder.

---

## Per-Expert Final Positions

### expert-bdd (Round 3)
**Position:** APPROVE with prior conditions. The scenarios are comprehensive in behavior coverage. Main concerns are authoring quality (implementation detail coupling, missing tags/outlines/backgrounds) and behaviors invented without elicitor traceability. These are refinement issues, not blocking.

### expert-tdd (Round 3)
**Position:** APPROVE with prior conditions. TDD integration points are accurately specified. Blocking concern: TDD Keep Going must have a bounded cap within review-fix. Secondary: config validation for degenerate TDD params, terminal-state re-entry guard, RED output contract specification.

### expert-edge-cases (Round 3)
**Position:** 20 edge cases across 8 categories. Three elevated to critical (mutual exclusion, unbounded TDD loops, diff staleness). Satisfied that cross-expert convergence covers the full edge case surface. No new objections after Round 2.

### expert-continuous-delivery (Round 3)
**Position:** Conditionally acceptable for CD pipeline. Key concerns: mutual exclusion, rollback semantics, agent heartbeat, global wall-clock ceiling. The 4.5-hour worst-case latency is incompatible with CD principles but bounded by ReviewGateTimeout.

### expert-tla (Round 3)
**Position:** Sound state machine with two structural gaps confirmed (global wall-clock ceiling for liveness proof, transition priority when simultaneous events fire). Mutual exclusion is the foundational modeling defect — without it, no invariant is trustworthy.

---

## Endorsement Map

| Endorsing Expert | Endorses | Point |
|---|---|---|
| expert-bdd | expert-tdd | Config validation for degenerate TDD params → use Scenario Outlines |
| expert-bdd | expert-edge-cases | Contradictory reviewer instructions → missing behavioral scenario |
| expert-bdd | expert-cd | Rollback semantics → need observable outcome definition |
| expert-bdd | expert-tla | Global wall-clock ceiling → termination guarantee |
| expert-bdd | expert-tla | Transition priority → deterministic expected outcomes |
| expert-tdd | expert-tla | TDD Keep Going unbounded → independent confirmation, blocking defect |
| expert-tdd | expert-tla | COMPLETE/HALTED not absorbing → undermines TDD counter invariants |
| expert-tdd | expert-edge-cases | Degenerate configs (MaxReviewRounds=1) → high-risk TDD interaction |
| expert-tdd | expert-cd | 4.5-hour worst-case → unbounded TDD is direct contributor |
| expert-tdd | expert-cd | Rollback semantics → critical for TDD stage failure recovery |
| expert-tdd | expert-cd | Heartbeat for agents → detect hung TDD loops |
| expert-edge-cases | expert-tla | COMPLETE/HALTED not absorbing → real state-machine defect |
| expert-edge-cases | expert-tla | Global wall-clock ceiling → structural fix for unbounded loops |
| expert-edge-cases | expert-tla | Transition priority → resolves simultaneous event ambiguity |
| expert-edge-cases | expert-cd | 4.5-hour worst-case + no dispatch cap → operationally critical |
| expert-edge-cases | expert-tdd | TDD Keep Going unbounded + cleanup at 100 → concrete test gaps |
| expert-cd | expert-edge-cases | Mutual exclusion on pipeline.log → highest-priority CD fix |
| expert-cd | expert-tla | COMPLETE/HALTED not absorbing → downstream automation can't trust outcomes |
| expert-cd | expert-tla | Diff staleness → silent correctness failure, worst kind in CD |
| expert-cd | expert-tdd | TDD Keep Going unbounded → unbounded inner loop = unbounded execution |
| expert-cd | expert-bdd | Implementation detail coupling → pipeline tests must be refactor-safe |
| expert-tla | expert-edge-cases | Mutual exclusion → foundational modeling defect |
| expert-tla | expert-tdd | Counter non-reset on retry → supports unbounded-loop concern |
| expert-tla | expert-cd | No aggregate reviewer dispatch cap → resource model unconstrained |
| expert-tla | expert-bdd | Missing briefing traceability → initial state underconstrained |
| expert-tla | expert-edge-cases | Contradictory reviewer instructions → liveness hazard |
| expert-tla | expert-cd | Rollback semantics → explicit transition relation needed |
| expert-tla | expert-edge-cases | Counter product bounds → unbounded counters = infinite state space |

---

## Round Transcripts

### Round 1

**expert-bdd:**
Position: Comprehensive but overspecifies implementation internals.
- Log format scenarios are implementation details, not observable behavior
- Several behaviors invented without elicitor traceability (ReviewGateTimeout, MaxKeepGoingResets, agent-writer skip, merge queue interaction, corrupted log handling)
- Missing Gherkin tags, Scenario Outlines, and single-stimulus discipline
- review-loop.ps1 section describes internal orchestration
- Out-of-diff findings policy not in briefing
- Multiple When/Then pairs in single scenarios

**expert-tdd:**
Position: Conditionally approves TDD integration.
- No scenario verifying TDD counters NOT reset on retry-review
- RED phase output contract unspecified (one test per blocker?)
- Cleanup counter at 100 not exercised across cycles
- TDD Keep Going has no cap within review-fix
- No Stop during TDD escalation within review-fix scenario

**expert-edge-cases:**
Position: 18 missing edge cases across 7 categories.
- No mutual exclusion between concurrent pipeline instances
- No degenerate config values (MaxReviewRounds=1, zero timeouts, ReviewGateTimeout < ReviewerTimeout)
- No JSON schema validation vs parse failure distinction
- Windows concurrent file append corruption in pipeline.log
- Disk-full/I/O failure during log or user_notes.md writes
- Semantic diff staleness
- Process orphaning after timeout kill
- Empty seed string
- Concurrent user_notes.md writes
- ReviewGateTimeout + MaxReviewRounds simultaneous firing

**expert-continuous-delivery:**
Position: Conditionally acceptable IF timeout arithmetic tightened.
- Worst-case 4.5 hours review gate latency
- No scenario for merge-queue-waiting tasks during multi-round review-fix
- No mutual exclusion on pipeline.log
- No aggregate reviewer dispatch cap
- Dirty feature branch during post-merge fix

**expert-tla:**
Position: Sound state machine with two structural gaps.
- COMPLETE/HALTED not verified as absorbing terminal states
- No dedicated S0→S1 entry-point scenario
- Concurrent review diff-base staleness unmodeled
- TDD Keep Going unbounded within review-fix
- Retry-vs-refix distinction not recoverable on resume
- Agent-writer classification guard missing

### Round 2

**expert-bdd:**
Position: Maintained, strengthened by cross-expert convergence.
- NEW: No Background section for shared Given steps
- NEW: No sync vs async reviewer failure distinction
- NEW: Untested concurrency assumption in dispatch order
- Endorses: TDD (config validation), Edge Cases (degenerate configs → Scenario Outlines), TLA+ (absorbing states, wall-clock ceiling, transition priority), CD (latency)

**expert-tdd:**
Position: Maintained, unbounded TDD confirmed blocking.
- NEW: No config validation scenario for degenerate TDD params
- NEW: No terminal-state re-entry guard scenario
- Endorses: TLA+ (unbounded TDD, absorbing states), Edge Cases (degenerate configs), CD (latency, heartbeat)

**expert-edge-cases:**
Position: 20 edge cases, 3 elevated to critical.
- NEW: Contradictory reviewer fix instructions (conflict resolution)
- NEW: TDD inner-loop × stage-level retry counter product exceeding bounds
- Endorses: TLA+ (absorbing states, wall-clock ceiling, transition priority), CD (dispatch cap, heartbeat), TDD (unbounded + cleanup), BDD (traceability)

**expert-continuous-delivery:**
Position: Maintained, convergence strengthens concerns.
- NEW: Rollback semantics unspecified for partial fixes
- NEW: No heartbeat for long-running agent subprocesses
- Endorses: Edge Cases (mutual exclusion — highest CD priority), TLA+ (absorbing states, diff staleness), TDD (unbounded TDD), BDD (implementation coupling)

**expert-tla:**
Position: Maintained, mutual exclusion is foundational.
- NEW: No global pipeline wall-clock ceiling (liveness/termination proof)
- NEW: Transition priority undefined when two transitions enabled simultaneously
- Endorses: Edge Cases (mutual exclusion), TDD (counter non-reset), CD (dispatch cap), BDD (traceability → initial state)

### Round 3

All 5 experts: **No new objections.** Consensus reached. All approve with prior conditions tracked above.

---

## Metadata

- **Date:** 2026-04-10
- **Topic:** BDD scenarios for Pipeline Reviewers & Resume feature
- **Context:** vibe-cli Stage 8 sub-phase, evaluated against elicitor briefing
- **Experts selected:** expert-bdd, expert-tdd, expert-edge-cases, expert-continuous-delivery, expert-tla
- **Experts excluded:** expert-ddd (no domain model design), expert-atomic-design (no UI), expert-performance (no performance optimization), expert-lodash (no utility library), expert-a11y (no frontend)
- **Rounds completed:** 3
- **Result:** CONSENSUS_REACHED (no new objections in Round 3)
- **Total objections tracked:** 20 items across 4 priority tiers
