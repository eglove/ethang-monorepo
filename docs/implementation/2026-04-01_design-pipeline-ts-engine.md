# Implementation Plan: Design Pipeline TypeScript Engine

## Source Artifacts

| Artifact | Path |
|----------|------|
| Briefing | `docs/superpowers/specs/2026-04-01-design-pipeline-ts-engine-design.md` |
| Design Consensus | `docs/debate-moderator-sessions/2026-04-01_design-pipeline-ts-engine.md` |
| TLA+ Specification | `docs/tla-specs/design-pipeline-engine/DesignPipelineEngine.tla` |
| TLA+ Config | `docs/tla-specs/design-pipeline-engine/DesignPipelineEngine.cfg` |
| TLA+ README | `docs/tla-specs/design-pipeline-engine/README.md` |
| TLA+ Review Consensus | `docs/debate-moderator-sessions/2026-04-01_design-pipeline-ts-engine-tla-re-review.md` |

## TLA+ Review Constraints

The TLA+ re-review debate reached unanimous consensus with zero objections. Two LOW observations (non-blocking):
1. `HaltUserRequest` and `HaltAgentFailure` fireable from IDLE -- accepted as-is.
2. `validationAttempts` is a single global counter (not per-phase) -- correct behavior, resets on phase transitions.

## TLA+ State Coverage Matrix

### States (9)
- `IDLE`
- `PHASE_1_QUESTIONER`
- `PHASE_2_DESIGN_DEBATE`
- `PHASE_3_TLA_WRITER`
- `PHASE_4_TLA_REVIEW`
- `PHASE_5_IMPLEMENTATION`
- `PHASE_6_PAIR_PROGRAMMING`
- `COMPLETE`
- `HALTED`

### Transitions (18)

#### Forward (7)
- `StartPipeline` -- IDLE -> PHASE_1 (unconditional, acquires lock)
- `CompleteQuestioner` -- PHASE_1 -> PHASE_2 (briefingPath set, experts non-empty)
- `CompleteDesignDebate` -- PHASE_2 -> PHASE_3 (designConsensusPath set)
- `CompleteTlaWriter` -- PHASE_3 -> PHASE_4 (tlaSpecPath + tlcResult set)
- `CompleteTlaReview` -- PHASE_4 -> PHASE_5 (tlaReviewPath set)
- `CompleteImplementation` -- PHASE_5 -> PHASE_6 (implementationPlanPath set)
- `CompletePairProgramming` -- PHASE_6 -> COMPLETE (unconditional, releases lock)

#### Backward (3)
- `BackToPhase1FromPhase3` -- PHASE_3 -> PHASE_1 (clears all, increments retries[PHASE_1])
- `BackToPhase3FromPhase4` -- PHASE_4 -> PHASE_3 (clears tlaSpecPath/tlcResult/tlaReviewPath, increments retries[PHASE_3])
- `BackToPhase1FromPhase4` -- PHASE_4 -> PHASE_1 (clears all, increments retries[PHASE_1])

#### Halt (4)
- `HaltUserRequest` -- ANY non-terminal -> HALTED (USER_HALT)
- `HaltAgentFailure` -- ANY non-terminal -> HALTED (AGENT_FAILURE)
- `HaltRetryExhausted` -- ANY non-terminal -> HALTED (guarded: retries[p] >= MaxPipelineRetries)
- `HaltValidationExhausted` -- ANY validated phase -> HALTED (guarded: validationAttempts >= MaxValidationAttempts)

#### Validation (2)
- `ValidationFails` -- ANY validated phase -> same phase (increments validationAttempts)
- `HaltValidationExhausted` -- (counted above in halt)

#### Terminal (1)
- `Terminated` -- COMPLETE/HALTED stutter (no further progress)

### Safety Invariants (8)
- `TypeOK` -- all variables within declared type domains
- `RetryBounded` -- retries[p] <= MaxPipelineRetries for all retryable phases
- `ExpertsConsistent` -- experts non-empty for all active phases past PHASE_1
- `HaltReasonConsistent` -- haltReason != "NONE" iff phase = "HALTED"
- `NoContextWithoutPhase` -- artifacts only present if their producing phase has been reached
- `SingleInstance` -- lock held iff pipeline is in an active (non-IDLE, non-terminal) phase
- `ValidationAttemptsBounded` -- validationAttempts <= MaxValidationAttempts
- `ArtifactPreservation` -- for non-IDLE, non-HALTED phases, all artifacts from prior phases are present

### Liveness Properties (3)
- `PipelineTerminates` -- from any non-IDLE state, eventually COMPLETE or HALTED
- `RetryExhaustionLeadsToTermination` -- if any retry counter at max, eventually terminal
- `ValidationExhaustionLeadsToTermination` -- if validation attempts at max, eventually terminal

---

## Implementation Steps

### Step 1: Package rename and scaffolding

**Files:**
- `packages/design-pipeline/package.json` (create)
- `packages/design-pipeline/tsconfig.json` (create)
- `packages/design-pipeline/vitest.config.ts` (create)
- `packages/design-pipeline/src/index.ts` (create)

**Description:**
Rename the `packages/agent-contracts` directory to `packages/design-pipeline`. Update `package.json` to set `"name": "@ethang/design-pipeline"`. Update any monorepo workspace references (root `package.json`, `pnpm-workspace.yaml`, or turbo config) that reference the old package name. Verify the package builds and existing tests still pass under the new name. Add `state.json` and `state.tmp.json` and `state.lock` to `.gitignore`.

**Dependencies:** None

**Test (write first):**
No behavioral test -- this is a pure rename/scaffold step. Verify by running `pnpm install` and confirming the workspace resolves `@ethang/design-pipeline`. Existing tests from `agent-contracts` should continue to pass under the new directory. Write a smoke test in `packages/design-pipeline/src/index.test.ts` that imports from `@ethang/design-pipeline` and asserts the re-exports are defined (non-undefined).

**TLA+ Coverage:**
- None (infrastructure scaffolding, not state machine logic)

