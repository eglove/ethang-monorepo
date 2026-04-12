# Implementation Plan: Cleanup Improvements

> **Revision:** 5 — Addresses all 32 prior debate objections + 14 hardening items from round 8.

## Debate Objections Resolution Index

### Round 5 Objections (1-18)

| # | Objection | Resolution | Steps Affected |
|---|-----------|------------|----------------|
| 1 | S15 CrashBudgetRespected has no implementation step or test | New Step 21 implements crashCount tracking + S15 invariant | 21, 1, 4, 20 |
| 2 | Intra-tier dependency violations: T7/T12 in Tier 4, T18/T19 in Tier 7 | T12 moved to Tier 5, T19 moved to Tier 8; full DAG re-derived | All tiers |
| 3 | No test for --resume after stage 8 partial tier/task completion | Tests added to Step 4 for partial coding-stage resume | 4 |
| 4 | T5 (worktrees) and T10 (fixture commit) implicit ordering | Step 10 test verifies fixture commit before worktree creation; runtime ordering documented | 5, 10 |
| 5 | LockGoesStale resets 13+ state variables but no test for full reset | Step 21 adds dedicated full-reset verification test; Step 20 E2E test added | 21, 20 |
| 6 | tddIter initialized to 1 creates off-by-one | Documented as spec-intentional; Step 14 adds boundary test asserting MaxTDDCycles-1 effective retries | 7, 14 |
| 7 | ABORT marker must be written before lock release | Step 18 enforces write-then-release ordering; dedicated ordering test added | 18 |
| 8 | Resume with partial fixture states (4 InitResume combinations) untested | Step 4 adds parametric test for all 4 bddFixture x tlcFixture combinations | 4 |
| 9 | Dual-cap simultaneous exhaustion (coverageIter + tddIter) untested | Step 14 adds dedicated boundary test | 14 |
| 10 | apiRetries is merge-only but Step 17 claimed it for general API retry | Step 17 revised: general HTTP retry is independent of TLA+ apiRetries; Step 16 owns apiRetries exclusively | 16, 17 |
| 11 | No fsync guarantee on pipeline.log or fixture writes | Steps 3, 8, 9 add explicit flush/fsync after critical writes | 3, 8, 9 |
| 12 | T20 assigns playwright-writer for PowerShell E2E tests | Confirmed pester-writer in assignment table (was already correct; table verified) | 20 |
| 13 | Named mutex machine-wide blocks concurrent CI jobs | Steps 1, 16 scope mutex per feature: `Global\vibe-cli-<feature>` | 1, 16 |
| 14 | No pre-merge rebase before mutex acquisition | **Superseded by objection #19** — rebase now INSIDE mutex | 16 |
| 15 | AbortCleanup leaves mergeState inconsistent | Step 18 adds mergeState reset for in-flight tasks during abort | 18 |
| 16 | AnyTaskInTierSucceeded boundary (exactly 1 succeeds) untested | Step 12 adds dedicated boundary test | 12 |
| 17 | Warden lifecycle end — no test asserts warden active during merging | Step 6 adds test; note: TLA+ S2 covers executing/coverage_gate/review_gate only — merge uses worktree so warden must remain active | 6 |
| 18 | Duplicate idempotency tokens after crash-resume untested | Steps 3, 4 add dedup verification tests | 3, 4 |

### Round 6 Objections (19-28)

| # | Objection | Resolution | Steps Affected |
|---|-----------|------------|----------------|
| 19 | Rebase TOCTOU gap: pre-merge rebase before mutex creates window where another merge invalidates the rebase | Rebase moved INSIDE mutex: acquire -> rebase -> merge -> release. Eliminates TOCTOU window entirely. Rebase conflict inside mutex releases mutex, bumps apiRetries, returns to waiting (same as merge conflict path). | 16 |
| 20 | Orphaned resources on normal task failure: 7 failure transitions leave worktree+warden active | New Step 22: Task Failure Cleanup utility (`Complete-TaskFailure`). Called by job-runner after any task reaches "failed" or "timed_out". Removes worktree, tears down warden, resets mergeState. | 22, 12 |
| 21 | Abort cleanup ordering: worktrees removed before in-progress merges aborted, orphaning MERGE_HEAD | Cleanup sequence reordered: ABORT marker -> terminate agents -> **abort in-progress merges** -> remove worktrees -> delete branches -> release lock -> delete .tmp files. MERGE_HEAD cleared while worktree still exists. | 18 |
| 22 | Playwright fallback edge case: zero test coverage despite being in elicitor | New Step 23: Playwright Detection and Fallback. Implements detection (package.json check), UI/non-UI classification, fallback to non-UI trace replay. Full test coverage for all BDD scenarios. | 23, 14 |
| 23 | T4 runtime dependency on T21 not declared in DAG — crash budget check calls T21 logic | T21 added as explicit dependency of T4. DAG validated: T21 (Tier 2) -> T4 (Tier 3). | 4 |
| 24 | AbortCleanup mergeState spec divergence — task can end with taskState=failed + mergeState=merging, no invariant catches this | New implementation-level invariant test in Step 18: assert no task has mergeState in {"waiting","merging"} when taskState = "failed" after abort cleanup. Also validated in Step 20 E2E. | 18, 20 |
| 25 | Truncated log line on crash between write and fsync — no test for parsing incomplete final line | Step 3: test for truncated final log line (no newline, partial JSON). Step 4: test --resume handles truncated log gracefully (ignores incomplete final line). | 3, 4 |
| 26 | PowerShell Interlocked across ForEach-Object -Parallel runspaces copies variable instead of sharing | Step 12: replace `[Interlocked]` scalar with `[System.Collections.Concurrent.ConcurrentDictionary]` shared via `$using:`. Thread-safe counter accessible across runspace boundaries. Dedicated test verifies concurrent increments from parallel runspaces produce correct count. | 12 |
| 27 | Fixture 'generating' state is 5th resume combination not covered by parametric test | Step 4: add 2 additional resume fixture combinations — bddFixture="generating" and tlcFixture="generating" (crash during generation). Both treated as "corrupt" on resume, triggering regeneration. Total: 6 fixture state combinations tested. | 4 |
| 28 | Resume working-tree verification needed — pure log replay insufficient when crash occurs during rebase or merge | Step 4: add filesystem verification on resume. Check for MERGE_HEAD, REBASE_HEAD, orphaned worktrees matching runId. If found: clean up dirty git state before resuming. Log replay alone is insufficient — the working tree must be verified consistent. | 4 |

### Round 7 Objections (29-32)

| # | Objection | Resolution | Steps Affected |
|---|-----------|------------|----------------|
| 29 | ConcurrentDictionary compound read-modify-write not atomic — `dict[key]=dict[key]+1` loses increments under contention | Step 12 specifies `AddOrUpdate()` with atomic increment factory; dedicated contention test with artificial delay verifies no lost increments | 12 |
| 30 | pipeline.log appends not atomic — crash mid-write corrupts resume file | Step 3 specifies atomic line append via single `StreamWriter.WriteLine()` + `Flush()`; file opened with `FileShare.Read`; test for mid-write crash resilience added | 3 |
| 31 | Two named mutexes with no acquisition order, no AbandonedMutexException handling, no two-process deadlock check | Steps 1, 16: strict ordering documented (pipeline lock -> merge mutex, never reverse); AbandonedMutexException handler added to both; known limitation documented for two-process TLC model | 1, 16, 18 |
| 32 | Abort/cancellation paths systematically undertested — no per-phase cancel test, no partial worktree leak test, no double-Ctrl+C test, no interleaving test | Step 18: parameterized abort test for all 8 task phases; partial worktree leak test; double-Ctrl+C resumability test; AbortTriggered->AbortCleanup interleaving test | 18, 20 |

### Round 8 Hardening Items (33-46)

