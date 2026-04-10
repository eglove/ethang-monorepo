# BDD Scenarios — Coding Stage (Stage 8)
# Date: 2026-04-09
# Source: docs/coding-stage/elicitor.md
# Revision: Addresses all debate objections (bdd-debate.md)
#
# Glossary — Ubiquitous Language
#   Task (T<N>)          — a unit of work identified by number, not "step"
#   Isolated workspace   — an isolated copy of the repo for parallel task execution (currently git worktree)
#   Remediation cycle    — a focused fix loop during cleanup (distinct from the main RED-GREEN TDD cycle)
#   Verdict              — the test writer's structured determination: "revised" or "already_implemented"
#   Writer response      — structured JSON returned by any writer agent: { filesModified, summary }
#   Remediation response — structured JSON from test writer during cleanup: { blame, filesModified, summary }

# =============================================================================
# Stage 6 Modifications — Implementation Writer
# =============================================================================

Feature: Implementation writer produces tickets and lightweight JSON
  Stage 6 generates a high-level plan, a machine-readable JSON index, and per-task ticket files

  Scenario: Implementation writer produces three output artifacts
    Given a feature named "auth-flow" has completed Stage 5
    When the implementation writer (Stage 6) runs for "auth-flow"
    Then the file "docs/auth-flow/implementation-plan.md" exists
    And the file "docs/auth-flow/implementation-plan.json" exists
    And the directory "docs/auth-flow/tickets" contains at least one ticket file

  Scenario: Implementation plan MD contains only high-level overview
    Given the implementation writer has run for feature "auth-flow"
    When I read "docs/auth-flow/implementation-plan.md"
    Then it contains a general architecture summary
    And it contains a tier structure overview
    And it does not contain detailed per-task descriptions

  Scenario: Implementation plan JSON conforms to the index schema
    Given the implementation writer has run for feature "auth-flow"
    When I parse "docs/auth-flow/implementation-plan.json"
    Then the root object has a "feature" string field set to "auth-flow"
    And the root object has a "tiers" array field
    And each tier has a numeric "tier" field
    And each tier has a "tasks" array
    And each task has fields: "taskNumber", "title", "codeWriter", "testWriter", "ticketFile", "projectRoot", "dependencies"

  Scenario: Agent-writer tasks have null testWriter
    Given the implementation writer has assigned task T4 to "agent-writer"
    When I parse the task entry for T4 in "implementation-plan.json"
    Then the "testWriter" field is null
    And the "codeWriter" field is "agent-writer"

  Scenario Outline: Writer pairs are assigned based on best fit
    Given a task that targets <domain>
    When the implementation writer assigns writers
    Then "codeWriter" is "<code_writer>"
    And "testWriter" is <test_writer>

    Examples:
      | domain                        | code_writer         | test_writer   |
      | Hono backend routes           | hono-writer         | "vitest"      |
      | PowerShell scripts            | powershell-writer   | "pester"      |
      | General TypeScript libraries  | typescript-writer   | "vitest"      |
      | Claude Code agent configs     | agent-writer        | null          |
      | HTML/CSS/JS UI components     | ui-writer           | "playwright"  |

  Scenario: Ticket file follows the required template
    Given the implementation writer has produced ticket "docs/auth-flow/tickets/T1-user-login.md"
    When I read the ticket file
    Then it contains a header "# T1 — User Login"
    And it contains metadata fields: Tier, Code Writer, Test Writer, Project Root, Dependencies
    And it contains sections: Files, Description, Acceptance Criteria, Test Description, TLA+ Coverage
    And each acceptance criterion is a checkbox item

  Scenario: Ticket TLA+ Coverage maps to spec actions
    Given a TLA+ spec exists at "docs/auth-flow/tla/auth.tla" with action "Authenticate"
    When the implementation writer creates ticket T1
    Then the TLA+ Coverage section lists specific states, transitions, and invariants from the spec

  Scenario: Ticket dependencies reference valid task numbers
    Given the implementation plan has tasks T1, T2, and T3
    And T3 depends on T1
    When I parse the ticket for T3
    Then the "Dependencies" field lists "T1"
    And T1 exists in the implementation plan

  Scenario: Intra-tier dependency is rejected during plan validation
    Given the implementation plan has tier 1 with tasks T1 and T2
    And T2 lists T1 in its "dependencies" array
    When Stage 8 validates the plan before execution
    Then validation fails with an error: "T2 depends on T1 but both are in tier 1"
    And no tasks execute

  Scenario: projectRoot is set per task
    Given task T1 targets "packages/ethang-hono" and task T2 targets "packages/vibe-cli"
    When I parse the implementation plan JSON
    Then T1 has "projectRoot" set to "packages/ethang-hono"
    And T2 has "projectRoot" set to "packages/vibe-cli"

  Scenario: Unknown writer type is rejected during plan validation
    Given the implementation plan has task T5 with codeWriter "nonexistent-writer"
    When Stage 8 validates the plan before execution
    Then validation fails with an error identifying "nonexistent-writer" as unknown
    And no tasks execute

