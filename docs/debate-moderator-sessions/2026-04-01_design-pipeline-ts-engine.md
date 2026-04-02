# Debate Session — Design Pipeline TypeScript Engine

**Date:** 2026-04-01
**Result:** CONSENSUS REACHED
**Rounds:** 1
**Experts:** expert-tdd, expert-ddd, expert-tla, expert-edge-cases

---

## Agreed Recommendation

The design is sound and should proceed to implementation. The core architecture -- Bun CLI engine with Zod contracts, two-pass validation, file-based state persistence, and a thin SKILL.md wrapper -- is well-conceived and addresses the real problem of informal pipeline orchestration. All four experts support the design with amendments. The consolidated amendments are:

1. **Atomic write for state.json** -- Use write-to-temp-then-rename to prevent corruption on crash between validate and save. This is the highest-priority amendment.
2. **File locking or single-instance guard** -- Prevent concurrent pipeline runs from corrupting shared state.json.
3. **Loosen TLA+ heuristic** -- The keyword check for `VARIABLES`, `Init`, `Next` is too rigid; PlusCal specs compile to TLA+ with different surface syntax. Use a union of keyword sets or allow the heuristic to be configurable per spec style.
4. **Test the validator error shape contract** -- Add dedicated tests that the error shape (`path`, `code`, `expected`, `received`, `hint`) is stable and that heuristic errors are distinguishable from structural errors by `code` prefix.
5. **Backward transition guard needs a max-retry halt** -- The spec says backward transitions increment retry count, but does not specify when retries exhaust. Add a `maxPipelineRetries` constant and a guard that transitions to HALTED when exceeded.
6. **`CodeWriterInputSchema` re-export strategy** -- The backward-compatibility re-export from `trainer-input.ts` should carry a `@deprecated` JSDoc tag and a planned removal date to prevent indefinite dual-path maintenance.

---

## Expert Final Positions

**expert-tdd**
Position: CONDITIONAL SUPPORT

Reasoning:
The testing strategy is exemplary in its ambition: 100% coverage thresholds with `autoUpdate: true`, one `.test.ts` per contract, real temp directories instead of mocks for file I/O, and explicit categories for contract tests, state machine tests, validator tests, state store tests, and engine tests. This is a test-first-friendly design. The two-pass validator (structural then heuristic) maps cleanly onto a red-green-refactor cycle: write a test for the structural pass, implement the Zod schema, then write a test for the heuristic pass and implement the domain check.

The decision to avoid mocking Bun file APIs and use real temp directories is the correct call. Mocking `Bun.file()` would produce tests that pass while the real system breaks on permission errors, path resolution, or encoding issues. Real I/O tests are slower but honest.

