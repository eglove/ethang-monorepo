# BDD Scenarios — Code Simplify (Stage 8 Rewrite)
# Date: 2026-04-11
# Source: docs/code-simplify/elicitor.md
#
# Glossary — Ubiquitous Language
#   Double-pass            — sequential pnpm test → pnpm lint, must both pass twice consecutively
#   Worktree               — git worktree used as an isolated workspace for parallel task execution
#   Tier                   — a group of tasks that can execute in parallel; tiers execute sequentially
#   Implementation plan    — docs/<feature>/implementation-plan.json with tier/task structure
#   Fixture coverage       — test files must reference BDD and TLA+ fixture entries; checked by string match
#   String match           — PowerShell searches test file contents for literal fixture entry names
#   Reviewer agent         — one of 8 specialized agents (a11y, ai-agent, bug, compliance, security, simplicity, test, type-design)
#   Review-moderator       — orchestrator agent that pre-filters reviewers, dispatches, and consolidates findings
#   Blocker                — a finding with severity critical or high that must be fixed before merge
#   Note                   — a non-blocking finding logged to user_notes.md
#   Verdict                — review-moderator's determination: "pass" or "fail"
#   user_notes.md          — docs/<feature>/user_notes.md, accumulated non-blocking notes and unresolved blockers
#   Pipeline log           — pipeline.log with timestamped entries and >>> MARKER resume points
#   Resume marker          — ">>> MARKER" formatted entry in pipeline.log marking a resumable checkpoint
#   MaxReviewRounds        — 3, maximum review-fix cycles per gate (per-worktree and global)
#   MaxDoublePassRetries   — 5, maximum Claude fix attempts per double-pass gate before user escalation
#   ReviewerTimeout        — 600s, max wall-clock time for a single reviewer agent invocation
#   ReviewModeratorTimeout — 300s, max wall-clock time for the moderator's own work
#   Pipeline lock          — pipeline.lock in the vibe-cli root, prevents concurrent runs; contains PID
#   Stale lock             — pipeline.lock whose PID refers to a process that is no longer running
#   Escalation             — user prompt with "Keep Going" / "Stop" options when retry limits are exhausted
#   Inline prompt          — Claude prompt embedded directly in 8-coding.ps1, no separate agent .md file
#   Dead Stage 8 code      — exactly: code-writers/, test-writers/, utils/pipeline-state.ps1, utils/tdd-cleanup.ps1

# =============================================================================
# Pre-Coding Gate
# =============================================================================

Feature: Pre-coding commit gate ensures clean working tree
  Stage 8 requires a clean git state before coding begins

  Scenario: Clean working tree passes the pre-coding gate
    Given the user's working tree has no uncommitted changes
    When Stage 8 starts for feature "auth-flow"
    Then the pre-coding gate passes
    And Stage 8 proceeds to fixture coverage check

  Scenario: Uncommitted changes prompt user to commit
    Given the user's working tree has uncommitted changes in "src/routes/auth.ts"
    When Stage 8 starts for feature "auth-flow"
    Then the user is prompted to commit the uncommitted changes
    And the prompt lists the changed files

  Scenario: User accepts commit of uncommitted changes
    Given the user's working tree has uncommitted changes
    And the user has been prompted to commit
    When the user accepts the commit
    Then the changes are committed
    And Stage 8 proceeds to fixture coverage check

  Scenario: User declines to commit uncommitted changes
    Given the user's working tree has uncommitted changes
    And the user has been prompted to commit
    When the user declines the commit
    Then the pipeline halts with message: "Pipeline halted: uncommitted changes must be committed before Stage 8 can proceed."
    And no tasks execute

# =============================================================================
# Pipeline Lock
# =============================================================================

