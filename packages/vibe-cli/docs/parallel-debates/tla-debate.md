# TLA+ Debate Session — Parallel Debates

**Date:** 2026-04-12
**Feature:** parallel-debates
**Artifact:** `docs/parallel-debates/tla/ParallelDebates.tla`
**Source:** `docs/parallel-debates/bdd.feature`
**Result:** CONSENSUS_REACHED
**Rounds:** 1
**Experts:** expert-tla, expert-bdd, expert-edge-cases, expert-tdd

---

## Synthesis

### Overall Assessment

The TLA+ specification captures the **core state machine** of the 7-stage pipeline well — parallel writer dispatch, failure isolation, the unified debate loop with objection routing, cumulative artifact preconditions, and resume/fresh entry modes. The `RequiredArtifacts`/`ProducedArtifacts` operators faithfully mirror the Resolve-PipelineState scenarios (BDD Item 8). Safety properties S2-S10 and liveness properties L1-L3 provide meaningful invariants.

However, all four experts identified **convergent gaps** in the spec. The spec operates at a protocol-abstraction level that omits several BDD-specified behaviors, and contains one modeling gap (consensus finalization) and one weak safety property (S1).

### Agreed Recommendation

Address the 7 objections below before proceeding to implementation. Priority 1 items represent behavioral gaps where the spec contradicts or omits BDD-described state transitions. Priority 2 items are abstraction-level gaps that should be documented as intentional omissions or modeled if the spec is meant to be comprehensive. Priority 3 items are correctly out of scope for TLA+ but should be noted in the spec's header comment.

---

## Priority 1 — Behavioral Gaps (fix in spec)

### 1. ConsensusFinalize Omits Final Per-Writer Recommendations
**Endorsed by:** expert-tla, expert-bdd, expert-tdd
**BDD source:** Item 3 — "Consensus reached triggers per-writer final recommendations" (lines 231-236)
**Issue:** BDD states that at `CONSENSUS_REACHED`, each writer receives a keyed recommendation and applies a **final revision** before the loop exits. The spec's `ConsensusFinalize` action (line 299) jumps directly from `consensus_reached` to producing `unified_debate` and advancing to stage 4, with no intermediate revision dispatch.
**Fix:** Add a `ConsensusRevision` action between `consensus_reached` verdict and stage exit. This action should dispatch both writers for a final revision (similar to `DispatchRevisions` but unconditional), collect results, then transition to stage 4.

### 2. Safety Property S1 (WritersIndependent) Is a Tautology
**Endorsed by:** expert-tla
**BDD source:** Item 1 — "neither writer receives the other writer's output" (line 44)
**Issue:** S1 (line 421-425) only asserts `"elicitor" \in artifacts` when a writer is running. This is already guaranteed by `ArtifactsValid(2)`. It does NOT assert that a running writer cannot observe the other's artifact. When `WriterSucceed("bdd")` fires, `"bdd_feature"` enters `artifacts` while `"tla"` may still be running — the invariant allows this.
**Fix:** Strengthen S1 to assert that while any writer `w` is running, the other writer's artifact is not in a "visible to w" set. Alternatively, add: `writerState[w] = "running" => ({"bdd_feature", "tla_spec"} \ ProducedArtifacts(w)) \cap artifacts = {}` — but this may be too restrictive since writers don't actually read `artifacts`. Document the modeling decision.

