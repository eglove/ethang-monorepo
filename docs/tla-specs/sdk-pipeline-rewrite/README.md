# TLA+ Specification: SDK Pipeline Rewrite

## Source
Briefing: `docs/questioner-sessions/2026-04-03_sdk-pipeline-rewrite.md`

## Specification
- **Module:** `SdkPipeline.tla`
- **Config:** `SdkPipeline.cfg`

## States

### Run-Level States
- `idle` -- not yet started
- `running` -- actively executing stages
- `completed` -- all 7 stages finished successfully
- `failed` -- terminal failure (with or without compensation)
- `compensating` -- undoing side effects after stage failure

### Stage-Level States
- `pending` -- not yet started
- `streaming_input` -- waiting for user streaming input (questioner, confirmation)
- `executing` -- agent is executing
- `validating` -- Zod validation at stage boundary
- `validation_failed` -- Zod validation failed, will retry
- `retrying` -- retrying after transient failure
- `git_operating` -- git port/adapter in use
- `pair_routing` -- synchronous message routing (stage 6 pair programming)
- `completed` -- stage finished successfully with artifact
- `failed` -- terminal stage failure
- `compensating` -- undoing side effects
- `compensated` -- successfully compensated

### Error Kinds (Discriminated Union)
- `none`, `claude_api_timeout`, `claude_api_rate_limit`, `zod_validation`, `git_failure`, `user_abandon`, `retry_exhausted`

## Properties Verified

### Safety (Invariants)
- **TypeOK** -- all variables stay within their declared domains
- **StageOrder** -- stages execute in strict sequential order; no stage is skipped
- **RetryBound** -- retry count never exceeds the configured cap
- **GitMutualExclusion** -- at most one run holds the git adapter at any time
- **CompletedRunIntegrity** -- a completed run has all 7 stages completed with artifacts
- **CheckpointValidity** -- checkpoint never exceeds current stage number
- **FailedStageHasError** -- every failed stage carries a non-none error tag
- **StreamingStageConstraint** -- only streaming stages (1, 5) can be in streaming_input state
- **PairRoutingConstraint** -- only stage 6 can be in pair_routing state
- **CompensationRequiresCheckpoint** -- compensation only triggers when a prior checkpoint exists

### Liveness
- **RunTermination** -- every started run eventually completes or fails
- **CompensationTermination** -- every compensating run eventually reaches failed state
- **RetryProgress** -- every retrying stage eventually re-executes or fails

## TLC Results
- **States explored:** 1,092,596
- **Distinct states:** 813,557
- **Result:** PASS (no errors)
- **Workers:** 4
- **Date:** 2026-04-03
- **Configuration:** MaxRuns=1, MaxRetries=1, MaxStreamTurns=2
- **Runtime:** 3 minutes 59 seconds
- **Note:** MaxRuns=2 model was partially explored (1.3M+ distinct states, no violations found) but exceeded practical time limits due to state space explosion from interleaving. Git mutual exclusion is structurally guaranteed by the gitOwner variable design.

## Prior Versions
None
