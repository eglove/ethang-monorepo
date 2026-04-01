# TLA+ Specification: Trainer as Code Writer with Agent Contracts

## Source
Briefing: `docs/questioner-sessions/2026-03-31_trainer-as-coder.md`
Design consensus: `docs/debate-moderator-sessions/2026-03-31_trainer-as-coder-design.md`

## Specification
- **Module:** `TrainerAsCoder.tla`
- **Config:** `MC.cfg`
- **Model-check wrapper:** `MC.tla`

## States

### Step States (TDD Ping-Pong Lifecycle)
- `UNASSIGNED` -- step exists, no writer selected
- `ASSIGNED` -- writer selected (one of 4 types), not started
- `HANDSHAKE` -- writer and test-writer performing handshake
- `RED` -- failing test written (for trainer-writer: Zod schema written)
- `CONTRACT_VALIDATE` -- Zod parse running against artifact
- `GREEN` -- implementation satisfies contract
- `REFACTOR` -- refactor phase of TDD cycle
- `STEP_COMPLETE` -- all TDD cycles passed
- `STEP_FAILED` -- retries exhausted

### Implementation Phases (Ordered Deployment)
- `NOT_STARTED` -- no changes deployed yet
- `PHASE_A` -- create `packages/agent-contracts/` with composable Zod schemas
- `PHASE_B` -- add trainer-writer as 4th code writer in implementation-writer
- `PHASE_C` -- modify trainer to accept implementation step input shape
- `PHASE_D` -- remove trainer from questioner dispatch + add decision guide row
- `ALL_DONE` -- all four changes deployed

### Writer Types
- `hono_writer` -- Hono application code
- `typescript_writer` -- general TypeScript code
- `vitest_writer` -- test code
- `trainer_writer` -- agent/skill artifacts (.claude/ files)

## Properties Verified

### Safety (Invariants)
| Property | Guarantee |
|----------|-----------|
| `TypeOK` | All variables stay within their declared domains |
| `TrainerContractRequired` | Trainer-writer steps cannot complete without both input AND output contracts validated |
| `PhaseOrdering` | Questioner dispatch removal only happens at phase D or later |
| `QuestionerTrainerRemoved` | After phase D, questioner cannot dispatch to trainer |
| `ContractFlagsOnlyForTrainer` | Only trainer-writer steps have contract validation flags set |
| `CompletionRequiresTDD` | No step completes without at least one TDD cycle |
| `ContractRetriesBounded` | Contract validation retries never exceed the bound |
| `TDDCyclesBounded` | TDD cycles never exceed the bound |
| `PipelineCompleteConsistent` | Pipeline marked complete only when all steps terminal and all phases done |
| `UnassignedStepIsIdle` | Steps with no writer assignment cannot be in any active state |
| `RemovalOnlyInPhaseD` | Questioner can dispatch trainer in all phases before D |

### Liveness
| Property | Guarantee |
|----------|-----------|
| `StepTerminates` | Every assigned step eventually reaches STEP_COMPLETE or STEP_FAILED |
| `PhasesComplete` | Implementation phases eventually reach ALL_DONE |
| `PipelineTerminates` | The pipeline eventually completes |

## TLC Results
- **States generated:** 6,071,233
- **Distinct states:** 1,551,531
- **Depth:** 40
- **Result:** PASS (no errors)
- **Workers:** 4
- **Runtime:** 2 min 15 sec
- **Date:** 2026-03-31 (v2 — after TLA+ review debate fixes)

## Model Parameters
- 3 steps (`s1`, `s2`, `s3`)
- `MaxTDDCycles = 2`
- `MaxContractRetries = 1`
- 4 writer types (full WriterTypes set)

## Design Notes

### Retry Interaction
Total contract validation attempts per step = `MaxTDDCycles × MaxContractRetries`, because `contractRetries` resets to 0 at each TDD cycle entry (`WriteFailingTest`). With the model parameters above, that means up to 2 contract retries per step (2 cycles × 1 retry each).

### Atomic Dual Validation
`ContractPasses` sets both `inputContractValid` and `outputContractValid` atomically. This is intentional — modeling them as separate transitions would double the state space without yielding new safety properties, since both must pass for the step to proceed.

### Phase-Step Ordering Guard (v2 fix)
`AssignWriter` prevents `trainer_writer` assignment before `PHASE_B`. Without this guard, the spec would allow assigning a capability that hasn't been deployed yet. This reduced the reachable state space from 7.8M to 6M states.

### Out of Scope
This spec does not model:
- **Phase rollback** — phases are strictly forward (A→B→C→D)
- **Partial phase deployment** — each phase is atomic
- **Pipeline abort-on-step-failure** — a failed step does not halt the pipeline; re-dispatch creates a new Init
- **Concurrent step execution** — steps are modeled independently; the tier system is not modeled here

## Prior Versions
None
