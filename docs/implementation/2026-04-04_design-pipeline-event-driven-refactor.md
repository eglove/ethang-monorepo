# Implementation Plan: Design-Pipeline Event-Driven Refactor

## Source Artifacts

| Artifact | Path |
|----------|------|
| Briefing | `docs/questioner-sessions/2026-04-04_design-pipeline-event-driven-refactor.md` |
| Design Consensus | `docs/debate-moderator-sessions/2026-04-04_design-pipeline-event-driven-refactor.md` |
| TLA+ Specification | `docs/tla-specs/design-pipeline-event-driven-refactor-v2/` |
| TLA+ Review Consensus | `docs/debate-moderator-sessions/2026-04-04_design-pipeline-event-driven-refactor-tla-review-v2.md` |

## TLA+ State Coverage Matrix

### States

**Run states (runState):**
- `"idle"` -- pipeline not started
- `"running"` -- pipeline executing stages
- `"complete"` -- all stages finished successfully
- `"error"` -- pipeline failed (retries exhausted)
- `"aborting"` -- abort requested, teardown in progress
- `"aborted"` -- abort complete

**Stage states (stageState per stage):**
- `"idle"` -- stage not yet created/activated
- `"active"` -- stage executing work
- `"streaming"` -- stage receiving LLM stream
- `"complete"` -- stage finished successfully
- `"error"` -- stage failed (retries exhausted)
- `"aborting"` -- stage abort in progress
- `"aborted"` -- stage abort complete
- `"retrying"` -- stage preparing to retry after failure

**LLM states (llmState per stage):**
- `"idle"` -- no LLM request in flight
- `"requesting"` -- LLM request sent, awaiting response
- `"streaming-active"` -- receiving streaming tokens
- `"streaming-interrupted"` -- stream broken mid-response
- `"complete"` -- LLM call finished successfully
- `"error"` -- LLM call failed terminally

**Boolean per-stage flags:**
- `stageCreated[s]` -- whether orchestrator has instantiated the stage store
- `stageDestroyed[s]` -- whether the stage store has been destroyed

**Counters per stage:**
- `stageRetries[s]` -- 0..MaxRetries
- `llmCalls[s]` -- 0..MaxLlmCalls
- `llmCompleted[s]` -- 0..MaxLlmCalls

**Graph:**
- `subscriptions` -- set of directed edges forming DAG

### Transitions

1. `StartPipeline` -- idle -> running, create+activate stage 1
2. `AdvanceStage` -- current stage complete -> destroy it, create+activate next stage, add subscription edge
3. `CompletePipeline` -- last stage complete -> run complete, destroy all
4. `PipelineError` -- current stage error with retries exhausted -> run error
5. `AbortPipeline` -- running -> aborting
6. `CompleteAbort` -- aborting -> aborted, force-abort active stage, error in-flight LLM
7. `StageRequestLlm(s)` -- active stage initiates LLM call (idle/complete -> requesting)
8. `LlmStartStreaming(s)` -- requesting -> streaming-active, stage -> streaming
9. `LlmStreamComplete(s)` -- streaming-active -> complete, stage -> active, increment llmCompleted
10. `StageDecideComplete(s)` -- active stage with llmCompleted > 0 and no in-flight LLM -> complete
11. `LlmStreamInterrupt(s)` -- streaming-active -> streaming-interrupted
12. `LlmInterruptResolve(s)` -- streaming-interrupted -> retry or error (based on retries remaining)
13. `LlmRequestFail(s)` -- requesting -> retry or error (based on retries remaining)
14. `StageRetryResume(s)` -- retrying -> active
15. `StageCompleteDirectly(s)` -- active stage with llmCompleted=0, no in-flight LLM -> complete
16. `StageDirectError(s)` -- active stage, no in-flight LLM -> retry or error
17. `StageTimeout(s)` -- active/streaming stage -> retry or error, reset in-flight LLM if applicable
18. `StageAbort(s)` -- active/streaming/retrying stage during aborting run -> aborting
19. `StageAbortComplete(s)` -- aborting stage -> aborted, destroy, error in-flight LLM
20. `Terminated` -- stuttering step in terminal states (complete/error/aborted)

### Safety Invariants

1. `TypeOK` -- all variables within declared type domains
2. `DAGInvariant` -- subscription graph is acyclic
3. `NoZombieStages` -- aborted implies destroyed; destroyed implies terminal/idle state
4. `RetriesBounded` -- stageRetries[s] <= MaxRetries for all s
5. `StageOrdering` -- stages execute sequentially (s created => s-1 terminal or destroyed)
6. `StoreLifecycleIntegrity` -- active/streaming/retrying/aborting stages must be created and not destroyed
7. `PipelineCompleteImpliesAllDone` -- run complete => all stages destroyed
8. `NoLlmOnDestroyedStage` -- destroyed stage LLM state is idle/complete/error only
9. `AbortingBlocksNewStages` -- during abort, no stage beyond currentStage is created or active
10. `LlmCompletedBounded` -- llmCompleted[s] <= llmCalls[s]

### Liveness Properties

1. `PipelineTerminates` -- eventually runState in {complete, error, aborted}
2. `StageEventuallyResolves` -- every created stage eventually reaches complete/error/aborted
3. `RunningIsTransient` -- running eventually leads to complete/error/aborting/aborted

---

## Implementation Steps

### Step 1: Result Type and ErrorKind Enum

**Files:**
- `packages/design-pipeline/src/util/result.ts` (create)
- `packages/design-pipeline/src/util/result.test.ts` (create)

**Description:**
Define the foundational `Result<T>` type used by every function in the system. This is the single error return convention (Design Consensus amendment 2). Define `ErrorKind` enum covering all failure categories: `LlmError`, `TimeoutError`, `GitError`, `FileSystemError`, `AbortError`, `RetryExhausted`, `NotImplemented`, `ValidationError`, `InfrastructureError`. Provide `ok(value)` and `err(kind, message)` constructor helpers and `isOk`/`isErr` type guards. Provide `fromAttempt(value)` that converts lodash/attempt's `Error | T` into `Result<T>`, and `fromAttemptAsync(promise)` that wraps `attemptAsync` output into `Result<T>`.

**Dependencies:** None

**Test (write first):**
- `ok(42)` returns `{ok: true, value: 42}` and `isOk` returns true
- `err("LlmError", "timeout")` returns `{ok: false, error: "LlmError", message: "timeout"}` and `isErr` returns true
- `fromAttempt(new Error("fail"))` returns `Result` with `ok: false`
- `fromAttempt("success")` returns `Result` with `ok: true, value: "success"`
- `fromAttemptAsync` on resolved promise returns `ok` result
- `fromAttemptAsync` on rejected promise returns `err` result
- `ErrorKind` enum contains all expected members

**TLA+ Coverage:**
- State: all `"error"` states (provides the error representation)
- Invariant: `TypeOK` (ErrorKind is part of the type domain)

---

### Step 2: Shared Enums -- RunState, StageState, LlmState