Feature: Pipeline lock prevents concurrent Stage 8 runs
  A lock file guards against multiple pipeline instances

  Scenario: Lock file is acquired at Stage 8 start
    Given no pipeline.lock file exists
    When Stage 8 starts for feature "auth-flow"
    Then "pipeline.lock" is created in the vibe-cli root
    And the lock file contains the current process ID

  Scenario: Lock file is released on successful completion
    Given Stage 8 is running and holds "pipeline.lock"
    When Stage 8 completes successfully
    Then "pipeline.lock" is deleted

  Scenario: Lock file is released on pipeline halt
    Given Stage 8 is running and holds "pipeline.lock"
    When the user selects "Stop" during escalation
    Then "pipeline.lock" is deleted

  Scenario: Lock file is released on pipeline crash via finally block
    Given Stage 8 is running and holds "pipeline.lock"
    When the pipeline crashes with an unhandled error
    Then the finally block deletes "pipeline.lock"

  Scenario: Concurrent run is rejected while lock is held
    Given Stage 8 is running and holds "pipeline.lock" with PID 5678
    When a second pipeline invocation starts
    Then the second invocation exits with error mentioning PID 5678
    And no changes are made to the first run's state

  Scenario: Stale lock from dead process is reclaimed
    Given "pipeline.lock" exists with PID 9999
    And no process with PID 9999 is running
    When Stage 8 starts for feature "auth-flow"
    Then a warning is logged: "Stale pipeline.lock detected (PID 9999 not running), reclaiming"
    And "pipeline.lock" is overwritten with the current process ID
    And Stage 8 proceeds normally

  Scenario: Resume reclaims stale lock from crashed run
    Given "pipeline.lock" exists with PID 9999 from a previous crashed run
    And no process with PID 9999 is running
    And pipeline.log contains marker "TIER_1_COMPLETE"
    When the user runs the pipeline with --resume
    Then the stale lock is reclaimed with the current process ID
    And the pipeline resumes from the "TIER_1_COMPLETE" marker

# =============================================================================
# Input Validation
# =============================================================================

Feature: Input validation rejects missing or malformed required files
  Stage 8 validates inputs before dispatching Claude

  Scenario: Fixture file not found on disk
    Given "tests/fixtures/bdd/fixture.json" does not exist on disk
    When the fixture coverage check runs
    Then the pipeline halts with message: "Fixture file not found: tests/fixtures/bdd/fixture.json"
    And no tasks execute

  Scenario: TLA+ fixture file not found on disk
    Given "tests/fixtures/tla/fixture.json" does not exist on disk
    When the fixture coverage check runs
    Then the pipeline halts with message: "Fixture file not found: tests/fixtures/tla/fixture.json"
    And no tasks execute

  Scenario: implementation-plan.json does not exist
    Given "docs/auth-flow/implementation-plan.json" does not exist
    When Stage 8 attempts to dispatch Claude for feature "auth-flow"
    Then the pipeline halts with message: "Implementation plan not found: docs/auth-flow/implementation-plan.json"
    And no tasks execute

  Scenario: implementation-plan.json contains zero tiers
    Given "docs/auth-flow/implementation-plan.json" exists with an empty tiers array
    When Stage 8 attempts to dispatch Claude for feature "auth-flow"
    Then the pipeline halts with message: "Implementation plan has no tiers: docs/auth-flow/implementation-plan.json"
    And no tasks execute

  Scenario: implementation-plan.json contains a tier with zero tasks
    Given "docs/auth-flow/implementation-plan.json" has tier 1 with 0 tasks
    When Stage 8 attempts to dispatch Claude for feature "auth-flow"
    Then the pipeline halts with message: "Tier 1 has no tasks in implementation plan"
    And no tasks execute

  Scenario: implementation-plan.json is malformed JSON
    Given "docs/auth-flow/implementation-plan.json" contains invalid JSON syntax
    When Stage 8 attempts to dispatch Claude for feature "auth-flow"
    Then the pipeline halts with message: "Failed to parse implementation plan: docs/auth-flow/implementation-plan.json"
    And no tasks execute

  Scenario: Reviewer returns malformed non-JSON response
    Given the "bug" reviewer returns a response that is not valid JSON
    When the review-moderator attempts to parse the response
    Then a warning is logged: "Reviewer bug returned malformed response, skipping"
    And the moderator consolidates results from the remaining reviewers

# =============================================================================
# Fixture Coverage Check
# =============================================================================

