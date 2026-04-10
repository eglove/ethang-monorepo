# Implementation Plan Debate — Coding Stage Orchestrator

**Date:** 2026-04-10
**Rounds:** 2
**Result:** PARTIAL_CONSENSUS
**Experts:** expert-tla, expert-tdd, expert-edge-cases, expert-continuous-delivery, expert-ddd, expert-bdd

---

## Synthesis

### Agreed Recommendation

The implementation plan achieves approximately 96% TLA+ coverage and is exceptionally thorough after 3 prior debate rounds resolving 45 objections. It is **approved for implementation** contingent on resolving the 3 BLOCKING issues and incorporating the HIGH amendments below. The tier structure, dependency graph, counter reset ownership, atomic state snapshot pattern, and escalation routing are all well-designed and endorsed by all experts.

### BLOCKING Issues (must resolve before implementation)

| # | Issue | Source | Fix |
|---|-------|--------|-----|
| B1 | `$ErrorActionPreference` not propagated to thread jobs — non-terminating errors silently swallowed, corrupting TLA+ state transitions | expert-edge-cases (endorsed by expert-tla, expert-tdd, expert-cd, expert-ddd) | Step 2 `Invoke-WithTimeout`: inject `$ErrorActionPreference = 'Stop'` as first line of every thread job script block. Step 15 tests: add case where non-terminating error occurs inside thread job, assert escalated not swallowed. |
| B2 | Lock file creation not atomic — `Test-Path` + `Set-Content` has TOCTOU race allowing concurrent pipeline runs | expert-edge-cases (endorsed by expert-cd) | Step 5: replace with `[System.IO.File]::Open($path, [System.IO.FileMode]::CreateNew)` which atomically fails if file exists on NTFS. |
| B3 | Merge queue not re-checked after escalation recovery re-dispatch — recovered task completes and enqueues but merge loop already exited, violating L1 (EventuallyTerminates) | expert-edge-cases (upgraded to BLOCKING in R2, endorsed by expert-tla) | Step 15: merge processing must loop until queue is empty AND `mergeInProgress = 0` AND all tasks in tier are done/escalated/skipped. Re-enter merge loop after any re-dispatch completes. |

### HIGH Amendments (should resolve before implementation)

| # | Issue | Source | Fix |
|---|-------|--------|-----|
| H1 | `EscalationKeepGoingFinal` — `Reset-FinalCounters` doesn't reset `finalVerifPhase` to `"running"` | expert-tla (endorsed by expert-tdd, expert-ddd, expert-cd) | Step 13: `Reset-FinalCounters` must also set `finalVerifPhase = "running"`. All reset functions should be complete "prepare for retry" operations, not just counter zeroing. |
| H2 | `Invoke-ClaudeTestDouble` signature mismatch with real `Invoke-Claude` | expert-edge-cases, expert-tdd | Step 2: align test double parameters with real `Invoke-Claude` signature (`$SystemPromptFile`, `$AppendSystemPromptFile`, `$Prompt`, `$JsonSchema`, `$AddDir`, `$Interactive`). |
| H3 | Pipeline output pollution in thread jobs — uncaptured expressions corrupt `TaskResult` return values | expert-edge-cases (endorsed by expert-tdd, expert-ddd) | Step 15: validate thread job output is exactly one `TaskResult`-shaped hashtable. Step 2 `Invoke-WithTimeout`: add anti-corruption filter on `Receive-Job` output. |
| H4 | Windows file locking not addressed — virus scanners, indexers hold mandatory locks causing git failures | expert-edge-cases | Step 6 and Step 12: add retry-with-backoff for OS-level file lock errors (distinct from git merge conflicts). Document as known Windows platform limitation. |
| H5 | Worktree dirty state after hard crash / timeout kill — partial files from killed claude CLI | expert-edge-cases | Step 14 `Resolve-PipelineState`: check `git status --porcelain` in each worktree and discard uncommitted changes before re-dispatch. |
| H6 | `git worktree prune` never called — stale entries from prior crashes | expert-edge-cases | Step 14 or Step 6: call `git worktree prune` during `Resolve-PipelineState` or before workspace creation. |
| H7 | Missing integration scenario for `RedRetryAlreadyImplemented` end-to-end path | expert-tdd, expert-bdd (independent confirmation) | Step 16: add Scenario 23 — T1 tests pass in RED, verdict `already_implemented`, cleanup passes, pipeline completes without GREEN. |
| H8 | Missing integration scenario for validation failure halting pipeline | expert-bdd | Step 16: add Scenario 24 — validation fails with intra-tier dependency, pipeline halts, no workspaces created. |
| H9 | Truncated `pipeline.log` and lost `pipeline-fallback.log` entries on hard crash | expert-edge-cases | Step 14: log parsing must use try/catch per line, skip unparseable entries. `Resolve-PipelineState` must also scan `pipeline-fallback.log`. |
| H10 | Missing infrastructure failure test for merge-resolver in Step 12 | expert-tdd | Step 12 tests: add mock merge-resolver `Invoke-Claude` returns exit 127, assert task escalated, `mergeRetries` unchanged. |
| H11 | Infra-failure recovery for phases `red`/`green`/`agent_call` must still restore `taskStatus` to `"running"` | expert-tla | Step 15: dispatch table must handle infra-failure phases explicitly — no counter reset but still restore status and clear escalation flag. |
| H12 | T4 schema contradiction — `testWriter` should be `null` per elicitor convention for agent-writer tasks | expert-cd (endorsed by expert-edge-cases) | JSON plan: change T4 `testWriter` to `null`. Orchestrator treats T4 as agent-writer task (no TDD cycle). |