**Files:**
- `packages/design-pipeline/src/util/enums.ts` (create)
- `packages/design-pipeline/src/util/enums.test.ts` (create)

**Description:**
Define the three state enums that mirror the TLA+ state sets exactly. `RunState`: idle, running, complete, error, aborting, aborted. `StageState`: idle, active, streaming, complete, error, aborting, aborted, retrying. `LlmState`: idle, requesting, streaming-active, streaming-interrupted, complete, error. These are used as discriminated values in every store's state type.

**Dependencies:** None

**Test (write first):**
- `RunState` enum has exactly 6 members matching TLA+ runState domain
- `StageState` enum has exactly 8 members matching TLA+ stageState domain
- `LlmState` enum has exactly 6 members matching TLA+ llmState domain
- All enum values are string literals matching TLA+ names exactly
- Terminal state sets: `RUN_TERMINAL = {complete, error, aborted}`, `STAGE_TERMINAL = {complete, error, aborted}`, `LLM_TERMINAL = {idle, complete, error}`

**TLA+ Coverage:**
- State: all 6 runState values, all 8 stageState values, all 6 llmState values
- Invariant: `TypeOK` (enum domains match type invariant)

---

### Step 3: Retry Utility with Jitter

**Files:**
- `packages/design-pipeline/src/util/retry.ts` (create)
- `packages/design-pipeline/src/util/retry.test.ts` (create)

**Description:**
Pure `retryWithBackoff(currentRetry, config)` function returning `{delayMs: number, exhausted: boolean}`. Config accepts `maxRetries`, `baseDelayMs`, `maxDelayMs`. Implements exponential backoff with full jitter (Design Consensus amendment 5): `delay = random(0, min(maxDelay, baseDelay * 2^currentRetry))`. Returns `exhausted: true` when `currentRetry >= maxRetries`. Each store owns its retry counter; this utility only computes delay.

**Dependencies:** None

**Test (write first):**
- `retryWithBackoff(0, {maxRetries: 3, baseDelayMs: 100, maxDelayMs: 10000})` returns `exhausted: false` and `delayMs` between 0 and 100
- `retryWithBackoff(3, {maxRetries: 3, ...})` returns `exhausted: true`
- `delayMs` never exceeds `maxDelayMs`
- `delayMs` is non-negative
- Multiple calls with same input produce different delays (jitter is random) -- test with seeded random or statistical check
- `retryWithBackoff(2, {maxRetries: 3, baseDelayMs: 100, maxDelayMs: 10000})` returns `exhausted: false` with delay in range [0, 400]

**TLA+ Coverage:**
- State: `"retrying"` stage state
- Transition: `LlmInterruptResolve`, `LlmRequestFail`, `StageDirectError`, `StageTimeout` (all use retry logic)
- Invariant: `RetriesBounded` (exhausted flag enforces bound)

---

### Step 4: Infrastructure Interfaces

**Files:**
- `packages/design-pipeline/src/util/interfaces.ts` (create)
- `packages/design-pipeline/src/util/interfaces.test.ts` (create)

**Description:**
Define the three TypeScript interfaces for infrastructure stores (Design Consensus amendment 1): `LlmProvider` (chat method returning Result with streaming support, getModel method), `GitOperations` (commit, branch, status methods returning Result), `FileOperations` (read, write, mkdir, exists methods returning Result). These interfaces restore dependency inversion. Stage stores depend on these interfaces, not concrete classes. All methods return `Result<T>` or `Promise<Result<T>>`.

**Dependencies:** Step 1

**Test (write first):**
- Type-level tests: a mock object satisfying `LlmProvider` interface compiles
- Type-level tests: a mock object satisfying `GitOperations` interface compiles
- Type-level tests: a mock object satisfying `FileOperations` interface compiles
- Interface methods all return `Result` or `Promise<Result>` (verified by type assertions)
- `LlmProvider.getModel(stageName: string)` returns `string`
- `LlmProvider.chat(params)` returns `Promise<Result<ReadableStream>>` or equivalent async Result

**TLA+ Coverage:**
- State: `llmState` domain (LlmProvider models the LLM request lifecycle)
- Invariant: `NoLlmOnDestroyedStage` (interface contract enforces lifecycle)

---

### Step 5: OrchestratorStore -- State Type and Construction

**Files:**
- `packages/design-pipeline/src/stores/orchestrator-store.ts` (create)
- `packages/design-pipeline/src/stores/orchestrator-store.test.ts` (create)

**Description:**
Define `OrchestratorState` type containing `runState`, `currentStage`, per-stage maps for `stageCreated`, `stageDestroyed`, and `subscriptions` set. Define `OrchestratorStore extends BaseStore<OrchestratorState>` with initial state matching TLA+ `Init`. Constructor accepts `numStages` config. Export `createTestOrchestratorStore()` factory with `forceState()` and `simulateEvent()` methods. This step implements the initial state only -- no transitions yet.

**Dependencies:** Step 1, Step 2

**Test (write first):**
- New OrchestratorStore has `runState: "idle"`, `currentStage: 0`
- All `stageCreated` entries are `false`
- All `stageDestroyed` entries are `false`
- `subscriptions` is empty set
- `createTestOrchestratorStore()` exposes `forceState()` that sets arbitrary state
- `destroy()` cleans up (no errors)
- `reset()` returns to initial state

**TLA+ Coverage:**
- State: `Init` (all initial values)
- State: `runState = "idle"`, `currentStage = 0`
- Invariant: `TypeOK` (initial state satisfies type invariant)

---

### Step 6: Stage Store Base -- State Type and Construction

**Files:**
- `packages/design-pipeline/src/stores/stage-store.ts` (create)
- `packages/design-pipeline/src/stores/stage-store.test.ts` (create)

**Description:**
Define `StageStoreState` type containing `stageState`, `stageRetries`, `llmState`, `llmCalls`, `llmCompleted`. Define abstract `StageStore extends BaseStore<StageStoreState>` with initial state matching TLA+ per-stage Init. Constructor accepts `stageId`, `maxRetries`, `timeoutMs` (Design Consensus amendment 6, default 120000), and `llmProvider: LlmProvider` interface. This is the base class for all 10 concrete stage stores. Export `createTestStageStore()` factory. All transition methods are defined here as concrete methods (not in subclasses) since the state machine is identical across stages.

**Dependencies:** Step 1, Step 2, Step 4

**Test (write first):**
- New StageStore has `stageState: "idle"`, `stageRetries: 0`, `llmState: "idle"`, `llmCalls: 0`, `llmCompleted: 0`
- `stageId` is stored and accessible
- `maxRetries` defaults to a sensible value (e.g., 3)
- `timeoutMs` defaults to 120000
- `createTestStageStore()` exposes `forceState()` for white-box setup
- `destroy()` and `reset()` work correctly

**TLA+ Coverage:**
- State: all per-stage `Init` values (idle, 0, idle, 0, 0)
- Invariant: `TypeOK` (per-stage initial state satisfies type invariant)
- Invariant: `StoreLifecycleIntegrity` (initial idle state is valid for uncreated store)

