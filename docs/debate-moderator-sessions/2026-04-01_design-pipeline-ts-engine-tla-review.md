# Debate Session — Design Pipeline TypeScript Engine (TLA+ Review)

**Date:** 2026-04-01
**Result:** CONSENSUS REACHED
**Rounds:** 1
**Experts:** expert-tdd, expert-ddd, expert-tla, expert-edge-cases
**Stage:** 4 (TLA+ Specification Review)
**Spec Under Review:** `docs/tla-specs/design-pipeline-engine/DesignPipelineEngine.tla`

---

## Agreed Recommendation

The TLA+ specification is a faithful formalization of the pipeline state machine described in the design spec and incorporates all six HIGH/MEDIUM amendments from the Stage 2 debate. The spec correctly models 9 phases, 7 forward transitions, 3 backward transitions, retry budgets with bounded exhaustion, a universal halt escape, artifact accumulation, expert consistency, and lock semantics. TLC passed with 2,392 generated states and 1,296 distinct states -- no errors found.

All four experts support the specification with amendments. The consolidated amendments are:

1. **Validation is entirely absent from the TLA+ model** -- The design spec's two-pass validator (structural + heuristic), the `ValidationResultSchema` error shape, and per-phase validation functions are not modeled. This is the most significant gap. The spec models transitions as unconditional artifact production, but the design has a validation gate between agent output and state advancement where invalid output blocks the transition and returns errors. This should either be modeled explicitly (adding a validation-failure action that does not advance state) or documented as a deliberate abstraction boundary.

2. **Phase 6 produces no artifacts** -- `ArtifactsProducedBy("PHASE_6_PAIR_PROGRAMMING")` returns `{}`, but the design implies pair programming produces actual code. The `NoContextWithoutPhase` invariant does not constrain PHASE_6 at all. This is likely intentional (code output is not tracked as a pipeline artifact path) but should be documented.

3. **Backward transition from PHASE_3 to PHASE_1 is modeled but not explicitly mentioned in the design spec's exhaustive list** -- The design lists three backward transitions: PHASE_3->PHASE_1, PHASE_4->PHASE_3, PHASE_4->PHASE_1. The TLA+ matches this exactly. However, the Stage 2 debate noted that the design originally used "e.g." language. Confirm the TLA+ enumeration is now authoritative.

4. **No modeling of the discriminated union accumulated context** -- The design spec uses a discriminated union type system where `Phase3Context extends Phase2Context extends Phase1Context`, making invalid combinations unrepresentable at the type level. The TLA+ uses a flat set of artifact names. This is a valid abstraction (TLA+ checks the invariant `NoContextWithoutPhase` instead), but the type-level guarantees from the design are not verified by the spec.

5. **Atomic write, lock file, and file I/O concerns are not modeled** -- The Stage 2 debate's #1 HIGH priority amendment (atomic write-to-temp-then-rename) and #8 MEDIUM (file locking) are infrastructure concerns that the TLA+ does not model. The `locked` variable models single-instance semantics abstractly but not the file-based mechanism. This is an acceptable abstraction boundary for a state machine spec.

6. **`RETRY_EXHAUSTED` halt can fire even when retries are not at max** -- The `HaltPipeline` action allows any `haltReason` from any non-terminal phase, including `RETRY_EXHAUSTED` from PHASE_1 when retries are at 0. This is semantically odd. Consider guarding `RETRY_EXHAUSTED` to only be selectable when some retry counter has actually reached `MaxPipelineRetries`.

---

## Expert Final Positions

**expert-tdd**
Position: CONDITIONAL SUPPORT

Reasoning:
The TLA+ spec provides a strong skeleton for test case derivation. Each forward transition maps to a "valid advance" test, each backward transition maps to a "retry with context clearing" test, and each invariant maps to a property-based test assertion. The fix history (3 attempts documented in README.md) demonstrates that the spec was iteratively debugged through model checking -- this is the TLA+ equivalent of red-green-refactor, and it is encouraging.

The invariants are directly translatable to Vitest assertions: `RetryBounded` becomes `expect(retries[phase]).toBeLessThanOrEqual(maxRetries)`, `ExpertsConsistent` becomes a guard in every test that advances past PHASE_1, `SingleInstance` becomes a lock acquisition/release check. The 6 safety invariants plus 2 liveness properties give 8 concrete property categories for the test suite.

