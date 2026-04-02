# TLA+ Specification: Design Pipeline TypeScript Engine

## Source
Briefing: `docs/superpowers/specs/2026-04-01-design-pipeline-ts-engine-design.md`
Debate: `docs/debate-moderator-sessions/2026-04-01_design-pipeline-ts-engine.md`
Review: `docs/debate-moderator-sessions/2026-04-01_design-pipeline-ts-engine-tla-review.md`

## Specification
- **Module:** `DesignPipelineEngine.tla`
- **Config:** `DesignPipelineEngine.cfg`

## States
- IDLE -- pipeline not started
- PHASE_1_QUESTIONER -- requirements elicitation, expert selection
- PHASE_2_DESIGN_DEBATE -- expert council debate on design
- PHASE_3_TLA_WRITER -- formal TLA+ specification writing
- PHASE_4_TLA_REVIEW -- expert review of TLA+ spec
- PHASE_5_IMPLEMENTATION -- implementation plan writing
- PHASE_6_PAIR_PROGRAMMING -- autonomous code execution
- COMPLETE -- pipeline finished successfully
- HALTED -- pipeline stopped due to error, retry exhaustion, validation exhaustion, or user request

## Transitions Modeled
### Forward (7)
- IDLE -> PHASE_1 (unconditional, acquires lock)
- PHASE_1 -> PHASE_2 (guard: briefingPath set, experts non-empty, validation passed)
- PHASE_2 -> PHASE_3 (guard: designConsensusPath set, validation passed)
- PHASE_3 -> PHASE_4 (guard: tlaSpecPath set, validation passed)
- PHASE_4 -> PHASE_5 (guard: tlaReviewPath set, validation passed)
- PHASE_5 -> PHASE_6 (guard: implementationPlanPath set, validation passed)
- PHASE_6 -> COMPLETE (unconditional, releases lock)

### Validation Failure (1)
- ANY validated phase -> same phase (increments validationAttempts, no state advancement, no artifacts produced)

### Backward (3)
- PHASE_3 -> PHASE_1 (clears all context, increments retries[PHASE_1], resets validationAttempts)
- PHASE_4 -> PHASE_3 (clears tlaSpecPath/tlcResult/tlaReviewPath, increments retries[PHASE_3], resets validationAttempts)
- PHASE_4 -> PHASE_1 (clears all context, increments retries[PHASE_1], resets validationAttempts)

All backward transitions blocked when `retries[targetPhase] >= MaxPipelineRetries`.

### Halt (4 -- split by reason)
- ANY non-terminal -> HALTED with USER_HALT (unconditional)
- ANY non-terminal -> HALTED with AGENT_FAILURE (unconditional)
- ANY non-terminal -> HALTED with RETRY_EXHAUSTED (guarded: requires at least one retry counter at max)
- ANY validated phase -> HALTED with VALIDATION_EXHAUSTED (guarded: requires validationAttempts >= MaxValidationAttempts)

## Properties Verified
### Safety (Invariants)
- **TypeOK** -- all variables within declared type domains
- **RetryBounded** -- `retries[p] <= MaxPipelineRetries` for all retryable phases
- **ExpertsConsistent** -- experts non-empty for all active phases past PHASE_1
- **HaltReasonConsistent** -- `haltReason != "NONE"` if and only if `phase = "HALTED"`
- **NoContextWithoutPhase** -- artifacts only present if their producing phase has been reached
- **SingleInstance** -- lock held if and only if pipeline is in an active (non-IDLE, non-terminal) phase
- **ValidationAttemptsBounded** -- `validationAttempts <= MaxValidationAttempts`
- **ArtifactPreservation** -- for any non-IDLE, non-HALTED phase, all artifacts produced by prior phases are present (verifies backward transitions preserve artifacts outside their clear set)

