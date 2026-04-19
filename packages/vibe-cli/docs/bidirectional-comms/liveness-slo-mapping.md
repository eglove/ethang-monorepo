# Liveness SLO Mapping

Maps TLA+ liveness properties from `BidirectionalComms.tla` to observable SLO targets for the bus implementation.

## Liveness Properties and SLO Targets

| TLA+ Liveness Property | Description | SLO Target | Measurement |
|---|---|---|---|
| `EventuallyHalts` | If a halt reason is determined, the bus eventually reaches `busStatus = "halted"` | Halt within 30s of trigger | Time from halt decision to `busStatus = halted` in `bus_lifecycle_state` |
| `RollbackEventuallyCompletes` | If rollback is requested with a valid snapshot, it eventually executes | Rollback completes within 60s | Time from `rollbackRequested = TRUE` to `rollbackRequested = FALSE` |
| `ConsensusEventuallyResolves` | Consensus protocol terminates (ratified or failed) | Consensus resolves within 120s | Time from first `consensus_candidate` to `consensus_ratified` or `consensus_failed` |
| `AgentEventuallyCheckpointed` | Live agents are checkpointed before halt | Checkpoint within 15s of halt initiation | Time from halt trigger to all agents in `checkpointing` or `dead` status |
| `GroundTruthEventuallyDelivered` | Each agent eventually receives a `ground_truth` event | `ground_truth_delivered >= 1` within 10s of agent start | `ground_truth_delivered` column in `agent_sessions` |
| `PipelineLockEventuallyReleased` | Pipeline lock is released after halt | Lock released within 5s of halt | `pipeline_lock = 0` in `bus_lifecycle_state` |
| `AppendEventEventuallyComplete` | Valid envelopes are eventually committed | Append completes within p99 = 5ms | Per-event latency measured in P9 |
| `SnapshotEventuallyTaken` | When snapshot conditions are met, snapshot is taken | Snapshot within 30s of trigger | Time from snapshot conditions met to `snapshotExists[w] = TRUE` |

## Perf Baseline Cross-Reference

The SLO targets above align with the perf baselines in `tests/bus/performance-baselines.json`:

| Baseline Key | Value | SLO Property |
|---|---|---|
| `append_event_p99_ms` | 5ms | `AppendEventEventuallyComplete` |
| `append_event_p999_ms` | 20ms | `AppendEventEventuallyComplete` (tail) |
| `git_stash_p99_ms` | 2000ms | `AgentEventuallyCheckpointed` (git overhead) |
| `git_commit_p99_ms` | 500ms | `PipelineLockEventuallyReleased` (commit path) |
| `wal_checkpoint_p99_ms` | 100ms | `AppendEventEventuallyComplete` (checkpoint overhead) |
| `mutex_acquire_p99_ms` | 50ms | `AppendEventEventuallyComplete` (lock contention) |

## Fairness Obligation Cross-Reference

Liveness properties require fairness obligations to be non-vacuous. See `fairness-obligation-matrix.md` for the full mapping of `WF`/`SF` obligations to PS functions and tests.

## Notes on Vacuity

- `EventuallyHalts` is vacuously satisfied if the bus never determines a halt reason. The `SF_vars(Halt)` fairness obligation ensures this is not permanent.
- `RollbackEventuallyCompletes` is vacuously satisfied if rollback is never requested. `WF_vars(RouterTakesSnapshot(w))` and `WF_vars(UserRequestsRollback(w))` close this gap in the TLA+ model.
- Property tests P10, P12, P13 verify the halt-related invariants that underpin the `EventuallyHalts` liveness property.
