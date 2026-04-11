# Implementation Plan Debate Session

**Date:** 2026-04-11
**Result:** CONSENSUS_REACHED
**Rounds:** 3
**Experts:** expert-tla, expert-tdd, expert-edge-cases, expert-continuous-delivery

---

## Synthesis

### Agreed Recommendation

The implementation plan is thorough and ready for execution. All 38 TLA+ transitions, 15 safety invariants, and 4 liveness properties are mapped to concrete implementation steps with test-first descriptions. The 9-tier dependency DAG is correctly derived, file overlap analysis is valid, and 32 prior debate objections are fully traced to specific tests. The following 14 hardening items should be incorporated before or during implementation:

#### Critical (1)

1. **Remove "escalated" dead state from TLA+ spec** — The `TaskStates` set includes `"escalated"` but no transition in the spec ever produces or consumes it. It inflates the TLC state space, creates implementation ambiguity, and was endorsed as a gap by all 4 experts. Either remove it from `TaskStates` or add a `TaskEscalated(t)` transition if `Read-Escalation` should be a state change.

#### High (5)

2. **Add SF fixture retry convergence test** — The spec uses strong fairness (SF) on `BDDFixtureComplete` and `TLCFixtureComplete`, guaranteeing eventual success despite intermittent crashes. No test exercises this: "fixture crashes N times, regenerates N times, eventually produces valid fixtures, pipeline proceeds." Add to Step 10 or Step 20.

3. **Add atomicity specification for fixture file operations** — Steps 8, 9, and 10 perform atomic writes (temp + Move-Item + fsync), but the TLA+ spec treats these as instantaneous transitions. A crash between write and move leaves an unmodeled state. The spec should either model the two-phase write or the implementation should add a recovery predicate for partial writes on resume.

4. **Add merge-success-worktree-fail test** — If `MergeSuccess(t)` completes but worktree removal fails (locked file, antivirus on Windows), the task is in a state where merge succeeded but worktree persists. The completion counter increments, the tier advances, and the orphaned worktree accumulates. Add a test to Step 16 covering this compound failure, and extend Step 4's resume filesystem verification to detect stale worktrees from completed tiers (not just MERGE_HEAD/REBASE_HEAD).

5. **Add StreamWriter/Move-Item contention test** — Step 3 holds a StreamWriter with `FileShare.Read` for the pipeline lifetime. On Windows, antivirus real-time scanning can cause `Move-Item -Force` (used by fixture atomic writes in Steps 8/9) to fail with access-denied if the directories overlap. Add a test to Steps 8/9 simulating concurrent filesystem access during atomic writes.

6. **Add worktree removal race test for abort** — Step 18's abort cleanup terminates agents via `Stop-Process` (asynchronous on Windows) then removes worktrees. If a git operation is in-flight inside the worktree, `git worktree remove` fails due to `index.lock` or `.git/worktrees/<name>/locked`. Add a test to Step 18 covering abort while a git operation is active in the worktree, and add retry logic with lock file cleanup.

#### Medium (6)

7. **Step 13 needs boundary tests** — Add: timeout at exactly 30 minutes (boundary), task completing simultaneously with timeout (race condition), and timeout handler failure (Stop-Process access denied). Currently only 5 tests for a timing-critical component.

8. **Step 15 needs negative depth** — Add: review gate timeout, review gate returning malformed response, review gate network failure. Currently only 4 tests — the thinnest coverage in the plan.

9. **Step 2 needs corruption negative test** — What happens when runId extraction from `PIPELINE START` encounters a corrupted log line? Step 4 tests corrupted logs broadly, but Step 2's own extraction logic has no negative path.

10. **Step 19 needs negative tests** — Add: completion with lock-release failure, completion with pipeline.log write failure during COMPLETE marker. These are the final pipeline operations where failure leaves the system ambiguous.

11. **T16 rebase-inside-mutex needs a timeout test** — If `git rebase` hangs inside the named mutex (large repo, network pack), the mutex is held indefinitely. Step 13 (watchdog) covers task-level timeouts but not mutex-held duration. Add a test asserting bounded rebase duration with timeout and abort path.

12. **Partial-failure strategy per tier** — The plan defines per-task failure (Step 22) and full abort (Step 18), but has no explicit test for the middle ground: a tier where some tasks fail and others succeed, then the pipeline decides whether to continue. Step 12 has `AnyTaskInTierSucceeded` boundary tests, but the downstream decision logic (advance vs. abort) needs an explicit integration test.

