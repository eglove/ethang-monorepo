# Debate Session: Implementation Plan vs TLA+ Specification

**Date:** 2026-04-10
**Topic:** Review implementation-plan.md against PipelineReviewers.tla
**Experts:** expert-tla, expert-tdd, expert-edge-cases, expert-continuous-delivery
**Rounds:** 2
**Result:** CONSENSUS_REACHED

---

## Synthesis

### Agreed Recommendation

The implementation plan achieves **complete coverage** of all 10 TLA+ states, 29 transitions, 12 safety invariants, and 4 liveness properties. The state coverage audit matrix is accurate. The symmetry between pre-merge and final review gates is well-handled via the parameterized gate engine (Step 5). The tier structure is mostly correct. However, the plan requires **12 specific fixes** before it is ready for execution:

#### Critical (must fix before execution)

1. **Add UNCHANGED variable assertions to every step's test description.** Every transition test must assert that variables in the TLA+ UNCHANGED clause are preserved. Example: Step 6's HandlePassPreMerge must assert `lockHolder`, `reviewRound`, `keepGoingResets`, `tddKeepGoingCount`, `tasksDone`, `gateTimedOut`, `globalTimedOut` are unchanged. *(All 4 experts)*

2. **Move T10 from Tier 4 to Tier 5.** T10 depends on T6, which is also in Tier 4 — a topological sort violation. Cascade: T11 and T12 move to Tier 6, T13 to Tier 7, T18 to Tier 8, T19 to Tier 9. *(expert-continuous-delivery, endorsed by all)*

3. **Add ReviewVerdict timeout guards to Step 5 tests.** The TLA+ `ReviewVerdict` has guards `~gateTimedOut /\ ~globalTimedOut`. Test that the moderator is not invoked when either timeout flag is TRUE. *(expert-tdd, expert-tla)*

#### High (should fix before execution)

4. **Add unit test for StartRunning transition.** The `locked -> running` transition (guard: `lockHolder = 1`) has no unit test — only covered by Step 18 integration. Add to Step 3 or create a sub-step. *(expert-tla, expert-tdd)*

5. **Document and test tddKeepGoingCount sticky exhaustion.** `TddKeepGoingExhausted` does NOT reset `tddKeepGoingCount`. Re-entering `reviewFix` via `HandleFailPreMerge` means TDD is immediately exhausted again. Step 8 must document this spec-faithful behavior and test the re-entry path. *(expert-edge-cases, expert-tdd)*

6. **Document and test shared keepGoingResets counter.** Both `ReviewKeepGoing` (Step 9) and `GateTimeoutKeepGoing` (Step 15) share `keepGoingResets`. A gate timeout Keep Going reduces the review exhaustion Keep Going budget. Add cross-reference tests. *(expert-edge-cases, expert-tla)*

7. **Test MaxReviewRounds=0 boundary.** With MaxReviewRounds=0, fail/retry verdicts skip HandleFail/HandleRetry and go straight to escalation. Add explicit test in Step 6 or Step 9 for this boundary. *(expert-edge-cases, expert-tdd, expert-continuous-delivery)*

8. **Test gate timeout during fix states.** `ReviewGateTimeout` fires from reviewFix/finalReviewFix. `GateTimeoutKeepGoing` routes back to the parent review state (not the fix state). Step 15 must test this routing from fix states explicitly. *(expert-tdd, expert-tla, expert-edge-cases)*

9. **Make Step 5 test descriptions specific.** "Loops until terminal condition" is untestable. Specify exact verdict sequences and expected state traces (e.g., given [retry, retry, fail], assert reviewRound=2, state=reviewFix). *(expert-tdd)*

10. **Test DiffBaseStale UNCHANGED preservation.** Step 11 must assert that `keepGoingResets` and `tddKeepGoingCount` are preserved (not reset) across the staleness re-review transition. A reset would silently expand the gate budget. *(expert-edge-cases, expert-tdd, expert-continuous-delivery)*

#### Moderate (fix or document)