### MODERATE Amendments (address during implementation)

| # | Issue | Source |
|---|-------|--------|
| M1 | `task-log.ps1` should split into logging, job-runner, and test helpers | expert-ddd |
| M2 | Escalation routing guard (`taskPhase=done` reroute) belongs in orchestrator, not `Read-Escalation` | expert-ddd |
| M3 | `config.ps1` accumulating unrelated concerns — extract `Invoke-VerifyCommand` | expert-ddd |
| M4 | Orchestrator should decompose into `Invoke-TierExecution`, `Invoke-EscalationLoop`, outer `Invoke-CodingStage` | expert-ddd |
| M5 | `Invoke-ClaudeTestDouble` should live in `tests/helpers/` not production code | expert-ddd, expert-tdd |
| M6 | T12 and T13 missing explicit T4 dependency in declarations (safe due to tier gate but graph incomplete) | expert-cd |
| M7 | T13 missing dependency on T10 (cleanup pattern similarity) | expert-cd |
| M8 | Missing MAX-1 fencepost tests for Steps 8, 10, 12, 13 (Step 9 has them) | expert-tdd |
| M9 | `Start-ThreadJob` argument passing mechanism (`$using:` vs `-ArgumentList`) unspecified | expert-edge-cases |
| M10 | Module imports in thread jobs must use absolute paths (not relative) | expert-edge-cases |
| M11 | No disk space check before workspace creation | expert-edge-cases |
| M12 | L1 strong fairness assumption (user eventually picks Stop) should be documented | expert-tla |
| M13 | Missing integration scenario for cascading merge conflicts (3-task chain) | expert-bdd |
| M14 | Missing integration scenario for Invoke-Claude response-format failure at integration level | expert-bdd |
| M15 | Missing integration scenario for pipeline resume/idempotency after crash | expert-bdd |
| M16 | Stage 6/7 modification tests scope should be explicitly stated as excluded | expert-bdd |
| M17 | `FinalVerifExhausted` from "remediating" phase — counter check ordering after increment | expert-tla |
| M18 | Anti-corruption layer at thread job boundary for `Receive-Job` output validation | expert-ddd |

---

## Endorsement Map

