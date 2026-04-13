# BDD Scenarios — SQLite State Repository
# Date: 2026-04-12
# Source: docs/sqlite-state/elicitor.md
# Revision: 8 — addresses 8 debate objections from unified-debate.md Round 2 (revision 7 review):
#   R8-01  S8 ActiveFeatureMustExist: Set-ActiveFeature on a feature name that does not
#          exist in the features table is now rejected — new scenario ensures an
#          implementation that skips the existence check and upserts would fail.
#   R8-02  MergeConflict halt atomicity: Set-MergeResult with status=conflict must
#          atomically fail the tier and halt the feature. New @integration partial-failure
#          rollback test mirrors the Lock-PipelineState rollback pattern (line 676).
#   R8-03  S2 LockExclusive complete-holder contention: Lock-PipelineState rejection
#          tested for the window where the lock holder has complete or halted status
#          but has not yet called Unlock-PipelineState.
#   R8-04  MaxDebateRound=1 boundary lifecycle: Single-round debate where AdvanceDebateRound
#          is permanently disabled and only consensus or failure can resolve.
#   R8-05  MaxTasks=1 boundary lifecycle: Single-task tier where CompleteTask once exhausts
#          the budget, StartMerge is enabled, and second CompleteTask is rejected.
#   R8-06  Set-ActiveFeature idempotency: Calling Set-ActiveFeature with the already-active
#          idle feature is specified as a no-op (consistent with TLA+ SetActiveFeature
#          semantics where activeFeature = f is a valid precondition).
#   R8-07  ForceUnlock gateVerdict and pipelineState postconditions: gateVerdict unchanged
#          asserted in running-feature ForceUnlock cleanup scenarios; pipelineState preserved
#          asserted in complete-feature ForceUnlock scenario.
#   R8-08  DebateFails tier status postcondition: All tiers asserted to remain "none" after
#          pre-Stage-7 debate failure halt, verifying S16 non-vacuously.
#   R8-09  Pipeline_state null-vs-none ambiguity: Line 1229 (now S23 scenario) resolved —
#          newly created features have no pipeline_state row (returns null), not "none".
#
#   R7-B5  ForceUnlock activeFeature clearing: every ForceUnlock scenario on a running
#          feature now asserts Get-ActiveFeature returns null — TLA+ sets activeFeature'=NULL
#          but no prior BDD scenario verified this postcondition. Added to all running-feature
#          ForceUnlock scenarios and the composite cleanup scenario.
#   R7-B6  Crash task count reset: new dedicated scenario asserting tierTasksDone restarts
#          at 0 on resume even though task_results rows are preserved. Clarifies the
#          abstraction gap between DB rows (preserved) and TLA+ counter (reset).
#   R7-B1  S23 NoneStateConsistent: new dedicated scenario — Get-PipelineState for a
#          never-created feature returns null, completing coverage of all 4 sync invariants
#          (S5/S17/S18/S19 each had one; S23 did not).
#   R7-B2  AdvanceDebateRound rejection at MaxDebateRound: new scenario asserting that
#          advancing a debate round beyond MaxDebateRound is rejected — TLA+ guard
#          debateRound < MaxDebateRound tested on rejection side, not just failure side.
#   R7-B3  S11 DebateStageConsistency non-debate stage: new scenarios attempting to write
#          debate round on stage 1 (pre-debate) and stage 7 (coding stage) — both rejected.
#   R7-B4  S14 MergeStatusConsistent merge-on-non-running-tier: new scenario asserting
#          merge initiation is rejected when tier status is not 'running'.
#   R7-B11 ForceUnlock when no lock is held: new error scenario — Unlock-PipelineState
#          with force flag rejected when no lock row exists for the feature.
#   R7-B12 Crash recovery on nonexistent feature: new defensive error scenario — crash
#          recovery attempted for a feature that does not exist in the features table.
#   R7-B13 Set-TierStatus for out-of-range tier: new boundary error scenarios — tier 0
#          and tier above configured maximum are rejected.
#   R7-B14 MaxCrashes=0 config validation: new scenario asserting MaxCrashes must be >= 1
#          (TLA+ ASSUME MaxCrashes >= 1 but no BDD rejection existed).
#   R7-B7  Line 911 aspirational Then clause: "can be restarted cleanly from pending"
#          replaced with concrete assertion "Set-TierStatus … status 'running' succeeds".
#   R7-B8  ForceUnlock recovery scenario (was line 758): split into two independent
#          scenarios — one for Clear-ActiveFeature, one for creating a new feature — for
#          red-green isolation.
#   R7-B9  ForceUnlock scenarios: @operator tag added to all ForceUnlock and force-flag
#          scenarios to distinguish operator commands from automated pipeline actions.
#   R7-B10 Crash recovery reset rule: promoted from glossary parenthetical to dedicated
#          glossary entry with explicit state mappings (feature→idle, pipeline→none).
#   R7-B15 Concurrent stale-lock detection race condition: new low-priority scenario
#          documenting expected behavior when two processes detect the same stale lock.
#   R7-B16 Gitignored DB loss on fresh clone: new scenario documenting silent
#          re-initialization behavior when vibe-state.db is absent after a fresh clone.
#   R7-B17 Integration test suite-level cleanup backstop: added AfterAll cleanup note
#          to tagging strategy and a dedicated scenario for orphaned temp file cleanup.
#
# Prior revisions:
#   R7: 17 objections addressed (R7-B1 through R7-B17)
#   R6: 12 objections addressed (R6-01 through R6-12)
#   R5: 17 objections addressed (R5-01 through R5-17)
#   R4: 11 objections addressed (R4-01 through R4-11)
#
# Glossary — Ubiquitous Language
#   State repository    — PowerShell module providing one-function-per-file access to vibe-state.db
#   vibe-state.db       — single SQLite database file at the vibe-cli root (gitignored)
#   Session             — singleton row (id=1) tracking the currently active feature
#   Active feature      — the feature name currently being processed by the pipeline
#   Stage progress      — record that a numbered stage completed for a given feature
#   Artifact            — a file path reference produced by a stage (MD, feature, TLA, JSON files stay on disk)
#   Pipeline lock       — mutex metadata row (PID, startTime, crashCount) for cross-process coordination
#   Pipeline runtime record — the pipeline_state TABLE; stores typed runtime columns per feature.
#                         Not to be confused with 'pipeline status' (the state-machine value within it).
#   Pipeline status     — the pipeline_state.pipeline_state COLUMN value; a state-machine value with domain
#                         {none, idle, running, halted, complete} that governs feature lifecycle transitions.
#                         "none" is the initial value before any lock is acquired;
#                         "idle" is the crash-recovery reset target (not stored as pipeline status directly —
#                         pipeline status resets to "none" while feature status resets to "idle");
#                         "running" means the feature is actively executing;
#                         "halted" is a terminal failure state; "complete" is the terminal success state.
#   Feature status      — the features.status column; domain {idle, running, complete, halted}.
#                         "idle" is the post-creation state and the crash-recovery reset target;
#                         "running" means the feature is actively executing;
#                         "halted" is a terminal failure state; "complete" is the terminal success state.
#                         NOTE (naming bridge): TLA+ `featureStatus` maps to this column (features.status);
#                         TLA+ `pipelineState` maps to the pipeline_state.pipeline_state column.
#   Stage output        — structured JSON blob stored by output_type (implementation plan, target root, etc.)
#                         Stage outputs store only opaque artifacts; debate content belongs in debate_state.
#   Debate state        — per-round consensus status and moderator JSON for a stage's debate loop
#   Debate consensus    — the consensus_status column in debate_state; domain {none, pending, reached, failed}.
#                         "none" is the initial value before any debate round is written;
#                         "pending" means rounds are in progress but no conclusion has been reached;
#                         "reached" means experts converged and the debate succeeded;
#                         "failed" means MaxDebateRound was exhausted without convergence — triggers halt.
#   Tier progress       — Stage 7 coding tier status tracking
#   Tier status         — the status column in tier_progress; domain {none, pending, running, passed, failed}.
#                         "none" is the reset state — tier has no work in progress and no tasks attributed;
#                         "pending" is the initialized/waiting state (set on Stage 7 entry, or after crash
#                         resets a running tier);
#                         "running" means the tier is actively executing tasks;
#                         "passed" means the tier's gate passed — terminal success for the tier;
#                         "failed" means the tier's gate failed or a halt cascade reached it — terminal failure.
#   Task result         — outcome of a single coding task within a tier (phase, status, counters, escalation)
#   Merge result        — outcome of merging a task's isolated workspace back (status, checkpoint, conflict flag)
#   Gate result         — review gate verdict for a gate type (status, round, verdict JSON)
#   System mutex        — OS-level mutex for cross-process coordination (retained, not replaced by DB)
#   PSSQLite            — required PowerShell module for SQLite operations
#   Crash budget        — MaxCrashes limit; when exhausted, auto-resume is refused
#   MaxStage            — the highest stage number (7); pipeline completion requires lastCompleted = MaxStage
#   MaxDebateRound      — the maximum number of debate rounds allowed before consensus is forced to "failed"
#   MaxTasks            — the maximum number of tasks allowed per tier
#   ForceUnlock         — operator-initiated forced lock release; when the feature is running, triggers
#                         full HaltPipeline-style cleanup (TLA+ Rev 11 semantics)
#   Crash recovery reset rule — when ProcessCrash fires on a running feature:
#                         feature status resets to "idle" (features.status = 'idle');
#                         pipeline status resets to "none" (pipeline_state.pipeline_state = 'none');
#                         running tiers reset to "pending" (tier_progress.status = 'pending');
#                         active feature is cleared (session.active_feature = NULL);
#                         merges on running tiers reset to "none";
#                         passed tiers, completed merges, stage progress, debate history, and
#                         task_results rows are ALL preserved.
#                         NOTE: tierTasksDone (TLA+ counter) resets to 0 on resume even though
#                         task_results DB rows are preserved — see R7-B6 for dedicated scenario.
#
# TLA+ Action Mapping (for traceability):
#   Lock-PipelineState   <-> AcquireLock
#   Unlock-PipelineState <-> ReleaseLock
#   Unlock-PipelineState (force, running feature) <-> ForceUnlock (Rev 11: includes HaltPipeline cleanup)
#   Add-CrashCount       <-> ProcessCrash (partial)
#   Set-TierStatus       <-> StartTier / GatePass / GateFail / ProcessCrash (partial)
#   Set-MergeResult      <-> StartMerge / CompleteMerge / MergeConflict
#   Set-StageComplete    <-> CompleteStage (partial) / CompleteStage7
#   CompletePipeline     <-> feature status -> 'complete' when lastCompleted = MaxStage
#   Set-ActiveFeature    <-> StartFeature (guards SingleRunningFeature invariant S1)
#   HaltPipeline         <-> featureStatus + pipelineState -> 'halted' (atomic)
#
# Naming Bridge (TLA+ <-> BDD/Schema):
#   TLA+ featureStatus   = BDD "Feature status"  = features.status column
#   TLA+ pipelineState   = BDD "Pipeline status"  = pipeline_state.pipeline_state column
#   TLA+ debateConsensus = BDD "Debate consensus" = debate_state.consensus_status column
#   TLA+ tierStatus      = BDD "Tier status"      = tier_progress.status column
#   TLA+ tierTasksDone   = BDD task count          = COUNT of task_results rows for that tier
#   TLA+ gateVerdict     = BDD gate result         = gate_results row for that tier/gate_type
#   TLA+ mergeStatus     = BDD merge status        = aggregated merge_results status for that tier
#
# Tagging Strategy:
#   @unit         — runs with :memory: SQLite, no file system interaction
#   @integration  — runs with temp .db file on disk; cleanup step removes temp file in AfterEach.
#                   BACKSTOP (R7-B17): implementation should include an AfterAll hook that scans
#                   the test temp directory and removes any orphaned .db files left by failed
#                   AfterEach blocks. This prevents temp file leaks when test teardown is bypassed.
#   @operator     — (R7-B9) marks scenarios for operator-initiated commands (ForceUnlock, force flag)
#                   as distinct from automated pipeline actions.
#   File-path-sensitive scenarios (corrupt DB, disk full) MUST use @integration.

# =============================================================================
# Connection — Open / Close Database
# =============================================================================