---

### Step 2: Reorganize existing files into contracts/ and contracts/shared/

**Files:**
- `packages/design-pipeline/src/contracts/shared/frontmatter.ts` (create -- move from schemas/)
- `packages/design-pipeline/src/contracts/shared/section.ts` (create -- move from schemas/)
- `packages/design-pipeline/src/contracts/shared/handoff-contract.ts` (create -- move from schemas/)
- `packages/design-pipeline/src/contracts/questioner.ts` (create -- move from schemas/questioner-contract.ts)
- `packages/design-pipeline/src/contracts/implementation-writer.ts` (create -- move from schemas/implementation-writer-contract.ts)
- `packages/design-pipeline/src/contracts/trainer-output.ts` (create -- move from schemas/trainer-output.ts)
- `packages/design-pipeline/src/state-machine/step-lifecycle.ts` (create -- move from state-machine/)
- `packages/design-pipeline/src/index.ts` (modify -- update re-export paths)

**Description:**
Move existing schema files into the new directory structure per the design spec. `frontmatter.ts`, `section.ts`, and `handoff-contract.ts` move to `contracts/shared/`. `questioner-contract.ts` moves to `contracts/questioner.ts`. `implementation-writer-contract.ts` moves to `contracts/implementation-writer.ts`. `trainer-output.ts` moves to `contracts/trainer-output.ts`. `step-lifecycle.ts` moves to `state-machine/step-lifecycle.ts`. Update all internal import paths. Remove old `schemas/` directory after moves are complete.

**Dependencies:** Step 1

**Test (write first):**
Update import paths in all existing test files. Run the full test suite to confirm all existing tests pass with the new paths. No new behavioral tests needed -- this is a pure file relocation.

**TLA+ Coverage:**
- None (file reorganization, no behavior change)

---

### Step 3: Rename TrainerInputSchema to CodeWriterInputSchema with deprecated re-export

**Files:**
- `packages/design-pipeline/src/contracts/shared/code-writer-input.ts` (create)
- `packages/design-pipeline/src/contracts/trainer-input.ts` (create -- deprecated re-export)
- `packages/design-pipeline/src/index.ts` (modify)

**Description:**
Create `contracts/shared/code-writer-input.ts` containing the renamed `CodeWriterInputSchema` (same shape as current `TrainerInputSchema`: stepNumber, files, description, dependencies, testDescription, title, tlaCoverage). The old `trainer-input.ts` becomes a thin file that re-exports `CodeWriterInputSchema` as `TrainerInputSchema` with a `@deprecated` JSDoc tag and removal target note. Update `index.ts` to export both names. This unifies the input contract for all code writers (typescript-writer, hono-writer, ui-writer, trainer-writer) under domain language.

**Dependencies:** Step 2

**Test (write first):**
Write `contracts/shared/code-writer-input.test.ts`:
1. Valid input with all fields passes `CodeWriterInputSchema.parse()`.
2. Input missing `stepNumber` fails with a Zod error on path `stepNumber`.
3. Input with empty `files` array fails.
4. Input with empty `tlaCoverage` (all arrays empty) fails the refine ("must map to at least one TLA+ spec element").
5. `TrainerInputSchema` (deprecated re-export) parses the same valid fixture identically.

**TLA+ Coverage:**
- None (contract definition, consumed by engine steps later)

---

### Step 4: Shared CodeWriterOutputSchema and TestWriterOutputSchema

**Files:**
- `packages/design-pipeline/src/contracts/shared/code-writer-output.ts` (create)
- `packages/design-pipeline/src/contracts/shared/test-writer-output.ts` (create)

**Description:**
Create `CodeWriterOutputSchema`: `{ filesWritten: z.array(z.string().min(1)).min(1), testsPass: z.boolean(), tddCycles: z.number().int().min(1) }`. Create `TestWriterOutputSchema`: `{ testFilesWritten: z.array(z.string().min(1)).min(1), testCount: z.number().int().min(1), allPass: z.boolean() }`. These are shared output shapes used by all code writers and test writers respectively.

**Dependencies:** Step 2

**Test (write first):**
Write `contracts/shared/code-writer-output.test.ts`:
1. Valid output with `filesWritten: ["src/foo.ts"]`, `testsPass: true`, `tddCycles: 1` parses.
2. Empty `filesWritten` array fails.
3. `tddCycles: 0` fails (min 1).

Write `contracts/shared/test-writer-output.test.ts`:
1. Valid output with `testFilesWritten: ["src/foo.test.ts"]`, `testCount: 3`, `allPass: true` parses.
2. Empty `testFilesWritten` array fails.
3. `testCount: 0` fails (min 1).

**TLA+ Coverage:**
- None (contract definition)

---

### Step 5: ValidationResultSchema

**Files:**
- `packages/design-pipeline/src/contracts/shared/validation-result.ts` (create)

**Description:**
Define `ValidationResultSchema` as a Zod schema: `{ valid: z.boolean(), errors: z.array(z.object({ path: z.string(), code: z.string().min(1), expected: z.string(), received: z.string(), hint: z.string() })) }`. Add a refine: when `valid` is false, `errors` must be non-empty; when `valid` is true, `errors` must be empty. Error codes use `STRUCTURAL_*` or `HEURISTIC_*` prefix convention. This schema is itself a contract consumed by Claude's parsing logic, per expert-tdd's recommendation.

**Dependencies:** Step 2

**Test (write first):**
Write `contracts/shared/validation-result.test.ts`:
1. `{ valid: true, errors: [] }` parses successfully.
2. `{ valid: false, errors: [{ path: "experts", code: "HEURISTIC_MISSING_EXPERT", expected: "...", received: "...", hint: "..." }] }` parses.
3. `{ valid: false, errors: [] }` fails the refine (valid=false requires non-empty errors).
4. `{ valid: true, errors: [{ ... }] }` fails the refine (valid=true requires empty errors).
5. Error with empty `code` string fails.

