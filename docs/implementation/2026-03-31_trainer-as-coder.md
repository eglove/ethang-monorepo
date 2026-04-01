# Implementation Plan: Trainer as Code Writer with Agent Contracts

## Source Artifacts

| Artifact | Path |
|----------|------|
| Briefing | `docs/questioner-sessions/2026-03-31_trainer-as-coder.md` |
| Design Consensus | `docs/debate-moderator-sessions/2026-03-31_trainer-as-coder-design.md` |
| TLA+ Specification | `docs/tla-specs/trainer-as-coder/TrainerAsCoder.tla` |
| TLA+ Review Consensus | `docs/debate-moderator-sessions/2026-03-31_trainer-as-coder-tla-review.md` |

## TLA+ Review Constraints

The TLA+ review consensus identified five recommendations. Items 1-2 were applied to the spec before this plan was written. Items 3-5 are documentation improvements that inform the plan:

1. **Phase-step ordering guard** (applied): `AssignWriter` prevents `trainer_writer` assignment before `implPhase` reaches `PHASE_B`.
2. **Dead constant removed** (applied): `QuestionerTargets` was removed from the spec.
3. **Retry interaction**: Total contract validation attempts per step = `MaxTDDCycles * MaxContractRetries` (contractRetries resets each TDD cycle). The contract tests must account for this.
4. **Atomic dual validation**: `ContractPasses` sets both `inputContractValid` and `outputContractValid` atomically. The implementation validates them sequentially, but both must pass as a single gate.
5. **Out-of-scope items**: The spec does not model phase rollback, partial deployment, or pipeline abort-on-step-failure.

## TLA+ State Coverage Matrix

### States

- `UNASSIGNED` -- step exists but no writer selected
- `ASSIGNED` -- writer selected, not yet started
- `HANDSHAKE` -- writer and test-writer performing handshake
- `RED` -- failing test written (for trainer-writer: Zod schema written)
- `CONTRACT_VALIDATE` -- contract validation running (Zod parse of artifact)
- `GREEN` -- implementation satisfies contract (Zod parse passes)
- `REFACTOR` -- refactor phase of TDD cycle
- `STEP_COMPLETE` -- step done, all TDD cycles passed
- `STEP_FAILED` -- step exhausted retries
- `NOT_STARTED` -- implementation phases not begun
- `PHASE_A` -- create `packages/agent-contracts/` with Zod schemas
- `PHASE_B` -- modify implementation-writer AGENT.md (add trainer-writer)
- `PHASE_C` -- modify trainer AGENT.md (accept impl step input shape)
- `PHASE_D` -- modify questioner SKILL.md (remove trainer dispatch + add guide row)
- `ALL_DONE` -- all phases complete
- `PASS` -- contract validation result
- `FAIL` -- contract validation result
- `inputContractValid = TRUE` -- input contract validated for trainer-writer step
- `outputContractValid = TRUE` -- output contract validated for trainer-writer step
- `questionerCanDispatchTrainer = TRUE` -- questioner can still dispatch trainer
- `questionerCanDispatchTrainer = FALSE` -- questioner can no longer dispatch trainer
- `pipelineComplete = TRUE` -- all steps terminal and all phases done

### Transitions