Feature: Fixture coverage check validates test references via string match
  PowerShell searches test file contents for literal fixture entry names

  Scenario: All fixtures are covered by tests
    Given "tests/fixtures/bdd/fixture.json" contains entries ["login-success", "login-failure"]
    And "tests/fixtures/tla/fixture.json" contains entries ["Authenticate", "Reject"]
    And existing test files contain the strings "login-success", "login-failure", "Authenticate", and "Reject"
    When the fixture coverage check runs
    Then the check passes
    And Stage 8 proceeds to Claude implementation dispatch

  Scenario: Missing BDD fixture coverage is sent to Claude
    Given "tests/fixtures/bdd/fixture.json" contains entries ["login-success", "login-failure", "login-lockout"]
    And existing test files contain "login-success" and "login-failure" but not "login-lockout"
    When the fixture coverage check runs
    Then the uncovered fixture list ["login-lockout"] is sent to Claude
    And Claude is instructed to write tests covering the missing fixtures

  Scenario: Missing TLA+ fixture coverage is sent to Claude
    Given "tests/fixtures/tla/fixture.json" contains entries ["Authenticate", "Reject", "Timeout"]
    And existing test files contain "Authenticate" but not "Reject" or "Timeout"
    When the fixture coverage check runs
    Then the uncovered fixture list ["Reject", "Timeout"] is sent to Claude
    And Claude is instructed to write tests covering the missing fixtures

  Scenario: Empty BDD fixture file skips BDD coverage check
    Given "tests/fixtures/bdd/fixture.json" contains an empty array
    And "tests/fixtures/tla/fixture.json" contains entries ["Authenticate"]
    When the fixture coverage check runs
    Then the BDD coverage check is skipped
    And a warning is logged: "BDD fixture file is empty, skipping BDD coverage check"
    And the TLA+ coverage check still runs

  Scenario: Empty TLA+ fixture file skips TLA+ coverage check
    Given "tests/fixtures/tla/fixture.json" contains an empty array
    And "tests/fixtures/bdd/fixture.json" contains entries ["login-success"]
    When the fixture coverage check runs
    Then the TLA+ coverage check is skipped
    And a warning is logged: "TLA+ fixture file is empty, skipping TLA+ coverage check"
    And the BDD coverage check still runs

  Scenario: Both fixture files are empty
    Given "tests/fixtures/bdd/fixture.json" contains an empty array
    And "tests/fixtures/tla/fixture.json" contains an empty array
    When the fixture coverage check runs
    Then both coverage checks are skipped
    And warnings are logged for both empty fixture files
    And Stage 8 proceeds to Claude implementation dispatch

# =============================================================================
# Claude Implementation Dispatch
# =============================================================================

Feature: Claude receives an inline prompt for implementation dispatch
  Stage 8 sends an inline prompt to Claude for coding; no separate agent .md file

  Scenario: Claude receives implementation plan and feature docs
    Given "docs/auth-flow/implementation-plan.json" exists with 2 tiers and 3 tasks
    And "docs/auth-flow/" contains elicitor, BDD, and TLA+ spec files
    When Stage 8 dispatches Claude for implementation
    Then the inline prompt includes the contents of "implementation-plan.json"
    And the inline prompt includes the full feature docs directory path

  Scenario: Claude receives BDD and TLA+ fixture files
    Given "tests/fixtures/bdd/fixture.json" exists
    And "tests/fixtures/tla/fixture.json" exists
    When Stage 8 dispatches Claude for implementation
    Then the inline prompt references both fixture files

  Scenario: Worktrees exist for each task after multi-task tier completes
    Given an implementation plan with tier 1 containing tasks T1, T2, and T3
    When Claude completes tier 1
    Then worktrees "wt/T1", "wt/T2", and "wt/T3" exist on disk
    And each worktree contains a branch with committed changes

  Scenario: Worktree branches remain unmerged after Claude completes
    Given Claude has completed tasks T1 and T2 in worktrees
    When PowerShell checks for worktree branches
    Then none of the worktree branches have been merged to the feature branch
    And PowerShell takes over for verification and merge

  Scenario: Tier 2 worktrees are not created until tier 1 is fully merged
    Given an implementation plan with tier 1 (tasks T1, T2) and tier 2 (task T3)
    When Claude completes tier 1 and PowerShell merges T1 and T2
    Then tier 2 dispatch begins
    And worktree "wt/T3" is created for tier 2

# =============================================================================
# No Worktrees Edge Case
# =============================================================================

Feature: Single-task execution without worktrees
  Claude may work directly on the feature branch for small tasks

  Scenario: Claude works on feature branch without creating worktrees
    Given the implementation plan has a single small task T1
    When Claude completes the implementation
    And PowerShell checks for worktrees
    Then no worktrees are found
    And PowerShell skips per-worktree gates
    And PowerShell proceeds directly to global double-pass

  Scenario: Global double-pass runs when no worktrees exist
    Given Claude completed work directly on the feature branch
    And no worktrees were created
    When PowerShell runs the global verification
    Then "pnpm test" runs on the feature branch
    And "pnpm lint" runs on the feature branch
    And both must pass twice consecutively

# =============================================================================
# Per-Worktree Double-Pass
# =============================================================================

