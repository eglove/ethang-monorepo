# Implementation Plan Debate Session — Parallel Debates

**Date:** 2026-04-12
**Feature:** parallel-debates
**Artifact Under Review:** `docs/parallel-debates/implementation-plan.md`
**Reference Spec:** `docs/parallel-debates/tla/ParallelDebates.tla`
**Result:** CONSENSUS_REACHED
**Rounds:** 3
**Experts:** expert-tla, expert-tdd, expert-edge-cases, expert-continuous-delivery

---

## Synthesis

### Overall Assessment

The implementation plan is **structurally sound** — all 13 TLA+ state variables, 24 named transitions, 13 safety invariants, and 4 liveness properties are mapped to implementation steps. The 5-tier execution model correctly orders most dependencies and the TDD-first approach is viable. However, the plan has **critical gaps in the translation layer** between the formal specification and PowerShell runtime reality, and the tier structure has hidden atomicity constraints that make incremental deployment unsafe as described.

All four experts conditionally approved the plan, identifying **convergent must-fix items** that should be resolved before coding begins. No architectural restructuring is needed — the fixes are targeted amendments to the existing 12-step plan.

### Agreed Recommendation

Apply the amendments below to the implementation plan before dispatching coding agents. The plan's architecture, step ordering, and test-first methodology are correct. The gaps are in cross-step consistency, deployment atomicity, and runtime assumptions that the TLA+ spec correctly abstracts away but the implementation must handle.

---

## Priority 1 — Must Fix Before Coding