### 3. Consensus Permitted at MaxDebateRounds Contradicts BDD
**Endorsed by:** expert-edge-cases
**BDD source:** Item 3 — "Max debate rounds (10) reached with unresolved objections" (lines 238-244)
**Issue:** The BDD implies round 10 always exits without consensus ("the loop exits without consensus"). The spec's `ModeratorVerdict` allows `consensus_reached` at `debateRound = MaxDebateRounds` (lines 232-234 have no guard excluding it at max rounds). This means the spec permits a behavior the BDD may forbid.
**Fix:** Either (a) add guard `debateRound < MaxDebateRounds` to the consensus branch, or (b) confirm with the BDD that consensus IS allowed at round 10 (it would be strange to reject consensus just because it's the last round). If (b), update the BDD scenario wording to clarify.

---

## Priority 2 — Abstraction Gaps (model or document as intentional)

### 4. Resume Error Paths Unmodeled
**Endorsed by:** all 4 experts
**BDD source:** Item 7 — lines 438-475 (five distinct failure scenarios)
**Issue:** The BDD specifies resume failures for: missing pipeline.log, empty log, corrupted log, old 8-stage format, and `$Seed`/`-Resume` mutual exclusivity. The spec's `Init` resume branch (line 105) simply non-deterministically picks a valid resume point.
**Recommendation:** Add an `InitFail` initial state modeling resume failure, transitioning directly to `pipelineStage = 8` with `pipelineFailed = TRUE`. This would verify that invalid resume always terminates. Alternatively, document these as implementation-level validations outside the spec's abstraction boundary.

### 5. Invoke-Parallel Timeout Unmodeled
**Endorsed by:** expert-tla, expert-edge-cases, expert-tdd
**BDD source:** Item 2 — "Job exceeding timeout is terminated" (lines 158-167)
**Issue:** The spec has no notion of time. A hung writer relies on weak fairness to eventually complete. The BDD treats timeout as a first-class behavior with a specific error shape (`.Error contains "timed out"`).
**Recommendation:** Model timeout as a distinct failure outcome: add a `WriterTimeout(w)` action equivalent to `WriterFail(w)` but gated on a timeout flag. Or document that timeouts are modeled as non-deterministic failures (which they effectively are in the current spec).

### 6. TLC Verification Not Distinguished from Generic Writer Completion
**Endorsed by:** expert-tla, expert-bdd
**BDD source:** Item 1 line 62, Item 3 lines 219-223, Item 4 lines 295-300
**Issue:** The BDD describes TLC verification as an integral sub-process of the TLA+ writer, with "TLC check exhaustion" as a distinct failure mode. The spec treats all writer/revision completions identically via `WriterComplete` and `RevisionComplete`.
**Recommendation:** Either (a) add a `tlcState` variable tracking TLC verification within the TLA+ writer, or (b) document that TLC is abstracted as part of the writer's atomic succeed/fail outcome.

### 7. Artifact Preservation Should Be an Explicit Safety Property
**Endorsed by:** expert-edge-cases, expert-tdd
**BDD source:** Item 1 lines 70-71, 85-86; Item 4 lines 291-301, 310-315
**Issue:** The BDD repeatedly states that successful artifacts are "preserved on disk" when a sibling fails. The spec's `artifacts` set is monotonically growing (never shrinks), which implicitly guarantees preservation, but this is not stated as an explicit property.
**Fix:** Add safety property: `ArtifactPreservation == \A a \in artifacts : a \in artifacts'` (artifacts are never removed). This makes the implicit guarantee explicit and verifiable by TLC.

---

## Priority 3 — Out of Scope (document in spec header)

The following BDD behaviors are correctly outside the TLA+ spec's abstraction boundary. They should be listed in the spec's header comment as intentional omissions:

- **Item 2:** Invoke-Parallel utility internals (keyed result shapes, typed errors, mutex log writes)
- **Item 5:** Moderator JSON schema structure (target fields, recommendation keys, experts array)
- **Item 10:** Deleted files (old stage scripts removed)
- **Item 11:** Moderator agent prompt existence and wiring
- **Item 13:** Write-PipelineLog consolidation (single function definition, atomic writes)
- **Item 7 partial:** Parameter validation (-Stage/-Feature removed, $Seed required)
- **Item 6 partial:** Atomic file writes (temp file + Move-Item), Gherkin parse errors

---

## Round 1 — Expert Positions

### expert-tla

**Position:** The spec captures the core state machine well but has meaningful gaps — particularly S1 being tautological, the missing consensus-recommendation transition, and unmodeled resume error paths.

**Key Objections:**
1. S1 (WritersIndependent) is a tautology — it asserts `"elicitor" \in artifacts` which is already guaranteed by `ArtifactsValid(2)`. Does not enforce the actual isolation guarantee.
2. ConsensusFinalize skips the per-writer final recommendation/revision step described in BDD line 231-236.
3. Resume error scenarios (BDD lines 438-475) have no TLA+ coverage.
4. Invoke-Parallel timeout (BDD line 158-167) is unmodeled.
5. TLC verification within writer revisions is not distinguished from generic completion.

**Endorsements:**
- Artifact dependency chain (`RequiredArtifacts`/`ProducedArtifacts`) is thorough and correctly cumulative
- S10 (RevisionRoutingCorrect) directly models BDD objection routing
- Debate loop structure is well-designed with appropriate non-determinism
- S6 (MarkersOnlyForSuccess) cleanly enforces completion marker requirements
- Fairness applying WF only to success paths is appropriate

### expert-bdd

**Position:** The spec captures the structural backbone (~60% of BDD scenarios) but systematically omits implementation-level behaviors constituting ~40% of BDD scenarios, plus one modeling gap in consensus finalization.

**Key Objections:**
1. ConsensusFinalize omits the final per-writer recommendation/revision dispatch.
2. S3 is necessary but not sufficient — adequate structurally since `debateVerdict` is a single variable, but "no partial graduation" should be documented.
3. Resume error-path scenarios (five distinct modes) are outside the spec's abstraction.
4. TLC verification is invisible — writer completion is atomic, losing TLC-retry behavior.
5. Stage 4 validation edge cases (invalid Gherkin, atomic writes) are too detailed for the spec.

**Endorsements:**
- `FailureIsolation` (S2) and `Stage2Finish` correctly model writer failure scenarios
- `RevisionRoutingCorrect` (S10) precisely captures objection routing
- `MaxRoundsFinalize` correctly proceeds to stage 4 with current versions
- `RoundFinish` properly resets state between rounds
- L3 (DebateTerminates) provides useful assurance

### expert-edge-cases

**Position:** The spec handles concurrency and basic failures well but leaves operationally risky scenarios — timeout, log corruption, resume edge cases, and the MaxDebateRounds boundary — entirely unmodeled.

**Key Objections:**
1. Timeout not modeled — BDD line 157-167 treats timeout as distinct error shape.
2. Log corruption / concurrent writes not modeled — BDD line 150-155 specifies mutex serialization.
3. Resume edge cases incomplete — four distinct failure modes have no spec coverage.
4. Old 8-stage log migration (BDD lines 471-476) missing from spec.
5. Artifact preservation not captured as explicit safety property.
6. Consensus at MaxDebateRounds boundary — spec allows consensus at round 10, BDD implies exit without consensus.
7. Fairness asymmetry — WF on WriterSucceed but not WriterFail (analyzed as sound but notable).
8. `entryMode` immutability not enforced by any safety property.

**Endorsements:**
- Artifact precondition chain is thorough and cumulative
- S10 precisely captures objection routing
- Stage2Finish correctly waits for both writers
- Debate loop structure is well-decomposed

### expert-tdd

**Position:** Strong structural coverage of happy paths and stage ordering, but significant gaps in consensus-recommendation flow, artifact integrity guarantees, and failure mode modeling.

**Key Objections:**
1. Consensus-then-recommendation flow missing — no intermediate revision at consensus.
2. Atomic write guarantees unmodeled — BDD specifies temp-file patterns and mutex locks.
3. Invoke-Parallel timeout absent — BDD makes timeout a first-class behavior.
4. Revision failure preserving prior versions unverifiable — `artifacts` doesn't track versioning.
5. Resume error paths unmodeled — five distinct scenarios have no spec coverage.

**Endorsements:**
- S3 correctly captures "consensus means zero objections"
- S9 correctly asserts stage 2 success implies both artifacts exist
- Cumulative artifact validation faithfully mirrors Resolve-PipelineState
- L3 + S5 provide strong debate termination guarantee

---

## Endorsement Map

| Point | Endorsed By |
|-------|------------|
| ConsensusFinalize missing recommendations | expert-tla, expert-bdd, expert-tdd |
| Resume error paths unmodeled | expert-tla, expert-bdd, expert-edge-cases, expert-tdd |
| Timeout unmodeled | expert-tla, expert-edge-cases, expert-tdd |
| TLC verification invisible | expert-tla, expert-bdd |
| Artifact dependency chain is sound | expert-tla, expert-bdd, expert-edge-cases, expert-tdd |
| S10 (RevisionRoutingCorrect) is precise | expert-tla, expert-bdd, expert-edge-cases |
| Debate loop structure is well-designed | expert-tla, expert-bdd, expert-edge-cases |
| Fairness conditions are appropriate | expert-tla, expert-tdd |
| S1 is tautological | expert-tla |
| Consensus at MaxDebateRounds boundary | expert-edge-cases |
| Artifact preservation needs explicit property | expert-edge-cases, expert-tdd |

---

## Metadata

- **Date:** 2026-04-12
- **Experts selected:** expert-tla, expert-bdd, expert-edge-cases, expert-tdd
- **Selection rationale:** TLA+ domain (primary artifact), BDD domain (reference artifact), edge case hunting (gap analysis), TDD (property coverage analysis). A11y excluded (no UI). DDD, atomic-design, lodash, performance excluded (not relevant).
- **Round count:** 1
- **Result:** CONSENSUS_REACHED
- **Consensus basis:** All four experts converged on the same core gaps with no contradictions. Cross-expert objection overlap was high (3 of 7 unique objections raised by 3+ experts). No expert disputed another's findings.