Feature: Database connection lifecycle
  Open-StateDatabase initializes the SQLite database and Close-StateDatabase tears it down

  @integration
  Scenario: First run creates database file and all 12 tables
    Given PSSQLite is installed
    And no "vibe-state.db" file exists at the vibe-cli root
    When Open-StateDatabase is called
    Then "vibe-state.db" is created on disk
    And the database contains exactly 12 tables: session, features, stage_progress, artifacts, pipeline_lock, pipeline_state, stage_outputs, debate_state, tier_progress, task_results, merge_results, gate_results
    # R5-15: cleanup
    And the temp .db file is removed in AfterEach teardown

  @integration
  Scenario: Subsequent run is a no-op on existing database
    Given PSSQLite is installed
    And "vibe-state.db" already exists with all 12 tables populated
    When Open-StateDatabase is called
    Then no tables are dropped or recreated
    And existing data in all tables is preserved
    # R5-15: cleanup
    And the temp .db file is removed in AfterEach teardown

  @integration
  Scenario: Database deleted manually is fully re-initialized
    Given PSSQLite is installed
    And "vibe-state.db" was previously used but has been deleted
    When Open-StateDatabase is called
    Then "vibe-state.db" is created on disk
    And the database contains exactly 12 tables
    # R5-15: cleanup
    And the temp .db file is removed in AfterEach teardown

  # --- R7-B16: Fresh clone silent re-initialization ---
  # When vibe-state.db is gitignored and a fresh clone has no DB file,
  # Open-StateDatabase silently creates a new empty database. This is
  # by design (no migration, clean break) but operators should be aware
  # that prior pipeline state from another clone is NOT carried over.

  @integration
  Scenario: Fresh clone with no database file silently re-initializes
    Given PSSQLite is installed
    And the repository was freshly cloned with no "vibe-state.db" present
    When Open-StateDatabase is called
    Then "vibe-state.db" is created on disk
    And the database contains exactly 12 tables
    And the session table has no active_feature set
    And the features table is empty
    # R5-15: cleanup
    And the temp .db file is removed in AfterEach teardown

  # R6-12 note: This scenario involves no file I/O beyond module import; @unit is viable
  # but retained as @integration because the error path may attempt file-level operations
  # depending on implementation. Evaluate after implementation stabilizes.
  @integration
  Scenario: PSSQLite not installed produces clear error
    Given PSSQLite is not installed
    When Open-StateDatabase is called
    Then a terminating error is thrown
    And the error message contains "PSSQLite module required. Run: Install-Module PSSQLite"

  @integration
  Scenario: Corrupt database fails fast with recovery guidance
    Given "vibe-state.db" exists but is corrupt
    When Open-StateDatabase is called
    Then a terminating error is thrown
    And the error message suggests deleting "vibe-state.db" and restarting
    # R5-15: cleanup
    And the temp .db file is removed in AfterEach teardown

  @integration
  Scenario: Disk full fails fast
    # No cleanup step: the scenario simulates a full disk, so no temp .db file
    # is successfully created to clean up. This asymmetry with other @integration
    # scenarios is intentional.
    Given the disk has no remaining space
    When Open-StateDatabase is called
    Then a terminating error is thrown

  @unit
  Scenario: Close-StateDatabase tears down the connection
    Given Open-StateDatabase has been called successfully
    And no pipeline lock is held
    And the session active_feature is null
    When Close-StateDatabase is called
    Then the database connection is released
    And subsequent repository calls fail with a connection error

  @unit
  Scenario: Close-StateDatabase rejected while lock is held
    Given Open-StateDatabase has been called successfully
    And a pipeline lock is held for feature "auth-flow" with PID 12345
    When Close-StateDatabase is called
    Then a terminating error is thrown
    And the error indicates the lock must be released before closing

  @unit
  Scenario: Close-StateDatabase rejected while active feature is set
    Given Open-StateDatabase has been called successfully
    And the session active_feature is "auth-flow"
    And no pipeline lock is held
    When Close-StateDatabase is called
    Then a terminating error is thrown
    And the error indicates the active feature must be cleared before closing

  @unit
  Scenario: Close-StateDatabase on already-closed database produces error
    Given Open-StateDatabase was called successfully
    And Close-StateDatabase has already been called
    When Close-StateDatabase is called again
    Then a terminating error is thrown
    And the error indicates the database is not open

  # --- R4-05: dbOpen guard — calls before Open or after Close ---

  @unit
  Scenario: Repository call before Open-StateDatabase fails with connection error
    Given Open-StateDatabase has NOT been called
    When Get-ActiveFeature is called
    Then a terminating error is thrown
    And the error indicates the database is not open

  @unit
  Scenario: Repository call after Close-StateDatabase fails with connection error
    Given Open-StateDatabase was called successfully
    And Close-StateDatabase has been called
    When New-Feature is called with "auth-flow"
    Then a terminating error is thrown
    And the error indicates the database is not open

  @unit
  Scenario: Write operation before Open-StateDatabase fails with connection error
    Given Open-StateDatabase has NOT been called
    When Set-StageComplete is called with feature "auth-flow" and stage 1
    Then a terminating error is thrown
    And the error indicates the database is not open

  # --- R7-B17: Suite-level cleanup backstop for integration tests ---

  @integration
  Scenario: AfterAll cleanup removes orphaned temp database files
    Given multiple @integration scenarios have executed in this test suite
    And some AfterEach teardown blocks may have been bypassed due to test failures
    When the AfterAll suite-level hook executes
    Then all temp .db files in the test temp directory are removed
    And no orphaned database files remain

# =============================================================================
# Session — Active Feature
# =============================================================================

Feature: Session tracks the active feature
  The session table has exactly one row (id=1) and stores which feature the pipeline is currently processing

  @unit
  Scenario: Set active feature on empty session
    Given the session table has no active_feature set
    When Set-ActiveFeature is called with "auth-flow"
    Then Get-ActiveFeature returns "auth-flow"
    And the session row has a non-null started_at timestamp

  @unit
  Scenario: Set active feature replaces previous value
    Given the session active_feature is "auth-flow"
    And feature "auth-flow" has status "complete"
    When Set-ActiveFeature is called with "search-api"
    Then Get-ActiveFeature returns "search-api"

  # --- R4-03: SingleRunningFeature (S1) displacement guard ---

  @unit
  Scenario: Set-ActiveFeature rejected when another feature is running
    Given the session active_feature is "auth-flow"
    And feature "auth-flow" has status "running"
    When Set-ActiveFeature is called with "search-api"
    Then a terminating error is thrown
    And the error indicates the active feature "auth-flow" must reach a terminal status before switching

  @unit
  Scenario: Set-ActiveFeature allowed when previous feature is halted
    Given the session active_feature is "auth-flow"
    And feature "auth-flow" has status "halted"
    When Set-ActiveFeature is called with "search-api"
    Then Get-ActiveFeature returns "search-api"

  @unit
  Scenario: Clear active feature on completed feature
    Given the session active_feature is "auth-flow"
    And feature "auth-flow" has status "complete"
    When Clear-ActiveFeature is called
    Then Get-ActiveFeature returns null

  @unit
  Scenario: Clear active feature on halted feature
    Given the session active_feature is "auth-flow"
    And feature "auth-flow" has status "halted"
    When Clear-ActiveFeature is called
    Then Get-ActiveFeature returns null

  @unit
  Scenario: Clear active feature rejected for idle feature
    Given the session active_feature is "auth-flow"
    And feature "auth-flow" has status "idle"
    When Clear-ActiveFeature is called
    Then a terminating error is thrown
    And the error indicates only terminal features (complete/halted) may be cleared

  @unit
  Scenario: Clear active feature rejected for running feature
    Given the session active_feature is "auth-flow"
    And feature "auth-flow" has status "running"
    When Clear-ActiveFeature is called
    Then a terminating error is thrown
    And the error indicates only terminal features (complete/halted) may be cleared

  @unit
  Scenario: Get active feature when none is set
    Given the session table has no active_feature set
    When Get-ActiveFeature is called
    Then it returns null

  # --- R8-01: S8 ActiveFeatureMustExist — rejection for nonexistent feature ---
  # TLA+ SetActiveFeature guard: featureStatus[f] \in {"idle","running"} — uncreated
  # features have status "none" which is not in the guard set. Without this scenario,
  # an implementation that skips the existence check and upserts a session row for an
  # arbitrary string would pass all prior BDD tests while violating S8.

  @unit
  Scenario: Set-ActiveFeature rejected for feature that does not exist
    Given no feature named "ghost-feature" exists in the features table
    When Set-ActiveFeature is called with "ghost-feature"
    Then a terminating error is thrown
    And the error indicates feature "ghost-feature" does not exist

  # --- R8-06: Set-ActiveFeature idempotency — already-active feature is a no-op ---
  # TLA+ SetActiveFeature(f) is a valid action when activeFeature = f and f is idle.
  # The BDD specifies this as a no-op: the active feature remains unchanged, no error
  # is thrown, and no side effects occur. This resolves the implementation ambiguity
  # flagged by expert-edge-cases.

  @unit
  Scenario: Set-ActiveFeature with the already-active idle feature is a no-op
    Given the session active_feature is "auth-flow"
    And feature "auth-flow" has status "idle"
    When Set-ActiveFeature is called with "auth-flow"
    Then Get-ActiveFeature returns "auth-flow"
    And no error is thrown

# =============================================================================
# Features — Feature Registry
# =============================================================================

Feature: Feature registry manages feature lifecycle
  The features table tracks all features by name with status (idle/running/complete/halted)

  @unit
  Scenario: Create a new feature
    Given no feature named "auth-flow" exists
    When New-Feature is called with "auth-flow"
    Then Get-Feature "auth-flow" returns a row with status "idle"
    And the row has a non-null created_at timestamp

  @unit
  Scenario: Duplicate feature name produces error
    Given a feature named "auth-flow" already exists
    When New-Feature is called with "auth-flow"
    Then a terminating error is thrown
    And the error indicates the feature name must be unique

  # --- R5-14: Empty string and null name boundary ---

  @unit
  Scenario: New-Feature with empty string name produces error
    Given no features exist
    When New-Feature is called with ""
    Then a terminating error is thrown
    And the error indicates the feature name must be a non-empty string

  @unit
  Scenario: New-Feature with null name produces error
    Given no features exist
    When New-Feature is called with $null
    Then a terminating error is thrown
    And the error indicates the feature name must be a non-empty string

  @unit
  Scenario: Get a feature that does not exist
    Given no feature named "ghost-feature" exists
    When Get-Feature is called with "ghost-feature"
    Then it returns null

  @unit
  Scenario: List all features
    Given features "auth-flow", "search-api", and "notifications" exist
    When Get-AllFeatures is called
    Then it returns 3 rows
    And each row contains name, created_at, and status fields

  @unit
  Scenario: List features when none exist
    Given the features table is empty
    When Get-AllFeatures is called
    Then it returns an empty collection

  @unit
  Scenario: Halt a running feature sets status to halted
    Given feature "auth-flow" has status "running"
    When Update-PipelineState is called with feature "auth-flow" setting feature status to "halted"
    Then Get-Feature "auth-flow" returns status "halted"

  # --- R4-01: CompletePipeline action coverage ---

  @unit
  Scenario: Complete pipeline transitions feature status to complete when all stages are done
    Given feature "auth-flow" has status "running"
    And stages 1 through 7 are marked complete for "auth-flow"
    And Get-LastCompletedStage for "auth-flow" returns 7
    When Update-PipelineState is called with feature "auth-flow" setting feature status to "complete"
    Then Get-Feature "auth-flow" returns status "complete"
    And the feature status value in pipeline_state is "complete"

# =============================================================================
# Stage Progress — Stage Completion Tracking
# =============================================================================

Feature: Stage progress records completed stages per feature
  Replaces STAGE_COMPLETE markers from pipeline-log.ps1

  @unit
  Scenario: Mark a stage as complete
    Given feature "auth-flow" exists
    When Set-StageComplete is called with feature "auth-flow" and stage 3
    Then Get-LastCompletedStage for "auth-flow" returns 3

  @unit
  Scenario: Mark multiple stages as complete in order
    Given feature "auth-flow" exists
    And stages 1, 2, and 3 are marked complete for "auth-flow"
    When Set-StageComplete is called with feature "auth-flow" and stage 4
    Then Get-LastCompletedStage for "auth-flow" returns 4

  @unit
  Scenario: Get last completed stage when none are complete
    Given feature "auth-flow" exists
    And no stages are marked complete for "auth-flow"
    When Get-LastCompletedStage is called for "auth-flow"
    Then it returns null

  # --- R5-06: Strict sequential enforcement replaces gap-skipping scenario ---
  # TLA+ ExecuteStage guards s = NextStage(f), enforcing strict sequence.
  # The old scenario allowed gap-skipping (stage 2 to 5); this divergence is
  # resolved in favor of the TLA+ spec. Set-StageComplete MUST reject gaps.

  @unit
  Scenario: Strict sequential stage completion enforced
    Given feature "auth-flow" exists
    And stage 2 is marked complete for "auth-flow"
    When Set-StageComplete is called with feature "auth-flow" and stage 5
    Then a terminating error is thrown
    And the error indicates stage 5 is not the next sequential stage after 2 (expected stage 3)
    And Get-LastCompletedStage for "auth-flow" still returns 2

  @unit
  Scenario: Duplicate stage completion is a safe no-op
    Given feature "auth-flow" exists
    And stage 3 is marked complete for "auth-flow"
    When Set-StageComplete is called with feature "auth-flow" and stage 3 again
    Then no error is thrown
    And Get-LastCompletedStage for "auth-flow" returns 3
    And stage_progress contains exactly one row for "auth-flow" stage 3

  # --- R4-06: Monotonicity enforcement — stage below lastCompleted ---

  @unit
  Scenario: Set-StageComplete rejected for stage below lastCompleted
    Given feature "auth-flow" exists
    And stages 1 through 4 are marked complete for "auth-flow"
    When Set-StageComplete is called with feature "auth-flow" and stage 2
    Then a terminating error is thrown
    And the error indicates stage 2 is below the last completed stage 4
    And Get-LastCompletedStage for "auth-flow" still returns 4

  @unit
  Scenario: Set-StageComplete accepted for stage equal to lastCompleted (idempotent)
    Given feature "auth-flow" exists
    And stages 1 through 4 are marked complete for "auth-flow"
    When Set-StageComplete is called with feature "auth-flow" and stage 4
    Then no error is thrown
    And Get-LastCompletedStage for "auth-flow" returns 4

  # --- R5-09: Out-of-range boundary condition ---

  @unit
  Scenario: Set-StageComplete rejected for stage above MaxStage
    Given feature "auth-flow" exists
    When Set-StageComplete is called with feature "auth-flow" and stage 8
    Then a terminating error is thrown
    And the error indicates stage 8 exceeds the maximum stage number 7

  @unit
  Scenario: Set-StageComplete rejected for stage 0
    Given feature "auth-flow" exists
    When Set-StageComplete is called with feature "auth-flow" and stage 0
    Then a terminating error is thrown
    And the error indicates stage must be between 1 and 7

  @unit
  Scenario: Set-StageComplete rejected for negative stage
    Given feature "auth-flow" exists
    When Set-StageComplete is called with feature "auth-flow" and stage -1
    Then a terminating error is thrown
    And the error indicates stage must be between 1 and 7