### 1. Resume-Pipeline Marker Format Migration
**Endorsed by:** all 4 experts
**Round:** 1 (Edge #3, CD #8), refined in Round 2
**Issue:** Current `Resume-Pipeline` (resume.ps1 line 27) searches for `"Stage $s complete"` but the plan specifies `STAGE_COMPLETE:<N>:<feature>` markers. Feature name detection uses `'PIPELINE START.*feature=(\S+)'` but vibe.ps1 writes `seed=` not `feature=`. These are three separate regex mismatches that will make `-Resume` non-functional.
**Fix:** Step 9 must explicitly call out: (a) updating the stage-detection regex to match `STAGE_COMPLETE:<N>:`, (b) updating feature-name detection to extract from completion markers (not PIPELINE START), (c) define the marker format as a shared constant/regex, not duplicated string literals across files.

### 2. Stage 1 Marker Ownership Orphaned
**Endorsed by:** TLA, TDD, Edge, CD
**Round:** 1 (TLA #1), endorsed Round 2
**TLA+ ref:** `Stage1Succeed` lines 160-169, `completionMarkers' = completionMarkers \cup {1}`
**Issue:** No implementation step claims ownership of updating stage 1 to emit `STAGE_COMPLETE:1:<feature>`. BDD Item 7 line 479-483 requires it. The plan says "stage 1 is unchanged" but the marker format IS changing.
**Fix:** Either add a sub-task to Step 1 (Write-PipelineLog) or Step 10 (wiring) that updates `1-elicitor.ps1` to write the new marker format.

### 3. T4 Dependency Contradiction
**Endorsed by:** TDD, CD
**Round:** 2 (TDD N4, CD N3)
**Issue:** Step 4 description says "Dependencies: None" but the Task Assignment Table lists T4 as depending on T1. `Resolve-PipelineState` is a pure validation function that never calls `Write-PipelineLog`. The spurious dependency blocks parallel test development.
**Fix:** Remove T4's dependency on T1 in the task table. T4 has zero dependencies and belongs in Tier 1.

### 4. Step 10 Decomposition
**Endorsed by:** TDD, CD, TLA
**Round:** 2 (TDD N1, CD N1), endorsed Round 3
**Issue:** Step 10 conflates 7 distinct operations: renaming 3 stage files, rewiring vibe.ps1 dispatch, adding inter-stage validation for fresh runs, updating dot-source paths, removing inline fixture generation, updating all stage markers, and testing sequential ordering. This is a monolith that blocks incremental delivery and creates an untestable mega-test file.
**Fix:** Decompose Step 10 into: (a) Stage file creation/renaming (testable in isolation), (b) vibe.ps1 rewiring (testable with old files still present), (c) inter-stage validation for fresh runs (a behavioral change that needs its own test). Split `stage-renumbering.Tests.ps1` accordingly.

### 5. ConsensusRevision Failure Recovery Path
**Endorsed by:** all 4 experts
**Round:** 1 (TLA #3), deepened Round 2 (Edge N1)
**TLA+ ref:** `ConsensusFinalize` lines 368-373, `UNCHANGED <<artifacts, completionMarkers>>` on failure
**Issue:** When one consensus revision succeeds and the other fails, the pipeline terminates (correct), but one artifact is consensus-revised while the other is not. On resume, stage 3 replays against a mixed-state artifact set. The plan has no scenario, test, or recovery strategy for this.
**Fix:** Add to Step 6: (a) a test that simulates one consensus revision failing and verifies the pipeline terminates without writing STAGE_COMPLETE:3 or unified-debate.md, (b) document the design decision — either accept the asymmetry (the re-run debate will reconcile) or write consensus revisions to temp files and atomic-swap only when both succeed.

### 6. unified-debate.md Must Be Produced on Max-Rounds Path
**Endorsed by:** Edge, TDD, TLA
**Round:** 2 (Edge N5)
**TLA+ ref:** `MaxRoundsFinalize` line 394, `artifacts' = artifacts \cup {"unified_debate"}`
**Issue:** The TLA+ spec produces `unified_debate` on both `ConsensusFinalize` success and `MaxRoundsFinalize`. But the BDD and plan only explicitly describe `unified-debate.md` at consensus. If the implementation only writes it at consensus, the max-rounds path will fail `Resolve-PipelineState` at stage 4.
**Fix:** Add a test to Step 6: "When the debate exits at max rounds, Then unified-debate.md is written containing the full debate history including unresolved objections."

### 7. PowerShell Job Scope Isolation
**Endorsed by:** Edge, CD
**Round:** 1 (Edge #11), endorsed Round 2
**Issue:** `Invoke-Parallel` runs scriptblocks as PowerShell jobs. Jobs do NOT inherit the caller's variables, functions, or dot-sourced modules. `Write-PipelineLog`, `Invoke-Claude`, `$PipelineLogFile`, and any utility functions are unavailable inside jobs unless explicitly passed or re-imported. The plan does not address this.
**Fix:** Step 2 (Invoke-Parallel) must specify how job scriptblocks receive their dependencies — either via `-ArgumentList`, `-InitializationScript`, or by dot-sourcing required modules inside each job. Step 5 tests should verify that the writer scriptblocks can access the functions they need.

### 8. T1 Write-PipelineLog Caller Breakage
**Endorsed by:** CD, TDD, Edge
**Round:** 1 (CD #1), endorsed Round 2
**Issue:** Current vibe.ps1 and stage scripts use `Write-PipelineLog -Color Cyan/Green/Red` extensively. Removing `-Color` in Step 1 breaks all callers. The plan says "All callers that used -Color are updated" but Step 1's file list only modifies `pipeline-log.ps1` and `config.ps1`.
**Fix:** Either (a) make `-Color` a no-op parameter that is accepted but ignored (backward compatible), or (b) expand Step 1's file list to include all caller updates (vibe.ps1, all stage scripts) in the same step.

---

## Priority 2 — Should Fix Before or During Implementation

### 9. TLA+ Fairness Missing WF_vars(RoundFinish)
**Endorsed by:** TLA, Edge
**Round:** 2 (TLA N3)
**TLA+ ref:** `Fairness` lines 478-496
**Issue:** `RoundFinish` handles the debate-failure exit path. Without weak fairness on it, TLC cannot verify L3 (DebateTerminates) when revisions fail. If all revisions complete (some failed) and `RoundFinish` is the only enabled action, the spec permits infinite stuttering.
**Fix:** Add `WF_vars(RoundFinish)` to the Fairness condition in the TLA+ spec.

### 10. Init Artifact Equality Semantics
**Endorsed by:** TLA, Edge
**Round:** 2 (TLA N1)
**TLA+ ref:** `Init` lines 135-136
**Issue:** The spec's resume Init branch defines `artifacts = UNION {ProducedArtifacts(s) : s \in 1..(resumeStage - 1)}` (exact equality). The implementation's `Resolve-PipelineState` checks subset containment (required artifacts exist). This permits states the spec forbids (extra artifacts from partial runs).
**Fix:** Add a comment to the TLA+ spec acknowledging this is an abstraction: "Extra artifacts from partial runs are permitted; exact-equality here models the minimum required set."

### 11. pipelineFailed Has No Runtime Representation
**Endorsed by:** TLA, TDD, CD
**Round:** 1 (TLA #2)
**TLA+ ref:** `pipelineFailed \in BOOLEAN` line 84
**Issue:** The TLA+ variable is set on every failure path but no PowerShell construct carries this flag. The plan's State Coverage Audit claims coverage, but tests cannot assert on something that doesn't exist at runtime.
**Fix:** Either (a) acknowledge that `pipelineFailed` maps to exception flow (throw/catch) and update the audit to say so, or (b) introduce a `$PipelineResult` object with a `.Failed` property.

### 12. Fixture Path Inconsistency
**Endorsed by:** TDD
**Round:** 2 (TDD N3)
**Issue:** BDD specifies `fixtures/<feature>/bdd/fixture.json`. Existing `Get-FixtureDir` returns `fixtures/<feature>` and `Test-FixturePrecondition` looks for `bdd.json` directly. The plan reuses existing utilities but the path doesn't match.
**Fix:** Reconcile the path in Step 8 and ensure `Resolve-PipelineState` (Step 4) validates the same path the writer produces.

### 13. No Canary Gate Between Tier 3 and Tier 4
**Endorsed by:** CD, Edge
**Round:** 2 (CD N2)
**Issue:** Tier 4 rewires the entire pipeline. No intermediate verification that new stages 2-4 work in isolation before the old pipeline is torn down.
**Fix:** Add a gate between Tier 3 and Tier 4: run new stages 2-4 against a test feature directory using `Resolve-PipelineState`, proving they produce correct artifacts before touching vibe.ps1.

### 14. Shared Test Helper Module
**Endorsed by:** CD, TDD
**Round:** 2 (CD N5)
**Issue:** 10+ new test files each need to set up feature directories, mock `Invoke-Claude`, create artifact files, and dot-source utilities. Without a shared helper, each re-implements scaffolding.
**Fix:** Add a sub-task to Tier 1: create `tests/helpers/TestSetup.psm1` with common fixtures and mock setup.

### 15. unified-debate.md Content Format Test
**Endorsed by:** TDD, Edge
**Round:** 2 (TDD N2)
**Issue:** Step 6 tests that `unified-debate.md` is produced but never asserts its structure. Stage 5 (implementation writer) must parse it. If the format is unpredictable, downstream consumption is brittle.
**Fix:** Add a test asserting at minimum: section headers per round, expert attribution, and objection/endorsement markers.

### 16. Artifact Versioning Within Stage 3 (Spec Modeling Limitation)
**Endorsed by:** TLA, Edge
**Round:** 2 (TLA N2)
**TLA+ ref:** `RevisionComplete` lines 294-302, `UNCHANGED artifacts`
**Issue:** The spec's `artifacts` set is never updated during debate revisions, so it cannot model that `bdd.feature` on disk changes between rounds. On resume, the spec reconstructs pristine artifacts but the filesystem has mid-debate versions.
**Fix:** Document in the TLA+ spec header that artifact versioning within a stage is intentionally unmodeled. The "replay entire stage" resume strategy (BDD line 271-277) is the implementation's mitigation.

### 17. MaxDebateRounds Parameterization
**Endorsed by:** TLA, TDD, CD
**Round:** 1 (TLA #5)
**Issue:** BDD glossary says "default: 10" implying configurability. Step 6 hardcodes assertions against 10 rounds, making tests slow and brittle. TLA+ declares it as a CONSTANT.
**Fix:** `Invoke-UnifiedDebateLoop` should accept `-MaxRounds` with default 10. Tests inject a smaller value (e.g., 3) for speed.

### 18. Tiers 3-4 Require Atomic Deployment
**Endorsed by:** CD, Edge, TDD
**Round:** 1 (CD #3), refined Round 2
**Issue:** New stage scripts (`2-parallel-writers.ps1`) can't coexist with old scripts (`2-bdd-writer.ps1`) that define conflapping functions. Tiers 3 and 4 must ship atomically.
**Fix:** Acknowledge in the plan that Tiers 3-4 tasks can be DEVELOPED in parallel (by different agents) but must be MERGED atomically via a single integration commit in Step 10.

---

## Priority 3 — Document or Address During Implementation

### 19. S1 (WritersIndependent) Test Is Weaker Than Invariant
**Endorsed by:** TLA, TDD
**Issue:** Test says "neither writer receives other's output" but spec asserts dispatch-time isolation (a running writer's visible artifact set excludes co-writer output). The test should verify scriptblock arguments, not just global artifact absence.

### 20. S11 (ArtifactPreservation) Lacks Dedicated Regression Test
**Endorsed by:** TDD, TLA
**Issue:** Only verified by E2E (Step 12). Add a targeted test: create round-2 artifacts, simulate round-3 failure, verify round-2 files survive.

### 21. Liveness Tests Lack Timeout Bounds
**Endorsed by:** TLA, TDD
**Issue:** L1-L4 are temporal properties but E2E tests describe only reachability assertions. Add explicit timeout-bounded assertions.

### 22. Multiple-Feature Log Disambiguation Without Timestamps
**Endorsed by:** Edge
**Issue:** "Most recent" feature uses last-in-file ordering. Concurrent pipeline runs (unsupported) could interleave markers.
**Fix:** Document that concurrent runs are unsupported, or add timestamps to markers.

### 23. RoundFinish/S13 Single-Guard TypeOK Defense
**Endorsed by:** TLA, Edge
**Issue:** Only `debateRound < MaxDebateRounds` on the partial_consensus branch prevents `debateRound` from exceeding `MaxDebateRounds`. Add a comment to the TLA+ spec documenting this guard's criticality.

### 24. Moderator Schema Conflict with Existing Invoke-DebateLoop
**Endorsed by:** Edge
**Issue:** The unified debate schema has `recommendation` as an object with `bdd`/`tla` keys. Stage 6 reuses existing `Invoke-DebateLoop` which expects `recommendation` as a plain string. Ensure a separate schema constant.

---

## Round-by-Round Transcript

### Round 1

#### expert-tla
**Position:** Thorough mapping with gaps in marker ownership, runtime representation of pipelineFailed, consensus revision negative tests, resume Init-branch verification, MaxDebateRounds parameterization, liveness test bounds, S1 invariant strength, and RoundFinish/S13 interaction.
**Objections:** 8
**Key Endorsements:** Cumulative artifact validation (Step 4), consensus revision 4-action sequence (Step 6), failure isolation dual-level testing, tiered dependency structure, S10 objection routing, S13 defense-in-depth.

#### expert-tdd
**Position:** Strong behavioral intent but weak Pester-level specificity in ~1/3 of steps. Integration tests masquerade as unit tests in Steps 5-7. Coverage claim approximately correct but S1, S11, L4 are weak.
**Objections:** 10
**Key Endorsements:** Invoke-Parallel error shape (Step 2) strongest test spec, Resolve-PipelineState cumulative validation (Step 4), tier ordering sound, BDD debate objections visibly incorporated, resume failure modes comprehensive, ConsensusRevision actions have test counterparts.

#### expert-edge-cases
**Position:** Architecturally sound but critical gaps at formal-model-to-implementation boundary — mutex scope, consensus revision artifacts, resume format migration, dirty artifacts, tier dependencies, rollback, schema conflicts, empty files, job scope isolation.
**Objections:** 13
**Key Endorsements:** Cumulative artifact validation, failure isolation in Stage 2, S13 as first-class property, unified debate moderator schema design, S10 tightness, BDD debate catching Resolve-PipelineState confusion.

#### expert-continuous-delivery
**Position:** Well-architected at specification level but structurally unsound for incremental delivery. Tiers 1-3 cannot be merged independently. Big-bang change disguised as tiered work.
**Objections:** 8
**Key Endorsements:** TLA+ spec quality, BDD debate gap analysis, completion marker design, failure isolation, Invoke-Parallel typed contract, unified debate moderator schema.

### Round 2

#### expert-tla
**New Objections:** 3 (Init exact-vs-subset artifacts, artifacts not updated during revisions, Fairness missing WF_vars(RoundFinish))
**Endorsed:** Edge #4 (dirty artifacts on resume), Edge #8 (timeout truncated artifacts), Edge #10 (empty files), Edge #12 (MaxDebateRounds boundary), CD #1 (T1 breaks callers), CD #3 (atomic tier collapse), CD #6 (fresh-run validation), TDD #2 (S11 no regression test), TDD #3 (L4 no test), Edge #13/CD #8 (feature name regex)
**Withdrawn:** R1 #1 (stage 1 marker — reassessed), R1 #5 (MaxDebateRounds parameterization — out of scope per elicitor)

#### expert-tdd
**New Objections:** 4 (Step 10 mega-test, unified-debate.md content format, fixture path inconsistency, T4 dependency contradiction)
**Endorsed:** TLA #1 (stage 1 marker), TLA #2 (pipelineFailed), TLA #5 (MaxDebateRounds), TLA #8 (RoundFinish/S13), Edge #2 (consensus revision artifacts), Edge #10 (empty files), Edge #13 (feature regex), CD #1 (T1 breaks callers), CD #3 (atomic collapse), CD #6 (fresh-run validation), CD #8 (feature name defect)
**Withdrawn:** R1 #7 (subsumed by N1), R1 #8 (BDD prescribes atomic write), R1 #10 (concurrent writes testable)

#### expert-edge-cases
**New Objections:** 5 (ConsensusRevision half-failure, RoundFinish/TypeOK guard, marker format mismatch, multi-feature log ordering, unified-debate.md in max-rounds path)
**Endorsed:** TLA #1 (stage 1 marker), TLA #5 (MaxDebateRounds), TLA #8 (RoundFinish/S13), TDD #1 (S1 assertion), TDD #4 (return contract), TDD #9 (fresh-run validation), CD #1 (T1 callers), CD #3 (atomic collapse), CD #7 (test-before-delete), CD #8 (feature name)
**Withdrawn:** R1 empty files (implementation concern), R1 feature name regex (captured more precisely as wiring defect)

#### expert-continuous-delivery
**New Objections:** 5 (Step 10 monolith, no canary gate, T4 dependency contradiction, coexistence window, test file proliferation)
**Endorsed:** TLA #1 (stage 1 marker), TLA #2 (pipelineFailed), TLA #5 (MaxDebateRounds), TDD #4 (return contract), TDD #9 (fresh-run test), Edge #3 (resume format migration), Edge #5 (tier compile-time deps), Edge #11 (job scope globals), Edge #13 (feature regex)
**Withdrawn:** R1 #8 (feature name defect — subsumed by Edge #13 endorsement)

### Round 3

All four experts: **"No new objections."** Consensus reached.

#### expert-tla — Final Position
Conditionally acceptable. Must-fix: marker regex alignment, WF_vars(RoundFinish), Init artifact semantics, T4 dependency. Should-fix: Step 10 decomposition, ConsensusRevision failure guard, unified-debate.md on max-rounds path. Accept as-is: artifact immutability within stage (document), job scope isolation (runtime concern).

#### expert-tdd — Final Position
Conditionally acceptable. Five prerequisites: Step 10 decomposition, unified-debate.md content format tests, fixture path consistency, T4 dependency ordering, artifact versioning documentation. Core architecture sound; gaps are in test specification granularity and cross-step consistency.

#### expert-edge-cases — Final Position
Conditionally acceptable. Three prerequisites: ConsensusRevision partial-failure recovery strategy, unified-debate.md on all exit paths, marker format as shared constant. Most dangerous gap is resume/marker wiring (three separate defects combine to make -Resume non-functional).

#### expert-continuous-delivery — Final Position
Conditionally acceptable. Three prerequisites: Step 10 decomposition into incremental commits, canary gate between Tier 3 and Tier 4, T4 dependency resolution. Tiers 3-4 must be acknowledged as requiring atomic merge.

---

## Endorsement Map

| Point | Endorsed By |
|-------|------------|
| Resume-Pipeline marker format migration | TLA, TDD, Edge, CD |
| Stage 1 marker ownership orphaned | TLA, TDD, Edge, CD |
| ConsensusRevision failure path | TLA, TDD, Edge, CD |
| T1 Write-PipelineLog breaks callers | TDD, Edge, CD |
| Tier 3-4 atomic deployment | TDD, Edge, CD |
| Step 10 decomposition | TDD, CD, TLA |
| T4 dependency contradiction | TDD, CD |
| PowerShell job scope isolation | Edge, CD |
| unified-debate.md on max-rounds path | TLA, TDD, Edge |
| MaxDebateRounds parameterization | TLA, TDD, CD |
| Fresh-run inter-stage validation | TDD, CD, TLA |
| pipelineFailed runtime representation | TLA, TDD, CD |
| S11 ArtifactPreservation regression test | TLA, TDD |
| TLA+ Fairness missing WF_vars(RoundFinish) | TLA, Edge |
| Init artifact equality semantics | TLA, Edge |
| Artifact versioning within stage (document) | TLA, Edge |
| S1 test weaker than invariant | TLA, TDD |
| Canary gate Tier 3 → Tier 4 | CD, Edge |
| Shared test helper module | CD, TDD |
| unified-debate.md content format test | TDD, Edge |
| Fixture path inconsistency | TDD |
| Moderator schema conflict | Edge |

---

## Metadata

- **Session file:** `docs/parallel-debates/impl-debate.md`
- **Debate duration:** 3 rounds
- **Expert count:** 4
- **Total unique objections raised:** ~39 across all rounds (R1: 39, R2: 17 new, R3: 0)
- **Objections withdrawn:** 8
- **Priority 1 items:** 8 (must-fix before coding)
- **Priority 2 items:** 10 (should-fix during implementation)
- **Priority 3 items:** 6 (document or address as encountered)
- **Result:** CONSENSUS_REACHED — all experts conditionally approve pending Priority 1 amendments