### Liveness
- **PipelineTerminates** -- from any non-IDLE state, the pipeline eventually reaches COMPLETE or HALTED
- **RetryExhaustionLeadsToTermination** -- if any retry counter reaches max, the pipeline eventually reaches a terminal state
- **ValidationExhaustionLeadsToTermination** -- if validation attempts reach max, the pipeline eventually reaches a terminal state

## Design Correspondence Notes

### Discriminated union context (MEDIUM objection #5)
The design spec uses `Phase3Context extends Phase2Context extends Phase1Context` to make invalid artifact combinations unrepresentable at the type level. The TLA+ flattens this to a set of artifact name strings. The `NoContextWithoutPhase` invariant is the TLA+ equivalent -- it enforces the same ordering constraint that the discriminated union enforces via structural typing. The `ArtifactPreservation` invariant further strengthens this by verifying the preservation direction (backward transitions do not accidentally clear required artifacts).

### Phase 6 artifacts
`ArtifactsProducedBy("PHASE_6_PAIR_PROGRAMMING")` returns `{}`. Code output from pair programming is the final deliverable, not intermediate pipeline context. It is not tracked as a pipeline artifact path. This is intentional.

### Out of scope
- Atomic write-to-temp-then-rename (infrastructure concern)
- File-based lock mechanism details (abstracted by `locked` variable)
- Pre-validation file I/O failures (missing/invalid JSON input)
- Concurrent access races (single-actor model is sufficient for pipeline state machine)

## TLC Results
- **States generated:** 6,527
- **Distinct states:** 3,149
- **Result:** PASS -- no errors found
- **Workers:** 4
- **Date:** 2026-04-01
- **Model constants:** MaxPipelineRetries = 2, MaxValidationAttempts = 2, Experts = {"tdd", "ddd", "tla"}

## Fix History
- **Attempt 1:** `SingleInstance` invariant violated in initial state -- IDLE is non-terminal but lock is not held. Fixed by defining `ActivePhases = NonTerminalPhases \ {"IDLE"}`.
- **Attempt 2:** `ExpertsConsistent` invariant violated when halting from IDLE -- HALTED has high phase ordinal but empty experts is valid for early halts. Fixed by scoping the invariant to active non-terminal phases only.
- **Attempt 3:** TLC reported deadlock in terminal states. Fixed by adding explicit `Terminated` stuttering action for COMPLETE and HALTED.

## Revision History
### Revision 1 (2026-04-01) -- Review debate objections
Addresses 2 HIGH and 3 MEDIUM objections from the TLA+ review debate.

**HIGH #1 — Validation failure modeled:** Added `validationAttempts` variable, `ValidatedPhases` set, `ValidationFails` action (phase stays, counter increments), and `HaltValidationExhausted` action (forced halt when attempts exhausted). Forward transitions now reset the counter. Added `ValidationAttemptsBounded` invariant and `ValidationExhaustionLeadsToTermination` liveness property. Added `VALIDATION_EXHAUSTED` halt reason.

**HIGH #2 — `RETRY_EXHAUSTED` guarded:** Split `HaltPipeline` into three separate actions: `HaltUserRequest`, `HaltAgentFailure`, `HaltRetryExhausted`. The `HaltRetryExhausted` action is guarded by `\E p \in RetryablePhases : retries[p] >= MaxPipelineRetries`, preventing semantically invalid halt reasons.

**MEDIUM #3 — Artifact preservation invariant:** Added `ArtifactPreservation` invariant that checks `ArtifactsCumulativeUpTo(phase) \subseteq artifacts` for all non-IDLE, non-HALTED phases. This verifies backward transitions preserve artifacts outside their clear set.

**MEDIUM #4 — `ArtifactsCumulativeUpTo` used:** The previously dead operator is now used in the `ArtifactPreservation` invariant.

**MEDIUM #5 — Discriminated union documented:** Added comments explaining that `NoContextWithoutPhase` is the TLA+ equivalent of the design's discriminated union type system. Added "Design Correspondence Notes" section to README.

## Prior Versions
None
