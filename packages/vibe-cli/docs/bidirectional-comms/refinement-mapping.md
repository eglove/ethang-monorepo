# Refinement Mapping

Maps bus implementation functions to TLA+ spec actions in `BidirectionalComms.tla`.

A **refinement mapping** shows that the implementation is a valid refinement of the TLA+ specification: every implementation step corresponds to one or more spec steps under the mapping.

## Mapping Table

| TLA+ Action | PS Function(s) | Module | Notes |
|---|---|---|---|
| `AppendEvent` | `Invoke-BusAppendEvent` | `bus/router/router.ps1` | Allocates `evt_id`, validates ACL, inserts into `event_log`. Corresponds to spec's `nextEvtId' = nextEvtId + 1` and `eventLog' = eventLog \cup {e}`. |
| `StartAgent` | `Start-BusAgent` | `bus/router/agent-lifecycle.ps1` | Sets `agentStatus[a] = "alive"` in `agent_sessions`. Spec: `agentStatus' = [agentStatus EXCEPT ![a] = "alive"]`. |
| `StopAgent` | `Stop-AllBusAgents` | `bus/router/agent-lifecycle.ps1` | Sets all agent statuses to "dead". Spec: `AgentCrashes`. |
| `EmitHeartbeat` | `Invoke-EmitHeartbeat` | (not yet implemented) | Stuttering step; no TLA+ state change. |
| `ConsensusCandidate` | `Invoke-ConsensusCandidate` | (not yet implemented) | Corresponds to `ModeratorEmitsCandidate`. Guards: groundTruthDelivered, objection state. |
| `ConsensusRatify` | `Invoke-ConsensusRatify` | (not yet implemented) | Corresponds to `RouterRatifiesConsensus`. Sets `busStatus` toward halt. |
| `ConsensusFail` | `Invoke-ConsensusFail` | (not yet implemented) | Corresponds to `RouterFailsConsensus`. |
| `CheckpointAgent` | `Invoke-CheckpointAgent` | (not yet implemented) | Spec: `RouterInitiatesCheckpoint`. Sets `agentStatus[a] = "checkpointing"`. |
| `Halt` | `Invoke-BusHalt` | (not yet implemented) | Spec: `RouterHalts`. Sets `busStatus = "halted"`, `haltReason`. |
| `Resume` | `Invoke-BusResumeRecovery` | (not yet implemented) | Spec: `UserResumes`. Sets `busStatus = "resuming"`. |
| `TakeSnapshot` | `Invoke-BusTakeSnapshot` | `bus/ops/rollback-rehearsal.ps1` | Spec: `RouterTakesSnapshot(w)`. Sets `snapshotExists[w] = TRUE`. Implementation: `_Take-RehearsalSnapshot`. |
| `RollbackCoordination` | `Invoke-BusRollbackCoordination` | (not yet implemented) | Spec: `RouterExecutesRollback`. Sets `rollbackRequested = FALSE`, restores DB from snapshot. |
| `SendEvent` | `Send-BusEvent` | `bus/router/send-bus-event.ps1` | Wrapper around `Invoke-BusAppendEvent` for domain event emission. |
| `WaitGroup` | `Wait-BusGroup` | `bus/router/wait-bus-group.ps1` | Spec: fan-out group completion guard. Corresponds to `groupComplete` predicate. |
| `RouterStartupRecovery` | `Invoke-RouterStartupRecovery` | (not yet implemented) | Spec: `RouterStartupRecovery`. Replays uncommitted routed events. |
| `ProtocolError` | `Send-ProtocolError` | (not yet implemented) | Spec: `RouterEmitsProtocolError`. From=router, To=agent. |

## Refinement Obligations

For the implementation to be a valid refinement of the spec, the following must hold:

1. **TypeOK**: Every event in `event_log` has a valid `event_type`, `from`, `to`, `status`, and monotone `evt_id`.
2. **TypeSenderACL**: Every `(from, to, type)` triple in `event_log` satisfies the ACL (enforced by `Invoke-BusAppendEvent`).
3. **EvtIdMonotone**: `evt_id` values are strictly increasing (enforced by `MAX(evt_id) + 1` allocation).
4. **HaltMonotone**: Once `consensus_ratified` or `consensus_failed` is appended, no further non-halt events are appended (enforced by `$script:_RouterHalted` latch).
5. **RollbackRequiresSnapshot**: `Invoke-BusRollbackCoordination` must only fire when a snapshot exists for the target worktree.

## TLA+ Trace Function Map Reference

See `bus/infra/tla-trace-function-map.psd1` for the machine-readable mapping used by the TLC trace validator.
