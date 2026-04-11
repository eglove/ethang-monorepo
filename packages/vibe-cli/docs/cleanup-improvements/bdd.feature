# BDD Scenarios — Cleanup Improvements
# Date: 2026-04-11
# Source: docs/cleanup-improvements/elicitor.md
# Revision: Addresses all debate objections (round 4 — 7 Tier 1 + 10 Tier 2 amendments)
#
# Glossary — Ubiquitous Language
#   Worktree                — an isolated copy of the repo (git worktree) for parallel task execution
#   Warden                  — agent sandboxing tool that restricts file-system write access per agent
#   Pipeline log            — structured log at pipeline.log with timestamped phase markers
#   Resume                  — restarting the pipeline from where it last stopped, using --resume
#   Fixture                 — generated test data file consumed by test writers in stage 8
#   Fixture JSON schema     — the expected structure of fixture files, defining the parser-to-test-generator contract
#   Schema version          — a "schemaVersion" field in every fixture JSON for forward compatibility
#   TLC output              — all output from the TLA+ model checker (invariants, traces, deadlocks, liveness, temporal properties, coverage, counterexamples, state graphs)
#   TLC exit code           — the process exit code from the TLC model checker (0 = success, 10 = assumption failure, 11 = deadlock, 12 = safety violation, 13 = liveness violation, 14 = assertion failure)
#   BDD feature file        — Gherkin .feature file containing Given-When-Then scenarios
#   Gherkin parser          — PowerShell script that mechanically parses BDD .feature files into fixture JSON
#   TLC parser              — PowerShell script that mechanically parses TLC model checker output into fixture JSON
#   PBT (Property-Based Testing) — unit test methodology driven by TLC-derived fixtures
#   Contract testing        — integration test methodology driven by BDD-derived fixtures
#   Trace-based testing     — E2E test methodology driven by TLC state traces
#   300% coverage           — three independent 100% coverage targets (PBT + contract + E2E) enforced as a hard gate
#   Coverage metric         — each category defines its own 100% target: PBT = branch coverage of PBT source files, contract = branch coverage of contract source files, E2E = branch coverage of E2E test target files
#   Coverage source files   — the set of source files measured for each category, defined per-task by the implementation plan's file manifest
#   Seed                    — the initial prompt that starts a fresh pipeline run
#   Read-Escalation         — interactive recovery prompt offering Keep Going or Stop
#   Stale lock              — a pipeline.lock file left behind by a crashed or killed process (PID no longer running)
#   Coverage iteration cap  — maximum number of TDD cycle iterations allowed to reach the coverage gate (default: 5)
#   TDD cycle cap           — maximum number of full RED-GREEN-REFACTOR iterations allowed per task (default: 10)
#   Atomic write            — write to a temporary file then Move-Item -Force to the final path, ensuring readers never see partial content
#   Task completion counter — a thread-safe counter tracking how many tasks in a tier have finished
#   Process identity        — combination of PID + process start time used to distinguish recycled PIDs from the original process
#   Idempotency token       — unique identifier written to pipeline.log before each LLM invocation, used to detect and skip duplicate calls on --resume
#   Merge conflict          — git conflict when two parallel task branches modify overlapping files in the same tier
#   Abort cleanup           — deterministic cleanup sequence triggered by Ctrl+C / CancelKeyPress / unhandled exception
#   runId                   — a pipeline-run-scoped identifier formatted as "<timestamp>-<random4hex>" (e.g., "20260411T112813-a3f1"), generated once at pipeline start
#   Lock mutex              — a named system mutex ("Global\vibe-cli-pipeline") used to serialize lock acquisition across concurrent processes
#   Merge mutex             — a named system mutex ("Global\vibe-cli-merge") serializing branch merges within a tier, with a configurable timeout (default: 5 minutes)
#   Pipeline version        — the version of the vibe-cli pipeline recorded in pipeline.log at PIPELINE START, checked on --resume for compatibility

# =============================================================================
# Item 1 — Always Use Worktrees
# =============================================================================

Feature: Every task gets its own worktree regardless of tier size
  New-TaskWorkspace always creates an isolated worktree, even for single-task tiers

  Scenario: Single-task tier creates a worktree
    Given tier 2 contains only task T3 for feature "auth-flow"
    When Stage 8 processes tier 2
    Then an isolated worktree is created for T3 at ".worktrees/auth-flow-T3-<runId>"
    And T3 executes inside the worktree
    And Invoke-Claude receives -WorkDir pointing to T3's worktree

  Scenario: Multi-task tier still creates one worktree per task
    Given tier 1 contains tasks T1 and T2 for feature "auth-flow"
    When Stage 8 processes tier 1
    Then an isolated worktree is created for T1 at ".worktrees/auth-flow-T1-<runId>"
    And an isolated worktree is created for T2 at ".worktrees/auth-flow-T2-<runId>"
    And T1 and T2 execute in parallel in their respective worktrees

  Scenario: Single-task skip path is removed from New-TaskWorkspace
    Given New-TaskWorkspace is called with a single task T3
    When the function executes
    Then it does not return $null
    And it creates a worktree for T3
    And the worktree path is tracked in the orchestrator's workspace hashtable

  Scenario: Worktree creation failure on single-task tier triggers escalation
    Given tier 2 contains only task T3
    And worktree creation fails for T3 (e.g., disk full, git error)
    When the failure is detected
    Then Read-Escalation is called with workspace creation failure context
    And no tasks in the tier execute

  # [Tier 1] Worktree creation failure mid-tier with tasks already running
  Scenario: Worktree creation failure mid-tier does not terminate already-running tasks
    Given tier 1 contains tasks T1, T2, and T3
    And T1's worktree was created successfully and T1 is already executing
    And T2's worktree was created successfully and T2 is already executing
    And T3's worktree creation fails (e.g., disk full)
    When the failure is detected
    Then T1 and T2 continue executing in their worktrees (they are not terminated)
    And T3 is marked as failed with error: "Worktree creation failed for T3"
    And Read-Escalation is called with T3's workspace creation failure context
    And the tier waits for T1 and T2 to complete before evaluating tier outcome

  Scenario: Single-task tier worktree is cleaned up after merge
    Given task T3 completed in its worktree at ".worktrees/auth-flow-T3-<runId>"
    And T3's branch has been merged to the feature branch
    When workspace cleanup runs for T3
    Then the worktree at ".worktrees/auth-flow-T3-<runId>" is removed
    And the temporary branch is deleted

  Scenario: Verify commands for single-task tier use worktree path
    Given task T3 runs in worktree ".worktrees/auth-flow-T3-<runId>" with projectRoot "packages/ethang-hono"
    When the orchestrator runs the verify command for T3
    Then the working directory is ".worktrees/auth-flow-T3-<runId>/packages/ethang-hono"

# =============================================================================
# Item 2 — Warden Agent Restriction
# =============================================================================

Feature: Warden scopes each coding agent to its worktree
  Agents have read-only access to the full repo but write access only to their worktree directory

  Scenario: Warden is configured before agent dispatch
    Given task T1 has worktree at ".worktrees/auth-flow-T1-<runId>"
    When the orchestrator prepares to dispatch the coding agent for T1
    Then warden is configured with read-only access to the full repo
    And warden is configured with write access restricted to ".worktrees/auth-flow-T1-<runId>/"

  Scenario: Agent can read files outside its worktree
    Given task T1's agent is running with warden configured
    When the agent reads "packages/shared-lib/src/utils.ts" (outside its worktree)
    Then the read succeeds

  Scenario: Agent cannot write files outside its worktree
    Given task T1's agent is running with warden configured for worktree ".worktrees/auth-flow-T1-<runId>"
    When the agent attempts to write to "packages/shared-lib/src/utils.ts"
    Then warden blocks the write
    And the agent receives a permission-denied error

  Scenario: Agent can write files inside its worktree
    Given task T1's agent is running with warden configured for worktree ".worktrees/auth-flow-T1-<runId>"
    When the agent writes to ".worktrees/auth-flow-T1-<runId>/packages/ethang-hono/src/auth.ts"
    Then the write succeeds

  Scenario: Warden blocks a legitimate write the agent needs
    Given task T1's agent attempts to write a file that is legitimately needed but outside its worktree
    When warden blocks the write
    Then the agent fails with a warden-blocked error
    And the user must update warden allow rules via "/warden allow"

  Scenario: Each parallel task has its own warden scope
    Given tier 1 has tasks T1 and T2 with separate worktrees
    When both agents are dispatched in parallel
    Then T1's agent can only write to ".worktrees/auth-flow-T1-<runId>/"
    And T2's agent can only write to ".worktrees/auth-flow-T2-<runId>/"
    And neither agent can write to the other's worktree

  # [Objection] Warden scopes not re-established for re-dispatched tasks after process restart on --resume
  Scenario: Warden scopes are re-established when tasks are re-dispatched on --resume
    Given the pipeline was killed during stage 8 while T2 was executing
    And warden was configured for T2 at ".worktrees/auth-flow-T2-<runId>"
    When the user runs "./vibe.ps1 --resume" and T2 is re-dispatched
    Then warden is re-configured for T2's worktree before the agent is launched
    And the warden scope matches the original: write access restricted to ".worktrees/auth-flow-T2-<runId>/"
    And read-only access to the full repo is re-granted

  Scenario: Warden configuration failure before agent dispatch halts the task
    Given task T1 has worktree at ".worktrees/auth-flow-T1-<runId>"
    And warden configuration fails (e.g., warden binary not found, config write error)
    When the orchestrator attempts to dispatch the coding agent for T1
    Then the agent is not launched (warden must be active before any agent writes)
    And Read-Escalation is called with warden configuration failure context

# =============================================================================
# Item 3 — Implementation Writer Explicit Paths
# =============================================================================

Feature: Stage 6 receives both TLA+ spec path and BDD feature path
  The implementation writer is given explicit paths to both specification artifacts

  Scenario: Stage 6 receives TLA+ spec path
    Given feature "auth-flow" has a TLA+ spec at "docs/auth-flow/tla/auth.tla"
    When the stage orchestrator invokes Stage 6 for "auth-flow"
    Then the implementation writer receives the TLA+ spec path "docs/auth-flow/tla/auth.tla"

  Scenario: Stage 6 receives BDD feature path
    Given feature "auth-flow" has a BDD feature file at "docs/auth-flow/bdd.feature"
    When the stage orchestrator invokes Stage 6 for "auth-flow"
    Then the implementation writer receives the BDD feature path "docs/auth-flow/bdd.feature"

  Scenario: Both paths are passed explicitly to Invoke-ImplementationWriter
    Given feature "auth-flow" has completed through Stage 5
    And the TLA+ spec is at "docs/auth-flow/tla/auth.tla"
    And the BDD feature file is at "docs/auth-flow/bdd.feature"
    When Invoke-ImplementationWriter is called
    Then the function receives a parameter for the TLA+ spec path
    And the function receives a parameter for the BDD feature path
    And both paths are included in the writer agent's prompt context

  Scenario: Missing BDD feature path causes stage 6 to fail
    Given feature "auth-flow" has a TLA+ spec but no BDD feature file
    When the stage orchestrator invokes Stage 6
    Then Stage 6 fails with an error indicating the BDD feature file is missing
    And the pipeline halts

  Scenario: Missing TLA+ spec path causes stage 6 to fail
    Given feature "auth-flow" has a BDD feature file but no TLA+ spec
    When the stage orchestrator invokes Stage 6
    Then Stage 6 fails with an error indicating the TLA+ spec file is missing
    And the pipeline halts

  Scenario: Implementation writer uses BDD scenarios to inform ticket generation
    Given the BDD feature file contains 15 scenarios across 3 features
    And the TLA+ spec contains 5 actions and 3 invariants
    When the implementation writer generates tickets
    Then each ticket's acceptance criteria reference relevant BDD scenarios
    And each ticket's TLA+ Coverage section maps to spec actions and invariants

# =============================================================================
# Item 4 — Parallel Coding Tasks (Bug Fix)
# =============================================================================

