# TLA+ Action → Aggregate Cascade Map

This document maps each of the 40 TLA+ actions to:
- **Primary-Mover Aggregate** — the aggregate that owns the action
- **Follower Aggregates** — aggregates updated in the same atomic boundary
- **PowerShell Entry Point** — the function invoked to execute the action
- **Atomic Boundary Type** — concurrency/durability guarantee for the operation

## Action Map

| Action | Primary-Mover | Follower Aggregates | PowerShell Entry Point | Atomic Boundary |
|---|---|---|---|---|
| DeliverBootstrap(a, w) | AgentSession | CommitSerializer, Router | Invoke-AgentSessionBootstrap | SQLite BEGIN IMMEDIATE |
| DeliverGroundTruth(a) | AgentSession | Router | Invoke-AgentSessionGroundTruth | SQLite BEGIN IMMEDIATE |
| AgentSendsDone(a, w) | CommitSerializer | AgentSession | Invoke-CommitSerializerDone | SQLite BEGIN IMMEDIATE |
| RouterCommitSucceeds(w) | CommitSerializer | AgentSession, Router | Invoke-CommitSerializerSucceed | SQLite BEGIN IMMEDIATE |
| RouterCommitFails(w) | CommitSerializer | AgentSession, Router | Invoke-CommitSerializerFail | SQLite BEGIN IMMEDIATE |
| AgentCrashes(a) | AgentSession | Router, BusLifecycle | Invoke-AgentSessionCrash | SQLite BEGIN IMMEDIATE |
| RouterInitiatesCheckpoint(a) | AgentSession | Router | Invoke-AgentSessionCheckpointInit | SQLite BEGIN IMMEDIATE |
| AgentCheckpointResponse(a) | AgentSession | Router | Invoke-AgentSessionCheckpointResponse | SQLite BEGIN IMMEDIATE |
| RouterRespawnsAgent(a) | AgentSession | Router | Invoke-AgentSessionRespawn | SQLite BEGIN IMMEDIATE |
| UserResumes | BusLifecycle | AgentSession | Invoke-BusResume | SQLite BEGIN IMMEDIATE |
| RouterResumesAgent(a) | AgentSession | BusLifecycle | Invoke-AgentSessionResume | SQLite BEGIN IMMEDIATE |
| BusResumed | BusLifecycle | Router | Invoke-BusResumed | SQLite BEGIN IMMEDIATE |
| RouterEmitsProtocolError(a) | Router | BusLifecycle | Invoke-BusProtocolError | SQLite BEGIN IMMEDIATE |
| AgentEmitsAfterProtocolError(a) | AgentSession | Router | Invoke-AgentSessionPostProtocolError | none |
| AgentRaisesObjection(a) | ConsensusRound | AgentSession | Invoke-ConsensusRoundRaiseObjection | SQLite BEGIN IMMEDIATE |
| AgentResolvesObjection(a, objEvtId) | ConsensusRound | AgentSession | Invoke-ConsensusRoundResolveObjection | SQLite BEGIN IMMEDIATE |
| ModeratorOverridesObjection(a, objEvtId) | ConsensusRound | AgentSession | Invoke-ConsensusRoundOverrideObjection | SQLite BEGIN IMMEDIATE |
| ModeratorEmitsCandidate(a) | ConsensusRound | AgentSession | Invoke-ConsensusRoundEmitCandidate | SQLite BEGIN IMMEDIATE |
| RouterRatifiesConsensus | ConsensusRound | CommitSerializer, Router | Invoke-ConsensusRoundRatify | SQLite BEGIN IMMEDIATE |
| RouterFailsConsensus | ConsensusRound | Router, BusLifecycle | Invoke-ConsensusRoundFail | SQLite BEGIN IMMEDIATE |
| HandlerAdapterReceives(a, h) | Router | AgentSession | Invoke-BusHandlerAdapterReceive | SQLite BEGIN IMMEDIATE |
| HandlerAdapterCompletes(h) | Router | AgentSession | Invoke-BusHandlerAdapterComplete | SQLite BEGIN IMMEDIATE |
| HandlerFails(h) | Router | AgentSession, BusLifecycle | Invoke-BusHandlerFail | SQLite BEGIN IMMEDIATE |
| AgentRequestsReview(a, reviewer) | Router | AgentSession | Invoke-BusAgentRequestReview | SQLite BEGIN IMMEDIATE |
| ReviewerEmitsVerdict(reviewer, a, inReplyTo) | Router | AgentSession, ConsensusRound | Invoke-BusReviewerVerdict | SQLite BEGIN IMMEDIATE |
| RouterAddsAgentToGroup(a, g) | Router | AgentSession | Invoke-BusAddAgentToGroup | SQLite BEGIN IMMEDIATE |
| AgentSendsToGroup(a, g) | Router | AgentSession | Invoke-BusAgentSendToGroup | SQLite BEGIN IMMEDIATE |
| NonMemberSendsToGroup(a, g) | Router | BusLifecycle | Invoke-BusNonMemberSendToGroup | none |
| RouterHaltsFeatureComplete | BusLifecycle | Router, CommitSerializer | Invoke-BusHalt | [Interlocked] CAS |
| RouterHaltsDuplicateId | BusLifecycle | Router | Invoke-BusHalt | [Interlocked] CAS |
| RouterHaltsGroupViolation | BusLifecycle | Router | Invoke-BusHalt | [Interlocked] CAS |
| UserInterrupts | BusLifecycle | Router, AgentSession | Invoke-BusHalt | [Interlocked] CAS |
| RouterHaltsBoundReached | BusLifecycle | Router | Invoke-BusHalt | [Interlocked] CAS |
| RouterHaltsSqliteError | BusLifecycle | Router | Invoke-BusHalt | [Interlocked] CAS |
| RouterHaltsRollbackSqliteError | BusLifecycle | RollbackCoordinator | Invoke-BusHalt | [Interlocked] CAS |
| RouterAbortsStaleRollback | RollbackCoordinator | BusLifecycle | Invoke-BusRollbackAbortStale | SQLite BEGIN IMMEDIATE |
| RouterTakesSnapshot(w) | RollbackCoordinator | BusLifecycle | Invoke-BusTakeSnapshot | OS rename-with-fsync |
| UserRequestsRollback(w) | RollbackCoordinator | BusLifecycle | Invoke-BusRollbackRequest | SQLite BEGIN IMMEDIATE |
| RouterExecutesRollback | RollbackCoordinator | BusLifecycle, AgentSession | Invoke-BusRollbackExecute | SQLite BEGIN IMMEDIATE |
| ReleasePipelineLock | BusLifecycle | Router | Invoke-ReleasePipelineLock | SQLite BEGIN IMMEDIATE |

## Aggregate Definitions

| Aggregate | Responsibility |
|---|---|
| AgentSession | Lifecycle, state, and messaging for a single agent instance |
| ConsensusRound | Objection, resolution, and ratification tracking for multi-agent consensus |
| BusLifecycle | Bus-wide run/halt/resume state and pipeline lock |
| RollbackCoordinator | Snapshot capture and rollback execution across worktrees |
| CommitSerializer | Serialized, ordered commit sequencing across agent sessions |
| Router | Event routing, group membership, handler dispatch, and protocol enforcement |

## Atomic Boundary Types

| Type | When Used |
|---|---|
| `SQLite BEGIN IMMEDIATE` | Any write to persistent state that must be atomic and serialized |
| `[Interlocked] CAS` | In-memory compare-and-swap for halt latch (avoids double-halt race) |
| `OS rename-with-fsync` | Atomic filesystem snapshot rename with durability guarantee |
| `none` | Read-only or purely in-memory operations with no persistence requirement |