**TLA+ Coverage:**
- None (contract definition; validator uses this in Step 12)

---

### Step 6: Pipeline phase enum and constants

**Files:**
- `packages/design-pipeline/src/state-machine/pipeline-phases.ts` (create)

**Description:**
Define the `PipelinePhase` type as a union of the 9 TLA+ states: `"IDLE" | "PHASE_1_QUESTIONER" | "PHASE_2_DESIGN_DEBATE" | "PHASE_3_TLA_WRITER" | "PHASE_4_TLA_REVIEW" | "PHASE_5_IMPLEMENTATION" | "PHASE_6_PAIR_PROGRAMMING" | "COMPLETE" | "HALTED"`. Define `TERMINAL_PHASES`, `NON_TERMINAL_PHASES`, `ACTIVE_PHASES` (non-terminal minus IDLE), `VALIDATED_PHASES`, and `RETRYABLE_PHASES` as const sets. Define `HaltReason` type: `"NONE" | "USER_HALT" | "AGENT_FAILURE" | "RETRY_EXHAUSTED" | "VALIDATION_EXHAUSTED"`. Define constants `MAX_PIPELINE_RETRIES = 3` and `MAX_VALIDATION_ATTEMPTS = 3`. Define `PHASE_ORD` map and `ARTIFACTS_PRODUCED_BY` map matching the TLA+ spec. Define artifact clear sets: `PHASE_1_CLEAR_SET` (all artifacts) and `PHASE_3_CLEAR_SET` (tlaSpecPath, tlcResult, tlaReviewPath).

**Dependencies:** None

**Test (write first):**
Write `state-machine/pipeline-phases.test.ts`:
1. `TERMINAL_PHASES` contains exactly `"COMPLETE"` and `"HALTED"`.
2. `NON_TERMINAL_PHASES` contains exactly 7 phases (IDLE + 6 pipeline phases).
3. `ACTIVE_PHASES` equals `NON_TERMINAL_PHASES` minus `"IDLE"` (6 phases).
4. `VALIDATED_PHASES` contains exactly PHASE_1 through PHASE_5 (5 phases).
5. `RETRYABLE_PHASES` contains exactly `"PHASE_1_QUESTIONER"` and `"PHASE_3_TLA_WRITER"`.
6. `PHASE_ORD` maps IDLE=0, PHASE_1=1, ..., COMPLETE=7, HALTED=8.
7. `ARTIFACTS_PRODUCED_BY` maps each phase to its artifact set, matching the TLA+ spec.
8. `PHASE_1_CLEAR_SET` contains all 6 artifact names.
9. `PHASE_3_CLEAR_SET` contains exactly `tlaSpecPath`, `tlcResult`, `tlaReviewPath`.

**TLA+ Coverage:**
- State: `IDLE`, `PHASE_1_QUESTIONER`, `PHASE_2_DESIGN_DEBATE`, `PHASE_3_TLA_WRITER`, `PHASE_4_TLA_REVIEW`, `PHASE_5_IMPLEMENTATION`, `PHASE_6_PAIR_PROGRAMMING`, `COMPLETE`, `HALTED`
- Invariant: `TypeOK` (phase type domain)

---

### Step 7: PipelineStateSchema (Zod schema for persisted state)

**Files:**
- `packages/design-pipeline/src/state-machine/pipeline-state.ts` (create)

**Description:**
Define `PipelineStateSchema` as a Zod schema that models the persisted state object. Uses a discriminated union on `phase` to enforce the design's accumulated context typing: when `phase` is `"PHASE_2_DESIGN_DEBATE"`, the `accumulatedContext` must include `briefingPath` (string) and `experts` (non-empty string array); when `phase` is `"PHASE_3_TLA_WRITER"`, it must also include `designConsensusPath`; etc. The schema includes: `phase` (PipelinePhase), `slug` (string), `startedAt` (ISO datetime string), `retries` (record of retryable phases to numbers, each 0..MAX_PIPELINE_RETRIES), `accumulatedContext` (discriminated union per phase), `haltReason` (HaltReason), `validationAttempts` (number, 0..MAX_VALIDATION_ATTEMPTS). Export `PipelineState` inferred type.

**Dependencies:** Step 6

**Test (write first):**
Write `state-machine/pipeline-state.test.ts`:
1. IDLE state with empty context parses: `{ phase: "IDLE", slug: "test", startedAt: "...", retries: { PHASE_1_QUESTIONER: 0, PHASE_3_TLA_WRITER: 0 }, accumulatedContext: {}, haltReason: "NONE", validationAttempts: 0 }`.
2. PHASE_2 state requires `briefingPath` and `experts` in `accumulatedContext` -- missing `briefingPath` fails.
3. PHASE_3 state requires `briefingPath`, `experts`, `designConsensusPath` -- missing `designConsensusPath` fails.
4. PHASE_4 state requires `tlaSpecPath` and `tlcResult` additionally -- present input parses.
5. HALTED state with `haltReason: "USER_HALT"` parses. HALTED with `haltReason: "NONE"` fails.
6. Non-HALTED state with `haltReason` != `"NONE"` fails (HaltReasonConsistent invariant).
7. `retries` with value exceeding `MAX_PIPELINE_RETRIES` fails (RetryBounded invariant).
8. `validationAttempts` exceeding `MAX_VALIDATION_ATTEMPTS` fails (ValidationAttemptsBounded invariant).
9. COMPLETE state parses with full accumulated context.

**TLA+ Coverage:**
- Invariant: `TypeOK` (full variable domain), `RetryBounded`, `HaltReasonConsistent`, `ValidationAttemptsBounded`, `NoContextWithoutPhase`

---

### Step 8: Pipeline lifecycle state machine (transition function)

**Files:**
- `packages/design-pipeline/src/state-machine/pipeline-lifecycle.ts` (create)

