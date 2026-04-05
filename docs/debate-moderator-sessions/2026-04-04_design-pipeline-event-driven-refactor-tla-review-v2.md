# Debate Session — Design-Pipeline Event-Driven Refactor TLA+ Review v2

**Date:** 2026-04-04
**Result:** CONSENSUS REACHED
**Rounds:** 2
**Experts:** expert-tla, expert-edge-cases, expert-tdd, expert-ddd

---

## Agreed Recommendation

The revised TLA+ specification `StorePipeline.tla` (v2) correctly addresses all 4 objections from the v1 review. The spec is now a complete and sound formal model of the store-per-stage architecture. No new specification defects were found. TLC verified 171,174 states (up from 3,847 in v1) across 10 invariants and 3 liveness properties, all passing.

### v1 Objection Verification

1. **AbortingBlocksNewStages (was tautology) -- FIXED.** Rewritten as `s > currentStage => (~stageCreated[s] /\ stageState[s] = "idle")`. This is a meaningful, non-trivially verifiable invariant that correctly asserts no stage beyond the current one is created or activated during abort. Now present in the cfg INVARIANT list (was absent in v1).

2. **StageTimeout (was missing) -- FIXED.** New StageTimeout(s) action (lines 302-321) fires non-deterministically on stages in {"active", "streaming"} state. Uses the same retry/exhaustion pattern as other failure actions. Correctly resets in-flight LLM state when applicable (checks for "requesting" or "streaming-active" before resetting). Satisfies Amendment 6 of the design consensus.

3. **LlmStreamComplete conflation (was atomic with stage completion) -- FIXED.** LlmStreamComplete now returns the stage to "active" and increments llmCompleted. New StageDecideComplete action requires llmCompleted > 0 and no in-flight LLM call. StageCompleteDirectly handles pure-computation stages with llmCompleted = 0. This correctly separates the "LLM responded" domain event from the "stage is done" domain event.

4. **StageDirectError (was missing) -- FIXED.** New StageDirectError(s) action (lines 284-297) models non-LLM infrastructure failures on active stages with no in-flight LLM. Uses the same retry/exhaustion logic. Does not touch llmState (correct -- no LLM operation is in flight).

### New Elements Assessment

- **llmCompleted variable:** Correctly tracks completed LLM calls per stage. LlmCompletedBounded invariant (`llmCompleted[s] <= llmCalls[s]`) provides useful structural checking.
- **Fairness specification:** Correctly includes WF on progress-critical actions (StageDecideComplete, LlmInterruptResolve, StageRetryResume, etc.) and correctly excludes environment/failure actions (StageTimeout, StageDirectError, StageRequestLlm) from weak fairness.
- **cfg file:** All 10 invariants and 3 liveness properties listed. No omissions.

### Implementation Note (not a spec defect)

When a stage is in "streaming" state with llmState "streaming-interrupted" and StageTimeout fires, both the timeout and the subsequent LlmInterruptResolve will increment stageRetries independently. A single perceived failure can consume two retry slots. TLC verified this does not violate any invariant or liveness property. The implementation should decide whether to coalesce these (e.g., by guarding LlmInterruptResolve against stageState != "streaming") or accept the behavior as modeling two distinct failure signals (stream interruption + timeout). This should be captured as a test case.

---

## Expert Final Positions

**expert-tla**
Position: The v2 spec correctly addresses all 4 v1 objections. The state model is complete and the spec is a sound foundation for implementation. The double-retry interaction is an acceptable behavior, not a defect.
Key reasoning: Each v1 objection was verified against the v2 spec with precise line references. AbortingBlocksNewStages is now non-trivially verifiable. StageTimeout correctly handles both active and streaming stages with appropriate LLM state management. The decoupled LlmStreamComplete/StageDecideComplete correctly models two distinct domain events. The fairness specification correctly categorizes progress-critical vs. environment actions. The state space increase from 3,847 to 171,174 states reflects the additional non-determinism from the 4 new actions.
Endorsed: expert-edge-cases (double-retry scenario identification and state trace), expert-tdd (cfg audit and test scenario derivation)

**expert-edge-cases**
Position: All 4 v1 objections are correctly addressed. No new unhandled failure modes found. The double-retry-counting interaction is real but is an implementation-level concern, not a spec defect, because TLC verified it preserves all invariants and liveness properties.
Key reasoning: Systematic analysis of edge cases in the new actions (timeout during streaming, direct error during streaming, StageDecideComplete with in-flight LLM, multiple LLM calls, abort during various states) found all guards correct. The timeout + stream-interrupt interaction was identified and traced through the state space. After expert-tla's analysis that it represents two distinct failure signals and TLC verification, this was assessed as implementation guidance rather than a spec defect.
Endorsed: expert-tla (two-distinct-failure-signals analysis), expert-tdd (implementation test case suggestion)

