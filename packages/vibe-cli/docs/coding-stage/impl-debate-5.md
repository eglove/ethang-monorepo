# Implementation Debate Round 5: Coding Stage Orchestrator

**Date:** 2026-04-10
**Status:** CONSENSUS_REACHED
**Rounds:** 2
**Experts:** expert-tdd, expert-ddd, expert-tla, expert-edge-cases, expert-continuous-delivery

---

## Synthesis

### Result

**CONSENSUS REACHED** after 2 rounds. All 5 experts agreed on the implementation plan's strengths and identified 18 new objections in Round 1. No new objections were raised in Round 2, indicating full agreement on the findings.

### Agreed Recommendation

The implementation plan is exceptionally thorough — 60 prior objections resolved across 4 debate rounds, 39/39 TLA+ transitions covered, 12/12 safety invariants enforced, 3/3 liveness properties achievable. The plan is **not yet mergeable** due to 1 BLOCKING and 3 HIGH objections that must be resolved. The remaining MODERATE and LOW objections are tracked as fast-follow work.

**Must fix before merge:**

1. **BLOCKING #61 — Invoke-WithTimeout PID capture race.** `Start-ThreadJob` creates a runspace thread (not a process) with no `.ProcessId`. The child `claude` CLI process PID is only known inside the thread job. `Stop-ProcessTree` cannot function without a starting PID. **Fix:** Thread job must write the child PID to a `ConcurrentDictionary` keyed by task ID immediately after spawning `claude`. `Stop-ProcessTree` reads from this dictionary. If PID was never written, fall back to enumerating all `claude` processes and filtering by worktree working directory.

2. **HIGH #62 — Invoke-Claude env var race.** `Invoke-Claude` mutates process-global `$env:ANTHROPIC_BASE_URL` for proxy routing. Parallel thread jobs race on this variable. **Fix:** Pass base URL as a CLI argument to `claude` (or set env var once at process start and never mutate), rather than using set-restore pattern.

3. **HIGH #63 — Sync-FallbackLog atomicity.** The read-append-truncate cycle in `Sync-FallbackLog` is not atomic with respect to concurrent fallback writes. A thread job writing to `pipeline-fallback.log` between read and truncate loses that entry. **Fix:** Hold an exclusive file lock on the fallback file during the entire read-append-truncate cycle.

4. **HIGH #78 — ConcurrentQueue duplicate prevention TOCTOU.** `Add-MergeQueue` uses check-then-enqueue (two separate operations on `ConcurrentDictionary`). **Fix:** Use `ConcurrentDictionary.TryAdd()` as an atomic gate — enqueue only if `TryAdd` returns `$true`. Never use `ContainsKey` + `TryAdd` as two steps.

**Should fix (MODERATE, tracked as fast-follow):**

5. **#64** — No aggregate per-task wall-clock budget. `MaxTddCycles=100 x MaxFixRounds=100 = 10,000` possible `Invoke-Claude` calls per task. Add `$Config.TaskMaxWallClockSeconds`.
6. **#65** — Lock file stale-PID detection vulnerable to Windows PID reuse. Cross-check process name or command line.
7. **#67** — No test for partial/malformed JSON responses from Invoke-Claude (valid JSON, missing expected fields). Add one test per phase.
8. **#68** — No explicit test for cleanup blame-fork correctness (which agent dispatched based on failure source).
9. **#69** — `task-log.ps1` bundles 8 functions from 4+ unrelated concerns. Split into `task-log.ps1`, `job-runner.ps1`, `git-retry.ps1`, and `tests/helpers/claude-test-double.ps1`.
10. **#70** — Dispatch table key construction is stringly-typed with no validation. Add `Get-ResetDispatchKey` validator.
11. **#75** — Task completion log write atomicity assumed. Ensure completion marker write is the LAST action before returning `TaskResult`. Agent-writer re-dispatch should check for pre-existing output files.
12. **#76** — No maximum wall-clock time for entire pipeline. Add optional `$Config.PipelineTimeoutSeconds`.
13. **#77** — `Reset-WorktreeState` destroys all uncommitted work without warning. Log a warning if worktree has uncommitted changes before reset.

