# Debate Session — TLA+ Re-Review: PipelineEnhancements Specification (Post-Fix)

**Date:** 2026-04-03
**Experts:** expert-tla, expert-edge-cases, expert-continuous-delivery
**Rounds:** 1
**Result:** CONSENSUS REACHED
**Prior session:** docs/debate-moderator-sessions/2026-04-03_tla-review-plantuml-questioner-librarian-a11y.md
**Context:** Re-review after 6 objections from prior review were resolved. TLC: 7,368 states, 5,880 distinct, PASS.

---

## Debate Synthesis — tla-re-review-plantuml-questioner-librarian-a11y

**Result:** CONSENSUS REACHED
**Rounds:** 1
**Experts:** expert-tla, expert-edge-cases, expert-continuous-delivery

---

### Agreed Recommendation

All 6 objections from the prior review have been correctly and completely resolved in the revised TLA+ specification `PipelineEnhancements.tla`. The fixes are verified as follows:

1. **StageMonotonicity (Fix 1) -- RESOLVED.** Replaced the range-check invariant with the temporal property `[][pipelineStage' >= pipelineStage]_pipelineStage`. This is the standard TLA+ idiom for monotonicity: the box-action asserts that every step either advances `pipelineStage` or leaves it unchanged (stuttering). The `_pipelineStage` subscript correctly permits stuttering steps where other variables change but `pipelineStage` does not.

2. **Librarian degradation reachability (Fix 2) -- RESOLVED.** Init now sets `librarianIndex \in {"valid", "stale", "partial", "corrupt"}` nondeterministically. This makes `LibrarianConsultWithDegradedIndex` reachable from Init when the index starts in a degraded state. TLC's state count (7,368 states) confirms the expanded exploration compared to the prior deterministic Init.

3. **DeployQuorumAndA11y stage guard (Fix 3) -- RESOLVED.** The guard `pipelineStage = 8` is stricter than the minimum suggestion of `reviewGatePassed`. Since stage 8 is only reachable via `Stage7Commit`, which requires stage 7 (reachable only via `PassReviewGate`), deployment is now properly constrained to post-pipeline-completion. This also resolves the prior secondary concern about the ordering between `stage7Committed` and deployment: deployment now always occurs after the Stage 7 atomic commit.

4. **ASSUME statements (Fix 4) -- RESOLVED.** Four ASSUME statements correctly constrain the constants: `Cardinality(Reviewers) >= 1`, `Cardinality(Experts) >= 1`, `MaxTurns >= 1`, `SplitThreshold >= 1`. These prevent the degenerate configurations (empty sets, zero thresholds) that would deadlock the pipeline or bypass design requirements.

5. **QuestionerMinOneQuestion invariant (Fix 5) -- RESOLVED.** The invariant `questionerDone => questionerTurns >= 1` explicitly documents the "at least one question" design requirement. Combined with `ASSUME MaxTurns >= 1`, the invariant is properly guarded: `QuestionerForceStop` fires at `questionerTurns = MaxTurns >= 1`, and `QuestionerFinishVoluntary` requires `completenessChecked` which requires `questionerTurns > 0`.

6. **DeploymentRequiresReviewGate invariant (Fix 6) -- RESOLVED.** The safety property `quorumDeployed => reviewGatePassed` formally captures the deployment-requires-verification constraint. Since `DeployQuorumAndA11y` requires `pipelineStage = 8` and reaching stage 8 requires `PassReviewGate` (which sets `reviewGatePassed = TRUE`), this invariant holds by construction and is confirmed by TLC.

**No new issues were introduced by the fixes.** The specification is ready to proceed to Stage 5 (Implementation Planning).

**Secondary observations (carried forward from prior review, accepted as out of scope):**
- The completeness check is modeled as always succeeding (one-shot). Acceptable abstraction.
- No failure/retry modeling for pipeline stages. Out of scope for 8-amendment verification.
- WF_vars(Next) applies weak fairness to the entire Next relation rather than selective fairness on specific actions. Functional for this spec's scope.

---

### Expert Final Positions

**expert-tla**
Position: All 6 fixes are formally correct. The specification faithfully represents the 8-amendment design consensus.
Key reasoning: Fix 1 uses the standard TLA+ monotonicity idiom correctly. Fix 2 makes degradation paths reachable. Fix 3 uses a stronger-than-minimum guard (`pipelineStage = 8`) that is correct because stage 8 implies all prior gates passed. Fix 4 follows standard TLA+ practice for constant preconditions. Fix 5 creates a redundant-but-valuable invariant that documents design intent. Fix 6 captures a derived safety property that TLC can verify independently of the stage guard. The 7,368-state / 5,880-distinct TLC result with PASS confirms all properties hold across the expanded nondeterministic state space.
Endorsed: expert-edge-cases (boundary-value concerns fully addressed by ASSUME statements), expert-continuous-delivery (deployment timing fully resolved by pipelineStage=8 guard)