11. **Fix Step 4 dependency text.** Markdown says "Dependencies: Step 2" but JSON says `dependencies: []`. The JSON is correct — verdict is a pure domain type. Fix the markdown. *(expert-tla)*

12. **Declare NumTasks origin.** Step 1 defines MaxReviewRounds etc. but omits NumTasks. Specify where NumTasks comes from at runtime (tier task list) and add boundary tests (NumTasks=1 skips staleness). *(expert-tla, expert-continuous-delivery)*

### Unresolved Dissents

None — all experts converged on the same recommendation. Minor disagreements on severity were resolved in Round 2.

---

## Round 1 Transcripts

### expert-tla — Round 1

**Position:** The implementation plan is a high-fidelity mapping of the TLA+ specification with accurate state coverage, but contains several dependency ordering errors and one semantic gap involving the `GateTimeoutKeepGoing` transition's `~globalTimedOut` guard.

**Reasoning:**
- All 10 states, 29 transitions, 12 safety invariants, and 4 liveness properties are mapped
- Variable coverage is complete (all 10 TLA+ VARIABLES declared in Step 2)
- Tier structure is sound (foundation precedes infrastructure precedes logic)

**Objections:**
1. Step 4 dependency inconsistency (JSON says no deps, markdown says Step 2)
2. StartRunning has no unit test (only in Step 18 integration)
3. GateTimeoutKeepGoing `~globalTimedOut` guard not explicitly tested in Step 15
4. GateTimeoutStop/GlobalTimeout race interaction not discussed
5. Step 9 missing dependency on Step 12 for finalReview escalation paths
6. EnterFinalReview in Step 5 but tasksDone guard not testable until Step 10
7. NumTasks constant not declared in any step

**Endorsements:**
- Pre-merge/final gate symmetry via parameterized gate engine
- TDD Keep Going escalation chain correctly modeled
- Diff-base staleness correctly isolated to multi-task tiers
- Test-first approach with explicit invariant verification per step
- Gate timeout routing by reviewGateType

---

### expert-tdd — Round 1

**Position:** Test descriptions are well-structured with strong TLA+ coverage, but contain gaps around UNCHANGED assertions, boundary interactions, and negative-path specificity.

**Reasoning:**
- Structural alignment is strong — every element maps to at least one step
- Test-first discipline is genuinely followed
- Coverage matrix provides bidirectional traceability

**Objections:**
1. CRITICAL: No UNCHANGED variable assertions in any step's tests
2. CRITICAL: Step 4 missing ReviewVerdict timeout guards
3. Step 9 missing ReviewStop guard test (`keepGoingResets < MaxKeepGoingResets`)
4. Step 5 test descriptions too vague for test-first
5. Step 10 doesn't test EnterFinalReview blocked when tasksDone < NumTasks
6. Step 11 doesn't specify gateTimedOut reset assertion
7. Step 13 timeout guard tests too vague
8. Step 15 doesn't test routing from fix states
9. Step 18 lacks multi-task interleavings
10. Step 19 needs deterministic regression cases alongside randomized

**Endorsements:**
- Coverage matrix is excellent with bidirectional traceability
- Step 19 liveness testing strategy well-conceived
- Dependency graph is clean and correctly ordered
- Pre-merge/final symmetry reduces test surface while preserving coverage
- Step 8's TddKeepGoingExhausted verdict="fail" correctly specified

---

### expert-edge-cases — Round 1

**Position:** Structurally sound coverage but contains subtle edge cases around counter boundary interactions, timeout ordering, and diff staleness that could violate spec invariants.

**Reasoning:**
- All 29 transitions mapped across 19 steps and 8 tiers
- Tier dependency ordering generally correct
- Counter interaction patterns are the primary risk area

