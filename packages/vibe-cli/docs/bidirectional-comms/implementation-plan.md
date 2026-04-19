# Bidirectional-Comms Implementation Plan

## Source Artifacts

| Artifact | Path |
|---|---|
| TLA+ Specification | `packages/vibe-cli/docs/bidirectional-comms/tla/BidirectionalComms.tla` |
| BDD Feature File | `packages/vibe-cli/docs/bidirectional-comms/bdd.feature` |
| BDD Fixture | `packages/vibe-cli/docs/bidirectional-comms/bdd-fixture.json` |
| Target Design | `packages/vibe-cli/docs/bidirectional-comms/target.json` |
| Elicitor Notes | `packages/vibe-cli/docs/bidirectional-comms/elicitor.md` |
| Unified Debate Notes | `packages/vibe-cli/docs/bidirectional-comms/unified-debate.md` |
| Existing invoke-claude | `packages/vibe-cli/utils/invoke-claude.ps1` |
| Existing invoke-parallel | `packages/vibe-cli/utils/invoke-parallel.ps1` |
| Existing unified-debate-loop | `packages/vibe-cli/utils/unified-debate-loop.ps1` |
| Existing debate-loop | `packages/vibe-cli/utils/debate-loop.ps1` |
| Existing invoke-verify | `packages/vibe-cli/utils/invoke-verify.ps1` |
| Existing job-runner | `packages/vibe-cli/utils/job-runner.ps1` |
| Existing pipeline-log | `packages/vibe-cli/utils/pipeline-log.ps1` |
| Stage 2 | `packages/vibe-cli/stages/2-parallel-writers.ps1` |
| Stage 3 | `packages/vibe-cli/stages/3-unified-debate.ps1` |
| Stage 4 | `packages/vibe-cli/stages/4-post-debate.ps1` |
| Stage 5 | `packages/vibe-cli/stages/5-implementation-writer.ps1` |
| Stage 6 | `packages/vibe-cli/stages/6-implementation-debate.ps1` |
| Stage 7 | `packages/vibe-cli/stages/7-coding.ps1` |
| Main entry point | `packages/vibe-cli/vibe.ps1` |
| Existing test double | `packages/vibe-cli/tests/helpers/claude-test-double.Tests.ps1` |

---

## Debate Objections Resolved in This Revision

### Round 1 — Implementation Debate (OBJ-IMP-*)

| # | Objection | Resolution |
|---|---|---|
| OBJ-IMP-1 | AbandonedMutexException on subprocess crash — VibeBus-PipelineLog and VibeBus-Commit-\<Worktree\> can enter Abandoned state | Steps 10 and 22 now specify catch handler and invariant reconstruction |
| OBJ-IMP-2 | AV/indexer handle contention on SQLite WAL/SHM files — Step 24 checkpoint retry policy undefined | Step 24 now defines exponential-backoff retry with 30s budget and PASSIVE checkpoint pragma |
| OBJ-IMP-3 | MAX_PATH limit on .vibe/events/\<evt_id\>.json under deeply nested worktrees | Step 5 now requires long-path registry check and SHA-256 segment truncation fallback |
| OBJ-IMP-4 | Wall-clock jump during checkpoint can invert checkpointed_at ordering | Step 5 adds checkpointed_at_mono (Stopwatch ticks) column; Step 24 writes it alongside wall-clock column |
| OBJ-IMP-5 | Property-test wall-clock dependency in Step 33 | Steps 24, 26, 33 now specify virtual-time injection via -GetTimestamp/-GetUtcNow scriptblock parameters |
| OBJ-IMP-6 | Role schema not versioned — future rename silently corrupts in-flight sessions | Step 5 adds role_schema_version column; Step 8 requires SchemaVersion export; Step 28 validates version on resume |
| OBJ-IMP-7 | Test double contract verification — Invoke-MockedClaude and Invoke-MockedGit can drift from reality | New Step 34 establishes an out-of-CI contract-test tier with schema parity enforcement |

### Round 2 — Expert Debate (OBJ-TLA-* and OBJ-EC-*)

| # | Objection | Resolution |
|---|---|---|
| OBJ-TLA-1 | Spawn two-phase action collapsed with RouterRespawnsAgent in Step 16, losing spawnedAtEvt epoch distinction required for HandlerAdapterCompletes epoch guard | Step 16 explicitly scoped to initial spawn only; spawnedAtEvt set to nextEvtId at DeliverBootstrap time. Step 24 covers RouterRespawnsAgent advancement. Step 17 adds explicit epoch-rejection test. |
| OBJ-TLA-2 | ConsensusRoundStartMonotone (v12 invariant 21) has no property test covering full consensus state machine under concurrent agent sends | Step 29 adds concurrent-sends consensus epoch test; Step 33 adds property test: 1000 random objection+rollback sequences assert consensusRoundStart ≤ nextEvtId at every state. |
| OBJ-TLA-3 | Liveness property L1 (\<\>BusResumed) heartbeat-fairness untested; Step 26 tests presence not fairness under stuck agent | Step 26 adds fairness test: virtual-clock advance with agentStatus=checkpointing → heartbeat emits [ALARM] → bus halts with agent_crash. BusResumed fires only after all agents respawned. |
| OBJ-TLA-4 | Consensus agent_state stability (v12 invariant 17 — CandidateHasEventInLog) not mapped to any PowerShell test | Step 23 adds explicit assertion: consensusState='candidate' iff event_log contains row with type='consensus_candidate' and evt_id ≥ consensusRoundStart. Step 33 adds property test. |
| OBJ-EC-1 | ground_truth cap overflow write path undefined in Step 19 (no shed/error semantics documented) | Step 19 now specifies: when >8192 bytes, write NO partial ground truth, return $null, Send-BusEvent halts with failureCategory='mechanical_error' including computed byte count. |
| OBJ-EC-2 | Orphaned contract fixtures can contaminate production SQLite on resume; Step 34 fixture-isolation boundary missing | Step 34 now requires contract tests to use $env:TEMP\vibe-contract-tests-\<guid\>\vibe-bus.db, never default path. Cleanup at teardown. |
| OBJ-EC-3 | role_schema_version mismatch silently degrades; must hard-halt with operator-visible error | Step 28 changed from "warn + discard checkpoint" to HARD HALT with [ERROR] message including stored/current versions and recovery instructions. |
| OBJ-EC-4 | WAL-retry behavior on second SQLite failure during 12.8s window unspecified (restart sequence vs halt) | Step 24 now specifies: each SQLite operation has its OWN independent 8-attempt retry budget; retry state does not carry over between operations. |
| OBJ-EC-5 | OBJ-LOW-2 commit-drain interacts with AgentCrashes(a) during rollback drain; Step 29 does not specify mid-drain crash behavior | Steps 22 and 29 now specify: drain loop polls busStatus on each iteration; if busStatus ≠ 'running', abort drain and propagate halt. AgentCrashes clears lock; RouterAbortsStaleRollback clears rollbackRequested. |
| OBJ-EC-6 | AbandonedMutexException recovery path defined for commit mutex but not PipelineLog mutex under heartbeat-crash scenario | Step 10 adds heartbeat-specific abandonment path: catch, log to stderr, discard partial banner write; next tick starts fresh. |
| OBJ-EC-7 | SQLite journal_mode=DELETE downgrade by out-of-band tool not detected; must PRAGMA assert WAL at every connect | Step 5 adds: every SQLite connection asserts PRAGMA journal_mode=WAL; if returned value ≠ 'wal', halt with [ALARM] and operator-visible error. |
| OBJ-EC-8 | MAX_PATH short-name path alias flip during service restart not handled by OBJ-IMP-3 | Step 5 adds: all paths normalized to full long-form via [System.IO.Path]::GetFullPath() before length check; short-name 8.3 aliases expanded. |
| OBJ-EC-9 | Monotonic timestamp counter resets on -Resume; cross-session monotonicity recovery unspecified | Step 5 adds session_mono_epoch column (INTEGER) set at process startup. checkpointed_at_mono is intra-session only. Cross-session ordering uses checkpointed_at (wall-clock). Step 28 documents this boundary. |
| OBJ-EC-10 | Virtual time injection and real-time producer boundary undefined in Step 24 | Step 24 explicitly limits -GetUtcNow to checkpoint.ps1 internal logic only; NOT propagated to Write-PipelineLog, heartbeat.ps1, or other modules. |
| OBJ-EC-11 | role_schema_version v1→v2 upgrade path lacks test in Step 28 | Step 28 adds: explicit test where CurrentSchemaVersion=2 and stored session has role_schema_version=1 → HARD HALT with correct error message. |
| OBJ-EC-12 | Test double contract verification is one-directional (doubles vs contract, not contract vs production) | Step 34 unit tests now verify BOTH directions: (1) $OutputSchema field missing from real binary → 'missing contract field'; (2) real binary field missing from $OutputSchema → 'missing contract field'. |
| OBJ-EC-13 | Heartbeat + commit deadlock possible if both hold PipelineLog; lock-hierarchy doc missing | Step 10 now defines formal lock hierarchy: VibeBus-Commit-\<w\> (outer) > VibeBus-PipelineLog (inner). Never acquire inner while holding outer. Commit serializer logs only AFTER releasing commit mutex. |
| OBJ-EC-14 | No operational metric for time-in-WAL-retry; operators cannot see budget saturation | Step 24 now emits [WARN] on first retry (attempt 2/8), [INFO] with elapsed time on attempts 3-7, [ALARM] on exhaustion. |
| OBJ-EC-15 | Graceful shutdown on SIGINT order undefined (drain/checkpoint/mutex-release/epoch-persist) | Step 25 now defines explicit SIGINT shutdown sequence: halt-flag → drain-wait → agent-sigterm → commit-mutex-drain → SQLite-final-write → pipeline-lock-release → exit. |
| OBJ-EC-16 | /rollback rejection during active consensus has no user-visible error spec | Step 29: Invoke-BusRequestRollback guards consensusState ≠ 'candidate'; rejects with [ERROR] message. |
| OBJ-EC-17 | Snapshot CRLF line-ending handling across Windows/non-Windows restore | Step 29: snapshot metadata records git core.autocrlf at capture time; restore emits [WARN] on mismatch. |
| OBJ-EC-18 | WAL-retry budget during bus-paused intervals (checkpoint) includes-or-excludes paused time unclear | Step 24 specifies: 12.8s budget = wall-clock elapsed from first attempt, including time in 'checkpointing' state. No pause exclusion. |

### Round 3 — Cross-Endorsed Objections (OBJ-R3-*)

| # | Objection | Cross-endorsed By | Resolution |
|---|---|---|---|
| OBJ-R3-1 | Non-atomic AppendEvent — evt_id allocation, SQLite INSERT, and routedIds update split across three operations; process kill between any two leaves inconsistent state | tla, tdd, bdd, edge-cases, cd, performance, ddd | Step 15 wraps all three in a single `BEGIN IMMEDIATE` SQLite transaction; startup recovery rolls back any uncommitted transaction; kill-recovery test added |
| OBJ-R3-2 | event_log has no indices beyond PK; no compaction/retention policy; ground-truth composition, resume replay, and consensus lookups degrade to full scans as log grows | tdd, edge-cases, cd, performance, ddd | Step 2 adds four query indices and a configurable compaction policy (archive rows beyond `retain_events=10000` to `event_log_archive`); compaction never touches rows referenced by `committedDoneEvts` or `consensusRoundStart` |
| OBJ-R3-3 | TLA+ spec never wired into CI — no TLC gate and no tla-version-parity gate; spec can drift from implementation undetected | tla, tdd, edge-cases, cd, performance | Step 32 adds `tools/run-tlc.ps1` (TLC gate) and `tools/check-tla-version.ps1` (version-parity gate); both gates fail CI on violation |
| OBJ-R3-4 | No rollback playbook for Step 30 megacommit plus Step 31 deletion — git revert would conflict with dropped schema tables and deleted utilities; no forward/back migration pair | tla, tdd, edge-cases, cd, ddd | Step 30 split into 6 incremental per-stage commits (each independently revertable); Step 4 adds `migration-down.ps1` and `vibe schema-rollback` command; `migration-playbook.md` documents full forward/back procedure |
| OBJ-R3-5 | Step 1 schema migration has no user-side deployment story — existing mid-pipeline SQLite with old tables is silently dropped; error messages reference non-existent `vibe schema-migrate` and `vibe reset` commands | tdd, edge-cases, cd | Step 4 creates the real `vibe schema-migrate`, `vibe schema-rollback`, `vibe schema-backup`, and `vibe reset` subcommands; migration runner detects old-table presence and refuses to proceed without explicit user confirmation; commands must exist before any reference to them |
| OBJ-R3-6 | Step 19 (now Step 25) collapses all 13 halt triggers into one data-driven test line despite each having distinct preconditions and triggers | tla, bdd, edge-cases, ddd | Step 25 now specifies 13 individually named test functions — one per halt-triggering TLA+ action — each with explicit preconditions, trigger mechanism, exit-code assertion, and failureCategory assertion |
| OBJ-R3-7 | Step 1 is not TDD-sized — bundles 13 columns, append-only trigger, partial unique index, path/WAL PRAGMA, and session_mono_epoch into one unit; impossible to author test-first | tdd, bdd, edge-cases, cd, performance, ddd | Old Step 1 decomposed into Steps 2 (event_log table + trigger + indices), 3 (agent_sessions table + identity index), 4 (migration runner + deployment story), and 5 (Open-BusDatabase infrastructure); each step is independently testable |
| OBJ-R3-8 | No AgentSession aggregate root and no ConsensusRound aggregate — per-agent state scattered across SQLite rows and in-memory maps mutated by loose functions; Invariants 9, 17, 21 enforced globally rather than at aggregate boundaries | tla, tdd, bdd, edge-cases, ddd | New Step 11 defines the AgentSession aggregate root (encapsulates all per-agent state; all mutations via named methods); new Step 12 defines the ConsensusRound aggregate (encapsulates all consensus state; invariants 17 and 21 enforced at aggregate boundary) |
| OBJ-R3-9 | Invariant 9 GroundTruthPrecedesAgentMessage under-tested in Step 13 (now Step 19) — plan tests protocol ordering but not the epoch-scoped invariant on the respawn path where groundTruthDelivered resets | tla, tdd, edge-cases, ddd | Step 19 adds an explicit respawn-path test: after RouterRespawnsAgent resets groundTruthDelivered[a]=FALSE, verify no event other than ground_truth reaches the agent; verify new ground_truth epoch is strictly greater than old |
| OBJ-R3-10 | Stdout-reader ConcurrentQueue has no backpressure cap — unbounded memory growth if orchestrator stalls; no numeric queue-depth threshold for alarm escalation | tdd, edge-cases, cd, performance | Step 16 specifies `$MaxQueueDepth=1000` (configurable via `-MaxQueueDepth`); queue uses `[System.Collections.Concurrent.BlockingCollection]` with BoundedCapacity; heartbeat triggers [ALARM] after 3 consecutive ticks above 90% of capacity |
| OBJ-R3-11 | AgentCrash detection mechanism not wired to main orchestrator — reader-runspace-exit does not fire an engine event; commit_lock_holder can stay non-NULL indefinitely on unintentional crash | tla, tdd, bdd, edge-cases, cd | Step 16 adds: when stdout-reader runspace exits unexpectedly, fire PowerShell engine event `VibeBus.AgentCrashed`; main orchestrator registers `Register-EngineEvent` handler that calls `Invoke-BusAgentCrashHandler` → `AgentCrashes(a)` → clears commitLockHolder → `Invoke-BusHalt('mechanical_error','agent_crash')` |
| OBJ-R3-12 | Checkpoint-context-overrun race — ground-truth injection between result event and next turn can push past context limit before checkpoint_response arrives; 120s heartbeat alarm is the only catch and cannot distinguish API context-limit from process crash | tdd, bdd, edge-cases, performance | Step 24 adds pre-delivery context-limit pre-check: before injecting ground_truth, compute `estimated_ground_truth_bytes`; if `total_tokens + estimated >= context_limit * 0.95`, initiate checkpoint first; heartbeat crash distinguisher added to separate context-limit stall from process crash |
| OBJ-R3-13 | Step 29 (now Step 34) contract-test circularity — MOCK real-binary responses test the mock's output format, not the real binary's; no schedule cadence for out-of-CI @contract runs | expert-tdd HIGH, expert-bdd partial-endorse, expert-cd endorse | Step 34 adds `contract-runner.ps1 --snapshot` which captures real binary output to checked-in snapshot files; unit tests use snapshots (not fabricated mocks); @contract CI job triggered weekly AND on PR touching bus/ or test doubles |
| OBJ-R3-14 | No CI pipeline workflow YAML committed in the plan — Step 26 (now Step 32) describes gates in prose without the file that enforces them; no perf-baseline regression gate semantics; no canary/smoke tier | expert-cd HIGH × 3 | Step 32 now creates the actual workflow YAML (`.github/workflows/vibe-cli.yml`) with all gates defined as jobs; perf-baseline regression gate specified; canary/smoke tier added between unit/integration and full e2e |
| OBJ-R3-15 | Ubiquitous language collision and event-type enum conflation — TLA+ variable names leak as PowerShell identifiers; 16 event types mix domain, protocol, and command-reply semantics; no bounded context integration contract | expert-ddd HIGH + R2 escalation to REJECT | New Step 1 creates `bounded-context-glossary.psd1` (TLA+ → PowerShell name mapping), `event-context-map.psd1` (4 bounded contexts for 16 event types), `bounded-context-contracts.psd1` (integration contracts between contexts), and a CI lint check that fails on any TLA+ variable name used as a PowerShell identifier |

### Round 4 — Continuous Delivery, TDD, DDD, and BDD Objections

| # | Objection | Endorsed By | Resolution |
|---|---|---|---|
| OBJ-CD-4 | Migration-down data-loss safety — forward/back migration pair lacks pre-rollback snapshot to `.vibe/backups/<timestamp>/`, refusal protocol for unmigrated-row drops, and post-rollback integrity check | 5 experts (BLOCKING) | Step 4 adds pre-rollback snapshot to `.vibe/backups/<timestamp>/`, explicit row-count refusal before DROP, and `Invoke-MigrationIntegrityCheck` post-rollback |
| OBJ-CD-6 | Staged rollout absent — Stages 2-7 migrate lockstep with no per-stage feature flag (`VIBE_STAGE_N_BIDIR=1`), no 24h soak, no PR-per-stage discipline; blast radius of Stage-4 regression is all downstream stages | expert-cd (BLOCKING) | Step 30 adds `feature-flags.psd1`, per-stage env-var guards, 24h soak documentation, and PR-per-stage discipline; `vibe.ps1` checks flags before choosing code path |
| OBJ-CD-1 / OBJ-TDD-5 | Red-commit ledger / test-before-code CI gate absent — plan mandates TDD in prose but CI does not mechanize RED→GREEN ordering via git-history validation | cd, tdd | Step 32 adds `check-red-commit-order.ps1` (git log timestamp comparison: test file commit must precede implementation file commit) and `red-green-order` CI job in `vibe-cli.yml` |
| OBJ-CD-7 | Deployment telemetry gap — no structured emit for `mutex.acquired/released/orphaned-recovered`, `agent.spawned/drained` with timing; production incidents unforensicable | cd | Steps 10, 16, 22 add `[TELEMETRY]` structured log lines (key=value format) for all mutex lifecycle events and agent lifecycle events with elapsed_ms |
| OBJ-CD-8 | Schema-hash pinning absent — SQLite schema changes across stages without `schema-hash.txt` per migration version can silently drift dev/CI/prod | cd | Step 4 adds `generate-schema-hash.ps1` that writes a SHA-256 of all DDL statements to `schema-hash.txt` after migration; Step 5 adds hash validation at every `Open-BusDatabase` call; mismatch halts with `[ALARM]` |
| OBJ-TLA-R3-a | Fairness-obligation-matrix.md required listing 5 liveness properties × fair-scheduled actions × test IDs; one-line 'all 5 covered' claim insufficient | tla | Step 33 creates `fairness-obligation-matrix.md` with full 5×N matrix: each liveness property mapped to its TLA+ WF/SF constraint, the fair-scheduled action(s), and the test ID(s) that exercise the fairness path |
| OBJ-TLA-R3-b | Stuttering-equivalence proof note required — without it, impl is 'consistent with a trace' not 'refines the spec' | tla | Step 33 creates `stuttering-equivalence.md` documenting the refinement mapping (ImplState → SpecState), stutter-step classification for retries/logging/mutex-waits, and fairness-preservation argument for each WF/SF obligation |
| OBJ-DDD-1/4 | CommitSerializer, Stage, HandlerAdapter, WriteSession not promoted to first-class aggregates/services; Stage lacks version/etag + revert-idempotency invariant | ddd | Step 17 promotes HandlerAdapter to `IHandlerAdapterService` interface; Step 22 promotes CommitSerializer to aggregate with `WriteSession` value object; Step 30 adds `Stage` domain object with `Version`, `Etag`, and revert-idempotency invariant |
| OBJ-DDD-2 | Bounded-context map (AgentLifecycle, Consensus, Verification, ProtocolError) still drawn as component diagram, not context map | ddd | Step 1 adds `bounded-context-map.md` — a formal context map with upstream/downstream relationships, ACL boundaries, and conformist/customer-supplier patterns; replaces component-diagram description |
| OBJ-DDD-5 | ProtocolError conflates DomainError (aggregate-owned) with IntegrationError (HandlerAdapter ACL-owned); should be split | ddd | Step 17 defines `IntegrationProtocolError` raised at the HandlerAdapter ACL boundary; Step 20 defines `DomainProtocolError` raised by aggregate invariant violations; both surface as `protocol_error` events externally but are handled differently internally |
| OBJ-BDD-R3-1 | bdd.feature deliverable unanchored — no step owns authoring; require assignment to Steps 4/25/28/29 with exact operator-message text | bdd | Steps 4, 25, 28, 29 each list `bdd.feature` as a `(modify)` file with exact Gherkin `Then` text matching the operator-visible output |
| OBJ-BDD-R3-2 | @tla-action-N / @invariant-M traceability tags missing from Scenarios | bdd | Step 1 defines the tag schema (`@tla-action-N` where N is action number 1-40, `@invariant-M` where M is invariant number 1-22); Steps 25, 28, 29 apply tags to each BDD scenario |
| OBJ-TDD-R3-1 | Load-generator script path (`tests/bus/properties/event-sequence-generator.ps1`) not explicit; seeded determinism not asserted via unit test | tdd | Step 33 explicitly creates `packages/vibe-cli/tests/bus/properties/event-sequence-generator.ps1`; adds unit test verifying same seed produces identical event sequence |
| OBJ-TDD-R3-2 | Step 25 halt tests lack paired negative-branch 'does not halt' assertions for bidirectional `MechanicalHaltHasCategory` coverage | tdd | Step 25 adds 13 negative-branch test functions (one per halt trigger): each verifies the bus does NOT halt when the precondition guard is unmet |

### Round 5 — Cross-Expert Objections (OBJ-R5-*)

| # | Objection | Cross-endorsed By | Resolution |
|---|---|---|---|
| OBJ-R5-1 | Rollback seam lacks coordinator, single transactional boundary, and observable-behavior test coverage | 6/7 experts | Step 29 adds `RollbackCoordinator` domain service (`rollback-coordinator.ps1`); all SQLite mutations in `Invoke-BusRollbackCoordination` wrapped in a single `BEGIN IMMEDIATE`; adds observable-behavior test asserting `BusLifecycleState='halted'`, `HaltReason='user_rollback'`, `FailureCategory=NULL` visible via `Get-BusStatus` immediately after rollback |
| OBJ-R5-2 | `AppendEvent` performance baseline unset — 20% regression gate is a no-op | performance, cd | Step 15 adds `append_event_p99_ms: 5` and `append_event_p999_ms: 20` to `performance-baselines.json`; Step 15 test adds a 1000-call `Invoke-BusAppendEvent` latency benchmark measured with `[Diagnostics.Stopwatch]` |
| OBJ-R5-3 | Red-green gate bypassable when test and impl land on same commit | tdd, cd | Step 32 updates `check-red-commit-order.ps1`: if test file and implementation file share the same first-commit SHA, emit `[FAIL] RED-GREEN violation: <test> and <impl> share first commit <sha>. TDD requires the test file committed in a strictly prior commit.` |
| OBJ-R5-4 | `AgentSession` synchronously orchestrates cross-aggregate crash cleanup — needs `CrashCoordinationDomainService` | ddd, tla, edge-cases | Step 22 adds `crash-coordination-service.ps1`; `Invoke-AgentSessionCrash` no longer calls into CommitSerializer or HandlerAdapter; cross-aggregate crash coordination routes through `Invoke-BusCrashCoordination(agentName, sessionId, deathEpoch)` which calls AgentSession, CommitSerializer, and HandlerAdapter in defined sequence |
| OBJ-R5-5 | `WriteSession` mislabeled as value object despite having identity + lifecycle + mutable state | ddd, tla | Step 22 reclassifies `WriteSession` as an **Entity**: `SessionId` provides identity, lifecycle transitions via named methods (`Start-WriteSession`, `Complete-WriteSession`, `Fail-WriteSession`, `Recover-WriteSession`), and `$ActiveSessions` map holds mutable per-entity state |
| OBJ-R5-6 | Engine-event queue drain ordering during SIGINT not specified — `HaltReason='user_interrupt'` can be overwritten by `'mechanical_error'` | edge-cases, tdd, performance, cd | Steps 25 and 16 add a **halt-once guard** (`[Interlocked]::CompareExchange($HaltLatch, 1, 0)` — first caller wins, subsequent `Invoke-BusHalt` calls are no-ops); SIGINT sequence adds step 0: drain engine-event queue via `Unregister-Event 'VibeBus.*'` before any agent teardown |
| OBJ-R5-7 | Partial snapshot file after crash satisfies `RollbackRequiresSnapshot` invariant with corrupted blob | edge-cases | Step 29 stores SHA-256 of the snapshot bundle at write time in `bus_state` row `snapshot_hash_<w>`; `Invoke-BusRollbackCoordination` verifies hash before execution; mismatch: clear `snapshotExists[w]=FALSE`, emit `[ALARM]`, reject rollback with no halt |
| OBJ-R5-8 | BDD feature file has 0 `@tla-action`/`@invariant` tags across 335 scenarios; 12 TLA+ identifiers leak into Given/When/Then | bdd, ddd, tdd | Step 1 adds `check-bdd-tags.ps1` (fails if any Scenario lacks `@tla-action-N` or `@invariant-M` tag; also scans step text for TLA+ identifier leaks); Step 32 adds `bdd-tag-lint` CI job |
| OBJ-R5-9 | Negative halt tests lack virtual-clock injection, causing CI flakiness and false positives | tdd, edge-cases | Step 25 wraps all timing-sensitive negative tests (especially `Test-UserInterrupts-NegBranch`) with `-GetTimestamp` virtual clock; removes any real `Start-Sleep`; real elapsed < 50ms per negative test |
| OBJ-R5-10 | e2e-smoke canary runs only mocked binaries — canarying the mock not the release | cd | Step 32 splits `e2e-smoke` into `e2e-smoke-mock` (mocked binaries, fast, existing behavior) and `e2e-smoke-contract` (uses `contract-runner.ps1`-served real-binary snapshots from Step 34); `e2e-full` depends on both sub-tiers |
| OBJ-R5-11 | `BlockingCollection.Add` producer stall propagates to heartbeat channel, triggering false-positive `[ALARM]` emissions | performance | Step 16 introduces `[int64]$QueueDepthCounter` (Interlocked-managed); producer calls `[Interlocked]::Increment` before `Add`, consumer calls `[Interlocked]::Decrement` after `Take`; heartbeat reads `[Interlocked]::Read($QueueDepthCounter)` — non-blocking, never stalls |
| OBJ-R5-12 | Refinement mapping in `stuttering-equivalence.md` unprovable for `RouterExecutesRollback` without Step 29 single-transaction boundary | tla | Step 29 wraps all SQLite mutations in `Invoke-BusRollbackCoordination` in a single `BEGIN IMMEDIATE`; Step 33 adds note in `stuttering-equivalence.md` that the transaction boundary makes the `RouterExecutesRollback` mapping provable |
| OBJ-R5-13 | `wal_autocheckpoint` pragma not pinned to 0, introducing nondeterministic rollback drain latency | edge-cases | Step 5 changes `PRAGMA wal_autocheckpoint=0` (disable auto-checkpointing); adds `Invoke-BusWalCheckpoint` function that runs `PRAGMA wal_checkpoint(TRUNCATE)`, called at clean shutdown and at startup before first read |
| OBJ-R5-14 | Pre-commit hook can invoke `AppendEvent` while holding `VibeBus-Commit-<w>`, violating lock hierarchy | edge-cases, tla, ddd, tdd, performance | Step 22 sets `$env:VIBE_BUS_COMMIT_IN_PROGRESS='1'` before git commit and unsets after; Step 15's `Invoke-BusAppendEvent` checks this env var at entry and raises `[ERROR]` then calls `Invoke-BusHalt` if set; Step 10 adds lock-hierarchy rule 3 banning all bus calls from pre-commit hooks |

### Round 6 — Unified Expert Objections (OBJ-R6-*)

| # | Objection | Severity | Resolution |
|---|---|---|---|
| OBJ-R6-1 | No refinement mapping exists from TLA+ actions to PowerShell primitives — TLC gate is cosmetic without it | BLOCKER (TLA) | Step 33 adds `refinement-mapping.md` listing every TLA+ action with its PowerShell function(s), atomicity mechanism (SQLite `BEGIN IMMEDIATE`, `[Interlocked]` CAS, OS rename-with-fsync), and stutter-step classification; halt-latch `[Interlocked]::CompareExchange` maps to TLA+'s implicit within-action atomicity |
| OBJ-R6-2 | Step 29 rollback transaction scope contradicts stuttering-equivalence.md | BLOCKER (TLA) | New Step 37 `WorkingTreeCoordinator` runs git stash **outside** all locks; `Invoke-BusTakeSnapshot` sequence is now: (1) stutter step — `Invoke-GitStash(w)` via WorkingTreeCoordinator; (2) BEGIN IMMEDIATE — store `snapshotExists[w]=TRUE` + hash atomically; (3) COMMIT. The TLA+ `RouterTakesSnapshot` action maps only to steps (2)-(3); (1) is a proven stutter step. `stuttering-equivalence.md` updated to reflect this. |
| OBJ-R6-3 | ~8 of ~40 TLA+ actions have no identifiable implementation step | BLOCKER (TLA) | New "TLA+ Simplification Notes" section in the coverage audit confirms all 40 actions are mapped; explains halt-latch observer (impl idempotency mechanism, not a TLA+ action), snapshot rotation (BDD LRU eviction not modeled in spec — sound simplification at `\|Worktrees\|=1`), and BusLifecycle start/stop (all mapped through existing steps, now consolidated in Step 36) |
| OBJ-R6-4 | 4 safety invariants have no corresponding test assertion: `InvCommitOrdering`, `InvNoLostWrites under rollback`, `InvHaltLatchMonotonic`, `InvSnapshotIntegrity` | BLOCKER (TLA) | Step 22 adds `InvCommitOrdering` test; Step 25 adds `InvHaltLatchMonotonic` test (via Step 36 BusLifecycle); Step 29 adds `InvNoLostWrites` and `InvSnapshotIntegrity` tests. All 4 added to Implementation Invariants coverage table. |
| OBJ-R6-5 | BusLifecycle aggregate missing — start/stop/restart transitions scattered across Steps 3, 11, 28 with no owner | BLOCKER (DDD) | New Step 36 `BusLifecycle Aggregate` (`bus-lifecycle.ps1`) owns all `busStatus`/`haltReason`/`failureCategory`/`pipeline_lock` mutations; Step 25 delegates to it; Step 28 calls `Invoke-BusResume()`/`Invoke-BusResumed()` on the aggregate |
| OBJ-R6-6 | WorkingTreeCoordinator aggregate missing — git stash/checkout/restore have no transactional boundary | BLOCKER (DDD) | New Step 37 `WorkingTreeCoordinator` (`working-tree-coordinator.ps1`) encapsulates all git operations; Step 22 uses it for `Invoke-GitAdd`/`Invoke-GitCommit`; Step 29 uses it for `Invoke-GitStash`/`Invoke-GitStashPop`/`Invoke-GitRestore` |
| OBJ-R6-7 | git stash inside writer-lock is a compound-failure trap | BLOCKER (EDGE) | Step 37 WorkingTreeCoordinator: git stash runs **before** any mutex acquisition; Step 29 refactored so `Invoke-BusTakeSnapshot` calls `Invoke-GitStash` via WorkingTreeCoordinator lock-free, then acquires no mutex during the file operation; commit lock is never held during git stash |
| OBJ-R6-8 | git-stash-in-writer-lock will violate p99 ≤5ms target by 2-3 orders of magnitude on repos with >10k tracked files | BLOCKER (PERF) | Step 37 adds performance test verifying `VibeBus-Commit-<w>` is NOT held during `Invoke-GitStash` (mock records mutex acquisition timeline; assert 0 mutex acquisitions during stash window); Step 33 adds per-operation performance budget table: git stash ≤2000ms, git commit ≤500ms, WAL checkpoint ≤100ms, AppendEvent ≤5ms p99 |
| OBJ-R6-9 | 335 BDD scenarios have zero @tla-action-N or @invariant-M traceability tags | BLOCKER (BDD) | New Step 38 `bdd.feature Audit, Tagging & Observable-Behavior Refactor` tags ALL 335 scenarios; the `bdd-tag-lint` CI job (Step 32) now depends on Step 38 completing first |
| OBJ-R6-10 | 263 TLA+ identifier leaks in bdd.feature make scenarios unreadable and brittle | BLOCKER (BDD) | Step 38 replaces all 263 occurrences using the `bounded-context-glossary.psd1` mapping; `check-bdd-tags.ps1` reports zero leaks after Step 38 |
| OBJ-R6-11 | No schema-hash pin in CI — schema drift between event_log versions can ship silently | BLOCKER (CD) | Step 32 adds `schema-hash-parity` CI job running `check-schema-hash-parity.ps1`: reads DDL from current migration, computes SHA-256, compares to committed `schema-hash.txt`; fails on any mismatch; also adds `tools/check-schema-hash-parity.ps1` |
| OBJ-R6-12 | Refinement mapping for halt-latch observer pattern is ambiguous — CompareExchange semantics vs. TLA+ atomic read-modify-write not reconciled | MAJOR (TLA) | `refinement-mapping.md` (Step 33) documents: halt-latch `[Interlocked]::CompareExchange` is a stutter step — it does not advance any TLA+ state variable; TLA+'s within-action atomicity means only one action fires per state; the impl's idempotency guard mirrors this without adding new states |
| OBJ-R6-13 | Snapshot rotation in Step 29 has no TLA+ action; spec assumes snapshots are atomic but impl uses rename-with-fsync | MAJOR (TLA) | `refinement-mapping.md`: `RouterTakesSnapshot(w)` maps to `Invoke-BusTakeSnapshot`: the rename-with-fsync OS operation is a stutter step (does not change any spec variable); the `BEGIN IMMEDIATE` updating `snapshotExists[w]` is the spec-mapped atomic step |
| OBJ-R6-14 | Red-phase assertions described by intent not specific invariant violation | MAJOR (TDD) | Steps 22, 25, 29 updated: each test description now specifies the exact invariant violated (e.g., "assert `CommitIdempotency` violation: verify `pendingDoneEvt[w] ∈ committedDoneEvts` is TRUE before reset"); Step 32 adds guidance in `check-red-commit-order.ps1` documentation |
| OBJ-R6-15 | Virtual clock injection pattern not consistently applied across all 35 steps | MAJOR (TDD) | Steps 22 and 26 explicitly mandate `-GetTimestamp` parameter on all timing-sensitive functions; Step 38 AST check verifies no `Get-Date`, `[DateTime]::UtcNow`, or `Start-Sleep` in test files (only virtual clock calls); CI gate added in Step 32 (`no-real-time-in-tests` job) |
| OBJ-R6-16 | check-red-commit-order.ps1 enforces commit ordering but does not enforce test-must-actually-fail | MAJOR (TDD) | Step 32 adds `test-fail-assertion.ps1`: on each PR, for every `*.Tests.ps1` whose implementation counterpart was added in the same PR, run the tests against a branch **without** the implementation file and assert at least one test reports `[Fail]`; CI gate `test-red-phase` enforces this |
| OBJ-R6-17 | CommitSerializer and RollbackCoordinator have overlapping responsibilities | MAJOR (DDD) | Explicit boundary documented in both Step 22 and Step 29: CommitSerializer owns (a) acquire VibeBus-Commit-<w>, (b) call WorkingTreeCoordinator.Invoke-GitCommit, (c) update event_log status, (d) release lock; RollbackCoordinator owns (a) drain check, (b) snapshot integrity, (c) single-transaction SQLite state reset, (d) ConsensusRound epoch advance, (e) halt; no shared SQLite mutations |
| OBJ-R6-18 | WriteSession Entity lifecycle not documented — creation, transitions, and disposal scattered | MAJOR (DDD) | Step 22 adds `WriteSession` lifecycle state diagram as ASCII art in description: `Created → Acquired(mutex held) → Committed/Failed → Released`; all transitions through named methods only; lifecycle documented in `write-session.ps1` header comment |
| OBJ-R6-19 | Named mutex starvation under high contention — VibeBus-Commit-<w> can livelock if W workers all retry synchronously | MAJOR (EDGE) | Step 22 `Start-WriteSession` adds randomized exponential backoff on mutex acquisition: initial wait 10ms, factor 2×, jitter ±5ms (seeded from thread ID), max 8 attempts before halt with `failureCategory='sqlite_error'` and `[ALARM]`; Step 33 adds mutex-starvation test under 8 concurrent workers |
| OBJ-R6-20 | Snapshot-during-rollback race condition not covered — rollback mid-snapshot leaves orphan .snapshot.tmp files | MAJOR (EDGE) | Step 29 `Invoke-BusTakeSnapshot` writes to `.snapshot.tmp` first, then atomically renames to `.snapshot`; Step 37 `WorkingTreeCoordinator` performs this rename-with-fsync; Step 5 `Open-BusDatabase` startup sequence scans for and deletes all `.snapshot.tmp` files (orphan cleanup); Step 29 adds snapshot-during-rollback race test |
| OBJ-R6-21 | SIGTERM during Tier 5 BusLifecycle shutdown not tested — WAL checkpoint may be skipped on CI timeout | MAJOR (EDGE) | Step 25 adds explicit `Test-SigtermDuringShutdown`: mock SIGTERM fired during `Invoke-BusWalCheckpoint`; verify checkpoint receives `CancellationToken` cancellation; verify `[WARN] WAL checkpoint interrupted by SIGTERM: <N> frames not checkpointed` emitted; verify process exits cleanly |
| OBJ-R6-22 | p99 ≤5ms baseline has no per-step budget — Step 29 snapshot rotation could consume the entire budget | MAJOR (PERF) | Step 33 `performance-baselines.json` updated with per-operation budgets: `append_event_p99_ms: 5`, `git_stash_p99_ms: 2000`, `git_commit_p99_ms: 500`, `wal_checkpoint_p99_ms: 100`, `telemetry_emit_overhead_ms: 0.5`, `mutex_acquire_p99_ms: 50`; `check-perf-baselines.ps1` validates each |
| OBJ-R6-23 | BEGIN IMMEDIATE transaction latency under 8+ concurrent writers not characterized | MAJOR (PERF) | Step 33 adds `Test-SqliteWalContention`: run 8, 16, 32 concurrent `Invoke-BusAppendEvent` callers via runspace pool; measure p99 latency at each concurrency level; emit results as `[INFO]` structured log; assert latency does not exceed `append_event_p99_ms * concurrency_level * 2` (linear degradation budget) |
| OBJ-R6-24 | evt_id allocator uses Interlocked.Increment but persistence is batched — crash recovery may produce gaps that invariant assertions flag as corruption | MAJOR (PERF) | Step 33 adds `Test-EvtIdGapsAreExpected`: simulate crash between `[Interlocked]::Increment` and `INSERT`; on restart verify `EvtIdMonotone` still holds (`∀ e ∈ eventLog : e.evt_id < nextEvtId`); assert gaps in evt_id sequence do NOT trigger halt; adds note to `refinement-mapping.md` |
| OBJ-R6-25 | BDD scenarios reference TLA+ state variables (pt, lc, wc) directly instead of observable behaviors | MAJOR (BDD) | Step 38 replaces all Given/When/Then step text that references TLA+ variable names with observable behaviors (e.g., `busStatus = 'halted'` → `the bus status reported by 'vibe -Status' is 'halted'`) |
| OBJ-R6-26 | Scenario Outlines absent — 7 'with different worker counts' scenarios are copy-pasted | MAJOR (BDD) | Step 38 converts all copy-pasted same-shape scenarios to Scenario Outlines with `Examples:` tables; specifically the worker-count family and the halt-trigger family |
| OBJ-R6-27 | Feature flag VIBE_STAGE_N_BIDIR cascade order not documented — enabling Tier 5 before Tier 3 produces undefined behavior | MAJOR (CD) | Step 30 adds `cascade-order.md` documenting required enable order: Stage 2 → Stage 3 → Stage 4 → Stage 5 → Stage 6 → Stage 7; `feature-flags.psd1` validates at load time that no stage N flag is enabled without stage N-1 flag also being enabled; Step 32 adds `cascade-order-check.ps1` CI gate |
| OBJ-R6-28 | 24h soak criteria are narrative with no numeric thresholds for pass/fail automation | MAJOR (CD) | Step 32 `stage-soak-log.txt` format updated: each entry now includes `soak_p99_ms`, `soak_error_rate_pct`, `soak_agent_crash_count` fields; `stage-soak-gate` CI job validates: `soak_p99_ms ≤ 5`, `soak_error_rate_pct ≤ 0.1`, `soak_agent_crash_count = 0`; all three conditions required for `status=soak-complete` |
| OBJ-R6-29 | No rollback plan documented for each tier | MAJOR (CD) | Step 32 adds per-tier rollback procedures to `migration-playbook.md`: Tier 1-3: `git revert <commit-sha>` (no SQLite impact); Tier 4-8 (bus domain): `git revert` + `vibe schema-rollback`; Tier 9-11 (stage migration): `git revert Stage-N-commit` in reverse order + `vibe schema-rollback`; each tier names its rollback boundary commit |
| OBJ-R6-30 | Liveness property 'CommitLockEventuallyReleased' not tested explicitly | HIGH (TLA) | Step 22 adds `Test-CommitLockEventuallyReleased`: mock `RouterCommitSucceeds` to fire after delay (simulating SF fair scheduling); assert `commitLockHolder[w] = NULL` within 5 virtual ticks regardless of other concurrent activity; tests the SF fairness obligation explicitly |
| OBJ-R6-31 | Test file naming convention mixes step-number and feature-name schemes | HIGH (TDD) | All new test files (Steps 36-38) use feature-name scheme only; Step 32 adds `naming-convention-check.ps1` CI gate: fails if any `*.Tests.ps1` file under `tests/bus/` has a step-number prefix (e.g., `step15-router.Tests.ps1`); all existing files are already feature-named |
| OBJ-R6-32 | Integration tests share fixtures that mutate global SQLite state | HIGH (TDD) | Step 9 test helpers updated: `New-BusTestDatabase` creates a GUID-named temp SQLite (`$env:TEMP\vibe-test-<guid>\vibe-bus.db`); all Steps that create integration tests use `New-BusTestDatabase` in `BeforeEach` and `Remove-BusTestDatabase` in `AfterEach`; test isolation verified in Step 35 E2E run |
| OBJ-R6-33 | AgentSession and ConsensusRound aggregates share event_log table — write amplification and aggregate boundary leak | HIGH (DDD) | Step 2 documentation clarified: `event_log` is a **shared append-only read-model** (not owned by any aggregate); aggregates write to their own tables (`agent_sessions`, `bus_state`) and append events via the core router (Step 15); no aggregate may INSERT directly into `event_log` — all inserts go through `Invoke-BusAppendEvent`; Step 15 enforces this via a module-level guard |
| OBJ-R6-34 | Disk-full during WAL checkpoint not scripted | HIGH (EDGE) | Step 5 `Invoke-BusWalCheckpoint` adds `Test-WalCheckpointDiskFull`: mock `PRAGMA wal_checkpoint(TRUNCATE)` to return `SQLITE_FULL`; verify `[ALARM] WAL checkpoint failed: disk full (SQLITE_FULL). WAL file may grow unbounded. Free disk space and retry.` emitted; verify process does NOT exit (non-fatal); WAL frames counter logged for operator visibility |
| OBJ-R6-35 | Telemetry/observability overhead not accounted for in ≤5ms p99 | HIGH (PERF) | Step 33 adds `Test-TelemetryOverhead`: call `Write-PipelineLog` with `[TELEMETRY]` severity 1000 times concurrently; assert p99 overhead per emit ≤ 0.5ms (added to `performance-baselines.json`); verify total overhead does not push `Invoke-BusAppendEvent` p99 above 5ms when telemetry is enabled |
| OBJ-R6-36 | Background step 'a clean bus' does not define cleanup order | HIGH (BDD) | Step 38 adds explicit cleanup order to the `Background:` block shared step implementation: (1) `Stop-AllBusAgents`, (2) DELETE rows from `agent_sessions WHERE status != 'ended'`, (3) clear `bus_state` rows, (4) DELETE `event_log` test rows with `evt_id > (SELECT MAX(evt_id) FROM event_log_archive)`, (5) release all named mutexes via `[System.Threading.Mutex]::OpenExisting('VibeBus-*')` pattern, (6) assert zero alive processes |
| OBJ-R6-37 | Canary rollout percentage is 'start small' rather than a concrete 1%/5%/25%/100% ladder | HIGH (CD) | Step 32 `migration-playbook.md` updated: canary ladder is `1% (1 worker) → 5% → 25% → 100%`; `feature-flags.psd1` adds `VIBE_CANARY_PCT` env var; `stage-soak-gate` CI job checks that percentage advanced only after soak at prior level passed; rollback trigger: error_rate > 0.1% at any level |
| OBJ-R6-38 | Version-parity check compares tag strings but does not verify schema hash | HIGH (CD) | Step 32 `check-schema-hash-parity.ps1` added; `check-tla-version.ps1` also calls it: for a given spec version tag, verify `schema-hash.txt` in the tagged commit matches the hash computed from current DDL; tagged version with dirty working tree is detected by this hash comparison |

### Round 7 — Cross-Expert Objections (OBJ-R7-*)

| # | Objection | Score | Resolution |
|---|---|---|---|
| OBJ-R7-EC-1 | Halt-latch and SQLite COMMIT are not atomic — crash between `Interlocked.CompareExchange` and COMMIT leaves `busStatus='running'` in durable storage while in-memory latch=1, violating `OnlyDefinedHalts` after recovery | 6/6 | Step 36 adds SQLite-first halt pattern: `halt_intent` journal record written first, CAS latch second, COMMIT third; on crash recovery `Invoke-BusHaltIntentRecovery` reads the intent record and completes the halt write; all three crash windows preserve `OnlyDefinedHalts` |
| OBJ-R7-DDD-1 | `bus_state` monolithic key-value table shared by BusLifecycle, ConsensusRound, and RollbackCoordinator aggregates — TLA+ models these as independent variables; shared table violates aggregate boundary ownership | 5/6 | Step 4 (Round 7) splits `bus-state.sql` into three aggregate-owned tables: `bus_lifecycle_state` (owned by Step 36), `consensus_state` (owned by Step 12), `rollback_state` (owned by Step 29); CI `check-tla-symbol-parity.ps1` enforces cross-table access prohibition |
| OBJ-R7-TLA-1 | TLA↔code symbol parity asserted via prose in `refinement-mapping.md` but never mechanically verified; a renamed action or deleted invariant in the spec would pass CI undetected | 4/6 | Step 32 (Round 7) adds `tools/check-tla-symbol-parity.ps1` CI gate (`tla-symbol-parity` job, job #21): extracts all action/invariant names from the `.tla` file using regex; verifies each appears in code (`refinement-mapping.md`, `bus/` comments, or test assertions); fails on any unmapped symbol |
| OBJ-R7-BDD-1 | `@tla-action-N` tags are decorative integers — no runner verifies that index N maps to an action that still exists in the current `.tla` version; stale tags can survive spec refactors silently | 4/6 | Step 32 (Round 7) adds `tools/check-bdd-action-tags.ps1` CI gate (`bdd-action-tag-parity` job, job #22): reads `TlaActionIndex` from `bounded-context-glossary.psd1`, looks up each `@tla-action-N` tag's action name, verifies the name exists in the current `.tla` source; fails with `[FAIL] @tla-action-N references '<name>' not found in spec v<V>` |
| OBJ-R7-EC-2 | `System.IO.File.Replace` (`.snapshot.tmp` → `.snapshot` rename) throws `IOException` under antivirus/indexer sharing violations with no retry; single failure permanently prevents snapshot and blocks rollback | 4/6 | Step 37 (Round 7) adds `Invoke-AtomicFileReplace` with 8-attempt exponential-backoff retry (100ms base, 2× factor, ±25ms jitter); on exhaustion: `[ALARM]` + halt with `failureCategory='git_commit'`; `[WARN]` on each intermediate retry |
| OBJ-R7-TDD-2 | `check-red-commit-order.ps1` and `test-fail-assertion.ps1` treat parse errors and assertion failures identically; a test file with a syntax error appears to "fail" the red phase, masking green-phase violations | 4/6 | Step 32 (Round 7): `test-fail-assertion.ps1` runs two sequential phases — parse phase (`pwsh -Command "Import-Module ..."`, exit 2 on syntax error) then assertion phase (Pester run, exit 1 if all pass, exit 0 if ≥1 fails with AssertionException); exit codes documented: 0=red-confirmed, 1=green-masking, 2=parse-error, 3=unexpected; CI reports each category distinctly |
| OBJ-R7-PERF-2 | `wal_autocheckpoint=0` disables automatic checkpointing but no explicit WAL size monitor or threshold-based trigger exists; WAL file grows unbounded under sustained write load and can exhaust disk | 4/6 | Step 5 (Round 7): `Open-BusDatabase` measures WAL file size on every open; emits `[WARN]` at 10 MB, `[ALARM]` + emergency checkpoint at 50 MB; `Invoke-BusWalCheckpoint` also triggered after every 1000 `Invoke-BusAppendEvent` calls and before every rollback |
| OBJ-R7-TLA-3 | `schema-hash.txt` generation algorithm undocumented — encoding, line-ending normalization, column ordering, and algorithm name unspecified; different platforms compute different hashes for identical schemas | 4/6 | Step 4 (Round 7): `generate-schema-hash.ps1` uses SHA-256, UTF-8 (no BOM), CRLF→LF normalization, statements sorted alphabetically by table name; `settings` table stores `schema_hash_algorithm=sha256-canonical-v1`; Step 5 verifies algorithm tag on every connect; unknown algorithm → halt |
| OBJ-R7-PERF-1 | Performance baselines in `performance-baselines.json` cover implementation operations but no entry maps TLA+ liveness properties to wall-clock SLOs; liveness guarantees are ungrounded in measurable time | 3/6 | Step 33 (Round 7) adds `docs/bidirectional-comms/liveness-slo-mapping.md` mapping all 5 liveness properties to wall-clock SLOs; adds 6 new baseline keys to `performance-baselines.json`; CI verifies each SLO key exists in baselines |
| OBJ-R7-EC-3 | Schema-hash validation fails immediately on canary deploy when writer (new schema) and reader (old schema) nodes coexist; no defined tolerance window for version drift | 3/6 | Step 4 (Round 7): `generate-schema-hash.ps1` writes both `schema_hash` (current) and `previous_schema_hash` (prior migration) to `schema-hash.txt`; `Open-BusDatabase` accepts either hash during `VIBE_CANARY_SCHEMA_WINDOW_HOURS` window (default 2h); after window only current hash accepted |
| OBJ-R7-TDD-3 | Real-time clock leakage — `[DateTime]::UtcNow` and `Get-Date` appear in bus modules outside the single canonical injection point; injected clock abstraction declared in prose but not enforced as a single module-level export | 3/6 | Step 5 (Round 7): `open-bus-database.ps1` exports `$script:GetUtcNow = { [DateTime]::UtcNow }` as the SOLE canonical clock; all bus modules read this scriptblock; test harness overrides it; Step 32 `no-real-time` CI gate updated to allow `[DateTime]::UtcNow` ONLY in the single assignment in `open-bus-database.ps1` |
| OBJ-R7-CD-3 | Canary rollback criteria defined as `error_rate > 0.1%` in prose but not codified as executable policy; unclear which signals are automated vs manual; no escalation contact specified | 3/6 | Step 32 (Round 7) adds `docs/bidirectional-comms/canary-rollback-criteria.md` (automated triggers: `error_rate > 0.1%`, `crash_count > 0`, `p99_ms > 2× SLA`) and `canary-escalation-procedures.md` (manual: `p99_ms > 1.5× AND ≤ 2× SLA`, `error_rate 0.05%–0.1%`); `$env:VIBE_CANARY_ROLLBACK_POLICY` (`auto|manual|alert-only`); `stage-soak-gate` calls `Send-CanaryRollbackAlert` on automated trigger |
| Unresolved TDD-1 | `@tla-action-none` exemption severity — BLOCKER (reject the tag) vs MAJOR (allow with justification) | — | Resolved as MAJOR: `@tla-action-none` permitted but MUST be accompanied by `@tla-action-none-reason="<text>"` tag; CI fails if `@tla-action-none` appears without the reason tag; valid reasons include `"infrastructure"`, `"deployment-smoke"`, `"user-observable-behavior-only"` |
| Unresolved PERF-3 | Stage-soak threshold severity — MAJOR (hard block) vs lower (warn) | — | Resolved with two-tier thresholds in `soak-thresholds.psd1`: HARD (`p99_ms_max=5.0`, `error_rate_max=0.001`, `crash_count_max=0`) blocks merge; SOFT (`p99_ms_soft=3.0`, `error_rate_soft=0.0005`) emits `[WARN]` only; CI job reports both levels |
| Unresolved BDD-2 | Scenario Outline coverage for `rollbackTargetWorktree` — MAJOR (require Outline) vs process (prose suffices) | — | Resolved as MAJOR: Step 38 (Round 7) adds Scenario Outline with 3 `Examples` rows covering `wt1 (snapshot exists)`, `wt2 (no snapshot)`, and `wt1 (hash mismatch)`; subsumes three copy-pasted scenarios |
| Unresolved CD-3 | Scope of canary ladder rollback criteria | — | Resolved: `canary-rollback-criteria.md` covers automated rollback triggers; `canary-escalation-procedures.md` covers manual escalation; both documents reference `$env:VIBE_ON_CALL_CONTACT` for paging; scope is per-stage (not per-canary-pct) for manual escalation, per-canary-pct for automated |

### Round 8 — Cross-Expert Objections (OBJ-R8-*)

| # | Objection | Resolution |
|---|---|---|
| OBJ-R8-1 | Gate-authenticity gap — 22 CI gates enumerate by name but no gate emits a signed proof-artifact manifest (TLC trace hash, BDD scenario ID, property-test seed) proving the gate ran against the specific change rather than used a cached green result | Step 32 (Round 8): every gate script emits `proof-artifact.json` — `{gate_name, commit_sha, run_id, timestamp_utc, outcome, proof_data, hmac}` where `hmac = HMAC-SHA256(proof_data \|\| run_id, $env:VIBE_GATE_SIGNING_KEY)`. Specific `proof_data` per gate: `tlc-check` emits TLC trace SHA-256; `bdd-tag-lint` emits SHA-256 of the passing Scenario ID list; `perf-baseline` emits the load-generator seed used. New meta-gate CI job #23 (`gate-proof-manifest`) consumes all 22 proof manifests; fails if any is missing, malformed, or HMAC is invalid. New file: `tools/emit-gate-proof.ps1` (shared helper called by each gate script) |
| OBJ-R8-2 | Rollback-intent journal scope — halt-intent journaling exists for BusLifecycle (OBJ-R7-EC-1) but no equivalent journal exists for RollbackCoordinator; a crash between `Invoke-GitStashPop` execution and the SQLite `COMMIT` in `Invoke-BusRollbackCoordination` leaves `snapshotExists[w]=TRUE` while consensus state is already partially reset — a state unreachable under the TLA+ spec | Step 29 (Round 8): `Invoke-BusRollbackCoordination` writes `rollback_intent_target_worktree` and `rollback_intent_started_at` keys to `rollback_state` in a separate `BEGIN IMMEDIATE` BEFORE the main rollback transaction. `Invoke-BusRollbackIntentRecovery(db)` called from `Open-BusDatabase` (after WAL checkpoint, before returning the connection): if intent keys exist and `rollbackRequested=FALSE` (rollback COMMIT already occurred), clean up intent keys silently; if intent keys exist and `rollbackRequested=TRUE` (crash mid-rollback), re-invoke `Invoke-BusRollbackCoordination` using the stored intent. Crash-window analysis: (a) crash before intent write → no-op; (b) crash after intent write, before rollback COMMIT → recovery re-runs rollback; (c) crash after rollback COMMIT → intent keys cleaned up atomically in the rollback transaction itself |
| OBJ-R8-3 | Recovery idempotence — rollback-restore re-application after crash-during-rollback can double-reset consensus counters (`Invoke-AdvanceRoundEpoch` called twice on the same RoundEpoch value) | Step 29 (Round 8): `Invoke-BusRollbackCoordination` writes `rollback_execution_id` (GUID generated at rollback start) into the main `BEGIN IMMEDIATE` transaction alongside all other rollback state updates. `Invoke-BusRollbackIntentRecovery` checks: if `rollback_execution_id` already exists in `rollback_state` with `snapshotExists[w]=FALSE` and `rollbackRequested=FALSE`, the rollback already completed; clean up intent keys and return (no-op). `Invoke-AdvanceRoundEpoch` already enforces `ConsensusRoundStartMonotone` (no-op if nextEvtId ≤ current RoundEpoch) — this provides a second idempotence layer. New test: `Test-RollbackRecovery-Idempotence`: simulate crash-during-rollback by calling `Invoke-BusRollbackCoordination` twice with the same `rollback_execution_id`; assert consensus counters reset exactly once; assert `consensusRoundStart` equals `nextEvtId_at_rollback` (not `nextEvtId_at_rollback + N`) |
| OBJ-R8-4 | Cross-aggregate read projection boundaries — AgentSession, ConsensusRound, and BusLifecycle share reads on `handlerPendingEpoch`, `consensusRoundStart`, and `busStatus` without a single projection contract; stale-read risk was only partially addressed by SQLite WAL semantics, not by aggregate design | Step 33 (Round 8): new file `docs/bidirectional-comms/cross-aggregate-projection-contract.md` specifying every cross-boundary read in the codebase — which aggregate reads from which foreign table, the read-isolation guarantee (SQLite WAL provides snapshot isolation per-transaction), and the staleness bound. New file `bus/infra/bus-read-projection.ps1` defining `Get-BusReadProjection(db)` — a single function returning a typed read-only snapshot of all cross-aggregate state needed for routing decisions. `check-tla-symbol-parity.ps1` updated to flag direct SQL reads from foreign aggregate tables outside `bus-read-projection.ps1` (new lint rule: `cross-aggregate-direct-read`). New CI job `cross-aggregate-boundary-lint` (part of job #23's meta-gate gate-proof-manifest responsibilities) |
| OBJ-R8-5 | Symbolic TLA+ trace tags — no bidirectional mapping from TLC counterexample action-names to concrete PowerShell function IDs; trace-replay tests reference TLA+ action names in prose but the test runner cannot programmatically instantiate PowerShell calls from a TLC counterexample sequence | Step 33 (Round 8): new file `bus/infra/tla-trace-function-map.psd1` mapping every TLA+ action name (1–40) to `{FunctionName, Module, Parameters[]}` describing the PowerShell function that implements it. `bus-trace-replay.Tests.ps1` updated: given a TLC counterexample action sequence (from `tlc -dumpTrace`), the trace runner loads `tla-trace-function-map.psd1`, resolves each action to its PowerShell function, executes the sequence with mocked dependencies, and asserts the implementation reaches the same state as the TLC trace after each step. `check-tla-symbol-parity.ps1` is updated to verify `tla-trace-function-map.psd1` has an entry for every action name that appears in the spec |
| OBJ-R8-6 | Non-repudiable red-green ledger — test tier passes are reported per CI job but not cryptographically chained into a release-gate ledger; a flaky-test suppression or gate-skip cannot be detected after the fact | Step 32 (Round 8): new file `tools/gate-ledger.ps1` producing a chained HMAC ledger. Each entry: `{gate_name, timestamp_utc, commit_sha, outcome, prev_hash, hmac}` where `hmac = HMAC-SHA256(gate_name \|\| timestamp_utc \|\| commit_sha \|\| outcome \|\| prev_hash, $env:VIBE_GATE_SIGNING_KEY)` and `prev_hash = SHA256(prior entry JSON)`. The ledger file `docs/gate-ledger.jsonl` is appended after each CI run (each gate job calls `gate-ledger.ps1 --append`). New CI job #24 (`gate-ledger-verify`) verifies: (a) every gate has an entry for the current commit_sha, (b) chain is unbroken, (c) all HMACs are valid. A gap or tampered entry causes `[FAIL] Gate ledger tampered or entry missing: <gate_name> commit=<sha>` |
| OBJ-R8-7 | Performance drift ratcheting — p99 baselines (`append_event_p99_ms=5`, `snapshot_git_stash_p99_ms=2000`) are fixed thresholds with no ratchet-down policy; gradual drift toward the ceiling is undetectable until it exceeds | Step 32 (Round 8): new file `tools/ratchet-perf-baselines.ps1`. After each successful `perf-baseline` CI run, if measured p99 < baseline × 0.8 for 3 consecutive successful runs (tracked in `docs/perf-ratchet-log.json` with `{run_id, operation, measured_p99_ms, baseline_ms, status: observed\|proposed\|accepted\|rejected}`), the tool emits `[INFO] Ratchet candidate: <op> p99=<N>ms is ≥20% below baseline <M>ms. Proposed: <P>ms. Review and commit performance-baselines.json to apply.` No automatic commit — a developer reviews and commits. `perf-baseline` CI job calls `ratchet-perf-baselines.ps1` as a post-step |
| OBJ-R8-8 | Transaction discipline across BEGIN IMMEDIATE — the plan relies on SQLite BEGIN IMMEDIATE for atomicity but does not specify the invariant-preserving unit of work for multi-row writes that span aggregate-owned tables (e.g., RollbackCoordinator writes `consensus_state` + `rollback_state` while BusLifecycle writes `bus_lifecycle_state` separately) | Step 33 (Round 8): new file `docs/bidirectional-comms/transaction-boundaries.md` cataloging every named `BEGIN IMMEDIATE` boundary: `RollbackCoordinationUnit` (Step 29: `consensus_state` + `rollback_state` in one transaction; `bus_lifecycle_state` written separately by `BusLifecycle.Invoke-BusHalt`), `HaltUnit` (Step 36: `bus_lifecycle_state` only), `AppendEventUnit` (Step 15: `event_log` only), `TakeSnapshotUnit` (Step 29/37: `rollback_state` only; git stash outside). Each entry: tables touched, TLA+ variables advanced, atomicity guarantee, and recovery contract. `check-tla-symbol-parity.ps1` updated with rule: any multi-table write must match a documented boundary in `transaction-boundaries.md` |
| OBJ-R8-9 | BDD scenario-to-invariant bijection — TLA+ invariants `ConsensusRoundStartMonotone` (invariant 21), `NoOrphanedHandlerForDeadAgent` (invariant 22), and `TypeSenderACL` (invariant 18) have no corresponding BDD scenario in the Step 38 Feature Audit | Step 38 (Round 8): three BDD scenarios added to `bdd.feature`: (1) `@invariant-21 @tla-action-39 Scenario: consensus epoch advances after rollback` — asserts `vibe -RoundEpoch` reflects new epoch post-rollback; (2) `@invariant-22 @tla-action-6 Scenario: no handler remains assigned after agent crash` — asserts handler state is cleared when agent process exits unexpectedly; (3) `@invariant-18 @tla-action-3 Scenario: TypeSenderACL rejects forbidden event type from coding agent` — asserts `[ERROR] TypeSenderACL violation` when a coding-worker attempts to send a `protocol_error` event. The BDD scenario-to-invariant bijection is now complete: all 22 invariants have at least one `@invariant-M` tagged scenario |
| OBJ-R8-10 | Edge-case coverage around RouterAbortsStaleRollback and RouterHaltsRollbackSqliteError — no step explicitly authors chaos tests exercising Ctrl+C during rollback-pending or SQLite error during rollback | Step 29 (Round 8): two chaos tests added to `rollback.Tests.ps1`: (1) `Test-RouterAbortsStaleRollback-CtrlCDuringRollback-Chaos`: set `rollbackRequested=TRUE`, `busStatus='running'`; fire SIGINT (call `Invoke-BusHalt('user_interrupt', $null)` directly, simulating VibeBus.UserInterrupted engine event); verify `busStatus='halted'`, `haltReason='user_interrupt'`; verify `RouterAbortsStaleRollback` clears `rollbackRequested=FALSE`; verify `snapshotExists[w]` remains `TRUE` (snapshot preserved for re-issue after -Resume); (2) `Test-RouterHaltsRollbackSqliteError-SQLiteError-Chaos`: set `rollbackRequested=TRUE`, `busStatus='running'`, `CommitOwner[w]=NULL`; mock SQLite `BEGIN IMMEDIATE` to throw `SQLITE_ERROR`; verify `busStatus='halted'`, `failureCategory='sqlite_error'`, `rollbackRequested=FALSE`, `rollbackTargetWorktree=NULL`; verify `[ERROR] SQLite error during rollback coordination` emitted |
| OBJ-R8-11 | Step dependency ordering — Step 33 (performance-baselines and property tests) is scheduled before Step 34 (contract tests); contract tests establish the integration invariants that performance baselines must be measured under | Step 34 is added as a formal dependency of Step 33 in the execution DAG. Within Tier 10: Step 34 runs first (contract snapshots created); Step 33's `bus-trace-replay.Tests.ps1` imports `tests/contracts/snapshots/claude-output.snapshot.json` to ensure trace replay uses contract-conformant agent output. Step 33's pure-algorithmic property tests (NoDuplicateEvtId, TypeSenderACL) are tagged `@contract-independent` and may run in parallel with Step 34; trace-replay and liveness tests are tagged `@contract-dependent` and must wait for Step 34 to complete |
| OBJ-R8-12 | Parallelization of execution tiers — Tier 2 bundles BusLifecycle aggregate (Step 36) with AgentSession and ConsensusRound; RollbackCoordinator (Tier 8, Step 29) reads BusLifecycle's `busStatus` and halt-intent journal without an explicit integration-boundary contract test between the two aggregates | Step 29 (Round 8): new test `Test-RollbackCoordinator-BusLifecycleBoundary`: verify `Invoke-BusRollbackCoordination` reads `busStatus` via `Get-BusLifecycleState(db)` (the BusLifecycle aggregate's projection interface), NOT via a direct SQL read of `bus_lifecycle_state`; mock `Get-BusLifecycleState` to return `busStatus='halted'` mid-drain; verify drain-abort path taken; verify rollback state left clean (no partial mutations); AST check: `rollback-coordinator.ps1` contains no direct `SELECT \| INSERT \| UPDATE \| DELETE` against `bus_lifecycle_state` table. Step 36 documents `Get-BusLifecycleState` as the canonical cross-aggregate projection interface for lifecycle state, completing the projection contract for OBJ-R8-4 |

### Round 9 — Cross-Expert Objections (OBJ-R9-*)

| # | Objection | Resolution |
|---|---|---|
| OBJ-R9-1 | Gate Authenticity — documented gates (grep-parity, mutation-doc, red-commit-timestamp) not structurally enforced; `Should -Be "*invariant covered*"` wildcard string-literal assertions are unverifiable | Step 32 (Round 9): `tools/check-gate-executability.ps1` — AST-based meta-gate that parses every gate script in `tools/` using `[System.Management.Automation.Language.Parser]::ParseFile`, verifies each documented gate has an executable entry point (function or scriptblock that invokes the designated lint tool), emits `[FAIL] Gate script '<name>' has no verifiable execution path to its stated check` on any prose-only gate. `tools/no-string-literal-assertions.ps1` — scans all `*.Tests.ps1` for `Should -Be "*<keyword>*"` wildcard patterns and flags `[FAIL] String-literal wildcard assertion at <file>:<line> — replace with typed object assertion or Should -Match '<regex>'`. New CI jobs: `gate-executability-lint` (job #25) and `no-string-literal-assertions` (job #26), both emitting proof artifacts via `emit-gate-proof.ps1`. |
| OBJ-R9-2 | Rollback-Intent Journal missing `rollback_phase` — Step 29 RouterExecutesRollback has an unrecoverable crash window BETWEEN `Invoke-GitStashPop` (git-restore) and the main `BEGIN IMMEDIATE`; existing journal cannot distinguish "crash before git" from "crash after git, before COMMIT" | Step 29 (Round 9): `rollback_state` gains `rollback_phase` TEXT column with values `'intent_written'` → `'git_operation_done'` → `'committed'`. Each `Invoke-BusRollbackCoordination` invocation generates a UUID naming the intent row (`rollback_intent_{uuid}`) for per-attempt idempotency. `Invoke-BusRollbackIntentRecovery` branches on `rollback_phase`: `'intent_written'` → git stash-pop NOT done, re-run full rollback; `'git_operation_done'` → git stash-pop completed but COMMIT did not, skip git step and re-enter `BEGIN IMMEDIATE`. Phase transitions are each their own `BEGIN IMMEDIATE` micro-transaction. Tests: `Test-RollbackRecovery-CrashAfterGitBeforeCommit` (phase = `'git_operation_done'`, assert git skipped on replay); `Test-RollbackRecovery-CrashBeforeGit` (phase = `'intent_written'`, assert full replay). |
| OBJ-R9-3 | Recovery Idempotence & Single-Flight Lock — `Invoke-BusHaltIntentRecovery` runs unconditionally on every `Open-BusDatabase`; concurrent process opens race to double-run recovery, potentially advancing halt state twice | Step 36 (Round 9): `.vibe/bus.recovery.lock` file acquired exclusively via `[System.IO.FileStream]` with `FileShare.None` before any recovery action. `recovery_owner` field added to `bus_lifecycle_state`: `UPDATE bus_lifecycle_state SET value=<owner-uuid> WHERE key='recovery_owner' AND (value IS NULL OR value='')` — CAS pattern; only one recoverer wins. `Invoke-BusHaltIntentRecovery` moved from `Open-BusDatabase` caller into `bus-lifecycle.ps1` aggregate, invoked via `Invoke-BusLifecycleOpen(db)`. Recovery action classified as a "Recovery Action" (stutter step) in `stuttering-equivalence.md`. Tests: `Test-RecoveryLock-ConcurrentOpen-OnlyOneRecoverer` — two concurrent `Open-BusDatabase` calls; assert exactly one `recovery_owner` row written; assert second caller observes completed state. |
| OBJ-R9-4 | Cross-Aggregate Read Projections undefined — `check-tla-symbol-parity.ps1` forbids all cross-aggregate table access but `Get-BusStatus` legitimately spans 3 aggregate-owned tables; blanket prohibition is a false positive | Step 4 (Round 9): new file `packages/vibe-cli/bus/schema/aggregate-table-ownership.psd1` — `{Owner, Readers: []}` per table: `bus_lifecycle_state` (Owner: `BusLifecycle`, Readers: `[Get-BusReadProjection]`); `consensus_state` (Owner: `ConsensusRound`, Readers: `[Get-BusReadProjection]`); `rollback_state` (Owner: `RollbackCoordinator`, Readers: `[Get-BusReadProjection]`); `event_log` (Owner: `Router`, Readers: `[AgentSession, ConsensusRound, Get-BusReadProjection]`). Step 32 (Round 9): `check-tla-symbol-parity.ps1` updated to load `aggregate-table-ownership.psd1` — allows cross-aggregate SQL reads ONLY (a) from functions whose names appear in the `Readers` list AND (b) mediated via `Get-BusReadProjection`; direct SQL reads from foreign tables outside `Get-BusReadProjection` remain forbidden. `Get-BusStatus` verified to call `Get-BusReadProjection`. Test: `Test-AggregateTableOwnership-Readers-AllowedPaths`. |
| OBJ-R9-5 | Symbolic TLA+ Action Tags required — `@tla-action-14` is positional and silently rebinds on spec refactor; no `ObservablePostConditions` map links tags to testable behaviour | Step 1 (Round 9): `bounded-context-glossary.psd1` gains `TlaActionNamedTags` map (action-name → canonical tag, e.g., `RouterCommitSucceeds = '@tla-action-RouterCommitSucceeds'`) and `ObservablePostConditions` map (action-name → list of `Get-BusStatus`-observable postconditions). Step 38 (Round 9): all 335 BDD scenarios updated — numeric `@tla-action-N` tags replaced with named `@tla-action-<ActionName>` tags. Step 32 (Round 9): `check-bdd-action-tags.ps1` validates named tags against action names parsed from the spec (not numeric index); numeric tags now rejected with `[FAIL] Deprecated numeric tag @tla-action-<N>; use @tla-action-<ActionName>`. New CI lint `check-bdd-postconditions.ps1` (job #27): verifies each `@tla-action-*` tagged scenario has a `Then` clause matching ≥1 postcondition from `ObservablePostConditions`. |
| OBJ-R9-6 | Non-Repudiable Red-Green Provenance — `check-red-commit-order.ps1` uses `git log` timestamps defeatable by rebase/squash/force-push; no cryptographic binding between test file and its red-commit SHA | Step 32 (Round 9): `check-red-commit-order.ps1` appends to `.vibe/red-green-ledger.txt` after each gate run (one JSON line per validated pair: `{timestamp_utc, test_file, first_commit_sha, first_commit_gpg_fingerprint, impl_file, impl_commit_sha, gate_outcome}`). GPG fingerprint extracted via `git log --show-signature`; if absent: `[FAIL] Red-phase test file '<test>' first commit <sha> is not GPG-signed. Sign with: git commit --amend -S`. File is append-only (no truncation allowed). `gate-ledger.jsonl` (OBJ-R8-6) extended with `red_green_ledger_sha256` field; `gate-ledger-verify` (job #24) validates ledger SHA against file on disk. Tests: `Test-RedGreenLedger-AppendOnly-NoTruncation`: gate runs twice; assert 2 entries (not 1); assert `[FAIL]` on SHA mismatch. |
| OBJ-R9-7 | Perf Drift Ratcheting — 20% per-PR threshold allows 38× cumulative drift over 20 PRs; SOFT soak violations persist indefinitely; no `mutation_score_min` pin; `Get-BusStatus` missing from budget table; `consensus_resolution_ms` mixes machine + human deliberation time | Step 33 (Round 9): `performance-baselines-absolute.json` added — hard floor values the ratchet can never lower: `{append_event_p99_ms_floor: 5, git_stash_p99_ms_floor: 2000, get_bus_status_p99_ms_floor: 10}`. `ratchet-perf-baselines.ps1` refuses proposed ratchets below any floor; `perf-ratchet-log.json` entries gain `absolute_floor_ms`. `soak_p99_ms_prev` comparator: `stage-soak-gate` compares current soak p99 to previous run's value from `stage-soak-log.txt`; emits `[WARN]` if delta > 10% even when both within HARD threshold. `mutation_score_min: 0.75` added to `performance-baselines.json`; CI fails if Pester mutation coverage falls below it. `get_bus_status_p99_ms: 10` added to baselines. `consensus_resolution_ms` split: `consensus_machine_resolution_ms` (SLO ≤500ms, measured via SQLite timestamp delta between first-objection evt_id and ratification evt_id) + `consensus_human_deliberation_ms` (informational, flagged `@human-time`, excluded from SLO gate). |
| OBJ-R9-8 | Transaction Discipline — telemetry emission inside `BEGIN IMMEDIATE` would exceed 5ms p99 budget; `nextEvtId` reads in consensus-advance occur outside the transaction, breaking `ConsensusRoundStartMonotone` under concurrent writers | Step 15 (Round 9): `Invoke-BusAppendEvent` uses `$script:PendingTelemetry = [System.Collections.Generic.List[string]]::new()` — inside `BEGIN IMMEDIATE`, all `Write-PipelineLog [TELEMETRY]` calls append to the buffer (no disk write); after `COMMIT`, flush in a single `Write-PipelineLog` lock acquisition. Step 12 (Round 9): `ConsensusRound.Invoke-AdvanceRoundEpoch` issues `SELECT nextEvtId` INSIDE the same `BEGIN IMMEDIATE` as the `consensus_round_start` update — never in a preceding standalone SELECT. Step 33 (Round 9): `check-no-telemetry-in-transaction.ps1` AST-walk lint (CI job #28) flags any `Write-PipelineLog` call lexically between `$conn.Execute("BEGIN IMMEDIATE")` and `$conn.Execute("COMMIT")` in `bus/*.ps1` as `[FAIL] Telemetry emission inside BEGIN IMMEDIATE at <file>:<line>`. Tests: `Test-AppendEvent-TelemetryFlushedAfterCommit`; `Test-ConsensusAdvance-NextEvtIdInsideTransaction`. |
| OBJ-R9-9 | Per-worktree stash mutex `VibeBus-Stash-<w>` missing — `WorkingTreeCoordinator` runs git stash lock-free, allowing concurrent stashes on the same worktree from two processes to race and corrupt the stash stack | Step 37 (Round 9): `WorkingTreeCoordinator.Invoke-GitStash` and `Invoke-GitStashPop` acquire named mutex `VibeBus-Stash-<w>` (one per worktree). Lock hierarchy updated in Step 10 lock-hierarchy doc: `VibeBus-Commit-<w>` (outer) > `VibeBus-Stash-<w>` (middle) > `VibeBus-PipelineLog` (inner). Rule: `VibeBus-Commit-<w>` is NEVER held when acquiring `VibeBus-Stash-<w>` (git stash always runs before commit acquisition per OBJ-R6-7). `VibeBus-Stash-<w>` subject to same AbandonedMutexException recovery as `VibeBus-Commit-<w>`. Tests: `Test-WorkingTreeCoordinator-StashMutex-SerializesOnSameWorktree`: two concurrent `Invoke-GitStash` calls for same worktree; mock records acquisition timeline; assert second waits until first releases; no interleaved stash commands. |
| OBJ-R9-10 | WAL Checkpoint Circuit Breaker — no bound on emergency checkpoint retries on disk-full; after disk fills, `Invoke-BusWalCheckpoint` hammers failing `PRAGMA wal_checkpoint(TRUNCATE)` indefinitely | Step 5 (Round 9): `Invoke-BusWalCheckpoint` tracks `$script:WalCheckpointConsecutiveFailures`. After 3 consecutive `SQLITE_FULL` failures: set `$script:WalCheckpointCircuitOpen = $true`, emit `[ALARM] WAL checkpoint circuit open after 3 consecutive SQLITE_FULL failures. WAL file unbounded until disk space restored and process restarted.`; all subsequent calls return immediately (no-op). Half-open probe: every 60th call while circuit open, attempt once; success closes circuit and resets counter with `[INFO] WAL checkpoint circuit closed.`. Tests: `Test-WalCheckpoint-CircuitBreaker-OpensAfterThreeFailures`: mock 3 SQLITE_FULL; assert circuit opens; assert `[ALARM]` exactly once; assert 4th and 5th calls are no-ops. |
| OBJ-R9-11 | Handler-session orphan reconciliation in `-Resume` — `NoOrphanedHandlerForDeadAgent` enforced at runtime by `AgentCrashes` but not at recovery; a handler assigned to a dead agent is invisible until runtime detects the next message | Step 28 (Round 9): `Invoke-BusResume` adds orphan-reconciliation pass after reading `agent_sessions`: for each handler in `busy` state whose `handler_pending_agent` references an agent with `status='ended'` or `status='dead'`, call `Invoke-BusAgentCrashHandler(agentName)` to clear handler to `idle`. Emit `[WARN] Handler '<h>' orphaned (assigned to dead agent '<a>') — reconciled during resume`. Tests: `Test-Resume-HandlerOrphanReconciliation`: set handler `busy` + `handler_pending_agent='agent-x'` + `agent_sessions.status='ended'`; call `Invoke-BusResume`; assert handler cleared to `idle`; assert `[WARN]` emitted; assert `NoOrphanedHandlerForDeadAgent` satisfied post-resume. |
| OBJ-R9-12 | Snapshot SHA-256 verify BEFORE destructive DROP not enforced — `migration-down.ps1` creates a backup but does not verify it before `DROP TABLE`; a silent write failure destroys data | Step 4 (Round 9): after `Invoke-MigrationBackup`, compute SHA-256 of the backup file and write `{backup_path, sha256, row_counts: {event_log: N, agent_sessions: M, bus_lifecycle_state: K}}` to `.vibe/backups/<timestamp>/backup-manifest.json`. BEFORE any `DROP TABLE`, re-read the backup file and verify SHA-256 against manifest. Failure: `[ALARM] Migration backup integrity check failed: expected SHA-256 <expected>, got <actual>. Refusing to DROP tables to prevent data loss.` — exit non-zero, no DROP executed. Tests: `Test-MigrationDown-SnapshotIntegrityCheckBeforeDrop`: create backup, corrupt it, call with `--force`; assert `[ALARM]`; assert no DROP; exit non-zero. |
| OBJ-R9-13 | Multi-stage rollback refusal when `schema_version - rollback_target > 1` missing — `vibe schema-rollback` allows unsafe multi-version jumps | Step 4 (Round 9): `vibe schema-rollback` reads `current_schema_version` from `settings` and `rollback_target_version` from CLI parameter (defaults to `current - 1`). If delta > 1: `[ERROR] Multi-stage schema rollback from v<N> to v<M> is not supported (delta=<D>). Apply 'vibe schema-rollback' one version at a time. Current: v<N>, Safe target: v<N-1>.` — exit non-zero, no migration executed. Tests: `Test-SchemaRollback-RefusesMultiStageJump`: `current_schema_version=5`, `--target 3`; assert `[ERROR]`; exit non-zero; no tables dropped. |
| OBJ-R9-14 | Telemetry sink specification missing — `.vibe/alarms.log` is referenced in prose but never specified; no `telemetry-sink.md` and no committed dashboard YAML | Step 10 (Round 9): `Write-PipelineLog` routes severity `ALARM` and `ERROR` to `.vibe/alarms.log` (append-only, JSON lines: `{timestamp_utc, severity, gate, message, structured_data}`); lock via `[System.IO.FileStream]` with `FileShare.ReadWrite`; file created if absent. Step 33 (Round 9): `docs/bidirectional-comms/telemetry-sink.md` documents all severity levels (`TELEMETRY/INFO/WARN/ERROR/ALARM`), routing rules (ALARM/ERROR → `.vibe/alarms.log` + stdout; others → stdout only), retention (30 days, rotate at 10MB). `docs/bidirectional-comms/observability-dashboard.yaml` committed Grafana dashboard with panels: queue depth, WAL file size, halt reason histogram, agent crash count, consensus round duration, soak p99 trend. Tests: `Test-WriteAlarmLog-RoutesAlarmAndError`: `Write-PipelineLog ALARM`; assert `.vibe/alarms.log` contains one JSON line; `INFO` does NOT appear in alarms log. |
| OBJ-R9-15 | Cascade single-reader helper `Test-StageCascadeOrder` missing; bare `$env:VIBE_STAGE_N_BIDIR` access bypasses cascade validation | Step 30 (Round 9): `Get-StageFeatureFlag([int]$StageNumber)` added to `feature-flags.psd1` — canonical reader that calls `Test-StageCascadeOrder($StageNumber)` before returning the env-var; raises `[ERROR] Stage <N> flag enabled but prerequisite Stage <N-1> flag is absent.` and returns `$false` when out of order. `cascade-order-check.ps1` (Step 32) AST lint updated: bare `$env:VIBE_STAGE_<N>_BIDIR` in `stages/*.ps1` not wrapped in `Get-StageFeatureFlag` → `[FAIL] Direct env-var access bypasses cascade validation — use Get-StageFeatureFlag(<N>)`. Tests: `Test-StageCascadeOrder-BlocksOutOfOrderEnable`: `VIBE_STAGE_4_BIDIR=1`, no `VIBE_STAGE_3_BIDIR`; call `Get-StageFeatureFlag(4)`; assert `[ERROR]`; assert `$false`. |
| OBJ-R9-16 | Fairness-obligation-matrix only 5 rows — spec has 15+ WF/SF obligations on individual ACTIONS, not just the 5 liveness PROPERTIES; matrix conflates obligations with properties | Step 33 (Round 9): `fairness-obligation-matrix.md` expanded to full obligation matrix — one row per WF/SF term in the spec's `Fairness ==` conjunction. Columns: `Obligation (WF/SF)`, `Action`, `Triggered-By (precondition)`, `PowerShell-Function`, `Test-ID`, `Liveness-Property-Dependent`. Obligations: WF(ReleasePipelineLock), WF(RouterCommitSucceeds), SF(RouterCommitSucceeds), WF(HandlerFails), WF(RouterTakesSnapshot(w)) ∀w, WF(UserRequestsRollback(w)) ∀w, WF(RouterExecutesRollback), WF(RouterAbortsStaleRollback), WF(BusResumed), WF(RouterRespawnsAgent(a)) ∀a, WF(HandlerAdapterCompletes(h)) ∀h, WF(AgentCheckpointResponse(a)) ∀a, WF(ModeratorEmitsCandidate(a)) ∀a, WF(RouterRatifiesConsensus), WF(RouterFailsConsensus) — minimum 15 rows (plus per-worktree/per-agent expansions). New CI gate `fairness-matrix-completeness` (job #29) parses the spec's `Fairness ==` block and verifies every WF/SF term appears in the matrix. |
| OBJ-R9-17 | Step 32 / Step 38 parallel execution under Tier 10 has ambiguous ordering — prior description conflates Step 32's dependency on Step 38 (Tier 9) with the intra-Tier-10 Step 33/34 sub-ordering | Execution Tiers (Round 9): Tier 10 sub-ordering stated unambiguously. Step 38 is Tier 9 (completes before Tier 10 begins). Within Tier 10, **Sub-phase A** (all concurrent): `{T34} ∥ {T32} ∥ {T33-@contract-independent tests}`. **Sub-phase B** (after Sub-phase A T34 only): `{T33-@contract-dependent tests}` (trace-replay, liveness). T32 has no dependency on T33 or T34 within Tier 10. JSON manifest encodes sub-phases via `@contract-independent` and `@contract-dependent` sub-task tags. |

---

## TLA+ State Coverage Matrix

### All 32 Variables

| Variable | Description | Covered By |
|---|---|---|
| `nextEvtId` | Monotonic ID allocator | Steps 6, 15 |
| `eventLog` | Set of delivered event records (SQLite event_log) | Steps 2, 15, 19 |
| `routedIds` | Set of already-dispatched evt_ids | Steps 6, 15 |
| `agentStatus` | Agent → {spawning, alive, checkpointing, renewing, dead} | Steps 11, 16, 18, 24, 28 |
| `agentWorktree` | Agent → Worktrees ∪ {NULL} | Steps 11, 16, 18, 24, 28 |
| `checkpointStored` | Agent → BOOLEAN | Steps 11, 24 |
| `checkpointResponseInFlight` | Agent → BOOLEAN | Steps 11, 24 |
| `groundTruthDelivered` | Agent → BOOLEAN | Steps 11, 19 |
| `spawnedAtEvt` | Agent → 1..(MaxEvtId+1) | Steps 11, 16, 24 |
| `deadAtEvt` | Agent → (1..(MaxEvtId+1)) ∪ {NULL} | Steps 11, 18, 28 |
| `unresolvedObjections` | SUBSET 1..MaxEvtId | Steps 12, 23 |
| `overriddenObjections` | SUBSET 1..MaxEvtId | Steps 12, 23 |
| `consensusState` | {open, candidate, ratified, failed} | Steps 12, 23 |
| `commitLockHolder` | Worktrees → Agents ∪ {NULL} | Step 22 |
| `committedDoneEvts` | SUBSET 1..MaxEvtId | Step 22 |
| `pendingDoneEvt` | Worktrees → (1..MaxEvtId) ∪ {NULL} | Step 22 |
| `busStatus` | {running, halted, resuming} | Step 25 |
| `haltReason` | HaltReasons ∪ {NULL} | Step 25 |
| `failureCategory` | FailureCategories ∪ {NULL} | Step 25 |
| `groupMembers` | GroupIds → SUBSET Agents | Step 21 |
| `groupReplies` | GroupIds → SUBSET Agents | Step 21 |
| `groupViolationPending` | BOOLEAN | Step 21 |
| `pendingProtocolError` | Agent → BOOLEAN | Step 20 |
| `handlerState` | Handlers → {idle, busy} | Step 17 |
| `handlerPendingEvt` | Handlers → (1..MaxEvtId) ∪ {NULL} | Step 17 |
| `handlerPendingAgent` | Handlers → Agents ∪ {NULL} | Step 17 |
| `handlerPendingEpoch` | Handlers → (1..(MaxEvtId+1)) ∪ {NULL} | Step 17 |
| `consensusRoundStart` | 1..(MaxEvtId+1) | Steps 12, 23, 29 |
| `pipeline_lock` | BOOLEAN | Steps 4, 25 |
| `snapshotExists` | Worktrees → BOOLEAN | Step 29 |
| `rollbackRequested` | BOOLEAN | Step 29 |
| `rollbackTargetWorktree` | Worktrees ∪ {NULL} | Step 29 |

### All 40 Named Actions

| # | Action | Covered By |
|---|---|---|
| 1 | `DeliverBootstrap(a, w)` | Step 16 |
| 2 | `DeliverGroundTruth(a)` | Step 19 |
| 3 | `AgentSendsDone(a, w)` | Step 22 |
| 4 | `RouterCommitSucceeds(w)` | Step 22 |
| 5 | `RouterCommitFails(w)` | Step 22 |
| 6 | `AgentCrashes(a)` | Steps 16, 18, 20 |
| 7 | `RouterInitiatesCheckpoint(a)` | Steps 20, 24 |
| 8 | `AgentCheckpointResponse(a)` | Step 24 |
| 9 | `RouterRespawnsAgent(a)` | Step 24 |
| 10 | `UserResumes` | Step 28 |
| 11 | `RouterResumesAgent(a)` | Step 28 |
| 12 | `BusResumed` | Steps 26, 28 |
| 13 | `RouterEmitsProtocolError(a)` | Step 20 |
| 14 | `AgentEmitsAfterProtocolError(a)` | Step 20 |
| 15 | `AgentRaisesObjection(a)` | Step 23 |
| 16 | `AgentResolvesObjection(a, objEvtId)` | Step 23 |
| 17 | `ModeratorOverridesObjection(a, objEvtId)` | Step 23 |
| 18 | `ModeratorEmitsCandidate(a)` | Step 23 |
| 19 | `RouterRatifiesConsensus` | Step 23 |
| 20 | `RouterFailsConsensus` | Step 23 |
| 21 | `HandlerAdapterReceives(a, h)` | Step 17 |
| 22 | `HandlerAdapterCompletes(h)` | Step 17 |
| 23 | `HandlerFails(h)` | Step 17 |
| 24 | `AgentRequestsReview(a, reviewer)` | Step 30 |
| 25 | `ReviewerEmitsVerdict(reviewer, a, inReplyTo)` | Step 30 |
| 26 | `RouterAddsAgentToGroup(a, g)` | Step 21 |
| 27 | `AgentSendsToGroup(a, g)` | Step 21 |
| 28 | `NonMemberSendsToGroup(a, g)` | Step 21 |
| 29 | `RouterHaltsFeatureComplete` | Step 25 |
| 30 | `RouterHaltsDuplicateId` | Steps 15, 25 |
| 31 | `RouterHaltsGroupViolation` | Steps 21, 25 |
| 32 | `UserInterrupts` | Steps 18, 25 |
| 33 | `RouterHaltsBoundReached` | Steps 6, 25 |
| 34 | `RouterHaltsSqliteError` | Step 25 |
| 35 | `RouterHaltsRollbackSqliteError` | Steps 25, 29 |
| 36 | `RouterAbortsStaleRollback` | Step 29 |
| 37 | `RouterTakesSnapshot(w)` | Step 29 |
| 38 | `UserRequestsRollback(w)` | Step 29 |
| 39 | `RouterExecutesRollback` | Step 29 |
| 40 | `ReleasePipelineLock` | Step 25 |

### All 22 Safety Invariants

| # | Invariant | Covered By |
|---|---|---|
| 1 | `NoDuplicateEvtId` | Steps 2, 6, 13, 15, 33 |
| 2 | `DeadAgentReceivesNoMessages` | Steps 11, 18, 24 |
| 3 | `RatificationRequiresNoUnoverriddenObjections` | Steps 12, 23 |
| 4 | `OnlyDefinedHalts` | Steps 15, 25, 36 |
| 5 | `CommitLockHolderAliveOrBusHalted` | Steps 11, 18, 22 |
| 6 | `EvtIdMonotone` | Steps 6, 13, 15 |
| 7 | `SpawningAgentOnlyReceivesBootstrap` | Steps 11, 16 |
| 8 | `ExactlyOneBootstrapPerLifetime` | Steps 2, 11, 16, 24, 28 |
| 9 | `GroundTruthPrecedesAgentMessage` | Steps 11, 19, 24, 28 |
| 10 | `OverrideIntegrity` | Steps 12, 23 |
| 11 | `CommitIdempotency` | Steps 22, 33 |
| 12 | `AllGroupRepliesHaveSentEvents` | Step 21 |
| 13 | `BusRunningImpliesLockHeld` | Steps 4, 25, 28, 36 |
| 14 | `ConsensusEventsRoutedThroughBus` | Steps 7, 14, 17, 19, 20, 23 |
| 15 | `MechanicalHaltHasCategory` | Steps 25, 33, 36 |
| 16 | `PendingProtocolErrorImpliesAgentAlive` | Steps 11, 20 |
| 17 | `CandidateHasEventInLog` | Steps 12, 23, 29, 33 |
| 18 | `TypeSenderACL` | Steps 7, 8, 14, 19, 33 |
| 19 | `HandlerStateConsistency` | Steps 16, 17, 18, 24 |
| 20 | `RollbackRequiresSnapshot` | Step 29 |
| 21 | `ConsensusRoundStartMonotone` | Steps 12, 29, 33 |
| 22 | `NoOrphanedHandlerForDeadAgent` | Steps 11, 17, 18 |

### Implementation Invariants (not in TLA+ spec — implementation-level assertions)

These invariants are not modeled in `BidirectionalComms.tla` but must be asserted in tests to bridge the gap between the spec and the implementation. They arise from implementation decisions not captured in the TLA+ model.

| # | Invariant | Description | Covered By |
|---|---|---|---|
| I1 | `InvCommitOrdering` | Every git commit event has an `evt_id` strictly greater than all previously committed `evt_ids`; commit events are recorded in monotone evt_id order | Step 22, Step 33 |
| I2 | `InvNoLostWrites` | All `done` events with `status='committed'` in `event_log` before a rollback remain in `event_log` after rollback completes (eventLog is append-only; rollback never deletes committed rows) | Step 29, Step 33 |
| I3 | `InvHaltLatchMonotonic` | The halt latch (`$HaltLatch`) is monotone: once set to 1 by `[Interlocked]::CompareExchange`, it is never set back to 0 within a process lifetime; all subsequent `Invoke-BusHalt` calls are no-ops | Step 25, Step 36, Step 33 |
| I4 | `InvSnapshotIntegrity` | `snapshotExists[w]=TRUE` in `bus_state` implies (a) the snapshot bundle file exists at the recorded path, (b) SHA-256 of the file matches `snapshot_hash_<w>` in `bus_state`; these two facts are set atomically in the same `BEGIN IMMEDIATE` transaction | Step 29, Step 33 |

### All 5 Liveness Properties

| # | Property | Covered By |
|---|---|---|
| 1 | `AgentsEventuallyAlive` | Steps 11, 16, 19, 24, 26, 28 |
| 2 | `CandidateEventuallyResolves` | Steps 12, 23, 33 |
| 3 | `CommitLockEventuallyReleased` | Steps 22, 33 |
| 4 | `ProtocolErrorEventuallyResolved` | Steps 20, 33 |
| 5 | `RollbackEventuallyCompletes` | Steps 29, 33 |

---

## Implementation Steps

---

### Step 1: Bounded Context Glossary + PowerShell Naming Conventions + Context Map

**Tier:** 1

**Files:**
- `packages/vibe-cli/bus/bounded-context-glossary.psd1` (create)
- `packages/vibe-cli/bus/event-types/event-context-map.psd1` (create)
- `packages/vibe-cli/bus/bounded-context-contracts.psd1` (create)
- `packages/vibe-cli/bus/bounded-context-map.md` (create)
- `packages/vibe-cli/tools/check-tla-name-leaks.ps1` (create)
- `packages/vibe-cli/tools/check-bdd-tags.ps1` (create)
- `packages/vibe-cli/tools/none-reason-tokens.psd1` (create)
- `packages/vibe-cli/tests/bus/unit/bounded-context.Tests.ps1` (create)

**Description:**

**OBJ-R3-15 (Ubiquitous Language + Bounded Context):** Before any implementation file is written, establish the naming bridge between the TLA+ formal spec and PowerShell identifiers. TLA+ camelCase variable names (e.g., `nextEvtId`, `busStatus`, `commitLockHolder`) must never appear as PowerShell identifiers. This step defines the authoritative mapping and enforces it via CI lint.

`bounded-context-glossary.psd1` maps every TLA+ variable to its PowerShell counterpart:
- `nextEvtId` → `$NextEventId`; `eventLog` → `event_log` (SQLite) / `$EventHistory` (in-memory); `routedIds` → `$DispatchedIds`; `busStatus` → `$BusLifecycleState`; `commitLockHolder` → `$CommitOwner`; `consensusRoundStart` → `$RoundEpoch`; `handlerPendingEpoch` → `$HandlerEpoch`; `groundTruthDelivered` → `$ContextDelivered`; `spawnedAtEvt` → `$SpawnEpoch`; `deadAtEvt` → `$DeathEpoch`; `pipeline_lock` → `$PipelineLock`

`event-context-map.psd1` assigns the 16 event types across four bounded contexts:
- **AgentLifecycle**: `bootstrap`, `ground_truth`, `done`, `checkpoint`, `checkpoint_response`
- **Consensus**: `objection`, `objection_response`, `consensus_candidate`, `consensus_ratified`, `consensus_failed`
- **Verification**: `verify`, `verify_result`, `review_requested`, `review_verdict`
- **ProtocolError**: `protocol_error`, `protocol_error_ack`

`bounded-context-contracts.psd1` defines integration contracts as directed publisher → subscriber edges:
- AgentLifecycle publishes `done` → Consensus subscribes (triggers consensus round evaluation)
- Consensus publishes `consensus_ratified` / `consensus_failed` → AgentLifecycle subscribes (triggers halt)
- Verification publishes `verify_result` → AgentLifecycle subscribes (handler delivers to agent)
- ProtocolError publishes `protocol_error` → AgentLifecycle subscribes (blocks checkpoint)
- No cycles permitted in the contract graph.

`check-tla-name-leaks.ps1` uses the PowerShell AST (`[System.Management.Automation.Language.Parser]::ParseFile`) to walk all `VariableExpressionAst` nodes and flag any variable that exactly matches a TLA+ variable name (case-insensitive). This is added as a CI lint job in Step 32.

**OBJ-R5-8 (BDD Tag Lint):** `check-bdd-tags.ps1` reads `bdd.feature` and:
1. Fails with `[FAIL] BDD tag missing: Scenario '<title>' at line <N> has no @tla-action-N or @invariant-M tag.` for every Scenario block that lacks at least one `@tla-action-N` tag and at least one `@invariant-M` tag.
2. Scans every Given/When/Then step text for exact matches against the TLA+ `VARIABLES` block identifier list (camelCase, e.g., `nextEvtId`, `busStatus`, `consensusRoundStart`). Leaks surface as `[WARN] TLA+ identifier '<name>' found in BDD step text at line <N>. Use the PowerShell name from bounded-context-glossary.psd1 instead.`
3. Uses the AST parser for PowerShell step wrappers and plain-text regex for the `.feature` file.
`check-tla-name-leaks.ps1` is also updated (OBJ-R5-8) to call into `check-bdd-tags.ps1` step-text scanning when passed a `.feature` file path.

**None-Reason Token Enum (CHANGE 4):** `none-reason-tokens.psd1` defines the closed enum of valid tokens for the `@tla-action-none-reason` and `@invariant-none-reason` escape hatches. Valid tokens: `NOT_YET_SPECCED`, `INFRASTRUCTURE_ONLY`, `TEST_DOUBLE_ONLY`, `AGGREGATE_BOUNDARY`, `COMPOSITION_ROOT`. Any other token fails the `check-bdd-tags.ps1` lint gate. Both `@invariant-none-reason` and `@tla-action-none-reason` MUST reference a token from this closed enum.

**OBJ-DDD-2 (Proper Context Map):** `bounded-context-map.md` replaces the implicit component-diagram description with a formal DDD context map:
- **Upstream/Downstream relationships:** AgentLifecycle is upstream of Consensus (AgentLifecycle publishes `done` events that Consensus subscribes to). Consensus is upstream of AgentLifecycle for terminal events (`consensus_ratified`/`consensus_failed` trigger halt). Verification is a supporting domain — downstream of AgentLifecycle requests.
- **ACL boundaries:** The `HandlerAdapter` is an Anti-Corruption Layer between Verification and AgentLifecycle. The `ProtocolError` context acts as a conformist to the AgentLifecycle context (it does not shape the protocol, only reports violations to it).
- **Patterns:** AgentLifecycle ↔ Consensus is a **Customer-Supplier** partnership (both sides have interest in the protocol). AgentLifecycle → Verification is **Conformist** (Verification conforms to AgentLifecycle's verify/verify_result contract). Each integration point in `bounded-context-contracts.psd1` identifies its pattern type.

**OBJ-BDD-R3-2 (BDD Traceability Tag Schema):** `bounded-context-glossary.psd1` documents the tag schema used in `bdd.feature` scenarios:
- `@tla-action-N` — where N is the 1-based index from the "All 40 Named Actions" matrix; e.g., `@tla-action-29` = `RouterHaltsFeatureComplete`
- `@invariant-M` — where M is the 1-based index from the "All 22 Safety Invariants" matrix; e.g., `@invariant-15` = `MechanicalHaltHasCategory`
- Every BDD scenario that covers a TLA+ action or invariant must carry the corresponding tag(s); the CI `tla-name-lint` job validates tag correctness against the matrix

**Dependencies:** None

**Test (write first):** Verify `bounded-context-glossary.psd1` contains an entry for every TLA+ variable name listed in the `VARIABLES` block of `BidirectionalComms.tla`. Verify `event-context-map.psd1` covers all 16 event types with no overlap and no gaps (partition check). Verify the four bounded contexts are named exactly as above. Verify `bounded-context-contracts.psd1` contract graph has no cycles (topological sort check). Verify `check-tla-name-leaks.ps1` flags a test file containing `$nextEvtId` (exact match). Verify `check-tla-name-leaks.ps1` does NOT flag `$NextEventId` (correct PowerShell name). Verify `check-tla-name-leaks.ps1` does NOT flag the glossary file itself (excluded from scan). Verify comments referencing TLA+ names (e.g., `# nextEvtId`) are NOT flagged (only variable AST nodes, not comment text). **OBJ-DDD-2:** Verify `bounded-context-map.md` exists and contains sections: "Upstream/Downstream", "ACL Boundaries", "Integration Patterns". Verify each of the 4 contexts appears in the map. Verify no directed cycle exists in the dependency arrows (extract graph from markdown and run topological sort). **OBJ-BDD-R3-2:** Verify `bounded-context-glossary.psd1` contains `BddTagSchema` key with `@tla-action-N` and `@invariant-M` patterns. Verify tag `@tla-action-29` maps to action name `RouterHaltsFeatureComplete`. Verify tag `@invariant-15` maps to invariant name `MechanicalHaltHasCategory`. **OBJ-R5-8:** Verify `check-bdd-tags.ps1` emits `[FAIL]` for a Scenario with no `@tla-action-N` tag. Verify it passes for a Scenario with `@tla-action-29 @invariant-15` tags. Verify it emits `[WARN]` for Given/When/Then text containing `nextEvtId` (TLA+ identifier leak). Verify it does NOT flag `$NextEventId` (PowerShell name). Verify `check-bdd-tags.ps1` exits non-zero on [FAIL], exits 0 on [WARN]-only. Verify running against a `.feature` file with 0 tagged scenarios causes exit non-zero.

**TLA+ Coverage:**
- Constants: `EventTypes`, `ConsensusEventTypes`, `ProtocolBookkeepingEventTypes`, `DomainEventTypes`
- Invariants: `TypeSenderACL` (bounded context partitioning is the structural enforcement)

---

### Step 1b: TLA+ Action → Aggregate Cascade Map

**Tier:** 1

**Files:**
- `packages/vibe-cli/docs/bidirectional-comms/tla-action-aggregate-cascade.md` (create)

**Description:**

Single authoritative document mapping each of the 40 TLA+ actions to its primary-mover aggregate, follower updates, and atomic boundary. This document is the human-readable companion to `tla-trace-function-map.psd1` (Step 33a). It enables reviewers to trace any spec action to exactly one owning aggregate without reading implementation code.

Columns: TLA+ Action name, Primary-Mover Aggregate (e.g., AgentSession, ConsensusRound, BusLifecycle, RollbackCoordinator, CommitSerializer), Follower Aggregates updated in the same atomic boundary, PowerShell function entry point, atomic boundary type (SQLite `BEGIN IMMEDIATE`, `[Interlocked]` CAS, OS rename, or none).

This document can be drafted purely from the TLA+ spec — no implementation files need to exist yet.

**Dependencies:** None (drafted from spec alone)

**Test (write first):** Verify `tla-action-aggregate-cascade.md` exists and contains exactly 40 rows (one per TLA+ action). Verify every action name in the document matches an action name in `BidirectionalComms.tla`. Verify every Primary-Mover Aggregate name matches a module in `bus/domain/` or `bus/router/`. Verify no action row is missing the `atomic-boundary` column value.

**TLA+ Coverage:** All 40 named actions mapped to implementation aggregates.

---

### Step 2: event_log Table + Append-Only Trigger + Query Indices + Compaction

**Tier:** 1

**Files:**
- `packages/vibe-cli/bus/schema/event-log.sql` (create)
- `packages/vibe-cli/tests/bus/integration/event-log-schema.Tests.ps1` (create)

**Description:**

**OBJ-R3-7 (TDD-sized decomposition of old Step 1):** Create only the `event_log` table, its append-only protection trigger, four query indices, and the compaction/retention subsystem. Nothing else.

**event_log columns:** `evt_id` (INTEGER PRIMARY KEY), `from` (TEXT NOT NULL), `to` (TEXT NOT NULL), `in_reply_to` (INTEGER), `group_id` (TEXT), `type` (TEXT NOT NULL), `payload` (TEXT — JSON), `status` (TEXT NOT NULL DEFAULT 'routed').

**Append-only trigger:** `BEFORE UPDATE ON event_log`: reject any status transition that is not `routed → committed` or `routed → delivery_failed`. `BEFORE DELETE ON event_log`: unconditionally raise an error (event_log rows are permanent; compaction uses `event_log_archive`).

**OBJ-R3-2 (Query Indices):** Four indices to prevent full-table scans as log grows:
- `idx_event_log_to_evtid` ON `event_log(to, evt_id)` — ground-truth composition queries per recipient agent
- `idx_event_log_type_evtid` ON `event_log(type, evt_id)` — consensus lookup (CandidateHasEventInLog, consensusRoundStart scoping)
- `idx_event_log_from_evtid` ON `event_log(from, evt_id)` — sender-side queries (TypeSenderACL audit)
- `idx_event_log_status` ON `event_log(status)` — delivery_failed queries

**OBJ-R3-2 (Compaction/Retention):** `event_log_archive` table with identical schema. Compaction function `Invoke-EventLogCompaction` runs at bus startup (called from migration runner, Step 4). Archives rows with `evt_id < (SELECT MAX(evt_id) - retain_events FROM event_log)` where `retain_events` defaults to 10,000 (stored in `settings` table). Compaction MUST NOT archive any row whose `evt_id` is referenced by `committedDoneEvts` (read from `bus_state` table, Step 4) or is `>= consensusRoundStart`. Compaction is a separate SQLite transaction from normal event routing and may be deferred if the bus is under load.

**Dependencies:** None

**Test (write first):** Verify `event_log` table has exactly 8 columns with correct types. Verify `BEFORE UPDATE` trigger rejects `committed → routed` (backward transition). Verify trigger allows `routed → committed`. Verify trigger allows `routed → delivery_failed`. Verify `BEFORE DELETE` trigger always raises error. Verify all four indices exist (query `sqlite_master`). Verify `EXPLAIN QUERY PLAN` for a `WHERE to=? AND evt_id >= ?` query uses `idx_event_log_to_evtid`. Verify `EXPLAIN QUERY PLAN` for a `WHERE type=? AND evt_id >= ?` query uses `idx_event_log_type_evtid`. Verify `Invoke-EventLogCompaction` archives rows beyond retain_events. Verify compaction does NOT archive any row with `evt_id IN (committedDoneEvts)`. Verify compaction does NOT archive any row with `evt_id >= consensusRoundStart`. Verify compaction is idempotent (run twice → same result).

**TLA+ Coverage:**
- Variables: `eventLog` (event_log table schema and protection)
- Invariants: `NoDuplicateEvtId`, `ExactlyOneBootstrapPerLifetime`

---

### Step 3: agent_sessions Table + Alive Identity Index

**Tier:** 1

**Files:**
- `packages/vibe-cli/bus/schema/agent-sessions.sql` (create)
- `packages/vibe-cli/tests/bus/integration/agent-sessions-schema.Tests.ps1` (create)

**Description:**

**OBJ-R3-7 (TDD-sized decomposition):** Create only the `agent_sessions` table and its alive-identity index.

**agent_sessions columns:** `session_id` (TEXT PRIMARY KEY), `feature_name` (TEXT NOT NULL), `role` (TEXT NOT NULL), `instance_name` (TEXT NOT NULL), `pid` (INTEGER), `status` (TEXT NOT NULL DEFAULT 'alive'), `group_id` (TEXT), `checkpoint_json` (TEXT), `started_at` (TEXT NOT NULL), `ended_at` (TEXT), `checkpointed_at` (TEXT), `checkpointed_at_mono` (INTEGER — Stopwatch ticks, NULL until first checkpoint, intra-session only), `session_mono_epoch` (INTEGER NOT NULL), `role_schema_version` (INTEGER NOT NULL DEFAULT 1), `spawned_at_evt` (INTEGER NOT NULL DEFAULT 1).

**OBJ-R3-7 / OBJ-IMP-6:** `spawned_at_evt` stores `spawnedAtEvt[a]` as a durable value. On respawn (Step 24), this column is updated BEFORE the new process is launched so -Resume can detect a discrepancy (epoch updated, no alive process) and recover cleanly.

**Alive identity index:** `idx_agent_sessions_alive_identity` — UNIQUE partial index ON `agent_sessions(feature_name, role, instance_name) WHERE status='alive'`. Prevents two alive rows for the same logical agent.

**Dependencies:** None

**Test (write first):** Verify `agent_sessions` has exactly 15 columns with correct types. Verify `session_mono_epoch` is NOT NULL (insert without it → constraint error). Verify `role_schema_version` defaults to 1. Verify `checkpointed_at_mono` is NULL on insert and accepts a BIGINT on update. Verify `spawned_at_evt` defaults to 1. Verify `idx_agent_sessions_alive_identity` prevents two alive rows with the same (feature_name, role, instance_name). Verify the index does NOT prevent two rows with the same identity when one has `status='ended'`. Verify `status` values other than 'alive' / 'ended' / 'spawning' / 'checkpointing' / 'renewing' are accepted at the schema level (status constraint is enforced by the aggregate in Step 11, not by a CHECK constraint here — to avoid migration complexity on future status additions).

**TLA+ Coverage:**
- Variables: `agentStatus`, `agentWorktree`, `spawnedAtEvt`, `checkpointStored`
- Invariants: `ExactlyOneBootstrapPerLifetime`

---

### Step 4: Schema Migration Runner + User-Side Deployment Story

**Tier:** 1

**Files:**
- `packages/vibe-cli/bus/schema/migration.ps1` (create)
- `packages/vibe-cli/bus/schema/migration-down.ps1` (create)
- `packages/vibe-cli/bus/schema/generate-schema-hash.ps1` (create)
- `packages/vibe-cli/bus/schema/settings.sql` (create)
- `packages/vibe-cli/bus/schema/bus-state.sql` (create)
- `packages/vibe-cli/vibe.ps1` (modify — add schema-migrate, schema-rollback, schema-backup, reset subcommands)
- `packages/vibe-cli/docs/bidirectional-comms/migration-playbook.md` (create)
- `packages/vibe-cli/docs/bidirectional-comms/bdd.feature` (modify — add schema-migrate scenario)
- `packages/vibe-cli/tests/bus/integration/migration.Tests.ps1` (create)

**Description:**

**OBJ-R3-5 (User-Side Deployment Story):** The migration runner must detect an existing SQLite database with old tables (`debate_state`, `stage_outputs`, `tier_progress`) and refuse to proceed silently. When old tables are detected, it must emit: `[ERROR] Existing pipeline database contains incompatible tables (debate_state, stage_outputs, tier_progress). Run 'vibe schema-migrate' to migrate, or 'vibe reset' to discard. Pipeline halted.` These commands must actually exist before any error message references them.

**OBJ-R3-4 (Forward/Back Migration Pair):** `migration.ps1` (forward): creates all tables in the correct order, drops old tables only after backup confirmed. `migration-down.ps1` (backward): recreates `debate_state`, `stage_outputs`, `tier_progress` from the pre-migration backup; removes bus tables. Both scripts are idempotent.

**vibe subcommands added:**
- `vibe schema-migrate`: runs `migration.ps1` with user confirmation prompt before any destructive operation
- `vibe schema-rollback`: runs `migration-down.ps1` restoring from backup path `$env:VIBE_BUS_BACKUP_PATH`
- `vibe schema-backup`: copies current SQLite to `$env:VIBE_BUS_BACKUP_PATH/vibe-bus-<ISO8601>.db`
- `vibe reset`: archives current SQLite to temp and creates a fresh database

**settings table:** Key-value store: `(key TEXT PRIMARY KEY, value TEXT)`. Rows written at migration time: `evt_path_strategy` (value: `'hash'` or `'full'`), `retain_events` (value: `'10000'`), `tla_spec_version` (value: read from spec header comment, e.g., `'v12'`), `current_schema_version` (value from `agent-schema-version.psd1`).

**bus_state table:** `(key TEXT PRIMARY KEY, value TEXT)`. Used by compaction (Step 2) for `committedDoneEvts` and `consensusRoundStart` durable storage.

`pipeline_lock` is stored as a `bus_state` row: `key='pipeline_lock', value='true'/'false'`.

**migration-playbook.md** documents the full operator procedure: backup → migrate → verify → stage-by-stage rollout → rollback steps if any stage fails.

**OBJ-CD-4 (Migration-Down Data-Loss Safety):** `migration-down.ps1` (backward migration) now has three additional safeguards:
1. **Pre-rollback snapshot:** Before any DROP or destructive operation, `migration-down.ps1` calls `Invoke-MigrationBackup` which copies the current `vibe-bus.db` to `.vibe/backups/<ISO8601-timestamp>/vibe-bus.db`. If the backup target path would exceed MAX_PATH, use SHA-256 truncation (reusing the `long-path-check.ps1` strategy from Step 5). If backup fails, refuse to proceed: `[ERROR] Pre-rollback snapshot failed. Cannot proceed with migration-down to prevent data loss.`
2. **Refusal protocol for unmigrated-row drops:** Before `DROP TABLE IF EXISTS event_log`, count rows: `SELECT COUNT(*) FROM event_log WHERE status='routed'`. If count > 0, emit: `[ERROR] migration-down refused: event_log contains <N> undelivered routed rows. Commit or discard pending events before rolling back. Use --force to override.` Only `--force` flag bypasses this; `--force` still takes the snapshot.
3. **Post-rollback integrity check:** `Invoke-MigrationIntegrityCheck` runs after migration-down completes: verifies `debate_state`, `stage_outputs`, `tier_progress` tables exist; verifies row counts match pre-rollback snapshot values (reads counts from snapshot manifest); verifies no bus tables remain; emits `[INFO] Migration-down integrity check passed` or `[ALARM] Migration-down integrity check FAILED: <detail>`.

**OBJ-CD-8 (Schema-Hash Pinning):** `generate-schema-hash.ps1` runs as the final step of `migration.ps1`. It reads all DDL statements from the created tables (via `SELECT sql FROM sqlite_master WHERE type='table' ORDER BY name`) and writes the SHA-256 of the concatenated DDL to `packages/vibe-cli/bus/schema/schema-hash.txt`. This file is committed alongside code. The `settings` table row `schema_hash` stores the same value at migration time. Step 5 (`Open-BusDatabase`) validates the runtime DB's hash against `schema-hash.txt` at every connect.

**OBJ-BDD-R3-1 (bdd.feature Scenario — schema-migrate):** The following Gherkin scenario is added to `bdd.feature`:
```gherkin
@tla-action-13 @invariant-4
Scenario: vibe schema-migrate detects incompatible legacy tables
  Given the vibe pipeline database contains legacy tables "debate_state", "stage_outputs", "tier_progress"
  When I run "vibe schema-migrate" without the --confirm flag
  Then the output contains "[ERROR] Existing pipeline database contains incompatible tables (debate_state, stage_outputs, tier_progress). Run 'vibe schema-migrate' to migrate, or 'vibe reset' to discard. Pipeline halted."
  And the exit code is non-zero
  And no legacy table rows have been modified

@tla-action-13 @invariant-13
Scenario: migration-down refuses to drop rows in-flight without --force
  Given the event_log table contains 3 rows with status "routed"
  When I run "vibe schema-rollback" without the --force flag
  Then the output contains "[ERROR] migration-down refused: event_log contains 3 undelivered routed rows"
  And the exit code is non-zero
  And the event_log table is unchanged
```

**Round 7 Additions (OBJ-R7-DDD-1, OBJ-R7-TLA-3, OBJ-R7-EC-3):**

**Aggregate State Table Split (OBJ-R7-DDD-1):** `bus-state.sql` is replaced by three purpose-scoped table files, each owned exclusively by one aggregate:

1. `bus_lifecycle_state` (key TEXT PRIMARY KEY, value TEXT) — owned by BusLifecycle aggregate (Step 36). Initial keys: `bus_status`, `halt_reason`, `failure_category`, `pipeline_lock`, `halt_intent_reason`, `halt_intent_category` (halt-intent journal for EC-1 fix).
2. `consensus_state` (key TEXT PRIMARY KEY, value TEXT) — owned by ConsensusRound aggregate (Step 12). Initial keys: `consensus_state`, `unresolved_objections` (JSON array), `overridden_objections` (JSON array), `consensus_round_start`.
3. `rollback_state` (key TEXT PRIMARY KEY, value TEXT) — owned by RollbackCoordinator (Step 29). Initial keys: `rollback_requested`, `rollback_target_worktree`, `snapshot_exists_<w>`, `snapshot_hash_<w>`.

`migration.ps1` creates all three tables. `migration-down.ps1` drops all three. `bus-state.sql` file is deleted. `check-tla-symbol-parity.ps1` (Step 32) enforces the boundary: fails CI if any aggregate reads/writes a table it does not own.

**Schema-Hash Canonicalization (OBJ-R7-TLA-3):** `generate-schema-hash.ps1` is now precisely specified:
- Encoding: UTF-8, no BOM
- Line-ending normalization: CRLF → LF before hashing (PowerShell: `$sql -replace '\r\n', '\n'`)
- Statement ordering: DDL statements sorted alphabetically by table name
- Hash algorithm: SHA-256, hex lowercase
- Algorithm tag: writes `schema_hash_algorithm=sha256-canonical-v1` row to `settings` table at migration time
- Upgrade path: if `schema_hash_algorithm` row is missing (pre-canonicalization database), compute hash with new algorithm, write the row, emit `[INFO] Schema hash algorithm upgraded to sha256-canonical-v1` — no halt.

**Schema-Hash Canary Rollout Safety (OBJ-R7-EC-3):** `generate-schema-hash.ps1` writes both a `schema_hash` key (current migration hash) and a `previous_schema_hash` key (hash from the previous migration version, sourced from a `schema-hash-history.json` file updated by the migration runner). `Open-BusDatabase` accepts EITHER the current or previous hash during a canary window of `VIBE_CANARY_SCHEMA_WINDOW_HOURS` hours (default 2). After the window, only the current hash is accepted. This allows writer (new schema) and reader (old schema) processes to coexist during a rolling canary deploy without triggering hash-mismatch halts.

New files added by Round 7:
- `packages/vibe-cli/bus/schema/bus-lifecycle-state.sql` (replaces bus-state.sql for lifecycle keys)
- `packages/vibe-cli/bus/schema/consensus-state.sql` (consensus aggregate table)
- `packages/vibe-cli/bus/schema/rollback-state.sql` (rollback aggregate table)
- `packages/vibe-cli/bus/schema/schema-hash-history.json` (tracks prior migration hash for canary window)
- `packages/vibe-cli/bus/infra/feature-flag-sunset-manifest.psd1` (flag sunset policy — see CHANGE 18)

**Flag-Removal Policy (CHANGE 18):** Every `VIBE_STAGE_N_BIDIR` feature flag ships with: (a) a sunset ticket reference in the flag definition comment, (b) a hard-removal commit target in Tier 11 (the flag file is deleted, not commented out). `packages/vibe-cli/bus/infra/feature-flag-sunset-manifest.psd1` lists all active flags with their sunset dates. T32 CI gate asserts no flag is past its sunset date.

**Test (write first):** Verify migration on fresh DB creates all required tables (event_log, agent_sessions, settings, bus_lifecycle_state, consensus_state, rollback_state, event_log_archive). Verify `settings` has rows for evt_path_strategy, retain_events, tla_spec_version, current_schema_version, schema_hash. Verify migration on a DB with debate_state table emits [ERROR] and does NOT proceed. Verify `vibe schema-migrate` exists as a real subcommand and prompts for confirmation. Verify `vibe schema-rollback` fails with clear error when VIBE_BUS_BACKUP_PATH is not set. Verify `vibe reset` creates a fresh database and archives the old one. Verify migration is idempotent (run twice on already-migrated DB → no error, no duplicate tables). Verify migration-down.ps1 recreates debate_state, stage_outputs, tier_progress from backup. Verify migration-down.ps1 is idempotent. **OBJ-CD-4:** Verify migration-down creates `.vibe/backups/<timestamp>/vibe-bus.db` before any DROP. Verify migration-down refuses when routed_rows > 0 and no --force flag. Verify --force flag bypasses refusal but still takes snapshot. Verify `Invoke-MigrationIntegrityCheck` passes on clean rollback; emits [ALARM] when a legacy table is missing after rollback. **OBJ-CD-8:** Verify `generate-schema-hash.ps1` writes `schema-hash.txt`; verify SHA-256 is stable across two runs on identical DDL; verify altering a table DDL changes the hash. **OBJ-R7-DDD-1:** Verify `bus_state` table does NOT exist after migration (replaced by three tables). Verify `bus_lifecycle_state` has correct keys after `Invoke-BusStart`. Verify `consensus_state` has correct keys after `Invoke-EmitCandidate`. Verify `rollback_state` has correct keys after `Invoke-BusTakeSnapshot`. Verify `check-tla-symbol-parity.ps1` fails when Step 36 code writes to `consensus_state` table (cross-ownership violation). **OBJ-R7-TLA-3:** Verify `generate-schema-hash.ps1` produces identical hash on Windows (CRLF) and Linux (LF) for same DDL (mock both line endings). Verify `settings.schema_hash_algorithm='sha256-canonical-v1'` written after migration. Verify upgrade path: DB missing `schema_hash_algorithm` row → hash computed and row written → no halt. **OBJ-R7-EC-3:** Verify `Open-BusDatabase` accepts previous_schema_hash during canary window (mock `VIBE_CANARY_SCHEMA_WINDOW_HOURS=1`, current time within window). Verify rejects previous hash after window expires. Verify `schema-hash-history.json` updated after each migration run.

**TLA+ Coverage:**
- Variables: `pipeline_lock`, `eventLog` (settings/bus_state infrastructure)
- Invariants: `BusRunningImpliesLockHeld`

---

### Step 5: Open-BusDatabase Infrastructure (WAL PRAGMA + Long-Path + Timestamps)

**Tier:** 1

**Files:**
- `packages/vibe-cli/bus/schema/open-bus-database.ps1` (create)
- `packages/vibe-cli/bus/schema/long-path-check.ps1` (create)
- `packages/vibe-cli/tests/bus/unit/open-bus-database.Tests.ps1` (create)

**Description:**

**OBJ-R3-7 (TDD-sized decomposition):** All infrastructure that was bundled in old Step 1 but is independent of table definitions now lives here.

**OBJ-EC-7 (WAL PRAGMA at Every Connect):** `Open-BusDatabase` is the single function all bus modules call to get a SQLite connection. Immediately after opening, it executes `PRAGMA journal_mode=WAL`. If the returned value ≠ `'wal'`, halt with: `[ALARM] SQLite journal_mode downgraded to '<mode>'. An external tool may have modified the database. Pipeline halted to prevent data corruption. Restore WAL mode with: sqlite3 vibe-bus.db 'PRAGMA journal_mode=WAL'`. Then executes `PRAGMA wal_autocheckpoint=0` (OBJ-R5-13: auto-checkpointing disabled to prevent nondeterministic WAL drain during rollback and other multi-operation sequences). Manual checkpointing is performed by `Invoke-BusWalCheckpoint` only.

**OBJ-R5-13 (Manual WAL Checkpoint):** `Invoke-BusWalCheckpoint` runs `PRAGMA wal_checkpoint(TRUNCATE)` and returns the number of WAL frames checkpointed. Called at: (a) bus clean shutdown (after all SQLite writes complete, before process exit); (b) bus startup before first read (to recover from a previous crash that left a partially checkpointed WAL). Emits `[INFO] WAL checkpoint: <N> frames checkpointed.` If checkpoint returns `busy` (another reader holds a read transaction), emits `[WARN] WAL checkpoint deferred: readers active. WAL size may grow.`

**OBJ-IMP-3 / OBJ-EC-8 (MAX_PATH + Short-Name Normalization):** `Invoke-LongPathCheck` runs at bus startup. Normalization sequence: (1) call `[System.IO.Path]::GetFullPath($path)` to resolve relative paths; (2) call `(Get-Item $path).FullName` to expand NTFS 8.3 short-name aliases (e.g., `C:\PROGRA~1\` → `C:\Program Files\`); (3) if resulting path length > 250 chars, use SHA-256 first-16-hex strategy for file segments; (4) write strategy to `settings` table row `evt_path_strategy`. Emits [WARN] when LongPathsEnabled registry key = 0.

**OBJ-IMP-4 / OBJ-EC-9 (Monotonic Timestamps):** `Get-BusMonoTimestamp` returns `[System.Diagnostics.Stopwatch]::GetTimestamp()`. `session_mono_epoch` is set to this value at process startup (stored in a process-level variable and written to `agent_sessions.session_mono_epoch` at session creation). **Cross-session comparison rule:** `checkpointed_at_mono` values from rows with different `session_mono_epoch` values MUST NOT be compared; use `checkpointed_at` (wall-clock ISO 8601 UTC) for cross-session ordering and accept NTP imprecision for that comparison.

**OBJ-CD-8 (Schema-Hash Validation at Every Connect):** After the WAL PRAGMA assertion, `Open-BusDatabase` reads the `schema_hash` value from the `settings` table (if present) and compares it to the content of `packages/vibe-cli/bus/schema/schema-hash.txt` (the committed reference). If the values differ, halt immediately with: `[ALARM] SQLite schema hash mismatch: expected <expected>, found <actual>. Schema may have been modified outside the migration runner. Restore from backup or run 'vibe schema-migrate'. Pipeline halted.` If `schema-hash.txt` does not exist (Tier-1 pre-migration state), skip the check. If the `settings` table does not yet contain a `schema_hash` row (first connect after migration), read the current DDL, compute the hash, and write it — then proceed. This "first connect sets the pin" pattern ensures the hash is always present after the first successful migration.

**Round 7 Additions (OBJ-R7-PERF-2, OBJ-R7-TDD-3, OBJ-R7-TLA-3):**

**WAL Growth Monitor (OBJ-R7-PERF-2):** `Open-BusDatabase` measures the WAL file size (`"$dbPath-wal"`) on every connection open:
- WAL size ≥ 10 MB: emit `[WARN] WAL file size is <N> MB (threshold: 10 MB). Consider running Invoke-BusWalCheckpoint.`
- WAL size ≥ 50 MB: emit `[ALARM] WAL file size is <N> MB. Triggering emergency checkpoint.`; immediately call `Invoke-BusWalCheckpoint`
- `$WalWarnThresholdMb` and `$WalAlarmThresholdMb` are configurable via `soak-thresholds.psd1` keys `wal_warn_threshold_mb` (default 10) and `wal_alarm_threshold_mb` (default 50).
- `Invoke-BusWalCheckpoint` is also triggered: (a) after every 1000 `Invoke-BusAppendEvent` calls (tracked via `$script:AppendEventCallCount` Interlocked counter, configurable via `wal_checkpoint_interval_ops` setting); (b) before any rollback operation (called by RollbackCoordinator.Step 29 before `BEGIN IMMEDIATE`); (c) at clean shutdown.

**Canonical Clock Abstraction (OBJ-R7-TDD-3):** `open-bus-database.ps1` exports a single module-level scriptblock:
```powershell
$script:GetUtcNow = { [DateTime]::UtcNow }
```
This is the ONLY place in the `bus/` directory where `[DateTime]::UtcNow` is permitted as a LITERAL expression (inside this assignment). All other bus modules call `& $GetUtcNow` (imported from this module) for any time-sensitive operation. Test harness sets `$script:GetUtcNow = { $MockClock.Now }` before running tests. The `no-real-time` CI gate (Step 32) is updated: it allows `[DateTime]::UtcNow` only when it appears as the body of the `$script:GetUtcNow =` assignment in `open-bus-database.ps1`; all other occurrences fail CI.

**Schema Hash Algorithm Verification (OBJ-R7-TLA-3):** After the WAL PRAGMA assertion and schema-hash check, `Open-BusDatabase` reads the `schema_hash_algorithm` setting row. If the value is not `sha256-canonical-v1` (or a later version explicitly listed in an allowed-algorithms array), halt with: `[ALARM] Unknown schema hash algorithm '<value>'. Database may have been migrated with an incompatible tool. Run 'vibe schema-migrate'. Pipeline halted.` If the row is absent (legacy database without algorithm tag), treat as pre-canonicalization, compute hash, write algorithm row, emit `[INFO] Schema hash algorithm set to sha256-canonical-v1 (first connect after upgrade).`

**Dependencies:** None

**Test (write first):** Verify `Open-BusDatabase` executes `PRAGMA journal_mode=WAL` on every call. Verify `Open-BusDatabase` halts with [ALARM] when the mock SQLite driver returns `'delete'` for journal_mode. Verify `Invoke-LongPathCheck` emits [WARN] when LongPathsEnabled=0 (mock registry). Verify a path containing an NTFS 8.3 alias (`PROGRA~1`) is expanded before the length check (mock path resolver). Verify `Get-BusMonoTimestamp` returns a non-zero integer. Verify `session_mono_epoch` set at process startup is stable within a single test run. Verify [ALARM] message contains the sqlite3 recovery command verbatim. **OBJ-CD-8:** Verify schema-hash mismatch halts with [ALARM] containing both expected and actual hashes; verify the exact `vibe schema-migrate` recovery instruction appears in the message. Verify when `schema-hash.txt` is absent, no halt occurs. Verify "first connect sets the pin" writes the hash to `settings` table and does not halt. **OBJ-R5-13:** Verify `Open-BusDatabase` executes `PRAGMA wal_autocheckpoint=0` (not 1000). Verify `Invoke-BusWalCheckpoint` runs `PRAGMA wal_checkpoint(TRUNCATE)` and returns frame count. Verify [INFO] message contains frame count. Verify [WARN] emitted when checkpoint returns busy (mock SQLite returning busy status). Verify shutdown sequence calls `Invoke-BusWalCheckpoint` before process exit. Verify startup sequence calls `Invoke-BusWalCheckpoint` before first `SELECT`. **OBJ-R7-PERF-2:** Verify `Open-BusDatabase` emits `[WARN]` when WAL file size = 10 MB (mock `Get-Item` returning 10MB size). Verify emits `[ALARM]` and calls `Invoke-BusWalCheckpoint` when WAL ≥ 50 MB. Verify `PRAGMA wal_autocheckpoint=0` still set (not overridden by emergency checkpoint). Verify `soak-thresholds.psd1` keys `wal_warn_threshold_mb` and `wal_alarm_threshold_mb` are read at startup. **OBJ-R7-TDD-3:** Verify `open-bus-database.ps1` exports `$script:GetUtcNow` scriptblock. Verify test harness overrides produce correct mock times in downstream callers. Verify `no-real-time` CI gate passes when `[DateTime]::UtcNow` appears ONLY in `$script:GetUtcNow =` assignment; fails when `[DateTime]::UtcNow` appears in any other location in `bus/`. **OBJ-R7-TLA-3:** Verify unknown `schema_hash_algorithm='sha256-v2'` halts with [ALARM] containing exact recovery instruction. Verify absent algorithm row triggers first-connect upgrade path (no halt, writes row, emits [INFO]).

**TLA+ Coverage:** Infrastructure — supports all steps that use SQLite.

---

### Step 6: evt_id Allocator

**Tier:** 1

**Files:**
- `packages/vibe-cli/bus/router/evt-id-allocator.ps1` (create)
- `packages/vibe-cli/tests/bus/unit/evt-id-allocator.Tests.ps1` (create)

**Description:**

Implement a thread-safe monotonically increasing `evt_id` allocator using `[System.Threading.Interlocked]::Increment` on a shared `[int64]` counter. The allocator detects when the next value would exceed `[Int64]::MaxValue` and raises a mechanical-error signal (`RouterHaltsBoundReached`). The allocator is initialized from the highest existing `evt_id` in `event_log` at bus startup. Tests run under 50ms each per BDD @unit budget.

**Dependencies:** None

**Test (write first):** Verify 100 consecutive calls return strictly increasing values. Verify two concurrent callers from separate threads return distinct evt_ids. Verify exhaustion detection fires before wraparound. Verify the synchronization primitive is explicitly named (`[System.Threading.Interlocked]`). Verify the allocator resets between tests (no cross-test leakage). All assertions complete in under 50ms.

**TLA+ Coverage:**
- Variables: `nextEvtId`, `routedIds`
- Invariants: `EvtIdMonotone`, `NoDuplicateEvtId`
- Actions: `RouterHaltsBoundReached` (exhaustion path)

---

### Step 7: EventTypes Enum + Bounded Context Subsets + JSON Schemas

**Tier:** 1

**Files:**
- `packages/vibe-cli/bus/event-types/event-types.psd1` (create)
- `packages/vibe-cli/bus/event-types/bootstrap.schema.json` (create)
- `packages/vibe-cli/bus/event-types/ground_truth.schema.json` (create)
- `packages/vibe-cli/bus/event-types/done.schema.json` (create)
- `packages/vibe-cli/bus/event-types/objection.schema.json` (create)
- `packages/vibe-cli/bus/event-types/objection_response.schema.json` (create)
- `packages/vibe-cli/bus/event-types/consensus_candidate.schema.json` (create)
- `packages/vibe-cli/bus/event-types/consensus_ratified.schema.json` (create)
- `packages/vibe-cli/bus/event-types/consensus_failed.schema.json` (create)
- `packages/vibe-cli/bus/event-types/verify.schema.json` (create)
- `packages/vibe-cli/bus/event-types/verify_result.schema.json` (create)
- `packages/vibe-cli/bus/event-types/review_requested.schema.json` (create)
- `packages/vibe-cli/bus/event-types/review_verdict.schema.json` (create)
- `packages/vibe-cli/bus/event-types/checkpoint.schema.json` (create)
- `packages/vibe-cli/bus/event-types/checkpoint_response.schema.json` (create)
- `packages/vibe-cli/bus/event-types/protocol_error.schema.json` (create)
- `packages/vibe-cli/bus/event-types/protocol_error_ack.schema.json` (create)
- `packages/vibe-cli/bus/event-types/schema-validator.ps1` (create)
- `packages/vibe-cli/tests/bus/unit/event-types.Tests.ps1` (create)

**Description:**

**OBJ-R3-15 (Bounded Context Subsets):** `event-types.psd1` defines the closed enum of 16 event types AND re-exports the four bounded context groupings from `event-context-map.psd1` as named constants: `$AgentLifecycleEventTypes`, `$ConsensusEventTypes`, `$VerificationEventTypes`, `$ProtocolErrorEventTypes`. These four constants REPLACE the TLA+ derived sets `ConsensusEventTypes` and `ProtocolBookkeepingEventTypes` in PowerShell code — the bounded-context-map is the authoritative partition, not the TLA+ derived set names. The TLA+ set `DomainEventTypes` maps to `$AgentLifecycleEventTypes ∪ $VerificationEventTypes`. Implement `Test-BusEventPayload` that validates a payload hashtable against the type's schema. Schema loading is pre-cached.

**Dependencies:** Step 1 (bounded-context-map is the source of truth for partitions)

**Test (write first):** Verify all 16 types appear in the enum. Verify the four bounded-context constants partition the 16 values exactly (no overlap, no gap). Verify the union of AgentLifecycle + Verification matches TLA+ DomainEventTypes. Validate a sample valid payload for each of the 16 types — each call under 50ms. Verify a `done` payload missing "summary" is rejected with the field name identified. Verify an unknown type "foobar" is rejected. Verify `$ConsensusEventTypes` in PowerShell code is the bounded-context subset (5 types), not a TLA+ name leak. Entire @unit suite under 400ms.

**TLA+ Coverage:**
- Constants: `EventTypes`, `ConsensusEventTypes`, `ProtocolBookkeepingEventTypes`, `DomainEventTypes`
- Invariants: `ConsensusEventsRoutedThroughBus`, `TypeSenderACL`

---

### Step 8: Agent Role Definitions + System Prompt Templates

**Tier:** 1

**Files:**
- `packages/vibe-cli/bus/agents/agent-schema-version.psd1` (create)
- `packages/vibe-cli/bus/agents/tla-writer.ps1` (create)
- `packages/vibe-cli/bus/agents/bdd-writer.ps1` (create)
- `packages/vibe-cli/bus/agents/debate-moderator.ps1` (create)
- `packages/vibe-cli/bus/agents/review-moderator.ps1` (create)
- `packages/vibe-cli/bus/agents/coding-worker.ps1` (create)
- `packages/vibe-cli/bus/agents/reviewer.ps1` (create)
- `packages/vibe-cli/bus/agents/prompt-generator.ps1` (create)
- `packages/vibe-cli/tests/bus/unit/agent-roles.Tests.ps1` (create)

**Description:**

Define `agent-schema-version.psd1` with `CurrentSchemaVersion = 1`. Each role file exports: `AllowedSendTypes`, `AllowedReceiveTypes`, `LogicalScope`, `SystemPromptContent`, `SchemaVersion`. The `AllowedSendTypes` and `AllowedReceiveTypes` must be expressed using the bounded-context constants from Step 7 (e.g., `$AgentLifecycleEventTypes`, `$ConsensusEventTypes`), not raw string lists — so that adding a new type to a context automatically extends all roles that use that context. Implement `New-BusAgentSystemPrompt` in `prompt-generator.ps1`. The role loader validates `SchemaVersion = $CurrentSchemaVersion` at load time.

**Dependencies:** Steps 1, 7

**Test (write first):** Verify each of the 6 role files exports: AllowedSendTypes, AllowedReceiveTypes, LogicalScope, SystemPromptContent, SchemaVersion. Verify AllowedSendTypes for each role is a subset of the 16-type enum. Verify a role file with SchemaVersion=0 causes startup error when CurrentSchemaVersion=1. Verify a role file with SchemaVersion=2 causes startup error when CurrentSchemaVersion=1. Verify the temp system-prompt file is created on the filesystem. Verify AllowedSendTypes uses bounded-context constants (AST check: no raw string literals matching event type names in the role file's AllowedSendTypes assignment).

**TLA+ Coverage:**
- Actions: `DeliverBootstrap`, `RouterInitiatesCheckpoint`
- Invariants: `TypeSenderACL`

---

### Step 9: Test Doubles

**Tier:** 1

**Files:**
- `packages/vibe-cli/tests/helpers/claude-test-double.ps1` (create)
- `packages/vibe-cli/tests/helpers/git-test-double.ps1` (create)
- `packages/vibe-cli/tests/helpers/tlc-test-double.ps1` (create)
- `packages/vibe-cli/tests/helpers/tests-test-double.ps1` (create)
- `packages/vibe-cli/tests/bus/unit/test-doubles.Tests.ps1` (create)

**Description:**

Extend `claude-test-double.ps1` to accept NDJSON stream-json on stdin and emit valid NDJSON on stdout (system/init, assistant, result events). Support multi-turn without restarting. Accept configurable `total_tokens` injection for checkpoint threshold testing. Implement `git-test-double.ps1` with an in-memory simulated tree supporting: `add`, `commit`, `diff --cached`, `show`, `log` (with `Vibe-Event-Id` trailers). Implement `tlc-test-double.ps1` and `tests-test-double.ps1` that return configurable `verify_result` envelopes passing the schema. All doubles emit output format-compatible with production.

**OBJ-IMP-7 (Contract Parity Note):** Each double must export a `$OutputSchema` hashtable describing its expected output format. Step 34 verifies the real binary conforms to it.

**Dependencies:** None

**Test (write first):** Verify claude-test-double.ps1 emits valid NDJSON for a single turn. Verify it handles two consecutive turns without restart. Verify injected total_tokens appears in result.usage.total_tokens. Verify git-test-double.ps1 handles add+commit and returns expected log output with Vibe-Event-Id trailer. Verify tlc-test-double.ps1 and tests-test-double.ps1 return valid verify_result payloads. Verify each double exports $OutputSchema. Verify $OutputSchema is a non-empty hashtable with at least the top-level keys of the real binary output.

**TLA+ Coverage:** Not directly (test infrastructure). Enables all integration/e2e tests.

---

### Step 10: Write-PipelineLog Mutex + Log Infrastructure

**Tier:** 1

**Files:**
- `packages/vibe-cli/bus/router/pipeline-log.ps1` (create)
- `packages/vibe-cli/tests/bus/unit/pipeline-log.Tests.ps1` (create)

**Description:**

Implement `Write-PipelineLog` with named mutex `VibeBus-PipelineLog` serializing access to `[Console]::Out` and log file for multi-line writes. Log rotation: rename current file to `pipeline-log-<ISO8601>.log` when it reaches 50 MB; keep at most 5 archived files. Heartbeat method: `Write-HeartbeatBanner`.

**OBJ-IMP-1 (AbandonedMutexException — VibeBus-PipelineLog):** Wrap `[System.Threading.Mutex]::WaitOne()` in try/catch for `[System.Threading.AbandonedMutexException]`. When caught: emit `[WARN]` to stderr, increment "mutex-abandoned" degraded counter, continue critical section normally. Finally block always calls `ReleaseMutex()`.

**OBJ-EC-6 (Heartbeat Abandonment):** Heartbeat thread abandonment → partial banner discarded; next tick starts completely fresh banner. No reconstruction attempted.

**OBJ-EC-13 (Lock Hierarchy):** Formal acquisition order documented as a comment block at the top of `pipeline-log.ps1`:
- **Outer (acquired first):** `VibeBus-Commit-<WorktreeName>` — held during git commit sequence
- **Inner (acquired second or standalone):** `VibeBus-PipelineLog` — held only during log writes
- **Rule:** Never acquire `VibeBus-PipelineLog` while `VibeBus-Commit-<w>` is held. Release commit mutex before any post-commit log write.
- **Rule 3 (OBJ-R5-14):** Pre-commit hooks MUST NOT call any bus function — no `Invoke-BusAppendEvent`, no `Send-BusEvent`, no `Write-PipelineLog`. The env var `$env:VIBE_BUS_COMMIT_IN_PROGRESS` is set to `'1'` by `Start-WriteSession` before git commit is invoked and unset by `Complete-WriteSession`/`Fail-WriteSession`. Any bus function that would acquire a mutex checks this env var at entry. Violation is surfaced as `[ERROR]` before any mutex acquisition, preventing deadlock.

**OBJ-CD-7 (Mutex Lifecycle Telemetry):** After acquiring or releasing the `VibeBus-PipelineLog` mutex, emit a structured telemetry line to the pipeline log (at `[TELEMETRY]` severity, distinct from `[INFO]`/`[WARN]`/`[ALARM]`):
- Acquire: `[TELEMETRY] event=mutex.acquired mutex=VibeBus-PipelineLog thread_id=<N> waited_ms=<N>`
- Release: `[TELEMETRY] event=mutex.released mutex=VibeBus-PipelineLog thread_id=<N> held_ms=<N>`
- Orphan recovery: `[TELEMETRY] event=mutex.orphaned-recovered mutex=VibeBus-PipelineLog thread_id=<N>`
All three emit even if the pipeline log file cannot be written (write to stderr in that case). `held_ms` and `waited_ms` are computed from `[System.Diagnostics.Stopwatch]` (not wall-clock).

**Dependencies:** None

**Test (write first):** Verify concurrent callers do not interleave multi-line writes. Verify log rotation fires at threshold. Verify Write-HeartbeatBanner output contains UTF-8 box-drawing characters. Verify degraded counter emits exactly one [WARN] on first failure. Verify p99 mutex hold time ≤ 50ms over 1000 acquisitions. Verify AbandonedMutexException caught: main thread completes write, "mutex-abandoned" counter increments exactly once. Verify heartbeat thread abandonment → next Write-HeartbeatBanner succeeds with complete banner. Verify lock-hierarchy comment block present in pipeline-log.ps1 (AST check). **OBJ-CD-7:** Verify [TELEMETRY] event=mutex.acquired line emitted with non-negative waited_ms. Verify [TELEMETRY] event=mutex.released line emitted with held_ms ≤ 200ms (performance-baselines.json limit). Verify [TELEMETRY] event=mutex.orphaned-recovered emitted on AbandonedMutexException. Verify telemetry lines never interleave with log lines from other threads (mutex protects both). **OBJ-R5-14:** Verify lock-hierarchy comment block in `pipeline-log.ps1` contains Rule 3 text referencing `VIBE_BUS_COMMIT_IN_PROGRESS` (AST string check). Verify the rule 3 text names at least: `Invoke-BusAppendEvent`, `Send-BusEvent`, and `Write-PipelineLog` as banned pre-commit functions.

**TLA+ Coverage:** Supports observability for all liveness properties.

---

### Step 11: AgentSession Aggregate Root

**Tier:** 2 (depends on Steps 1, 3, 5)

**Files:**
- `packages/vibe-cli/bus/domain/agent-session.ps1` (create)
- `packages/vibe-cli/tests/bus/unit/agent-session-aggregate.Tests.ps1` (create)

**Description:**

**OBJ-R3-8 (AgentSession Aggregate Root):** All per-agent state that the TLA+ spec models in `agentStatus`, `agentWorktree`, `checkpointStored`, `checkpointResponseInFlight`, `groundTruthDelivered`, `spawnedAtEvt`, `deadAtEvt`, and `pendingProtocolError` is encapsulated in the `AgentSession` aggregate. No code outside this module may directly mutate `agent_sessions` rows. The aggregate exposes named transition methods that enforce invariants at the boundary:

- `New-AgentSession(role, instanceName, featureName, worktree, spawnEpoch)` — creates row with status='spawning'; enforces `ExactlyOneBootstrapPerLifetime` (alive-identity index prevents duplicate)
- `Invoke-AgentSessionBootstrap(sessionId)` — transitions spawning→alive; sets agentWorktree
- `Invoke-AgentSessionDeliverContext(sessionId)` — sets groundTruthDelivered (ContextDelivered) = TRUE; enforces `GroundTruthPrecedesAgentMessage` by refusing to set it twice in the same lifetime
- `Invoke-AgentSessionCheckpoint(sessionId)` — transitions alive→checkpointing; enforces `~pendingProtocolError` guard
- `Invoke-AgentSessionStoreCheckpoint(sessionId, checkpointJson, monoTimestamp)` — transitions checkpointing→renewing; sets checkpointStored=TRUE
- `Invoke-AgentSessionRespawn(sessionId, newSpawnEpoch)` — transitions renewing→spawning; resets groundTruthDelivered, handlerPendingEpoch; advances SpawnEpoch; writes new SpawnEpoch to SQLite BEFORE any process is launched
- `Invoke-AgentSessionCrash(sessionId, deathEpoch)` — transitions any→dead; clears pendingProtocolError. This method ONLY mutates AgentSession aggregate state. Cross-aggregate crash coordination (clearing commit locks, resetting handler state) is performed by `CrashCoordinationDomainService.Invoke-BusCrashCoordination` (Step 22). `Invoke-AgentSessionCrash` must NOT call CommitSerializer or HandlerAdapter directly (OBJ-R5-4: prevents anti-DDD cross-aggregate mutation from within an aggregate method).
- `Get-AgentSessionState(sessionId)` — returns read-only snapshot of all fields
- `Invoke-AgentSessionResume(sessionId, newSpawnEpoch)` — transitions dead→spawning (for -Resume path)

Invariants enforced at boundary: `SpawningAgentOnlyReceivesBootstrap` (check in routing layer via `Get-AgentSessionState`), `DeadAgentReceivesNoMessages` (routing layer checks status before dispatch), `ExactlyOneBootstrapPerLifetime` (alive-identity index + aggregate guards), `CommitLockHolderAliveOrBusHalted` (commit-lock cleanup called from Crash transition).

**Dependencies:** Steps 1, 3, 5

**Test (write first):** Verify `New-AgentSession` creates row with status='spawning' and correct session_mono_epoch. Verify `Invoke-AgentSessionBootstrap` transitions spawning→alive. Verify `Invoke-AgentSessionBootstrap` throws if called twice on same session (ExactlyOneBootstrapPerLifetime). Verify `Invoke-AgentSessionDeliverContext` sets ContextDelivered=TRUE; throws if called twice in same lifetime. Verify `Invoke-AgentSessionCheckpoint` fails when pendingProtocolError=TRUE. Verify `Invoke-AgentSessionRespawn` writes new SpawnEpoch to SQLite before returning (no process launcher called in this step). Verify `Invoke-AgentSessionCrash` transitions to 'dead' from 'alive', 'spawning', and 'checkpointing'. Verify `Invoke-AgentSessionCrash` does NOT accept 'renewing' (per TLA+ AgentCrashes guard). Verify `Get-AgentSessionState` returns immutable snapshot (mutation of returned object does not affect aggregate). Verify status='dead' after crash cannot be transitioned by any method other than `Invoke-AgentSessionResume`.

**TLA+ Coverage:**
- Variables: `agentStatus`, `agentWorktree`, `checkpointStored`, `checkpointResponseInFlight`, `groundTruthDelivered`, `spawnedAtEvt`, `deadAtEvt`, `pendingProtocolError`
- Actions: `DeliverBootstrap`, `AgentCrashes`, `RouterRespawnsAgent`, `RouterResumesAgent`
- Invariants: `SpawningAgentOnlyReceivesBootstrap`, `DeadAgentReceivesNoMessages`, `ExactlyOneBootstrapPerLifetime`, `GroundTruthPrecedesAgentMessage`, `CommitLockHolderAliveOrBusHalted`, `PendingProtocolErrorImpliesAgentAlive`, `NoOrphanedHandlerForDeadAgent`

---

### Step 12: ConsensusRound Aggregate

**Tier:** 2 (depends on Steps 1, 2, 5)

**Files:**
- `packages/vibe-cli/bus/domain/consensus-round.ps1` (create)
- `packages/vibe-cli/tests/bus/unit/consensus-round-aggregate.Tests.ps1` (create)

**Description:**

**OBJ-R3-8 (ConsensusRound Aggregate Root):** All consensus state that the TLA+ spec models in `unresolvedObjections`, `overriddenObjections`, `consensusState`, and `consensusRoundStart` is encapsulated in the `ConsensusRound` aggregate. No code outside this module may directly mutate consensus state. The aggregate exposes named transition methods:

- `Get-ConsensusRoundState()` — returns read-only snapshot: `{State, RoundEpoch, UnresolvedObjections, OverriddenObjections}`
- `Invoke-RaiseObjection(evtId)` — adds to UnresolvedObjections; guard: consensusState='open'
- `Invoke-ResolveObjection(objEvtId)` — removes from UnresolvedObjections; guard: objEvtId ∈ UnresolvedObjections
- `Invoke-OverrideObjection(objEvtId)` — adds to OverriddenObjections; guard: objEvtId ∈ UnresolvedObjections AND objEvtId ∉ OverriddenObjections AND consensusState='candidate'; enforces `OverrideIntegrity`
- `Invoke-EmitCandidate(currentEvtIds, contextDeliveredMap)` — transitions open→candidate; enforces: (a) consensusState='open'; (b) at least one objection with evtId ≥ RoundEpoch exists; (c) all such objectors have ContextDelivered=TRUE; (d) emitting agent has ContextDelivered=TRUE. Enforces `CandidateHasEventInLog` by requiring the consensus_candidate event be appended to event_log BEFORE state transitions to 'candidate' — the aggregate calls the event-log append (Step 15) as part of this method, making the transition atomic.
- `Invoke-RatifyConsensus()` — transitions candidate→ratified; guard: all unresolved objections are overridden (`unresolvedObjections ⊆ overriddenObjections`); enforces `RatificationRequiresNoUnoverriddenObjections`
- `Invoke-FailConsensus()` — transitions candidate→failed
- `Invoke-AdvanceRoundEpoch(nextEvtId)` — sets RoundEpoch = nextEvtId; resets unresolvedObjections={}, overriddenObjections={}, consensusState='open'; called by rollback (Step 29); enforces `ConsensusRoundStartMonotone` by asserting nextEvtId ≥ current RoundEpoch before assignment

All state is persisted to `consensus_state` table (Step 4 Round 7) on every transition — the aggregate is not purely in-memory. No method in this module may read from or write to `bus_lifecycle_state` or `rollback_state`; `check-tla-symbol-parity.ps1` enforces this boundary at CI (OBJ-R7-DDD-1).

**Round 7 Addition (OBJ-R7-DDD-1):** `consensus-round.ps1` is updated to use `consensus_state` table exclusively. The four keys it owns: `consensus_state`, `unresolved_objections`, `overridden_objections`, `consensus_round_start`. Any SQLite read/write targeting `bus_lifecycle_state` or `rollback_state` from within this module fails the `check-tla-symbol-parity.ps1` cross-ownership lint.

**Dependencies:** Steps 1, 2, 5

**Test (write first):** Verify `Invoke-RaiseObjection` adds to UnresolvedObjections and persists to bus_state. Verify `Invoke-RaiseObjection` fails when consensusState≠'open'. Verify `Invoke-OverrideObjection` fails when objEvtId ∉ UnresolvedObjections. Verify `Invoke-OverrideObjection` fails when objEvtId already ∈ OverriddenObjections (OverrideIntegrity). Verify `Invoke-EmitCandidate` fails when no objection with evtId ≥ RoundEpoch (epoch scoping). Verify `Invoke-EmitCandidate` fails when any objector has ContextDelivered=FALSE (ground-truth guard). Verify `Invoke-RatifyConsensus` fails when any objection is unresolved and not overridden. Verify `Invoke-AdvanceRoundEpoch` sets RoundEpoch = nextEvtId and resets all consensus state. Verify `Invoke-AdvanceRoundEpoch` fails when nextEvtId < current RoundEpoch (ConsensusRoundStartMonotone). Verify all transitions persist to bus_state (read back after restart). Verify `Get-ConsensusRoundState` returns immutable snapshot.

**TLA+ Coverage:**
- Variables: `unresolvedObjections`, `overriddenObjections`, `consensusState`, `consensusRoundStart`
- Actions: `AgentRaisesObjection`, `AgentResolvesObjection`, `ModeratorOverridesObjection`, `ModeratorEmitsCandidate`, `RouterRatifiesConsensus`, `RouterFailsConsensus`
- Invariants: `RatificationRequiresNoUnoverriddenObjections`, `OverrideIntegrity`, `CandidateHasEventInLog`, `ConsensusRoundStartMonotone`
- Liveness: `CandidateEventuallyResolves`

---

### Step 13: Envelope Value Object

**Tier:** 2 (depends on Steps 6, 7)

**Files:**
- `packages/vibe-cli/bus/router/envelope.ps1` (create)
- `packages/vibe-cli/tests/bus/unit/envelope.Tests.ps1` (create)

**Description:**

Implement `New-BusEnvelope` as an immutable value object. Construction-time invariants: all required fields present (evt_id, from, to, type); type is a member of the 16-value closed enum; evt_id is non-empty; the returned PSCustomObject has immutability enforcement (any mutation attempt raises an error). The constructor does NOT check uniqueness against event_log (router's responsibility).

**Dependencies:** Steps 6, 7

**Test (write first):** Verify a fully valid envelope is returned with all 7 fields readable. Verify missing "from" raises invariant violation. Verify type="unknown_type" raises invariant violation. Verify evt_id="" raises invariant violation. Verify the returned object is immutable. Verify construction of a valid envelope completes in under 50ms.

**TLA+ Coverage:**
- Variables: `eventLog` record structure
- Invariants: `NoDuplicateEvtId`, `TypeSenderACL`, `EvtIdMonotone`

---

### Step 14: Routing Rules + ACL Resolver

**Tier:** 2 (depends on Steps 7, 8)

**Files:**
- `packages/vibe-cli/bus/router/routing-rules.psd1` (create)
- `packages/vibe-cli/bus/router/routing-rules.ps1` (create)
- `packages/vibe-cli/tests/bus/unit/routing-rules.Tests.ps1` (create)

**Description:**

Define the complete routing-rule table mapping `(sender_role, event_type)` to target. Implement `Resolve-BusRoutingRule` that: (1) checks TypeSenderACL from-side; (2) checks TypeSenderACL to-side; (3) returns the inferred target or sentinel. Distinguishes "acl_violation" from "disallowed". Operates in pure memory with no I/O. Uses bounded-context constants from Step 7 — no raw event-type string literals in routing-rules.psd1.

**Dependencies:** Steps 7, 8

**Test (write first):** Verify coding-worker + done → target="router". Verify tla-writer + review_requested → "disallowed" sentinel. Verify tla-writer + consensus_ratified → "acl_violation". Verify verify event → target="tlc". Verify acl_violation and disallowed are distinct. Verify no SQLite/file I/O during resolution. Verify each resolution call < 50ms.

**TLA+ Coverage:**
- Invariants: `TypeSenderACL`, `ConsensusEventsRoutedThroughBus`
- Actions: `RouterEmitsProtocolError`, `HandlerAdapterReceives`

---

### Step 15: Core Router (AppendEvent + Atomic SQLite Transaction)

**Tier:** 3 (depends on Steps 2, 3, 4, 5, 6, 10, 13, 14)

**Files:**
- `packages/vibe-cli/bus/router/router.ps1` (create)
- `packages/vibe-cli/tests/bus/unit/router.Tests.ps1` (create)
- `packages/vibe-cli/tests/bus/integration/router-core.Tests.ps1` (create)
- `packages/vibe-cli/tests/bus/performance-baselines.json` (create)
- `packages/vibe-cli/tests/bus/performance-baselines-absolute.json` (create)

**Description:**

Implement the core router: `Invoke-BusAppendEvent` and `Invoke-BusRouteEvent`.

**OBJ-R3-1 (Atomic AppendEvent):** The TLA+ spec models `AppendEvent` as a single atomic step that simultaneously advances `nextEvtId`, appends to `eventLog`, and adds to `routedIds`. The implementation must preserve this atomicity with a SQLite `BEGIN IMMEDIATE` transaction enclosing all three operations:
1. Call evt_id allocator (`[Interlocked]::Increment`) — this is in-memory; partial failure here is safe (the allocated ID simply goes unused).
2. Begin SQLite `BEGIN IMMEDIATE` transaction.
3. INSERT the event_log row (within transaction).
4. Add evt_id to in-memory `$DispatchedIds` set (within the same code block, before COMMIT).
5. COMMIT.

If COMMIT fails: roll back in-memory `$DispatchedIds` update (remove the ID); the evt_id allocator counter does NOT roll back (monotone is preserved; the gap is safe per spec comment on MaxEvtId being a modeling parameter, not a protocol invariant).

**Startup recovery:** `Open-BusDatabase` (Step 5) runs `PRAGMA journal_mode=WAL` — WAL mode auto-rolls-back uncommitted transactions at the page level. Additionally, at bus startup, after opening the connection, run `BEGIN IMMEDIATE; ROLLBACK` to ensure any in-flight transaction from a previous process is cleared before reading `$DispatchedIds` from `event_log`.

**Kill-recovery contract:** After a process kill between INSERT and COMMIT (WAL rollback), on restart: the `$DispatchedIds` in-memory set is rebuilt from `event_log` (only committed rows); the killed evt_id is NOT in `event_log` and NOT in `$DispatchedIds`; the evt_id counter picks up from MAX(evt_id in event_log). No duplicate or phantom events.

`performance-baselines.json` committed with: `unit_suite_max_ms: 400`, `ground_truth_max_bytes: 8192`, `write_pipeline_log_mutex_hold_p99_ms: 50`, `write_pipeline_log_mutex_hold_max_ms: 200`, `append_event_p99_ms: 5`, `append_event_p999_ms: 20`.

**OBJ-R5-2 (AppendEvent Baseline):** The `append_event_p99_ms: 5` and `append_event_p999_ms: 20` baselines are measured by a dedicated benchmark in the test file: call `Invoke-BusAppendEvent` 1000 times sequentially using `[Diagnostics.Stopwatch]`; sort durations; assert `durations[990] ≤ 5ms` (p99) and `durations[999] ≤ 20ms` (p999). Failure message includes the measured value so CI can detect regressions. The `check-perf-baselines.ps1` gate in Step 32 uses these JSON values.

**Absolute Hard-Ceiling Budgets (CHANGE 10):** `performance-baselines-absolute.json` contains absolute hard-ceiling budgets checked unconditionally with no env-var override. These ceilings ratchet only tighter — they can never be loosened. The 20% regression tolerance in `performance-baselines.json` applies only to trendlines; ceilings in `performance-baselines-absolute.json` are absolute. Initial values: `{"append_event_p99_ms_floor": 5, "git_stash_p99_ms_floor": 2000, "get_bus_status_p99_ms_floor": 10}`.

**WAL Contention Test (CHANGE 8):** `Test-WalContention-Regression` (renamed from `Test-WalContention-Characterization`) is tagged `@regression`, not `@characterization`. It uses a fixed concurrency level of at least 8 writers. Published p50/p95/p99 baselines are hard ceilings: the test fails if measured p99 exceeds the `wal_contention_p99_ms_ceiling` value from `performance-baselines-absolute.json`. This replaces the sequential append benchmark as the primary hot-path performance gate.

**BDD Scenario (CHANGE 7):** The following scenario must be authored in `bdd.feature` as part of this step:
```gherkin
@tla-action-RouterHaltsDuplicateId @invariant-NoDuplicateEvtId @quality_attribute_perf_budget
Scenario: AppendEvent p99 latency remains below budget with concurrent writers
  Given 8 concurrent agents each attempting to append events simultaneously
  When the bus processes all 8 concurrent append requests
  Then the p99 latency for AppendEvent is below the absolute ceiling in performance-baselines-absolute.json
  And no agent receives a duplicate evt_id
  And the bus continues running
```

**OBJ-R5-14 (Pre-Commit Hook Guard):** `Invoke-BusAppendEvent` checks `$env:VIBE_BUS_COMMIT_IN_PROGRESS` at entry (before any mutex acquisition). If the value is `'1'`, immediately call `Invoke-BusHalt('mechanical_error', 'agent_crash')` and emit: `[ERROR] Invoke-BusAppendEvent called while VibeBus-Commit-<w> is held by a git commit in progress. Pre-commit hooks must not invoke bus functions (lock-hierarchy violation). Pipeline halted.` This fires before any SQLite or mutex interaction, preventing deadlock.

**Dependencies:** Steps 2, 3, 4, 5, 6, 10, 13, 14

**Test (write first):** Unit: verify AppendEvent inserts row with correct fields. Verify duplicate evt_id detection triggers halt. Verify in_reply_to referencing nonexistent evt_id triggers protocol_error. Verify valid payload passes schema check. Integration (in-memory SQLite): verify routed event row appears before dispatch. Verify event_log row appended before dispatch. **OBJ-R3-1 atomicity:** Simulate process kill after INSERT but before COMMIT (mock SQLite driver that raises error at COMMIT); restart; verify event_log has NO row for the killed evt_id; verify $DispatchedIds does NOT contain the killed evt_id; verify the allocator resumes from the correct MAX(evt_id). Verify the startup `BEGIN IMMEDIATE; ROLLBACK` clears any uncommitted transaction before $DispatchedIds is rebuilt. **OBJ-R5-2:** Verify 1000-call AppendEvent benchmark measures p99 ≤ 5ms and p999 ≤ 20ms; verify test fails when mock delay pushes p99 > 5ms; verify `performance-baselines.json` contains `append_event_p99_ms` and `append_event_p999_ms` keys. **OBJ-R5-14:** Verify `Invoke-BusAppendEvent` with `$env:VIBE_BUS_COMMIT_IN_PROGRESS='1'` emits [ERROR] and halts before touching any mutex or SQLite. Verify with env var absent or '0' → normal operation. Verify env var is not set in test teardown (no leak between tests).

**TLA+ Coverage:**
- Variables: `eventLog`, `routedIds`, `nextEvtId`
- Actions: `AppendEvent` helper (atomic), `RouterHaltsDuplicateId`
- Invariants: `NoDuplicateEvtId`, `EvtIdMonotone`, `OnlyDefinedHalts`

### Step 16: Start-BusAgent + Stdout Reader + Bootstrap Delivery

**Tier:** 4 (depends on Steps 4, 9, 11, 15)

**Files:**
- `packages/vibe-cli/bus/router/agent-lifecycle.ps1` (create)
- `packages/vibe-cli/tests/bus/integration/start-bus-agent.Tests.ps1` (create)
- `packages/vibe-cli/tests/bus/unit/stderr-backpressure.Tests.ps1` (create)

**Description:**

Implement `Start-BusAgent` that: (1) generates the system prompt file; (2) starts the claude process; (3) creates a dedicated stdout-reader runspace; (4) calls `New-AgentSession` on the AgentSession aggregate (Step 11); (5) calls `Invoke-AgentSessionBootstrap` to deliver the bootstrap event via `Invoke-BusAppendEvent` then writes to stdin + flush; (6) records SpawnEpoch. **Initial spawn only** — RouterRespawnsAgent covered by Step 24.

**OBJ-TLA-1 (Initial Spawn Epoch):** SpawnEpoch set to allocator value BEFORE bootstrap event appended. Written to `agent_sessions.spawned_at_evt` by `New-AgentSession`. Epoch advancement on respawn is in Step 24.

**OBJ-R3-10 (ConcurrentQueue Backpressure Cap):** The stdout-reader runspace enqueues parsed NDJSON lines into `[System.Collections.Concurrent.BlockingCollection[string]]` with `BoundedCapacity = $MaxQueueDepth` (default: 1000, configurable via `-MaxQueueDepth`). When full, the reader blocks on `TryAdd` — applying backpressure without dropping messages.

**OBJ-R5-11 (Heartbeat-Safe Queue Depth Counter):** The heartbeat does NOT call `$Queue.Count` or any method on the `BlockingCollection` (which could block if the producer is stalled on `TryAdd`). Instead, a dedicated `[int64]$QueueDepthCounter` is maintained via `[System.Threading.Interlocked]`: the stdout-reader calls `[Interlocked]::Increment([ref]$QueueDepthCounter)` before each `TryAdd`; the orchestrator consumer calls `[Interlocked]::Decrement([ref]$QueueDepthCounter)` after each `Take`. The heartbeat reads `[Interlocked]::Read([ref]$QueueDepthCounter)` — a non-blocking atomic operation. After 3 consecutive heartbeat reads above `$MaxQueueDepth * 0.9`, emit `[ALARM] Agent <role> stdout queue at <N>/<MaxQueueDepth> for 3 consecutive ticks.` This ensures a blocked producer never stalls the heartbeat runspace.

**OBJ-R3-11 (AgentCrash Detection Wired to Orchestrator):** When the stdout-reader runspace reaches `Completed` or `Failed` state unexpectedly (before orchestrator called `Stop-BusAgent`), fire: `$host.Runspace.Events.GenerateEvent('VibeBus.AgentCrashed', $null, [PSCustomObject]@{AgentName=$agentName; SessionId=$sessionId; ExitCode=$exitCode}, $null, $false, $false)`. Main orchestrator registers at startup: `Register-EngineEvent -SourceIdentifier 'VibeBus.AgentCrashed' -Action { Invoke-BusAgentCrashHandler $event.MessageData }`. `Invoke-BusAgentCrashHandler` calls `Invoke-BusCrashCoordination(agentName, sessionId, $NextEventId)` on the `CrashCoordinationDomainService` (Step 22) — which in sequence calls `Invoke-AgentSessionCrash`, `Clear-CommitLockForAgent`, and `Clear-HandlerForAgent`. Then calls `Invoke-BusHalt('mechanical_error', 'agent_crash')`.

**OBJ-R5-6 (Halt-Once Guard in Engine Event Handler):** `Invoke-BusAgentCrashHandler` checks the halt latch (`[Interlocked]::Read($HaltLatch)`) before calling `Invoke-BusHalt`. If the latch is already set (bus already halting), log `[INFO] Agent crash detected but halt already in progress (HaltReason=<current>). Crash cleanup only.` and call `Invoke-BusCrashCoordination` for cleanup but skip `Invoke-BusHalt`. This prevents `HaltReason='user_interrupt'` from being overwritten by `'mechanical_error'` during SIGINT teardown.

**Stderr Backpressure Budget (CHANGE 11):** Every Claude subprocess stderr stream is capped at N bytes/sec. On breach: drop-and-warn — log the overflow to `.vibe/alarms.log` but NEVER block the router runspace. This guards against Windows named-pipe buffer deadlock where a subprocess emitting large stderr volumes can stall the orchestrator. `stderr-backpressure.Tests.ps1` verifies: (a) stderr overflow emits `[WARN]` to alarms.log rather than blocking; (b) the router runspace continues dispatching events while stderr is saturated; (c) the cap value is configurable via `-StderrBytesPerSecCap` parameter.

**BDD Scenarios (CHANGE 7):** The following scenarios must be authored in `bdd.feature` as part of this step:
```gherkin
@tla-action-DeliverBootstrap @invariant-SpawningAgentOnlyReceivesBootstrap @error_action_preference_inheritance
Scenario: ErrorActionPreference propagated into background jobs triggers agent crash path
  Given the bus is starting a new agent
  When the background job encounters an unhandled exception
  Then the agent crash path is triggered (not a silent failure)
  And the bus halts with failureCategory "agent_crash"
  And the halt reason is "mechanical_error"
```

**OBJ-CD-7 (Agent Lifecycle Telemetry):** Emit structured telemetry at agent spawn and drain:
- Spawn: `[TELEMETRY] event=agent.spawned role=<role> instance_name=<n> session_id=<id> spawn_epoch=<N> elapsed_ms=<N>` (elapsed from `Start-BusAgent` call to process PID confirmed alive)
- Drain (graceful stop): `[TELEMETRY] event=agent.drained role=<role> session_id=<id> stdin_close_ms=<N> sigterm_ms=<N> exit_code=<N>`
- Crash (unintentional stop): `[TELEMETRY] event=agent.crashed role=<role> session_id=<id> exit_code=<N>`
All telemetry lines are emitted through `Write-PipelineLog` at `[TELEMETRY]` severity AFTER releasing any held mutex (per lock-hierarchy rule from Step 10).

**Dependencies:** Steps 4, 9, 11, 15

**Test (write first):** Integration (mocked claude-test-double): verify agent_sessions has exactly one row with status='alive', non-null pid and started_at, role_schema_version=1, session_mono_epoch > 0. Verify first stdin line has type='bootstrap'. Verify bootstrap payload contains only paths (no file contents). **OBJ-TLA-1:** Verify spawned_at_evt equals NextEventId captured BEFORE the bootstrap AppendEvent call. **OBJ-R3-10:** Verify queue blocks after $MaxQueueDepth items (no items dropped); verify heartbeat [ALARM] fires after 3 consecutive ticks above 90% capacity. **OBJ-R3-11:** Simulate stdout-reader runspace exit; verify engine event 'VibeBus.AgentCrashed' fired within 500ms; verify orchestrator handler calls Invoke-BusHalt with 'agent_crash'; verify CommitOwner[w]=NULL after halt. **OBJ-R5-11:** Verify heartbeat reads `$QueueDepthCounter` via Interlocked (not `$Queue.Count`); verify heartbeat never blocks when producer is stalled (mock producer holding TryAdd for 5s; verify heartbeat tick completes in < 100ms); verify [ALARM] fires correctly from counter reads. **OBJ-R5-6:** Verify engine event handler checks halt latch before calling Invoke-BusHalt; simulate SIGINT (HaltReason='user_interrupt' set) then fire VibeBus.AgentCrashed event; verify HaltReason remains 'user_interrupt' (not overwritten to 'mechanical_error'); verify crash cleanup still executes (CommitOwner cleared).

**TLA+ Coverage:**
- Variables: `agentStatus` (spawning→alive), `agentWorktree`, `spawnedAtEvt` (initial epoch), `groundTruthDelivered` (FALSE at spawn)
- Actions: `DeliverBootstrap` (complete), `AgentCrashes` (detection wiring via engine event)
- Invariants: `SpawningAgentOnlyReceivesBootstrap`, `ExactlyOneBootstrapPerLifetime`
- Liveness: `AgentsEventuallyAlive`

---

### Step 17: Handler Adapter + Handler Implementations

**Tier:** 4 (depends on Steps 7, 15)

**Files:**
- `packages/vibe-cli/bus/router/handler-adapter.ps1` (create)
- `packages/vibe-cli/bus/domain/handler-adapter-service.ps1` (create)
- `packages/vibe-cli/bus/handlers/tlc-handler.ps1` (create)
- `packages/vibe-cli/bus/handlers/tests-handler.ps1` (create)
- `packages/vibe-cli/bus/handlers/git-handler.ps1` (create)
- `packages/vibe-cli/tests/bus/integration/handler-adapter.Tests.ps1` (create)

**Description:**

Implement `Register-BusHandler`. `Invoke-BusHandlerReceive(a, h)` records HandlerPendingEvt[h], HandlerPendingAgent[h], **HandlerEpoch[h] = SpawnEpoch[a]**, transitions handlerState→'busy'. `Invoke-BusHandlerComplete(h)` verifies `SpawnEpoch[a] = HandlerEpoch[h]`: if agent was respawned, completion is **rejected** — reset handler to 'idle', emit protocol_error, do NOT deliver verify_result. `Invoke-BusHandlerFail(h)` resets handler, halts with handler_failure.

**OBJ-DDD-1/4 (HandlerAdapter as First-Class Service):** `handler-adapter-service.ps1` defines the `IHandlerAdapterService` interface contract — a PowerShell convention implemented via `[ValidateScript]` and `Export-ModuleMember` patterns:
- `Register-Handler(name, scriptblock)` — registers a named handler with its implementation
- `Invoke-HandlerReceive(agentName, handlerName, evtId, epoch)` — ACL entry point; validates caller is in AgentLifecycle context
- `Invoke-HandlerComplete(handlerName, result)` — validates epoch match before delivering result
- `Invoke-HandlerFail(handlerName, reason)` — raises `IntegrationProtocolError` (see below)
- `Get-HandlerState(handlerName)` — returns read-only state snapshot

This interface is the single entry point for all handler interactions. `handler-adapter.ps1` implements it. No code outside `handler-adapter-service.ps1` may directly mutate handler state maps.

**OBJ-DDD-5 (IntegrationProtocolError at the ACL Boundary):** `handler-adapter-service.ps1` defines `New-IntegrationProtocolError(handlerName, reason, detail)` — a typed error raised when a handler fails at the integration boundary (timeout, malformed result, epoch mismatch). This error type is distinct from `DomainProtocolError` (defined in Step 20), which is raised by aggregate invariant violations. Both surface as `protocol_error` events externally (via `RouterEmitsProtocolError`), but internally `IntegrationProtocolError` carries `Source='HandlerAdapter'` and is routed to the handler-failure halt path (`failureCategory='handler_failure'`), while `DomainProtocolError` carries `Source='DomainAggregate'` and is routed to the protocol-error recovery path.

**Dependencies:** Steps 7, 15

**Test (write first):** Verify Register-BusHandler dispatches registered scriptblock when to='tlc'. Verify HandlerAdapterReceives records HandlerEpoch = current SpawnEpoch. Verify HandlerAdapterCompletes emits verify_result with correct in_reply_to. **OBJ-TLA-1 epoch rejection:** simulate RouterRespawnsAgent advancing epoch after HandlerAdapterReceives; verify HandlerAdapterCompletes rejected (no verify_result, handler reset to idle, protocol_error emitted). Verify HandlerAdapterCompletes SUCCEEDS when epoch unchanged. Verify HandlerFails resets handler state. **OBJ-DDD-1/4:** Verify direct mutation of handler state outside `IHandlerAdapterService` raises error (use mock that tracks direct map access). Verify `Get-HandlerState` returns immutable snapshot. **OBJ-DDD-5:** Verify `Invoke-HandlerFail` raises `IntegrationProtocolError` with Source='HandlerAdapter'; verify this routes to handler_failure halt (exit 13). Verify `IntegrationProtocolError` and `DomainProtocolError` are distinct types (type check assertion). Verify both surface as `protocol_error` event type in event_log.

**TLA+ Coverage:**
- Variables: `handlerState`, `handlerPendingEvt`, `handlerPendingAgent`, `handlerPendingEpoch`
- Actions: `HandlerAdapterReceives`, `HandlerAdapterCompletes`, `HandlerFails`
- Invariants: `HandlerStateConsistency`, `NoOrphanedHandlerForDeadAgent`, `ConsensusEventsRoutedThroughBus`

---

### Step 18: Stop-BusAgent + Stop-AllBusAgents

**Tier:** 5 (depends on Steps 3, 16)

**Files:**
- `packages/vibe-cli/bus/router/agent-lifecycle.ps1` (modify)
- `packages/vibe-cli/tests/bus/integration/stop-bus-agent.Tests.ps1` (create)

**Description:**

Implement `Stop-BusAgent` that calls `Stop-ProcessTree` with the agent's PID then calls `Invoke-AgentSessionCrash` on the AgentSession aggregate to transition status→'dead'. `Stop-AllBusAgents` queries `agent_sessions WHERE status IN ('alive','spawning','checkpointing','renewing')`, calls `Stop-BusAgent` for each. Wire `Stop-AllBusAgents` into the double-Ctrl+C handler in `vibe.ps1`.

**Dependencies:** Steps 3, 16

**Test (write first):** Verify Stop-BusAgent calls Stop-ProcessTree with correct PID. Verify agent_sessions row transitions to status='dead' via AgentSession aggregate. Verify Stop-AllBusAgents handles three alive agents. Verify Stop-AllBusAgents handles zero alive agents without error. Verify Ctrl+C triggers Stop-AllBusAgents via vibe.ps1 handler.

**TLA+ Coverage:**
- Variables: `agentStatus` (→dead), `deadAtEvt`
- Actions: `UserInterrupts`, `AgentCrashes`
- Invariants: `CommitLockHolderAliveOrBusHalted`

---

### Step 19: Send-BusEvent + Ground Truth Injection

**Tier:** 5 (depends on Steps 11, 14, 15)

**Files:**
- `packages/vibe-cli/bus/router/send-bus-event.ps1` (create)
- `packages/vibe-cli/bus/router/ground-truth.ps1` (create)
- `packages/vibe-cli/tests/bus/integration/send-bus-event.Tests.ps1` (create)
- `packages/vibe-cli/tests/bus/unit/ground-truth.Tests.ps1` (create)

**Description:**

Implement `Send-BusEvent` that: (1) constructs envelope; (2) checks routing rules; (3) if target is an agent and ContextDelivered=FALSE (read from AgentSession aggregate via `Get-AgentSessionState`), prepends ground_truth via `Get-BusGroundTruth`; (4) calls `Invoke-BusRouteEvent`; (5) dispatches to agent stdin or invokes HandlerAdapter.

**OBJ-EC-1 (Ground Truth Cap Overflow):** When `Get-BusGroundTruth` computes block >8192 bytes: return `$null` (NO partial write); Send-BusEvent calls `Invoke-BusHalt` with `failureCategory='mechanical_error'` and message including computed byte count. No delivery of any kind occurs.

**OBJ-R3-9 (Invariant 9 — Respawn-Path Test):** After `Invoke-AgentSessionRespawn` resets ContextDelivered to FALSE (simulated in test), call `Send-BusEvent` targeting that agent. Routing layer checks `Get-AgentSessionState` and sees ContextDelivered=FALSE. Verify: (a) new ground_truth event prepended with evt_id strictly greater than previous ground_truth evt_id (new epoch); (b) agent stdin receives ground_truth BEFORE payload; (c) calling `Send-BusEvent` with a non-ground_truth event type to an agent with ContextDelivered=FALSE raises `GroundTruthPrecedesAgentMessage` invariant violation — event NOT appended to event_log, stdin NOT written.

**Dependencies:** Steps 11, 14, 15

**Test (write first):** Integration: verify Send-BusEvent appends event to event_log before dispatch. Verify agent stdin receives JSON line with correct type. Verify ground_truth block precedes payload when ContextDelivered=FALSE. Verify ground_truth is role-specific. Unit: verify ground_truth block <= 8192 bytes for 200-event pipeline. Verify composition < 50ms. **OBJ-EC-1:** Verify >8192 bytes → $null → halt with byte count; event_log has NO new row; stdin NOT written. **OBJ-R3-9 respawn path:** Simulate Invoke-AgentSessionRespawn; call Send-BusEvent; verify new ground_truth evt_id > previous; verify ground_truth before payload; verify direct non-GT event to ContextDelivered=FALSE agent raises GroundTruthPrecedesAgentMessage error.

**TLA+ Coverage:**
- Variables: `groundTruthDelivered`, `eventLog`, `routedIds`
- Actions: `DeliverGroundTruth`, `AppendEvent`
- Invariants: `GroundTruthPrecedesAgentMessage` (including epoch-scoped respawn path), `TypeSenderACL`, `ConsensusEventsRoutedThroughBus`
- Liveness: `AgentsEventuallyAlive`

---

### Step 20: Protocol Error Recovery

**Tier:** 6 (depends on Step 19)

**Files:**
- `packages/vibe-cli/bus/router/protocol-error.ps1` (create)
- `packages/vibe-cli/bus/domain/protocol-error-types.ps1` (create)
- `packages/vibe-cli/tests/bus/integration/protocol-error.Tests.ps1` (create)

**Description:**

Implement `Invoke-BusProtocolError(agentName, reason)` that emits protocol_error event and calls `Invoke-AgentSessionSetProtocolError(sessionId, $true)` on the AgentSession aggregate. `Invoke-BusProtocolErrorAck` validates ack, appends protocol_error_ack, calls `Invoke-AgentSessionSetProtocolError(sessionId, $false)`. Unsolicited ack → new protocol_error. Checkpoint deferral: `RouterInitiatesCheckpoint` checks aggregate's pendingProtocolError via `Get-AgentSessionState`. Agent crash clears pendingProtocolError atomically via `Invoke-AgentSessionCrash`.

**OBJ-DDD-5 (DomainProtocolError — Aggregate-Owned):** `protocol-error-types.ps1` defines `New-DomainProtocolError(agentName, violatedInvariant, detail)`. This type is raised by aggregate methods when a protocol invariant is violated at the domain level (e.g., `TypeSenderACL` violation detected by the routing layer, `GroundTruthPrecedesAgentMessage` violation in `Send-BusEvent`, duplicate event ID). `DomainProtocolError` carries `Source='DomainAggregate'` and `ViolatedInvariant=<invariant name>`. The routing layer catches it, calls `Invoke-BusProtocolError`, and routes to the **protocol-error recovery path** (agent receives `protocol_error`, must ack, and may continue). This is NOT a halt — the bus survives. This file also imports and re-exports `New-IntegrationProtocolError` from `handler-adapter-service.ps1` so that callers import only `protocol-error-types.ps1` for all error types.

**Error routing summary:**
- `DomainProtocolError` → `protocol_error` event → agent ack → recovery (non-halt path)
- `IntegrationProtocolError` → `protocol_error` event → `handler_failure` halt (halt path, exit 13)

**Dependencies:** Step 19

**Test (write first):** Verify protocol_error emitted with disallowed-type reason. Verify pipeline does not halt after protocol_error. Verify protocol_error_ack clears pending flag. Verify unsolicited ack generates new protocol_error. Verify checkpoint NOT initiated while pendingProtocolError=TRUE. Verify agent crash clears pendingProtocolError. **OBJ-DDD-5:** Verify `New-DomainProtocolError` has Source='DomainAggregate' field. Verify TypeSenderACL violation raises `DomainProtocolError` (not halt). Verify `protocol-error-types.ps1` exports both `New-DomainProtocolError` and `New-IntegrationProtocolError`. Verify DomainProtocolError routes to recovery path: event_log gets `protocol_error` row, agent receives it, bus continues running. Verify IntegrationProtocolError routes to halt path: bus halts with exit 13.

**TLA+ Coverage:**
- Variables: `pendingProtocolError`
- Actions: `RouterEmitsProtocolError`, `AgentEmitsAfterProtocolError`
- Invariants: `PendingProtocolErrorImpliesAgentAlive`, `ConsensusEventsRoutedThroughBus`, `TypeSenderACL`
- Liveness: `ProtocolErrorEventuallyResolved`

---

### Step 21: Wait-BusGroup (Fan-Out)

**Tier:** 6 (depends on Step 19)

**Files:**
- `packages/vibe-cli/bus/router/wait-bus-group.ps1` (create)
- `packages/vibe-cli/tests/bus/integration/wait-bus-group.Tests.ps1` (create)

**Description:**

Implement `Register-BusGroup` and `Wait-BusGroup`. `NonMemberSendsToGroup` detection. Duplicate group reply detection. Empty group resolves immediately.

**Dependencies:** Step 19

**Test (write first):** Integration: verify Wait-BusGroup blocks until all members reply regardless of order. Verify aggregated result contains all member responses. Verify empty group resolves immediately. Negative: verify duplicate group reply triggers mechanical halt. Verify non-member reply triggers mechanical halt. Edge: verify single-member group resolves. Integration: verify Stage 2 parallel writers (grp-stage2-writers) with both writers completing before Wait-BusGroup returns.

**TLA+ Coverage:**
- Variables: `groupMembers`, `groupReplies`, `groupViolationPending`
- Actions: `RouterAddsAgentToGroup`, `AgentSendsToGroup`, `NonMemberSendsToGroup`, `RouterHaltsGroupViolation`
- Invariants: `AllGroupRepliesHaveSentEvents`

---

### Step 22: Commit Serializer

**Tier:** 6 (depends on Step 19)

**Files:**
- `packages/vibe-cli/bus/router/commit-serializer.ps1` (create)
- `packages/vibe-cli/bus/domain/write-session.ps1` (create)
- `packages/vibe-cli/bus/domain/crash-coordination-service.ps1` (create)
- `packages/vibe-cli/tests/bus/integration/commit-serializer.Tests.ps1` (create)

**Description:**

Implement the commit serializer. When an agent emits `done`: acquire `VibeBus-Commit-<WorktreeName>`, set CommitOwner[w]=agent, pendingDoneEvt[w]=evt_id. Run git add + commit. On success: UPDATE event_log to status='committed', add to committedDoneEvts, clear lock. On failure: git reset HEAD, clear lock, halt with failureCategory='git_commit'.

**OBJ-R5-5 (WriteSession Reclassified as Entity):** `write-session.ps1` defines the `WriteSession` **Entity** — reclassified from "value object" because it has (a) identity (`SessionId` = `[Guid]::NewGuid()`), (b) lifecycle transitions via named methods (`Start-WriteSession` → `Complete-WriteSession`/`Fail-WriteSession`/`Recover-WriteSession`), and (c) mutable state stored in the `$ActiveSessions` aggregate map. A value object has no identity and is immutable; `WriteSession` satisfies none of those criteria. The `WriteSession` Entity encapsulates:
- `SessionId` (TEXT, unique per commit attempt, generated by `[System.Guid]::NewGuid()`)
- `WorktreeId` (TEXT — the worktree path)
- `EvtId` (INT — the done event being committed)
- `Holder` (TEXT — the agent that sent the done event)
- `StartedAt` (INT — `[System.Diagnostics.Stopwatch]::GetTimestamp()` at acquisition)
- `Etag` (TEXT — SHA-256 of `git diff --cached` output, computed before commit; used in AbandonedMutexException path to determine if commit succeeded)

`commit-serializer.ps1` is promoted to an aggregate (not a loose function): it maintains a `[hashtable]$ActiveSessions` map (WorktreeId → WriteSession | NULL). All mutations go through named methods:
- `Start-WriteSession(worktreeId, evtId, holder)` → creates WriteSession, acquires mutex, adds to map
- `Complete-WriteSession(worktreeId)` → on git success: marks committed, removes from map, releases mutex
- `Fail-WriteSession(worktreeId)` → on git failure: resets, removes from map, releases mutex, triggers halt
- `Recover-WriteSession(worktreeId)` → AbandonedMutexException path: compares git log against Etag to determine success/failure

**OBJ-R5-14 (Pre-Commit Hook Lock Guard):** `Start-WriteSession` sets `$env:VIBE_BUS_COMMIT_IN_PROGRESS = '1'` immediately before invoking `git commit` (after acquiring the mutex). `Complete-WriteSession` and `Fail-WriteSession` unset `$env:VIBE_BUS_COMMIT_IN_PROGRESS` immediately after the git operation completes (before releasing the mutex). This ensures the guard is active exactly during the git commit phase. The env var is set at the process level so that any pre-commit hook that calls a bus function will be detected by `Invoke-BusAppendEvent`'s entry check (Step 15).

**OBJ-R5-4 (CrashCoordinationDomainService):** `crash-coordination-service.ps1` defines `Invoke-BusCrashCoordination(agentName, sessionId, deathEpoch)` — the single entry point for all cross-aggregate crash cleanup. Sequence:
1. Call `Invoke-AgentSessionCrash(sessionId, deathEpoch)` on AgentSession aggregate → transitions to 'dead', clears pendingProtocolError.
2. Call `Clear-CommitLockForAgent(agentName)` on CommitSerializer aggregate → clears `commitLockHolder[w]` if this agent holds it, calls `Fail-WriteSession` if a write session exists for this agent's worktree.
3. Call `Invoke-HandlerClearForAgent(agentName)` on IHandlerAdapterService → resets any handler currently pending for this agent.

This service eliminates the anti-DDD pattern where `Invoke-AgentSessionCrash` called directly into other aggregates. `AgentSession.Invoke-AgentSessionCrash` now only transitions its own state (no calls to CommitSerializer or HandlerAdapter). `Invoke-BusCrashCoordination` is the coordination point.

Dependencies: Step 22 depends on Steps 11, 17, 19 (CrashCoordinationDomainService needs all three aggregates).

**OBJ-IMP-1 (AbandonedMutexException):** Catch `[System.Threading.AbandonedMutexException]`: (1) emit [WARN]; (2) git log to determine if previous commit succeeded; (a) present → UPDATE 'committed', continue; (b) absent → git reset HEAD, continue; (c) git log error → halt with 'git_commit'. Finally always calls `ReleaseMutex()`.

**OBJ-EC-13 (Lock Hierarchy):** Write to VibeBus-PipelineLog only AFTER releasing VibeBus-Commit-<w>. Post-commit log entries in a separate critical section.

**OBJ-EC-5 (Mid-Drain Crash Behavior):** Drain loop polls with 100ms sleep. On each iteration check `$BusLifecycleState`. If `$BusLifecycleState != 'running'`, abort drain and return drain-aborted signal. Rollback subsystem (Step 29) detects signal and preserves existing halt.

**OBJ-CD-7 (Commit Mutex Telemetry):** `Start-WriteSession` and `Complete-WriteSession`/`Fail-WriteSession` emit telemetry via `Write-PipelineLog`:
- Acquire: `[TELEMETRY] event=mutex.acquired mutex=VibeBus-Commit-<w> thread_id=<N> waited_ms=<N> session_id=<id>`
- Release (success): `[TELEMETRY] event=mutex.released mutex=VibeBus-Commit-<w> thread_id=<N> held_ms=<N> session_id=<id> outcome=committed`
- Release (failure): `[TELEMETRY] event=mutex.released mutex=VibeBus-Commit-<w> thread_id=<N> held_ms=<N> session_id=<id> outcome=failed`
- Orphan recovery: `[TELEMETRY] event=mutex.orphaned-recovered mutex=VibeBus-Commit-<w> thread_id=<N> session_id=<id> etag_match=<true|false>`
All emitted AFTER releasing the mutex (per lock-hierarchy rule).

**Dependencies:** Steps 17, 19 (CrashCoordinationDomainService needs HandlerAdapter + Send-BusEvent infrastructure)

**Test (write first):** Verify each done event creates exactly one git commit with Vibe-Event-Id trailer. Verify per-worktree mutex ensures sequential commits. Verify git commit failure → git reset HEAD → halt exit code 12. Verify event_log status transitions to 'committed'. Verify AbandonedMutexException paths (a), (b), (c). **OBJ-EC-5:** Simulate AgentCrashes mid-drain (BusLifecycleState→'halted'); verify drain aborts and existing halt preserved. Verify log write AFTER commit mutex released. **OBJ-DDD-1/4:** Verify `Start-WriteSession` creates WriteSession with non-null SessionId, Etag (SHA-256 of diff). Verify `Recover-WriteSession` uses Etag to determine outcome without re-running git commit. Verify direct mutation of `$ActiveSessions` outside aggregate methods raises error. **OBJ-CD-7:** Verify [TELEMETRY] event=mutex.acquired emitted with session_id; verify outcome=committed on success; verify etag_match field present on orphan recovery. **OBJ-R5-5:** Verify `WriteSession` has a `SessionId` property (non-null GUID); verify two distinct `Start-WriteSession` calls produce distinct SessionIds (identity distinguishes instances); verify `WriteSession` is NOT treated as a value type (two sessions for different worktrees coexist in `$ActiveSessions`). **OBJ-R5-4:** Verify `Invoke-BusCrashCoordination` calls all three methods in sequence (mock each aggregate; verify call order via call-recorder); verify AgentSession transitions to 'dead'; verify CommitOwner cleared; verify handler state cleared; verify `Invoke-AgentSessionCrash` alone does NOT call CommitSerializer or HandlerAdapter (it only mutates its own aggregate state). **OBJ-R5-14:** Verify `$env:VIBE_BUS_COMMIT_IN_PROGRESS` is '1' during git commit execution (capture value from within mock pre-commit hook); verify env var is unset after `Complete-WriteSession`; verify env var is unset after `Fail-WriteSession` even when git command throws.

**Round 6 Additions (OBJ-R6-6, OBJ-R6-7, OBJ-R6-8, OBJ-R6-17, OBJ-R6-18, OBJ-R6-19, OBJ-R6-30):**

**WorkingTreeCoordinator Delegation (OBJ-R6-6, OBJ-R6-7):** `commit-serializer.ps1` delegates ALL git operations to `WorkingTreeCoordinator` (Step 37). `Start-WriteSession` calls `WorkingTreeCoordinator.Invoke-GitAdd(w)` and `WorkingTreeCoordinator.Invoke-GitCommit(w, commitMessage, evtId)`. No git operations are performed directly in `commit-serializer.ps1`. The mutex `VibeBus-Commit-<w>` is still acquired BEFORE `Invoke-GitAdd` (git add and commit are fast and serialized by design; only git stash is lock-free). This ensures no step in CommitSerializer performs file I/O outside the WorkingTreeCoordinator's abstraction.

**WriteSession Lifecycle State Diagram (OBJ-R6-18):**
```
[Not Exists]
     │  Start-WriteSession(w, evtId, holder)
     ▼
[Acquiring] ─── mutex wait ──→ [Acquired]
                                    │  Invoke-GitAdd + Invoke-GitCommit (via WorkingTreeCoordinator)
                                    ▼
                               [Committing]
                              ╱               ╲
                     success /                 \ failure
                            ▼                   ▼
                      [Committed]           [Failed]
                            │                   │
          Complete-WriteSession             Fail-WriteSession
                            │                   │
                            ▼                   ▼
                      [Released] ←─────── [Released]
                      (mutex released; CommitOwner=NULL)
```
`Recover-WriteSession` handles the path from [Acquiring] after `AbandonedMutexException` and resolves to [Committed] or [Failed] using the Etag comparison.

**CommitSerializer/RollbackCoordinator Boundary (OBJ-R6-17):** Explicit boundary: CommitSerializer exclusively owns (a) VibeBus-Commit-<w> acquisition/release, (b) delegation to WorkingTreeCoordinator.Invoke-GitAdd/Invoke-GitCommit, (c) `event_log` status update to `committed`, (d) `committedDoneEvts` update. RollbackCoordinator exclusively owns (a) commit-drain check, (b) snapshot integrity verification, (c) single-transaction SQLite state reset (snapshotExists/rollbackRequested/consensusRoundStart/committedDoneEvts/pendingDoneEvt), (d) ConsensusRound epoch advance, (e) halt invocation. Zero overlap — no shared SQLite mutations.

**Mutex Starvation Backoff (OBJ-R6-19):** `Start-WriteSession` adds randomized exponential backoff on `VibeBus-Commit-<w>` acquisition: initial wait 10ms, multiply by 2× per attempt, jitter ±5ms seeded from `[System.Threading.Thread]::CurrentThread.ManagedThreadId`, max 8 attempts. On exhaustion: emit `[ALARM] VibeBus-Commit-<w> acquisition failed after 8 attempts (starvation suspected). Pipeline halted.` and call `Invoke-BusHalt('mechanical_error', 'sqlite_error')`. (Note: the `sqlite_error` failure category is the closest match; a future spec revision may add `mutex_starvation`.)

**Liveness Test (OBJ-R6-30):** `Test-CommitLockEventuallyReleased` added: mock `RouterCommitSucceeds` to fire after a virtual-clock delay of 3 ticks (simulating SF fair scheduling delay); run 4 concurrent `AgentSendsDone` calls on the same worktree; assert `commitLockHolder[w] = NULL` after each resolves; verify no starvation (all 4 locks acquired and released within `$MaxQueueDepth * 3` virtual ticks).

**InvCommitOrdering Test (OBJ-R6-4):** `Test-InvCommitOrdering`: commit 5 events sequentially; read `committedDoneEvts` from `bus_state`; assert they form a strictly monotone set: `∀ e₁, e₂ ∈ committedDoneEvts : e₁ < e₂ ⟹ e₁ committed before e₂`; simulate out-of-order commit attempt and assert rejection by `CommitIdempotency` guard.

**Dependencies:** Steps 17, 19, 37 (WorkingTreeCoordinator needed for git operations)

**Test (write first):** Verify each done event creates exactly one git commit with Vibe-Event-Id trailer. Verify per-worktree mutex ensures sequential commits. Verify git commit failure → git reset HEAD → halt exit code 12. Verify event_log status transitions to 'committed'. Verify AbandonedMutexException paths (a), (b), (c). **OBJ-EC-5:** Simulate AgentCrashes mid-drain (BusLifecycleState→'halted'); verify drain aborts and existing halt preserved. Verify log write AFTER commit mutex released. **OBJ-DDD-1/4:** Verify `Start-WriteSession` creates WriteSession with non-null SessionId, Etag (SHA-256 of diff). Verify `Recover-WriteSession` uses Etag to determine outcome without re-running git commit. Verify direct mutation of `$ActiveSessions` outside aggregate methods raises error. **OBJ-CD-7:** Verify [TELEMETRY] event=mutex.acquired emitted with session_id; verify outcome=committed on success; verify etag_match field present on orphan recovery. **OBJ-R5-5:** Verify `WriteSession` has a `SessionId` property (non-null GUID); verify two distinct `Start-WriteSession` calls produce distinct SessionIds (identity distinguishes instances); verify `WriteSession` is NOT treated as a value type (two sessions for different worktrees coexist in `$ActiveSessions`). **OBJ-R5-4:** Verify `Invoke-BusCrashCoordination` calls all three methods in sequence (mock each aggregate; verify call order via call-recorder); verify AgentSession transitions to 'dead'; verify CommitOwner cleared; verify handler state cleared; verify `Invoke-AgentSessionCrash` alone does NOT call CommitSerializer or HandlerAdapter (it only mutates its own aggregate state). **OBJ-R5-14:** Verify `$env:VIBE_BUS_COMMIT_IN_PROGRESS` is '1' during git commit execution (capture value from within mock pre-commit hook); verify env var is unset after `Complete-WriteSession`; verify env var is unset after `Fail-WriteSession` even when git command throws. **OBJ-R6-19 (Starvation Backoff):** Verify 8-attempt exhaustion emits [ALARM] and halts; verify backoff intervals are randomized (jitter ≥ 1ms per attempt); verify two concurrent callers on the same worktree do not deadlock (one acquires, other backs off then succeeds). **OBJ-R6-30 (Liveness):** Verify `Test-CommitLockEventuallyReleased` passes with 4 concurrent agents and SF-delay mock; verify commitLockHolder[w]=NULL after each resolves. **OBJ-R6-4 (InvCommitOrdering):** Verify 5 sequential commits produce monotone committedDoneEvts set; verify out-of-order attempt rejected by CommitIdempotency guard. **OBJ-R6-6 (WorkingTreeCoordinator delegation):** Verify `commit-serializer.ps1` contains no direct `git` invocations (AST check for `git add` and `git commit` strings outside WorkingTreeCoordinator import).

**TLA+ Coverage:**
- Variables: `commitLockHolder`, `committedDoneEvts`, `pendingDoneEvt`
- Actions: `AgentSendsDone`, `RouterCommitSucceeds`, `RouterCommitFails`
- Invariants: `CommitLockHolderAliveOrBusHalted`, `CommitIdempotency`
- Implementation Invariants: `InvCommitOrdering`
- Liveness: `CommitLockEventuallyReleased`

---

### Step 23: Consensus Machinery

**Tier:** 7 (depends on Steps 12, 19, 20)

**Files:**
- `packages/vibe-cli/bus/router/consensus.ps1` (create)
- `packages/vibe-cli/tests/bus/integration/consensus.Tests.ps1` (create)

**Description:**

Thin orchestration layer over the ConsensusRound aggregate (Step 12). `Invoke-BusRaiseObjection(a)` → `Invoke-RaiseObjection(evtId)`. `Invoke-BusResolveObjection` → `Invoke-ResolveObjection`. `Invoke-BusOverrideObjection` → `Invoke-OverrideObjection`. `Invoke-BusEmitCandidate(a)` → `Invoke-EmitCandidate` (guards in aggregate). `Invoke-BusRatifyConsensus` → `Invoke-RatifyConsensus`. `Invoke-BusFailConsensus` → `Invoke-FailConsensus`. Routing layer enforces that Handler emitting consensus event triggers mechanical halt.

**OBJ-TLA-4 (CandidateHasEventInLog):** After `Invoke-BusEmitCandidate`: assert `Get-ConsensusRoundState().State = 'candidate'` AND event_log contains row with type='consensus_candidate' AND evt_id >= RoundEpoch. Checked at: emission, after objection resolution, after rollback (empty round → vacuous hold).

**Dependencies:** Steps 12, 19, 20

**Test (write first):** Integration: verify happy-path consensus_ratified when all objections resolved. Verify consensus_ratified NOT emitted with unresolved objections. Verify moderator override with non-empty reason → consensus_ratified follows. Verify duplicate override rejected. Verify non-moderator override rejected. Verify agent emitting consensus_ratified directly → protocol_error. Verify Handler emitting consensus event → mechanical halt. **OBJ-TLA-4:** Assert CandidateHasEventInLog invariant at all three check points.

**TLA+ Coverage:**
- Variables: (delegated to ConsensusRound aggregate)
- Actions: `AgentRaisesObjection`, `AgentResolvesObjection`, `ModeratorOverridesObjection`, `ModeratorEmitsCandidate`, `RouterRatifiesConsensus`, `RouterFailsConsensus`
- Invariants: `RatificationRequiresNoUnoverriddenObjections`, `CandidateHasEventInLog`, `ConsensusEventsRoutedThroughBus`, `OverrideIntegrity`, `TypeSenderACL`
- Liveness: `CandidateEventuallyResolves`

---

### Step 24: Checkpoint / Session Renewal

**Tier:** 7 (depends on Steps 19, 20, 22)

**Files:**
- `packages/vibe-cli/bus/router/checkpoint.ps1` (create)
- `packages/vibe-cli/tests/bus/integration/checkpoint.Tests.ps1` (create)

**Description:**

`Watch-BusAgentTokens(a)` monitors `result.usage.total_tokens`. When >= 80% of context window, triggers checkpoint if: ~pendingProtocolError[a] AND ~HandlerBusy[a] AND ~CommitOwner[w]=a AND consensusState!='candidate'. `Invoke-BusCheckpoint(a)` calls `Invoke-AgentSessionCheckpoint(sessionId)` on aggregate, appends checkpoint event. `Complete-BusCheckpoint(a)` calls `Invoke-AgentSessionStoreCheckpoint`. RouterRespawnsAgent calls `Invoke-AgentSessionRespawn(sessionId, newSpawnEpoch)`.

**OBJ-R3-12 (Context-Overrun Race):** Before delivering any ground_truth event, `Send-BusEvent` calls `Invoke-ContextLimitPreCheck(sessionId, estimatedBytes)`. If `total_tokens_used + estimated >= context_window_limit * 0.95`, initiate checkpoint BEFORE delivering ground_truth. This prevents ground_truth injection from itself causing context exhaustion.

**Heartbeat Crash Distinguisher (OBJ-R3-12):** When 120s alarm fires for stuck checkpointing agent: check (a) is OS process alive? (b) is total_tokens near limit? If alive AND near limit: emit `[ALARM] Agent <role> stuck in 'checkpointing' — context-limit exhaustion suspected (total_tokens=<N>, limit=<M>).` If process not alive: emit `[ALARM] Agent <role> process not found (PID <pid>). Treating as crashed.`

**OBJ-TLA-1 (RouterRespawnsAgent Epoch):** `Invoke-AgentSessionRespawn` writes new SpawnEpoch to `agent_sessions.spawned_at_evt` in SQLite BEFORE `Start-BusAgent` is called.

**OBJ-IMP-2 (WAL Retry):** Exponential-backoff: initial 50ms, factor 2x, jitter ±20ms, max 8 attempts. **OBJ-EC-4 (Per-Operation Budget):** Each SQLite operation has its own independent 8-attempt budget. **OBJ-EC-10 (Virtual Time Boundary):** `-GetUtcNow` consumed only within checkpoint.ps1. **OBJ-EC-14 (Retry Metric):** [WARN] on attempt 2/8, [INFO] on 3-7, [ALARM] on exhaustion.

**Dependencies:** Steps 19, 20, 22

**Test (write first):** Integration: verify checkpoint event emitted when total_tokens >= 80%. Verify checkpoint NOT initiated when pendingProtocolError=TRUE. Verify checkpoint NOT initiated when handler busy. Verify SpawnEpoch written to SQLite BEFORE new process started. **OBJ-R3-12:** Simulate ground_truth delivery that would push past 95% context limit; verify checkpoint initiated FIRST; verify heartbeat distinguishes context-limit stall from crash. **OBJ-EC-4:** Verify operation B starts fresh with 8 attempts even if operation A succeeded on attempt 5. **OBJ-EC-14:** Verify [WARN] on attempt 2/8, [INFO] on 3-7, [ALARM] on exhaustion.

**TLA+ Coverage:**
- Variables: `checkpointStored`, `checkpointResponseInFlight`, `agentStatus` (checkpointing→renewing→spawning), `spawnedAtEvt` (advanced by RouterRespawnsAgent)
- Actions: `RouterInitiatesCheckpoint`, `AgentCheckpointResponse`, `RouterRespawnsAgent`
- Invariants: `ExactlyOneBootstrapPerLifetime`, `GroundTruthPrecedesAgentMessage`, `DeadAgentReceivesNoMessages`
- Liveness: `AgentsEventuallyAlive`

---

### Step 25: Halt Conditions + Exit Codes + Pipeline Lock

**Tier:** 8 (depends on Steps 21, 22, 23)

**Files:**
- `packages/vibe-cli/bus/router/halt.ps1` (create)
- `packages/vibe-cli/tests/bus/unit/halt.Tests.ps1` (create)
- `packages/vibe-cli/tests/bus/integration/halt.Tests.ps1` (create)
- `packages/vibe-cli/docs/bidirectional-comms/bdd.feature` (modify — add halt-condition scenarios)

**Description:**

Implement `Invoke-BusHalt(reason, failureCategory)`. Sets BusLifecycleState='halted', HaltReason, FailureCategory (NULL for non-mechanical). Calls `Stop-AllBusAgents`. Writes final state to SQLite. Exits with correct exit code. Implement `Invoke-BusReleasePipelineLock`.

**OBJ-R5-6 (Halt-Once Guard — First-Halt-Wins):** `Invoke-BusHalt` uses `[System.Threading.Interlocked]::CompareExchange([ref]$HaltLatch, 1, 0)` at entry — only the first caller atomically sets the latch from 0 to 1; all subsequent callers receive the old value (1) and return immediately without modifying `BusLifecycleState`, `HaltReason`, or `FailureCategory`. The latch is a module-scoped `[int64]` initialized to 0. This prevents `HaltReason='user_interrupt'` from being overwritten by a concurrent `'mechanical_error'` engine event fired during SIGINT teardown.

**OBJ-EC-15 (Graceful SIGINT Shutdown Sequence):** When SIGINT fires, strict order: **(0) Engine-event queue drain:** Call `Unregister-Event 'VibeBus.*'` to dequeue and discard all pending `VibeBus.AgentCrashed` events before the halt latch is set. This prevents agent crash detection (fired by runspaces that exit during teardown) from racing with the SIGINT halt. **(1)** Set halt latch via `[Invoke-BusHalt('user_interrupt', $null)]` — first-call-wins ensures HaltReason='user_interrupt' is permanent. **(2)** Acquire `VibeBus-PipelineLog`, write `[INFO] SIGINT received`, release. **(3)** For each alive agent: close stdin (EOF), SIGTERM (5s timeout), SIGKILL if not exited — NO commit mutex acquired during this step. **(4)** Poll `CommitOwner[w]` for all worktrees: wait up to 10s for drain. **(5)** Write final state to SQLite (WAL retry per OBJ-EC-14). **(6)** Call `Invoke-BusReleasePipelineLock`. **(7)** Exit with exit code.

**OBJ-R3-6 (13 Individually Named Halt Tests):** The integration test file must contain 13 distinct test functions — one per halt-triggering TLA+ action. No data-driven collapse. Each test has its own precondition setup, trigger mechanism, and assertions:

1. **Test-RouterHaltsFeatureComplete:** consensusState='ratified'; trigger: feature_complete condition; assert exit 0, HaltReason='feature_complete', FailureCategory=NULL, zero alive rows.
2. **Test-RouterHaltsDuplicateId:** evt_id 42 in $DispatchedIds; trigger: AppendEvent with evt_id=42; assert exit 10, FailureCategory='duplicate_evt_id'.
3. **Test-RouterHaltsGroupViolation:** group 'g' with members ['a']; trigger: agent 'b' sends to 'g'; assert exit 11, FailureCategory='group_violation'.
4. **Test-RouterCommitFails:** git-test-double returns non-zero on commit; trigger: AgentSendsDone; assert exit 12, FailureCategory='git_commit'.
5. **Test-HandlerFails:** handler scriptblock throws; trigger: HandlerAdapterReceives dispatches; assert exit 13, FailureCategory='handler_failure'.
6. **Test-RouterHaltsSqliteError-AgentSession:** SQLite mock exhausts 8 WAL retries during agent-session write; assert exit 14, FailureCategory='sqlite_error'.
7. **Test-RouterHaltsRollbackSqliteError:** rollbackRequested=TRUE, SQLite mock exhausts retries; assert exit 14, FailureCategory='sqlite_error', rollbackRequested=FALSE after halt.
8. **Test-AgentCrashes:** stdout-reader exits unexpectedly (engine event fired); assert exit 15, FailureCategory='agent_crash', CommitOwner[w]=NULL.
9. **Test-RouterHaltsBoundReached:** NextEventId=MaxEvtId; trigger: AppendEvent; assert exit 16, FailureCategory='evt_id_overflow'.
10. **Test-UserInterrupts:** SIGINT signal; assert exit 1, HaltReason='user_interrupt', FailureCategory=NULL; SIGINT sequence in correct order (mock step-recorder per OBJ-EC-15); VibeBus-Commit-<w> NOT acquired during agent teardown.
11. **Test-RouterRatifiesConsensus:** all objections overridden/resolved; trigger: Invoke-BusRatifyConsensus; assert exit 0, HaltReason='consensus_ratified', FailureCategory=NULL.
12. **Test-RouterFailsConsensus:** moderator calls fail; trigger: Invoke-BusFailConsensus; assert exit 2, HaltReason='consensus_failed', FailureCategory=NULL.
13. **Test-RouterExecutesRollback:** snapshotExists=TRUE, rollbackRequested=TRUE, CommitOwner[w]=NULL; trigger: Invoke-BusExecuteRollback; assert exit 0, HaltReason='user_rollback', FailureCategory=NULL.

Each test also asserts: pipeline_lock released after halt; MechanicalHaltHasCategory bidirectional invariant holds (forward: `haltReason='mechanical_error' => failureCategory ∈ FailureCategories`; backward: `haltReason ≠ 'mechanical_error' => failureCategory = NULL`); zero alive agent_sessions rows after halt.

**OBJ-TDD-R3-2 (Negative-Branch 'Does Not Halt' Assertions):** For each of the 13 halt tests, a paired negative-branch test function asserts the bus does NOT halt when the precondition guard is unmet. The integration test file contains 13 additional negative tests:

1. **Test-RouterHaltsFeatureComplete-NegBranch:** consensusState='open' (not 'ratified'); trigger: feature_complete condition absent; assert bus continues running, exit code absent, haltReason=NULL.
2. **Test-RouterHaltsDuplicateId-NegBranch:** evt_id 42 NOT in $DispatchedIds; trigger: AppendEvent with evt_id=42; assert row inserted, no halt, exit code absent.
3. **Test-RouterHaltsGroupViolation-NegBranch:** agent 'b' IS a member of group 'g'; trigger: agent 'b' sends to 'g'; assert accepted, no halt.
4. **Test-RouterCommitFails-NegBranch:** git-test-double returns 0 on commit; trigger: AgentSendsDone; assert exit 0 after feature_complete, no git_commit halt.
5. **Test-HandlerFails-NegBranch:** handler scriptblock returns success; trigger: HandlerAdapterReceives; assert verify_result delivered, no halt.
6. **Test-RouterHaltsSqliteError-AgentSession-NegBranch:** SQLite mock succeeds within 8 attempts; assert agent session written, no halt.
7. **Test-RouterHaltsRollbackSqliteError-NegBranch:** rollbackRequested=FALSE; trigger: SQLite mock fails; assert RouterHaltsSqliteError fires on agent write (not rollback path), different exit code.
8. **Test-AgentCrashes-NegBranch:** stdout-reader exits cleanly (orchestrator called Stop-BusAgent first); assert NO engine event fired, no crash halt.
9. **Test-RouterHaltsBoundReached-NegBranch:** NextEventId = MaxEvtId-1; trigger: AppendEvent; assert event appended, NextEventId = MaxEvtId, no halt yet.
10. **Test-UserInterrupts-NegBranch:** inject `-GetTimestamp` virtual clock; advance virtual clock by 1000ms without firing SIGINT; assert `$BusLifecycleState` remains 'running'; verify SIGINT sequence NOT triggered (mock step-recorder shows 0 SIGINT steps executed); assert real elapsed < 50ms (OBJ-R5-9: no real sleep).
11. **Test-RouterRatifiesConsensus-NegBranch:** unresolved objection remains (not overridden); trigger: Invoke-BusRatifyConsensus; assert rejected (RatificationRequiresNoUnoverriddenObjections guard), bus continues.
12. **Test-RouterFailsConsensus-NegBranch:** consensusState='open' (not 'candidate'); trigger: Invoke-BusFailConsensus; assert rejected, bus continues.
13. **Test-RouterExecutesRollback-NegBranch:** rollbackRequested=FALSE; trigger: Invoke-BusExecuteRollback called directly; assert no-op (guard rejects), bus continues running.

**OBJ-BDD-R3-1 (bdd.feature halt scenarios):**
```gherkin
@tla-action-29 @invariant-4 @invariant-15
Scenario: bus halts with exit 0 on feature_complete
  Given the bus is running with all agents alive and consensusState "ratified"
  When the RouterHaltsFeatureComplete condition is met
  Then the bus halts with exit code 0
  And the halt reason is "feature_complete"
  And the failure category is null
  And the pipeline_lock is released

@tla-action-34 @invariant-4 @invariant-15
Scenario: bus halts with exit 14 on sqlite_error during agent-session write
  Given the bus is running with an agent in "spawning" state
  When SQLite exhausts 8 WAL retry attempts during the agent-session write
  Then the bus halts with exit code 14
  And the halt reason is "mechanical_error"
  And the failure category is "sqlite_error"
```

**OBJ-R5-6 (Halt-Once Guard) test additions:** Verify `Invoke-BusHalt` sets halt latch to 1 on first call; verify second call returns immediately with no state change (HaltReason unchanged); verify concurrent SIGINT + VibeBus.AgentCrashed race: SIGINT wins halt latch → HaltReason='user_interrupt'; crash handler cleans up agent state but does not overwrite HaltReason. **OBJ-R5-9 (Virtual Clock for Negative Tests):** Verify all 13 negative-branch tests complete with real elapsed < 50ms each (virtual clock assertion); verify no `Start-Sleep` in negative-branch test functions (AST check).

**Dependencies:** Steps 21, 22, 23

**TLA+ Coverage:**
- Variables: `busStatus`, `haltReason`, `failureCategory`, `pipeline_lock`
- Actions: `RouterHaltsFeatureComplete`, `RouterHaltsDuplicateId`, `RouterHaltsGroupViolation`, `UserInterrupts`, `RouterHaltsBoundReached`, `RouterHaltsSqliteError`, `RouterHaltsRollbackSqliteError`, `RouterRatifiesConsensus`, `RouterFailsConsensus`, `RouterExecutesRollback` (halt path), `ReleasePipelineLock`
- Invariants: `OnlyDefinedHalts`, `MechanicalHaltHasCategory`, `BusRunningImpliesLockHeld`
- Implementation Invariants: `InvHaltLatchMonotonic`

**Round 6 Additions (OBJ-R6-5, OBJ-R6-4, OBJ-R6-21):**

**BusLifecycle Aggregate Delegation (OBJ-R6-5):** `halt.ps1` is refactored to delegate ALL `busStatus`/`haltReason`/`failureCategory`/`pipeline_lock` mutations to the `BusLifecycle` aggregate (Step 36). `Invoke-BusHalt` becomes a thin façade that calls `BusLifecycle.Invoke-BusHalt(reason, category)`. The halt-once guard (`[Interlocked]::CompareExchange`) lives in `BusLifecycle.Invoke-BusHalt`, not in `halt.ps1`. This consolidates all lifecycle logic in a single aggregate, eliminating the scatter across Steps 3, 11, and 28.

**InvHaltLatchMonotonic Test (OBJ-R6-4):** `Test-InvHaltLatchMonotonic`: call `Invoke-BusHalt` 5 times concurrently from separate runspaces; assert `$HaltLatch` read via `[Interlocked]::Read` is exactly 1 after all calls complete; assert `$BusLifecycleState = 'halted'` with unchanged reason after first call wins; assert exit code is non-zero and stable.

**SIGTERM During Shutdown Test (OBJ-R6-21):** `Test-SigtermDuringShutdown`: mock `Invoke-BusWalCheckpoint` to run slowly (virtual-clock 10s); fire SIGTERM via `CancellationTokenSource.Cancel()` at 3s; verify `[WARN] WAL checkpoint interrupted by SIGTERM: <N> frames not checkpointed` emitted; verify process exits with exit code 1 (clean SIGTERM exit); verify `Invoke-BusReleasePipelineLock` called before exit.

**Dependencies:** Steps 21, 22, 23, 36 (BusLifecycle aggregate)

---

### Step 26: Heartbeat Banner

**Tier:** 8 (depends on Steps 10, 19, 25)

**Files:**
- `packages/vibe-cli/bus/router/heartbeat.ps1` (create)
- `packages/vibe-cli/tests/bus/unit/heartbeat.Tests.ps1` (create)

**Description:**

Implement heartbeat runspace firing every 10 seconds. `Start-BusHeartbeat` creates dedicated runspace. Banner: UTF-8 box-drawing characters, blank line above and below, agent rows show role/instance_name/PID/status/idle time (yellow >1m, red >5m). Clock: clamp negative to 0s; detect >30s forward jump; missed tick >10s → [ALARM]. ConcurrentQueue depth alarm from Step 16 queue depth tracking.

**OBJ-IMP-5 (Virtual Time):** Accept `-GetTimestamp` and `-GetUtcNow` scriptblock parameters. All time comparisons use injected clocks. Tests use virtual clocks.

**OBJ-TLA-3 (BusResumed Liveness):** If agent stuck in 'checkpointing' for > MaxCheckpointIdleSeconds (default 120s, injected): (1) emit `[ALARM] Agent <role> stuck in 'checkpointing' for >120s without checkpoint_response. Treating as crashed.`; (2) call `Invoke-BusHalt('mechanical_error', 'agent_crash')`. **OBJ-R3-12 (Crash Distinguisher):** If process alive AND total_tokens near limit → context-limit alarm message instead of crash alarm.

**Dependencies:** Steps 10, 19, 25

**Test (write first):** Unit: verify UTF-8 box-drawing in banner. Verify blank lines above and below. Verify idle time yellow >1m, red >5m (virtual clock). Verify forward clock jump >30s logs warning. Verify missed tick >10s emits [ALARM]. Verify ConcurrentQueue alarm after 3 ticks above 90%. Verify degraded counter resets on -Resume. Verify entire test suite under 400ms (virtual clocks). **OBJ-TLA-3:** Verify virtual clock advance of 121s with status='checkpointing' and process alive but NOT near context limit → [ALARM] 'stuck in checkpointing' → Invoke-BusHalt with 'agent_crash'. Verify process alive AND near context limit → context-limit alarm (NOT crash alarm).

**TLA+ Coverage:**
- Actions: `BusResumed` (shares coverage with Step 28)
- Liveness: `AgentsEventuallyAlive` (heartbeat-fairness path)

---

### Step 27: Get-BusStatus + -Status Flag

**Tier:** 8 (depends on Steps 2, 19, 25)

**Files:**
- `packages/vibe-cli/bus/router/get-bus-status.ps1` (create)
- `packages/vibe-cli/vibe.ps1` (modify)
- `packages/vibe-cli/tests/bus/integration/get-bus-status.Tests.ps1` (create)

**Description:**

`Get-BusStatus` queries agent_sessions and event_log, prints: alive agents (role, instance_name, PID, status, idle time), per-agent ConcurrentQueue depth, last event_log write latency in ms, event_log counts grouped by type. No agents started or stopped. Add `-Status` switch to `vibe.ps1`.

**Dependencies:** Steps 2, 19, 25

**Test (write first):** Verify -Status output contains alive agent's role and status='alive'. Verify output includes ConcurrentQueue depth. Verify output includes event_log write latency. Verify no agents started or stopped. Verify -Status with no alive agents prints "No agents currently alive" and exits 0.

**TLA+ Coverage:** Queries the full `vars` surface; implements observability for all invariant checks.

---

### Step 28: -Resume Recovery

**Tier:** 8 (depends on Steps 2, 16, 24, 25)

**Files:**
- `packages/vibe-cli/bus/router/resume.ps1` (create)
- `packages/vibe-cli/tests/bus/integration/resume.Tests.ps1` (create)
- `packages/vibe-cli/tests/bus/e2e/resume-e2e.Tests.ps1` (create)
- `packages/vibe-cli/docs/bidirectional-comms/bdd.feature` (modify — add -Resume schema-version scenario)

**Description:**

Implement `-Resume` recovery. PID liveness check for each row with status in ('alive','spawning','checkpointing','renewing'). Respawn each crashed agent via `Invoke-AgentSessionResume(sessionId, newSpawnEpoch)` on AgentSession aggregate → deliver bootstrap + ground_truth; if checkpoint_json non-null and schema version matches, deliver checkpoint_response. BusResumed fires when all agents re-queued. -Resume blocked when rollbackRequested=TRUE. -Resume NOT available after user_rollback halt.

**OBJ-EC-3 (Role Schema Version — Hard Halt):** When -Resume discovers `role_schema_version != CurrentSchemaVersion`, HALT IMMEDIATELY with: `[ERROR] Cannot resume agent '<role>' (session_id=<id>): stored role_schema_version=<stored> does not match current schema version <current>. To proceed: (1) run 'vibe schema-migrate', or (2) run 'vibe reset'. Pipeline halted.`

**OBJ-EC-9 (Cross-Session Monotonicity):** Never compare `checkpointed_at_mono` values from rows with different `session_mono_epoch`. Use `checkpointed_at` (wall-clock) for cross-session ordering. Rule documented as a comment in `resume.ps1`.

**OBJ-BDD-R3-1 (bdd.feature -Resume scenario):**
```gherkin
@tla-action-10 @invariant-8 @invariant-9
Scenario: vibe -Resume hard-halts on role schema version mismatch
  Given the pipeline is halted with agent "tla-writer" stored with role_schema_version 1
  And the current role schema version is 2
  When I run "vibe -Resume"
  Then the output contains "[ERROR] Cannot resume agent 'tla-writer' (session_id=<id>): stored role_schema_version=1 does not match current schema version 2. To proceed: (1) run 'vibe schema-migrate', or (2) run 'vibe reset'. Pipeline halted."
  And the exit code is non-zero
  And no agent processes are started
  And the agent_sessions row status remains "dead"
```

**Dependencies:** Steps 2, 16, 24, 25

**Test (write first):** Integration: verify bootstrap+ground_truth delivered to respawned agent. Verify checkpoint_response for agent with matching schema version. Verify no re-delivery of committed events. Negative: malformed checkpoint_json → mechanical halt. Edge: absent PID → crashed. Edge: PID recycling (start-time mismatch) → crashed. Edge: stale pipeline_lock with dead PID → reclaimed. Edge: partial-commit → synthetic row. **OBJ-EC-3:** Verify role_schema_version=0 → HARD HALT, no checkpoint_response, no process started. **OBJ-EC-11:** Verify CurrentSchemaVersion=2, stored=1 → HARD HALT with both version numbers in message. **OBJ-EC-9:** AST check for cross-session comparison prohibition comment in resume.ps1.

**TLA+ Coverage:**
- Variables: `busStatus` (halted→resuming→running), `agentStatus` (dead→spawning→alive)
- Actions: `UserResumes`, `RouterResumesAgent`, `BusResumed`
- Invariants: `ExactlyOneBootstrapPerLifetime`, `GroundTruthPrecedesAgentMessage`, `BusRunningImpliesLockHeld`
- Liveness: `AgentsEventuallyAlive`

---

### Step 29: /Rollback Subsystem

**Tier:** 8 (depends on Steps 19, 22, 23, 25)

**Files:**
- `packages/vibe-cli/bus/router/rollback.ps1` (create)
- `packages/vibe-cli/bus/domain/rollback-coordinator.ps1` (create)
- `packages/vibe-cli/tests/bus/integration/rollback.Tests.ps1` (create)
- `packages/vibe-cli/docs/bidirectional-comms/bdd.feature` (modify — add /rollback-during-consensus scenario)

**Description:**

`Invoke-BusTakeSnapshot(w)`: guard `~snapshotExists[w]` AND `~rollbackRequested`; records `git config --get core.autocrlf` in snapshot metadata. After writing the snapshot bundle (git stash or bundle file), computes SHA-256 of the bundle file and stores it in `bus_state` row `snapshot_hash_<w>` within the same SQLite transaction as `snapshotExists[w]=TRUE`. **OBJ-R5-7 (Snapshot Integrity):** The hash and the existence flag are set atomically — no intermediate state where `snapshotExists=TRUE` but the hash is absent. `Invoke-BusRequestRollback(w)`: guard BusLifecycleState in {running,resuming} AND ~rollbackRequested AND snapshotExists[w] AND consensusState!='candidate' (OBJ-EC-16). `Invoke-BusAbortStaleRollback`. **OBJ-EC-17:** Restore emits [WARN] on core.autocrlf mismatch but proceeds.

**OBJ-R5-1 + OBJ-R5-7 + OBJ-R5-12 (RollbackCoordinator Domain Service):** `rollback-coordinator.ps1` defines `Invoke-BusRollbackCoordination(targetWorktree)` — the coordinator that replaces the ad-hoc rollback logic in `Invoke-BusExecuteRollback`. Sequence:

1. **Pre-flight guards:** verify `BusRunning`, `rollbackRequested=TRUE`, `rollbackTargetWorktree=targetWorktree`, `snapshotExists[targetWorktree]=TRUE`, and all `CommitOwner[w]=NULL` (drain verified).
2. **Snapshot integrity check (OBJ-R5-7):** read `snapshot_hash_<targetWorktree>` from `bus_state`; compute SHA-256 of snapshot bundle file; if mismatch → set `snapshotExists[targetWorktree]=FALSE` in SQLite, emit `[ALARM] Snapshot integrity check failed for worktree <w>: expected <expected_hash>, found <actual_hash>. Rollback rejected. Run 'vibe rollback --retake-snapshot' to capture a fresh snapshot.`; return `$false` (bus continues running, rollback rejected).
3. **Single-transaction rollback (OBJ-R5-12):** open `BEGIN IMMEDIATE` transaction covering ALL of the following SQLite mutations atomically: (a) restore git stash/bundle for `targetWorktree`; (b) DELETE `bus_snapshots` row for `targetWorktree`; (c) SET `bus_state.snapshotExists_<targetWorktree> = FALSE`; (d) SET `bus_state.rollbackRequested = FALSE`; (e) SET `bus_state.rollbackTargetWorktree = NULL`; (f) SET `bus_state.consensusRoundStart = nextEvtId`; (g) RESET `bus_state.committedDoneEvts = ''`; (h) RESET `bus_state.pendingDoneEvt_<w> = NULL` for all worktrees. COMMIT atomically. On commit failure: ROLLBACK; emit [ALARM]; halt with `failureCategory='sqlite_error'`.
4. **ConsensusRound reset:** call `Invoke-AdvanceRoundEpoch(nextEvtId)` on ConsensusRound aggregate (in-memory state update; SQLite state already updated in step 3).
5. **Halt:** call `Invoke-BusHalt('user_rollback', $null)` — first-halt-wins via halt latch.
6. **Cleanup:** call `Stop-AllBusAgents` and `Invoke-BusReleasePipelineLock`.

**Observable-Behavior Contract (OBJ-R5-1):** After `Invoke-BusRollbackCoordination` returns, `Get-BusStatus` must return `BusLifecycleState='halted'`, `HaltReason='user_rollback'`, `FailureCategory=NULL`. The ConsensusRound aggregate must reflect `RoundEpoch = nextEvtId_at_rollback_time`. Zero alive agent_sessions rows. This is the externally observable post-rollback state; the single-transaction boundary ensures there is no intermediate state visible to any external caller.

**OBJ-TLA-2 (ConsensusRoundStartMonotone — Concurrent Test):** 3 agents raise objections simultaneously via runspace pool; trigger rollback; assert RoundEpoch = NextEventId at rollback; assert post-rollback objections with evt_id < new RoundEpoch do NOT satisfy EmitCandidate guard. Invariant 21 checked after EVERY state transition.

**OBJ-EC-5 (Mid-Drain Crash):** If drain returns 'aborted' (BusLifecycleState != 'running' mid-poll), `Invoke-BusExecuteRollback` calls `Invoke-BusAbortStaleRollback` and returns WITHOUT modifying HaltReason or FailureCategory.

**OBJ-BDD-R3-1 (bdd.feature /rollback scenario):**
```gherkin
@tla-action-38 @tla-action-36 @invariant-20
Scenario: /rollback rejected when consensus round is active
  Given the bus is running with consensusState "candidate"
  And a snapshot exists for the current worktree
  When I issue the "/rollback" command
  Then the output contains "[ERROR] /rollback rejected: consensus round is active (consensusState='candidate'). Wait for consensus to resolve or call -Interrupt first."
  And the bus continues running
  And consensusState remains "candidate"
  And rollbackRequested remains false
```

**Dependencies:** Steps 19, 22, 23, 25

**Test (write first):** Integration: verify snapshot captured; verify rollback resets CommitState + advances RoundEpoch = NextEventId. Verify RoundEpoch <= NextEventId after rollback. Verify pre-rollback objections excluded from EmitCandidate guard in new round. Verify RouterAbortsStaleRollback clears rollbackRequested when bus halted (preserves snapshot). Verify -Resume blocked when rollbackRequested=TRUE. **OBJ-TLA-2:** Concurrent scenario: 3 agents; invariant 21 holds after every transition; post-rollback epoch scoping verified. **OBJ-EC-5:** Simulate AgentCrashes mid-drain; verify drain-aborted; agent_crash halt preserved; rollbackRequested cleared. **OBJ-EC-16:** Verify rollback during consensusState='candidate' → [ERROR], pipeline NOT halted. **OBJ-EC-17:** Verify snapshot records core.autocrlf; restore with mismatch → [WARN], completes. **OBJ-R5-1 (Observable Behavior):** After rollback completes, call `Get-BusStatus`; assert `BusLifecycleState='halted'`, `HaltReason='user_rollback'`, `FailureCategory=NULL`; assert `RoundEpoch = nextEvtId_at_rollback_time`; assert 0 alive agent rows. **OBJ-R5-7 (Snapshot Hash Integrity):** Verify `Invoke-BusTakeSnapshot` writes SHA-256 to `bus_state` atomically with `snapshotExists=TRUE`; verify `Invoke-BusRollbackCoordination` reads hash and verifies file; simulate partial write (truncate snapshot file after snapshotExists set but before hash stored) → verify detection and rejection with [ALARM]; verify bus continues running after rejection. **OBJ-R5-12 (Single-Transaction):** Verify all SQLite mutations in `Invoke-BusRollbackCoordination` execute within one `BEGIN IMMEDIATE` transaction (mock SQLite driver that records transaction boundaries; assert exactly 1 BEGIN IMMEDIATE, exactly 1 COMMIT, and all expected mutations within); verify process kill between any two mutations → startup recovery sees no partial rollback state (snapshotExists and rollbackRequested still both TRUE).

**OBJ-R8-2 (Rollback-Intent Journal):** Verify `rollback_intent_target_worktree` and `rollback_intent_started_at` written to `rollback_state` BEFORE main rollback BEGIN IMMEDIATE (mock SQLite recording write order; assert intent write precedes main transaction open). Verify `Invoke-BusRollbackIntentRecovery` re-runs rollback when intent present + rollbackRequested=TRUE. Verify intent keys ABSENT after clean rollback completion. Verify no-op when intent present + rollbackRequested=FALSE + snapshotExists=FALSE (already completed).

**OBJ-R8-3 (Recovery Idempotence):** Verify `rollback_execution_id` written in main transaction. Verify `Test-RollbackRecovery-Idempotence`: simulate crash-during-rollback by calling `Invoke-BusRollbackCoordination` twice with same `rollback_execution_id`; assert `consensusRoundStart` updated exactly once; assert `Invoke-AdvanceRoundEpoch` called exactly once (mock call recorder). Verify `Invoke-AdvanceRoundEpoch` no-op when called with `nextEvtId ≤ current RoundEpoch`.

**OBJ-R8-10 (Chaos Tests):** `Test-RouterAbortsStaleRollback-CtrlCDuringRollback-Chaos`: SIGINT + rollbackRequested=TRUE → haltReason='user_interrupt', rollbackRequested=FALSE, snapshotExists[w]=TRUE. `Test-RouterHaltsRollbackSqliteError-SQLiteError-Chaos`: BEGIN IMMEDIATE throws SQLITE_ERROR → busStatus='halted', failureCategory='sqlite_error', rollbackRequested=FALSE, rollbackTargetWorktree=NULL.

**OBJ-R8-12 (BusLifecycle Projection Boundary):** `Test-RollbackCoordinator-BusLifecycleBoundary`: mock `Get-BusLifecycleState` to return busStatus='halted'; verify drain-abort path taken; AST check: rollback-coordinator.ps1 has no direct SQL against bus_lifecycle_state.

**TLA+ Coverage:**
- Variables: `snapshotExists`, `rollbackRequested`, `rollbackTargetWorktree`, `consensusRoundStart`, `commitLockHolder`, `committedDoneEvts`, `pendingDoneEvt`, `consensusState`, `unresolvedObjections`, `overriddenObjections`
- Actions: `RouterTakesSnapshot`, `UserRequestsRollback`, `RouterExecutesRollback`, `RouterHaltsRollbackSqliteError`, `RouterAbortsStaleRollback`
- Invariants: `RollbackRequiresSnapshot`, `ConsensusRoundStartMonotone`, `CandidateHasEventInLog` (epoch-scoped)
- Implementation Invariants: `InvNoLostWrites`, `InvSnapshotIntegrity`
- Liveness: `RollbackEventuallyCompletes`

**Round 6 Additions (OBJ-R6-2, OBJ-R6-7, OBJ-R6-8, OBJ-R6-13, OBJ-R6-20, OBJ-R6-4):**

**Git Stash Outside Lock via WorkingTreeCoordinator (OBJ-R6-2, OBJ-R6-7, OBJ-R6-8):** `Invoke-BusTakeSnapshot(w)` is refactored:
1. Call `WorkingTreeCoordinator.Invoke-GitStash(w, label)` (Step 37) — **no mutex held, no SQLite transaction open**. This is a stutter step relative to TLA+. May take up to 2000ms (budget in performance-baselines.json).
2. BEGIN IMMEDIATE SQLite transaction.
3. INSERT `.snapshot` file path and compute SHA-256 hash inline.
4. Store `snapshotExists[w]=TRUE` and `snapshot_hash_<w>=<sha256>` atomically in `bus_state`.
5. COMMIT.
Steps 2-5 are the TLA+ `RouterTakesSnapshot(w)` action; step 1 is a stutter step. `rollback.ps1` contains NO direct git invocations — all are via WorkingTreeCoordinator.

Similarly, `Invoke-BusRollbackCoordination` calls `WorkingTreeCoordinator.Invoke-GitStashPop(w, stashRef)` or `WorkingTreeCoordinator.Invoke-GitRestore(w, stashRef)` BEFORE the `BEGIN IMMEDIATE` transaction — git restore is also a stutter step, outside the SQLite transaction boundary.

**Orphan .snapshot.tmp Cleanup (OBJ-R6-20):** `WorkingTreeCoordinator.Invoke-GitStash` writes to `.vibe/snapshots/<w>/<iso8601>.snapshot.tmp` first, then renames to `.snapshot` atomically. Step 5 `Open-BusDatabase` startup sequence calls `Remove-OrphanSnapshotFiles()` which deletes all `*.snapshot.tmp` files under `.vibe/snapshots/`. Step 29 adds `Test-SnapshotDuringRollbackRace`: (1) create `.snapshot.tmp` file, (2) simulate process kill, (3) restart bus, (4) verify `.snapshot.tmp` deleted and `snapshotExists[w]=FALSE`, (5) verify bus continues without halt.

**InvNoLostWrites Test (OBJ-R6-4):** `Test-InvNoLostWrites`: (1) commit 3 done events (status='committed' in event_log); (2) execute rollback; (3) read all `event_log` rows; (4) assert all 3 rows remain present with status='committed'; (5) assert no DELETE statement was executed on event_log (mock SQLite driver records all DML); (6) assert `committedDoneEvts` in `bus_state` is cleared (the in-memory tracking resets) but the event_log rows are permanent.

**InvSnapshotIntegrity Test (OBJ-R6-4):** `Test-InvSnapshotIntegrity-Atomic`: call `Invoke-BusTakeSnapshot`; use mock SQLite driver that fails COMMIT; verify `snapshotExists[w]` remains FALSE in `bus_state`; verify `snapshot_hash_<w>` absent; verify `.snapshot` file deleted (rollback of git stash on SQLite COMMIT failure). `Test-InvSnapshotIntegrity-HashMismatch`: truncate snapshot file after `snapshotExists[w]=TRUE` set; call `Invoke-BusRollbackCoordination`; verify hash mismatch detected; verify [ALARM] emitted; verify rollback REJECTED; verify `snapshotExists[w]` set to FALSE; verify bus continues running.

**Stuttering-Equivalence Update (OBJ-R6-2):** `stuttering-equivalence.md` updated: "git stash extraction in `Invoke-BusTakeSnapshot` (Step 29) runs via `WorkingTreeCoordinator` BEFORE the `BEGIN IMMEDIATE` transaction, making it a provable stutter step. The `RouterTakesSnapshot(w)` action maps exclusively to the `BEGIN IMMEDIATE`→`COMMIT` block that updates `snapshotExists[w]` and `snapshot_hash_<w>`. No TLA+ state variable is advanced during the git stash operation."

**Round 7 Addition (OBJ-R7-DDD-1):** `rollback.ps1` and `rollback-coordinator.ps1` are updated to read/write only the `rollback_state` table. The keys owned by this aggregate: `rollback_requested`, `rollback_target_worktree`, `snapshot_exists_<w>`, `snapshot_hash_<w>`. Any access to `bus_lifecycle_state` or `consensus_state` from within these modules fails the `check-tla-symbol-parity.ps1` cross-ownership lint. The RollbackCoordinator calls `Invoke-BusWalCheckpoint` (via `open-bus-database.ps1`) before its `BEGIN IMMEDIATE` transaction — this is the pre-rollback explicit checkpoint required by OBJ-R7-PERF-2.

**Round 8 Additions (OBJ-R8-2, OBJ-R8-3, OBJ-R8-10, OBJ-R8-12):**

**Rollback-Intent Journal (OBJ-R8-2):** `Invoke-BusRollbackCoordination` writes two journal keys — `rollback_intent_target_worktree` and `rollback_intent_started_at` — to `rollback_state` in a dedicated `BEGIN IMMEDIATE` → `COMMIT` BEFORE the main rollback transaction. New function `Invoke-BusRollbackIntentRecovery(db)` called from `Open-BusDatabase` (after WAL checkpoint): (a) if intent keys absent → no-op; (b) if intent keys present AND `rollbackRequested=FALSE` AND `snapshotExists[w]=FALSE` → rollback already committed; delete intent keys silently; (c) if intent keys present AND `rollbackRequested=TRUE` → crash occurred mid-rollback; re-invoke `Invoke-BusRollbackCoordination` with the stored target worktree and `rollback_execution_id` from the intent. The main rollback `BEGIN IMMEDIATE` transaction deletes the intent keys atomically alongside all other state updates — so a clean completion leaves no intent keys.

**Rollback Idempotence Key (OBJ-R8-3):** `Invoke-BusRollbackCoordination` generates a `rollback_execution_id` (GUID) at entry and writes it to `rollback_state` in the main `BEGIN IMMEDIATE` transaction. `Invoke-BusRollbackIntentRecovery` checks: if `rollback_execution_id` already exists in `rollback_state` alongside `snapshotExists[w]=FALSE` and `rollbackRequested=FALSE`, the rollback already completed; clean up intent keys and return without re-running. `Invoke-AdvanceRoundEpoch` (ConsensusRound aggregate) already enforces `ConsensusRoundStartMonotone` — calling it twice with the same `nextEvtId` is a no-op. Together, these provide dual idempotence protection against double-reset of consensus counters.

**BusLifecycle Projection Boundary (OBJ-R8-12):** `rollback-coordinator.ps1` reads `busStatus` exclusively via `Get-BusLifecycleState(db)` (the BusLifecycle aggregate's canonical projection function, Step 36). No direct SQL reads of `bus_lifecycle_state` table. This is the integration-boundary contract tested in `Test-RollbackCoordinator-BusLifecycleBoundary`.

**Chaos Tests (OBJ-R8-10):** Two chaos test functions added to `rollback.Tests.ps1`:
1. `Test-RouterAbortsStaleRollback-CtrlCDuringRollback-Chaos`: SIGINT fires while `rollbackRequested=TRUE`; verify `busStatus='halted'`, `haltReason='user_interrupt'`, `rollbackRequested=FALSE`, `snapshotExists[w]=TRUE` (snapshot preserved for re-issue post-Resume).
2. `Test-RouterHaltsRollbackSqliteError-SQLiteError-Chaos`: `rollbackRequested=TRUE`, `CommitOwner[w]=NULL`; mock `BEGIN IMMEDIATE` to throw `SQLITE_ERROR`; verify `busStatus='halted'`, `failureCategory='sqlite_error'`, `rollbackRequested=FALSE`, `rollbackTargetWorktree=NULL`.

**Dependencies:** Steps 19, 22, 23, 25, 37 (WorkingTreeCoordinator for git stash/restore)

---

### Step 30: Migrate Stages 2–7 to the Bus

**Tier:** 9 (depends on Steps 18, 21, 28, 29)

**Files:**
- `packages/vibe-cli/stages/2-parallel-writers.ps1` (modify)
- `packages/vibe-cli/stages/3-unified-debate.ps1` (modify)
- `packages/vibe-cli/stages/4-post-debate.ps1` (modify)
- `packages/vibe-cli/stages/5-implementation-writer.ps1` (modify)
- `packages/vibe-cli/stages/6-implementation-debate.ps1` (modify)
- `packages/vibe-cli/stages/7-coding.ps1` (modify)
- `packages/vibe-cli/bus/feature-flags.psd1` (create)
- `packages/vibe-cli/bus/domain/stage.ps1` (create)
- `packages/vibe-cli/vibe.ps1` (modify — feature-flag checks)
- `packages/vibe-cli/tests/bus/integration/stage-migration.Tests.ps1` (create)

**Description:**

Replace every non-interactive `Invoke-Claude` call site in Stages 2–7 with bus public functions. Stage 1 retains `Invoke-Claude -Interactive`. Stage 2: spawn tla-writer + bdd-writer as fan-out group. Stage 3: route objections to existing writer processes. Stages 4–7: migrate remaining invocations.

**OBJ-R3-4 (Incremental Commits):** Committed as **6 independent incremental commits** (one per stage file). Commit messages: `"migrate Stage <N> to bidirectional bus (independently revertable)"`. Before committing Stage 2, run `vibe schema-backup` to create `$env:VIBE_BUS_BACKUP_PATH/pre-stage-migration-<ISO8601>.db`. Rollback procedure documented in `migration-playbook.md`: `git revert Stage-N-commit-hash` for each stage in reverse order, then `vibe schema-rollback` to restore old tables.

**OBJ-CD-6 (Per-Stage Feature Flags + 24h Soak + PR-per-Stage Discipline):**

`feature-flags.psd1` defines six boolean flags, one per migrated stage:
```powershell
@{
  VIBE_STAGE_2_BIDIR = ($env:VIBE_STAGE_2_BIDIR -eq '1')
  VIBE_STAGE_3_BIDIR = ($env:VIBE_STAGE_3_BIDIR -eq '1')
  VIBE_STAGE_4_BIDIR = ($env:VIBE_STAGE_4_BIDIR -eq '1')
  VIBE_STAGE_5_BIDIR = ($env:VIBE_STAGE_5_BIDIR -eq '1')
  VIBE_STAGE_6_BIDIR = ($env:VIBE_STAGE_6_BIDIR -eq '1')
  VIBE_STAGE_7_BIDIR = ($env:VIBE_STAGE_7_BIDIR -eq '1')
}
```
Each stage file reads its flag at the top: if the flag is `$false`, the stage uses the existing `Invoke-Claude` path unchanged. If `$true`, the stage uses the new bus path. This means code for both paths coexists in each stage file until the flag is deprecated (Step 31 deletes old paths after all flags confirmed enabled in production for 24h+ each).

**PR-per-stage discipline:** Each stage is submitted as a separate PR: `feature/bidir-stage-2`, `feature/bidir-stage-3`, etc. A stage PR may only be merged if its flag is verified working in the CI `e2e-smoke` job. Each PR description must include: "24h soak start: <timestamp>" entered by the author after the PR is merged to main. The next stage PR is not opened until the prior stage's soak timestamp is > 24h ago. The `stage-soak-gate` CI job (Step 32) enforces this by checking a `stage-soak-log.txt` file committed to the repo.

**OBJ-DDD-1/4 (Stage Domain Object):** `stage.ps1` defines the `Stage` domain object:
- `StageNumber` (INT, 2-7)
- `Version` (INT, monotonically incremented each time the stage is executed within a bus session — starts at 1)
- `Etag` (TEXT, SHA-256 of all agent input events that fed this stage's execution; used for idempotency check on revert)
- `Status` (TEXT: `pending | running | completed | reverted`)
- `Invoke-StageRun(stageNumber)` — increments Version, computes Etag from current event_log slice, sets Status='running'
- `Invoke-StageComplete(stageNumber)` — sets Status='completed'
- `Invoke-StageRevert(stageNumber)` — sets Status='reverted'; **revert-idempotency invariant**: calling `Invoke-StageRevert` on an already-reverted stage is a no-op (no error, no Version increment); the invariant is: `Revert(Revert(stage)) = Revert(stage)` — the Etag and Status are unchanged on second revert call.

**Dependencies:** Steps 18, 21, 28, 29

**Test (write first):** Integration: verify Stage 2 no longer contains non-interactive Invoke-Claude calls when `VIBE_STAGE_2_BIDIR=1`. Verify Stage 2 uses existing Invoke-Claude path when `VIBE_STAGE_2_BIDIR` unset. Verify Stage 2 uses Send-BusEvent / Start-BusAgent when flag enabled. Verify Stages 3–7 similarly flag-guarded. Verify Stage 1 retains Invoke-Claude -Interactive regardless of flags. Verify Stage 3 objection routes to existing Stage 2 writer process (same session_id). Verify each stage commit is independently git-revertable (simulate revert of Stage 5 commit; verify Stages 2-4 and 6-7 pass their migration tests). **OBJ-CD-6:** Verify `feature-flags.psd1` correctly maps env vars to booleans; verify VIBE_STAGE_2_BIDIR='0' → flag=FALSE. Verify Stage 2 file uses flag-guard at top (AST check). **OBJ-DDD-1/4:** Verify `Invoke-StageRevert` is idempotent — call twice on same stage, assert Version unchanged on second call; assert Status='reverted' on both calls; assert Etag unchanged.

**TLA+ Coverage:** All 40 transitions become exercisable in the real workflow.

**Round 6 Additions (OBJ-R6-6, OBJ-R6-19):**

**Cascade-Order Documentation (OBJ-R6-6):** `docs/bidirectional-comms/cascade-order.md` is created alongside `feature-flags.psd1`. It specifies the authoritative flag evaluation order:
1. `VIBE_STAGE_2_BIDIR` — must be evaluated and confirmed enabled before Stage 3 flag is read
2. `VIBE_STAGE_3_BIDIR` — requires Stage 2 soaked at `canary_pct=100`
3. `VIBE_STAGE_4_BIDIR` — requires Stage 3 soaked at `canary_pct=100`
4. `VIBE_STAGE_5_BIDIR` → `VIBE_STAGE_6_BIDIR` → `VIBE_STAGE_7_BIDIR` — same progression

The document specifies: "A flag at position N in this cascade MUST NOT be set to `$true` unless all flags at positions 1 through N-1 have `soak-complete` entries in `stage-soak-log.txt`." This is the normative rule enforced by `cascade-order-check.ps1` (Step 32).

**Feature-Flags Cascade Validation at Load Time (OBJ-R6-19):** `feature-flags.psd1` is extended with a self-validating block that runs at `Import-PowerShellDataFile` time (via a scriptblock trick — the data file is converted to a `.ps1` helper that is dot-sourced):
```powershell
# Cascade invariant: flag N cannot be $true unless flag N-1 is $true
$_cascade = @(
  'VIBE_STAGE_2_BIDIR','VIBE_STAGE_3_BIDIR','VIBE_STAGE_4_BIDIR',
  'VIBE_STAGE_5_BIDIR','VIBE_STAGE_6_BIDIR','VIBE_STAGE_7_BIDIR'
)
for ($i = 1; $i -lt $_cascade.Length; $i++) {
  if ($flags[$_cascade[$i]] -and -not $flags[$_cascade[$i-1]]) {
    throw "[ALARM] Feature flag cascade violation: $($_cascade[$i])=true but $($_cascade[$i-1])=false. Flags must be enabled in cascade order per cascade-order.md."
  }
}
```
Test addition to `stage-migration.Tests.ps1`: verify that setting `VIBE_STAGE_3_BIDIR=1` while `VIBE_STAGE_2_BIDIR=0` throws `[ALARM] Feature flag cascade violation`; verify message includes both flag names; verify no other output or side-effect before the throw.

**Dependencies:** Steps 18, 21, 28, 29

---

### Step 31: Delete Obsolete Utilities

**Tier:** 9 (depends on Step 30)

**Files:**
- `packages/vibe-cli/utils/invoke-parallel.ps1` (delete)
- `packages/vibe-cli/utils/unified-debate-loop.ps1` (delete)
- `packages/vibe-cli/utils/debate-loop.ps1` (delete)
- `packages/vibe-cli/utils/invoke-verify.ps1` (delete)
- `packages/vibe-cli/utils/job-runner.ps1` (modify)
- `packages/vibe-cli/tests/bus/integration/deleted-utils.Tests.ps1` (create)

**Description:**

Delete four obsolete utilities. Modify job-runner.ps1 to retain only `Stop-ProcessTree`. Single commit, separately revertable from Stage 2–7 migration commits.

**Dependencies:** Step 30

**Test (write first):** Verify invoke-parallel.ps1 does not exist. Verify unified-debate-loop.ps1 does not exist. Verify debate-loop.ps1 does not exist. Verify invoke-verify.ps1 does not exist. Verify job-runner.ps1 exists and exports Stop-ProcessTree. Verify no stage file in stages/2–7 imports any deleted utility.

**TLA+ Coverage:** Structural enforcement — all pipeline communication flows through the bus.

---

### Step 32: CI Gates + TLC Gate + CI Workflow YAML + Perf Regression Gate

**Tier:** 10 (depends on Steps 1, 30)

**Files:**
- `packages/vibe-cli/tools/check-invoke-claude-migration.ps1` (create)
- `packages/vibe-cli/tools/check-red-commit-order.ps1` (create)
- `packages/vibe-cli/tools/run-tlc.ps1` (create)
- `packages/vibe-cli/tools/check-tla-version.ps1` (create)
- `packages/vibe-cli/tools/check-perf-baselines.ps1` (create)
- `packages/vibe-cli/.github/workflows/vibe-cli.yml` (create)
- `packages/vibe-cli/tla-spec-version.txt` (create)
- `packages/vibe-cli/bus/schema/stage-soak-log.txt` (create)
- `packages/vibe-cli/tests/bus/unit/ci-gates.Tests.ps1` (create)

**Description:**

**OBJ-R3-3 (TLC Gate):** `run-tlc.ps1` wraps `tlc BidirectionalComms.tla -config BidirectionalComms.cfg`; exits non-zero on any violation.

**OBJ-R3-3 (Version-Parity Gate):** `check-tla-version.ps1` reads spec header version (e.g., `\* v12`) from `BidirectionalComms.tla`, compares to `tla-spec-version.txt` (currently `v12`). Fails if they differ. Any spec update must update `tla-spec-version.txt` in the same commit.

**OBJ-R3-1 (TLA Name Lint Gate):** `check-tla-name-leaks.ps1` (from Step 1) runs as the `tla-name-lint` job.

**OBJ-R3-14 (CI Workflow YAML):** `vibe-cli.yml` defines 15 jobs in topological order:
- `lint`: PowerShell linting + `check-tla-name-leaks.ps1`
- `unit`: all `@unit` tagged Pester tests
- `integration`: all `@integration` tagged Pester tests (depends on `unit`)
- `tla-name-lint`: runs `check-tla-name-leaks.ps1` (depends on `lint`)
- `tlc-check`: runs `run-tlc.ps1` (parallel with lint)
- `tla-version-parity`: runs `check-tla-version.ps1` (parallel with lint)
- `atomic-cutover-check`: runs `check-invoke-claude-migration.ps1` (depends on `integration`)
- `no-invoke-claude-regression`: reruns AST walker on all stage files (depends on `integration`)
- `perf-baseline`: runs property test suite; compares timing to `performance-baselines.json` via `check-perf-baselines.ps1`; fails if any baseline exceeded by >20% (depends on `integration`)
- `red-green-order`: runs `check-red-commit-order.ps1` on all `Tests.ps1` / implementation file pairs (depends on `unit`)
- `stage-soak-gate`: reads `stage-soak-log.txt`; fails if any stage is flagged for PR-merge but soak timestamp is < 24h ago (depends on `integration`)
- `e2e-smoke-mock`: canary tier — runs 3 scenarios (normal-run, crash+resume, rollback) against mocked binaries (fast, < 60s; depends on `integration`)
- `e2e-smoke-contract`: canary tier — runs the same 3 scenarios with `contract-runner.ps1` serving real-binary-captured snapshot responses from Step 34 (validates bus works with real binary output format, not just invented mock format; depends on `e2e-smoke-mock` and `@contract` snapshot freshness check)
- `e2e-full`: full `bus-e2e.Tests.ps1` suite (depends on both `e2e-smoke-mock` and `e2e-smoke-contract`)
- `bdd-tag-lint`: runs `check-bdd-tags.ps1` against `bdd.feature` — fails if any Scenario lacks `@tla-action-N` or `@invariant-M` tag; also runs TLA+ identifier leak scan against step text (depends on `lint`, runs parallel with `tla-name-lint`) (OBJ-R5-8)

Weekly cron `@contract` trigger: Sundays 02:00 UTC AND on PR touching `packages/vibe-cli/bus/`, `utils/invoke-claude.ps1`, or `tests/helpers/`.

**OBJ-R3-14 (Perf Regression Gate):** `check-perf-baselines.ps1` compares per-test durations from Pester JSON output against `performance-baselines.json`. Fails if any test exceeds baseline by >20% (threshold configurable via `PERF_REGRESSION_THRESHOLD_PCT` env var).

**OBJ-CD-1 / OBJ-TDD-5 (Red-Commit Ledger / TDD CI Gate):** `check-red-commit-order.ps1` enforces the TDD RED→GREEN discipline via git history:
1. For each `*.Tests.ps1` file in `packages/vibe-cli/bus/` and `packages/vibe-cli/tests/`, find its first commit timestamp via `git log --follow --diff-filter=A --format="%ai" -- <path>`.
2. For each test file, identify the corresponding implementation file (by naming convention: `foo.Tests.ps1` → `foo.ps1`, `unit/foo.Tests.ps1` → `router/foo.ps1` or `domain/foo.ps1` using the `bounded-context-glossary.psd1` mapping).
3. If the implementation file's first commit SHA equals the test file's first commit SHA (same commit), emit: `[FAIL] RED-GREEN violation: <test-file> and <impl-file> share the same first commit <sha>. TDD requires the test file committed in a strictly prior commit.` (OBJ-R5-3) If the implementation file's first-commit timestamp is earlier than the test file's first-commit timestamp AND the SHAs differ, emit: `[FAIL] RED-GREEN violation: <impl-file> committed before <test-file>. TDD requires test file committed first.`
4. If the test file has no corresponding implementation file (orphaned test), emit `[WARN]` only.
5. Exit non-zero if any violation found.

The `red-green-order` CI job runs `check-red-commit-order.ps1` on every PR. Since this is post-hoc validation (not a pre-commit hook), it does not prevent wrong-order commits but does block PR merge on any violation.

**OBJ-CD-6 (Stage Soak Gate):** `stage-soak-log.txt` is a line-per-stage record:
```
stage=2 merged_at=2026-05-01T10:00:00Z soak_start=2026-05-01T10:00:00Z status=soaking
```
The `stage-soak-gate` CI job reads this file and fails if `soak_start` is < 24h before `$now` and status is not `soak-complete`. Before opening a PR for Stage N+1, the author manually updates Stage N's status to `soak-complete` after 24h. The CI gate validates this.

**Dependencies:** Steps 1, 30

**Test (write first):** Unit: verify AST walker identifies non-interactive Invoke-Claude call. Verify -Interactive flag exempts call. Verify Stage 1 file not flagged. Verify string literal not flagged. Verify `run-tlc.ps1` exits non-zero when TLC mock reports violations. Verify `check-tla-version.ps1` fails when tla-spec-version.txt='v11' but spec header says 'v12'. Verify `check-tla-version.ps1` passes when both='v12'. Verify `check-perf-baselines.ps1` fails when test exceeds baseline by >20%. Verify `vibe-cli.yml` contains all 15 jobs (AST check for job names). Verify `e2e-smoke-mock` depends on `integration` in YAML. Verify weekly cron trigger present in YAML. **OBJ-CD-1/TDD-5:** Verify `check-red-commit-order.ps1` emits [FAIL] when impl file is older than test file (mock git log with inverted timestamps). Verify passes when test file is older. Verify orphaned test file emits [WARN] only. Verify exit 0 on warning-only, exit non-zero on violation. **OBJ-CD-6:** Verify `stage-soak-gate` fails when soak_start is 1h ago and status='soaking'. Verify passes when status='soak-complete'. **OBJ-R5-3:** Verify `check-red-commit-order.ps1` emits [FAIL] when test file and impl file have the same first commit SHA (mock `git log` returning identical SHAs for both files). Verify [FAIL] message includes the SHA. Verify it still detects wrong-order when SHAs differ but impl is older. **OBJ-R5-10:** Verify `vibe-cli.yml` contains `e2e-smoke-mock` and `e2e-smoke-contract` as separate jobs (AST check for job names); verify `e2e-full` depends on both. **OBJ-R5-8:** Verify `vibe-cli.yml` contains `bdd-tag-lint` job; verify it runs `check-bdd-tags.ps1`; verify it depends on `lint`.

**TLA+ Coverage:** Structural enforcement + spec parity gating.

**Round 6 Additions (OBJ-R6-1, OBJ-R6-10, OBJ-R6-11, OBJ-R6-13, OBJ-R6-22, OBJ-R6-24, OBJ-R6-26, OBJ-R6-27):**

**Schema-Hash Parity CI Job (OBJ-R6-1):** New job `schema-hash-parity` added to `vibe-cli.yml` (now 20 jobs total). Runs `tools/generate-schema-hash.ps1 --verify` which recomputes the SHA-256 of all schema source files and compares against the pin in `bus/schema/schema.hash`. Depends on `lint`; runs in parallel with `tla-version-parity`. Fails if hash differs: `[ALARM] Schema hash mismatch: expected <pinned> actual <computed>. Run generate-schema-hash.ps1 to update pin after reviewing schema changes.` New files: `packages/vibe-cli/bus/schema/schema.hash` (pinned value, committed) and `packages/vibe-cli/bus/schema/soak-thresholds.psd1` (numeric thresholds, below).

**Cascade-Lint CI Job (OBJ-R6-11):** New tool `tools/cascade-order-check.ps1` and new `cascade-lint` CI job:
- Reads `docs/bidirectional-comms/cascade-order.md` for authoritative flag order
- Parses `bus/feature-flags.psd1` and all stage files for flag reads; builds evaluation DAG
- Fails if flag N is read before flag N-1 has been evaluated in the same execution path
- `ci-gates.Tests.ps1` additions: verify fails when `VIBE_STAGE_3_BIDIR` is read before `VIBE_STAGE_2_BIDIR`; verify passes when order is correct

**Naming-Convention CI Gate (OBJ-R6-13):** New tool `tools/naming-convention-check.ps1` and new `naming-lint` CI job:
- Exported functions must use `Verb-BusNoun` form (e.g., `Invoke-BusStart`, `Get-BusStatus`); internal helpers use `_` prefix
- `bus/domain/*.ps1` files: class-like exports must not start with verbs; `bus/router/*.ps1` must start with verb; `bus/infra/*.ps1` must start with noun
- Test: verify fails on function named `BusStart` (missing verb); verify passes on `Invoke-BusStart`; verify `_helper` prefix exempted

**Test-Fail Assertion Gate (OBJ-R6-22 adjacent):** New tool `tools/test-fail-assertion.ps1` and new `test-assertions` CI job:
- AST-walks all `*.Tests.ps1` files; verifies each `It` block contains at least one `Should` assertion
- Fails on any `It` block with no assertion (empty shell or bare script block)
- Test: verify fails on `It 'no assertion' {}` block; verify passes on `It 'has assertion' { $x | Should -Be 1 }`

**No-Real-Time-In-Tests CI Gate (OBJ-R6-22):** New `no-real-time` CI job:
- AST check on all `*.Tests.ps1` for `Start-Sleep`, `[System.Threading.Thread]::Sleep`, and bare `sleep` calls
- Also detects `Get-Date` called without a `-GetUtcNow` or `-GetTimestamp` scriptblock injection being passed in scope
- Fails with file path and line number for each violation
- Depends on `lint`; runs parallel with `unit`

**Round 7 Additions (OBJ-R7-TLA-1, OBJ-R7-BDD-1, OBJ-R7-TDD-2, OBJ-R7-CD-3, Unresolved CD-3, Unresolved PERF-3):**

**TLA↔Code Symbol Parity Gate (OBJ-R7-TLA-1):** New tool `tools/check-tla-symbol-parity.ps1`:
- Extracts all named action operator definitions from `BidirectionalComms.tla` (regex: lines matching `^<ActionName>(` in the ACTIONS section, plus operator names in the `Next` disjunction)
- Extracts all invariant names from `INVARIANT` keyword lines in the `.cfg` file
- For each action name: verifies at least one occurrence in `refinement-mapping.md` (in the "TLA+ Action" column) AND in at least one `*.Tests.ps1` file (in a string literal test description or `Should` assertion message)
- For each invariant name: verifies at least one `Should` assertion referencing the invariant name string in a `*.Tests.ps1` file
- Also enforces aggregate table boundary: reads the three aggregate-table ownership map from a new `tools/aggregate-table-ownership.psd1` file (mapping each table name to its owning step); fails if any `*.ps1` file outside the owning module contains a SQL query against a non-owned table (regex: `SELECT|INSERT|UPDATE|DELETE.*FROM <table>`)
- New CI job `tla-symbol-parity` (job #21); runs parallel with `tla-version-parity`; new file: `tools/aggregate-table-ownership.psd1`

**BDD Action Tag Binding Runner (OBJ-R7-BDD-1):** New tool `tools/check-bdd-action-tags.ps1`:
- Reads `TlaActionIndex` hashtable from `bounded-context-glossary.psd1` (N → action name string)
- For each `@tla-action-N` tag found in `bdd.feature`, looks up action name at index N from the hashtable
- Searches `BidirectionalComms.tla` source text for that action name as an operator definition (regex: `^<name>\s*==` or `<name>\(`)
- Emits: `[FAIL] @tla-action-<N> references '<name>' which does not exist in BidirectionalComms.tla v<version>. Update the TlaActionIndex in bounded-context-glossary.psd1 or the spec.` for any mismatch
- New CI job `bdd-action-tag-parity` (job #22); depends on `tla-version-parity` (spec must be version-parified before tags are validated against it); runs parallel with `bdd-tag-lint`

**Red-Phase Parse/Fail Distinction (OBJ-R7-TDD-2):** `test-fail-assertion.ps1` updated to a two-phase protocol:
1. **Parse phase:** `pwsh -NonInteractive -Command "Import-Module <test-file> -Force"` in subprocess; if exit code ≠ 0 AND stderr contains 'ParseException' or 'syntax error', exit 2 with `[FAIL] RED-PHASE PARSE ERROR: <file> has syntax errors. The red phase CANNOT be confirmed by a file that does not compile. Fix syntax first.`
2. **Assertion phase:** (only if parse succeeds) run `Invoke-Pester <test-file> -PassThru`; if ALL tests PASS: exit 1 with `[FAIL] GREEN-MASKING: all tests passed without the implementation file. TDD red phase not confirmed.`; if ≥1 test FAILS with an assertion error (not ParseException): exit 0 with `[PASS] Red phase confirmed: <N> test(s) failed as expected (AssertionException).`; any other failure: exit 3 with `[ERROR] Unexpected test runner failure.`
- Exit code taxonomy committed as `docs/tdd-exit-codes.md`: 0=red-confirmed, 1=green-masking, 2=parse-error, 3=unexpected; CI `test-red-phase` job treats exit 0 as success, all others as failure
- Updated test in `ci-gates.Tests.ps1`: verify exit 2 for syntax-error test file; verify exit 1 for a test file that trivially passes (no assertions); verify exit 0 for a test file with a failing `Should -Be 99` assertion against missing implementation

**Canary Rollback Criteria + Escalation Procedures (OBJ-R7-CD-3, Unresolved CD-3):** Two new documents:
- `docs/bidirectional-comms/canary-rollback-criteria.md` defines automated triggers (system acts without human approval): `error_rate > 0.1%` at any canary level, `crash_count > 0`, `p99_ms > SLA × 2` → automated: `Send-CanaryRollbackAlert -Mode Auto`; disable `VIBE_STAGE_N_BIDIR` flag; revert to prior `VIBE_CANARY_PCT` level.
- `docs/bidirectional-comms/canary-escalation-procedures.md` defines manual escalation triggers: `p99_ms ∈ (SLA × 1.5, SLA × 2]`, `error_rate ∈ (0.05%, 0.1%]` → page `$env:VIBE_ON_CALL_CONTACT` via `Send-CanaryRollbackAlert -Mode Page`.
- `$env:VIBE_CANARY_ROLLBACK_POLICY` env var controls behavior: `auto` (default) = automated rollback on hard triggers; `manual` = page only, human decides; `alert-only` = emit [ALARM] only.
- `stage-soak-gate` CI job updated to call `Send-CanaryRollbackAlert` when automated rollback conditions are met, log the action to `stage-soak-log.txt` with `status=auto-rollback`, and fail the CI job (blocking further canary progression).
- New files: `tools/send-canary-rollback-alert.ps1`

**Two-Tier Soak Thresholds (Unresolved PERF-3):** `bus/schema/soak-thresholds.psd1` is extended with two threshold tiers:
```powershell
@{
  # HARD thresholds — fail CI, block merge
  p99_ms_max       = 5.0
  error_rate_max   = 0.001  # 0.1%
  crash_count_max  = 0
  # SOFT thresholds — emit [WARN] only, do not block
  p99_ms_soft      = 3.0
  error_rate_soft  = 0.0005 # 0.05%
}
```
`stage-soak-gate` CI job checks BOTH tiers: HARD failures exit non-zero (block merge); SOFT violations emit `[WARN]` and exit 0 (informational). This resolves the MAJOR vs lower severity dissent — only HARD thresholds block.

New files added by Round 7 to Step 32:
- `packages/vibe-cli/tools/check-tla-symbol-parity.ps1`
- `packages/vibe-cli/tools/aggregate-table-ownership.psd1`
- `packages/vibe-cli/tools/check-bdd-action-tags.ps1`
- `packages/vibe-cli/tools/send-canary-rollback-alert.ps1`
- `packages/vibe-cli/docs/bidirectional-comms/canary-rollback-criteria.md`
- `packages/vibe-cli/docs/bidirectional-comms/canary-escalation-procedures.md`
- `packages/vibe-cli/docs/tdd-exit-codes.md`

New files added by Round 8:
- `packages/vibe-cli/tools/emit-gate-proof.ps1` (create)
- `packages/vibe-cli/tools/gate-ledger.ps1` (create)
- `packages/vibe-cli/tools/ratchet-perf-baselines.ps1` (create)
- `packages/vibe-cli/docs/gate-ledger.jsonl` (create — initially empty)
- `packages/vibe-cli/docs/perf-ratchet-log.json` (create — initially `[]`)
- `packages/vibe-cli/docs/bidirectional-comms/transaction-boundaries.md` (create)

**Updated YAML Job Count (Round 6):** `vibe-cli.yml` defined **20 jobs** after Round 6 (was 15 before Round 6).

**Updated YAML Job Count (Round 7):** After Round 7 additions, `vibe-cli.yml` defines **22 jobs** total:
```
Original 15: lint, unit, integration, tla-name-lint, tlc-check, tla-version-parity,
  atomic-cutover-check, no-invoke-claude-regression, perf-baseline, red-green-order,
  stage-soak-gate, e2e-smoke-mock, e2e-smoke-contract, e2e-full, bdd-tag-lint

Round 6 adds: schema-hash-parity, cascade-lint, naming-lint, test-assertions, no-real-time

Round 7 adds: tla-symbol-parity (job 21), bdd-action-tag-parity (job 22)
```

**Round 8 Additions (OBJ-R8-1, OBJ-R8-6, OBJ-R8-7, OBJ-R8-8):**

**Gate-Proof Manifest System (OBJ-R8-1):** New helper `tools/emit-gate-proof.ps1` called by each gate script at exit. It writes a `proof-artifact.json` file to `$env:RUNNER_TEMP/proof-artifacts/<gate_name>.json` containing: `{gate_name, commit_sha, run_id, timestamp_utc, outcome, proof_data, hmac}`. `proof_data` is gate-specific: `tlc-check` emits SHA-256 of TLC trace output; `bdd-tag-lint` emits SHA-256 of passing Scenario ID list; `perf-baseline` emits the `load-generator -Seed` value used. `hmac = HMAC-SHA256(ConvertTo-Json($proof_data) + run_id, $env:VIBE_GATE_SIGNING_KEY)`. New CI job #23 (`gate-proof-manifest`): collects all proof-artifact files from `$RUNNER_TEMP/proof-artifacts/`, verifies each HMAC, verifies all 22 expected gates have a passing entry, emits `[FAIL]` for any missing or tampered manifest. Depends on all other 22 jobs.

**Non-Repudiable Gate Ledger (OBJ-R8-6):** New file `tools/gate-ledger.ps1` appends chained HMAC entries to `docs/gate-ledger.jsonl`. Each entry: `{gate_name, timestamp_utc, commit_sha, outcome, prev_hash, hmac}` where `prev_hash = SHA256(last line of gate-ledger.jsonl)` and `hmac = HMAC-SHA256(gate_name || timestamp_utc || commit_sha || outcome || prev_hash, $env:VIBE_GATE_SIGNING_KEY)`. Each gate job calls `gate-ledger.ps1 --append` as a post-step. New CI job #24 (`gate-ledger-verify`): verifies chain integrity (each prev_hash equals SHA256 of prior line), verifies all HMACs, verifies no entries missing for current commit. Emits `[FAIL] Gate ledger tampered or entry missing` on any violation. `gate-ledger-verify` runs AFTER `gate-proof-manifest` (depends on it).

**Performance Drift Ratchet (OBJ-R8-7):** New file `tools/ratchet-perf-baselines.ps1`. Called as post-step of `perf-baseline` CI job. Reads `docs/perf-ratchet-log.json` (array of `{run_id, operation, measured_p99_ms, baseline_ms, status: observed|proposed|accepted|rejected}`). If latest 3 consecutive `observed` entries for an operation all have `measured_p99_ms < baseline_ms * 0.8`, emits `[INFO] Ratchet candidate: <op> p99=<N>ms is ≥20% below baseline <M>ms. Proposed: <P>ms.` and appends a `proposed` entry. No automatic commit; developer reviews and runs `ratchet-perf-baselines.ps1 --accept <operation>` to update `performance-baselines.json`. New file: `docs/perf-ratchet-log.json` (initially empty array `[]`).

**Transaction-Boundaries Documentation (OBJ-R8-8):** New file `docs/bidirectional-comms/transaction-boundaries.md` documenting each named BEGIN IMMEDIATE boundary. `check-tla-symbol-parity.ps1` updated with lint rule `multi-table-write-requires-boundary`: scans `bus/` for any file that opens a BEGIN IMMEDIATE and writes to more than one aggregate-owned table; fails if the boundary is not listed in `transaction-boundaries.md`. CI gate `tla-symbol-parity` (job #21) enforces this rule.

**Updated YAML Job Count (Round 8):** After Round 8 additions, `vibe-cli.yml` defines **24 jobs** total:
```
Original 15 + Round 6 adds 5 + Round 7 adds 2 + Round 8 adds 2 (gate-proof-manifest=job23, gate-ledger-verify=job24)
```

**Numeric Soak Thresholds (OBJ-R6-24):** `bus/schema/soak-thresholds.psd1` defines:
```powershell
@{ p99_ms_max = 5.0; error_rate_max = 0.001; crash_count_max = 0 }
```
`stage-soak-gate` CI job validates per-entry numeric fields in `stage-soak-log.txt`:
```
stage=2 ... status=soak-complete p99_ms=3.2 error_rate=0.00 crash_count=0
```
Gate fails if `p99_ms > 5.0`, `error_rate > 0.001` (>0.1%), or `crash_count > 0`. Test: verify gate fails when `p99_ms=6.0`; verify passes when `p99_ms=3.2, error_rate=0.00, crash_count=0`.

**Canary Ladder (OBJ-R6-26):** `stage-soak-log.txt` tracks canary progression: `canary_pct=1 → 5 → 25 → 100`. The gate validates that no stage jumps from `canary_pct < 100` to `soak-complete` without all four canary stages being recorded:
```
stage=2 ... status=canary canary_pct=1  p99_ms=2.1 error_rate=0.00 crash_count=0
stage=2 ... status=canary canary_pct=5  p99_ms=2.3 error_rate=0.00 crash_count=0
stage=2 ... status=canary canary_pct=25 p99_ms=2.8 error_rate=0.00 crash_count=0
stage=2 ... status=soak-complete canary_pct=100 p99_ms=3.2 error_rate=0.00 crash_count=0
```
Test: verify fails when `canary_pct` jumps from 1 to 100 without 5 and 25 stages; verify passes with full 1→5→25→100 ladder; verify numeric thresholds applied at each canary step (not just soak-complete).

**Per-Tier Rollback Procedures (OBJ-R6-27):** `docs/bidirectional-comms/migration-playbook.md` (new file in this step) documents rollback procedures for each execution tier:
- **Tier 1–2 (foundation):** `vibe schema-rollback` restores pre-migration DB snapshot; no git operations needed.
- **Tier 3–8 (router/domain):** `git revert <tier-commit-range> --no-commit && git commit`; then `vibe schema-rollback`.
- **Tier 9 (stage migration):** revert individual stage commits in reverse order (Stage 7 first); each is independently git-revertable per OBJ-R3-4; then `vibe schema-rollback`.
- **Tier 10–11 (CI/tests):** no rollback needed; CI changes are additive and non-breaking.
- Recovery test added to `stage-migration.Tests.ps1`: `Test-TierRollback-Tier9` — simulate `git revert` of Stage 5 commit; assert Stages 2–4 and 6–7 pass their migration tests; assert Stage 5 reverts to `Invoke-Claude` path.

**New files added by Round 6:**
- `packages/vibe-cli/tools/cascade-order-check.ps1` (create)
- `packages/vibe-cli/tools/naming-convention-check.ps1` (create)
- `packages/vibe-cli/tools/test-fail-assertion.ps1` (create)
- `packages/vibe-cli/bus/schema/schema.hash` (create)
- `packages/vibe-cli/bus/schema/soak-thresholds.psd1` (create)
- `packages/vibe-cli/docs/bidirectional-comms/migration-playbook.md` (create)

**Per-Stage Observability Targets (CHANGE 12):** `packages/vibe-cli/bus/schema/stage-observability-targets.psd1` defines WARNING thresholds (non-blocking — emit `[WARN]` in `stage-soak-gate` but do NOT fail CI) per migrated stage:

```powershell
@{
  Stage2 = @{ warn_p99_ms = 3.0; warn_error_rate = 0.0005; warn_queue_depth_pct = 0.80 }
  Stage3 = @{ warn_p99_ms = 3.0; warn_error_rate = 0.0005; warn_queue_depth_pct = 0.80 }
  Stage4 = @{ warn_p99_ms = 4.0; warn_error_rate = 0.001;  warn_queue_depth_pct = 0.85 }
  Stage5 = @{ warn_p99_ms = 4.0; warn_error_rate = 0.001;  warn_queue_depth_pct = 0.85 }
  Stage6 = @{ warn_p99_ms = 5.0; warn_error_rate = 0.001;  warn_queue_depth_pct = 0.90 }
  Stage7 = @{ warn_p99_ms = 5.0; warn_error_rate = 0.001;  warn_queue_depth_pct = 0.90 }
}
```

These WARNING thresholds are distinct from the HARD thresholds in `soak-thresholds.psd1`. Rationale: stages with more complex fan-out logic (Stages 6–7) get looser WARNING bands. HARD thresholds remain uniform at `p99_ms ≤ 5.0` and `error_rate ≤ 0.001`.

Tests for `stage-observability-targets.psd1`:
- Verify `stage-soak-gate` emits `[WARN]` (exit 0) when Stage 2 `p99_ms = 3.5` (above warn, below hard threshold)
- Verify `stage-soak-gate` emits `[FAIL]` (exit 1) when Stage 2 `p99_ms = 6.0` (above hard threshold)
- Verify all 6 stages have entries in `stage-observability-targets.psd1` (completeness check)

**Mutation Testing + Test-Must-Fail-First + Provenance Manifest (CHANGE 15):**

Three new CI requirements added to `vibe-cli.yml`:

1. **Mutation Score Gate (≥70% killed mutants):** New CI job `mutation-score` (job #30). Runs mutation operators from `tests/bus/mutation-operators.md` against `bus/router/` and `bus/domain/` files. Uses `Invoke-Pester` on the full unit + integration suite for each mutant. Gate: `mutation_score = killed_mutants / total_mutants ≥ 0.70`. Emits `[FAIL] Mutation score <N>% is below minimum 70%. <K> mutants survived.` on violation. New file: `packages/vibe-cli/tools/run-mutation-tests.ps1`.

2. **Test-Must-Fail-First Pre-Merge Check:** New CI job `test-fail-first` (job #31). For every `*.Tests.ps1` file added or modified in the PR diff: calls `test-fail-assertion.ps1` (Step 32 Round 7) in red-phase mode. Fails if any new test file passes all assertions without the implementation present (exit code 1 = green-masking). This mechanizes the TDD red phase in the PR gate, not just in history. New file: `packages/vibe-cli/tools/check-pr-test-files.ps1`.

3. **Fixture-Tier Provenance Manifest:** New file `packages/vibe-cli/tests/bus/provenance-manifest.json` records for each test file: `{path, tier, fixture_type, isolation_method, last_verified}`. `fixture_type` ∈ `{unit-mock, integration-sqlite, contract-snapshot, e2e-on-disk}`. New CI gate `provenance-manifest-check` (job #32) verifies: every `*.Tests.ps1` file appears in the manifest; no `e2e-on-disk` test file runs in the `unit` CI job; no `contract-snapshot` test runs without `@contract` tag. Fails if manifest is stale (any test file not listed). New file: `packages/vibe-cli/tools/check-provenance-manifest.ps1`.

**Updated YAML Job Count (Change 15):** After Change 15, `vibe-cli.yml` defines **32 jobs** total (29 previous + 3 new: mutation-score=job#30, test-fail-first=job#31, provenance-manifest-check=job#32).

**Dependencies:** Steps 1, 30, 38 (BDD audit must precede final CI YAML that enforces BDD tag completeness)

---

### Step 33a: Performance Baselines + Property Tests + Fairness Matrix (@contract-independent)

**Tier:** 10 (depends on Steps 28, 29, 36, 37)

**Files:**
- `packages/vibe-cli/tests/bus/performance-baselines.json` (modify)
- `packages/vibe-cli/tests/bus/properties/router-properties.Tests.ps1` (create)
- `packages/vibe-cli/tests/bus/properties/event-sequence-generator.ps1` (create)
- `packages/vibe-cli/tests/bus/mutation-operators.md` (create)
- `packages/vibe-cli/tests/bus/mutation-operators.md.sha256` (create)
- `packages/vibe-cli/docs/bidirectional-comms/fairness-obligation-matrix.md` (create)
- `packages/vibe-cli/docs/bidirectional-comms/stuttering-equivalence.md` (create)

**Description:**

Complete performance-baselines.json. Property-based tests asserting all 22 safety invariants. Trace-replay tests. Mutation testing catalog. Virtual-time injection; no real sleeps. Property suite under 60 seconds.

**OBJ-TLA-2 (ConsensusRoundStartMonotone Property):** 1000 random scenarios: 2–N agents raise objections concurrently via runspace pool, followed by random decision (ratify / fail / rollback). After each: assert RoundEpoch <= NextEventId; assert RoundEpoch never decreases; assert post-rollback objections with evt_id < RoundEpoch do NOT satisfy EmitCandidate guard. Under 30 seconds with virtual clocks.

**OBJ-TLA-4 (CandidateHasEventInLog Property):** 500 random consensus state machines. After each: if consensusState='candidate', assert event_log has row with type='consensus_candidate' AND evt_id >= RoundEpoch; if consensusState='open', assert NO such row. Under 30 seconds.

**OBJ-TDD-R3-1 (Event-Sequence Generator: Explicit Path + Seeded Determinism — CHANGE 9):** `packages/vibe-cli/tests/bus/properties/event-sequence-generator.ps1` is the standalone deterministic event-tuple emitter used by `router-properties.Tests.ps1`. It accepts `-Seed <int>` and `-Count <int>` parameters and emits a deterministic sequence of event tuples `{from, to, type, inReplyTo, groupId}` using a seeded `[System.Random]` instance. The seed is mandatory — callers must always pass an explicit seed; running without `-Seed` raises an error. This guarantees reproducibility: the same seed always produces the same sequence, making property-test failures debuggable. The name `event-sequence-generator.ps1` (not `load-generator.ps1`) reflects that it is a deterministic emitter of structured event tuples, not a traffic generator.

**OBJ-TLA-R3-a (Fairness-Obligation Matrix):** `fairness-obligation-matrix.md` contains the full 5×N table:

| Liveness Property | TLA+ Fairness Constraint | Fair-Scheduled Actions | Test IDs (Step:description) |
|---|---|---|---|
| `AgentsEventuallyAlive` | `WF_vars(DeliverBootstrap(a,w))`, `WF_vars(RouterRespawnsAgent(a))`, `WF_vars(RouterResumesAgent(a))`, `WF_vars(BusResumed)` | `DeliverBootstrap`, `RouterRespawnsAgent`, `RouterResumesAgent`, `BusResumed` | Step16:spawn-test, Step24:respawn-epoch-test, Step26:OBJ-TLA-3-fairness-test, Step28:resume-test |
| `CandidateEventuallyResolves` | `WF_vars(RouterRatifiesConsensus)`, `WF_vars(RouterFailsConsensus)` | `RouterRatifiesConsensus`, `RouterFailsConsensus` | Step23:happy-path-ratification, Step33:OBJ-TLA-4-500-random |
| `CommitLockEventuallyReleased` | `SF_vars(RouterCommitSucceeds(w))`, `WF_vars(RouterCommitFails(w))` | `RouterCommitSucceeds`, `RouterCommitFails` | Step22:commit-success-test, Step22:commit-failure-test, Step33:property-CommitLockEventuallyReleased |
| `ProtocolErrorEventuallyResolved` | `WF_vars(AgentEmitsAfterProtocolError(a))` | `AgentEmitsAfterProtocolError` | Step20:ack-clears-flag-test, Step33:property-ProtocolErrorEventuallyResolved |
| `RollbackEventuallyCompletes` | `WF_vars(RouterExecutesRollback)`, `WF_vars(RouterTakesSnapshot(w))`, `WF_vars(UserRequestsRollback(w))` | `RouterExecutesRollback`, `RouterTakesSnapshot`, `UserRequestsRollback` | Step29:execute-rollback-test, Step33:OBJ-TLA-2-1000-concurrent |

**(CHANGE 19) Extended Obligation Matrix (20 rows — one per WF/SF term in Fairness conjunction):**

| # | Obligation (WF/SF) | Action | Triggered-By (precondition) | PowerShell Function | Test-ID | Liveness-Property-Dependent |
|---|---|---|---|---|---|---|
| 1 | `WF(ReleasePipelineLock)` | `ReleasePipelineLock` | `pipeline_lock=1 ∧ busStatus='halted'` | `Invoke-BusReleasePipelineLock` | Step25:halt-releases-lock-test | `AgentsEventuallyAlive` |
| 2 | `WF(RouterCommitSucceeds(w))` | `RouterCommitSucceeds` | `commitLockHolder[w]≠NULL ∧ busStatus='running'` | `Invoke-BusCommitSerializer` | Step22:commit-success-test | `CommitLockEventuallyReleased` |
| 3 | `SF(RouterCommitSucceeds(w))` | `RouterCommitSucceeds` | same as row 2 (strong fairness) | `Invoke-BusCommitSerializer` | Step33:property-CommitLockEventuallyReleased | `CommitLockEventuallyReleased` |
| 4 | `WF(RouterCommitFails(w))` | `RouterCommitFails` | `commitLockHolder[w]≠NULL ∧ git-exit≠0` | `Invoke-BusCommitFail` | Step22:commit-failure-test | `CommitLockEventuallyReleased` |
| 5 | `WF(HandlerFails(h))` | `HandlerFails` | `handlerState[h]='busy' ∧ handler-timeout` | `Invoke-HandlerFail` | Step17:handler-fail-test | — |
| 6 | `WF(RouterTakesSnapshot(w))` ∀w | `RouterTakesSnapshot` | `rollbackRequested[w]=TRUE ∧ snapshotExists[w]=FALSE` | `Invoke-BusTakeSnapshot` | Step29:snapshot-test | `RollbackEventuallyCompletes` |
| 7 | `WF(UserRequestsRollback(w))` ∀w | `UserRequestsRollback` | `/rollback --worktree w` received | `Invoke-BusRequestRollback` | Step29:user-rollback-test | `RollbackEventuallyCompletes` |
| 8 | `WF(RouterExecutesRollback)` | `RouterExecutesRollback` | `rollbackRequested[w]=TRUE ∧ snapshotExists[w]=TRUE` | `Invoke-BusRollbackCoordination` | Step29:execute-rollback-test | `RollbackEventuallyCompletes` |
| 9 | `WF(RouterAbortsStaleRollback)` | `RouterAbortsStaleRollback` | `rollbackRequested[w]=TRUE ∧ consensusRoundStart advanced past rollback epoch` | `Invoke-BusAbortStaleRollback` | Step38:RouterAbortsStaleRollback-test | — |
| 10 | `WF(BusResumed)` | `BusResumed` | `busStatus='resuming' ∧ all agents alive` | `Invoke-BusResumed` | Step26:OBJ-TLA-3-fairness-test | `AgentsEventuallyAlive` |
| 11 | `WF(RouterRespawnsAgent(a))` ∀a | `RouterRespawnsAgent` | `agentStatus[a]='dead' ∧ busStatus='running'` | `Invoke-BusRespawnAgent` | Step24:respawn-epoch-test | `AgentsEventuallyAlive` |
| 12 | `WF(RouterResumesAgent(a))` ∀a | `RouterResumesAgent` | `agentStatus[a]='checkpointing' ∧ checkpoint_response received` | `Invoke-BusResumeAgent` | Step28:resume-test | `AgentsEventuallyAlive` |
| 13 | `WF(DeliverBootstrap(a,w))` ∀a,w | `DeliverBootstrap` | `agentStatus[a]='spawning' ∧ groundTruthDelivered[a]=FALSE` | `Invoke-AgentSessionBootstrap` | Step16:spawn-test | `AgentsEventuallyAlive` |
| 14 | `WF(HandlerAdapterCompletes(h))` ∀h | `HandlerAdapterCompletes` | `handlerState[h]='busy' ∧ handler result ready` | `Invoke-BusHandlerComplete` | Step17:handler-complete-test | — |
| 15 | `WF(AgentCheckpointResponse(a))` ∀a | `AgentCheckpointResponse` | `checkpointResponseInFlight[a]=TRUE` | `Invoke-BusCheckpointResponse` | Step24:checkpoint-response-test | `AgentsEventuallyAlive` |
| 16 | `WF(ModeratorEmitsCandidate(a))` ∀a | `ModeratorEmitsCandidate` | `consensusState='open' ∧ agent a is moderator` | `Invoke-BusEmitCandidate` | Step23:candidate-test | `CandidateEventuallyResolves` |
| 17 | `WF(RouterRatifiesConsensus)` | `RouterRatifiesConsensus` | `consensusState='candidate' ∧ no unoverridden objections` | `Invoke-BusRatifyConsensus` | Step23:happy-path-ratification | `CandidateEventuallyResolves` |
| 18 | `WF(RouterFailsConsensus)` | `RouterFailsConsensus` | `consensusState='candidate' ∧ unoverridden objections remain` | `Invoke-BusFailConsensus` | Step33:OBJ-TLA-4-500-random | `CandidateEventuallyResolves` |
| 19 | `WF(AgentEmitsAfterProtocolError(a))` ∀a | `AgentEmitsAfterProtocolError` | `pendingProtocolError[a]=TRUE ∧ agent acks error` | `Invoke-BusProtocolErrorAck` | Step20:ack-clears-flag-test | `ProtocolErrorEventuallyResolved` |
| 20 | `WF(RouterHaltsFeatureComplete)` | `RouterHaltsFeatureComplete` | `all agents done ∧ consensusState='ratified'` | `Invoke-BusHalt('feature_complete',…)` | Step25:feature-complete-halt-test | — |

This matrix is the authoritative record of which test exercises which fairness obligation. The CI `tla-version-parity` job (Step 32) validates that `fairness-obligation-matrix.md` references only action names that exist in the current spec version.

**OBJ-TLA-R3-b (Stuttering-Equivalence Proof Note):** `stuttering-equivalence.md` documents the refinement argument:

**Refinement mapping R** (ImplState → SpecState):
- `nextEvtId` ↔ `$NextEventId` (Interlocked counter)
- `eventLog` ↔ committed rows in `event_log` SQLite table
- `routedIds` ↔ `$DispatchedIds` in-memory set (rebuilt from `event_log` at startup)
- `agentStatus[a]` ↔ `agent_sessions.status` for agent role `a`
- `agentWorktree[a]` ↔ `agent_sessions` worktree field
- `busStatus` ↔ in-memory `$BusLifecycleState` (persisted to `bus_state` on halt)
- `consensusRoundStart` ↔ `bus_state` row `key='consensus_round_start'`
- (all 32 variables mapped)

**Stutter-step classification:** The following implementation operations are stutter steps (they do not advance any TLA+ state variable and thus map to `R(s) = R(s')`):
- WAL retry attempts (SQLite retries within a single TLA+ action)
- Mutex wait time (waiting to acquire VibeBus-PipelineLog or VibeBus-Commit-<w>)
- `Write-PipelineLog` calls
- `[TELEMETRY]` emit calls
- Process startup time (between `Start-Process` and first stdout line)
- Feature-flag reads from `feature-flags.psd1`
- Snapshot SHA-256 computation in `Invoke-BusTakeSnapshot` (does not advance any TLA+ variable)
- Pre-commit hook env var set/unset in `Start-WriteSession`/`Complete-WriteSession` (not a TLA+ state component)
- Halt latch CompareExchange in `Invoke-BusHalt` (coordination primitive, not a TLA+ variable)

**Non-stutter implementation actions** (each maps to exactly one named TLA+ action):
- `Invoke-BusAppendEvent` → `AppendEvent` helper (via `DeliverBootstrap`, `AgentSendsDone`, etc.)
- `Invoke-AgentSessionCrash` → `AgentCrashes`
- `Invoke-BusHalt` → one of the RouterHalts* actions based on reason/category
- `Invoke-BusRollbackCoordination` → `RouterExecutesRollback` (OBJ-R5-12: the single `BEGIN IMMEDIATE` transaction in Step 29 makes this mapping provable — all TLA+ state variables advanced by `RouterExecutesRollback` (`rollbackRequested`, `rollbackTargetWorktree`, `snapshotExists`, `consensusRoundStart`, `committedDoneEvts`, `busStatus`, `haltReason`, `failureCategory`) are updated atomically in one COMMIT; no intermediate state is observable between the first and last write; the git stash/bundle extraction before the transaction is a stutter step)
- (all 40 actions mapped)

**Fairness preservation argument:** For each WF/SF obligation in `fairness-obligation-matrix.md`, the corresponding implementation function is always eventually called when enabled: WF is satisfied by the PowerShell event loop (no starvation of runspace-registered handlers); SF for `RouterCommitSucceeds` is satisfied by the git commit always eventually succeeding (git external process, no infinite retry cap per OBJ-IMP constraint).

**Dependencies:** Steps 28, 29

**Test (write first):** Property: verify NoDuplicateEvtId holds for 1000 random event sequences. Verify TypeSenderACL holds for all 16xN role combinations. Trace: verify normal-run trace replays to correct final state. Verify crash+resume trace replays correctly. Verify rollback trace replays and RoundEpoch advances. Verify mutation-operators.md SHA256 matches committed hash. All timing-dependent property tests under 60s. **OBJ-TLA-2:** ConsensusRoundStartMonotone holds across 1000 concurrent-send+rollback scenarios; epoch scoping verified; under 30s. **OBJ-TLA-4:** CandidateHasEventInLog verified bidirectionally across 500 random consensus machines; under 30s. **OBJ-TDD-R3-1:** Verify `event-sequence-generator.ps1` with `-Seed 42 -Count 100` produces identical output on two consecutive calls. Verify running `event-sequence-generator.ps1` without `-Seed` raises an error. Verify the generator file exists at exactly `packages/vibe-cli/tests/bus/properties/event-sequence-generator.ps1` (path assertion). **OBJ-TLA-R3-a:** Verify `fairness-obligation-matrix.md` contains all 5 liveness properties. Verify each property row has at least one action name and one test ID. Verify all action names in the matrix exist in the TLA+ spec (cross-check against spec action list). **OBJ-TLA-R3-b:** Verify `stuttering-equivalence.md` contains sections: "Refinement Mapping", "Stutter-Step Classification", "Non-Stutter Actions", "Fairness Preservation Argument". Verify all 32 TLA+ variables appear in the refinement mapping section.

**OBJ-R8-4 (Cross-Aggregate Projection):** Verify `cross-aggregate-projection-contract.md` lists every cross-boundary read with isolation guarantee and staleness bound. Verify `Get-BusReadProjection` returns a typed PSCustomObject with fields for all cross-aggregate state. Verify `check-tla-symbol-parity.ps1` `cross-aggregate-direct-read` rule fails when a test module directly queries `bus_lifecycle_state` (inject a test file with a direct SELECT from bus_lifecycle_state; verify lint fails).

**OBJ-R8-5 (TLA+ Trace Map):** Verify `tla-trace-function-map.psd1` has exactly 40 entries. Verify each entry has FunctionName, Module, and Parameters keys. Verify Module path exists for all 40 entries. Verify `bus-trace-replay.Tests.ps1` replays a 5-action TLC counterexample (mock the PowerShell functions; verify each is called in sequence with correct arguments).

**OBJ-R8-8 (Transaction Boundaries):** Verify `transaction-boundaries.md` contains sections named `RollbackCoordinationUnit`, `HaltUnit`, `AppendEventUnit`, `TakeSnapshotUnit`. Verify each section lists tables, TLA+ variables, and recovery contract. Verify `check-tla-symbol-parity.ps1` multi-table-write rule fails on a synthetic test file that writes to both `consensus_state` and `bus_lifecycle_state` outside a documented boundary.

**TLA+ Coverage:**
- All 22 safety invariants tested as properties
- All 5 liveness properties exercised through trace replay
- Invariants 17 and 21 verified as bidirectional properties under concurrent load

**Round 6 Additions (OBJ-R6-9, OBJ-R6-12, OBJ-R6-14, OBJ-R6-15, OBJ-R6-16):**

**Refinement Mapping Document (OBJ-R6-9):** New file `docs/bidirectional-comms/refinement-mapping.md` is added to Step 33's deliverables (companion to `stuttering-equivalence.md`). It is the single authoritative table mapping every TLA+ abstract state variable to the corresponding PowerShell implementation artifact:

| TLA+ Variable | Implementation Artifact | Module | Notes |
|---|---|---|---|
| `nextEvtId` | `$NextEventId` (Interlocked counter) | `bus/infra/evt-id-allocator.ps1` | Rebuilt from MAX(evt_id) at startup |
| `eventLog` | `event_log` SQLite table rows (status='committed') | `bus/schema/schema.sql` | Uncommitted rows invisible to TLA+ state |
| `routedIds` | `$DispatchedIds` in-memory HashSet | `bus/router/router.ps1` | Rebuilt from `event_log` at startup |
| `agentStatus[a]` | `agent_sessions.status` column | `bus/domain/agent-session.ps1` | One row per role per session |
| `agentWorktree[a]` | `agent_sessions.worktree` column | `bus/domain/agent-session.ps1` | |
| `spawnedAtEvt[a]` | `agent_sessions.spawned_at_evt` column | `bus/domain/agent-session.ps1` | Epoch identity |
| `deadAtEvt[a]` | `agent_sessions.dead_at_evt` column | `bus/domain/agent-session.ps1` | NULL while alive |
| `busStatus` | `$BusLifecycleState` (in-memory); `bus_state.key='bus_status'` on halt | `bus/domain/bus-lifecycle.ps1` | Step 36 |
| `haltReason` | `bus_state.key='halt_reason'` | `bus/domain/bus-lifecycle.ps1` | NULL while running |
| `failureCategory` | `bus_state.key='failure_category'` | `bus/domain/bus-lifecycle.ps1` | NULL unless mechanical halt |
| `pipeline_lock` | `bus_state.key='pipeline_lock'` | `bus/domain/bus-lifecycle.ps1` | 0=unlocked, 1=locked |
| `snapshotExists[w]` | `bus_state.key='snapshot_exists_<w>'` | `bus/infra/working-tree-coordinator.ps1` | Step 37 |
| `rollbackRequested` | `bus_state.key='rollback_requested'` | `bus/router/rollback.ps1` | |
| `rollbackTargetWorktree` | `bus_state.key='rollback_target_worktree'` | `bus/router/rollback.ps1` | |
| `consensusRoundStart` | `bus_state.key='consensus_round_start'` | `bus/domain/consensus-round.ps1` | |
| `consensusState` | `bus_state.key='consensus_state'` | `bus/domain/consensus-round.ps1` | |
| `unresolvedObjections` | `bus_state.key='unresolved_objections'` (JSON array) | `bus/domain/consensus-round.ps1` | |
| `overriddenObjections` | `bus_state.key='overridden_objections'` (JSON array) | `bus/domain/consensus-round.ps1` | |
| `commitLockHolder` | `bus_state.key='commit_lock_holder'` | `bus/domain/commit-serializer.ps1` | NULL=unlocked |
| `committedDoneEvts` | `bus_state.key='committed_done_evts'` (JSON array) | `bus/domain/commit-serializer.ps1` | |
| `pendingDoneEvt` | `bus_state.key='pending_done_evt'` | `bus/domain/commit-serializer.ps1` | NULL=none pending |
| `groundTruthDelivered[a]` | `agent_sessions.ground_truth_delivered` column | `bus/domain/agent-session.ps1` | |
| `checkpointStored[a]` | `agent_sessions.checkpoint_stored` column | `bus/domain/agent-session.ps1` | |
| `checkpointResponseInFlight[a]` | `agent_sessions.checkpoint_inflight` column | `bus/domain/agent-session.ps1` | |
| `groupMembers[g]` | `group_members` table (group_id FK) | `bus/schema/schema.sql` | |
| `groupReplies[g]` | `group_replies` table | `bus/schema/schema.sql` | |
| `groupViolationPending[g]` | `bus_state.key='group_violation_<g>'` | `bus/router/fan-out.ps1` | |
| `pendingProtocolError[a]` | `agent_sessions.pending_protocol_error` column | `bus/domain/agent-session.ps1` | |
| `handlerState[h]` | `handler_sessions.state` column | `bus/domain/handler-adapter.ps1` | |
| `handlerPendingEvt[h]` | `handler_sessions.pending_evt_id` column | `bus/domain/handler-adapter.ps1` | |
| `handlerPendingAgent[h]` | `handler_sessions.pending_agent` column | `bus/domain/handler-adapter.ps1` | |
| `handlerPendingEpoch[h]` | `handler_sessions.pending_epoch` column | `bus/domain/handler-adapter.ps1` | |

Test: verify `refinement-mapping.md` table has exactly 32 rows (one per TLA+ variable); verify every TLA+ variable from the spec appears in the table; verify every `Module` path listed exists in the repo (file-existence assertion).

**Per-Operation Performance Budgets Table (OBJ-R6-12):** `performance-baselines.json` is extended with a per-operation budget table:

| Operation | p50 (ms) | p99 (ms) | p999 (ms) | Notes |
|---|---|---|---|---|
| `Invoke-BusAppendEvent` | 1 | 5 | 20 | SQLite BEGIN IMMEDIATE + COMMIT |
| `Send-BusEvent` | 1 | 5 | 20 | Same underlying transaction |
| `Invoke-BusTakeSnapshot` git stash (stutter) | 500 | 2000 | 5000 | Lock-free via WorkingTreeCoordinator; not on hot path |
| `Invoke-BusTakeSnapshot` SQLite commit | 1 | 5 | 20 | The TLA+ action; must meet same budget |
| `Invoke-BusRollbackCoordination` | 5 | 30 | 100 | Includes git stash-pop (stutter) + SQLite commit |
| `Invoke-BusHalt` | 1 | 5 | 20 | Interlocked latch + optional SQLite write |
| `Start-BusAgent` | 50 | 500 | 2000 | Process spawn; not on hot path |
| Write-PipelineLog mutex acquire | 0.1 | 2 | 10 | Named mutex; telemetry logged on contention |

Test: verify `performance-baselines.json` contains all 8 operation keys; verify p99 ≤ 5ms for `append_event` and `send_event`; verify p99 ≤ 2000ms for `snapshot_git_stash`.

**SQLite WAL Contention Characterization Test (OBJ-R6-14):** New test `Test-WalContention-Characterization` in `router-properties.Tests.ps1`:
- Spawns 16 concurrent runspaces all attempting `BEGIN IMMEDIATE` simultaneously on the same SQLite file
- Measures actual retry counts and wait times using the virtual clock
- Asserts: (a) all 16 transactions eventually commit (no deadlock); (b) maximum retry count ≤ 50; (c) p99 wait time ≤ 500ms under 16-way contention (documented not enforced — baseline only, recorded in `performance-baselines.json` as `wal_contention_16way_p99_ms`)
- The test is tagged `@characterization` (not `@regression`) — it documents observed behavior under contention rather than asserting a hard SLA, per WAL behavior which is workload-dependent

**evt_id Gaps Expected-Behavior Documentation (OBJ-R6-15):** New section in `stuttering-equivalence.md`: "evt_id Gap Policy". Documents: "evt_id values in `event_log` MAY have gaps. Gaps arise from: (1) allocator increments before transaction BEGIN; (2) transaction rollback after allocation. This is expected and correct. Consumers MUST NOT assume evt_ids are contiguous. The TLA+ spec models `nextEvtId` as a monotonically increasing counter, not a dense sequence — gaps are fully consistent with the spec. Duplicate evt_ids (NoDuplicateEvtId invariant) are the only constraint; gaps are unconstrained."
Test: `Test-EvtIdGapsAreExpected` — intentionally allocate 5 evt_ids, rollback 3 transactions, commit 2; assert `event_log` has rows with non-contiguous evt_ids (e.g., 1 and 5); assert NoDuplicateEvtId invariant still holds; assert gap detection query returns expected gap count.

**Telemetry Overhead Benchmark (OBJ-R6-16):** New benchmark test `Test-TelemetryOverhead-Benchmark` in `router-properties.Tests.ps1`:
- Runs `Invoke-BusAppendEvent` 1000 times with telemetry enabled vs. 1000 times with telemetry disabled (using a `-TelemetryEnabled` dependency injection parameter)
- Asserts: p99 overhead of telemetry vs. no-telemetry ≤ 1ms per operation (i.e., telemetry must not contribute more than 1ms to the p99 of any hot-path operation)
- Result recorded in `performance-baselines.json` as `telemetry_overhead_p99_ms`
- Tagged `@benchmark` — baseline recorded but not enforced as hard regression gate; the `perf-baseline` CI job only enforces the `append_event_p99_ms` hard limit

**Updated `performance-baselines.json` keys (OBJ-R6-12, OBJ-R6-14, OBJ-R6-16):**
```json
{
  "append_event_p99_ms": 5,
  "append_event_p999_ms": 20,
  "send_event_p99_ms": 5,
  "snapshot_git_stash_p99_ms": 2000,
  "snapshot_sqlite_commit_p99_ms": 5,
  "rollback_coordination_p99_ms": 30,
  "halt_p99_ms": 5,
  "agent_spawn_p99_ms": 500,
  "mutex_acquire_p99_ms": 2,
  "wal_contention_16way_p99_ms": 500,
  "telemetry_overhead_p99_ms": 1
}
```

**Round 7 Additions (OBJ-R7-PERF-1, OBJ-R7-PERF-2):**

**Liveness SLO Mapping (OBJ-R7-PERF-1):** New file `docs/bidirectional-comms/liveness-slo-mapping.md` maps each TLA+ liveness property to a concrete wall-clock SLO:

| TLA+ Liveness Property | WF/SF Constraint | Wall-Clock SLO | Performance Baseline Key |
|---|---|---|---|
| `AgentsEventuallyAlive` | `WF(DeliverBootstrap)`, `WF(RouterRespawnsAgent)` | agent_spawn_p99_ms ≤ 500ms; heartbeat_timeout ≤ 120s | `agent_spawn_p99_ms: 500` |
| `CandidateEventuallyResolves` | `WF(RouterRatifiesConsensus)`, `WF(RouterFailsConsensus)` | consensus_resolution ≤ 300 000ms (5 min) | `consensus_resolution_max_ms: 300000` |
| `CommitLockEventuallyReleased` | `SF(RouterCommitSucceeds)` | commit_lock_release_p99 ≤ git_commit_p99 + 100ms | `commit_lock_release_p99_ms: 600` |
| `ProtocolErrorEventuallyResolved` | `WF(AgentEmitsAfterProtocolError)` | protocol_error_ack ≤ 30 000ms | `protocol_error_ack_p99_ms: 30000` |
| `RollbackEventuallyCompletes` | `WF(RouterExecutesRollback)`, `WF(RouterTakesSnapshot)` | rollback_completion_p99 ≤ 5 000ms | `rollback_completion_p99_ms: 5000` |

New keys added to `performance-baselines.json` by Round 7:
```json
"consensus_resolution_max_ms": 300000,
"commit_lock_release_p99_ms": 600,
"protocol_error_ack_p99_ms": 30000,
"rollback_completion_p99_ms": 5000,
"wal_warn_threshold_mb": 10,
"wal_alarm_threshold_mb": 50
```

Test (Round 7): Verify `liveness-slo-mapping.md` contains rows for all 5 liveness properties; verify each `Performance Baseline Key` referenced in the table exists in `performance-baselines.json`; verify numeric values are self-consistent (e.g., `commit_lock_release_p99_ms > git_commit_p99_ms`).

**New file added by Round 6:**
- `packages/vibe-cli/docs/bidirectional-comms/refinement-mapping.md` (create)

**New file added by Round 7:**
- `packages/vibe-cli/docs/bidirectional-comms/liveness-slo-mapping.md` (create)

**Round 8 Additions (OBJ-R8-4, OBJ-R8-5, OBJ-R8-8, OBJ-R8-11):**

**Cross-Aggregate Projection Contract (OBJ-R8-4):** New file `docs/bidirectional-comms/cross-aggregate-projection-contract.md` specifying every cross-boundary read: which module reads from which foreign aggregate table, the SQLite WAL read-isolation guarantee (snapshot isolation per-transaction), and the staleness bound for each read. New file `bus/infra/bus-read-projection.ps1` defining `Get-BusReadProjection(db)` — a single typed read that collects cross-aggregate state (busStatus from bus_lifecycle_state, consensusRoundStart from consensus_state, handlerPendingEpoch from handler_sessions) in one consistent snapshot. All bus modules use this function instead of foreign-table SQL reads. `check-tla-symbol-parity.ps1` gains a new lint rule verifying no bus module directly queries a foreign aggregate table outside `bus-read-projection.ps1`.

**TLA+ Trace Function Map (OBJ-R8-5):** New file `bus/infra/tla-trace-function-map.psd1` mapping each TLA+ action (1–40) to `{FunctionName, Module, Parameters[]}`. `bus-trace-replay.Tests.ps1` updated to load this map and execute TLC counterexample traces by resolving each action to its PowerShell function. Test: verify map has exactly 40 entries; verify each `Module` path exists; verify `bus-trace-replay.Tests.ps1` can replay a 5-action TLC counterexample trace using the map and reach the correct final state.

**Contract-Dependent Test Fixture Boundary (OBJ-R8-11):** `bus-trace-replay.Tests.ps1` now imports `tests/contracts/snapshots/claude-output.snapshot.json` to ensure trace-replay uses contract-conformant agent output. Tests tagged `@contract-dependent` must run after Step 34 completes; tests tagged `@contract-independent` (NoDuplicateEvtId, TypeSenderACL property sweeps) may run in parallel with Step 34.

New files added by Round 8:
- `packages/vibe-cli/docs/bidirectional-comms/cross-aggregate-projection-contract.md` (create)
- `packages/vibe-cli/bus/infra/bus-read-projection.ps1` (create)
- `packages/vibe-cli/bus/infra/tla-trace-function-map.psd1` (create)

**Dependencies:** Steps 28, 29, 34, 36, 37

---

### Step 34: Test Double Contract Tests

**Tier:** 10 (depends on Steps 9, 30)

**Files:**
- `packages/vibe-cli/tests/contracts/claude-contract.Tests.ps1` (create)
- `packages/vibe-cli/tests/contracts/git-contract.Tests.ps1` (create)
- `packages/vibe-cli/tests/contracts/contract-runner.ps1` (create)
- `packages/vibe-cli/tests/contracts/snapshots/claude-output.snapshot.json` (create via contract-runner --snapshot)
- `packages/vibe-cli/tests/contracts/snapshots/git-output.snapshot.json` (create via contract-runner --snapshot)
- `packages/vibe-cli/tests/contracts/README.md` (create)

**Description:**

**OBJ-R3-13 (Contract-Test Circularity Resolved):** `contract-runner.ps1 --snapshot` captures real binary output to checked-in snapshot files. Unit tests load snapshot files and verify the double's $OutputSchema matches snapshot structure — the snapshot was captured from the real binary, not invented. README documents how to refresh snapshots when real binary format changes.

**OBJ-EC-2 (Fixture Isolation):** Contract tests use `$env:VIBE_BUS_DB_PATH = "$env:TEMP\vibe-contract-tests-$(New-Guid)\vibe-bus.db"`. Temp directory deleted at teardown (try/finally). Contract test DB path never equals default production DB path.

**OBJ-EC-12 (Bidirectional Verification):** Direction 1 (real → schema): for each field in snapshot, verify in $OutputSchema. Direction 2 (schema → real): for each field in $OutputSchema, verify in snapshot.

**OBJ-R3-13 (@contract Schedule):** CI job runs weekly cron AND on PR touching `packages/vibe-cli/bus/`, `utils/invoke-claude.ps1`, or `tests/helpers/`. (Defined in Step 32 YAML.)

**Canary Cohort Definition (CHANGE 14):** The canary cohort for `e2e-smoke-contract` is precisely defined as the set of 3 snapshot-based scenarios that substitute real-binary-captured output for fabricated mock responses:
1. **Normal-run cohort scenario:** `contract-runner.ps1` replays `claude-output.snapshot.json` for the standard Stage 2 → Stage 3 write/debate flow; verifies the bus routes all events and commits correctly.
2. **Crash + resume cohort scenario:** `contract-runner.ps1` replays `claude-output.snapshot.json` up to a simulated crash point, then replays `claude-output-resume.snapshot.json` on `-Resume`; verifies agent re-spawn epoch advances correctly.
3. **Rollback cohort scenario:** `contract-runner.ps1` replays `claude-output.snapshot.json` up to a `/rollback` command; verifies `RouterExecutesRollback` fires and `consensusRoundStart` advances.

Each snapshot file is gated by a freshness check: if the snapshot was captured > 30 days ago, the `e2e-smoke-contract` job emits `[WARN] Snapshot may be stale` and continues (not a blocker). If > 90 days old, the job fails with `[FAIL] Snapshot expired. Run contract-runner.ps1 --snapshot to refresh.`

New files added by Change 14:
- `packages/vibe-cli/tests/contracts/snapshots/claude-output-resume.snapshot.json` (create via contract-runner --snapshot)

**Dependencies:** Steps 9, 30

**Test (write first):** Unit (use snapshot files): verify claude-test-double $OutputSchema matches snapshot (Direction 1 and 2). Verify git-test-double $OutputSchema matches snapshot. **OBJ-EC-12:** Mock snapshot with extra field not in $OutputSchema → 'missing contract field' error; mock snapshot missing field that IS in $OutputSchema → 'phantom contract field' warning; contract-runner exits non-zero on error, exits zero on warning-only. **OBJ-EC-2:** Verify $env:VIBE_BUS_DB_PATH set to temp path; verify temp DB deleted at teardown even if test fails. Contract tests (@contract, require real binaries): verify $OutputSchema covers every top-level key in real claude NDJSON output; verify Vibe-Event-Id trailer preserved.

**TLA+ Coverage:** Structural correctness — ensures test infrastructure faithfully represents the real system boundary.

---

### Step 35: Final Completeness Review

**Tier:** 11 (depends on all prior steps)

**Files:**
- `packages/vibe-cli/tests/bus/e2e/bus-e2e.Tests.ps1` (create/finalize)

**Description:**

End-to-end test exercising the complete bus subsystem with on-disk SQLite and mocked claude/git/tlc. Verify: (1) all 7 public bus functions callable; (2) full Stage 2→3 pipeline run completes; (3) -Resume after simulated crash re-spawns agents correctly; (4) -Rollback resets state and advances RoundEpoch; (5) all 22 TLA+ safety invariants checkable against final SQLite state.

**Dependencies:** Steps 1–34

**Test (write first):** E2E (on-disk SQLite, deleted at teardown): verify all 7 public functions available. Run simulated Stage 2 with two writers — verify both done events committed. Simulate agent crash → -Resume → verify correct re-spawn. Simulate rollback → verify RoundEpoch advanced. Assert all 22 invariants against final SQLite state. Verify event_log has zero duplicate evt_ids. Verify no test-double process leaked after teardown. Verify checkpointed_at_mono monotonically non-decreasing within each session. Verify role_schema_version in all agent_sessions rows matches CurrentSchemaVersion. Verify PRAGMA journal_mode=WAL assertion fires at each connection. Verify lock hierarchy never violated during run. Verify TLA+ name-leak lint passes on all source files created in this project (run check-tla-name-leaks.ps1 against bus/ directory).

**TLA+ Coverage:**
- All 40 actions exercised in integration
- All 22 safety invariants verified against real SQLite state
- All 5 liveness properties exercised through the full pipeline lifecycle

---

### Step 36: BusLifecycle Aggregate

**Tier:** 2 (depends on Steps 1, 4, 5)

**Files:**
- `packages/vibe-cli/bus/domain/bus-lifecycle.ps1` (create)
- `packages/vibe-cli/tests/bus/unit/bus-lifecycle.Tests.ps1` (create)

**Description:**

Encapsulates all mutations to the `busStatus`, `haltReason`, `failureCategory`, and `pipeline_lock` TLA+ variables into a single aggregate. Before this step these variables were mutated ad-hoc by multiple callers; after this step Step 25 (Halt Conditions) exclusively delegates to this aggregate.

**Aggregate interface:**

- `Invoke-BusStart(db)` — sets `busStatus='running'`, `pipeline_lock=0`; idempotent if already running (no-op with [WARN])
- `Invoke-BusHalt(db, haltReason, failureCategory?)` — sets `busStatus='halted'`, writes `haltReason`; if `failureCategory` provided, also writes it; enforces `MechanicalHaltHasCategory` invariant at call site: if `haltReason` is a mechanical halt reason but `failureCategory` is NULL → throws `[ALARM]`
- `Invoke-BusResume(db)` — sets `busStatus='resuming'`; enforces guard: only allowed when `busStatus='halted'`; else throws
- `Invoke-BusResumed(db)` — transitions `busStatus='resuming'` → `'running'`; enforces guard: only allowed when `busStatus='resuming'`
- `Invoke-BusReleasePipelineLock(db)` — sets `pipeline_lock=0`; atomic CAS: only succeeds if `pipeline_lock=1` (caller-held)
- `Get-BusLifecycleState(db)` — returns `@{ BusStatus; HaltReason; FailureCategory; PipelineLock }` as a value object (read-only projection)

All methods execute within a `BEGIN IMMEDIATE` SQLite transaction. `Invoke-BusHalt` uses the halt-once latch (`[System.Threading.Interlocked]::CompareExchange`) before opening the transaction — if the latch is already set, returns immediately without touching SQLite.

**Round 7 Additions (OBJ-R7-EC-1, OBJ-R7-DDD-1):**

**SQLite-First Atomic Halt Pattern (OBJ-R7-EC-1):** The current design (CAS latch first, SQLite COMMIT second) violates `OnlyDefinedHalts` after a crash between the two operations. Fix: reverse the order and add a halt-intent journal.

`Invoke-BusHalt` revised sequence:
1. Write `halt_intent_reason` and `halt_intent_category` keys to `bus_lifecycle_state` inside a `BEGIN IMMEDIATE` → `COMMIT` — this is the crash journal. If SQLite fails here, no halt is recorded; recovery sees the failure and retries.
2. `[Interlocked]::CompareExchange($HaltLatch, 1, 0)` — first-caller-wins serialization point.
3. If CAS returned 0 (we won): open a second `BEGIN IMMEDIATE`, write `bus_status='halted'`, `halt_reason`, `failure_category`; delete `halt_intent_reason` and `halt_intent_category`; COMMIT. The journal is cleared atomically with the halt write.
4. If CAS returned 1 (someone else won): DELETE the halt_intent keys from step 1 in a `BEGIN IMMEDIATE`; ROLLBACK and return (no-op).

Recovery function `Invoke-BusHaltIntentRecovery(db)` is called from `Open-BusDatabase` AFTER `Invoke-BusWalCheckpoint` and BEFORE returning the connection:
- If `halt_intent_reason` key exists in `bus_lifecycle_state` AND `bus_status ≠ 'halted'`: re-execute step 3 using the stored intent values; emit `[WARN] Recovered halt intent from crash journal: haltReason='<N>' failureCategory='<N>'.`
- If `halt_intent_reason` exists AND `bus_status = 'halted'`: a prior recovery already completed; delete the intent keys silently.
- Returns `$true` if recovery was performed.

Crash window analysis (OnlyDefinedHalts preservation):
- Crash before halt_intent INSERT: no evidence; recovery sees `running` → correct (bus was running).
- Crash after halt_intent INSERT but before halt COMMIT: recovery reads intent → writes `bus_status='halted'` → correct.
- Crash after halt COMMIT: `bus_status='halted'` in SQLite → recovery no-ops → correct.

**Aggregate Table Ownership (OBJ-R7-DDD-1):** `bus-lifecycle.ps1` reads/writes ONLY `bus_lifecycle_state` table. All six key accesses (bus_status, halt_reason, failure_category, pipeline_lock, halt_intent_reason, halt_intent_category) are in this table. No code in this module references `consensus_state` or `rollback_state`.

Test additions (Round 7):
- `Test-HaltAtomicity-CrashBeforeCommit`: mock SQLite to throw on the halt COMMIT (step 3); call `Open-BusDatabase`; verify `Invoke-BusHaltIntentRecovery` fires; verify `bus_status='halted'` in DB; verify `[WARN] Recovered halt intent` emitted; verify `halt_intent_reason` key cleaned up after recovery
- `Test-HaltAtomicity-NoCrash`: normal halt path; verify `halt_intent_reason` key is ABSENT from `bus_lifecycle_state` after successful `Invoke-BusHalt` (journal cleaned up)
- `Test-OnlyDefinedHalts-AfterRecovery`: after recovery, call `Get-BusLifecycleState`; verify `haltReason` ∈ `{consensus_ratified, consensus_failed, feature_complete, mechanical_error, user_interrupt, user_rollback}`; verify `MechanicalHaltHasCategory` invariant satisfied
- `Test-HaltAtomicity-ConcurrentHalt`: 10 concurrent callers; verify exactly 1 halt written; verify halt_intent keys absent; verify latch = 1

**TLA+ Coverage:**
- Variables: `busStatus`, `haltReason`, `failureCategory`, `pipeline_lock`
- Actions: `RouterHaltsOnDuplicateEvtId`, `RouterHaltsAgentMismatch`, `RouterHaltsMechanicalError`, `RouterHaltsPipelineError`, `RouterHaltsOnSqliteError`, `RouterHaltsRollbackSqliteError`, `BusResumed`
- Invariants: `BusStatusDomain`, `MechanicalHaltHasCategory`, `CommitLockHolderAliveOrBusHalted`, `OnlyDefinedHalts` (crash recovery)
- Implementation Invariants: `InvHaltLatchMonotonic`

**Dependencies:** Steps 1, 4, 5

**Test (write first):**
- Verify `Invoke-BusHalt` with `haltReason='mechanical'` and `failureCategory=NULL` throws `[ALARM]` (MechanicalHaltHasCategory guard)
- Verify `Invoke-BusResume` when `busStatus='running'` throws (wrong precondition)
- Verify `Invoke-BusResumed` when `busStatus='running'` throws (wrong precondition)
- Verify `Invoke-BusHalt` called twice: second call is no-op (latch prevents double-write); final DB state has first halt reason
- `Test-InvHaltLatchMonotonic`: call `Invoke-BusHalt` from 10 concurrent runspaces simultaneously; assert DB contains exactly one `halt_reason` row; assert latch value = 1 after all runspaces complete; assert `[TELEMETRY] halt-once latch: competitor suppressed` emitted for 9 of 10 calls
- Verify SIGTERM shutdown (mock SIGTERM event): assert `Invoke-BusHalt(haltReason='user_interrupt')` called exactly once; assert `pipeline_lock` released
- Verify `Get-BusLifecycleState` returns correct projection after each state transition

---

### Step 37: WorkingTreeCoordinator

**Tier:** 1 (depends on Step 9)

**Files:**
- `packages/vibe-cli/bus/infra/working-tree-coordinator.ps1` (create)
- `packages/vibe-cli/tests/bus/unit/working-tree-coordinator.Tests.ps1` (create)

**Description:**

Provides a thin abstraction layer over all git operations performed by the bus. This isolates git I/O from SQLite transactions, enabling the proven stutter-step classification in `stuttering-equivalence.md`: every git operation runs **outside** any open transaction or held mutex, mapping to `R(s) = R(s')` in the TLA+ refinement.

All functions call the `git-test-double` (Step 9) when `$env:VIBE_BUS_TEST_MODE='1'`, preventing any real git invocations in tests.

**Functions:**

- `Invoke-GitAdd(worktree, paths[])` — runs `git add <paths>` in the specified worktree directory
- `Invoke-GitCommit(worktree, message, env)` — runs `git commit -m <message>` with the provided environment variables (e.g., `VIBE_BUS_COMMIT_IN_PROGRESS=1`)
- `Invoke-GitStash(worktree, label)` — runs `git stash push -u -m <label>`; writes stash ref to `$worktree/.vibe/snapshots/<w>/<iso8601>.snapshot.tmp`; renames to `.snapshot` on success; returns stash ref
- `Invoke-GitStashPop(worktree, stashRef)` — runs `git stash pop <stashRef>`
- `Invoke-GitRestore(worktree, stashRef)` — runs `git stash show -p <stashRef> | git apply --reverse` (non-destructive restore)
- `Invoke-GitReset(worktree, mode)` — runs `git reset <mode>` (e.g., `--hard`, `--mixed`)

All functions: (1) validate no mutex is held at call time via `$env:VIBE_BUS_COMMIT_IN_PROGRESS` check — throws `[ALARM]` if called inside a write session; (2) validate `VIBE_BUS_DB_PATH` is NOT set to an open SQLite connection handle (structural guard against transaction-inside-git); (3) emit `[TELEMETRY] git-op: <op> worktree=<w> duration_ms=<n>` after completion.

**TLA+ Coverage (stutter steps — no TLA+ action advancement):**
- `RouterTakesSnapshot(w)`: the git stash in `Invoke-GitStash` is a stutter step; the TLA+ action maps to the subsequent SQLite transaction only
- `RouterCommitSucceeds(w)`: `Invoke-GitCommit` is a stutter step; the TLA+ action maps to the SQLite row update (`committedDoneEvts`)
- All other git operations: stutter steps by the same argument

**Dependencies:** Step 9 (test doubles for git)

**Test (write first):**
- Verify `Invoke-GitStash` called with `VIBE_BUS_COMMIT_IN_PROGRESS=1` throws `[ALARM]` (mutex guard)
- Verify `Invoke-GitStash` writes `.snapshot.tmp` then renames to `.snapshot` atomically (mock filesystem; assert rename called)
- Verify `Invoke-GitStash` in test mode calls git-test-double, not real `git`; assert no real process spawned
- `Test-WorkingTreeCoordinator-TelemetryEmit`: call each of the 6 functions; assert `[TELEMETRY] git-op:` line emitted for each; assert `duration_ms` is a non-negative integer
- Verify `Invoke-GitCommit` passes the provided env vars to the subprocess (mock `Start-Process`; assert `-EnvironmentVariables` arg includes `VIBE_BUS_COMMIT_IN_PROGRESS`)
- `Test-p99Budget-GitStash`: run `Invoke-GitStash` 100 times with git-test-double (simulates p99 ≤ 5ms for mock); verify virtual-clock p99 ≤ 5ms for the mock call; document real-git budget as 2000ms in `performance-baselines.json` (not tested with real git in unit tier)

**Round 7 Addition (OBJ-R7-EC-2):**

**Bounded-Retry File.Replace Wrapper (OBJ-R7-EC-2):** `WorkingTreeCoordinator` adds `Invoke-AtomicFileReplace(source, destination)` as the SOLE file-rename function used anywhere in the `bus/` directory. No direct `[System.IO.File]::Move`, `[System.IO.File]::Replace`, or `Rename-Item` calls exist outside this function.

Retry policy:
1. Call `[System.IO.File]::Replace($source, $destination, $null)` (no backup file; atomic on NTFS).
2. On `System.IO.IOException` (sharing violation from antivirus/indexer): wait `(100ms * 2^(attempt-1)) + Random(-25ms, +25ms)` (jitter seeded from file path hash); retry up to 8 attempts.
3. On each retry (attempts 2–8): emit `[WARN] File.Replace sharing violation on attempt <N>/8: <path>. Retrying in <delay>ms. Suspected antivirus or indexer lock.`
4. On exhaustion (attempt 9 would be next): emit `[ALARM] File.Replace failed after 8 attempts: <path>. failureCategory=git_commit.`; call `Invoke-BusHalt(haltReason='mechanical_error', failureCategory='git_commit')`.
5. On `System.UnauthorizedAccessException` or other non-retryable exceptions: do NOT retry; immediately emit `[ALARM]` and halt.

`git_commit` is the closest existing `FailureCategory` for a filesystem-layer failure in the git stash pipeline; no TLA+ spec change is required.

New file: `packages/vibe-cli/bus/infra/atomic-file-replace.ps1` (may be co-located in `working-tree-coordinator.ps1` as an internal function or extracted as its own file for testability).

Test additions (Round 7):
- `Test-AtomicFileReplace-SharingViolation-Retry`: mock `[System.IO.File]::Replace` to throw `IOException` for first 3 calls, succeed on 4th; verify `[WARN]` emitted exactly 3 times; verify rename succeeds; verify `duration_ms` in `[TELEMETRY]` line covers all 4 attempts
- `Test-AtomicFileReplace-ExhaustionHalts`: mock to always throw `IOException`; verify `Invoke-BusHalt` called after attempt 8; verify `[ALARM]` emitted with `failureCategory=git_commit`; verify exactly 8 `[WARN]` lines
- `Test-AtomicFileReplace-NonRetryableException`: mock to throw `UnauthorizedAccessException` on attempt 1; verify immediate halt (no retry); verify `[ALARM]` emitted

**Edge-Case Coverage (CHANGE 17):** Six additional edge-case tests that must pass in this step:

1. **`.git/index.lock` during Invoke-GitAdd:** mock `git add` to fail with `fatal: Unable to create '.git/index.lock': File exists`; verify `[ALARM]` emitted with `failureCategory='git_index_lock'`; verify `Invoke-BusHalt` called; verify no retry (index.lock is a non-retryable non-transient error).
2. **EPIPE on stdin write:** mock agent stdin `StreamWriter` to throw `IOException` with message containing "Broken pipe" or "The pipe has been ended"; verify `Invoke-BusAgentCrashHandler` called; verify `[ALARM]` emitted; verify bus halts with `failureCategory='agent_crash'`.
3. **Cross-volume rename in Invoke-AtomicFileReplace:** mock `[System.IO.File]::Replace` to throw `IOException` with message "The system cannot move the file to a different disk drive"; verify this is treated as non-retryable (not a sharing violation); verify immediate halt with `[ALARM]` and `failureCategory='git_commit'`.
4. **Hyper-V clock jump during checkpoint:** mock `GetTimestamp()` to return a value less than the previous call (simulating a virtual-machine clock regression); verify `checkpointed_at_mono` is NOT updated with the regressed value; verify `[WARN] Monotonic clock regression detected: <delta>ms. Retaining prior checkpoint_at_mono.` emitted; verify checkpoint proceeds without halt.
5. **group-id epoch on -Resume:** after `-Resume`, verify all in-flight `group_id` values from the prior session are cleared from the in-memory group membership map; verify that a stale `group_id` from before the resume does not produce a `Wait-BusGroup` match against post-resume replies (prevents ghost-group fan-out completion).
6. **alarms.log ENOSPC retry:** mock `.vibe/alarms.log` append to throw `IOException` with message containing "No space left on device"; verify the ALARM entry is NOT silently dropped — instead emitted to stderr; verify `Write-PipelineLog` does not halt the bus for an alarms.log write failure (alarms.log is observability-only, not on the critical path); verify `[WARN]` emitted to stdout indicating alarms.log is unavailable.

---

### Step 38: BDD Feature Audit, Tagging and Observable-Behavior Refactor

**Tier:** 10 (depends on Steps 1, 4, 25, 28, 29)

**Files:**
- `packages/vibe-cli/docs/bidirectional-comms/bdd.feature` (modify — tag all scenarios, remove TLA+ leaks, refactor to observable behaviors)
- `packages/vibe-cli/tools/check-bdd-tags.ps1` (create — already referenced by Step 32; defined here)
- `packages/vibe-cli/tools/check-tla-leaks-in-bdd.ps1` (create)
- `packages/vibe-cli/tests/bus/unit/bdd-audit.Tests.ps1` (create)

**Description:**

Addresses all BDD structural defects identified in Round 6 (OBJ-R6-5, OBJ-R6-9):

**Tagging All 335 Scenarios (OBJ-R6-9):** Every Scenario and Scenario Outline in `bdd.feature` receives:
1. At least one `@tla-action-N` tag (N = the TLA+ action index this scenario exercises)
2. At least one `@invariant-M` tag where the scenario asserts a safety invariant (M = invariant number); scenarios that do not assert an invariant are tagged `@invariant-none` (explicit)
3. A severity tag: `@tier-smoke` (3 scenarios: normal-run, crash+resume, rollback), `@tier-regression` (all others)

**Removing 263 TLA+ Identifier Leaks (OBJ-R6-5):** All Gherkin step text that contains TLA+ operator names, variable names, or spec identifiers is replaced with observable-behavior language. Examples of replacements:
- `"And RouterCommitSucceeds advances committedDoneEvts"` → `"And the committed event count increases by 1"`
- `"When AgentSendsDone is triggered"` → `"When the agent writes its done event to stdout"`
- `"Then consensusState is 'candidate'"` → `"Then the bus status output shows consensus is pending"`
- `"And nextEvtId is incremented"` → `"And the next event in the log has a higher ID than the previous"`

`check-tla-leaks-in-bdd.ps1` AST-parses `bdd.feature` and fails if any step text matches the identifier list from `bounded-context-glossary.psd1`'s `TlaIdentifiers` key. This is the gate added to `bdd-tag-lint` CI job.

**Converting to Scenario Outlines (OBJ-R6-5):** Groups of 3+ nearly-identical scenarios are merged into Scenario Outlines with `Examples` tables. Target: reduce 335 scenarios to ≤ 280 after consolidation (without losing coverage). Each removed scenario must be provably subsumed by an Outline row.

**Background Cleanup Order:** `bdd.feature` top-level `Background` section is extended with an explicit teardown hint comment: `# Cleanup order: (1) delete agent_sessions rows, (2) delete event_log rows, (3) delete bus_state rows, (4) delete SQLite file`. This prevents FK constraint errors on test cleanup.

**`check-bdd-tags.ps1` Definition:** The tool (referenced in Step 32 as pre-existing) is formally defined here:
- Reads `bdd.feature`; extracts all `Scenario:` and `Scenario Outline:` blocks
- Fails if any block has no `@tla-action-N` or `@tla-action-none` tag (see Round 7 exemption policy)
- Fails if any block has no `@invariant-M` or `@invariant-none` tag
- Emits list of passing/failing scenarios with their tags
- Exit 0 = all tagged; exit 1 = violations found

**Round 7 Additions (Unresolved TDD-1, Unresolved BDD-2, OBJ-R7-BDD-1):**

**@tla-action-none Exemption Policy (Unresolved TDD-1 — resolved as MAJOR):** `@tla-action-none` is PERMITTED as a tag (not a BLOCKER). It signals that the scenario covers user-observable behavior with no direct TLA+ action mapping (e.g., deployment smoke tests, infrastructure scenarios). However, `@tla-action-none` MUST be accompanied by `@tla-action-none-reason="<text>"` tag. `check-bdd-tags.ps1` updated:
- Accepts `@tla-action-none` as valid for the action-tag requirement — no [FAIL] on the action tag check
- If `@tla-action-none` present without `@tla-action-none-reason=...`, emits `[FAIL] @tla-action-none at line <N> requires @tla-action-none-reason="<explanation>" tag. Add the reason tag explaining why no TLA+ action applies.`
- Valid reason values: `"infrastructure"`, `"deployment-smoke"`, `"migration-ux"`, `"user-observable-behavior-only"`, or any other non-empty string
- Exempted scenarios are listed in a `@tla-action-none` audit report emitted at the end of every `check-bdd-tags.ps1` run for human review

**rollbackTargetWorktree Scenario Outline (Unresolved BDD-2 — resolved as MAJOR):** New Scenario Outline added to `bdd.feature` covering TLA+ OBJ-4(v9) worktree scoping. This subsumes three previously copy-pasted rollback worktree scenarios:

```gherkin
@tla-action-38 @tla-action-36 @tla-action-39 @invariant-20
Scenario Outline: /rollback worktree scoping with snapshot states
  Given the bus is running
  And a snapshot <snapshot_state> for worktree "<worktree>"
  When I issue "/rollback --worktree <worktree>"
  Then the output contains "<expected_output>"
  And the rollback result is "<rollback_result>"

  Examples:
  | worktree | snapshot_state            | expected_output                                                                  | rollback_result |
  | wt1      | exists                    | [INFO] Rollback to snapshot for wt1 initiated                                    | success         |
  | wt2      | does not exist            | [ERROR] No snapshot exists for worktree wt2. Cannot rollback.                    | rejected        |
  | wt1      | corrupted (hash mismatch) | [ALARM] Snapshot integrity check failed for wt1. Rollback rejected.              | rejected        |
```

This outline covers: valid rollback (TLA+ `RouterExecutesRollback`), missing snapshot (`RollbackRequiresSnapshot` caught early), and corrupted snapshot (`InvSnapshotIntegrity` enforcement).

**TlaActionIndex in bounded-context-glossary.psd1 (OBJ-R7-BDD-1):** Step 38 adds a `TlaActionIndex` key to `bounded-context-glossary.psd1` mapping each integer N (1-40) to its action name string. This is the authoritative lookup table used by `check-bdd-action-tags.ps1` (Step 32 Round 7). Any change to action ordering in the TLA+ spec requires updating this index — the `bdd-action-tag-parity` CI job enforces consistency.

**BDD Scenario-to-Invariant Bijection Completion (OBJ-R8-9):** Three new BDD scenarios added to `bdd.feature` completing the bijection for invariants 18, 21, and 22:

```gherkin
@tla-action-39 @invariant-21
Scenario: consensus epoch advances after rollback
  Given the bus is running with consensusRoundStart at epoch 5
  And a snapshot exists for the current worktree
  When a rollback is executed successfully
  Then the output of "vibe -RoundEpoch" shows an epoch greater than 5
  And pre-rollback objections with evt_id less than the new epoch are rejected by the candidate guard

@tla-action-6 @invariant-22
Scenario: no handler remains assigned after agent crash
  Given the bus is running with handler "tlc" assigned to agent "tla-writer"
  When the agent "tla-writer" process exits unexpectedly
  Then the handler "tlc" state is "idle"
  And no pending evt_id is associated with the "tlc" handler
  And the output contains "[TELEMETRY] event=agent.crashed"

@tla-action-3 @invariant-18
Scenario: TypeSenderACL rejects forbidden event type from coding agent
  Given the bus is running with agent "coding-worker-1" alive
  When the agent "coding-worker-1" emits a "protocol_error" event
  Then the output contains "[ERROR] TypeSenderACL violation: coding-worker is not permitted to send protocol_error"
  And the event_log does not contain a row with type "protocol_error" from "coding-worker-1"
  And the bus continues running
  And a "protocol_error" event is sent to "coding-worker-1" documenting the violation
```

**Additional BDD Scenarios (CHANGE 7):**

```gherkin
@tla-action-RouterAbortsStaleRollback @invariant-RollbackRequiresSnapshot @tier-regression
Scenario: RouterAbortsStaleRollback cancels pending rollback when consensus epoch advances
  Given the bus is running with a pending rollback for worktree "wt1"
  And the rollback was requested at epoch 10
  When a new consensus round advances consensusRoundStart to epoch 15
  Then the output contains "[INFO] Stale rollback aborted for wt1: consensusRoundStart advanced past rollback epoch"
  And the rollback flag for worktree "wt1" is cleared
  And the bus continues running

@tla-action-ResumeAgent @invariant-ExactlyOneBootstrapPerLifetime @role_schema_version_hard_halt @tier-regression
Scenario: role_schema_version mismatch on -Resume causes hard halt with operator-visible error
  Given a checkpoint was stored with role_schema_version 1
  And the current system role_schema_version is 2
  When "-Resume" is invoked
  Then the bus halts immediately
  And the output contains "[ERROR] role_schema_version mismatch: stored=1, current=2"
  And the output contains recovery instructions referencing "vibe schema-migrate"
  And no agents are spawned

@tla-action-AppendEvent @invariant-NoDuplicateEvtId @sqlite_busy_under_wal @tier-regression
Scenario: AppendEvent succeeds under concurrent WAL writers without duplicate evt_id
  Given 8 concurrent agent processes are writing events via AppendEvent
  When all 8 writers attempt to append events simultaneously
  Then all events are committed without duplicate evt_id
  And the event_log contains exactly 8 rows with distinct evt_ids
  And no WAL retry budget is exhausted

@tla-action-DeliverBootstrap @invariant-SpawningAgentOnlyReceivesBootstrap @cascade_order_observable @tier-regression
Scenario: stage feature flags must be enabled in cascade order (observable via error output)
  Given VIBE_STAGE_2_BIDIR is disabled
  When VIBE_STAGE_3_BIDIR is enabled
  Then the output contains "[ALARM] Feature flag cascade violation: VIBE_STAGE_3_BIDIR=true but VIBE_STAGE_2_BIDIR=false"
  And no stage 3 bus path is activated
```

**TLA+ Coverage:**
- All 40 TLA+ actions appear in at least one `@tla-action-N` tag across the 335 scenarios
- All 22 safety invariants appear in at least one `@invariant-M` tag
- No TLA+ operator names appear in step text (enforced by `check-tla-leaks-in-bdd.ps1`)

**Dependencies:** Steps 1, 4, 25, 28, 29

**Test (write first):**
- Verify `check-bdd-tags.ps1` fails when a scenario has no `@tla-action-N` tag; verify passes when tagged
- Verify `check-bdd-tags.ps1` fails when a scenario has no `@invariant-M` or `@invariant-none` tag; verify `@invariant-none` is accepted as valid
- Verify `check-tla-leaks-in-bdd.ps1` fails when step text contains `RouterCommitSucceeds`; verify passes after replacement
- Verify `check-tla-leaks-in-bdd.ps1` uses identifiers from `bounded-context-glossary.psd1 TlaIdentifiers` key (not hardcoded)
- Verify all 40 TLA+ actions are referenced by at least one `@tla-action-N` tag in `bdd.feature` (cross-check against spec action list)
- Verify all 22 safety invariants referenced by at least one `@invariant-M` tag
- Verify total Scenario/Outline count ≤ 280 after consolidation (regression test against count)
- Verify Background section contains the cleanup order comment

---

## State Coverage Audit

All 32 TLA+ variables are covered:
- `nextEvtId`, `routedIds` — Steps 6, 15
- `eventLog` — Steps 2, 15, 19
- `agentStatus`, `agentWorktree`, `spawnedAtEvt` (initial epoch), `deadAtEvt` — Steps 11, 16, 18, 24, 28
- `spawnedAtEvt` (epoch advancement via RouterRespawnsAgent) — Step 24
- `checkpointStored`, `checkpointResponseInFlight` — Steps 11, 24
- `groundTruthDelivered` — Steps 11, 19
- `unresolvedObjections`, `overriddenObjections`, `consensusState`, `consensusRoundStart` — Steps 12, 23, 29
- `commitLockHolder`, `committedDoneEvts`, `pendingDoneEvt` — Step 22
- `busStatus`, `haltReason`, `failureCategory` — Steps 25, **36** (BusLifecycle Aggregate)
- `groupMembers`, `groupReplies`, `groupViolationPending` — Step 21
- `pendingProtocolError` — Steps 11, 20
- `handlerState`, `handlerPendingEvt`, `handlerPendingAgent`, `handlerPendingEpoch` — Step 17
- `pipeline_lock` — Steps 4, 25, **36**
- `snapshotExists`, `rollbackRequested`, `rollbackTargetWorktree` — Steps 29, **37** (WorkingTreeCoordinator)

All 40 actions covered. All 22 invariants covered (17 and 21 with explicit property tests at aggregate boundary). All 5 liveness properties covered (L1 with heartbeat-fairness test in Step 26) and formally documented in the fairness-obligation-matrix.md (Step 33).

No unmapped states or transitions.

### Implementation Invariants (non-TLA+, implementation-level)

Four implementation-level invariants are enforced and tested in addition to the 22 TLA+ safety invariants:

| ID | Name | Definition | Enforced In |
|---|---|---|---|
| I1 | `InvCommitOrdering` | `committedDoneEvts` in `bus_state` is always a subset of `event_log` rows with `status='committed'`; no evt_id appears in the committed set without a corresponding event_log row | Step 22, Step 35 |
| I2 | `InvNoLostWrites` | After any rollback, all rows in `event_log` with `status='committed'` remain present and unmodified; rollback NEVER executes DELETE on `event_log` | Step 29, Step 35 |
| I3 | `InvHaltLatchMonotonic` | The halt-once latch value transitions only from 0 → 1, never 1 → 0; once set, it is never cleared within a session | Steps 25, 36 |
| I4 | `InvSnapshotIntegrity` | `snapshotExists[w]=TRUE` in `bus_state` implies a corresponding `.snapshot` file exists AND its SHA-256 matches `snapshot_hash_<w>` in `bus_state`; they are always updated atomically | Steps 29, 37 |

### TLA+ Simplification Notes

The following implementation artifacts have **no direct TLA+ state variable counterpart** — they are implementation-level coordination mechanisms that are stutter steps in the refinement:

- **Halt-once latch** (`[System.Threading.Interlocked]::CompareExchange`): coordinates first-caller-wins for `Invoke-BusHalt`; maps to the within-action atomicity assumption in TLA+ (actions are atomic in the spec; the latch prevents concurrent execution of multiple halt actions)
- **Snapshot rotation** (`.snapshot.tmp` → `.snapshot` rename): an implementation durability mechanism inside `WorkingTreeCoordinator.Invoke-GitStash`; no TLA+ variable tracks this intermediate state; the rename is a stutter step
- **WAL retry loop**: SQLite `SQLITE_BUSY` retry within a single TLA+ action; the retry loop is a stutter step relative to TLA+
- **Named mutex acquisition time**: `VibeBus-PipelineLog` and `VibeBus-Commit-<w>` wait times are stutter steps; TLA+ assumes atomic acquisition

### Round 4 Objection Resolution Coverage

| Objection | Step(s) Modified | Testable Assertion |
|---|---|---|
| OBJ-CD-4 Migration-down data-loss safety | 4 | Pre-rollback snapshot to .vibe/backups/; row-drop refusal; post-rollback Invoke-MigrationIntegrityCheck |
| OBJ-CD-6 Staged rollout absent | 30, 32 | feature-flags.psd1; VIBE_STAGE_N_BIDIR env checks; stage-soak-log.txt; stage-soak-gate CI job |
| OBJ-CD-1/TDD-5 Red-commit ledger | 32 | check-red-commit-order.ps1; red-green-order CI job; git-history timestamp comparison |
| OBJ-CD-7 Deployment telemetry gap | 10, 16, 22 | [TELEMETRY] lines verified in tests for mutex and agent lifecycle events |
| OBJ-CD-8 Schema-hash pinning | 4, 5 | generate-schema-hash.ps1; Open-BusDatabase validates hash; mismatch → [ALARM] |
| OBJ-TLA-R3-a Fairness-obligation-matrix | 33 | fairness-obligation-matrix.md with 5×N table; cross-checked against spec action list |
| OBJ-TLA-R3-b Stuttering-equivalence | 33 | stuttering-equivalence.md with refinement mapping, stutter classification, fairness argument |
| OBJ-DDD-1/4 First-class aggregates | 17, 22, 30 | IHandlerAdapterService interface; WriteSession value object; Stage revert-idempotency |
| OBJ-DDD-2 Context map | 1 | bounded-context-map.md with upstream/downstream, ACL boundaries, integration patterns |
| OBJ-DDD-5 ProtocolError split | 17, 20 | DomainProtocolError/IntegrationProtocolError type distinction; routing verified |
| OBJ-BDD-R3-1 bdd.feature unanchored | 4, 25, 28, 29 | Four Gherkin scenarios with exact operator-message text in bdd.feature |
| OBJ-BDD-R3-2 Traceability tags absent | 1, 25, 28, 29 | @tla-action-N/@invariant-M tag schema defined; all BDD scenarios tagged |
| OBJ-TDD-R3-1 Load-generator path implicit | 33 | Explicit path `event-sequence-generator.ps1` asserted; seeded determinism unit test |
| OBJ-TDD-R3-2 Negative-branch halt tests | 25 | 13 negative-branch test functions; bidirectional MechanicalHaltHasCategory |

### Round 5 Objection Resolution Coverage

| Objection | Step(s) Modified | Testable Assertion |
|---|---|---|
| OBJ-R5-1 Rollback seam lacks coordinator + transaction + observable test | 11, 22, 29, 33 | `RollbackCoordinator` service; single `BEGIN IMMEDIATE`; `Get-BusStatus` post-rollback observable state test |
| OBJ-R5-2 AppendEvent baseline unset | 15 | `append_event_p99_ms: 5`, `append_event_p999_ms: 20` in baselines; 1000-call benchmark in Step 15 tests |
| OBJ-R5-3 Red-green gate same-commit bypass | 32 | `check-red-commit-order.ps1` rejects same-commit SHA; test with identical SHA mock |
| OBJ-R5-4 AgentSession cross-aggregate crash | 11, 16, 22 | `CrashCoordinationDomainService`; call-order test; `Invoke-AgentSessionCrash` isolation test |
| OBJ-R5-5 WriteSession mislabeled value object | 22 | WriteSession reclassified as Entity; SessionId identity test; two-instance coexistence test |
| OBJ-R5-6 SIGINT HaltReason overwrite race | 16, 25 | Halt-once guard via Interlocked latch; race test: SIGINT wins over concurrent agent crash |
| OBJ-R5-7 Partial snapshot satisfies invariant | 29 | SHA-256 hash stored atomically with snapshotExists; integrity check before rollback; partial-write test |
| OBJ-R5-8 BDD tags absent + TLA+ identifier leak | 1, 32 | `check-bdd-tags.ps1`; `bdd-tag-lint` CI job; scan covers all 335 scenarios; leak scan covers step text |
| OBJ-R5-9 Negative halt tests lack virtual clock | 25 | All 13 negative tests use `-GetTimestamp` virtual clock; real elapsed < 50ms; no `Start-Sleep` (AST check) |
| OBJ-R5-10 e2e-smoke canaries mock not release | 32 | `e2e-smoke-mock` + `e2e-smoke-contract` separate jobs; contract tier uses Step 34 snapshots |
| OBJ-R5-11 BlockingCollection heartbeat false alarm | 16 | `$QueueDepthCounter` Interlocked counter; heartbeat non-blocking read; producer-stall test |
| OBJ-R5-12 RouterExecutesRollback refinement unprovable | 29, 33 | Single `BEGIN IMMEDIATE` in `Invoke-BusRollbackCoordination`; `stuttering-equivalence.md` note |
| OBJ-R5-13 wal_autocheckpoint nondeterministic | 5 | `PRAGMA wal_autocheckpoint=0`; `Invoke-BusWalCheckpoint` function; called at shutdown and startup |
| OBJ-R5-14 Pre-commit hook lock violation | 10, 15, 22 | `VIBE_BUS_COMMIT_IN_PROGRESS` env var; entry check in `Invoke-BusAppendEvent`; set/unset in `Start-WriteSession`/`Complete-WriteSession`; lock-hierarchy rule 3 |

### Round 6 Objection Resolution Coverage

| Objection | Step(s) Modified | Testable Assertion |
|---|---|---|
| OBJ-R6-1 No schema-hash pin in CI | 32 | `schema-hash-parity` CI job; `generate-schema-hash.ps1 --verify`; [ALARM] on mismatch |
| OBJ-R6-2 Git stash inside writer lock | 29, 37 | WorkingTreeCoordinator separates git from SQLite; stutter-step classification in stuttering-equivalence.md |
| OBJ-R6-3 Rollback transaction contradiction | 29 | Single `BEGIN IMMEDIATE` in `Invoke-BusRollbackCoordination`; git stash is provable stutter step |
| OBJ-R6-4 Missing invariant assertions (I1–I4) | 22, 25, 29, 36 | `InvCommitOrdering`, `InvHaltLatchMonotonic`, `InvNoLostWrites`, `InvSnapshotIntegrity` tests |
| OBJ-R6-5 263 TLA+ identifier leaks in BDD | 38 | `check-tla-leaks-in-bdd.ps1`; all step text uses observable-behavior language |
| OBJ-R6-6 Cascade order undocumented | 30 | `cascade-order.md`; authoritative flag order; `cascade-order-check.ps1` lint gate |
| OBJ-R6-7 Missing BusLifecycle aggregate | 36 | `bus/domain/bus-lifecycle.ps1`; all busStatus/haltReason/failureCategory mutations encapsulated |
| OBJ-R6-8 p99 ≤5ms violated by git stash in lock | 37 | WorkingTreeCoordinator is lock-free; git stash budget 2000ms (not on hot path); SQLite commit ≤5ms |
| OBJ-R6-9 No refinement mapping document | 33 | `refinement-mapping.md` with 32-row table; all variables mapped; file-existence assertions |
| OBJ-R6-10 Missing WorkingTreeCoordinator | 37 | `bus/infra/working-tree-coordinator.ps1`; all git ops delegated; mutex-guard test |
| OBJ-R6-11 No cascade order enforcement | 30, 32 | `feature-flags.psd1` cascade validation at load time; `cascade-lint` CI job |
| OBJ-R6-12 Per-operation perf budgets absent | 33 | `performance-baselines.json` extended with 8-operation budget table; p99 values documented |
| OBJ-R6-13 Naming convention violations | 32 | `naming-convention-check.ps1`; `naming-lint` CI job; `Verb-BusNoun` form enforced |
| OBJ-R6-14 SQLite WAL contention uncharacterized | 33 | `Test-WalContention-Characterization` (16-way contention); `@characterization` tagged; baseline recorded |
| OBJ-R6-15 evt_id gaps undocumented | 33 | "evt_id Gap Policy" section in `stuttering-equivalence.md`; `Test-EvtIdGapsAreExpected` |
| OBJ-R6-16 Telemetry overhead unbudgeted | 33 | `Test-TelemetryOverhead-Benchmark`; p99 overhead ≤1ms; `telemetry_overhead_p99_ms` baseline |
| OBJ-R6-17 through OBJ-R6-22 (additional HIGH) | 22, 25, 32 | WriteSession lifecycle diagram; mutex starvation backoff; SIGTERM test; no-real-time CI gate |
| OBJ-R6-23 through OBJ-R6-27 (CD/PERF) | 32 | Canary ladder 1%/5%/25%/100%; numeric soak thresholds; per-tier rollback in migration-playbook.md |
| OBJ-R6-28 through OBJ-R6-38 (TDD/BDD/EDGE) | 38, 33 | BDD full tagging; Scenario Outline consolidation; load-generator determinism; WAL characterization |

### Round 7 Objection Resolution Coverage

| Objection | Step(s) Modified | Testable Assertion |
|---|---|---|
| OBJ-R7-EC-1 Halt-latch + SQLite COMMIT atomicity | 36 | SQLite-first halt-intent journal; `Invoke-BusHaltIntentRecovery` re-completes partial halts; `Test-HaltAtomicity-CrashBeforeCommit`; `Test-OnlyDefinedHalts-AfterRecovery` |
| OBJ-R7-DDD-1 bus_state table split | 4, 12, 29, 36 | Three aggregate-owned tables; `check-tla-symbol-parity.ps1` cross-ownership lint; no aggregate reads another's table |
| OBJ-R7-TLA-1 TLA↔code symbol parity gate | 32 | `check-tla-symbol-parity.ps1`; `tla-symbol-parity` CI job (job #21); all 40 actions and 22 invariants mechanically verified in code and tests |
| OBJ-R7-BDD-1 BDD action tag binding | 32, 38 | `check-bdd-action-tags.ps1`; `bdd-action-tag-parity` CI job (job #22); `TlaActionIndex` in `bounded-context-glossary.psd1`; stale tag → [FAIL] with action name and spec version |
| OBJ-R7-EC-2 File.Replace sharing violation retry | 37 | `Invoke-AtomicFileReplace` 8-attempt backoff; `Test-AtomicFileReplace-SharingViolation-Retry`; exhaustion halts with `failureCategory='git_commit'` |
| OBJ-R7-TDD-2 Red-phase parse/fail distinction | 32 | `test-fail-assertion.ps1` two-phase protocol; exit codes 0/1/2/3 documented in `tdd-exit-codes.md`; parse errors exit 2 (not red-confirmed) |
| OBJ-R7-PERF-2 WAL unbounded growth | 5, 33 | `Open-BusDatabase` WAL size monitor; WARN at 10MB, ALARM+checkpoint at 50MB; checkpoint also after 1000 appends and before rollback |
| OBJ-R7-TLA-3 Hash canonicalization unspecified | 4, 5 | SHA-256, UTF-8, CRLF→LF, sorted by table name; `schema_hash_algorithm=sha256-canonical-v1` in settings; platform-parity test (CRLF vs LF) |
| OBJ-R7-PERF-1 Liveness properties ungrounded | 33 | `liveness-slo-mapping.md` with 5-row table; 6 new baseline keys in `performance-baselines.json`; CI verifies each key exists |
| OBJ-R7-EC-3 Schema-hash canary drift | 4, 32 | `previous_schema_hash` in `schema-hash.txt`; `VIBE_CANARY_SCHEMA_WINDOW_HOURS` tolerance window; old hash accepted during window |
| OBJ-R7-TDD-3 Clock leakage — no canonical injection point | 5, 32 | `$script:GetUtcNow` exported from `open-bus-database.ps1`; `no-real-time` CI gate allows `[DateTime]::UtcNow` only in that single assignment |
| OBJ-R7-CD-3 Canary rollback criteria unquantified | 32 | `canary-rollback-criteria.md`; `canary-escalation-procedures.md`; `VIBE_CANARY_ROLLBACK_POLICY`; `Send-CanaryRollbackAlert`; automated vs manual thresholds codified |
| Unresolved TDD-1 @tla-action-none severity | 38 | Resolved MAJOR: `@tla-action-none` permitted with mandatory `@tla-action-none-reason=` tag; CI fails if reason absent |
| Unresolved PERF-3 Soak threshold severity | 32 | Two-tier thresholds: HARD (block) and SOFT (warn); `soak-thresholds.psd1` updated with both tiers |
| Unresolved BDD-2 rollbackTargetWorktree Outline | 38 | Scenario Outline with 3 Examples rows (snapshot exists, missing, corrupted); subsumes 3 copy-pasted scenarios |
| Unresolved CD-3 Canary rollback scope | 32 | `canary-rollback-criteria.md` (automated) and `canary-escalation-procedures.md` (manual) are separate; per-stage and per-canary-pct scope documented |

### Round 8 Objection Resolution Coverage

| Objection | Step(s) Modified | Testable Assertion |
|---|---|---|
| OBJ-R8-1 Gate-authenticity gap | 32 | `emit-gate-proof.ps1` emits signed `proof-artifact.json` per gate; `gate-proof-manifest` CI job #23 verifies all 22 proofs |
| OBJ-R8-2 Rollback-intent journal scope | 29 | `rollback_intent_*` keys written before main transaction; `Invoke-BusRollbackIntentRecovery` re-runs on crash; intent keys absent after clean completion |
| OBJ-R8-3 Recovery idempotence | 29 | `rollback_execution_id` GUID prevents double-reset; `Test-RollbackRecovery-Idempotence` verifies `Invoke-AdvanceRoundEpoch` called exactly once across replay |
| OBJ-R8-4 Cross-aggregate projection boundaries | 33 | `cross-aggregate-projection-contract.md`; `bus-read-projection.ps1` as single read interface; `check-tla-symbol-parity.ps1` cross-aggregate-direct-read lint rule |
| OBJ-R8-5 Symbolic TLA+ trace tags | 33 | `tla-trace-function-map.psd1` (40 entries); `bus-trace-replay.Tests.ps1` uses map to replay TLC counterexample sequences |
| OBJ-R8-6 Non-repudiable red-green ledger | 32 | `gate-ledger.ps1` HMAC chain; `gate-ledger.jsonl` appended per run; `gate-ledger-verify` CI job #24 checks chain integrity |
| OBJ-R8-7 Performance drift ratcheting | 32 | `ratchet-perf-baselines.ps1`; `perf-ratchet-log.json` tracks 3-consecutive-run 20%-below threshold; proposed ratchets advisory only |
| OBJ-R8-8 Transaction discipline across BEGIN IMMEDIATE | 33 | `transaction-boundaries.md` names all 4 units; `check-tla-symbol-parity.ps1` multi-table-write lint rule enforces boundaries |
| OBJ-R8-9 BDD invariant bijection gaps | 38 | 3 new BDD scenarios for @invariant-21, @invariant-22, @invariant-18; all 22 invariants now have ≥1 `@invariant-M` tagged scenario |
| OBJ-R8-10 RouterAbortsStaleRollback/RouterHaltsRollbackSqliteError chaos | 29 | `Test-RouterAbortsStaleRollback-CtrlCDuringRollback-Chaos`; `Test-RouterHaltsRollbackSqliteError-SQLiteError-Chaos` |
| OBJ-R8-11 Step dependency ordering | 33 | T34 added as formal dependency of T33; `@contract-dependent` test tag gates trace-replay tests on Step 34 completion |
| OBJ-R8-12 Tier 2 BusLifecycle/RollbackCoordinator integration | 29, 36 | `Test-RollbackCoordinator-BusLifecycleBoundary`; `Get-BusLifecycleState` as canonical projection; AST check for no direct bus_lifecycle_state SQL in rollback-coordinator.ps1 |

### Round 9 Objection Resolution Coverage

| Objection | Step(s) Modified | Testable Assertion |
|---|---|---|
| OBJ-R9-1 Gate Authenticity — no structural enforcement | 32 | `check-gate-executability.ps1` (job #25) AST-parses all gate scripts; `no-string-literal-assertions.ps1` (job #26) flags wildcard `Should -Be "*"` in all `*.Tests.ps1`; both emit `proof-artifact.json` |
| OBJ-R9-2 Rollback-Intent Journal `rollback_phase` missing | 29 | `rollback_phase` column written before git op; `Invoke-BusRollbackIntentRecovery` branches on phase; `Test-RollbackRecovery-CrashAfterGitBeforeCommit`; `Test-RollbackRecovery-CrashBeforeGit` |
| OBJ-R9-3 Recovery single-flight lock absent | 36 | `.vibe/bus.recovery.lock` FileShare.None; `recovery_owner` CAS in `bus_lifecycle_state`; `Test-RecoveryLock-ConcurrentOpen-OnlyOneRecoverer`; recovery classified as stutter step |
| OBJ-R9-4 Cross-aggregate read projections undefined | 4, 32 | `aggregate-table-ownership.psd1` with Owner+Readers; `check-tla-symbol-parity.ps1` allows reads only via `Get-BusReadProjection` for listed Readers; `Test-AggregateTableOwnership-Readers-AllowedPaths` |
| OBJ-R9-5 Symbolic named TLA+ action tags required | 1, 32, 38 | `TlaActionNamedTags`+`ObservablePostConditions` in glossary; all 335 scenarios updated to named `@tla-action-<ActionName>`; `check-bdd-postconditions.ps1` (job #27) verifies Then clauses |
| OBJ-R9-6 Non-repudiable red-green provenance | 32 | `.vibe/red-green-ledger.txt` append-only JSON lines; GPG-fingerprint required on test-file commits; `gate-ledger.jsonl` extended with `red_green_ledger_sha256`; `Test-RedGreenLedger-AppendOnly-NoTruncation` |
| OBJ-R9-7 Perf drift ratcheting incomplete | 33 | `performance-baselines-absolute.json` hard floors; `soak_p99_ms_prev` comparator in soak gate; `mutation_score_min: 0.75`; `get_bus_status_p99_ms: 10`; split `consensus_machine_resolution_ms` / `consensus_human_deliberation_ms` |
| OBJ-R9-8 Transaction discipline — telemetry in BEGIN IMMEDIATE | 12, 15, 33 | `$script:PendingTelemetry` buffer flushes post-COMMIT; `nextEvtId` SELECT inside consensus `BEGIN IMMEDIATE`; `check-no-telemetry-in-transaction.ps1` (job #28); `Test-AppendEvent-TelemetryFlushedAfterCommit` |
| OBJ-R9-9 Per-worktree stash mutex missing | 37 | `VibeBus-Stash-<w>` in `Invoke-GitStash`/`Invoke-GitStashPop`; lock hierarchy updated; `Test-WorkingTreeCoordinator-StashMutex-SerializesOnSameWorktree` |
| OBJ-R9-10 WAL checkpoint circuit breaker missing | 5 | `$script:WalCheckpointCircuitOpen`; opens after 3 SQLITE_FULL; no-op while open; half-open probe at 60th call; `Test-WalCheckpoint-CircuitBreaker-OpensAfterThreeFailures` |
| OBJ-R9-11 Handler-session orphan reconciliation in -Resume | 28 | `Invoke-BusResume` orphan-reconciliation pass; clears handlers pointing to dead agents; `[WARN]` emitted; `Test-Resume-HandlerOrphanReconciliation` |
| OBJ-R9-12 Snapshot SHA-256 verify before DROP absent | 4 | `backup-manifest.json` written after `Invoke-MigrationBackup`; SHA-256 re-verified before any DROP; `[ALARM]` on mismatch; `Test-MigrationDown-SnapshotIntegrityCheckBeforeDrop` |
| OBJ-R9-13 Multi-stage rollback refusal missing | 4 | `vibe schema-rollback` checks delta ≤ 1; `[ERROR]` if delta > 1; exit non-zero; `Test-SchemaRollback-RefusesMultiStageJump` |
| OBJ-R9-14 Telemetry sink specification missing | 10, 33 | `Write-PipelineLog` routes ALARM/ERROR to `.vibe/alarms.log`; `telemetry-sink.md`; `observability-dashboard.yaml` committed; `Test-WriteAlarmLog-RoutesAlarmAndError` |
| OBJ-R9-15 Cascade single-reader helper missing | 30, 32 | `Get-StageFeatureFlag` canonical reader + `Test-StageCascadeOrder`; cascade-lint flags bare `$env:VIBE_STAGE_<N>_BIDIR`; `Test-StageCascadeOrder-BlocksOutOfOrderEnable` |
| OBJ-R9-16 Fairness-obligation-matrix only 5 rows | 33 | `fairness-obligation-matrix.md` expanded to 15+ WF/SF obligation rows; `fairness-matrix-completeness` CI gate (job #29) verifies every spec WF/SF term appears in matrix |
| OBJ-R9-17 Tier 10 Step 32/38 ordering ambiguous | Tiers | Sub-phase A: T34 ∥ T32 ∥ T33-independent; Sub-phase B: T33-dependent (after T34 only); T32 has no intra-Tier-10 dependency; JSON manifest encodes via `@contract-independent`/`@contract-dependent` tags |

### Round 3 Objection Resolution Coverage

| Objection | Step(s) Modified | Testable Assertion |
|---|---|---|
| OBJ-R3-1 Non-atomic AppendEvent | 15 | BEGIN IMMEDIATE transaction; kill-recovery test verifies no phantom events |
| OBJ-R3-2 event_log indices + compaction | 2 | Four indices via EXPLAIN QUERY PLAN; compaction correctness tested |
| OBJ-R3-3 TLC not in CI | 32 | run-tlc.ps1 + check-tla-version.ps1 gate in vibe-cli.yml; version-parity test |
| OBJ-R3-4 No rollback playbook | 4, 30 | migration-down.ps1; 6 incremental commits; each independently git-revertable |
| OBJ-R3-5 No deployment story | 4 | vibe schema-migrate / schema-rollback / schema-backup / reset all exist and are tested |
| OBJ-R3-6 Halt test collapse | 25 | 13 individually named test functions with distinct preconditions and triggers |
| OBJ-R3-7 Step 1 TDD size | 2, 3, 4, 5 | Four independent steps; each testable in isolation before any other |
| OBJ-R3-8 No aggregates | 11, 12 | AgentSession and ConsensusRound aggregates enforce invariants at boundary |
| OBJ-R3-9 Inv9 respawn under-tested | 19 | Explicit respawn-path test verifying epoch-scoped GroundTruthPrecedesAgentMessage |
| OBJ-R3-10 Queue no cap | 16 | BlockingCollection with BoundedCapacity=1000; backpressure verified; no drop |
| OBJ-R3-11 Crash not wired | 16 | Engine event VibeBus.AgentCrashed fired; orchestrator handler tested end-to-end |
| OBJ-R3-12 Context-overrun race | 24, 26 | Pre-delivery context pre-check; heartbeat crash vs. context-limit distinguisher |
| OBJ-R3-13 Contract circularity | 34 | Snapshot files from real binary checked in; unit tests use snapshots not inventions |
| OBJ-R3-14 No CI YAML | 32 | vibe-cli.yml created with 11 jobs; all gates defined as executable steps |
| OBJ-R3-15 Ubiquitous language | 1 | bounded-context-glossary.psd1; event-context-map.psd1; lint gate in CI |

---

## Execution Tiers

| Tier | Steps | Description | Can Parallelize |
|---|---|---|---|
| 1 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, **37** | Foundation: bounded-context glossary, schema (3 aggregate-owned state tables), allocator, event types, role definitions, test doubles, logging, WorkingTreeCoordinator | All 11 in parallel (37 needs only Step 9); Step 4 Round 7 creates bus_lifecycle_state, consensus_state, rollback_state tables |
| 2 | 11, 12, 13, 14, **36** | Aggregates + value objects: AgentSession, ConsensusRound, Envelope, Routing Rules, BusLifecycle Aggregate | All 5 in parallel (11: needs 1,3,5; 12: needs 1,2,5; 13: needs 6,7; 14: needs 7,8; **36: needs 1,4,5**) |
| 3 | 15 | Core router with atomic AppendEvent transaction | Single step (needs 2,3,4,5,6,10,13,14) |
| 4 | 16, 17 | Agent lifecycle start + handler adapter | Both in parallel (16: needs 4,9,11,15; 17: needs 7,15) |
| 5 | 18, 19 | Agent lifecycle stop + Send-BusEvent + ground truth | Both in parallel (18: needs 3,16; 19: needs 11,14,15) |
| 6 | 20, 21, 22 | Protocol error, fan-out group, commit serializer | All 3 in parallel (all need 19; **22 also needs 37** for lock-free git in WriteSession) |
| 7 | 23, 24 | Consensus machinery + checkpoint/session renewal | Both in parallel (23: needs 12,19,20; 24: needs 19,20,22) |
| 8 | 25, 26, 27, 28, 29 | Halt conditions, heartbeat, status, resume, rollback | **25 needs 21,22,23,36**; 26 needs 10,19,25; 27 needs 2,19,25; 28 needs 2,16,24,25; **29 needs 19,22,23,25,37** |
| 9 | 30, 31, **38** | Stage migration, utility deletion, BDD audit | T30 and T38 run in parallel (T30: needs 18,21,28,29; **T38: needs 1,4,25,28,29**); T31 sequentially after T30 (needs 30) |
| 10 | 32, 33, 34 | CI gates + YAML, property/trace tests, contract tests | **OBJ-R9-17 (Sub-ordering clarified):** Step 38 is Tier 9 and completes before Tier 10 begins. Within Tier 10, **Sub-phase A** (all concurrent, no intra-tier dependencies): `{T34} ∥ {T32} ∥ {T33-@contract-independent tests}`. **Sub-phase B** (depends only on Sub-phase A T34): `{T33-@contract-dependent tests}` (trace-replay, liveness tests that require contract snapshots). T32 has NO dependency on T33 or T34 within Tier 10. (32 needs 1,30,**38**; 33 needs 28,29,34,**36,37**; 34 needs 9,30; T32 is gated on `no-string-literal-assertions` job and `check-gate-executability` job, both new in Round 9) |
| 11 | 35 | Final completeness review | Single step (needs all prior) |

---

## Task Assignment Table

| Task ID | Title | Tier | Code Writer | Test Writer | Dependencies | Rationale |
|---|---|---|---|---|---|---|
| T1 | Bounded Context Glossary + Naming + Context Map | 1 | powershell-writer | pester-writer | — | OBJ-R3-15, OBJ-DDD-2: context map + tag schema; **OBJ-R9-5**: `TlaActionNamedTags` + `ObservablePostConditions` maps added |
| T2 | event_log Table + Indices + Compaction | 1 | powershell-writer | pester-writer | — | OBJ-R3-2, OBJ-R3-7: isolated; 4 query indices prevent full scans |
| T3 | agent_sessions Table + Identity Index | 1 | powershell-writer | pester-writer | — | OBJ-R3-7: isolated; spawned_at_evt enables OBJ-TLA-1 |
| T4 | Schema Migration Runner + Deployment Story + Safety | 1 | powershell-writer | pester-writer | — | OBJ-R3-4/5, OBJ-CD-4, OBJ-CD-8, OBJ-BDD-R3-1; **OBJ-R9-4**: `aggregate-table-ownership.psd1`; **OBJ-R9-12**: SHA-256 backup verify before DROP; **OBJ-R9-13**: multi-stage rollback refusal |
| T5 | Open-BusDatabase Infrastructure + Schema-Hash Validation | 1 | powershell-writer | pester-writer | — | OBJ-R3-7, OBJ-EC-7, OBJ-CD-8: WAL PRAGMA + schema-hash validated at every connect; **OBJ-R9-10**: WAL checkpoint circuit breaker (`$script:WalCheckpointCircuitOpen`, 3-failure threshold, 60-call half-open probe) |
| T6 | evt_id Allocator | 1 | powershell-writer | pester-writer | — | Foundation: all events need unique IDs |
| T7 | EventTypes Enum + Bounded Context Subsets + Schemas | 1 | powershell-writer | pester-writer | — | OBJ-R3-15: 4-context partition; closed enum used by all steps |
| T8 | Agent Role Definitions | 1 | powershell-writer | pester-writer | — | Foundation: system prompts, ACL, SchemaVersion export |
| T9 | Test Doubles | 1 | powershell-writer | pester-writer | — | Foundation: $OutputSchema contract for T34 |
| T10 | Write-PipelineLog Mutex + Mutex Telemetry + Alarm Sink | 1 | powershell-writer | pester-writer | — | OBJ-CD-7: structured [TELEMETRY]; **OBJ-R9-14**: `Write-PipelineLog` routes ALARM/ERROR to `.vibe/alarms.log` (append-only JSON lines); lock hierarchy doc updated with `VibeBus-Stash-<w>` (OBJ-R9-9) |
| T11 | AgentSession Aggregate Root | 2 | powershell-writer | pester-writer | T1, T3, T5 | OBJ-R3-8: all per-agent invariants enforced at aggregate boundary |
| T12 | ConsensusRound Aggregate | 2 | powershell-writer | pester-writer | T1, T2, T5 | OBJ-R3-8: invariants 17 and 21 enforced at aggregate boundary; **OBJ-R9-8**: `Invoke-AdvanceRoundEpoch` issues `SELECT nextEvtId` inside the same `BEGIN IMMEDIATE` as the epoch update (no out-of-transaction read) |
| T13 | Envelope Value Object | 2 | powershell-writer | pester-writer | T6, T7 | Needs allocator for evt_id and enum for type |
| T14 | Routing Rules + ACL Resolver | 2 | powershell-writer | pester-writer | T7, T8 | Uses bounded-context constants; no raw event-type strings |
| T15 | Core Router + Atomic AppendEvent | 3 | powershell-writer | pester-writer | T2,T3,T4,T5,T6,T10,T13,T14 | OBJ-R3-1: BEGIN IMMEDIATE transaction; kill-recovery test; **OBJ-R9-8**: `$script:PendingTelemetry` buffer — telemetry deferred until after COMMIT |
| T16 | Start-BusAgent + Backpressure + Crash Wiring + Agent Telemetry | 4 | powershell-writer | pester-writer | T4,T9,T11,T15 | OBJ-R3-10/11, OBJ-TLA-1, OBJ-CD-7: agent telemetry; OBJ-R5-11: Interlocked queue-depth counter; OBJ-R5-6: halt-once check in engine event handler |
| T17 | Handler Adapter + Service Interface + ProtocolError Split | 4 | powershell-writer | pester-writer | T7,T15 | OBJ-DDD-1/4: IHandlerAdapterService; OBJ-DDD-5: IntegrationProtocolError at ACL boundary |
| T18 | Stop-BusAgent | 5 | powershell-writer | pester-writer | T3,T16 | Needs schema and start lifecycle |
| T19 | Send-BusEvent + Ground Truth + Respawn Inv9 | 5 | powershell-writer | pester-writer | T11,T14,T15 | OBJ-R3-9: epoch-scoped Inv9 test on respawn path |
| T20 | Protocol Error Recovery + DomainProtocolError Type | 6 | powershell-writer | pester-writer | T19 | OBJ-DDD-5: DomainProtocolError (aggregate-owned) defined; routing to recovery path verified |
| T21 | Wait-BusGroup (Fan-Out) | 6 | powershell-writer | pester-writer | T19 | Needs Send-BusEvent for group dispatch |
| T22 | Commit Serializer Aggregate + WriteSession Entity + CrashCoordinationDomainService + Telemetry | 6 | powershell-writer | pester-writer | T17,T19 | OBJ-R5-5: WriteSession reclassified as Entity; OBJ-R5-4: CrashCoordinationDomainService cross-aggregate coordinator; OBJ-R5-14: pre-commit hook env var guard; OBJ-DDD-1/4: Etag idempotency; OBJ-CD-7: mutex telemetry |
| T23 | Consensus Machinery | 7 | powershell-writer | pester-writer | T12,T19,T20 | OBJ-TLA-4 Inv17 tested via ConsensusRound aggregate |
| T24 | Checkpoint / Session Renewal | 7 | powershell-writer | pester-writer | T19,T20,T22 | OBJ-R3-12 context-overrun pre-check; OBJ-TLA-1 respawn epoch |
| T25 | Halt Conditions + Halt-Once Guard + SIGINT Drain + 13 Granular Halt Tests + 13 Negative Branches (Virtual Clock) + BDD | 8 | powershell-writer | pester-writer | T21,T22,T23 | OBJ-R5-6: halt-once Interlocked latch; SIGINT engine-event drain; OBJ-R5-9: virtual clock in all negative-branch tests; OBJ-R3-6, OBJ-EC-15, OBJ-TDD-R3-2, OBJ-BDD-R3-1 |
| T26 | Heartbeat Banner | 8 | powershell-writer | pester-writer | T10,T19,T25 | OBJ-TLA-3 BusResumed fairness; OBJ-R3-12 crash distinguisher |
| T27 | Get-BusStatus + -Status Flag | 8 | powershell-writer | pester-writer | T2,T19,T25 | Status query; no agent mutations |
| T28 | -Resume Recovery + BDD Schema-Version Scenario | 8 | powershell-writer | pester-writer | T2,T16,T24,T25 | OBJ-EC-3/9/11, OBJ-BDD-R3-1; **OBJ-R9-11**: orphan reconciliation pass in `Invoke-BusResume` clears handlers assigned to dead agents; `Test-Resume-HandlerOrphanReconciliation` |
| T29 | /Rollback Subsystem + RollbackCoordinator + BDD Scenario | 8 | powershell-writer | pester-writer | T19,T22,T23,T25 | OBJ-R5-1, OBJ-R5-7, OBJ-R5-12, OBJ-TLA-2, OBJ-EC-5/16/17, OBJ-BDD-R3-1; **OBJ-R9-2**: `rollback_phase` column + `rollback_intent_{uuid}` row + phase-aware `Invoke-BusRollbackIntentRecovery` |
| T30 | Migrate Stages 2–7 to Bus + Feature Flags + Stage Aggregate | 9 | powershell-writer | pester-writer | T18,T21,T28,T29 | OBJ-R3-4, OBJ-CD-6, OBJ-DDD-1/4: VIBE_STAGE_N_BIDIR flags; **OBJ-R9-15**: `Get-StageFeatureFlag` canonical reader + `Test-StageCascadeOrder` validation; bare env-var access blocked by cascade-lint |
| T31 | Delete Obsolete Utilities | 9 | powershell-writer | pester-writer | T30 | Must follow migration; all call sites replaced |
| T32 | CI Gates + TLC + YAML (29 jobs) + Red-Green Same-Commit Check + Soak Gate + BDD Tag Lint + e2e-smoke Split + Round 6/7/8/9 Gates | 10 | powershell-writer | pester-writer | T1,T30,**T38** | OBJ-R5-3/8/10; OBJ-R6-1/11/13/22/24/26/27; **OBJ-R7-TLA-1/BDD-1/TDD-2/CD-3**; **OBJ-R8-1/6/7/8**: `emit-gate-proof.ps1`; `gate-proof-manifest` (job#23); `gate-ledger.ps1`; `gate-ledger-verify` (job#24); **OBJ-R9-1**: `check-gate-executability.ps1` (job#25), `no-string-literal-assertions.ps1` (job#26); **OBJ-R9-4**: `check-tla-symbol-parity.ps1` loads `aggregate-table-ownership.psd1`; **OBJ-R9-5**: `check-bdd-action-tags.ps1` named-tag mode + `check-bdd-postconditions.ps1` (job#27); **OBJ-R9-6**: `.vibe/red-green-ledger.txt` append-only + GPG-fingerprint validation; **OBJ-R9-8**: `check-no-telemetry-in-transaction.ps1` (job#28); **OBJ-R9-15**: `cascade-order-check.ps1` AST lint for bare env-var; **OBJ-R9-16**: `fairness-matrix-completeness` (job#29) |
| T33 | Property Tests + Trace Tests + Fairness Matrix (15+ rows) + Stuttering Note + Load-Generator + Refinement Mapping + Perf Budgets + Liveness SLOs + Cross-Aggregate Projection Contract + Trace Function Map + Transaction Boundaries + Telemetry Sink Docs | 10 | powershell-writer | pester-writer | T28,T29,**T34,T36,T37** | OBJ-TLA-2/4, OBJ-TLA-R3-a/b, OBJ-TDD-R3-1; OBJ-R6-9/12/14/15/16; **OBJ-R7-PERF-1**; **OBJ-R8-4/5/8/11**; **OBJ-R9-7**: `performance-baselines-absolute.json`, `soak_p99_ms_prev` comparator, `mutation_score_min: 0.75`, `get_bus_status_p99_ms: 10`, split consensus SLO; **OBJ-R9-8**: `check-no-telemetry-in-transaction.ps1` authored here; **OBJ-R9-14**: `telemetry-sink.md` + `observability-dashboard.yaml`; **OBJ-R9-16**: `fairness-obligation-matrix.md` expanded to 15+ WF/SF obligation rows |
| T34 | Test Double Contract Tests | 10 | powershell-writer | pester-writer | T9,T30 | OBJ-R3-13: snapshot-based; OBJ-EC-2, OBJ-EC-12 |
| T35 | Final Completeness Review | 11 | powershell-writer | pester-writer | T1–T34,T36,T37,T38 | Gate: 100% coverage, all 22 invariants + 4 impl invariants, all 38 Round 6 objections resolved |
| T36 | BusLifecycle Aggregate + SQLite-First Halt Atomicity | 2 | powershell-writer | pester-writer | T1,T4,T5 | OBJ-R6-7: encapsulates bus_lifecycle_state table; **OBJ-R7-EC-1**: halt-intent journal + CAS + COMMIT ordering; **OBJ-R9-3**: `.vibe/bus.recovery.lock` (FileShare.None) + `recovery_owner` CAS; `Invoke-BusHaltIntentRecovery` moved into `bus-lifecycle.ps1` aggregate; recovery classified as stutter step in `stuttering-equivalence.md` |
| T37 | WorkingTreeCoordinator + AtomicFileReplace Retry + Stash Mutex | 1 | powershell-writer | pester-writer | T9 | OBJ-R6-2/8/10: lock-free git abstraction; **OBJ-R7-EC-2**: `Invoke-AtomicFileReplace` 8-attempt backoff; **OBJ-R9-9**: `VibeBus-Stash-<w>` named mutex in `Invoke-GitStash`/`Invoke-GitStashPop`; lock hierarchy `VibeBus-Commit-<w>` > `VibeBus-Stash-<w>` > `VibeBus-PipelineLog` |
| T38 | BDD Feature Audit, Tagging, Named-Tag Refactor, Observable-Behavior Refactor + Invariant-18/21/22 Scenarios (Bijection Complete) | 9 | powershell-writer | pester-writer | T1,T4,T25,T28,T29 | OBJ-R6-5/9: tag all 335 scenarios; remove 263 TLA+ leaks; Scenario Outline consolidation; **Unresolved TDD-1**: @tla-action-none requires reason tag; **Unresolved BDD-2**: rollbackTargetWorktree Outline (3 Examples rows); **OBJ-R8-9**: 3 new scenarios for @invariant-21/22/18; **OBJ-R9-5**: all `@tla-action-N` numeric tags replaced with `@tla-action-<ActionName>` named tags; all Then clauses reference ≥1 `ObservablePostConditions` entry; numeric tags rejected by `check-bdd-action-tags.ps1` |