Feature: Same-tier tasks fan out in parallel during Stage 8
  Tasks within the same tier execute concurrently, not sequentially

  Scenario: Two tasks in the same tier start concurrently
    Given tier 1 contains tasks T1 and T2
    When Stage 8 processes tier 1
    Then T1 and T2 are dispatched at the same time
    And both begin their TDD cycles without waiting for the other

  Scenario: Three tasks in the same tier all start concurrently
    Given tier 1 contains tasks T1, T2, and T3
    When Stage 8 processes tier 1
    Then T1, T2, and T3 are all dispatched concurrently
    And none waits for another to complete before starting

  Scenario: Individual task failure does not block other parallel tasks
    Given tier 1 has tasks T1 and T2 running in parallel
    And T1 fails during its GREEN phase
    When T1 escalates via Read-Escalation
    Then T2 continues executing its TDD cycle
    And T2 is not paused or terminated

  Scenario: Tier does not advance until all parallel tasks complete or halt
    Given tier 1 has tasks T1 and T2 running in parallel
    And T1 completes its TDD cycle
    And T2 is still in its GREEN phase
    When the orchestrator checks tier 1 completion
    Then tier 2 does not start
    And the orchestrator waits for T2 to finish

  Scenario: Serialized dispatch bug is resolved
    Given tier 1 contains tasks T1 and T2
    When Stage 8 dispatches tasks for tier 1
    Then the dispatch mechanism uses parallel execution (not sequential awaiting)
    And the wall-clock time is bounded by the slowest task, not the sum of all tasks

  Scenario: All tasks in a tier fail — tier completes as failed
    Given tier 1 contains tasks T1 and T2 running in parallel
    And T1 fails and exhausts its Read-Escalation retries
    And T2 fails and exhausts its Read-Escalation retries
    When the orchestrator evaluates tier 1 completion
    Then tier 1 is marked as failed
    And tier 2 does not start
    And the pipeline halts with an error: "All tasks in tier 1 failed — cannot proceed"

  Scenario: Hung task is terminated after timeout
    Given tier 1 has tasks T1 and T2 running in parallel
    And T1 has been executing for longer than the task timeout threshold (30 minutes)
    And T1 has produced no progress output in that period
    When the orchestrator's watchdog checks task health
    Then T1 is terminated
    And T1 is marked as timed-out
    And Read-Escalation is called with timeout context for T1
    And T2 continues executing unaffected

  # [Objection] Atomic state counter for parallel task completion tracking
  Scenario: Parallel task completion uses atomic counter to prevent lost updates
    Given tier 1 contains tasks T1, T2, and T3 running in parallel
    And the task completion counter for tier 1 is initialized to 0
    When T1 and T2 finish at the same instant
    Then both completion events increment the counter atomically (using a mutex or Interlocked operation)
    And the counter reads 2 after both updates
    And no increment is lost due to concurrent writes

  Scenario: Tier advances only when atomic counter equals total task count
    Given tier 1 contains 3 tasks
    And the task completion counter for tier 1 reads 2 (one task still running)
    When the orchestrator checks whether to advance to tier 2
    Then tier 2 does not start
    And the orchestrator continues waiting

  Scenario: Atomic counter accounts for failed tasks toward tier completion
    Given tier 1 contains tasks T1 and T2 running in parallel
    And T1 completes successfully (counter increments to 1)
    And T2 fails and exhausts retries (counter increments to 2)
    When the orchestrator checks tier 1 completion
    Then the counter reads 2, matching the total task count
    And the orchestrator evaluates tier outcome (at least one success required to advance)

  # [Objection] Git merge conflict scenario for parallel task branches
  Scenario: Parallel tasks in the same tier produce a merge conflict
    Given tier 1 has tasks T1 and T2 running in parallel
    And T1 modifies "packages/ethang-hono/src/routes/auth.ts" in its worktree
    And T2 modifies "packages/ethang-hono/src/routes/auth.ts" in its worktree
    And T1 completes and its branch is merged to the feature branch first
    When T2 completes and its branch merge is attempted
    Then git reports a merge conflict on "packages/ethang-hono/src/routes/auth.ts"
    And the merge is aborted (not left in a half-merged state)
    And Read-Escalation is called with merge conflict context including the conflicting file paths

  Scenario: Merge conflict recovery — agent resolves conflict in a fresh worktree
    Given task T2's merge to the feature branch failed due to a conflict
    And Read-Escalation chose "Keep Going"
    When the orchestrator retries T2's merge
    Then a fresh worktree is created for T2's conflict resolution
    And the coding agent receives the conflict diff and both versions of the conflicting files
    And the agent resolves the conflict and produces a clean merge commit

  Scenario: Merge conflict recovery exhausts retries
    Given task T2's merge to the feature branch has failed 3 consecutive times due to conflicts
    And each retry produced a new conflict resolution attempt that still fails verification
    When the 3rd retry fails
    Then the task is marked as failed with error: "Merge conflict for T2 could not be auto-resolved after 3 attempts"
    And Read-Escalation is called with manual resolution instructions
    And the conflicting branch is preserved for manual inspection

  # [Objection] Merge conflict serialization ordering undefined when multiple tasks conflict
  Scenario: Three parallel tasks — merge ordering is deterministic by task completion time
    Given tier 1 has tasks T1, T2, and T3 running in parallel
    And all three modify overlapping files
    And T1 completes at 11:00:01, T2 at 11:00:02, T3 at 11:00:03
    When merges are performed
    Then merges are serialized in task completion order: T1 first, T2 second, T3 third
    And T2's conflict resolution sees T1's merged changes
    And T3's conflict resolution sees both T1's and T2's merged changes
    And merge serialization uses the merge mutex to prevent concurrent merge attempts

  Scenario: Two tasks complete simultaneously — merge order breaks tie by task ID
    Given tier 1 has tasks T1 and T2 running in parallel
    And both complete within the same millisecond
    When merges are serialized
    Then the task with the lower ID (T1) merges first
    And T2's merge sees T1's merged changes

  # [Tier 2] Merge mutex timeout — serialized merge waits expire
  Scenario: Merge mutex acquisition times out after configured threshold
    Given tier 1 has tasks T1 and T2 running in parallel
    And T1's merge is in progress and holds the merge mutex
    And T1's merge takes longer than the merge mutex timeout (default: 5 minutes)
    When T2 attempts to acquire the merge mutex
    Then T2's merge mutex acquisition times out after 5 minutes
    And T2 is marked as failed with error: "Merge mutex timeout — T1's merge exceeded 5 minutes"
    And Read-Escalation is called with merge timeout context for T2

  # [Tier 2] Reset-MergeQueue in-flight state
  Scenario: Reset-MergeQueue clears pending merge entries when a tier is aborted
    Given tier 1 has tasks T1, T2, and T3
    And T1 completed and is queued for merge
    And T2 completed and is queued for merge
    And T3 is still running when an abort occurs
    When the abort cleanup handler calls Reset-MergeQueue
    Then all pending merge entries for the current tier are cleared
    And no merge is attempted for T1 or T2 during cleanup
    And the merge queue state is logged for diagnostic purposes

# =============================================================================
# Item 5 — --resume Flag
# =============================================================================

Feature: --resume flag replaces -Stage and -Feature parameters
  A single --resume flag auto-detects the feature and last completed stage from pipeline.log

  Scenario: --resume detects feature name from pipeline.log
    Given pipeline.log contains "[2026-04-11 11:28:13] === PIPELINE START seed=\"@cleanup.md\" ==="
    And the seed resolved to feature "cleanup-improvements"
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline identifies feature "cleanup-improvements"

  Scenario: --resume detects last completed stage from pipeline.log
    Given pipeline.log contains completed markers for stages 1 through 4
    And stage 5 has an INVOKE marker but no COMPLETE marker
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline determines that stage 4 was the last completed stage
    And resumes from stage 5

  Scenario: --resume starts from the next stage after last completed
    Given pipeline.log shows stages 1, 2, 3 completed
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline resumes at stage 4

  Scenario: --resume with empty pipeline.log fails with clear error
    Given pipeline.log is empty (zero bytes)
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline exits with error: "No previous run found — start a new run with `./vibe.ps1 'prompt'`"
    And no stages execute

  Scenario: --resume with missing pipeline.log fails with clear error
    Given pipeline.log does not exist
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline exits with error: "No previous run found — start a new run with `./vibe.ps1 'prompt'`"
    And no stages execute

  Scenario: --resume with corrupted pipeline.log fails with clear error
    Given pipeline.log exists but contains truncated content (e.g., mid-write crash left partial JSON or incomplete line)
    And the log cannot be parsed to determine a valid PIPELINE START marker
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline exits with error: "pipeline.log is corrupted — cannot determine run state. Delete pipeline.log and start a new run."
    And no stages execute

  Scenario: --resume with corrupted pipeline.log that has valid header but truncated stage markers
    Given pipeline.log contains a valid PIPELINE START line
    And stage 3 has an INVOKE marker but the line is truncated (no timestamp or stage name completed)
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline treats stage 3 as not started
    And resumes from stage 3 (the last stage with a complete INVOKE/COMPLETE pair was stage 2)

  Scenario: --resume after stage 8 partial completion detects completed tiers
    Given pipeline.log shows stage 8 started
    And task logs show tier 1 tasks T1 and T2 completed and merged
    And tier 2 task T3 has no completion marker
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline resumes stage 8 at tier 2
    And tier 1 tasks are not re-executed
    And T3 begins its TDD cycle

  Scenario: --resume after stage 8 partial completion detects completed tasks within a tier
    Given pipeline.log shows stage 8 started for tier 1
    And task T1 completed and merged
    And task T2 has no completion marker
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline resumes stage 8 at tier 1
    And T1 is not re-executed
    And T2 begins or resumes its TDD cycle

  Scenario: --resume replaces -Stage and -Feature parameters
    Given the user previously used "./vibe.ps1 -Stage 3 -Feature auth-flow"
    When the user runs "./vibe.ps1 --resume" instead
    Then the behavior is equivalent — pipeline resumes from the detected stage for the detected feature
    And -Stage and -Feature parameters are no longer accepted

  Scenario: --resume is rejected while pipeline lock is held by a running process
    Given a pipeline is running and holds "pipeline.lock" with PID 12345
    And process 12345 is still alive
    When the user runs "./vibe.ps1 --resume" in a second terminal
    Then the invocation exits with error: "Pipeline already running (PID 12345). Cannot resume while active."

  Scenario: --resume recovers from a stale pipeline.lock
    Given "pipeline.lock" exists with PID 99999
    And process 99999 is no longer running (crashed or was killed)
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline detects the stale lock (PID 99999 is not alive)
    And removes the stale "pipeline.lock"
    And proceeds with normal --resume behavior

  # [Objection] PID reuse vulnerability on stale lock detection
  Scenario: Stale lock detection verifies process identity, not just PID liveness
    Given "pipeline.lock" exists with PID 54321 and process start time "2026-04-11T10:00:00Z"
    And PID 54321 is alive but was started at "2026-04-11T14:30:00Z" (a different process reused the PID)
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline detects that PID 54321's start time does not match the lock's recorded start time
    And treats the lock as stale (the original pipeline process is no longer running)
    And removes the stale "pipeline.lock"
    And proceeds with normal --resume behavior

  Scenario: Lock file records both PID and process start time
    Given the pipeline starts a new run
    When it acquires the pipeline lock
    Then "pipeline.lock" contains the current process PID
    And "pipeline.lock" contains the current process start time (e.g., "2026-04-11T11:28:13Z")
    And the lock file is written atomically

  Scenario: Lock held by running pipeline with matching PID and start time is not stale
    Given "pipeline.lock" exists with PID 12345 and process start time "2026-04-11T11:00:00Z"
    And PID 12345 is alive and was started at "2026-04-11T11:00:00Z" (same process)
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline determines the lock is held by a live pipeline process
    And exits with error: "Pipeline already running (PID 12345). Cannot resume while active."

  # [Objection] --resume with ABORT marker but zero completed stages has undefined behavior
  Scenario: --resume with ABORT marker and zero completed stages restarts from stage 1
    Given pipeline.log contains a PIPELINE START marker and an ABORT marker
    And no stage COMPLETE markers exist (the pipeline aborted before any stage finished)
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline determines that zero stages completed
    And resumes from stage 1
    And pipeline.log records the new resume attempt

  Scenario: --resume with ABORT marker and some completed stages resumes after last complete
    Given pipeline.log contains stages 1-3 COMPLETE and an ABORT marker after stage 4 INVOKE
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline determines that stage 3 was the last completed stage
    And resumes from stage 4

  # [Objection] Non-atomic lock acquisition allows two concurrent --resume invocations to both pass stale check
  Scenario: Lock acquisition uses a system mutex to prevent concurrent --resume race
    Given "pipeline.lock" exists with a stale PID (process no longer running)
    And two terminals run "./vibe.ps1 --resume" simultaneously
    When both processes attempt to acquire the lock
    Then only one process acquires the named system mutex ("Global\vibe-cli-pipeline")
    And the winner removes the stale lock and writes its own lock file
    And the loser waits on the mutex, then sees the new valid lock and exits with: "Pipeline already running (PID <winner>). Cannot resume while active."

  # [Tier 2] Lock mutex timeout
  Scenario: Lock mutex acquisition times out after 30 seconds
    Given two terminals run "./vibe.ps1 --resume" simultaneously
    And the winner holds the lock mutex for an extended period (e.g., slow disk I/O during lock write)
    When the loser's mutex wait exceeds 30 seconds
    Then the loser exits with error: "Could not acquire pipeline lock within 30 seconds — another process may be starting. Retry or check for hung processes."
    And no pipeline stages execute for the loser

  Scenario: Fresh run also acquires lock via system mutex
    Given no "pipeline.lock" exists
    And two terminals run "./vibe.ps1 'new prompt'" simultaneously
    When both processes attempt to acquire the lock
    Then only one process acquires the named system mutex
    And the winner creates "pipeline.lock" and starts the run
    And the loser exits with: "Pipeline already running (PID <winner>). Cannot resume while active."

  # [Objection] Lock file corruption (partial JSON from crash)
  Scenario: Lock file with corrupt content is treated as stale
    Given "pipeline.lock" exists but contains truncated JSON (e.g., crash during lock write)
    And the file cannot be parsed to extract PID or start time
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline treats the lock as corrupt and therefore stale
    And removes the corrupt "pipeline.lock" after acquiring the system mutex
    And proceeds with normal --resume behavior
    And logs a warning: "pipeline.lock was corrupt — removed and proceeding"

  Scenario: pipeline.log is cleared after every completed run
    Given a pipeline run completes successfully with PIPELINE COMPLETE
    When the pipeline performs its final cleanup
    Then pipeline.log content is preserved for the completed run
    And the next fresh run starts a new pipeline.log

  Scenario: --resume after all stages completed
    Given pipeline.log shows all 8 stages completed and PIPELINE COMPLETE recorded
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline exits with error: "Previous run already completed — start a new run with `./vibe.ps1 'prompt'`"

  Scenario: --resume targets fixture generation between stages when log records it
    Given pipeline.log records stage-level INVOKE/COMPLETE markers
    And stage 3 shows COMPLETE but the fixture generation step between stage 3 and stage 4 has no marker
    And stage 4 has no INVOKE marker
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline resumes at the beginning of stage 4 (which includes its pre-stage fixture generation)
    And the Gherkin parser runs as part of the stage 4 entry sequence

  # [Objection] --resume + seed prompt mutual exclusivity
  Scenario: --resume and seed prompt are mutually exclusive
    Given the user runs "./vibe.ps1 --resume 'build auth module'"
    When the pipeline parses the arguments
    Then the pipeline exits with error: "--resume and a seed prompt cannot be used together. Use --resume to continue or provide a seed to start fresh."
    And no stages execute

  Scenario: --resume with additional flags other than seed is allowed
    Given pipeline.log shows stages 1 through 3 completed for feature "auth-flow"
    When the user runs "./vibe.ps1 --resume --verbose"
    Then the pipeline resumes at stage 4 with verbose logging enabled
    And no error about mutually exclusive flags is raised

  # [Objection] Feature branch divergence between abort and --resume — upstream commits may invalidate merged task work
  Scenario: --resume checks for feature branch divergence from base branch
    Given the pipeline was aborted during stage 8
    And the feature branch "feature/auth-flow" was based on main at commit "abc123"
    And main has advanced to commit "def456" since the abort
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline detects that main has new commits since the feature branch diverged
    And logs a warning: "Base branch 'main' has advanced since this run started. Merged task work may conflict with upstream changes."
    And the pipeline resumes (does not block) but the warning is visible

  Scenario: --resume with no base branch divergence does not warn
    Given the pipeline was aborted during stage 8
    And main has not advanced since the feature branch was created
    When the user runs "./vibe.ps1 --resume"
    Then no divergence warning is logged
    And the pipeline resumes normally

  # [Tier 2] Pipeline version changes on resume
  Scenario: --resume detects pipeline version mismatch and warns
    Given pipeline.log contains "PIPELINE START ... pipelineVersion=1.2.0"
    And the current vibe-cli version is "1.3.0"
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline logs a warning: "Pipeline version changed from 1.2.0 to 1.3.0 since this run started. Behavior may differ from the original run."
    And the pipeline resumes (does not block)

  Scenario: --resume with matching pipeline version does not warn
    Given pipeline.log contains "PIPELINE START ... pipelineVersion=1.2.0"
    And the current vibe-cli version is "1.2.0"
    When the user runs "./vibe.ps1 --resume"
    Then no version mismatch warning is logged
    And the pipeline resumes normally

  # [Tier 1] pipeline.log write failure mid-run halts pipeline
  Scenario: pipeline.log write failure mid-run halts the pipeline
    Given the pipeline is executing stage 4
    And pipeline.log becomes unwritable (e.g., disk full, file locked by another process)
    When the pipeline attempts to write a stage INVOKE marker to pipeline.log
    Then the pipeline halts with error: "Cannot write to pipeline.log — disk full or file locked. Pipeline state cannot be tracked; halting to prevent data loss."
    And no further stages execute
    And the abort cleanup handler runs (releasing lock, cleaning worktrees)

  Scenario: pipeline.log write failure during task completion marker
    Given task T1 in stage 8 has completed its TDD cycle
    And the pipeline attempts to write T1's MERGE-COMPLETE marker to pipeline.log
    And the write fails (e.g., permission denied)
    When the failure is detected
    Then the pipeline halts with error: "Cannot write completion marker to pipeline.log — halting to preserve resume integrity."
    And T1's merge is not rolled back (the merge itself succeeded)
    And the user is instructed to check disk space and file permissions before resuming

