# Implementation Plan: SQLite State Repository

## Source Artifacts

| Artifact | Path |
|----------|------|
| Requirements Briefing | `packages/vibe-cli/docs/sqlite-state/elicitor.md` |
| BDD Scenarios | `packages/vibe-cli/docs/sqlite-state/bdd.feature` |
| TLA+ Specification | `packages/vibe-cli/docs/sqlite-state/tla/SqliteState.tla` |

## Debate Objections Addressed (Revision 2)

This revision addresses 17 objections organized in 4 priority tiers:

| ID | Priority | Objection | Resolution |
|----|----------|-----------|------------|
| P1a | P1 | Set-StageComplete missing lockHolder/IsRunning guards | Steps 5: added `lockHolder = f` and `IsRunning(f)` guard tests |
| P1b | P1 | Set-TaskResult missing tier-must-be-running guard | Step 12: added tier-status-running guard test |
| P1c | P1 | Update-DebateState missing feature-must-be-running guard | Step 10: added IsRunning(f) guard tests to all debate actions |
| P1d | P1 | StartTier missing predecessor-completion guard | Step 11: added predecessor-all-passed guard test |
| P1e | P1 | HaltPipeline idempotency not specified | Step 16: added idempotent halt-on-halted-feature test |
| P2a | P2 | PRAGMA foreign_keys=ON missing from Open-StateDatabase | Step 2: added PRAGMA enforcement test |
| P2b | P2 | No WAL recovery test | Step 2: added WAL journal recovery test |
| P2c | P2 | Get-LastCompletedStage null-vs-0 contract ambiguous | Step 5: pinned contract — returns 0 (not null) when no stages complete |
| P2d | P2 | No rollback tests for HaltPipeline and ForceUnlock | Steps 15, 16: added transaction rollback failure tests |
| P3a | P3 | Vague test descriptions | All steps: renamed tests with invariant/transition references |
| P3b | P3 | No exhaustive invalid-transition matrix test | Step 19: added invalid-transition matrix test |
| P3c | P3 | No idempotency tests for tiers/merges/DB re-init | Steps 2, 11, 13: added idempotency tests |
| P3d | P3 | No test teardown strategy specified | Step 1: added test infrastructure with teardown contract |
| P3e | P3 | No SQL injection negative path | Step 3: added SQL injection test for feature names |
| P4a | P4 | L4 missing from Step 15 TLA+ coverage | Step 15: added L4 LockEventuallyReleased |
| P4b | P4 | E2E should split into early and late checkpoints | Step 21: split into early checkpoint (Steps 1–10) and late checkpoint (Steps 11–18) |

## TLA+ State Coverage Matrix

### States (Variables)

- `dbOpen` — BOOLEAN: whether Open-StateDatabase has been called
- `activeFeature` — NULL or feature name (session.active_feature)
- `featureStatus` — [Features → {none, idle, running, complete, halted}] (features.status)
- `lastCompleted` — [Features → 0..MaxStage] (stage_progress max)
- `lockHolder` — NULL or feature name (pipeline_lock.feature_name)
- `crashCount` — [Features → 0..MaxCrashes] (pipeline_lock.crash_count)
- `pipelineState` — [Features → {none, running, halted, complete}] (pipeline_state.pipeline_state)
- `debateRound` — [Features → [1..MaxStage → 0..MaxDebateRound]] (debate_state.round)
- `debateConsensus` — [Features → [1..MaxStage → {none, pending, reached, failed}]] (debate_state.consensus_status)
- `tierStatus` — [Features → [Tiers → {none, pending, running, passed, failed}]] (tier_progress.status)
- `tierTasksDone` — [Features → [Tiers → 0..MaxTasks]] (task_results count)
- `gateVerdict` — [Features → [Tiers → {none, pass, fail}]] (gate_results.status)
- `mergeStatus` — [Features → [Tiers → {none, pending, merged, conflict}]] (merge_results aggregate)

### Transitions (Named Actions)

- `OpenDatabase` — ~dbOpen → dbOpen'=TRUE
- `CloseDatabase` — dbOpen ∧ lockHolder=NULL ∧ activeFeature=NULL → dbOpen'=FALSE
- `CreateFeature(f)` — featureStatus[f]="none" → "idle"
- `SetActiveFeature(f)` — set session active feature (guards: exists, no other running)
- `ClearActiveFeature` — null out active feature (guards: terminal status)
- `AcquireLock(f)` — idle → running, sets lockHolder (cross-aggregate atomic)
- `ReleaseLock(f)` — release lock (guards: terminal status)
- `ForceUnlock(f)` — operator escape hatch: release lock + halt running features + full cleanup
- `ProcessCrash(f)` — crash recovery: running→idle, reset tiers/merges, increment crash count
- `ExecuteStage(f,s)` — complete a non-debate stage
- `StartDebate(f,s)` — initiate debate for debate-eligible stage
- `AdvanceDebateRound(f,s)` — advance debate round (guards: < MaxDebateRound)
- `DebateReachConsensus(f,s)` — debate succeeds → stage completes
- `DebateFails(f,s)` — debate fails at MaxDebateRound → feature halts
- `EnterStage7(f)` — bulk-initialize all tiers to "pending"
- `StartTier(f,t)` — pending → running (guards: all predecessors passed)
- `CompleteTask(f,t)` — increment tier task count (guards: < MaxTasks)
- `StartMerge(f,t)` — none → pending (guards: tasks > 0, tier running)
- `CompleteMerge(f,t)` — pending → merged
- `MergeConflict(f,t)` — pending → conflict, tier → failed, feature → halted
- `GatePass(f,t)` — running → passed, verdict → pass (guards: merged)
- `GateFail(f,t)` — running → failed, verdict → fail, feature → halted
- `CompleteStage7(f)` — all tiers passed → lastCompleted = MaxStage
- `CompletePipeline(f)` — all stages done → feature complete
- `HaltPipeline(f)` — halt feature + fail pending debates + cleanup tiers/merges

### Safety Invariants

- `S1 SingleRunningFeature` — at most one running feature at any time
- `S2 LockExclusive` — lock holder must be running/halted/complete
- `S4 NoCompletionWithoutAllStages` — complete ⇒ lastCompleted = MaxStage
- `S5 HaltedStateConsistent` — halted ⇒ pipelineState = halted
- `S6 TierPassRequiresTasks` — passed tier ⇒ tierTasksDone > 0
- `S7 GateVerdictConsistent` — pass ⇒ tier passed; fail ⇒ tier failed
- `S8 ActiveFeatureMustExist` — activeFeature ≠ NULL ⇒ featureStatus ≠ none
- `S9 RunningImpliesLockHeld` — running ⇒ lockHolder = f
- `S10 DbOpenWhenActive` — activeFeature ≠ NULL ⇒ dbOpen
- `S11 DebateStageConsistency` — non-none consensus only on debate stages; pending only on current stage
- `S12 TierSequentialOrder` — Part A: execution ordering; Part B: activation ordering
- `S13 TierFailRequiresTasks` — failed tier ⇒ tierTasksDone > 0
- `S14 MergeStatusConsistent` — conflict ⇒ failed; merged ⇒ running/passed/failed; pending ⇒ running
- `S15 GateRequiresMerge` — verdict ≠ none ⇒ mergeStatus = merged
- `S16 HaltedNoRunningTiers` — halted ⇒ no running tiers
- `S17 RunningStateConsistent` — running ⇒ pipelineState = running
- `S18 CompleteStateConsistent` — complete ⇒ pipelineState = complete
- `S19 IdleStateConsistent` — idle ⇒ pipelineState = none
- `S20 CrashBudgetEnforced` — crashCount ≥ MaxCrashes ⇒ ~ENABLED ProcessCrash
- `S21 NoneTierNoTasks` — tier=none ⇒ tierTasksDone = 0
- `S22 RunningTierNoVerdict` — tier=running ⇒ gateVerdict = none
- `S23 NoneStateConsistent` — featureStatus=none ⇒ pipelineState = none