**Description:**
Implement `isValidPipelineTransition(current: PipelinePhase, next: PipelinePhase, state: PipelineState): boolean` and `transitionPipeline(state: PipelineState, action: PipelineAction): PipelineState | { error: string }`. The `PipelineAction` is a discriminated union: `{ type: "forward", artifacts: Record<string, string> }`, `{ type: "backward", target: PipelinePhase }`, `{ type: "halt", reason: HaltReason }`, `{ type: "validation_fail" }`. The transition function enforces all guards from the TLA+ spec: forward guards check accumulated context, backward guards check retry budget, halt guards check reason validity. Returns the new state on success or an error object on invalid transitions. Terminal states reject all transitions.

**Dependencies:** Steps 6, 7

**Test (write first):**
Write `state-machine/pipeline-lifecycle.test.ts`:

Forward transitions:
1. IDLE -> PHASE_1: succeeds unconditionally, sets `locked` (via ACTIVE_PHASES membership).
2. PHASE_1 -> PHASE_2: succeeds when action provides `briefingPath` and `experts`.
3. PHASE_1 -> PHASE_2: fails when `experts` is empty.
4. PHASE_2 -> PHASE_3: succeeds when `designConsensusPath` provided.
5. PHASE_3 -> PHASE_4: succeeds when `tlaSpecPath` and `tlcResult` provided.
6. PHASE_4 -> PHASE_5: succeeds when `tlaReviewPath` provided.
7. PHASE_5 -> PHASE_6: succeeds when `implementationPlanPath` provided.
8. PHASE_6 -> COMPLETE: succeeds unconditionally.
9. Each forward transition resets `validationAttempts` to 0.

Backward transitions:
10. PHASE_3 -> PHASE_1: succeeds, clears all artifacts, clears experts, increments retries[PHASE_1], resets validationAttempts.
11. PHASE_4 -> PHASE_3: succeeds, clears tlaSpecPath/tlcResult/tlaReviewPath, preserves briefingPath/designConsensusPath, increments retries[PHASE_3], resets validationAttempts.
12. PHASE_4 -> PHASE_1: succeeds, clears all, increments retries[PHASE_1], resets validationAttempts.
13. Backward transition blocked when `retries[targetPhase] >= MAX_PIPELINE_RETRIES` -- returns error.

Halt transitions:
14. HaltUserRequest from any non-terminal phase succeeds, sets `haltReason: "USER_HALT"`.
15. HaltAgentFailure from any non-terminal phase succeeds.
16. HaltRetryExhausted only succeeds when at least one retry counter is at max.
17. HaltRetryExhausted fails (returns error) when no retry counter is at max.
18. HaltValidationExhausted succeeds from validated phase when `validationAttempts >= MAX_VALIDATION_ATTEMPTS`.
19. HaltValidationExhausted fails when `validationAttempts < MAX_VALIDATION_ATTEMPTS`.

Validation failure:
20. ValidationFails from a validated phase: phase stays, artifacts unchanged, `validationAttempts` increments.
21. ValidationFails blocked when `validationAttempts >= MAX_VALIDATION_ATTEMPTS`.
22. ValidationFails from a non-validated phase (e.g., IDLE, PHASE_6) returns error.

Terminal states:
23. Any transition from COMPLETE returns error.
24. Any transition from HALTED returns error.

Invalid transitions:
25. PHASE_2 backward (not a valid backward source) returns error.
26. PHASE_5 backward returns error.
27. PHASE_1 -> PHASE_3 (skip) returns error.

**TLA+ Coverage:**
- Transition: `StartPipeline`, `CompleteQuestioner`, `CompleteDesignDebate`, `CompleteTlaWriter`, `CompleteTlaReview`, `CompleteImplementation`, `CompletePairProgramming`, `BackToPhase1FromPhase3`, `BackToPhase3FromPhase4`, `BackToPhase1FromPhase4`, `HaltUserRequest`, `HaltAgentFailure`, `HaltRetryExhausted`, `HaltValidationExhausted`, `ValidationFails`, `Terminated`
- State: all 9 states (tested as source/target of transitions)
- Invariant: `RetryBounded` (backward transitions increment within bounds), `ExpertsConsistent` (experts preserved/cleared correctly), `HaltReasonConsistent` (halt reason set iff HALTED), `NoContextWithoutPhase` (artifacts match phase), `SingleInstance` (lock semantics via active phases), `ValidationAttemptsBounded` (counter stays in bounds), `ArtifactPreservation` (backward transitions preserve prior artifacts)

---

### Step 9: Debate-moderator contract

**Files:**
- `packages/design-pipeline/src/contracts/debate-moderator.ts` (create)

**Description:**
Define `DebateModeratorInputSchema`: `{ topic: z.string().min(1), experts: z.array(z.string().min(1)).min(1), context: z.string().min(1) }`. Define `DebateModeratorOutputSchema`: `{ synthesis: z.string().min(1), rounds: z.number().int().min(1), consensusReached: z.boolean(), unresolvedDissents: z.array(z.string()), participatingExperts: z.array(z.string().min(1)).min(1) }`. The expert participation heuristic (every input expert must appear in output `participatingExperts`) is NOT baked into the Zod schema -- it is a heuristic check enforced by the validator (Step 12).

**Dependencies:** Step 2

**Test (write first):**
Write `contracts/debate-moderator.test.ts`:
1. Valid input parses.
2. Input with empty `experts` array fails.
3. Valid output with all fields parses.
4. Output with `rounds: 0` fails (min 1).
5. Output with empty `participatingExperts` fails.
6. Output with empty `synthesis` fails.

**TLA+ Coverage:**
- None (contract definition; used by validator and engine for PHASE_2/PHASE_4 output validation)

---

### Step 10: TLA-writer contract

**Files:**
- `packages/design-pipeline/src/contracts/tla-writer.ts` (create)

**Description:**
Define `TlaWriterInputSchema`: `{ briefingPath: z.string().min(1), designConsensus: z.string().min(1) }`. Define `TlaWriterOutputSchema`: `{ specPath: z.string().min(1), cfgPath: z.string().min(1), tlcResult: z.enum(["PASS", "FAIL"]), tlcOutput: z.string(), specContent: z.string().min(1) }`. The TLA+ keyword heuristic (union of TLA+ style and PlusCal style keyword sets) is enforced by the validator (Step 12), not in the Zod schema itself.