# =============================================================================
# Stage 7 Modifications — Implementation Debate
# =============================================================================

Feature: Implementation debate reviews tickets and TLA+ coverage
  Stage 7 debate validates both the plan and the detailed tickets

  Scenario: Debate reviews tickets alongside the plan
    Given the implementation plan and tickets exist for feature "auth-flow"
    When the implementation debate (Stage 7) runs
    Then the debate evaluates each ticket for completeness
    And the debate evaluates each ticket for testability

  Scenario: Debate ensures plan stays high-level
    Given the implementation plan MD contains detailed task descriptions
    When the implementation debate runs
    Then the debate flags the plan as too detailed
    And requests that detail be moved to tickets

  Scenario: Debate verifies full TLA+ coverage across tickets
    Given a TLA+ spec with states S1, S2, S3 and transitions T_A, T_B, T_C
    And the ticket set only covers S1, S2 and T_A, T_B
    When the implementation debate runs
    Then the debate identifies that S3 and T_C are not covered by any ticket
    And requests additional tickets or modifications

  Scenario: Debate verifies all TLA+ invariants are covered
    Given a TLA+ spec with invariants I1, I2, I3
    And the ticket set maps acceptance criteria to I1 and I2 only
    When the implementation debate runs
    Then the debate identifies that I3 is uncovered
    And requests a ticket modification to cover I3

# =============================================================================
# Stage 8 — Orchestration
# =============================================================================

Feature: Stage 8 orchestration reads the plan and processes tiers
  The coding stage reads the JSON index and executes tasks tier by tier

  Scenario: Stage 8 reads the implementation plan JSON
    Given "docs/auth-flow/implementation-plan.json" exists with 2 tiers and 4 tasks
    When Stage 8 starts for feature "auth-flow"
    Then it parses the JSON and identifies 2 tiers
    And it identifies 4 total tasks across both tiers

  Scenario: Tiers are processed sequentially
    Given an implementation plan with tier 1 (tasks T1, T2) and tier 2 (task T3)
    When Stage 8 executes
    Then all tier 1 tasks complete and merge before any tier 2 task begins

  Scenario: Single-task tier works directly on the feature branch
    Given tier 2 contains only task T3
    When Stage 8 processes tier 2
    Then no isolated workspace is created for T3
    And T3 executes on the current feature branch

  Scenario: Multi-task tier creates one isolated workspace per task
    Given tier 1 contains tasks T1 and T2
    When Stage 8 processes tier 1
    Then an isolated workspace is created for T1
    And an isolated workspace is created for T2
    And T1 and T2 execute in parallel

  Scenario: Isolated workspaces are tracked by task number
    Given tier 1 creates isolated workspaces for T1 and T2
    When the workspaces are created
    Then the orchestrator tracks T1's workspace path keyed by task number 1
    And the orchestrator tracks T2's workspace path keyed by task number 2

  Scenario: Invoke-Claude receives WorkDir for isolated workspace tasks
    Given task T1 runs in an isolated workspace at path "wt/T1-user-login"
    When the orchestrator calls Invoke-Claude for T1
    Then the -WorkDir parameter is set to "wt/T1-user-login"
    And the CLI call includes "--cwd wt/T1-user-login"

  Scenario: Invoke-Claude omits WorkDir for single-task tiers
    Given task T3 runs directly on the feature branch (no isolated workspace)
    When the orchestrator calls Invoke-Claude for T3
    Then the -WorkDir parameter is not passed
    And the CLI call does not include "--cwd"

  Scenario: Tier completion advances the pipeline to the next tier
    Given tier 1 has tasks T1 and T2
    And both tasks have completed their TDD cycles
    And the merge queue has drained for tier 1
    When the pipeline advances
    Then tier 2 isolated workspaces are created (if tier 2 has multiple tasks)
    And tier 2 task execution begins

  Scenario: Isolated workspaces are cleaned up after successful merge
    Given task T1's isolated workspace exists at "wt/T1-user-login"
    And T1's branch has been merged to the feature branch
    When workspace cleanup runs for T1
    Then the workspace at "wt/T1-user-login" is removed
    And the temporary branch is deleted

  Scenario: Isolated workspaces are cleaned up on pipeline Stop
    Given tasks T1 and T2 have isolated workspaces
    And Read-Escalation is active for T2
    When the user selects "Stop"
    Then T1's isolated workspace is cleaned up
    And T2's isolated workspace is preserved for debugging

  Scenario: Isolated workspaces are cleaned up on successful completion
    Given all tiers have completed and final verification passed
    When Stage 8 finishes
    Then no orphaned isolated workspaces remain

  Scenario: Orphaned workspaces are detected on pipeline restart
    Given the pipeline crashed during a previous run
    And isolated workspaces exist from that run at "wt/T1-user-login" and "wt/T2-signup"
    When Stage 8 starts for feature "auth-flow"
    Then it detects the orphaned workspaces
    And prompts the user to clean them up or abort

  Scenario: Partial workspace creation failure rolls back the tier
    Given tier 1 has tasks T1, T2, and T3
    And workspace creation succeeds for T1 and T2
    And workspace creation fails for T3
    When the failure is detected
    Then T1's workspace is cleaned up
    And T2's workspace is cleaned up
    And no tasks in the tier execute
    And Read-Escalation is called with workspace creation failure context

  Scenario: Zero-tier plan completes as a no-op
    Given "docs/auth-flow/implementation-plan.json" has zero tiers
    When Stage 8 starts for feature "auth-flow"
    Then Stage 8 completes immediately
    And Write-TaskLog records "No tiers to execute"