# =============================================================================
# Artifacts — Stage Artifact File Paths
# =============================================================================

Feature: Artifacts store file path references by stage
  Artifact files remain on disk; the database stores path references only

  @unit
  Scenario: Register an artifact for a stage
    Given feature "auth-flow" exists
    When Register-Artifact is called with feature "auth-flow", stage 1, type "elicitor", path "docs/auth-flow/elicitor.md"
    Then Get-Artifacts for "auth-flow" includes a row with artifact_type "elicitor" and file_path "docs/auth-flow/elicitor.md"

  @unit
  Scenario: Register multiple artifacts for one stage
    Given feature "auth-flow" exists
    When Register-Artifact is called with feature "auth-flow", stage 4, type "bdd", path "docs/auth-flow/bdd.feature"
    And Register-Artifact is called with feature "auth-flow", stage 4, type "tla", path "docs/auth-flow/spec.tla"
    Then Get-Artifacts for "auth-flow" stage 4 returns 2 rows

  @unit
  Scenario: Get artifacts filtered by stage
    Given feature "auth-flow" has artifacts in stages 1, 3, and 4
    When Get-Artifacts is called with feature "auth-flow" and stage 3
    Then only artifacts from stage 3 are returned

  @unit
  Scenario: Get all artifacts without stage filter
    Given feature "auth-flow" has artifacts in stages 1, 3, and 4
    When Get-Artifacts is called with feature "auth-flow" and no stage filter
    Then artifacts from all stages are returned

  @unit
  Scenario: Get artifacts for feature with none registered
    Given feature "auth-flow" exists with no artifacts
    When Get-Artifacts is called for "auth-flow"
    Then it returns an empty collection

# =============================================================================
# Pipeline Lock — Cross-Process Coordination
# =============================================================================

Feature: Pipeline lock manages cross-process coordination metadata
  System mutex handles actual locking; the pipeline_lock table stores metadata (PID, startTime, crashCount)

  @unit
  Scenario: Acquire pipeline lock
    Given no lock is held for feature "auth-flow"
    And the session active_feature is "auth-flow"
    When Lock-PipelineState is called with feature "auth-flow" and PID 12345
    Then Get-PipelineLockState for "auth-flow" shows locked with PID 12345
    And the lock row has a non-null locked_at timestamp

  @unit
  Scenario: Release pipeline lock on completed feature
    Given a lock is held for feature "auth-flow" with PID 12345
    And feature "auth-flow" has status "complete"
    When Unlock-PipelineState is called for "auth-flow"
    Then Get-PipelineLockState for "auth-flow" shows no active lock

  @unit
  Scenario: Release pipeline lock on halted feature
    Given a lock is held for feature "auth-flow" with PID 12345
    And feature "auth-flow" has status "halted"
    When Unlock-PipelineState is called for "auth-flow"
    Then Get-PipelineLockState for "auth-flow" shows no active lock

  # --- R4-08: ReleaseLock guard — reject unlock when feature status is 'idle' without force ---

  @unit
  Scenario: Unlock-PipelineState rejected when feature status is idle without force flag
    Given a lock is held for feature "auth-flow" with PID 12345
    And feature "auth-flow" has status "idle"
    When Unlock-PipelineState is called for "auth-flow" without the force flag
    Then a terminating error is thrown
    And the error indicates the feature must be in a terminal status (complete/halted) to release the lock without force

  @unit
  Scenario: Unlock-PipelineState rejected when feature status is running without force flag
    Given a lock is held for feature "auth-flow" with PID 12345
    And feature "auth-flow" has status "running"
    When Unlock-PipelineState is called for "auth-flow" without the force flag
    Then a terminating error is thrown
    And the error indicates the feature must be in a terminal status (complete/halted) to release the lock without force

  @unit @operator
  Scenario: Unlock-PipelineState with force flag on idle feature succeeds
    Given a lock is held for feature "auth-flow" with PID 12345
    And feature "auth-flow" has status "idle"
    When Unlock-PipelineState is called for "auth-flow" with force flag
    Then Get-PipelineLockState for "auth-flow" shows no active lock

  @unit
  Scenario: Detect stale lock via PID check
    Given a lock row exists for "auth-flow" with PID 99999 and start_time from a prior run
    And process 99999 is not running
    When Get-PipelineLockState is called for "auth-flow"
    Then the lock is identified as stale

  @unit
  Scenario: Increment crash count
    Given a lock exists for "auth-flow" with crash_count 0
    When Add-CrashCount is called for "auth-flow"
    Then Get-PipelineLockState for "auth-flow" shows crash_count 1

  @unit
  Scenario: Increment crash count multiple times
    Given a lock exists for "auth-flow" with crash_count 2
    When Add-CrashCount is called for "auth-flow"
    Then Get-PipelineLockState for "auth-flow" shows crash_count 3

  @unit
  Scenario: Get lock state when no lock exists
    Given no lock row exists for "auth-flow"
    When Get-PipelineLockState is called for "auth-flow"
    Then it returns null or indicates unlocked

  @unit
  Scenario: Lock rejected when active feature does not match target
    Given the session active_feature is "search-api"
    When Lock-PipelineState is called with feature "auth-flow" and PID 12345
    Then a terminating error is thrown
    And the error indicates the lock target must match the active feature

  @unit
  Scenario: Concurrent lock contention rejects second caller
    Given the session active_feature is "auth-flow"
    And a lock is held for feature "auth-flow" with PID 11111
    When Lock-PipelineState is called with feature "auth-flow" and PID 22222
    Then a terminating error is thrown
    And the error indicates the lock is already held

  # --- R8-03: S2 LockExclusive — complete-holder contention window ---
  # Between CompletePipeline/GateFail and ReleaseLock, the lock holder has a terminal
  # featureStatus but the lock is still held. A second caller's Lock-PipelineState must
  # still be rejected in this window. S2: lockHolder # NULL => no other process can acquire.

  @unit
  Scenario: Lock rejected when existing holder has complete status but lock not yet released
    Given the session active_feature is "auth-flow"
    And a lock is held for feature "auth-flow" with PID 11111
    And feature "auth-flow" has status "complete"
    When Lock-PipelineState is called with feature "auth-flow" and PID 22222
    Then a terminating error is thrown
    And the error indicates the lock is already held

  @unit
  Scenario: Lock rejected when existing holder has halted status but lock not yet released
    Given the session active_feature is "auth-flow"
    And a lock is held for feature "auth-flow" with PID 11111
    And feature "auth-flow" has status "halted"
    When Lock-PipelineState is called with feature "auth-flow" and PID 22222
    Then a terminating error is thrown
    And the error indicates the lock is already held

  @unit
  Scenario: Get lock state when active feature differs from lock row
    Given the session active_feature is "search-api"
    And a lock row exists for "auth-flow" with PID 12345
    When Get-PipelineLockState is called for "auth-flow"
    Then the result includes the lock metadata for "auth-flow"
    And the result does not imply the lock is held by the active feature

  # --- R5-07: Lock-PipelineState atomicity (partial-failure rollback) ---

  @integration
  Scenario: Lock-PipelineState rolls back on partial failure across tables
    Given the session active_feature is "auth-flow"
    And feature "auth-flow" has status "idle"
    And the pipeline_lock table write will succeed but the pipeline_state update will fail (simulated)
    When Lock-PipelineState is called with feature "auth-flow" and PID 12345
    Then a terminating error is thrown
    And Get-PipelineLockState for "auth-flow" shows no active lock
    And Get-Feature "auth-flow" returns status "idle"
    And Get-PipelineState for "auth-flow" shows pipeline_state "none"
    # R5-15: cleanup
    And the temp .db file is removed in AfterEach teardown

  # --- R7-B15: Concurrent stale-lock detection race condition ---
  # Low priority. Documents expected behavior when two processes simultaneously
  # detect the same stale lock. Only one should succeed in acquiring; the other
  # should fail with lock-contention error. The system mutex is the arbiter.

  @integration
  Scenario: Two processes detecting the same stale lock — only one succeeds
    Given a stale lock exists for "auth-flow" with PID 99999 and crash_count 0
    And process 99999 is not running
    And the session active_feature is "auth-flow"
    When process A and process B both attempt crash recovery for "auth-flow" concurrently
    Then exactly one process successfully acquires the lock
    And the other process receives a terminating error indicating the lock is already held
    And Get-PipelineLockState for "auth-flow" shows the winning process's PID
    # R5-15: cleanup
    And the temp .db file is removed in AfterEach teardown

# =============================================================================
# ForceUnlock — Operator-Initiated Forced Unlock (TLA+ Rev 11)
# =============================================================================