# =============================================================================
# Item 5a — runId Generation
# =============================================================================

Feature: runId generation and collision prevention
  Each pipeline run gets a unique runId used in worktree paths and log correlation

  # [Objection] runId generation format and collision prevention unspecified
  Scenario: runId is generated at pipeline start with timestamp and random hex
    Given the user starts a new pipeline run at 2026-04-11T11:28:13
    When the pipeline generates a runId
    Then the runId format is "<yyyyMMddTHHmmss>-<4 random hex chars>" (e.g., "20260411T112813-a3f1")
    And the runId is recorded in pipeline.log alongside the PIPELINE START marker

  Scenario: runId is reused on --resume (not regenerated)
    Given pipeline.log contains PIPELINE START with runId "20260411T112813-a3f1"
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline extracts runId "20260411T112813-a3f1" from pipeline.log
    And uses the same runId for all resumed worktree paths and log entries

  Scenario: Concurrent pipeline starts on different features get different runIds
    Given two users start pipelines for different features within the same second
    When both generate runIds at 2026-04-11T11:28:13
    Then the 4-character random hex suffix provides 65,536 possible values per second
    And if the random hex collides (astronomically unlikely), the worktree paths still differ by feature name

  Scenario: runId appears in all worktree paths for the run
    Given a pipeline run with runId "20260411T112813-a3f1" for feature "auth-flow"
    When tasks T1 and T2 create worktrees
    Then T1's worktree is at ".worktrees/auth-flow-T1-20260411T112813-a3f1"
    And T2's worktree is at ".worktrees/auth-flow-T2-20260411T112813-a3f1"

  # [Tier 2] Multi-run log disambiguation
  Scenario: Each pipeline run records its runId in every log entry for disambiguation
    Given the pipeline starts a new run with runId "20260411T112813-a3f1"
    When stage markers, task markers, and error entries are written to pipeline.log
    Then every log entry includes the runId: "[<timestamp>] [20260411T112813-a3f1] <marker>"
    And log entries from different runs (if pipeline.log is not cleared) can be distinguished by runId

# =============================================================================
# Item 6 — 300% Test Coverage Model (Overview)
# =============================================================================

