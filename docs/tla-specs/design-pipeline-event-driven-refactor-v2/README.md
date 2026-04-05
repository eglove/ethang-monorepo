# TLA+ Specification: Design-Pipeline Event-Driven Refactor (v2)

## Source
Briefing: `docs/questioner-sessions/2026-04-04_design-pipeline-event-driven-refactor.md`

## Specification
- **Module:** `StorePipeline.tla`
- **Config:** `StorePipeline.cfg`

## Revision Summary

Addresses 4 objections from Stage 4 TLA+ review debate (all consensus):

1. **AbortingBlocksNewStages rewritten** -- the v1 invariant was a tautology (`stageState[s] \notin X \/ stageState[s] = stageState[s]`). Rewritten to assert no stage beyond `currentStage` becomes created/active while aborting/aborted. Added to `.cfg` INVARIANT list.
2. **StageTimeout(s) action added** -- per-stage timeout budget (Amendment 6). Non-deterministic timeout on active/streaming stages. Same retry/exhaustion logic as other failures. Resets in-flight LLM state.
3. **LLM completion decoupled from stage completion** -- `LlmStreamComplete` now transitions stage back to `"active"` (not `"complete"`). New `StageDecideComplete` action handles stage completion when at least one LLM call has completed. New `llmCompleted` variable tracks completed LLM calls per stage.
4. **StageDirectError(s) for infrastructure failures** -- Git/FileSystem errors modeled as non-deterministic failures on active stages with no in-flight LLM call. Same retry/exhaustion logic.

Additional fix discovered during verification: added `runState = "running"` guards to all LLM lifecycle actions (`LlmStartStreaming`, `LlmStreamComplete`, `LlmStreamInterrupt`, `LlmInterruptResolve`, `LlmRequestFail`) to prevent zombie LLM activity after pipeline enters terminal state.

## States

### Run States
idle, running, complete, error, aborting, aborted

### Stage States
idle, active, streaming, complete, error, aborting, aborted, retrying

### LLM States
idle, requesting, streaming-active, streaming-interrupted, complete, error

## Properties Verified

### Safety (Invariants)
- **TypeOK** -- all variables within declared domains
- **DAGInvariant** -- subscription graph is always acyclic
- **NoZombieStages** -- aborted stages are destroyed; destroyed stages are in terminal state
- **RetriesBounded** -- retry count never exceeds MaxRetries
- **StageOrdering** -- stages execute sequentially (no stage created before predecessor completes)
- **StoreLifecycleIntegrity** -- only created, non-destroyed stages can be active/streaming/retrying/aborting
- **PipelineCompleteImpliesAllDone** -- pipeline complete implies all stages destroyed
- **NoLlmOnDestroyedStage** -- no active LLM work on destroyed stages
- **AbortingBlocksNewStages** -- no stage beyond currentStage is created/activated during abort
- **LlmCompletedBounded** -- completed LLM count never exceeds total LLM calls made

### Liveness
- **PipelineTerminates** -- pipeline eventually reaches complete, error, or aborted
- **StageEventuallyResolves** -- every created stage eventually reaches complete, error, or aborted
- **RunningIsTransient** -- running state eventually transitions to a terminal or aborting state

## TLC Results
- **States generated:** 171,174
- **Distinct states:** 88,454
- **Result:** PASS (no errors)
- **Workers:** 24
- **Date:** 2026-04-04

## Prior Versions
- [v1: design-pipeline-event-driven-refactor](../design-pipeline-event-driven-refactor/)