Feature: ForceUnlock performs HaltPipeline-style cleanup on running features
  When a lock is force-released on a running feature, ForceUnlock transitions the feature
  to 'halted' and performs full cleanup: pending debates are failed, running tiers with
  tasks are failed, running tiers without tasks are reset to 'none', pending tiers are
  reset to 'none', and pending merges are reset to 'none'.
  TLA+ action: ForceUnlock (Rev 11 — includes HaltPipeline cleanup)

  # --- R6-01: ForceUnlock on running feature — full HaltPipeline-style cleanup ---
  # --- R7-B5: All running-feature ForceUnlock scenarios now assert Get-ActiveFeature returns null ---
  # --- R7-B9: All ForceUnlock scenarios tagged @operator ---

  @unit @operator
  Scenario: ForceUnlock on running feature transitions to halted and clears active feature
    Given a lock is held for feature "auth-flow" with PID 12345
    And feature "auth-flow" has status "running"
    And the session active_feature is "auth-flow"
    And no gate results exist for "auth-flow"
    When Unlock-PipelineState is called for "auth-flow" with force flag
    Then Get-Feature "auth-flow" returns status "halted"
    And Get-PipelineState for "auth-flow" shows pipeline_state "halted"
    And Get-PipelineLockState for "auth-flow" shows no active lock
    And Get-ActiveFeature returns null
    # R8-07: gateVerdict postcondition — ForceUnlock does not create spurious gate results
    And Get-GateResult for "auth-flow" gate_type "code-quality" returns null

  @unit @operator
  Scenario: ForceUnlock on running feature fails pending debates
    Given a lock is held for feature "auth-flow" with PID 12345
    And feature "auth-flow" has status "running"
    And the session active_feature is "auth-flow"
    And feature "auth-flow" has debate rounds 1 and 2 for stage 4 with consensus_status "pending"
    When Unlock-PipelineState is called for "auth-flow" with force flag
    Then Get-Feature "auth-flow" returns status "halted"
    And Get-DebateState for "auth-flow" stage 4 returns consensus_status "failed"
    And Get-ActiveFeature returns null

  @unit @operator
  Scenario: ForceUnlock on running feature fails running tier with tasks
    Given a lock is held for feature "auth-flow" with PID 12345
    And feature "auth-flow" has status "running"
    And the session active_feature is "auth-flow"
    And feature "auth-flow" tier 2 has status "running"
    And feature "auth-flow" has task T1 with status "pass" in tier 2
    When Unlock-PipelineState is called for "auth-flow" with force flag
    Then Get-Feature "auth-flow" returns status "halted"
    And Get-TierProgress for "auth-flow" tier 2 returns status "failed"
    And Get-ActiveFeature returns null

  @unit @operator
  Scenario: ForceUnlock on running feature resets running tier without tasks to none
    Given a lock is held for feature "auth-flow" with PID 12345
    And feature "auth-flow" has status "running"
    And the session active_feature is "auth-flow"
    And feature "auth-flow" tier 2 has status "running"
    And feature "auth-flow" has no tasks in tier 2
    When Unlock-PipelineState is called for "auth-flow" with force flag
    Then Get-Feature "auth-flow" returns status "halted"
    And Get-TierProgress for "auth-flow" tier 2 returns status "none"
    And Get-ActiveFeature returns null

  @unit @operator
  Scenario: ForceUnlock on running feature resets pending tiers to none
    Given a lock is held for feature "auth-flow" with PID 12345
    And feature "auth-flow" has status "running"
    And the session active_feature is "auth-flow"
    And feature "auth-flow" tier 1 has status "running" with 0 tasks
    And feature "auth-flow" tier 2 has status "pending"
    And feature "auth-flow" tier 3 has status "pending"
    When Unlock-PipelineState is called for "auth-flow" with force flag
    Then Get-Feature "auth-flow" returns status "halted"
    And Get-TierProgress for "auth-flow" tier 1 returns status "none"
    And Get-TierProgress for "auth-flow" tier 2 returns status "none"
    And Get-TierProgress for "auth-flow" tier 3 returns status "none"
    And Get-ActiveFeature returns null

  @unit @operator
  Scenario: ForceUnlock on running feature resets pending merges to none
    Given a lock is held for feature "auth-flow" with PID 12345
    And feature "auth-flow" has status "running"
    And the session active_feature is "auth-flow"
    And feature "auth-flow" tier 2 has status "running"
    And feature "auth-flow" tier 2 has merge status "pending"
    When Unlock-PipelineState is called for "auth-flow" with force flag
    Then Get-Feature "auth-flow" returns status "halted"
    And Get-MergeResults for "auth-flow" shows tier 2 merge status "none"
    And Get-ActiveFeature returns null

  @unit @operator
  Scenario: ForceUnlock on running feature preserves passed tiers and completed merges
    Given a lock is held for feature "auth-flow" with PID 12345
    And feature "auth-flow" has status "running"
    And the session active_feature is "auth-flow"
    And feature "auth-flow" tier 1 has status "passed" with merge status "merged"
    And feature "auth-flow" tier 2 has status "running" with 1 task
    And feature "auth-flow" tier 2 has merge status "pending"
    And feature "auth-flow" tier 3 has status "pending"
    When Unlock-PipelineState is called for "auth-flow" with force flag
    Then Get-Feature "auth-flow" returns status "halted"
    And Get-PipelineState for "auth-flow" shows pipeline_state "halted"
    And Get-TierProgress for "auth-flow" tier 1 returns status "passed"
    And Get-MergeResults for "auth-flow" shows tier 1 merge status "merged"
    And Get-TierProgress for "auth-flow" tier 2 returns status "failed"
    And Get-MergeResults for "auth-flow" shows tier 2 merge status "none"
    And Get-TierProgress for "auth-flow" tier 3 returns status "none"
    And Get-ActiveFeature returns null

  @unit @operator
  Scenario: ForceUnlock on running feature with debate AND tiers performs full cleanup
    Given a lock is held for feature "auth-flow" with PID 12345
    And feature "auth-flow" has status "running"
    And the session active_feature is "auth-flow"
    And feature "auth-flow" has debate rounds 1 and 2 for stage 4 with consensus_status "pending"
    And feature "auth-flow" tier 1 has status "passed" with merge status "merged"
    And feature "auth-flow" tier 2 has status "running" with 1 task
    And feature "auth-flow" tier 2 has merge status "pending"
    And feature "auth-flow" tier 3 has status "pending"
    And no gate results exist for "auth-flow"
    When Unlock-PipelineState is called for "auth-flow" with force flag
    Then Get-Feature "auth-flow" returns status "halted"
    And Get-PipelineState for "auth-flow" shows pipeline_state "halted"
    And Get-PipelineLockState for "auth-flow" shows no active lock
    And Get-DebateState for "auth-flow" stage 4 returns consensus_status "failed"
    And Get-TierProgress for "auth-flow" tier 1 returns status "passed"
    And Get-MergeResults for "auth-flow" shows tier 1 merge status "merged"
    And Get-TierProgress for "auth-flow" tier 2 returns status "failed"
    And Get-MergeResults for "auth-flow" shows tier 2 merge status "none"
    And Get-TierProgress for "auth-flow" tier 3 returns status "none"
    And Get-ActiveFeature returns null
    # R8-07: gateVerdict postcondition — ForceUnlock does not create spurious gate results
    And Get-GateResult for "auth-flow" gate_type "code-quality" returns null

  # --- R6-02: ForceUnlock → halted recovery path ---
  # --- R7-B8: Split into two independent scenarios for red-green isolation ---

  @unit @operator
  Scenario: After ForceUnlock halts a feature the pipeline cannot auto-resume
    Given feature "auth-flow" has status "halted" after ForceUnlock
    And no lock is held for feature "auth-flow"
    When Lock-PipelineState is called with feature "auth-flow" and PID 12345
    Then a terminating error is thrown
    And the error indicates the feature is in terminal status "halted" and cannot be resumed
    And Get-Feature "auth-flow" returns status "halted"

  @unit @operator
  Scenario: After ForceUnlock the operator can clear the halted feature
    Given feature "auth-flow" has status "halted" after ForceUnlock
    And no lock is held for feature "auth-flow"
    And the session active_feature is "auth-flow"
    When Clear-ActiveFeature is called
    Then Get-ActiveFeature returns null
    And Get-Feature "auth-flow" returns status "halted"

  @unit @operator
  Scenario: After ForceUnlock the operator can start a new feature
    Given feature "auth-flow" has status "halted" after ForceUnlock
    And the session active_feature has been cleared
    When New-Feature is called with "auth-flow-v2"
    And Set-ActiveFeature is called with "auth-flow-v2"
    Then Get-ActiveFeature returns "auth-flow-v2"
    And Get-Feature "auth-flow-v2" returns a row with status "idle"
    And Get-Feature "auth-flow" returns status "halted"

  # ForceUnlock on non-running features does NOT trigger halt cleanup

  @unit @operator
  Scenario: ForceUnlock on idle feature releases lock without halt cleanup
    Given a lock is held for feature "auth-flow" with PID 12345
    And feature "auth-flow" has status "idle"
    When Unlock-PipelineState is called for "auth-flow" with force flag
    Then Get-PipelineLockState for "auth-flow" shows no active lock
    And Get-Feature "auth-flow" returns status "idle"
    # R8-07: gateVerdict postcondition — no gate results created for idle feature
    And Get-GateResult for "auth-flow" gate_type "code-quality" returns null

  @unit @operator
  Scenario: ForceUnlock on completed feature releases lock without halt cleanup
    Given a lock is held for feature "auth-flow" with PID 12345
    And feature "auth-flow" has status "complete"
    And Get-PipelineState for "auth-flow" shows pipeline_state "complete"
    When Unlock-PipelineState is called for "auth-flow" with force flag
    Then Get-PipelineLockState for "auth-flow" shows no active lock
    And Get-Feature "auth-flow" returns status "complete"
    # R8-07: pipelineState postcondition — complete status preserved through ForceUnlock (S18)
    And Get-PipelineState for "auth-flow" shows pipeline_state "complete"

  # --- R7-B11: ForceUnlock when no lock is held — error scenario ---
  # TLA+ ForceUnlock guards lockHolder=f; if no lock exists, the action is not enabled.

  @unit @operator
  Scenario: ForceUnlock rejected when no lock is held for the feature
    Given no lock row exists for "auth-flow"
    And feature "auth-flow" has status "running"
    When Unlock-PipelineState is called for "auth-flow" with force flag
    Then a terminating error is thrown
    And the error indicates no lock is held for feature "auth-flow"
    And Get-Feature "auth-flow" returns status "running"

# =============================================================================
# Crash Recovery — Decomposed Atomic Steps
# =============================================================================

Feature: Crash recovery handles stale locks and resets pipeline state
  Each crash recovery step is an independent operation for isolated red-green testing.
  TLA+ action: ProcessCrash
  # R5-16: All crash scenarios use deterministic PID 10001 (reserved test range)

  @unit
  Scenario: Detect stale lock for crashed process
    Given feature "auth-flow" has status "running"
    And a lock is held for feature "auth-flow" with PID 10001
    And process 10001 is not running
    When Get-PipelineLockState is called for "auth-flow"
    Then the lock is identified as stale

  @unit
  Scenario: Increment crash count on stale lock detection
    Given a stale lock exists for "auth-flow" with crash_count 0
    When Add-CrashCount is called for "auth-flow"
    Then Get-PipelineLockState for "auth-flow" shows crash_count 1

  # --- R6-09: Rewritten — business trigger instead of implementation mechanism ---

  @unit
  Scenario: Crash recovery resets running feature to idle
    Given feature "auth-flow" has status "running"
    And a stale lock has been detected for "auth-flow"
    When crash recovery is executed for "auth-flow"
    Then Get-Feature "auth-flow" returns status "idle"

  @unit
  Scenario: Release stale lock after crash recovery
    Given a stale lock is held for feature "auth-flow"
    And feature "auth-flow" has been reset to status "idle"
    When Unlock-PipelineState is called for "auth-flow" with force flag
    Then Get-PipelineLockState for "auth-flow" shows no active lock

  @unit
  Scenario: Crash resets running tier to pending
    Given feature "auth-flow" tier 2 has status "running"
    And a crash recovery has been triggered for "auth-flow"
    When Set-TierStatus is called with feature "auth-flow", tier 2, status "pending"
    Then Get-TierProgress for "auth-flow" tier 2 returns status "pending"

  # --- R7-B6: Crash task count reset — tierTasksDone restarts at 0 on resume ---
  # TLA+ tierTasksDone resets to 0 on ProcessCrash, but the underlying task_results
  # rows are preserved. This means the pipeline re-counts completed tasks from the DB
  # on resume rather than carrying forward the pre-crash counter. This scenario
  # explicitly verifies both sides of the abstraction gap.

  @unit
  Scenario: Crash resets tier task count to zero while preserving task result rows
    Given feature "auth-flow" has status "running"
    And feature "auth-flow" tier 2 has status "running"
    And feature "auth-flow" has tasks T1 (pass) and T2 (pass) in tier 2
    And a crash recovery has been triggered for "auth-flow"
    When crash recovery resets tier 2 to "pending"
    Then Get-TierTaskResults for "auth-flow" tier 2 returns 2 rows (T1 and T2) with original statuses
    And the tier task count for resumption purposes is 0 (new tasks start from tierTasksDone=0)
    And Set-TaskResult for a new task "T3" in tier 2 is accepted without MaxTasks violation

  # --- R5-12: Crash with mergeStatus='pending' AND tierStatus='running' ---

  @unit
  Scenario: Crash resets pending merge to none on running tier
    Given feature "auth-flow" tier 2 has status "running"
    And feature "auth-flow" tier 2 has merge status "pending"
    And a crash recovery has been triggered for "auth-flow"
    When Set-MergeResult is called with feature "auth-flow", task_id "T1", status "none"
    Then Get-MergeResults for "auth-flow" shows tier 2 merge status "none"

  # --- R4-04: Crash recovery when tierStatus='running' AND mergeStatus='merged' ---

  @unit
  Scenario: Crash resets merged merge-status to none on running tier
    Given feature "auth-flow" tier 2 has status "running"
    And feature "auth-flow" tier 2 has merge status "merged"
    And a crash recovery has been triggered for "auth-flow"
    When Set-MergeResult is called with feature "auth-flow", task_id "T1", status "none"
    Then Get-MergeResults for "auth-flow" shows tier 2 merge status "none"
    And Get-TierProgress for "auth-flow" tier 2 returns status "pending"

  @unit
  Scenario: Crash preserves passed tier status
    Given feature "auth-flow" tier 1 has status "passed"
    And feature "auth-flow" tier 2 has status "running"
    And a crash recovery has been triggered for "auth-flow"
    When tier statuses are inspected after crash recovery
    Then Get-TierProgress for "auth-flow" tier 1 returns status "passed"

  @unit
  Scenario: Crash preserves completed merge results on passed tiers
    Given feature "auth-flow" tier 1 has status "passed" with merge status "merged"
    And feature "auth-flow" tier 2 has status "running" with merge status "pending"
    And a crash recovery has been triggered for "auth-flow"
    When merge results are inspected after crash recovery
    Then Get-MergeResults for "auth-flow" shows tier 1 merge status "merged"

  @unit
  Scenario: Crash preserves debate state for resume
    Given feature "auth-flow" has debate rounds 1 and 2 for stage 4 with consensus_status "pending"
    And a crash recovery has been triggered for "auth-flow"
    When Get-DebateHistory is called for "auth-flow" stage 4
    Then it returns 2 rows with their original data intact

  @unit
  Scenario: Crash preserves stage progress for resume
    Given feature "auth-flow" has stages 1 through 5 complete
    And a crash recovery has been triggered for "auth-flow"
    When Get-LastCompletedStage is called for "auth-flow"
    Then it returns 5

  @unit
  Scenario: Task results preserved through crash recovery
    Given feature "auth-flow" has tasks T1 (pass) and T2 (pass) in tier 2
    And feature "auth-flow" tier 2 has status "running"
    And a crash recovery resets tier 2 to "pending"
    When Get-TierTaskResults is called for "auth-flow" tier 2
    Then it returns 2 rows (T1 and T2) with their original statuses

  # --- R6-09 + R6-10: Crash resume mid-Stage-7 — concrete assertions, business trigger ---

  @unit
  Scenario: Crash resume mid-Stage-7 skips tier initialization and resumes at first non-passed tier
    Given feature "auth-flow" has status "idle" after crash recovery
    And feature "auth-flow" has tiers 1 (passed) and 2 (pending) from pre-crash state
    When Lock-PipelineState is called with feature "auth-flow" and PID 10001
    Then Get-AllTierProgress for "auth-flow" returns tier 1 with status "passed" and tier 2 with status "pending"
    And Get-TierProgress for "auth-flow" tier 1 returns a non-null completed_at timestamp
    And Get-TierProgress for "auth-flow" tier 2 returns a null completed_at timestamp

  # --- R5-02 + R7-B7: Rewritten — concrete assertion replaces aspirational language ---

  @unit
  Scenario: Stale running tier after crash is observable as pending and restartable
    Given feature "auth-flow" tier 2 has status "running"
    And a crash recovery has occurred (feature reset to idle, running tiers reset to pending)
    When Get-TierProgress is called for "auth-flow" tier 2
    Then Get-TierProgress for "auth-flow" tier 2 returns status "pending"
    And Set-TierStatus called with feature "auth-flow", tier 2, status "running" succeeds without error

  # --- R6-12: Crash budget postconditions now include crashCount and featureStatus unchanged ---

  @unit
  Scenario: Crash budget exhaustion refuses auto-resume and preserves state
    Given feature "auth-flow" has status "running"
    And a lock is held for feature "auth-flow" with PID 10001 and crash_count equal to MaxCrashes
    And process 10001 is not running
    When crash recovery is attempted for "auth-flow"
    Then a terminating error is thrown
    And the error indicates the crash budget is exhausted and manual intervention is required
    And the stale lock is NOT released
    And Get-PipelineLockState for "auth-flow" shows crash_count equal to MaxCrashes
    And Get-Feature "auth-flow" returns status "running"

  # --- R5-13: MaxCrashes=1 boundary — immediate lockout on very first crash ---

  @unit
  Scenario: MaxCrashes boundary — first crash at MaxCrashes=1 allows recovery then second is refused
    Given MaxCrashes is configured as 1
    And feature "auth-flow" has status "running"
    And a lock is held for feature "auth-flow" with PID 10001 and crash_count 0
    And process 10001 is not running
    When crash recovery is executed for "auth-flow"
    Then Get-PipelineLockState for "auth-flow" shows crash_count 1
    And Get-Feature "auth-flow" returns status "idle"
    And subsequent crash recovery for "auth-flow" is refused with crash budget exhausted error

  # --- R7-B14: MaxCrashes=0 config validation ---
  # TLA+ ASSUME MaxCrashes >= 1. A configuration of MaxCrashes=0 would mean no crash
  # recovery is ever possible, which contradicts the crash recovery design. Reject at
  # config validation time.

  @unit
  Scenario: MaxCrashes configured as 0 is rejected at startup
    Given MaxCrashes is configured as 0
    When the pipeline configuration is validated
    Then a terminating error is thrown
    And the error indicates MaxCrashes must be at least 1

  # --- R5-11: ProcessCrash on a complete feature preserves terminal status ---

  @unit
  Scenario: Crash on complete feature releases lock and clears session but preserves terminal status
    Given feature "auth-flow" has status "complete"
    And a lock is held for feature "auth-flow" with PID 10001 and crash_count 0
    And process 10001 is not running
    When crash recovery is executed for "auth-flow"
    Then Get-Feature "auth-flow" returns status "complete"
    And Get-PipelineState for "auth-flow" shows pipeline_state "complete"
    And Get-PipelineLockState for "auth-flow" shows no active lock
    And Get-ActiveFeature returns null

  @unit
  Scenario: Crash on halted feature releases lock and clears session but preserves terminal status
    Given feature "auth-flow" has status "halted"
    And a lock is held for feature "auth-flow" with PID 10001 and crash_count 0
    And process 10001 is not running
    When crash recovery is executed for "auth-flow"
    Then Get-Feature "auth-flow" returns status "halted"
    And Get-PipelineState for "auth-flow" shows pipeline_state "halted"
    And Get-PipelineLockState for "auth-flow" shows no active lock
    And Get-ActiveFeature returns null

  # --- R7-B12: Crash recovery on nonexistent feature — defensive error scenario ---

  @unit
  Scenario: Crash recovery on nonexistent feature produces error
    Given no feature named "ghost-feature" exists in the features table
    When crash recovery is attempted for "ghost-feature"
    Then a terminating error is thrown
    And the error indicates feature "ghost-feature" does not exist

  # --- R4-09: Integration-level crash recovery scenario ---

  @integration
  Scenario: Full crash recovery sequence restores all invariants
    Given feature "auth-flow" has status "running"
    And a lock is held for feature "auth-flow" with PID 10001 and crash_count 0
    And process 10001 is not running
    And feature "auth-flow" has stages 1 through 6 complete
    And feature "auth-flow" tier 1 has status "passed" with merge status "merged"
    And feature "auth-flow" tier 2 has status "running" with merge status "merged"
    And feature "auth-flow" has tasks T1 (pass) and T2 (pass) in tier 2
    And feature "auth-flow" has debate rounds 1 and 2 for stage 4 with consensus_status "reached"
    When crash recovery is executed for "auth-flow"
    Then Get-PipelineLockState for "auth-flow" shows crash_count 1
    And Get-PipelineLockState for "auth-flow" shows no active lock
    And Get-Feature "auth-flow" returns status "idle"
    And Get-PipelineState for "auth-flow" shows pipeline_state "none"
    And Get-TierProgress for "auth-flow" tier 1 returns status "passed"
    And Get-TierProgress for "auth-flow" tier 2 returns status "pending"
    And Get-MergeResults for "auth-flow" shows tier 1 merge status "merged"
    And Get-MergeResults for "auth-flow" shows tier 2 merge status "none"
    And Get-TierTaskResults for "auth-flow" tier 2 returns 2 rows (T1 and T2) with original statuses
    And Get-LastCompletedStage for "auth-flow" returns 6
    And Get-DebateHistory for "auth-flow" stage 4 returns 2 rows with original data
    # R5-15: cleanup
    And the temp .db file is removed in AfterEach teardown