Feature: 300% coverage is a hard gate in the stage 8 TDD cycle
  Three independent 100% coverage targets must all pass before a task completes

  # [Objection] Coverage target per category never defined — cannot assert 100% without knowing what source files are measured
  Scenario: Each coverage category defines its source file measurement set
    Given task T1's implementation plan lists source files in its file manifest
    When the coverage gate prepares to evaluate
    Then PBT coverage measures branch coverage of source files tagged "unit" in the file manifest
    And contract coverage measures branch coverage of source files tagged "integration" in the file manifest
    And E2E coverage measures branch coverage of source files tagged "e2e-target" in the file manifest
    And each file manifest tag maps to a specific glob pattern (e.g., "src/**/*.ts" excluding test files)

  Scenario: Coverage source file manifest is defined in the implementation plan
    Given the implementation writer (stage 6) generates an implementation plan for task T1
    When the plan includes a file manifest
    Then each planned source file is tagged with one or more coverage categories: "unit", "integration", "e2e-target"
    And the file manifest is persisted alongside the task plan
    And the coverage gate reads this manifest to determine which files to measure

  # [Tier 2] File manifest tag validation
  Scenario: Coverage gate rejects file manifest with unrecognized tags
    Given task T1's file manifest contains a source file tagged "unknown-category"
    When the coverage gate prepares to evaluate
    Then the gate halts with error: "File manifest contains unrecognized tag 'unknown-category' — valid tags are: unit, integration, e2e-target"
    And the task returns to the implementation plan for correction

  Scenario: Coverage gate rejects file manifest where a source file has no tags
    Given task T1's file manifest contains "src/auth.ts" with an empty tags array
    When the coverage gate prepares to evaluate
    Then the gate halts with error: "File manifest entry 'src/auth.ts' has no coverage tags — every source file must be tagged with at least one of: unit, integration, e2e-target"

  Scenario: All three coverage categories must independently reach 100%
    Given a task T1 is in the stage 8 TDD cycle
    When the coverage gate runs after cleanup passes
    Then PBT (property-based) coverage is evaluated independently against its source file set
    And contract testing coverage is evaluated independently against its source file set
    And E2E (trace-based) coverage is evaluated independently against its source file set
    And all three must report 100% branch coverage for the gate to pass

  # [Objection] Multi-action When violation fixed — split into separate scenarios
  Scenario: PBT coverage means branch coverage of PBT source files
    Given the coverage gate evaluates PBT for task T1
    When PBT coverage is measured using only *.pbt.test.ts files against "unit"-tagged source files
    Then 100% means all branches in the "unit"-tagged source files are covered by PBT tests

  Scenario: Contract coverage means branch coverage of contract source files
    Given the coverage gate evaluates contract testing for task T1
    When contract testing coverage is measured using only *.contract.test.ts files against "integration"-tagged source files
    Then 100% means all branches in the "integration"-tagged source files are covered by contract tests

  Scenario: E2E coverage means branch coverage of E2E target source files
    Given the coverage gate evaluates E2E for task T1
    When E2E coverage is measured using only *.e2e.test.ts files against "e2e-target"-tagged source files
    Then 100% means all branches in the "e2e-target"-tagged source files are covered by E2E tests

  Scenario: 300% coverage gate blocks task completion if any category is below 100%
    Given task T1 has PBT coverage at 100% and contract coverage at 95% and E2E coverage at 100%
    When the 300% coverage gate evaluates
    Then the gate fails
    And the failure identifies contract testing as the deficient category (95%)
    And the TDD cycle continues

  Scenario: 300% coverage gate passes when all categories reach 100%
    Given task T1 has PBT coverage at 100% and contract coverage at 100% and E2E coverage at 100%
    When the 300% coverage gate evaluates
    Then the gate passes
    And the task proceeds to the review gate

  Scenario: Coverage categories are measured in isolation — no cross-satisfaction
    Given task T1 has E2E tests that also exercise integration-level code paths
    When the coverage gate evaluates contract testing coverage
    Then only contract tests (driven by BDD fixtures from tests/fixtures/bdd/) contribute to contract coverage
    And E2E tests do not contribute to the contract testing coverage metric
    And PBT tests do not contribute to the contract testing or E2E coverage metrics

  Scenario: Each coverage category runs its own test suite with its own coverage collector
    Given the coverage gate evaluates for task T1
    When PBT coverage is collected
    Then the coverage tool runs only test files matching the PBT test pattern (e.g., *.pbt.test.ts)
    And the coverage report scopes to "unit"-tagged source files only

  # [Tier 1] Coverage tool crash scenario distinct from low-percentage failure
  Scenario: Coverage tool crash (non-zero exit, no report) halts the gate with tool-failure error
    Given task T1 is in the coverage gate
    And the coverage tool (e.g., vitest --coverage or Invoke-Pester -CodeCoverage) crashes with exit code 1
    And no coverage report file is produced
    When the coverage gate attempts to read the report
    Then the gate halts with error: "Coverage tool crashed (exit code 1) — no coverage report produced. Check tool installation and configuration."
    And the failure is not counted against the coverage iteration cap (it is a tool error, not a coverage shortfall)
    And Read-Escalation is called with the tool crash details

  Scenario: Coverage tool produces report but exits non-zero due to test failures
    Given task T1 is in the coverage gate
    And the coverage tool exits non-zero because 3 tests failed
    And a coverage report file is produced
    When the coverage gate reads the report
    Then the gate reports the test failures separately from coverage percentages
    And the task returns to the GREEN phase to fix failing tests before re-evaluating coverage

  # [Objection] Zero applicable tests for a category produces vacuous 100% — gate must FAIL
  Scenario: Zero test files matching a category pattern causes the coverage gate to fail
    Given task T1 has no files matching the PBT test pattern (*.pbt.test.ts)
    And contract tests and E2E tests both exist and pass
    When the coverage gate evaluates PBT coverage
    Then the gate fails with error: "PBT: no test files found matching *.pbt.test.ts — cannot satisfy 100% coverage with zero tests"
    And the task returns to the GREEN phase with instructions to create PBT tests
    And the coverage tool does not report a vacuous 100% for zero tests

  Scenario: Zero test files for all three categories fails with combined error
    Given task T1 has no test files matching any of the three patterns
    When the coverage gate evaluates
    Then the gate fails with error listing all three categories: "PBT: no test files found, contract: no test files found, E2E: no test files found"
    And the task returns to the GREEN phase

  # [Objection] Coverage percentage rounding mode unspecified (79.5% threshold ambiguity)
  Scenario: Coverage percentage uses truncation (floor) — 99.5% is reported as 99%
    Given task T1 has 199 of 200 branches covered in E2E target files
    When the coverage gate evaluates E2E coverage
    Then the raw percentage is 99.5%
    And the gate truncates to 99% (floor, not round)
    And the gate fails because 99% < 100%

  Scenario: Coverage at exactly 100.0% (all branches covered) passes
    Given task T1 has 200 of 200 branches covered in E2E target files
    When the coverage gate evaluates E2E coverage
    Then the percentage is exactly 100%
    And the gate passes for E2E

  Scenario: Coverage percentage rounding mode is documented in gate output
    Given the coverage gate evaluates for task T1
    When the gate produces its report
    Then each category's output includes raw fraction (e.g., "199/200") and truncated percentage (e.g., "99%")
    And the rounding mode "floor (truncate)" is stated in the report header

  Scenario: Coverage gate failure loop is capped at maximum iterations
    Given task T1 is in the stage 8 TDD cycle
    And the coverage gate has failed 5 consecutive times (reaching the coverage iteration cap)
    When the TDD cycle evaluates whether to retry
    Then the task is marked as failed with error: "Coverage gate failed after 5 iterations — manual intervention required"
    And Read-Escalation is called with the coverage deficiency details
    And no further LLM calls are made for this task's coverage loop

  # [Tier 1] Clarify Pester branch vs line coverage for dogfooding
  # [Objection] PowerShell/Pester 300% coverage model unspecified for vibe-cli dogfooding
  Scenario: vibe-cli itself meets 300% coverage using Pester and PowerShell conventions
    Given vibe-cli is the project under test
    And vibe-cli's source files are PowerShell (.ps1, .psm1)
    When its test suite is evaluated
    Then PBT tests are Pester tests at *.pbt.Tests.ps1 driven by TLC fixtures
    And contract tests are Pester tests at *.contract.Tests.ps1 driven by BDD fixtures
    And E2E trace-based tests are Pester tests at *.e2e.Tests.ps1
    And all three achieve 100% line coverage using Pester code coverage (JaCoCo format)

  Scenario: vibe-cli coverage uses Pester -CodeCoverage parameter with line coverage
    Given vibe-cli's coverage gate runs for a vibe-cli task
    When PBT coverage is collected
    Then Invoke-Pester is called with -CodeCoverage targeting "unit"-tagged .ps1/.psm1 files
    And the coverage output is parsed from Pester's JaCoCo XML
    And the metric extracted is "line" coverage (Pester JaCoCo does not reliably report branch-level coverage for PowerShell)

  Scenario: vibe-cli coverage metric differs from TypeScript projects
    Given vibe-cli is a PowerShell project using Pester
    And a generated project is a TypeScript project using vitest
    When the coverage gate evaluates for each
    Then vibe-cli uses line coverage (Pester JaCoCo limitation)
    And TypeScript projects use branch coverage (vitest/istanbul supports it)
    And both are enforced at 100% for their respective metric

  # [Objection] TDD cycle re-entry point after coverage failure
  Scenario: Coverage failure returns task to the GREEN phase of the TDD cycle
    Given task T1 is in the stage 8 TDD cycle
    And the coverage gate fails with E2E coverage at 88%
    When the task re-enters the TDD cycle
    Then the task resumes at the GREEN phase (test writing)
    And the failure context specifies "E2E: 88% — add E2E tests covering uncovered branches"
    And the task does not restart from the RED phase (test expectation authoring)

  Scenario: Coverage failure context includes per-category breakdown
    Given the coverage gate fails for task T1
    And PBT is at 100%, contract is at 100%, E2E is at 92%
    When the task re-enters the GREEN phase
    Then the prompt to the coding agent includes the specific uncovered branches for E2E
    And the prompt identifies which fixture traces lack corresponding E2E tests

  # [Objection] Coverage regression — fixing one category can drop another
  Scenario: Coverage regression in one category while fixing another is detected
    Given task T1 previously had PBT at 100%, contract at 100%, E2E at 90%
    And the coding agent adds E2E tests that modify shared code
    When the coverage gate evaluates after the E2E fix attempt
    And PBT coverage has dropped to 97% while E2E rose to 100%
    Then the gate fails
    And the failure identifies PBT as regressed from 100% to 97%
    And the failure context warns: "Adding E2E tests caused PBT coverage regression — review shared code changes"

  Scenario: All three categories are re-evaluated every coverage gate iteration
    Given task T1 passed PBT and contract coverage on iteration 2
    And the task is now on iteration 3 attempting to reach E2E 100%
    When the coverage gate evaluates on iteration 3
    Then PBT coverage is re-measured (not cached from iteration 2)
    And contract coverage is re-measured (not cached from iteration 2)
    And E2E coverage is re-measured
    And all three must still be at 100% for the gate to pass

  # [Objection] Dual-cap interaction off-by-one: coverage gate failure consumes exactly 1 TDD iteration
  Scenario: Coverage iteration cap is consumed within the TDD cycle cap budget
    Given task T1 has a TDD cycle cap of 10 iterations and a coverage iteration cap of 5
    And T1 reaches the coverage gate on TDD iteration 6
    When the coverage gate fails 5 consecutive times (coverage iterations 1-5)
    Then TDD iterations 6, 7, 8, 9, 10 are consumed by coverage retries
    And the task halts at TDD iteration 10 (TDD cycle cap reached)
    And the error reports both: "TDD cycle cap (10) and coverage iteration cap (5) exhausted"

  Scenario: TDD cycle cap is reached before coverage iteration cap
    Given task T1 has a TDD cycle cap of 10 and a coverage iteration cap of 5
    And T1 first reaches the coverage gate on TDD iteration 8
    When the coverage gate fails on iterations 8, 9, and 10
    Then the TDD cycle cap (10) is reached after 3 coverage failures
    And the task halts with error: "TDD cycle cap (10) reached — coverage gate failed 3 of 5 allowed iterations"
    And Read-Escalation is called with both cap states

  Scenario: Coverage iteration cap is reached before TDD cycle cap
    Given task T1 has a TDD cycle cap of 10 and a coverage iteration cap of 5
    And T1 first reaches the coverage gate on TDD iteration 3
    When the coverage gate fails on iterations 3, 4, 5, 6, 7 (5 coverage failures)
    Then the coverage iteration cap (5) is reached at TDD iteration 7
    And the task halts with error: "Coverage gate failed after 5 iterations — manual intervention required"
    And the remaining TDD budget (3 iterations) is not used for further coverage retries

  Scenario: Each coverage gate failure consumes exactly one TDD cycle iteration
    Given task T1 is in the stage 8 TDD cycle at iteration 4
    And the coverage gate fails
    When the task returns to the GREEN phase and completes a RED-GREEN-REFACTOR cycle
    Then the TDD cycle iteration counter increments to 5 (not 6 — one iteration consumed, not two)
    And the coverage iteration counter increments by 1
    And both counters are logged to pipeline.log

  Scenario: Coverage gate pass does not consume an additional TDD iteration beyond the cycle that reached it
    Given task T1 is in the stage 8 TDD cycle at iteration 4
    And the coverage gate passes on this iteration
    When the task proceeds to the review gate
    Then the TDD cycle counter remains at 4 (the gate pass is part of iteration 4, not a new iteration)

# =============================================================================
# Item 6a — BDD Gherkin Parser
# =============================================================================