**expert-edge-cases**
Position: All boundary-value and degenerate-configuration concerns from the prior review are resolved. No new edge cases introduced.
Key reasoning: The four ASSUME statements eliminate the empty-set and zero-value configurations that caused prior concerns. `ASSUME MaxTurns >= 1` prevents the zero-question bypass. `ASSUME SplitThreshold >= 1` prevents zero-threshold librarian deadlock. The nondeterministic Init for `librarianIndex` ensures TLC explores all four degradation paths. The TLC state count increase confirms broader coverage. Stage 7 still lacks failure actions (task failure deadlocks under WF), but this was accepted as out of scope in the prior review.
Endorsed: expert-tla (all 6 fixes verified correct), expert-continuous-delivery (deployment guard resolves ordering concern)

**expert-continuous-delivery**
Position: Deployment timing and ordering concerns are fully resolved. The specification correctly models the deployment-after-verification constraint.
Key reasoning: The `pipelineStage = 8` guard on `DeployQuorumAndA11y` is the strongest possible constraint -- deployment cannot occur until the entire pipeline completes, including the Stage 7 atomic commit. This makes the prior concern about `stage7Committed` vs `deployedItems` ordering moot. The `DeploymentRequiresReviewGate` invariant provides an explicit, checkable safety net. No rollback or observability modeling exists, but these were accepted as out of scope.
Endorsed: expert-tla (monotonicity property correctly formulated, ASSUME statements standard practice), expert-edge-cases (degenerate configurations prevented)

---

## Round Transcripts

### Round 1

**expert-tla**
Position: All 6 fixes correctly resolve the prior objections. Specification ready for implementation planning.

Reasoning: Each fix was verified against the TLA+ specification text and the prior objection it addresses. Fix 1 replaces a range check with the canonical TLA+ monotonicity temporal property using box-action notation with stuttering subscript. Fix 2 changes Init from deterministic to nondeterministic over 4 librarian index states, making the degradation action reachable. Fix 3 adds `pipelineStage = 8` as a precondition, which is stronger than the minimum `reviewGatePassed` but correct since stage 8 transitively implies review gate passage. Fix 4 adds 4 ASSUME statements following standard TLA+ practice. Fix 5 adds an invariant that is logically implied by the ASSUME + action structure but valuable as explicit documentation. Fix 6 adds a derived safety property that TLC can check independently. TLC result (7,368 states, PASS) confirms all properties hold.

Objections: None

Endorsements:
- expert-edge-cases: Boundary-value concerns (MaxTurns=0, empty sets, SplitThreshold=0) fully addressed by ASSUME statements
- expert-continuous-delivery: Deployment timing concern fully resolved by pipelineStage=8 guard

**expert-edge-cases**
Position: All prior edge-case concerns resolved. No new boundary-value issues introduced by the fixes.

Reasoning: The ASSUME statements prevent all degenerate configurations identified in the prior review. `Cardinality(Reviewers) >= 1` prevents empty reviewer deadlock. `Cardinality(Experts) >= 1` prevents empty expert set. `MaxTurns >= 1` prevents zero-question questioner bypass. `SplitThreshold >= 1` prevents zero-threshold librarian unreachability. The nondeterministic `librarianIndex` in Init expands TLC exploration to cover all four degradation scenarios. The `QuestionerMinOneQuestion` invariant explicitly captures the "at least one question" requirement. No new edge cases were introduced by the fixes -- the ASSUME statements and invariants are purely additive constraints.

Objections: None

Endorsements:
- expert-tla: All 6 fixes verified as formally correct
- expert-continuous-delivery: Deployment guard resolves the deployment-at-any-stage concern

**expert-continuous-delivery**
Position: Deployment concerns fully resolved. No new deployment-related issues.

Reasoning: The `pipelineStage = 8` guard constrains deployment to after pipeline completion, which transitively requires: questioner done (stage 1->2), expert selection (stage 2), middle stages (3-5->6), review gate passage (stage 6->7), PlantUML + librarian completion (stage 7), and atomic commit (stage 7->8). This is the strongest possible deployment guard and fully resolves the prior concern about unconstrained deployment timing. The `DeploymentRequiresReviewGate` invariant provides an additional safety net that TLC verifies. The prior secondary concern about `stage7Committed` vs `deployedItems` ordering is now moot since `pipelineStage = 8` requires `stage7Committed = TRUE`.

Objections: None

Endorsements:
- expert-tla: Monotonicity property correctly formulated; ASSUME statements are standard practice
- expert-edge-cases: Degenerate configurations prevented by ASSUME statements

---

**Session saved to:** docs/debate-moderator-sessions/2026-04-03_tla-re-review-plantuml-questioner-librarian-a11y.md