# =============================================================================
# Pipeline State — Runtime State Columns
# =============================================================================

Feature: Pipeline runtime record stores typed execution columns
  Replaces the in-memory $State hashtable with typed database columns.
  NOTE: "Pipeline runtime record" refers to the pipeline_state TABLE;
  "pipeline status" refers to the pipeline_state.pipeline_state COLUMN value.

  @unit
  Scenario: Update pipeline state columns
    Given feature "auth-flow" has a pipeline_state row
    When Update-PipelineState is called with feature "auth-flow" and verdict "approved"
    Then Get-PipelineState for "auth-flow" shows verdict "approved"

  @unit
  Scenario: Update multiple runtime columns
    Given feature "auth-flow" has a pipeline_state row
    When Update-PipelineState is called with feature "auth-flow", review_round 3, and verdict "needs-revision"
    Then Get-PipelineState for "auth-flow" shows review_round 3
    And Get-PipelineState for "auth-flow" shows verdict "needs-revision"

  @unit
  Scenario: Get pipeline state returns all columns
    Given feature "auth-flow" has a pipeline_state row with pipeline_state "running", lock_holder 12345, review_round 2, keep_going_resets 1, tdd_keep_going_count 0, verdict "pending", tasks_done 5, review_gate_type "code-quality"
    When Get-PipelineState is called for "auth-flow"
    Then the returned object contains all 8 typed columns with their stored values

  @unit
  Scenario: Get pipeline state for feature with no row
    Given no pipeline_state row exists for "auth-flow"
    When Get-PipelineState is called for "auth-flow"
    Then it returns null

  @unit
  Scenario: Update preserves unmodified columns
    Given feature "auth-flow" has pipeline_state with review_round 2 and verdict "pending"
    When Update-PipelineState is called with only verdict "approved"
    Then Get-PipelineState shows review_round is still 2

  # --- R5-08: Dedicated pipelineState/featureStatus synchronization scenarios ---
  # These verify the denormalization contract (S5, S17, S18, S19) explicitly.

  @unit
  Scenario: Running feature has synchronized pipelineState (S17)
    Given feature "auth-flow" has status "idle"
    And feature "auth-flow" has pipelineState "none"
    When AcquireLock transitions feature "auth-flow" to running
    Then Get-Feature "auth-flow" returns status "running"
    And Get-PipelineState for "auth-flow" shows pipeline_state "running"

  @unit
  Scenario: Halted feature has synchronized pipelineState (S5)
    Given feature "auth-flow" has status "running"
    And feature "auth-flow" has pipelineState "running"
    When HaltPipeline is triggered for "auth-flow"
    Then Get-Feature "auth-flow" returns status "halted"
    And Get-PipelineState for "auth-flow" shows pipeline_state "halted"

  @unit
  Scenario: Complete feature has synchronized pipelineState (S18)
    Given feature "auth-flow" has status "running"
    And feature "auth-flow" has pipelineState "running"
    And stages 1 through 7 are marked complete for "auth-flow"
    When Update-PipelineState is called with feature "auth-flow" setting feature status to "complete"
    Then Get-Feature "auth-flow" returns status "complete"
    And Get-PipelineState for "auth-flow" shows pipeline_state "complete"

  @unit
  Scenario: Idle feature after crash has synchronized pipelineState (S19)
    Given feature "auth-flow" has status "running"
    And feature "auth-flow" has pipelineState "running"
    When crash recovery resets feature "auth-flow" to idle
    Then Get-Feature "auth-flow" returns status "idle"
    And Get-PipelineState for "auth-flow" shows pipeline_state "none"

  # --- R7-B1: S23 NoneStateConsistent — dedicated scenario ---
  # TLA+ invariant S23: when pipelineState[f] = "none", the feature has no active
  # pipeline machinery. This completes coverage of all 5 sync invariants
  # (S5/S17/S18/S19/S23).

  @unit
  Scenario: Never-created feature returns null pipeline state (S23)
    Given no feature named "ghost-feature" exists
    When Get-PipelineState is called for "ghost-feature"
    Then it returns null

  # --- R8-09: Pipeline_state null-vs-none ambiguity resolved ---
  # A newly created feature has NO pipeline_state row — Get-PipelineState returns null.
  # The "none" value is written only when crash recovery resets a running feature.
  # This distinguishes "never started" (null) from "started and crashed back" (none).

  @unit
  Scenario: Newly created feature has no pipeline state row (S23)
    Given a feature "auth-flow" has just been created with New-Feature
    And no lock has been acquired for "auth-flow"
    When Get-PipelineState is called for "auth-flow"
    Then it returns null
    And Get-Feature "auth-flow" returns status "idle"
    And Get-ActiveFeature returns null or a different feature
    And no lock row exists for "auth-flow"

# =============================================================================
# Stage Outputs — Structured JSON Storage
# =============================================================================

Feature: Stage outputs store and retrieve structured JSON by type
  Implementation plans, target root, and other opaque structured data stored as JSON text.
  Debate content belongs in debate_state, not stage_outputs.

  @unit
  Scenario: Store a stage output as JSON
    Given feature "auth-flow" exists
    When Set-StageOutput is called with feature "auth-flow", stage 6, output_type "implementation-plan", and a JSON object
    Then Get-StageOutput for "auth-flow" with output_type "implementation-plan" returns the parsed object

  @unit
  Scenario: Store target root output
    Given feature "auth-flow" exists
    When Set-StageOutput is called with feature "auth-flow", stage 6, output_type "target-root", and JSON '{"root": "packages/auth"}'
    Then Get-StageOutput for "auth-flow" with output_type "target-root" returns an object with root "packages/auth"

  @unit
  Scenario: Overwrite an existing stage output
    Given feature "auth-flow" has a stage output of type "implementation-plan" from stage 6
    When Set-StageOutput is called again with output_type "implementation-plan" and updated JSON
    Then Get-StageOutput returns the updated object

  @unit
  Scenario: Get stage output that does not exist
    Given feature "auth-flow" has no stage output of type "debug-info"
    When Get-StageOutput is called for "auth-flow" with output_type "debug-info"
    Then it returns null

  @unit
  Scenario: Stage output has created_at timestamp
    Given feature "auth-flow" exists
    When Set-StageOutput is called with feature "auth-flow", stage 3, output_type "review-summary", and a JSON object
    Then the stored row has a non-null created_at timestamp

# =============================================================================
# Debate State — Debate Loop Tracking
# =============================================================================

