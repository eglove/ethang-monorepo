# BDD Debate Session — Parallel Debates

**Date:** 2026-04-12
**Feature:** parallel-debates
**Artifact:** `docs/parallel-debates/bdd.feature`
**Source:** `docs/parallel-debates/elicitor.md`
**Result:** CONSENSUS_REACHED
**Rounds:** 3
**Experts:** expert-bdd, expert-edge-cases, expert-tdd, expert-continuous-delivery

---

## Synthesis

### Overall Assessment

The BDD scenarios are **well-structured and thorough**, covering 12 Features with 69 scenarios across parallel writers, unified debate, error handling, moderator schema, post-debate artifacts, resume, state validation, wiring, deleted files, and end-to-end flow. The glossary establishes ubiquitous language upfront (a BDD best practice). Scenarios are declarative, testable, and avoid implementation leakage.

All four experts conditionally approved the scenarios, identifying **16 actionable gaps** organized into 3 priority tiers below.

### Agreed Recommendation

Address the gaps below before implementation. The BDD scenarios faithfully translate the elicitor briefing — including one **logic error inherited from the elicitor** (Resolve-PipelineState stage 4 input/output confusion). Fix both the elicitor and BDD together.

---

## Priority 1 — Blocking (fix before implementation)

### 1. Resolve-PipelineState Input/Output Confusion (CD-R2-2)
**Endorsed by:** all 4 experts
**Issue:** BDD Item 8 says "Stage 4 requires fixture JSON" but stage 4 *creates* fixture JSON. This is a logic error carried from the elicitor. Resolve-PipelineState should validate a stage's *inputs* (artifacts from prior stages), not its own *outputs*.
**Fix:** Stage 4 validation should check for `bdd.feature` + `.tla` files (stage 3 outputs). Stage 5+ should check for fixture JSON. Update both elicitor and BDD.

### 2. Invoke-Parallel Error Result Shape (T1)
**Endorsed by:** all 4 experts
**Issue:** BDD Item 2 says "the result for alpha contains the error information" but never specifies the shape. Is it an `ErrorRecord`? A hashtable with an `Error` key? A string? Consumers cannot branch on success vs. failure without a defined contract.
**Fix:** Add a scenario specifying the observable error result shape (e.g., `$results["alpha"].Error` contains the exception message).

### 3. Invoke-UnifiedDebateLoop Return Contract (T2)
**Endorsed by:** all 4 experts
**Issue:** BDD Item 3 describes what the loop *does* but never what it *returns* to stage 3. Stage 4 needs to know whether consensus was reached. The existing `Invoke-DebateLoop` returns the moderator's parsed JSON, but the unified version has a different schema.
**Fix:** Add a scenario specifying the return object shape and what stage 3 passes to stage 4.

### 4. Stage Completion Markers Not Specified (R1)
**Endorsed by:** BDD, TDD, CD
**Issue:** Resume depends on log markers like "Stage N complete", but no scenario says stages WRITE these markers. Without this, resume cannot function.
**Fix:** Add scenarios: "When stage N completes successfully, Then pipeline.log contains a 'Stage N complete' marker."

---

## Priority 2 — High (add scenarios before or during implementation)

### 5. `-Resume` and `$Seed` Mutual Exclusivity
**Endorsed by:** BDD, Edge Cases, TDD
**Issue:** No scenario tests `./vibe.ps1 'Build auth' -Resume`. The briefing defines two mutually exclusive modes but the error behavior is unspecified.
**Fix:** Add: "Given the user runs `./vibe.ps1 'seed' -Resume`, Then parameter validation fails with an error."

### 6. Resume with Missing/Corrupted pipeline.log
**Endorsed by:** all 4 experts
**Issue:** Item 7 scenarios assume pipeline.log has valid content. No scenario for: (a) log doesn't exist, (b) log is empty, (c) log has malformed entries.
**Fix:** Add 2-3 scenarios for resume failure modes when log is missing/empty/corrupted.

### 7. Resume with Multiple Features in Log
**Endorsed by:** Edge Cases, TDD, CD
**Issue:** If pipeline.log contains completion markers for multiple features, which does Resume-Pipeline pick? Behavior unspecified.
**Fix:** Add a scenario clarifying disambiguation behavior.

### 8. Cumulative Resolve-PipelineState Validation
**Endorsed by:** BDD, CD
**Issue:** The elicitor uses "Stage N+" notation (cumulative), but BDD scenarios test each stage's artifacts in isolation. Stage 3 should also validate `elicitor.md` exists, stage 4 should validate bdd.feature + .tla, etc.
**Fix:** Add cumulative validation scenarios or a single scenario asserting cumulative behavior.

