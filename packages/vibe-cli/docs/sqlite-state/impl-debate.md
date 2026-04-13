# Debate Session: Implementation Plan vs TLA+ Specification

**Date:** 2026-04-12
**Status:** CONSENSUS_REACHED
**Rounds:** 3
**Experts:** expert-tla, expert-tdd, expert-edge-cases, expert-continuous-delivery

---

## Synthesis

### Result: CONSENSUS REACHED

The implementation plan is a faithful and nearly complete mapping of the TLA+ specification. All 13 state variables, 25 named transitions, 22 safety invariants, and 6 liveness properties are covered by implementation steps. The 11 execution tiers correctly respect the dependency graph. The plan demonstrates exceptional rigor in tracing formal specification to implementation.

However, the experts identified **17 actionable gaps** organized into four categories below. None are plan-breaking — all are additive improvements that strengthen guard enforcement, test quality, and infrastructure resilience.

### Agreed Recommendation

Address the following gaps before implementation begins, prioritized by severity:

#### Priority 1 — Spec Guard Enforcement (Correctness Risk)

1. **ExecuteStage guards missing from Set-StageComplete.** The TLA+ `ExecuteStage` requires `lockHolder = f` and `IsRunning(f)`. Step 5's `Set-StageComplete` does not enforce or test these guards. Either enforce at the repository level or add integration tests in Step 19/21 validating the guard chain.

2. **CompleteTask guard missing from Set-TaskResult.** The TLA+ `CompleteTask` requires `tierStatus[f][t] = "running"`. Step 12 enforces MaxTasks but never rejects task writes on non-running tiers. Add rejection tests for passed/failed/none/pending tiers.

3. **AdvanceDebateRound guard missing from Update-DebateState.** The TLA+ action requires `featureStatus[f] = "running"`. Step 10 tests stage-number guards (S11) but never tests rejection when the feature is halted. Add a test.

4. **StartTier predecessor-completion guard.** Add an explicit test that starting tier N+1 while tier N has incomplete tasks is rejected.

5. **HaltPipeline idempotency.** Add a test that double-halting a feature is a safe no-op (the TLA+ action is simply not enabled for already-halted features).

#### Priority 2 — Infrastructure Gaps (Silent Corruption Risk)

6. **PRAGMA foreign_keys = ON.** SQLite defaults to foreign keys OFF. Add `PRAGMA foreign_keys = ON` to `Open-StateDatabase` and add a test validating FK enforcement is active.

7. **WAL recovery after unclean shutdown.** Add at least one test that opens a database after simulated unclean shutdown and verifies state consistency (no partial transactions visible).

8. **Get-LastCompletedStage null vs 0 contract.** Pin the return type: document and test whether "no stages complete" returns `$null` or `0`, and verify downstream callers handle it correctly.

9. **HaltPipeline rollback test (Step 16).** Add an `@integration` test injecting failure mid-transaction to verify rollback leaves consistent state.

10. **ForceUnlock rollback test (Step 15).** Same as above — partial failure during the HaltPipeline-style cleanup must not leave orphaned state.

#### Priority 3 — Test Quality (False-Green Risk)

11. **Vague test names.** Rename: "S17 sync test" → "Running feature has pipelineState synchronized to running"; "concurrent contention" → specify the race scenario and expected outcome; "combined cleanup" → enumerate the dirty state being set up.

12. **Exhaustive invalid-transition test.** Add one parameterized test that iterates every (currentState, action) pair NOT in the valid transition set and asserts rejection. Highest-value single test for state machine correctness.

13. **Idempotency consistency.** Add idempotency tests for: completing an already-passed tier, resolving an already-resolved merge, re-initializing an existing database with data.

14. **Test teardown strategy.** Specify that unit tests use `:memory:` SQLite, integration tests use temp `.db` files with per-test creation and cleanup, and e2e tests use isolated temp directories.

15. **SQL injection negative path.** Add at least one test passing a feature name containing `'; DROP TABLE features; --` and verify the DB survives via parameterized queries.

#### Priority 4 — Delivery Optimization (Throughput)

