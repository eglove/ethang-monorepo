# Implementation Plan: Coding Stage Orchestrator

## Source Artifacts

| Artifact | Path |
|----------|------|
| TLA+ Specification | `docs/coding-stage/tla/CodingStage.tla` |
| BDD Scenarios | `docs/coding-stage/bdd.feature` |
| BDD Debate | `docs/coding-stage/bdd-debate.md` |
| TLA+ Debate | `docs/coding-stage/tla-debate.md` |
| Implementation Debate (round 1) | `docs/coding-stage/impl-debate.md` |
| Implementation Debate (round 2) | `docs/coding-stage/impl-debate-2.md` |
| Implementation Debate (round 3) | `docs/coding-stage/impl-debate-3.md` |
| Implementation Debate (round 4) | `docs/coding-stage/impl-debate-4.md` |
| Implementation Debate (round 5) | `docs/coding-stage/impl-debate-5.md` |
| Elicitor Briefing | `docs/coding-stage/elicitor.md` |

## Debate Objection Resolution Log

### Round 1 (impl-debate.md)

| # | Severity | Objection | Resolution |
|---|----------|-----------|------------|
| 1 | BLOCKING | All .ps1 tasks assigned typescript-writer/vitest-writer | Changed all code writers to powershell-writer, all test writers to pester-writer |
| 2 | BLOCKING | T3 references nonexistent trainer-writer | Changed T4 codeWriter to agent-writer (creates Claude Code agent artifacts) |
| 3 | BLOCKING | No PowerShell parallelism mechanism | Added Step 2 (Thread-Safe Logging) with named mutex; Step 15 specifies `Start-ThreadJob` for intra-tier dispatch with error propagation and variable scoping rules |
| 4 | HIGH | T14 in Tier 4 with only T1 dependency races T13 | Moved T14 to Tier 2; T15 now depends on T14 |
| 5 | HIGH | T6 mutates counter state across 6+ aggregates | Redesigned: `Read-Escalation` returns decision hashtable; phase modules own their counter resets via exported reset functions |
| 6 | HIGH | pipeline.log concurrent writes not atomic | New Step 2 adds `Write-ThreadSafeLog` with `[System.Threading.Mutex]` wrapper around `Add-Content` |
| 7 | HIGH | Counter boundary tests missing | Added boundary assertions to Steps 8, 9, 10, 12, 13: verify Invoke-Claude NOT called when counter equals max |
| 8 | HIGH | Step 16 missing integration scenarios | Added 22 scenarios covering all objections from all 3 debate rounds |
| 9 | MODERATE | T16 assigned TDD writers but IS the test | Changed T16 to test-only task: codeWriter null, testWriter pester-writer |
| 10 | MODERATE | Cleanup verify short-circuit vs run-all unspecified | Specified: short-circuit on first failure (matches TLA+ `CleanupFail` which triggers on any single command failure) |
| 11 | MODERATE | EscalationKeepGoingMerge leaves mergeInProgress set | Added explicit test: after KeepGoing, verify mergeRetries reset, task status restored to completed, and subsequent StartMerge/MergeSuccess completes the merge |
| 12 | MODERATE | Mid-tier resume after EscalationStop not specified | Step 14 now includes partial-tier resume: `Resolve-PipelineState -FromStage 8` detects completed tasks via ticket logs, resumes from the failed tier (not tier 1), and skips already-merged tasks to avoid workspace collisions |

### Round 2 (impl-debate-2.md)

| # | Severity | Objection | Resolution |
|---|----------|-----------|------------|
| 13 | BLOCKING | No thread job timeout -- `Wait-Job` has no timeout, hung Invoke-Claude blocks pipeline forever (violates L1 EventuallyTerminates) | Added `$Config.JobTimeoutSeconds` (600). Step 2 adds `Invoke-WithTimeout` helper wrapping `Start-ThreadJob` + `Wait-Job -Timeout`. Timed-out jobs are killed via `Stop-ProcessTree` + `Stop-Job` + `Remove-Job -Force`. Timed-out tasks escalate as infrastructure failure. Step 15 uses `Invoke-WithTimeout` for all task dispatch. |
| 14 | BLOCKING | No `git merge --abort` between merge conflict retries -- failed resolution leaves dirty working tree state that corrupts subsequent retries | Step 12 now specifies `git merge --abort` after conflict detection and before every resolver dispatch. Added test asserting abort-resolve-retry cycle for consecutive conflicts. |
| 15 | BLOCKING | No dirty merge state cleanup on resume -- `EscalationStop` during `MergeExhausted` leaves conflict markers; `Resolve-PipelineState` does not detect or clean this | Step 14 now detects dirty merge state via `git diff --name-only --diff-filter=U` in worktrees, runs `git merge --abort`, records affected tasks in `DirtyMergeCleanedTasks`. Unrecoverable worktrees reported in `UnrecoverableWorktrees`. |
| 16 | BLOCKING | `Reset-TaskCounters` violates bounded context -- centralizes knowledge of every phase's counter structure; each phase should export own reset function | Eliminated `Reset-TaskCounters`. Each phase module (Steps 8-13) exports its own `Reset-*Counters` function. Step 7 documents the dispatch table; Step 15 orchestrator holds the `Source+Phase -> function` mapping. |
| 17 | HIGH | Empty tier 1 path not tested -- plan where tier 1 has no tasks but NumTiers > 0 could deadlock | Added integration Scenario 12: empty tier 1 with tasks in tier 2. Asserts `SkipEmptyTier` fires and tier 2 tasks execute. |
| 18 | HIGH | `EscalationKeepGoing` taskPhase preservation not tested -- after infra failure recovery, task must resume in same phase (UNCHANGED taskPhase) | Added explicit test in Step 7 and integration Scenario 13: after infrastructure failure in GREEN, KeepGoing preserves `taskPhase = "green"`. |
| 19 | HIGH | Rollback failure during workspace atomic rollback unhandled -- `git worktree remove` failure during rollback orphans worktrees | Step 6 now specifies best-effort rollback: each removal in try/catch, failures logged but not thrown. Exception includes `OrphanedWorktrees` property for user cleanup. |
| 20 | HIGH | Thread job re-dispatch after escalation recovery not specified -- how recovered tasks re-execute is undefined | Step 15 now specifies: after KeepGoing, orchestrator starts NEW thread job resuming from `taskPhase` (not RED). Phase functions support mid-phase resume. |
| 21 | HIGH | `Read-Escalation` must never be called from thread jobs -- `Read-Host` incompatible with background threads, constraint is implicit not tested | Step 7 adds `IsThreadPoolThread` guard: throws `InvalidOperationException` if called from thread pool. Thread jobs return escalation result hashtable. |
| 22 | HIGH | No `WF_vars(ValidationFails)` fairness constraint in TLA+ spec -- validation can stay pending forever in model checking | TLA+ spec gap (does not affect implementation). `Test-ImplementationPlan` is synchronous. Noted in coverage audit. |
| 23 | HIGH | `SkipEmptyTier` can overshoot NumTiers violating TypeOK -- multiple trailing empty tiers push `currentTier` beyond NumTiers+1 | Step 15 adds bounded skip loop: `while ($currentTier <= $NumTiers -and empty) { $currentTier++ }`. Test asserts 3 trailing empty tiers handled. |
| 24 | HIGH | Escalation recovery lacks idempotency -- duplicate resume invocations could re-dispatch completed tasks | Step 7 adds idempotency guard: checks task status before prompting. Step 15 checks before re-dispatch. Returns `Decision = "NoOp"` for already-recovered tasks. |
| 25 | HIGH | Orchestrator/phase state transition atomicity unspecified -- partial failure between module writes creates inconsistent state | Step 15 specifies atomic state snapshot: thread jobs receive immutable state copy, return `TaskResult` hashtable. Orchestrator applies changes in synchronized block. Crashed jobs leave state unchanged. |

### Round 3 (impl-debate-3.md)

| # | Severity | Objection | Resolution |
|---|----------|-----------|------------|
| 26 | BLOCKING | Child process orphaning on timeout -- `Stop-Job` kills thread job but NOT claude CLI child process tree on Windows | Step 2b `Invoke-WithTimeout` now uses `Stop-ProcessTree` helper: discovers child PIDs via `Get-CimInstance Win32_Process -Filter "ParentProcessId=$pid"` recursively, kills leaf-to-root with `Stop-Process -Force`, then calls `Stop-Job`. Test asserts child process tree killed. |
| 27 | HIGH | Missing escalation routing guard for `taskPhase=done` -- merge-escalated task misrouted through task escalation | Step 7 `Read-Escalation` adds explicit routing: if `taskPhase = "done"` and `Source = "task"`, reroute to `Source = "merge"`. Step 15 orchestrator checks `mergeInProgress` before task escalation dispatch. Test asserts done-phase task routes to merge path. |
| 28 | HIGH | Stale `mergeInProgress` pointer on resume -- `EscalationStop` preserves `mergeInProgress` but may clean up the referenced workspace | Step 14 `Resolve-PipelineState` detects stale `mergeInProgress`: if task's workspace no longer exists or task status is `"skipped"`, clears `mergeInProgress` to 0 and logs the cleanup. Added to `$state.StaleMergeCleared`. |
| 29 | HIGH | Writer attribution ambiguity in final verification -- no tie-breaking rule when failure spans files from multiple tasks | Step 13 specifies tie-breaking algorithm: (1) count modified files per task in the failure diff, (2) task with most files wins, (3) on tie, lowest task ID wins. Deterministic and auditable. |
| 30 | HIGH | No per-task timeout configurability -- global 600s may kill legitimate multi-retry TDD tasks | Step 1 adds `$Config.TaskTimeouts` hashtable with per-writer-type overrides (e.g., `@{ "powershell-writer" = 600; "typescript-writer" = 900 }`). Step 2b `Invoke-WithTimeout` resolves timeout from task's writer type, falling back to `$Config.JobTimeoutSeconds`. |
| 31 | HIGH | No test for concurrent writer file conflicts -- mutex serialization for overlapping file sets untested | Step 16 adds Scenario 18: two tasks in same tier modify overlapping files. Asserts merge conflict detected and resolved, or (if file-overlap validation enabled) warning logged during plan validation. |
| 32 | HIGH | `ScriptBlock::Create` for verify commands is injection vector if config is user-customizable | Step 1 validates verify commands against allowlist regex pattern (`^[a-zA-Z0-9_./-]+(\s+[a-zA-Z0-9_./-]+)*$`). All verify command execution uses `Invoke-VerifyCommand` wrapper with allowlist check and array-based `& $cmd[0] @args` invocation -- never `ScriptBlock::Create` or `Invoke-Expression`. |
| 33 | MODERATE | Cleanup phase missing infrastructure failure test (exit 127) | Step 10 tests add: mock verify command returns exit 127 during cleanup, assert task escalated as infrastructure failure with `cleanupRemediations` unchanged. |
| 34 | MODERATE | Mutex mock feasibility -- Pester cannot mock .NET types directly | Step 2a adds `New-PipelineMutex` wrapper function that creates and returns the mutex. Tests mock `New-PipelineMutex` instead of `[System.Threading.Mutex]` directly. |
| 35 | MODERATE | `CleanupExhausted` from `cleanup_remed` phase not tested | Step 10 tests add: set `cleanupRemediations` to `MaxFixRounds` while in `cleanup_remed` phase, assert returns `"escalated"` without dispatching another fix. |
| 36 | MODERATE | `EscalationStop` workspace cleanup must use pre-mutation task status snapshot | Step 7 returns `PreStopSnapshot` key on Stop decision. Step 15 captures `$preStopSnapshot = $taskStatus.Clone()` BEFORE mutating task statuses to `"skipped"`. Workspace cleanup decisions use `$preStopSnapshot`. |
| 37 | MODERATE | `AbandonedMutexException` not handled in `Write-ThreadSafeLog` | Step 2a catches `[System.Threading.AbandonedMutexException]` -- acquires ownership, writes log line, releases normally. Warning logged to secondary file. |
| 38 | MODERATE | No file-overlap validation warning for same-tier tasks | Step 5 `Test-ImplementationPlan` adds advisory warning (not blocking error) when two tasks in the same tier reference the same file. Warnings array in `ConvertTo-ValidationResult`. |
| 39 | MODERATE | Escalation loop not re-entrant for new escalations during resolution | Step 15 orchestrator uses a `$PendingEscalations` queue. New escalations arriving during `Read-Escalation` are enqueued. Loop checks queue after each resolution. |
| 40 | MODERATE | Stderr fallback in `Write-ThreadSafeLog` breaks resume state detection | Step 2a mutex timeout fallback writes to `pipeline-fallback.log` instead of stderr. Main thread flushes fallback into `pipeline.log` during tier transitions. |
| 41 | MODERATE | Merge queue ordering not linearizable under concurrent completions | Step 12 uses `[System.Collections.Concurrent.ConcurrentQueue[string]]` for thread-safe FIFO enqueue. `StartMerge` dequeues from main thread only. |
| 42 | MODERATE | FinalVerification remediation writer selection underspecified | Step 13 specifies explicit algorithm: `git diff` to identify files, map to task via logs, select that task's code writer. Tie-breaking per objection #29. Unattributable files use first task's writer as fallback. |
| 43 | MODERATE | Test doubles for claude CLI not specified | Step 2d adds `Invoke-ClaudeTestDouble` contract matching `Invoke-Claude` parameter signature. All phase module tests use sequential response injection pattern. |
| 44 | MODERATE | Untyped artifact return contracts -- ad-hoc hashtables with no declared schema | New Step 3 (Result Contracts) defines `ConvertTo-TaskResult`, `ConvertTo-EscalationResult`, `ConvertTo-MergeResult`, `ConvertTo-ValidationResult` constructor functions with validation. |
| 45 | MODERATE | No idempotency token for concurrent pipeline runs | Step 15 generates `$PipelineRunId = [guid]::NewGuid()`. Lock file created during validation. Lock file removed on completion/halt. Concurrent runs rejected. |

### Round 4 (impl-debate-4.md)

| # | Severity | Objection | Resolution |
|---|----------|-----------|------------|
| 46 | BLOCKING | `$ErrorActionPreference` not propagated to thread jobs -- `Start-ThreadJob` defaults to `Continue`, silently swallowing non-terminating errors from git, `Invoke-VerifyCommand`, and file operations; creates TLA+ state machine divergence where `GreenTestsFail` should fire but `GreenTestsPass` fires instead | Step 2b `Invoke-WithTimeout` injects `$ErrorActionPreference = 'Stop'` as the first statement inside the thread job script block. This converts all non-terminating errors (e.g., git returning non-zero, file not found) into terminating exceptions that propagate to the job's error stream. All phase functions (`Invoke-RedPhase`, `Invoke-GreenPhase`, `Invoke-CleanupPhase`, `Invoke-AgentWriter`) run under `'Stop'` preference. Test added asserting that a non-terminating error inside a thread job surfaces as a job failure, not silent success. |
| 47 | BLOCKING | Lock file creation not atomic -- `Test-Path` + `Set-Content` has TOCTOU race allowing two pipeline instances to both acquire the lock | Step 5 `Test-ImplementationPlan` uses `[System.IO.File]::Open($path, [System.IO.FileMode]::CreateNew)` for lock file creation. `CreateNew` atomically fails if the file already exists on NTFS, eliminating the race window. The file handle is written with PID and RunId, then closed. Removal uses `[System.IO.File]::Delete()`. Test added simulating concurrent creation attempts. |
| 48 | BLOCKING | Merge queue not re-checked after escalation recovery re-dispatch -- recovered task completes and enqueues for merge but the merge drain-loop already exited; `TierFullyDone` requires `MergeQueueEmpty`, creating a permanent stall violating L1 `EventuallyTerminates` | Step 15 merge processing uses a drain-loop pattern: after every task completion (including re-dispatched recoveries), the orchestrator re-enters the merge drain-loop and continues until `mergeQueue` is empty AND `mergeInProgress = 0`. The loop is also re-entered after each escalation KeepGoing resolution. Test added (Scenario 25) asserting recovered task's merge is processed before `TierFullyDone` check. |
| 49 | HIGH | `EscalationKeepGoingFinal` -- `Reset-FinalCounters` resets counters but not `finalVerifPhase`; TLA+ spec sets `finalVerifPhase' = "running"` alongside counter resets; without this, final verification stuck in `"escalated"` after KeepGoing | Step 13 `Reset-FinalCounters` now also sets `finalVerifPhase = "running"` (matching TLA+ `EscalationKeepGoingFinal` exactly). Step 15 orchestrator calls `Reset-FinalCounters` which returns the full updated state including the phase transition. Test updated to assert phase transition to `"running"` occurs alongside counter resets. |
| 50 | HIGH | `Invoke-ClaudeTestDouble` signature mismatch -- test double uses `($Prompt, $Agent, $OutputFormat, $Context)` but real `Invoke-Claude` uses `($SystemPromptFile, $AppendSystemPromptFile, $Prompt, $JsonSchema, $AddDir, $Interactive)` | Step 2d `Invoke-ClaudeTestDouble` signature updated to match the real `Invoke-Claude` parameters: `[string]$SystemPromptFile`, `[string]$AppendSystemPromptFile`, `[string]$Prompt`, `[string]$JsonSchema`, `[string]$AddDir`, `[switch]$Interactive`. All phase module test mocks updated to use the corrected signature. Test added asserting parameter binding compatibility: mock `Invoke-Claude` using the test double signature, call with real parameter names, assert no binding errors. |
| 51 | HIGH | Pipeline output pollution in thread jobs -- uncaptured PowerShell expressions corrupt `TaskResult` return values; `Receive-Job` returns all output objects, not just the intended hashtable | Step 2b `Invoke-WithTimeout` wraps the user-provided script block with output suppression: all intermediate expressions are piped to `$null` or captured in variables. The script block is wrapped as `$null = <setup>; $result = & $UserBlock; $result` so only the final `$result` is emitted. Phase functions must return exactly one object (the `TaskResult` hashtable). Step 15 `Receive-Job` validates that exactly one output object was returned and that it passes `ConvertTo-TaskResult` validation; if not, the task is escalated with an error describing the output pollution. Test added: mock phase function that emits stray `Write-Output` statements, assert `Invoke-WithTimeout` filters them and only the `TaskResult` survives. |
| 52 | HIGH | Windows file locking not addressed -- mandatory file locks from virus scanners and indexers cause git failures distinct from merge conflicts, needing retry-with-backoff | Step 2c adds `Invoke-GitWithRetry` wrapper: executes a git command, and if it fails with error messages matching file-lock patterns (`"The process cannot access the file"`, `"Permission denied"`, `"unable to unlink"`, `"cannot lock ref"`), retries up to 3 times with exponential backoff (1s, 2s, 4s). Non-lock-related git failures are not retried. All git operations in `workspace.ps1` and `merge-queue.ps1` use this wrapper. |
| 53 | HIGH | Worktree dirty state after hard crash/timeout kill -- partial files from killed claude CLI process leave uncommitted changes that corrupt re-dispatched task | Step 6 adds `Reset-WorktreeState` function: called before re-dispatching a recovered task, runs `git checkout -- .` and `git clean -fd` in the task's worktree to discard all uncommitted changes. Step 15 calls `Reset-WorktreeState` after every KeepGoing recovery before starting the new thread job. For tasks where the worktree itself is corrupted (e.g., `.git` index lock), falls back to `git worktree remove --force` + `git worktree add` (recreate). |
| 54 | HIGH | `git worktree prune` never called -- stale worktree entries from prior crashes accumulate and cause `git worktree add` failures | Step 6 calls `git worktree prune` at the start of `New-TaskWorkspace` (before creating any new worktrees for a tier) and in `Resolve-PipelineState` during Stage 8 resume. This removes stale entries whose backing directories no longer exist. |
| 55 | HIGH | Missing integration scenario for `RedRetryAlreadyImplemented` end-to-end path | Step 16 adds Scenario 23: T1 RED tests pass unexpectedly, test writer returns `"already_implemented"`, T1 skips GREEN and goes directly to cleanup -> cleanup passes -> merge -> final verification -> pipeline completed. Asserts `taskPhase` transitions through `red -> red_retry -> cleanup -> done` without ever entering `green`. |
| 56 | HIGH | Missing integration scenario for validation failure halting pipeline | Step 16 adds Scenario 24: plan with intra-tier dependency detected by `Test-ImplementationPlan`, assert pipeline status = `"halted"`, no tasks execute, lock file removed, error message references the specific validation failure. |
| 57 | HIGH | Truncated `pipeline.log` on hard crash breaks resume; `pipeline-fallback.log` entries lost between tier flushes | Step 2a `Write-ThreadSafeLog` appends with `[System.IO.File]::AppendAllText()` instead of `Add-Content` for atomic append semantics. Step 2a adds `Sync-FallbackLog` function called during tier transitions and resume. Step 14 `Resolve-PipelineState` flushes orphaned fallback entries as first resume action. |
| 58 | HIGH | Missing infrastructure failure test for merge-resolver `Invoke-Claude` (exit 127) | Step 12 tests add: mock `Invoke-Claude` for merge-resolver returns exit code 127, assert merge escalated as infrastructure failure with `mergeRetries` unchanged. |
| 59 | HIGH | Infra-failure recovery for `red`/`green`/`agent_call` phases must still restore `taskStatus` to `"running"` even with no counter reset | Step 7 and Step 15 both set `taskStatus = "running"` on KeepGoing for ALL phase types, matching TLA+ `EscalationKeepGoing` which explicitly sets `taskStatus' = "running"` regardless of phase. |
| 60 | HIGH | T4 schema contradiction -- `testWriter` should be null per elicitor convention for agent-writer tasks | T4 changed to `testWriter: null`. Agent prompt file validation absorbed into Step 5 (`Test-ImplementationPlan`). |