Feature: Debate state tracks rounds, consensus, and moderator JSON
  Supports resume mid-debate by persisting every round

  @unit
  Scenario: Write first debate round
    Given feature "auth-flow" exists
    When Update-DebateState is called with feature "auth-flow", stage 4, round 1, consensus_status "pending", and moderator JSON
    Then Get-DebateState for "auth-flow" stage 4 returns round 1 with status "pending"

  @unit
  Scenario: Advance a single debate round
    Given feature "auth-flow" has debate round 1 for stage 4 with consensus_status "pending"
    When Update-DebateState is called with feature "auth-flow", stage 4, round 2, consensus_status "pending", and moderator JSON
    Then Get-DebateState for "auth-flow" stage 4 returns round 2 with status "pending"
    And Get-DebateHistory for "auth-flow" stage 4 returns 2 rows

  @unit
  Scenario: Write subsequent debate rounds culminating in consensus
    Given feature "auth-flow" has debate rounds 1 and 2 for stage 4 with consensus_status "pending"
    When Update-DebateState is called with feature "auth-flow", stage 4, round 3, consensus_status "reached", and moderator JSON
    Then Get-DebateState for "auth-flow" stage 4 returns the latest round 3
    And Get-DebateState for "auth-flow" stage 4 returns consensus_status "reached"

  @unit
  Scenario: Get debate history returns all rounds in order
    Given feature "auth-flow" has debate rounds 1, 2, and 3 for stage 4
    When Get-DebateHistory is called for "auth-flow" stage 4
    Then it returns 3 rows ordered by round number ascending

  @unit
  Scenario: Resume mid-debate using history
    Given feature "auth-flow" has debate rounds 1 and 2 for stage 4 with consensus_status "pending"
    When Get-DebateHistory is called for "auth-flow" stage 4
    Then it returns 2 rows
    And the latest row has round 2 with consensus_status "pending"

  @unit
  Scenario: Get debate state when no rounds exist
    Given feature "auth-flow" has no debate rounds for stage 5
    When Get-DebateState is called for "auth-flow" stage 5
    Then it returns null

  @unit
  Scenario: Each debate round stores moderator JSON
    Given feature "auth-flow" exists
    When Update-DebateState is called with feature "auth-flow", stage 4, round 1, and moderator_json '{"verdict": "continue", "scores": [3, 4, 2]}'
    Then Get-DebateState for "auth-flow" stage 4 returns moderator_json containing the stored JSON

  # --- R6-08: DebateFails max-rounds enforcement (guard, not CRUD write) ---
  # TLA+ guard: debateRound[f][s] = MaxDebateRound. Setting consensus to "failed"
  # is ONLY valid when the current round equals MaxDebateRound. Premature failure
  # before reaching MaxDebateRound is rejected.

  @unit
  Scenario: Max rounds exhausted enforces consensus failure at MaxDebateRound
    Given feature "auth-flow" has status "running"
    And MaxDebateRound is configured as 5
    And feature "auth-flow" has debate rounds 1 through 5 for stage 4 all with consensus_status "pending"
    When Update-DebateState is called with feature "auth-flow", stage 4, round 5, consensus_status "failed"
    Then Get-DebateState for "auth-flow" stage 4 returns consensus_status "failed"

  @unit
  Scenario: Premature debate failure before MaxDebateRound is rejected
    Given feature "auth-flow" has status "running"
    And MaxDebateRound is configured as 5
    And feature "auth-flow" has debate rounds 1 through 3 for stage 4 all with consensus_status "pending"
    When Update-DebateState is called with feature "auth-flow", stage 4, round 3, consensus_status "failed"
    Then a terminating error is thrown
    And the error indicates consensus can only be set to "failed" at MaxDebateRound (round 5), not round 3
    And Get-DebateState for "auth-flow" stage 4 returns consensus_status "pending"

  # --- R7-B2: AdvanceDebateRound rejection at MaxDebateRound boundary ---
  # TLA+ guard: debateRound[f][s] < MaxDebateRound for AdvanceDebateRound.
  # Once MaxDebateRound is reached, no further rounds can be written — only
  # consensus "reached" or "failed" may be set on the existing final round.

  @unit
  Scenario: Advancing debate beyond MaxDebateRound is rejected
    Given feature "auth-flow" has status "running"
    And MaxDebateRound is configured as 5
    And feature "auth-flow" has debate rounds 1 through 5 for stage 4 all with consensus_status "pending"
    When Update-DebateState is called with feature "auth-flow", stage 4, round 6, consensus_status "pending", and moderator JSON
    Then a terminating error is thrown
    And the error indicates round 6 exceeds MaxDebateRound (5) — no further rounds allowed
    And Get-DebateHistory for "auth-flow" stage 4 returns exactly 5 rows

  # --- R8-04: MaxDebateRound=1 boundary lifecycle ---
  # Single-round debate where AdvanceDebateRound is permanently disabled and only
  # DebateReachConsensus or DebateFails can resolve. This is the debate analog of
  # the MaxCrashes=1 boundary scenario (line 1055).

  @unit
  Scenario: MaxDebateRound=1 — advancing to round 2 is immediately rejected
    Given feature "auth-flow" has status "running"
    And MaxDebateRound is configured as 1
    And feature "auth-flow" has debate round 1 for stage 4 with consensus_status "pending"
    When Update-DebateState is called with feature "auth-flow", stage 4, round 2, consensus_status "pending", and moderator JSON
    Then a terminating error is thrown
    And the error indicates round 2 exceeds MaxDebateRound (1) — no further rounds allowed
    And Get-DebateHistory for "auth-flow" stage 4 returns exactly 1 row

  @unit
  Scenario: MaxDebateRound=1 — consensus reached on the single round
    Given feature "auth-flow" has status "running"
    And MaxDebateRound is configured as 1
    And feature "auth-flow" has debate round 1 for stage 4 with consensus_status "pending"
    When Update-DebateState is called with feature "auth-flow", stage 4, round 1, consensus_status "reached", and moderator JSON
    Then Get-DebateState for "auth-flow" stage 4 returns consensus_status "reached"
    And Get-Feature "auth-flow" returns status "running"

  @unit
  Scenario: MaxDebateRound=1 — debate failure on the single round halts the feature
    Given feature "auth-flow" has status "running"
    And MaxDebateRound is configured as 1
    And feature "auth-flow" has debate round 1 for stage 4 with consensus_status "pending"
    When Update-DebateState is called with feature "auth-flow", stage 4, round 1, consensus_status "failed"
    Then Get-DebateState for "auth-flow" stage 4 returns consensus_status "failed"
    And Get-Feature "auth-flow" returns status "halted"
    And Get-PipelineState for "auth-flow" shows pipeline_state "halted"

  # --- R7-B3: S11 DebateStageConsistency — non-debate stage rejection ---
  # TLA+ invariant S11: debate rounds may only exist on stages where StartDebate is
  # enabled. Stages 1 (pre-debate) and 7 (coding stage) do not have debates.

  @unit
  Scenario: Writing debate round on stage 1 is rejected (non-debate stage)
    Given feature "auth-flow" has status "running"
    When Update-DebateState is called with feature "auth-flow", stage 1, round 1, consensus_status "pending", and moderator JSON
    Then a terminating error is thrown
    And the error indicates stage 1 does not support debate rounds

  @unit
  Scenario: Writing debate round on stage 7 is rejected (coding stage)
    Given feature "auth-flow" has status "running"
    When Update-DebateState is called with feature "auth-flow", stage 7, round 1, consensus_status "pending", and moderator JSON
    Then a terminating error is thrown
    And the error indicates stage 7 does not support debate rounds

# =============================================================================
# Tier Progress — Stage 7 Coding Tier Tracking
# =============================================================================

Feature: Tier progress tracks coding tier status
  Stage 7 executes tasks in tiers; each tier has a lifecycle: none -> pending -> running -> passed/failed.
  Tier status domain: {none, pending, running, passed, failed} — see glossary for full semantics.

  @unit
  Scenario: Initialize tier to pending on Stage 7 entry
    Given feature "auth-flow" exists
    And no tier progress rows exist for "auth-flow"
    When Set-TierStatus is called with feature "auth-flow", tier 1, status "pending"
    Then Get-TierProgress for "auth-flow" tier 1 returns status "pending"

  # --- R4-11: Business-level trigger for tier initialization ---

  @unit
  Scenario: Stage 7 entry initializes all tiers to pending
    Given feature "auth-flow" exists
    And no tier progress rows exist for "auth-flow"
    When Stage 7 is entered for feature "auth-flow"
    Then Get-AllTierProgress for "auth-flow" returns 3 rows all with status "pending"
    And each tier row has a null completed_at timestamp

  # --- R6-05: EnterStage7 rejection when tiers already non-'none' ---

  @unit
  Scenario: Stage 7 entry rejected when tiers are already non-none
    Given feature "auth-flow" exists
    And feature "auth-flow" tier 1 has status "pending"
    When Stage 7 is entered for feature "auth-flow"
    Then a terminating error is thrown
    And the error indicates tiers must all be in "none" status to initialize Stage 7
    And Get-TierProgress for "auth-flow" tier 1 returns status "pending"

  @unit
  Scenario: Stage 7 entry rejected after crash recovery leaves tiers in pending
    Given feature "auth-flow" exists
    And feature "auth-flow" tier 1 has status "passed"
    And feature "auth-flow" tier 2 has status "pending"
    When Stage 7 is entered for feature "auth-flow"
    Then a terminating error is thrown
    And the error indicates tiers must all be in "none" status to initialize Stage 7

  @unit
  Scenario: Start a tier transitions from pending to running
    Given feature "auth-flow" tier 1 has status "pending"
    When Set-TierStatus is called with feature "auth-flow", tier 1, status "running"
    Then Get-TierProgress for "auth-flow" tier 1 returns status "running"

  @unit
  Scenario: Complete a tier with passed status
    Given feature "auth-flow" tier 1 has status "running"
    When Set-TierStatus is called with feature "auth-flow", tier 1, status "passed"
    Then Get-TierProgress for "auth-flow" tier 1 returns status "passed"
    And the row has a non-null completed_at timestamp

  @unit
  Scenario: Fail a tier
    Given feature "auth-flow" tier 1 has status "running"
    When Set-TierStatus is called with feature "auth-flow", tier 1, status "failed"
    Then Get-TierProgress for "auth-flow" tier 1 returns status "failed"

  @unit
  Scenario: Gate pass on tier N allows StartTier on tier N+1
    Given feature "auth-flow" has tiers 1 (passed), 2 (pending), and 3 (pending)
    When Set-TierStatus is called with feature "auth-flow", tier 2, status "running"
    Then Get-TierProgress for "auth-flow" tier 2 returns status "running"
    And Get-TierProgress for "auth-flow" tier 1 still returns status "passed"
    And Get-TierProgress for "auth-flow" tier 3 still returns status "pending"

  @unit
  Scenario: Get all tier progress
    Given feature "auth-flow" has tiers 1 (passed), 2 (running), and 3 (pending)
    When Get-AllTierProgress is called for "auth-flow"
    Then it returns 3 rows with their respective statuses

  # --- R6-10: Concrete return value instead of "can determine" ---

  @unit
  Scenario: Resume mid-Stage-7 using tier progress returns actionable state
    Given feature "auth-flow" has tiers 1 (passed) and 2 (running)
    When Get-AllTierProgress is called for "auth-flow"
    Then it returns 2 rows
    And the first row has tier 1 with status "passed"
    And the second row has tier 2 with status "running"

  @unit
  Scenario: Get tier progress when no tiers exist
    Given feature "auth-flow" has no tier progress rows
    When Get-AllTierProgress is called for "auth-flow"
    Then it returns an empty collection

  # --- R6-03: S21 NoneTierNoTasks — tier reset to 'none' carries zero tasks ---

  @unit
  Scenario: Tier reset to none carries zero task results
    Given feature "auth-flow" tier 2 had status "running" with tasks T1 and T2
    And HaltPipeline resets tier 2 to status "none" (zero tasks)
    When Get-TierProgress for "auth-flow" tier 2 is called
    Then Get-TierProgress for "auth-flow" tier 2 returns status "none"
    And Get-TierTaskResults for "auth-flow" tier 2 returns an empty collection

  # --- R6-04: S22 RunningTierNoVerdict — running tier has null gate verdict ---

  @unit
  Scenario: Running tier has no gate verdict before any gate fires
    Given feature "auth-flow" tier 1 has status "running"
    And no gate results exist for "auth-flow" tier 1
    When Get-GateResult is called for "auth-flow" gate_type "code-quality"
    Then it returns null

  # --- R5-10: Invalid tier status transitions ---

  @unit
  Scenario: Tier status transition from passed to running is rejected
    Given feature "auth-flow" tier 1 has status "passed"
    When Set-TierStatus is called with feature "auth-flow", tier 1, status "running"
    Then a terminating error is thrown
    And the error indicates tier 1 cannot transition from "passed" to "running"

  @unit
  Scenario: Tier status transition from failed to pending is rejected
    Given feature "auth-flow" tier 1 has status "failed"
    When Set-TierStatus is called with feature "auth-flow", tier 1, status "pending"
    Then a terminating error is thrown
    And the error indicates tier 1 cannot transition from "failed" to "pending"

  @unit
  Scenario: Tier status transition from passed to pending is rejected
    Given feature "auth-flow" tier 1 has status "passed"
    When Set-TierStatus is called with feature "auth-flow", tier 1, status "pending"
    Then a terminating error is thrown
    And the error indicates tier 1 cannot transition from "passed" to "pending"

  @unit
  Scenario: Tier status transition from failed to running is rejected
    Given feature "auth-flow" tier 1 has status "failed"
    When Set-TierStatus is called with feature "auth-flow", tier 1, status "running"
    Then a terminating error is thrown
    And the error indicates tier 1 cannot transition from "failed" to "running"

  # --- R7-B13: Set-TierStatus for out-of-range tier number — boundary error ---

  @unit
  Scenario: Set-TierStatus rejected for tier 0
    Given feature "auth-flow" exists
    When Set-TierStatus is called with feature "auth-flow", tier 0, status "pending"
    Then a terminating error is thrown
    And the error indicates tier number must be between 1 and the configured maximum

  @unit
  Scenario: Set-TierStatus rejected for tier above configured maximum
    Given feature "auth-flow" exists
    And the configured maximum tier count is 3
    When Set-TierStatus is called with feature "auth-flow", tier 4, status "pending"
    Then a terminating error is thrown
    And the error indicates tier 4 exceeds the configured maximum tier count of 3

  @unit
  Scenario: Set-TierStatus rejected for negative tier number
    Given feature "auth-flow" exists
    When Set-TierStatus is called with feature "auth-flow", tier -1, status "pending"
    Then a terminating error is thrown
    And the error indicates tier number must be between 1 and the configured maximum

  # --- R4-02: CompleteStage7 — all tiers pass -> stage 7 complete ---

  @unit
  Scenario: All tiers passing marks stage 7 complete and advances lastCompleted to MaxStage
    Given feature "auth-flow" has status "running"
    And feature "auth-flow" has stages 1 through 6 complete
    And feature "auth-flow" has tiers 1 (passed), 2 (passed), and 3 (passed)
    When Set-StageComplete is called with feature "auth-flow" and stage 7
    Then Get-LastCompletedStage for "auth-flow" returns 7
    And stage_progress contains a row for "auth-flow" stage 7 with a non-null completed_at