**Dependencies:** Step 2

**Test (write first):**
Write `contracts/tla-writer.test.ts`:
1. Valid input parses.
2. Input with empty `briefingPath` fails.
3. Valid output parses.
4. Output with `tlcResult: "UNKNOWN"` fails (not in enum).
5. Output with empty `specContent` fails.

**TLA+ Coverage:**
- None (contract definition; used by validator for PHASE_3 output)

---

### Step 11: Writer contracts (typescript, hono, ui, vitest, playwright)

**Files:**
- `packages/design-pipeline/src/contracts/typescript-writer.ts` (create)
- `packages/design-pipeline/src/contracts/hono-writer.ts` (create)
- `packages/design-pipeline/src/contracts/ui-writer.ts` (create)
- `packages/design-pipeline/src/contracts/vitest-writer.ts` (create)
- `packages/design-pipeline/src/contracts/playwright-writer.ts` (create)

**Description:**
Each code writer contract imports `CodeWriterInputSchema` as input and `CodeWriterOutputSchema` as output base. Each writer contract re-exports the input/output schemas (no additional fields -- the heuristics for file extension checking are in the validator). The vitest-writer and playwright-writer contracts define `TestWriterInputSchema`: extends `CodeWriterInputSchema` fields plus `codeWriter: z.string().min(1)`, and use `TestWriterOutputSchema` as output. The playwright-writer uses the same input shape as vitest-writer.

**Dependencies:** Steps 3, 4

**Test (write first):**
Write `contracts/typescript-writer.test.ts`:
1. Valid input (same as `CodeWriterInputSchema` fixture) parses.
2. Valid output (same as `CodeWriterOutputSchema` fixture) parses.

Write `contracts/vitest-writer.test.ts`:
1. Valid input with `codeWriter: "typescript-writer"` plus all `CodeWriterInputSchema` fields parses.
2. Input missing `codeWriter` fails.
3. Valid output (`testFilesWritten`, `testCount`, `allPass`) parses.

Write `contracts/playwright-writer.test.ts`:
1. Same test shape as vitest-writer.

Write `contracts/hono-writer.test.ts` and `contracts/ui-writer.test.ts`:
1. Same test shape as typescript-writer.

**TLA+ Coverage:**
- None (contract definitions)

---

### Step 12: Validator (two-pass: structural + heuristic)

**Files:**
- `packages/design-pipeline/src/engine/validator.ts` (create)

**Description:**
Implement the two-pass validator. Expose per-phase validation functions: `validateQuestionerOutput`, `validateDebateOutput`, `validateTlaWriterOutput`, `validateImplementationOutput`, `validateCodeWriterOutput`, `validateTestWriterOutput`. Each function: (1) runs the Zod schema (structural pass) -- on failure, maps Zod issues to `ValidationResult` with `STRUCTURAL_*` codes and short-circuits; (2) on structural success, runs domain-specific heuristic checks and returns `ValidationResult` with `HEURISTIC_*` codes. Heuristics include:
- Debate output: every expert in `state.accumulatedContext.experts` must appear in `output.participatingExperts` (set comparison, listing missing experts).
- TLA+ writer output: `specContent` must match TLA+ keyword set (`VARIABLES`, `Init`, `Next` + safety property) OR PlusCal keyword set (`variables`, `begin`, `process`/`algorithm` + `BEGIN TRANSLATION`).
- Code writer output: all `filesWritten` paths must end with expected extension (`.ts` for typescript/hono, `.tsx` for ui).
- Test writer output: all `testFilesWritten` paths must end with `.test.ts` (vitest) or `.spec.ts` (playwright).

**Dependencies:** Steps 5, 7, 9, 10, 11

**Test (write first):**
Write `engine/validator.test.ts`:

Structural pass tests:
1. Questioner output missing required field returns `STRUCTURAL_MISSING_FIELD` error.
2. Debate output with wrong type for `rounds` returns `STRUCTURAL_INVALID_TYPE` error.
3. Structural failure short-circuits: no heuristic errors in result.

Heuristic pass tests:
4. Debate output with `participatingExperts: ["tdd"]` when state has `experts: ["tdd", "ddd"]` returns `HEURISTIC_MISSING_EXPERT` with hint listing `"ddd"`.
5. Debate output with all experts present returns `{ valid: true, errors: [] }`.
6. TLA+ writer output with `specContent` containing `VARIABLES`, `Init`, `Next`, `[]` returns valid.
7. TLA+ writer output with PlusCal keywords (`variables`, `begin`, `algorithm`, `BEGIN TRANSLATION`) returns valid.
8. TLA+ writer output with neither keyword set returns `HEURISTIC_TLA_INCOMPLETE`.
9. Code writer output (typescript-writer) with `filesWritten: ["foo.tsx"]` returns `HEURISTIC_WRONG_EXTENSION`.
10. Code writer output (typescript-writer) with `filesWritten: ["foo.ts"]` returns valid.
11. Test writer output (vitest) with `testFilesWritten: ["foo.spec.ts"]` returns `HEURISTIC_WRONG_EXTENSION`.
12. Test writer output (vitest) with `testFilesWritten: ["foo.test.ts"]` returns valid.

ValidationResult shape stability:
13. Valid result conforms to `ValidationResultSchema`.
14. Error result conforms to `ValidationResultSchema`.

**TLA+ Coverage:**
- Transition: `ValidationFails` (validator returning invalid triggers this in the engine)
- Invariant: `ExpertsConsistent` (heuristic enforces expert participation)

---

### Step 13: State store (file-based persistence with atomic writes)

**Files:**
- `packages/design-pipeline/src/engine/state-store.ts` (create)