### Round 5 (impl-debate-5.md)

| # | Severity | Objection | Resolution |
|---|----------|-----------|------------|
| 61 | BLOCKING | `Invoke-WithTimeout` cannot discover child claude CLI PID because `Start-ThreadJob` creates runspace threads with no `.ProcessId`; `Stop-ProcessTree` has no starting PID | Step 2b `Invoke-WithTimeout` now creates a `[System.Collections.Concurrent.ConcurrentDictionary[string,int]]` (`$ChildPidRegistry`) keyed by task ID. The thread job script block writes the child claude CLI PID to the registry immediately after spawning via `& claude ...` by capturing `$process = Start-Process ... -PassThru` and calling `$ChildPidRegistry.TryAdd($TaskId, $process.Id)`. On timeout, `Invoke-WithTimeout` reads `$ChildPidRegistry.TryGetValue($TaskId)` to obtain the PID for `Stop-ProcessTree`. **Fallback (PID never registered):** If the thread job was killed before it could register the PID (e.g., immediate crash), `Invoke-WithTimeout` enumerates all `claude` processes via `Get-CimInstance Win32_Process -Filter "Name='claude.exe'"` and filters by `CommandLine` containing the task's worktree path. This guarantees no zombie claude processes survive even in the worst case. Tests added: (a) normal PID registration path, (b) fallback enumeration path when PID never registered. |
| 62 | HIGH | `Invoke-Claude` mutates process-global `$env:ANTHROPIC_BASE_URL` for proxy routing; parallel thread jobs race on this variable | Step 2b `Invoke-WithTimeout` sets `$env:ANTHROPIC_BASE_URL` once at pipeline startup (before any thread jobs launch) and never mutates it thereafter. If per-task base URLs are needed in the future, pass the URL as a CLI argument (`--base-url`) to the `claude` process rather than mutating the shared environment. All phase functions receive the base URL as an immutable parameter, never reading or writing `$env:ANTHROPIC_BASE_URL` directly. Test added: assert `$env:ANTHROPIC_BASE_URL` is never mutated after initial setup by mocking `Set-Item Env:ANTHROPIC_BASE_URL` and asserting zero calls during thread job execution. |
| 63 | HIGH | `Sync-FallbackLog` read-append-truncate cycle is not atomic with concurrent fallback writes; a thread job writing to `pipeline-fallback.log` between read and truncate loses that entry | Step 2a `Sync-FallbackLog` now acquires an exclusive file lock on `pipeline-fallback.log` using `[System.IO.FileStream]::new($path, 'Open', 'ReadWrite', 'None')` (FileShare.None) during the entire read-append-truncate cycle. While the exclusive lock is held: (1) read all bytes from the fallback file, (2) append to `pipeline.log` via `Write-ThreadSafeLog`, (3) truncate the fallback file by setting `$stream.SetLength(0)`. Concurrent `Write-ThreadSafeLog` fallback writes that fail to open the file (because of the exclusive lock) retry with a 100ms backoff, up to 3 attempts. If all retries fail, the entry is written to stderr as last resort (acceptable during the brief flush window since this is a mutex-timeout path that is itself a fallback). Test added: simulate concurrent write during flush, assert the write either succeeds after retry or appears on stderr, and no entries are lost from the fallback file. |
| 64 | MODERATE | No aggregate per-task wall-clock budget; `MaxTddCycles=100 x MaxFixRounds=100 = 10,000` possible `Invoke-Claude` calls per task | Step 1 adds `$Config.TaskMaxWallClockSeconds` (default 3600 = 1 hour). Step 2b `Invoke-WithTimeout` tracks cumulative elapsed time per task via a `[System.Collections.Concurrent.ConcurrentDictionary[string,System.Diagnostics.Stopwatch]]`. When cumulative time exceeds `TaskMaxWallClockSeconds`, the task is escalated as an infrastructure failure. Test added: mock task with 10 iterations of 400s each, assert escalation fires at iteration 10 when cumulative exceeds 3600s. |
| 65 | MODERATE | Lock file stale-PID detection vulnerable to Windows PID reuse; a new unrelated process may have the same PID as the dead pipeline | Step 5 `Test-ImplementationPlan` lock file now includes process name alongside PID and RunId. Stale lock detection cross-checks both PID and process name: read the lock file PID and process name, then compare against `(Get-Process -Id $pid -ErrorAction SilentlyContinue).ProcessName`. If PID is alive but process name does not match (e.g., lock says "pwsh" but PID belongs to "chrome"), treat as stale. Test added: mock alive PID with wrong process name, assert lock treated as stale. |
| 66 | LOW | `SkipEmptyTier` overshoot guard / main loop interaction ambiguous | Step 15 now documents explicitly: the skip loop runs inside the main tier-advance block, not as a separate action. After the skip loop, `$currentTier` is either a non-empty tier or `$NumTiers + 1`. The main loop checks `$currentTier > $NumTiers` to break to final verification. No code change needed; clarified in Step 15 description. |
| 67 | MODERATE | No test for partial/malformed JSON responses from `Invoke-Claude` (valid JSON, missing expected fields) | Steps 8, 9, and 10 each add one test: mock `Invoke-Claude` returning valid JSON with missing required fields (e.g., `{ "content": "" }` with no `verdict` key in RED, no `filesModified` key in GREEN, no `blame` key in cleanup). Assert each phase handles gracefully: either re-prompts (counts as an attempt) or escalates with descriptive error. |
| 68 | MODERATE | No explicit test for cleanup blame-fork correctness (which agent dispatched based on failure source) | Step 10 adds two tests: (a) mock blame = "test" from test writer triage, assert test writer agent prompt file used for remediation dispatch; (b) mock blame = "code", assert code writer agent prompt file used. Assert the correct `$SystemPromptFile` parameter passed to `Invoke-Claude`. |
| 69 | MODERATE | `task-log.ps1` bundles 8 functions from 4+ unrelated concerns (logging, job execution, git retry, test doubles); violates SRP | Step 2 split into 4 files: (a) `utils/task-log.ps1` -- `New-PipelineMutex`, `Write-ThreadSafeLog`, `Sync-FallbackLog`, `Write-TaskLog`; (b) `utils/job-runner.ps1` -- `Stop-ProcessTree`, `Invoke-WithTimeout` (with PID registry + env var safety + wall-clock budget); (c) `utils/git-retry.ps1` -- `Invoke-GitWithRetry`; (d) `tests/helpers/claude-test-double.ps1` -- `Invoke-ClaudeTestDouble`. Test files split correspondingly. All 4 files remain in the same task (T2) because they share no inter-dependencies and can be implemented atomically. |
| 70 | MODERATE | Dispatch table key construction is stringly-typed (`"task:red_retry"`) with no validation; a typo silently maps to no reset function | Step 7 adds `Get-ResetDispatchKey` function that constructs and validates dispatch keys. Accepts `$Source` and `$Phase` parameters, validates `$Source` is in `@("task", "merge", "final", "workspace")` and `$Phase` is in `PhaseSet` or empty (for non-task sources), returns the formatted key string. Throws `[System.ArgumentException]` for unrecognized values. Step 15 orchestrator uses `Get-ResetDispatchKey` for all dispatch table lookups. Test added: assert valid keys constructed correctly, assert invalid source or phase throws. |
| 71 | LOW | `ConvertTo-MergeResult` missing `WorkspaceRemoved` field | Step 3 `ConvertTo-MergeResult` adds optional `WorkspaceRemoved` boolean field (default `$false`). Step 12 sets `WorkspaceRemoved = $true` after successful `Remove-TaskWorkspace`. |
| 72 | LOW | `EnqueueForMerge` missing explicit `~escalationActive` guard in Step 12 description | Step 12 `Add-MergeQueue` now documents: enqueue is rejected when `$escalationActive` is `$true`. The orchestrator enforces this structurally (merge enqueue only runs in the main-thread drain-loop, which is gated by `~escalationActive`), but the function itself also checks for defense-in-depth. |
| 73 | LOW | `ZeroTierComplete` in TLA+ sets `currentTier' = 1` but implementation does not document this | Step 15 zero-tier path now explicitly sets `$currentTier = 1` before setting `pipelineStatus = "completed"`, matching TLA+ `ZeroTierComplete`. |
| 74 | LOW | No explicit test for `SkipEmptyTier` precondition `currentTier > 0` | Step 16 adds Scenario 30: assert `SkipEmptyTier` logic does not fire when `currentTier = 0` (validation phase). Covered implicitly by the validation-first flow, but now has an explicit assertion. |
| 75 | MODERATE | Task completion log write atomicity assumed; agent-writer re-dispatch could produce duplicate content if completion marker written before `TaskResult` returned | Steps 8-11 each specify: the completion marker (`COMPLETED` or `ESCALATED`) is written to the task log as the LAST action before returning `TaskResult`, never before. Step 11 (agent-writer) checks for pre-existing output files before re-dispatch: if the agent's output file already exists, skip re-execution and return the existing result. Test added per phase: assert completion marker is the final log entry. |
| 76 | MODERATE | No maximum wall-clock time for entire pipeline; combined with per-task retries, the pipeline could run for days | Step 1 adds `$Config.PipelineTimeoutSeconds` (default 14400 = 4 hours). Step 15 captures `$pipelineStopwatch = [System.Diagnostics.Stopwatch]::StartNew()` at pipeline start. Before each tier advance and before each merge drain-loop iteration, checks `$pipelineStopwatch.Elapsed.TotalSeconds > $Config.PipelineTimeoutSeconds`. On expiry, sets `pipelineStatus = "halted"` with descriptive error. Test added: mock pipeline running past timeout, assert halted with timeout message. |
| 77 | MODERATE | `Reset-WorktreeState` destroys all uncommitted work without warning; user may have manually edited files for debugging during escalation | Step 6 `Reset-WorktreeState` now logs a warning via `Write-TaskLog` if `git status --porcelain` returns non-empty output before resetting, including a summary of modified/untracked file count. The warning is informational only (does not block the reset) but provides an audit trail. Test added: mock dirty worktree, assert warning logged with file count before reset proceeds. |
| 78 | HIGH | `ConcurrentQueue` duplicate prevention in `Add-MergeQueue` uses check-then-enqueue (TOCTOU race); `ContainsKey` + `TryAdd` as two operations allows two threads to both pass the check | Step 12 `Add-MergeQueue` now uses `ConcurrentDictionary.TryAdd($taskId, $true)` as an atomic gate. If `TryAdd` returns `$true`, the task is enqueued to the `ConcurrentQueue`. If `TryAdd` returns `$false`, the task is already tracked and enqueue is skipped. The dictionary entry is removed only after merge completion (`MergeSuccess`) or escalation recovery (`EscalationKeepGoingMerge`). This eliminates the TOCTOU race because `TryAdd` is a single atomic operation. `ContainsKey` is NEVER used for gate decisions. Test added: simulate two concurrent `Add-MergeQueue` calls for the same task ID from separate thread jobs, assert exactly one enqueue occurs. |

---

## TLA+ State Coverage Matrix

### States

**Pipeline status:** `running`, `halted`, `completed`

**Validation status:** `pending`, `valid`, `failed`

**Task phase (per task):** `idle`, `red`, `red_retry`, `green`, `green_retry`, `cleanup`, `cleanup_remed`, `agent_call`, `done`

**Task status (per task):** `pending`, `running`, `completed`, `escalated`, `skipped`

**Workspace (per task):** `workspaceExists` (boolean), `workspaceMerged` (boolean)

**Final verification phase:** `idle`, `running`, `remediating`, `completed`, `escalated`

**Escalation:** `escalationActive` (boolean)

**Workspace creation:** `wsCreationFailed` (boolean)

**Merge:** `mergeInProgress` (task ID or 0), `mergeQueue` (sequence)

### Transitions

1. `ValidationPasses` -- plan valid, orphan check clean
2. `ValidationFails` -- intra-tier deps, unknown writers, orphans
3. `ZeroTierComplete` -- NumTiers=0, pipeline completes as no-op
4. `StartNextTier` -- advance to next tier, create workspaces for multi-task
5. `WorkspaceCreationFailure` -- partial worktree creation fails, escalate
6. `SkipEmptyTier` -- tier has no tasks, advance past it
7. `RedTestsFail(t)` -- tests fail as expected, move to GREEN
8. `RedTestsPassUnexpectedly(t)` -- tests pass, enter RED retry
9. `RedRetryRevised(t)` -- test writer revises tests, restart RED
10. `RedRetryAlreadyImplemented(t)` -- code already implements feature, skip to cleanup
11. `RedRetryExhausted(t)` -- max RED retries hit, escalate
12. `GreenTestsPass(t)` -- all tests pass, move to cleanup
13. `GreenTestsFail(t)` -- tests still fail, increment attempt counter
14. `GreenRetry(t)` -- code writer tries again
15. `GreenRetryExhausted(t)` -- max GREEN attempts hit, escalate
16. `CleanupPass(t)` -- verify commands pass, increment clean counter
17. `CleanupComplete(t)` -- consecutive passes reach threshold, task done
18. `CleanupFail(t)` -- verify fails, reset counter, trigger remediation
19. `CleanupRemediate(t)` -- fix applied (blame fork abstracted), back to cleanup
20. `CleanupExhausted(t)` -- max remediation cycles hit, escalate
21. `AgentWriterComplete(t)` -- agent-writer single call finishes
22. `EnqueueForMerge(t)` -- completed workspace task enters merge queue
23. `SingleTaskTierComplete(t)` -- single-task tier, no merge needed
24. `StartMerge` -- dequeue next task for serial merge
25. `MergeSuccess` -- merge succeeds, clean up workspace
26. `MergeConflictResolve` -- conflict detected, attempt resolution (retry consumed)
27. `MergeExhausted` -- max merge retries hit, escalate
28. `StartFinalVerification` -- all tiers complete, begin final verification
29. `FinalVerifPass` -- clean pass in final verification
30. `FinalVerifComplete` -- consecutive passes met, pipeline completed
31. `FinalVerifFail` -- verify fails, enter remediation phase
32. `FinalVerifRemediate` -- fix applied, back to running
33. `FinalVerifExhausted` -- max remediation hit, escalate
34. `EscalationKeepGoing(t)` -- user resumes failed task, reset counters
35. `EscalationKeepGoingMerge` -- user resumes merge exhaustion
36. `EscalationKeepGoingFinal` -- user resumes final verification
37. `EscalationKeepGoingWorkspace` -- user retries workspace creation
38. `EscalationStop` -- user halts pipeline, preserve active workspaces
39. `InfrastructureFailure(t)` -- command not found / timeout, immediate escalation

### Safety Invariants

