# Debate Session — Design-Pipeline Event-Driven Refactor TLA+ Review

**Date:** 2026-04-04
**Result:** CONSENSUS REACHED
**Rounds:** 3
**Experts:** expert-tla, expert-edge-cases, expert-ddd, expert-tdd

---

## Agreed Recommendation

The TLA+ specification `StorePipeline.tla` is a well-structured formal model that correctly captures the core state machine for the store-per-stage architecture. It passes TLC with 3,847 states and 11 verified properties. However, the review identified four concrete gaps against the 8-point design consensus and one structural defect in the spec itself. These must be addressed before the spec is considered a complete foundation for implementation:

1. **AbortingBlocksNewStages invariant is a tautology.** The expression `stageState[s] \notin {"active", "streaming"} \/ stageState[s] = stageState[s]` is always true (any value equals itself). The invariant asserts nothing. Additionally, it is absent from the `.cfg` file, so it was never model-checked by TLC. The invariant should be rewritten to assert: no stage transitions from "idle" to "active" while `runState \in {"aborting", "aborted"}`. For example: `\A s \in Stages : (runState \in {"aborting", "aborted"}) => ~(stageCreated[s] /\ stageState[s] = "active" /\ ~stageDestroyed[s] /\ s > currentStage)` -- meaning no stage beyond the current one becomes active during abort.

2. **No timeout modeling (consensus Amendment 6).** The design requires per-stage timeout budgets (default 120s) with explicit error transition on expiration. The spec has no action representing a timeout firing. A `StageTimeout(s)` action should be added that transitions an active or streaming stage to error when it has exceeded its budget. Without this, the spec cannot verify that timeouts produce the correct error state.

3. **LLM completion conflated with stage completion.** `LlmStreamComplete` atomically sets both `llmState[s] = "complete"` and `stageState[s] = "complete"`. This means completing one LLM call completes the entire stage. But the spec allows `MaxLlmCalls > 1`, and the design describes stages (e.g., pair-programming) that make multiple LLM calls. The fix is to decouple: `LlmStreamComplete` should set `llmState[s] = "complete"` and reset `llmState[s]` to "idle" (ready for next call), with a separate `StageDecideComplete(s)` action where the stage decides it is done. This also correctly models the domain boundary between "the LLM responded" and "the stage finished its work."

4. **No non-LLM error path.** A stage can only reach "error" through LLM failure paths (`LlmInterruptResolve` or `LlmRequestFail` with exhausted retries). The design includes FileOperations and GitOperations as infrastructure stores that can fail. A `StageDirectError(s)` action should be added for non-LLM failures, with the same retry/error exhaustion logic.

**What the spec gets right:**
- Complete state enumeration for runState (6 states), stageState (8 states including all 3 consensus-required additions), and llmState (6 states)
- DAG invariant on subscriptions correctly prevents circular dependencies (Amendment 4)
- Bounded retries with explicit "retrying" state (Amendment 3)
- Store lifecycle integrity (created/destroyed tracking)
- Sequential stage ordering enforcement
- Fairness conditions ensuring liveness (WF on progress-critical actions)
- Clean separation of orchestrator actions from stage actions
- All 11 checked properties pass TLC

**What is correctly excluded from the spec:**
- Amendment 1 (TypeScript interfaces) -- code-level concern, not state machine behavior
- Amendment 2 (single Result error type) -- type system concern, not temporal behavior
- Amendment 5 (jitter in backoff) -- timing detail below abstraction level of the spec
- Amendment 7 (side effect idempotency) -- policy declaration, not a verifiable property
- Amendment 8 (lodash/attempt async prohibition) -- code convention, not state behavior

---

## Expert Final Positions

**expert-tla**
Position: The spec is a strong foundation but has a tautological invariant and three modeling gaps (timeout, multi-LLM, non-LLM errors) that must be fixed to match the consensus.
Key reasoning: The core state machine is correctly specified. The DAG invariant, bounded retries, and store lifecycle properties are well-formulated. The fairness conditions are appropriate for liveness. However, AbortingBlocksNewStages is vacuously true and was not model-checked (absent from cfg). The lack of timeout, the LLM/stage completion conflation, and the absence of non-LLM error paths mean the spec models a simplified version of the design.
Endorsed: expert-edge-cases (multi-LLM analysis), expert-tdd (cfg audit), expert-ddd (domain boundary between LLM completion and stage completion)

**expert-edge-cases**
Position: The spec covers primary failure paths well but misses multi-LLM-per-stage behavior, non-LLM errors, timeout transitions, and has a tautological safety invariant.
Key reasoning: The most serious gap is the multi-LLM-per-stage issue. The spec's constants allow MaxLlmCalls > 1, but LlmStreamComplete immediately completes the stage. This means the spec cannot model iterative code generation stages. The tautological invariant provides zero checking value. Timeout absence means the spec cannot verify Amendment 6 compliance. NumStages=3 vs. design's 7 is acceptable for model checking but should be documented.
Endorsed: expert-tla (tautology analysis), expert-tdd (cfg file audit), expert-ddd (LLM/stage conflation as domain boundary issue)

**expert-ddd**
Position: The spec correctly models the orchestrator-stage hierarchy but conflates the LLM provider lifecycle with the stage lifecycle, obscuring the domain boundary.
Key reasoning: A stage consuming LLM output and then performing additional work (writing files, running tests) is a two-step domain process. The spec collapses this into a single atomic transition. The subscription model and store lifecycle correctly reflect the domain hierarchy. Non-LLM infrastructure not being modeled is an acceptable simplification that should be documented.
Endorsed: expert-tla (three-gap analysis), expert-edge-cases (multi-LLM consequence of conflation), expert-tdd (test scenario gaps from spec simplifications)

