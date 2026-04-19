# Stuttering Equivalence in Bus Behaviors

Documents which bus behaviors are stuttering-equivalent under the TLA+ specification in `BidirectionalComms.tla`.

## Background

A TLA+ behavior is a sequence of states. Two behaviors are **stuttering-equivalent** if one can be obtained from the other by inserting or removing finite sequences of stuttering steps (steps where the state does not change). TLA+ liveness properties are always stated with a fairness condition that rules out infinite stuttering.

## Stuttering-Equivalent Bus Behaviors

### 1. Idle Heartbeat Steps

**Behavior**: The bus emits a telemetry heartbeat tick without appending any event to `event_log`.

**Why stuttering-equivalent**: `nextEvtId`, `eventLog`, `busStatus`, and all agent/handler state variables are UNCHANGED. The heartbeat is an internal implementation detail not visible in the TLA+ state.

**PS function**: `Invoke-EmitHeartbeat`

**Impact on tests**: Heartbeat calls between event appends do not affect property-test invariants (P1–P15). Tests may insert or omit heartbeats freely.

---

### 2. ACL Pre-Check Without Append

**Behavior**: The router validates an envelope ACL but rejects it before writing to `event_log`.

**Why stuttering-equivalent**: A rejected event does not modify `eventLog` or `nextEvtId`. The TLA+ state after rejection is identical to the state before. This is a stuttering step from the spec's perspective.

**PS function**: `Invoke-BusAppendEvent` (throws `AclViolation`)

**Impact on tests**: P4 verifies that ACL-invalid envelopes are rejected. The DB row count (P3) must not increase for rejected events.

---

### 3. WAL Checkpoint

**Behavior**: SQLite performs a WAL (Write-Ahead Log) checkpoint, flushing pages from WAL to the main DB file.

**Why stuttering-equivalent**: WAL checkpointing is an internal SQLite durability operation. It does not change the logical content of `event_log`. The TLA+ model abstracts over storage implementation; only the set of committed events matters.

**PS function**: Internal to PSSQLite; no direct PS wrapper.

**Impact on tests**: Checkpoint operations do not affect P1–P15. Tests may trigger or suppress checkpoints freely.

---

### 4. Mutex Acquire / Release (No Contention)

**Behavior**: A `[System.Threading.Mutex]::WaitOne()` call acquires an uncontested mutex and the operation proceeds immediately.

**Why stuttering-equivalent**: Uncontested mutex acquisition is a zero-time implementation detail. The TLA+ spec models atomicity via action composition; the mutex is not a TLA+ state variable.

**PS function**: `Lock-Pipeline` / `Unlock-Pipeline`

**Impact on tests**: Mutex acquire/release timing does not affect logical invariants. P9 perf baseline (5ms p99) implicitly bounds mutex overhead.

---

### 5. No-Op State Reads

**Behavior**: `Get-RouterEventCount`, `Get-RouterEventIds`, or other read-only queries execute without modifying state.

**Why stuttering-equivalent**: Pure reads do not change any TLA+ variable. Multiple sequential reads of the same data are all stuttering steps relative to each other.

**PS functions**: `Get-RouterEventCount`, `Get-RouterEventIds`

**Impact on tests**: Tests may perform as many read queries as needed between writes without affecting invariant validation.

---

## Non-Equivalent Behaviors (State-Changing)

The following are NOT stuttering steps and correspond to genuine TLA+ state transitions:

| Action | TLA+ Variable Changed |
|---|---|
| `Invoke-BusAppendEvent` (success) | `nextEvtId`, `eventLog` |
| `Invoke-BusHalt` | `busStatus`, `haltReason` |
| `Invoke-BusResumeRecovery` | `busStatus` |
| `Invoke-BusTakeSnapshot` | `snapshotExists[w]` |
| `Invoke-BusRollbackCoordination` | `rollbackRequested`, `snapshotExists[w]` |
| `Start-BusAgent` | `agentStatus[a]` |
| `Stop-BusAgent` | `agentStatus[a]` |
