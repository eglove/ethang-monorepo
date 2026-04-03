# TLA+ Specification: Global Pipeline State File

## Source
Briefing: `docs/questioner-sessions/2026-04-02_global-pipeline-state.md`
Debate (design): `docs/debate-moderator-sessions/2026-04-02_global-pipeline-state-design.md`
Debate (TLA+ review): `docs/debate-moderator-sessions/2026-04-02_global-pipeline-state-tla-review.md`

## Specification
- **Module:** `GlobalPipelineState.tla`
- **Config (small):** `MC.cfg` (4 stages, 2 runs)
- **Config (production):** `MC_Full.cfg` (6 stages, 2 runs)
- **Model checking module:** `MC.tla`

## States

### File Lifecycle (Machine 1)
- **ABSENT** — file does not exist (before first pipeline run)
- **CLEARED** — template written with section headers and empty values
- **ACCUMULATING** — at least one stage has written its StageResult
- **COMPLETE_SNAPSHOT** — pipeline completed successfully
- **HALTED_SNAPSHOT** — pipeline halted due to failure

### Section States (Machine 2)
- **EMPTY** — section header present, no content
- **WRITTEN** — populated by owning stage
- **VALIDATED** — validated by a subsequent stage before writing

### Git States (Machine 3)
- **CLEAN** — no uncommitted changes
- **DIRTY** — state file has uncommitted changes
- **COMMITTED** — terminal state committed to git

## Properties Verified

### Safety (10 Invariants)
- **TypeOK** — all variables remain within their declared domains
- **SectionOwnership** — each stage's section is written only by its owning stage (writtenBy[s] is 0 or s)
- **NoStageSkip** — stage N is written only after all stages 1..(N-1) are written
- **ClearOnStart** — when a run is active, all unwritten sections are EMPTY (no stale data)
- **FailFastOnClearFailure** — if the clear operation fails, the pipeline does not start
- **SchemaValidationInvariant** — when a stage writes, all prior stages are populated
- **TerminalStateOnlyCommit** — state file is committed only at COMPLETE_SNAPSHOT or HALTED_SNAPSHOT
- **UncommittedWarningProtocol** — warned is only TRUE when gitState is DIRTY or COMMITTED (warning must precede clearing)
- **ClearedSectionsEmpty** — when fileState is CLEARED, every section is EMPTY (documents the meaning of the CLEARED state)
- **HaltedConsistency** — `halted = TRUE` if and only if `fileState = "HALTED_SNAPSHOT"` (prevents the redundant boolean from diverging)

### Liveness
- **Progress** — if a pipeline run starts (CLEARED), it eventually reaches COMPLETE_SNAPSHOT or HALTED_SNAPSHOT
- **EventualCommit** — if the file reaches a terminal state, it is eventually committed

## Design Decisions

### MaxRuns = 2 is sufficient
`ClearStateFile` resets all state variables (sections, writtenBy, currentStage, halted, warned) to their initial values. The system is memoryless between runs — no state carries over from run N to run N+1 except `runCount`, `fileState`, and `gitState`. Two runs are enough to exercise the full clear-then-run cycle including the second run's interaction with prior git state (DIRTY/COMMITTED/CLEAN from the first run).

### clearFailed = TRUE is an intentional deadlock
When `ClearStateFile` fails non-deterministically, `clearFailed` is set to TRUE and no further actions are enabled (the pipeline cannot start, and no action resets `clearFailed`). This models a **fail-fast** design: if the state file cannot be cleared, the pipeline stops immediately and requires human intervention. TLC's `CHECK_DEADLOCK FALSE` setting acknowledges this as intentional.

## TLC Results

### Small model (4 stages, 2 runs)
- **States generated:** 910
- **Distinct states:** 467
- **Depth:** 20
- **Result:** PASS (10 invariants, 2 liveness properties)
- **Workers:** 4

### Production model (6 stages, 2 runs)
- **States generated:** 4,206
- **Distinct states:** 1,907
- **Depth:** 26
- **Result:** PASS (10 invariants, 2 liveness properties)
- **Workers:** 4

- **Date:** 2026-04-02 (v2 — post-review revision)

## Prior Versions
None (v1 was same directory, superseded by review feedback)