# =============================================================================
# Stage 8 — TDD Cycle
# =============================================================================

Feature: TDD cycle executes RED-GREEN-Cleanup phases per task
  Each task with a test writer goes through the full TDD cycle

  # --- RED Phase ---

  Scenario: Test writer receives full context in RED phase
    Given task T1 has ticket "docs/auth-flow/tickets/T1-user-login.md"
    And relevant TLA+ actions from "docs/auth-flow/tla/auth.tla"
    And relevant BDD scenarios from "docs/auth-flow/bdd.feature"
    When the RED phase starts for T1
    Then the test writer prompt includes the ticket content
    And the test writer prompt includes the relevant TLA+ actions and invariants
    And the test writer prompt includes the relevant BDD scenarios

  Scenario: Test writer returns structured JSON in RED phase
    Given the test writer has written test files for T1
    When the test writer responds
    Then the response is valid JSON with "filesModified" array and "summary" string
    And each entry in "filesModified" has "path" and "action" fields
    And "action" is one of "create" or "modify"

  Scenario: RED phase confirms tests fail
    Given the test writer has written tests for T1 in "packages/ethang-hono"
    When the orchestrator runs "pnpm test" in "packages/ethang-hono"
    And the verify command exits with code 1 (test failure)
    Then the RED phase is achieved
    And the orchestrator proceeds to the GREEN phase

  Scenario: RED phase detects unexpectedly passing tests
    Given the test writer has written tests for T1
    When the orchestrator runs the verify command
    And all tests pass (exit code 0)
    Then the orchestrator sends the test writer a new prompt with the passing output
    And requests the test writer to review and return a verdict

  Scenario: Test writer returns verdict "revised" on RED retry
    Given the RED phase tests passed unexpectedly
    And the test writer reviews the passing output
    When the test writer returns a verdict response with verdict "revised"
    Then the RED retry counter increments
    And the RED phase restarts with the revised tests

  Scenario: Test writer returns verdict "already_implemented" on RED retry
    Given the RED phase tests passed unexpectedly
    And the test writer reviews the passing output
    When the test writer returns a verdict response with verdict "already_implemented"
    Then the TDD cycle skips directly to cleanup
    And no GREEN phase runs

  Scenario: Already-implemented end-to-end flow skips GREEN and runs cleanup
    Given task T1 has testWriter "vitest" and projectRoot "packages/ethang-hono"
    And the test writer writes tests for T1
    And the tests pass immediately in the RED phase
    And the test writer returns verdict "already_implemented"
    When the orchestrator processes T1
    Then no code writer is invoked for T1
    And the cleanup phase runs with "pnpm test", "pnpm lint", and "pnpm tsc"
    And T1 completes after 2 consecutive clean passes

  Scenario: RED retry fencepost — 3rd retry is the last attempt
    Given MaxRedRetries is 3
    And the RED retry counter is at 2
    And the tests still pass
    When the test writer returns verdict "revised" (the 3rd retry)
    Then the orchestrator runs the verify command one more time
    And if tests still pass, Read-Escalation is called

  Scenario: RED retry fencepost — 2nd retry permits a 3rd
    Given MaxRedRetries is 3
    And the RED retry counter is at 1
    And the tests still pass
    When the test writer returns verdict "revised" (the 2nd retry)
    Then the RED retry counter increments to 2
    And a 3rd retry is permitted

  Scenario: RED retries exhaust after MaxRedRetries attempts
    Given MaxRedRetries is 3
    And 3 RED retries have been attempted (counter equals MaxRedRetries)
    And the tests still pass after the 3rd retry
    When the orchestrator detects exhaustion
    Then Read-Escalation is called with context about the RED exhaustion
    And the pipeline halts for user input

  # --- GREEN Phase ---

  Scenario: Code writer receives full context in GREEN phase
    Given the RED phase completed with failing tests
    And test files exist at "src/__tests__/auth.test.ts"
    When the GREEN phase starts for T1
    Then the code writer prompt includes the ticket content
    And the code writer prompt includes the test file contents
    And the code writer prompt includes the RED phase failure output (full stderr/stdout)

  Scenario: Code writer returns structured JSON in GREEN phase
    Given the code writer has written implementation files
    When the code writer responds
    Then the response is valid JSON with "filesModified" array and "summary" string

  Scenario: Code writer must not modify test files
    Given the code writer returns a response for T1
    And "filesModified" includes a path matching a test file written during the RED phase
    When the orchestrator validates the response
    Then the test file modifications are rejected
    And the code writer is re-prompted with guidance that test files are read-only during GREEN

  Scenario: GREEN phase confirms tests pass
    Given the code writer has written implementation for T1
    When the orchestrator runs the verify command
    And all tests pass (exit code 0)
    Then the GREEN phase is achieved
    And the orchestrator proceeds to the cleanup phase

  Scenario: GREEN phase retries on test failure
    Given the code writer's implementation fails tests (exit code 1)
    When the orchestrator detects the failure
    Then the orchestrator sends the code writer a new prompt with the full failure output
    And the GREEN retry counter increments

  Scenario: GREEN retry fencepost — 100th attempt is the last
    Given MaxTddCycles is 100
    And the GREEN retry counter is at 99
    And the tests still fail
    When the code writer returns another failed attempt (the 100th)
    Then the orchestrator runs the verify command one more time
    And if tests still fail, Read-Escalation is called

  Scenario: GREEN retry fencepost — 99th attempt permits a 100th
    Given MaxTddCycles is 100
    And the GREEN retry counter is at 98
    And the tests still fail
    When the code writer returns another failed attempt (the 99th)
    Then the GREEN retry counter increments to 99
    And a 100th attempt is permitted

  Scenario: GREEN retries exhaust after MaxTddCycles attempts
    Given MaxTddCycles is 100
    And 100 GREEN attempts have been made (counter equals MaxTddCycles)
    And the tests still fail after the 100th attempt
    When the orchestrator detects exhaustion
    Then Read-Escalation is called with context about the GREEN exhaustion
    And the pipeline halts for user input