---

### Step 7: OrchestratorStore -- StartPipeline Transition

**Files:**
- `packages/design-pipeline/src/stores/orchestrator-store.ts` (modify)
- `packages/design-pipeline/src/stores/orchestrator-store.test.ts` (modify)

**Description:**
Implement `start()` method on OrchestratorStore. Guards: `runState === "idle"`. Effects: set `runState` to `"running"`, `currentStage` to 1, `stageCreated[1]` to true. This method also triggers activation of stage 1 (setting its stageState to "active" via the stage store). Returns `Result<void>` -- err if guard fails.

**Dependencies:** Step 5

**Test (write first):**
- Calling `start()` from idle transitions to `runState: "running"`, `currentStage: 1`, `stageCreated[1]: true`
- Calling `start()` from non-idle returns `err` Result with appropriate ErrorKind
- After start, stage 1 store's state is `"active"`
- Calling `start()` twice returns err on second call

**TLA+ Coverage:**
- Transition: `StartPipeline`
- State: `runState = "running"`, `currentStage = 1`

---

### Step 8: Stage Store -- LLM Request Lifecycle (Request, Stream Start, Stream Complete)

**Files:**
- `packages/design-pipeline/src/stores/stage-store.ts` (modify)
- `packages/design-pipeline/src/stores/stage-store.test.ts` (modify)

**Description:**
Implement three methods on StageStore: `requestLlm()`, which transitions llmState from idle/complete to requesting and increments llmCalls; `handleStreamStart()`, which transitions llmState from requesting to streaming-active and stageState to streaming; `handleStreamComplete()`, which transitions llmState from streaming-active to complete, stageState back to active, and increments llmCompleted. All methods guard on stageState, stageCreated, stageDestroyed, and runState. All return `Result<void>`.

**Dependencies:** Step 6

**Test (write first):**
- `requestLlm()` from active/idle -> requesting, llmCalls incremented
- `requestLlm()` from active/complete (after prior LLM call) -> requesting
- `requestLlm()` fails if stageState is not "active"
- `requestLlm()` fails if llmCalls >= maxLlmCalls
- `handleStreamStart()` from requesting -> streaming-active, stageState -> streaming
- `handleStreamStart()` fails if llmState is not "requesting"
- `handleStreamComplete()` from streaming-active -> complete, stageState -> active, llmCompleted incremented
- `handleStreamComplete()` fails if llmState is not "streaming-active"
- Full cycle: requestLlm -> handleStreamStart -> handleStreamComplete leaves stage active with llmCompleted = 1

**TLA+ Coverage:**
- Transition: `StageRequestLlm(s)`, `LlmStartStreaming(s)`, `LlmStreamComplete(s)`
- State: `llmState = "requesting"`, `"streaming-active"`, `"complete"`; `stageState = "streaming"`, back to `"active"`
- Invariant: `LlmCompletedBounded` (llmCompleted incremented only on stream complete)

---

### Step 9: Stage Store -- Stage Completion (DecideComplete and CompleteDirectly)

**Files:**
- `packages/design-pipeline/src/stores/stage-store.ts` (modify)
- `packages/design-pipeline/src/stores/stage-store.test.ts` (modify)

**Description:**
Implement `decideComplete()` and `completeDirectly()` on StageStore. `decideComplete()` guards: stageState active, llmCompleted > 0, llmState idle/complete. `completeDirectly()` guards: stageState active, llmCompleted === 0, llmState idle/complete. Both set stageState to "complete". These implement the v2 decoupling of LLM completion from stage completion (TLA+ review objection 3).

**Dependencies:** Step 8

**Test (write first):**
- `decideComplete()` after one LLM cycle -> stageState "complete"
- `decideComplete()` with in-flight LLM (llmState requesting) -> err
- `decideComplete()` with llmCompleted === 0 -> err
- `completeDirectly()` from active with no LLM calls -> stageState "complete"
- `completeDirectly()` with llmCompleted > 0 -> err (must use decideComplete)
- `completeDirectly()` with in-flight LLM -> err
- Multi-LLM cycle: request -> stream -> complete -> request -> stream -> complete -> decideComplete succeeds with llmCompleted = 2

**TLA+ Coverage:**
- Transition: `StageDecideComplete(s)`, `StageCompleteDirectly(s)`
- State: `stageState = "complete"` (via two distinct paths)

---

### Step 10: Stage Store -- LLM Failure Paths (Interrupt, InterruptResolve, RequestFail)

**Files:**
- `packages/design-pipeline/src/stores/stage-store.ts` (modify)
- `packages/design-pipeline/src/stores/stage-store.test.ts` (modify)

**Description:**
Implement `handleStreamInterrupt()` (streaming-active -> streaming-interrupted), `resolveInterrupt()` (streaming-interrupted -> retrying or error based on retry count), and `handleRequestFail()` (requesting -> retrying or error). Uses `retryWithBackoff` from Step 3 to compute delay. When retries remain, transitions to "retrying" and increments stageRetries. When exhausted, transitions to "error" and sets llmState to "error".

**Dependencies:** Step 3, Step 8

**Test (write first):**
- `handleStreamInterrupt()` from streaming-active -> llmState "streaming-interrupted"
- `resolveInterrupt()` with retries remaining -> stageState "retrying", stageRetries incremented, llmState "idle"
- `resolveInterrupt()` with retries exhausted -> stageState "error", llmState "error"
- `handleRequestFail()` with retries remaining -> stageState "retrying", stageRetries incremented, llmState "idle"
- `handleRequestFail()` with retries exhausted -> stageState "error", llmState "error"
- All fail if guards not met (wrong llmState)

**TLA+ Coverage:**
- Transition: `LlmStreamInterrupt(s)`, `LlmInterruptResolve(s)`, `LlmRequestFail(s)`
- State: `llmState = "streaming-interrupted"`, `"error"`; `stageState = "retrying"`, `"error"`
- Invariant: `RetriesBounded` (retry increment respects max)

---

### Step 11: Stage Store -- RetryResume, DirectError, Timeout

**Files:**
- `packages/design-pipeline/src/stores/stage-store.ts` (modify)
- `packages/design-pipeline/src/stores/stage-store.test.ts` (modify)

**Description:**
Implement `retryResume()` (retrying -> active), `handleDirectError()` (active with no in-flight LLM -> retrying or error), and `handleTimeout()` (active or streaming -> retrying or error, resetting in-flight LLM if requesting/streaming-active). The timeout method must handle the case where llmState is streaming-interrupted (TLA+ review implementation note: both timeout and interrupt can fire independently).

**Dependencies:** Step 3, Step 10