However, the spec entirely omits validation -- the core differentiator of the design. The design spec dedicates an entire section to the two-pass validator with structural and heuristic passes, error codes with namespace prefixes, and a `ValidationResultSchema` that is itself a tested contract. None of this appears in the TLA+ model. Every forward transition in the TLA+ simply produces artifacts unconditionally. In the real system, `advancePipeline` can fail validation and return errors without advancing state. This means the TLA+ does not model the most testable part of the system. A `ValidationFails` action that keeps the phase unchanged while the retry budget is unaffected would close this gap.

Objections:
1. The two-pass validation model (structural then heuristic) is completely absent from the TLA+ spec. This is the most testable aspect of the design and the most likely source of bugs. The spec should model validation failure as a non-advancing action.
2. The `ValidationResultSchema` error shape contract -- which the Stage 2 debate flagged as needing its own Zod schema and tests -- has no formal counterpart in the TLA+ model.
3. No modeling of the `advance` CLI receiving invalid or missing JSON input files. The design spec explicitly requires graceful error handling for this case.

Endorsements:
1. The fix history in README.md (3 iterative fixes) demonstrates healthy model-checking-driven development -- the TLA+ equivalent of TDD.
2. All 6 safety invariants are directly translatable to Vitest test assertions.
3. The liveness properties (`PipelineTerminates`, `RetryExhaustionLeadsToTermination`) map to integration test scenarios that verify the pipeline does not hang.
4. The `Terminated` stuttering action correctly prevents TLC from reporting false deadlocks in terminal states.

---

**expert-ddd**
Position: CONDITIONAL SUPPORT

Reasoning:
The TLA+ spec uses domain-appropriate naming throughout. Phase names match the design's ubiquitous language (`PHASE_1_QUESTIONER`, `PHASE_2_DESIGN_DEBATE`, etc.), artifact names use the exact path field names from the design (`briefingPath`, `designConsensusPath`, `tlaSpecPath`), and the `Experts` constant represents the expert council concept from the domain. The separation between `RetryablePhases` (only PHASE_1 and PHASE_3 are backward-transition targets) and all other phases correctly encodes a domain rule: not all phases support retry.

The `ArtifactsProducedBy` function is a clean encoding of the domain rule "each phase produces specific artifacts." The `ArtifactsCumulativeUpTo` function (though not directly used as an invariant) represents the accumulated context concept from the design. The `NoContextWithoutPhase` invariant enforces the monotonic context growth that the DDD expert flagged in Stage 2 -- artifacts cannot exist without their producing phase having been reached.

The gap is in richness. The design spec models `accumulatedContext` as a discriminated union where `Phase3Context extends Phase2Context extends Phase1Context`. This is a domain modeling choice that makes invalid combinations unrepresentable at the type level. The TLA+ flattens this into a set of artifact name strings, losing the structural guarantee. The `NoContextWithoutPhase` invariant recovers some of this (it checks phase ordering against artifact presence), but it does not verify that backward transitions correctly clear only the specified subset. For example, `BackToPhase3FromPhase4` clears `{"tlaSpecPath", "tlcResult", "tlaReviewPath"}` -- but nothing in the invariants verifies that `briefingPath` and `designConsensusPath` are preserved after this transition. The `NoContextWithoutPhase` invariant only checks forward direction (artifact implies phase reached), not the preservation direction (phase reached implies artifact present, unless cleared by a defined backward transition).

Objections:
1. The TLA+ does not verify that backward transitions preserve artifacts they should not clear. `BackToPhase3FromPhase4` clears 3 artifacts but nothing verifies `briefingPath` and `designConsensusPath` survive. A `ContextPreservedOnBackward` invariant would close this gap.
2. The `experts_selected` variable is modeled as a flat set at the top level, while the design spec places `experts` inside `Phase1Context` as part of accumulated context. This is a minor domain language divergence -- the TLA+ treats expert selection as a separate concern from artifact accumulation.