# =============================================================================
# Stage 8 — Cleanup Phase
# =============================================================================

Feature: Cleanup phase validates test, lint, and tsc consecutively
  After GREEN (or after already_implemented verdict), the cleanup loop runs until CleanupPasses consecutive clean passes

  Scenario: Cleanup runs test then lint then tsc in sequence for vitest tasks
    Given the GREEN phase completed for T1 with testWriter "vitest"
    When the cleanup phase starts
    Then the orchestrator runs "pnpm test" in the projectRoot
    And then runs "pnpm lint" in the projectRoot
    And then runs "pnpm tsc" in the projectRoot

  Scenario: Cleanup runs Invoke-Pester then lint then tsc for pester tasks
    Given the GREEN phase completed for T2 with testWriter "pester"
    When the cleanup phase starts
    Then the orchestrator runs "Invoke-Pester -Configuration (Import-PowerShellDataFile ./tests/pester.config.ps1)" in the projectRoot
    And then runs "pnpm lint" in the projectRoot
    And then runs "pnpm tsc" in the projectRoot

  Scenario: Cleanup runs playwright then lint then tsc for playwright tasks
    Given the GREEN phase completed for T3 with testWriter "playwright"
    When the cleanup phase starts
    Then the orchestrator runs "pnpm exec playwright test" in the projectRoot
    And then runs "pnpm lint" in the projectRoot
    And then runs "pnpm tsc" in the projectRoot

  Scenario: All three pass increments consecutive clean counter
    Given the cleanup loop is running for T1
    When all three verify commands pass (exit code 0)
    Then the consecutive clean counter increments by 1

  Scenario: Two consecutive clean passes completes cleanup
    Given the consecutive clean counter is at 1
    When all three verify commands pass again
    Then the consecutive clean counter reaches 2 (CleanupPasses)
    And the cleanup phase completes successfully

  Scenario: Any failure resets the consecutive clean counter
    Given the consecutive clean counter is at 1
    When "pnpm lint" fails (exit code 1)
    Then the consecutive clean counter resets to 0
    And a remediation cycle is triggered

  Scenario: Remediation cycle on cleanup failure — test writer blames code
    Given "pnpm lint" failed during cleanup for T1
    When the remediation cycle starts
    Then the test writer receives the failure output
    And the test writer returns a remediation response with blame "code"
    And the code writer receives the failure output and the test writer's analysis
    And the code writer fixes the issue
    And the cleanup loop restarts from the beginning

  Scenario: Remediation cycle on cleanup failure — test writer blames test
    Given "pnpm test" failed during cleanup for T1
    When the remediation cycle starts
    Then the test writer receives the failure output
    And the test writer returns a remediation response with blame "test"
    And the test writer fixes the test files
    And the cleanup loop restarts from the beginning

  Scenario: Remediation response follows structured JSON schema
    Given a remediation cycle is triggered during cleanup
    When the test writer responds
    Then the response is valid JSON with fields: "blame", "filesModified", "summary"
    And "blame" is one of "test" or "code"
    And "filesModified" is an array of { "path", "action" } objects

  Scenario: Unrecognized remediation blame value triggers re-prompt
    Given the test writer returns a remediation response with blame "unknown_value"
    When the orchestrator parses the response
    Then the orchestrator re-prompts the test writer with guidance that blame must be "test" or "code"

  Scenario: Non-convergent cleanup — fix introduces a new issue
    Given a remediation cycle fixes a lint issue in T1
    And the fix introduces a new test failure
    When the cleanup loop restarts
    Then the new test failure triggers another remediation cycle
    And the MaxFixRounds counter increments for each remediation cycle (not each cleanup pass)
    And the total remediation cycles are still capped at MaxFixRounds

  Scenario: Cleanup fencepost — 100th remediation cycle is the last
    Given MaxFixRounds is 100
    And 99 remediation cycles have run
    And cleanup still has not achieved 2 consecutive clean passes
    When the 100th remediation cycle fails
    Then Read-Escalation is called with context about the cleanup exhaustion

  Scenario: Cleanup fencepost — 99th remediation cycle permits a 100th
    Given MaxFixRounds is 100
    And 98 remediation cycles have run
    When the 99th remediation cycle completes
    Then a 100th remediation cycle is permitted if needed

  Scenario: Cleanup exhausts after MaxFixRounds remediation cycles
    Given 100 remediation cycles have run (counter equals MaxFixRounds)
    And cleanup still has not achieved 2 consecutive clean passes
    When another failure occurs
    Then Read-Escalation is called with context about the cleanup exhaustion
    And the pipeline halts for user input