Feature: Gherkin parser mechanically parses BDD .feature files into fixture JSON
  The parser handles the full Gherkin spec and outputs to tests/fixtures/bdd/

  # [Objection] Fixture JSON schema — defining the parser-to-test-generator contract
  Scenario: BDD fixture JSON conforms to the defined schema
    Given a .feature file with 2 Feature blocks, tags, a Background, 3 Scenarios, and a Scenario Outline with Examples
    When the Gherkin parser runs
    Then the fixture JSON is a valid JSON file
    And the root is an object with keys: "schemaVersion" (integer), "features" (array)
    And each feature entry has keys: "name" (string), "tags" (string array), "background" (object or null), "scenarios" (array)
    And each scenario entry has keys: "name" (string), "tags" (string array), "steps" (array), "examples" (array or null)
    And each step entry has keys: "keyword" (string), "text" (string), "dataTable" (array or null), "docString" (string or null)
    And each examples entry has keys: "headers" (string array), "rows" (array of string arrays)

  # [Objection] Fixture schema version field absent — no forward compatibility mechanism
  Scenario: BDD fixture JSON includes schema version for forward compatibility
    Given a .feature file with valid Gherkin content
    When the Gherkin parser runs
    Then the fixture JSON root contains "schemaVersion" with integer value 1
    And the schema version is checked by consumers before parsing the fixture

  Scenario: Stage 8 rejects BDD fixture with unknown schema version
    Given BDD fixtures at "tests/fixtures/bdd/auth-flow.json" have "schemaVersion" value 99
    And the current pipeline supports schema versions 1 through 1
    When the test writer in stage 8 reads the fixture file
    Then the pipeline halts with error: "BDD fixture schema version 99 is not supported (supported: 1). Regenerate fixtures with the current pipeline version."

  Scenario: BDD fixture JSON schema includes Rule groups when present
    Given a .feature file with a Rule: block containing 2 scenarios
    When the Gherkin parser runs
    Then each feature entry may optionally contain a "rules" array
    And each rule entry has keys: "name" (string), "scenarios" (array)

  Scenario: Parser extracts Scenario blocks
    Given a .feature file with 3 Scenario blocks
    When the Gherkin parser runs
    Then the fixture JSON contains 3 scenario entries
    And each entry has the scenario name and its Given/When/Then steps

  Scenario: Parser extracts Scenario Outline with Examples table
    Given a .feature file with a Scenario Outline and an Examples table with 4 rows
    When the Gherkin parser runs
    Then the fixture JSON contains the outline template steps
    And the fixture JSON contains the Examples table with 4 data rows
    And the parameter placeholders are captured (e.g., "<domain>", "<code_writer>")

  # [Objection] Scenario Outline with zero Examples rows not covered as parser edge case
  Scenario: Parser handles Scenario Outline with zero Examples rows
    Given a .feature file with a Scenario Outline that has an Examples table header but zero data rows
    When the Gherkin parser runs
    Then the fixture JSON contains the outline with an empty "rows" array in the examples
    And no error occurs
    And a warning is logged: "Scenario Outline '<name>' has Examples with zero rows — no test permutations will be generated"

  Scenario: Parser extracts data tables within steps
    Given a .feature file with a step containing an inline data table
    When the Gherkin parser runs
    Then the fixture JSON captures the data table rows and columns associated with that step

  Scenario: Parser extracts Background blocks
    Given a .feature file with a Background section before scenarios
    When the Gherkin parser runs
    Then the fixture JSON captures the Background steps
    And associates them with all scenarios in that Feature block

  Scenario: Parser extracts doc strings (triple-quote blocks)
    Given a .feature file with a step containing a doc string delimited by triple quotes
    When the Gherkin parser runs
    Then the fixture JSON captures the doc string content associated with that step

  Scenario: Parser extracts Rule groups
    Given a .feature file containing Rule: blocks grouping scenarios
    When the Gherkin parser runs
    Then the fixture JSON captures the Rule name
    And nests the scenarios under their respective Rule

  Scenario: Parser extracts tags
    Given a .feature file with tags like @smoke and @slow on features and scenarios
    When the Gherkin parser runs
    Then the fixture JSON captures tags at the Feature level
    And captures tags at the Scenario level

  Scenario: Parser handles minimal Gherkin (just Scenario + steps)
    Given a .feature file with only a single Scenario block and no Outlines, tables, Backgrounds, or tags
    When the Gherkin parser runs
    Then the fixture JSON contains 1 scenario with its steps
    And no errors occur

  Scenario: Parser handles multiple Feature blocks in one file
    Given a .feature file with 3 Feature: blocks
    When the Gherkin parser runs
    Then the fixture JSON contains 3 feature entries
    And each has its own scenarios nested

  Scenario: Parser writes fixtures to tests/fixtures/bdd/
    Given a BDD feature file at "docs/auth-flow/bdd.feature"
    When the Gherkin parser runs for feature "auth-flow"
    Then a fixture file is written to "tests/fixtures/bdd/auth-flow.json"

  # [Tier 1] Fixture directory creation when dirs don't exist
  Scenario: Parser creates fixture directory if it does not exist
    Given the directory "tests/fixtures/bdd/" does not exist
    When the Gherkin parser runs for feature "auth-flow"
    Then the parser creates the directory "tests/fixtures/bdd/" (including any missing parent directories)
    And writes the fixture file to "tests/fixtures/bdd/auth-flow.json"
    And no "directory not found" error occurs

  Scenario: Fixtures are generated after stage 3 (BDD debate consensus), before stage 4
    Given stage 3 (BDD debate) has completed for feature "auth-flow"
    When the pipeline transitions from stage 3 to stage 4
    Then the Gherkin parser runs on "docs/auth-flow/bdd.feature"
    And fixtures are written to "tests/fixtures/bdd/" before stage 4 begins

  Scenario: Parser failure halts the pipeline
    Given a .feature file with syntax that the Gherkin parser cannot parse
    When the parser encounters the error
    Then the pipeline halts with an error identifying the parse failure location
    And the user can fix the issue and resume via --resume

  Scenario: Parser captures And and But step keywords
    Given a .feature file with steps using "And" and "But" keywords
    When the Gherkin parser runs
    Then "And" steps are captured as continuations of their preceding step type
    And "But" steps are captured as continuations of their preceding step type

  Scenario: Stale BDD fixtures from a prior run are overwritten
    Given "tests/fixtures/bdd/auth-flow.json" exists from a previous pipeline run
    And stage 3 has just completed with an updated BDD feature file
    When the Gherkin parser runs for feature "auth-flow"
    Then the parser overwrites "tests/fixtures/bdd/auth-flow.json" with freshly parsed data
    And the previous fixture content is not merged or preserved

  # [Objection] Empty parser input — zero-scenario .feature file
  Scenario: Parser handles a .feature file with zero scenarios
    Given a .feature file with a Feature: header but no Scenario blocks
    When the Gherkin parser runs
    Then the fixture JSON contains 1 feature entry with an empty "scenarios" array
    And no error occurs
    And the fixture file is still written (it is valid, just empty of test data)

  # [Objection] Crash during fixture generation — atomic write with Move-Item
  Scenario: Gherkin parser writes fixture files atomically via Move-Item
    Given the Gherkin parser is generating "tests/fixtures/bdd/auth-flow.json"
    When the parser writes output
    Then the parser writes to a temporary file "tests/fixtures/bdd/auth-flow.json.tmp" first
    And after the write completes and the file is valid JSON, it uses Move-Item -Force to overwrite "tests/fixtures/bdd/auth-flow.json"
    And if the process crashes mid-write, only the .tmp file is left (the previous valid fixture, if any, is untouched)

  # [Objection] Windows Rename-Item is not atomic on NTFS when target exists
  Scenario: Atomic write on Windows uses Move-Item -Force instead of Rename-Item
    Given the Gherkin parser has finished writing "tests/fixtures/bdd/auth-flow.json.tmp"
    And "tests/fixtures/bdd/auth-flow.json" already exists from a prior run
    When the parser finalizes the fixture file
    Then it uses Move-Item -Force (which performs a delete-then-rename internally)
    And if the process is killed between the internal delete and rename, the .tmp file still exists for recovery
    And the next --resume detects the missing final file and re-runs fixture generation

  # [Objection] Fixture validation on read
  Scenario: Stage 8 validates fixture JSON schema before consuming BDD fixtures
    Given BDD fixtures exist at "tests/fixtures/bdd/auth-flow.json"
    When the test writer in stage 8 reads the fixture file
    Then the reader validates the JSON against the expected BDD fixture schema
    And if validation fails, the pipeline halts with error: "BDD fixture at tests/fixtures/bdd/auth-flow.json does not conform to expected schema — re-run fixture generation"

  # [Objection] Parser encoding issues (BOM, CRLF, non-UTF-8) in .feature files
  Scenario: Gherkin parser handles BOM-prefixed .feature files
    Given a .feature file saved with a UTF-8 BOM (byte order mark 0xEF 0xBB 0xBF)
    When the Gherkin parser reads the file
    Then the parser strips the BOM before parsing
    And parsing proceeds normally without the BOM appearing in scenario names or step text

  Scenario: Gherkin parser handles CRLF line endings
    Given a .feature file with Windows-style CRLF line endings
    When the Gherkin parser runs
    Then line endings are normalized to LF during parsing
    And fixture JSON step text does not contain trailing \r characters

  Scenario: Gherkin parser handles LF line endings
    Given a .feature file with Unix-style LF line endings
    When the Gherkin parser runs
    Then parsing succeeds identically to CRLF input

  Scenario: Gherkin parser rejects non-UTF-8 encoded .feature files
    Given a .feature file saved with Windows-1252 encoding containing characters outside ASCII
    When the Gherkin parser attempts to read the file
    Then the parser fails with error: "Feature file is not valid UTF-8 — re-save as UTF-8: <file path>"
    And the pipeline halts

  # [Objection] Disk space exhaustion during fixture temp file write
  Scenario: Disk space exhaustion during fixture write produces clear error
    Given the Gherkin parser is writing to "tests/fixtures/bdd/auth-flow.json.tmp"
    And the disk runs out of space mid-write
    When the write fails
    Then the parser catches the IOException and reports: "Disk full — cannot write fixture file to tests/fixtures/bdd/auth-flow.json.tmp"
    And the incomplete .tmp file is deleted (best-effort)
    And the pipeline halts

  # [Objection] Fixture file permission denied (antivirus/defender locks)
  Scenario: Fixture write fails due to file lock (antivirus or Defender)
    Given the Gherkin parser attempts to write "tests/fixtures/bdd/auth-flow.json.tmp"
    And the file is locked by Windows Defender real-time scanning
    When the write fails with an access-denied or sharing-violation error
    Then the parser retries the write after a 2-second delay (up to 3 retries)
    And if all retries fail, the parser reports: "Cannot write fixture file — file locked by another process: tests/fixtures/bdd/auth-flow.json.tmp"
    And the pipeline halts

# =============================================================================
# Item 6b — TLC Output Parser
# =============================================================================

Feature: TLC parser mechanically parses all TLC model checker output into fixture JSON
  The parser captures all structured output sections and writes to tests/fixtures/tla/

  # [Objection] Fixture JSON schema — defining the TLC parser-to-test-generator contract
  Scenario: TLC fixture JSON conforms to the defined schema
    Given TLC output with invariants, traces, coverage statistics, and exit code 0
    When the TLC parser runs
    Then the fixture JSON is a valid JSON file
    And the root is an object with keys: "schemaVersion" (integer), "exitCode" (integer), "exitCodeMeaning" (string), "invariants" (array), "traces" (array), "errors" (array), "deadlocks" (array), "liveness" (array), "temporalProperties" (array), "coverage" (object), "stateGraph" (object or null), "counterexamples" (array)
    And each invariant entry has keys: "name" (string), "status" (string: "pass" or "violated"), "counterexample" (array or null)
    And each trace entry has keys: "type" (string), "states" (array of objects with variable assignments)
    And each coverage entry has keys per action: "actionName" (string), "stateCount" (integer), "distinctStates" (integer)

  # [Objection] Fixture schema version field for TLC fixtures
  Scenario: TLC fixture JSON includes schema version for forward compatibility
    Given TLC output with valid content
    When the TLC parser runs
    Then the fixture JSON root contains "schemaVersion" with integer value 1

  Scenario: Stage 8 rejects TLC fixture with unknown schema version
    Given TLC fixtures at "tests/fixtures/tla/auth-flow.json" have "schemaVersion" value 99
    And the current pipeline supports schema versions 1 through 1
    When the test writer in stage 8 reads the fixture file
    Then the pipeline halts with error: "TLC fixture schema version 99 is not supported (supported: 1). Regenerate fixtures with the current pipeline version."

  Scenario: Parser extracts invariant violations
    Given TLC output contains invariant violation reports
    When the TLC parser runs
    Then the fixture JSON contains invariant entries with the violated invariant name and counterexample trace

  Scenario: Parser extracts state traces
    Given TLC output contains state exploration traces
    When the TLC parser runs
    Then the fixture JSON contains trace entries with state sequences and transition labels

  Scenario: Parser extracts error traces
    Given TLC output contains error traces with counterexamples
    When the TLC parser runs
    Then the fixture JSON contains error trace entries with each state in the trace
    And each state includes variable assignments

  Scenario: Parser extracts deadlock reports
    Given TLC output reports a deadlock condition
    When the TLC parser runs
    Then the fixture JSON contains a deadlock entry with the terminal state

  Scenario: Parser extracts liveness property results
    Given TLC output contains liveness checking results
    When the TLC parser runs
    Then the fixture JSON contains liveness entries with property names and pass/fail status

  Scenario: Parser extracts temporal property results
    Given TLC output contains temporal formula checking results
    When the TLC parser runs
    Then the fixture JSON contains temporal property entries with formula names and outcomes

  Scenario: Parser extracts coverage statistics
    Given TLC output contains action coverage statistics (number of states, distinct states, queue size)
    When the TLC parser runs
    Then the fixture JSON contains coverage entries with statistics per action

  Scenario: Parser extracts counterexample traces
    Given TLC output contains a counterexample with multiple states
    When the TLC parser runs
    Then the fixture JSON contains the full counterexample trace
    And each state in the trace has its variable assignments

  Scenario: Parser extracts state graph information
    Given TLC output contains state graph data (nodes, edges, diameter)
    When the TLC parser runs
    Then the fixture JSON contains state graph entries with node count, edge count, and diameter

  # [Tier 2] TLC exit codes as Scenario Outline
  Scenario Outline: Parser captures TLC exit code <exit_code> (<meaning>) in fixture JSON
    Given TLC exits with code <exit_code> (<description>)
    When the TLC parser runs
    Then the fixture JSON contains a top-level "exitCode" field with value <exit_code>
    And the fixture JSON contains a "exitCodeMeaning" field with value "<meaning>"

    Examples:
      | exit_code | meaning             | description                                     |
      | 0         | success             | no errors                                       |
      | 10        | assumption failure  | ASSUME clause not satisfied                     |
      | 11        | deadlock            | deadlock detected                               |
      | 12        | safety violation    | safety property violation                       |
      | 13        | liveness violation  | liveness property violation                     |
      | 14        | assertion failure   | assertion failure in evaluated expression        |

  Scenario: Parser captures unknown TLC exit code with fallback meaning
    Given TLC exits with code 99 (an unrecognized exit code)
    When the TLC parser runs
    Then the fixture JSON contains a top-level "exitCode" field with value 99
    And the fixture JSON contains a "exitCodeMeaning" field with value "unknown (exit code 99)"
    And the parser does not fail — the fixture is still written with all parsed output sections

  Scenario: Parser handles TLC output with no error traces
    Given TLC output shows model checking completed with no errors
    When the TLC parser runs
    Then the fixture JSON still contains coverage statistics and state space information
    And no error or counterexample sections are present
    And the fixture is still valid for PBT test generation

  Scenario: Parser writes fixtures to tests/fixtures/tla/
    Given TLC output for feature "auth-flow"
    When the TLC parser runs
    Then a fixture file is written to "tests/fixtures/tla/auth-flow.json"

  # [Tier 1] Fixture directory creation when dirs don't exist (TLC)
  Scenario: TLC parser creates fixture directory if it does not exist
    Given the directory "tests/fixtures/tla/" does not exist
    When the TLC parser runs for feature "auth-flow"
    Then the parser creates the directory "tests/fixtures/tla/" (including any missing parent directories)
    And writes the fixture file to "tests/fixtures/tla/auth-flow.json"
    And no "directory not found" error occurs

  Scenario: Fixtures are generated after stage 5 (TLA+ debate consensus), before stage 6
    Given stage 5 (TLA+ debate) has completed for feature "auth-flow"
    When the pipeline transitions from stage 5 to stage 6
    Then the TLC parser runs on the TLA+ verification output
    And fixtures are written to "tests/fixtures/tla/" before stage 6 begins

  Scenario: Parser failure halts the pipeline
    Given TLC output with a format the parser cannot recognize
    When the parser encounters the error
    Then the pipeline halts with an error identifying the parse failure
    And the user can fix the issue and resume via --resume

  Scenario: Stale TLA+ fixtures from a prior run are overwritten
    Given "tests/fixtures/tla/auth-flow.json" exists from a previous pipeline run
    And stage 5 has just completed with new TLC verification output
    When the TLC parser runs for feature "auth-flow"
    Then the parser overwrites "tests/fixtures/tla/auth-flow.json" with freshly parsed data
    And the previous fixture content is not merged or preserved

  # [Objection] Empty parser input — empty TLC output
  Scenario: Parser handles empty TLC output (zero bytes)
    Given TLC produced output of zero bytes (e.g., TLC crashed before writing anything)
    When the TLC parser runs
    Then the parser fails with error: "TLC output is empty — TLC may have crashed before producing output"
    And the pipeline halts
    And the user can fix the issue and resume via --resume

  Scenario: Parser handles TLC output with only a header and no structured sections
    Given TLC output contains only the TLC banner and version line but no invariants, traces, or coverage data
    When the TLC parser runs
    Then the fixture JSON is written with empty arrays for all structured sections
    And the "exitCode" field reflects the actual TLC exit code
    And a warning is logged: "TLC output contains no structured data sections"

  # [Objection] Crash during fixture generation — atomic write with Move-Item
  Scenario: TLC parser writes fixture files atomically via Move-Item
    Given the TLC parser is generating "tests/fixtures/tla/auth-flow.json"
    When the parser writes output
    Then the parser writes to a temporary file "tests/fixtures/tla/auth-flow.json.tmp" first
    And after the write completes and the file is valid JSON, it uses Move-Item -Force to overwrite "tests/fixtures/tla/auth-flow.json"
    And if the process crashes mid-write, only the .tmp file is left (the previous valid fixture, if any, is untouched)

  # [Objection] Fixture validation on read
  Scenario: Stage 8 validates fixture JSON schema before consuming TLC fixtures
    Given TLC fixtures exist at "tests/fixtures/tla/auth-flow.json"
    When the test writer in stage 8 reads the fixture file
    Then the reader validates the JSON against the expected TLC fixture schema
    And if validation fails, the pipeline halts with error: "TLC fixture at tests/fixtures/tla/auth-flow.json does not conform to expected schema — re-run fixture generation"

  # [Objection] Parser encoding issues (BOM, CRLF, non-UTF-8) in TLC output files
  Scenario: TLC parser handles BOM-prefixed output files
    Given TLC output saved with a UTF-8 BOM
    When the TLC parser reads the file
    Then the parser strips the BOM before parsing
    And parsing proceeds normally

  Scenario: TLC parser handles CRLF line endings in output
    Given TLC output with Windows-style CRLF line endings
    When the TLC parser runs
    Then line endings are normalized to LF during parsing
    And fixture JSON does not contain stray \r characters

  Scenario: TLC parser handles mixed line endings in output
    Given TLC output with a mix of CRLF and LF line endings (common with Java tools on Windows)
    When the TLC parser runs
    Then all line endings are normalized to LF
    And parsing succeeds without errors

  # [Objection] Disk space and permission issues for TLC fixtures
  Scenario: Disk space exhaustion during TLC fixture write produces clear error
    Given the TLC parser is writing to "tests/fixtures/tla/auth-flow.json.tmp"
    And the disk runs out of space mid-write
    When the write fails
    Then the parser catches the IOException and reports: "Disk full — cannot write fixture file to tests/fixtures/tla/auth-flow.json.tmp"
    And the incomplete .tmp file is deleted (best-effort)
    And the pipeline halts

  Scenario: TLC fixture write fails due to file lock
    Given the TLC parser attempts to write "tests/fixtures/tla/auth-flow.json.tmp"
    And the file is locked by another process
    When the write fails with an access-denied or sharing-violation error
    Then the parser retries the write after a 2-second delay (up to 3 retries)
    And if all retries fail, the parser reports: "Cannot write fixture file — file locked by another process: tests/fixtures/tla/auth-flow.json.tmp"
    And the pipeline halts