#### Low (2)

13. **File overlap analysis should cover all touched files** — The current analysis lists primary targets per task. Shared utilities, config files, or registries touched incidentally could conflict within a tier. Verify completeness.

14. **T17 runtime integration** — T17 (Claude API Retry) has no build-time dependents until T20 (E2E). Every other Tier 1 task feeds Tier 2+. While T17 is consumed at runtime (all LLM calls go through invoke-claude.ps1), a wiring bug in the retry wrapper hides until E2E. Consider adding a Tier 2 integration test that exercises the retry wrapper.

---

## Per-Round Transcripts

### Round 1

#### expert-tla

**Position:** The plan achieves remarkably thorough TLA+ coverage — all 38 transitions, 15 safety invariants, and 4 liveness properties are mapped to concrete implementation steps with tests.

**Reasoning:**
- Transition coverage matrix: 38/38 verified against the TLA+ `Next` relation
- Safety invariants: 15/15 with explicit test references; Step 20 E2E verifies all
- Liveness: 4/4 tested in Step 20 with additional coverage in Steps 13, 15, 18, 19
- InitFresh/InitResume: Covered with 6 fixture combinations (objection #27)
- Fairness: SF on BDDFixtureComplete/TLCFixtureComplete implies retry convergence despite intermittent crashes — no explicit test for this
- "escalated" state: In TaskStates but unreachable — no transition produces it
- AbortCleanup mergeState divergence: Documented and intentionally strengthened in implementation

**Objections:**
1. "escalated" dead state in TaskStates — remove or add transition
2. No SF fixture retry convergence test — add crash-then-success loop test

**Endorsements:** N/A

---

#### expert-tdd

**Position:** Exceptionally thorough test-first plan with strong TLA+ traceability, but several test descriptions are assertions masquerading as tests, and boundary/negative gaps exist.

**Reasoning:**
- Specificity: Mostly excellent; Step 18's parameterized 8-phase abort tests are exemplary
- Implementation detail tests: Step 3's StreamWriter mock and Step 8/9's fsync mock are pragmatic but test internals
- Boundary gaps: Step 13 (no exact-30-min boundary), Step 15 (only 4 tests), Step 19 (only 5 tests)
- Step 11: "uses BDD scenarios to inform ticket generation" is vague and untestable
- Step 12: Static analysis grep test is linting, not behavioral TDD

**Objections:**
1. Step 13 needs boundary tests (exact timeout, race, handler failure)
2. Step 15 needs negative depth (timeout, malformed, network)
3. Step 12 static analysis is linting, not TDD
4. Step 2 needs corruption negative test
5. Step 19 needs negative tests (lock-release, log-write failures)

**Endorsements:** N/A

---

#### expert-edge-cases

**Position:** Impressively thorough after 32 objections, but 5 new interaction edge cases at feature boundaries remain uncovered.

**Objections:**
1. StreamWriter held open blocks atomic fixture Move-Item on Windows (antivirus contention)
2. Worktree removal races with in-flight git ops during abort (Stop-Process async on Windows)
3. Crash budget never decays — filesystem glitch permanently consumes a slot
4. runId collision (65536 values/second) in parallel CI
5. Merge succeeds but worktree cleanup fails — orphaned worktree not detected by resume

**Endorsements:** N/A

---

#### expert-continuous-delivery

**Position:** Tier structure is broadly sound — DAG respects dependencies and within-tier parallelization is reasonable.

**Reasoning:**
- No task can be promoted to an earlier tier
- Single-task tiers (7, 8, 9) are necessarily sequential
- DAG spot-checks verified correct
- Tier 1 (6 tasks) is widest but inherently irreducible

**Objections:**
1. File overlap analysis must cover ALL touched files
2. Worktree-dependent tasks in same tier need isolation guarantees
3. No partial-failure strategy per tier
4. T17 appears to be an orphan node

**Endorsements:** N/A

---

### Round 2

#### expert-tla

**Position:** Maintained both original objections. Raised 1 new objection on fixture file atomicity.

**Maintained:** TLA-1 (escalated dead state), TLA-2 (SF retry convergence)
**New:** TLA-3 (no atomicity spec for fixture file operations)
**Endorsements:** edge-cases #3 (crash budget — strengthens TLA-2), edge-cases #5 (merge-success-worktree-fail — missing transition), CD #3 (partial-failure — unmodeled state), CD #4 (T17 orphan — dead node)

---

#### expert-tdd

**Position:** Maintained 4 of 5 original objections, dropped static analysis. Raised 1 new objection.

**Maintained:** Step 13 boundary, Step 15 negative, Step 2 corruption, Step 19 negatives
**Dropped:** Step 12 static analysis (reconsidered)
**New:** TDD-6 (T16 rebase-inside-mutex timeout test)
**Endorsements:** edge-cases #3 (crash budget), edge-cases #1 (StreamWriter), TLA-1 (escalated), CD #3 (partial-failure), CD #4 (T17 orphan)

---

#### expert-edge-cases

**Position:** Maintained 3, dropped 2, adopted 1 from TLA.

**Maintained:** EDGE-1 (StreamWriter/Move-Item), EDGE-2 (worktree removal race), EDGE-5 (merge-success-worktree-fail — upgraded severity)
**Dropped:** EDGE-3 (crash budget decay — design preference), EDGE-4 (runId collision — astronomically unlikely)
**Adopted:** TLA-1 (escalated dead state)
**New:** EDGE-7 (concurrent pipeline invocations — resolved by Step 1's pipeline lock in R3)

---

#### expert-continuous-delivery

**Position:** Maintained 3 of 4 (withdrew T17 orphan in R3). Adopted escalated dead state from TLA.

**Maintained:** CD-1 (file overlap), CD-2 (worktree isolation + abort race — strengthened), CD-3 (partial-failure + state corruption)
**Adopted:** TLA-1 (escalated dead state)
**Endorsements:** edge-cases #1, edge-cases #2, TDD Step 2 corruption

---

### Round 3

All four experts confirmed **no new objections**. Convergence achieved.

#### expert-tla
Final: 3 maintained (TLA-1, TLA-2, TLA-3). No new objections. Endorsed all other experts' findings as complementary.

#### expert-tdd
Final: 5 maintained (Step 13 boundary, Step 15 negative, Step 2 corruption, Step 19 negatives, T16 rebase timeout). No new objections. Endorsed escalated dead state, StreamWriter contention, worktree race, partial-failure.

#### expert-edge-cases
Final: 3 maintained (StreamWriter/Move-Item, worktree removal race, merge-success-worktree-fail). Dropped concurrent invocations (resolved by pipeline lock). Endorsed plan as sound and ready. No new objections.

#### expert-continuous-delivery
Final: 4 maintained (file overlap, worktree isolation, partial-failure, escalated dead state). Withdrew T17 orphan concern (runtime dependency, not build-time). Endorsed proceeding to implementation. No new objections.

---

## Expert Final Positions

| Expert | Verdict | Maintained Objections |
|--------|---------|----------------------|
| expert-tla | Ready with 3 hardening items | escalated dead state, SF retry test, fixture atomicity |
| expert-tdd | Ready with 5 test additions | Step 13 boundary, Step 15 negative, Step 2 corruption, Step 19 negatives, T16 rebase timeout |
| expert-edge-cases | Ready with 3 hardening items | StreamWriter contention, worktree abort race, merge-success-worktree-fail |
| expert-continuous-delivery | Ready with 4 items | file overlap, worktree isolation, partial-failure, escalated dead state |

## Endorsement Map

| Point | Endorsed By |
|-------|-------------|
| "escalated" dead state | expert-tla, expert-tdd, expert-edge-cases, expert-continuous-delivery |
| StreamWriter/Move-Item contention | expert-tla, expert-tdd, expert-edge-cases, expert-continuous-delivery |
| Worktree removal race on abort | expert-tdd, expert-edge-cases, expert-continuous-delivery |
| Partial-failure strategy | expert-tla, expert-tdd, expert-continuous-delivery |
| Merge-success-worktree-fail | expert-tla, expert-edge-cases |
| SF fixture retry convergence | expert-tla (sole) |
| Fixture file atomicity spec | expert-tla (sole, endorsed via StreamWriter by others) |

---

## Metadata

| Field | Value |
|-------|-------|
| Date | 2026-04-11 |
| Rounds | 3 |
| Result | CONSENSUS_REACHED |
| Experts | expert-tla, expert-tdd, expert-edge-cases, expert-continuous-delivery |
| Selection method | Autonomous — domains relevant to TLA+ review, TDD coverage, edge case hunting, pipeline orchestration |
| Artifacts reviewed | elicitor.md, CleanupImprovements.tla, implementation-plan.md |