# =============================================================================
# Stage 8 — Verify Commands
# =============================================================================

Feature: Verify commands are selected based on test writer
  Each test writer type maps to a specific verify command

  Scenario: Vitest tasks use pnpm test
    Given a task with testWriter "vitest" and projectRoot "packages/ethang-hono"
    When the orchestrator runs the verify command
    Then it executes "pnpm test" in "packages/ethang-hono"

  Scenario: Pester tasks use Invoke-Pester
    Given a task with testWriter "pester" and projectRoot "packages/vibe-cli"
    When the orchestrator runs the verify command
    Then it executes "Invoke-Pester -Configuration (Import-PowerShellDataFile ./tests/pester.config.ps1)" in "packages/vibe-cli"

  Scenario: Playwright tasks use pnpm exec playwright test
    Given a task with testWriter "playwright" and projectRoot "packages/ui-app"
    When the orchestrator runs the verify command
    Then it executes "pnpm exec playwright test" in "packages/ui-app"

  Scenario: Verify commands run in isolated workspace path for workspace tasks
    Given task T1 runs in an isolated workspace "wt/T1-user-login" with projectRoot "packages/ethang-hono"
    When the orchestrator runs the verify command
    Then the working directory is "wt/T1-user-login/packages/ethang-hono"

  Scenario: Verify command exit code 1 indicates test failure — retry
    Given the orchestrator runs a verify command for T1
    When the command exits with code 1
    Then the orchestrator treats this as a test failure
    And proceeds to the appropriate retry logic (RED retry, GREEN retry, or remediation cycle)

  Scenario: Verify command exit code 127 indicates infrastructure failure — escalate
    Given the orchestrator runs a verify command for T1
    When the command exits with code 127 (command not found)
    Then the orchestrator treats this as an infrastructure failure
    And Read-Escalation is called immediately without consuming a retry
    And the failure context includes "infrastructure failure: command not found"

  Scenario: Verify command timeout is treated as infrastructure failure
    Given the orchestrator runs a verify command for T1
    When the command times out
    Then the orchestrator treats this as an infrastructure failure
    And Read-Escalation is called immediately without consuming a retry

# =============================================================================
# Stage 8 — Agent-Writer Exception
# =============================================================================

Feature: Agent-writer tasks skip the TDD cycle
  Tasks assigned to agent-writer produce agent configuration files and run as a single call

  Scenario: Agent-writer task has null testWriter
    Given task T4 has codeWriter "agent-writer" and testWriter null
    When Stage 8 processes T4
    Then no RED phase runs
    And no GREEN phase runs
    And no cleanup phase runs

  Scenario: Agent-writer produces agent configuration files
    Given task T4 is an agent-writer task
    When the orchestrator calls agent-writer
    Then the agent-writer writes .md agent configuration files to disk
    And returns valid JSON with "filesModified" and "summary"
    And the orchestrator proceeds to the next task

  Scenario: Agent-writer is called exactly once
    Given task T4 is an agent-writer task
    When Stage 8 processes T4
    Then Invoke-Claude is called exactly once for T4
    And there is no retry loop

# =============================================================================
# Stage 8 — Invoke-Claude Failure Handling
# =============================================================================