Endorsements:
1. Phase names, artifact names, and the `Experts` constant all use the domain's ubiquitous language.
2. `RetryablePhases` as a named set correctly encodes the domain rule that only specific phases accept backward transitions.
3. `ArtifactsProducedBy` cleanly maps the domain concept "each phase produces specific artifacts."
4. `NoContextWithoutPhase` invariant formally captures the Stage 2 debate's demand for monotonic context growth.

---

**expert-tla**
Position: SUPPORT

Reasoning:
The specification is formally well-constructed. The module extends `Integers`, `FiniteSets`, and `TLC` appropriately. The `TypeOK` invariant is comprehensive, covering all 6 variables with precise type constraints. The `CASE` expressions in `PhaseOrd` and `ArtifactsProducedBy` enumerate all phases explicitly with no default fallthrough for forward transitions (the `OTHER` clause returns `{}` only for phases that produce no artifacts, which is correct for IDLE, COMPLETE, HALTED, and PHASE_6). The `Spec` formula uses `WF_vars(Next)` for weak fairness, which is appropriate -- it guarantees that if `Next` is continuously enabled, it will eventually be taken. This prevents infinite stuttering and ensures the liveness properties can be verified.

TLC passed with `MaxPipelineRetries = 2` and `Experts = {"tdd", "ddd", "tla"}`. With 3 experts and 2 max retries, the state space is 2,392 states (1,296 distinct). This is small enough for exhaustive exploration but large enough to exercise all backward transition paths and retry exhaustion scenarios. The fix history shows 3 iterations to reach a clean pass, which is normal for a spec of this complexity. The fixes were all legitimate: IDLE not being an active phase (SingleInstance fix), HALTED being reachable from early phases where experts are empty (ExpertsConsistent fix), and terminal state deadlock (Terminated stuttering fix).

Two formal concerns. First, `WF_vars(Next)` applies weak fairness to the entire disjunction of actions. This means TLC will ensure that if any action in `Next` is enabled, some action will eventually fire. This is sufficient for the pipeline because in any non-terminal state, at least one forward or halt action is always enabled. However, if the spec were extended to model concurrent agents within a phase, per-action fairness (`WF_vars(SpecificAction)`) would be needed. For now, the single-actor model is appropriate. Second, the `RetryExhaustionLeadsToTermination` liveness property checks `\E p \in RetryablePhases : retries[p] >= MaxPipelineRetries` leads to terminal. This is correct but slightly weaker than ideal -- it does not require that the specific cause of termination is `RETRY_EXHAUSTED`. The pipeline could satisfy this property by halting for `USER_HALT` after retries reach max, which is technically correct but obscures the causal relationship.

Objections:
1. The `HaltPipeline` action allows `RETRY_EXHAUSTED` as a halt reason from any non-terminal phase, even when no retry counter has reached `MaxPipelineRetries`. This makes `HaltReasonConsistent` weaker than it should be. Add a guard: `reason = "RETRY_EXHAUSTED" => \E p \in RetryablePhases : retries[p] >= MaxPipelineRetries`.
2. The `ArtifactsCumulativeUpTo` operator is defined but never used in any invariant or property. Either use it (e.g., as a strengthened version of `NoContextWithoutPhase`) or remove it to avoid dead code in the spec.

Endorsements:
1. `WF_vars(Next)` is the correct fairness choice for a single-actor sequential pipeline.
2. The fix history demonstrates proper iterative model-checking discipline.
3. TLC configuration with small constants (`MaxPipelineRetries = 2`, 3 experts) is sufficient to explore all interesting state space patterns.
4. The `Terminated` stuttering action is the correct way to prevent false TLC deadlock reports in terminal states.
5. All 6 safety invariants are necessary and sufficient for the properties they describe -- none are redundant and none are obviously missing for the modeled scope.
6. The `PhaseOrd` function provides a clean total ordering over phases that enables the `NoContextWithoutPhase` invariant to be expressed concisely.

---

**expert-edge-cases**
Position: CONDITIONAL SUPPORT

Reasoning:
The TLA+ spec models the "happy path" state machine and the retry/halt escape hatches correctly. However, several edge cases from the design spec are not modeled, and two of these represent real gaps rather than acceptable abstractions.