**Objections:**
1. TddKeepGoingExhausted doesn't reset tddKeepGoingCount — creates instant re-escalation on fix re-entry (spec-faithful but undocumented)
2. MaxReviewRounds=0 creates immediate escalation — implicit handoff between Step 6 and Step 9 untested
3. DiffBaseStale competes for reviewRound — staleness can consume last review round
4. Gate timeout timer lifecycle during mergeQueue state unclear
5. GateTimeoutKeepGoing `~globalTimedOut` atomicity in PowerShell
6. Shared keepGoingResets counter between review and gate timeout escalation undocumented
7. ReviewVerdict `verdict=NULL` guard vs TddKeepGoingExhausted `verdict=fail` — control flow ordering matters
8. Gate timeout during reviewFix path untested
9. HandlePassPreMerge doesn't reset counters — stale value window
10. TaskMerged doesn't reset review counters — stale values in running state

**Endorsements:**
- Tier structure prevents circular dependencies
- Dual-gate symmetry is excellent
- TLA+ coverage matrix is thorough
- Randomized liveness tests are the right approach
- ReviewStop guard correctly separates voluntary from forced stop
- gateTimedOut reset in ReviewKeepGoing prevents deadlock

---

### expert-continuous-delivery — Round 1

**Position:** Tier structure is well-reasoned but contains a misplaced task (T10 in same tier as dependency T6) and file-level write conflicts that undermine stated parallelism.

**Reasoning:**
- Tiers 1-3 are correct
- Tier 7 (orchestrator) as fan-in is the right pattern
- Tier 8 (liveness) correctly positioned as final verification
- Bottom-up build order is sound

**Objections:**
1. CRITICAL: T10 in same tier as dependency T6 (topological sort violation)
2. Cascading tier violations from T10 misplacement
3. File-level write conflicts within tiers (review-gate.ps1 hit by multiple Tier 5 tasks)
4. No intermediate integration tests between tiers

**Endorsements:**
- T4/T1 separation in Tier 1 is excellent (orthogonal domain concepts)
- T18 as explicit fan-in with complete dependency list is the right pattern
- Bottom-up build order works well in CD pipeline
- Config as shared foundation is correctly modeled

---

## Round 2 Transcripts

### expert-tla — Round 2

**Position:** Plan remains high-fidelity. Tier ordering defect and UNCHANGED gaps are blocking.

**Endorsements from others:**
- expert-cd T10 topological sort violation (CRITICAL)
- expert-cd file-level write conflicts
- expert-tdd UNCHANGED assertions (systematic gap)
- expert-tdd Step 4 ReviewVerdict timeout guards
- expert-edge-cases TddKeepGoingExhausted sticky counter
- expert-edge-cases shared keepGoingResets counter

**New Objections:**
1. GateTimeoutKeepGoing routing from fix states (reviewFix/finalReviewFix) not tested separately from review states
2. DiffBaseStale gateTimedOut reset creates new timeout window — not tested as fresh gate lifecycle
3. ReviewKeepGoing resets gateTimedOut — race with GateTimeoutKeepGoing when both conditions simultaneously satisfiable needs priority rule

**Corrections:**
- Own R1 objection #1 (Step 4 dependency): JSON is correct, markdown text needs fixing
- Own R1 objection #7 (NumTasks): Low-severity documentation gap, not structural
- expert-edge-cases MaxReviewRounds=0: Valid edge case but not a spec violation

---

### expert-tdd — Round 2

**Position:** CONDITIONAL PASS. Core objections stand, reinforced by cross-expert convergence.

**Endorsements from others:**
- expert-tla StartRunning no unit test
- expert-tla T4 dependency inconsistency
- expert-tla NumTasks not declared
- expert-edge-cases TddKeepGoingExhausted sticky counter
- expert-edge-cases MaxReviewRounds=0 boundary
- expert-edge-cases gate timeout during reviewFix
- expert-cd T10 tier violation
- expert-cd no intermediate integration tests

**New Objections:**
1. ReviewKeepGoing and GateTimeoutKeepGoing simultaneously satisfiable — implementation needs priority rule and test
2. DiffBaseStale preserves keepGoingResets and tddKeepGoingCount via UNCHANGED — not tested (staleness could silently expand budget if reset)