# =============================================================================
# Item 6c — Unit Tests: Property-Based Testing (PBT)
# =============================================================================

Feature: PBT unit tests are driven by TLC-derived fixtures
  TLC parser output in tests/fixtures/tla/ feeds property-based test generation

  Scenario: PBT fixtures are sourced from TLC output
    Given TLC fixtures exist at "tests/fixtures/tla/auth-flow.json"
    When the test writer generates PBT unit tests
    Then the tests read fixture data from "tests/fixtures/tla/auth-flow.json"
    And each test property maps to a TLC output section

  Scenario: PBT tests cover invariant properties
    Given TLC fixtures contain invariant data for invariants I1, I2, I3
    When the test writer generates PBT unit tests
    Then there are property tests validating I1, I2, and I3
    And each property test uses the corresponding fixture data as input

  Scenario: PBT tests cover state space properties
    Given TLC fixtures contain state coverage statistics
    When the test writer generates PBT unit tests
    Then property tests validate state transition correctness using the coverage data

  Scenario: PBT tests achieve 100% branch coverage independently
    Given the stage 8 TDD cycle evaluates coverage for task T1
    When PBT coverage is measured using only *.pbt.test.ts files against "unit"-tagged source files
    Then PBT tests achieve 100% branch coverage of the "unit"-tagged source files

# =============================================================================
# Item 6d — Integration Tests: Contract Testing
# =============================================================================

Feature: Contract integration tests are driven by BDD-derived fixtures
  Gherkin parser output in tests/fixtures/bdd/ feeds contract test generation

  Scenario: Contract test fixtures are sourced from BDD feature files
    Given BDD fixtures exist at "tests/fixtures/bdd/auth-flow.json"
    When the test writer generates contract integration tests
    Then the tests read fixture data from "tests/fixtures/bdd/auth-flow.json"
    And each contract maps to a BDD scenario

  Scenario: Contract tests cover all BDD scenarios
    Given BDD fixtures contain 15 scenario entries
    When the test writer generates contract tests
    Then there are contract tests covering all 15 scenarios

  Scenario: Contract tests cover Scenario Outline permutations
    Given BDD fixtures contain a Scenario Outline with 4 Examples rows
    When the test writer generates contract tests
    Then 4 parameterized contract test cases are generated (one per Examples row)

  Scenario: Contract tests achieve 100% branch coverage independently
    Given the stage 8 TDD cycle evaluates coverage for task T1
    When contract testing coverage is measured using only *.contract.test.ts files against "integration"-tagged source files
    Then contract tests achieve 100% branch coverage of the "integration"-tagged source files

# =============================================================================
# Item 6e — E2E Tests: Trace-Based Testing
# =============================================================================

Feature: E2E trace-based tests replay TLC state traces against the system
  TLC traces drive end-to-end verification, with Playwright for UI projects

  Scenario: E2E tests use TLC trace fixtures
    Given TLC fixtures at "tests/fixtures/tla/auth-flow.json" contain state traces
    When the test writer generates E2E tests
    Then the E2E tests read trace data from "tests/fixtures/tla/auth-flow.json"

  Scenario: UI project E2E tests use Playwright
    Given the target project is a UI project with Playwright available
    When the test writer generates E2E tests from TLC traces
    Then Playwright tests are generated
    And each test maps state transitions to browser actions and HTML assertions
    And the LLM interprets trace states to determine appropriate browser interactions

  Scenario: Non-UI project E2E tests use trace replay
    Given the target project is a non-UI project (e.g., API, CLI)
    When the test writer generates E2E tests from TLC traces
    Then trace replay tests are generated against the deployed system
    And no Playwright tests are generated

  # [Tier 2] Playwright detection mechanism
  Scenario: Playwright availability is detected by checking package.json dependencies
    Given the target project has a package.json at its project root
    When the pipeline checks for Playwright availability
    Then it inspects package.json for "@playwright/test" in dependencies or devDependencies
    And if found, the project is classified as Playwright-available
    And if not found, the project falls back to non-UI trace replay

  Scenario: Playwright detection falls back when no package.json exists
    Given the target project has no package.json (e.g., a non-Node.js project)
    When the pipeline checks for Playwright availability
    Then Playwright is classified as unavailable
    And the project falls back to non-UI trace replay

  Scenario: Playwright not available falls back to non-UI trace replay
    Given the target project is a UI project
    And Playwright is not installed or available in the project
    When the test writer generates E2E tests
    Then E2E tests fall back to non-UI trace replay
    And no Playwright-specific tests are generated

  Scenario: E2E tests cover all trace types from TLC output
    Given TLC fixtures contain error traces, counterexamples, and normal state traces
    When the test writer generates E2E tests
    Then there are E2E tests for error traces
    And there are E2E tests for counterexample traces
    And there are E2E tests for normal state exploration traces

  Scenario: E2E tests achieve 100% branch coverage independently
    Given the stage 8 TDD cycle evaluates coverage for task T1
    When E2E trace-based coverage is measured using only *.e2e.test.ts files against "e2e-target"-tagged source files
    Then E2E tests achieve 100% branch coverage of the "e2e-target"-tagged source files

# =============================================================================
# Item 6f — Coverage Enforcement
# =============================================================================

Feature: 300% coverage enforcement is a hard gate in the TDD cycle
  The coverage gate runs during stage 8 and all three categories must independently pass

  Scenario: Coverage gate runs after cleanup passes in the TDD cycle
    Given task T1 has achieved 2 consecutive cleanup passes
    When the TDD cycle evaluates the coverage gate
    Then PBT coverage is checked against "unit"-tagged source files
    And contract testing coverage is checked against "integration"-tagged source files
    And E2E trace-based coverage is checked against "e2e-target"-tagged source files

  Scenario: Coverage gate failure sends task back to GREEN phase of TDD cycle
    Given the coverage gate evaluates for task T1
    And PBT coverage is 100% but E2E coverage is 90%
    When the gate fails
    Then the task returns to the GREEN phase to add missing E2E tests
    And the failure context identifies E2E as deficient (90%) with the specific uncovered branches
    And the task does not restart from the RED phase

  Scenario: Coverage gate pass allows task to proceed to review
    Given the coverage gate evaluates for task T1
    And all three categories report 100%
    When the gate passes
    Then the task proceeds to the pre-merge review gate

  Scenario: Coverage enforcement applies to every pipeline run
    Given a project is built through the vibe-cli pipeline
    When Stage 8 runs for any task
    Then the 300% coverage gate is enforced
    And no task completes without meeting all three coverage targets

  Scenario: Coverage gate iteration count is tracked per task
    Given task T1 enters the coverage gate for the 3rd time
    When the gate fails again (contract coverage at 98%)
    Then the iteration counter increments to 4
    And the task returns to the GREEN phase
    And the remaining iteration budget (1) is included in the failure context

# =============================================================================
# Item 7 — TLA+ Traces to Fixtures (Subsumed into Item 6)
# =============================================================================

Feature: All TLA+ output goes to fixtures after stage 5 debate consensus
  All TLC output types are captured as fixtures, not just error traces

  Scenario: All TLC output types are written to fixtures
    Given stage 5 (TLA+ debate) produces TLC output with invariants, traces, coverage, and state graph data
    When the TLC parser runs after stage 5
    Then all output types are captured in the fixture file at "tests/fixtures/tla/"
    And no output type is selectively excluded

  Scenario: Fixtures include invariant results even when no violations found
    Given TLC verification passes all invariants without violations
    When the TLC parser generates fixtures
    Then the fixture file includes invariant pass results
    And these results are available for PBT test generation

  Scenario: Fixtures include state space statistics
    Given TLC explores 50,000 distinct states across 12 actions
    When the TLC parser generates fixtures
    Then the fixture file includes the state count, action coverage, and exploration statistics

  Scenario: Fixtures are shared between PBT and E2E test generators
    Given TLC fixtures exist at "tests/fixtures/tla/auth-flow.json"
    When PBT and E2E test writers generate tests
    Then both read from the same fixture file
    And PBT tests use invariant and property data
    And E2E tests use trace and counterexample data

# =============================================================================
# Item 8 — Fixture Precondition Checks at Stage 8
# =============================================================================

# [Objection] Missing fixtures at stage 8 — precondition check

