# Fairness Obligation Matrix

Maps TLA+ fairness obligations from `BidirectionalComms.tla` to PowerShell function implementations and property-test coverage.

| TLA+ Fairness Obligation | Condition | PS Function | Test File | Test ID |
|---|---|---|---|---|
| `WF_vars(AppendEvent)` | Bus is running; envelope ACL-valid | `Invoke-BusAppendEvent` | `router-properties.Tests.ps1` | P2 |
| `SF_vars(Halt)` | Halt reason determined; no pending commits | `Invoke-BusHalt` | `halt.Tests.ps1` | P1 |
| `WF_vars(Resume)` | Bus halted with resume-eligible reason | `Invoke-BusResumeRecovery` | `resume.Tests.ps1` | T1 |
| `WF_vars(ReleasePipelineLock)` | Bus halting; pipeline lock held | `Unlock-Pipeline` | `pipeline-lock.Tests.ps1` | T3 |
| `WF_vars(RouterTakesSnapshot)` | Snapshot conditions met for worktree | `Invoke-BusTakeSnapshot` | `rollback-rehearsal.Tests.ps1` | T5 |
| `WF_vars(RouterExecutesRollback)` | rollbackRequested=TRUE; snapshot exists | `Invoke-BusRollbackCoordination` | `rollback-rehearsal.Tests.ps1` | T8 |
| `WF_vars(RouterAbortsStaleRollback)` | Bus halted; rollback pending (stale) | `Invoke-BusRollbackCoordination` | `rollback-rehearsal.Tests.ps1` | T9 |
| `WF_vars(UserRequestsRollback(w))` | snapshotExists=TRUE; bus running/resuming | `Send-BusEvent` (user CLI) | `rollback-rehearsal.Tests.ps1` | T11 |
| `WF_vars(HandlerFails)` | Handler busy; agent crash propagated | `Stop-BusAgent` | `migration-stage-7.Tests.ps1` | T14 |

## Notes

- Weak Fairness (`WF`): the action must eventually fire if continuously enabled.
- Strong Fairness (`SF`): the action must eventually fire if repeatedly enabled, even intermittently.
- Property tests in `router-properties.Tests.ps1` cover the `WF_vars(AppendEvent)` path via P2 (strictly increasing evt_ids), P3 (no silent drops), and P9 (latency baseline).
- The `SF_vars(Halt)` obligation is verified by observing that halt events are accepted and the halt latch fires (P10).

## TLA+ Liveness Properties Covered

| TLA+ Property | Description |
|---|---|
| `EventuallyHalts` | If a halt reason is determined, the bus eventually reaches halted state |
| `RollbackEventuallyCompletes` | If rollback is requested with a snapshot, it eventually executes |
| `ConsensusEventuallyResolves` | Consensus protocol terminates (ratified or failed) |
| `AgentEventuallyCheckpointed` | Live agents are checkpointed before halt |