Feature: Per-worktree double-pass verifies each task independently
  PowerShell runs pnpm test → pnpm lint on each worktree after Claude completes

  Scenario: Double-pass succeeds on first attempt
    Given Claude has completed task T1 in worktree "wt/T1-user-login"
    When PowerShell runs "pnpm test" in "wt/T1-user-login"
    And "pnpm test" passes
    And PowerShell runs "pnpm lint" in "wt/T1-user-login"
    And "pnpm lint" passes
    And the sequence passes a second consecutive time
    Then the per-worktree double-pass succeeds for T1

  Scenario: Test failure sends error output to Claude for fix
    Given Claude has completed task T1 in worktree "wt/T1-user-login"
    And the double-pass retry counter is at 0
    When PowerShell runs "pnpm test" in "wt/T1-user-login"
    And "pnpm test" fails with error output
    Then the error output is sent back to Claude to fix
    And the consecutive pass counter resets to 0
    And the double-pass retry counter increments to 1

  Scenario: Lint failure on second pass sends output to Claude for fix
    Given the first pass (test + lint) succeeded for T1
    When the second pass runs "pnpm test" (passes) then "pnpm lint" (fails)
    Then the lint error output is sent back to Claude to fix
    And the consecutive pass counter resets to 0
    And the double-pass retry counter increments

  Scenario: MaxDoublePassRetries reached per worktree escalates to user
    Given task T1 in worktree "wt/T1-user-login" has failed the double-pass 5 times (MaxDoublePassRetries = 5)
    When the 5th fix attempt still fails
    Then the pipeline escalates to the user
    And the user is presented with "Keep Going" and "Stop" options
    And the escalation message includes the last error output

  Scenario: User selects Keep Going after max double-pass retries
    Given escalation is active for T1 after 5 double-pass retries
    When the user selects "Keep Going"
    Then the double-pass failure is logged to "docs/auth-flow/user_notes.md"
    And T1 proceeds to per-worktree reviewer dispatch

  Scenario: User selects Stop after max double-pass retries
    Given escalation is active for T1 after 5 double-pass retries
    When the user selects "Stop"
    Then the pipeline halts
    And "pipeline.lock" is released

# =============================================================================
# Per-Worktree Reviewer Dispatch
# =============================================================================

Feature: Per-worktree reviewer dispatch audits each task after double-pass
  PowerShell dispatches reviewers via review-loop.ps1 for each passing worktree

  Scenario: Reviewers are dispatched after per-worktree double-pass succeeds
    Given task T1 in worktree "wt/T1-user-login" has passed the double-pass
    When PowerShell invokes review-loop.ps1 for T1
    Then the review-moderator receives the T1 diff
    And the review-moderator pre-filters the 8 reviewer agents

  Scenario: Pre-filter excludes all reviewers
    Given the review-moderator determines no reviewers are relevant for the T1 diff
    When the pre-filter completes
    Then the verdict is "pass"
    And no individual reviewer agents are dispatched
    And T1 proceeds to the merge queue

  Scenario: All reviewers return empty findings
    Given the review-moderator dispatched 3 relevant reviewers for T1
    And all 3 reviewers return empty findings arrays
    When the moderator consolidates the results
    Then the verdict is "pass"
    And T1 proceeds to the merge queue

  Scenario: Reviewer finds blockers
    Given the "security" reviewer returns a finding with severity "critical"
    When the review-moderator consolidates results
    Then the verdict is "fail"
    And the blocker details are sent back to Claude for TDD fix

  Scenario: Reviewer finds only notes (non-blocking)
    Given the "simplicity" reviewer returns findings with severity "medium" and "low"
    And no other reviewer returns critical or high findings
    When the review-moderator consolidates results
    Then the verdict is "pass"
    And the non-blocking notes are written to "docs/auth-flow/user_notes.md"

  Scenario: Blocker fix triggers double-pass then re-review
    Given a blocker was found in T1's review
    And Claude has fixed the blocker
    When PowerShell re-runs the per-worktree double-pass for T1
    And the double-pass succeeds
    Then reviewers are dispatched again for T1

  Scenario: MaxReviewRounds reached per worktree
    Given T1 has failed review 3 times (MaxReviewRounds = 3)
    When the 3rd review round fails with blockers
    Then the pipeline escalates to the user
    And the user is presented with "Keep Going" and "Stop" options

  Scenario: User selects Keep Going after max review rounds
    Given escalation is active for T1 after 3 review rounds
    When the user selects "Keep Going"
    Then the remaining blocker issues are logged to "docs/auth-flow/user_notes.md"
    And T1 proceeds to the merge queue

  Scenario: User selects Stop after max review rounds
    Given escalation is active for T1 after 3 review rounds
    When the user selects "Stop"
    Then the pipeline halts
    And "pipeline.lock" is released

# =============================================================================
# Reviewer Agents
# =============================================================================