**Acknowledged (LOW, defer to future revision):**

14. **#66** — SkipEmptyTier overshoot guard / main loop interaction ambiguous.
15. **#71** — MergeResult missing `WorkspaceRemoved` field.
16. **#72** — `EnqueueForMerge` missing explicit `~escalationActive` guard in Step 12.
17. **#73** — `ZeroTierComplete` TLA+ sets `currentTier'=1` not documented in implementation.
18. **#74** — No explicit test for `SkipEmptyTier` precondition `currentTier > 0`.

### Endorsement Map

All 5 experts endorsed these design decisions:

| Decision | Endorsing Experts |
|----------|-------------------|
| Per-module counter resets with dispatch table (objection #16) | tdd, ddd, tla, edge-cases, cd |
| `$ErrorActionPreference = 'Stop'` injection (objection #46) | tdd, edge-cases, cd |
| Atomic lock file via `CreateNew` (objection #47) | tla, edge-cases, cd |
| Process tree kill with leaf-to-root ordering (objection #26) | tdd, edge-cases, cd |
| Output pollution guard with single-object validation (objection #51) | tdd, edge-cases |
| Escalation routing guard for `taskPhase=done` (objection #27) | ddd, tla, cd |
| `Reset-FinalCounters` including `finalVerifPhase = "running"` (objection #49) | ddd, tla |
| Atomic state snapshot pattern (objection #25) | ddd, tla |
| Typed result contracts at construction time (Step 3) | ddd, cd |
| Two-step final verification remediation (Step 13) | tla |
| Fencepost fix on GREEN retry counting (Step 9) | tdd |
| 2-consecutive-clean-pass requirement in Cleanup (Step 10) | tdd |
| Drain-loop merge processing (objection #48) | tla |
| `AbandonedMutexException` handling (objection #37) | edge-cases |
| Pre-mutation snapshot for `EscalationStop` (objection #36) | edge-cases, ddd |
| 28 integration scenarios in Step 16 | tla |
| TLA+ formal backing with coverage matrix | cd |
| 4 rounds of adversarial debate process | cd |

---

## Round 1 Transcript

### expert-tdd

**Position:** The plan is exceptionally thorough. TDD cycle mapping to TLA+ transitions is well-structured, fencepost fix on green retry counting is correct, boundary tests are properly placed.

**Reasoning:**
- RED/GREEN/Cleanup phases correctly mirror TLA+ transitions
- Boundary test pattern (check counter < max BEFORE dispatch) is correct
- `Invoke-ClaudeTestDouble` with sequential response injection is adequate for unit tests
- Per-module reset functions with dispatch table is cleaner than centralized reset
- 28 integration scenarios covering 39 transitions is strong

**Objections:**
- **#67 (MODERATE):** No test for partial/malformed JSON responses from Invoke-Claude. Steps 8-10 should include one test where response is structurally valid JSON but semantically incomplete.
- **#68 (MODERATE):** No explicit test for cleanup blame-fork correctness. A test should assert that given a specific failure source (test vs. lint vs. tsc), the correct agent prompt is constructed.

**Endorsements:** Fencepost fix on GREEN retries, per-module counter resets, 2-consecutive-clean-pass requirement, output pollution test (Scenario 28), short-circuit sequencing in Cleanup.

---

### expert-ddd

**Position:** Domain modeling is strong. Bounded contexts are well-defined, aggregate boundaries correctly separate per-task state from pipeline-level and merge-level concerns. Two moderate concerns: task-log.ps1 is an "infrastructure grab bag" conflating unrelated responsibilities, and dispatch table keys lack validation.

**Reasoning:**
- Five bounded contexts correctly identified (execution, merge, escalation, validation, shared kernel)
- Result contract types model the four key exchange points well
- Dispatch table preserves encapsulation without leaking counter semantics
- Atomic state snapshot pattern is correct for PowerShell's threading model
- Pre-mutation snapshot for EscalationStop shows deep understanding of temporal state dependencies

**Objections:**
- **#69 (MODERATE):** task-log.ps1 violates SRP — 8 functions from 4+ unrelated concerns. Recommend splitting into task-log.ps1, job-runner.ps1, git-retry.ps1, and tests/helpers/claude-test-double.ps1.
- **#70 (MODERATE):** Dispatch table key construction is stringly-typed with no compile-time or construction-time safety. Recommend `Get-ResetDispatchKey` validator.
- **#71 (LOW):** MergeResult missing `WorkspaceRemoved` field.

**Endorsements:** Counter reset dispatch table, decision-only escalation, atomic state snapshot, result contract constructors, routing guard for taskPhase=done, five-tier dependency structure, Reset-FinalCounters including phase transition.

---

### expert-tla

**Position:** Exceptionally thorough coverage of TLA+ specification. All 39 transitions, 12 safety invariants, and 3 liveness properties have corresponding implementation steps with explicit test coverage. Three low-severity gaps identified.

**Reasoning:**
- Verified all 5 requested items (StartNextTier preconditions, EnqueueForMerge guards, escalation routing, final verification two-step, EscalationKeepGoing counter resets) — all COMPLETE
- SkipEmptyTier compression (multiple skips in one loop iteration) is a valid refinement
- WorkspaceCreationFailure correctly does NOT advance currentTier
- All 4 EscalationKeepGoing disjuncts match dispatch table entries exactly
- Safety invariants enforced structurally (S1 by loop, S2 by guards, S3 by dispatch, etc.)
- Liveness properties achievable via timeouts + retry bounds + SF(EscalationStop)

**Objections:**
- **#72 (LOW):** `EnqueueForMerge` missing explicit `~escalationActive` guard in Step 12 — structurally correct via orchestrator but implicit.
- **#73 (LOW):** `ZeroTierComplete` TLA+ sets `currentTier'=1` not documented in implementation.
- **#74 (LOW):** No explicit test for `SkipEmptyTier` precondition `currentTier > 0`.

**Endorsements:** Escalation dispatch table, two-step final verification remediation, atomic state snapshot, drain-loop merge processing, Reset-FinalCounters with phase transition, EscalationKeepGoing cleanup counter reset, process tree kill, 28 integration scenarios.

---

### expert-edge-cases

**Position:** Well-structured but has real failure modes under adversarial conditions. Identified one blocking issue (PID capture race) and several high-severity concurrency issues.

**Reasoning:**
- **PID Capture Race (#61 BLOCKING):** `Start-ThreadJob` creates a runspace thread with no `.ProcessId`. The claude CLI PID is only known inside the thread job. `Stop-ProcessTree` has no starting PID.
- **Env Var Race (#62 HIGH):** `Invoke-Claude` mutates process-global `$env:ANTHROPIC_BASE_URL` under parallel thread jobs.
- **Sync-FallbackLog (#63 HIGH):** Read-append-truncate not atomic with concurrent writes.
- **ConcurrentQueue TOCTOU (#78 HIGH):** Check-then-enqueue defeats concurrent collection purpose.
- **Per-task budget (#64 MODERATE):** 100 x 100 = 10,000 possible Invoke-Claude calls.
- **PID reuse (#65 MODERATE):** Stale lock PID detection vulnerable on Windows.
- **SkipEmptyTier (#66 LOW):** Loop/increment interaction ambiguous.

**Endorsements:** Atomic lock file via CreateNew, ErrorActionPreference injection, output pollution guard, phase-module-owned counter resets, git merge --abort cycle, AbandonedMutexException handling, pre-mutation snapshot, Stop-ProcessTree leaf-to-root order.

---

### expert-continuous-delivery

**Position:** Remarkably thorough plan. Primary concern is operational complexity — 8 new utility files, concurrent mutexes, process trees, queues, drain-loops, all in PowerShell which is not a natural fit for concurrent systems programming.

**Reasoning:**
- Tier-based execution model is sound for dependency DAG execution
- Resume model is thorough but fragile (depends on parsing task logs for string markers)
- Merge queue drain-loop is critical fix but interaction with escalation queue needs careful sequencing
- Pipeline lock mechanism is correct (atomic CreateNew)
- Three-tier logging is solid but missing dispatch decision logging

**Objections:**
- **#75 (MODERATE):** Task completion log atomicity assumed — agent-writer re-dispatch could produce duplicate content.
- **#76 (MODERATE):** No maximum wall-clock time for entire pipeline.
- **#77 (MODERATE):** Reset-WorktreeState destroys manual user changes without warning.

**Endorsements:** TLA+ formal backing, 4 rounds adversarial debate, ErrorActionPreference injection, atomic lock file, process tree kill, escalation routing guard, typed result contracts, fallback log design.

---

## Round 2 Transcript

### expert-tdd (Round 2)

**Position:** No new objections. Test suite has meaningful gaps mapped to BLOCKING/HIGH objections from edge-cases expert. Strongly endorses #61, #62, #63, #78. Notes that absence of tests for concurrency paths is exactly the failure mode TDD prevents. Disagrees with #71, #72-74 as merge-blocking.

### expert-ddd (Round 2)

**Position:** No new objections. Upgrades assessment to "needs targeted fixes before merge." Strongly endorses #61, #78, #62. Notes process lifecycle should be modeled as first-class domain concept. Downgrades own #71 to LOW on reflection. Summary: fix #61, #78, #62 before merge.

### expert-tla (Round 2)

**Position:** No new objections. Notes #61 creates a TLA+ liveness violation (Cancel action has no target when `pid = NULL`). Endorses #78 as fixable at implementation level without spec change. Notes #62, #63, #65-#70 operate below TLA+ abstraction boundary. Suggests two spec extensions: timeout/PID liveness and log atomicity.

### expert-edge-cases (Round 2)

**Position:** No new objections. Maintains #61 as blocking. Endorses severity upgrade of #76 to HIGH (compounded by #61). Downgraded #69 to LOW (design preference).

### expert-continuous-delivery (Round 2)

**Position:** No new objections. Not ready to merge without #61 fix. Strongly endorses #61, #62, #63, #78. Notes #63 and #75 are related but distinct (fallback data loss vs primary log corruption). Considers #64, #65 as non-blocking. Summary: fix #61 (blocking), address #62, #63, #78 (high), remaining as fast-follow.

---

## Expert Final Positions

| Expert | Merge Verdict | Must-Fix Items |
|--------|---------------|----------------|
| expert-tdd | Not mergeable without fixes | #61, #62, #63, #78 |
| expert-ddd | Needs targeted fixes | #61, #78, #62 |
| expert-tla | Two spec extensions needed | #61 (liveness gap), #78 |
| expert-edge-cases | Not safe without PID fix | #61, #62, #63 |
| expert-continuous-delivery | Not mergeable | #61, #62, #63, #78 |

**Universal agreement:** #61 (BLOCKING) must be fixed. All 5 experts endorse.

**4/5 agreement:** #62, #63, #78 (HIGH) should be fixed before merge. One expert (tla) considers #62, #63 below TLA+ abstraction boundary but does not object.

---

## Metadata

- **Date:** 2026-04-10
- **Topic:** Implementation plan review for Coding Stage Orchestrator (Stage 8) against TLA+ specification
- **Experts selected:** expert-tdd, expert-ddd, expert-tla, expert-edge-cases, expert-continuous-delivery
- **Round count:** 2
- **Result:** CONSENSUS_REACHED (no new objections in Round 2)
- **New objections raised:** 18 (1 BLOCKING, 3 HIGH, 9 MODERATE, 5 LOW)
- **Prior objections (from 4 earlier debate rounds):** 60
- **Total objections across all debates:** 78