**expert-tdd**
Position: The v2 spec provides a complete foundation for test scenario derivation. All 13 properties (10 invariants + 3 liveness) are in the cfg file. Each action maps to testable preconditions and postconditions. The double-retry scenario is a valuable implementation test case.
Key reasoning: Every verified invariant translates to a property-based test assertion. Every state transition maps to a unit test. The multi-LLM cycle (request -> stream -> complete, repeat, then decide-complete) is now an explicitly testable sequence. The cfg file is complete -- no v1-style omissions. The fairness exclusion of failure actions means tests can validly model both "failure never happens" and "failure happens" paths.
Endorsed: expert-tla (thorough interaction analysis), expert-edge-cases (identification and correct withdrawal of double-retry concern)

**expert-ddd**
Position: The v2 spec correctly models the domain boundaries. The LlmStreamComplete/StageDecideComplete separation correctly represents two distinct domain events. StageDirectError correctly separates infrastructure failure domains.
Key reasoning: The v1 conflation of LLM completion with stage completion erased the boundary between the LLM provider domain and the stage domain. v2 restores this with explicit modeling: LlmStreamComplete is a provider-domain event (response received), StageDecideComplete is a stage-domain event (work finished). The llmCompleted counter serves as an aggregate invariant. StageCompleteDirectly correctly models pure-computation stages as a distinct domain path. The double-retry scenario represents two semantically distinct failure events (stream interruption from LLM provider domain, timeout from orchestrator domain), supporting the decision to not treat it as a defect.
Endorsed: expert-edge-cases (correct domain-level withdrawal reasoning), expert-tla (failure signal distinction)

---

## Round Transcripts

### Round 1

**expert-tla**
Position: The v2 spec correctly addresses all 4 v1 objections. The state model is complete.
Reasoning: Verified each objection: (1) AbortingBlocksNewStages rewritten with meaningful guard, now in cfg. (2) StageTimeout correctly handles active/streaming with LLM state management. (3) LlmStreamComplete/StageDecideComplete correctly decoupled. (4) StageDirectError models non-LLM failures. Fairness correctly excludes environment actions. 171,174 states verified.
Objections: None.
Endorsements: None (first round).

**expert-edge-cases**
Position: All 4 v1 objections correctly addressed. One new interaction identified.
Reasoning: Systematic edge case analysis found all new action guards correct. However, identified that StageTimeout on a stage with llmState "streaming-interrupted" leaves the llmState unchanged, and subsequent LlmInterruptResolve fires independently, causing double retry counting.
Objections:
- Double retry counting when StageTimeout and LlmStreamInterrupt coincide on the same stage -- a single failure consumes two retry slots.
Endorsements: None (first round).

**expert-tdd**
Position: v2 spec provides improved foundation for test derivation. Cfg file complete. One interaction concern.
Reasoning: Every action maps to testable scenarios. Multi-LLM cycle now explicitly testable. Cfg lists all 13 properties. Concurs with edge-case expert on double-retry interaction as a testable scenario.
Objections:
- Double retry counting on concurrent timeout + interrupt (contingent on expert-edge-cases analysis).
Endorsements: None (first round).

**expert-ddd**
Position: v2 correctly models domain boundaries. LLM/stage lifecycle separation is sound.
Reasoning: LlmStreamComplete/StageDecideComplete separation correctly represents two domain events. StageCompleteDirectly models pure-computation stages. StageDirectError correctly separates failure domains.
Objections: None.
Endorsements: None (first round).

### Round 2

**expert-tla**
Position: The double-retry scenario is real but not a spec defect. It models two distinct failure events.
Objections: None.
Endorsements:
- expert-edge-cases: Double-retry scenario correctly identified with accurate state trace.
- expert-tdd: Test scenario suggestion is valuable for implementation.

**expert-edge-cases**
Position: Withdrawing objection. Double-retry counting is implementation-level, not spec-level. TLC verified all invariants hold.
Objections: None (withdrawn).
Endorsements:
- expert-tla: Two-distinct-failure-signals analysis is compelling.
- expert-tdd: Implementation test case is appropriate response.

**expert-tdd**
Position: No remaining objections. Spec is complete for test derivation.
Objections: None.
Endorsements:
- expert-tla: Thorough double-retry analysis.
- expert-edge-cases: Correct identification and withdrawal.

**expert-ddd**
Position: No objections. Domain modeling is sound.
Objections: None.
Endorsements:
- expert-edge-cases: Withdrawal reasoning is domain-correct (two distinct failure events from two domains).
- expert-tla: Spec correctness vs implementation policy distinction is well-drawn.

---

**Session saved to:** docs/debate-moderator-sessions/2026-04-04_design-pipeline-event-driven-refactor-tla-review-v2.md