Feature: Eight reviewer agents exist in agents/reviewers/
  Each reviewer is a specialized .md agent file

  Scenario: All 8 reviewer agent files exist
    Given the pipeline is installed
    Then the file "agents/reviewers/a11y.md" exists
    And the file "agents/reviewers/ai-agent.md" exists
    And the file "agents/reviewers/bug.md" exists
    And the file "agents/reviewers/compliance.md" exists
    And the file "agents/reviewers/security.md" exists
    And the file "agents/reviewers/simplicity.md" exists
    And the file "agents/reviewers/test.md" exists
    And the file "agents/reviewers/type-design.md" exists

  Scenario: Each reviewer agent receives a diff as input
    Given the review-moderator has pre-filtered the "bug" reviewer as relevant
    When the "bug" reviewer is dispatched
    Then it receives the worktree diff as its primary input

  Scenario: Each reviewer agent returns structured JSON findings
    Given the "test" reviewer has audited a diff
    When the reviewer responds
    Then the response is valid JSON with a "findings" array
    And each finding has fields: "severity", "description", "files", "suggestion"
    And "severity" is one of "critical", "high", "medium", "low"

# =============================================================================
# Review-Moderator
# =============================================================================

Feature: Review-moderator orchestrates reviewer dispatch and consolidation
  agents/review-moderator.md pre-filters, dispatches, and triages findings

  Scenario: Review-moderator agent file exists
    Given the pipeline is installed
    Then the file "agents/review-moderator.md" exists

  Scenario: Moderator pre-filters reviewers based on diff content
    Given a diff that modifies only TypeScript source files in "src/api/"
    When the review-moderator runs pre-filter
    Then it excludes the "a11y" reviewer
    And it selects at least the "bug", "type-design", and "test" reviewers

  Scenario: Moderator dispatches selected reviewers in parallel
    Given the pre-filter selected reviewers: bug, security, test
    When the moderator dispatches reviewers
    Then all 3 reviewers run concurrently
    And the moderator waits for all to respond or timeout

  Scenario: Moderator consolidates findings into pass or fail
    Given the "bug" reviewer returned 1 critical finding
    And the "test" reviewer returned 2 low findings
    And the "security" reviewer returned 0 findings
    When the moderator consolidates
    Then the verdict is "fail" due to the critical finding
    And the critical finding is flagged as a blocker
    And the 2 low findings are flagged as notes

# =============================================================================
# Reviewer and Moderator Timeouts
# =============================================================================

Feature: Reviewer and moderator timeouts prevent pipeline stalls
  Timeouts ensure individual failures don't block the entire pipeline

  Scenario: Single reviewer times out at 600s
    Given the review-moderator dispatched reviewers: bug, security, a11y
    And the "a11y" reviewer has not responded after 600 seconds
    When the ReviewerTimeout fires for "a11y"
    Then a warning is logged: "Reviewer a11y timed out after 600s"
    And the moderator consolidates results from "bug" and "security" only
    And the pipeline proceeds

  Scenario: Multiple reviewers time out
    Given the review-moderator dispatched reviewers: bug, security, a11y
    And "security" and "a11y" both time out after 600 seconds
    When the moderator consolidates
    Then warnings are logged for both timed-out reviewers
    And the moderator consolidates results from "bug" only

  Scenario: All reviewers time out
    Given the review-moderator dispatched reviewers: bug, security
    And both reviewers time out after 600 seconds
    When the moderator consolidates
    Then warnings are logged for both
    And the verdict is "pass" (no findings to evaluate)
    And a warning is logged: "All reviewers timed out, no review performed"
    And an entry is written to "docs/auth-flow/user_notes.md" noting that no reviewer actually ran

  Scenario: Moderator times out at 300s
    Given reviewers have returned their findings
    And the review-moderator has not produced a verdict after 300 seconds
    When the ReviewModeratorTimeout fires
    Then the verdict is treated as "pass"
    And a warning is logged: "Review-moderator timed out after 300s, treating as pass"
    And the pipeline proceeds

# =============================================================================
# Review-Loop Utility
# =============================================================================

