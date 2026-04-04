# Debate Session — TLA+ Review: PipelineEnhancements Specification

**Date:** 2026-04-03
**Experts:** expert-tla, expert-edge-cases, expert-continuous-delivery
**Rounds:** 2
**Result:** CONSENSUS REACHED

---

## Debate Synthesis — tla-review-plantuml-questioner-librarian-a11y

**Result:** CONSENSUS REACHED
**Rounds:** 2
**Experts:** expert-tla, expert-edge-cases, expert-continuous-delivery

---

### Agreed Recommendation

The TLA+ specification `PipelineEnhancements.tla` correctly captures the core state machine, transitions, and most safety/liveness properties from the 8-amendment design consensus. However, six issues must be resolved before the spec can be considered a faithful representation of the design:

1. **Fix StageMonotonicity property.** The current invariant `pipelineStage \in 1..8` is a range check, not a monotonicity check. Replace with the temporal property `[][pipelineStage' >= pipelineStage]_pipelineStage` to actually verify that pipeline stages only advance forward.

2. **Make librarian degradation paths reachable.** The Init state pins `librarianIndex = "valid"`, making `LibrarianConsultWithDegradedIndex` unreachable (dead code). Change Init to nondeterministically choose `librarianIndex \in {"valid", "stale", "partial", "corrupt"}` so TLC actually explores the graceful degradation paths required by amendment 4.

3. **Add stage guard to DeployQuorumAndA11y.** The deployment action currently has no `pipelineStage` precondition, allowing deployment at any point -- even before the review gate passes. Add a guard requiring at minimum `reviewGatePassed` (or `pipelineStage = 8`) to match the design intent that deployment follows verification.

4. **Add ASSUME statements for constant preconditions.** The spec must include:
   - `ASSUME Cardinality(Reviewers) >= 1`
   - `ASSUME Cardinality(Experts) >= 1`
   - `ASSUME MaxTurns >= 1`
   - `ASSUME SplitThreshold >= 1`

   Without these, the model allows degenerate configurations (empty reviewer sets, zero-turn questioner, zero-threshold librarian) that deadlock the pipeline or bypass design requirements.

5. **Add invariant: questionerDone => questionerTurns >= 1.** The `QuestionerForceStop` action at MaxTurns=0 allows the questioner to finish with zero questions asked, bypassing the design requirement that at least one question must be asked. The ASSUME for MaxTurns >= 1 prevents this at the model level, but the invariant documents the intent explicitly.

6. **Add safety property: quorumDeployed => reviewGatePassed.** The design consensus implies quorum+a11y deployment is contingent on review gate passage. This relationship is not captured in any current invariant.

**Secondary findings (not blocking but noted):**
- The completeness check is modeled as always succeeding (one-shot). The design allows the check to find gaps and continue asking. This is an acceptable abstraction for this spec's scope.
- No failure/retry modeling exists for any pipeline stage. This is out of scope for the 8-amendment verification but should be considered for future spec refinement.
- The relationship between `stage7Committed` and `deployedItems` is unspecified -- deployment can occur before or after the Stage 7 atomic commit.
- WF_vars(Next) applies weak fairness to the entire Next relation, which is overly strong. Selective fairness on specific actions would be more precise.

---

### Expert Final Positions

**expert-tla**
Position: The spec is structurally sound but has verifiable gaps in property coverage and reachability.
Key reasoning: The StageMonotonicity property is mislabeled (range check, not monotonicity). The librarian degradation paths are unreachable from Init, making amendment 4 verification vacuous. DeployQuorumAndA11y lacks a stage guard. The completeness check does not model the "gaps found, keep asking" path but this is an acceptable abstraction. WF_vars(Next) is overly broad but functional for this spec's scope.
Endorsed: expert-edge-cases (constant preconditions, MaxTurns=0 bypass), expert-continuous-delivery (deployment timing)