# =============================================================================
# Task Results — Per-Task Coding Outcomes
# =============================================================================

Feature: Task results record per-task coding outcomes within tiers
  Each task has a phase, status, counters, escalation flag, error, and test files

  @unit
  Scenario: Set a task result
    Given feature "auth-flow" exists
    When Set-TaskResult is called with feature "auth-flow", task_id "T1", tier 1, phase "green", status "pass"
    Then Get-TaskResult for "auth-flow" task_id "T1" returns phase "green" and status "pass"

  @unit
  Scenario: Upsert updates existing task result
    Given feature "auth-flow" has task "T1" with phase "red" and status "running"
    When Set-TaskResult is called with feature "auth-flow", task_id "T1", phase "green", status "pass"
    Then Get-TaskResult for "auth-flow" task_id "T1" returns phase "green" and status "pass"

  @unit
  Scenario: Task result stores counters as JSON
    Given feature "auth-flow" exists
    When Set-TaskResult is called with feature "auth-flow", task_id "T2", and counters_json '{"attempts": 3, "failures": 1}'
    Then Get-TaskResult for "auth-flow" task_id "T2" returns counters containing attempts 3

  @unit
  Scenario: Task result tracks escalation
    Given feature "auth-flow" exists
    When Set-TaskResult is called with feature "auth-flow", task_id "T3", escalated 1, and error "test timeout"
    Then Get-TaskResult for "auth-flow" task_id "T3" returns escalated true and error "test timeout"

  @unit
  Scenario: Task result stores test file paths as JSON
    Given feature "auth-flow" exists
    When Set-TaskResult is called with feature "auth-flow", task_id "T1", and test_files_json '["tests/auth.test.ts", "tests/login.test.ts"]'
    Then Get-TaskResult for "auth-flow" task_id "T1" returns test_files containing 2 paths

  @unit
  Scenario: Get all task results for a tier
    Given feature "auth-flow" has tasks T1, T2, and T3 in tier 1
    And feature "auth-flow" has task T4 in tier 2
    When Get-TierTaskResults is called for "auth-flow" tier 1
    Then it returns 3 rows (T1, T2, T3)
    And it does not include T4

  @unit
  Scenario: Get task results for tier with no tasks
    Given feature "auth-flow" has no tasks in tier 3
    When Get-TierTaskResults is called for "auth-flow" tier 3
    Then it returns an empty collection

  # --- R6-10: Concrete return value instead of "can determine" ---

  @unit
  Scenario: Resume mid-Stage-7 using task results returns actionable state
    Given feature "auth-flow" has tasks T1 (pass), T2 (pass), and T3 (running) in tier 1
    When Get-TierTaskResults is called for "auth-flow" tier 1
    Then it returns 3 rows
    And the row for T1 has status "pass"
    And the row for T2 has status "pass"
    And the row for T3 has status "running"

  # --- R8-05: MaxTasks=1 boundary lifecycle ---
  # Single-task tier where CompleteTask once exhausts the budget, StartMerge is
  # enabled, and second CompleteTask is immediately rejected. This is the task
  # analog of MaxCrashes=1 and MaxDebateRound=1 boundary scenarios.

  @unit
  Scenario: MaxTasks=1 — single task completes and second task is immediately rejected
    Given MaxTasks is configured as 1
    And feature "auth-flow" tier 1 has status "running"
    And feature "auth-flow" has no tasks in tier 1
    When Set-TaskResult is called with feature "auth-flow", task_id "T1", tier 1, phase "green", status "pass"
    Then Get-TaskResult for "auth-flow" task_id "T1" returns phase "green" and status "pass"
    And Get-TierTaskResults for "auth-flow" tier 1 returns 1 row

  @unit
  Scenario: MaxTasks=1 — second CompleteTask rejected after budget exhausted
    Given MaxTasks is configured as 1
    And feature "auth-flow" tier 1 has status "running"
    And feature "auth-flow" has task T1 with status "pass" in tier 1
    When Set-TaskResult is called with feature "auth-flow", task_id "T2", tier 1, phase "red", status "running"
    Then a terminating error is thrown
    And the error indicates tier 1 has reached the maximum number of tasks (1)
    And Get-TaskResult for "auth-flow" task_id "T2" returns null

  @unit
  Scenario: MaxTasks=1 — merge enabled after the single task completes
    Given MaxTasks is configured as 1
    And feature "auth-flow" tier 1 has status "running"
    And feature "auth-flow" has task T1 with status "pass" in tier 1
    When Set-MergeResult is called with feature "auth-flow", task_id "T1", status "pending"
    Then Get-MergeResults for "auth-flow" includes task_id "T1" with status "pending"

  # --- R6-06: CompleteTask at MaxTasks boundary ---

  @unit
  Scenario: Task completion rejected when tier has reached MaxTasks
    Given feature "auth-flow" tier 1 has status "running"
    And feature "auth-flow" has MaxTasks tasks already recorded in tier 1
    When Set-TaskResult is called with feature "auth-flow", task_id "T-overflow", tier 1, phase "green", status "pass"
    Then a terminating error is thrown
    And the error indicates tier 1 has reached the maximum number of tasks (MaxTasks)
    And Get-TaskResult for "auth-flow" task_id "T-overflow" returns null

# =============================================================================
# Merge Results — Workspace Merge Outcomes
# =============================================================================

Feature: Merge results record workspace merge outcomes
  Tracks whether merging an isolated workspace back succeeded, and any conflicts.
  NOTE — Granularity difference: BDD merge_results are keyed per task_id (one row
  per task merge), while TLA+ models mergeStatus per tier (single value per tier).
  This is intentional: the BDD captures implementation-level detail (each task's
  workspace merges independently), while TLA+ abstracts to tier-level for model
  checking tractability.  The implementation aggregates task-level merge outcomes
  to determine the tier-level merge status used by gate guards.

  # --- R6-07: StartMerge zero-tasks guard ---

  @unit
  Scenario: Merge initiation rejected when no tasks have completed in the tier
    Given feature "auth-flow" tier 1 has status "running"
    And feature "auth-flow" has no task results in tier 1
    When Set-MergeResult is called with feature "auth-flow", task_id "T1", status "pending"
    Then a terminating error is thrown
    And the error indicates at least one task must complete before initiating a merge

  # --- R7-B4: S14 MergeStatusConsistent — merge-on-non-running-tier guard ---
  # TLA+ invariant S14: merge operations are only valid when the tier is in 'running'
  # status. Gate rejection for non-running tiers is tested elsewhere; this tests the
  # equivalent guard on merge initiation.

  @unit
  Scenario: Merge initiation rejected when tier status is pending
    Given feature "auth-flow" tier 1 has status "pending"
    And feature "auth-flow" has task T1 with status "pass" in tier 1
    When Set-MergeResult is called with feature "auth-flow", task_id "T1", status "pending"
    Then a terminating error is thrown
    And the error indicates the tier must be in 'running' status to initiate a merge

  @unit
  Scenario: Merge initiation rejected when tier status is passed
    Given feature "auth-flow" tier 1 has status "passed"
    And feature "auth-flow" has task T1 with status "pass" in tier 1
    When Set-MergeResult is called with feature "auth-flow", task_id "T1", status "pending"
    Then a terminating error is thrown
    And the error indicates the tier must be in 'running' status to initiate a merge

  @unit
  Scenario: Merge initiation rejected when tier status is failed
    Given feature "auth-flow" tier 1 has status "failed"
    And feature "auth-flow" has task T1 with status "pass" in tier 1
    When Set-MergeResult is called with feature "auth-flow", task_id "T1", status "pending"
    Then a terminating error is thrown
    And the error indicates the tier must be in 'running' status to initiate a merge

  @unit
  Scenario: Initiate merge sets status to pending before resolution
    Given feature "auth-flow" tier 1 has status "running"
    And feature "auth-flow" has task T1 with status "pass" in tier 1
    And feature "auth-flow" tier 1 has merge status "none"
    When Set-MergeResult is called with feature "auth-flow", task_id "T1", status "pending"
    Then Get-MergeResults for "auth-flow" includes task_id "T1" with status "pending"

  @unit
  Scenario: Resolve pending merge to success
    Given feature "auth-flow" tier 1 has status "running"
    And feature "auth-flow" has merge result for task_id "T1" with status "pending"
    When Set-MergeResult is called with feature "auth-flow", task_id "T1", status "success", checkpoint "abc123", conflict 0
    Then Get-MergeResults for "auth-flow" includes task_id "T1" with status "success"

  @unit
  Scenario: Record a successful merge
    Given feature "auth-flow" exists
    When Set-MergeResult is called with feature "auth-flow", task_id "T1", status "success", checkpoint "abc123", conflict 0
    Then Get-MergeResults for "auth-flow" includes task_id "T1" with status "success"

  @unit
  Scenario: Record a merge with conflict
    Given feature "auth-flow" exists
    When Set-MergeResult is called with feature "auth-flow", task_id "T2", status "conflict", checkpoint "def456", conflict 1
    Then Get-MergeResults for "auth-flow" includes task_id "T2" with conflict true

  @unit
  Scenario: Get all merge results for a feature
    Given feature "auth-flow" has merge results for T1, T2, and T3
    When Get-MergeResults is called for "auth-flow"
    Then it returns 3 rows

  @unit
  Scenario: Get merge results when none exist
    Given feature "auth-flow" has no merge results
    When Get-MergeResults is called for "auth-flow"
    Then it returns an empty collection

# =============================================================================
# Gate Results — Review Gate Verdicts
# =============================================================================

Feature: Gate results record review gate verdicts
  Each gate type can have multiple rounds; verdicts are stored as JSON

  @unit
  Scenario: Record a gate result
    Given feature "auth-flow" exists
    When Set-GateResult is called with feature "auth-flow", gate_type "code-quality", task_id "T1", status "pass", round 1, and verdict_json '{"score": 8, "issues": []}'
    Then Get-GateResult for "auth-flow" gate_type "code-quality" returns status "pass" and round 1

  @unit
  Scenario: Record multiple rounds for same gate type
    Given feature "auth-flow" has gate result for "code-quality" round 1 with status "fail"
    When Set-GateResult is called with feature "auth-flow", gate_type "code-quality", task_id "T1", status "pass", round 2
    Then Get-GateResult for "auth-flow" gate_type "code-quality" returns the latest round 2

  @unit
  Scenario: Get all rounds for a gate type
    Given feature "auth-flow" has gate results for "code-quality" rounds 1, 2, and 3
    When Get-GateResults is called for "auth-flow" gate_type "code-quality"
    Then it returns 3 rows ordered by round

  @unit
  Scenario: Get gate result that does not exist
    Given feature "auth-flow" has no gate results for type "security-audit"
    When Get-GateResult is called for "auth-flow" gate_type "security-audit"
    Then it returns null

  @unit
  Scenario: Gate result stores created_at timestamp
    Given feature "auth-flow" exists
    When Set-GateResult is called with feature "auth-flow", gate_type "lint", task_id "T2", status "pass", round 1
    Then the stored row has a non-null created_at timestamp

  @unit
  Scenario: Gate cannot evaluate before any tasks complete
    Given feature "auth-flow" tier 1 has status "running"
    And feature "auth-flow" has no task results in tier 1
    When Set-GateResult is called for "auth-flow" gate_type "code-quality" with task_id "T1"
    Then a terminating error is thrown
    And the error indicates at least one task must complete before gate evaluation

  @unit
  Scenario: Gate rejected before successful merge
    Given feature "auth-flow" tier 1 has status "running"
    And feature "auth-flow" has task T1 with status "pass" in tier 1
    And feature "auth-flow" tier 1 has merge status "none"
    When Set-GateResult is called with feature "auth-flow", gate_type "code-quality", task_id "T1", status "pass", round 1
    Then a terminating error is thrown
    And the error indicates a successful merge is required before gate evaluation

  @unit
  Scenario: Gate rejected when merge is still pending
    Given feature "auth-flow" tier 1 has status "running"
    And feature "auth-flow" has task T1 with status "pass" in tier 1
    And feature "auth-flow" tier 1 has merge status "pending"
    When Set-GateResult is called with feature "auth-flow", gate_type "code-quality", task_id "T1", status "pass", round 1
    Then a terminating error is thrown
    And the error indicates a successful merge is required before gate evaluation

  # --- R4-07: GatePass/GateFail tierStatus guard ---

  @unit
  Scenario: Gate rejected when tier status is pending
    Given feature "auth-flow" tier 1 has status "pending"
    When Set-GateResult is called with feature "auth-flow", gate_type "code-quality", task_id "T1", status "pass", round 1
    Then a terminating error is thrown
    And the error indicates the tier must be in 'running' status for gate evaluation

  @unit
  Scenario: Gate rejected when tier status is passed
    Given feature "auth-flow" tier 1 has status "passed"
    When Set-GateResult is called with feature "auth-flow", gate_type "code-quality", task_id "T1", status "pass", round 1
    Then a terminating error is thrown
    And the error indicates the tier must be in 'running' status for gate evaluation

  @unit
  Scenario: Gate rejected when tier status is failed
    Given feature "auth-flow" tier 1 has status "failed"
    When Set-GateResult is called with feature "auth-flow", gate_type "code-quality", task_id "T1", status "pass", round 1
    Then a terminating error is thrown
    And the error indicates the tier must be in 'running' status for gate evaluation

  # --- R6-10: Concrete return value instead of "can determine" ---

  @unit
  Scenario: Resume mid-Stage-7 reads prior gate results for actionable status
    Given feature "auth-flow" has gate results for "code-quality" round 1 with status "pass"
    And feature "auth-flow" has gate results for "test-coverage" round 1 with status "pass"
    When Get-GateResults is called for "auth-flow" gate_type "code-quality"
    And Get-GateResults is called for "auth-flow" gate_type "test-coverage"
    Then Get-GateResults for "code-quality" returns 1 row with status "pass"
    And Get-GateResults for "test-coverage" returns 1 row with status "pass"

