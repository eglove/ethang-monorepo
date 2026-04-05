# TLA+ Specification: Design-Pipeline Event-Driven Store Architecture

## Source
Briefing: `docs/questioner-sessions/2026-04-04_design-pipeline-event-driven-refactor.md`

## Specification
- **Module:** `StorePipeline.tla`
- **Config:** `StorePipeline.cfg`

## States

### Run-Level (OrchestratorStore)
- idle, running, complete, error, aborting, aborted

### Stage-Level (per-stage stores)
- idle, active, streaming, complete, error, aborting, aborted, retrying

### LLM Request-Level (OpenRouterStore per stage)
- idle, requesting, streaming-active, streaming-interrupted, complete, error

## Properties Verified

### Safety (Invariants)
- **TypeOK** — all variables remain within their declared type domains
- **DAGInvariant** — subscription graph is always acyclic (no circular store subscriptions)
- **NoZombieStages** — destroyed stages are always in a terminal state; no transitions from terminal states
- **RetriesBounded** — retry count never exceeds MaxRetries for any stage
- **StageOrdering** — stages execute sequentially; stage N only starts after stage N-1 completes/errors/aborts
- **StoreLifecycleIntegrity** — only created, non-destroyed stores can be in active states
- **PipelineCompleteImpliesAllDone** — pipeline "complete" only when all stage stores are destroyed
- **NoLlmOnDestroyedStage** — no in-flight LLM requests on destroyed stage stores

### Liveness
- **PipelineTerminates** — the pipeline eventually reaches a terminal state (complete, error, or aborted)
- **StageEventuallyResolves** — every created stage eventually completes, errors, or aborts
- **RunningIsTransient** — the "running" state is not permanent; the pipeline eventually advances

## TLC Results
- **States generated:** 3,847
- **Distinct states:** 1,862
- **Result:** PASS
- **Workers:** 24
- **Date:** 2026-04-04

## Model Parameters
- NumStages = 3
- MaxRetries = 2
- MaxLlmCalls = 2

## Prior Versions
None