Feature: Invoke-Claude handles communication failures
  Writer agent calls can fail in ways distinct from test/code failures

  Scenario: Invoke-Claude returns non-JSON response
    Given the orchestrator calls Invoke-Claude for the code writer
    When the response is not valid JSON
    Then the orchestrator re-prompts the writer with the raw response
    And includes guidance to return valid JSON per the response schema
    And the retry counter increments

  Scenario: Invoke-Claude returns empty response
    Given the orchestrator calls Invoke-Claude for the test writer
    When the response is empty (zero-length)
    Then the orchestrator re-prompts the writer with the original context
    And the retry counter increments

  Scenario: Invoke-Claude returns truncated JSON response
    Given the orchestrator calls Invoke-Claude for the code writer
    When the response is JSON but missing required fields ("filesModified" or "summary")
    Then the orchestrator re-prompts the writer with the incomplete response
    And includes guidance identifying the missing fields
    And the retry counter increments

  Scenario: Invoke-Claude network or process failure
    Given the orchestrator calls Invoke-Claude for the test writer
    When the CLI process exits with a non-zero exit code (not a writer response issue)
    Then Read-Escalation is called immediately
    And the failure context includes the CLI exit code and stderr

# =============================================================================
# Stage 8 — Test Isolation
# =============================================================================

Feature: Concurrent tasks in isolated workspaces do not share mutable state
  Each workspace must be fully independent to prevent false positives

  Scenario: Concurrent workspace tasks do not share test state
    Given tier 1 has tasks T1 and T2 running in separate isolated workspaces
    When both tasks execute their TDD cycles concurrently
    Then T1's verify commands run only in T1's workspace
    And T2's verify commands run only in T2's workspace
    And neither task's test results are influenced by the other's file changes

# =============================================================================
# Stage 8 — Merge Queue
# =============================================================================

Feature: Serialized merge queue merges workspace branches back to feature branch
  After a tier completes, workspace branches merge one at a time

  Scenario: Workspace branches merge one at a time
    Given tier 1 tasks T1 and T2 have completed in their isolated workspaces
    When the merge queue runs
    Then T1's branch merges to the feature branch first
    And then T2's branch merges to the feature branch
    And the merges do not run in parallel

  Scenario: Merge queue drains before tier advances
    Given tier 1 tasks T1 and T2 have completed
    And the merge queue has processed T1 and T2
    When the merge queue is empty
    Then the pipeline records that tier 1 is complete
    And tier 2 execution may begin

  Scenario: Clean merge succeeds without conflict resolution
    Given T1's workspace branch has no conflicts with the feature branch
    When T1's branch merges
    Then the merge completes successfully
    And the isolated workspace is cleaned up

  Scenario: Merge conflict triggers merge-resolver agent
    Given T2's workspace branch conflicts with the feature branch after T1 merged
    When the merge fails with conflicts
    Then the merge-resolver agent is invoked
    And it receives both tickets for the conflicting tasks
    And it receives the conflict diff
    And it receives the list of affected files

  Scenario: Merge-resolver runs verify commands for both tasks after resolution
    Given the merge-resolver has resolved conflicts between T1 and T2
    When the resolution is complete
    Then the orchestrator runs verify commands for T1's test writer
    And the orchestrator runs verify commands for T2's test writer

  Scenario: Merge conflict retries exhaust after MaxMergeRetries attempts
    Given MaxMergeRetries is 3
    And the merge-resolver has attempted resolution 3 times
    And the merge still has conflicts or post-resolution verification fails
    When the orchestrator detects exhaustion
    Then Read-Escalation is called with context about the merge exhaustion
    And the pipeline halts for user input

  Scenario: Merge conflict fencepost — 2nd attempt permits a 3rd
    Given MaxMergeRetries is 3
    And the merge-resolver has attempted resolution 2 times
    When the 2nd resolution fails verification
    Then a 3rd resolution attempt is permitted

  Scenario: Merge conflict signals missed dependency
    Given tier 1 has tasks T1 and T2 running in parallel
    And their changes conflict in the same file
    When a merge conflict occurs
    Then the task log for T2 notes "possible missed dependency in implementation plan"
    And the merge-resolver still attempts resolution

  Scenario: Cascading merge conflicts within a tier
    Given tier 1 has tasks T1, T2, and T3 in parallel
    And T1 merges successfully
    And T2's merge resolution changes files that T3 also modifies
    When T3 attempts to merge
    Then a new conflict is detected
    And the merge-resolver handles T3's conflict independently
    And MaxMergeRetries applies separately to T3's resolution

  Scenario: Merge exhaustion mid-tier preserves already-merged tasks
    Given tier 1 has tasks T1, T2, and T3
    And T1 has merged successfully
    And T2's merge exhausts MaxMergeRetries
    When Read-Escalation is called
    Then the escalation context shows T1 as merged
    And T2 as failed-to-merge
    And T3 as unmerged (skipped)
    And T1's changes remain on the feature branch

  Scenario: Single-task tier skips the merge queue
    Given tier 2 contains only task T3 (no isolated workspace)
    When tier 2 completes
    Then no merge queue runs
    And the code is already on the feature branch