**Description:**
Implement `createSession(slug: string, stateDir?: string)`, `loadSession(slug: string, stateDir?: string)`, `saveSession(state: PipelineState, stateDir?: string)` using Bun APIs. Default `stateDir` is `packages/design-pipeline/`. `createSession` writes initial IDLE state. `saveSession` uses write-to-temp-then-rename: writes to `state.tmp.json`, validates the written file by reading it back and parsing with `PipelineStateSchema`, then renames over `state.json`. `loadSession` reads `state.json` and validates with `PipelineStateSchema`; if `state.json` is missing but `state.tmp.json` exists, deletes the temp file and returns an error. Single-instance guard: `createSession` and `loadSession` check for `state.lock` containing a PID; if the PID is still running, returns `{ error: "PIPELINE_LOCKED", pid: N }`. Lock file created on `createSession`, deleted when state reaches COMPLETE or HALTED via `saveSession`.

**Dependencies:** Steps 6, 7

**Test (write first):**
Write `engine/state-store.test.ts` (all tests use real temp directories):
1. `createSession` creates `state.json` with valid IDLE state; `loadSession` reads it back identically.
2. `saveSession` with valid state writes successfully; `loadSession` returns updated state.
3. `loadSession` with corrupted JSON in `state.json` returns a parse error.
4. `loadSession` with schema-invalid JSON (e.g., `phase: "INVALID"`) returns a validation error.
5. Atomic write: `saveSession` creates `state.tmp.json` first, then renames. After successful save, `state.tmp.json` does not exist but `state.json` does.
6. Recovery: if `state.json` is missing but `state.tmp.json` exists, `loadSession` deletes temp file and returns an error indicating no valid state.
7. Lock file: `createSession` writes `state.lock`. Second `createSession` with same slug (while first PID alive) returns `PIPELINE_LOCKED` error.
8. Lock file cleaned up when `saveSession` writes a COMPLETE state.
9. Lock file cleaned up when `saveSession` writes a HALTED state.

**TLA+ Coverage:**
- Invariant: `SingleInstance` (lock file mechanism), `TypeOK` (schema validation on every read/write)
- State: `IDLE` (initial state created by `createSession`), `COMPLETE`, `HALTED` (lock cleanup)

---

### Step 14: Pipeline engine (importable functions)

**Files:**
- `packages/design-pipeline/src/engine/pipeline-engine.ts` (create)

**Description:**
Implement the three importable engine functions:
- `startPipeline(slug: string, stateDir?: string): PipelineResponse` -- calls `createSession`, transitions IDLE -> PHASE_1, saves state, returns `{ phase: "PHASE_1_QUESTIONER", context: {} }`.
- `advancePipeline(slug: string, outputPath: string, stateDir?: string): PipelineResponse` -- loads state, reads output JSON from `outputPath` using `Bun.file().json()`, determines current phase's validator, runs two-pass validation, if valid: transitions forward via `transitionPipeline`, saves state, returns next phase context; if invalid: returns `ValidationResult` errors without advancing. If `outputPath` is missing or invalid JSON, returns `{ valid: false, errors: [{ code: "STRUCTURAL_INVALID_INPUT", ... }] }`.
- `getPipelineStatus(slug: string, stateDir?: string): PipelineState` -- loads and returns current state.

The engine delegates to the state machine for transitions and to the validator for output checking. It is the composition layer that ties state-store, pipeline-lifecycle, and validator together.

**Dependencies:** Steps 8, 12, 13

**Test (write first):**
Write `engine/pipeline-engine.test.ts` (all tests use real temp directories):
1. `startPipeline` creates state file with PHASE_1, returns phase context.
2. `startPipeline` when lock exists returns PIPELINE_LOCKED error.
3. `advancePipeline` with valid questioner output: transitions to PHASE_2, state file updated.
4. `advancePipeline` with invalid questioner output (structural failure): returns errors, state unchanged.
5. `advancePipeline` with valid debate output missing an expert (heuristic failure): returns HEURISTIC_MISSING_EXPERT, state unchanged.
6. `advancePipeline` with missing output file: returns STRUCTURAL_INVALID_INPUT error.
7. `advancePipeline` with invalid JSON file: returns STRUCTURAL_INVALID_INPUT error.
8. `getPipelineStatus` returns current state.
9. Full forward pipeline: start -> advance through all 6 phases -> COMPLETE. Verify state is COMPLETE and lock file is removed.

**TLA+ Coverage:**
- Transition: `StartPipeline` (engine start), all forward transitions (advance), `ValidationFails` (invalid output path)
- Invariant: `SingleInstance` (lock check), `ArtifactPreservation` (full pipeline traversal test)
- Liveness: `PipelineTerminates` (full forward pipeline test reaches COMPLETE)

---

### Step 15: Pipeline engine -- backward transitions and halt

**Files:**
- `packages/design-pipeline/src/engine/pipeline-engine.ts` (modify)

**Description:**
Extend `advancePipeline` (or add `haltPipeline` and `retryPipeline` functions) to support backward transitions and halt actions. When the validator returns errors and the agent (Claude) decides to retry from an earlier phase, the engine accepts a `backward` action. When retries are exhausted, the engine returns an error indicating the only option is halt. Add `haltPipeline(slug: string, reason: HaltReason, stateDir?: string)` for explicit halt. Add `retryPipeline(slug: string, target: PipelinePhase, stateDir?: string)` for backward transitions.

**Dependencies:** Step 14

**Test (write first):**
Write additional tests in `engine/pipeline-engine.test.ts`:
1. `retryPipeline` from PHASE_4 to PHASE_3: clears tlaSpecPath/tlcResult/tlaReviewPath, increments retries[PHASE_3], state is PHASE_3.
2. `retryPipeline` from PHASE_4 to PHASE_1: clears all context, increments retries[PHASE_1].
3. `retryPipeline` from PHASE_3 to PHASE_1: clears all context.
4. `retryPipeline` blocked when retries at max: returns error.
5. `haltPipeline` with USER_HALT: state becomes HALTED, lock file removed.
6. `haltPipeline` with AGENT_FAILURE: state becomes HALTED.
7. `haltPipeline` with RETRY_EXHAUSTED only succeeds when retry counter at max.
8. `haltPipeline` with VALIDATION_EXHAUSTED only succeeds when validationAttempts at max.
9. After halt, `advancePipeline` returns error (terminal state).
10. Retry exhaustion scenario: retry 3 times, fourth retry blocked, halt with RETRY_EXHAUSTED succeeds.