- **S1 TiersSequential** -- no task runs before all earlier-tier tasks are done/skipped
- **S2 RetryBounds** -- all retry counters stay within configured maximums
- **S3 AgentWriterNoTdd** -- agent-writer tasks never enter TDD phases (red/green/cleanup)
- **S4 MergeSerial** -- no duplicates in merge queue, in-progress task not also queued
- **S5 NoOrphanedWorkspaces** -- no workspaces exist after pipeline completion
- **S6 SingleTaskNoWorkspace** -- single-task tiers never create workspaces
- **S7 CompletionRequiresFinalVerif** -- completed pipeline implies final verification passed (except zero-tier)
- **S8 EscalationBlocksProgress** -- active escalation blocks pipeline completion
- **S9 GreenAfterRed** -- GREEN phase only reachable for TDD tasks
- **S10 CleanupOnlyForTdd** -- cleanup only reachable for TDD tasks
- **S11 ValidationGatesExecution** -- no task runs unless plan is validated
- **S12 WorkspaceCreationSafety** -- workspace creation failure always triggers escalation

### Liveness Properties

- **L1 EventuallyTerminates** -- pipeline eventually reaches `completed` or `halted`
- **L2 TasksResolve** -- every running task eventually completes, escalates, or is skipped
- **L3 EscalationResolves** -- every escalation eventually resolves (user picks Keep Going or Stop)

### TLA+ Spec Gaps (not affecting implementation)

- **WF_vars(ValidationFails)** is absent from the Fairness constraint. The model checker could theoretically leave `validationStatus` at `"pending"` forever. Implementation is immune because `Test-ImplementationPlan` is a synchronous function that always returns in bounded time.

---

## Implementation Steps

### Step 1: Configuration Constants

**Files:**
- `utils/config.ps1` (modify)

**Description:**
Add Stage 8 constants to the shared config hashtable: `MaxRedRetries` (3), `MaxMergeRetries` (3), `JobTimeoutSeconds` (600). Remove the `MaxGreenRetries` alias (superseded by `MaxTddCycles` per TLA+ spec naming). `MaxTddCycles`, `MaxFixRounds`, and `CleanupPasses` already exist with correct values.

`JobTimeoutSeconds` (600 = 10 minutes) is the maximum wall-clock time a single thread job may run before the orchestrator kills it and escalates the task as an infrastructure failure. This addresses BLOCKING objection #13: without a timeout, a hung `Invoke-Claude` call blocks the pipeline forever, violating L1 (EventuallyTerminates).