16. **L4 coverage documentation.** Add L4 (LockEventuallyReleased) to Step 15's TLA+ Coverage section — ForceUnlock contributes to L4's resolution path.

17. **E2E split.** Consider splitting Step 20/21 E2E tests into an early integration checkpoint (core path: lock → state → stage → debate) runnable after Tier 8, and a full E2E in Tier 10.

---

## Per-Round Transcripts

### Round 1

#### expert-tla
**Position:** Plan is faithful and nearly complete. 13/13 states, 25/26 transitions, 22/22 invariants, 6/6 liveness properties covered. Three specific gaps identified.
**Objections:**
1. ExecuteStage guard gap — Set-StageComplete lacks lockHolder/IsRunning tests
2. Transition count discrepancy (25 vs stated 26 in summary metadata)
3. L4 documentation gap — ForceUnlock (Step 15) should list L4 in coverage
**Endorsements:** Two-phase ForceUnlock, abstraction boundary respect, cross-aggregate integration tests (Step 19), execution tier ordering, merge abstraction handling, TDD discipline throughout.

#### expert-tdd
**Position:** Thorough and largely TDD-compatible, but specific gaps in boundary coverage, concurrency testing, and state invariant verification.
**Objections:**
1. Vague test names block TDD red-phase writing
2. Missing boundary conditions (MaxDebateRound=0, MaxTasks=0 — later corrected by TLA+ ASSUME constraints)
3. Concurrency and isolation gaps
4. Missing negative-path tests (SQL injection, disk-full)
5. Test isolation strategy unspecified for integration tests
6. No exhaustive invalid-transition test
7. Inconsistent idempotency tests (missing for tiers, merges)
**Endorsements:** Step ordering excellent for TDD, boundary tests for MaxTasks=1/MaxCrashes=1/MaxDebateRound=1, error paths well-covered, proper test pyramid separation, Step 17 appropriately most heavily tested, "preserve" tests show awareness of recovery safety.

#### expert-edge-cases
**Position:** Strong plan with 8 missing/under-tested edge cases.
**Objections:**
1. HaltPipeline (Step 16) missing rollback test
2. ForceUnlock (Step 15) missing rollback test
3. Orphaned rows on feature re-creation after manual deletion
4. SQLite PRAGMA foreign_keys = ON never enabled or tested
5. Crash during mid-transaction (power loss) recovery untested
6. Set-TaskResult doesn't guard against tier status
7. Get-LastCompletedStage null vs 0 ambiguity
8. No test for Update-DebateState when feature is halted
**Endorsements:** TLA+ State Coverage Matrix is exemplary, cross-aggregate atomicity correctly identified, debate rounds produced genuine improvements, boundary conditions well-tested, tier ordering sound, :memory: for unit tests is correct.

#### expert-continuous-delivery
**Position:** Tier structure mostly sound with three errors and two optimizations.
**Objections:**
1. T11 (Step 11) placed one tier too deep
2. T18 (Step 18) placed four tiers too deep
3. T16 dependency on Step 13 may be overstated
4. Proposed optimized 10-tier structure
**Endorsements:** Dependency declarations correct, cross-aggregate composites correctly late, "test before wire" gate, Tier 4 fan-out maximizes throughput.

---

### Round 2

#### expert-tla
**Position:** Maintained Round 1 objections. Endorsed edge-cases #6, #7, #8 and TDD #6. Raised two new concerns.
**New Objections:**
4. Missing StartTier guard coverage (predecessor tasks complete)
5. HaltPipeline idempotency not tested (double-halt)
**Withdrawn:** Transition count discrepancy downgraded to metadata concern.
**Endorsements:** edge-cases #6 (Set-TaskResult guard), edge-cases #7 (null vs 0), edge-cases #8 (DebateState on halted), TDD #6 (exhaustive invalid-transition), CD #1-#2 (tier placement).