**TLA+ Coverage:**
- Transition: `BackToPhase1FromPhase3`, `BackToPhase3FromPhase4`, `BackToPhase1FromPhase4`, `HaltUserRequest`, `HaltAgentFailure`, `HaltRetryExhausted`, `HaltValidationExhausted`
- Invariant: `RetryBounded` (retry at max blocks further retries), `ArtifactPreservation` (backward transitions preserve prior artifacts), `HaltReasonConsistent` (halt reason set correctly)
- Liveness: `RetryExhaustionLeadsToTermination` (retry exhaustion leads to halt), `ValidationExhaustionLeadsToTermination` (validation exhaustion leads to halt)

---

### Step 16: CLI entrypoint (pipeline-runner.ts)

**Files:**
- `packages/design-pipeline/src/engine/pipeline-runner.ts` (create)

**Description:**
Thin CLI wrapper that parses `process.argv` (or `Bun.argv`), calls the appropriate engine function (`startPipeline`, `advancePipeline`, `getPipelineStatus`, `haltPipeline`, `retryPipeline`), and writes JSON to stdout. Commands: `start <slug>`, `advance <slug> <output-json-path>`, `status <slug>`, `halt <slug> <reason>`, `retry <slug> <target-phase>`. Invalid commands print usage and exit with code 1.

**Dependencies:** Steps 14, 15

**Test (write first):**
Write `engine/pipeline-runner.test.ts`:
1. Single integration test: spawn `bun run pipeline-runner.ts start test-slug` as a subprocess, verify stdout is valid JSON with `phase: "PHASE_1_QUESTIONER"`.
2. Spawn `bun run pipeline-runner.ts status test-slug`, verify stdout is valid JSON with current state.
3. Spawn with no arguments, verify exit code 1 and stderr contains usage.

**TLA+ Coverage:**
- None (thin CLI wrapper; all logic tested via engine functions)

---

### Step 17: Update index.ts barrel exports

**Files:**
- `packages/design-pipeline/src/index.ts` (modify)

**Description:**
Update the barrel export file to re-export all public schemas, types, state machine functions, and engine functions. This is the public API of `@ethang/design-pipeline`. Group exports by domain: contracts (all schemas), state-machine (phase types, lifecycle functions, step-lifecycle), engine (pipeline engine functions, validator, state store).

**Dependencies:** Steps 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16

**Test (write first):**
Update `src/index.test.ts`:
1. Import every exported name and assert it is defined (not undefined).
2. This prevents silent export breakage during refactors.

**TLA+ Coverage:**
- None (wiring)

---

## State Coverage Audit

### States
| State | Covered By |
|-------|------------|
| `IDLE` | Steps 6, 7, 8, 13 |
| `PHASE_1_QUESTIONER` | Steps 6, 8, 14, 15 |
| `PHASE_2_DESIGN_DEBATE` | Steps 6, 8, 14 |
| `PHASE_3_TLA_WRITER` | Steps 6, 8, 14, 15 |
| `PHASE_4_TLA_REVIEW` | Steps 6, 8, 14, 15 |
| `PHASE_5_IMPLEMENTATION` | Steps 6, 8, 14 |
| `PHASE_6_PAIR_PROGRAMMING` | Steps 6, 8, 14 |
| `COMPLETE` | Steps 6, 8, 13, 14 |
| `HALTED` | Steps 6, 8, 13, 15 |

### Transitions
| Transition | Covered By |
|------------|------------|
| `StartPipeline` | Steps 8, 14 |
| `CompleteQuestioner` | Steps 8, 14 |
| `CompleteDesignDebate` | Steps 8, 14 |
| `CompleteTlaWriter` | Steps 8, 14 |
| `CompleteTlaReview` | Steps 8, 14 |
| `CompleteImplementation` | Steps 8, 14 |
| `CompletePairProgramming` | Steps 8, 14 |
| `BackToPhase1FromPhase3` | Steps 8, 15 |
| `BackToPhase3FromPhase4` | Steps 8, 15 |
| `BackToPhase1FromPhase4` | Steps 8, 15 |
| `HaltUserRequest` | Steps 8, 15 |
| `HaltAgentFailure` | Steps 8, 15 |
| `HaltRetryExhausted` | Steps 8, 15 |
| `HaltValidationExhausted` | Steps 8, 15 |
| `ValidationFails` | Steps 8, 12, 14 |
| `Terminated` | Steps 8, 15 |

### Safety Invariants
| Invariant | Covered By |
|-----------|------------|
| `TypeOK` | Steps 6, 7, 13 |
| `RetryBounded` | Steps 7, 8, 15 |
| `ExpertsConsistent` | Steps 8, 12 |
| `HaltReasonConsistent` | Steps 7, 8, 15 |
| `NoContextWithoutPhase` | Steps 7, 8 |
| `SingleInstance` | Steps 8, 13, 14 |
| `ValidationAttemptsBounded` | Steps 7, 8 |
| `ArtifactPreservation` | Steps 8, 14, 15 |

### Liveness Properties
| Property | Covered By |
|----------|------------|
| `PipelineTerminates` | Step 14 (full forward pipeline test) |
| `RetryExhaustionLeadsToTermination` | Step 15 (retry exhaustion scenario) |
| `ValidationExhaustionLeadsToTermination` | Step 15 (validation exhaustion halt) |

All TLA+ states, transitions, and properties are covered by the implementation plan.

---

## Execution Tiers

### Tier 1: Foundation (independent types, contracts, and constants)

These steps have no dependencies on each other and produce the foundational types, schemas, and constants that all subsequent steps build upon.