**Test (write first):**
- `retryResume()` from retrying -> stageState "active"
- `retryResume()` from non-retrying -> err
- `handleDirectError()` from active with llmState idle -> retrying (retries remaining) or error (exhausted)
- `handleDirectError()` with in-flight LLM -> err
- `handleTimeout()` from active with llmState idle -> retrying or error
- `handleTimeout()` from streaming with llmState streaming-active -> retrying (llmState reset to idle) or error (llmState set to error)
- `handleTimeout()` from streaming with llmState streaming-interrupted -> retrying or error (llmState unchanged, per TLA+ spec)
- Double-retry test case (TLA+ review note): stage in streaming with llmState streaming-interrupted, StageTimeout fires (consumes retry slot), then LlmInterruptResolve fires (consumes second retry slot). Verify both increment stageRetries independently.

**TLA+ Coverage:**
- Transition: `StageRetryResume(s)`, `StageDirectError(s)`, `StageTimeout(s)`
- State: `stageState = "retrying"` (resumed path), `stageState = "active"` (after resume)
- Invariant: `RetriesBounded`, `StoreLifecycleIntegrity`

---

### Step 12: Stage Store -- Abort Lifecycle (StageAbort, StageAbortComplete)

**Files:**
- `packages/design-pipeline/src/stores/stage-store.ts` (modify)
- `packages/design-pipeline/src/stores/stage-store.test.ts` (modify)

**Description:**
Implement `abort()` (active/streaming/retrying -> aborting) and `completeAbort()` (aborting -> aborted, mark destroyed, error in-flight LLM). The abort method uses AbortController to cancel any pending waitFor or network requests. `completeAbort()` sets llmState to "error" if it was requesting/streaming-active/streaming-interrupted.

**Dependencies:** Step 6

**Test (write first):**
- `abort()` from active -> stageState "aborting"
- `abort()` from streaming -> stageState "aborting"
- `abort()` from retrying -> stageState "aborting"
- `abort()` from idle/complete/error -> err
- `completeAbort()` from aborting -> stageState "aborted", stageDestroyed = true
- `completeAbort()` with llmState requesting -> llmState "error"
- `completeAbort()` with llmState streaming-active -> llmState "error"
- `completeAbort()` with llmState streaming-interrupted -> llmState "error"
- `completeAbort()` with llmState idle -> llmState unchanged (idle)
- `completeAbort()` with llmState complete -> llmState unchanged (complete)

**TLA+ Coverage:**
- Transition: `StageAbort(s)`, `StageAbortComplete(s)`
- State: `stageState = "aborting"`, `"aborted"`; `stageDestroyed = true`
- Invariant: `NoZombieStages` (aborted => destroyed), `NoLlmOnDestroyedStage`

---

### Step 13: OrchestratorStore -- AdvanceStage Transition

**Files:**
- `packages/design-pipeline/src/stores/orchestrator-store.ts` (modify)
- `packages/design-pipeline/src/stores/orchestrator-store.test.ts` (modify)

**Description:**
Implement `advanceStage()` on OrchestratorStore. Guards: `runState === "running"`, `currentStage < numStages`, `stageState[currentStage] === "complete"`, `!stageDestroyed[currentStage]`. Effects: increment currentStage, create and activate next stage, destroy current stage, add subscription edge. The subscription edge is validated against the DAG invariant before adding.

**Dependencies:** Step 7, Step 9

**Test (write first):**
- After stage 1 completes, `advanceStage()` sets `currentStage: 2`, `stageCreated[2]: true`, `stageDestroyed[1]: true`
- Stage 2 store's stageState is "active" after advance
- `subscriptions` contains `(1, 2)` edge
- `advanceStage()` when current stage not complete -> err
- `advanceStage()` when already at last stage -> err
- Sequential advances through all stages produce valid subscription DAG

**TLA+ Coverage:**
- Transition: `AdvanceStage`
- State: sequential `currentStage` progression, `stageCreated`, `stageDestroyed` updates
- Invariant: `DAGInvariant` (subscription edge validated), `StageOrdering`

---

### Step 14: OrchestratorStore -- CompletePipeline and PipelineError

**Files:**
- `packages/design-pipeline/src/stores/orchestrator-store.ts` (modify)
- `packages/design-pipeline/src/stores/orchestrator-store.test.ts` (modify)

**Description:**
Implement `completePipeline()` (last stage complete -> runState "complete", all stageDestroyed true) and `handlePipelineError()` (current stage error with retries exhausted -> runState "error"). CompletePipeline triggers destroy() on all remaining stores.

**Dependencies:** Step 13

**Test (write first):**
- After last stage completes, `completePipeline()` -> runState "complete", all stages destroyed
- `completePipeline()` when not at last stage -> err
- `completePipeline()` when last stage not complete -> err
- `handlePipelineError()` when current stage in error with retries exhausted -> runState "error"
- `handlePipelineError()` when retries not exhausted -> err
- `handlePipelineError()` when stage not in error -> err

**TLA+ Coverage:**
- Transition: `CompletePipeline`, `PipelineError`
- State: `runState = "complete"`, `runState = "error"`
- Invariant: `PipelineCompleteImpliesAllDone`

---

### Step 15: OrchestratorStore -- Abort Lifecycle (AbortPipeline, CompleteAbort)

**Files:**
- `packages/design-pipeline/src/stores/orchestrator-store.ts` (modify)
- `packages/design-pipeline/src/stores/orchestrator-store.test.ts` (modify)

**Description:**
Implement `abortPipeline()` (running -> aborting) and `completeAbort()` (aborting -> aborted, force-abort active stage, error in-flight LLM, destroy active stage). CompleteAbort delegates to the active stage's abort methods. Stages already in terminal states are left unchanged.

**Dependencies:** Step 12, Step 14

**Test (write first):**
- `abortPipeline()` from running -> runState "aborting"
- `abortPipeline()` from non-running -> err
- `completeAbort()` transitions active stage to "aborted", sets stageDestroyed, errors in-flight LLM
- `completeAbort()` leaves already-terminal stages unchanged
- `completeAbort()` sets runState to "aborted"
- Full abort sequence: start -> advance to stage 2 -> abort -> completeAbort verifies stage 2 aborted, stage 1 still destroyed
- Abort blocks new stage creation (verify advanceStage fails during aborting)

**TLA+ Coverage:**
- Transition: `AbortPipeline`, `CompleteAbort`
- State: `runState = "aborting"`, `"aborted"`
- Invariant: `AbortingBlocksNewStages`, `NoZombieStages`

---

### Step 16: DAG Validation in Composition Root

**Files:**
- `packages/design-pipeline/src/util/dag.ts` (create)
- `packages/design-pipeline/src/util/dag.test.ts` (create)