# =============================================================================
# Stage 8 — Final Verification
# =============================================================================

Feature: Final verification runs after all tiers complete
  A full-codebase cleanup loop validates the combined result

  Scenario: Final verification runs cleanup loop on full codebase
    Given all tiers have completed and merged
    When final verification starts
    Then the cleanup loop runs against the full codebase
    And requires 2 consecutive clean passes (CleanupPasses)

  Scenario: Final verification includes all relevant verify commands
    Given tasks used vitest, pester, and playwright test writers
    When final verification runs
    Then it runs "pnpm test"
    And it runs "pnpm lint"
    And it runs "pnpm tsc"
    And it runs "Invoke-Pester -Configuration (Import-PowerShellDataFile ./tests/pester.config.ps1)"

  Scenario: Final verification includes only test writers that were used
    Given all tasks used vitest (no pester or playwright tasks)
    When final verification runs
    Then it runs "pnpm test", "pnpm lint", and "pnpm tsc"
    And it does not run Invoke-Pester
    And it does not run playwright

  Scenario: Final verification failure triggers remediation cycle
    Given the first clean pass succeeds
    And the second clean pass fails on "pnpm lint"
    When the lint failure occurs
    Then a remediation cycle starts with the appropriate writer
    And the consecutive clean counter resets to 0

  Scenario: Final verification remediation cycle uses task-appropriate writers
    Given the final verification lint failure originates in a file modified by T2
    When the remediation cycle starts
    Then the test writer and code writer from T2's ticket are used for remediation

  Scenario: Final verification exhausts after MaxFixRounds remediation cycles
    Given the remediation cycle counter reaches 100 (MaxFixRounds) during final verification
    When another failure occurs
    Then Read-Escalation is called with context about final verification exhaustion
    And the pipeline halts for user input

# =============================================================================
# Stage 8 — Escalation (Read-Escalation)
# =============================================================================

Feature: Read-Escalation provides interactive recovery at all failure points
  A single reusable function handles all escalation scenarios

  Scenario: Escalation logs full context
    Given a GREEN phase exhaustion for task T2
    When Read-Escalation is called
    Then the log includes the ticket content for T2
    And the log includes the last failure output
    And the log includes the retry count (100)

  Scenario: Escalation presents Keep Going and Stop options
    Given Read-Escalation has been called
    When the interactive prompt appears
    Then the user sees a "Keep Going" option
    And the user sees a "Stop" option

  Scenario: Keep Going restarts only the failed task's cycle
    Given T1 and T2 ran in parallel in tier 1
    And T1 completed successfully
    And T2 escalated during GREEN phase
    When the user selects "Keep Going"
    Then T2's GREEN phase retry counter resets to zero
    And T1's completed state is preserved

  Scenario: Stop halts the entire pipeline
    Given Read-Escalation is active for task T2
    When the user selects "Stop"
    Then the pipeline halts immediately
    And no further tasks execute

  Scenario: Escalation is used for RED retry exhaustion
    Given the RED retry counter reaches MaxRedRetries (3)
    When escalation triggers
    Then Read-Escalation is called with the RED phase context
    And the failure reason indicates tests passed unexpectedly 3 times

  Scenario: Escalation is used for GREEN phase exhaustion
    Given the GREEN retry counter reaches MaxTddCycles (100)
    When escalation triggers
    Then Read-Escalation is called with the GREEN phase context
    And the failure reason indicates tests failed after 100 code writer attempts

  Scenario: Escalation is used for merge conflict exhaustion
    Given the merge-resolver has failed MaxMergeRetries (3) times
    When escalation triggers
    Then Read-Escalation is called with the merge conflict context
    And the failure reason includes both conflicting tickets

  Scenario: Escalation is used for cleanup exhaustion
    Given the cleanup remediation cycle counter reaches MaxFixRounds (100)
    When escalation triggers
    Then Read-Escalation is called with the cleanup context
    And the failure reason includes which verify command failed

  Scenario: Escalation during parallel execution gracefully terminates in-flight tasks
    Given tier 1 has tasks T1 and T2 running in parallel
    And T1 escalates during GREEN phase
    And T2 is still executing its RED phase
    When the user selects "Stop"
    Then T2's execution is gracefully terminated
    And both isolated workspaces are preserved for debugging
    And the pipeline halts

# =============================================================================
# Stage 8 — Logging (Write-TaskLog)
# =============================================================================