| # | Severity | Item | Resolution | Steps Affected |
|---|----------|------|------------|----------------|
| 33 | CRITICAL | Remove 'escalated' dead state from TLA+ spec — no transition ever produces `taskState = "escalated"` | Plan does NOT modify TLA+ spec. Instead: (a) flag as unmapped in coverage audit, (b) implementation MUST NOT handle "escalated" as a reachable state, (c) add assertion test in Step 12 that no task ever reaches "escalated" at runtime. Recommend TLA+ spec revision as follow-up. | 12, Audit |
| 34 | HIGH | SF fixture retry convergence test — `SF_vars(BDDFixtureComplete)` and `SF_vars(TLCFixtureComplete)` guarantee eventual success despite crashes, but no test verifies retry convergence | Steps 8, 9: add fixture retry convergence tests — crash -> corrupt -> regenerate -> succeed loop must eventually produce valid fixtures within bounded retries. Step 10: integration test for crash-regenerate cycle. | 8, 9, 10 |
| 35 | HIGH | Fixture file atomicity spec — temp file + Move-Item is not atomic on NTFS if target exists and another process holds a handle | Steps 8, 9: add contention test — concurrent reader holds handle on fixture file during Move-Item overwrite. Verify Move-Item either succeeds atomically or retries (existing 3-retry logic). Document NTFS rename-over-open-handle limitation. | 8, 9 |
| 36 | HIGH | Merge-success-worktree-fail test — `MergeSuccess` sets worktreeState="removed" atomically, but implementation may fail during worktree removal after a successful merge | Step 16: add test for merge succeeds but `git worktree remove` fails. Task should still be marked "merged" (merge is committed), worktree removal failure is logged + retried, and `Complete-TaskFailure` handles residual cleanup. | 16, 22 |
| 37 | HIGH | StreamWriter/Move-Item contention test — pipeline.log StreamWriter and fixture Move-Item target different files, but both use filesystem; verify no cross-contamination | Step 3: add test verifying StreamWriter on pipeline.log does not interfere with concurrent Move-Item on fixture files (different file handles, no lock escalation). | 3 |
| 38 | HIGH | Worktree removal race test for abort — two concurrent abort cleanup threads could race on `git worktree remove` for the same worktree | Step 18: add test for concurrent worktree removal — verify `git worktree remove` is called at most once per worktree (serialized by abort cleanup's sequential loop), and a second call on an already-removed worktree is a no-op with warning, not a crash. | 18 |
| 39 | MEDIUM | Step 13 boundary tests — no tests for timeout at exactly 30 minutes or just under | Step 13: add boundary tests — task at 29:59 is NOT timed out, task at 30:00 IS timed out, task at 30:01 IS timed out. Test timeout in each of the 4 active states. | 13 |
| 40 | MEDIUM | Step 15 negative depth — ReviewGateFail has no test for review failure AFTER a prior coverage retry (multi-cycle path: execute -> coverage fail -> execute -> coverage pass -> review fail) | Step 15: add multi-cycle-then-review-fail test. Verify tddIter and coverageIter are preserved from the coverage cycle, completion counter increments exactly once on review failure. | 15 |
| 41 | MEDIUM | Step 2 corruption test — no test for corrupted runId extraction from pipeline.log | Step 2: add corruption tests — malformed runId in log (wrong format, truncated, extra chars) returns error rather than silently using corrupt value. | 2 |
| 42 | MEDIUM | Step 19 negative tests — no tests for pipeline completion edge cases | Step 19: add negative tests — completion with lock not held (should be impossible, assert), completion with abort flag set (should be impossible, assert), completion with non-terminal tasks (should be impossible, assert). Add test for idempotent completion (calling complete twice is a no-op). | 19 |
| 43 | MEDIUM | T16 rebase timeout test — rebase inside mutex could hang, no timeout specified | Step 16: add rebase timeout test — rebase that takes longer than 60 seconds is killed, merge mutex released, apiRetries bumped, task returns to waiting. Document rebase timeout default (60s, configurable). | 16 |
| 44 | MEDIUM | Partial-failure strategy per tier — plan says "restart tier from scratch" on resume but doesn't test mixed merged+failed state on resume | Step 4: add test for partial tier failure on resume — tier with 1 merged + 1 failed + 1 timed_out: on resume, all tasks in the tier restart from scratch (merged work is already on the branch; re-merge is idempotent because the branch already contains those commits). | 4 |
| 45 | LOW | File overlap completeness — Tier 4 has T7 (workspace.ps1) and T10 (vibe.ps1, stages/*.ps1) but Step 10 also lists vibe.ps1 which T4 (Tier 3) modifies; cross-tier sequential safety not explicitly validated | Tier dependency DAG already enforces T4 < T10 (T10 depends on T4). Within Tier 4: T7 modifies workspace.ps1, T10 modifies stages/*.ps1 + vibe.ps1, T22 modifies task-cleanup.ps1 — no overlap. Cross-tier: T4 (Tier 3) modifies vibe.ps1, T10 (Tier 4) modifies vibe.ps1 — sequential by tier ordering. Validated and documented in file overlap table. | Audit |
| 46 | LOW | T17 runtime integration test — HTTP retry logic tested only with mocks, no real HTTP endpoint test | Step 17: add optional integration test using a local HTTP test server (`System.Net.HttpListener`) that returns 500 then 200, verifying real retry behavior including actual delays. Mark as `[Tag('Integration')]` so it doesn't run in unit-test-only CI. | 17 |

---

## Source Artifacts

| Artifact | Path |
|----------|------|
| Requirements Briefing | `docs/cleanup-improvements/elicitor.md` |
| BDD Scenarios | `docs/cleanup-improvements/bdd.feature` |
| TLA+ Specification | `docs/cleanup-improvements/tla/CleanupImprovements.tla` |

## TLA+ State Coverage Matrix

### States

**Pipeline-level:**
- `pipelineStage`: 0 (not started) .. NumStages+1 (complete)
- `pipelineLock`: "free" | "held" | "stale"
- `pipelineAborted`: Boolean
- `abortCleanupDone`: Boolean
- `runId`: "none" | "active"
- `isResuming`: Boolean
- `crashCount`: 0..MaxCrashes

**Fixture:**
- `bddFixture`: "missing" | "generating" | "valid" | "corrupt"
- `tlcFixture`: "missing" | "generating" | "valid" | "corrupt"

**Tier-level:**
- `currentTier`: 0..MaxTiers
- `tierComplete`: tier -> Boolean
- `completionCounter`: tier -> count
- `mergeMutex`: "free" | task

**Task-level:**
- `taskState`: "idle" | "worktree_creating" | "warden_configuring" | "deps_installing" | "executing" | "coverage_gate" | "review_gate" | "merge_waiting" | "merging" | "merged" | "failed" | "timed_out" | ~~"escalated"~~ (dead — see hardening item #33)
- `worktreeState`: "none" | "creating" | "active" | "removed"
- `wardenState`: "unconfigured" | "configuring" | "active" | "failed"
- `coverageIter`: 0..MaxCoverageIter
- `tddIter`: 0..MaxTDDCycles
- `coveragePBT`: "unknown" | "pass" | "fail"
- `coverageContract`: "unknown" | "pass" | "fail"
- `coverageE2E`: "unknown" | "pass" | "fail"
- `mergeState`: "none" | "waiting" | "merging" | "merged" | "conflict" | "failed"
- `apiRetries`: 0..MaxRetries

**Idempotency:**
- `idempotencyTokens`: Set of {stage, status} records

### Transitions

1. `AcquireLockFresh` — acquire free lock, start fresh run
2. `AcquireStaleLock` — detect and replace stale lock, start fresh
3. `ResumeAcquireLock` — acquire lock on --resume, jump to detected stage
4. `LockGoesStale` — crash/kill leaves lock behind (bounded by MaxCrashes)
5. `AdvanceStage` — move to next pipeline stage (pre-coding)
6. `GenerateBDDFixtures` — begin BDD fixture generation
7. `BDDFixtureComplete` — BDD fixtures generated successfully
8. `BDDFixtureCrash` — BDD fixture generation fails (corrupt)
9. `GenerateTLCFixtures` — begin TLC fixture generation
10. `TLCFixtureComplete` — TLC fixtures generated successfully
11. `TLCFixtureCrash` — TLC fixture generation fails (corrupt)
12. `EnterCodingStage` — enter coding stage, start tier 1
13. `CreateWorktree(t)` — create worktree for task t
14. `WorktreeCreated(t)` — worktree creation succeeds
15. `WorktreeCreationFailed(t)` — worktree creation fails
16. `WardenConfigured(t)` — warden configured successfully
17. `WardenConfigFailed(t)` — warden configuration fails
18. `DepsInstalled(t)` — dependency install succeeds
19. `DepsInstallFailed(t)` — dependency install fails
20. `EnterCoverageGate(t)` — task enters coverage gate
21. `CoverageGatePass(t)` — all 3 coverage categories pass
22. `CoverageGateFail(t)` — at least one coverage category fails, retry
23. `CoverageCapExhausted(t)` — coverage iteration cap reached
24. `TDDCapExhausted(t)` — TDD cycle cap reached
25. `TaskTimeout(t)` — task times out in any active state
26. `ReviewGatePass(t)` — review passes, enter merge queue
27. `ReviewGateFail(t)` — review fails, task fails
28. `AcquireMergeMutex(t)` — acquire merge mutex, begin merging
29. `MergeSuccess(t)` — merge succeeds, cleanup worktree
30. `MergeConflict(t)` — merge conflict, retry (consumes apiRetries)
31. `MergeConflictExhausted(t)` — merge conflict retries exhausted
32. `MergeMutexTimeout(t)` — merge mutex wait times out
33. `AdvanceTier` — all tasks in tier done, advance
34. `TierAllFailed` — all tasks failed, abort pipeline
35. `PipelineComplete` — all tiers complete, release lock
36. `AbortTriggered` — Ctrl+C / CancelKeyPress fires
37. `AbortCleanup` — deterministic cleanup sequence
38. `Done` — terminal stutter (normal completion or abort done)

### Safety Invariants

- **S1 WardenRequiresWorktree** — warden active implies worktree active
- **S2 AgentRequiresWarden** — executing/coverage_gate/review_gate implies warden active
- **S3 MergeMutexExclusive** — at most one task merging at a time
- **S4 TierAdvanceRequiresCompletion** — tier complete implies all tasks terminal
- **S5 TasksOnlyInCurrentTier** — active tasks only in current tier
- **S6 CoverageCapRespected** — coverageIter <= MaxCoverageIter
- **S7 TDDCapRespected** — tddIter <= MaxTDDCycles
- **S8 LockHeldDuringExecution** — pipeline executing implies lock held
- **S9 FixturesPrecondition** — executing/coverage_gate implies fixtures valid
- **S10 CounterBounded** — completion counter <= task count per tier
- **S11 AbortReleasesLock** — abort cleanup done implies lock free
- **S12 NoExecutionAfterAbort** — no in-flight tasks after abort cleanup
- **S13 MergedWorktreeCleanedUp** — merged task implies worktree removed
- **S14 StaleLockNotExecuting** — stale lock implies pipelineStage = 0
- **S15 CrashBudgetRespected** — crashCount <= MaxCrashes

### Liveness Properties

- **L1 PipelineEventuallyCompletes** — started + not aborted ~> complete or aborted
- **L2 AbortEventuallyCleanedUp** — aborted ~> cleanup done
- **L3 TasksEventuallyTerminate** — active task ~> terminal or aborted
- **L4 TiersEventuallyComplete** — active tier + not aborted ~> tier complete or aborted

---

## Implementation Steps

### Step 1: Pipeline Lock with Process Identity and Per-Feature Mutex

**Files:**
- `utils/pipeline-lock.ps1` (modify)
- `tests/pipeline-lock.Tests.ps1` (modify)

**Description:**
Extend the pipeline lock to record PID + process start time for stale lock detection. Add per-feature system mutex (`Global\vibe-cli-<feature>`) for atomic lock acquisition — scoped per feature so concurrent CI jobs on the same agent running different features do not block each other (addresses objection #13). Add stale lock detection that verifies process identity (not just PID liveness). Add corrupt lock file handling. Initialize `crashCount = 0` in fresh lock metadata for crash budget tracking (Step 21 builds on this). **Handle `AbandonedMutexException`**: when acquiring the pipeline mutex, catch `AbandonedMutexException` — this occurs when the prior process crashed while holding the mutex. The handler acquires the mutex (it is granted despite the exception), logs "Pipeline mutex recovered from abandoned state — prior process crashed while holding mutex", and continues normally. This is the .NET mechanism for detecting unclean process termination while holding a named mutex (addresses objection #31). **Document strict mutex acquisition ordering**: the pipeline lock mutex (`Global\vibe-cli-<feature>`) is always acquired BEFORE the merge mutex (`Global\vibe-cli-merge-<feature>`). No code path may acquire them in reverse order. This ordering is enforced by architecture: the merge mutex is only acquired inside the coding stage (Step 16), which requires the pipeline lock to already be held (S8 `LockHeldDuringExecution`). Document this in a code comment at both acquisition sites.

**Dependencies:** None

**Test (write first):**
- Test that lock file contains PID and process start time after acquisition.
- Test that stale lock (PID dead) is detected and removed.
- Test that stale lock (PID alive but different start time) is detected and removed.
- Test that live lock (PID alive, matching start time) blocks new acquisition with error message.
- Test that corrupt lock file (invalid JSON) is treated as stale.
- Test that lock mutex times out after 30 seconds with appropriate error.
- Test that two concurrent acquisitions are serialized (one wins, one sees valid lock).
- Test that mutex name includes feature name: `Global\vibe-cli-<feature>`.
- Test that two different features can acquire locks concurrently on the same machine.
- Test that lock file includes `crashCount: 0` on fresh acquisition.
- **Test `AbandonedMutexException` is caught and mutex is acquired** — simulate abandoned mutex, verify pipeline continues normally with warning logged.
- **Test mutex acquisition order is pipeline-lock-first** — verify pipeline lock is held before merge mutex is ever acquired (architecture-level assertion).

**TLA+ Coverage:**
- Transition: `AcquireLockFresh`, `AcquireStaleLock`, `LockGoesStale`
- State: `pipelineLock` (free/held/stale)
- Invariant: S8 `LockHeldDuringExecution`, S14 `StaleLockNotExecuting`

---

### Step 2: runId Generation

**Files:**
- `utils/config.ps1` (modify)
- `tests/config.Tests.ps1` (modify)

**Description:**
Add runId generation as `<yyyyMMddTHHmmss>-<4 random hex>`. runId is generated once at pipeline start and reused on --resume (extracted from pipeline.log). runId appears in all worktree paths and log entries. **Handle corrupt runId extraction** (addresses hardening #41): if the runId extracted from pipeline.log does not match the expected format, fail with a clear error rather than silently using a malformed value.

**Dependencies:** None

**Test (write first):**
- Test runId format matches `\d{8}T\d{6}-[0-9a-f]{4}` pattern.
- Test runId is stable within a single run (generated once).
- Test runId is extractable from a pipeline.log PIPELINE START line.
- Test each log entry includes the runId prefix.
- **Test malformed runId in log (wrong format, e.g., missing hex suffix) causes extraction to fail with clear error** (addresses hardening #41).
- **Test truncated runId in log (e.g., `20260411T1` with no timestamp completion) causes extraction to fail** (addresses hardening #41).
- **Test runId with extra characters appended (e.g., `20260411T120000-abcd-extra`) is rejected** (addresses hardening #41).

**TLA+ Coverage:**
- State: `runId` ("none" | "active")
- Transition: `AcquireLockFresh` (runId' = "active"), `ResumeAcquireLock` (runId reuse)

---

### Step 3: Pipeline Log and Idempotency Token System

**Files:**
- `utils/pipeline-state.ps1` (modify)
- `tests/pipeline-state.Tests.ps1` (modify)

**Description:**
Extend pipeline state tracking to write idempotency tokens (INVOKE-CLAUDE / INVOKE-CLAUDE-COMPLETE markers) before and after each LLM call. Add log entry format with runId prefix. Add pipeline version recording. Add ABORT marker writing. Handle pipeline.log write failures (halt pipeline). Detect and skip completed work on --resume by checking completion markers + artifact existence. **Add explicit flush after every critical write** (`[System.IO.File]::FlushFileBuffers()` or `$stream.Flush()`) to guarantee durability before proceeding (addresses objection #11). **Add idempotency token deduplication** — on --resume, tokens from the prior run are loaded into a set; new writes check for duplicates before appending (addresses objection #18). **Handle truncated final log line** — if the final line has no terminating newline or contains partial JSON, treat it as incomplete and ignore it during parsing. Log a warning. Do not fail the pipeline (addresses objection #25). **Use atomic line append pattern**: each log entry is written as a single `StreamWriter.WriteLine()` call (content + newline written atomically to the stream buffer) followed by `$writer.Flush()` + `$writer.BaseStream.Flush()`. The StreamWriter is opened once at pipeline start with `FileShare.Read` so concurrent processes (e.g., monitoring scripts) can read the log while the pipeline writes. This ensures a crash can only produce a truncated final line (handled by truncated-line parser), never a corrupted mid-file entry (addresses objection #30). **Verify no cross-contamination with fixture file writes** (addresses hardening #37): the StreamWriter holds a file handle on pipeline.log only; fixture file Move-Item operates on different file paths with independent handles; no filesystem lock escalation occurs.

**Dependencies:** Step 2

**Test (write first):**
- Test INVOKE-CLAUDE token is written before API call.
- Test INVOKE-CLAUDE-COMPLETE is written after successful call.
- Test --resume skips calls with both INVOKE and COMPLETE markers when artifact exists.
- Test --resume re-executes calls with INVOKE but no COMPLETE marker.
- Test --resume re-executes when COMPLETE marker exists but artifact is missing.
- Test pipeline.log write failure halts pipeline with clear error.
- Test ABORT marker is written with signal type and current stage.
- Test pipeline version is recorded in PIPELINE START line.
- Test explicit flush occurs after every critical write (mock stream verifies Flush called).
- Test duplicate idempotency tokens from a prior crash-resume cycle are not re-appended to the log.
- Test idempotency token set is loaded from existing log on --resume before any new writes.
- **Test truncated final log line (no terminating newline) is ignored during parsing with warning logged.**
- **Test truncated final log line with partial JSON is ignored without crashing the parser.**
- **Test log with only a truncated line (single incomplete line, no complete entries) produces empty token set.**
- **Test each log entry is written via single `WriteLine()` call** (mock StreamWriter verifies single call per entry, not multiple Write calls).
- **Test StreamWriter is opened with `FileShare.Read`** — concurrent reader can open file while pipeline writes.
- **Test simulated crash mid-write (kill process after partial write) produces only truncated final line** — file is otherwise valid, all prior entries intact.
- **Test StreamWriter on pipeline.log does not interfere with concurrent Move-Item on a fixture file** — open StreamWriter, perform Move-Item on a separate file, verify both operations succeed without lock escalation or contention (addresses hardening #37).

**TLA+ Coverage:**
- State: `idempotencyTokens` (set of {stage, status} records)
- Transition: `AdvanceStage` (records "complete" and next "invoked"), `PipelineComplete` (records final "complete")
- Invariant: (idempotency is a cross-cutting enforcement mechanism)

---

### Step 4: --resume Flag with Log Parsing

**Files:**
- `vibe.ps1` (modify)
- `tests/vibe.Tests.ps1` (modify)

**Description:**
Replace `-Stage` and `-Feature` parameters with `--resume` flag. Parse pipeline.log to auto-detect feature name, last completed stage, and runId. Resume from next stage. Handle edge cases: empty log, missing log, corrupted log, all stages completed, ABORT marker with zero/some completed stages. Validate --resume and seed prompt are mutually exclusive. Check for base branch divergence and pipeline version mismatch (warn, don't block). **Add --resume after stage 8 partial tier/task completion** (addresses objection #3): detect partially-completed coding stage by reading task completion markers from pipeline.log, skip completed tiers, and restart the in-progress tier from scratch (tasks are idempotent within a tier). **Add parametric tests for all 6 InitResume fixture combinations** (addresses objections #8 and #27): {bdd:missing, tlc:missing}, {bdd:valid, tlc:missing}, {bdd:missing, tlc:valid}, {bdd:valid, tlc:valid}, {bdd:generating, tlc:valid}, {bdd:valid, tlc:generating} — "generating" state (crash during generation) is treated as "corrupt", triggering regeneration. **Verify crash budget is checked on resume** — if crashCount in lock metadata >= MaxCrashes, fail with "crash budget exhausted" error (addresses objection #23, depends on T21). **Handle truncated final log line on resume** — ignore incomplete final line, resume from last complete entry (addresses objection #25). **Add filesystem verification on resume** (addresses objection #28): before resuming, verify working-tree consistency — check for MERGE_HEAD, REBASE_HEAD, orphaned worktrees matching runId. If dirty git state found: run `git merge --abort` or `git rebase --abort` as needed, remove orphaned worktrees. Log replay alone is insufficient because a crash during rebase or merge leaves filesystem state that the log cannot capture. **Add partial tier failure resume test** (addresses hardening #44): tier with mixed merged+failed+timed_out tasks restarts from scratch on resume; merged work is already committed to the branch, so re-merge is idempotent.

**Dependencies:** Steps 1, 2, 3, 21

**Test (write first):**
- Test --resume detects feature name from PIPELINE START line.
- Test --resume detects last completed stage from stage markers.
- Test --resume with empty/missing pipeline.log fails with "No previous run found" error.
- Test --resume with corrupted log fails with appropriate error.
- Test --resume after all stages completed fails with "already completed" error.
- Test --resume with ABORT marker and zero completed stages resumes from stage 1.
- Test --resume with ABORT marker and some completed stages resumes after last complete.
- Test --resume + seed prompt are mutually exclusive.
- Test --resume detects stale lock and recovers.
- Test --resume reuses existing runId from log.
- Test --resume with version mismatch logs warning.
- Test --resume with base branch divergence logs warning.
- **Test --resume after stage 8 with partial tier completion** (tier 1 complete, tier 2 in progress) resumes at tier 2 from scratch.
- **Test --resume after stage 8 with partial task completion** (2 of 3 tasks merged in tier 1) restarts tier 1 from scratch.
- **Test --resume with fixture state {bdd:missing, tlc:missing}** regenerates both fixtures before coding stage.
- **Test --resume with fixture state {bdd:valid, tlc:missing}** regenerates only TLC fixture.
- **Test --resume with fixture state {bdd:missing, tlc:valid}** regenerates only BDD fixture.
- **Test --resume with fixture state {bdd:valid, tlc:valid}** skips fixture generation, proceeds to coding stage.
- **Test --resume to coding stage with invalid fixtures halts** (matches CRITICAL-2 guard).
- **Test --resume when crashCount >= MaxCrashes fails** with "crash budget exhausted" error.
- **Test duplicate idempotency tokens from prior run are detected** and not re-invoked on resume.
- **Test --resume with fixture state {bdd:generating, tlc:valid}** treats "generating" as corrupt, regenerates BDD fixture (addresses objection #27).
- **Test --resume with fixture state {bdd:valid, tlc:generating}** treats "generating" as corrupt, regenerates TLC fixture (addresses objection #27).
- **Test --resume handles truncated final log line** — ignores incomplete entry, resumes from last complete stage marker (addresses objection #25).
- **Test --resume detects MERGE_HEAD in feature branch** and runs `git merge --abort` before resuming (addresses objection #28).
- **Test --resume detects REBASE_HEAD in feature branch** and runs `git rebase --abort` before resuming (addresses objection #28).
- **Test --resume detects orphaned worktrees matching runId** and removes them before re-dispatching tasks (addresses objection #28).
- **Test --resume on clean working tree (no MERGE_HEAD, no REBASE_HEAD, no orphaned worktrees)** proceeds normally without cleanup.
- **Test --resume with partial tier failure** (1 merged + 1 failed + 1 timed_out in tier): all tasks restart from scratch; merged commits are already on branch, re-merge is idempotent (addresses hardening #44).
- **Test --resume with partial tier failure does not duplicate already-merged commits** — verify `git log` shows no duplicate commit messages after re-dispatch (addresses hardening #44).

**TLA+ Coverage:**
- Transition: `ResumeAcquireLock` (resume logic, fixture precondition guard, all 6 InitResume combinations)
- State: `isResuming` (TRUE on resume, FALSE after lock acquired), `crashCount` (budget check)
- Invariant: S8 `LockHeldDuringExecution`, S15 `CrashBudgetRespected`

---

### Step 5: Always Use Worktrees

**Files:**
- `utils/workspace.ps1` (modify)
- `tests/workspace.Tests.ps1` (modify)

**Description:**
Remove the single-task skip path in `New-TaskWorkspace()`. Every task gets its own worktree at `.worktrees/<feature>-<taskId>-<runId>/`, even single-task tiers. Add Windows MAX_PATH validation (halt if path > 248 chars). Track all worktrees in orchestrator's workspace hashtable. **Worktrees are created AFTER fixture files are committed to the feature branch** (Step 10 ensures this ordering at runtime), so worktrees inherit committed fixtures (addresses objection #4).

**Dependencies:** Step 2

**Test (write first):**
- Test single-task tier creates a worktree (does not return $null).
- Test multi-task tier creates one worktree per task.
- Test worktree path format is `.worktrees/<feature>-<taskId>-<runId>`.
- Test worktree creation failure marks task as failed and calls Read-Escalation.
- Test worktree creation failure mid-tier does not terminate already-running tasks.
- Test worktree cleanup after merge removes worktree and deletes temp branch.
- Test verify commands use worktree path as working directory.
- Test MAX_PATH validation halts when path exceeds 248 characters.
- Test --resume cleans orphaned worktrees matching current runId before dispatching.
- **Test worktrees inherit committed fixture files** (fixture files exist in worktree working tree after creation).

**TLA+ Coverage:**
- Transition: `CreateWorktree(t)`, `WorktreeCreated(t)`, `WorktreeCreationFailed(t)`
- State: `worktreeState` (none/creating/active/removed), `taskState` (idle -> worktree_creating)
- Invariant: S1 `WardenRequiresWorktree`, S13 `MergedWorktreeCleanedUp`

---

### Step 6: Warden Agent Restriction

**Files:**
- `utils/warden-config.ps1` (create)
- `tests/warden-config.Tests.ps1` (create)

**Description:**
New utility that configures warden to scope each coding agent to its worktree. Read-only: full repo access. Write: restricted to agent's worktree directory only. Each parallel task gets its own warden scope. Warden must be configured before agent dispatch. Warden configuration failure halts the task. Warden scopes are re-established on --resume. **Warden must remain active through the full task lifecycle including merge** — the merge operation writes to the worktree before merging back, so warden scope must persist until worktree removal (addresses objection #17).

**Dependencies:** Step 5

**Test (write first):**
- Test warden is configured with read-only full repo + write-only worktree.
- Test warden configuration happens before agent dispatch.
- Test warden config failure marks task as failed and calls Read-Escalation.
- Test each parallel task has independent warden scope.
- Test warden scopes are re-established on --resume re-dispatch.
- Test agent cannot write outside its worktree (warden blocks).
- Test agent can read outside its worktree.
- **Test warden remains active when task is in "merging" state** (warden is not torn down until after merge succeeds).
- **Test warden is torn down only after MergeSuccess** (worktreeState -> "removed" triggers warden teardown).

**TLA+ Coverage:**
- Transition: `WardenConfigured(t)`, `WardenConfigFailed(t)`, `MergeSuccess(t)` (warden teardown)
- State: `wardenState` (unconfigured/configuring/active/failed)
- Invariant: S1 `WardenRequiresWorktree`, S2 `AgentRequiresWarden`

---

### Step 7: Dependency Installation in Worktrees

**Files:**
- `utils/workspace.ps1` (modify)
- `tests/workspace.Tests.ps1` (modify)

**Description:**
Add `pnpm install --frozen-lockfile` step in each new worktree before agent dispatch. Skip if no `pnpm-lock.yaml` exists. Install failure marks task as failed with clear error. Other parallel tasks are not affected by one task's install failure. **Note on tddIter initialization:** The TLA+ spec sets `tddIter = 1` in `DepsInstalled`, meaning the first TDD cycle starts at iteration 1. This is intentional — `MaxTDDCycles` represents the total cycle budget including the initial execution, so effective coverage-gate retries = `MaxTDDCycles - 1` (addresses objection #6). The implementation must match this exactly: set `tddIter = 1` after deps install, not 0.

**Dependencies:** Steps 5, 6

**Test (write first):**
- Test pnpm install runs in worktree when pnpm-lock.yaml exists.
- Test pnpm install failure marks task as failed with error message.
- Test pnpm install is skipped when no pnpm-lock.yaml exists.
- Test install failure does not affect other parallel tasks.
- **Test tddIter is set to 1 (not 0) after successful deps install** — verifying spec alignment.
- **Test with MaxTDDCycles=3 and tddIter starting at 1, exactly 2 coverage retries are allowed** before TDDCapExhausted fires.

**TLA+ Coverage:**
- Transition: `DepsInstalled(t)` (including `tddIter' = 1`), `DepsInstallFailed(t)`
- State: `taskState` (warden_configuring -> deps_installing -> executing or failed), `tddIter` (initialized to 1)

---

### Step 8: BDD Gherkin Parser

**Files:**
- `utils/gherkin-parser.ps1` (create)
- `tests/gherkin-parser.Tests.ps1` (create)

**Description:**
PowerShell script that mechanically parses BDD .feature files into fixture JSON at `tests/fixtures/bdd/`. Handles full Gherkin spec: Feature, Scenario, Scenario Outline, Examples, Background, Rule, data tables, doc strings, tags, And/But keywords. Fixture JSON includes schemaVersion field. Atomic write via temp file + Move-Item -Force. **Add explicit fsync after atomic write** — call `[System.IO.File]::Open().Flush()` on the final path after Move-Item to guarantee durability (addresses objection #11). Create fixture directory if missing. Handle encoding: strip BOM, normalize CRLF/LF, reject non-UTF-8. Handle errors: disk full, file locks (3 retries with 2s delay), empty input. Overwrite stale fixtures from prior runs. **Add fixture retry convergence logic** (addresses hardening #34): if generation crashes (BDDFixtureCrash), the corrupt fixture triggers automatic regeneration on the next attempt; verify the crash -> corrupt -> regenerate -> valid cycle converges within bounded retries. **Document NTFS rename-over-open-handle limitation** (addresses hardening #35): if a concurrent reader holds a handle on the fixture file during Move-Item overwrite, the Move-Item may fail; the existing 3-retry logic with 2s delay handles this case.

**Dependencies:** None

**Test (write first):**
- Test parser extracts Feature, Scenario, and steps into correct JSON schema.
- Test parser extracts Scenario Outline with Examples table.
- Test parser handles zero Examples rows (warning logged).
- Test parser extracts data tables within steps.
- Test parser extracts Background blocks.
- Test parser extracts doc strings.
- Test parser extracts Rule groups.
- Test parser extracts tags at Feature and Scenario levels.
- Test parser captures And/But as continuations.
- Test parser handles minimal Gherkin (single Scenario, no extras).
- Test parser handles multiple Feature blocks in one file.
- Test parser handles zero-scenario .feature file.
- Test fixture JSON includes schemaVersion = 1.
- Test atomic write uses temp file + Move-Item.
- **Test fsync is called on final file after Move-Item** (mock verifies Flush).
- Test fixture directory is created if missing.
- Test BOM is stripped before parsing.
- Test CRLF is normalized to LF.
- Test non-UTF-8 file is rejected with error.
- Test disk full error produces clear message and deletes temp file.
- Test file lock triggers retry (3 attempts, 2s delay).
- Test parser failure halts pipeline.
- Test stale fixtures are overwritten.
- **Test fixture retry convergence: crash -> corrupt -> regenerate -> valid completes within 3 attempts** (addresses hardening #34).
- **Test fixture crash produces "corrupt" state that enables regeneration** (GenerateBDDFixtures guard accepts "corrupt").
- **Test concurrent reader holding handle on fixture file during Move-Item: Move-Item retries and eventually succeeds** (addresses hardening #35).
- **Test concurrent reader released between retries allows Move-Item to succeed on 2nd attempt** (addresses hardening #35).

**TLA+ Coverage:**
- Transition: `GenerateBDDFixtures`, `BDDFixtureComplete`, `BDDFixtureCrash`
- State: `bddFixture` (missing/generating/valid/corrupt)
- Invariant: S9 `FixturesPrecondition`

---

### Step 9: TLC Output Parser

**Files:**
- `utils/tlc-parser.ps1` (create)
- `tests/tlc-parser.Tests.ps1` (create)

**Description:**
PowerShell script that mechanically parses all TLC model checker output into fixture JSON at `tests/fixtures/tla/`. Captures: invariants, traces, error traces, deadlocks, liveness, temporal properties, coverage statistics, counterexamples, state graphs, exit codes (0-14 + unknown). Fixture JSON includes schemaVersion field. Same atomic write, encoding handling, error handling, and retry logic as Gherkin parser. **Add explicit fsync after atomic write** (addresses objection #11). Empty TLC output (zero bytes) is a halting error. **Same fixture retry convergence and NTFS contention handling as Step 8** (addresses hardening #34, #35).

**Dependencies:** None

**Test (write first):**
- Test parser extracts invariant violations with counterexample traces.
- Test parser extracts state traces with variable assignments.
- Test parser extracts error traces.
- Test parser extracts deadlock reports.
- Test parser extracts liveness property results.
- Test parser extracts temporal property results.
- Test parser extracts coverage statistics per action.
- Test parser extracts counterexample traces.
- Test parser extracts state graph data (nodes, edges, diameter).
- Test parser captures exit codes 0, 10, 11, 12, 13, 14 with correct meanings.
- Test parser captures unknown exit code 99 with fallback meaning.
- Test parser handles output with no error traces (coverage/state space only).
- Test parser handles output with only header (empty structured sections, warning logged).
- Test fixture JSON includes schemaVersion = 1.
- Test atomic write uses temp file + Move-Item.
- **Test fsync is called on final file after Move-Item** (mock verifies Flush).
- Test fixture directory is created if missing.
- Test empty TLC output (zero bytes) halts with error.
- Test encoding handling (BOM strip, CRLF normalize, mixed line endings).
- Test disk full and file lock errors.
- **Test fixture retry convergence: crash -> corrupt -> regenerate -> valid completes within 3 attempts** (addresses hardening #34).
- **Test concurrent reader holding handle on fixture file during Move-Item triggers retry** (addresses hardening #35).

**TLA+ Coverage:**
- Transition: `GenerateTLCFixtures`, `TLCFixtureComplete`, `TLCFixtureCrash`
- State: `tlcFixture` (missing/generating/valid/corrupt)
- Invariant: S9 `FixturesPrecondition`

---

### Step 10: Fixture Generation Integration into Pipeline Stages

**Files:**
- `stages/3-bdd-debate.ps1` (modify)
- `stages/5-tla-debate.ps1` (modify)
- `vibe.ps1` (modify)
- `tests/stages.Tests.ps1` (create)

**Description:**
Wire fixture generation into pipeline stage transitions. BDD fixtures are generated after stage 3 (BDD debate consensus), before stage 4. TLC fixtures are generated after stage 5 (TLA+ debate consensus), before stage 6. Before entering the coding stage (stage 8), verify both fixtures are valid. **Commit fixture files to the feature branch before worktree creation** — this is a hard ordering constraint: fixture commit MUST complete before any `CreateWorktree(t)` call, because worktrees inherit the branch state at creation time (addresses objection #4). The implementation enforces this by placing the commit in the stage-transition logic between "enter coding stage" and "dispatch tier 1". **Add fixture crash-regenerate integration test** (addresses hardening #34): simulate fixture generation crash at stage boundary, verify regeneration is triggered and stage advances only after valid fixtures are produced.

**Dependencies:** Steps 3, 4, 8, 9

**Test (write first):**
- Test BDD fixture generation runs between stage 3 and stage 4.
- Test TLC fixture generation runs between stage 5 and stage 6.
- Test coding stage entry is blocked until both fixtures are valid.
- Test corrupt fixture triggers regeneration.
- Test fixture precondition check verifies files exist, are non-empty, and are valid JSON.
- Test missing fixture at stage 8 halts with appropriate error.
- Test schema version validation rejects unsupported versions.
- **Test fixture files are committed to feature branch before any worktree creation** (git log shows fixture commit, then worktree add).
- **Test worktrees created after fixture commit contain fixture files in their working tree.**
- **Test fixture crash at stage 3 boundary: BDD fixture crashes -> corrupt -> regenerated -> valid -> stage advances** (addresses hardening #34).
- **Test fixture crash at stage 5 boundary: TLC fixture crashes -> corrupt -> regenerated -> valid -> stage advances** (addresses hardening #34).
- **Test both fixtures crash simultaneously: both regenerated, stage advances only after both valid** (SF convergence).

**TLA+ Coverage:**
- Transition: `AdvanceStage` (fixture precondition for coding stage), `EnterCodingStage`
- State: `bddFixture`, `tlcFixture` (must be "valid" before coding stage)
- Invariant: S9 `FixturesPrecondition`

---

### Step 11: Implementation Writer Explicit Paths

**Files:**
- `stages/6-implementation-writer.ps1` (modify)
- `tests/6-implementation-writer.Tests.ps1` (modify)

**Description:**
Pass both TLA+ spec path AND BDD feature path explicitly to stage 6 (implementation writer). Both paths are included in the writer agent's prompt context. Missing BDD or TLA+ path causes stage 6 to fail with a clear error.

**Dependencies:** Step 10

**Test (write first):**
- Test stage 6 receives TLA+ spec path parameter.
- Test stage 6 receives BDD feature path parameter.
- Test both paths are included in agent prompt.
- Test missing BDD path causes stage 6 to fail with error.
- Test missing TLA+ path causes stage 6 to fail with error.
- Test implementation writer uses BDD scenarios to inform ticket generation.

**TLA+ Coverage:**
- Transition: `AdvanceStage` (stage 6 invocation)
- State: `pipelineStage` (stage 6 execution)

---

### Step 12: Parallel Task Dispatch (Bug Fix)

**Files:**
- `stages/8-coding.ps1` (modify)
- `utils/job-runner.ps1` (modify)
- `tests/8-coding.Tests.ps1` (modify)

**Description:**
Fix same-tier tasks to fan out in parallel during stage 8. Diagnose and fix the serialization bug. Tasks within the same tier execute concurrently. Individual task failure does not block others. Tier does not advance until all parallel tasks complete or halt. **Replace `[System.Threading.Interlocked]` scalar counter with `[System.Collections.Concurrent.ConcurrentDictionary]` shared via `$using:`** (addresses objection #26). The `Interlocked` approach fails across `ForEach-Object -Parallel` runspaces because PowerShell copies the scalar variable into each runspace rather than sharing a reference. `ConcurrentDictionary` is a reference type that survives the `$using:` boundary. **Use `AddOrUpdate()` with an atomic increment factory**: `$counter.AddOrUpdate($tierKey, 1, [Func[string,int,int]]{ param($key,$old) $old + 1 })`. This is critical because naive `$dict[$key] = $dict[$key] + 1` is a compound read-modify-write that is NOT atomic — two threads can read the same value and both write value+1, losing an increment. `AddOrUpdate` performs the read-modify-write atomically within the dictionary's internal locking (addresses objection #29). **Add AnyTaskInTierSucceeded boundary test** — specifically test the case where exactly 1 of N tasks succeeds and the rest fail, verifying the tier advances rather than aborting (addresses objection #16). Verify `TierAllFailed` fires only when zero tasks succeed. **Call `Complete-TaskFailure` from Step 22** after any task reaches "failed" or "timed_out" to clean up worktree and warden resources (addresses objection #20). **Assert no task ever reaches "escalated" state at runtime** (addresses hardening #33): add a runtime invariant check in the job-runner that throws if any task's state equals "escalated" — this state is defined in the TLA+ spec's `TaskStates` set but no transition produces it, so it should never be observed.

**Dependencies:** Steps 5, 6, 7, 22, 23

**Test (write first):**
- Test two tasks in same tier start concurrently (not sequentially).
- Test individual task failure does not block other parallel tasks.
- Test tier does not advance until all tasks complete or halt.
- Test all tasks in tier fail marks tier as failed, pipeline halts.
- **Test `ConcurrentDictionary`-based completion counter increments correctly under concurrent updates from parallel runspaces** (addresses objection #26).
- **Test completion counter is correct after 3 parallel tasks complete simultaneously** — verifies no lost updates.
- Test tier advances only when counter equals total task count.
- Test failed tasks count toward tier completion.
- **Test exactly 1 of 3 tasks succeeds (others fail) — tier advances** (AnyTaskInTierSucceeded boundary).
- **Test exactly 0 of 3 tasks succeed — TierAllFailed fires, pipeline aborts.**
- **Test exactly 2 of 3 tasks succeed — tier advances** (confirms > 1 also works).
- **Test failed task triggers Complete-TaskFailure** — worktree removed, warden torn down after failure (addresses objection #20).
- **Test timed-out task triggers Complete-TaskFailure** — resources cleaned up.
- **Test `AddOrUpdate()`-based completion counter is correct under high contention** — spawn 10 parallel increments with artificial 1ms delay between read and write to amplify race window; verify final count equals 10. This test would FAIL with naive `dict[key] = dict[key] + 1` pattern.
- **Test naive read-modify-write pattern is explicitly NOT used** — static analysis or code review test that greps for `$counter[$key] = $counter[$key]` pattern and fails if found.
- **Test no task ever reaches "escalated" state** — set up tasks through full lifecycle (merged, failed, timed_out), assert none have taskState = "escalated" at any point during or after execution (addresses hardening #33).

**TLA+ Coverage:**
- Transition: `AdvanceTier`, `TierAllFailed`
- State: `currentTier`, `tierComplete`, `completionCounter`
- Invariant: S4 `TierAdvanceRequiresCompletion`, S5 `TasksOnlyInCurrentTier`, S10 `CounterBounded`

---

### Step 13: Task Timeout Watchdog

**Files:**
- `utils/global-timeout.ps1` (modify)
- `tests/global-timeout.Tests.ps1` (modify)

**Description:**
Extend task timeout watchdog to cover all active task states: executing, coverage_gate, review_gate, merge_waiting (not just executing). Terminated task is marked as timed_out. Read-Escalation is called with timeout context. Other parallel tasks continue unaffected. **Add boundary tests** (addresses hardening #39): verify timeout behavior at exactly the 30-minute boundary and for each of the 4 active task states individually.

**Dependencies:** Step 12

**Test (write first):**
- Test task executing longer than 30 minutes is terminated.
- Test timeout applies to coverage_gate, review_gate, and merge_waiting states.
- Test timed-out task is marked as timed_out.
- Test Read-Escalation is called with timeout context.
- Test other parallel tasks continue after one times out.
- **Test task at 29:59 elapsed is NOT timed out** (boundary — just under, addresses hardening #39).
- **Test task at 30:00 elapsed IS timed out** (boundary — exactly at limit, addresses hardening #39).
- **Test task at 30:01 elapsed IS timed out** (boundary — just over, addresses hardening #39).
- **Test timeout while in "executing" state: task marked timed_out, Read-Escalation called with "executing" context** (per-state, addresses hardening #39).
- **Test timeout while in "coverage_gate" state: task marked timed_out, coverageIter preserved** (per-state, addresses hardening #39).
- **Test timeout while in "review_gate" state: task marked timed_out, coverage results preserved for debugging** (per-state, addresses hardening #39).
- **Test timeout while in "merge_waiting" state: task marked timed_out, mergeState set to "failed", merge mutex NOT affected** (per-state, addresses hardening #39).

**TLA+ Coverage:**
- Transition: `TaskTimeout(t)`
- State: `taskState` -> "timed_out"
- Invariant: S10 `CounterBounded` (timed_out increments counter)
- Liveness: L3 `TasksEventuallyTerminate`

---

### Step 14: 300% Coverage Gate

**Files:**
- `utils/coverage-gate.ps1` (create)
- `tests/coverage-gate.Tests.ps1` (create)

**Description:**
Implement the 300% coverage gate with three independent 100% coverage targets: PBT (property-based, branch coverage of "unit"-tagged files), contract (branch coverage of "integration"-tagged files), E2E (branch coverage of "e2e-target"-tagged files). Coverage is measured in isolation per category. Truncation rounding (floor, not round). Zero test files for a category causes failure (no vacuous 100%). Dual-cap interaction: each coverage failure consumes exactly 1 TDD iteration + 1 coverage iteration. Coverage regression detection across categories. All three re-evaluated every iteration (no caching). Coverage tool crash (no report) is a tool error, not counted against cap. For PowerShell/Pester projects (vibe-cli dogfooding): use line coverage via Pester JaCoCo. For TypeScript: use branch coverage via vitest/istanbul. File manifest tag validation (unit, integration, e2e-target). **Add tddIter off-by-one boundary test** — verify that with tddIter starting at 1 (set in DepsInstalled), MaxTDDCycles-1 retries are available, not MaxTDDCycles (addresses objection #6). **Add dual-cap simultaneous exhaustion test** (addresses objection #9). **E2E category uses Playwright detection from Step 23** to determine whether to generate Playwright browser tests or non-UI trace replay tests (addresses objection #22). The coverage gate evaluates whatever test type was generated — it is agnostic to test runner, only measuring coverage.

**Dependencies:** Steps 8, 9, 23

**Test (write first):**
- Test all three categories must independently reach 100% for gate to pass.
- Test gate fails if any category below 100%, identifies deficient category.
- Test coverage categories are measured in isolation (no cross-satisfaction).
- Test truncation rounding: 99.5% -> 99% -> fail.
- Test exactly 100% passes.
- Test zero test files for a category causes failure with error.
- Test coverage regression is detected (one category drops while fixing another).
- Test all three re-evaluated every iteration (no caching from prior iteration).
- Test coverage gate failure sends task to GREEN phase with specific uncovered branches.
- Test coverage iteration cap stops retries after MaxCoverageIter failures.
- Test TDD cycle cap stops retries after MaxTDDCycles iterations.
- Test each coverage failure consumes exactly 1 TDD iteration.
- Test coverage gate pass does not consume additional TDD iteration.
- Test coverage tool crash is not counted against coverage iteration cap.
- Test PowerShell projects use Pester line coverage (JaCoCo).
- Test TypeScript projects use vitest branch coverage.
- Test file manifest with unrecognized tag causes error.
- Test file manifest with untagged file causes error.
- Test gate output includes raw fraction and truncated percentage.
- **Test tddIter boundary: with MaxTDDCycles=3 and tddIter starting at 1, exactly 2 coverage retries allowed** (CoverageGateFail fires at tddIter=1 and tddIter=2; TDDCapExhausted fires at tddIter=3).
- **Test dual-cap simultaneous exhaustion: coverageIter=MaxCoverageIter AND tddIter=MaxTDDCycles** — verify CoverageCapExhausted or TDDCapExhausted fires (whichever guard matches first), task fails exactly once.
- **Test E2E category evaluates Playwright tests when project is Playwright-available** (coverage gate is test-runner-agnostic but must handle Playwright coverage output format).
- **Test E2E category evaluates non-UI trace replay tests when Playwright unavailable.**

**TLA+ Coverage:**
- Transition: `EnterCoverageGate(t)`, `CoverageGatePass(t)`, `CoverageGateFail(t)`, `CoverageCapExhausted(t)`, `TDDCapExhausted(t)`
- State: `coveragePBT`, `coverageContract`, `coverageE2E`, `coverageIter`, `tddIter`
- Invariant: S6 `CoverageCapRespected`, S7 `TDDCapRespected`

---

### Step 15: Review Gate Failure Path

**Files:**
- `utils/review-gate.ps1` (modify)
- `tests/review-gate.Tests.ps1` (modify)

**Description:**
Add review gate failure path. Currently review-gate.ps1 only handles pass. Add ReviewGateFail: task fails with escalation when review is rejected. Increment completion counter on failure. **Add multi-cycle path test** (addresses hardening #40): verify that a task which passes through multiple coverage retries and then fails at review has correct tddIter, coverageIter, and the completion counter increments exactly once.

**Dependencies:** Step 14

**Test (write first):**
- Test review gate pass sends task to merge_waiting.
- Test review gate failure marks task as failed.
- Test review gate failure increments completion counter.
- Test review gate failure calls Read-Escalation.
- **Test multi-cycle-then-review-fail: task executes -> coverage fail (tddIter=2, coverageIter=1) -> execute -> coverage pass -> review fail** — verify tddIter=2, coverageIter=1 are preserved, completion counter increments exactly once, not once-per-cycle (addresses hardening #40).
- **Test review gate failure with negative/zero depth input: review agent returns empty or invalid response -> treated as failure, not crash** (addresses hardening #40).

**TLA+ Coverage:**
- Transition: `ReviewGatePass(t)`, `ReviewGateFail(t)`
- State: `taskState` (review_gate -> merge_waiting or failed)
- Liveness: L3 `TasksEventuallyTerminate`

---

### Step 16: Merge Serialization with Per-Feature Mutex and Rebase-Inside-Mutex

**Files:**
- `utils/merge-queue.ps1` (modify)
- `tests/merge-queue.Tests.ps1` (modify)

**Description:**
Add per-feature merge mutex (`Global\vibe-cli-merge-<feature>`) serializing branch merges within a tier (addresses objection #13). Merges are serialized in task completion order (ties broken by task ID). **Rebase is performed INSIDE the mutex, not before it** (addresses objection #19). The sequence is: acquire mutex -> rebase worktree branch onto target -> merge -> release mutex. This eliminates the TOCTOU gap where another merge could invalidate a pre-mutex rebase. If the rebase fails inside the mutex: release mutex, bump `apiRetries`, return to waiting (same as merge conflict path). If the merge fails after successful rebase: release mutex, bump `apiRetries`, return to waiting. This means both rebase conflicts and merge conflicts consume from the same `apiRetries` budget, which is correct — the TLA+ spec models the overall merge-attempt budget, not the specific failure type. `apiRetries` is owned exclusively by this step — it tracks merge attempt retries per the TLA+ spec and is NOT shared with general API retry logic (addresses objection #10). Merge mutex timeout (5 minutes default): task fails. On merge success: worktree removed, warden torn down. Reset-MergeQueue clears pending entries on abort. **Handle `AbandonedMutexException`**: when acquiring the merge mutex, catch `AbandonedMutexException` — this occurs when the prior process crashed while holding the merge mutex. The handler acquires the mutex (granted despite exception), logs warning, resets merge state for any task that was in "merging" state (prior process's merge was interrupted), and proceeds (addresses objection #31). **Document known limitation**: the TLA+ spec models single-process execution; two concurrent pipeline processes on the same feature could interleave mutex acquisitions in ways not verified by TLC. The per-feature mutex scoping (objection #13) prevents cross-feature deadlock, and the strict acquisition ordering (pipeline lock -> merge mutex, objection #31) prevents same-feature deadlock between the two mutex types. A full two-process TLC model is recommended for future hardening but is out of scope for this implementation. **Handle merge success with worktree removal failure** (addresses hardening #36): if merge succeeds but `git worktree remove` fails, the task is still marked "merged" (the merge is committed); the worktree removal failure is logged, retried once, and if still failing, `Complete-TaskFailure` handles residual cleanup. **Add rebase timeout** (addresses hardening #43): rebase inside mutex has a 60-second timeout (configurable); if exceeded, rebase is killed, merge mutex released, `apiRetries` bumped, task returns to waiting.

**Dependencies:** Steps 5, 12, 15

**Test (write first):**
- Test at most one task merges at a time (merge mutex exclusive).
- Test merge ordering is by completion time, tie-broken by task ID.
- **Test rebase runs INSIDE mutex** — acquire mutex, then rebase, then merge, then release (addresses objection #19).
- **Test rebase conflict inside mutex: releases mutex, bumps apiRetries, returns task to waiting.**
- **Test no TOCTOU window: second task cannot merge between first task's rebase and merge** (both happen under mutex).
- **Test rebase + merge conflict together count against same apiRetries budget.**
- Test merge conflict releases mutex, bumps apiRetries, returns to waiting.
- Test merge conflict exhaustion marks task as failed with error.
- Test merge mutex timeout after 5 minutes marks task as failed.
- Test merge success removes worktree and tears down warden.
- Test merge success releases mutex and increments completion counter.
- Test Reset-MergeQueue clears pending entries on abort.
- **Test mutex name includes feature name: `Global\vibe-cli-merge-<feature>`.**
- **Test two different features can merge concurrently on the same machine.**
- **Test apiRetries is incremented only on merge/rebase conflict, not on general API errors** (semantic isolation from Step 17).
- **Test `AbandonedMutexException` on merge mutex is caught and mutex acquired** — simulate abandoned merge mutex, verify merge proceeds with warning.
- **Test abandoned merge mutex resets in-progress merge state** — prior process's "merging" task is reset to "waiting" on recovery.
- **Test merge succeeds but worktree removal fails: task still marked "merged", worktree removal failure logged, retry attempted, residual cleanup via Complete-TaskFailure** (addresses hardening #36).
- **Test merge succeeds and worktree removal succeeds on retry: task marked "merged", worktreeState="removed"** (addresses hardening #36).
- **Test rebase timeout at 60 seconds: rebase killed, mutex released, apiRetries bumped, task returns to waiting** (addresses hardening #43).
- **Test rebase timeout is configurable** — setting timeout to 120s allows a 90s rebase to succeed (addresses hardening #43).

**TLA+ Coverage:**
- Transition: `AcquireMergeMutex(t)`, `MergeSuccess(t)`, `MergeConflict(t)`, `MergeConflictExhausted(t)`, `MergeMutexTimeout(t)`
- State: `mergeMutex`, `mergeState`, `apiRetries` (merge-attempt-only counter)
- Invariant: S3 `MergeMutexExclusive`, S13 `MergedWorktreeCleanedUp`

---

### Step 17: Claude API Transient Failure Retry

**Files:**
- `utils/invoke-claude.ps1` (modify)
- `tests/invoke-claude.Tests.ps1` (modify)

**Description:**
Add retry logic to Invoke-Claude: exponential backoff for timeouts/500s/network errors (5s, 10s, 20s...), respect Retry-After header for 429s, cap at 5 attempts. 400 errors are not retried (client error -> immediate escalation). Parallel task API failures are independent. API failure during coverage gate does not increment coverage counter. Log all retry attempts and outcomes. **This retry logic is independent of the TLA+ `apiRetries` variable**, which models merge-attempt retries exclusively (Step 16). General HTTP retry is a cross-cutting infrastructure concern modeled implicitly in the spec (addresses objection #10). **Add optional integration test with local HTTP server** (addresses hardening #46).

**Dependencies:** None

**Test (write first):**
- Test timeout triggers retry with exponential backoff (5s, 10s, 20s).
- Test 429 respects Retry-After header.
- Test network error triggers retry.
- Test 500 is retried like timeout.
- Test 400 is not retried, immediate escalation.
- Test retries capped at 5 attempts.
- Test successful retry continues normally.
- Test parallel task failures are independent.
- Test API failure during coverage gate does not increment coverage counter.
- **Test this retry counter is a separate variable from apiRetries** (merge-attempt counter in merge-queue.ps1) — no shared state.
- **[Tag('Integration')] Test with local `System.Net.HttpListener` server returning 500 then 200: verifies real HTTP retry with actual delay timing** (addresses hardening #46).
- **[Tag('Integration')] Test with local server returning 429 + Retry-After: 2, then 200: verifies actual 2s delay before retry** (addresses hardening #46).

**TLA+ Coverage:**
- (General HTTP retry is cross-cutting infrastructure; not directly mapped to a TLA+ variable)
- Note: `apiRetries` in the TLA+ spec is exclusively used by `MergeConflict(t)` — see Step 16

---

### Step 18: Abort Cleanup Handler

**Files:**
- `vibe.ps1` (modify)
- `utils/abort-cleanup.ps1` (create)
- `tests/abort-cleanup.Tests.ps1` (create)

**Description:**
Implement deterministic abort cleanup on Ctrl+C (CancelKeyPress), unhandled exception, or external kill (try/finally). Cleanup sequence is strictly ordered: **(1) write ABORT marker to pipeline.log FIRST**, **(2) terminate running agents**, **(3) abort in-progress merges** (`git merge --abort` in each worktree with MERGE_HEAD — addresses objection #21), **(4) remove all active worktrees**, **(5) delete temp branches**, **(6) release pipeline lock**, **(7) delete orphaned .tmp fixture files**. **Critical ordering change from revision 2:** merge abort now occurs BEFORE worktree removal (addresses objection #21). The prior sequence removed worktrees first, which orphaned MERGE_HEAD state because `git merge --abort` requires the worktree to exist. **ABORT marker MUST be written before lock release** — in the TLA+ spec, `AbortCleanup` treats these atomically; in sequential implementation, write-before-release ensures the ABORT marker is durable even if the process is killed during lock release (addresses objection #7). **Reset `mergeState` for in-flight tasks** — `AbortCleanup` in the TLA+ spec does NOT reset `mergeState`, but this creates an inconsistency where a task can have `mergeState="merging"` and `taskState="failed"` simultaneously. The implementation adds explicit `mergeState` reset to "failed" for any task whose `taskState` transitions to "failed" during abort (addresses objection #15). **New implementation-level invariant** (addresses objection #24): after abort cleanup completes, assert that no task has `mergeState` in {"waiting", "merging"} when `taskState = "failed"`. This invariant is not in the TLA+ spec (the spec allows the divergence) but the implementation enforces consistency. Cleanup is best-effort (logs failures, continues). Double Ctrl+C forces immediate exit. Release merge mutex if held. **Parameterized abort testing across all task phases** (addresses objection #32): abort is tested with tasks in each of the 8 in-flight states to verify phase-specific cleanup requirements. **Partial worktree leak detection**: after abort cleanup, scan `.worktrees/` directory for any remaining worktrees matching the current runId — if found, test fails (leak detected). **Double-Ctrl+C resilience**: first Ctrl+C starts cleanup sequence; second Ctrl+C during cleanup forces immediate `[Environment]::Exit(1)` — the partial cleanup state must be resumable via `--resume`. **AbortTriggered->AbortCleanup atomicity**: between `pipelineAborted=TRUE` (AbortTriggered) and cleanup execution (AbortCleanup), the `~pipelineAborted` guard on all task transitions prevents new state changes — test verifies no task advances after abort flag is set. **Worktree removal serialization during abort** (addresses hardening #38): abort cleanup iterates worktrees sequentially (not in parallel) for removal, so `git worktree remove` is called at most once per worktree; a second call on an already-removed worktree (e.g., removed by `Complete-TaskFailure` just before abort) is a no-op with a warning, not a crash.

**Dependencies:** Steps 1, 3, 5, 16

**Test (write first):**
- Test CancelKeyPress handler fires and sets Cancel = $true.
- Test all running agents are terminated via Stop-Process.
- Test all active worktrees are removed.
- Test pipeline lock is released.
- Test ABORT marker is written to pipeline.log with signal and stage.
- Test orphaned .tmp fixture files are deleted.
- Test in-progress merge is aborted cleanly.
- Test cleanup is best-effort (one failure doesn't stop others).
- Test double Ctrl+C forces immediate exit.
- Test merge mutex is released.
- Test try/finally block runs cleanup on external termination.
- **Test ABORT marker is written BEFORE lock is released** (log timestamp < lock-release timestamp, or mock verification of call order).
- **Test mergeState is reset to "failed" for any task with taskState="failed" after abort** (no inconsistent mergeState="merging" + taskState="failed").
- **Test cleanup sequence order: ABORT marker -> terminate agents -> abort merges -> remove worktrees -> delete branches -> release lock** (addresses objection #21).
- **Test `git merge --abort` runs in worktree BEFORE worktree is removed** (addresses objection #21).
- **Test worktree with MERGE_HEAD has merge aborted, then worktree removed cleanly.**
- **Test worktree without MERGE_HEAD is removed directly (no merge --abort needed).**
- **Test post-cleanup invariant: no task has mergeState in {"waiting","merging"} when taskState = "failed"** (addresses objection #24).
- **Test parameterized abort at each task phase** — `@("worktree_creating","warden_configuring","deps_installing","executing","coverage_gate","review_gate","merge_waiting","merging")` — for each phase: set up task in that phase, trigger abort, verify task transitions to "failed" and phase-specific resources are cleaned up.
- **Test abort with worktree_creating task**: worktree creation in progress is cancelled, partial worktree directory is removed.
- **Test abort with merging task**: in-progress merge is aborted (`git merge --abort`), merge mutex released, worktree removed.
- **Test partial worktree leak detection**: abort when 2 of 3 tasks have active worktrees (third is still idle), verify exactly 2 worktrees removed, no orphans in `.worktrees/`.
- **Test abort with zero active worktrees**: abort before any task starts, verify cleanup completes quickly with no worktree operations.
- **Test double-Ctrl+C behavior**: first Ctrl+C triggers cleanup, second Ctrl+C during worktree removal forces exit. Verify: (a) exit code is non-zero, (b) subsequent `--resume` can recover from partial cleanup state.
- **Test double-Ctrl+C does not corrupt pipeline.log**: verify ABORT marker was written (first Ctrl+C) even though cleanup was interrupted (second Ctrl+C).
- **Test AbortTriggered->AbortCleanup interleaving**: set pipelineAborted=TRUE, then attempt task state transitions (CreateWorktree, DepsInstalled, CoverageGatePass, AcquireMergeMutex) — all must be rejected by the `~pipelineAborted` guard.
- **Test no new tasks can start after AbortTriggered**: verify CreateWorktree is not called for idle tasks after abort flag is set.
- **Test worktree removal is serialized (not parallel)**: abort with 3 active worktrees, verify `git worktree remove` is called sequentially, never concurrently (addresses hardening #38).
- **Test already-removed worktree during abort: worktree removed by Complete-TaskFailure just before abort cleanup reaches it -> abort cleanup logs warning and continues, does not crash** (addresses hardening #38).

**TLA+ Coverage:**
- Transition: `AbortTriggered`, `AbortCleanup`, `Done`
- State: `pipelineAborted`, `abortCleanupDone`, `mergeState` (reset on abort)
- Invariant: S11 `AbortReleasesLock`, S12 `NoExecutionAfterAbort`
- Liveness: L2 `AbortEventuallyCleanedUp`

---

### Step 19: Pipeline Completion

**Files:**
- `vibe.ps1` (modify)
- `stages/8-coding.ps1` (modify)
- `tests/pipeline-completion.Tests.ps1` (create)

**Description:**
Implement pipeline completion: when all tiers complete, release lock, record final completion token. Advance pipelineStage to NumStages+1. Write PIPELINE COMPLETE marker. Preserve pipeline.log for completed run. Next fresh run starts a new log. **Add negative tests for impossible states** (addresses hardening #42): assert that completion cannot occur when lock is not held, when abort flag is set, or when non-terminal tasks exist. Add idempotent completion test.

**Dependencies:** Steps 12, 16, 18

**Test (write first):**
- Test pipeline completion releases lock.
- Test pipeline completion writes PIPELINE COMPLETE marker.
- Test pipeline completion records final idempotency token.
- Test pipelineStage advances to NumStages+1 on completion.
- Test next fresh run starts a new pipeline.log.
- **Test completion with lock not held is impossible** — assert guard rejects (pipelineLock must be "held") (addresses hardening #42).
- **Test completion with abort flag set is impossible** — assert guard rejects (~pipelineAborted required) (addresses hardening #42).
- **Test completion with non-terminal tasks is impossible** — assert all tiers must be complete (all tasks in terminal states) (addresses hardening #42).
- **Test idempotent completion** — calling complete twice is a no-op (pipelineStage is already NumStages+1, guard prevents re-entry) (addresses hardening #42).
- **Test PIPELINE COMPLETE marker includes runId and final stage number.**

**TLA+ Coverage:**
- Transition: `PipelineComplete`, `Done`
- State: `pipelineStage` (NumStages+1)
- Liveness: L1 `PipelineEventuallyCompletes`, L4 `TiersEventuallyComplete`

---

### Step 20: End-to-End Integration — Full Pipeline Lifecycle

**Files:**
- `tests/pipeline-e2e.Tests.ps1` (create)

**Description:**
End-to-end integration tests verifying the full pipeline lifecycle: fresh start -> stages -> fixture generation -> coding stage -> tier execution -> coverage gate -> review -> merge -> completion. Also: fresh start -> abort -> cleanup -> resume. Also: crash recovery (stale lock -> resume). These tests exercise liveness properties and the complete state machine. **Add LockGoesStale full-reset verification** (addresses objection #5). **Add crash-resume idempotency dedup test** (addresses objection #18). **Agent assignment confirmed as pester-writer** for PowerShell E2E tests (addresses objection #12). **Add post-abort mergeState consistency verification** (addresses objection #24). **Add Playwright fallback E2E test** (addresses objection #22).

**Dependencies:** Steps 1-19, 21, 22, 23

**Test (write first):**
- Test full pipeline lifecycle: start -> complete (L1).
- Test abort lifecycle: start -> abort -> cleanup done (L2).
- Test task lifecycle: idle -> executing -> merged (L3).
- Test tier lifecycle: tier starts -> tier completes (L4).
- Test crash recovery: lock goes stale -> resume -> complete.
- Test resume after abort: abort marker -> resume -> complete.
- Test coverage gate fail -> retry -> pass -> merge flow.
- Test merge conflict -> retry -> success flow.
- Test all-tasks-failed tier halts pipeline.
- Test fixture precondition blocks coding stage when fixtures invalid.
- **Test LockGoesStale full state reset: all 13+ variables are reset** — verify taskState, worktreeState, wardenState, currentTier, tierComplete, completionCounter, mergeMutex, coverageIter, tddIter, coveragePBT, coverageContract, coverageE2E, mergeState, apiRetries all return to initial values; pipelineLock="stale", isResuming=TRUE, crashCount incremented.
- **Test crash-resume-crash-resume cycle with crashCount incrementing** — verify second resume still functions correctly when crashCount=1.
- **Test idempotency tokens are not duplicated after crash-resume cycle** — tokens from prior run are loaded into set, re-invocation does not append duplicates.
- **Test --resume after stage 8 partial tier completion** (E2E: simulate crash mid-tier-2, resume, verify tier 1 results preserved, tier 2 restarts).
- **Test warden is active during merge operation** (E2E: verify agent writes are still scoped during merge phase).
- **Test post-abort mergeState consistency** (E2E: abort during merge, verify no task has mergeState="merging" + taskState="failed") (addresses objection #24).
- **Test abort cleanup order** (E2E: abort during merge, verify merge --abort runs before worktree removal) (addresses objection #21).
- **Test failed task resources cleaned up** (E2E: task fails at coverage gate, verify worktree removed and warden torn down) (addresses objection #20).
- **Test Playwright fallback** (E2E: project without @playwright/test generates non-UI trace replay tests instead of Playwright tests) (addresses objection #22).
- **Test resume with dirty git state** (E2E: simulate crash during merge leaving MERGE_HEAD, verify --resume cleans up before re-dispatching) (addresses objection #28).
- **Test E2E: abort at each task lifecycle phase** — full pipeline starts, abort injected at each phase, verify clean recovery.
- **Test E2E: double-Ctrl+C then resume** — abort + force-quit + resume -> pipeline completes.
- **Test E2E: partial worktree leak after abort** — verify `.worktrees/` is clean after abort cleanup.
- **Test E2E: no task reaches "escalated" state throughout full lifecycle** — monitors all task state transitions, asserts "escalated" never appears (addresses hardening #33).
- **Test E2E: fixture crash-regenerate-converge** — BDD fixture crashes during stage 3, is regenerated, pipeline continues to completion (addresses hardening #34).
- **Test E2E: merge succeeds but worktree removal fails** — task still marked merged, next task's merge proceeds, worktree eventually cleaned up (addresses hardening #36).

**TLA+ Coverage:**
- Liveness: L1 `PipelineEventuallyCompletes`, L2 `AbortEventuallyCleanedUp`, L3 `TasksEventuallyTerminate`, L4 `TiersEventuallyComplete`
- Invariant: All safety invariants (S1-S15) verified end-to-end
- State: All states exercised through full lifecycle
- Transition: All transitions exercised through scenarios

---

### Step 21: Crash Budget Enforcement

**Files:**
- `utils/pipeline-lock.ps1` (modify)
- `utils/abort-cleanup.ps1` (modify)
- `tests/crash-budget.Tests.ps1` (create)

**Description:**
Implement the crash budget system modeled by `crashCount` and `MaxCrashes` in the TLA+ spec (addresses objection #1). The crash budget prevents infinite crash-resume cycles that would violate liveness properties. `crashCount` is persisted in the lock file metadata and incremented each time a stale lock is detected during --resume. When `crashCount >= MaxCrashes`, --resume fails with "crash budget exhausted — manual intervention required" error. `MaxCrashes` defaults to 3 (configurable). On fresh start, `crashCount` resets to 0. The crash budget is the implementation of the `LockGoesStale` bounded-crash model from the TLA+ spec. **Add full-reset verification test** — after `LockGoesStale` (simulated crash), verify ALL 13+ state variables are reset to their initial values before resume proceeds (addresses objection #5).

**Dependencies:** Step 1

**Test (write first):**
- Test crashCount is 0 on fresh pipeline start.
- Test crashCount is incremented when stale lock is detected during --resume.
- Test crashCount persists across process restarts (stored in lock file or adjacent metadata).
- Test --resume fails with "crash budget exhausted" when crashCount >= MaxCrashes.
- Test MaxCrashes defaults to 3.
- Test MaxCrashes is configurable via parameter.
- Test fresh start resets crashCount to 0 regardless of prior crash history.
- Test crashCount survives corrupt lock file recovery (metadata preserved or reset).
- **Test LockGoesStale full reset: after simulated crash, all state variables are at initial values** — taskState=idle, worktreeState=none, wardenState=unconfigured, currentTier=0, tierComplete=all FALSE, completionCounter=all 0, mergeMutex=free, coverageIter=0, tddIter=0, coveragePBT=unknown, coverageContract=unknown, coverageE2E=unknown, mergeState=none, apiRetries=0.
- **Test crash-resume-crash-resume sequence** with crashCount incrementing 1, 2, then blocked at MaxCrashes=2.
- Test crashCount <= MaxCrashes invariant holds at all times (S15).

**TLA+ Coverage:**
- Transition: `LockGoesStale` (crashCount' = crashCount + 1, bounded by MaxCrashes)
- State: `crashCount` (0..MaxCrashes)
- Invariant: S15 `CrashBudgetRespected`
- Liveness: (crash budget bound enables L1 `PipelineEventuallyCompletes` by preventing infinite crash-resume cycles)

---

### Step 22: Task Failure Cleanup

**Files:**
- `utils/task-cleanup.ps1` (create)
- `tests/task-cleanup.Tests.ps1` (create)

**Description:**
New utility providing `Complete-TaskFailure` — a centralized cleanup function called whenever a task transitions to "failed" or "timed_out" during normal execution (not abort). **This addresses objection #20**: the TLA+ spec's 7 failure transitions (`DepsInstallFailed`, `CoverageCapExhausted`, `TDDCapExhausted`, `ReviewGateFail`, `MergeConflictExhausted`, `MergeMutexTimeout`, `WardenConfigFailed`) leave `worktreeState` and `wardenState` in their current values ("active") with no cleanup path except abort/crash. The implementation adds per-task cleanup:

1. If `worktreeState = "active"`: remove worktree, set to "removed"
2. If `wardenState` in {"configuring", "active"}: tear down warden, set to "unconfigured"
3. If `mergeState` in {"waiting", "merging"}: reset to "failed"
4. Log cleanup actions and any cleanup failures (best-effort — log but don't throw)

The function is called by the job-runner (Step 12) immediately after recording a task failure. `WorktreeCreationFailed` does NOT need this cleanup because `worktreeState` is already "none" (creation never succeeded). `WardenConfigFailed` DOES need it because `worktreeState` is "active" (worktree was created before warden config failed). **Also called by Step 16 when merge succeeds but worktree removal fails** (addresses hardening #36): `Complete-TaskFailure` handles residual worktree cleanup as a fallback.

**Dependencies:** Steps 5, 6

**Test (write first):**
- Test `Complete-TaskFailure` removes active worktree and sets state to "removed".
- Test `Complete-TaskFailure` tears down active warden and sets state to "unconfigured".
- Test `Complete-TaskFailure` resets mergeState from "waiting" to "failed".
- Test `Complete-TaskFailure` resets mergeState from "merging" to "failed".
- Test `Complete-TaskFailure` is a no-op when worktreeState is "none" (WorktreeCreationFailed path).
- Test `Complete-TaskFailure` handles worktree removal failure gracefully (logs error, continues).
- Test `Complete-TaskFailure` handles warden teardown failure gracefully (logs error, continues).
- **Test WardenConfigFailed path: worktree is active -> removed after cleanup.**
- **Test DepsInstallFailed path: worktree active + warden active -> both cleaned up.**
- **Test CoverageCapExhausted path: worktree active + warden active -> both cleaned up.**
- **Test ReviewGateFail path: worktree active + warden active -> both cleaned up.**
- **Test MergeConflictExhausted path: worktree active + warden active + mergeState="failed" -> worktree + warden cleaned up.**
- **Test MergeMutexTimeout path: worktree active + warden active + mergeState="failed" -> cleaned up.**
- **Test TaskTimeout path: worktree active + warden active -> both cleaned up.**
- **Test residual cleanup after merge-success-worktree-fail: worktree still active after successful merge -> `Complete-TaskFailure` removes it** (addresses hardening #36).

**TLA+ Coverage:**
- Transition: (cleanup after) `WardenConfigFailed(t)`, `DepsInstallFailed(t)`, `CoverageCapExhausted(t)`, `TDDCapExhausted(t)`, `ReviewGateFail(t)`, `MergeConflictExhausted(t)`, `MergeMutexTimeout(t)`, `TaskTimeout(t)`
- State: `worktreeState` (active -> removed on failure cleanup), `wardenState` (active -> unconfigured on failure cleanup)
- Invariant: (strengthens S1 `WardenRequiresWorktree` and S13 `MergedWorktreeCleanedUp` for failure paths)

---

### Step 23: Playwright Detection and Fallback

**Files:**
- `utils/playwright-detect.ps1` (create)
- `tests/playwright-detect.Tests.ps1` (create)

**Description:**
New utility that detects Playwright availability in the target project and determines the E2E test generation strategy. **This addresses objection #22**: the elicitor explicitly lists "Playwright not available -> fall back to non-UI trace replay" as an edge case, and the BDD scenarios include 6 Playwright-related scenarios, but the prior plan had zero test coverage for this path. The detection logic:

1. Check target project's `package.json` for `@playwright/test` in `dependencies` or `devDependencies`.
2. If found -> classify as Playwright-available -> E2E tests use Playwright (browser actions + HTML assertions mapped from TLC state traces via LLM).
3. If not found OR no `package.json` exists -> classify as Playwright-unavailable -> E2E tests fall back to non-UI trace replay.
4. Return classification result for use by coding agent prompt construction and coverage gate E2E category.

**Dependencies:** None

**Test (write first):**
- **Test project with `@playwright/test` in devDependencies is classified as Playwright-available.**
- **Test project with `@playwright/test` in dependencies is classified as Playwright-available.**
- **Test project without `@playwright/test` in either field is classified as Playwright-unavailable.**
- **Test project with no package.json is classified as Playwright-unavailable.**
- **Test project with empty package.json (no dependencies key) is classified as Playwright-unavailable.**
- **Test project with corrupted package.json (invalid JSON) is classified as Playwright-unavailable with warning.**
- **Test Playwright-available returns "playwright" strategy identifier for E2E test generation.**
- **Test Playwright-unavailable returns "trace-replay" strategy identifier for E2E test generation.**
- **Test UI project with Playwright generates browser action tests from TLC state traces** (BDD: "UI project E2E tests use Playwright").
- **Test non-UI project (API, CLI) generates trace replay tests regardless of Playwright availability** (BDD: "Non-UI project E2E tests use trace replay").
- **Test UI project WITHOUT Playwright falls back to non-UI trace replay** (BDD: "Playwright not available falls back to non-UI trace replay").

**TLA+ Coverage:**
- (Playwright detection is an implementation detail not modeled in TLA+ spec; it determines the test type for the `coverageE2E` category)
- State: `coverageE2E` (the tests being evaluated depend on Playwright detection)
- Transition: (influences `CoverageGatePass(t)` by determining what tests are generated)

---

## State Coverage Audit

### Covered

All TLA+ states, transitions, and properties are covered by the implementation plan, with one exception noted below.

| Element | Coverage |
|---------|----------|
| **States** | All 25 state variables covered across Steps 1-23; new mutex acquisition ordering and AbandonedMutexException handling verified by tests in Steps 1, 16, 18 |
| **Transitions** | All 38 named actions mapped to specific steps |
| **Safety Invariants** | All 15 invariants (S1-S15) have tests verifying them |
| **Liveness Properties** | All 4 properties (L1-L4) have integration tests in Step 20 |

### Unmapped States

- **`"escalated"` in `TaskStates`** — This state value is defined in the TLA+ spec's `TaskStates` set (line 127) but **no transition in the `Next` relation ever produces `taskState[t] = "escalated"`**. It is a dead state: unreachable from `Init` under any sequence of transitions. **Recommendation:** Remove `"escalated"` from the TLA+ spec's `TaskStates` set in a follow-up spec revision. The implementation does NOT handle "escalated" as a reachable state. Step 12 adds a runtime assertion that throws if any task reaches "escalated", and Step 20 adds an E2E test verifying it never appears during a full lifecycle. (Addresses hardening item #33.)

### Detailed Transition Coverage

| Transition | Step(s) |
|------------|---------|
| AcquireLockFresh | 1, 4 |
| AcquireStaleLock | 1, 4, 21 |
| ResumeAcquireLock | 1, 4 |
| LockGoesStale | 1, 18, 20, 21 |
| AdvanceStage | 3, 10, 11 |
| GenerateBDDFixtures | 8, 10 |
| BDDFixtureComplete | 8, 10 |
| BDDFixtureCrash | 8, 10 |
| GenerateTLCFixtures | 9, 10 |
| TLCFixtureComplete | 9, 10 |
| TLCFixtureCrash | 9, 10 |
| EnterCodingStage | 10, 12 |
| CreateWorktree(t) | 5 |
| WorktreeCreated(t) | 5 |
| WorktreeCreationFailed(t) | 5 |
| WardenConfigured(t) | 6 |
| WardenConfigFailed(t) | 6, 22 |
| DepsInstalled(t) | 7 |
| DepsInstallFailed(t) | 7, 22 |
| EnterCoverageGate(t) | 14 |
| CoverageGatePass(t) | 14 |
| CoverageGateFail(t) | 14 |
| CoverageCapExhausted(t) | 14, 22 |
| TDDCapExhausted(t) | 14, 22 |
| TaskTimeout(t) | 13, 22 |
| ReviewGatePass(t) | 15 |
| ReviewGateFail(t) | 15, 22 |
| AcquireMergeMutex(t) | 16 |
| MergeSuccess(t) | 16 |
| MergeConflict(t) | 16 |
| MergeConflictExhausted(t) | 16, 22 |
| MergeMutexTimeout(t) | 16, 22 |
| AdvanceTier | 12 |
| TierAllFailed | 12 |
| PipelineComplete | 19 |
| AbortTriggered | 18 |
| AbortCleanup | 18 |
| Done | 19, 20 |

### Debate Objection Traceability

| Objection | Test(s) Verifying Resolution |
|-----------|------------------------------|
| #1 S15 unimplemented | Step 21: crashCount tests, S15 invariant; Step 4: budget-exhausted resume test |
| #2 Intra-tier violations | Tier DAG restructured — T12 in Tier 5 (after T7 in Tier 4), T19 in Tier 8 (after T18 in Tier 7) |
| #3 --resume partial stage 8 | Step 4: partial tier and partial task completion resume tests |
| #4 T5/T10 fixture ordering | Step 10: fixture-commit-before-worktree test; Step 5: worktree-inherits-fixtures test |
| #5 LockGoesStale full reset | Step 21: 13+ variable reset test; Step 20: E2E full-reset test |
| #6 tddIter off-by-one | Step 7: tddIter=1 init test; Step 14: MaxTDDCycles-1 boundary test |
| #7 ABORT before lock release | Step 18: write-before-release ordering test |
| #8 InitResume 4 combinations | Step 4: parametric test for all 4 {bdd,tlc} x {missing,valid} combos (now 6 with #27) |
| #9 Dual-cap exhaustion | Step 14: simultaneous coverageIter+tddIter exhaustion test |
| #10 apiRetries semantic | Step 16: apiRetries merge-only test; Step 17: separate counter test |
| #11 No fsync | Steps 3, 8, 9: flush/fsync verification tests |
| #12 T20 wrong agent | Task assignment table confirms pester-writer for T20 |
| #13 Machine-wide mutex | Steps 1, 16: per-feature mutex name tests |
| #14 No pre-merge rebase | **Superseded by #19** — rebase now inside mutex |
| #15 AbortCleanup mergeState | Step 18: mergeState reset test |
| #16 AnyTaskInTierSucceeded | Step 12: exactly-1-succeeds boundary test |
| #17 Warden during merging | Step 6: warden-active-during-merge test; Step 20: E2E warden-during-merge test |
| #18 Idempotency token dupes | Step 3: dedup write test; Step 4: dedup on resume test; Step 20: E2E crash-resume dedup |
| #19 Rebase TOCTOU gap | Step 16: rebase-inside-mutex test; no-TOCTOU-window test; rebase-conflict-inside-mutex test |
| #20 Orphaned resources | Step 22: Complete-TaskFailure for all 7 failure paths; Step 12: calls cleanup after failure; Step 20: E2E resource cleanup test |
| #21 Abort cleanup ordering | Step 18: merge-abort-before-worktree-removal test; cleanup sequence order test; Step 20: E2E abort ordering test |
| #22 Playwright fallback | Step 23: full Playwright detection + fallback tests; Step 14: E2E category uses detection; Step 20: E2E Playwright fallback test |
| #23 T4->T21 dependency | T21 added as explicit dependency of T4; DAG validated |
| #24 mergeState invariant | Step 18: post-cleanup invariant test; Step 20: E2E post-abort mergeState consistency |
| #25 Truncated log line | Step 3: truncated final line parsing tests; Step 4: resume with truncated log test |
| #26 Interlocked across runspaces | Step 12: ConcurrentDictionary-based counter; concurrent increment test from parallel runspaces |
| #27 Fixture generating state | Step 4: 2 additional resume fixture combinations (generating state); total 6 combinations |
| #28 Resume working-tree verification | Step 4: MERGE_HEAD, REBASE_HEAD, orphaned worktree detection + cleanup on resume; Step 20: E2E dirty-git-state resume test |
| #29 ConcurrentDictionary read-modify-write not atomic | Step 12: `AddOrUpdate()` with atomic increment factory; high-contention test with artificial delay; static analysis test rejects naive pattern |
| #30 pipeline.log appends not atomic | Step 3: single `StreamWriter.WriteLine()` + `Flush()` per entry; `FileShare.Read` on open; mid-write crash resilience test |
| #31 Two mutexes no acquisition order, no AbandonedMutexException handling | Steps 1, 16: `AbandonedMutexException` caught and handled at both sites; strict pipeline-lock-first ordering documented and tested; known two-process TLC limitation documented in Step 16 |
| #32 Abort paths undertested | Step 18: parameterized abort test for all 8 in-flight phases; partial worktree leak test; double-Ctrl+C resumability test; AbortTriggered->AbortCleanup interleaving test; Step 20: E2E abort-at-each-phase and double-Ctrl+C-then-resume tests |

### Round 8 Hardening Traceability

| Item | Test(s) Verifying Resolution |
|------|------------------------------|
| #33 Dead "escalated" state | Step 12: runtime assertion no task reaches "escalated"; Step 20: E2E lifecycle assertion; Audit: flagged as unmapped |
| #34 SF fixture retry convergence | Steps 8, 9: crash->corrupt->regenerate->valid convergence tests; Step 10: fixture crash at stage boundary integration tests; Step 20: E2E fixture crash-regenerate-converge |
| #35 Fixture file atomicity (NTFS) | Steps 8, 9: concurrent reader contention during Move-Item triggers retry; NTFS limitation documented |
| #36 Merge-success-worktree-fail | Step 16: merge succeeds but worktree removal fails test; Step 22: residual cleanup test; Step 20: E2E test |
| #37 StreamWriter/Move-Item contention | Step 3: StreamWriter on pipeline.log does not interfere with concurrent fixture Move-Item |
| #38 Worktree removal race in abort | Step 18: serialized worktree removal test; already-removed worktree is no-op with warning |
| #39 Step 13 boundary tests | Step 13: 29:59/30:00/30:01 boundary tests; per-active-state timeout tests |
| #40 Step 15 negative depth | Step 15: multi-cycle-then-review-fail test; negative/invalid review response test |
| #41 Step 2 corruption test | Step 2: malformed, truncated, and extra-chars runId extraction tests |
| #42 Step 19 negative tests | Step 19: lock-not-held guard, abort-flag guard, non-terminal-tasks guard, idempotent completion tests |
| #43 T16 rebase timeout | Step 16: rebase 60s timeout test; configurable timeout test |
| #44 Partial-failure per tier | Step 4: mixed merged+failed+timed_out tier resume test; no duplicate commits after re-dispatch |
| #45 File overlap completeness | Tier dependency validation table updated with cross-tier sequential safety analysis |
| #46 T17 runtime integration test | Step 17: `[Tag('Integration')]` tests with local HttpListener server |

---

## Execution Tiers

### Tier 1: Foundational Types, Utilities, and Parsers

| Task ID | Step | Title |
|---------|------|-------|
| T1 | Step 1 | Pipeline Lock with Process Identity and Per-Feature Mutex |
| T2 | Step 2 | runId Generation |
| T8 | Step 8 | BDD Gherkin Parser |
| T9 | Step 9 | TLC Output Parser |
| T17 | Step 17 | Claude API Transient Failure Retry |
| T23 | Step 23 | Playwright Detection and Fallback |

### Tier 2: Core Infrastructure (depends on Tier 1)

| Task ID | Step | Title |
|---------|------|-------|
| T3 | Step 3 | Pipeline Log and Idempotency Token System |
| T5 | Step 5 | Always Use Worktrees |
| T14 | Step 14 | 300% Coverage Gate |
| T21 | Step 21 | Crash Budget Enforcement |

### Tier 3: Task Lifecycle (depends on Tier 2)

| Task ID | Step | Title |
|---------|------|-------|
| T4 | Step 4 | --resume Flag with Log Parsing |
| T6 | Step 6 | Warden Agent Restriction |
| T15 | Step 15 | Review Gate Failure Path |

### Tier 4: Orchestration Setup (depends on Tier 3)

| Task ID | Step | Title |
|---------|------|-------|
| T7 | Step 7 | Dependency Installation in Worktrees |
| T10 | Step 10 | Fixture Generation Integration into Pipeline Stages |
| T22 | Step 22 | Task Failure Cleanup |

### Tier 5: Parallel Dispatch and Stage Wiring (depends on Tier 4)

| Task ID | Step | Title |
|---------|------|-------|
| T11 | Step 11 | Implementation Writer Explicit Paths |
| T12 | Step 12 | Parallel Task Dispatch (Bug Fix) |

### Tier 6: Gates, Merge, and Timeout (depends on Tier 5)

| Task ID | Step | Title |
|---------|------|-------|
| T13 | Step 13 | Task Timeout Watchdog |
| T16 | Step 16 | Merge Serialization with Per-Feature Mutex and Rebase-Inside-Mutex |

### Tier 7: Abort Cleanup (depends on Tier 6)

| Task ID | Step | Title |
|---------|------|-------|
| T18 | Step 18 | Abort Cleanup Handler |

### Tier 8: Pipeline Completion (depends on Tier 7)

| Task ID | Step | Title |
|---------|------|-------|
| T19 | Step 19 | Pipeline Completion |

### Tier 9: End-to-End Validation (depends on Tier 8)

| Task ID | Step | Title |
|---------|------|-------|
| T20 | Step 20 | End-to-End Integration — Full Pipeline Lifecycle |

---

## Tier Dependency Validation

**No intra-tier dependency violations:**

| Task | Dependencies | Tier | Deps in prior tiers? |
|------|-------------|------|---------------------|
| T1 | None | 1 | Yes (no deps) |
| T2 | None | 1 | Yes (no deps) |
| T8 | None | 1 | Yes (no deps) |
| T9 | None | 1 | Yes (no deps) |
| T17 | None | 1 | Yes (no deps) |
| T23 | None | 1 | Yes (no deps) |
| T3 | T2 | 2 | Yes (T2 in Tier 1) |
| T5 | T2 | 2 | Yes (T2 in Tier 1) |
| T14 | T8, T9, T23 | 2 | Yes (T8, T9, T23 in Tier 1) |
| T21 | T1 | 2 | Yes (T1 in Tier 1) |
| T4 | T1, T2, T3, T21 | 3 | Yes (T1, T2 in Tier 1; T3, T21 in Tier 2) |
| T6 | T5 | 3 | Yes (T5 in Tier 2) |
| T15 | T14 | 3 | Yes (T14 in Tier 2) |
| T7 | T5, T6 | 4 | Yes (T5 in Tier 2; T6 in Tier 3) |
| T10 | T3, T4, T8, T9 | 4 | Yes (T3 in Tier 2; T4 in Tier 3; T8, T9 in Tier 1) |
| T22 | T5, T6 | 4 | Yes (T5 in Tier 2; T6 in Tier 3) |
| T11 | T10 | 5 | Yes (T10 in Tier 4) |
| T12 | T5, T6, T7, T22, T23 | 5 | Yes (T5 in Tier 2; T6 in Tier 3; T7, T22 in Tier 4; T23 in Tier 1) |
| T13 | T12 | 6 | Yes (T12 in Tier 5) |
| T16 | T5, T12, T15 | 6 | Yes (T5 in Tier 2; T12 in Tier 5; T15 in Tier 3) |
| T18 | T1, T3, T5, T16 | 7 | Yes (T1 in Tier 1; T3 in Tier 2; T5 in Tier 2; T16 in Tier 6) |
| T19 | T12, T16, T18 | 8 | Yes (T12 in Tier 5; T16 in Tier 6; T18 in Tier 7) |
| T20 | T1-T19, T21, T22, T23 | 9 | Yes (all in Tiers 1-8) |

**No file overlap within tiers:**

| Tier | Files | Overlap? |
|------|-------|----------|
| 1 | pipeline-lock.ps1, config.ps1, gherkin-parser.ps1, tlc-parser.ps1, invoke-claude.ps1, playwright-detect.ps1 | None |
| 2 | pipeline-state.ps1, workspace.ps1, coverage-gate.ps1, pipeline-lock.ps1+abort-cleanup.ps1 (T21) | pipeline-lock.ps1: T21 modifies in Tier 2, T1 modified in Tier 1 — no intra-tier overlap. No overlap. |
| 3 | vibe.ps1 (T4), warden-config.ps1 (T6), review-gate.ps1 (T15) | None |
| 4 | workspace.ps1 (T7), stages/*.ps1+vibe.ps1 (T10), task-cleanup.ps1 (T22) | vibe.ps1: only T10 touches it in this tier. workspace.ps1: only T7 touches it in this tier. No overlap. |
| 5 | stages/6-*.ps1 (T11), stages/8-coding.ps1+job-runner.ps1 (T12) | None |
| 6 | global-timeout.ps1 (T13), merge-queue.ps1 (T16) | None |
| 7 | vibe.ps1, abort-cleanup.ps1 (T18) | None (single task) |
| 8 | vibe.ps1, stages/8-coding.ps1 (T19) | None (single task) |
| 9 | pipeline-e2e.Tests.ps1 (T20) | None (single task) |

**Cross-tier sequential file safety** (addresses hardening #45):

| File | Tiers modifying | Sequential ordering guaranteed? |
|------|----------------|-------------------------------|
| `vibe.ps1` | T4 (Tier 3), T10 (Tier 4), T18 (Tier 7), T19 (Tier 8) | Yes — Tier 3 < Tier 4 < Tier 7 < Tier 8 |
| `pipeline-lock.ps1` | T1 (Tier 1), T21 (Tier 2) | Yes — Tier 1 < Tier 2 |
| `workspace.ps1` | T5 (Tier 2), T7 (Tier 4) | Yes — Tier 2 < Tier 4 |
| `stages/8-coding.ps1` | T12 (Tier 5), T19 (Tier 8) | Yes — Tier 5 < Tier 8 |
| `abort-cleanup.ps1` | T21 (Tier 2), T18 (Tier 7) | Yes — Tier 2 < Tier 7 |

---

## Task Assignment Table

| Task ID | Title | Tier | Code Writer | Test Writer | Dependencies | Rationale |
|---------|-------|------|-------------|-------------|--------------|-----------|
| T1 | Pipeline Lock with Process Identity and Per-Feature Mutex | 1 | powershell-writer | pester-writer | None | PowerShell utility with Pester unit tests |
| T2 | runId Generation | 1 | powershell-writer | pester-writer | None | Small utility function with unit tests |
| T8 | BDD Gherkin Parser | 1 | powershell-writer | pester-writer | None | Parser utility — comprehensive unit testing needed |
| T9 | TLC Output Parser | 1 | powershell-writer | pester-writer | None | Parser utility — comprehensive unit testing needed |
| T17 | Claude API Transient Failure Retry | 1 | powershell-writer | pester-writer | None | Invoke-Claude wrapper — unit test retry logic + optional integration tests |
| T23 | Playwright Detection and Fallback | 1 | powershell-writer | pester-writer | None | Detection utility — comprehensive unit tests for all BDD scenarios |
| T3 | Pipeline Log and Idempotency Token System | 2 | powershell-writer | pester-writer | T2 | State tracking module — unit + integration tests |
| T5 | Always Use Worktrees | 2 | powershell-writer | pester-writer | T2 | Workspace utility — unit tests with mocked git |
| T14 | 300% Coverage Gate | 2 | powershell-writer | pester-writer | T8, T9, T23 | Complex gate logic — extensive unit tests |
| T21 | Crash Budget Enforcement | 2 | powershell-writer | pester-writer | T1 | Lock metadata extension — unit tests |
| T4 | --resume Flag with Log Parsing | 3 | powershell-writer | pester-writer | T1, T2, T3, T21 | Entry point logic — integration tests |
| T6 | Warden Agent Restriction | 3 | powershell-writer | pester-writer | T5 | New utility — unit tests for scoping logic |
| T15 | Review Gate Failure Path | 3 | powershell-writer | pester-writer | T14 | Gate extension — unit tests |
| T7 | Dependency Installation in Worktrees | 4 | powershell-writer | pester-writer | T5, T6 | Small workspace extension — unit tests |
| T10 | Fixture Generation Integration | 4 | powershell-writer | pester-writer | T3, T4, T8, T9 | Stage wiring — integration tests |
| T22 | Task Failure Cleanup | 4 | powershell-writer | pester-writer | T5, T6 | Cleanup utility — unit tests for all 7 failure paths + residual cleanup |
| T11 | Implementation Writer Explicit Paths | 5 | powershell-writer | pester-writer | T10 | Stage 6 modification — unit tests |
| T12 | Parallel Task Dispatch (Bug Fix) | 5 | powershell-writer | pester-writer | T5, T6, T7, T22, T23 | Coding stage fix — concurrency tests + dead-state assertion |
| T13 | Task Timeout Watchdog | 6 | powershell-writer | pester-writer | T12 | Timeout extension — boundary + per-state tests |
| T16 | Merge Serialization with Per-Feature Mutex | 6 | powershell-writer | pester-writer | T5, T12, T15 | Concurrency-critical — mutex + rebase timeout + worktree-fail tests |
| T18 | Abort Cleanup Handler | 7 | powershell-writer | pester-writer | T1, T3, T5, T16 | Cleanup orchestration — serialized removal + race tests |
| T19 | Pipeline Completion | 8 | powershell-writer | pester-writer | T12, T16, T18 | Completion wiring — negative guard tests |
| T20 | End-to-End Integration | 9 | powershell-writer | pester-writer | T1-T19, T21, T22, T23 | Full lifecycle E2E — Pester integration tests |

> **Note on agent assignment:** All code writers are `powershell-writer` because the codebase is PowerShell (.ps1). The test writer is `pester-writer` for Pester unit/integration tests across all tiers. T20 uses `pester-writer` (not `playwright-writer`) because the E2E tests exercise the PowerShell pipeline, not browser UI (addresses objection #12).