| Task ID | Step | Title | Blocker? |
|---------|------|-------|----------|
| T1 | Step 1 | Package rename and scaffolding | Yes |
| T6 | Step 6 | Pipeline phase enum and constants | Yes |

### Tier 2: File reorganization and shared contracts (depends on Tier 1)

These steps depend on Step 1 (directory exists) and/or Step 6 (phase types). They can run in parallel with each other since they touch different files.

| Task ID | Step | Title | Blocker? |
|---------|------|-------|----------|
| T2 | Step 2 | Reorganize existing files into contracts/ and contracts/shared/ | Yes |
| T7 | Step 7 | PipelineStateSchema | Yes |

### Tier 3: Contract definitions and state machine (depends on Tier 2)

These steps depend on Step 2 (directory structure) and Step 7 (state schema). They can run in parallel since they define independent schemas.

| Task ID | Step | Title | Blocker? |
|---------|------|-------|----------|
| T3 | Step 3 | Rename TrainerInputSchema to CodeWriterInputSchema | Yes |
| T4 | Step 4 | Shared CodeWriterOutputSchema and TestWriterOutputSchema | Yes |
| T5 | Step 5 | ValidationResultSchema | Yes |
| T8 | Step 8 | Pipeline lifecycle state machine | Yes |
| T9 | Step 9 | Debate-moderator contract | No |
| T10 | Step 10 | TLA-writer contract | No |
| T13 | Step 13 | State store | Yes |

### Tier 4: Writer contracts and validator (depends on Tier 3)

Step 11 depends on Steps 3 and 4. Step 12 depends on Steps 5, 7, 9, 10, 11.

| Task ID | Step | Title | Blocker? |
|---------|------|-------|----------|
| T11 | Step 11 | Writer contracts (typescript, hono, ui, vitest, playwright) | Yes |

### Tier 5: Validator (depends on Tier 4)

Step 12 depends on all contract schemas plus the state schema and ValidationResultSchema.

| Task ID | Step | Title | Blocker? |
|---------|------|-------|----------|
| T12 | Step 12 | Validator (two-pass: structural + heuristic) | Yes |

### Tier 6: Engine core (depends on Tiers 3 and 5)

Step 14 depends on Steps 8, 12, 13 (state machine, validator, state store).

| Task ID | Step | Title | Blocker? |
|---------|------|-------|----------|
| T14 | Step 14 | Pipeline engine (importable functions) | Yes |

### Tier 7: Engine extensions (depends on Tier 6)

Step 15 extends the engine with backward transitions and halt actions.

| Task ID | Step | Title | Blocker? |
|---------|------|-------|----------|
| T15 | Step 15 | Pipeline engine -- backward transitions and halt | Yes |

### Tier 8: CLI and barrel exports (depends on Tier 7)

Steps 16 and 17 depend on all prior steps and can run in parallel.

| Task ID | Step | Title | Blocker? |
|---------|------|-------|----------|
| T16 | Step 16 | CLI entrypoint (pipeline-runner.ts) | No |
| T17 | Step 17 | Update index.ts barrel exports | No |

---

## Task Assignment Table

| Task ID | Title | Tier | Code Writer | Test Writer | Dependencies | Rationale |
|---------|-------|------|-------------|-------------|--------------|-----------|
| T1 | Package rename and scaffolding | 1 | typescript-writer | vitest-writer | None | Pure TypeScript package configuration and workspace wiring. |
| T6 | Pipeline phase enum and constants | 1 | typescript-writer | vitest-writer | None | Pure TypeScript type definitions and const declarations derived from TLA+ spec. |
| T2 | Reorganize existing files | 2 | typescript-writer | vitest-writer | T1 | File moves and import path updates -- pure TypeScript refactoring. |
| T7 | PipelineStateSchema | 2 | typescript-writer | vitest-writer | T6 | Zod schema with discriminated union -- pure TypeScript domain logic. |
| T3 | CodeWriterInputSchema rename | 3 | typescript-writer | vitest-writer | T2 | Schema rename with deprecated re-export -- pure TypeScript. |
| T4 | Shared output schemas | 3 | typescript-writer | vitest-writer | T2 | New Zod schema definitions -- pure TypeScript. |
| T5 | ValidationResultSchema | 3 | typescript-writer | vitest-writer | T2 | Zod schema with refinement for error shape contract -- pure TypeScript. |
| T8 | Pipeline lifecycle state machine | 3 | typescript-writer | vitest-writer | T6, T7 | State machine transition function -- pure TypeScript domain logic. |
| T9 | Debate-moderator contract | 3 | typescript-writer | vitest-writer | T2 | Zod schema definition -- pure TypeScript. |
| T10 | TLA-writer contract | 3 | typescript-writer | vitest-writer | T2 | Zod schema definition -- pure TypeScript. |
| T13 | State store | 3 | typescript-writer | vitest-writer | T6, T7 | File-based persistence with Bun APIs -- TypeScript with real I/O tests. |
| T11 | Writer contracts | 4 | typescript-writer | vitest-writer | T3, T4 | Zod schema definitions reusing shared input/output -- pure TypeScript. |
| T12 | Validator | 5 | typescript-writer | vitest-writer | T5, T7, T9, T10, T11 | Two-pass validation engine with domain heuristics -- pure TypeScript. |
| T14 | Pipeline engine core | 6 | typescript-writer | vitest-writer | T8, T12, T13 | Engine composition layer with Bun file I/O -- TypeScript domain logic. |
| T15 | Engine backward/halt | 7 | typescript-writer | vitest-writer | T14 | Extension of engine with backward transitions and halt -- TypeScript domain logic. |
| T16 | CLI entrypoint | 8 | typescript-writer | vitest-writer | T15 | Thin Bun CLI wrapper parsing argv -- TypeScript with subprocess integration test. |
| T17 | Barrel exports | 8 | typescript-writer | vitest-writer | T15 | Index file re-exports -- pure TypeScript wiring. |