#### expert-tdd
**Position:** Narrowed objections based on TLA+ corrections. Endorsed multiple cross-expert points.
**New Objections:**
1. No test for idempotent re-initialization of existing database
2. Teardown strategy still unspecified
**Withdrawn:** MaxDebateRound=0 and MaxTasks=0 (invalidated by TLA+ ASSUME).
**Modified:** Vague test names narrowed, concurrency gaps deferred to edge-cases formulation.
**Endorsements:** edge-cases #6, #5, #7; tla #1; CD #1-#4 partially.

#### expert-edge-cases
**Position:** Maintained all 8 Round 1 objections. Raised two new infrastructure concerns.
**New Objections:**
8. WAL mode journal recovery after unclean shutdown (expanded from #5)
9. Concurrent ForceUnlock + active write race
**Modified:** #5 expanded from "mid-transaction crash" to "crash recovery" covering both rollback and WAL replay.
**Endorsements:** tla #1, tla #2, TDD #1, #4, #6, #7.

#### expert-continuous-delivery
**Position:** Modified tier analysis after deeper dependency tracing.
**New Objections:**
1. T20 E2E depends on all tasks — split into early and late checkpoints
2. No canary/progressive rollout (acknowledged as operational, not code)
**Withdrawn:** T11 "one tier too deep" (confirmed correct after tracing).
**Modified:** T18 anchored by T16 correctly; T16's T12 dependency is the compression question.
**Endorsements:** edge-cases #1-#2 (rollback), #3 (orphaned rows), #5 (mid-transaction crash), #6 (task tier guard), TDD #1, tla #1-#2.

---

### Round 3

All four experts reported **no new objections**. Consensus reached.

#### expert-tla — Final Position
No new objections. Priority ranking: (1) guard gaps, (2) PRAGMA + WAL, (3) halt idempotency + rollback, (4) test quality, (5) E2E split.

#### expert-tdd — Final Position
No new objections. Consolidated list is comprehensive from TDD perspective. Guard enforcement, rollback, SQL injection, and infrastructure edge cases are the substantive testable risks.

#### expert-edge-cases — Final Position
No new objections. Guard gaps, rollback, PRAGMA, WAL, null vs 0, and orphans are the correct attack surface for the SQLite migration. All are new concerns that do not exist in the current hashtable-based implementation.

#### expert-continuous-delivery — Final Position
No new objections. Tier structure sound for incremental delivery. E2E split keeps feedback loop fast. Guard gaps and test quality addressed by other experts.

---

## Endorsement Map

| Point | Endorsed By |
|-------|------------|
| ExecuteStage guard gap (tla #1) | tla, edge-cases, tdd, cd |
| Set-TaskResult tier guard (edge #6) | tla, tdd, edge-cases, cd |
| Update-DebateState halted guard (edge #8) | tla, edge-cases |
| Exhaustive invalid-transition test (tdd #6) | tla, tdd, edge-cases |
| PRAGMA foreign_keys (edge #4) | edge-cases, tdd |
| HaltPipeline + ForceUnlock rollback (edge #1-2) | edge-cases, tdd, cd |
| WAL recovery (edge #8-R2) | edge-cases, tdd |
| null vs 0 ambiguity (edge #7) | tla, tdd, edge-cases |
| Vague test names (tdd #1) | tdd, edge-cases |
| E2E split (cd #1-R2) | cd, tla |
| Idempotency consistency (tdd #7) | tdd, edge-cases |
| L4 documentation gap (tla #3) | tla |
| Teardown strategy (tdd #2-R2) | tdd |
| SQL injection (tdd #4) | tdd, edge-cases |

---

## Metadata

- **Topic:** Implementation plan review against TLA+ specification for SQLite State Repository
- **Context:** vibe-cli pipeline, PowerShell + PSSQLite, 12 tables, 34 functions
- **Specification:** `packages/vibe-cli/docs/sqlite-state/tla/SqliteState.tla` (Revision 13)
- **Artifact:** `packages/vibe-cli/docs/sqlite-state/implementation-plan.md` (21 steps, 11 tiers)
- **Experts:** expert-tla, expert-tdd, expert-edge-cases, expert-continuous-delivery
- **Rounds:** 3
- **Result:** CONSENSUS_REACHED
- **Unresolved Dissents:** None