### 9. unified-debate.md Not Validated for Stage 5
**Endorsed by:** BDD, CD
**Issue:** Stage 5 (implementation writer) reads `unified-debate.md`, but Resolve-PipelineState for stage 5 only checks `implementation-plan.md` and `.json`. If `unified-debate.md` is deleted, resume at stage 5 proceeds with missing context.
**Fix:** Add `unified-debate.md` to stage 5 validation.

### 10. Stages 6-7 Validation Too Vague
**Endorsed by:** TDD, Edge Cases
**Issue:** "Stage 6 requires implementation debate output" and "Stage 7 requires logs directory" lack specific artifact paths. Implementers must guess.
**Fix:** Specify exact filenames as done for stages 2-5.

### 11. Log Write / File Output Race (E16)
**Endorsed by:** all 4 experts
**Issue:** `Write-PipelineLog` uses `Add-Content` without locking. Parallel jobs (Invoke-Parallel) can call it simultaneously, causing interleaved/corrupted log lines.
**Fix:** Add a scenario or design note specifying log write ordering or locking for parallel stages.

### 12. Debate Round Counter Not Persisted (CD-R2-4)
**Endorsed by:** all 4 experts
**Issue:** If the pipeline crashes mid-debate and resumes, the round counter resets to 1, granting a fresh 10-round budget. The max-rounds invariant is violated across crashes.
**Fix:** Add a scenario making this an explicit design decision (either "resume replays entire stage" or "round counter is persisted").

### 13. Write-PipelineLog Signature Mismatch (CD-R2-1)
**Endorsed by:** all 4 experts
**Issue:** Two `Write-PipelineLog` definitions exist: `pipeline-log.ps1` (`$Message, $Root`) and `config.ps1` (`$Message, $Color`). Codebase uses the `-Color` version. Collision depends on dot-source order.
**Fix:** Consolidate to one definition. Not a BDD scenario gap per se, but a codebase defect that affects all logging scenarios.

---

## Priority 3 — Consider (address if time permits)

### 14. Invoke-Parallel Timeout/Hang
**Endorsed by:** Edge Cases, CD
**Issue:** No timeout contract for parallel jobs. A hung Claude invocation blocks the pipeline indefinitely.
**Fix:** Consider adding a timeout parameter to Invoke-Parallel with a scenario for timeout behavior.

### 15. Old 8-Stage Log Migration
**Endorsed by:** Edge Cases, CD
**Issue:** Users with pipeline.log from old 8-stage runs who upgrade and run `-Resume` get wrong stage mapping.
**Fix:** Add a scenario for backward compatibility or version-gating.

### 16. No Fresh-Run Health Check Between Stages (CD-R2-3)
**Endorsed by:** Edge Cases, CD (rejected by BDD as gold-plating)
**Issue:** Resolve-PipelineState only runs on resume. Fresh runs pass garbage artifacts forward without validation.
**Fix:** Consider adding inter-stage validation for fresh runs, or document why it's unnecessary.

---

## Rejected Objections

| Objection | Raised By | Rejected By | Reason |
|---|---|---|---|
| E17: Claude model refusal as distinct failure mode | Edge Cases | Edge Cases (self-withdrew), BDD | Generic failure handling already covers this; BDD tests behavior not failure taxonomy |
| B2: Writer full capitulation path | BDD | BDD (self-withdrew), TDD | Full capitulation is just consensus with empty objections — already covered |
| Concurrent pipeline runs / file locking | Edge Cases | BDD | Infrastructure concern, not behavioral specification |
| T3: ConvertFrom-Gherkin intermediate failure | TDD | BDD | Stage 4 tests observable outcome (fixture produced or error), not internal call chain |
| T4: Parallel revision synchronization contract | TDD | BDD | Already specified by "waits for both" + Invoke-Parallel's job collection |

---

## Endorsement Map

### Strongest Endorsements (all 4 experts)
- Item 1 (parallel writers): all failure permutations covered
- Item 3 (unified debate loop): strongest section — 9 focused, independently testable scenarios
- Item 9 (wiring verification): directly addresses CRITICAL requirement from elicitor
- Item 12 (end-to-end flow): artifact handoff chains correctly traced
- Glossary (lines 5-27): excellent ubiquitous language definition

### Cross-Expert Endorsements
- **BDD endorsed TDD:** Stages 6-7 vagueness, Item 11 untestable scenarios
- **BDD endorsed CD:** Stage completion markers, idempotency
- **Edge Cases endorsed CD:** Idempotency, rollback/retry contract, cumulative validation
- **TDD endorsed Edge Cases:** Log/file race, Invoke-Parallel timeout
- **CD endorsed BDD:** Cumulative validation, unified-debate.md gap
- **CD endorsed TDD:** Return contract gaps (T1, T2)

---

## Round-by-Round Transcript

### Round 1