- `AssignWriter(s, w)` -- assign a code writer to a step (UNASSIGNED -> ASSIGNED)
- `BeginHandshake(s)` -- start handshake (ASSIGNED -> HANDSHAKE)
- `WriteFailingTest(s)` -- write failing test, increment tddCycle (HANDSHAKE -> RED)
- `RunContractValidation(s)` -- run contract validation (RED -> CONTRACT_VALIDATE)
- `ContractPasses(s)` -- contract passes, set contract flags for trainer steps (CONTRACT_VALIDATE -> GREEN)
- `ContractFails(s)` -- contract fails, increment retries (CONTRACT_VALIDATE -> HANDSHAKE)
- `ContractFailsExhausted(s)` -- retries exhausted (CONTRACT_VALIDATE -> STEP_FAILED)
- `BeginRefactor(s)` -- enter refactor phase (GREEN -> REFACTOR)
- `CompleteStep(s)` -- step done (REFACTOR -> STEP_COMPLETE)
- `AnotherCycle(s)` -- refactor reveals need for another cycle (REFACTOR -> HANDSHAKE)
- `TDDExhausted(s)` -- TDD cycles exhausted (HANDSHAKE -> STEP_FAILED)
- `BeginPhaseA` -- start phase A (NOT_STARTED -> PHASE_A)
- `BeginPhaseB` -- start phase B (PHASE_A -> PHASE_B)
- `BeginPhaseC` -- start phase C (PHASE_B -> PHASE_C)
- `BeginPhaseD` -- start phase D, set questionerCanDispatchTrainer=FALSE (PHASE_C -> PHASE_D)
- `CompletePhases` -- all phases done (PHASE_D -> ALL_DONE)
- `CompletePipeline` -- pipeline complete (AllStepsTerminal /\ ALL_DONE -> pipelineComplete=TRUE)

### Safety Invariants

- `TypeOK` -- all variables have correct types
- `TrainerContractRequired` (S1) -- trainer-writer steps must have both contracts validated before STEP_COMPLETE
- `PhaseOrdering` (S2) -- implementation phases execute in strict order; questionerCanDispatchTrainer=FALSE only at PHASE_D or later
- `QuestionerTrainerRemoved` (S3) -- questioner cannot dispatch trainer after phase D
- `ContractFlagsOnlyForTrainer` (S4) -- only trainer-writer steps have contract validation flags set
- `CompletionRequiresTDD` (S5) -- STEP_COMPLETE requires tddCycle >= 1
- `ContractRetriesBounded` (S6) -- contractRetries <= MaxContractRetries
- `TDDCyclesBounded` (S7) -- tddCycle <= MaxTDDCycles
- `PipelineCompleteConsistent` (S8) -- pipelineComplete implies AllStepsTerminal and ALL_DONE
- `UnassignedStepIsIdle` (S9) -- unassigned steps are in UNASSIGNED state
- `RemovalOnlyInPhaseD` (S10) -- before phase D, questionerCanDispatchTrainer is TRUE

### Liveness Properties

- `StepTerminates` (L1) -- every assigned step eventually reaches STEP_COMPLETE or STEP_FAILED
- `PhasesComplete` (L2) -- NOT_STARTED eventually leads to ALL_DONE
- `PipelineTerminates` (L3) -- pipelineComplete eventually becomes TRUE

---

## Implementation Steps

### Step 1: Package scaffold and composable Zod building-block schemas

**Files:**
- `packages/agent-contracts/package.json` (create)
- `packages/agent-contracts/tsconfig.json` (create)
- `packages/agent-contracts/vitest.config.ts` (create)
- `packages/agent-contracts/src/index.ts` (create)
- `packages/agent-contracts/src/schemas/frontmatter.ts` (create)
- `packages/agent-contracts/src/schemas/section.ts` (create)
- `packages/agent-contracts/src/schemas/handoff-contract.ts` (create)