The most significant gap is validation failure. The design spec describes a two-pass validator that can reject agent output, returning structured errors without advancing state. The TLA+ models every phase completion as unconditional artifact production. In reality, `advancePipeline("slug", "output.json")` can fail validation and return `{ valid: false, errors: [...] }`. This means the real system has more states than the TLA+ models: every non-terminal phase has both a "waiting for valid output" sub-state and a "valid output received, advancing" sub-state. The spec collapses these into a single transition, which means it cannot verify properties like "invalid output never causes state advancement" or "validation failure count is bounded."

The second gap is backward transition artifact preservation. When `BackToPhase3FromPhase4` fires, it clears `{"tlaSpecPath", "tlcResult", "tlaReviewPath"}` but preserves `briefingPath` and `designConsensusPath`. But in the real system, backward transitions clear context in the state store while the actual files still exist on disk. The design spec says "the state store enforces this: `saveSession` rejects any state where a field that should be non-null has been set back to null without a corresponding backward transition." The TLA+ models the set subtraction correctly but does not verify the preservation side -- no invariant checks that artifacts not in the clear set are retained.

The `HaltPipeline` action allows halting from IDLE, which is technically a non-terminal phase. This means a pipeline can be created, never started, and halted -- transitioning from IDLE to HALTED. This is probably fine (user cancels before starting), but the `locked` variable transitions from `FALSE` to `FALSE` (IDLE is not locked, HALTED is not locked), so the `SingleInstance` invariant holds trivially. However, `haltReason` gets set to a non-NONE value, which means a pipeline that was never started can end up in HALTED with `AGENT_FAILURE` as the reason. This is semantically odd.