#### expert-bdd
**Position:** Thorough and well-structured, covering the briefing with strong fidelity. A few gaps warrant revision.
**Objections:** (8) Cumulative validation, resume with no log, corrupted log, Seed+Resume conflict, stage 4 chicken-and-egg, unified-debate.md gap, consensus revision assumption, Gherkin anti-patterns in titles
**Endorsements:** Glossary, Item 1 failure permutations, Item 3 strongest section, Item 9 wiring, Item 12 e2e, Item 2 isolation

#### expert-edge-cases
**Position:** Solid happy-path coverage but missing ~15 edge cases around corruption, concurrency, parameter conflicts, and migration.
**Objections:** (15) Seed+Resume, resume failures (3 sub-cases), old 8-stage log, malformed JSON, invalid target, empty files, TLC trivially correct, concurrent runs, timeout/hang, contradictory partial consensus, null recommendation, unbounded session file, stage 4 chicken-and-egg, atomic write failure, multiple features
**Endorsements:** Writer failure semantics, consensus vs partial consensus, objection routing, Invoke-Parallel, deleted files, wiring, e2e flow, Resolve-PipelineState

#### expert-tdd
**Position:** Strong coverage of all three testing layers, well-structured for TDD. A few testability gaps.
**Objections:** (8) Stages 6-7 too vague, Seed+Resume, resume missing log, multiple features, wiring check is code inspection, moderator prompt untestable, Item 4 conflates concerns, max rounds underspecified
**Endorsements:** Item 2 exemplary TDD material, Item 5 contract testing, Item 12 e2e, Item 1 error matrix, Item 6 negative cases, glossary

#### expert-continuous-delivery
**Position:** Strong coverage of parallel-writers and debate mechanics, meaningful gaps in handoffs, resume, idempotency, and state consistency.
**Objections:** (9) Cumulative validation, resume failure modes (5 sub-cases), no idempotency, stage completion markers, atomic writes only for fixture, no rollback/retry, stage 4-5 handoff gap, no Invoke-Parallel timeout, old 8-stage migration
**Endorsements:** Parallel failure handling, wiring verification, moderator schema, revision failure preservation, deleted files, single-writer optimization

### Round 2

#### expert-bdd
**New Objections:** (2) B1: Inter-round state accumulation, B2: Writer full capitulation
**Key Endorsements:** Edge Cases #3 (old log format), #5 (invalid target), #6 (empty files), #10 (contradictory partial consensus); TDD #1 (stages vague), #5 (wiring untestable), #6 (prompt untestable); CD #4 (stage markers), #3 (idempotency)

#### expert-edge-cases
**New Objections:** (2) E16: Log write/file output race, E17: Claude model refusal
**Key Endorsements:** BDD #1 (cumulative validation), #6 (unified-debate.md); TDD #1 (stages vague); CD #3 (idempotency), #6 (rollback)

#### expert-tdd
**New Objections:** (4) T1: Invoke-Parallel error shape, T2: UnifiedDebateLoop return contract, T3: ConvertFrom-Gherkin intermediate failure, T4: Synchronization contract
**Key Endorsements:** All cumulative validation objections, all resume failure objections, CD stage markers, CD idempotency
**Blocking Issues Identified:** T1, T2, stage 4 precondition clarification, stage completion marker format

#### expert-continuous-delivery
**New Objections:** (4) CD-R2-1: Write-PipelineLog signature, CD-R2-2: PipelineState input/output confusion, CD-R2-3: No fresh-run health check, CD-R2-4: Round counter not persisted
**Key Endorsements:** All prior resume, validation, and timeout objections

### Round 3

All four experts: **"No new objections."** Consensus reached.

#### expert-bdd — Final Position
Withdrew B1 (inter-round accumulation — covered implicitly) and B2 (capitulation — same as consensus). Endorsed T1, T2, CD-R2-2, CD-R2-4. Rejected E17 (failure taxonomy), T3 (implementation detail), T4 (already specified), CD-R2-3 (gold-plating).

#### expert-edge-cases — Final Position
Withdrew E17 (operational, not architectural). Endorsed all remaining round 2 objections. Most critical: CD-R2-2 (PipelineState rewrite), CD-R2-3 (fresh-run validation), E16 (concurrent log writes).

#### expert-tdd — Final Position
Endorsed 12 of 13 objections. Rejected only B2 (writer capitulation — untestable at code level). Identified T1 and T2 as blocking for test suite development.

#### expert-continuous-delivery — Final Position
Endorsed all 12 round 2 objections. Most critical: CD-R2-2, stage completion markers, Write-PipelineLog consolidation. Conditionally approved pending contract-level resolutions.

---

## Metadata

- **Session file:** `docs/parallel-debates/bdd-debate.md`
- **Debate duration:** 3 rounds
- **Expert count:** 4
- **Total objections raised:** 40+ across all rounds
- **Objections resolved/withdrawn:** 5
- **Actionable gaps identified:** 16 (4 blocking, 9 high, 3 consider)
- **Result:** CONSENSUS_REACHED — all experts agree on the gap analysis and priority ordering