Two concerns remain. First, the validator error shape (`path`, `code`, `expected`, `received`, `hint`) is itself a contract that downstream consumers (the SKILL.md, Claude's parsing logic) depend on. If this shape drifts, Claude will misinterpret validation failures. This shape needs its own Zod schema and its own test suite -- it is not just an implementation detail. Second, the spec does not mention how engine tests will handle the CLI entrypoint. Testing `pipeline-runner.ts` as a CLI (spawning a Bun subprocess) is slow and fragile. The engine should expose its logic as importable functions that the CLI entrypoint delegates to, so tests can call the functions directly and only a thin integration test covers the CLI parsing layer.

Objections:
1. The validator error shape needs a dedicated Zod schema and tests asserting its stability -- it is a contract consumed by Claude's parsing logic.
2. The CLI entrypoint (`pipeline-runner.ts`) should separate importable engine functions from the CLI argument parsing layer, so unit tests can call functions directly without subprocess spawning.
3. No mention of how heuristic error codes are namespaced vs. structural error codes -- tests need to distinguish them by convention (e.g., `STRUCTURAL_*` vs. `HEURISTIC_*` code prefixes).

Endorsements:
1. Real temp directories over mocks for Bun file API tests -- honest integration testing.
2. Two-pass validation maps perfectly to incremental TDD: structural pass first, heuristic pass second.
3. 100% coverage thresholds with `autoUpdate: true` as a floor, not a target.
4. One `.test.ts` per contract file -- clean test organization.

---

**expert-ddd**
Position: CONDITIONAL SUPPORT

Reasoning:
The domain modeling is largely clean. The separation between engine (orchestration infrastructure), contracts (domain validation rules), and state-machine (lifecycle transitions) reflects proper bounded context thinking. The engine does not contain business rules -- it delegates to validators and state machines. The contracts encode domain knowledge about what valid agent output looks like. This is the right separation.

The rename from `TrainerInputSchema` to `CodeWriterInputSchema` is a significant improvement in ubiquitous language. "Trainer" was an implementation-specific term that leaked the identity of a specific agent into what is actually a shared contract for all code-writing agents. `CodeWriterInputSchema` speaks the language of the pipeline domain: there are code writers, and they share an input contract. The backward-compatibility re-export is pragmatic but should be marked `@deprecated` with a planned removal date to prevent indefinite dual naming.

One concern: the `accumulatedContext` object in the persisted state is a flat bag of nullable paths. This is an anemic representation. Each phase produces a specific artifact, and the accumulated context is really the pipeline's growing "briefing document" -- a domain concept. Consider whether `accumulatedContext` should be a discriminated union or a growing record type that makes it impossible to represent states where, say, `tlaSpecPath` is non-null but `briefingPath` is null (which would be an invariant violation). The current flat nullable design pushes invariant enforcement entirely onto the transition guards, which works but is less expressive than making invalid states unrepresentable in the type system.

Objections:
1. The `accumulatedContext` flat nullable structure is anemic -- it should leverage TypeScript's type system to make invalid context combinations unrepresentable (e.g., `tlaSpecPath` cannot be non-null if `briefingPath` is null).
2. The backward-compatibility re-export of `TrainerInputSchema` needs a `@deprecated` JSDoc annotation and planned removal date to prevent indefinite dual naming.

Endorsements:
1. The rename from `TrainerInputSchema` to `CodeWriterInputSchema` correctly applies ubiquitous language -- "code writer" is a domain concept, "trainer" was an agent identity leak.
2. Engine/contracts/state-machine separation reflects proper bounded contexts.
3. The two-pass validator (structural then heuristic) correctly separates schema validation (infrastructure concern) from domain validation (business rules).

---

**expert-tla**
Position: CONDITIONAL SUPPORT

State Model:
States: IDLE, PHASE_1_QUESTIONER, PHASE_2_DESIGN_DEBATE, PHASE_3_TLA_WRITER, PHASE_4_TLA_REVIEW, PHASE_5_IMPLEMENTATION, PHASE_6_PAIR_PROGRAMMING, COMPLETE, HALTED
Transitions:
  IDLE -> PHASE_1 [always]
  PHASE_1 -> PHASE_2 [briefingPath != null AND experts non-empty]
  PHASE_2 -> PHASE_3 [designConsensusPath != null]
  PHASE_3 -> PHASE_4 [tlaSpecPath != null]
  PHASE_4 -> PHASE_5 [tlaReviewPath != null]
  PHASE_4 -> PHASE_3 [backward, increments retry]
  PHASE_5 -> PHASE_6 [implementationPlanPath != null]
  PHASE_6 -> COMPLETE [always]
  ANY non-terminal -> HALTED [always]

Reasoning:
The pipeline state machine is well-designed for a sequential workflow. The transition guards are explicit and enforce that each phase produces its required artifact before the next phase can begin. The backward transition from PHASE_4 to PHASE_3 (TLA review rejects spec, sends it back for rewriting) is a correct modeling of a real workflow need. The HALTED terminal state is reachable from any non-terminal state, which is essential for graceful failure handling.

However, there are two gaps in the formal model. First, the backward transition increments a retry count, but the spec does not define a maximum retry count or a guard that transitions to HALTED when retries are exhausted. Without this, the system can loop infinitely between PHASE_3 and PHASE_4 -- a liveness violation. The step-lifecycle state machine correctly models this pattern (it has `tddCyclesExhausted` and `contractRetriesExhausted` guards), but the pipeline-lifecycle does not follow the same discipline. Second, the spec mentions backward transitions generally ("e.g., PHASE_4 -> PHASE_3") but does not enumerate all valid backward transitions. Is PHASE_5 -> PHASE_4 valid? PHASE_6 -> PHASE_5? The state space must be fully enumerated -- "e.g." is not a specification.

The relationship between the existing step-lifecycle TLA+ spec and the new pipeline-lifecycle is sound in principle: the step-lifecycle models the inner loop of a single TDD step within a phase, while the pipeline-lifecycle models the outer loop of phase sequencing. These are nested state machines with clear scope boundaries.

Safety property: the accumulated context must be monotonically growing -- once a path is set non-null, it should not revert to null except on a backward transition that invalidates that specific artifact. This invariant is implicit in the spec but not stated.

Liveness property: every non-terminal state must eventually reach either COMPLETE or HALTED. The current design satisfies this only if backward transitions have a bounded retry count.

Objections:
1. No maximum retry count for backward transitions -- the system can loop infinitely between PHASE_3 and PHASE_4, violating liveness. Add `maxPipelineRetries` with a guard to HALTED.
2. Backward transitions are specified by example ("e.g., PHASE_4 -> PHASE_3") rather than enumerated exhaustively. The full set of valid backward transitions must be listed.
3. The safety invariant "accumulated context is monotonically growing except on backward transitions" is implicit -- it should be stated explicitly and enforced in the state store.
4. The `start` command jumps from IDLE to PHASE_1_QUESTIONER in the JSON response but the transition IDLE -> PHASE_1 is not explicitly guarded in the transition table. Confirm this is an unconditional transition.

Endorsements:
1. Transition guards on forward transitions correctly enforce artifact accumulation before phase advancement.
2. The nested state machine design (pipeline-lifecycle wraps step-lifecycle) has clean scope separation.
3. HALTED as a universal escape state from any non-terminal state is correct failure modeling.
4. File-based state persistence with schema validation on every read/write is a sound approach for crash recovery.

---

**expert-edge-cases**
Position: CONDITIONAL SUPPORT

Edge Cases Found:
- [Partial failure] State.json corrupted mid-write -- if Bun crashes between `Bun.write()` starting and completing, the file may be truncated or empty. Next `loadSession` will fail schema validation and the pipeline is unrecoverable.
- [Concurrency] Two terminal sessions running `/design-pipeline` simultaneously with the same slug -- both read state.json, both advance, second write silently overwrites first's progress.
- [Heuristic fragility] TLA+ keyword heuristic checks for `VARIABLES`, `Init`, `Next` -- a PlusCal spec that compiles to TLA+ may not contain these exact strings in the source file. The heuristic would false-reject a valid spec.
- [Boundary] Agent returns structurally valid but semantically empty output -- e.g., `participatingExperts: ["expert-tdd"]` when `experts: ["expert-tdd", "expert-ddd", "expert-tla", "expert-edge-cases"]`. The structural pass succeeds but the heuristic must catch this. Is the heuristic enforced or advisory?
- [Sequence] `advance` called with output for wrong phase -- agent output for PHASE_1 submitted when pipeline is in PHASE_3. The structural validation would use the wrong schema.
- [File I/O] Output JSON path passed to `advance` does not exist or is not valid JSON -- the CLI must handle this gracefully before reaching the validator.
- [Boundary] Empty `experts` array after PHASE_1 -- transition guard requires `experts` non-empty, but what if the questioner output includes experts and they are later removed from state by a bug?
- [Scale] Very large agent output (e.g., a TLA+ spec that is 50,000 lines) -- does `Bun.file().json()` handle this without memory issues?

Reasoning:
The most critical unhandled edge case is the non-atomic state write. The spec says "every read and write validates against the schema" and "invalid state is never persisted or loaded," but this guarantee breaks if the process crashes during the write itself. The mitigation is straightforward: write to a temporary file, validate the temporary file, then atomically rename it over `state.json`. This is a well-known pattern for crash-safe file persistence. Without it, any crash during `saveSession` leaves the pipeline in an unrecoverable state.

The second most serious issue is the TLA+ heuristic. Checking for literal strings like `VARIABLES` and `Init` is fragile. PlusCal algorithms use `variables` (lowercase) and `begin`/`end` instead of `Init`/`Next` -- the TLA+ translation is auto-generated and may live in comments. A spec written in PlusCal style would fail this heuristic despite being a perfectly valid TLA+ module. The heuristic should either accept a broader set of keywords (union of TLA+ and PlusCal indicators) or allow the writer contract to declare the spec style.

The concurrency issue is real but may be acceptable as a "known limitation" if the SKILL.md documents that only one pipeline run per slug is supported. A simple file lock (or even a PID file) would close this gap.

Objections:
1. State writes are not atomic -- a crash during `Bun.write()` can corrupt `state.json` beyond recovery. Use write-to-temp-then-rename.
2. TLA+ keyword heuristic is too rigid -- PlusCal specs use different surface syntax (`variables`, `begin`/`end`). Use a union of keyword sets or make the heuristic style-aware.
3. No file locking or single-instance guard -- concurrent runs with the same slug will corrupt state.
4. The `advance` CLI command does not specify behavior when the output JSON file is missing, unreadable, or not valid JSON -- this must produce a clear error, not an unhandled exception.
5. The heuristic for expert participation (every expert in input must appear in output `participatingExperts`) should use set equality or subset checking with a clear error message listing the missing experts.

Endorsements:
1. Schema validation on every read and write is the right defensive approach -- it catches drift early.
2. The two-pass validator with short-circuit on structural failure prevents confusing heuristic errors when the data shape is already wrong.
3. The decision to gitignore state.json and treat it as ephemeral is correct -- it avoids accidental commits of runtime state.
4. Structured error return shape with `path`, `code`, `expected`, `received`, `hint` gives Claude actionable information to self-correct.

---

## All Objections (Consolidated)

1. **HIGH** -- State writes are not atomic. A crash during `Bun.write()` can corrupt `state.json` beyond recovery. Use write-to-temp-then-rename pattern. *(expert-edge-cases)*
2. **HIGH** -- No maximum retry count for backward transitions. The system can loop infinitely between PHASE_3 and PHASE_4, violating liveness. Add `maxPipelineRetries` with a guard to HALTED. *(expert-tla)*
3. **HIGH** -- TLA+ keyword heuristic (`VARIABLES`, `Init`, `Next`) is too rigid for PlusCal specs. Use a union of keyword sets or make the heuristic style-aware. *(expert-edge-cases)*
4. **MEDIUM** -- Backward transitions are specified by example ("e.g.") rather than enumerated exhaustively. The full set of valid backward transitions must be listed. *(expert-tla)*
5. **MEDIUM** -- The validator error shape needs a dedicated Zod schema and tests asserting its stability, since it is a contract consumed by Claude's parsing logic. *(expert-tdd)*
6. **MEDIUM** -- The `accumulatedContext` flat nullable structure should leverage TypeScript's type system to make invalid context combinations unrepresentable. *(expert-ddd)*
7. **MEDIUM** -- The CLI entrypoint should separate importable engine functions from CLI argument parsing so unit tests can call functions directly. *(expert-tdd)*
8. **MEDIUM** -- No file locking or single-instance guard for concurrent pipeline runs with the same slug. *(expert-edge-cases)*
9. **LOW** -- Heuristic error codes should be namespaced distinctly from structural error codes (e.g., `STRUCTURAL_*` vs `HEURISTIC_*` prefixes). *(expert-tdd)*
10. **LOW** -- The backward-compatibility re-export of `TrainerInputSchema` needs `@deprecated` JSDoc and a planned removal date. *(expert-ddd)*
11. **LOW** -- The safety invariant "accumulated context is monotonically growing except on backward transitions" should be stated explicitly. *(expert-tla)*
12. **LOW** -- The `advance` CLI command must specify behavior for missing/unreadable/invalid output JSON files. *(expert-edge-cases)*
13. **LOW** -- The IDLE -> PHASE_1 transition should be confirmed as unconditional in the transition table. *(expert-tla)*

---

## Round 1 Transcript

### expert-tdd (Round 1)

Position: CONDITIONAL SUPPORT

Reasoning:
The testing strategy is exemplary in its ambition: 100% coverage thresholds with `autoUpdate: true`, one `.test.ts` per contract, real temp directories instead of mocks for file I/O, and explicit categories for contract tests, state machine tests, validator tests, state store tests, and engine tests. This is a test-first-friendly design. The two-pass validator (structural then heuristic) maps cleanly onto a red-green-refactor cycle: write a test for the structural pass, implement the Zod schema, then write a test for the heuristic pass and implement the domain check.

The decision to avoid mocking Bun file APIs and use real temp directories is the correct call. Mocking `Bun.file()` would produce tests that pass while the real system breaks on permission errors, path resolution, or encoding issues. Real I/O tests are slower but honest.

Two concerns remain. First, the validator error shape (`path`, `code`, `expected`, `received`, `hint`) is itself a contract that downstream consumers (the SKILL.md, Claude's parsing logic) depend on. If this shape drifts, Claude will misinterpret validation failures. This shape needs its own Zod schema and its own test suite -- it is not just an implementation detail. Second, the spec does not mention how engine tests will handle the CLI entrypoint. Testing `pipeline-runner.ts` as a CLI (spawning a Bun subprocess) is slow and fragile. The engine should expose its logic as importable functions that the CLI entrypoint delegates to, so tests can call the functions directly and only a thin integration test covers the CLI parsing layer.

Objections:
1. The validator error shape needs a dedicated Zod schema and tests asserting its stability -- it is a contract consumed by Claude's parsing logic.
2. The CLI entrypoint (`pipeline-runner.ts`) should separate importable engine functions from the CLI argument parsing layer, so unit tests can call functions directly without subprocess spawning.
3. No mention of how heuristic error codes are namespaced vs. structural error codes -- tests need to distinguish them by convention (e.g., `STRUCTURAL_*` vs. `HEURISTIC_*` code prefixes).

Endorsements:
1. Real temp directories over mocks for Bun file API tests -- honest integration testing.
2. Two-pass validation maps perfectly to incremental TDD: structural pass first, heuristic pass second.
3. 100% coverage thresholds with `autoUpdate: true` as a floor, not a target.
4. One `.test.ts` per contract file -- clean test organization.

### expert-ddd (Round 1)

Position: CONDITIONAL SUPPORT

Reasoning:
The domain modeling is largely clean. The separation between engine (orchestration infrastructure), contracts (domain validation rules), and state-machine (lifecycle transitions) reflects proper bounded context thinking. The engine does not contain business rules -- it delegates to validators and state machines. The contracts encode domain knowledge about what valid agent output looks like. This is the right separation.

The rename from `TrainerInputSchema` to `CodeWriterInputSchema` is a significant improvement in ubiquitous language. "Trainer" was an implementation-specific term that leaked the identity of a specific agent into what is actually a shared contract for all code-writing agents. `CodeWriterInputSchema` speaks the language of the pipeline domain: there are code writers, and they share an input contract. The backward-compatibility re-export is pragmatic but should be marked `@deprecated` with a planned removal date to prevent indefinite dual naming.

One concern: the `accumulatedContext` object in the persisted state is a flat bag of nullable paths. This is an anemic representation. Each phase produces a specific artifact, and the accumulated context is really the pipeline's growing "briefing document" -- a domain concept. Consider whether `accumulatedContext` should be a discriminated union or a growing record type that makes it impossible to represent states where, say, `tlaSpecPath` is non-null but `briefingPath` is null (which would be an invariant violation). The current flat nullable design pushes invariant enforcement entirely onto the transition guards, which works but is less expressive than making invalid states unrepresentable in the type system.

Objections:
1. The `accumulatedContext` flat nullable structure is anemic -- it should leverage TypeScript's type system to make invalid context combinations unrepresentable (e.g., `tlaSpecPath` cannot be non-null if `briefingPath` is null).
2. The backward-compatibility re-export of `TrainerInputSchema` needs a `@deprecated` JSDoc annotation and planned removal date to prevent indefinite dual naming.

Endorsements:
1. The rename from `TrainerInputSchema` to `CodeWriterInputSchema` correctly applies ubiquitous language -- "code writer" is a domain concept, "trainer" was an agent identity leak.
2. Engine/contracts/state-machine separation reflects proper bounded contexts.
3. The two-pass validator (structural then heuristic) correctly separates schema validation (infrastructure concern) from domain validation (business rules).

### expert-tla (Round 1)

Position: CONDITIONAL SUPPORT

State Model:
States: IDLE, PHASE_1_QUESTIONER, PHASE_2_DESIGN_DEBATE, PHASE_3_TLA_WRITER, PHASE_4_TLA_REVIEW, PHASE_5_IMPLEMENTATION, PHASE_6_PAIR_PROGRAMMING, COMPLETE, HALTED
Transitions:
  IDLE -> PHASE_1 [always]
  PHASE_1 -> PHASE_2 [briefingPath != null AND experts non-empty]
  PHASE_2 -> PHASE_3 [designConsensusPath != null]
  PHASE_3 -> PHASE_4 [tlaSpecPath != null]
  PHASE_4 -> PHASE_5 [tlaReviewPath != null]
  PHASE_4 -> PHASE_3 [backward, increments retry]
  PHASE_5 -> PHASE_6 [implementationPlanPath != null]
  PHASE_6 -> COMPLETE [always]
  ANY non-terminal -> HALTED [always]

Reasoning:
The pipeline state machine is well-designed for a sequential workflow. The transition guards are explicit and enforce that each phase produces its required artifact before the next phase can begin. The backward transition from PHASE_4 to PHASE_3 (TLA review rejects spec, sends it back for rewriting) is a correct modeling of a real workflow need. The HALTED terminal state is reachable from any non-terminal state, which is essential for graceful failure handling.

However, there are two gaps in the formal model. First, the backward transition increments a retry count, but the spec does not define a maximum retry count or a guard that transitions to HALTED when retries are exhausted. Without this, the system can loop infinitely between PHASE_3 and PHASE_4 -- a liveness violation. The step-lifecycle state machine correctly models this pattern (it has `tddCyclesExhausted` and `contractRetriesExhausted` guards), but the pipeline-lifecycle does not follow the same discipline. Second, the spec mentions backward transitions generally ("e.g., PHASE_4 -> PHASE_3") but does not enumerate all valid backward transitions. Is PHASE_5 -> PHASE_4 valid? PHASE_6 -> PHASE_5? The state space must be fully enumerated -- "e.g." is not a specification.

The relationship between the existing step-lifecycle TLA+ spec and the new pipeline-lifecycle is sound in principle: the step-lifecycle models the inner loop of a single TDD step within a phase, while the pipeline-lifecycle models the outer loop of phase sequencing. These are nested state machines with clear scope boundaries.

Objections:
1. No maximum retry count for backward transitions -- the system can loop infinitely between PHASE_3 and PHASE_4, violating liveness. Add `maxPipelineRetries` with a guard to HALTED.
2. Backward transitions are specified by example ("e.g., PHASE_4 -> PHASE_3") rather than enumerated exhaustively. The full set of valid backward transitions must be listed.
3. The safety invariant "accumulated context is monotonically growing except on backward transitions" is implicit -- it should be stated explicitly and enforced in the state store.
4. The `start` command jumps from IDLE to PHASE_1_QUESTIONER in the JSON response but the transition IDLE -> PHASE_1 is not explicitly guarded in the transition table. Confirm this is an unconditional transition.

Endorsements:
1. Transition guards on forward transitions correctly enforce artifact accumulation before phase advancement.
2. The nested state machine design (pipeline-lifecycle wraps step-lifecycle) has clean scope separation.
3. HALTED as a universal escape state from any non-terminal state is correct failure modeling.
4. File-based state persistence with schema validation on every read/write is a sound approach for crash recovery.

### expert-edge-cases (Round 1)

Position: CONDITIONAL SUPPORT

Edge Cases Found:
- [Partial failure] State.json corrupted mid-write -- if Bun crashes between `Bun.write()` starting and completing, the file may be truncated or empty. Next `loadSession` will fail schema validation and the pipeline is unrecoverable.
- [Concurrency] Two terminal sessions running `/design-pipeline` simultaneously with the same slug -- both read state.json, both advance, second write silently overwrites first's progress.
- [Heuristic fragility] TLA+ keyword heuristic checks for `VARIABLES`, `Init`, `Next` -- a PlusCal spec that compiles to TLA+ may not contain these exact strings in the source file. The heuristic would false-reject a valid spec.
- [Boundary] Agent returns structurally valid but semantically empty output -- e.g., `participatingExperts: ["expert-tdd"]` when `experts: ["expert-tdd", "expert-ddd", "expert-tla", "expert-edge-cases"]`. The structural pass succeeds but the heuristic must catch this.
- [Sequence] `advance` called with output for wrong phase -- agent output for PHASE_1 submitted when pipeline is in PHASE_3. The structural validation would use the wrong schema.
- [File I/O] Output JSON path passed to `advance` does not exist or is not valid JSON -- the CLI must handle this gracefully before reaching the validator.
- [Boundary] Empty `experts` array after PHASE_1 -- transition guard requires `experts` non-empty, but what if the questioner output includes experts and they are later removed from state by a bug?
- [Scale] Very large agent output (e.g., a TLA+ spec that is 50,000 lines) -- does `Bun.file().json()` handle this without memory issues?

Reasoning:
The most critical unhandled edge case is the non-atomic state write. The spec says "every read and write validates against the schema" and "invalid state is never persisted or loaded," but this guarantee breaks if the process crashes during the write itself. The mitigation is straightforward: write to a temporary file, validate the temporary file, then atomically rename it over `state.json`. This is a well-known pattern for crash-safe file persistence. Without it, any crash during `saveSession` leaves the pipeline in an unrecoverable state.

The second most serious issue is the TLA+ heuristic. Checking for literal strings like `VARIABLES` and `Init` is fragile. PlusCal algorithms use `variables` (lowercase) and `begin`/`end` instead of `Init`/`Next` -- the TLA+ translation is auto-generated and may live in comments. A spec written in PlusCal style would fail this heuristic despite being a perfectly valid TLA+ module. The heuristic should either accept a broader set of keywords (union of TLA+ and PlusCal indicators) or allow the writer contract to declare the spec style.

The concurrency issue is real but may be acceptable as a "known limitation" if the SKILL.md documents that only one pipeline run per slug is supported. A simple file lock (or even a PID file) would close this gap.

Objections:
1. State writes are not atomic -- a crash during `Bun.write()` can corrupt `state.json` beyond recovery. Use write-to-temp-then-rename.
2. TLA+ keyword heuristic is too rigid -- PlusCal specs use different surface syntax (`variables`, `begin`/`end`). Use a union of keyword sets or make the heuristic style-aware.
3. No file locking or single-instance guard -- concurrent runs with the same slug will corrupt state.
4. The `advance` CLI command does not specify behavior when the output JSON file is missing, unreadable, or not valid JSON -- this must produce a clear error, not an unhandled exception.
5. The heuristic for expert participation should use set equality or subset checking with a clear error message listing the missing experts.

Endorsements:
1. Schema validation on every read and write is the right defensive approach -- it catches drift early.
2. The two-pass validator with short-circuit on structural failure prevents confusing heuristic errors when the data shape is already wrong.
3. The decision to gitignore state.json and treat it as ephemeral is correct -- it avoids accidental commits of runtime state.
4. Structured error return shape with `path`, `code`, `expected`, `received`, `hint` gives Claude actionable information to self-correct.