Feature: Stage 8 verifies fixture files exist before dispatching tasks
  If fixture files are deleted or missing between generation and consumption, stage 8 fails fast

  Scenario: Stage 8 checks BDD fixtures exist before task dispatch
    Given stage 8 is about to dispatch tasks for feature "auth-flow"
    When the orchestrator performs precondition checks
    Then it verifies "tests/fixtures/bdd/auth-flow.json" exists
    And if the file is missing, the pipeline halts with error: "BDD fixture file missing at tests/fixtures/bdd/auth-flow.json — re-run from stage 3 or regenerate fixtures"

  Scenario: Stage 8 checks TLC fixtures exist before task dispatch
    Given stage 8 is about to dispatch tasks for feature "auth-flow"
    When the orchestrator performs precondition checks
    Then it verifies "tests/fixtures/tla/auth-flow.json" exists
    And if the file is missing, the pipeline halts with error: "TLC fixture file missing at tests/fixtures/tla/auth-flow.json — re-run from stage 5 or regenerate fixtures"

  Scenario: Stage 8 checks both fixture files — both missing
    Given stage 8 is about to dispatch tasks for feature "auth-flow"
    And "tests/fixtures/bdd/auth-flow.json" does not exist
    And "tests/fixtures/tla/auth-flow.json" does not exist
    When the orchestrator performs precondition checks
    Then the pipeline halts with an error listing both missing fixture files
    And no tasks are dispatched

  Scenario: Stage 8 checks fixture files are non-empty
    Given "tests/fixtures/bdd/auth-flow.json" exists but is zero bytes (crash left empty file)
    When the orchestrator performs precondition checks for feature "auth-flow"
    Then the pipeline halts with error: "BDD fixture file at tests/fixtures/bdd/auth-flow.json is empty — fixture generation may have failed"

  Scenario: Stage 8 checks fixture files are valid JSON
    Given "tests/fixtures/tla/auth-flow.json" exists but contains truncated JSON (crash during atomic write fallback)
    When the orchestrator performs precondition checks for feature "auth-flow"
    Then the pipeline halts with error: "TLC fixture file at tests/fixtures/tla/auth-flow.json is not valid JSON — regenerate fixtures"

  Scenario: Fixture precondition passes when all files present and valid
    Given "tests/fixtures/bdd/auth-flow.json" exists and contains valid fixture JSON
    And "tests/fixtures/tla/auth-flow.json" exists and contains valid fixture JSON
    When the orchestrator performs precondition checks for feature "auth-flow"
    Then the precondition check passes
    And task dispatch proceeds normally

  # [Tier 1] Clarify fixture availability in worktrees (committed vs copied)
  Scenario: Fixture files are committed to the feature branch before worktree creation
    Given BDD fixtures at "tests/fixtures/bdd/auth-flow.json" have been generated
    And TLC fixtures at "tests/fixtures/tla/auth-flow.json" have been generated
    When the pipeline commits fixture files to the feature branch before stage 8 worktree creation
    Then each worktree created via "git worktree add" inherits the committed fixture files
    And the test writer in each worktree can read fixtures from their local file system
    And no separate copy step is needed

  Scenario: Fixture files not committed — worktree lacks fixtures and fails precondition
    Given BDD fixtures were generated but not committed to the feature branch
    When a worktree is created for task T1
    Then the worktree does not contain "tests/fixtures/bdd/auth-flow.json"
    And the stage 8 precondition check in the worktree fails with the missing-fixture error
    And the pipeline halts with instructions to ensure fixtures are committed before stage 8

# =============================================================================
# Abort Cleanup (Ctrl+C / CancelKeyPress)
# =============================================================================

# [Objection] No Ctrl+C/SIGTERM abort cleanup scenario
# [Tier 1] Rewrite for Windows signal model (CancelKeyPress, not POSIX)

Feature: Pipeline abort cleanup on Ctrl+C, CancelKeyPress, or unhandled exception
  When the pipeline is killed mid-execution, deterministic cleanup runs to prevent orphaned state.
  On Windows, PowerShell uses [Console]::CancelKeyPress and Register-EngineEvent, not POSIX signals.

  Scenario: Ctrl+C during stage 8 triggers abort cleanup handler via CancelKeyPress
    Given the pipeline is executing stage 8 with tier 1 tasks T1 and T2 in parallel
    And the pipeline has registered a [Console]::CancelKeyPress handler
    When the user presses Ctrl+C
    Then the CancelKeyPress handler fires (setting Cancel = $true to prevent immediate exit)
    And all running coding agents (T1, T2) are terminated via Stop-Process
    And the cleanup sequence begins

  Scenario: Abort cleanup removes all active worktrees
    Given the pipeline is killed during stage 8
    And worktrees exist at ".worktrees/auth-flow-T1-<runId>" and ".worktrees/auth-flow-T2-<runId>"
    When the abort cleanup handler runs
    Then all worktrees listed in the orchestrator's workspace hashtable are removed via "git worktree remove --force"
    And the corresponding temporary branches are deleted
    And no orphaned worktrees remain in ".worktrees/"

  Scenario: Abort cleanup releases the pipeline lock
    Given the pipeline holds "pipeline.lock" with PID 12345 and start time "2026-04-11T11:00:00Z"
    When the abort cleanup handler runs
    Then "pipeline.lock" is deleted
    And subsequent "--resume" invocations do not encounter a stale lock

  Scenario: Abort cleanup writes an ABORT marker to pipeline.log
    Given the pipeline is killed during stage 5
    When the abort cleanup handler runs
    Then pipeline.log receives an entry: "[<timestamp>] === PIPELINE ABORT signal=CancelKeyPress stage=5 ==="
    And the last completed stage remains accurately recorded (e.g., stage 4)
    And "--resume" can correctly determine the resume point from the log

  Scenario: Abort cleanup removes orphaned .tmp fixture files
    Given the Gherkin parser is mid-write to "tests/fixtures/bdd/auth-flow.json.tmp"
    When the pipeline is killed (Ctrl+C)
    And the abort cleanup handler runs
    Then "tests/fixtures/bdd/auth-flow.json.tmp" is deleted
    And "tests/fixtures/tla/auth-flow.json.tmp" is deleted if it exists
    And valid (non-.tmp) fixture files are not touched

  Scenario: Abort cleanup during worktree creation leaves no partial worktree
    Given the pipeline is creating a worktree for task T3 via "git worktree add"
    And the command is mid-execution when Ctrl+C arrives
    When the abort cleanup handler runs
    Then the handler checks for partial worktree state at ".worktrees/auth-flow-T3-<runId>"
    And if the directory exists but is incomplete, it is removed via "git worktree remove --force"
    And the git worktree list no longer references the partial worktree

  Scenario: Abort cleanup during merge leaves feature branch in clean state
    Given task T1 completed and is mid-merge to the feature branch
    And the merge has staged changes but not yet committed
    When Ctrl+C arrives and the abort cleanup handler runs
    Then the handler detects the in-progress merge via "git merge --abort" or "git reset --merge"
    And the feature branch is restored to its pre-merge state
    And no half-merged commits exist on the feature branch

  Scenario: Process termination (e.g., taskkill, OOM) triggers cleanup via finally block
    Given the pipeline is executing stage 8
    And the pipeline's main execution is wrapped in a try/finally block
    When the process is terminated externally (e.g., taskkill /PID, OOM killer, parent process exit)
    Then the finally block executes the same cleanup logic as the CancelKeyPress handler
    And worktrees, lock file, .tmp files, and partial merge state are all cleaned up (best-effort)

  Scenario: Abort cleanup is best-effort and does not throw
    Given the pipeline is killed during stage 8
    And one worktree removal fails (e.g., directory locked by another process)
    When the abort cleanup handler runs
    Then the handler logs the worktree removal failure
    And continues cleaning up remaining resources (lock file, other worktrees, .tmp files)
    And the handler exits without throwing an unhandled exception

  Scenario: Double Ctrl+C forces immediate exit without cleanup
    Given the pipeline is executing the abort cleanup handler after the first Ctrl+C
    When the user presses Ctrl+C a second time
    Then the pipeline exits immediately without completing the remaining cleanup
    And the user is warned on next run that orphaned state may exist

  # [Objection] Orphaned worktrees from chained resume-abort-resume sequences
  Scenario: --resume detects and cleans orphaned worktrees from prior aborted runs
    Given the pipeline was aborted during stage 8 (first abort)
    And abort cleanup removed worktrees for T1 and T2
    And the user ran "--resume", which re-created worktrees for T2
    And the pipeline was aborted again (second abort) during T2's re-execution
    And the second abort cleanup failed to remove T2's worktree (e.g., directory locked)
    When the user runs "./vibe.ps1 --resume" a third time
    Then the pipeline scans ".worktrees/" for directories matching the current runId pattern
    And detects T2's orphaned worktree from the second abort
    And removes the orphaned worktree before dispatching new tasks
    And logs: "Cleaned orphaned worktree: .worktrees/auth-flow-T2-<runId>"

  Scenario: --resume ignores worktrees from other features or runIds
    Given ".worktrees/" contains worktrees from feature "other-feature" with a different runId
    When the user runs "./vibe.ps1 --resume" for feature "auth-flow"
    Then the pipeline does not touch worktrees belonging to "other-feature"
    And only cleans orphaned worktrees matching "auth-flow-*-<currentRunId>"

# =============================================================================
# Claude API Transient Failures
# =============================================================================

# [Objection] No Claude API transient failure scenario

Feature: Claude API transient failure handling for Invoke-Claude calls
  API timeouts, rate limits, and network errors are retried with backoff before escalating

  Scenario: API timeout on Invoke-Claude triggers retry with exponential backoff
    Given the pipeline calls Invoke-Claude for stage 3 (BDD writer)
    And the API call times out after 120 seconds
    When the retry handler evaluates the failure
    Then the call is retried after a 5-second backoff
    And the 2nd retry waits 10 seconds
    And the 3rd retry waits 20 seconds
    And each retry is logged to pipeline.log with the attempt number

  Scenario: API rate limit (429) on Invoke-Claude triggers retry with Retry-After header
    Given the pipeline calls Invoke-Claude for stage 6 (implementation writer)
    And the API returns HTTP 429 with Retry-After: 30
    When the retry handler evaluates the failure
    Then the call waits 30 seconds (respecting the Retry-After header)
    And retries the same Invoke-Claude call
    And the rate limit event is logged to pipeline.log

  Scenario: Network error on Invoke-Claude triggers retry
    Given the pipeline calls Invoke-Claude for stage 8 (coding agent T1)
    And the call fails with a network error (connection reset, DNS failure)
    When the retry handler evaluates the failure
    Then the call is retried with exponential backoff
    And the network error is logged to pipeline.log

  Scenario: Invoke-Claude retries are capped at 5 attempts
    Given the pipeline calls Invoke-Claude and the API returns errors on every attempt
    When 5 retry attempts have been exhausted
    Then the call fails permanently
    And Read-Escalation is called with the error details: "Claude API call failed after 5 attempts — last error: <error>"
    And the escalation includes the stage, task, and prompt context for debugging

  Scenario: Successful retry after transient failure continues normally
    Given the pipeline calls Invoke-Claude for stage 3
    And the first attempt times out
    And the second attempt succeeds with a valid response
    When the retry handler processes the success
    Then the pipeline continues as if the first call succeeded
    And the transient failure is logged but does not affect pipeline state
    And no Read-Escalation is triggered

  Scenario: API 500 error is treated as transient and retried
    Given the pipeline calls Invoke-Claude and receives HTTP 500 (Internal Server Error)
    When the retry handler evaluates the failure
    Then the call is retried with exponential backoff (same as timeout handling)
    And the 500 error is treated identically to a timeout for retry purposes

  Scenario: API 400 error is not retried (client error)
    Given the pipeline calls Invoke-Claude and receives HTTP 400 (Bad Request)
    When the retry handler evaluates the failure
    Then the call is not retried (400 indicates a prompt or parameter error, not transient)
    And Read-Escalation is called immediately with the error details
    And the error message includes the API response body for debugging

  Scenario: Parallel task API failures are handled independently
    Given tier 1 has tasks T1 and T2 running in parallel
    And T1's Invoke-Claude call times out
    And T2's Invoke-Claude call succeeds
    When T1's retry handler retries the call
    Then T2 is unaffected and continues its TDD cycle
    And T1's retry is independent of T2's state

  Scenario: API failure during coverage gate evaluation
    Given task T1 is in the coverage gate and calls Invoke-Claude to analyze coverage results
    And the API call fails with a timeout
    When the retry handler retries and succeeds
    Then the coverage gate evaluation continues with the retried response
    And the coverage iteration counter is not incremented by the retry (it counts gate evaluations, not API calls)

# =============================================================================
# Stage Re-execution Idempotency
# =============================================================================

# [Objection] No stage re-execution idempotency guarantee

