# Source -- Engine

| Path | Kind | Summary | Updated |
|------|------|---------|---------|
| src/engine/orchestrator.ts | orchestrator | Pipeline orchestrator; composes all 7 stages sequentially, manages `RunRecord`, emits `PipelineResult` | 2026-04-03 |
| src/engine/transitions.ts | state-machine | Stage transition engine; validates legal state transitions between stage statuses | 2026-04-03 |
| src/engine/retry.ts | coordinator | Retry coordinator; exponential back-off with jitter for transient Claude API / git failures | 2026-04-03 |
| src/engine/compensation.ts | coordinator | Compensation / checkpoint coordinator; rolls back partial stage work on unrecoverable errors | 2026-04-03 |