**Description:**
Implement `isDAG(edges: Set<[number, number]>)` function using topological sort (Kahn's algorithm). This validates the subscription graph at wiring time in the composition root (Design Consensus amendment 4). The function returns `Result<true>` if acyclic, `err("ValidationError", "Circular subscription detected")` if cyclic.

**Dependencies:** Step 1

**Test (write first):**
- Empty edge set -> ok(true)
- Linear chain `{(1,2), (2,3)}` -> ok(true)
- Cycle `{(1,2), (2,1)}` -> err with circular message
- Self-loop `{(1,1)}` -> err
- Complex DAG with multiple paths -> ok(true)
- Diamond `{(1,2), (1,3), (2,4), (3,4)}` -> ok(true)

**TLA+ Coverage:**
- Invariant: `DAGInvariant`
- Helper: `IsDAG(edges)` / `ReachableFrom(node, edges)`

---

### Step 17: OpenRouterStore

**Files:**
- `packages/design-pipeline/src/stores/open-router-store.ts` (create)
- `packages/design-pipeline/src/stores/open-router-store.test.ts` (create)

**Description:**
`OpenRouterStore extends BaseStore` implementing `LlmProvider` interface. State tracks current request lifecycle per call: idle -> requesting -> streaming-active -> complete/error, plus streaming-interrupted. Wraps `@openrouter/sdk` with `attemptAsync` for functional error handling. `getModel(stageName)` resolves model by stage name from config. `chat()` method returns `Promise<Result<AsyncIterable>>` for streaming. Includes configurable `timeoutMs` per call (Design Consensus amendment 6, default 120s). Export `createTestOpenRouterStore()` factory with mock LLM responses.

**Dependencies:** Step 1, Step 2, Step 4

**Test (write first):**
- New store has idle state
- `getModel("questioner")` returns configured model string
- `chat()` with mock SDK returns ok Result with iterable stream
- `chat()` with SDK error returns err Result
- `chat()` timeout after configured ms returns err with TimeoutError
- Test factory provides `simulateStream()` for controlled token emission
- Test factory provides `simulateError()` for failure injection
- `destroy()` cancels in-flight requests

**TLA+ Coverage:**
- State: all 6 `llmState` values (idle, requesting, streaming-active, streaming-interrupted, complete, error)
- Transition: `StageRequestLlm`, `LlmStartStreaming`, `LlmStreamComplete`, `LlmStreamInterrupt`, `LlmRequestFail`

---

### Step 18: GitStore

**Files:**
- `packages/design-pipeline/src/stores/git-store.ts` (create)
- `packages/design-pipeline/src/stores/git-store.test.ts` (create)

**Description:**
`GitStore extends BaseStore` implementing `GitOperations` interface. Wraps child process git commands with `attemptAsync`, converting to `Result`. Methods: `commit(message)`, `createBranch(name)`, `status()`, `diff()`, `add(files)`. All return `Promise<Result<T>>`. State tracks: idle, busy, error. Export `createTestGitStore()` with mock command execution.

**Dependencies:** Step 1, Step 4

**Test (write first):**
- `status()` with mock returns ok Result with status string
- `commit()` with mock returns ok Result
- `createBranch()` with mock returns ok Result
- Command failure returns err Result with GitError kind
- Test factory allows injecting specific command outputs
- Operations are idempotent (Design Consensus amendment 7)

**TLA+ Coverage:**
- Transition: `StageDirectError(s)` (Git failure is one source of infrastructure error)
- State: infrastructure error path feeds into stage retry/error logic

---

### Step 19: FileSystemStore

**Files:**
- `packages/design-pipeline/src/stores/file-system-store.ts` (create)
- `packages/design-pipeline/src/stores/file-system-store.test.ts` (create)

**Description:**
`FileSystemStore extends BaseStore` implementing `FileOperations` interface. Wraps Node.js fs operations with `attemptAsync`, converting to `Result`. Methods: `readFile(path)`, `writeFile(path, content)`, `mkdir(path)`, `exists(path)`. All return `Promise<Result<T>>`. State tracks: idle, busy, error. Export `createTestFileSystemStore()` with in-memory file system mock.

**Dependencies:** Step 1, Step 4

**Test (write first):**
- `readFile()` with mock returns ok Result with file content
- `writeFile()` with mock returns ok Result
- `mkdir()` with mock returns ok Result
- `exists()` returns ok(true) or ok(false)
- File not found returns err Result with FileSystemError kind
- Permission error returns err Result
- Test factory provides in-memory FS for isolation
- Operations are idempotent (re-writing same content is safe)

**TLA+ Coverage:**
- Transition: `StageDirectError(s)` (FileSystem failure is one source of infrastructure error)
- State: infrastructure error path feeds into stage retry/error logic

---

### Step 20: Concrete Stage Stores -- Questioner, DebateModerator, ExpertReview

**Files:**
- `packages/design-pipeline/src/stores/questioner-session-store.ts` (create)
- `packages/design-pipeline/src/stores/questioner-session-store.test.ts` (create)
- `packages/design-pipeline/src/stores/debate-moderator-store.ts` (create)
- `packages/design-pipeline/src/stores/debate-moderator-store.test.ts` (create)
- `packages/design-pipeline/src/stores/expert-review-store.ts` (create)
- `packages/design-pipeline/src/stores/expert-review-store.test.ts` (create)

**Description:**
Three concrete stage stores extending StageStore. Each adds stage-specific state (e.g., QuestionerSessionStore tracks question/answer pairs, rounds; DebateModeratorStore tracks expert positions, round count; ExpertReviewStore tracks reviewer verdicts). Constructor accepts infrastructure interfaces (LlmProvider, FileOperations). Each implements a `run()` method that orchestrates the stage-specific workflow using the base class LLM lifecycle methods. These are the first three pipeline stages.

**Dependencies:** Step 6, Step 8, Step 9, Step 10, Step 11, Step 12

**Test (write first):**
- Each store initializes with correct default stage-specific state
- Each store's `run()` calls `requestLlm()` -> processes stream -> `decideComplete()` or errors
- QuestionerSessionStore accumulates question/answer pairs through multiple LLM calls
- DebateModeratorStore tracks rounds and expert convergence
- ExpertReviewStore tracks reviewer verdicts
- All three handle LLM failure -> retry -> resume cycle
- All three handle timeout -> retry cycle
- All three handle abort lifecycle
- Test factories expose stage-specific `forceState()` for each store's extended state

**TLA+ Coverage:**
- Transition: full LLM lifecycle per stage (`StageRequestLlm` through `StageDecideComplete`)
- Transition: `StageRetryResume`, `StageTimeout`, `StageAbort`, `StageAbortComplete`
- State: all stageState and llmState transitions exercised per store
- Invariant: `StoreLifecycleIntegrity`, `LlmCompletedBounded`

---

### Step 21: Concrete Stage Stores -- ForkJoin, ImplementationPlanning, PairProgramming, LintFixer

**Files:**
- `packages/design-pipeline/src/stores/fork-join-store.ts` (create)
- `packages/design-pipeline/src/stores/fork-join-store.test.ts` (create)
- `packages/design-pipeline/src/stores/implementation-planning-store.ts` (create)
- `packages/design-pipeline/src/stores/implementation-planning-store.test.ts` (create)
- `packages/design-pipeline/src/stores/pair-programming-store.ts` (create)
- `packages/design-pipeline/src/stores/pair-programming-store.test.ts` (create)
- `packages/design-pipeline/src/stores/lint-fixer-store.ts` (create)
- `packages/design-pipeline/src/stores/lint-fixer-store.test.ts` (create)

**Description:**
Four more concrete stage stores extending StageStore. ForkJoinStore manages parallel sub-task execution. ImplementationPlanningStore generates implementation plans. PairProgrammingStore orchestrates code+test writer pairs. LintFixerStore runs the double-pass verification loop (test -> fix -> lint -> fix -> tsc -> fix, twice). Each implements `run()` using base class methods. LintFixerStore may use `completeDirectly()` for pure-computation phases that do not need LLM.

**Dependencies:** Step 6, Step 8, Step 9, Step 10, Step 11, Step 12

**Test (write first):**
- Each store initializes with correct default state
- Each store's `run()` method follows correct LLM lifecycle
- ForkJoinStore handles multiple parallel sub-tasks
- LintFixerStore uses `completeDirectly()` for lint/tsc phases (no LLM needed)
- LintFixerStore verifies double-pass loop (runs verification twice)
- All four handle retry, timeout, abort, and direct error paths
- Test factories expose stage-specific `forceState()`

**TLA+ Coverage:**
- Transition: `StageCompleteDirectly(s)` (LintFixerStore pure-computation phases)
- Transition: full LLM lifecycle for stages that call LLM
- State: `llmCompleted = 0` path for completeDirectly
- Invariant: `StoreLifecycleIntegrity`, `RetriesBounded`

---

### Step 22: Concrete Stage Stores -- BriefingWriter, TlaWriter

**Files:**
- `packages/design-pipeline/src/stores/briefing-writer-store.ts` (create)
- `packages/design-pipeline/src/stores/briefing-writer-store.test.ts` (create)
- `packages/design-pipeline/src/stores/tla-writer-store.ts` (create)
- `packages/design-pipeline/src/stores/tla-writer-store.test.ts` (create)

**Description:**
Two more concrete stage stores. BriefingWriterStore generates briefing documents from questioner output. TlaWriterStore generates TLA+ specifications from design consensus. Both use LlmProvider for generation and FileOperations for writing output files.

**Dependencies:** Step 6, Step 8, Step 9, Step 10, Step 11, Step 12

**Test (write first):**
- Each store initializes correctly
- Each store's `run()` calls LLM, writes file output, completes
- Both handle LLM failure -> retry
- Both handle file write failure (StageDirectError path) -> retry
- Both handle timeout and abort
- Test factories with mock LLM and mock FS

**TLA+ Coverage:**
- Transition: `StageRequestLlm` through `StageDecideComplete` (LLM path)
- Transition: `StageDirectError(s)` (file write failure)
- State: full stageState lifecycle

---

### Step 23: Composition Root -- Store Wiring and Subscription Graph

**Files:**
- `packages/design-pipeline/src/index.ts` (modify)
- `packages/design-pipeline/src/index.test.ts` (modify)

**Description:**
Rewrite `index.ts` as composition root. Creates all infrastructure stores (OpenRouterStore, GitStore, FileSystemStore). Creates OrchestratorStore with stage factory functions. Wires subscriptions: orchestrator subscribes to stage completion events, stages subscribe to upstream results via `waitFor`. Validates subscription graph as DAG using `isDAG()` from Step 16 before starting. Calls `orchestratorStore.start()`. On completion, calls `destroy()` on all stores.

**Dependencies:** Step 5, Step 7, Step 13, Step 14, Step 15, Step 16, Step 17, Step 18, Step 19, Step 20, Step 21, Step 22

**Test (write first):**
- Composition root creates all stores without error
- Subscription graph passes DAG validation
- Intentionally circular subscription detected and rejected with error
- `start()` triggers pipeline execution
- Pipeline completion calls `destroy()` on all stores
- Pipeline error calls `destroy()` on all stores
- Abort calls `destroy()` on all stores

**TLA+ Coverage:**
- Invariant: `DAGInvariant` (validated at wiring time)
- Invariant: `PipelineCompleteImpliesAllDone` (destroy lifecycle)
- Transition: `StartPipeline`, `CompletePipeline` (end-to-end)

---

### Step 24: CLI Entry Point

**Files:**
- `packages/design-pipeline/src/cli.ts` (modify)

**Description:**
Rewrite `cli.ts` as thin entry point. Parses argv for topic slug and options. Loads environment variables (OPENROUTER_API_KEY). Calls composition root from `index.ts`. Handles Result errors by logging and exiting with non-zero code. No store logic in this file.

**Dependencies:** Step 23

**Test (write first):**
- CLI parses `--topic` argument correctly
- CLI exits with 0 on success
- CLI exits with 1 on pipeline error
- CLI exits with 1 on missing API key
- CLI passes environment config to composition root

**TLA+ Coverage:**
- Transition: `StartPipeline` (triggered by CLI)
- State: `Terminated` (CLI handles terminal states)

---

### Step 25: End-to-End Integration -- Full Pipeline Lifecycle

**Files:**
- `packages/design-pipeline/src/integration.test.ts` (create)

**Description:**
Integration tests that exercise the full pipeline lifecycle with mock infrastructure. These verify the liveness properties: pipeline terminates, every stage resolves, running is transient. Test the happy path (all stages complete), the error path (stage fails with retries exhausted), and the abort path (abort during active stage). Test the double-retry scenario from TLA+ review (streaming interrupt + timeout on same stage consuming two retry slots).

**Dependencies:** Step 23

**Test (write first):**
- Happy path: start -> stage 1 completes -> advance -> ... -> stage N completes -> pipeline complete. Verify all stages destroyed.
- Error path: start -> stage 1 LLM fails MaxRetries times -> pipeline error. Verify runState "error".
- Abort path: start -> stage 2 active -> abort -> completeAbort. Verify runState "aborted", active stage aborted.
- Double-retry: stage in streaming with llmState streaming-interrupted. Fire timeout (retry slot 1). Then resolveInterrupt (retry slot 2). Verify stageRetries incremented twice.
- Verify subscription graph is valid DAG after full pipeline run.
- Verify no store leaks (all destroyed after terminal state).

**TLA+ Coverage:**
- Liveness: `PipelineTerminates` (happy, error, abort paths all terminate)
- Liveness: `StageEventuallyResolves` (every created stage reaches terminal)
- Liveness: `RunningIsTransient` (running never persists)
- Invariant: `PipelineCompleteImpliesAllDone`, `NoZombieStages`, `AbortingBlocksNewStages`
- Transition: `Terminated` (stuttering in terminal state)

---

### Step 26: Delete Legacy Files

**Files:**
- `packages/design-pipeline/src/adapters/` (delete directory)
- `packages/design-pipeline/src/ports/` (delete directory)
- `packages/design-pipeline/src/config/` (delete directory)
- `packages/design-pipeline/src/engine/` (delete directory)
- `packages/design-pipeline/src/stages/` (delete directory)
- `packages/design-pipeline/src/types/` (delete directory)

**Description:**
Delete all legacy directories identified in the briefing. This is the final cleanup step after the new architecture is verified by all tests passing. The composition root and all stores are operational, so these files are dead code. Verify test suite still passes after deletion.

**Dependencies:** Step 25

**Test (write first):**
- Run full test suite after deletion -- all tests pass
- No import errors referencing deleted modules
- Coverage remains at 100%

**TLA+ Coverage:**
- N/A (cleanup step, no TLA+ mapping)

---

## State Coverage Audit

### Run States
| State | Covered By |
|-------|-----------|
| `"idle"` | Step 5 (init), Step 7 (guard) |
| `"running"` | Step 7 (StartPipeline) |
| `"complete"` | Step 14 (CompletePipeline) |
| `"error"` | Step 14 (PipelineError) |
| `"aborting"` | Step 15 (AbortPipeline) |
| `"aborted"` | Step 15 (CompleteAbort) |

### Stage States
| State | Covered By |
|-------|-----------|
| `"idle"` | Step 6 (init) |
| `"active"` | Step 7 (StartPipeline), Step 8 (StreamComplete), Step 11 (RetryResume) |
| `"streaming"` | Step 8 (LlmStartStreaming) |
| `"complete"` | Step 9 (DecideComplete, CompleteDirectly) |
| `"error"` | Step 10 (retries exhausted), Step 11 (DirectError, Timeout) |
| `"aborting"` | Step 12 (StageAbort) |
| `"aborted"` | Step 12 (StageAbortComplete) |
| `"retrying"` | Step 10 (InterruptResolve, RequestFail), Step 11 (DirectError, Timeout) |

### LLM States
| State | Covered By |
|-------|-----------|
| `"idle"` | Step 6 (init), Step 10 (after retry reset) |
| `"requesting"` | Step 8 (StageRequestLlm) |
| `"streaming-active"` | Step 8 (LlmStartStreaming) |
| `"streaming-interrupted"` | Step 10 (LlmStreamInterrupt) |
| `"complete"` | Step 8 (LlmStreamComplete) |
| `"error"` | Step 10 (retries exhausted), Step 12 (StageAbortComplete) |

### Transitions
| Transition | Covered By |
|-----------|-----------|
| `StartPipeline` | Step 7 |
| `AdvanceStage` | Step 13 |
| `CompletePipeline` | Step 14 |
| `PipelineError` | Step 14 |
| `AbortPipeline` | Step 15 |
| `CompleteAbort` | Step 15 |
| `StageRequestLlm(s)` | Step 8 |
| `LlmStartStreaming(s)` | Step 8 |
| `LlmStreamComplete(s)` | Step 8 |
| `StageDecideComplete(s)` | Step 9 |
| `LlmStreamInterrupt(s)` | Step 10 |
| `LlmInterruptResolve(s)` | Step 10 |
| `LlmRequestFail(s)` | Step 10 |
| `StageRetryResume(s)` | Step 11 |
| `StageCompleteDirectly(s)` | Step 9 |
| `StageDirectError(s)` | Step 11 |
| `StageTimeout(s)` | Step 11 |
| `StageAbort(s)` | Step 12 |
| `StageAbortComplete(s)` | Step 12 |
| `Terminated` | Step 25 |

### Safety Invariants
| Invariant | Verified By |
|----------|-----------|
| `TypeOK` | Steps 1, 2, 5, 6 (type definitions match spec) |
| `DAGInvariant` | Step 16 (isDAG), Step 13 (edge validation), Step 23 (wiring validation) |
| `NoZombieStages` | Step 12 (abort->destroyed), Step 15 (CompleteAbort), Step 25 (integration) |
| `RetriesBounded` | Step 3 (exhausted flag), Step 10, Step 11 (retry guards) |
| `StageOrdering` | Step 13 (AdvanceStage sequential guard) |
| `StoreLifecycleIntegrity` | Step 6 (guards), Step 8-12 (all transitions check created/destroyed) |
| `PipelineCompleteImpliesAllDone` | Step 14 (all destroyed on complete), Step 25 (integration) |
| `NoLlmOnDestroyedStage` | Step 12 (abort errors in-flight LLM), Step 15 (CompleteAbort) |
| `AbortingBlocksNewStages` | Step 15 (advanceStage fails during abort), Step 25 (integration) |
| `LlmCompletedBounded` | Step 8 (increment on stream complete only), Step 9 (guard on decideComplete) |

### Liveness Properties
| Property | Verified By |
|---------|-----------|
| `PipelineTerminates` | Step 25 (happy, error, abort paths all reach terminal) |
| `StageEventuallyResolves` | Step 25 (every created stage reaches terminal state) |
| `RunningIsTransient` | Step 25 (running leads to complete/error/aborting) |

All TLA+ states, transitions, and properties are covered by the implementation plan.

---

## Execution Tiers

### Tier 1: Foundation Types and Utilities (all independent, no shared files)

These steps define the core type system and utility functions. They have no dependencies and touch entirely separate files.

| Task ID | Step | Title |
|---------|------|-------|
| T1 | Step 1 | Result Type and ErrorKind Enum |
| T2 | Step 2 | Shared Enums -- RunState, StageState, LlmState |
| T3 | Step 3 | Retry Utility with Jitter |

### Tier 2: Interfaces and Base Stores (depends on Tier 1 -- needs Result type and enums)

These steps define the infrastructure interfaces and the two base store types. Step 4, 5, 6 each depend on Tier 1 outputs but not on each other.

| Task ID | Step | Title |
|---------|------|-------|
| T4 | Step 4 | Infrastructure Interfaces |
| T5 | Step 5 | OrchestratorStore -- State Type and Construction |
| T6 | Step 6 | Stage Store Base -- State Type and Construction |
| T7 | Step 16 | DAG Validation |

### Tier 3: Core Transitions (depends on Tier 2 -- needs base stores)

These steps implement the state machine transitions on the base stores. Steps 7 and 8 are independent (orchestrator vs. stage). Steps within the stage store (8) must be sequential internally but are parallelizable with orchestrator work (7).

| Task ID | Step | Title |
|---------|------|-------|
| T8 | Step 7 | OrchestratorStore -- StartPipeline Transition |
| T9 | Step 8 | Stage Store -- LLM Request Lifecycle |
| T10 | Step 12 | Stage Store -- Abort Lifecycle |

### Tier 4: Extended Transitions (depends on Tier 3 -- needs LLM lifecycle and abort)

These steps build on the LLM lifecycle to implement completion, failure, retry, and timeout paths.

| Task ID | Step | Title |
|---------|------|-------|
| T11 | Step 9 | Stage Store -- Stage Completion |
| T12 | Step 10 | Stage Store -- LLM Failure Paths |

### Tier 5: Retry and Error Recovery (depends on Tier 4 -- needs failure paths)

RetryResume, DirectError, and Timeout depend on the failure path implementations.

| Task ID | Step | Title |
|---------|------|-------|
| T13 | Step 11 | Stage Store -- RetryResume, DirectError, Timeout |

### Tier 6: Orchestrator Advanced Transitions (depends on Tiers 3-5 -- needs stage completion and abort)

AdvanceStage needs stage completion. PipelineError needs stage error. Abort lifecycle needs stage abort.

| Task ID | Step | Title |
|---------|------|-------|
| T14 | Step 13 | OrchestratorStore -- AdvanceStage Transition |
| T15 | Step 14 | OrchestratorStore -- CompletePipeline and PipelineError |
| T16 | Step 15 | OrchestratorStore -- Abort Lifecycle |

### Tier 7: Infrastructure Stores (depends on Tier 2 -- needs interfaces; parallelizable with Tiers 3-6)

Infrastructure stores depend only on Tier 1-2 outputs. They can run in parallel with core transition work.

| Task ID | Step | Title |
|---------|------|-------|
| T17 | Step 17 | OpenRouterStore |
| T18 | Step 18 | GitStore |
| T19 | Step 19 | FileSystemStore |

### Tier 8: Concrete Stage Stores (depends on Tiers 5-7 -- needs all base transitions and infrastructure stores)

All 10 concrete stage stores depend on the complete StageStore base class and infrastructure interfaces.

| Task ID | Step | Title |
|---------|------|-------|
| T20 | Step 20 | Concrete Stores -- Questioner, DebateModerator, ExpertReview |
| T21 | Step 21 | Concrete Stores -- ForkJoin, ImplementationPlanning, PairProgramming, LintFixer |
| T22 | Step 22 | Concrete Stores -- BriefingWriter, TlaWriter |

### Tier 9: Integration and Entry Points (depends on all prior tiers)

Composition root, CLI, and integration tests require all stores to be implemented.

| Task ID | Step | Title |
|---------|------|-------|
| T23 | Step 23 | Composition Root -- Store Wiring |
| T24 | Step 24 | CLI Entry Point |

### Tier 10: End-to-End Verification and Cleanup (depends on Tier 9)

Full integration tests and legacy file deletion.

| Task ID | Step | Title |
|---------|------|-------|
| T25 | Step 25 | End-to-End Integration Tests |
| T26 | Step 26 | Delete Legacy Files |

---

## Task Assignment Table

| Task ID | Title | Tier | Code Writer | Test Writer | Dependencies | Rationale |
|---------|-------|------|-------------|-------------|--------------|-----------|
| T1 | Result Type and ErrorKind Enum | 1 | typescript-writer | vitest-writer | None | Pure TypeScript types and utility functions with unit tests. |
| T2 | Shared Enums -- RunState, StageState, LlmState | 1 | typescript-writer | vitest-writer | None | Pure TypeScript enum definitions with value-checking tests. |
| T3 | Retry Utility with Jitter | 1 | typescript-writer | vitest-writer | None | Pure function with randomness; unit tests verify bounds and exhaustion. |
| T4 | Infrastructure Interfaces | 2 | typescript-writer | vitest-writer | T1 | TypeScript interface definitions with type-level compile tests. |
| T5 | OrchestratorStore -- State Type and Construction | 2 | typescript-writer | vitest-writer | T1, T2 | Store subclass with state machine; unit tests verify initialization. |
| T6 | Stage Store Base -- State Type and Construction | 2 | typescript-writer | vitest-writer | T1, T2, T4 | Abstract store base class; unit tests verify defaults and lifecycle. |
| T7 | DAG Validation | 2 | typescript-writer | vitest-writer | T1 | Pure graph algorithm; unit tests verify cycle detection. |
| T8 | OrchestratorStore -- StartPipeline | 3 | typescript-writer | vitest-writer | T5 | State machine transition method; unit tests verify guards and effects. |
| T9 | Stage Store -- LLM Request Lifecycle | 3 | typescript-writer | vitest-writer | T6 | State machine transitions for LLM lifecycle; unit tests verify full cycle. |
| T10 | Stage Store -- Abort Lifecycle | 3 | typescript-writer | vitest-writer | T6 | Abort state transitions; unit tests verify abort from each valid state. |
| T11 | Stage Store -- Stage Completion | 4 | typescript-writer | vitest-writer | T9 | Completion transitions; unit tests verify both LLM and direct paths. |
| T12 | Stage Store -- LLM Failure Paths | 4 | typescript-writer | vitest-writer | T3, T9 | Failure and retry transitions; unit tests verify retry counting and exhaustion. |
| T13 | Stage Store -- RetryResume, DirectError, Timeout | 5 | typescript-writer | vitest-writer | T12 | Recovery transitions; unit tests verify double-retry scenario from TLA+ review. |
| T14 | OrchestratorStore -- AdvanceStage | 6 | typescript-writer | vitest-writer | T8, T11 | Stage advancement with DAG wiring; unit tests verify sequential progression. |
| T15 | OrchestratorStore -- CompletePipeline and PipelineError | 6 | typescript-writer | vitest-writer | T14 | Terminal transitions; unit tests verify all-destroyed and error conditions. |
| T16 | OrchestratorStore -- Abort Lifecycle | 6 | typescript-writer | vitest-writer | T10, T15 | Orchestrator-level abort; unit tests verify stage delegation and blocking. |
| T17 | OpenRouterStore | 7 | typescript-writer | vitest-writer | T1, T2, T4 | Infrastructure store wrapping SDK; unit tests with mock SDK responses. |
| T18 | GitStore | 7 | typescript-writer | vitest-writer | T1, T4 | Infrastructure store wrapping child process; unit tests with mock commands. |
| T19 | FileSystemStore | 7 | typescript-writer | vitest-writer | T1, T4 | Infrastructure store wrapping fs; unit tests with in-memory FS mock. |
| T20 | Concrete Stores -- Questioner, DebateModerator, ExpertReview | 8 | typescript-writer | vitest-writer | T13, T17, T19 | Domain stage stores; unit tests verify stage-specific workflows. |
| T21 | Concrete Stores -- ForkJoin, ImplementationPlanning, PairProgramming, LintFixer | 8 | typescript-writer | vitest-writer | T13, T17, T18, T19 | Domain stage stores including pure-computation path; unit tests verify double-pass loop. |
| T22 | Concrete Stores -- BriefingWriter, TlaWriter | 8 | typescript-writer | vitest-writer | T13, T17, T19 | Domain stage stores with file output; unit tests verify LLM+write workflow. |
| T23 | Composition Root -- Store Wiring | 9 | typescript-writer | vitest-writer | T14, T15, T16, T17, T18, T19, T20, T21, T22 | Wiring and DAG validation; integration tests verify full construction. |
| T24 | CLI Entry Point | 9 | typescript-writer | vitest-writer | T23 | Thin CLI adapter; unit tests verify arg parsing and exit codes. |
| T25 | End-to-End Integration Tests | 10 | typescript-writer | vitest-writer | T23, T24 | Full pipeline lifecycle tests verifying all 3 liveness properties. |
| T26 | Delete Legacy Files | 10 | typescript-writer | vitest-writer | T25 | Cleanup; post-deletion test suite run verifies no regressions. |