**Corrections:**
- Own R1 objection on Step 4 timeout guards: Should be directed at Step 5 (gate engine), not Step 4 (data model)
- expert-edge-cases verdict=NULL guard concern: Lower severity — TLA+ sets state and verdict atomically

---

### expert-edge-cases — Round 2

**Position:** Meaningful gaps confirmed. Counter preservation across DiffBaseStale is the most subtle untested interaction.

**Endorsements from others:**
- expert-tdd UNCHANGED assertions (most structurally important objection)
- expert-tla Step 4 dependency inconsistency
- expert-tla StartRunning no unit test
- expert-cd T10 tier violation
- expert-tdd Step 15 fix-state routing
- expert-tdd Step 5 too vague

**New Objections:**
1. DiffBaseStale preserves keepGoingResets — combined with shared counter, staleness re-review could immediately hit forced stop
2. Shared keepGoingResets cross-step interaction not tested (Step 9 and Step 15 test in isolation)
3. TddKeepGoingExhausted "sticky exhaustion" — second fix cycle immediately re-exhausts (only ReviewKeepGoing and GateTimeoutKeepGoing reset it)

**Corrections:**
- expert-tla NumTasks: TLA+ declares it as CONSTANT; the gap is that Step 1 config doesn't include it
- expert-cd file write conflicts: Only applies to same-tier tasks on same file; cross-tier is sequential

---

### expert-continuous-delivery — Round 2

**Position:** CONDITIONAL APPROVE with required fixes. T10 tier violation confirmed on re-examination.

**Endorsements from others:**
- expert-tla Step 4 dependency inconsistency
- expert-tla NumTasks not declared
- expert-tdd UNCHANGED assertions (critical)
- expert-tdd Step 4 ReviewVerdict timeout guards
- expert-edge-cases MaxReviewRounds=0 boundary
- expert-edge-cases shared keepGoingResets counter
- expert-edge-cases gate timeout during reviewFix

**New Objections:**
1. File write conflicts within Tier 5 (T7, T9, T12 all modify review-gate.ps1)
2. No rollback/cleanup strategy on HALTED for partially merged tasks
3. DiffBaseStale preserves tddKeepGoingCount — not tested
4. keepGoingResets preservation through DiffBaseStale → immediate forced stop if counter already maxed

**Corrections:**
- Initially retracted T10 objection, then re-confirmed it was correct
- expert-tla StartRunning: Valid but low severity

---

## Expert Final Positions with Endorsement Map

| Expert | Final Position | Key Endorsed Points |
|--------|---------------|-------------------|
| expert-tla | High-fidelity plan, 12 fixes needed | UNCHANGED (tdd), T10 tier (cd), sticky tddKeepGoingCount (edge), shared keepGoingResets (edge) |
| expert-tdd | Conditional pass, tests need specificity | StartRunning (tla), T10 tier (cd), sticky counter (edge), MaxReviewRounds=0 (edge) |
| expert-edge-cases | Meaningful gaps in counter interactions | UNCHANGED (tdd), Step 4 dep (tla), StartRunning (tla), T10 tier (cd), Step 5 vague (tdd) |
| expert-continuous-delivery | Conditional approve, tier fix required | Step 4 dep (tla), NumTasks (tla), UNCHANGED (tdd), timeout guards (tdd), MaxReviewRounds=0 (edge), shared keepGoingResets (edge) |

---

## Metadata

- **Date:** 2026-04-10
- **Experts selected:** expert-tla, expert-tdd, expert-edge-cases, expert-continuous-delivery
- **Experts excluded:** expert-a11y (pure backend), expert-atomic-design (no UI), expert-lodash (no utility library), expert-ddd (not domain modeling), expert-bdd (BDD is source artifact, not review focus), expert-performance (no performance-critical decisions)
- **Round count:** 2
- **Result:** CONSENSUS_REACHED
- **Consensus method:** No fundamental disagreements between experts; all objections are complementary and additive. Round 2 produced refinements of Round 1 themes, not new categories of concern.