**Per-task timeout configurability (objection #30):** Add `$Config.TaskTimeouts` hashtable with per-writer-type overrides:
```powershell
TaskTimeouts = @{
    "powershell-writer"  = 600
    "typescript-writer"  = 900
    "hono-writer"        = 900
    "ui-writer"          = 900
    "agent-writer"       = 300
    "merge-resolver"     = 600
}
```
`Invoke-WithTimeout` resolves timeout by looking up the task's writer type in `TaskTimeouts`, falling back to `JobTimeoutSeconds` if no override exists. This prevents legitimate multi-retry TDD tasks from being killed prematurely while keeping short timeouts for simpler agent tasks.

**Per-task aggregate wall-clock budget (objection #64):** Add `$Config.TaskMaxWallClockSeconds` (default 3600 = 1 hour). This caps the total cumulative execution time for a single task across all its `Invoke-WithTimeout` calls (RED + GREEN + cleanup iterations). Without this, a task could theoretically consume `MaxTddCycles * MaxFixRounds = 10,000` Invoke-Claude calls, running for days. `Invoke-WithTimeout` tracks cumulative elapsed time per task via a `ConcurrentDictionary[string,Stopwatch]` and escalates when the budget is exceeded.

**Pipeline-level timeout (objection #76):** Add `$Config.PipelineTimeoutSeconds` (default 14400 = 4 hours). The orchestrator (Step 15) checks pipeline elapsed time before each tier advance and merge drain-loop iteration. On expiry, the pipeline halts with a descriptive error.

**Verify command injection prevention (objection #32):** Add `$Config.VerifyCommandAllowlistPattern` regex (`^[a-zA-Z0-9_./-]+(\s+[a-zA-Z0-9_./-]+)*$`). Add `Test-VerifyCommand` function that validates a command string against this pattern and throws `[System.ArgumentException]` if it contains shell metacharacters (`|`, `;`, `&`, `` ` ``, `$()`, etc.). All verify command execution paths call `Test-VerifyCommand` before execution. Add `Invoke-VerifyCommand` wrapper that validates against the allowlist, splits the command into an array, and invokes via `& $cmd[0] @($cmd[1..($cmd.Count-1)])` -- never via `ScriptBlock::Create` or `Invoke-Expression`.

**Dependencies:** None

**Test (write first):**
`tests/config.Tests.ps1` (modify) -- Add assertions that `$Config.MaxRedRetries` equals 3, `$Config.MaxMergeRetries` equals 3, `$Config.JobTimeoutSeconds` equals 600. Verify `MaxGreenRetries` key no longer exists. Verify all Stage 8 constants are present and within expected ranges. Verify `MaxTddCycles`, `MaxFixRounds`, `CleanupPasses` retain existing values (100, 100, 2). **Per-task timeout tests (objection #30):** Assert `$Config.TaskTimeouts` is a hashtable with entries for each writer type. Assert all values are positive integers. Assert fallback to `JobTimeoutSeconds` works when writer type not in `TaskTimeouts`. **Task wall-clock budget tests (objection #64):** Assert `$Config.TaskMaxWallClockSeconds` equals 3600. Assert value is a positive integer. **Pipeline timeout tests (objection #76):** Assert `$Config.PipelineTimeoutSeconds` equals 14400. Assert value is a positive integer. **Verify command tests (objection #32):** Assert `Test-VerifyCommand "pnpm test"` passes. Assert `Test-VerifyCommand "pnpm test; rm -rf /"` throws `ArgumentException`. Assert `Test-VerifyCommand 'cmd /c "malicious"'` throws. Assert `Invoke-VerifyCommand` splits and executes via `&` operator (mock the actual command). Assert `Invoke-VerifyCommand` never calls `ScriptBlock::Create` or `Invoke-Expression`.

**TLA+ Coverage:**
- Constants: `MaxRedRetries`, `MaxMergeRetries`, `MaxTddCycles`, `MaxFixRounds`, `CleanupPasses`
- Invariant: S2 (RetryBounds) -- constants define the bounds
- Liveness: L1 (EventuallyTerminates) -- pipeline timeout ensures bounded execution

---

### Step 2a: Thread-Safe Logging

**Files:**
- `utils/task-log.ps1` (create)

**Description:**
Implement four logging functions, split from the former monolithic Step 2 per SRP (objection #69):

1. **`New-PipelineMutex`** (objection #34) -- Wrapper function that creates and returns a `[System.Threading.Mutex]` with the name `Global\VibePipelineLog`. This indirection exists solely for testability: Pester cannot mock .NET type constructors directly, but it can mock PowerShell functions. Tests mock `New-PipelineMutex` to return a fake mutex object with `WaitOne()` and `ReleaseMutex()` methods.

2. **`Write-ThreadSafeLog`** -- Wraps `Write-PipelineLog` with the named mutex (obtained via `New-PipelineMutex`) to guarantee atomic writes from parallel `Start-ThreadJob` invocations. Each call acquires the mutex, writes the line, and releases. Timeout of 5 seconds on `WaitOne()`. Uses `[System.IO.File]::AppendAllText()` instead of `Add-Content` for atomic append semantics -- partial lines cannot occur on crash (objection #57). **Mutex timeout fallback (objection #40):** On timeout, writes to `pipeline-fallback.log` (a secondary file alongside `pipeline.log`) instead of stderr. This preserves resume state detection, which only parses `pipeline.log` and would break if log lines appeared on stderr. The main thread periodically flushes `pipeline-fallback.log` into `pipeline.log` during tier transitions via `Sync-FallbackLog`. **Fallback write retry under flush lock (objection #63):** When `Sync-FallbackLog` holds an exclusive lock on the fallback file, fallback writes retry with 100ms backoff up to 3 attempts. If all retries fail, the entry is written to stderr as last resort (acceptable during the brief flush window). **AbandonedMutexException handling (objection #37):** Catches `[System.Threading.AbandonedMutexException]` -- this occurs when a thread holding the mutex crashes without releasing it. The catch handler acquires ownership (the exception itself grants it), writes the log line, and releases normally. Logs a warning to `pipeline-fallback.log` about the abandoned mutex.

3. **`Sync-FallbackLog`** (objections #57, #63) -- Flushes all entries from `pipeline-fallback.log` into `pipeline.log` under mutex protection. **Atomic flush with exclusive file lock (objection #63):** Opens the fallback file with `[System.IO.FileStream]::new($path, 'Open', 'ReadWrite', 'None')` (FileShare.None) for the entire read-append-truncate cycle. While the exclusive lock is held: (1) read all bytes from the fallback file stream, (2) append to `pipeline.log` via `Write-ThreadSafeLog`, (3) truncate the fallback file by calling `$stream.SetLength(0)`. This prevents a concurrent fallback write from occurring between read and truncate, which would lose the entry. Called by the orchestrator during tier transitions and by `Resolve-PipelineState` during resume (before parsing `pipeline.log` for state). If `pipeline-fallback.log` does not exist, returns silently.

4. **`Write-TaskLog`** -- Dual-write logging: one-liner to `pipeline.log` (via `Write-ThreadSafeLog`) and detailed entry to `docs/<feature>/tickets/T<N>-log.txt`. Accepts task ID, phase, message, and optional detail block. Each log entry includes ISO 8601 timestamp, task ID, current phase, pipeline run ID (objection #45), and message. **Completion marker ordering (objection #75):** Completion markers (`COMPLETED`, `ESCALATED`) are documented as the LAST log action before returning `TaskResult`. All callers (phase functions, agent-writer) must follow this convention.

**Dependencies:** None

**Test (write first):**
`tests/task-log.Tests.ps1` (create) -- Mock `Write-PipelineLog`, `Add-Content`, and `New-PipelineMutex`. Assert `Write-TaskLog -TaskId "T3" -Phase "red" -Message "tests written"` calls `Write-ThreadSafeLog` with `[T3] red: tests written` and appends timestamped detail to the task-specific log file. Assert missing task ID throws. Assert log directory creation if absent. Assert `Write-ThreadSafeLog` acquires and releases the mutex (mock `New-PipelineMutex` to return a mock object, verify `WaitOne` and `ReleaseMutex` called -- objection #34). Assert `Write-ThreadSafeLog` uses `[System.IO.File]::AppendAllText()` not `Add-Content` (objection #57). Assert mutex timeout triggers fallback log write to `pipeline-fallback.log`, not stderr (objection #40). Assert `AbandonedMutexException` caught and handled: mock mutex `WaitOne` to throw abandoned exception, assert log line still written and mutex released (objection #37). **Sync-FallbackLog tests (objections #57, #63):** Assert entries flushed from fallback to main log. Assert fallback file truncated after flush. Assert no-op when fallback file does not exist. Assert flush occurs under mutex protection. **Exclusive file lock test (objection #63):** Assert `Sync-FallbackLog` opens fallback file with `FileShare.None`. Simulate concurrent write during flush (mock file open throws `IOException` due to lock), assert write retries with 100ms backoff up to 3 attempts. Assert no entries lost from fallback file during flush. **Fallback write retry under flush lock (objection #63):** Mock fallback file locked by `Sync-FallbackLog`, assert `Write-ThreadSafeLog` fallback path retries 3 times then writes to stderr.

**TLA+ Coverage:**
- Infrastructure support for all transitions (logging is cross-cutting)
- Resolves objections #6, #37, #40, #57, #63, #69, #75

---

### Step 2b: Job Runner (Timeout, Process Tree Kill, PID Registry)

**Files:**
- `utils/job-runner.ps1` (create)

**Description:**
Implement three functions for thread job lifecycle management, split from former Step 2 per SRP (objection #69):

1. **`Stop-ProcessTree`** (objection #26) -- Recursively discovers and kills a process and all its descendants on Windows. Algorithm: (a) use `Get-CimInstance Win32_Process -Filter "ParentProcessId=$pid"` to find immediate children, (b) recurse into each child to find grandchildren (depth-first), (c) kill leaf-to-root with `Stop-Process -Force -Id $childPid` to prevent orphaning. Each kill is wrapped in try/catch (process may have already exited). Returns a hashtable of killed PIDs for logging. This is critical because `Stop-Job` only terminates the PowerShell thread job runspace -- it does NOT kill the `claude` CLI process that the thread job spawned via `Start-Process` or `&`. Without process-tree kill, timed-out claude processes accumulate as zombies.

2. **`Invoke-WithTimeout`** -- Wraps a script block in a `Start-ThreadJob`, resolves timeout from the task's writer type via `$Config.TaskTimeouts` (falling back to `$Config.JobTimeoutSeconds`), waits via `Wait-Job -Timeout`, and handles timeout/completion.

   **Child PID registry (BLOCKING objection #61):** Creates a shared `[System.Collections.Concurrent.ConcurrentDictionary[string,int]]` (`$script:ChildPidRegistry`) keyed by task ID. The thread job script block is injected with code that writes the child claude CLI PID to the registry immediately after spawning: `$process = Start-Process claude -PassThru ...; $ChildPidRegistry.TryAdd($TaskId, $process.Id)`. The `$ChildPidRegistry` reference is passed to the thread job via the `-ArgumentList` parameter of `Start-ThreadJob`. On timeout: (a) `Invoke-WithTimeout` calls `$ChildPidRegistry.TryGetValue($TaskId, [ref]$childPid)` to obtain the PID, (b) if found, calls `Stop-ProcessTree($childPid)` to kill the entire claude CLI process tree, (c) calls `Stop-Job` then `Remove-Job -Force`. **Fallback when PID never registered:** If `TryGetValue` returns `$false` (thread job crashed before registering), `Invoke-WithTimeout` enumerates all `claude` processes via `Get-CimInstance Win32_Process -Filter "Name='claude.exe'"` and filters by `CommandLine` containing the task's worktree path or task ID. Matching processes are killed via `Stop-ProcessTree`. Returns a result hashtable with `@{ TimedOut = $true; TaskId = $taskId; KilledPids = @(...) }`.

   On normal completion, returns `@{ TimedOut = $false; Result = <job output> }`.

   **ErrorActionPreference injection (BLOCKING objection #46):** The script block passed to `Start-ThreadJob` is wrapped to inject `$ErrorActionPreference = 'Stop'` as the first statement. This converts all non-terminating errors (git returning non-zero, file not found, etc.) into terminating exceptions that propagate to the job's error stream. Without this, PowerShell's default `Continue` preference silently swallows errors, causing TLA+ state machine divergence (e.g., `GreenTestsFail` should fire but `GreenTestsPass` fires instead because a failed git command was silently ignored).

   **Output pollution guard (HIGH objection #51):** The script block is wrapped as `$null = <ErrorActionPreference setup>; $result = & $UserBlock; $result` so that only the final `$result` value is emitted to the output stream. On `Receive-Job`, validates that exactly one output object is returned; if multiple objects are found, the task is escalated with an error describing output pollution. Stray `Write-Output` or uncaptured expression values from phase functions cannot corrupt the `TaskResult`.

   **Environment variable safety (HIGH objection #62):** `Invoke-WithTimeout` does NOT mutate `$env:ANTHROPIC_BASE_URL` during execution. The base URL is set once at pipeline startup (in `Invoke-CodingStage`, Step 15) before any thread jobs launch and is never changed thereafter. All phase functions receive the base URL as an immutable parameter. If per-task base URLs are needed in the future, they are passed as a CLI argument (`--base-url`) to the `claude` process, not via environment variable mutation.

   **Per-task aggregate wall-clock budget (objection #64):** Maintains a `[System.Collections.Concurrent.ConcurrentDictionary[string,System.Diagnostics.Stopwatch]]` (`$script:TaskWallClocks`) tracking cumulative elapsed time per task across all `Invoke-WithTimeout` calls. Before starting each thread job, checks if cumulative time exceeds `$Config.TaskMaxWallClockSeconds`. On expiry, returns `@{ TimedOut = $true; BudgetExceeded = $true }` without launching the job. The stopwatch is started on first call and accumulated across RED, GREEN, cleanup, and retry iterations.

3. **`Get-ChildPidRegistry`** -- Returns the `$script:ChildPidRegistry` ConcurrentDictionary reference. Used by the orchestrator to pass into thread jobs and to query PIDs on timeout. Exposed as a function for testability (Pester can mock it to inject a test-controlled dictionary).

**Dependencies:** None

**Test (write first):**
`tests/job-runner.Tests.ps1` (create) -- **Stop-ProcessTree tests (objection #26):** Mock `Get-CimInstance` to return a process tree (parent -> 2 children -> 1 grandchild). Assert `Stop-Process` called for all 3 descendants in leaf-to-root order. Assert parent process killed last. Assert already-exited process (mock `Stop-Process` throws) does not prevent killing siblings. Assert returns hashtable with killed PIDs. **Invoke-WithTimeout tests:** Assert normal completion returns job result with `TimedOut = $false`. Assert job exceeding timeout returns `@{ TimedOut = $true }`. Assert `Stop-ProcessTree` called before `Stop-Job` on timeout. Assert `Remove-Job -Force` called on timeout. Assert already-completed job returns result even if timeout is very short. Assert per-task timeout resolution: mock task with writer type `"typescript-writer"`, assert timeout resolved to `$Config.TaskTimeouts["typescript-writer"]` not `$Config.JobTimeoutSeconds` (objection #30). **PID registry tests (BLOCKING objection #61):** (a) Normal path: mock thread job that writes PID to registry, trigger timeout, assert `Stop-ProcessTree` called with the registered PID. (b) Fallback path: mock thread job that crashes before PID registration (registry empty for task ID), trigger timeout, assert `Get-CimInstance Win32_Process` called with `"Name='claude.exe'"` filter, assert matching process killed. (c) Assert `ChildPidRegistry` entry removed after job completion (no stale entries). **ErrorActionPreference injection tests (BLOCKING objection #46):** Assert `$ErrorActionPreference = 'Stop'` is set inside the thread job script block. Mock a non-terminating error (e.g., `Write-Error "fail"` without `-ErrorAction Stop`) inside the script block, assert it surfaces as a job failure, not silent success. Assert a git command returning non-zero exit code surfaces as a terminating error. **Env var safety tests (HIGH objection #62):** Assert `$env:ANTHROPIC_BASE_URL` is never mutated after initial setup; mock `Set-Item Env:ANTHROPIC_BASE_URL` and assert zero calls during thread job execution. **Output pollution tests (HIGH objection #51):** Mock phase function that emits stray `Write-Output "noise"` before returning `TaskResult`, assert `Invoke-WithTimeout` returns only the `TaskResult` or escalates with pollution error. Assert `Receive-Job` returning multiple objects triggers escalation. **Wall-clock budget tests (objection #64):** Mock task with cumulative time exceeding `TaskMaxWallClockSeconds` across multiple calls, assert `@{ TimedOut = $true; BudgetExceeded = $true }` returned without launching a new job. Assert budget tracked per task ID (different tasks have independent budgets). Assert stopwatch accumulates across calls (not reset between RED and GREEN phases).

**TLA+ Coverage:**
- `InfrastructureFailure(t)` -- timeout path with process tree cleanup and PID registry
- Liveness: L1 (EventuallyTerminates) -- timeout + wall-clock budget ensures no infinite blocking
- Resolves BLOCKING objections #13, #26, #46, #61 and HIGH objections #51, #62

---

### Step 2c: Git Retry

**Files:**
- `utils/git-retry.ps1` (create)

**Description:**
Implement one function, split from former Step 2 per SRP (objection #69):

**`Invoke-GitWithRetry`** (HIGH objection #52) -- Executes a git command and retries on Windows file-lock errors. Matches error messages against patterns: `"The process cannot access the file"`, `"Permission denied"`, `"unable to unlink"`, `"cannot lock ref"`. On match, retries up to 3 times with exponential backoff (1s, 2s, 4s). Non-lock-related git failures are NOT retried (e.g., merge conflicts, missing refs). Returns the git command output on success. Throws on exhausted retries or non-retryable errors. All git operations in `workspace.ps1` and `merge-queue.ps1` use this wrapper.

**Dependencies:** None

**Test (write first):**
`tests/git-retry.Tests.ps1` (create) -- Mock git returning `"The process cannot access the file"` on attempt 1, success on attempt 2, assert retry occurred with 1s delay. Assert non-lock error (e.g., `"merge conflict"`) is NOT retried. Assert retry exhaustion (3 lock errors) throws. Assert successful command on first attempt returns immediately with no delay. Assert `"Permission denied"`, `"unable to unlink"`, and `"cannot lock ref"` all trigger retry. Assert non-retryable error with lock-like substring in unrelated context (e.g., `"ref 'permission denied' not found"`) is not retried (pattern matches against stderr, not arbitrary text).

**TLA+ Coverage:**
- Infrastructure support for all git-based transitions (workspace creation, merge, worktree cleanup)
- Resolves HIGH objection #52

---

### Step 2d: Claude Test Double

**Files:**
- `tests/helpers/claude-test-double.ps1` (create)

**Description:**
Implement one function, split from former Step 2 per SRP (objection #69):

**`Invoke-ClaudeTestDouble`** (objections #43, #50) -- Contract definition for test doubles of `Invoke-Claude`. Defines the parameter signature matching the REAL `Invoke-Claude`: `[string]$SystemPromptFile`, `[string]$AppendSystemPromptFile`, `[string]$Prompt`, `[string]$JsonSchema`, `[string]$AddDir`, `[switch]$Interactive`. Returns a hashtable matching the Invoke-Claude response schema: `@{ content = "..."; filesModified = @(...); exitCode = 0; cost = 0.0 }`. Tests use this pattern:
```powershell
$responses = @(
    @{ content = '{"verdict":"revised"}'; exitCode = 0 }
    @{ content = '{"filesModified":[]}'; exitCode = 0 }
)
$callIndex = 0
Mock Invoke-Claude { $responses[$script:callIndex++] }
```
This standardizes test doubles across all phase module tests. The signature match with real `Invoke-Claude` prevents parameter binding mismatches where tests pass with mocks but production fails (objection #50).

**Dependencies:** None

**Test (write first):**
`tests/helpers/claude-test-double.Tests.ps1` (create) -- Assert test double parameter signature matches real Invoke-Claude: `$SystemPromptFile`, `$AppendSystemPromptFile`, `$Prompt`, `$JsonSchema`, `$AddDir`, `$Interactive`. Assert test double returns correct schema shape. Assert parameter binding: call mock with `-SystemPromptFile "test.md" -Prompt "hello"`, assert no binding error. Assert test double supports sequential response injection.

**TLA+ Coverage:**
- Test infrastructure for all agent-dispatch transitions
- Resolves MODERATE objections #43, #50, #69

---

### Step 3: Result Contracts

**Files:**
- `utils/result-contracts.ps1` (create)

**Description:**
Define typed constructor functions for all inter-module hashtable contracts (objection #44). Each constructor validates required keys and value types at construction time, throwing `[System.ArgumentException]` for missing or mistyped fields. This replaces ad-hoc hashtable literals throughout the codebase with validated, documented schemas.

Constructor functions:

1. **`ConvertTo-TaskResult`** -- Validates and constructs the hashtable returned by thread jobs to the orchestrator:
```powershell
@{
    TaskId    = [string]    # Required. E.g., "T3"
    Phase     = [string]    # Required. Must be in PhaseSet
    Status    = [string]    # Required. Must be in StatusSet
    Counters  = [hashtable] # Required. Keys: redRetries, greenAttempts,
                            #   cleanupRemediations, cleanupCleanPasses
    Escalated = [bool]      # Required.
    Error     = [string]    # Nullable. Error details for escalation context.
    TimedOut  = [bool]      # Optional. Default $false.
}
```

2. **`ConvertTo-EscalationResult`** -- Validates the hashtable returned by `Read-Escalation`:
```powershell
@{
    Decision        = [string]    # Required. "KeepGoing" | "Stop" | "NoOp"
    TaskId          = [string]    # Nullable. Task ID or $null for workspace/final
    Phase           = [string]    # Nullable. Current phase at escalation
    Source          = [string]    # Required. "task" | "merge" | "final" | "workspace"
    Reason          = [string]    # Nullable. E.g., "Task already recovered"
    PreStopSnapshot = [hashtable] # Nullable. Pre-mutation task status clone (Stop only)
}
```

3. **`ConvertTo-MergeResult`** -- Validates the hashtable returned by merge operations:
```powershell
@{
    TaskId           = [string] # Required.
    Success          = [bool]   # Required.
    Conflict         = [bool]   # Required.
    RetryCount       = [int]    # Required.
    AbortedClean     = [bool]   # Required. Whether git merge --abort succeeded.
    WorkspaceRemoved = [bool]   # Optional. Default $false. (objection #71)
}
```

4. **`ConvertTo-ValidationResult`** -- Validates the hashtable returned by `Test-ImplementationPlan`:
```powershell
@{
    Status   = [string] # Required. "valid" | "failed"
    Errors   = [array]  # Required. Array of error strings (may be empty).
    Warnings = [array]  # Required. Array of warning strings (may be empty).
}
```

Each constructor is idempotent: passing an already-constructed result returns it unchanged after re-validation. This allows defensive re-validation at module boundaries.

**Dependencies:** None

**Test (write first):**
`tests/result-contracts.Tests.ps1` (create) -- For each constructor: assert valid input produces correct hashtable. Assert missing required key throws `ArgumentException` with key name in message. Assert wrong type throws (e.g., `TaskId = 42` instead of string). Assert nullable fields accept `$null`. Assert `ConvertTo-TaskResult` rejects invalid Phase values (e.g., `"banana"`). Assert `ConvertTo-EscalationResult` rejects invalid Decision values. Assert `ConvertTo-ValidationResult` includes `Warnings` array (objection #38). Assert idempotency: double-construct returns same result. Assert `ConvertTo-TaskResult` defaults `TimedOut` to `$false` when omitted. Assert `ConvertTo-EscalationResult` includes `PreStopSnapshot` key (nullable). Assert `ConvertTo-MergeResult` includes `WorkspaceRemoved` field with default `$false` (objection #71).

**TLA+ Coverage:**
- Infrastructure support: provides typed contracts for all state transitions
- Invariant enforcement: Phase/Status validation at construction time maps to `TypeOK`

---

### Step 4: Agent Prompt Files

**Files:**
- `agents/code-writers/typescript-writer.md` (create)
- `agents/code-writers/hono-writer.md` (create)
- `agents/code-writers/ui-writer.md` (create)
- `agents/code-writers/powershell-writer.md` (create)
- `agents/code-writers/merge-resolver.md` (create)
- `agents/code-writers/agent-writer.md` (create)
- `agents/test-writers/vitest-writer.md` (create)
- `agents/test-writers/playwright-writer.md` (create)
- `agents/test-writers/pester-writer.md` (create)

**Description:**
Create all 9 agent prompt markdown files required by Stage 8. Each prompt defines the agent's role, expected inputs (ticket context, file list, test output), output format matching `Invoke-ClaudeTestDouble` response schema using the corrected real `Invoke-Claude` parameter signature (objections #43, #50): `{ filesModified: [{path, action}], summary }`, and constraints. The agent-writer prompt specifies single-call semantics (no TDD cycle). The merge-resolver prompt specifies it receives both tickets, conflict diff, and affected files. Test writers include the RED retry verdict schema (`{ verdict: "revised" | "already_implemented", ... }`). Each prompt references the verify commands from `$Config`. The powershell-writer prompt is for PowerShell domain logic (e.g., Stage 8's own utilities). The pester-writer prompt is for Pester tests (.Tests.ps1). Each prompt specifies that the agent must NOT use `ScriptBlock::Create` or `Invoke-Expression` for command execution (objection #32).

**Agent prompt file validation** is performed by `Test-ImplementationPlan` (Step 5) as part of writer-type validation: it asserts each registered agent file exists and contains the required `## Role`, `## Expected Inputs`, and `## Output Format` sections. This eliminates the need for a separate `agent-prompts.Tests.ps1` file (objection #60).

**Dependencies:** None

**Test (write first):**
No separate test file. Agent prompt validation is covered by `tests/validate-plan.Tests.ps1` (Step 5) which asserts each agent file referenced by the plan exists and contains required sections (`## Role`, `## Expected Inputs`, `## Output Format`). For test writers: asserts contains `verdict` schema documentation. For agent-writer: asserts contains "single call" or "no retry" language. For merge-resolver: asserts contains "conflict diff" and "both tickets" language. This consolidation avoids a test-only task for static markdown file validation (objection #60).

**TLA+ Coverage:**
- Supports transitions: `RedTestsFail`, `RedTestsPassUnexpectedly`, `RedRetryRevised`, `RedRetryAlreadyImplemented`, `GreenTestsPass`, `GreenTestsFail`, `CleanupRemediate`, `AgentWriterComplete`, `MergeConflictResolve`
- Invariant: S3 (AgentWriterNoTdd) -- agent-writer prompt constrains its own behavior

---

### Step 5: Plan Validation

**Files:**
- `utils/validate-plan.ps1` (create)

**Description:**
Implement `Test-ImplementationPlan` which validates `implementation-plan.json` before any task executes. Returns a `ConvertTo-ValidationResult` typed hashtable (Step 3). Checks: (1) JSON schema conformance (tiers array, task objects with required fields: id, step, title, files, codeWriter, testWriter, dependencies), (2) no intra-tier dependencies (task dependencies must reference tasks in earlier tiers), (3) all codeWriter values match registered agent files in `agents/code-writers/*.md` and all testWriter values match `agents/test-writers/*.md` (with null/empty codeWriter and null/empty testWriter allowed for test-only or prompt-only tasks), (4) all dependency task IDs reference existing tasks, (5) no duplicate task IDs, (6) orphaned workspace detection (check for pre-existing worktree branches matching the `feature/*-T<N>` naming convention that would collide), (7) **agent file content validation (objection #60):** each registered agent file is checked for required sections (`## Role`, `## Expected Inputs`, `## Output Format`); test writer files are checked for `verdict` schema; agent-writer file is checked for "single call" language; merge-resolver file is checked for "conflict diff" and "both tickets" language. On failure, the pipeline halts immediately.

**File-overlap advisory warnings (objection #38):** When two tasks in the same tier reference the same file in their `files` array, add a warning to the `Warnings` array of the validation result. This is advisory (does not fail validation) because legitimate same-tier file overlap is possible when tasks modify different functions in the same file. The warning includes: task IDs, conflicting file path, and tier number. The orchestrator logs these warnings and they appear in the escalation context if a merge conflict occurs later (providing early diagnosis of the root cause).

**Atomic concurrent pipeline lock (BLOCKING objection #47):** Before validation begins, attempt to create a lock file at `docs/<feature>/pipeline.lock` using `[System.IO.File]::Open($path, [System.IO.FileMode]::CreateNew)`. `CreateNew` atomically fails if the file already exists on NTFS, eliminating the TOCTOU race between `Test-Path` and `Set-Content` that allowed two pipeline instances to both acquire the lock. If the `Open` call throws `IOException` (file exists), read the existing lock file: if the PID inside is still running AND the process name matches (objection #65), reject with error "Another pipeline run is already active (PID: X, RunId: Y, Process: Z)"; if PID is dead or process name does not match (PID reuse), log a warning about stale lock, delete the file, and retry creation. On successful creation, write the current PID, process name, and `$PipelineRunId` to the file handle, then close it. Removal on completion/halt uses `[System.IO.File]::Delete()`.

**Dependencies:** T1, T3

**Test (write first):**
`tests/validate-plan.Tests.ps1` (create) -- Test valid plan passes and returns `ConvertTo-ValidationResult` with `Status = "valid"`. Test intra-tier dependency detected: plan with T1 and T2 both in tier 1 where T2 depends on T1 returns `failed` with error mentioning "intra-tier". Test unknown writer type: plan with `codeWriter: "unknown-writer"` returns `failed`. Test null codeWriter for test-only task: plan with `codeWriter: null` passes validation. Test null testWriter for prompt-only task (objection #60): plan with `testWriter: null` passes validation. Test missing dependency target: T3 depends on T99 which doesn't exist returns `failed`. Test orphaned workspace: mock `git worktree list` returning a colliding branch name returns `failed` with error mentioning "orphaned". Test empty plan (zero tiers) returns `valid`. Test duplicate task IDs rejected. **File-overlap warning (objection #38):** plan with T1 and T2 in tier 1 both referencing `utils/config.ps1`, assert `Status = "valid"` but `Warnings` contains entry mentioning "T1", "T2", and "config.ps1". **Agent file validation (objection #60):** Assert agent file missing `## Role` section returns `failed`. Assert test writer file missing `verdict` schema returns `failed`. Assert agent-writer file missing "single call" language returns `failed`. Assert merge-resolver file missing "conflict diff" returns `failed`. **Atomic lock file tests (BLOCKING objection #47):** Assert lock file created via `[System.IO.File]::Open` with `CreateNew` mode. Assert concurrent creation attempt throws `IOException` (simulated by pre-creating the file). Assert stale lock file (dead PID) is cleaned up with warning. Assert lock file contains correct PID, process name, and RunId. **PID reuse detection (objection #65):** Mock alive PID with wrong process name (lock says "pwsh" but PID belongs to "chrome"), assert lock treated as stale and cleaned up. Mock alive PID with matching process name, assert lock treated as active and creation rejected.

**TLA+ Coverage:**
- Transitions: `ValidationPasses`, `ValidationFails`
- States: `validationStatus` = pending -> valid | failed
- Invariant: S11 (ValidationGatesExecution)

---

### Step 6: Workspace Management

**Files:**
- `utils/workspace.ps1` (create)

**Description:**
Implement workspace lifecycle functions: `New-TaskWorkspace` creates a git worktree for a task (branching from the feature branch with naming convention `feature/<feature-name>-T<N>-<RunId>` where RunId is the truncated pipeline run ID from objection #45), `Remove-TaskWorkspace` cleans up a worktree after successful merge, and `Test-WorkspaceExists` checks if a task's worktree exists. Multi-task tiers create one worktree per task; single-task tiers skip workspace creation entirely (work directly on feature branch). On creation failure (e.g., git worktree add fails), the function throws so the caller can trigger escalation. All git operations use `Invoke-GitWithRetry` (Step 2c, objection #52) to handle Windows file-lock errors.

**Worktree pruning (HIGH objection #54):** `New-TaskWorkspace` calls `git worktree prune` as its first action before creating any new worktrees for a tier. This removes stale worktree entries whose backing directories no longer exist (e.g., from prior crashes where `Stop-ProcessTree` killed a job but the worktree cleanup never ran). Without pruning, stale entries cause `git worktree add` to fail with "already exists" errors.

**Atomic rollback with best-effort failure handling (objection #19):** if creating worktree N/M fails, remove worktrees 1 through N-1 that were already created for that tier. Each `git worktree remove` during rollback is wrapped in its own try/catch. If a rollback removal fails, the error is logged to stderr and the task log, but does NOT throw -- rollback continues for remaining worktrees. After rollback completes, the function throws the original creation error. The thrown exception includes an `OrphanedWorktrees` property listing any worktree paths that could not be removed, so the escalation context can present them to the user for manual cleanup.

**Worktree dirty state reset (HIGH objection #53):** `Reset-WorktreeState` function: called before re-dispatching a recovered task after KeepGoing. **Warning before reset (objection #77):** Before resetting, checks `git status --porcelain` and if non-empty, logs a warning via `Write-TaskLog` including the count of modified and untracked files. This provides an audit trail when user-edited debugging files are discarded. Then runs `git checkout -- .` and `git clean -fd` in the task's worktree to discard all uncommitted changes left by a killed claude CLI process. If the worktree is deeply corrupted (e.g., `.git` index lock file exists), falls back to `git worktree remove --force` + `git worktree add` (full recreation). Returns a boolean indicating whether reset succeeded or recreation was needed.

Returns a hashtable mapping task IDs to worktree paths.

**Dependencies:** T1, T2a, T2c

**Test (write first):**
`tests/workspace.Tests.ps1` (create) -- Mock `git worktree add`, `git worktree remove`, and `Invoke-GitWithRetry`. Assert `New-TaskWorkspace` for multi-task tier creates worktrees with correct branch names including run ID (e.g., `feature/coding-stage-T1-abc123`). Assert single-task tier returns `$null` workspace path. Assert `Remove-TaskWorkspace` calls `git worktree remove` and `git branch -d`. Assert creation failure triggers rollback: mock 3rd worktree creation to fail, verify first 2 are removed. Assert rollback removes worktrees in reverse order. Assert branch naming convention matches `feature/<name>-T<id>-<runId>` pattern. Assert `Test-WorkspaceExists` returns correct boolean. **Rollback-during-rollback test (objection #19):** mock 3rd worktree creation fails AND 1st worktree removal during rollback also fails; assert 2nd worktree removal still attempted; assert thrown exception contains `OrphanedWorktrees` list with the 1st worktree path; assert error logged to stderr. **Worktree pruning tests (HIGH objection #54):** Assert `git worktree prune` called as first action in `New-TaskWorkspace`. Mock `git worktree list` showing a stale entry, assert prune removes it before new worktree creation. **Reset-WorktreeState tests (HIGH objection #53):** Create mock dirty worktree with uncommitted files, call `Reset-WorktreeState`, assert `git checkout -- .` and `git clean -fd` called. Mock index lock (`.git/index.lock` exists), assert fallback to `git worktree remove --force` + `git worktree add`. Assert returns boolean indicating reset vs recreation. **Reset warning test (objection #77):** Mock `git status --porcelain` returning 3 modified files and 1 untracked file, assert `Write-TaskLog` called with warning mentioning "4 uncommitted" before reset. Mock clean worktree, assert no warning logged. **Invoke-GitWithRetry integration (HIGH objection #52):** Assert all git operations go through `Invoke-GitWithRetry`, not raw git calls.

**TLA+ Coverage:**
- Transitions: `StartNextTier` (workspace creation), `WorkspaceCreationFailure`, `MergeSuccess` (workspace cleanup), `EscalationStop` (workspace preservation)
- States: `workspaceExists`, `workspaceMerged`
- Invariants: S5 (NoOrphanedWorkspaces), S6 (SingleTaskNoWorkspace), S12 (WorkspaceCreationSafety)

---

### Step 7: Escalation Handling

**Files:**
- `utils/read-escalation.ps1` (create)

**Description:**
Implement `Read-Escalation` as a **decision-only** function that does NOT mutate counter state. This addresses HIGH objection #5 from round 1. Counter resets are fully owned by each phase module (BLOCKING objection #16 from round 2).

`Read-Escalation` displays the escalated context (task ID, phase, failure details, error output) and prompts the user for a decision: **Keep Going** or **Stop**. Returns a `ConvertTo-EscalationResult` typed hashtable (Step 3).

**Thread-safety guard (objection #21):** `Read-Escalation` checks `[System.Threading.Thread]::CurrentThread.IsThreadPoolThread` at entry. If true, throws `[System.InvalidOperationException]` with message "Read-Escalation cannot be called from a thread job. Return escalation result to the main thread." Thread jobs signal escalation by returning `@{ Escalated = $true; TaskId = ...; Phase = ...; Error = ... }` in their result hashtable; the orchestrator (main thread) calls `Read-Escalation`.

**Idempotency guard (objection #24):** Before presenting the prompt, `Read-Escalation` checks the task's current status. If the task is already `"running"` or `"completed"`, returns `ConvertTo-EscalationResult @{ Decision = "NoOp"; Source = $Source; Reason = "Task already recovered" }` without prompting the user. This prevents duplicate resume invocations from re-dispatching completed tasks.

**Escalation routing guard for taskPhase=done (objection #27):** If `Source = "task"` but `taskPhase = "done"`, the task was actually escalated during merge (the `MergeExhausted` transition sets `taskStatus = "escalated"` but `taskPhase` is already `"done"` because the TDD cycle completed). `Read-Escalation` detects this and reroutes: sets `Source = "merge"` in the returned result so the orchestrator dispatches to `Reset-MergeCounters` instead of a task-phase reset. Without this guard, the orchestrator would look up `"task:done"` in the dispatch table, find no entry, and silently skip the counter reset -- leaving the merge permanently stuck.

**taskStatus restoration for all phases (HIGH objection #59):** On KeepGoing, `Read-Escalation` always includes `Status = "running"` in its result. The orchestrator uses this to set `taskStatus = "running"` for the recovered task regardless of phase. This includes infrastructure failure recovery for `red`, `green`, and `agent_call` phases where no counter reset is needed but the task status MUST be restored from `"escalated"` to `"running"`. The TLA+ `EscalationKeepGoing` action explicitly sets `taskStatus' = "running"` for all cases.

**Pre-mutation task status snapshot for EscalationStop (objection #36):** When `Read-Escalation` returns `Decision = "Stop"`, it also returns a `PreStopSnapshot` key containing a clone of the current `taskStatus` hashtable. The orchestrator uses this snapshot (not the post-mutation status) to decide which workspaces to preserve. This is critical because `EscalationStop` mutates running tasks to `"skipped"`, but workspace preservation depends on the task being `"running"` at the time of the stop decision.

**Dispatch key validator (objection #70):** Export `Get-ResetDispatchKey` function that constructs and validates dispatch keys. Accepts `$Source` (must be in `@("task", "merge", "final", "workspace")`) and `$Phase` (must be in `PhaseSet` or empty string for non-task sources) parameters. Returns the formatted key string (e.g., `"task:red_retry"`, `"merge:"`, `"final:"`). Throws `[System.ArgumentException]` for unrecognized values. This replaces raw string concatenation in the orchestrator's dispatch table lookups, preventing silent misrouting from typos.

**Counter reset dispatch table (objection #16):** `Read-Escalation` does NOT reset counters. Instead, the orchestrator (Step 15) dispatches to the phase module's exported reset function based on `Source` + `Phase`:

| Source | Phase | Reset Function | Module |
|--------|-------|----------------|--------|
| task | red_retry | `Reset-RedCounters` | tdd-red.ps1 |
| task | green_retry | `Reset-GreenCounters` | tdd-green.ps1 |
| task | cleanup, cleanup_remed | `Reset-CleanupCounters` | tdd-cleanup.ps1 |
| task | red, green, agent_call | *(none -- infra failure, status restore only)* | -- |
| merge | -- | `Reset-MergeCounters` | merge-queue.ps1 |
| final | -- | `Reset-FinalCounters` | final-verification.ps1 |
| workspace | -- | *(clear wsCreationFailed)* | orchestrator |

Each reset function lives in the module that owns the counters, preserving bounded context. The orchestrator holds only the dispatch table (source+phase -> function name), not the counter semantics. All dispatch table lookups use `Get-ResetDispatchKey` for validation (objection #70).

Supports multiple simultaneous escalations: the orchestrator calls `Read-Escalation` in a loop until all escalated items are resolved.

**Dependencies:** T1, T2a, T3

**Test (write first):**
`tests/read-escalation.Tests.ps1` (create) -- Mock `Read-Host` to simulate user input. Test `Read-Escalation` returns `ConvertTo-EscalationResult` typed hashtable for each source type. Test KeepGoing decision returns `Decision = "KeepGoing"`. Test Stop decision returns `Decision = "Stop"` and includes `PreStopSnapshot` (objection #36). Test **thread-safety guard (objection #21):** mock `IsThreadPoolThread` = `$true`, assert `InvalidOperationException` thrown. Test **idempotency guard (objection #24):** task status already `"running"`, assert returns `Decision = "NoOp"` without calling `Read-Host`. Test task status already `"completed"`, assert returns `Decision = "NoOp"`. Test **taskPhase preservation (objection #18):** after infrastructure failure in GREEN phase, assert returned hashtable has `Phase = "green"` (not mutated). Test **routing guard for done phase (objection #27):** task with `taskPhase = "done"` and `Source = "task"`, assert returned result has `Source = "merge"`. Test multiple escalations: two tasks escalated, assert loop resolves both. Test dispatch table: assert each source+phase combination maps to correct reset function name (table lookup, not execution -- execution is tested in phase module tests). Test **PreStopSnapshot (objection #36):** assert snapshot captures pre-mutation status, mock a task that is `"running"`, assert snapshot shows `"running"` even though post-stop status would be `"skipped"`. Test **infra-failure status restoration (HIGH objection #59):** mock infra failure in `green` phase, KeepGoing selected, assert returned result includes `Status = "running"`. Mock infra failure in `red` phase, assert same. Mock infra failure in `agent_call` phase, assert same. **Dispatch key validator tests (objection #70):** Assert `Get-ResetDispatchKey -Source "task" -Phase "red_retry"` returns `"task:red_retry"`. Assert `Get-ResetDispatchKey -Source "merge" -Phase ""` returns `"merge:"`. Assert `Get-ResetDispatchKey -Source "invalid" -Phase "red"` throws `ArgumentException`. Assert `Get-ResetDispatchKey -Source "task" -Phase "banana"` throws `ArgumentException`. Assert all valid dispatch table keys can be constructed without error.

**TLA+ Coverage:**
- Transitions: `EscalationKeepGoing(t)`, `EscalationKeepGoingMerge`, `EscalationKeepGoingFinal`, `EscalationKeepGoingWorkspace`, `EscalationStop`
- States: `escalationActive`
- Invariant: S8 (EscalationBlocksProgress)
- Liveness: L3 (EscalationResolves)

---

### Step 8: TDD RED Phase

**Files:**
- `utils/tdd-red.ps1` (create)

**Description:**
Implement `Invoke-RedPhase` which dispatches the test writer agent (via `Invoke-Claude` with the corrected real parameter signature per objection #50) to write failing tests for a task. After tests are written, runs the verify-test command via `Invoke-VerifyCommand` (Step 1 -- never `ScriptBlock::Create`, objection #32) in the task's workspace (or feature branch for single-task tiers). Expected outcome: tests FAIL (RED). If tests fail: return `ConvertTo-TaskResult` with phase `"green"` (advance to GREEN phase). If tests pass unexpectedly: enter RED retry loop. In retry, the test writer returns a verdict: `"revised"` (re-prompts with revised tests, increment `redRetries`, restart RED) or `"already_implemented"` (skip GREEN, go directly to cleanup). If `redRetries` reaches `MaxRedRetries`: return with status `"escalated"`. **Critical boundary check**: before dispatching Invoke-Claude for retry, check `redRetries < MaxRedRetries` first -- never dispatch if already at max. Infrastructure failures (exit code 127, timeout) trigger immediate escalation without consuming a retry. **Completion marker ordering (objection #75):** `COMPLETED` or `ESCALATED` marker is written to the task log as the LAST action before returning `TaskResult`.

Export `Reset-RedCounters` function: accepts a task state hashtable, sets `redRetries` to 0, returns the modified state. This is called by the orchestrator's escalation dispatch table (objection #16).

**Dependencies:** T1, T2a, T2d, T3, T4

**Test (write first):**
`tests/tdd-red.Tests.ps1` (create) -- Mock `Invoke-Claude` using `Invoke-ClaudeTestDouble` pattern with corrected signature (objections #43, #50) and `Invoke-VerifyCommand`. Test happy path: mock test runner returns exit code 1 (failure), assert function returns `ConvertTo-TaskResult` with phase `"green"`. Test tests-pass-unexpectedly: mock exit code 0, then mock test writer verdict `"revised"`, assert `redRetries` incremented, function re-enters RED. Test already-implemented verdict: mock verdict `"already_implemented"`, assert function returns phase `"cleanup"`. Test retry exhaustion: set `redRetries` to `MaxRedRetries`, mock tests pass, assert returns status `"escalated"`. **Boundary test**: set `redRetries` to `MaxRedRetries`, assert `Invoke-Claude` is NOT called (check before dispatch, not after). Test infrastructure failure: mock exit code 127, assert returns `"escalated"` with `redRetries` unchanged. Test workspace path: assert `Invoke-VerifyCommand` runs in correct working directory (worktree path for multi-task, feature branch for single-task). **Reset-RedCounters test:** assert `Reset-RedCounters` sets `redRetries` to 0 and leaves other fields unchanged. **Malformed JSON test (objection #67):** Mock `Invoke-Claude` returning `{ "content": "hello" }` with no `verdict` key during RED retry, assert re-prompted (counts as an attempt) or escalated with descriptive error mentioning missing `verdict`.

**TLA+ Coverage:**
- Transitions: `RedTestsFail(t)`, `RedTestsPassUnexpectedly(t)`, `RedRetryRevised(t)`, `RedRetryAlreadyImplemented(t)`, `RedRetryExhausted(t)`, `InfrastructureFailure(t)` (during RED)
- States: task phase `red`, `red_retry`; counter `redRetries`
- Invariants: S2 (RetryBounds -- redRetries <= MaxRedRetries), S9 (GreenAfterRed)

---

### Step 9: TDD GREEN Phase

**Files:**
- `utils/tdd-green.ps1` (create)

**Description:**
Implement `Invoke-GreenPhase` which dispatches the code writer agent (via `Invoke-Claude` with the corrected real parameter signature per objection #50) to make tests pass. After code is written, runs verify-test command via `Invoke-VerifyCommand`. Expected: tests PASS (GREEN). If tests pass: return `ConvertTo-TaskResult` with phase `"cleanup"`. If tests fail: increment `greenAttempts` (counter increments on failure, not on retry -- the fencepost fix from TLA+ Revision 2), enter GREEN retry. If code writer modifies test files: reject the change, re-prompt (counts as a failed attempt). If response is non-JSON, empty, or truncated: re-prompt (also counts as a failed attempt). **Critical boundary check**: before dispatching Invoke-Claude for retry, check `greenAttempts < MaxTddCycles` first -- never dispatch if already at max. If `greenAttempts` reaches `MaxTddCycles`: return with status `"escalated"`. Infrastructure failures trigger immediate escalation without incrementing the attempt counter. **Completion marker ordering (objection #75):** `COMPLETED` or `ESCALATED` marker is written to the task log as the LAST action before returning `TaskResult`.

Export `Reset-GreenCounters` function: accepts a task state hashtable, sets `greenAttempts` to 0, returns the modified state. This is called by the orchestrator's escalation dispatch table (objection #16).

**Dependencies:** T1, T2a, T2d, T3, T4

**Test (write first):**
`tests/tdd-green.Tests.ps1` (create) -- Mock `Invoke-Claude` using `Invoke-ClaudeTestDouble` pattern with corrected signature (objections #43, #50) and `Invoke-VerifyCommand`. Test happy path: mock tests pass (exit 0), assert returns `ConvertTo-TaskResult` with phase `"cleanup"`. Test tests fail: mock exit 1, assert `greenAttempts` incremented by 1, function retries. Test fencepost: start with `greenAttempts` = `MaxTddCycles - 1`, mock failure, assert `greenAttempts` becomes `MaxTddCycles`, assert returns status `"escalated"`. **Boundary test**: set `greenAttempts` to `MaxTddCycles`, assert `Invoke-Claude` is NOT called. Test code writer modifies test file: mock `filesModified` including a test file path, assert change rejected and attempt counter incremented. Test response-format failure: mock non-JSON response from Invoke-Claude, assert re-prompted and attempt counted. Test infrastructure failure: mock exit 127, assert `"escalated"` returned with `greenAttempts` unchanged. **Reset-GreenCounters test:** assert sets `greenAttempts` to 0 and leaves other fields unchanged. **Malformed JSON test (objection #67):** Mock `Invoke-Claude` returning valid JSON with missing `filesModified` key, assert re-prompted (counts as attempt) or escalated with descriptive error.

**TLA+ Coverage:**
- Transitions: `GreenTestsPass(t)`, `GreenTestsFail(t)`, `GreenRetry(t)`, `GreenRetryExhausted(t)`, `InfrastructureFailure(t)` (during GREEN)
- States: task phase `green`, `green_retry`; counter `greenAttempts`
- Invariants: S2 (RetryBounds -- greenAttempts <= MaxTddCycles), S9 (GreenAfterRed)

---

### Step 10: TDD Cleanup Phase

**Files:**
- `utils/tdd-cleanup.ps1` (create)

**Description:**
Implement `Invoke-CleanupPhase` which runs the verify command triple (test, lint, tsc) in sequence via `Invoke-VerifyCommand` (Step 1) with **short-circuit on first failure**. When any command fails, the remaining commands in that pass are skipped and remediation triggers immediately. This matches TLA+ `CleanupFail` which transitions on any single command failure (not after running all three).

Requires `CleanupPasses` consecutive clean passes (all 3 commands succeed = 1 clean pass). On any failure: reset `cleanupCleanPasses` to 0, enter remediation. Remediation: the test writer determines blame (`"test"` or `"code"`), then the appropriate writer fixes the issue. Both blame paths have identical state transitions (increment `cleanupRemediations`, return to cleanup). Unrecognized blame values trigger re-prompt (absorbed into same remediation step). **Critical boundary check**: before entering remediation dispatch, check `cleanupRemediations < MaxFixRounds` first. If `cleanupRemediations` reaches `MaxFixRounds`: return with status `"escalated"`. On `CleanupPasses` consecutive passes: return `ConvertTo-TaskResult` with phase `"done"`, status `"completed"`. **Completion marker ordering (objection #75):** `COMPLETED` or `ESCALATED` marker is written to the task log as the LAST action before returning `TaskResult`.

Export `Reset-CleanupCounters` function: accepts a task state hashtable, sets BOTH `cleanupRemediations` to 0 AND `cleanupCleanPasses` to 0, returns the modified state. Both counters must reset to prevent stale pass counts from surviving human intervention (TLA+ Revision 3 fix). This is called by the orchestrator's escalation dispatch table (objection #16).

**Dependencies:** T1, T2a, T2d, T3, T4

**Test (write first):**
`tests/tdd-cleanup.Tests.ps1` (create) -- Mock `Invoke-VerifyCommand` and `Invoke-Claude` using `Invoke-ClaudeTestDouble` pattern with corrected signature (objections #43, #50). Test happy path: mock all 3 verify commands pass twice, assert returns `ConvertTo-TaskResult` with phase `"done"` after 2 passes. Test single failure resets counter: mock pass, then fail on lint, assert `cleanupCleanPasses` reset to 0 and remediation triggered. Test **short-circuit**: mock lint fails, assert tsc is NOT invoked in that pass. Test blame="test": mock test writer returns blame `"test"`, assert test writer dispatched for fix, `cleanupRemediations` incremented. Test blame="code": mock blame `"code"`, assert code writer dispatched. Test unrecognized blame: mock blame `"banana"`, assert re-prompted (still counts as one remediation). **Boundary test**: set `cleanupRemediations` to `MaxFixRounds`, mock failure, assert `Invoke-Claude` NOT called for remediation, returns status `"escalated"`. Test verify command sequence: assert test runs before lint, lint before tsc (ordered execution). **Reset-CleanupCounters test:** assert sets BOTH `cleanupRemediations` and `cleanupCleanPasses` to 0, leaves other fields unchanged. **Infrastructure failure during cleanup (objection #33):** mock verify command returns exit code 127 during cleanup, assert returns status `"escalated"` with `cleanupRemediations` unchanged (infra failure does not consume a remediation). **CleanupExhausted from cleanup_remed phase (objection #35):** set `cleanupRemediations` to `MaxFixRounds` while task is in `cleanup_remed` phase (mid-remediation), assert returns `"escalated"` without dispatching another fix attempt. **Blame-fork correctness tests (objection #68):** (a) Mock blame = "test", assert `$SystemPromptFile` parameter to `Invoke-Claude` points to the test writer agent prompt file. (b) Mock blame = "code", assert `$SystemPromptFile` points to the code writer agent prompt file. **Malformed JSON test (objection #67):** Mock `Invoke-Claude` returning valid JSON with missing `blame` key during triage, assert re-prompted (counts as remediation) or escalated with descriptive error.

**TLA+ Coverage:**
- Transitions: `CleanupPass(t)`, `CleanupComplete(t)`, `CleanupFail(t)`, `CleanupRemediate(t)`, `CleanupExhausted(t)`, `InfrastructureFailure(t)` (during cleanup)
- States: task phase `cleanup`, `cleanup_remed`; counters `cleanupRemediations`, `cleanupCleanPasses`
- Invariants: S2 (RetryBounds), S10 (CleanupOnlyForTdd)

---

### Step 11: Agent-Writer Dispatch

**Files:**
- `utils/agent-writer.ps1` (create)

**Description:**
Implement `Invoke-AgentWriter` for non-TDD tasks (e.g., agent-writer creating markdown agent files). Dispatches a single `Invoke-Claude` call (with the corrected real parameter signature per objection #50) with the agent-writer prompt and task ticket. No retry loop, no test/verify cycle. On success: return `ConvertTo-TaskResult` with phase `"done"`, status `"completed"`. On infrastructure failure (exit 127, timeout): escalate immediately. The agent-writer prompt file (`agents/code-writers/agent-writer.md`) defines single-call semantics. This function must never enter RED, GREEN, or cleanup phases. **Completion marker ordering (objection #75):** `COMPLETED` or `ESCALATED` marker is written to the task log as the LAST action before returning `TaskResult`. **Re-dispatch idempotency (objection #75):** Before dispatching, checks for pre-existing output files from a prior execution. If the agent's output files already exist (detected via `filesModified` in the task log), skips re-execution and returns the existing result.

**Dependencies:** T1, T2a, T2d, T3, T4

**Test (write first):**
`tests/agent-writer.Tests.ps1` (create) -- Mock `Invoke-Claude` using `Invoke-ClaudeTestDouble` pattern with corrected signature (objections #43, #50). Test happy path: mock successful response with `filesModified`, assert returns `ConvertTo-TaskResult` with phase `"done"`, status `"completed"`. Test infrastructure failure: mock exit 127, assert task escalated. Test never enters TDD: assert function does not call any `Invoke-VerifyCommand`. Test single call: assert `Invoke-Claude` called exactly once (no retry loop). Test WriterType guard: pass a TDD task (WriterType = "tdd"), assert function throws or rejects. **Re-dispatch idempotency test (objection #75):** Mock pre-existing output files from prior execution, assert `Invoke-Claude` NOT called, existing result returned. **Completion marker test (objection #75):** Assert `COMPLETED` marker is the final log entry written before `TaskResult` return.

**TLA+ Coverage:**
- Transition: `AgentWriterComplete(t)`, `InfrastructureFailure(t)` (during agent_call)
- States: task phase `agent_call`, `done`
- Invariant: S3 (AgentWriterNoTdd)

---

### Step 12: Merge Queue

**Files:**
- `utils/merge-queue.ps1` (create)

**Description:**
Implement the serial merge queue that processes completed workspace tasks. Uses `[System.Collections.Concurrent.ConcurrentQueue[string]]` for thread-safe FIFO enqueue from concurrent task completions (objection #41). All git operations use `Invoke-GitWithRetry` (Step 2c, objection #52) to handle Windows file-lock errors.

**Atomic duplicate prevention (BLOCKING objection #78):** Uses a `[System.Collections.Concurrent.ConcurrentDictionary[string,bool]]` (`$MergeTracker`) as an atomic gate for enqueue. `Add-MergeQueue` calls `$MergeTracker.TryAdd($taskId, $true)` -- if it returns `$true`, the task is enqueued to the `ConcurrentQueue`; if `$false`, the task is already tracked and enqueue is skipped. **`ContainsKey` is NEVER used for gate decisions.** The dictionary entry is removed only after merge completion (`MergeSuccess`) or escalation recovery (`EscalationKeepGoingMerge`). This eliminates the TOCTOU race where two concurrent `Add-MergeQueue` calls for the same task could both pass a `ContainsKey` check and both enqueue.

Functions: `Add-MergeQueue` (atomic enqueue via `TryAdd` gate, reject when `$escalationActive` is `$true` for defense-in-depth per objection #72), `Start-NextMerge` (dequeue head via `TryDequeue`, set `mergeInProgress`; only when nothing in-progress), `Invoke-Merge` (attempt `git merge`, handle conflicts), `Resolve-MergeConflict` (dispatch merge-resolver agent with both tickets and conflict diff).

**Merge abort before retry (BLOCKING objection #14):** after detecting a merge conflict, `Invoke-Merge` MUST call `git merge --abort` to restore the working tree to a clean state BEFORE dispatching the merge-resolver agent. Without this, the failed resolution leaves dirty working tree state (conflict markers, partial merges) that corrupts subsequent retries. The sequence per retry is: (1) `git merge` fails with conflict, (2) `git merge --abort`, (3) increment `mergeRetries`, (4) dispatch merge-resolver to produce a resolution patch, (5) apply patch and re-attempt `git merge`. Each retry follows this same abort-resolve-retry cycle. Returns `ConvertTo-MergeResult` typed hashtable (Step 3) including `WorkspaceRemoved` field (objection #71).

Post-merge verification: run verify commands via `Invoke-VerifyCommand` after each successful merge; failure consumes a merge retry (shared budget with conflict resolution per TLA+ spec). `MaxMergeRetries` bounds the total across both conflict resolution and post-merge verification for a single task.

On `MergeSuccess`: mark `workspaceMerged = TRUE`, call `Remove-TaskWorkspace`, set `WorkspaceRemoved = $true` in result, remove task from `$MergeTracker`. On conflict with retries remaining: increment `mergeRetries`, attempt resolution. **Critical boundary check**: before dispatching merge-resolver, check `mergeRetries < MaxMergeRetries`. On `mergeRetries >= MaxMergeRetries`: mark task `"escalated"`, set `escalationActive`.

**Infrastructure failure during merge-resolver (HIGH objection #58):** If `Invoke-Claude` for the merge-resolver returns exit code 127 or times out, the merge is escalated as an infrastructure failure WITHOUT consuming a `mergeRetries` increment. This matches the `InfrastructureFailure(t)` transition which does not increment any retry counter.

Single-task tiers bypass the merge queue entirely (`SingleTaskTierComplete`): mark `workspaceMerged = TRUE` without git merge.

Export `Reset-MergeCounters` function: accepts a task state hashtable, sets `mergeRetries` to 0, restores task status to `"completed"`, returns the modified state. After recovery, `mergeInProgress` remains set -- the merge retries from where it left off. Removes and re-adds the task in `$MergeTracker` to allow re-enqueue if needed. This is called by the orchestrator's escalation dispatch table (objection #16).

**Dependencies:** T1, T2a, T2c, T2d, T3, T6, T7

**Test (write first):**
`tests/merge-queue.Tests.ps1` (create) -- Mock git commands via `Invoke-GitWithRetry` and `Invoke-Claude` using `Invoke-ClaudeTestDouble` pattern with corrected signature (objections #43, #50). Test enqueue: assert task added to queue, duplicate rejected. Test serial processing: enqueue T1 and T2, start merge, assert only T1 merging, T2 still queued. Test merge success: mock clean merge, assert `ConvertTo-MergeResult` returned with `Success = $true`, `WorkspaceRemoved = $true` (objection #71), `workspaceMerged` = true, workspace removed, `$MergeTracker` entry removed. Test merge conflict: mock conflict, assert **`git merge --abort` called before resolver dispatch** (objection #14), assert merge-resolver dispatched with ticket context, `mergeRetries` incremented. Test post-merge verification failure: mock merge succeeds but verify fails, assert retry consumed from same `MaxMergeRetries` budget. Test budget sharing: 2 conflict resolutions + 1 post-merge failure = 3 retries = exhausted at MaxMergeRetries=3. **Boundary test**: set `mergeRetries` to `MaxMergeRetries`, assert `Invoke-Claude` NOT called for resolution, task escalated. Test single-task tier: assert `SingleTaskTierComplete` marks merged without git merge. Test in-progress not also queued (S4). Test merge-resolver receives both tickets and conflict diff. **Merge recovery test**: after EscalationKeepGoingMerge, assert `mergeRetries` = 0, task status = `"completed"`, `mergeInProgress` still set, and subsequent MergeSuccess/MergeConflictResolve can proceed to completion. **Reset-MergeCounters test:** assert sets `mergeRetries` to 0, restores task status to `"completed"`, leaves `mergeInProgress` unchanged. **Abort sequence test:** mock 3 consecutive conflict-resolve cycles; assert `git merge --abort` called before each resolver dispatch (not just the first). **FIFO ordering (objection #41):** enqueue T3, T1, T2 from concurrent completions, assert dequeue order is T3, T1, T2. **Infrastructure failure during merge-resolver (HIGH objection #58):** Mock `Invoke-Claude` for merge-resolver returns exit code 127, assert merge escalated as infrastructure failure with `mergeRetries` unchanged (not consumed). Mock merge-resolver timeout, assert same behavior. **Atomic duplicate prevention (BLOCKING objection #78):** Simulate two concurrent `Add-MergeQueue` calls for same task ID using separate thread jobs, assert exactly one enqueue occurs (one `TryAdd` returns `$true`, other returns `$false`). Assert `ContainsKey` is never called (grep production code for `ContainsKey`, assert zero matches). **Escalation-active guard (objection #72):** Mock `$escalationActive = $true`, call `Add-MergeQueue`, assert enqueue rejected.

**TLA+ Coverage:**
- Transitions: `EnqueueForMerge(t)`, `StartMerge`, `MergeSuccess`, `MergeConflictResolve`, `MergeExhausted`, `SingleTaskTierComplete(t)`, `EscalationKeepGoingMerge`
- States: `mergeQueue`, `mergeInProgress`, `mergeRetries`, `workspaceMerged`, `workspaceExists`
- Invariants: S4 (MergeSerial), S5 (NoOrphanedWorkspaces)

---

### Step 13: Final Verification

**Files:**
- `utils/final-verification.ps1` (create)

**Description:**
Implement `Invoke-FinalVerification` which runs after all tiers complete. Collects the set of distinct test writers used across all tasks and runs only their verify commands via `Invoke-VerifyCommand` (writer attribution). Follows the two-step remediation cycle matching per-task cleanup: `FinalVerifFail` transitions to `"remediating"` (resets `finalCleanPasses`), `FinalVerifRemediate` applies the fix and increments `finalRemediations`, then returns to `"running"`. Requires `CleanupPasses` consecutive clean passes. **Critical boundary check**: before entering remediation, check `finalRemediations < MaxFixRounds`. On `finalRemediations >= MaxFixRounds`: set `finalVerifPhase` to `"escalated"`. Zero-tier plans skip final verification entirely.

**Writer attribution algorithm for remediation (objections #29, #42):**
1. Run `git diff` to identify changed files in the failure.
2. Map each file to the task that last modified it by scanning task log files (`T<N>-log.txt`) for `filesModified` entries.
3. Count modified files per task in the failure diff.
4. **Tie-breaking (objection #29):** Task with most files in the failure diff wins. On exact tie, lowest task ID wins (deterministic, auditable).
5. Select that winning task's code writer for the remediation dispatch.
6. If a file is not attributable to any task (e.g., pre-existing file not in any task's `filesModified`), use the first task's code writer as fallback.
7. Log the attribution decision (task ID, file count, writer selected) to the pipeline log for audit.

Export `Reset-FinalCounters` function: sets `finalRemediations` to 0, `finalCleanPasses` to 0, AND `finalVerifPhase` to `"running"` (HIGH objection #49). Returns the modified state. The TLA+ `EscalationKeepGoingFinal` action explicitly sets `finalVerifPhase' = "running"` alongside the counter resets -- without the phase transition, final verification remains stuck in `"escalated"` after KeepGoing and can never re-enter its verification loop. This is called by the orchestrator's escalation dispatch table (objection #16).

**Dependencies:** T1, T2a, T2d, T3, T7

**Test (write first):**
`tests/final-verification.Tests.ps1` (create) -- Mock `Invoke-VerifyCommand` and `Invoke-Claude` using `Invoke-ClaudeTestDouble` pattern with corrected signature (objections #43, #50). Test happy path: mock all verify passes twice, assert phase = `"completed"`, pipeline = `"completed"`. Test failure triggers two-step remediation: mock first pass fails, assert phase = `"remediating"`, then mock fix applied, assert `finalRemediations` incremented, phase back to `"running"`. Test clean passes reset on failure: achieve 1 clean pass, then fail, assert `finalCleanPasses` = 0. **Boundary test**: set `finalRemediations` to `MaxFixRounds`, mock failure, assert `Invoke-Claude` NOT called for remediation, phase = `"escalated"`. **Writer attribution (objection #42):** mock failure in files owned by T2, assert T2's code writer dispatched. **Tie-breaking (objection #29):** mock failure spanning files from T1 (2 files) and T2 (3 files), assert T2's writer selected. Mock equal file counts between T1 and T2, assert T1's writer selected (lowest ID). **Unattributable file fallback:** mock failure in file not in any task's log, assert first task's writer used as fallback. Test zero-tier skip: NumTiers = 0, assert final verification not invoked. Test only used writers: if only pester-writer was used across tasks, assert only pester verify commands run. **Reset-FinalCounters test (HIGH objection #49):** assert sets `finalRemediations` to 0, `finalCleanPasses` to 0, AND `finalVerifPhase` to `"running"`. Assert phase transition happens (not just counter reset). Assert after calling `Reset-FinalCounters`, verification loop can re-execute (phase is no longer `"escalated"`).

**TLA+ Coverage:**
- Transitions: `StartFinalVerification`, `FinalVerifPass`, `FinalVerifComplete`, `FinalVerifFail`, `FinalVerifRemediate`, `FinalVerifExhausted`, `EscalationKeepGoingFinal`
- States: `finalVerifPhase`, `finalCleanPasses`, `finalRemediations`
- Invariants: S7 (CompletionRequiresFinalVerif), S2 (RetryBounds)

---

### Step 14: Pipeline State Resolution Update

**Files:**
- `utils/pipeline-state.ps1` (modify)

**Description:**
Extend `Resolve-PipelineState` to handle Stage 8 resume. When `-FromStage 8` is requested:

1. Validate that `implementation-plan.json` and `implementation-plan.md` exist (these are Stage 6/7 outputs).
2. Parse the plan JSON and include it as `$state.Plan`.
3. Collect ticket file paths from `tickets/T<N>-*.md` and include as `$state.Tickets`.
4. Include the TLA+ spec path as `$state.TlaFile`.
5. **Flush orphaned fallback log (HIGH objection #57):** Call `Sync-FallbackLog` (Step 2a) as the first resume action, before parsing `pipeline.log` for state. This recovers any log entries that were written to `pipeline-fallback.log` between the last tier flush and the crash. Without this, tasks that logged to the fallback (due to mutex timeout) before a crash would have their state entries missing from `pipeline.log`, causing incorrect resume decisions.
6. **Partial-tier resume** (addresses MODERATE objection #12): scan task log files (`tickets/T<N>-log.txt`) to detect which tasks have already completed or merged. Build a `$state.CompletedTasks` set and `$state.MergedTasks` set. The orchestrator (Step 15) uses these to:
   - Skip already-completed tasks when restarting a tier.
   - Skip already-merged tasks to avoid workspace collisions.
   - Resume from the tier that contains the first non-completed task (not tier 1).
7. **Dirty merge state detection (BLOCKING objection #15):** For each existing worktree (detected via `git worktree list`), check for unmerged files using `git diff --name-only --diff-filter=U` within the worktree path. If unmerged files are found:
   - Run `git merge --abort` in the affected worktree to restore it to a clean state.
   - Record the affected task ID in `$state.DirtyMergeCleanedTasks` so the orchestrator knows these tasks need merge re-processing.
   - Log the cleanup action to the task's log file.
   If `git merge --abort` fails (e.g., worktree in a state where abort is not applicable), log a warning and include the worktree path in `$state.UnrecoverableWorktrees` for the user to resolve manually.
8. **Stale mergeInProgress detection (objection #28):** Check if a `mergeInProgress` value was persisted in the state file. If so, validate that the referenced task's workspace still exists and task status is not `"skipped"`. If the workspace was cleaned up (e.g., by `EscalationStop`) or task was skipped, clear `mergeInProgress` to 0 and record the task ID in `$state.StaleMergeCleared`. Log the cleanup action. Without this, resume after `EscalationStop` during `MergeExhausted` would attempt to merge a non-existent workspace, causing a crash.
9. **Worktree pruning on resume (HIGH objection #54):** Call `git worktree prune` during resume to clean stale entries from prior crashes before any workspace operations.
10. Return the full state bundle including all prior-stage artifacts (briefing, BDD, TLA+, plan, tickets, resume state).

**Dependencies:** T1, T2a, T2c

**Test (write first):**
`tests/pipeline-state.Tests.ps1` (modify) -- Add tests for Stage 8 resolution. Assert `Resolve-PipelineState -FromStage 8 -Dir $featureDir` returns an object with `Plan` (parsed JSON), `Tickets` (array of ticket file paths), and `TlaFile` (path to .tla file). Assert missing plan JSON throws with actionable error. Assert missing tickets directory throws. Assert Stage 8 state includes all prior stage artifacts. **Partial resume tests**: create mock task log files with "COMPLETED" and "MERGED" entries, assert `CompletedTasks` and `MergedTasks` sets populated correctly. Assert resume tier calculated correctly (first tier with incomplete tasks). Assert empty log files result in no completed/merged tasks. **Fallback log flush on resume (HIGH objection #57):** Assert `Sync-FallbackLog` called before parsing `pipeline.log`. Mock orphaned fallback entries, assert they appear in `pipeline.log` after resume. **Dirty merge state tests (objection #15):** mock `git worktree list` returning a worktree path, mock `git diff --name-only --diff-filter=U` returning unmerged files in that worktree, assert `git merge --abort` called in that worktree, assert task ID in `DirtyMergeCleanedTasks`. Test `git merge --abort` failure: mock abort returns non-zero, assert worktree path in `UnrecoverableWorktrees`, assert no throw. Test clean worktrees: mock no unmerged files, assert `DirtyMergeCleanedTasks` empty. **Stale mergeInProgress tests (objection #28):** mock persisted state with `mergeInProgress = "T2"` but T2's workspace does not exist, assert `mergeInProgress` cleared to 0, `StaleMergeCleared` contains "T2". Mock persisted state with `mergeInProgress = "T2"` and T2 workspace exists, assert `mergeInProgress` preserved. Mock persisted state with `mergeInProgress = "T2"` and T2 status is `"skipped"`, assert `mergeInProgress` cleared. **Worktree prune on resume (HIGH objection #54):** Assert `git worktree prune` called during resume.

**TLA+ Coverage:**
- Infrastructure support: enables `Init` state (pipeline starts with validated prior-stage artifacts)
- Supports mid-tier resume after `EscalationStop` (addresses MODERATE objection #12)
- Addresses BLOCKING objection #15 (dirty merge state cleanup)
- Addresses HIGH objections #28 (stale mergeInProgress), #54 (worktree prune), #57 (fallback log flush)

---

### Step 15: Tier Orchestrator and Main Entry Point

**Files:**
- `stages/8-coding.ps1` (create)

**Description:**
Implement `Invoke-CodingStage` as the main Stage 8 orchestrator. This is the state machine that composes all utility functions into the full pipeline lifecycle:

**Pipeline run ID (objection #45):** Generate `$PipelineRunId = [guid]::NewGuid()` at pipeline start. All log entries include the run ID via `Write-TaskLog`. Worktree branch names include truncated run ID. Lock file created during validation (Step 5) and removed on completion/halt.

**Environment variable setup (objection #62):** Set `$env:ANTHROPIC_BASE_URL` once at pipeline startup, before any thread jobs launch. Never mutate it thereafter. All phase functions receive the base URL as an immutable parameter.

**Pipeline-level timeout (objection #76):** Capture `$pipelineStopwatch = [System.Diagnostics.Stopwatch]::StartNew()` at pipeline start. Before each tier advance and before each merge drain-loop iteration, check `$pipelineStopwatch.Elapsed.TotalSeconds > $Config.PipelineTimeoutSeconds`. On expiry, set `pipelineStatus = "halted"` with descriptive error including elapsed time and timeout value.

1. **Validate plan** (call `Test-ImplementationPlan`; halt on failure -- `ValidationFails`). Log any file-overlap warnings (objection #38).
2. **Zero-tier check**: if NumTiers = 0, set `$currentTier = 1` (matching TLA+ `ZeroTierComplete` which sets `currentTier' = 1` per objection #73), set `pipelineStatus = "completed"`, return (`ZeroTierComplete`).
3. **Tier loop**: for each tier from 1 to NumTiers:
   a. **Skip empty tiers with overshoot guard (objections #23, #66):** `while ($currentTier <= $NumTiers -and (TasksInTier($currentTier)).Count -eq 0) { $currentTier++ }`. This loop runs inside the main tier-advance block, not as a separate action (objection #66 clarification). After the loop, `$currentTier` is either a non-empty tier or at most `$NumTiers + 1`. If `$currentTier > $NumTiers`, break to final verification. This prevents multiple trailing empty tiers from pushing `currentTier` beyond the valid range.
   b. Create workspaces for multi-task tiers (catch creation failure -> set `wsCreationFailed = $true`, `escalationActive = $true`, call `Read-Escalation`; on KeepGoing retry `StartNextTier`; on Stop halt -- `WorkspaceCreationFailure`, `EscalationKeepGoingWorkspace`).
   c. **Dispatch tasks in parallel** using `Invoke-WithTimeout` (wraps `Start-ThreadJob` with per-task timeout from `$Config.TaskTimeouts` -- objection #30). **ErrorActionPreference is injected as `'Stop'` inside each thread job (BLOCKING objection #46)** via the `Invoke-WithTimeout` wrapper, converting all non-terminating errors into terminating exceptions:
      - Each task runs in its own thread job.
      - TDD tasks: RED -> GREEN -> Cleanup (via `Invoke-RedPhase`, `Invoke-GreenPhase`, `Invoke-CleanupPhase`).
      - Agent tasks: single call (via `Invoke-AgentWriter`).
      - **Child PID registry (BLOCKING objection #61):** Thread jobs write their spawned claude CLI PID to the shared `$ChildPidRegistry` ConcurrentDictionary (from `Get-ChildPidRegistry`, Step 2b) immediately after spawning. On timeout, `Invoke-WithTimeout` reads the PID from the registry for `Stop-ProcessTree`. If PID was never registered, falls back to process enumeration filtered by worktree path.
      - **Atomic state snapshot pattern (objection #25):** Each thread job receives an immutable copy of its task's state as parameters. Phase functions operate on this local copy and return a `ConvertTo-TaskResult` typed hashtable (Step 3). The orchestrator applies all `TaskResult` changes in a single synchronized block after `Wait-Job`. If a job crashes mid-execution (unhandled exception or timeout), its `TaskResult` is NOT applied; instead the task is escalated with phase preserved. Phase functions never mutate shared pipeline state directly.
      - **Output pollution guard (HIGH objection #51):** `Invoke-WithTimeout` wraps the script block to suppress stray output. On `Receive-Job`, validates exactly one output object returned. Multiple objects or non-`TaskResult` output triggers escalation with descriptive error.
      - All logging within thread jobs uses `Write-ThreadSafeLog` (mutex-protected).
   d. **Collect results and handle escalations**: after all jobs complete (or timeout), merge per-task `TaskResult` back into the tier state. Process any escalations:
      - Thread jobs that returned `Escalated = $true` or `TimedOut = $true` are presented to the user via `Read-Escalation` (on main thread only -- objection #21).
      - **Worktree dirty state reset before re-dispatch (HIGH objection #53):** Before starting a new thread job for a recovered task, call `Reset-WorktreeState` (Step 6) to discard any uncommitted changes left by the killed process. This prevents corrupted partial writes from affecting the retry.
      - **Escalation routing guard (objection #27):** Before dispatching to task escalation path, check if `taskPhase = "done"`. If so, route to merge escalation path instead. This prevents merge-escalated tasks from being misrouted through the task counter-reset logic.
      - **taskStatus restoration for all phases (HIGH objection #59):** On KeepGoing, set `taskStatus = "running"` for ALL phase types, including `red`, `green`, and `agent_call` where no counter reset occurs. The TLA+ `EscalationKeepGoing` action explicitly sets `taskStatus' = "running"` regardless of phase.
      - **Escalation dispatch with validated keys (objections #16, #70):** The orchestrator holds a dispatch table mapping `Source` + `Phase` to the phase module's reset function. All dispatch table lookups use `Get-ResetDispatchKey` (Step 7) for key construction and validation:
        ```powershell
        $ResetDispatch = @{
            (Get-ResetDispatchKey "task" "red_retry")     = { param($s) Reset-RedCounters $s }
            (Get-ResetDispatchKey "task" "green_retry")   = { param($s) Reset-GreenCounters $s }
            (Get-ResetDispatchKey "task" "cleanup")       = { param($s) Reset-CleanupCounters $s }
            (Get-ResetDispatchKey "task" "cleanup_remed") = { param($s) Reset-CleanupCounters $s }
            (Get-ResetDispatchKey "merge" "")             = { param($s) Reset-MergeCounters $s }
            (Get-ResetDispatchKey "final" "")             = { param($s) Reset-FinalCounters $s }
        }
        ```
        Infrastructure failure phases (`red`, `green`, `agent_call`) have no entry -- no counter reset needed, only status restore.
      - **Pending-escalation queue (objection #39):** If a new escalation arrives (e.g., another task times out) while `Read-Escalation` is waiting for user input on a prior escalation, the new escalation is enqueued in a `$PendingEscalations` list. After each `Read-Escalation` resolution, the loop checks `$PendingEscalations` before proceeding. This prevents lost escalations when multiple tasks fail simultaneously during a slow user response.
      - On KeepGoing: call the appropriate reset function via `Get-ResetDispatchKey` lookup (if applicable), set `taskStatus = "running"`, then **re-dispatch the task in a new thread job (objection #20)** resuming from `taskPhase` (not restarting from RED). The existing phase function entry points support mid-phase resume because they check current state, not history.
      - **Idempotency (objection #24):** Before re-dispatch, check `taskStatus`. If already `"running"` or `"completed"`, skip (no-op). This prevents duplicate resume invocations from re-dispatching completed tasks.
      - **Pre-mutation snapshot for EscalationStop (objection #36):** When Stop is selected, use `PreStopSnapshot` from the escalation result to decide workspace preservation. Capture `$preStopSnapshot` BEFORE mutating task statuses to `"skipped"`. Workspace cleanup decisions use `$preStopSnapshot`: tasks that were `"running"` or `"escalated"` at stop time keep their workspaces; `"completed"` tasks' workspaces are cleaned up.
      - On Stop: halt pipeline, remove lock file.
   e. **Flush fallback log (objection #40):** After all jobs in a tier complete, call `Sync-FallbackLog` (Step 2a) to flush any entries from `pipeline-fallback.log` into `pipeline.log` (handles cases where mutex timeout caused log lines to go to the fallback file).
   f. **Process merge queue with drain-loop (BLOCKING objection #48):** After every task completion (including re-dispatched recoveries), the orchestrator re-enters the merge drain-loop. The drain-loop continues until `mergeQueue` is empty AND `mergeInProgress = 0`. This is re-entered after each escalation KeepGoing resolution. Without this, a recovered task that completes and enqueues for merge after the merge loop has already exited would stall the pipeline permanently because `TierFullyDone` requires `MergeQueueEmpty`. The drain-loop pattern ensures all completed workspace tasks are merged before the tier advances.
   g. **Pipeline timeout check (objection #76):** Before advancing to the next tier, check `$pipelineStopwatch.Elapsed.TotalSeconds > $Config.PipelineTimeoutSeconds`. On expiry, halt pipeline.
   h. Verify tier is fully done (`TierFullyDone`) before advancing.
4. **Final verification** (call `Invoke-FinalVerification`).
5. **Completion**: set `pipelineStatus = "completed"`, remove lock file.

**Partial-tier resume**: when `Resolve-PipelineState` provides `CompletedTasks` and `MergedTasks`, the orchestrator skips those tasks and resumes from the first incomplete tier. This prevents workspace collisions and avoids re-running completed work after an `EscalationStop` + pipeline restart.

Enforces S1 (TiersSequential) by the loop structure. Handles escalation at every point: task exhaustion, merge exhaustion, final verification exhaustion, workspace creation failure, infrastructure failures. All escalation decisions route through `Read-Escalation` (main thread only) + phase module reset functions.

**Dependencies:** T5, T6, T7, T8, T9, T10, T11, T12, T13, T14

**Test (write first):**
`tests/coding-stage.Tests.ps1` (create) -- Mock all utility functions. Test full happy path: 2-tier plan, all tasks succeed, merges succeed, final verification passes -> pipeline `"completed"`. Test validation failure: mock `Test-ImplementationPlan` returns `failed`, assert pipeline `"halted"`, no tasks execute (S11). Test zero-tier plan: NumTiers=0, assert `$currentTier` set to 1 (objection #73), assert pipeline `"completed"` without task execution or final verification. Test empty tier skipped: tier 2 has no tasks, assert tier 3 starts after tier 1 completes. Test tier sequencing (S1): assert tier 2 tasks don't start until all tier 1 tasks are done/skipped. Test workspace creation failure: mock `New-TaskWorkspace` throws on 2nd worktree, assert escalation triggered, `wsCreationFailed` set. Test escalation Stop halts pipeline: mock `Read-Escalation` returns Stop with `PreStopSnapshot`, assert pipeline `"halted"`, running tasks `"skipped"`, workspaces preserved per pre-mutation snapshot (objection #36). Test single-task tier: assert no workspace created, no merge queue processing. Test multi-task tier: assert workspaces created, merge queue processes after completion. Test parallel dispatch: assert `Invoke-WithTimeout` called for each task in tier. Test **ErrorActionPreference injection (BLOCKING objection #46):** assert `Invoke-WithTimeout` injects `$ErrorActionPreference = 'Stop'` in thread jobs. Mock a non-terminating error in GREEN phase (e.g., git command fails silently), assert it surfaces as job failure and triggers `GreenTestsFail` path, NOT `GreenTestsPass`. Test **PID registry on timeout (BLOCKING objection #61):** mock `Invoke-WithTimeout` returns `@{ TimedOut = $true; KilledPids = @(1234, 5678) }` using registered PID, assert task escalated as infrastructure failure, assert killed PIDs logged. Test **PID registry fallback (BLOCKING objection #61):** mock timeout with no PID registered, assert fallback enumeration of `claude.exe` processes occurred. Test **output pollution guard (HIGH objection #51):** mock thread job emitting multiple output objects, assert task escalated with descriptive error, not silent corruption. Test **env var safety (HIGH objection #62):** assert `$env:ANTHROPIC_BASE_URL` set once before thread jobs, never mutated after. Test **thread job crash / atomic state (objection #25):** mock thread job throws unhandled exception, assert pre-crash pipeline state unchanged, task escalated. Test **re-dispatch after escalation (objection #20):** mock KeepGoing for task in GREEN phase, assert `Reset-WorktreeState` called (objection #53) then new thread job started with `taskPhase = "green"`. Test **infra-failure status restoration (HIGH objection #59):** mock infra failure in `green` phase, KeepGoing, assert `taskStatus` restored to `"running"` even with no counter reset. Test **idempotency (objection #24):** mock KeepGoing twice for same task, assert second is no-op. Test **SkipEmptyTier overshoot guard (objections #23, #66):** plan with 3 trailing empty tiers, assert `currentTier` never exceeds `NumTiers + 1`. Test partial resume: provide `CompletedTasks` set, assert those tasks skipped. Test **escalation dispatch table with validated keys (objections #16, #70):** assert cleanup escalation calls `Reset-CleanupCounters` (not a centralized function), assert merge escalation calls `Reset-MergeCounters`, assert all keys constructed via `Get-ResetDispatchKey`. Test **escalation routing guard (objection #27):** mock task with `taskPhase = "done"` escalated, assert routed to merge escalation path not task path. Test **pending escalation queue (objection #39):** two tasks escalate simultaneously, assert both presented to user sequentially, no escalation lost. Test **per-task timeout (objection #30):** mock task with writer `"typescript-writer"`, assert `Invoke-WithTimeout` called with 900s (from `TaskTimeouts`) not 600s (default). Test **fallback log flush (objection #40):** create entries in `pipeline-fallback.log`, assert `Sync-FallbackLog` flushes to `pipeline.log` after tier completion. Test **pipeline run ID (objection #45):** assert run ID generated, assert lock file created, assert lock file removed on completion. Test **file-overlap warning (objection #38):** mock validation returns warnings, assert warnings logged but pipeline continues. Test **stale mergeInProgress (objection #28):** mock resume state with stale `mergeInProgress`, assert cleared before tier processing. Test **merge queue drain-loop after recovery (BLOCKING objection #48):** mock task recovery completing and enqueuing for merge after initial merge loop exited, assert drain-loop re-entered and merge processed before `TierFullyDone` check. Assert `TierFullyDone` not checked until drain-loop confirms queue empty AND `mergeInProgress = 0`. Test **EscalationKeepGoingFinal phase transition (HIGH objection #49):** mock final verification exhausted, KeepGoing selected, assert `Reset-FinalCounters` called, assert `finalVerifPhase` transitions to `"running"` (not stuck in `"escalated"`), assert verification loop re-enters. Test **worktree dirty state on re-dispatch (HIGH objection #53):** mock KeepGoing after timeout kill, assert `Reset-WorktreeState` called before new thread job dispatch. Test **pipeline timeout (objection #76):** mock pipeline elapsed time exceeding `PipelineTimeoutSeconds`, assert `pipelineStatus = "halted"` with timeout message. Test **wall-clock budget (objection #64):** mock task exceeding `TaskMaxWallClockSeconds` across multiple iterations, assert escalated as infrastructure failure with `BudgetExceeded` flag.

**TLA+ Coverage:**
- Transitions: `StartNextTier`, `SkipEmptyTier`, `ZeroTierComplete`, `WorkspaceCreationFailure`, `EscalationKeepGoingFinal`
- States: `currentTier`, `pipelineStatus`, all per-task states (composed)
- Invariants: S1 (TiersSequential), S8 (EscalationBlocksProgress), S11 (ValidationGatesExecution)
- Liveness: L1 (EventuallyTerminates), L2 (TasksResolve)

---

### Step 16: Integration Test -- Full Pipeline Lifecycle

**Files:**
- `tests/coding-integration.Tests.ps1` (create)

**Description:**
End-to-end integration test that exercises the full Stage 8 lifecycle with mocked Claude calls (using `Invoke-ClaudeTestDouble` pattern with corrected real parameter signature, objections #43, #50) but real state transitions. Uses a small fixture plan (2 tiers, 3 tasks: T1+T2 in tier 1, T3 in tier 2; T1 and T2 are TDD, T3 is agent-writer). Verifies the entire state machine from Init through completion or halting. Tests liveness properties by asserting the pipeline reaches a terminal state within bounded iterations. This is a **test-only task**: no implementation code, only the test file.

**Dependencies:** T15, T14

**Test (write first):**
`tests/coding-integration.Tests.ps1` (create) -- This IS the test; no separate implementation code.

**Scenario 1 (Happy path / L1):** All tasks succeed -> pipeline `"completed"`. Assert: tier 1 tasks run in parallel, tier 2 waits, merge queue processes T1 and T2, final verification passes.

**Scenario 2 (Escalation -> Keep Going / L2, L3):** T1 GREEN exhausted -> escalation -> Keep Going -> T1 retries -> completes. Assert: T2 continues unaffected during escalation, pipeline eventually completes.

**Scenario 3 (Escalation -> Stop / L1):** T1 RED exhausted -> Stop. Assert: pipeline `"halted"`, T1 workspace preserved, T2 workspace preserved (was running), completed tasks' workspaces cleaned. Assert workspace cleanup uses pre-mutation snapshot (objection #36).

**Scenario 4 (Merge conflict / L2):** T1 merge conflicts -> resolved on retry 2 -> pipeline completes. Assert: merge retries tracked, post-merge verification runs, **`git merge --abort` called before each resolver dispatch (objection #14)**.

**Scenario 5 (Zero-tier / S7):** Empty plan -> `$currentTier` set to 1 (objection #73) -> pipeline `"completed"` immediately. Assert: no final verification.

**Scenario 6 (Agent-writer / S3):** T3 (agent-writer) completes without entering any TDD phase. Assert: no RED/GREEN/cleanup phases observed for T3.

**Scenario 7 (Workspace creation failure / S12):** Multi-task tier workspace creation fails on 2nd worktree -> escalation -> KeepGoing -> retry -> succeeds. Assert: first worktree rolled back before escalation, `wsCreationFailed` set then cleared, pipeline eventually completes.

**Scenario 8 (Cleanup exhaustion):** T1 cleanup remediation reaches `MaxFixRounds` -> escalation -> KeepGoing -> cleanup retries -> completes. Assert: `cleanupRemediations` and `cleanupCleanPasses` both reset on KeepGoing (via `Reset-CleanupCounters`, not centralized function -- objection #16).

**Scenario 9 (Multiple simultaneous escalations):** T1 infrastructure failure during GREEN + T2 cleanup exhausted simultaneously -> both escalated -> KeepGoing for T1 (no counter reset, but status restored to "running" per objection #59) -> KeepGoing for T2 (counters reset) -> both resume. Assert: `escalationActive` remains true after first KeepGoing, cleared after second. Assert pending escalation queue handles both (objection #39).

**Scenario 10 (FinalVerifExhausted / L3):** Final verification remediations reach `MaxFixRounds` -> escalation -> KeepGoing -> retries -> completes. Assert: two-step remediation cycle (fail -> remediating -> remediate -> running). Assert `Reset-FinalCounters` transitions `finalVerifPhase` to `"running"` (HIGH objection #49).

**Scenario 11 (SingleTaskTierComplete ordering):** Single-task tier completes -> marks merged without merge queue -> next tier starts. Assert: no workspace created, `workspaceMerged = TRUE`, `mergeQueue` empty throughout.

**Scenario 12 (Empty tier 1 / objection #17):** Plan where tier 1 has zero tasks, tier 2 has tasks. Assert: tier 1 skipped via `SkipEmptyTier`, tier 2 tasks execute normally, pipeline completes.

**Scenario 13 (Infrastructure failure phase preservation / objection #18):** T1 in GREEN phase hits infrastructure failure -> escalation -> KeepGoing -> T1 resumes in GREEN phase (not RED). Assert: `taskPhase` is `"green"` after recovery, not reset. Assert `greenAttempts` NOT reset (infrastructure failure has no counter to reset). Assert `taskStatus` restored to `"running"` (HIGH objection #59). Assert new thread job dispatched starting from GREEN.

**Scenario 14 (Thread job timeout with process tree kill / objections #13, #26, #61):** T1 Invoke-Claude hangs -> job times out after `JobTimeoutSeconds` -> PID read from `$ChildPidRegistry` (objection #61) -> `Stop-ProcessTree` kills claude CLI and children -> task escalated as infrastructure failure. Assert: PID registered by thread job, `Stop-ProcessTree` called with registered PID, child PIDs killed, task status `"escalated"`, pipeline does not hang (L1).

**Scenario 15 (Atomic state on crash / objection #25):** T1 thread job crashes mid-GREEN (unhandled exception after partial work) -> orchestrator does NOT apply partial `TaskResult` -> task escalated with pre-crash state preserved. Assert: counters unchanged from pre-crash values.

**Scenario 16 (Dirty merge state resume / objection #15):** Pipeline halted during merge conflict -> restart -> `Resolve-PipelineState` detects unmerged files in worktree -> runs `git merge --abort` -> resumes merge cleanly. Assert: `DirtyMergeCleanedTasks` populated, merge retries from clean state.

**Scenario 17 (Idempotent escalation recovery / objection #24):** T1 escalated -> KeepGoing called -> T1 re-dispatched -> KeepGoing called AGAIN for same task (duplicate) -> second call is no-op. Assert: only one thread job created, task not double-dispatched.

**Scenario 18 (Concurrent writer file conflicts / objection #31):** Two tasks in same tier (T1 and T2) both modify `utils/shared.ps1`. Both complete. Merge queue processes T1 first (succeeds). T2 merge detects conflict. Assert: merge-resolver dispatched, conflict resolved or escalated. Validates that file-overlap warning from validation (objection #38) correctly predicted the conflict.

**Scenario 19 (Escalation routing for done-phase task / objection #27):** T1 completes TDD cycle (`taskPhase = "done"`), enters merge queue, merge exhausted -> task status `"escalated"` but phase is still `"done"`. Assert: escalation routes through merge path (calls `Reset-MergeCounters`), NOT task path. Assert no lookup error for `"task:done"` in dispatch table.

**Scenario 20 (Stale mergeInProgress on resume / objection #28):** Pipeline halted during merge with `mergeInProgress = "T2"`. `EscalationStop` cleaned up T2's workspace. On resume, `Resolve-PipelineState` detects `mergeInProgress` points to non-existent workspace. Assert: `mergeInProgress` cleared to 0, `StaleMergeCleared` includes "T2", pipeline resumes without crash.

**Scenario 21 (Per-task timeout / objection #30):** T1 (typescript-writer, 900s timeout) and T2 (agent-writer, 300s timeout) in same tier. T2 finishes in 200s. T1 runs for 800s. Assert: T2 not killed (under its 300s limit), T1 not killed (under its 900s limit). Mock T1 running for 950s, assert T1 killed (over 900s limit) but T2 unaffected.

**Scenario 22 (Pipeline lock / objections #45, #47):** Start pipeline, assert lock file created via `CreateNew` (BLOCKING objection #47). Assert lock file contains PID, process name, and RunId (objection #65). Attempt second concurrent pipeline, assert rejected with `IOException`. Pipeline completes, assert lock file removed. Pipeline halts, assert lock file removed.

**Scenario 23 (RedRetryAlreadyImplemented end-to-end / HIGH objection #55):** T1 RED tests pass unexpectedly, test writer returns `"already_implemented"`, T1 skips GREEN and goes directly to cleanup -> cleanup passes -> merge -> final verification -> pipeline completed. Assert `taskPhase` transitions through `red -> red_retry -> cleanup -> done` without ever entering `green`.

**Scenario 24 (Validation failure halts pipeline / HIGH objection #56):** Plan with intra-tier dependency detected by `Test-ImplementationPlan`. Assert pipeline status = `"halted"`, no tasks execute, lock file removed, error message references the specific validation failure. Assert `validationStatus = "failed"`.

**Scenario 25 (Merge queue drain-loop after recovery / BLOCKING objection #48):** T1 completes, T2 escalated during GREEN. Merge loop processes T1 merge. User selects KeepGoing for T2. T2 re-dispatched, completes, enqueues for merge. Assert: drain-loop re-entered, T2 merge processed. Assert `TierFullyDone` only passes after T2 merge complete.

**Scenario 26 (ErrorActionPreference in thread jobs / BLOCKING objection #46):** T1 GREEN phase: code writer produces code, verify command git operation returns non-zero exit code as a non-terminating error. Assert: under `$ErrorActionPreference = 'Stop'`, this surfaces as `GreenTestsFail` (not `GreenTestsPass`). Verify the error is NOT silently swallowed.

**Scenario 27 (Worktree dirty state on re-dispatch / HIGH objection #53):** T1 timed out during GREEN, process tree killed. Partial uncommitted files exist in worktree. KeepGoing selected. Assert: `Reset-WorktreeState` called, warning logged about uncommitted files (objection #77), worktree cleaned, new thread job starts with clean working directory.

**Scenario 28 (Output pollution in thread job / HIGH objection #51):** T1 phase function emits stray output alongside `TaskResult`. Assert: orchestrator detects multiple output objects, escalates T1 with descriptive error, does NOT silently use corrupted result.

**Scenario 29 (Atomic merge enqueue / HIGH objection #78):** T1 and T2 complete simultaneously in same tier, both call `Add-MergeQueue`. Assert: `ConcurrentDictionary.TryAdd` used as atomic gate, each task enqueued exactly once, no duplicates in merge queue. Assert `ContainsKey` never called.

**Scenario 30 (SkipEmptyTier precondition / LOW objection #74):** Assert `SkipEmptyTier` logic does not fire when `currentTier = 0` (validation phase). Plan starts with `currentTier = 0`, validation passes, first non-empty tier correctly identified.

**Scenario 31 (Pipeline timeout / objection #76):** Mock pipeline running past `PipelineTimeoutSeconds`. Assert `pipelineStatus = "halted"` with timeout error message. Assert lock file removed. Assert in-progress tasks escalated.

**Scenario 32 (Per-task wall-clock budget / objection #64):** T1 has many GREEN retries consuming 400s each. After cumulative time exceeds `TaskMaxWallClockSeconds` (3600s), assert T1 escalated with `BudgetExceeded = $true`. Assert T2 in same tier is unaffected (independent budget).

**Scenario 33 (PID registry fallback / BLOCKING objection #61):** T1 thread job crashes before registering PID (immediate error after `Start-ThreadJob`). Timeout fires. Assert: `$ChildPidRegistry` has no entry for T1. Assert fallback enumeration of `claude.exe` processes filtered by worktree path. Assert any matching processes killed.

**TLA+ Coverage:**
- Liveness: L1 (EventuallyTerminates), L2 (TasksResolve), L3 (EscalationResolves)
- Invariants: S1, S3, S4, S5, S6, S7, S8, S12 (verified across full lifecycle)
- Transitions: all 39 transitions exercised across scenarios

---

## State Coverage Audit

All TLA+ states, transitions, and properties are covered by the implementation plan.

| Category | Count | Steps Covering |
|----------|-------|----------------|
| Pipeline states (3) | 3/3 | T5 (halted), T15 (running, completed) |
| Validation states (3) | 3/3 | T5 (pending, valid, failed) |
| Task phases (9) | 9/9 | T8 (red, red_retry), T9 (green, green_retry), T10 (cleanup, cleanup_remed), T11 (agent_call), T15 (idle, done) |
| Task statuses (5) | 5/5 | T7 (escalated, skipped), T8-T11 (running), T10-T11 (completed), T15 (pending) |
| Workspace states (2x2) | 4/4 | T6, T12 |
| Final verification phases (5) | 5/5 | T13 (idle, running, remediating, completed, escalated) |
| Escalation (2) | 2/2 | T7 (true, false) |
| Workspace creation (2) | 2/2 | T6 (true, false) |
| Merge states (2) | 2/2 | T12 (mergeInProgress, mergeQueue) |
| Transitions (39) | 39/39 | See per-step TLA+ Coverage sections |
| Safety invariants (12) | 12/12 | S1:T15, S2:T1+T8+T9+T10+T12+T13, S3:T11, S4:T12, S5:T6+T12, S6:T6, S7:T13, S8:T7, S9:T8+T9, S10:T10, S11:T5+T15, S12:T6 |
| Liveness properties (3) | 3/3 | L1:T1+T2b+T15+T16, L2:T15+T16, L3:T7+T16 |

### TLA+ Spec Gap

- `WF_vars(ValidationFails)` missing from Fairness (HIGH objection #22). Implementation unaffected: `Test-ImplementationPlan` is synchronous and always terminates. Recommend adding to TLA+ spec in a future revision.

---

## Execution Tiers

### Tier 1: Foundation (constants, logging, job runner, git retry, test doubles, contracts, agent prompts)

| Task ID | Step | Title |
|---------|------|-------|
| T1 | Step 1 | Configuration Constants |
| T2 | Step 2a-2d | Thread-Safe Logging, Job Runner, Git Retry, Claude Test Double |
| T3 | Step 3 | Result Contracts |
| T4 | Step 4 | Agent Prompt Files |

### Tier 2: Core Utilities (depends on Tier 1)

| Task ID | Step | Title |
|---------|------|-------|
| T5 | Step 5 | Plan Validation |
| T6 | Step 6 | Workspace Management |
| T7 | Step 7 | Escalation Handling |
| T14 | Step 14 | Pipeline State Resolution Update |

### Tier 3: Phase Functions (depends on Tiers 1-2)

| Task ID | Step | Title |
|---------|------|-------|
| T8 | Step 8 | TDD RED Phase |
| T9 | Step 9 | TDD GREEN Phase |
| T10 | Step 10 | TDD Cleanup Phase |
| T11 | Step 11 | Agent-Writer Dispatch |
| T12 | Step 12 | Merge Queue |
| T13 | Step 13 | Final Verification |

### Tier 4: Orchestration (depends on Tiers 1-3)

| Task ID | Step | Title |
|---------|------|-------|
| T15 | Step 15 | Tier Orchestrator and Main Entry Point |

### Tier 5: Validation (depends on Tier 4)

| Task ID | Step | Title |
|---------|------|-------|
| T16 | Step 16 | Integration Test -- Full Pipeline Lifecycle |

---

## Task Assignment Table

| Task ID | Title | Tier | Code Writer | Test Writer | Dependencies | Rationale |
|---------|-------|------|-------------|-------------|--------------|-----------|
| T1 | Configuration Constants | 1 | powershell-writer | pester-writer | None | Modifying existing PowerShell config hashtable with verify command safety, wall-clock budget, pipeline timeout |
| T2 | Thread-Safe Logging, Job Runner, Git Retry, Test Double | 1 | powershell-writer | pester-writer | None | Split into 4 files per SRP (objection #69): task-log.ps1, job-runner.ps1, git-retry.ps1, claude-test-double.ps1. PID registry (objection #61), env var safety (objection #62), fallback atomicity (objection #63) |
| T3 | Result Contracts | 1 | powershell-writer | pester-writer | None | Typed constructor functions for all inter-module hashtable contracts including WorkspaceRemoved (objection #71) |
| T4 | Agent Prompt Files | 1 | agent-writer | *none* | None | Creates Claude Code agent markdown artifacts; no test file (validation in T5) |
| T5 | Plan Validation | 2 | powershell-writer | pester-writer | T1, T3 | PowerShell JSON validation + agent file content checks + file-overlap warnings + atomic pipeline lock + PID reuse detection (objection #65) |
| T6 | Workspace Management | 2 | powershell-writer | pester-writer | T1, T2 | PowerShell git worktree lifecycle + best-effort rollback + worktree prune + dirty state reset with warning (objection #77) + git retry |
| T7 | Escalation Handling | 2 | powershell-writer | pester-writer | T1, T2, T3 | PowerShell interactive prompt + routing guard + pre-mutation snapshot + status restoration + dispatch key validator (objection #70) |
| T14 | Pipeline State Resolution | 2 | powershell-writer | pester-writer | T1, T2 | Extends existing PowerShell state resolver + dirty merge + stale pointer + fallback log flush + worktree prune |
| T8 | TDD RED Phase | 3 | powershell-writer | pester-writer | T1, T2, T3, T4 | PowerShell state machine + Reset-RedCounters export + malformed JSON test (objection #67) |
| T9 | TDD GREEN Phase | 3 | powershell-writer | pester-writer | T1, T2, T3, T4 | PowerShell state machine + Reset-GreenCounters export + malformed JSON test (objection #67) |
| T10 | TDD Cleanup Phase | 3 | powershell-writer | pester-writer | T1, T2, T3, T4 | PowerShell verify triple + blame-fork correctness tests (objection #68) + malformed JSON test (objection #67) |
| T11 | Agent-Writer Dispatch | 3 | powershell-writer | pester-writer | T1, T2, T3, T4 | PowerShell single-call dispatch + re-dispatch idempotency (objection #75) |
| T12 | Merge Queue | 3 | powershell-writer | pester-writer | T1, T2, T3, T6, T7 | PowerShell concurrent queue + atomic TryAdd gate (objection #78) + escalation-active guard (objection #72) + git merge --abort + git retry |
| T13 | Final Verification | 3 | powershell-writer | pester-writer | T1, T2, T3, T7 | PowerShell two-step remediation + writer attribution + Reset-FinalCounters with phase transition |
| T15 | Tier Orchestrator | 4 | powershell-writer | pester-writer | T5-T14 | PowerShell main entry point + PID registry integration (objection #61) + env var setup (objection #62) + dispatch key validation (objection #70) + pipeline timeout (objection #76) + ZeroTierComplete currentTier=1 (objection #73) + drain-loop + process tree kill + pipeline lock |
| T16 | Integration Test | 5 | *none* | pester-writer | T15, T14 | Test-only: 33 scenarios covering all objections from all 5 debate rounds |