| Point | Endorsed By |
|-------|-------------|
| Counter reset ownership (objection #16 — dispatch table pattern) | ALL 6 experts |
| Pre-mutation snapshot for EscalationStop (objection #36) | ALL 6 experts |
| Atomic state snapshot pattern (objection #25) | expert-tla, expert-edge-cases, expert-ddd, expert-tdd |
| GREEN fencepost fix (increment on failure, not retry) | expert-tla, expert-tdd |
| 5-tier layered architecture | expert-cd, expert-ddd, expert-bdd |
| Result contracts as Shared Kernel (Step 3) | expert-tdd, expert-ddd |
| Verify command injection prevention (objection #32) | expert-edge-cases |
| Per-task timeout configurability (objection #30) | expert-edge-cases, expert-cd |
| Escalation routing guard for done-phase tasks (objection #27) | expert-tla, expert-tdd, expert-edge-cases |
| Bounded skip loop for empty tiers (objection #23) | expert-edge-cases, expert-cd |
| 22 integration scenarios as strong baseline (needing additions) | expert-tdd, expert-bdd, expert-cd |
| T14 promotion from Tier 4 to Tier 2 | expert-cd |

---

## Per-Expert Final Positions

### expert-tla (Round 2)
**Assessment:** 96% TLA+ coverage (revised from 97%).
**Maintained:** H1 (finalVerifPhase reset), M12 (SF_vars documentation), M17 (counter ordering).
**Dropped:** Merge recovery thread dispatch concern (misreading), SingleTaskTierComplete ownership (adequately specified).
**New:** H11 (infra-failure recovery status restoration).
**Endorses:** B1 ($ErrorActionPreference), M8 (fencepost tests), H7 (RedRetryAlreadyImplemented scenario).

### expert-tdd (Round 2)
**Assessment:** Non-blocking with required amendments.
**Maintained:** H10 (merge-resolver infra failure test) downgraded to MODERATE.
**Dropped:** 6 of 8 Round 1 objections (IsThreadPoolThread wrapper, fencepost tests, RedRetryAlreadyImplemented, Reset-MergeCounters, Step 15 mocking, abandoned mutex, GREEN counter after success).
**New:** H2 (test double signature), H3/M18 (output pollution), M5 (test double placement).
**Endorses:** B1 ($ErrorActionPreference), H1 (finalVerifPhase), H8 (validation scenario), H12 (T4 schema).

### expert-edge-cases (Round 2)
**Assessment:** 3 BLOCKING, 7 HIGH issues remain.
**Maintained:** B1, B2, H4, H5, H6, H9 all maintained.
**Upgraded:** B3 (merge queue re-check) from HIGH to BLOCKING.
**Withdrawn:** Process tree TOCTOU (acceptable with focused module).
**New:** M10 (absolute module paths in thread jobs).
**Endorses:** expert-tla liveness analysis, expert-ddd module split, expert-cd schema finding.

### expert-continuous-delivery (Round 2)
**Assessment:** Approve with conditions.
**Maintained:** All 3 Round 1 objections (H12 T4 schema, M6 T12/T13 deps, M7 T13-T10 dep).
**New:** None.
**Endorses:** B1, B2, H1, M8 (fencepost), H7 (RedRetryAlreadyImplemented).

### expert-ddd (Round 2)
**Assessment:** Approve with reservations.
**Maintained:** All 4 Round 1 objections (M1 module split, M2 routing guard, M3 config cohesion, M4 orchestrator decomposition).
**New:** M18 (anti-corruption layer for output pollution).
**Endorses:** H1 (finalVerifPhase — bounded context ownership gap), B1 ($ErrorActionPreference — infrastructure boundary concern).

### expert-bdd (Round 2)
**Assessment:** Maintain with endorsements.
**Maintained:** All 5 Round 1 objections (H8 validation scenario, H7 RedRetryAlreadyImplemented, M13 cascading merge, M14 response-format, M16 Stage 6/7 scope).
**New:** M15 (pipeline resume scenario).
**Endorses:** M8 (fencepost), B1/B2 (observable consequences), expert-ddd orchestrator decomposition.

---

## Round 1 Transcript

### expert-tla — Round 1
**Position:** GAPS FOUND — ~97% TLA+ coverage
**Reasoning:** Verified all 39 transitions, 12 safety invariants, 3 liveness properties. Found 5 gaps.
**Objections:**
- HIGH: `EscalationKeepGoingFinal` phase reset not in `Reset-FinalCounters`
- MODERATE: `EscalationKeepGoingMerge` recovery should be main-thread
- MODERATE: `FinalVerifExhausted` counter check ordering from "remediating" phase
- MODERATE: `SingleTaskTierComplete` ownership underspecified
- MODERATE: L1 strong fairness assumption undocumented
**Endorsements:** Fencepost fix, two-step final verification, cleanup counter resets, objection resolution discipline, thread-safety architecture, MergeSerial invariant, integration test coverage, pre-mutation snapshot.

### expert-tdd — Round 1
**Position:** CONDITIONAL ENDORSEMENT
**Reasoning:** Tests are thorough but have gaps in fencepost coverage, integration scenarios, and test infrastructure.
**Objections:**
- HIGH: IsThreadPoolThread static property mock needs wrapper
- HIGH: Missing MAX-1 fencepost tests for Steps 8, 10, 12, 13
- HIGH: Missing RedRetryAlreadyImplemented integration scenario
- HIGH: Missing infra failure test for merge-resolver
- MODERATE: Reset-MergeCounters taskPhase preservation
- MODERATE: Step 15 mocking strategy unspecified
- MODERATE: No abandoned mutex integration scenario
- MODERATE: GREEN counter after success not asserted
**Endorsements:** TLA+ coverage matrix, objection resolution, result contract pattern, New-PipelineMutex wrapper, boundary checks, fencepost documentation, Scenario 19.

### expert-edge-cases — Round 1
**Position:** BLOCKING concerns — 2 BLOCKING, 9 HIGH
**Reasoning:** Thorough analysis of race conditions, Windows-specific pitfalls, crash recovery, PowerShell thread job behavior.
**Objections:**
- BLOCKING: $ErrorActionPreference not propagated to thread jobs
- BLOCKING: Lock file TOCTOU race
- HIGH: Merge queue not re-checked after recovery
- HIGH: Windows file locking
- HIGH: Worktree dirty state after crash/timeout
- HIGH: Pipeline output pollution
- HIGH: git worktree prune never called
- HIGH: Truncated pipeline.log on crash
- HIGH: pipeline-fallback.log entries lost on crash
- MODERATE: Process tree TOCTOU, argument passing, disk space, test double mismatch
**Endorsements:** 3-round debate quality, TLA+ coverage matrix, atomic state, escalation routing guard, AbandonedMutexException handling, verify command injection prevention, per-task timeouts, pre-mutation snapshot, bounded skip loop, result contracts.

### expert-continuous-delivery — Round 1
**Position:** APPROVE WITH MODERATE CONCERNS
**Reasoning:** Tier structure correctly enforces S1 (TiersSequential). Dependencies mostly correct. T14 promotion to Tier 2 is good.
**Objections:**
- MODERATE: T4 schema contradiction (testWriter should be null)
- MODERATE: T13 missing T10 dependency
- MODERATE: T12/T13 missing T4 dependency
**Endorsements:** T14 promotion, debate resolution quality, TLA+ model checking, 22 integration scenarios, file-overlap advisory, tier separation of concerns.

### expert-ddd — Round 1
**Position:** APPROVE WITH RESERVATIONS
**Reasoning:** Strong bounded context thinking overall. Counter reset ownership is exemplary. Some cohesion concerns.
**Objections:**
- MODERATE: task-log.ps1 should split (logging, process management, test infra)
- MODERATE: Escalation routing guard belongs in orchestrator
- MODERATE: config.ps1 accumulating concerns
- MODERATE: Orchestrator should decompose
**Endorsements:** Counter reset ownership, result contracts as Shared Kernel, atomic state, pre-mutation snapshot, tier structure, debate process quality.

### expert-bdd — Round 1
**Position:** CONDITIONAL ENDORSEMENT
**Reasoning:** 22 scenarios cover 12 of 13 key behaviors. Validation failure path missing.
**Objections:**
- HIGH: No validation failure integration scenario
- HIGH: No RedRetryAlreadyImplemented e2e scenario
- MODERATE: No cascading merge conflict scenario
- MODERATE: No Invoke-Claude response-format failure scenario
- MODERATE: Stage 6/7 test scope clarification
**Endorsements:** Debate-driven coverage, boundary/fencepost testing, TLA+ audit, atomic state testing, escalation matrix coverage, per-module reset pattern.

---

## Round 2 Transcript

### expert-tla — Round 2
**Assessment:** 96% coverage. B1 ($ErrorActionPreference) creates TLA+ state machine divergence. B3 (merge re-check) does not violate L1 at spec level but implementation needs explicit drain loop.
**Dropped:** Merge recovery dispatch concern, SingleTaskTierComplete ownership.
**New:** Infra-failure recovery status restoration for phases without counters.
**Endorses:** B1, M8 (fencepost), H7 (RedRetryAlreadyImplemented).

### expert-tdd — Round 2
**Assessment:** Non-blocking with amendments. Dropped 6 of 8 R1 objections.
**Key findings:** Test double signature mismatch is HIGH. Output pollution needs filtering. $ErrorActionPreference causes test/production divergence.
**New amendments:** A1 ($ErrorActionPreference injection), A2 (test double alignment), A3 (test double placement), A4 (merge-resolver infra test), A5 (finalVerifPhase reset), A6 (output filtering).

### expert-edge-cases — Round 2
**Assessment:** 3 BLOCKING maintained/upgraded. Upgraded E3 to BLOCKING based on expert-tla liveness confirmation.
**Withdrawn:** Process tree TOCTOU.
**New:** Schema contradiction merge behavior concern, module import absolute paths.

### expert-continuous-delivery — Round 2
**Assessment:** Approve with conditions. All 3 R1 objections maintained. No new objections.
**Endorses:** B1, B2, H1, M8, H7.

### expert-ddd — Round 2
**Assessment:** All R1 objections maintained. Reset-FinalCounters gap reveals deeper bounded context issue — all reset functions should be complete "prepare for retry" operations.
**New:** Anti-corruption layer for pipeline output at thread job boundaries.

### expert-bdd — Round 2
**Assessment:** All R1 objections maintained, RedRetryAlreadyImplemented strengthened by independent TDD confirmation.
**New:** Pipeline resume/idempotency scenario, T4 schema impact on BDD.

---

## Metadata

- **Date:** 2026-04-10
- **Experts selected:** expert-tla, expert-tdd, expert-edge-cases, expert-continuous-delivery, expert-ddd, expert-bdd
- **Round count:** 2
- **Result:** PARTIAL_CONSENSUS
- **Unresolved:** 3 BLOCKING, 12 HIGH, 18 MODERATE amendments