Feature: Write-TaskLog dual-writes to pipeline log and task log
  Logging goes to both the global pipeline.log and per-task log files

  Scenario: Pipeline log receives one-liner with task prefix
    Given task T3 completes its RED phase
    When Write-TaskLog is called
    Then "pipeline.log" receives a line like "[T3] RED passed - 2 test files written"
    And the line is timestamped with format "yyyy-MM-dd HH:mm:ss"

  Scenario: Task log receives full detail
    Given task T3 completes its RED phase with 2 test files
    When Write-TaskLog is called
    Then "docs/auth-flow/tickets/T3-log.txt" receives the full test output
    And file lists of modified files
    And Claude response summaries
    And all entries are timestamped

  Scenario: Task log is plain text and terminal-friendly
    Given Write-TaskLog has been called multiple times for T3
    When I read "docs/auth-flow/tickets/T3-log.txt"
    Then the content is plain text (no HTML, no ANSI codes)
    And entries are chronologically ordered

# =============================================================================
# Stage 8 — Invoke-Claude WorkDir Parameter
# =============================================================================

Feature: Invoke-Claude supports optional WorkDir parameter
  The WorkDir parameter translates to --cwd on the CLI

  Scenario: WorkDir parameter translates to --cwd
    Given Invoke-Claude is called with -WorkDir "wt/T1-user-login"
    When the CLI command is constructed
    Then the command includes "--cwd wt/T1-user-login"

  Scenario: WorkDir parameter is optional
    Given Invoke-Claude is called without -WorkDir
    When the CLI command is constructed
    Then the command does not include "--cwd"
    And the command runs in the current directory

# =============================================================================
# Stage 8 — Config Values
# =============================================================================

Feature: Config values for Stage 8
  Config includes all retry limits and verify commands

  Scenario: MaxMergeRetries defaults to 3
    Given the pipeline config is loaded
    When I read $Config.MaxMergeRetries
    Then the value is 3

  Scenario: MaxRedRetries defaults to 3
    Given the pipeline config is loaded
    When I read $Config.MaxRedRetries
    Then the value is 3

  Scenario: MaxTddCycles defaults to 100
    Given the pipeline config is loaded
    When I read $Config.MaxTddCycles
    Then the value is 100

  Scenario: CleanupPasses defaults to 2
    Given the pipeline config is loaded
    When I read $Config.CleanupPasses
    Then the value is 2

  Scenario: MaxFixRounds defaults to 100
    Given the pipeline config is loaded
    When I read $Config.MaxFixRounds
    Then the value is 100

  Scenario: Config does not contain MaxGreenRetries (canonical name is MaxTddCycles)
    Given the pipeline config is loaded
    When I inspect the config keys
    Then "MaxGreenRetries" is not present
    And "MaxTddCycles" is used for GREEN phase retry limits

# =============================================================================
# Edge Cases
# =============================================================================

Feature: Edge cases for Stage 8 coding orchestration
  Boundary conditions and special handling

  Scenario: Cross-package task uses correct projectRoot for verification
    Given task T1 targets "packages/ethang-hono" with testWriter "vitest"
    And task T2 targets "packages/vibe-cli" with testWriter "pester"
    When verification runs for each task
    Then T1 runs "pnpm test" in "packages/ethang-hono"
    And T2 runs "Invoke-Pester" with the config from "packages/vibe-cli/tests/pester.config.ps1"

  Scenario: Already-implemented functionality skips to cleanup
    Given the test writer writes tests for T1
    And the tests pass immediately in the RED phase
    And the test writer returns verdict "already_implemented"
    When the orchestrator processes the verdict
    Then the GREEN phase is skipped entirely
    And the cleanup phase runs normally

  Scenario: Cascading lint failures reset the clean counter each time
    Given the cleanup loop for T1 has 1 consecutive clean pass
    And "pnpm lint" fails on the second pass
    When the failure is detected
    Then the consecutive clean counter resets to 0
    And a remediation cycle runs to fix the lint issue
    And the cleanup loop restarts from scratch

  Scenario: Merge conflict in a tier signals possible missed dependency
    Given tier 1 has parallel tasks T1 and T2
    And both modify the same file "src/routes/index.ts"
    When T2's branch conflicts with the feature branch after T1 merged
    Then the task log for T2 notes "possible missed dependency in implementation plan"
    And the merge-resolver still attempts resolution

  Scenario: Multiple tiers execute in strict order
    Given an implementation plan with tiers 1, 2, and 3
    When Stage 8 executes
    Then tier 1 completes and merges before tier 2 starts
    And tier 2 completes and merges before tier 3 starts

  Scenario: Empty tier is handled gracefully
    Given an implementation plan where tier 2 has zero tasks
    When Stage 8 processes tier 2
    Then no isolated workspaces are created
    And no TDD cycles run
    And Stage 8 proceeds to tier 3

  Scenario: Writer JSON response with invalid schema is handled
    Given the code writer returns a response missing the "filesModified" field
    When the orchestrator parses the response
    Then the orchestrator detects the schema violation
    And retries the writer call with corrective guidance identifying the missing field