Feature: review-loop.ps1 manages dispatch, consolidation, and user_notes.md
  utils/review-loop.ps1 is the PowerShell utility for reviewer orchestration

  Scenario: review-loop.ps1 dispatches the review-moderator
    Given task T1 has passed the double-pass
    When review-loop.ps1 is invoked for T1
    Then it dispatches the review-moderator agent with the T1 diff

  Scenario: review-loop.ps1 writes notes to user_notes.md on pass with notes
    Given the review-moderator returns verdict "pass" with 2 non-blocking notes
    When review-loop.ps1 processes the result
    Then it appends the 2 notes to "docs/auth-flow/user_notes.md"
    And each note includes the reviewer name, severity, description, and suggestion

  Scenario: review-loop.ps1 writes unresolved blockers to user_notes.md on Keep Going
    Given the user selected "Keep Going" after MaxReviewRounds
    And 1 unresolved blocker remains from the "security" reviewer
    When review-loop.ps1 processes the Keep Going decision
    Then it appends the unresolved blocker to "docs/auth-flow/user_notes.md"
    And the entry is marked as an unresolved escalated blocker

  Scenario: review-loop.ps1 does not write to user_notes.md on clean pass
    Given the review-moderator returns verdict "pass" with 0 findings
    When review-loop.ps1 processes the result
    Then "docs/auth-flow/user_notes.md" is not modified

# =============================================================================
# Sequential Merge
# =============================================================================

Feature: Sequential merge integrates worktree branches in task order
  PowerShell merges worktree branches to the feature branch one at a time in task number order

  Scenario: Worktrees merge in task number order
    Given tasks T1, T2, and T3 completed in worktrees
    And all have passed per-worktree double-pass and review
    When PowerShell begins sequential merge
    Then T1's branch merges first
    And T2's branch merges second
    And T3's branch merges third

  Scenario: Clean merge proceeds without intervention
    Given T1's worktree branch has no conflicts with the feature branch
    When PowerShell merges T1's branch
    Then the merge completes successfully
    And PowerShell proceeds to merge T2's branch

  Scenario: Merge conflict is sent to Claude for resolution
    Given T2's worktree branch conflicts with the feature branch after T1's merge
    When PowerShell attempts to merge T2's branch
    Then the conflict details are sent to Claude to resolve
    And Claude resolves the merge conflict

  Scenario: Double-pass runs on feature branch after conflict resolution
    Given Claude resolved a merge conflict for T2
    When the conflict resolution is complete
    Then PowerShell runs "pnpm test" on the feature branch
    And PowerShell runs "pnpm lint" on the feature branch
    And both must pass twice consecutively before continuing to T3's merge

  Scenario: Double-pass failure after conflict resolution sends output to Claude
    Given Claude resolved a merge conflict for T2
    And the post-resolution double-pass fails
    When the error output is sent to Claude to fix
    Then Claude applies a fix on the feature branch
    And PowerShell re-runs the double-pass

  Scenario: MaxDoublePassRetries reached after conflict resolution escalates to user
    Given Claude resolved a merge conflict for T2
    And the post-resolution double-pass has failed 5 times (MaxDoublePassRetries = 5)
    When the 5th fix attempt still fails
    Then the pipeline escalates to the user
    And the user is presented with "Keep Going" and "Stop" options

  Scenario: Merge conflict resolution failure escalates to user
    Given T2's worktree branch conflicts with the feature branch
    And Claude cannot resolve the conflict after attempting resolution
    When Claude signals that it cannot resolve the conflict
    Then the pipeline escalates to the user
    And the user is presented with "Keep Going" and "Stop" options
    And the escalation message includes the conflicting files

  Scenario: No full re-review after conflict resolution
    Given Claude resolved a merge conflict for T2
    And the double-pass on the feature branch passed
    When PowerShell continues the merge sequence
    Then no reviewer dispatch occurs for the conflict resolution
    And PowerShell proceeds to merge T3's branch

# =============================================================================
# Bulk Worktree Cleanup
# =============================================================================

Feature: Bulk worktree cleanup removes all worktrees after merge
  PowerShell cleans up all task worktrees after sequential merge completes

  Scenario: All worktrees are removed after successful merge
    Given tasks T1, T2, T3 were executed in worktrees
    And all branches have been merged to the feature branch
    When bulk worktree cleanup runs
    Then worktree "wt/T1" is removed
    And worktree "wt/T2" is removed
    And worktree "wt/T3" is removed
    And no orphaned worktrees remain

  Scenario: Worktree cleanup failure logs warning and continues
    Given worktree "wt/T2" cannot be removed due to a locked directory
    When bulk worktree cleanup attempts to remove "wt/T2"
    Then a warning is logged: "Failed to remove worktree wt/T2, manual cleanup required"
    And cleanup continues with "wt/T3"
    And the pipeline does not halt

# =============================================================================
# Global Double-Pass
# =============================================================================