Feature: --resume prevents duplicate LLM invocations and duplicate artifacts on re-entry
  Each LLM call is guarded by an idempotency token to detect and skip already-completed work

  Scenario: Each Invoke-Claude call writes an idempotency token before execution
    Given the pipeline is about to call Invoke-Claude for stage 3 (BDD writer)
    When the call is prepared
    Then an idempotency token (unique ID) is written to pipeline.log: "[<timestamp>] INVOKE-CLAUDE token=<uuid> stage=3 purpose=bdd-writer"
    And the token is written before the API call is made

  Scenario: Successful Invoke-Claude call writes a completion marker with its token
    Given the pipeline called Invoke-Claude with token "abc-123" for stage 3
    And the API call succeeded and the result was persisted (e.g., BDD feature file written)
    When the completion is recorded
    Then pipeline.log receives: "[<timestamp>] INVOKE-CLAUDE-COMPLETE token=abc-123 stage=3"
    And the completion marker is written after the result artifact is persisted

  Scenario: --resume skips Invoke-Claude calls that have completion markers
    Given pipeline.log contains both INVOKE-CLAUDE and INVOKE-CLAUDE-COMPLETE for token "abc-123" (stage 3 BDD writer)
    And the BDD feature file artifact exists at "docs/auth-flow/bdd.feature"
    When the pipeline resumes and reaches stage 3's Invoke-Claude call
    Then the call is skipped (the token has a completion marker)
    And the existing artifact is used
    And no duplicate LLM call is made

  Scenario: --resume re-executes Invoke-Claude calls that lack completion markers
    Given pipeline.log contains INVOKE-CLAUDE for token "def-456" (stage 5 TLA+ verifier) but no INVOKE-CLAUDE-COMPLETE
    When the pipeline resumes and reaches stage 5's Invoke-Claude call
    Then the call is re-executed (the token has no completion marker, indicating the previous attempt failed or was interrupted)
    And a new token "ghi-789" is generated for the retried call
    And the old token "def-456" is marked as abandoned in the log

  Scenario: --resume re-executes fixture generation when artifact is missing despite completion marker
    Given pipeline.log contains INVOKE-CLAUDE-COMPLETE for the Gherkin parser step
    But "tests/fixtures/bdd/auth-flow.json" does not exist (deleted between runs)
    When the pipeline resumes and reaches the fixture generation step
    Then the pipeline detects the missing artifact despite the completion marker
    And re-runs the Gherkin parser
    And logs a warning: "Artifact missing despite completion marker — re-generating BDD fixtures"

  Scenario: --resume into a partially completed stage 8 tier skips merged tasks
    Given pipeline.log shows task T1 has INVOKE-CLAUDE-COMPLETE and MERGE-COMPLETE markers
    And task T2 has INVOKE-CLAUDE but no INVOKE-CLAUDE-COMPLETE
    When the pipeline resumes stage 8 tier 1
    Then T1 is skipped (already merged)
    And T2 is re-dispatched for its TDD cycle
    And no duplicate merge of T1 occurs

  Scenario: Duplicate artifact detection — stage 6 does not regenerate implementation plan if already written
    Given pipeline.log contains INVOKE-CLAUDE-COMPLETE for stage 6 (implementation writer)
    And the implementation plan artifact exists at "docs/auth-flow/implementation-plan.md"
    When the pipeline resumes and reaches stage 6
    Then the stage is skipped entirely (both the call completed and the artifact exists)
    And pipeline.log records: "Stage 6 skipped — artifacts already present"

  Scenario: Idempotency tokens are unique per run to avoid cross-run confusion
    Given a previous run generated tokens "run1-abc" and "run1-def" in pipeline.log
    And the user starts a new run (not --resume)
    When the new run generates idempotency tokens
    Then the tokens use a new run-scoped prefix (e.g., "run2-ghi")
    And the new run does not match against previous run's tokens

# =============================================================================
# pnpm Install Failure
# =============================================================================

# [Tier 2] pnpm install failure in worktrees

Feature: pnpm install failure handling in worktrees
  Worktrees may need dependency installation; failures are detected and reported

  Scenario: pnpm install runs in each new worktree before task dispatch
    Given task T1 has a worktree at ".worktrees/auth-flow-T1-<runId>"
    And the project uses pnpm (pnpm-lock.yaml exists at the repo root)
    When the orchestrator prepares the worktree for T1
    Then "pnpm install --frozen-lockfile" is run in the worktree
    And the install must succeed before the coding agent is dispatched

  Scenario: pnpm install failure halts the task with clear error
    Given task T1's worktree is created successfully
    And "pnpm install --frozen-lockfile" fails in the worktree (e.g., network error, corrupted cache)
    When the install failure is detected
    Then T1 is marked as failed with error: "pnpm install failed in worktree for T1 — check network and pnpm cache"
    And Read-Escalation is called with the pnpm stderr output
    And other parallel tasks in the tier are not affected

  Scenario: pnpm install is skipped when no pnpm-lock.yaml exists
    Given the project does not use pnpm (no pnpm-lock.yaml at repo root)
    When the orchestrator prepares a worktree for task T1
    Then no package manager install step runs
    And the coding agent is dispatched directly

# =============================================================================
# Windows MAX_PATH
# =============================================================================

# [Tier 2] Windows MAX_PATH issues with deep worktree paths

Feature: Windows MAX_PATH handling for worktree paths
  Worktree paths must stay within Windows path length limits or use extended-length paths

  Scenario: Worktree path length is validated before creation
    Given feature "authentication-authorization-module" with task T1 and runId "20260411T112813-a3f1"
    And the full worktree path would be ".worktrees/authentication-authorization-module-T1-20260411T112813-a3f1"
    When the orchestrator calculates the absolute path length
    Then if the absolute path exceeds 248 characters (MAX_PATH for directories minus buffer)
    Then the pipeline halts with error: "Worktree path too long (<length> chars) — shorten the feature name or move the repo closer to the drive root"
    And no worktree is created

  Scenario: Worktree path within MAX_PATH limit proceeds normally
    Given feature "auth-flow" with task T1 and runId "20260411T112813-a3f1"
    And the full absolute worktree path is 120 characters
    When the orchestrator validates the path length
    Then the path passes validation
    And worktree creation proceeds normally

# =============================================================================
# Edge Cases
# =============================================================================

Feature: Edge cases across all cleanup improvements
  Boundary conditions and special handling for the 7 improvements

  Scenario: TLC produces no error traces — other fixture types still generated
    Given TLC verification completes with no errors, no deadlocks, no counterexamples
    When the TLC parser runs
    Then fixtures are still generated from invariant results, coverage statistics, and state space data
    And PBT and E2E tests are generated from the available fixture data

  Scenario: BDD file has no Scenario Outlines or data tables — minimal parse succeeds
    Given a .feature file with only simple Scenario blocks (no Outlines, no tables, no Backgrounds)
    When the Gherkin parser runs
    Then fixtures are generated with the simple scenarios
    And no errors occur

  Scenario: --resume after stage 8 partial completion with mixed tier states
    Given pipeline.log shows stage 8 started
    And tier 1 completed with T1 and T2 merged
    And tier 2 task T3 started but did not complete
    And tier 3 has not started
    When the user runs "./vibe.ps1 --resume"
    Then tier 1 is skipped entirely
    And tier 2 resumes with T3
    And tier 3 executes after tier 2 completes

  Scenario: Worktree creation fails on single-task tier — existing rollback applies
    Given tier 2 has only task T3
    And worktree creation fails for T3
    When the failure is detected
    Then the existing rollback behavior in New-TaskWorkspace cleans up any partial state
    And Read-Escalation is called with workspace creation failure context

  Scenario: Parser failure followed by --resume after fix (Gherkin)
    Given the Gherkin parser fails on a syntax error in "docs/auth-flow/bdd.feature"
    And the pipeline halts at the fixture generation step between stage 3 and stage 4
    And the user fixes the syntax error in the .feature file
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline resumes at stage 4 (which re-runs its pre-stage fixture generation)
    And the Gherkin parser succeeds on the corrected file
    And the pipeline proceeds to stage 4

  Scenario: Parser failure followed by --resume after fix (TLC)
    Given the TLC parser fails on unrecognized output format
    And the pipeline halts at the fixture generation step between stage 5 and stage 6
    And the user fixes the TLC output issue
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline resumes at stage 6 (which re-runs its pre-stage fixture generation)
    And the TLC parser succeeds
    And the pipeline proceeds to stage 6

  Scenario: Parallel task dispatch with warden — each agent independently scoped
    Given tier 1 has tasks T1, T2, and T3 all dispatched in parallel
    When each agent starts executing
    Then T1's warden scope is ".worktrees/auth-flow-T1-<runId>/"
    And T2's warden scope is ".worktrees/auth-flow-T2-<runId>/"
    And T3's warden scope is ".worktrees/auth-flow-T3-<runId>/"
    And no agent can write outside its own scope

  Scenario: Stale lock from crashed pipeline is recovered on fresh run
    Given "pipeline.lock" exists with PID 88888 and start time "2026-04-11T09:00:00Z"
    And process 88888 is no longer running
    When the user runs "./vibe.ps1 'new prompt'"
    Then the pipeline detects the stale lock (PID 88888 is not alive)
    And removes the stale "pipeline.lock"
    And starts the new run normally

  Scenario: Stale lock from crashed pipeline where PID was reused by another process
    Given "pipeline.lock" exists with PID 88888 and start time "2026-04-11T09:00:00Z"
    And PID 88888 is alive but was started at "2026-04-11T12:00:00Z" (different process)
    When the user runs "./vibe.ps1 'new prompt'"
    Then the pipeline detects the PID start time mismatch
    And treats the lock as stale
    And removes the stale "pipeline.lock"
    And starts the new run normally

  Scenario: Fixture generation overwrites stale fixtures from any prior run
    Given "tests/fixtures/bdd/auth-flow.json" and "tests/fixtures/tla/auth-flow.json" both exist from a prior run
    And the current run has completed stage 3 with new BDD content
    When the pipeline generates BDD fixtures
    Then "tests/fixtures/bdd/auth-flow.json" is overwritten with data from the current run
    And the stale "tests/fixtures/tla/auth-flow.json" is not touched until after stage 5

  Scenario: Coverage iteration cap prevents unbounded LLM calls
    Given task T1 has failed the coverage gate 4 times
    And the coverage iteration cap is 5
    When the coverage gate fails a 5th time (PBT at 97%, contract at 100%, E2E at 100%)
    Then the task halts with error: "Coverage gate failed after 5 iterations — manual intervention required"
    And the error details include "PBT: 97% (target: 100%)"
    And no further TDD cycle iterations are attempted for T1

  Scenario: Atomic write protects against crash during BDD fixture generation
    Given the Gherkin parser is mid-write to "tests/fixtures/bdd/auth-flow.json.tmp"
    And the pipeline process is killed (e.g., Ctrl+C, OOM kill)
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline finds no "tests/fixtures/bdd/auth-flow.json" (the .tmp was never renamed)
    And the fixture generation re-runs as part of the resumed stage
    And the orphaned .tmp file is cleaned up before the new write

  Scenario: Atomic write protects against crash during TLC fixture generation
    Given the TLC parser is mid-write to "tests/fixtures/tla/auth-flow.json.tmp"
    And the pipeline process is killed
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline finds no "tests/fixtures/tla/auth-flow.json" (the .tmp was never renamed)
    And the fixture generation re-runs as part of the resumed stage
    And the orphaned .tmp file is cleaned up before the new write

  Scenario: Concurrent task completions do not corrupt tier state
    Given tier 1 has tasks T1, T2, and T3 running in parallel
    And all three tasks finish within the same 100ms window
    When each task signals completion
    Then the atomic task completion counter increments to 3 without lost updates
    And the orchestrator advances to tier 2 exactly once (not multiple times)

  Scenario: Coverage regression across categories triggers combined failure message
    Given task T1 is on coverage iteration 3
    And the coding agent modified shared source code to improve E2E coverage
    When the coverage gate evaluates
    And PBT dropped from 100% to 95% and E2E rose from 85% to 100% and contract stayed at 100%
    Then the gate fails with a combined report: "PBT: 95% (regressed from 100%), contract: 100%, E2E: 100%"
    And the task returns to the GREEN phase with instructions to restore PBT coverage without losing E2E gains

  Scenario: Abort cleanup after Ctrl+C followed by --resume
    Given the pipeline was killed by Ctrl+C during stage 8
    And the abort cleanup handler ran (removed worktrees, released lock, wrote ABORT marker)
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline reads the ABORT marker and the last completed stage from pipeline.log
    And resumes from the correct stage (not the aborted stage's beginning)
    And no orphaned state from the aborted run interferes with the resumed run

  Scenario: API transient failure during abort cleanup is ignored
    Given the pipeline is running the abort cleanup handler after Ctrl+C
    And one of the cleanup steps involves an API call that fails (e.g., notifying a service)
    When the API call fails during cleanup
    Then the cleanup handler logs the failure and continues
    And remaining cleanup steps (worktree removal, lock release) still execute

  Scenario: --resume idempotency with concurrent task in stage 8 — one task completed, one mid-TDD
    Given pipeline.log shows stage 8 tier 1 with T1 MERGE-COMPLETE and T2 at TDD iteration 3 (no completion)
    When the user runs "./vibe.ps1 --resume"
    Then T1 is not re-dispatched (already merged)
    And T2 starts a fresh TDD cycle (the partial TDD state is not recoverable)
    And the coverage and TDD iteration counters for T2 reset to 0

  Scenario: Merge conflict on --resume after abort during merge
    Given the pipeline was killed during T1's merge to the feature branch
    And the abort cleanup handler ran "git merge --abort" restoring the feature branch
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline detects T1 has no MERGE-COMPLETE marker
    And re-attempts the merge for T1
    And if the merge succeeds, continues with the remaining tasks

  # [Tier 2] Compound Then clauses — split for clarity
  Scenario: Coverage gate report separates raw fraction from truncated percentage
    Given the coverage gate evaluates for task T1
    When PBT coverage is 195 of 200 branches covered
    Then the report shows "PBT: 195/200 (97%)"

  Scenario: Coverage gate report header states the rounding mode
    Given the coverage gate evaluates for task T1
    When the gate produces its report
    Then the report header includes "Rounding mode: floor (truncate)"