**expert-edge-cases**
Position: The spec has significant boundary-value blind spots that would allow invalid configurations to pass TLC without flagging real design violations.
Key reasoning: Empty Reviewers/Experts sets cause deadlocks with no explicit error. MaxTurns=0 bypasses the "at least one question" design requirement. SplitThreshold=0 makes LibrarianUpdate unreachable. The librarian corrupt-index path has no downstream signaling. Stage 7 has no failure actions, so a task failure would deadlock.
Endorsed: expert-tla (StageMonotonicity mislabeled, librarian degradation unreachable, deployment stage guard), expert-continuous-delivery (deployment timing unconstrained)

**expert-continuous-delivery**
Position: The spec captures deployment atomicity correctly but leaves deployment timing unconstrained, which creates ambiguous deployment ordering in practice.
Key reasoning: DeployQuorumAndA11y can fire at any stage, before pipeline completion. No relationship exists between stage7Committed and deployedItems. Failure/retry modeling is absent but accepted as out of scope for this spec. The atomic commit constraint in Stage 7 is correctly modeled.
Endorsed: expert-tla (StageMonotonicity, librarian degradation, ASSUME statements), expert-edge-cases (constant preconditions, MaxTurns=0 bypass)

---

## Round Transcripts

### Round 1

**expert-tla**
Position: Spec structurally sound with gaps in state coverage and property verification.
Reasoning: StageMonotonicity checks range, not monotonicity. Librarian degradation unreachable from Init. DeployQuorumAndA11y has no stage guard. Missing deployment-after-review safety property. WF_vars(Next) overly strong. Completeness check modeled as one-shot succeeding.
Objections:
- StageMonotonicity mislabeled
- Librarian degradation paths unreachable
- DeployQuorumAndA11y lacks stage guard
Endorsements: None

**expert-edge-cases**
Position: Significant edge case blind spots in boundary values and empty sets.
Reasoning: Empty Reviewers/Experts deadlock pipeline. MaxTurns=0 bypasses questioner. SplitThreshold=0 deadlocks librarian. No failure modeling for Stage 7 tasks. Corrupt index has no downstream signal.
Objections:
- Missing constant precondition invariants
- MaxTurns=0 allows questioner bypass
- No failure modeling for Stage 7 tasks
Endorsements: None

**expert-continuous-delivery**
Position: Deployment atomicity correctly modeled but timing unconstrained.
Reasoning: No rollback modeling. Deployment action fires at any stage. Atomic commit not linked to deployment. No observability states. AdvanceMiddleStages abstracts away potential failures in stages 2-5.
Objections:
- DeployQuorumAndA11y needs stage guard
- No relationship between stage7Committed and deployedItems
- No failure/retry modeling
Endorsements: None

### Round 2

**expert-tla**
Position: Strengthened by convergent findings. Failure/retry out of scope.
Reasoning: Endorses constant preconditions from expert-edge-cases. Endorses deployment timing from expert-continuous-delivery. Adds that ASSUME statements are standard TLA+ practice. Proposes `questionerDone => questionerTurns >= 1` invariant. Accepts failure modeling as out of scope.
Objections:
- (Reiterated) StageMonotonicity mislabeled
- (Reiterated) Librarian degradation unreachable
- (New refinement) Missing ASSUME statements
- (New refinement) Missing questionerTurns >= 1 invariant
Endorsements: expert-edge-cases (constant preconditions, MaxTurns=0), expert-continuous-delivery (deployment timing)

**expert-edge-cases**
Position: No new objections. Endorses convergent findings.
Reasoning: Endorses StageMonotonicity and librarian degradation from expert-tla. Agrees failure modeling out of scope. No new edge cases found.
Objections: (All reiterated from R1)
Endorsements: expert-tla (StageMonotonicity, librarian degradation, deployment guard), expert-continuous-delivery (deployment timing)

**expert-continuous-delivery**
Position: Adjusted. Withdraws failure/retry objection as out of scope. Deployment timing objection stands.
Reasoning: Convergence on DeployQuorumAndA11y stage guard confirmed. Accepts expert-tla's scoping argument on failure modeling. No new objections.
Objections: (All reiterated from R1, minus failure/retry)
Endorsements: expert-tla (StageMonotonicity, librarian degradation, ASSUME statements), expert-edge-cases (constant preconditions, MaxTurns=0)

---

**Session saved to:** docs/debate-moderator-sessions/2026-04-03_tla-review-plantuml-questioner-librarian-a11y.md