### Liveness Properties

- `L1 EventualTermination` — running ~> {complete, halted, idle}
- `L2 DebateTermination` — pending ~> {reached, failed}
- `L3 DatabaseEventuallyCloses` — dbOpen ~> ~dbOpen (conditional on crash budget)
- `L4 LockEventuallyReleased` — lockHolder ≠ NULL ~> lockHolder = NULL
- `L5 MergeEventuallyResolves` — pending ~> {merged, conflict, none}
- `L6 StageNeverDecreases` — [][lastCompleted' ≥ lastCompleted]_vars

---

## Test Infrastructure Contract (P3d)

All Pester test files MUST follow this teardown strategy:

```
BeforeAll {
    # Open :memory: database (no disk I/O, auto-cleaned on connection close)
    Open-StateDatabase -InMemory
}

AfterEach {
    # Reset all tables between tests (DELETE FROM, not DROP — preserves schema)
    Reset-StateDatabase
}

AfterAll {
    # Close connection (releases :memory: database entirely)
    Close-StateDatabase -Force
}
```

- **`:memory:` databases** for unit tests — no disk cleanup needed, no file locking issues.
- **`Reset-StateDatabase`** is a test helper that DELETEs all rows from all 12 tables between tests. This prevents cross-test contamination while avoiding the overhead of re-creating the schema.
- **`-Force` on Close-StateDatabase** bypasses the lock/activeFeature guards for test teardown (tests may end in any state).
- **Integration tests** that require disk I/O use `$TestDrive` (Pester's auto-cleaned temp directory).

---

## Implementation Steps

### Step 1: SQL Schema, Module Manifest, and Test Helpers

**Files:**
- `state/schema.sql` (create)
- `state/state-repository.psd1` (create)
- `state/state-repository.psm1` (create)
- `state/test-helpers/Reset-StateDatabase.ps1` (create)

**Description:**
Create the SQL schema file with all 12 `CREATE TABLE IF NOT EXISTS` statements matching the elicitor's schema specification. Create the module manifest (.psd1) exporting all 34 functions plus the `Reset-StateDatabase` test helper. Create the module loader (.psm1) that dot-sources all function files from subdirectories. Create `Reset-StateDatabase` that DELETEs all rows from all 12 tables for test isolation (P3d — test teardown strategy).

**Dependencies:** None

**Test (write first):**
- @unit: schema.sql parses as valid SQL — execute against :memory: SQLite with no errors.
- @unit: Module manifest FunctionsToExport lists all 34 repository functions.
- @unit: Module loader dot-sources all function files without error (initially as stubs).
- @unit: Reset-StateDatabase clears all 12 tables and preserves schema.

**TLA+ Coverage:**
- State: `dbOpen` (schema is prerequisite for OpenDatabase)
- Transition: none directly — this is infrastructure

---

### Step 2: Connection — Open-StateDatabase and Close-StateDatabase

**Files:**
- `state/connection/Open-StateDatabase.ps1` (create)
- `state/connection/Close-StateDatabase.ps1` (create)

**Description:**
Implement the database lifecycle. `Open-StateDatabase` checks for PSSQLite, creates/opens the DB file, enables `PRAGMA foreign_keys = ON` (P2a), sets `PRAGMA journal_mode = WAL` for concurrent read safety, executes `schema.sql`, and stores the connection in a module-scoped variable. `Close-StateDatabase` validates no lock is held and no active feature is set, then closes the connection. Supports `-InMemory` switch for test databases. Supports `-Force` switch to bypass guards for test teardown. This gates every subsequent repository function via a `dbOpen` guard.

**Dependencies:** Step 1

**Test (write first):**
- @integration: OpenDatabase creates file and all 12 tables on first run.
- @integration: OpenDatabase is idempotent — second call on existing DB is a no-op (P3c).
- @integration: OpenDatabase enables PRAGMA foreign_keys=ON (P2a) — query returns 1.
- @integration: OpenDatabase sets PRAGMA journal_mode=WAL — query returns "wal".
- @integration: WAL journal recovery — corrupt WAL file does not prevent DB open (P2b).
- @integration: PSSQLite not installed produces terminating error with module name.
- @integration: Corrupt database file produces terminating error with recovery guidance.
- @unit: CloseDatabase tears down the connection — subsequent calls fail with connection error.
- @unit: CloseDatabase rejected while lock is held (lockHolder ≠ NULL) — error message references lock.
- @unit: CloseDatabase rejected while active feature is set — error message references session.
- @unit: CloseDatabase on already-closed database produces terminating error.
- @unit: CloseDatabase -Force bypasses lock/activeFeature guards for test teardown.
- @unit: Repository function call before OpenDatabase fails with "database not open" error.
- @unit: Repository function call after CloseDatabase fails with "database not open" error.
- @unit: OpenDatabase with -InMemory creates :memory: database for test isolation.
- @integration: Database file deleted manually triggers full re-initialization on next OpenDatabase.

**TLA+ Coverage:**
- State: `dbOpen`
- Transition: `OpenDatabase`, `CloseDatabase`
- Invariant: `S10 DbOpenWhenActive` (prerequisite)

---

### Step 3: Features — New-Feature, Get-Feature, Get-AllFeatures

**Files:**
- `state/features/New-Feature.ps1` (create)
- `state/features/Get-Feature.ps1` (create)
- `state/features/Get-AllFeatures.ps1` (create)

**Description:**
Implement the feature registry. `New-Feature` inserts a row with status "idle", erroring on duplicates, empty strings, or null names. `Get-Feature` returns a single feature row or null. `Get-AllFeatures` lists all features. All inputs are parameterized (never string-interpolated into SQL) to prevent injection.

**Dependencies:** Step 2

**Test (write first):**
- @unit: CreateFeature — new feature has status "idle" and created_at timestamp.
- @unit: CreateFeature — duplicate feature name produces terminating error.
- @unit: CreateFeature — empty string name produces terminating error with validation message.
- @unit: CreateFeature — null name produces terminating error.
- @unit: CreateFeature — SQL injection string as feature name is stored literally, not executed (P3e).
- @unit: Get-Feature — nonexistent feature returns $null.
- @unit: Get-Feature — existing feature returns all columns.
- @unit: Get-AllFeatures — correct count and all fields when features exist.
- @unit: Get-AllFeatures — empty collection when none exist.

**TLA+ Coverage:**
- State: `featureStatus` (none → idle)
- Transition: `CreateFeature(f)`
- Invariant: `S8 ActiveFeatureMustExist` (prerequisite — features must exist)

---

### Step 4: Session — Set-ActiveFeature, Get-ActiveFeature, Clear-ActiveFeature

**Files:**
- `state/session/Set-ActiveFeature.ps1` (create)
- `state/session/Get-ActiveFeature.ps1` (create)
- `state/session/Clear-ActiveFeature.ps1` (create)

**Description:**
Implement the session singleton. `Set-ActiveFeature` validates the feature exists and no other feature is running (S1 displacement guard), then upserts. Idempotent when already set to the same idle feature. `Clear-ActiveFeature` requires the feature to be in terminal status (complete/halted). `Get-ActiveFeature` returns the current active feature or null.

**Dependencies:** Step 3

**Test (write first):**
- @unit: SetActiveFeature — upsert on empty session sets activeFeature.
- @unit: SetActiveFeature — replaces previous value when previous feature is terminal (halted).
- @unit: SetActiveFeature — rejected when another feature is running (S1 SingleRunningFeature).
- @unit: SetActiveFeature — allowed when previous feature is halted (terminal displacement).
- @unit: SetActiveFeature — rejected for nonexistent feature (S8 ActiveFeatureMustExist).
- @unit: SetActiveFeature — idempotent when same idle feature is already active.
- @unit: ClearActiveFeature — succeeds on completed feature.
- @unit: ClearActiveFeature — succeeds on halted feature.
- @unit: ClearActiveFeature — rejected for idle feature (non-terminal).
- @unit: ClearActiveFeature — rejected for running feature (non-terminal).
- @unit: Get-ActiveFeature — returns $null when no feature is set.

**TLA+ Coverage:**
- State: `activeFeature`
- Transition: `SetActiveFeature(f)`, `ClearActiveFeature`
- Invariant: `S1 SingleRunningFeature`, `S8 ActiveFeatureMustExist`

---

### Step 5: Stage Progress — Set-StageComplete, Get-LastCompletedStage

**Files:**
- `state/progress/Set-StageComplete.ps1` (create)
- `state/progress/Get-LastCompletedStage.ps1` (create)

**Description:**
Implement stage completion tracking. `Set-StageComplete` enforces the full TLA+ guard chain: `lockHolder = f` AND `IsRunning(f)` (P1a), plus strict sequential ordering (s = lastCompleted + 1). Rejects stages below lastCompleted, rejects out-of-range stages (0, negative, > MaxStage), and is idempotent for the current stage. `Get-LastCompletedStage` returns the highest completed stage as an integer — returns `0` (not null) when no stages are complete, matching the TLA+ Init where `lastCompleted = [f ∈ Features ↦ 0]` (P2c).

**Dependencies:** Step 3

**Test (write first):**
- @unit: Set-StageComplete — marks stage complete when lockHolder=f and IsRunning(f).
- @unit: Set-StageComplete — rejected when feature is not running (P1a — IsRunning guard).
- @unit: Set-StageComplete — rejected when lockHolder does not match feature (P1a — lockHolder guard).
- @unit: Set-StageComplete — sequential stages complete in order (s = lastCompleted + 1).
- @unit: Set-StageComplete — rejected for gap-skipping (stage 3 before stage 2).
- @unit: Set-StageComplete — idempotent for current stage (re-completing same stage is no-op).
- @unit: Set-StageComplete — rejected for stage below lastCompleted.
- @unit: Set-StageComplete — rejected for stage above MaxStage.
- @unit: Set-StageComplete — rejected for stage 0 and negative stage number.
- @unit: Get-LastCompletedStage — returns 0 when no stages complete (P2c — not null).
- @unit: Get-LastCompletedStage — returns correct stage number after multiple completions.

**TLA+ Coverage:**
- State: `lastCompleted`
- Transition: `ExecuteStage(f,s)` (partial), `DebateReachConsensus(f,s)` (partial), `CompleteStage7(f)` (partial)
- Invariant: `S4 NoCompletionWithoutAllStages` (prerequisite)
- Property: `L6 StageNeverDecreases`

---

### Step 6: Artifacts — Register-Artifact, Get-Artifacts

**Files:**
- `state/artifacts/Register-Artifact.ps1` (create)
- `state/artifacts/Get-Artifacts.ps1` (create)

**Description:**
Implement artifact file path registration. Pure CRUD — outside TLA+ abstraction boundary but required by BDD. `Register-Artifact` stores a file path reference by stage and type. `Get-Artifacts` retrieves paths optionally filtered by stage.

**Dependencies:** Step 3

**Test (write first):**
- @unit: Register-Artifact — stores file path for a stage with created_at.
- @unit: Register-Artifact — stores multiple artifacts for one stage.
- @unit: Get-Artifacts — filtered by stage returns only that stage's artifacts.
- @unit: Get-Artifacts — without stage filter returns all artifacts.
- @unit: Get-Artifacts — returns empty collection when none registered.

**TLA+ Coverage:**
- (Intentional abstraction boundary — not modeled in TLA+; CRUD only)

---

### Step 7: Pipeline Lock — Lock-PipelineState, Unlock-PipelineState, Get-PipelineLockState, Add-CrashCount

**Files:**
- `state/lock/Lock-PipelineState.ps1` (create)
- `state/lock/Unlock-PipelineState.ps1` (create)
- `state/lock/Get-PipelineLockState.ps1` (create)
- `state/lock/Add-CrashCount.ps1` (create)

**Description:**
Implement pipeline locking. `Lock-PipelineState` is a cross-aggregate atomic write: transitions featureStatus idle→running, sets pipelineState to "running", sets lockHolder — all in a single SQLite transaction with rollback on failure. `Unlock-PipelineState` supports both normal release (terminal status required) and force flag (any status, operator escape hatch). `Get-PipelineLockState` reads lock metadata and detects stale locks via PID check. `Add-CrashCount` increments the crash counter.

Note: ForceUnlock's complex cleanup logic (HaltPipeline-style) is implemented in Step 15 after all domain tables are available.

**Dependencies:** Step 4

**Test (write first):**
- @unit: AcquireLock — sets lockHolder, PID, and locked_at in single transaction.
- @unit: AcquireLock — transitions featureStatus idle→running atomically (S9 RunningImpliesLockHeld).
- @unit: AcquireLock — sets pipelineState to "running" atomically (S17 RunningStateConsistent).
- @unit: ReleaseLock — succeeds on completed feature, clears lockHolder.
- @unit: ReleaseLock — succeeds on halted feature, clears lockHolder.
- @unit: ReleaseLock — rejected when feature status is idle (non-terminal).
- @unit: ReleaseLock — rejected when feature status is running (non-terminal).
- @unit: ForceUnlock — simple release on idle feature (no cleanup needed).
- @unit: Get-PipelineLockState — detects stale lock via PID check (process not running).
- @unit: Add-CrashCount — increments crash counter by 1.
- @unit: Get-PipelineLockState — returns $null when no lock exists.
- @unit: AcquireLock — rejected when activeFeature does not match target.
- @unit: AcquireLock — rejected by concurrent contention (lock already held by another).
- @unit: AcquireLock — rejected when existing holder has terminal status but lock not released.
- @integration: Lock-PipelineState rolls back all 3 table writes on partial failure.

**TLA+ Coverage:**
- State: `lockHolder`, `crashCount`, `featureStatus` (idle→running), `pipelineState` (none→running)
- Transition: `AcquireLock(f)`, `ReleaseLock(f)`, `ForceUnlock(f)` (partial — simple cases)
- Invariant: `S2 LockExclusive`, `S9 RunningImpliesLockHeld`, `S17 RunningStateConsistent`

---

### Step 8: Pipeline State — Update-PipelineState, Get-PipelineState

**Files:**
- `state/runtime/Update-PipelineState.ps1` (create)
- `state/runtime/Get-PipelineState.ps1` (create)

**Description:**
Implement pipeline runtime state columns. `Update-PipelineState` updates typed columns (verdict, review_round, etc.) while preserving unmodified columns. Also handles feature status transitions (running→complete, running→halted) with denormalization sync to features.status. `Get-PipelineState` returns all columns or null if no row exists.

**Dependencies:** Step 3

**Test (write first):**
- @unit: Update-PipelineState — updates verdict column.
- @unit: Update-PipelineState — updates multiple runtime columns simultaneously.
- @unit: Get-PipelineState — returns all 8 typed columns.
- @unit: Get-PipelineState — returns $null for feature with no row.
- @unit: Update-PipelineState — preserves unmodified columns on partial update.
- @unit: Running feature has pipelineState="running" (S17 RunningStateConsistent).
- @unit: Halted feature has pipelineState="halted" (S5 HaltedStateConsistent).
- @unit: Complete feature has pipelineState="complete" (S18 CompleteStateConsistent).
- @unit: Idle feature after crash has pipelineState="none" (S19 IdleStateConsistent).
- @unit: Never-created feature — Get-PipelineState returns $null (S23 NoneStateConsistent).
- @unit: Newly created feature — pipeline_state row has status "none" (S23 NoneStateConsistent).

**TLA+ Coverage:**
- State: `pipelineState`
- Transition: `CompletePipeline(f)` (partial — status change)
- Invariant: `S5 HaltedStateConsistent`, `S17 RunningStateConsistent`, `S18 CompleteStateConsistent`, `S19 IdleStateConsistent`, `S23 NoneStateConsistent`

---

### Step 9: Stage Outputs — Set-StageOutput, Get-StageOutput

**Files:**
- `state/outputs/Set-StageOutput.ps1` (create)
- `state/outputs/Get-StageOutput.ps1` (create)

**Description:**
Implement structured JSON storage for stage outputs. `Set-StageOutput` stores/overwrites JSON by output_type with created_at timestamp. `Get-StageOutput` parses and returns the stored JSON or null. Pure CRUD — outside TLA+ abstraction boundary.

**Dependencies:** Step 3

**Test (write first):**
- @unit: Set-StageOutput — stores JSON output with created_at timestamp.
- @unit: Set-StageOutput — stores target root output type.
- @unit: Set-StageOutput — overwrites existing output for same stage/type.
- @unit: Get-StageOutput — returns $null for nonexistent output.
- @unit: Get-StageOutput — round-trips JSON with nested objects correctly.

**TLA+ Coverage:**
- (Intentional abstraction boundary — not modeled in TLA+; CRUD only)

---

### Step 10: Debate State — Update-DebateState, Get-DebateState, Get-DebateHistory

**Files:**
- `state/debate/Update-DebateState.ps1` (create)
- `state/debate/Get-DebateState.ps1` (create)
- `state/debate/Get-DebateHistory.ps1` (create)

**Description:**
Implement debate loop state tracking. `Update-DebateState` writes debate round state with guards: feature must be running with lock held (P1c — `lockHolder = f` AND `IsRunning(f)`), rejects non-debate stages (S11), rejects rounds beyond MaxDebateRound, rejects premature "failed" status before MaxDebateRound. When consensus="failed" at MaxDebateRound, atomically halts the feature (cross-aggregate write). `Get-DebateState` returns the latest round. `Get-DebateHistory` returns all rounds ordered.

**Dependencies:** Step 8

**Test (write first):**
- @unit: StartDebate — writes first round with consensus="pending" when IsRunning(f) and lockHolder=f.
- @unit: StartDebate — rejected when feature is not running (P1c — IsRunning guard).
- @unit: StartDebate — rejected when lockHolder does not match feature (P1c — lockHolder guard).
- @unit: AdvanceDebateRound — increments round number while consensus="pending".
- @unit: AdvanceDebateRound — rejected when feature is not running (P1c).
- @unit: DebateReachConsensus — sets consensus="reached" and advances stage.
- @unit: Get-DebateHistory — returns all rounds in chronological order.
- @unit: StartDebate — resume mid-debate after crash uses history to determine round.
- @unit: Get-DebateState — returns $null when no rounds exist.
- @unit: Update-DebateState — each round stores moderator JSON blob.
- @unit: DebateFails — max rounds exhausted enforces consensus="failed" at MaxDebateRound.
- @unit: DebateFails — premature "failed" before MaxDebateRound is rejected.
- @unit: AdvanceDebateRound — rejected when round = MaxDebateRound (ceiling).
- @unit: AdvanceDebateRound — MaxDebateRound=1 boundary — round 2 rejected.
- @unit: DebateReachConsensus — MaxDebateRound=1 — consensus on single round succeeds.
- @unit: DebateFails — MaxDebateRound=1 — failure on single round halts feature.
- @unit: StartDebate — rejected for stage 1 (non-debate stage, S11).
- @unit: StartDebate — rejected for stage MaxStage (non-debate stage, S11).

**TLA+ Coverage:**
- State: `debateRound`, `debateConsensus`
- Transition: `StartDebate(f,s)`, `AdvanceDebateRound(f,s)`, `DebateReachConsensus(f,s)`, `DebateFails(f,s)`
- Invariant: `S11 DebateStageConsistency`
- Property: `L2 DebateTermination`

---

### Step 11: Tier Progress — Set-TierStatus, Get-TierProgress, Get-AllTierProgress

**Files:**
- `state/tiers/Set-TierStatus.ps1` (create)
- `state/tiers/Get-TierProgress.ps1` (create)
- `state/tiers/Get-AllTierProgress.ps1` (create)

**Description:**
Implement Stage 7 tier lifecycle tracking. `Set-TierStatus` enforces valid transitions (rejects passed→running, failed→pending, etc.), validates tier range, enforces sequential predecessor guard (P1d — all predecessors must be "passed" before StartTier), and supports the "Stage 7 entry" bulk initialization of all tiers to "pending" (guards all tiers = "none"). `Get-TierProgress` returns single tier status. `Get-AllTierProgress` returns all tiers.

**Dependencies:** Step 8

**Test (write first):**
- @unit: EnterStage7 — bulk-initializes all tiers to "pending" when all are "none".
- @unit: EnterStage7 — rejected when any tier is non-"none" (crash-resume blocks re-entry).
- @unit: EnterStage7 — idempotent call when already all-pending is rejected (not a no-op) (P3c).
- @unit: StartTier — transitions tier 1 from "pending" to "running".
- @unit: StartTier — tier 2 rejected when tier 1 is not "passed" (P1d — predecessor guard).
- @unit: StartTier — tier 2 allowed after tier 1 passes (predecessor satisfied).
- @unit: GatePass — transitions tier from "running" to "passed".
- @unit: GateFail — transitions tier from "running" to "failed".
- @unit: Set-TierStatus — passed→running transition rejected (invalid).
- @unit: Set-TierStatus — failed→pending transition rejected (invalid).
- @unit: Set-TierStatus — rejected for tier 0, negative, and above max tier.
- @unit: Get-AllTierProgress — returns all tiers with status.
- @unit: Get-TierProgress — returns empty when no tier_progress rows exist.
- @unit: CompleteStage7 — all tiers passing marks lastCompleted = MaxStage.

**TLA+ Coverage:**
- State: `tierStatus`
- Transition: `EnterStage7(f)`, `StartTier(f,t)`, `CompleteStage7(f)`
- Invariant: `S12 TierSequentialOrder`, `S16 HaltedNoRunningTiers` (prerequisite), `S21 NoneTierNoTasks`, `S22 RunningTierNoVerdict`

---

### Step 12: Task Results — Set-TaskResult, Get-TaskResult, Get-TierTaskResults

**Files:**
- `state/tasks/Set-TaskResult.ps1` (create)
- `state/tasks/Get-TaskResult.ps1` (create)
- `state/tasks/Get-TierTaskResults.ps1` (create)

**Description:**
Implement per-task coding outcome tracking. `Set-TaskResult` upserts task results with phase, status, counters JSON, escalation flag, error, and test files JSON. Enforces that the tier must be in "running" status (P1b — TLA+ CompleteTask guard: `tierStatus[f][t] = "running"`). Enforces MaxTasks limit per tier. `Get-TaskResult` returns a single task. `Get-TierTaskResults` returns all tasks for a tier.

**Dependencies:** Step 11

**Test (write first):**
- @unit: CompleteTask — upserts task result when tier is "running".
- @unit: CompleteTask — rejected when tier is not "running" (P1b — tier status guard).
- @unit: CompleteTask — rejected when tier is "pending" (not started yet).
- @unit: CompleteTask — rejected when tier is "passed" (already completed).
- @unit: Set-TaskResult — upsert updates existing task result fields.
- @unit: Set-TaskResult — stores counters as valid JSON (round-trip verified).
- @unit: Set-TaskResult — stores escalation flag boolean.
- @unit: Set-TaskResult — stores test file paths as JSON array.
- @unit: Get-TierTaskResults — returns all tasks for specified tier (filtered).
- @unit: Get-TierTaskResults — returns empty collection for tier with no tasks.
- @unit: CompleteTask — MaxTasks=1 boundary — single task completes, second rejected.
- @unit: CompleteTask — rejected when tier has reached MaxTasks ceiling.

**TLA+ Coverage:**
- State: `tierTasksDone`
- Transition: `CompleteTask(f,t)`
- Invariant: `S6 TierPassRequiresTasks`, `S13 TierFailRequiresTasks`

---

### Step 13: Merge Results — Set-MergeResult, Get-MergeResults

**Files:**
- `state/merges/Set-MergeResult.ps1` (create)
- `state/merges/Get-MergeResults.ps1` (create)

**Description:**
Implement merge outcome tracking. `Set-MergeResult` handles the full merge lifecycle: initiate (none→pending, guards: tasks > 0, tier running), resolve to success or conflict. On conflict, atomically fails the tier and halts the feature (cross-aggregate write with rollback). `Get-MergeResults` returns all merge results for a feature.

**Dependencies:** Step 12

**Test (write first):**
- @unit: StartMerge — rejected when tier has zero completed tasks (tierTasksDone = 0).
- @unit: StartMerge — rejected when tier is "pending" (S14 — mergeStatus "pending" requires tier "running").
- @unit: StartMerge — rejected when tier is "passed" or "failed" (invalid source state).
- @unit: StartMerge — sets mergeStatus to "pending" when tier is "running" and tasks > 0.
- @unit: CompleteMerge — transitions pending→merged.
- @unit: CompleteMerge — idempotent on already-merged tier is rejected (not a no-op) (P3c).
- @unit: MergeConflict — transitions pending→conflict and fails tier atomically.
- @unit: MergeConflict — halts feature atomically (S5 HaltedStateConsistent).
- @unit: Get-MergeResults — returns all merge results for feature.
- @unit: Get-MergeResults — returns empty collection when none exist.
- @unit: StartMerge — MaxTasks=1 — merge enabled after single task.
- @integration: MergeConflict — transaction rolls back on partial failure across tables.

**TLA+ Coverage:**
- State: `mergeStatus`
- Transition: `StartMerge(f,t)`, `CompleteMerge(f,t)`, `MergeConflict(f,t)`
- Invariant: `S14 MergeStatusConsistent`
- Property: `L5 MergeEventuallyResolves`

---

### Step 14: Gate Results — Set-GateResult, Get-GateResult, Get-GateResults

**Files:**
- `state/gates/Set-GateResult.ps1` (create)
- `state/gates/Get-GateResult.ps1` (create)
- `state/gates/Get-GateResults.ps1` (create)

**Description:**
Implement review gate verdict tracking. `Set-GateResult` enforces guards: tier must be running, tasks must exist, merge must be "merged" (S15). On "fail", atomically fails the tier and halts the feature. On "pass", transitions tier to "passed". `Get-GateResult` returns latest result. `Get-GateResults` returns all rounds.

**Dependencies:** Step 13

**Test (write first):**
- @unit: GatePass — records "pass" verdict and transitions tier to "passed".
- @unit: GatePass — stores created_at timestamp.
- @unit: Get-GateResults — returns multiple rounds for same gate type.
- @unit: Get-GateResult — returns $null for nonexistent gate.
- @unit: GatePass — rejected when tier has zero completed tasks (S6 TierPassRequiresTasks).
- @unit: GatePass — rejected when merge is not "merged" (S15 GateRequiresMerge).
- @unit: GatePass — rejected when merge is still "pending".
- @unit: GatePass — rejected when tier is "pending" (not started).
- @unit: GatePass — rejected when tier is already "passed" or "failed".
- @unit: GateFail — halts feature and fails tier atomically.

**TLA+ Coverage:**
- State: `gateVerdict`
- Transition: `GatePass(f,t)`, `GateFail(f,t)`
- Invariant: `S7 GateVerdictConsistent`, `S15 GateRequiresMerge`

---

### Step 15: ForceUnlock — Full HaltPipeline-Style Cleanup

**Files:**
- `state/lock/Unlock-PipelineState.ps1` (modify — add ForceUnlock cleanup logic)

**Description:**
Extend `Unlock-PipelineState` force-flag path with full HaltPipeline-style cleanup for running features: transition to "halted", fail pending debates, clean up tiers (running w/ tasks → failed, running w/o tasks → none, pending → none), reset pending merges. Non-running features get simple lock release. Clear activeFeature unconditionally. All cleanup wrapped in a single SQLite transaction with full rollback on failure (P2d).

**Dependencies:** Steps 7, 10, 11, 13

**Test (write first):**
- @unit: ForceUnlock — running feature transitions to "halted" and clears activeFeature.
- @unit: ForceUnlock — running feature fails all pending debates (consensus → "failed").
- @unit: ForceUnlock — running tier with tasks > 0 transitions to "failed" (S13 TierFailRequiresTasks).
- @unit: ForceUnlock — running tier with tasks = 0 transitions to "none" (S21 NoneTierNoTasks).
- @unit: ForceUnlock — pending tiers transition to "none" (S12 TierSequentialOrder cleanup).
- @unit: ForceUnlock — pending merges on running tiers reset to "none".
- @unit: ForceUnlock — preserves passed tiers and completed (merged) merge results.
- @unit: ForceUnlock — combined debate AND tier cleanup in single transaction.
- @unit: ForceUnlock — after halting, pipeline cannot auto-resume (feature is terminal).
- @unit: ForceUnlock — after halting, operator can clear and start new feature.
- @unit: ForceUnlock — completed feature preserves "complete" status (S18).
- @unit: ForceUnlock — rejected when no lock is held (lockHolder = NULL).
- @integration: ForceUnlock — transaction rolls back all changes on partial failure (P2d).

**TLA+ Coverage:**
- Transition: `ForceUnlock(f)` (complete)
- Invariant: `S5`, `S11`, `S12`, `S13`, `S16`, `S21` (all enforced by cleanup)
- Property: `L4 LockEventuallyReleased` (P4a — ForceUnlock releases lockHolder)

---

### Step 16: HaltPipeline — Cross-Aggregate Halt Cascade

**Files:**
- `state/runtime/Update-PipelineState.ps1` (modify — add halt cascade logic)

**Description:**
Extend `Update-PipelineState` to implement the HaltPipeline cross-aggregate atomic write when setting feature status to "halted": atomically fail pending debates, clean up running tiers (tasks > 0 → failed, tasks = 0 → none), reset pending tiers to none, reset pending merges on running tiers. All in a single SQLite transaction with full rollback on failure (P2d). HaltPipeline is idempotent: halting an already-halted feature is a safe no-op (P1e).

**Dependencies:** Steps 8, 10, 11, 13

**Test (write first):**
- @unit: HaltPipeline — fails pending debate rounds with consensus="failed".
- @unit: HaltPipeline — running tier with tasks > 0 transitions to "failed" (S13 TierFailRequiresTasks).
- @unit: HaltPipeline — running tier with tasks = 0 transitions to "none" (S21 NoneTierNoTasks).
- @unit: HaltPipeline — pending merge on running tier resets to "none".
- @unit: HaltPipeline — pending tiers transition to "none" (S12 TierSequentialOrder).
- @unit: HaltPipeline — preserves passed tiers and completed (merged) merge results.
- @unit: HaltPipeline — combined running-tier-with-pending-merge AND subsequent-pending-tiers cleanup.
- @unit: HaltPipeline — idempotent: halting already-halted feature is a no-op (P1e).
- @unit: HaltPipeline — rejected when feature is not running (guard: IsRunning(f)).
- @integration: HaltPipeline — transaction rolls back all changes on partial failure (P2d).

**TLA+ Coverage:**
- Transition: `HaltPipeline(f)`
- Invariant: `S5 HaltedStateConsistent`, `S16 HaltedNoRunningTiers`, `S12 TierSequentialOrder`, `S13 TierFailRequiresTasks`

---

### Step 17: Crash Recovery — ProcessCrash Composite Logic

**Files:**
- `state/lock/Unlock-PipelineState.ps1` (modify — crash recovery helpers if needed)
- `state/runtime/Update-PipelineState.ps1` (modify — crash recovery state transition)

**Description:**
Implement the crash recovery composite: running→idle for featureStatus, running→none for pipelineState, reset running tiers to "pending", zero tierTasksDone for reset tiers, reset all merge statuses to "none" on running tiers (including "merged"), preserve passed tiers/debate/stage progress/task results. Enforce crash budget (MaxCrashes). Preserve terminal statuses.

**Dependencies:** Steps 7, 8, 11, 12, 13

**Test (write first):**
- @unit: ProcessCrash — detects stale lock for crashed process via PID check.
- @unit: ProcessCrash — running feature resets to "idle" (featureStatus) and "none" (pipelineState).
- @unit: ProcessCrash — running tier resets to "pending" for resumption.
- @unit: ProcessCrash — resets tierTasksDone to 0 for running tiers (D2 phantom count fix).
- @unit: ProcessCrash — resets pending merge to "none" on running tier.
- @unit: ProcessCrash — resets "merged" merge-status to "none" on running tier (stale merge discard).
- @unit: ProcessCrash — preserves "passed" tier status.
- @unit: ProcessCrash — preserves completed merge results on passed tiers.
- @unit: ProcessCrash — preserves debate state (round + consensus) for resume.
- @unit: ProcessCrash — preserves stage progress (lastCompleted) for resume.
- @unit: ProcessCrash — crash budget exhausted refuses auto-resume and preserves lock state.
- @unit: ProcessCrash — MaxCrashes=1 boundary — first crash allows recovery, second refused.
- @unit: ProcessCrash — MaxCrashes=0 config validation rejected at module load.
- @unit: ProcessCrash — completed feature preserves "complete" status through crash.
- @unit: ProcessCrash — halted feature preserves "halted" status through crash.
- @unit: ProcessCrash — nonexistent feature produces terminating error.
- @unit: ProcessCrash — mid-Stage-7 resume skips EnterStage7, uses StartTier directly.
- @unit: ProcessCrash — stale running tier observable as "pending" and restartable after recovery.
- @integration: Full crash recovery sequence — all invariants hold post-recovery (S19, S9, S21).

**TLA+ Coverage:**
- Transition: `ProcessCrash(f)`
- Invariant: `S19 IdleStateConsistent`, `S20 CrashBudgetEnforced`
- Property: `L1 EventualTermination`, `L4 LockEventuallyReleased`

---

### Step 18: Pipeline Completion

**Files:**
- `state/runtime/Update-PipelineState.ps1` (modify — complete pipeline guard)

**Description:**
Extend `Update-PipelineState` to enforce the CompletePipeline guard: all MaxStage stages must be complete before allowing feature status transition to "complete". Atomically updates both featureStatus and pipelineState. Implement the full terminal lifecycle: release lock → clear active feature → close database.

**Dependencies:** Steps 5, 8

**Test (write first):**
- @unit: CompletePipeline — transitions featureStatus to "complete" when lastCompleted = MaxStage.
- @unit: CompletePipeline — rejected when lastCompleted < MaxStage (S4 NoCompletionWithoutAllStages).
- @unit: CompletePipeline — all tiers passed completes stage 7, then pipeline completes.
- @unit: CompletePipeline — after completion, active feature can be cleared and lock released.

**TLA+ Coverage:**
- Transition: `CompletePipeline(f)`
- Invariant: `S4 NoCompletionWithoutAllStages`, `S18 CompleteStateConsistent`
- Property: `L1 EventualTermination`, `L3 DatabaseEventuallyCloses`

---

### Step 19: Cross-Aggregate Integration Tests and Invalid-Transition Matrix

**Files:**
- `tests/state/halt-cascades.Tests.ps1` (create)
- `tests/state/invalid-transitions.Tests.ps1` (create)

**Description:**
Write integration-level tests for the cross-aggregate halt cascades that verify multiple invariants simultaneously: gate failure halts feature AND fails tier, merge conflict halts feature AND fails tier, debate failure halts feature AND marks consensus failed, combined scenarios with debate + tiers. Add exhaustive invalid-transition matrix test (P3b) that attempts every forbidden state transition and verifies rejection.

**Dependencies:** Steps 14, 16

**Test (write first):**
- @integration: Gate failure halts feature (S5) and fails tier (S7 GateVerdictConsistent).
- @integration: Merge conflict halts feature (S5) and fails tier with conflict status (S14).
- @integration: Debate failure halts feature with consensus="failed" and tiers remain "none".
- @integration: Invalid-transition matrix — all forbidden transitions rejected:
  - featureStatus: none→running, idle→complete, running→idle (without crash), halted→running, complete→running
  - tierStatus: none→running, pending→passed, passed→running, failed→pending, failed→running
  - mergeStatus: none→merged, pending→none (without crash/halt), merged→pending, conflict→merged
  - debateConsensus: none→reached, pending→none, reached→pending, failed→pending
  - lockHolder: acquire when already held, release when feature is running

**TLA+ Coverage:**
- Transition: `GateFail`, `MergeConflict`, `DebateFails`, `HaltPipeline`
- Invariant: `S5`, `S7`, `S14`, `S16`, `S17`

---

### Step 20: Module Loading and Gitignore

**Files:**
- `packages/vibe-cli/.gitignore` (modify — add vibe-state.db)
- `tests/state/module-loading.Tests.ps1` (create)

**Description:**
Add `vibe-state.db` to `.gitignore`. Write the module loading integration test that verifies all 34 functions are available after `Import-Module`. Write the AfterAll cleanup backstop test for orphaned temp .db files.

**Dependencies:** Steps 1–18

**Test (write first):**
- @integration: Import-Module makes all 34 repository functions available.
- @integration: AfterAll cleanup removes orphaned temp database files in $TestDrive.
- @integration: Fresh clone with no database file silently re-initializes on OpenDatabase.

**TLA+ Coverage:**
- (Infrastructure verification — validates the complete module)

---

### Step 21: Integration Wiring — vibe.ps1 and Stage Files

**Files:**
- `vibe.ps1` (modify — import module, Open/Close-StateDatabase)
- `stages/*.ps1` (modify — replace parameter-based state with repository calls)
- `utils/pipeline-lock.ps1` (delete)
- `utils/resolve-pipeline-state.ps1` (delete)
- `utils/resume.ps1` (delete)

**Description:**
Wire the state repository into the existing pipeline. Modify `vibe.ps1` to import the module at startup, call `Open-StateDatabase`, and `Close-StateDatabase` at shutdown. Replace all `Resolve-PipelineState` calls in stage files with repository function calls. Replace pipeline lock utilities with repository lock functions. Replace `STAGE_COMPLETE` markers in `pipeline-log.ps1` with `Set-StageComplete` calls. Delete legacy state management files. Split E2E tests into early and late checkpoints (P4b) for debuggability.

**Dependencies:** Steps 1–20

**Test (write first):**
- @integration (early checkpoint — Steps 1–10): Pipeline starts, opens database, creates feature, sets active feature, acquires lock, and completes stage 1 using only DB state.
- @integration (early checkpoint): Debate loop reads/writes debate_state through to consensus.
- @integration (late checkpoint — Steps 11–18): Stage 7 uses tier_progress, task_results, merge_results, gate_results through full tier lifecycle.
- @integration (late checkpoint): Pipeline completion transitions through complete status and releases lock.
- @e2e: Full pipeline run from feature creation to completion — all state changes persisted to DB, no legacy state files used.

**TLA+ Coverage:**
- All transitions wired to production code paths
- Property: `L1 EventualTermination`, `L3 DatabaseEventuallyCloses` (end-to-end)

---

## State Coverage Audit

All TLA+ states, transitions, and properties are covered by the implementation plan.

| Category | Item | Covered By |
|----------|------|------------|
| **States** | | |
| | dbOpen | Step 2 |
| | activeFeature | Step 4 |
| | featureStatus | Steps 3, 7, 8, 16, 17 |
| | lastCompleted | Step 5 |
| | lockHolder | Step 7 |
| | crashCount | Steps 7, 17 |
| | pipelineState | Steps 7, 8, 16, 17, 18 |
| | debateRound | Step 10 |
| | debateConsensus | Step 10 |
| | tierStatus | Step 11 |
| | tierTasksDone | Step 12 |
| | gateVerdict | Step 14 |
| | mergeStatus | Step 13 |
| **Transitions** | | |
| | OpenDatabase | Step 2 |
| | CloseDatabase | Step 2 |
| | CreateFeature | Step 3 |
| | SetActiveFeature | Step 4 |
| | ClearActiveFeature | Step 4 |
| | AcquireLock | Step 7 |
| | ReleaseLock | Step 7 |
| | ForceUnlock | Steps 7 (simple), 15 (full cleanup) |
| | ProcessCrash | Step 17 |
| | ExecuteStage | Step 5 (partial — stage completion) |
| | StartDebate | Step 10 |
| | AdvanceDebateRound | Step 10 |
| | DebateReachConsensus | Step 10 |
| | DebateFails | Step 10 |
| | EnterStage7 | Step 11 |
| | StartTier | Step 11 |
| | CompleteTask | Step 12 |
| | StartMerge | Step 13 |
| | CompleteMerge | Step 13 |
| | MergeConflict | Step 13 |
| | GatePass | Step 14 |
| | GateFail | Step 14 |
| | CompleteStage7 | Step 11 |
| | CompletePipeline | Step 18 |
| | HaltPipeline | Step 16 |
| **Safety Invariants** | | |
| | S1 SingleRunningFeature | Step 4 |
| | S2 LockExclusive | Step 7 |
| | S4 NoCompletionWithoutAllStages | Step 18 |
| | S5 HaltedStateConsistent | Steps 8, 16 |
| | S6 TierPassRequiresTasks | Step 12 |
| | S7 GateVerdictConsistent | Step 14, Step 19 |
| | S8 ActiveFeatureMustExist | Step 4 |
| | S9 RunningImpliesLockHeld | Step 7 |
| | S10 DbOpenWhenActive | Step 2 |
| | S11 DebateStageConsistency | Step 10 |
| | S12 TierSequentialOrder | Steps 11, 16 |
| | S13 TierFailRequiresTasks | Steps 12, 16 |
| | S14 MergeStatusConsistent | Step 13, Step 19 |
| | S15 GateRequiresMerge | Step 14 |
| | S16 HaltedNoRunningTiers | Step 16, Step 19 |
| | S17 RunningStateConsistent | Steps 7, 8, Step 19 |
| | S18 CompleteStateConsistent | Steps 8, 18 |
| | S19 IdleStateConsistent | Steps 8, 17 |
| | S20 CrashBudgetEnforced | Step 17 |
| | S21 NoneTierNoTasks | Steps 11, 15, 16 |
| | S22 RunningTierNoVerdict | Steps 11, 14 |
| | S23 NoneStateConsistent | Step 8 |
| **Liveness Properties** | | |
| | L1 EventualTermination | Steps 17, 18, 21 |
| | L2 DebateTermination | Step 10 |
| | L3 DatabaseEventuallyCloses | Steps 2, 18, 21 |
| | L4 LockEventuallyReleased | Steps 7, 15, 17 |
| | L5 MergeEventuallyResolves | Step 13 |
| | L6 StageNeverDecreases | Step 5 |

---

## Execution Tiers

### Tier 1: Foundation

| Task ID | Step | Title |
|---------|------|-------|
| T1 | Step 1 | SQL Schema, Module Manifest, and Test Helpers |

### Tier 2: Database Lifecycle (depends on Tier 1)

| Task ID | Step | Title |
|---------|------|-------|
| T2 | Step 2 | Connection — Open/Close Database |

### Tier 3: Core Domain Entities (depends on Tier 2)

| Task ID | Step | Title |
|---------|------|-------|
| T3 | Step 3 | Features — New/Get/GetAll |

### Tier 4: Session and Basic CRUD (depends on Tier 3)

| Task ID | Step | Title |
|---------|------|-------|
| T4 | Step 4 | Session — Set/Get/Clear ActiveFeature |
| T5 | Step 5 | Stage Progress — Set/Get |
| T6 | Step 6 | Artifacts — Register/Get |
| T7 | Step 8 | Pipeline State — Update/Get |
| T8 | Step 9 | Stage Outputs — Set/Get |

### Tier 5: Locking and Debate (depends on Tier 4)

| Task ID | Step | Title |
|---------|------|-------|
| T9 | Step 7 | Pipeline Lock — Lock/Unlock/Get/AddCrash |
| T10 | Step 10 | Debate State — Update/Get/GetHistory |

### Tier 6: Stage 7 Domain (depends on Tier 5)

| Task ID | Step | Title |
|---------|------|-------|
| T11 | Step 11 | Tier Progress — Set/Get/GetAll |

### Tier 7: Task and Merge Layer (depends on Tier 6)

| Task ID | Step | Title |
|---------|------|-------|
| T12 | Step 12 | Task Results — Set/Get/GetTier |
| T13 | Step 13 | Merge Results — Set/Get |

### Tier 8: Gate Layer (depends on Tier 7)

| Task ID | Step | Title |
|---------|------|-------|
| T14 | Step 14 | Gate Results — Set/Get/GetAll |

### Tier 9: Cross-Aggregate Composite Actions (depends on Tiers 5–8)

| Task ID | Step | Title |
|---------|------|-------|
| T15 | Step 15 | ForceUnlock — Full Cleanup |
| T16 | Step 16 | HaltPipeline — Halt Cascade |
| T17 | Step 17 | Crash Recovery — ProcessCrash |
| T18 | Step 18 | Pipeline Completion |

### Tier 10: Integration and Wiring (depends on Tier 9)

| Task ID | Step | Title |
|---------|------|-------|
| T19 | Step 19 | Cross-Aggregate Integration Tests and Invalid-Transition Matrix |
| T20 | Step 20 | Module Loading and Gitignore |

### Tier 11: Production Wiring (depends on Tier 10)

| Task ID | Step | Title |
|---------|------|-------|
| T21 | Step 21 | Integration Wiring — vibe.ps1 and Stage Files |

---

## Task Assignment Table

| Task ID | Title | Tier | Code Writer | Test Writer | Dependencies | Rationale |
|---------|-------|------|-------------|-------------|--------------|-----------|
| T1 | SQL Schema, Module Manifest, and Test Helpers | 1 | powershell-writer | pester-writer | None | SQL + PS module manifest + test infrastructure — PowerShell domain |
| T2 | Connection — Open/Close Database | 2 | powershell-writer | pester-writer | T1 | PSSQLite integration, PRAGMA setup, module-scoped connection |
| T3 | Features — New/Get/GetAll | 3 | powershell-writer | pester-writer | T2 | Pure PowerShell CRUD against SQLite with injection guard |
| T4 | Session — Set/Get/Clear ActiveFeature | 4 | powershell-writer | pester-writer | T3 | PowerShell with business rule guards |
| T5 | Stage Progress — Set/Get | 4 | powershell-writer | pester-writer | T3 | PowerShell with lockHolder/IsRunning guards and sequential enforcement |
| T6 | Artifacts — Register/Get | 4 | powershell-writer | pester-writer | T3 | Pure PowerShell CRUD |
| T7 | Pipeline State — Update/Get | 4 | powershell-writer | pester-writer | T3 | PowerShell with denormalization sync |
| T8 | Stage Outputs — Set/Get | 4 | powershell-writer | pester-writer | T3 | PowerShell JSON storage CRUD |
| T9 | Pipeline Lock — Lock/Unlock/Get/AddCrash | 5 | powershell-writer | pester-writer | T4 | Cross-aggregate atomic transaction + PID check |
| T10 | Debate State — Update/Get/GetHistory | 5 | powershell-writer | pester-writer | T7 | PowerShell with IsRunning/lockHolder guards and debate lifecycle |
| T11 | Tier Progress — Set/Get/GetAll | 6 | powershell-writer | pester-writer | T7 | PowerShell tier state machine with predecessor guard |
| T12 | Task Results — Set/Get/GetTier | 7 | powershell-writer | pester-writer | T11 | PowerShell CRUD + tier-running guard + MaxTasks enforcement |
| T13 | Merge Results — Set/Get | 7 | powershell-writer | pester-writer | T12 | Cross-aggregate conflict→halt cascade with rollback |
| T14 | Gate Results — Set/Get/GetAll | 8 | powershell-writer | pester-writer | T13 | Gate guards requiring merge + tasks |
| T15 | ForceUnlock — Full Cleanup | 9 | powershell-writer | pester-writer | T9, T10, T11, T13 | Cross-aggregate HaltPipeline-style cleanup with rollback |
| T16 | HaltPipeline — Halt Cascade | 9 | powershell-writer | pester-writer | T7, T10, T11, T13 | Cross-aggregate atomic halt with idempotency |
| T17 | Crash Recovery — ProcessCrash | 9 | powershell-writer | pester-writer | T9, T7, T11, T12, T13 | Composite crash recovery logic |
| T18 | Pipeline Completion | 9 | powershell-writer | pester-writer | T5, T7 | Completion guard + status sync |
| T19 | Integration Tests and Invalid-Transition Matrix | 10 | powershell-writer | pester-writer | T14, T16 | Integration-level invariant verification + exhaustive transition matrix |
| T20 | Module Loading and Gitignore | 10 | powershell-writer | pester-writer | T1–T18 | Module completeness validation |
| T21 | Integration Wiring — vibe.ps1 + Stages | 11 | powershell-writer | pester-writer | T19, T20 | Production wiring + legacy cleanup + early/late E2E checkpoints |