**expert-tdd**
Position: The spec provides a strong foundation for test case generation, but simplifications create gaps in spec-derived test scenarios for multi-LLM stages, timeout behavior, and non-LLM errors.
Key reasoning: Every verified invariant maps to a property-based test assertion. Every state transition maps to a unit test scenario. But AbortingBlocksNewStages is absent from the cfg INVARIANT list, meaning TLC never checked it -- the "11 properties verified" claim should be "8 invariants + 3 liveness properties = 11, with AbortingBlocksNewStages unchecked." The spec simplifications mean tests derived purely from the spec will miss real failure paths.
Endorsed: expert-tla (comprehensive gap analysis), expert-edge-cases (cfg audit confirmation), expert-ddd (domain boundary identification)

---

## Round Transcripts

### Round 1

**expert-tla**
Position: The spec is solid in core structure but has three gaps against consensus and one structural weakness.
Reasoning: Correctly models 6 runState values, 8 stageState values, 6 llmState values. DAG invariant, bounded retries, store lifecycle all correct. However: (1) AbortingBlocksNewStages is a tautology -- `stageState[s] \notin {"active", "streaming"} \/ stageState[s] = stageState[s]` is always true. (2) No timeout modeling for Amendment 6. (3) LlmStreamComplete conflates LLM completion with stage completion -- a stage may need multiple LLM calls.
Objections:
- AbortingBlocksNewStages invariant is a tautology (vacuously true)
- No timeout action for Amendment 6
- LlmStreamComplete conflates LLM completion with stage completion
Endorsements: None (first round)

**expert-edge-cases**
Position: The spec covers primary paths well but misses multi-LLM, non-LLM errors, timeout, and has a tautological invariant.
Reasoning: MaxLlmCalls > 1 allowed by constants but LlmStreamComplete immediately completes the stage. No direct stage error path for non-LLM failures. No timeout transition. AbortingBlocksNewStages asserts nothing.
Objections:
- Multiple LLM calls per stage allowed by constants but not by state machine
- No non-LLM stage error path
- No timeout action despite Amendment 6
- AbortingBlocksNewStages is vacuously true
Endorsements: None (first round)

**expert-ddd**
Position: The spec correctly models the hierarchy but conflates LLM provider lifecycle with stage lifecycle.
Reasoning: LlmStreamComplete atomically sets both llmState and stageState to complete, obscuring the domain boundary between LLM responding and stage finishing work. Subscription model and store lifecycle are correct.
Objections:
- LLM completion conflated with stage completion
- No modeling of non-LLM infrastructure operations (acceptable simplification)
Endorsements: None (first round)

**expert-tdd**
Position: The spec is a strong test scenario source, but simplifications create test coverage gaps.
Reasoning: Every transition maps to a unit test. Every invariant maps to a property assertion. But multi-LLM, timeout, and non-LLM error paths are not modeled, so spec-derived tests will miss these. AbortingBlocksNewStages cannot generate meaningful assertions. Also, AbortingBlocksNewStages is not in the cfg INVARIANT list -- it was never TLC-checked.
Objections:
- Spec simplifications create test scenario gaps
- AbortingBlocksNewStages is a tautology and missing from cfg
Endorsements: None (first round)

### Round 2

**expert-tla**
Position: Maintaining core objections. Cross-expert convergence strengthens the case.
Objections:
- (Reiterated) AbortingBlocksNewStages tautology
- (Reiterated) No timeout action
- (Reiterated) LlmStreamComplete conflation
- (New) AbortingBlocksNewStages absent from cfg -- never model-checked
Endorsements:
- expert-edge-cases: Multi-LLM analysis is precise
- expert-tdd: cfg audit finding is significant
- expert-ddd: Stage-processes-LLM-output intermediate step is correct domain decomposition

**expert-edge-cases**
Position: Maintaining core objections. One refinement added.
Objections:
- (Reiterated) Multiple LLM calls per stage not supported
- (Reiterated) No non-LLM error path
- (Reiterated) No timeout action
- (Reiterated) AbortingBlocksNewStages tautology
- (New) cfg uses NumStages=3 but design has 7 -- smaller constant may miss ordering bugs
Endorsements:
- expert-tla: Tautology analysis is definitive
- expert-tdd: cfg audit is significant
- expert-ddd: LLM/stage conflation is root cause of multi-LLM gap

**expert-ddd**
Position: Maintaining LLM/stage conflation objection. Withdrawing non-LLM infrastructure concern.
Objections:
- (Reiterated) LLM completion conflated with stage completion
- (Dropped) Non-LLM infrastructure not modeled -- acceptable simplification
Endorsements:
- expert-tla: Complete three-gap analysis
- expert-edge-cases: Multi-LLM analysis is concrete consequence
- expert-tdd: cfg file audit is valuable

**expert-tdd**
Position: Maintaining position. No new objections.
Objections:
- (Reiterated) Spec simplifications create test scenario gaps
- (Reiterated) AbortingBlocksNewStages tautology and missing from cfg
Endorsements:
- expert-tla: Three-gap analysis is comprehensive
- expert-edge-cases: NumStages=3 vs 7 is valid observation
- expert-ddd: LLM/stage conflation is correct root cause

### Round 3

All experts converged. No new objections raised. Consensus reached on the 4-point recommendation.

**expert-tla**: No new objections. NumStages=3 is standard practice for model checking -- properties are parameterized. Recommends documenting the simplification. Endorses group consensus.
**expert-edge-cases**: No new objections. Accepts small-constant model checking is standard. Documentation is sufficient. Endorses group consensus.
**expert-ddd**: No new objections. Endorses group consensus.
**expert-tdd**: No new objections. Endorses group consensus.

---

**Session saved to:** docs/debate-moderator-sessions/2026-04-04_design-pipeline-event-driven-refactor-tla-review.md
