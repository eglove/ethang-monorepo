# Source -- Core

| Path | Kind | Summary | Updated |
|------|------|---------|---------|
| src/index.ts | entry-point | Public API; exports `runPipeline` with injectable adapters and config | 2026-04-03 |
| src/constants.ts | config | Named stage constants (`STAGES`), `StageName` type, `PipelineConfigSchema` (Zod), default config | 2026-04-03 |
| src/types/errors.ts | types | Discriminated union `PipelineError` with `ErrorKind` literals and factory `createPipelineError` | 2026-04-03 |
| src/types/stage.ts | types | Stage state machine types (`StageRecord`, stage status enum) | 2026-04-03 |
| src/types/run.ts | types | `RunRecord` -- instance-scoped pipeline state tracking per run | 2026-04-03 |
| src/schemas/index.ts | schemas | Zod schemas for all stage boundary contracts (briefing, debate, TLA, review, impl plan, pair session) | 2026-04-03 |
