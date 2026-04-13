# Elicitor Session — SQLite State Repository

**Date:** 2026-04-12
**Status:** COMPLETE
**Feature:** sqlite-state

---

## CRITICAL! USER NOTE! (UPDATE TO BELOW DOCUMENTATION!)
Config values around timers and retries have been removed. This is intentional! All have been replaced by the user ability to stop the pipeline at any point manually.
Anything regarding the old retry/timers in config below is now irrelevant! There is no need to account for timers or retries. Steps may continue to run as long as they need.
This is NOT negotiable! Experts may NOT add timers or retries to the plan! config.ps1 has already been completely removed.
TLA+ writer needs these for a complete spec, the vibe-cli will NOT use them.

## Purpose
Eliminate scattered file-based state management (pipeline.log markers, pipeline.lock, in-memory hashtables, parameter passing) in vibe-cli. Replace with a centralized SQLite database and repository module to reduce maintenance lead time and increase reliability of changes.

## Artifact / Output Type
A PowerShell module (`state-repository`) with one-function-per-file organized by domain, a SQL schema file, and modifications to all pipeline stages and utilities to use the repository instead of file/parameter-based state.

## Trigger
Every pipeline invocation — `Open-StateDatabase` is called at the top of `vibe.ps1` and initializes the database (creates tables via `CREATE TABLE IF NOT EXISTS` if they don't exist).

## Inputs
- Pipeline execution context (feature name, stage progression, runtime state)
- Structured JSON outputs from agents (implementation plans, debate moderator results, target root)
- Stage artifact file paths
- Lock metadata (PID, startTime, crashCount)
- Debate round state and moderator JSON
- Stage 7 coding state (tier progress, task results, merge results, gate results)

## Outputs
- `vibe-state.db` — single SQLite database file at `packages/vibe-cli/` root (gitignored)
- 12 tables: `session`, `features`, `stage_progress`, `artifacts`, `pipeline_lock`, `pipeline_state`, `stage_outputs`, `debate_state`, `tier_progress`, `task_results`, `merge_results`, `gate_results`
- Repository functions accessible via `Import-Module ./state/state-repository.psd1`

## Ecosystem Placement
Internal to vibe-cli. The state module is consumed by `vibe.ps1`, all stage files, debate loop utilities, and Stage 7 coding substages. No external consumers.

## Handoff
None — the database is the terminal state store. Downstream stages and functions read from it directly via repository functions.

## Error States
- **PSSQLite not installed:** Fail with clear error message: "PSSQLite module required. Run: Install-Module PSSQLite"
- **Corrupt database:** Fail fast with error suggesting deletion of `vibe-state.db` and restart
- **Disk full:** Fail fast, crash budget handles retry on re-run
- **Feature name collision:** Error requiring a unique feature name
- **Any DB query failure:** Fail fast (terminating error), no retries or fallbacks

## Name
`state-repository` (module name), `vibe-state.db` (database file)

## Scope

### In scope
- New `state/` directory with 11 subdirectories, one function per file
- `schema.sql` with all 12 table definitions using `CREATE TABLE IF NOT EXISTS`
- Module manifest (`.psd1`) and loader (`.psm1`) that dot-sources all function files
- Session table with `active_feature` — eliminates feature name parameter passing
- All runtime state persisted to SQLite (no in-memory `$State` hashtable)
- Structured JSON stored in `stage_outputs` table (implementation plans, target root) and `debate_state` table (moderator JSON)
- Stage 7 state: `tier_progress`, `task_results`, `merge_results`, `gate_results` tables
- System mutex retained for cross-process coordination; lock metadata moves to `pipeline_lock` table
- Delete legacy files: `utils/pipeline-lock.ps1`, `utils/resolve-pipeline-state.ps1`, `utils/resume.ps1`
- Remove `STAGE_COMPLETE` markers from `pipeline-log.ps1` (stage completion is now a DB write)
- Modify `vibe.ps1` to import module, open/close DB
- Modify all stage files to use repository functions instead of parameters and `Resolve-PipelineState`
- Modify debate loops to read/write state directly from DB
- Add `vibe-state.db` to `packages/vibe-cli/.gitignore`
- Unit tests with `:memory:` SQLite, integration/e2e tests with temp `.db` files cleaned up after
- Test directory mirrors source structure: `tests/state/connection/`, `tests/state/session/`, etc.
- If `invoke-claude.ps1`, `invoke-parallel.ps1`, or debate loops reference anything beyond config maxes, update them to use the repository

### Out of scope
- Schema versioning or migration system
- Multi-user or remote database support
- Moving config to SQLite
- Changing artifact file formats (`.md`, `.feature`, `.tla`, `.json` files stay on disk)
- Changing agent markdown prompt files
- Changing text logging (`pipeline-log.ps1` keeps human-readable log)
- Changing `task-log.ps1` per-task logging
- Migration or seeding from existing pipeline runs (clean break, start fresh)

## Edge Cases
- **First run:** DB file doesn't exist — PSSQLite creates it, `schema.sql` creates all tables
- **Subsequent runs:** `CREATE TABLE IF NOT EXISTS` is a no-op, DB ready immediately
- **DB deleted manually:** Same as first run — fully re-initialized
- **Resume mid-debate:** `Get-DebateHistory` returns all prior rounds, debate loop continues from last round
- **Resume mid-Stage-7:** `Get-AllTierProgress`, `Get-TierTaskResults`, `Get-GateResults` reconstruct exact position
- **Process crash:** System mutex released by OS; stale lock detected via PID/startTime check in `pipeline_lock` table; crash count incremented
- **Concurrent pipeline invocation:** System mutex prevents concurrent runs; single `session.active_feature` enforces one feature at a time

## Directory Structure

```
packages/vibe-cli/
├── vibe-state.db                          # SQLite database (gitignored)
├── state/
│   ├── state-repository.psd1             # Module manifest
│   ├── state-repository.psm1             # Dot-sources all function files
│   ├── schema.sql                         # All CREATE TABLE IF NOT EXISTS
│   ├── connection/
│   │   ├── Open-StateDatabase.ps1         # Init connection, run schema, check PSSQLite
│   │   └── Close-StateDatabase.ps1        # Close connection
│   ├── session/
│   │   ├── Set-ActiveFeature.ps1          # Upsert active feature (single row)
│   │   ├── Get-ActiveFeature.ps1          # Return current feature name
│   │   └── Clear-ActiveFeature.ps1        # Null out on completion
│   ├── features/
│   │   ├── New-Feature.ps1                # Insert feature (error if exists)
│   │   ├── Get-Feature.ps1                # Return feature row
│   │   └── Get-AllFeatures.ps1            # List all features
│   ├── progress/
│   │   ├── Set-StageComplete.ps1          # Mark stage done
│   │   └── Get-LastCompletedStage.ps1     # Return highest completed stage
│   ├── artifacts/
│   │   ├── Register-Artifact.ps1          # Store file path reference
│   │   └── Get-Artifacts.ps1              # Return artifact paths (optionally from stage N)
│   ├── lock/
│   │   ├── Lock-PipelineState.ps1         # Acquire lock (write PID/startTime)
│   │   ├── Unlock-PipelineState.ps1       # Release lock
│   │   ├── Get-PipelineLockState.ps1      # Check lock status
│   │   └── Add-CrashCount.ps1            # Increment crash counter
│   ├── runtime/
│   │   ├── Update-PipelineState.ps1       # Update typed columns (verdict, reviewRound, etc.)
│   │   └── Get-PipelineState.ps1          # Return full runtime state
│   ├── outputs/
│   │   ├── Set-StageOutput.ps1            # Store structured JSON by type
│   │   └── Get-StageOutput.ps1            # Retrieve parsed object by type
│   ├── debate/
│   │   ├── Update-DebateState.ps1         # Write debate round state
│   │   ├── Get-DebateState.ps1            # Latest round for a stage
│   │   └── Get-DebateHistory.ps1          # All rounds for a debate
│   ├── tiers/
│   │   ├── Set-TierStatus.ps1             # Update tier progress
│   │   ├── Get-TierProgress.ps1           # Single tier status
│   │   └── Get-AllTierProgress.ps1        # All tiers
│   ├── tasks/
│   │   ├── Set-TaskResult.ps1             # Upsert task result
│   │   ├── Get-TaskResult.ps1             # Single task
│   │   └── Get-TierTaskResults.ps1        # All tasks in a tier
│   ├── merges/
│   │   ├── Set-MergeResult.ps1            # Write merge outcome
│   │   └── Get-MergeResults.ps1           # All merge results
│   └── gates/
│       ├── Set-GateResult.ps1             # Write gate outcome
│       ├── Get-GateResult.ps1             # Latest result for a gate type
│       └── Get-GateResults.ps1            # All rounds for a gate type
```

## Schema (12 tables)

### session
- `id` INTEGER PK (always 1), `active_feature` TEXT, `started_at` TEXT

### features
- `name` TEXT PK, `created_at` TEXT, `status` TEXT (idle/running/complete/halted)

### stage_progress
- `feature_name` TEXT FK, `stage` INTEGER, `completed_at` TEXT

### pipeline_lock
- `feature_name` TEXT, `pid` INTEGER, `start_time` TEXT, `crash_count` INTEGER, `locked_at` TEXT

### artifacts
- `feature_name` TEXT FK, `stage` INTEGER, `artifact_type` TEXT, `file_path` TEXT

### pipeline_state
- `feature_name` TEXT FK, `pipeline_state` TEXT, `lock_holder` INTEGER, `review_round` INTEGER, `keep_going_resets` INTEGER, `tdd_keep_going_count` INTEGER, `verdict` TEXT, `tasks_done` INTEGER, `review_gate_type` TEXT

### stage_outputs
- `feature_name` TEXT FK, `stage` INTEGER, `output_type` TEXT, `json_data` TEXT, `created_at` TEXT

### debate_state
- `id` INTEGER PK, `feature_name` TEXT FK, `stage` INTEGER, `round` INTEGER, `consensus_status` TEXT, `moderator_json` TEXT, `created_at` TEXT

### tier_progress
- `feature_name` TEXT FK, `tier` INTEGER, `status` TEXT, `completed_at` TEXT

### task_results
- `id` INTEGER PK, `feature_name` TEXT FK, `task_id` TEXT, `tier` INTEGER, `phase` TEXT, `status` TEXT, `counters_json` TEXT, `escalated` INTEGER, `error` TEXT, `test_files_json` TEXT

### merge_results
- `id` INTEGER PK, `feature_name` TEXT FK, `task_id` TEXT, `status` TEXT, `checkpoint` TEXT, `conflict` INTEGER

### gate_results
- `id` INTEGER PK, `feature_name` TEXT FK, `gate_type` TEXT, `task_id` TEXT, `status` TEXT, `round` INTEGER, `verdict_json` TEXT, `created_at` TEXT

## Dependency
- **PSSQLite** PowerShell module (must be installed: `Install-Module PSSQLite`). Pipeline fails with clear message if missing.

## Notes
- All features MUST be complete and fully wired up to the rest of the program. No partial implementations or dead code paths.
- Every feature MUST include unit tests, integration tests, and end-to-end (e2e) tests.
- The final task for this feature is to review completeness: verify all e2e and integration tests pass, and confirm the feature is fully wired into the application.

---

## Open Questions
None.