Feature: Global double-pass verifies the merged feature branch
  After all merges, PowerShell runs pnpm test → pnpm lint on the feature branch

  Scenario: Global double-pass succeeds
    Given all worktree branches have been merged to the feature branch
    When PowerShell runs "pnpm test" on the feature branch
    And "pnpm test" passes
    And PowerShell runs "pnpm lint" on the feature branch
    And "pnpm lint" passes
    And the sequence passes a second consecutive time
    Then the global double-pass succeeds
    And PowerShell proceeds to global reviewer dispatch

  Scenario: Global double-pass failure sends output to Claude
    Given all worktree branches have been merged to the feature branch
    When "pnpm test" fails on the feature branch
    Then the error output is sent to Claude to fix
    And the consecutive pass counter resets to 0
    And the global double-pass retry counter increments

  Scenario: MaxDoublePassRetries reached at global level escalates to user
    Given the global double-pass has failed 5 times (MaxDoublePassRetries = 5)
    When the 5th fix attempt still fails
    Then the pipeline escalates to the user
    And the user is presented with "Keep Going" and "Stop" options

  Scenario: User selects Keep Going after max global double-pass retries
    Given escalation is active after 5 global double-pass retries
    When the user selects "Keep Going"
    Then the double-pass failure is logged to "docs/auth-flow/user_notes.md"
    And PowerShell proceeds to global reviewer dispatch

  Scenario: User selects Stop after max global double-pass retries
    Given escalation is active after 5 global double-pass retries
    When the user selects "Stop"
    Then the pipeline halts
    And "pipeline.lock" is released

# =============================================================================
# Global Reviewer Dispatch
# =============================================================================

Feature: Global reviewer dispatch audits the full merged diff
  PowerShell dispatches reviewers for the entire feature branch diff after global double-pass

  Scenario: Global reviewers are dispatched after global double-pass
    Given the global double-pass has succeeded
    When PowerShell invokes review-loop.ps1 for the full feature branch diff
    Then the review-moderator receives the full diff against the base branch

  Scenario: Global review pass completes Stage 8
    Given the global reviewer dispatch returns verdict "pass"
    When review-loop.ps1 processes the result
    Then Stage 8 is complete
    And "pipeline.lock" is released
    And a ">>> PIPELINE COMPLETE" marker is logged

  Scenario: Global review blocker triggers fix cycle
    Given the global reviewer dispatch returns verdict "fail" with blockers
    When review-loop.ps1 processes the result
    Then the blocker details are sent to Claude for TDD fix
    And after Claude's fix, the global double-pass re-runs
    And then global reviewers are dispatched again

  Scenario: MaxReviewRounds reached at global level
    Given the global review has failed 3 times (MaxReviewRounds = 3)
    When the 3rd global review fails with blockers
    Then the pipeline escalates to the user
    And the user is presented with "Keep Going" and "Stop" options

  Scenario: Keep Going at global level logs issues and completes
    Given escalation is active after 3 global review rounds
    When the user selects "Keep Going"
    Then remaining blocker issues are logged to "docs/auth-flow/user_notes.md"
    And Stage 8 completes
    And "pipeline.lock" is released

  Scenario: Stop at global level halts the pipeline
    Given escalation is active after 3 global review rounds
    When the user selects "Stop"
    Then the pipeline halts
    And "pipeline.lock" is released
    And a ">>> PIPELINE HALTED" marker is logged

# =============================================================================
# Logging and Resume
# =============================================================================

Feature: Verbose logging with resume markers supports crash recovery
  All output goes to console and pipeline.log simultaneously with >>> MARKER entries

  Scenario: Log entries go to both console and pipeline.log
    Given Stage 8 is running for feature "auth-flow"
    When a log message "Starting fixture coverage check" is emitted
    Then the message appears on the console
    And the message is appended to "pipeline.log"

  Scenario: Resume markers are written at major checkpoints
    Given Stage 8 is running for feature "auth-flow"
    When the pre-coding gate passes
    Then a ">>> MARKER" entry is written to pipeline.log
    And the marker includes a timestamp and phase name

  Scenario: Resume markers are written after each tier completes
    Given tier 1 tasks have all merged successfully
    When the pipeline advances to tier 2
    Then a ">>> MARKER TIER_1_COMPLETE" entry is written to pipeline.log

  Scenario: Resume markers are written after global double-pass
    Given the global double-pass has succeeded
    When the pipeline proceeds to global reviewer dispatch
    Then a ">>> MARKER GLOBAL_DOUBLEPASS_COMPLETE" entry is written to pipeline.log

  Scenario: --resume reads the last marker from pipeline.log
    Given pipeline.log contains markers for TIER_1_COMPLETE and TIER_2_COMPLETE
    And the pipeline crashed after TIER_2_COMPLETE
    When the user runs the pipeline with --resume
    Then the pipeline reads the last marker "TIER_2_COMPLETE"
    And resumes execution from the global double-pass phase

  Scenario: --resume with no pipeline.log starts from the beginning
    Given no pipeline.log file exists
    When the user runs the pipeline with --resume
    Then the pipeline starts from the beginning
    And a warning is logged: "No pipeline.log found, starting fresh"

  Scenario: --resume during merge phase detects completed merges
    Given pipeline.log contains markers for TIER_1_COMPLETE
    And T1's branch has already been merged to the feature branch
    And T2's branch has not been merged
    When the user runs the pipeline with --resume
    Then the pipeline skips T1's merge
    And resumes sequential merge from T2's branch

  Scenario: --resume detects and reuses existing worktrees
    Given the pipeline crashed during tier 1 execution
    And worktrees for T1 and T2 still exist on disk
    When the pipeline resumes with --resume
    Then the inline prompt informs Claude that worktrees "wt/T1" and "wt/T2" exist
    And Claude inspects the existing worktree state to determine what is complete