# =============================================================================
# Cross-Aggregate Halt Cascades
# =============================================================================

Feature: Halt cascades propagate across aggregates
  When a halt condition is triggered in one aggregate, dependent aggregates reflect the terminal state.
  TLA+ actions: HaltPipeline, GateFail, MergeConflict, DebateFails

  @unit
  Scenario: Gate failure halts the feature and fails the tier
    Given feature "auth-flow" has status "running"
    And feature "auth-flow" tier 1 has status "running"
    And feature "auth-flow" tier 1 has a successful merge
    When Set-GateResult is called with feature "auth-flow", gate_type "code-quality", task_id "T1", status "fail", round 1, and verdict_json '{"score": 2, "issues": ["critical bug"]}'
    Then Get-GateResult for "auth-flow" gate_type "code-quality" returns status "fail"
    And Get-TierProgress for "auth-flow" tier 1 returns status "failed"
    And Get-Feature "auth-flow" returns status "halted"
    And Get-PipelineState for "auth-flow" shows pipeline_state "halted"

  @unit
  Scenario: Merge conflict halts the feature and fails the tier
    Given feature "auth-flow" has status "running"
    And feature "auth-flow" tier 1 has status "running"
    And feature "auth-flow" has task T1 with status "pass" in tier 1
    And feature "auth-flow" tier 1 has merge status "pending"
    When Set-MergeResult is called with feature "auth-flow", task_id "T1", status "conflict", checkpoint "abc123", conflict 1
    Then Get-MergeResults for "auth-flow" includes task_id "T1" with status "conflict"
    And Get-TierProgress for "auth-flow" tier 1 returns status "failed"
    And Get-Feature "auth-flow" returns status "halted"
    And Get-PipelineState for "auth-flow" shows pipeline_state "halted"

  # --- R8-02: MergeConflict halt atomicity — partial-failure rollback ---
  # Set-MergeResult with status=conflict must atomically fail the tier AND halt the
  # feature. If the merge_results write succeeds but the tier_progress or features
  # update fails, the entire transaction must roll back — no partial state where a
  # conflict is recorded but the tier remains "running" and feature remains "running".
  # Pattern mirrors Lock-PipelineState rollback scenario (line 676 / R5-07).

  @integration
  Scenario: Set-MergeResult conflict rolls back on partial failure across tables
    Given feature "auth-flow" has status "running"
    And feature "auth-flow" tier 1 has status "running"
    And feature "auth-flow" has task T1 with status "pass" in tier 1
    And feature "auth-flow" tier 1 has merge status "pending"
    And the merge_results table write will succeed but the tier_progress update will fail (simulated)
    When Set-MergeResult is called with feature "auth-flow", task_id "T1", status "conflict", checkpoint "abc123", conflict 1
    Then a terminating error is thrown
    And Get-MergeResults for "auth-flow" does not include task_id "T1" with status "conflict"
    And Get-TierProgress for "auth-flow" tier 1 returns status "running"
    And Get-Feature "auth-flow" returns status "running"
    And Get-PipelineState for "auth-flow" shows pipeline_state "running"
    # R5-15: cleanup
    And the temp .db file is removed in AfterEach teardown

  # --- R5-03: Debate failure now asserts BOTH featureStatus AND pipelineState ---

  @unit
  Scenario: Debate failure halts the feature with consensus failed
    Given feature "auth-flow" has status "running"
    And MaxDebateRound is configured as 5
    And feature "auth-flow" has debate rounds 1 through 5 for stage 4 all with consensus_status "pending"
    # R8-08: Pre-Stage-7 debate — no tiers have been initialized
    And no tier progress rows exist for "auth-flow"
    When the debate is marked as failed for "auth-flow" stage 4
    Then Get-DebateState for "auth-flow" stage 4 returns consensus_status "failed"
    And Get-Feature "auth-flow" returns status "halted"
    And Get-PipelineState for "auth-flow" shows pipeline_state "halted"
    # R8-08: All tiers remain "none" — S16 verified non-vacuously
    And Get-AllTierProgress for "auth-flow" returns an empty collection

  @unit
  Scenario: Halt feature clears pending debate rounds with failed status
    Given feature "auth-flow" has status "running"
    And feature "auth-flow" has debate rounds 1 and 2 for stage 4 with consensus_status "pending"
    And the debate for stage 4 has consensus_status "pending"
    When HaltPipeline is triggered for "auth-flow"
    Then Get-Feature "auth-flow" returns status "halted"
    And Get-PipelineState for "auth-flow" shows pipeline_state "halted"
    And Get-DebateState for "auth-flow" stage 4 returns consensus_status "failed"

  @unit
  Scenario: Halt feature fails running tier with completed tasks
    Given feature "auth-flow" has status "running"
    And feature "auth-flow" tier 2 has status "running"
    And feature "auth-flow" has task T1 with status "pass" in tier 2
    When HaltPipeline is triggered for "auth-flow"
    Then Get-Feature "auth-flow" returns status "halted"
    And Get-PipelineState for "auth-flow" shows pipeline_state "halted"
    And Get-TierProgress for "auth-flow" tier 2 returns status "failed"

  @unit
  Scenario: Halt feature resets running tier with zero tasks to none
    Given feature "auth-flow" has status "running"
    And feature "auth-flow" tier 2 has status "running"
    And feature "auth-flow" has no tasks in tier 2
    When HaltPipeline is triggered for "auth-flow"
    Then Get-Feature "auth-flow" returns status "halted"
    And Get-PipelineState for "auth-flow" shows pipeline_state "halted"
    And Get-TierProgress for "auth-flow" tier 2 returns status "none"

  @unit
  Scenario: Halt feature resets pending merge on running tier
    Given feature "auth-flow" has status "running"
    And feature "auth-flow" tier 2 has status "running"
    And feature "auth-flow" tier 2 has merge status "pending"
    When HaltPipeline is triggered for "auth-flow"
    Then Get-Feature "auth-flow" returns status "halted"
    And Get-PipelineState for "auth-flow" shows pipeline_state "halted"
    And Get-MergeResults for "auth-flow" shows tier 2 merge status "none"

  @unit
  Scenario: Halt resets pending tiers to none (Revision 7 — TierSequentialOrder)
    Given feature "auth-flow" has status "running"
    And feature "auth-flow" tier 1 has status "running" with 0 tasks
    And feature "auth-flow" tier 2 has status "pending"
    And feature "auth-flow" tier 3 has status "pending"
    When HaltPipeline is triggered for "auth-flow"
    Then Get-Feature "auth-flow" returns status "halted"
    And Get-PipelineState for "auth-flow" shows pipeline_state "halted"
    And Get-TierProgress for "auth-flow" tier 1 returns status "none"
    And Get-TierProgress for "auth-flow" tier 2 returns status "none"
    And Get-TierProgress for "auth-flow" tier 3 returns status "none"

  @unit
  Scenario: Halt preserves passed tiers and completed merges
    Given feature "auth-flow" has status "running"
    And feature "auth-flow" tier 1 has status "passed" with merge status "merged"
    And feature "auth-flow" tier 2 has status "running"
    When HaltPipeline is triggered for "auth-flow"
    Then Get-TierProgress for "auth-flow" tier 1 returns status "passed"
    And Get-MergeResults for "auth-flow" shows tier 1 merge status "merged"

  # --- R5-05: Composite HaltPipeline with BOTH pending tiers AND pending merges ---

  @unit
  Scenario: Halt with running tier having pending merge AND subsequent pending tiers simultaneously
    Given feature "auth-flow" has status "running"
    And feature "auth-flow" tier 1 has status "passed" with merge status "merged"
    And feature "auth-flow" tier 2 has status "running" with 1 task
    And feature "auth-flow" tier 2 has merge status "pending"
    And feature "auth-flow" tier 3 has status "pending"
    When HaltPipeline is triggered for "auth-flow"
    Then Get-Feature "auth-flow" returns status "halted"
    And Get-PipelineState for "auth-flow" shows pipeline_state "halted"
    And Get-TierProgress for "auth-flow" tier 1 returns status "passed"
    And Get-MergeResults for "auth-flow" shows tier 1 merge status "merged"
    And Get-TierProgress for "auth-flow" tier 2 returns status "failed"
    And Get-MergeResults for "auth-flow" shows tier 2 merge status "none"
    And Get-TierProgress for "auth-flow" tier 3 returns status "none"

# =============================================================================
# Pipeline Completion — Feature Lifecycle Terminal Transition
# =============================================================================

Feature: Pipeline completion transitions feature to terminal success state
  TLA+ action: CompletePipeline — when all stages are done the feature reaches 'complete'

  # --- R4-01 + R4-02: Full pipeline completion path ---

  @unit
  Scenario: All tiers pass completes stage 7 and then completes the pipeline
    Given feature "auth-flow" has status "running"
    And feature "auth-flow" has stages 1 through 6 complete
    And feature "auth-flow" has tiers 1 (passed), 2 (passed), and 3 (passed) with all merges successful and all gates passed
    When Set-StageComplete is called with feature "auth-flow" and stage 7
    And Update-PipelineState is called with feature "auth-flow" setting feature status to "complete"
    Then Get-LastCompletedStage for "auth-flow" returns 7
    And Get-Feature "auth-flow" returns status "complete"
    And the feature status value in pipeline_state is "complete"

  # --- R5-04: Rejection asserts pipelineState remains 'running' ---

  @unit
  Scenario: Pipeline completion rejected when not all stages are done
    Given feature "auth-flow" has status "running"
    And feature "auth-flow" has stages 1 through 5 complete
    And Get-PipelineState for "auth-flow" shows pipeline_state "running"
    When Update-PipelineState is called with feature "auth-flow" setting feature status to "complete"
    Then a terminating error is thrown
    And the error indicates all 7 stages must be complete before marking the feature complete
    And Get-PipelineState for "auth-flow" shows pipeline_state "running"
    And Get-Feature "auth-flow" returns status "running"

  @unit
  Scenario: After pipeline completion the active feature can be cleared and lock released
    Given feature "auth-flow" has status "complete"
    And the session active_feature is "auth-flow"
    And a lock is held for feature "auth-flow" with PID 12345
    When Unlock-PipelineState is called for "auth-flow"
    And Clear-ActiveFeature is called
    Then Get-PipelineLockState for "auth-flow" shows no active lock
    And Get-ActiveFeature returns null

# =============================================================================
# Module Structure — Manifest, Loader, and Organization
# =============================================================================

Feature: State repository module loads correctly
  The module manifest and loader dot-source all function files

  # R5-17: This scenario imports 33 functions and will be the slowest @integration test.
  # Implementation should use BeforeAll caching: import once per test suite, not per scenario.

  @integration
  Scenario: Import module makes all repository functions available
    Given the state-repository module exists at "state/state-repository.psd1"
    When Import-Module ./state/state-repository.psd1 is called
    Then the following functions are available: Open-StateDatabase, Close-StateDatabase, Set-ActiveFeature, Get-ActiveFeature, Clear-ActiveFeature, New-Feature, Get-Feature, Get-AllFeatures, Set-StageComplete, Get-LastCompletedStage, Register-Artifact, Get-Artifacts, Lock-PipelineState, Unlock-PipelineState, Get-PipelineLockState, Add-CrashCount, Update-PipelineState, Get-PipelineState, Set-StageOutput, Get-StageOutput, Update-DebateState, Get-DebateState, Get-DebateHistory, Set-TierStatus, Get-TierProgress, Get-AllTierProgress, Set-TaskResult, Get-TaskResult, Get-TierTaskResults, Set-MergeResult, Get-MergeResults, Set-GateResult, Get-GateResult, Get-GateResults