**Description:**
Create the `packages/agent-contracts/` monorepo package as workspace-internal infrastructure. Define composable Zod building-block schemas: `FrontmatterSchema` (validates YAML frontmatter with name and description fields), `SectionSchema` (validates required markdown sections like "When to Use", "Process", "Output Format"), and `HandoffContractSchema` (validates handoff declarations with passes-to and passes fields). These are the Value Object schemas that larger artifact schemas compose from (debate refinement #1). The package is workspace-internal only -- not published to npm (debate refinement #3).

**Dependencies:** None

**Test (write first):**
Create `packages/agent-contracts/src/schemas/frontmatter.test.ts`. Write tests that:
1. Parse a valid frontmatter object `{ name: "test-agent", description: "A test agent" }` and assert it succeeds, returning the parsed object.
2. Parse an object missing the `name` field and assert it throws a ZodError.
3. Parse an object with an empty string for `description` and assert it throws a ZodError.
4. Parse a valid section object `{ heading: "## Process", required: true }` and assert it succeeds.
5. Parse a valid handoff contract `{ passesTo: "design-pipeline", passes: "Implementation plan file path" }` and assert it succeeds.
6. Parse a handoff contract missing `passesTo` and assert it throws.

All tests use in-memory fixtures -- no filesystem reads.

**TLA+ Coverage:**
- State: `PHASE_A` (create packages/agent-contracts/ with Zod schemas)
- Transition: `BeginPhaseA` (NOT_STARTED -> PHASE_A)
- Invariant: `TypeOK` (schemas define the type contracts that TypeOK represents at the spec level)

---

### Step 2: Trainer-writer output contract schema

**Files:**
- `packages/agent-contracts/src/schemas/trainer-output.ts` (create)

**Description:**
Compose the building-block schemas from Step 1 into a `TrainerOutputSchema` that validates the full output shape of the trainer-writer: frontmatter (name, description), required sections (When to Use, Process, Output Format for skills; Role, When to Dispatch, Process, Output Format for agents), handoff contract (passes-to, passes, format), and a file manifest (array of created file paths). This is the output half of the dual contract (debate refinement #2).

**Dependencies:** Step 1

**Test (write first):**
Create `packages/agent-contracts/src/schemas/trainer-output.test.ts`. Write tests that:
1. Parse a complete, valid trainer-writer output fixture (a SKILL.md-shaped object with all required sections, valid frontmatter, handoff contract, and file manifest) and assert it succeeds.
2. Parse an output missing the handoff contract and assert it throws.
3. Parse an output with an empty file manifest and assert it throws (at least one file must be produced).
4. Parse an output with frontmatter but missing required sections and assert it throws, with the error identifying the missing section.
5. Parse a valid AGENT.md-shaped output (different required sections than SKILL.md) and assert it succeeds.

**TLA+ Coverage:**
- State: `outputContractValid = TRUE`
- Transition: `ContractPasses` (the output contract validation gate)
- Invariant: `TrainerContractRequired` (S1) -- output contract must be validated for trainer-writer steps
- Invariant: `ContractFlagsOnlyForTrainer` (S4) -- output contract flag is only set for trainer-writer steps

---

### Step 3: Trainer-writer input contract schema

**Files:**
- `packages/agent-contracts/src/schemas/trainer-input.ts` (create)

**Description:**
Define `TrainerInputSchema` that validates the implementation step input shape the trainer-writer receives from the implementation-writer's task assignment table: step number, title, file list with paths and create/modify flags, description, dependencies, test description, and TLA+ coverage mapping. This is the input half of the dual contract (debate refinement #2). The schema makes the boundary between the implementation-writer (producer) and trainer-writer (consumer) explicit and testable.

**Dependencies:** Step 1

**Test (write first):**
Create `packages/agent-contracts/src/schemas/trainer-input.test.ts`. Write tests that:
1. Parse a complete, valid implementation step fixture (step number, title, files array, description, dependencies, test description, TLA+ coverage) and assert it succeeds.
2. Parse an input with step number 0 (invalid -- must be >= 1) and assert it throws.
3. Parse an input with an empty files array and assert it throws (every step must touch at least one file).
4. Parse an input with a file entry missing the `action` field (create/modify) and assert it throws.
5. Parse an input with no TLA+ coverage and assert it throws (every step must map to at least one spec element).
6. Parse an input with dependencies as an empty array (valid -- Step 1 has no dependencies) and assert it succeeds.

**TLA+ Coverage:**
- State: `inputContractValid = TRUE`
- Transition: `ContractPasses` (the input contract validation gate)
- Invariant: `TrainerContractRequired` (S1) -- input contract must be validated for trainer-writer steps
- Invariant: `ContractFlagsOnlyForTrainer` (S4) -- input contract flag is only set for trainer-writer steps

---

### Step 4: Contract validation failure and retry tests

**Files:**
- `packages/agent-contracts/src/schemas/contract-validation.test.ts` (create)

**Description:**
Test the contract validation failure modes that the TLA+ spec models: a structurally valid but incomplete artifact that fails schema parse (maps to `ContractFails`), an artifact that fails with retries exhausted (maps to `ContractFailsExhausted`), and the retry counter interaction where total attempts = MaxTDDCycles * MaxContractRetries. Also tests the negative case for malformed frontmatter (empty or missing YAML block produces a clear ZodError, not a cryptic parse exception) -- this addresses the edge case from expert-edge-cases. These are pure schema validation tests using in-memory fixtures.

**Dependencies:** Step 2, Step 3

**Test (write first):**
Create the test file directly (this step IS the test -- no implementation code beyond the schemas from Steps 1-3). Tests:
1. Parse a trainer output with malformed frontmatter (null instead of object) and assert the ZodError path includes "frontmatter".
2. Parse a trainer output with valid frontmatter but invalid section structure and assert failure identifies the section.
3. Parse a trainer input with valid structure but a file path containing backslashes (invalid -- must use forward slashes) and assert it throws.
4. Demonstrate the retry pattern: parse the same invalid fixture twice (simulating MaxContractRetries=1), then parse a corrected fixture (simulating the next TDD cycle), asserting the corrected fixture passes.
5. Parse a trainer output that is completely empty (empty string) and assert it throws with a clear message.

**TLA+ Coverage:**
- State: `FAIL` (contract validation result)
- Transition: `ContractFails` (CONTRACT_VALIDATE -> HANDSHAKE)
- Transition: `ContractFailsExhausted` (CONTRACT_VALIDATE -> STEP_FAILED)
- Invariant: `ContractRetriesBounded` (S6) -- retries are bounded

---

### Step 5: Implementation-writer AGENT.md -- add trainer-writer as fourth code writer

**Files:**
- `.claude/skills/implementation-writer/AGENT.md` (modify)

**Description:**
Add `trainer-writer` as the fourth code writer option in the implementation-writer's agent definition. Update the "Code writers" list, add selection guidance (when a step's output is Claude Code artifacts in `.claude/`, select trainer-writer), and update the pairing rules to reflect the 4x2 matrix. The trainer-writer pairs with vitest-writer for contract validation tests. This is an additive, non-breaking change.

**Dependencies:** Step 1

**Test (write first):**
Create `packages/agent-contracts/src/schemas/implementation-writer-contract.test.ts`. Write a contract test that:
1. Define a fixture representing the expected structure of the implementation-writer's code writer list (array of objects with name, description, file-types, pairing-rules).
2. Assert the fixture includes exactly 4 code writers: typescript-writer, hono-writer, ui-writer, trainer-writer.
3. Assert trainer-writer's pairing rules include vitest-writer as a valid test writer.
4. Assert trainer-writer's file-types include `.md` and `.sh`.
5. Assert the selection guidance for trainer-writer includes the phrase "Claude Code artifacts" or equivalent trigger.

**TLA+ Coverage:**
- State: `PHASE_B` (modify implementation-writer to add trainer-writer)
- Transition: `BeginPhaseB` (PHASE_A -> PHASE_B)
- Invariant: `PhaseOrdering` (S2) -- phase B can only be reached from phase A

---

### Step 6: Trainer AGENT.md -- accept implementation step input shape

**Files:**
- `.claude/skills/trainer/AGENT.md` (modify)

**Description:**
Modify the trainer agent definition to accept implementation step input as a valid input shape alongside the existing questioner briefing input. Add a new "Input Shapes" section documenting both: (1) questioner briefing (the existing path -- will be deprecated in Step 7) and (2) implementation step assignment (the new path from the implementation-writer's task table). The trainer's orient phase must handle both input shapes. The TrainerInputSchema from Step 3 defines what the implementation step looks like.

**Dependencies:** Step 3

**Test (write first):**
Create `packages/agent-contracts/src/schemas/trainer-agent-contract.test.ts`. Write a contract test that:
1. Define a fixture representing the trainer agent's expected input shape options (array of accepted input types).
2. Assert the fixture includes exactly 2 input shapes: "questioner-briefing" and "implementation-step".
3. Validate the "implementation-step" shape against `TrainerInputSchema` (import from Step 3) and assert it parses successfully.
4. Assert the trainer agent fixture includes an orient phase that references both input shapes.

**TLA+ Coverage:**
- State: `PHASE_C` (modify trainer AGENT.md to accept impl step input)
- Transition: `BeginPhaseC` (PHASE_B -> PHASE_C)
- State: `ASSIGNED` (step is assigned to trainer-writer, which requires the trainer to accept the input)

---

### Step 7: Questioner SKILL.md -- remove trainer dispatch and add decision guide row

**Files:**
- `.claude/skills/questioner/SKILL.md` (modify)

**Description:**
Remove the trainer from the questioner's dispatch target scanning. Add a row to the questioner's decision guide table: when a user describes an agent artifact in a standalone `/questioner` session, recommend `/design-pipeline` as the entry point for agent artifact creation. This is the only step that removes functionality (debate refinement #5, step d). The decision guide row prevents a dead-end where the questioner has no dispatch target for agent artifacts (debate refinement #4).

**Dependencies:** Step 5, Step 6

**Test (write first):**
Create `packages/agent-contracts/src/schemas/questioner-contract.test.ts`. Write a contract test that:
1. Define a fixture representing the questioner's dispatch target list (array of target names).
2. Assert the fixture does NOT include "trainer" as a dispatch target.
3. Define a fixture representing the questioner's decision guide table (array of rows with trigger and recommendation).
4. Assert the decision guide includes a row where the trigger matches "agent artifact" or "skill/agent definition" and the recommendation includes "/design-pipeline".
5. Assert the dispatch target list still includes "debate-moderator" (not accidentally removed).

**TLA+ Coverage:**
- State: `PHASE_D` (modify questioner SKILL.md)
- State: `questionerCanDispatchTrainer = FALSE`
- Transition: `BeginPhaseD` (PHASE_C -> PHASE_D, sets questionerCanDispatchTrainer=FALSE)
- Invariant: `QuestionerTrainerRemoved` (S3) -- questioner cannot dispatch trainer after phase D
- Invariant: `RemovalOnlyInPhaseD` (S10) -- before phase D, questioner can still dispatch trainer

---

### Step 8: End-to-end pipeline completion verification

**Files:**
- `packages/agent-contracts/src/schemas/pipeline-completion.test.ts` (create)

**Description:**
Integration-level contract tests that verify the full pipeline completion conditions from the TLA+ spec. These tests simulate the pipeline lifecycle by constructing fixtures representing each phase and step state, then asserting the pipeline completion predicate. This step covers the liveness properties and the pipeline-level safety invariants that are not adequately tested by individual step tests.

**Dependencies:** Step 4, Step 5, Step 6, Step 7

**Test (write first):**
Create the test file (this step IS the test). Tests:
1. Construct a fixture where all 3 steps are STEP_COMPLETE, implPhase is ALL_DONE, and assert pipelineComplete can be set to TRUE.
2. Construct a fixture where 2 steps are STEP_COMPLETE and 1 is STEP_FAILED, implPhase is ALL_DONE, and assert pipelineComplete can be set to TRUE (AllStepsTerminal includes STEP_FAILED).
3. Construct a fixture where all steps are STEP_COMPLETE but implPhase is PHASE_C, and assert pipelineComplete CANNOT be set to TRUE.
4. Construct a fixture where implPhase is ALL_DONE but 1 step is still in RED, and assert pipelineComplete CANNOT be set to TRUE.
5. Construct a fixture where a trainer-writer step is STEP_COMPLETE with inputContractValid=TRUE and outputContractValid=TRUE, and assert TrainerContractRequired passes.
6. Construct a fixture where a trainer-writer step is STEP_COMPLETE with outputContractValid=FALSE, and assert TrainerContractRequired fails.
7. Verify the TDD cycle requirement: a step with tddCycle=0 cannot be STEP_COMPLETE (CompletionRequiresTDD).

**TLA+ Coverage:**
- State: `pipelineComplete = TRUE`
- State: `ALL_DONE`
- State: `STEP_COMPLETE`, `STEP_FAILED` (terminal states)
- Transition: `CompletePipeline` (AllStepsTerminal /\ ALL_DONE -> pipelineComplete)
- Transition: `CompletePhases` (PHASE_D -> ALL_DONE)
- Invariant: `PipelineCompleteConsistent` (S8)
- Invariant: `TrainerContractRequired` (S1) -- verified at pipeline level
- Invariant: `CompletionRequiresTDD` (S5) -- verified at pipeline level
- Liveness: `StepTerminates` (L1) -- simulated by fixture reaching terminal state
- Liveness: `PhasesComplete` (L2) -- simulated by fixture reaching ALL_DONE
- Liveness: `PipelineTerminates` (L3) -- simulated by fixture reaching pipelineComplete

---

### Step 9: TDD lifecycle state machine tests

**Files:**
- `packages/agent-contracts/src/schemas/step-lifecycle.test.ts` (create)

**Description:**
Tests that verify the step lifecycle state machine transitions match the TLA+ spec exactly. These tests do not exercise Zod schemas -- they exercise a pure TypeScript function that validates state transitions (given current state, is a transition to the next state valid?). This ensures the TDD ping-pong protocol (UNASSIGNED -> ASSIGNED -> HANDSHAKE -> RED -> CONTRACT_VALIDATE -> GREEN -> REFACTOR -> STEP_COMPLETE) is correctly implemented and that invalid transitions are rejected.

**Dependencies:** Step 1

**Test (write first):**
Create the test file. Tests:
1. Assert UNASSIGNED -> ASSIGNED is valid (AssignWriter).
2. Assert ASSIGNED -> HANDSHAKE is valid (BeginHandshake).
3. Assert HANDSHAKE -> RED is valid when tddCycle < MaxTDDCycles (WriteFailingTest).
4. Assert HANDSHAKE -> STEP_FAILED is valid when tddCycle >= MaxTDDCycles (TDDExhausted).
5. Assert RED -> CONTRACT_VALIDATE is valid (RunContractValidation).
6. Assert CONTRACT_VALIDATE -> GREEN is valid (ContractPasses).
7. Assert CONTRACT_VALIDATE -> HANDSHAKE is valid when contractRetries < MaxContractRetries (ContractFails).
8. Assert CONTRACT_VALIDATE -> STEP_FAILED is valid when contractRetries >= MaxContractRetries (ContractFailsExhausted).
9. Assert GREEN -> REFACTOR is valid (BeginRefactor).
10. Assert REFACTOR -> STEP_COMPLETE is valid (CompleteStep).
11. Assert REFACTOR -> HANDSHAKE is valid when tddCycle < MaxTDDCycles (AnotherCycle).
12. Assert UNASSIGNED -> RED is INVALID (cannot skip ASSIGNED and HANDSHAKE).
13. Assert GREEN -> STEP_COMPLETE is INVALID (must go through REFACTOR).
14. Assert STEP_COMPLETE -> anything is INVALID (terminal state).
15. Assert STEP_FAILED -> anything is INVALID (terminal state).

**TLA+ Coverage:**
- State: ALL step states (UNASSIGNED, ASSIGNED, HANDSHAKE, RED, CONTRACT_VALIDATE, GREEN, REFACTOR, STEP_COMPLETE, STEP_FAILED)
- Transition: ALL step transitions (AssignWriter, BeginHandshake, WriteFailingTest, RunContractValidation, ContractPasses, ContractFails, ContractFailsExhausted, BeginRefactor, CompleteStep, AnotherCycle, TDDExhausted)
- Invariant: `UnassignedStepIsIdle` (S9) -- unassigned step stays UNASSIGNED
- Invariant: `TDDCyclesBounded` (S7) -- transitions respect cycle bounds
- Invariant: `ContractRetriesBounded` (S6) -- transitions respect retry bounds

---

### Step 10: Step lifecycle state machine implementation

**Files:**
- `packages/agent-contracts/src/state-machine/step-lifecycle.ts` (create)

**Description:**
Implement the pure TypeScript step lifecycle state machine that Step 9's tests demand. This is a function `isValidTransition(currentState, nextState, context)` where context includes tddCycle, contractRetries, MaxTDDCycles, and MaxContractRetries. The function returns true if the transition is valid per the TLA+ spec's guards. This module is the runtime equivalent of the TLA+ spec's step state transitions.

**Dependencies:** Step 9

**Test (write first):**
Tests are already written in Step 9. This step writes the minimum implementation to make them pass, then refactors.

**TLA+ Coverage:**
- Same as Step 9 (this is the implementation that makes Step 9's tests pass)

---

## State Coverage Audit

### States

| State | Covered By |
|-------|------------|
| UNASSIGNED | Step 9 |
| ASSIGNED | Step 6, Step 9 |
| HANDSHAKE | Step 9 |
| RED | Step 9 |
| CONTRACT_VALIDATE | Step 4, Step 9 |
| GREEN | Step 9 |
| REFACTOR | Step 9 |
| STEP_COMPLETE | Step 8, Step 9 |
| STEP_FAILED | Step 4, Step 8, Step 9 |
| NOT_STARTED | Step 1, Step 8 |
| PHASE_A | Step 1 |
| PHASE_B | Step 5 |
| PHASE_C | Step 6 |
| PHASE_D | Step 7 |
| ALL_DONE | Step 8 |
| PASS | Step 2, Step 3 |
| FAIL | Step 4 |
| inputContractValid=TRUE | Step 3, Step 8 |
| outputContractValid=TRUE | Step 2, Step 8 |
| questionerCanDispatchTrainer=TRUE | Step 7 (before phase D) |
| questionerCanDispatchTrainer=FALSE | Step 7 |
| pipelineComplete=TRUE | Step 8 |

### Transitions

| Transition | Covered By |
|------------|------------|
| AssignWriter | Step 9 |
| BeginHandshake | Step 9 |
| WriteFailingTest | Step 9 |
| RunContractValidation | Step 9 |
| ContractPasses | Step 2, Step 3, Step 9 |
| ContractFails | Step 4, Step 9 |
| ContractFailsExhausted | Step 4, Step 9 |
| BeginRefactor | Step 9 |
| CompleteStep | Step 9 |
| AnotherCycle | Step 9 |
| TDDExhausted | Step 9 |
| BeginPhaseA | Step 1 |
| BeginPhaseB | Step 5 |
| BeginPhaseC | Step 6 |
| BeginPhaseD | Step 7 |
| CompletePhases | Step 8 |
| CompletePipeline | Step 8 |

### Safety Invariants

| Invariant | Verified By |
|-----------|-------------|
| TypeOK | Step 1 (schemas define type contracts) |
| TrainerContractRequired (S1) | Step 2, Step 3, Step 8 |
| PhaseOrdering (S2) | Step 5, Step 7 |
| QuestionerTrainerRemoved (S3) | Step 7 |
| ContractFlagsOnlyForTrainer (S4) | Step 2, Step 3 |
| CompletionRequiresTDD (S5) | Step 8 |
| ContractRetriesBounded (S6) | Step 4, Step 9 |
| TDDCyclesBounded (S7) | Step 9 |
| PipelineCompleteConsistent (S8) | Step 8 |
| UnassignedStepIsIdle (S9) | Step 9 |
| RemovalOnlyInPhaseD (S10) | Step 7 |

### Liveness Properties

| Property | Verified By |
|----------|-------------|
| StepTerminates (L1) | Step 8 (fixture reaches terminal state), Step 9 (all transitions to terminal states) |
| PhasesComplete (L2) | Step 8 (fixture reaches ALL_DONE) |
| PipelineTerminates (L3) | Step 8 (fixture reaches pipelineComplete) |

All TLA+ states, transitions, and properties are covered by the implementation plan.

---

## Execution Tiers

### Tier 1: Foundation (independent package scaffold and building blocks)

These steps have no dependencies and can execute in parallel. Step 1 creates the package infrastructure; Step 9 defines the state machine test suite. They touch completely different files.

| Task ID | Step | Title |
|---------|------|-------|
| T1 | Step 1 | Package scaffold and composable Zod building-block schemas |
| T9 | Step 9 | TDD lifecycle state machine tests |

### Tier 2: Core schemas and state machine (depends on Tier 1)

Steps 2 and 3 compose the building-block schemas from Step 1 into input/output contracts. Step 5 modifies the implementation-writer (depends on Step 1 existing). Step 10 implements the state machine that Step 9's tests demand. No file overlap within this tier.

| Task ID | Step | Title |
|---------|------|-------|
| T2 | Step 2 | Trainer-writer output contract schema |
| T3 | Step 3 | Trainer-writer input contract schema |
| T5 | Step 5 | Implementation-writer AGENT.md -- add trainer-writer |
| T10 | Step 10 | Step lifecycle state machine implementation |

### Tier 3: Failure modes and trainer agent (depends on Tier 2)

Step 4 tests failure paths using schemas from Steps 2 and 3. Step 6 modifies the trainer agent using the input contract from Step 3. No file overlap.

| Task ID | Step | Title |
|---------|------|-------|
| T4 | Step 4 | Contract validation failure and retry tests |
| T6 | Step 6 | Trainer AGENT.md -- accept implementation step input shape |

### Tier 4: Breaking change (depends on Tier 3)

Step 7 is the only step that removes functionality. It depends on Steps 5 and 6 being complete (the additive changes must land first, matching the deployment ordering from debate refinement #5).

| Task ID | Step | Title |
|---------|------|-------|
| T7 | Step 7 | Questioner SKILL.md -- remove trainer dispatch and add decision guide row |

### Tier 5: Pipeline integration (depends on Tier 4)

Step 8 is the integration-level verification that depends on all prior steps.

| Task ID | Step | Title |
|---------|------|-------|
| T8 | Step 8 | End-to-end pipeline completion verification |

---

## Task Assignment Table

| Task ID | Title | Tier | Code Writer | Test Writer | Dependencies | Rationale |
|---------|-------|------|-------------|-------------|--------------|-----------|
| T1 | Package scaffold and composable Zod building-block schemas | 1 | typescript-writer | vitest-writer | None | Pure TypeScript Zod schemas with vitest contract validation tests against in-memory fixtures. |
| T9 | TDD lifecycle state machine tests | 1 | typescript-writer | vitest-writer | None | Pure TypeScript state transition tests -- no framework code, no UI, no agent artifacts. |
| T2 | Trainer-writer output contract schema | 2 | typescript-writer | vitest-writer | T1 | Composing Zod schemas into a larger contract -- pure TypeScript domain logic with vitest validation. |
| T3 | Trainer-writer input contract schema | 2 | typescript-writer | vitest-writer | T1 | Composing Zod schemas for the input boundary -- pure TypeScript with vitest contract tests. |
| T5 | Implementation-writer AGENT.md -- add trainer-writer | 2 | trainer-writer | vitest-writer | T1 | Modifying an agent definition file in `.claude/skills/` -- trainer-writer handles Claude Code artifacts, vitest validates structure via contract tests. |
| T10 | Step lifecycle state machine implementation | 2 | typescript-writer | vitest-writer | T9 | Pure TypeScript state machine function -- tests already written in T9, this writes the implementation. |
| T4 | Contract validation failure and retry tests | 3 | typescript-writer | vitest-writer | T2, T3 | Test-only step exercising failure modes of Zod schemas -- typescript-writer for any helper utilities, vitest for the tests themselves. |
| T6 | Trainer AGENT.md -- accept implementation step input shape | 3 | trainer-writer | vitest-writer | T3 | Modifying the trainer agent definition in `.claude/skills/trainer/` -- trainer-writer handles the markdown, vitest validates the input shape contract. |
| T7 | Questioner SKILL.md -- remove trainer dispatch and add guide row | 4 | trainer-writer | vitest-writer | T5, T6 | Modifying a skill definition in `.claude/skills/questioner/` -- trainer-writer handles the markdown change, vitest validates dispatch target and decision guide contracts. |
| T8 | End-to-end pipeline completion verification | 5 | typescript-writer | vitest-writer | T4, T5, T6, T7 | Integration-level contract tests using TypeScript fixtures -- no browser testing needed, vitest validates pipeline completion predicates. |