# =============================================================================
# user_notes.md Output
# =============================================================================

Feature: user_notes.md accumulates non-blocking notes and unresolved blockers
  docs/<feature>/user_notes.md is the human-readable output of review findings

  Scenario: user_notes.md is created on first note
    Given "docs/auth-flow/user_notes.md" does not exist
    And the per-worktree review for T1 produces 1 non-blocking note
    When review-loop.ps1 writes the note
    Then "docs/auth-flow/user_notes.md" is created
    And it contains the note with reviewer name, severity, description, and suggestion

  Scenario: Subsequent notes are appended
    Given "docs/auth-flow/user_notes.md" already contains notes from T1's review
    And the per-worktree review for T2 produces 2 non-blocking notes
    When review-loop.ps1 writes the T2 notes
    Then the T2 notes are appended after the T1 notes
    And the T1 notes are not modified

  Scenario: Unresolved blocker is written with escalation context
    Given the user selected "Keep Going" for T3 after MaxReviewRounds
    And 1 unresolved "critical" blocker from the "security" reviewer remains
    When review-loop.ps1 writes the escalated blocker
    Then user_notes.md contains a section marked as "Unresolved Escalated Blocker"
    And the entry includes the reviewer name "security"
    And the entry includes the severity "critical"
    And the entry includes the full description and suggestion

# =============================================================================
# File Deletions
# =============================================================================

Feature: Dead Stage 8 code is deleted
  The rewrite removes exactly four items: code-writers/, test-writers/,
  utils/pipeline-state.ps1, and utils/tdd-cleanup.ps1.
  These four constitute the complete deletion set.

  Scenario: code-writers directory is deleted
    Given the "code-writers/" directory exists
    When the code-simplify implementation runs
    Then the "code-writers/" directory no longer exists

  Scenario: test-writers directory is deleted
    Given the "test-writers/" directory exists
    When the code-simplify implementation runs
    Then the "test-writers/" directory no longer exists

  Scenario: pipeline-state.ps1 is deleted
    Given the file "utils/pipeline-state.ps1" exists
    When the code-simplify implementation runs
    Then "utils/pipeline-state.ps1" no longer exists

  Scenario: tdd-cleanup.ps1 is deleted
    Given the file "utils/tdd-cleanup.ps1" exists
    When the code-simplify implementation runs
    Then "utils/tdd-cleanup.ps1" no longer exists

  Scenario: doc-writers directory is preserved
    Given the "doc-writers/" directory exists
    When the code-simplify implementation runs
    Then "doc-writers/" still exists
    And its contents are unchanged

  Scenario: experts directory is preserved
    Given the "experts/" directory exists
    When the code-simplify implementation runs
    Then "experts/" still exists
    And its contents are unchanged

# =============================================================================
# New File Creation
# =============================================================================

Feature: New files are created for the rewrite
  The rewrite produces new reviewer agents, moderator, and utility files

  Scenario: 8-coding.ps1 is rewritten to under 10KB
    Given the existing "stages/8-coding.ps1" is approximately 28KB
    When the code-simplify implementation runs
    Then "stages/8-coding.ps1" exists
    And its file size is under 10KB
    And it contains an inline Claude prompt (not references to agent .md files for implementation)

  Scenario: review-loop.ps1 is created with dispatch and notes functions
    Given "utils/review-loop.ps1" does not exist
    When the code-simplify implementation runs
    Then "utils/review-loop.ps1" exists
    And it exports a function named "Invoke-ReviewLoop"
    And it exports a function named "Write-UserNotes"