Objections:
1. Validation failure is not modeled. The spec cannot verify that invalid agent output does not advance state. Add a `ValidationFails` action for each phase that keeps `phase` unchanged and `UNCHANGED vars` (or increments a validation failure counter).
2. No invariant verifies that backward transitions preserve artifacts outside their clear set. `BackToPhase3FromPhase4` should guarantee `briefingPath \in artifacts'` and `designConsensusPath \in artifacts'`.
3. `HaltPipeline` from IDLE allows semantically meaningless halt reasons like `AGENT_FAILURE` for a pipeline that never ran. Consider restricting `HaltPipeline` to `ActivePhases` (non-IDLE, non-terminal) or allowing only `USER_HALT` from IDLE.
4. The design spec mentions that the `advance` CLI must handle missing/unreadable/invalid JSON files before reaching the validator. This pre-validation file I/O failure is not modeled. While this is arguably an infrastructure concern, it affects the state machine's behavior (the pipeline stays in the same phase).
5. Concurrent pipeline runs with the same slug (the Stage 2 debate's #8 MEDIUM objection about file locking) are abstracted away by the `locked` variable. The TLA+ models lock semantics correctly in the abstract, but the real-world race between "check lock" and "acquire lock" is not modeled. This is an acceptable abstraction for a spec focused on the state machine, but should be documented.

Endorsements:
1. The `Phase1ClearSet` and `Phase3ClearSet` constants make backward transition artifact clearing explicit and auditable.
2. The `RetryBounded` invariant correctly addresses the Stage 2 debate's #2 HIGH objection (infinite retry loop).
3. The fix history shows that edge cases were discovered and fixed through model checking (IDLE not being an active phase, early-phase halts with empty experts).
4. The `SingleInstance` invariant correctly models the single-pipeline-at-a-time constraint using `ActivePhases = NonTerminalPhases \ {"IDLE"}`.

---

## All Objections (Consolidated)

1. **HIGH** -- Validation failure is not modeled. The design's two-pass validator (structural + heuristic) is the core behavioral difference between "agent output accepted" and "agent output rejected." The TLA+ models all phase completions as unconditional, meaning it cannot verify that invalid output does not advance state. Add `ValidationFails` actions or document this as a deliberate abstraction boundary. *(expert-tdd, expert-edge-cases)*
2. **HIGH** -- `HaltPipeline` allows `RETRY_EXHAUSTED` as a halt reason even when no retry counter has reached `MaxPipelineRetries`. Add a guard: `reason = "RETRY_EXHAUSTED" => \E p \in RetryablePhases : retries[p] >= MaxPipelineRetries`. *(expert-tla)*
3. **MEDIUM** -- No invariant verifies that backward transitions preserve artifacts outside their clear set. After `BackToPhase3FromPhase4`, `briefingPath` and `designConsensusPath` should be verified as still present in `artifacts`. A `ContextPreservedOnBackward` invariant would close this gap. *(expert-ddd, expert-edge-cases)*
4. **MEDIUM** -- `ArtifactsCumulativeUpTo` is defined but never used in any invariant or property. Either incorporate it into an invariant (strengthening `NoContextWithoutPhase`) or remove it as dead code. *(expert-tla)*
5. **MEDIUM** -- The discriminated union accumulated context from the design (Phase3Context extends Phase2Context extends Phase1Context) is flattened to a set of strings. The type-level guarantees from the design are not verified by the TLA+ spec. This is an acceptable abstraction but should be documented. *(expert-ddd)*
6. **LOW** -- `HaltPipeline` from IDLE allows semantically meaningless halt reasons (`AGENT_FAILURE` for a pipeline that never ran an agent). Consider restricting halt from IDLE to only `USER_HALT`. *(expert-edge-cases)*
7. **LOW** -- Phase 6 produces no artifacts (`ArtifactsProducedBy` returns `{}`), so `NoContextWithoutPhase` does not constrain it. Document this as intentional (code output is not tracked as a pipeline artifact path). *(expert-tdd)*
8. **LOW** -- The `experts_selected` variable lives at the top level in the TLA+ but inside `Phase1Context` in the design spec's accumulated context. Minor domain language divergence. *(expert-ddd)*
9. **LOW** -- Pre-validation file I/O failures (missing/unreadable JSON) and concurrent access races are not modeled. Acceptable for a state machine spec but should be documented as out of scope. *(expert-edge-cases)*

---

## Round 1 Transcript

### expert-tdd (Round 1)

Position: CONDITIONAL SUPPORT

Reasoning:
The TLA+ spec provides a strong skeleton for test case derivation. Each forward transition maps to a "valid advance" test, each backward transition maps to a "retry with context clearing" test, and each invariant maps to a property-based test assertion. The fix history (3 attempts documented in README.md) demonstrates that the spec was iteratively debugged through model checking -- this is the TLA+ equivalent of red-green-refactor, and it is encouraging.

The invariants are directly translatable to Vitest assertions: `RetryBounded` becomes `expect(retries[phase]).toBeLessThanOrEqual(maxRetries)`, `ExpertsConsistent` becomes a guard in every test that advances past PHASE_1, `SingleInstance` becomes a lock acquisition/release check. The 6 safety invariants plus 2 liveness properties give 8 concrete property categories for the test suite.

However, the spec entirely omits validation -- the core differentiator of the design. The design spec dedicates an entire section to the two-pass validator with structural and heuristic passes, error codes with namespace prefixes, and a `ValidationResultSchema` that is itself a tested contract. None of this appears in the TLA+ model. Every forward transition in the TLA+ simply produces artifacts unconditionally. In the real system, `advancePipeline` can fail validation and return errors without advancing state. This means the TLA+ does not model the most testable part of the system. A `ValidationFails` action that keeps the phase unchanged while the retry budget is unaffected would close this gap.

Objections:
1. The two-pass validation model (structural then heuristic) is completely absent from the TLA+ spec. This is the most testable aspect of the design and the most likely source of bugs. The spec should model validation failure as a non-advancing action.
2. The `ValidationResultSchema` error shape contract -- which the Stage 2 debate flagged as needing its own Zod schema and tests -- has no formal counterpart in the TLA+ model.
3. No modeling of the `advance` CLI receiving invalid or missing JSON input files. The design spec explicitly requires graceful error handling for this case.

Endorsements:
1. The fix history in README.md (3 iterative fixes) demonstrates healthy model-checking-driven development -- the TLA+ equivalent of TDD.
2. All 6 safety invariants are directly translatable to Vitest test assertions.
3. The liveness properties (`PipelineTerminates`, `RetryExhaustionLeadsToTermination`) map to integration test scenarios that verify the pipeline does not hang.
4. The `Terminated` stuttering action correctly prevents TLC from reporting false deadlocks in terminal states.

### expert-ddd (Round 1)

Position: CONDITIONAL SUPPORT

Reasoning:
The TLA+ spec uses domain-appropriate naming throughout. Phase names match the design's ubiquitous language (`PHASE_1_QUESTIONER`, `PHASE_2_DESIGN_DEBATE`, etc.), artifact names use the exact path field names from the design (`briefingPath`, `designConsensusPath`, `tlaSpecPath`), and the `Experts` constant represents the expert council concept from the domain. The separation between `RetryablePhases` (only PHASE_1 and PHASE_3 are backward-transition targets) and all other phases correctly encodes a domain rule: not all phases support retry.

The `ArtifactsProducedBy` function is a clean encoding of the domain rule "each phase produces specific artifacts." The `ArtifactsCumulativeUpTo` function (though not directly used as an invariant) represents the accumulated context concept from the design. The `NoContextWithoutPhase` invariant enforces the monotonic context growth that the DDD expert flagged in Stage 2 -- artifacts cannot exist without their producing phase having been reached.

The gap is in richness. The design spec models `accumulatedContext` as a discriminated union where `Phase3Context extends Phase2Context extends Phase1Context`. This is a domain modeling choice that makes invalid combinations unrepresentable at the type level. The TLA+ flattens this into a set of artifact name strings, losing the structural guarantee. The `NoContextWithoutPhase` invariant recovers some of this (it checks phase ordering against artifact presence), but it does not verify that backward transitions correctly clear only the specified subset. For example, `BackToPhase3FromPhase4` clears `{"tlaSpecPath", "tlcResult", "tlaReviewPath"}` -- but nothing in the invariants verifies that `briefingPath` and `designConsensusPath` are preserved after this transition.

Objections:
1. The TLA+ does not verify that backward transitions preserve artifacts they should not clear. `BackToPhase3FromPhase4` clears 3 artifacts but nothing verifies `briefingPath` and `designConsensusPath` survive. A `ContextPreservedOnBackward` invariant would close this gap.
2. The `experts_selected` variable is modeled as a flat set at the top level, while the design spec places `experts` inside `Phase1Context` as part of accumulated context. This is a minor domain language divergence.

Endorsements:
1. Phase names, artifact names, and the `Experts` constant all use the domain's ubiquitous language.
2. `RetryablePhases` as a named set correctly encodes the domain rule that only specific phases accept backward transitions.
3. `ArtifactsProducedBy` cleanly maps the domain concept "each phase produces specific artifacts."
4. `NoContextWithoutPhase` invariant formally captures the Stage 2 debate's demand for monotonic context growth.

### expert-tla (Round 1)

Position: SUPPORT

Reasoning:
The specification is formally well-constructed. The module extends `Integers`, `FiniteSets`, and `TLC` appropriately. The `TypeOK` invariant is comprehensive, covering all 6 variables with precise type constraints. The `CASE` expressions in `PhaseOrd` and `ArtifactsProducedBy` enumerate all phases explicitly with no default fallthrough for forward transitions (the `OTHER` clause returns `{}` only for phases that produce no artifacts, which is correct for IDLE, COMPLETE, HALTED, and PHASE_6). The `Spec` formula uses `WF_vars(Next)` for weak fairness, which is appropriate -- it guarantees that if `Next` is continuously enabled, it will eventually be taken. This prevents infinite stuttering and ensures the liveness properties can be verified.

TLC passed with `MaxPipelineRetries = 2` and `Experts = {"tdd", "ddd", "tla"}`. With 3 experts and 2 max retries, the state space is 2,392 states (1,296 distinct). This is small enough for exhaustive exploration but large enough to exercise all backward transition paths and retry exhaustion scenarios. The fix history shows 3 iterations to reach a clean pass, which is normal for a spec of this complexity.

Two formal concerns. First, `WF_vars(Next)` applies weak fairness to the entire disjunction of actions. This means TLC will ensure that if any action in `Next` is enabled, some action will eventually fire. This is sufficient for the pipeline because in any non-terminal state, at least one forward or halt action is always enabled. Second, the `RetryExhaustionLeadsToTermination` liveness property checks `\E p \in RetryablePhases : retries[p] >= MaxPipelineRetries` leads to terminal. This is correct but slightly weaker than ideal -- it does not require that the specific cause of termination is `RETRY_EXHAUSTED`.

Objections:
1. The `HaltPipeline` action allows `RETRY_EXHAUSTED` as a halt reason from any non-terminal phase, even when no retry counter has reached `MaxPipelineRetries`. This makes `HaltReasonConsistent` weaker than it should be. Add a guard: `reason = "RETRY_EXHAUSTED" => \E p \in RetryablePhases : retries[p] >= MaxPipelineRetries`.
2. The `ArtifactsCumulativeUpTo` operator is defined but never used in any invariant or property. Either use it or remove it to avoid dead code in the spec.

Endorsements:
1. `WF_vars(Next)` is the correct fairness choice for a single-actor sequential pipeline.
2. The fix history demonstrates proper iterative model-checking discipline.
3. TLC configuration with small constants is sufficient to explore all interesting state space patterns.
4. The `Terminated` stuttering action is the correct way to prevent false TLC deadlock reports.
5. All 6 safety invariants are necessary and sufficient for the modeled scope.
6. The `PhaseOrd` function provides a clean total ordering that enables concise invariant expression.

### expert-edge-cases (Round 1)

Position: CONDITIONAL SUPPORT

Edge Cases Found:
- [Validation gap] Agent output rejected by validator -- the TLA+ models all completions as unconditional, but the real system can reject output and stay in the same phase.
- [Artifact preservation] Backward transition clears subset but no invariant verifies the complement is preserved.
- [Semantic halt] `HaltPipeline` from IDLE with `AGENT_FAILURE` reason -- pipeline never ran an agent.
- [Semantic halt] `RETRY_EXHAUSTED` halt reason selectable when retries are at 0.
- [Phase 6 gap] Pair programming phase produces no tracked artifacts -- `NoContextWithoutPhase` does not constrain it.
- [File I/O] Missing/invalid JSON input to `advance` CLI -- not modeled.
- [Concurrency] Lock variable abstracts file-based lock mechanism -- check-then-acquire race not modeled.
- [Disk vs state] Backward transitions clear artifacts from state but files persist on disk -- divergence between state store and filesystem.

Reasoning:
The TLA+ spec models the "happy path" state machine and the retry/halt escape hatches correctly. However, several edge cases from the design spec are not modeled, and two of these represent real gaps rather than acceptable abstractions.

The most significant gap is validation failure. The design spec describes a two-pass validator that can reject agent output, returning structured errors without advancing state. The TLA+ models every phase completion as unconditional artifact production. In reality, `advancePipeline("slug", "output.json")` can fail validation and return `{ valid: false, errors: [...] }`. This means the real system has more states than the TLA+ models.

The second gap is backward transition artifact preservation. When `BackToPhase3FromPhase4` fires, it clears `{"tlaSpecPath", "tlcResult", "tlaReviewPath"}` but preserves `briefingPath` and `designConsensusPath`. But no invariant verifies the preservation side. The design spec says "the state store enforces this: `saveSession` rejects any state where a field that should be non-null has been set back to null without a corresponding backward transition." The TLA+ models the set subtraction correctly but does not verify the preservation direction.

Objections:
1. Validation failure is not modeled. The spec cannot verify that invalid agent output does not advance state.
2. No invariant verifies that backward transitions preserve artifacts outside their clear set.
3. `HaltPipeline` from IDLE allows semantically meaningless halt reasons like `AGENT_FAILURE`.
4. Pre-validation file I/O failures and concurrent access races are not modeled.
5. Backward transitions clear state but files persist on disk -- the divergence is not addressed.

Endorsements:
1. `Phase1ClearSet` and `Phase3ClearSet` constants make backward transition clearing explicit and auditable.
2. `RetryBounded` invariant addresses the Stage 2 debate's #2 HIGH objection.
3. Fix history shows edge cases were discovered through model checking.
4. `SingleInstance` invariant correctly uses `ActivePhases = NonTerminalPhases \ {"IDLE"}`.
