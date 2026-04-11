# BDD Scenarios — Pipeline Reviewers & Resume
# Date: 2026-04-10
# Source: docs/reviewers/elicitor.md
# Revision: Addresses all 20 debate objections (bdd-debate.md)
#
# Elicitor Traceability Note:
#   The following behaviors were inferred during BDD authoring (not explicit in elicitor.md)
#   and validated during debate as necessary for correctness:
#     - ReviewGateTimeout (wall-clock cap per review gate)
#     - MaxKeepGoingResets (livelock prevention)
#     - MaxTddKeepGoingPerGate (TDD livelock prevention within review-fix)
#     - Agent-writer tasks skip review gate (inherited from Stage 8 lifecycle)
#     - Merge queue interaction after review pass (handoff to existing merge logic)
#     - Corrupted pipeline.log handling on --resume (robustness)
#     - Feature branch HEAD verification before final review fix cycle (safety)
#     - Pipeline mutual exclusion via lock file (concurrency safety on Windows)
#     - PipelineTimeoutSeconds as global wall-clock ceiling (liveness guarantee)
#     - Diff-base staleness detection after concurrent merges
#     - COMPLETE/HALTED as absorbing terminal states
#     - Config load-time validation for degenerate parameter combinations
#
# Glossary — Ubiquitous Language
#   Reviewer agent         — one of 8 specialized agents that audits a diff for domain-specific issues
#   Review-moderator       — orchestrator agent that pre-filters reviewers, dispatches, and triages findings
#   Pre-merge review       — review gate after cleanup passes, before a task enters the merge queue
#   Post-merge final review — review gate after final verification double-pass on the merged codebase
#   Review-fix cycle       — Review fail -> RED -> GREEN -> Cleanup -> re-review loop
#   Blocker                — a finding with severity critical or high that must be fixed before merge
#   Note                   — a non-blocking finding (medium or low) logged to user_notes.md
#   Verdict                — review-moderator's final determination: "pass" or "fail"
#   Finding                — a single issue reported by a reviewer agent
#   user_notes.md          — accumulated non-blocking notes and unresolved blockers, per feature
#   Seed                   — the initial prompt that starts a fresh pipeline run
#   Pipeline log           — structured log at pipeline.log with timestamped phase markers
#   ReviewerTimeout        — max wall-clock time for a single reviewer agent invocation (600s)
#   ReviewModeratorTimeout — max wall-clock time for the moderator's own work (pre-filter + consolidation), excluding reviewer dispatch wait time
#   Retry-review           — re-running the full review (all reviewers re-dispatched from scratch) after a moderator timeout or malformed-JSON failure; distinct from a post-fix re-review
#   ReviewGateTimeout      — max cumulative wall-clock for the entire review gate (pre-filter + dispatch + consolidation + any retry-reviews), defaults to 1800s
#   MaxKeepGoingResets     — max consecutive Keep Going resets on the same review gate before forced stop, defaults to 3
#   MaxTddKeepGoingPerGate — max TDD Keep Going selections within a single review gate before forced escalation, defaults to 5
#   Parse failure          — reviewer or moderator output is not valid JSON (truncated, binary, non-JSON text)
#   Schema violation       — reviewer or moderator output is valid JSON but missing required fields or containing wrong types
#   Lock file              — pipeline.lock in the vibe-cli root, prevents concurrent pipeline instances
#   Absorbing state        — a terminal pipeline state (COMPLETE or HALTED) from which no further transitions occur

# =============================================================================
# Pipeline Mutual Exclusion
# =============================================================================

Feature: Pipeline mutual exclusion prevents concurrent instances
  Only one pipeline instance may run at a time to prevent shared-state corruption

  Scenario: Pipeline acquires lock file on start
    Given no pipeline is currently running
    When the user runs "./vibe.ps1 'Add auth'"
    Then the pipeline creates "pipeline.lock" in the vibe-cli root
    And the lock file contains the process ID and start timestamp

  Scenario: Second pipeline invocation is rejected while lock is held
    Given a pipeline is running with seed "Add auth" and holds "pipeline.lock"
    When the user runs "./vibe.ps1 'Another feature'" in a second terminal
    Then the second invocation exits with error: "Pipeline already running (PID <pid>). Use --resume after it completes or terminate it first."
    And no changes are made to pipeline.log

  Scenario: --resume is rejected while lock is held
    Given a pipeline is running and holds "pipeline.lock"
    When the user runs "./vibe.ps1 --resume" in a second terminal
    Then the invocation exits with error: "Pipeline already running (PID <pid>). Cannot resume while active."

  Scenario: Lock file is released on normal pipeline completion
    Given a pipeline run completes successfully
    When the pipeline records PIPELINE COMPLETE
    Then "pipeline.lock" is deleted

  Scenario: Lock file is released on pipeline halt
    Given a pipeline run halts via user Stop selection
    When the pipeline records PIPELINE HALTED
    Then "pipeline.lock" is deleted

  Scenario: Stale lock file from crashed process is detected
    Given "pipeline.lock" exists with PID 12345
    And process 12345 is not running
    When the user runs "./vibe.ps1 'New feature'"
    Then the stale lock file is deleted
    And a warning is logged: "Removed stale lock from crashed process 12345"
    And the new pipeline starts normally

  Scenario: Lock file with active process is not overridden
    Given "pipeline.lock" exists with PID 12345
    And process 12345 is running
    When the user runs "./vibe.ps1 'New feature'"
    Then the invocation exits with the concurrent-run error
    And the lock file is not modified

  Scenario: Concurrent user_notes.md writes are serialized
    Given tasks T1 and T2 complete pre-merge review concurrently
    And both reviews produce non-blocking notes
    When both review gates write to user_notes.md
    Then writes are serialized (not interleaved)
    And user_notes.md contains complete sections for both T1 and T2

# =============================================================================
# Absorbing Terminal States
# =============================================================================

Feature: COMPLETE and HALTED are absorbing terminal states
  Once the pipeline reaches a terminal state, no further transitions or dispatches occur

  Scenario: No review dispatch occurs after PIPELINE COMPLETE
    Given the pipeline has recorded "PIPELINE COMPLETE" in pipeline.log
    When any pending reviewer agent callback arrives
    Then the callback is discarded
    And no new entries are written to pipeline.log

  Scenario: No review dispatch occurs after PIPELINE HALTED
    Given the pipeline has recorded "PIPELINE HALTED" in pipeline.log
    When any pending reviewer agent callback arrives
    Then the callback is discarded
    And no new entries are written to pipeline.log

  Scenario: No state mutation occurs after PIPELINE COMPLETE
    Given the pipeline has recorded "PIPELINE COMPLETE"
    When a late-arriving reviewer timeout fires
    Then the timeout handler is a no-op
    And user_notes.md is not modified
    And pipeline.log receives no new entries

  Scenario: No state mutation occurs after PIPELINE HALTED
    Given the pipeline has recorded "PIPELINE HALTED"
    When a late-arriving reviewer timeout fires
    Then the timeout handler is a no-op
    And user_notes.md is not modified
    And pipeline.log receives no new entries

  Scenario: Pipeline lock is released in both terminal states
    Given the pipeline reaches a terminal state
    Then "pipeline.lock" is deleted
    And the terminal state marker is the last meaningful entry in pipeline.log

# =============================================================================
# Reviewer Agent Output
# =============================================================================

Feature: Individual reviewer agents produce structured findings
  Each of the 8 reviewer agents audits a diff and returns a JSON report

  Scenario: Reviewer agent receives the diff as input
    Given a task T1 has passed cleanup with 2 consecutive clean passes
    And the diff between T1's workspace branch and the base branch is available
    When the review-moderator dispatches the "security" reviewer
    Then the "security" reviewer receives the diff as its primary input

  Scenario: Reviewer agent returns valid JSON with findings array
    Given the "a11y" reviewer has audited a diff
    When the reviewer responds
    Then the response is valid JSON with a "findings" array
    And each finding has fields: "severity", "description", "files", "suggestion"
    And "severity" is one of "critical", "high", "medium", "low"
    And "files" is a non-empty array of file paths
    And "description" is a non-empty string
    And "suggestion" is a non-empty string

  Scenario: Reviewer agent returns empty findings when no issues found
    Given the "compliance" reviewer has audited a diff with no compliance issues
    When the reviewer responds
    Then the response is valid JSON with an empty "findings" array

  Scenario: Reviewer agent times out after ReviewerTimeout
    Given ReviewerTimeout is 600 seconds
    And the "bug" reviewer has been running for 600 seconds
    When the timeout is reached
    Then the reviewer invocation is terminated
    And the review-moderator records the timeout for the "bug" reviewer
    And the review proceeds with results from the remaining reviewers

  Scenario: Reviewer agent process crashes before timeout
    Given the "bug" reviewer has been dispatched
    And the reviewer process exits with a non-zero exit code before ReviewerTimeout
    When review-loop.ps1 detects the process exit
    Then the crash is logged with the exit code and any captured stderr
    And the "bug" reviewer is treated as if it returned empty findings
    And the review proceeds with results from the remaining reviewers

  Scenario: Reviewer agent returns output that is not valid JSON (parse failure)
    Given the "simplicity" reviewer has been invoked
    And the reviewer returns output that is not valid JSON
    When review-loop.ps1 attempts to parse the response
    Then the malformed response is logged to the task log for audit
    And the "simplicity" reviewer is treated as if it returned empty findings
    And the review proceeds with results from the other reviewers

  Scenario: Reviewer agent returns valid JSON missing required fields (schema violation)
    Given the "simplicity" reviewer has been invoked
    And the reviewer returns valid JSON: {"results": [{"issue": "too complex"}]}
    When review-loop.ps1 validates the response against the expected schema
    Then the schema violation is logged with the actual JSON structure
    And the "simplicity" reviewer is treated as if it returned empty findings
    And the review proceeds with results from the other reviewers

  Scenario: Reviewer agent returns finding with wrong field types (schema violation)
    Given the "bug" reviewer has been invoked
    And the reviewer returns a finding where "files" is a string instead of an array
    When review-loop.ps1 validates the finding
    Then the finding is rejected with a schema violation log entry
    And only the invalid finding is discarded (other valid findings from the same reviewer are kept)

  Scenario: Reviewer agent returns truncated JSON from timeout kill
    Given the "test" reviewer was terminated at the 600-second timeout
    And the captured output is a partial JSON string
    When review-loop.ps1 attempts to parse the response
    Then the parse failure is logged with the raw output for audit
    And the "test" reviewer is treated as if it returned empty findings
    And the review proceeds with results from the other reviewers

  Scenario: All 8 reviewer agents are available
    Given the agents/reviewers/ directory exists
    Then it contains reviewer agents for: "a11y", "ai-agent", "bug", "compliance", "security", "simplicity", "test", "type-design"

  Scenario: Reviewer agent returns an unknown severity value
    Given the "bug" reviewer has audited a diff
    And the reviewer returns a finding with severity "urgent" (not in the allowed set)
    When review-loop.ps1 validates the finding
    Then the finding is treated as severity "high" (conservative default)
    And a warning is logged: "Unknown severity 'urgent' from bug reviewer, defaulting to high"

  Scenario: Reviewer agent reports findings on files outside the diff
    Given the diff modifies only "src/api/handler.ts"
    And the "security" reviewer reports a finding on "src/utils/crypto.ts" (not in the diff)
    When the review-moderator consolidates findings
    Then the finding on "src/utils/crypto.ts" is included in the consolidation
    And the finding is annotated with "out-of-diff" in the task log for audit
    And the moderator may reclassify it as a note at its discretion

  Scenario: Reviewer agent produces no output before timeout (stall detection)
    Given the "compliance" reviewer has been dispatched
    And ReviewerTimeout is 600 seconds
    And the reviewer process is running but has produced zero bytes of output for 600 seconds
    When the timeout fires
    Then the stalled reviewer is terminated
    And the stall is logged as a timeout (same handling as normal timeout)

# =============================================================================
# Review-Moderator — Pre-Filter
# =============================================================================

Feature: Review-moderator pre-filters reviewers based on diff content
  The moderator examines the diff and selects only relevant reviewers

  Scenario: Review-moderator selects relevant reviewers from the diff
    Given a diff that modifies "src/api/handler.ts" and "src/components/Login.tsx"
    When the review-moderator runs its pre-filter step
    Then it selects reviewers relevant to the changed files
    And it logs exclusion rationale for each excluded reviewer

  Scenario: Review-moderator excludes irrelevant reviewers with rationale
    Given a diff that modifies only PowerShell scripts in "utils/"
    And no agent prompt files are in the diff
    When the review-moderator runs its pre-filter step
    Then it excludes "ai-agent" with reason "No agent prompts in diff"
    And the "excludedReviewers" array contains the reviewer name and reason

  Scenario: Pre-filter excludes all reviewers for trivial changes
    Given a diff that modifies only a comment in a single file
    When the review-moderator determines no reviewers are relevant
    Then the verdict is "pass"
    And the "selectedReviewers" array is empty
    And no reviewer agents are dispatched

  Scenario: Review-moderator returns valid JSON with selection results
    Given the review-moderator has completed pre-filtering
    When the moderator responds
    Then the response includes "selectedReviewers" as an array of reviewer names
    And the response includes "excludedReviewers" as an array of { "reviewer", "reason" } objects

# =============================================================================
# Review-Moderator — Dispatch & Consolidation
# =============================================================================

Feature: Review-moderator dispatches selected reviewers and consolidates findings
  After pre-filter, the moderator dispatches reviewers and triages their results

  Scenario: Review-moderator dispatches only selected reviewers
    Given the pre-filter selected "security", "bug", and "type-design"
    When the review-moderator dispatches reviewers
    Then exactly 3 reviewer agents are invoked
    And "a11y", "ai-agent", "compliance", "simplicity", and "test" are not invoked

  Scenario: Review-moderator consolidates findings into blockers and notes
    Given the "security" reviewer returned a finding with severity "critical"
    And the "simplicity" reviewer returned a finding with severity "low"
    When the review-moderator consolidates all findings
    Then the "blockers" array contains the security finding
    And the "notes" array contains the simplicity finding

  Scenario: Critical and high severity findings become blockers
    Given a reviewer returned a finding with severity "critical"
    And another reviewer returned a finding with severity "high"
    When the review-moderator consolidates
    Then both findings appear in the "blockers" array

  Scenario: Medium and low severity findings become notes
    Given a reviewer returned a finding with severity "medium"
    And another reviewer returned a finding with severity "low"
    When the review-moderator consolidates
    Then both findings appear in the "notes" array

  Scenario: Review-moderator overrides reviewer severity classification
    Given the "bug" reviewer flags a finding as severity "high"
    And the review-moderator determines the finding is actually "low" based on context
    When the review-moderator consolidates
    Then the finding appears in "notes" with the moderator's "low" severity
    And the raw reviewer report is preserved in the task log for audit

  Scenario: All reviewers return empty findings — verdict is pass
    Given the pre-filter selected "security" and "bug"
    And both reviewers returned empty "findings" arrays
    When the review-moderator consolidates
    Then the verdict is "pass"
    And the "blockers" array is empty
    And the "notes" array is empty

  Scenario: At least one blocker — verdict is fail
    Given the "security" reviewer returned a finding with severity "critical"
    And all other reviewers returned empty findings
    When the review-moderator consolidates
    Then the verdict is "fail"
    And the "blockers" array contains exactly 1 entry

  Scenario: Contradictory reviewer fix instructions are resolved by moderator
    Given the "security" reviewer suggests "add input validation to handler()"
    And the "simplicity" reviewer suggests "remove the handler() code path entirely"
    When the review-moderator consolidates the contradictory findings
    Then the moderator selects one finding and demotes or excludes the other
    And the raw reviewer reports are preserved in the task log for audit
    And the blockers array contains at most one of the two contradictory findings

  Scenario: Review-moderator output conforms to JSON schema
    Given the review-moderator has consolidated all findings
    When the moderator responds
    Then the response is valid JSON with fields: "selectedReviewers", "excludedReviewers", "verdict", "blockers", "notes"
    And "verdict" is one of "pass" or "fail"
    And each blocker has fields: "reviewer", "severity", "description", "files", "suggestion"
    And each note has fields: "reviewer", "severity", "description", "files", "suggestion"

# =============================================================================
# Timeout Hierarchy — Moderator vs Reviewers
# =============================================================================

Feature: ReviewModeratorTimeout applies only to the moderator's own work, not reviewer wait time
  The moderator has two phases: pre-filter (own work) and consolidation (own work).
  Reviewer dispatch wait time is bounded by ReviewerTimeout, not ReviewModeratorTimeout.

  Scenario: ReviewModeratorTimeout applies to pre-filter phase
    Given ReviewModeratorTimeout is 300 seconds
    And the review-moderator is running its pre-filter step
    When the pre-filter has been running for 300 seconds
    Then the moderator pre-filter is terminated
    And the review is treated as a retry-review (not a TDD fix cycle)

  Scenario: ReviewModeratorTimeout applies to consolidation phase
    Given ReviewModeratorTimeout is 300 seconds
    And all reviewer agents have returned their reports
    And the review-moderator is running its consolidation step
    When the consolidation has been running for 300 seconds
    Then the moderator consolidation is terminated
    And the review is treated as a retry-review (not a TDD fix cycle)

  Scenario: Reviewer dispatch wait is bounded by ReviewerTimeout not ReviewModeratorTimeout
    Given ReviewerTimeout is 600 seconds
    And ReviewModeratorTimeout is 300 seconds
    And the review-moderator dispatched 3 reviewers
    When the reviewers are executing
    Then the wall-clock wait for reviewer results is bounded by ReviewerTimeout (600s)
    And ReviewModeratorTimeout does not apply during the reviewer dispatch wait

  Scenario: Moderator timeout during pre-filter triggers retry-review
    Given the moderator pre-filter was terminated due to ReviewModeratorTimeout
    When the timeout is handled
    Then the review is re-run from the beginning (full pre-filter + dispatch with all reviewers re-dispatched)
    And the retry counts against MaxReviewRounds
    And no review-fix TDD cycle starts (there are no blockers to fix)

  Scenario: Moderator timeout during consolidation triggers retry-review
    Given all reviewers returned their reports
    And the moderator consolidation was terminated due to ReviewModeratorTimeout
    When the timeout is handled
    Then the review is re-run from the beginning (full pre-filter + dispatch with all reviewers re-dispatched)
    And the retry counts against MaxReviewRounds
    And no review-fix TDD cycle starts (there are no blockers to fix)

  Scenario: Moderator timeout exhausts MaxReviewRounds
    Given MaxReviewRounds is 3
    And the review-moderator has timed out on 3 consecutive review attempts
    When the 3rd timeout is handled
    Then Read-Escalation is called with moderator timeout context
    And user_notes.md records "Moderator timed out — review could not complete"

# =============================================================================
# Review Gate Wall-Clock Cap
# =============================================================================

Feature: ReviewGateTimeout caps total wall-clock time for an entire review gate
  Prevents unbounded time on a single review gate across retry-reviews and fix cycles

  Scenario: ReviewGateTimeout defaults to 1800 seconds
    Given the default config is loaded
    When I read the ReviewGateTimeout value
    Then it is 1800

  Scenario: ReviewGateTimeout fires during reviewer dispatch
    Given ReviewGateTimeout is 1800 seconds
    And the review gate for task T1 has been running for 1800 cumulative seconds
    And reviewers are still executing
    When the wall-clock cap fires
    Then all running reviewer invocations are terminated
    And Read-Escalation is called with review gate timeout context
    And unresolved state is recorded to user_notes.md as "Review gate timed out after 1800s"

  Scenario: ReviewGateTimeout accumulates across retry-reviews
    Given ReviewGateTimeout is 1800 seconds
    And the first review attempt took 500 seconds before a moderator timeout
    And the retry-review has been running for 1300 seconds
    When the cumulative wall-clock reaches 1800 seconds
    Then the review gate timeout fires
    And Read-Escalation is called

  Scenario: ReviewGateTimeout accumulates across review-fix cycles
    Given ReviewGateTimeout is 1800 seconds
    And the first review + fix cycle consumed 1200 seconds
    And the re-review has been running for 600 seconds
    When the cumulative wall-clock reaches 1800 seconds
    Then the review gate timeout fires
    And Read-Escalation is called with context including review rounds completed

  Scenario: Keep Going on ReviewGateTimeout resets the wall-clock timer
    Given the review gate timed out at 1800 seconds
    And Read-Escalation was called
    When the user selects "Keep Going"
    Then the review gate wall-clock timer resets to 0
    And the review resumes from a fresh review (retry-review)

# =============================================================================
# Global Pipeline Wall-Clock Ceiling
# =============================================================================

Feature: PipelineTimeoutSeconds provides a global liveness guarantee
  An absolute wall-clock cap prevents unbounded execution across all stages and Keep Going resets

  Scenario: PipelineTimeoutSeconds defaults to 14400 seconds
    Given the default config is loaded
    When I read the PipelineTimeoutSeconds value
    Then it is 14400

  Scenario: Pipeline halts when global wall-clock exceeds PipelineTimeoutSeconds
    Given PipelineTimeoutSeconds is 14400 seconds
    And the pipeline has been running for 14400 cumulative seconds
    When the global wall-clock cap fires
    Then all running sub-processes (reviewers, TDD phases, merges) are terminated
    And the pipeline transitions to HALTED
    And pipeline.log records the halt with reason and elapsed time
    And user_notes.md records all unresolved state

  Scenario: PipelineTimeoutSeconds is not reset by Keep Going
    Given the pipeline has been running for 13000 seconds
    And the user selects "Keep Going" on a review escalation
    When 1400 more seconds elapse (total 14400)
    Then the global wall-clock cap fires regardless of the Keep Going reset
    And the pipeline transitions to HALTED

  Scenario: PipelineTimeoutSeconds overrides active ReviewGateTimeout
    Given PipelineTimeoutSeconds is 14400 seconds
    And ReviewGateTimeout is 1800 seconds
    And the pipeline has been running for 14300 seconds
    And a review gate just started (gate wall-clock at 100 seconds)
    When the global wall-clock reaches 14400 seconds
    Then the global timeout fires (not the gate timeout)
    And the pipeline transitions to HALTED

# =============================================================================
# Malformed and Schema-Invalid Reviewer Output
# =============================================================================

Feature: Reviewer output failures are classified as parse failure or schema violation
  Parse failure (not JSON) and schema violation (valid JSON, wrong structure) are distinct

  Scenario: Moderator consolidates with some reviewers returning parse failures
    Given the pre-filter selected "security", "bug", and "a11y"
    And "security" returned valid JSON with 1 critical finding
    And "bug" returned non-JSON output (parse failure)
    And "a11y" returned valid JSON with 0 findings
    When the review-moderator consolidates
    Then the verdict is "fail" (from the security finding)
    And the "blockers" array contains the security finding
    And the consolidation does not fail due to the "bug" parse failure

  Scenario: Moderator consolidates with some reviewers returning schema violations
    Given the pre-filter selected "security", "bug", and "a11y"
    And "security" returned valid JSON with 1 critical finding
    And "bug" returned valid JSON with wrong schema (schema violation)
    And "a11y" returned valid JSON with 0 findings
    When the review-moderator consolidates
    Then the verdict is "fail" (from the security finding)
    And the consolidation proceeds with "bug" treated as empty findings

  Scenario: All selected reviewers return parse failures
    Given the pre-filter selected "security" and "compliance"
    And both reviewers returned non-JSON output
    When review-loop.ps1 processes the results
    Then both are treated as empty findings
    And the review-moderator consolidates with all-empty inputs
    And the verdict is "pass"
    And a warning is logged for each parse failure

  Scenario: All selected reviewers return schema violations
    Given the pre-filter selected "security" and "compliance"
    And both reviewers returned valid JSON that does not match the expected schema
    When review-loop.ps1 processes the results
    Then both are treated as empty findings
    And the verdict is "pass"
    And a warning is logged for each schema violation (distinct from parse failure warnings)

  Scenario: Review-moderator returns non-JSON output (parse failure)
    Given all reviewers returned valid reports
    And the review-moderator's consolidation output is not valid JSON
    When review-loop.ps1 attempts to parse the moderator response
    Then the parse failure is logged for audit
    And the review is treated as a retry-review (re-run from the beginning with all reviewers re-dispatched)
    And the retry counts against MaxReviewRounds

  Scenario: Review-moderator returns valid JSON with wrong schema (schema violation)
    Given all reviewers returned valid reports
    And the review-moderator returns valid JSON missing the "verdict" field
    When review-loop.ps1 validates the moderator response against the expected schema
    Then the schema violation is logged for audit with the actual JSON structure
    And the review is treated as a retry-review
    And the retry counts against MaxReviewRounds

# =============================================================================
# Pre-Merge Review Gate
# =============================================================================

Feature: Pre-merge review gate runs after cleanup before merge queue entry
  A task must pass review before it can enter the merge queue

  Scenario: Pre-merge review triggers after cleanup passes
    Given task T1 has achieved 2 consecutive clean passes in cleanup
    When cleanup completes successfully
    Then the pre-merge review gate runs before T1 enters the merge queue

  Scenario: Pre-merge review uses the worktree diff
    Given task T1 runs in isolated workspace "wt/T1-user-login"
    When the pre-merge review gate runs for T1
    Then the diff is computed between T1's workspace branch and the base branch

  Scenario: Pre-merge review pass — task enters merge queue
    Given the review-moderator returns verdict "pass" for T1
    When the pre-merge review completes
    Then task T1 enters the merge queue as normal

  Scenario: Pre-merge review fail — review-fix cycle starts
    Given the review-moderator returns verdict "fail" for T1
    And the "blockers" array contains a security finding
    When the pre-merge review completes
    Then a review-fix cycle starts for T1
    And T1 does not enter the merge queue

# =============================================================================
# Diff-Base Staleness
# =============================================================================

Feature: Diff-base staleness is detected when concurrent merges invalidate reviewed diffs
  When a task merges between another task's review pass and merge attempt,
  the reviewed diff may be semantically invalidated

  Scenario: Review pass becomes stale when another task merges first
    Given task T1 and T2 are in the same tier running in parallel
    And T1 passes pre-merge review with verdict "pass"
    And T2 merges to the feature branch before T1
    When T1 enters the merge queue
    Then T1's diff base is compared against the current feature branch HEAD
    And if the feature branch HEAD has advanced since T1's review diff was computed, the diff is marked stale

  Scenario: Stale diff triggers re-review with updated base
    Given T1's pre-merge review diff is marked stale (feature branch advanced)
    When the staleness is detected at merge queue entry
    Then a new diff is computed between T1's workspace branch and the updated feature branch HEAD
    And the pre-merge review re-runs with the new diff
    And the re-review counts against MaxReviewRounds

  Scenario: Stale diff that produces no new changes skips re-review
    Given T1's pre-merge review diff is marked stale
    And the new diff against the updated base is identical to the reviewed diff
    When the staleness check completes
    Then no re-review is needed
    And T1 proceeds to merge

  Scenario: Diff staleness check does not fire for single-task tiers
    Given tier 3 contains only task T5
    And T5 passes pre-merge review
    When T5 enters the merge queue
    Then no staleness check is performed (no concurrent merges possible in the same tier)

# =============================================================================
# Merge Queue Interaction After Review Pass
# =============================================================================

Feature: Tasks that pass review interact correctly with the merge queue
  Review pass leads to merge queue entry; merge failures are handled by existing merge logic

  Scenario: Task enters merge queue after review pass and awaits its turn
    Given task T1 passed the pre-merge review with verdict "pass"
    And task T2 is currently being merged
    When T1 enters the merge queue
    Then T1 waits in the queue until T2's merge completes

  Scenario: Merge conflict after review pass triggers merge-resolver
    Given task T1 passed the pre-merge review with verdict "pass"
    And T1 entered the merge queue
    And a merge conflict occurs when merging T1's workspace branch
    When the merge attempt fails
    Then the merge-resolver agent is dispatched (existing merge retry logic)
    And T1 does not re-enter the review gate for a merge conflict
    And the merge retry counter increments (independent of review round counter)

  Scenario: Merge conflict resolution exhausts MaxMergeRetries
    Given task T1 passed review and entered the merge queue
    And MaxMergeRetries is 3
    And the merge-resolver has failed 3 times
    When merge retries are exhausted
    Then Read-Escalation is called with merge exhaustion context
    And the escalation is distinct from review escalation

  Scenario: Post-merge verify failure after review pass triggers cleanup remediation
    Given task T1 passed review and merged without conflicts
    And the post-merge verification (test/lint/tsc) fails
    When the verification failure is detected
    Then cleanup remediation runs on the feature branch (existing cleanup logic)
    And T1 does not re-enter the review gate for a post-merge verify failure

  Scenario: --resume while task is waiting in merge queue
    Given task T1 passed review and entered the merge queue
    And task T2 is mid-merge when the pipeline crashes
    When the user runs "./vibe.ps1 --resume"
    Then T1 is recognized as review-passed and re-enters the merge queue
    And T2's interrupted merge is re-attempted from scratch

# =============================================================================
# Post-Merge Final Review
# =============================================================================

Feature: Post-merge final review runs after final verification double-pass
  After all tiers merge and final verification passes, one last review of the full feature

  Scenario: Post-merge final review triggers after final verification
    Given all tiers have completed and merged
    And the final verification double-pass has achieved 2 consecutive clean passes
    When final verification completes
    Then the post-merge final review runs

  Scenario: Post-merge final review uses the full feature diff
    Given the feature branch "reviewers" has diverged from the base branch
    When the post-merge final review runs
    Then the diff is computed between the full feature branch and the base branch

  Scenario: Post-merge final review pass — pipeline completes
    Given the review-moderator returns verdict "pass" for the final review
    When the final review completes
    Then the pipeline transitions to COMPLETE
    And pipeline.log records the final review verdict and the terminal state

  Scenario: Post-merge final review fail — review-fix cycle on feature branch
    Given the review-moderator returns verdict "fail" for the final review
    And the "blockers" array contains a type-design finding
    When the final review completes
    Then a review-fix cycle starts directly on the feature branch
    And no isolated workspace is created for the fix

  Scenario: Post-merge final review verifies feature branch exists before fix cycle
    Given the post-merge final review returns verdict "fail"
    When the review-fix cycle is about to start on the feature branch
    Then the orchestrator verifies the feature branch HEAD matches the expected commit
    And if the branch has been advanced or deleted, Read-Escalation is called with branch-state context

  Scenario: Zero-blocker failure during final review — moderator timeout
    Given all tiers have merged and final verification passed
    And the review-moderator times out during the final review's consolidation phase
    When the timeout is handled
    Then the final review is treated as a retry-review (re-run from scratch)
    And the retry counts against MaxReviewRounds (shared with final review)
    And no review-fix TDD cycle starts

  Scenario: Zero-blocker failure during final review — moderator parse failure
    Given all tiers have merged and final verification passed
    And the review-moderator returns non-JSON output during the final review
    When the failure is handled
    Then the final review is treated as a retry-review
    And the retry counts against MaxReviewRounds
    And the parse failure is logged with phase context

  Scenario: Zero-blocker failure during final review — moderator schema violation
    Given all tiers have merged and final verification passed
    And the review-moderator returns valid JSON missing required fields during the final review
    When the failure is handled
    Then the final review is treated as a retry-review
    And the retry counts against MaxReviewRounds
    And the schema violation is logged with phase context

  Scenario: Zero-blocker failure during final review exhausts MaxReviewRounds
    Given MaxReviewRounds is 3
    And the final review moderator has timed out on 3 consecutive attempts
    When the 3rd timeout is handled
    Then Read-Escalation is called with final review moderator timeout context
    And user_notes.md records "Moderator timed out — final review could not complete"
    And the user can Keep Going (skips final review) or Stop

# =============================================================================
# Review-Fix Cycle
# =============================================================================

Feature: Review-fix cycle resolves blockers through RED-GREEN-Cleanup then re-review
  When review finds blockers, the full TDD loop runs to fix them before re-review

  Scenario: Blockers are passed as context to the RED phase
    Given the review-moderator returned verdict "fail" with 2 blockers
    When the review-fix cycle starts
    Then the full blockers array is included in the test writer (RED phase) prompt
    And the test writer writes failing tests targeting the reported issues

  Scenario: GREEN phase receives blocker context plus failing tests
    Given the RED phase produced failing tests for the review blockers
    When the GREEN phase starts in the review-fix cycle
    Then the code writer receives the blocker descriptions
    And the code writer receives the failing test files
    And the code writer receives the RED phase test-run output (existing TDD behavior — Invoke-GreenPhase always passes the RED failure output)

  Scenario: TDD counters reset fresh for each review-fix cycle
    Given the previous review-fix cycle used 15 GREEN retries
    And the re-review still returns verdict "fail"
    When a new review-fix cycle starts
    Then the GREEN retry counter starts at 0
    And the RED retry counter starts at 0
    And the cleanup remediation counter starts at 0

  Scenario: Cleanup passes trigger re-review
    Given the review-fix cycle's cleanup achieves 2 consecutive clean passes
    When cleanup completes
    Then the pre-merge review gate runs again
    And a new diff is computed reflecting the fixes

  Scenario: Review-fix cycle resolves all blockers on re-review
    Given the first review found 2 blockers
    And the review-fix cycle addressed both issues
    When the re-review runs
    And the review-moderator returns verdict "pass"
    Then the task enters the merge queue

  Scenario: Re-review finds new blockers introduced by the fix
    Given the first review found 1 blocker
    And the review-fix cycle fixed that blocker but introduced a new issue
    When the re-review runs
    And the review-moderator returns verdict "fail" with a new blocker
    Then another review-fix cycle starts
    And the review round counter increments

  Scenario: Partial blocker resolution — some fixed, some persist
    Given the first review found 3 blockers (B1, B2, B3)
    And the review-fix cycle resolved B1 and B2 but B3 persists
    When the re-review runs
    Then the review-moderator evaluates the full new diff (not just B3)
    And if B3 still appears as a blocker, another review-fix cycle starts
    And the blockers array in the new cycle contains only the still-present issues

  Scenario: TDD RED phase cannot produce a test for a subjective finding
    Given the review-moderator flagged "simplify this function" as a blocker
    And the test writer cannot write a meaningful failing test
    When the RED phase escalates via Read-Escalation
    Then the user can select "Keep Going" to skip that blocker
    And the skipped blocker is logged to user_notes.md

  Scenario: Zero-blocker failure during re-review after fix cycle
    Given a review-fix cycle completed for task T1
    And cleanup passed with 2 consecutive clean passes
    And the re-review's moderator times out during consolidation
    When the timeout is handled
    Then the re-review is treated as a retry-review (re-run from scratch)
    And the retry counts against MaxReviewRounds
    And no new review-fix TDD cycle starts (there are no blockers from this attempt)

  Scenario: Review-fix commits accumulate without rollback
    Given the first review-fix cycle produced 3 commits on T1's workspace branch
    And the re-review still returns verdict "fail" with new blockers
    When the second review-fix cycle starts
    Then the workspace branch retains all commits from the first fix cycle
    And no squash or revert is performed automatically
    And the second fix cycle builds on top of the existing commits

  Scenario: Review-fix failure after MaxReviewRounds preserves all fix commits
    Given MaxReviewRounds is 3
    And 3 review-fix cycles produced a total of 8 commits on T1's workspace branch
    And the final re-review still returns verdict "fail"
    When Read-Escalation is called
    Then all 8 fix commits remain on the workspace branch
    And user_notes.md includes the unresolved blockers
    And no automatic revert of speculative fix commits occurs

# =============================================================================
# Review Round Limits (MaxReviewRounds)
# =============================================================================

Feature: Review rounds are capped at MaxReviewRounds to prevent infinite loops
  After MaxReviewRounds full review-fix cycles, unresolved blockers escalate to user.
  Retry-reviews (from moderator timeout or malformed JSON) also count against the cap.

  Scenario: Review round counter increments per review-fix cycle
    Given the first review returned verdict "fail"
    And the review-fix cycle completed
    When the re-review runs
    Then the review round counter is at 1

  Scenario: Review round counter increments on retry-review (no fix cycle)
    Given the review-moderator timed out during consolidation
    When the review is re-run from the beginning
    Then the review round counter increments by 1
    And no review-fix TDD cycle ran between the two reviews

  Scenario: Review round fencepost — 2nd cycle permits a 3rd
    Given MaxReviewRounds is 3
    And the review round counter is at 1
    And the re-review returned verdict "fail"
    When the 2nd review-fix cycle completes and re-review still fails
    Then the review round counter is at 2
    And a 3rd review-fix cycle is permitted

  Scenario: Review round fencepost — 3rd cycle is the last
    Given MaxReviewRounds is 3
    And the review round counter is at 2
    When the 3rd review-fix cycle completes and re-review still returns verdict "fail"
    Then Read-Escalation is called with review exhaustion context

  Scenario: Review rounds exhaust after MaxReviewRounds cycles
    Given MaxReviewRounds is 3
    And 3 review-fix cycles have run (counter equals MaxReviewRounds)
    And the re-review still returns verdict "fail"
    When the orchestrator detects exhaustion
    Then all remaining unresolved blockers are appended to user_notes.md
    And Read-Escalation is called

  Scenario: Keep Going on review escalation resets review round counter
    Given Read-Escalation was called for review exhaustion
    When the user selects "Keep Going"
    Then the review round counter resets to 0
    And the review-fix cycle resumes from a fresh review

  Scenario: Stop on review escalation halts pipeline with pre-stop snapshot
    Given Read-Escalation was called for review exhaustion
    When the user selects "Stop"
    Then the pipeline transitions to HALTED
    And a pre-stop snapshot is preserved
    And all unresolved blockers are in user_notes.md

  Scenario: Mixed retry-review and fix-cycle rounds share the same counter
    Given MaxReviewRounds is 3
    And round 1 was a retry-review (moderator timeout, no fix cycle)
    And round 2 was a normal review that returned verdict "fail" with blockers
    And round 2's fix cycle completed and re-review is round 3
    When round 3's review still returns verdict "fail"
    Then the counter is at 3 (MaxReviewRounds)
    And Read-Escalation is called

# =============================================================================
# Keep Going Livelock Prevention
# =============================================================================

Feature: MaxKeepGoingResets prevents infinite Keep Going loops on the same review gate
  A meta-counter caps how many times Keep Going can reset the review round counter

  Scenario: MaxKeepGoingResets defaults to 3
    Given the default config is loaded
    When I read the MaxKeepGoingResets value
    Then it is 3

  Scenario: Keep Going increments the meta-counter
    Given MaxKeepGoingResets is 3
    And the user has selected "Keep Going" on review escalation 0 times so far
    When the user selects "Keep Going"
    Then the keepGoingResets counter increments to 1
    And the review round counter resets to 0

  Scenario: Keep Going fencepost — 2nd reset is permitted
    Given MaxKeepGoingResets is 3
    And the keepGoingResets counter is at 1
    When review rounds exhaust again and the user selects "Keep Going"
    Then the keepGoingResets counter increments to 2
    And the review round counter resets to 0

  Scenario: Keep Going fencepost — 3rd reset is the last permitted
    Given MaxKeepGoingResets is 3
    And the keepGoingResets counter is at 2
    When review rounds exhaust again and the user selects "Keep Going"
    Then the keepGoingResets counter increments to 3
    And the review round counter resets to 0

  Scenario: Keep Going exhausts MaxKeepGoingResets — forced stop
    Given MaxKeepGoingResets is 3
    And the keepGoingResets counter is at 3
    And review rounds have exhausted again
    When Read-Escalation is called
    Then the escalation message includes "Maximum Keep Going resets reached (3)"
    And "Keep Going" is no longer offered as an option
    And the only option is "Stop"
    And all unresolved blockers are appended to user_notes.md

# =============================================================================
# TDD Keep Going Cap Within Review-Fix (Liveness Guarantee)
# =============================================================================

Feature: MaxTddKeepGoingPerGate prevents unbounded TDD retries within a review gate
  Without this cap, a user could select Keep Going on TDD escalations indefinitely.
  ReviewGateTimeout provides a wall-clock backstop, but MaxTddKeepGoingPerGate
  provides a count-based cap independent of timing.

  Scenario: MaxTddKeepGoingPerGate defaults to 5
    Given the default config is loaded
    When I read the MaxTddKeepGoingPerGate value
    Then it is 5

  Scenario: TDD Keep Going within review-fix increments the gate-scoped counter
    Given a review-fix cycle is running for task T1
    And the GREEN phase exhausted MaxTddCycles
    And the user selects "Keep Going" on the TDD escalation
    When the GREEN phase resumes
    Then the tddKeepGoingCount for this review gate increments by 1

  Scenario: TDD Keep Going counter accumulates across review-fix cycles
    Given the first review-fix cycle had 2 TDD Keep Going selections
    And the re-review returned verdict "fail" again
    And the second review-fix cycle has had 2 more TDD Keep Going selections
    When the GREEN phase exhausts again
    Then the tddKeepGoingCount is 4
    And the user is offered "Keep Going" (5 not yet reached)

  Scenario: TDD Keep Going exhausts MaxTddKeepGoingPerGate — escalation to review level
    Given MaxTddKeepGoingPerGate is 5
    And the tddKeepGoingCount for this review gate is at 5
    And a TDD phase exhausts within the current review-fix cycle
    When Read-Escalation is called
    Then the escalation message includes "Maximum TDD retries within review gate reached (5)"
    And "Keep Going" is no longer offered for TDD escalation
    And the escalation becomes a review-level escalation (counted against MaxReviewRounds)

  Scenario: TDD Keep Going counter resets when review gate Keep Going resets review rounds
    Given the tddKeepGoingCount is at 3
    And review rounds exhaust (MaxReviewRounds reached)
    And the user selects "Keep Going" on the review escalation
    When the review round counter resets to 0
    Then the tddKeepGoingCount also resets to 0

  Scenario: ReviewGateTimeout still fires even if MaxTddKeepGoingPerGate is not reached
    Given MaxTddKeepGoingPerGate is 5
    And the tddKeepGoingCount is at 2
    And ReviewGateTimeout is 1800 seconds
    And the review gate wall-clock reaches 1800 seconds during a TDD GREEN phase
    When the wall-clock cap fires
    Then the TDD phase is terminated
    And the review gate timeout escalation occurs (independent of tddKeepGoingCount)

# =============================================================================
# TDD Exhaustion and Review Round Counter Interaction
# =============================================================================

Feature: TDD exhaustion within review-fix does not reset review round counter
  Keep Going on TDD failure resumes the current review-fix cycle without touching review rounds

  Scenario: Keep Going on TDD GREEN exhaustion within review-fix preserves review round counter
    Given a review-fix cycle is running for task T1 at review round 2
    And the GREEN phase exhausted MaxTddCycles
    And the user selects "Keep Going" on the TDD escalation
    When the GREEN phase resumes
    Then the GREEN retry counter resets to 0
    And the review round counter remains at 2
    And the keepGoingResets counter is not affected (TDD Keep Going is separate)

  Scenario: Keep Going on TDD RED exhaustion within review-fix preserves review round counter
    Given a review-fix cycle is running for task T1 at review round 1
    And the RED phase exhausted MaxRedRetries
    And the user selects "Keep Going" on the TDD escalation
    When the RED phase resumes
    Then the RED retry counter resets to 0
    And the review round counter remains at 1

  Scenario: Keep Going on TDD cleanup exhaustion within review-fix preserves review round counter
    Given a review-fix cycle is running for task T1 at review round 3
    And cleanup exhausted MaxFixRounds remediation cycles
    And the user selects "Keep Going" on the TDD escalation
    When cleanup resumes
    Then the cleanup remediation counter resets to 0
    And the review round counter remains at 3

  Scenario: Stop on TDD escalation within review-fix halts the pipeline
    Given a review-fix cycle is running for task T1
    And the GREEN phase exhausted MaxTddCycles
    When the user selects "Stop" on the TDD escalation
    Then the pipeline transitions to HALTED
    And all unresolved blockers are appended to user_notes.md
    And a pre-stop snapshot is preserved

# =============================================================================
# user_notes.md
# =============================================================================

Feature: user_notes.md accumulates non-blocking notes and unresolved blockers
  Each review round appends findings the user should address later

  Scenario: Notes are written to the feature-specific user_notes.md
    Given the feature is "reviewers"
    When non-blocking notes are recorded
    Then they are written to "docs/reviewers/user_notes.md"

  Scenario: Pre-merge review notes are appended per review round
    Given the review-moderator returned verdict "pass" with 2 notes
    When the notes are recorded
    Then user_notes.md contains a section "## Review Round 1 — Pre-Merge (Task T1)"
    And the section contains a "### Non-Blocking" subsection
    And each note is formatted as "- [<reviewer>] <file>: <description> (<severity>)"

  Scenario: Final review notes are appended with final review header
    Given the post-merge final review returned verdict "pass" with 1 note
    When the notes are recorded
    Then user_notes.md contains a section "## Review Round 1 — Final Review"
    And the note is listed under "### Non-Blocking"

  Scenario: Unresolved blockers are appended on escalation
    Given MaxReviewRounds is 3
    And the review exhausted with 1 unresolved blocker from the "security" reviewer
    When the escalation occurs
    Then user_notes.md contains a "### Unresolved Blockers (escalated)" subsection
    And the blocker is formatted as "- [security] src/api/handler.ts: Unsanitized user input in query (critical)"

  Scenario: Moderator timeout escalation is recorded in user_notes.md
    Given the review-moderator timed out on 3 consecutive attempts
    When Read-Escalation is called and the user selects "Keep Going"
    Then user_notes.md contains a "### Unresolved Blockers (escalated)" subsection
    And the entry reads "Moderator timed out — review could not complete"

  Scenario: Multiple review rounds accumulate in user_notes.md
    Given review round 1 appended notes for task T1
    And review round 2 appended notes for the final review
    When I read user_notes.md
    Then it contains both "## Review Round 1" and "## Review Round 2" sections
    And earlier rounds are not overwritten

  Scenario: user_notes.md is created if it does not exist
    Given "docs/reviewers/user_notes.md" does not exist
    When the first review round produces notes
    Then the file is created
    And the notes are written to it

# =============================================================================
# Structured Pipeline Log
# =============================================================================

Feature: Pipeline log records review phase markers for resume support
  Log entries capture observable phase transitions with task identifiers.
  The log format is a contract consumed by --resume state reconstruction.

  Scenario: Review start is logged
    Given the pre-merge review gate runs for task T1
    When the review begins
    Then pipeline.log receives a timestamped entry indicating review start for task T1 at round 1 in pre-merge phase

  Scenario: Reviewer dispatch is logged
    Given the review-moderator dispatches "security" and "bug" reviewers for task T1
    When the reviewers are invoked
    Then pipeline.log receives an entry indicating which reviewers were dispatched for T1

  Scenario: Reviewer exclusion is logged
    Given the review-moderator excludes "ai-agent" with reason "No agent prompts in diff"
    When the exclusion is recorded
    Then pipeline.log receives an entry indicating the excluded reviewer and reason for T1

  Scenario: Review verdict is logged
    Given the review-moderator returns verdict "fail" with 1 blocker for task T1
    When the verdict is recorded
    Then pipeline.log receives an entry indicating the verdict, blocker count, and note count for T1

  Scenario: Reviewer timeout is logged
    Given the "bug" reviewer timed out during the review of task T1
    When the timeout is recorded
    Then pipeline.log receives an entry indicating the reviewer timeout for T1

  Scenario: Reviewer parse failure is logged
    Given the "simplicity" reviewer returned non-JSON output during review of task T1
    When the parse failure is recorded
    Then pipeline.log receives an entry indicating a parse failure for the reviewer and task

  Scenario: Reviewer schema violation is logged distinctly from parse failure
    Given the "simplicity" reviewer returned valid JSON with wrong schema during review of task T1
    When the schema violation is recorded
    Then pipeline.log receives an entry indicating a schema violation (not parse failure) for the reviewer and task

  Scenario: Moderator timeout is logged with phase step
    Given the review-moderator timed out during pre-filter for task T1
    When the timeout is recorded
    Then pipeline.log receives an entry indicating moderator timeout with the phase step (pre-filter or consolidation)

  Scenario: Review-fix cycle start is logged
    Given the review returned verdict "fail" for T1
    When the review-fix cycle begins
    Then pipeline.log receives an entry indicating review-fix start for T1 at round 1

  Scenario: Review-fix TDD phase transitions are logged
    Given a review-fix cycle is running for task T1 at round 1
    When the RED phase starts
    Then pipeline.log receives an entry indicating the TDD phase (RED) for T1 at round 1
    When the GREEN phase starts
    Then pipeline.log receives an entry indicating the TDD phase (GREEN) for T1 at round 1
    When cleanup starts
    Then pipeline.log receives an entry indicating the TDD phase (CLEANUP) for T1 at round 1

  Scenario: Post-merge final review markers are logged
    Given the post-merge final review runs
    When the review begins
    Then pipeline.log receives an entry indicating review start in final phase
    And on completion, an entry indicating review complete in final phase with the verdict

  Scenario: Concurrent pre-merge reviews produce disambiguated log entries
    Given tier 1 has tasks T1 and T2 running in parallel isolated workspaces
    And both T1 and T2 complete cleanup at the same time
    When both pre-merge reviews run concurrently
    Then each log entry for T1's review includes T1's task identifier
    And each log entry for T2's review includes T2's task identifier
    And the log entries may interleave but are distinguishable by task identifier

  Scenario: Retry-review is logged distinctly from post-fix re-review
    Given the review-moderator timed out for task T1
    When the retry-review starts
    Then pipeline.log receives an entry indicating retry-review for T1 (distinguishable from a post-fix re-review)

  Scenario: Keep Going reset is logged
    Given the user selected "Keep Going" on review escalation for task T1
    When the keepGoingResets counter increments
    Then pipeline.log receives an entry recording the Keep Going event with the new counter value

  Scenario: Review gate wall-clock timeout is logged
    Given the review gate for task T1 exceeded ReviewGateTimeout
    When the timeout fires
    Then pipeline.log receives an entry indicating gate timeout with elapsed time for T1

  Scenario: TDD Keep Going within review-fix is logged
    Given a TDD GREEN phase exhausted during review-fix for T1
    And the user selected "Keep Going"
    When the tddKeepGoingCount increments
    Then pipeline.log receives an entry recording the TDD Keep Going event with the new counter value for T1

  Scenario: Global pipeline timeout is logged
    Given the pipeline exceeds PipelineTimeoutSeconds
    When the global timeout fires
    Then pipeline.log receives an entry indicating pipeline halt due to global timeout

# =============================================================================
# CLI Refactor — Remove -Stage and -Feature Flags
# =============================================================================

Feature: CLI accepts only seed for new runs and --resume for continuation
  The CLI is simplified to two invocation forms

  Scenario: New run with seed prompt
    Given no prior pipeline run is in progress
    When the user runs "./vibe.ps1 'Add user authentication'"
    Then a new pipeline run starts from Stage 1
    And the pipeline log is cleared
    And pipeline.log records a pipeline start entry with the seed

  Scenario: New run requires a seed argument
    Given the user runs "./vibe.ps1" with no arguments and no --resume flag
    When the CLI parses the input
    Then an error is thrown: a seed prompt is required for a fresh run

  Scenario: New run rejects empty seed string
    Given the user runs "./vibe.ps1 ''"
    When the CLI parses the input
    Then an error is thrown: seed prompt must be non-empty

  Scenario: -Stage flag is removed
    Given the user runs "./vibe.ps1 -Stage 3 -Feature auth-flow"
    When the CLI parses the input
    Then the CLI rejects the -Stage parameter as unrecognized

  Scenario: -Feature flag is removed
    Given the user runs "./vibe.ps1 -Feature auth-flow"
    When the CLI parses the input
    Then the CLI rejects the -Feature parameter as unrecognized

  Scenario: New seed clears log of interrupted run
    Given a prior pipeline run was interrupted at Stage 4
    When the user runs "./vibe.ps1 'New feature idea'"
    Then the pipeline log is cleared
    And the interrupted run's state is lost
    And a fresh pipeline starts from Stage 1

# =============================================================================
# CLI Refactor — --resume Flag
# =============================================================================

Feature: --resume flag continues an interrupted pipeline run from the structured log
  Resume infers stage, feature, and sub-phase state from pipeline.log

  Scenario: Resume continues from last completed stage
    Given pipeline.log shows Stage 1-5 completed and Stage 6 started but not completed
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline resumes at Stage 6
    And the feature directory is inferred from the log

  Scenario: Resume reconstructs review state from log
    Given pipeline.log shows a pre-merge review started for T2 at round 2
    And no review completion entry follows for that review
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline resumes the pre-merge review for T2 at round 2

  Scenario: Resume reconstructs task-level state within Stage 8
    Given pipeline.log shows T1 completed, T2 in GREEN phase, T3 pending
    When the user runs "./vibe.ps1 --resume"
    Then T1 is marked as completed (not re-executed)
    And T2 resumes from its GREEN phase
    And T3 remains pending until its tier starts

  Scenario: Resume reconstructs review-fix TDD phase from log markers
    Given pipeline.log shows review-fix start for T2 at round 1
    And pipeline.log shows TDD phase GREEN for T2 at round 1
    And no CLEANUP phase entry follows for T2 round 1
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline resumes task T2 inside review-fix round 1 at the GREEN phase
    And the review round counter is restored to 1
    And the TDD retry counters are reset to 0 (fresh start within the phase)

  Scenario: Resume reconstructs review-fix cleanup phase from log markers
    Given pipeline.log shows TDD phase CLEANUP for T2 at round 2
    And no review completion or subsequent round entry follows
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline resumes task T2 inside review-fix round 2 at the CLEANUP phase

  Scenario: Resume distinguishes retry-review from post-fix re-review
    Given pipeline.log shows a retry-review entry for T1 at round 2
    And the retry was due to moderator timeout (no fix cycle ran)
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline re-runs the review for T1 at round 2 as a retry-review
    And no TDD counters are restored (no fix cycle was in progress)

  Scenario: Resume after crash during post-fix re-review restores TDD state correctly
    Given pipeline.log shows review-fix completed for T1 round 1 (RED, GREEN, CLEANUP all logged)
    And pipeline.log shows review start for T1 at round 2 (post-fix re-review, not retry)
    And no review completion follows
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline re-runs the re-review for T1 at round 2
    And TDD counters start fresh (the fix cycle for round 1 is complete)

  Scenario: Resume after crash during reviewer dispatch
    Given pipeline.log shows review start for T1 at round 1
    And pipeline.log shows reviewer dispatch for T1
    And no review completion entry follows
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline re-runs the full pre-merge review for T1 at round 1
    And reviewers are re-dispatched from scratch (partial results are discarded)

  Scenario: --resume with no prior run
    Given pipeline.log is empty or does not exist
    When the user runs "./vibe.ps1 --resume"
    Then an error message is shown: "No pipeline run found to resume. Start a new run with: ./vibe.ps1 \"your seed\""

  Scenario: --resume with completed run
    Given pipeline.log shows the pipeline completed
    When the user runs "./vibe.ps1 --resume"
    Then the CLI detects that all stages completed
    And informs the user the run is already complete

  Scenario: --resume after crash mid-review
    Given pipeline.log shows review start for T1 at round 1
    And no review completion entry follows
    When the user runs "./vibe.ps1 --resume"
    Then the pipeline re-runs the pre-merge review for T1 from round 1

  Scenario: --resume infers feature directory from log
    Given pipeline.log contains a pipeline start entry with seed "Add auth"
    And Stage 1 completed with feature directory "docs/auth-flow"
    When the user runs "./vibe.ps1 --resume"
    Then the feature directory is resolved to "docs/auth-flow"
    And no -Feature flag is needed

  Scenario: --resume after Keep Going reset and crash
    Given pipeline.log shows Keep Going reset for T1 with keepGoingResets=2
    And pipeline.log shows review start for T1 at round 1 (after the reset)
    And no review completion follows
    When the user runs "./vibe.ps1 --resume"
    Then the keepGoingResets counter is restored to 2
    And the review round counter is restored to 1 (counting from the last reset)
    And the pipeline resumes the pre-merge review for T1

  Scenario: --resume restores TDD Keep Going counter from log
    Given pipeline.log shows 3 TDD Keep Going events for T1's review gate
    And no review gate completion follows
    When the user runs "./vibe.ps1 --resume"
    Then the tddKeepGoingCount is restored to 3
    And the review-fix cycle resumes with the correct TDD counter state

  Scenario: --resume with corrupted pipeline log — truncated mid-line
    Given pipeline.log exists but the last line is truncated mid-entry
    When the user runs "./vibe.ps1 --resume"
    Then the truncated line is discarded
    And resume state is reconstructed from the last complete log entry
    And a warning is logged about the discarded truncated line

  Scenario: --resume with corrupted pipeline log — unrecognized entries
    Given pipeline.log contains lines with unrecognized markers
    When the user runs "./vibe.ps1 --resume"
    Then unrecognized lines are skipped during state reconstruction
    And a warning is logged for each skipped line
    And resume proceeds using only recognized markers

  Scenario: --resume with corrupted pipeline log — file is binary garbage
    Given pipeline.log exists but contains non-text binary content
    When the user runs "./vibe.ps1 --resume"
    Then an error message is shown: "Pipeline log is corrupted. Start a new run with: ./vibe.ps1 \"your seed\""

# =============================================================================
# Config Values and Validation
# =============================================================================

Feature: New configuration values control review behavior with load-time validation
  Config.ps1 defines tunable thresholds. Invalid values are rejected at load time.

  Scenario: MaxReviewRounds defaults to 3
    Given the default config is loaded
    When I read the MaxReviewRounds value
    Then it is 3

  Scenario: ReviewerTimeout defaults to 600 seconds
    Given the default config is loaded
    When I read the ReviewerTimeout value
    Then it is 600

  Scenario: ReviewModeratorTimeout defaults to 300 seconds
    Given the default config is loaded
    When I read the ReviewModeratorTimeout value
    Then it is 300

  Scenario: ReviewGateTimeout defaults to 1800 seconds
    Given the default config is loaded
    When I read the ReviewGateTimeout value
    Then it is 1800

  Scenario: MaxKeepGoingResets defaults to 3
    Given the default config is loaded
    When I read the MaxKeepGoingResets value
    Then it is 3

  Scenario: MaxTddKeepGoingPerGate defaults to 5
    Given the default config is loaded
    When I read the MaxTddKeepGoingPerGate value
    Then it is 5

  Scenario: PipelineTimeoutSeconds defaults to 14400 seconds
    Given the default config is loaded
    When I read the PipelineTimeoutSeconds value
    Then it is 14400

  Scenario Outline: Config rejects zero or negative values at load time
    Given config.ps1 sets <param> to <value>
    When the config is loaded
    Then an error is thrown: "<param> must be a positive integer"
    And the pipeline does not start

    Examples:
      | param                    | value |
      | MaxReviewRounds          |     0 |
      | MaxReviewRounds          |    -1 |
      | ReviewerTimeout          |     0 |
      | ReviewModeratorTimeout   |     0 |
      | ReviewGateTimeout        |     0 |
      | MaxKeepGoingResets       |    -1 |
      | MaxTddKeepGoingPerGate   |     0 |
      | PipelineTimeoutSeconds   |     0 |

  Scenario: Config rejects ReviewGateTimeout less than ReviewerTimeout
    Given config.ps1 sets ReviewGateTimeout to 300
    And config.ps1 sets ReviewerTimeout to 600
    When the config is loaded
    Then an error is thrown: "ReviewGateTimeout (300) must be >= ReviewerTimeout (600)"
    And the pipeline does not start

  Scenario: Config rejects PipelineTimeoutSeconds less than ReviewGateTimeout
    Given config.ps1 sets PipelineTimeoutSeconds to 1000
    And config.ps1 sets ReviewGateTimeout to 1800
    When the config is loaded
    Then an error is thrown: "PipelineTimeoutSeconds (1000) must be >= ReviewGateTimeout (1800)"
    And the pipeline does not start

  Scenario Outline: Config accepts boundary-valid values
    Given config.ps1 sets <param> to <value>
    When the config is loaded
    Then the config loads successfully
    And the <param> value is <value>

    Examples:
      | param                    | value |
      | MaxReviewRounds          |     1 |
      | MaxKeepGoingResets       |     0 |
      | MaxTddKeepGoingPerGate   |     1 |
      | ReviewerTimeout          |     1 |
      | ReviewGateTimeout        |     1 |

  Scenario: MaxReviewRounds=1 causes immediate escalation on first review failure
    Given MaxReviewRounds is 1
    And the first pre-merge review returns verdict "fail" with blockers
    And the review-fix cycle completes
    When the re-review still returns verdict "fail"
    Then Read-Escalation is called immediately (counter at 1 = MaxReviewRounds)

  Scenario: MaxKeepGoingResets=0 means Keep Going is never offered on review escalation
    Given MaxKeepGoingResets is 0
    And review rounds have exhausted
    When Read-Escalation is called
    Then the only option is "Stop"
    And "Keep Going" is not offered

# =============================================================================
# review-loop.ps1 Utility
# =============================================================================

Feature: review-loop.ps1 orchestrates reviewer dispatch, collection, and consolidation
  A reusable utility script manages the full review workflow

  Scenario: review-loop.ps1 computes the diff for pre-merge review
    Given task T1 is in isolated workspace "wt/T1-user-login"
    When review-loop.ps1 runs for a pre-merge review of T1
    Then it computes the diff between T1's workspace branch and the base branch

  Scenario: review-loop.ps1 computes the diff for final review
    Given all tiers have merged to the feature branch
    When review-loop.ps1 runs for the final review
    Then it computes the diff between the feature branch and the base branch

  Scenario: review-loop.ps1 invokes the review-moderator with the diff
    Given a diff has been computed
    When review-loop.ps1 starts the review
    Then it passes the diff to the review-moderator agent for pre-filtering

  Scenario: review-loop.ps1 dispatches selected reviewers
    Given the review-moderator selected "security", "a11y", and "test"
    When review-loop.ps1 dispatches reviewers
    Then it invokes 3 reviewer agents via Invoke-Claude
    And each receives the diff and the reviewer-specific agent .md file

  Scenario: review-loop.ps1 collects all reviewer JSON reports
    Given 3 reviewers have been dispatched
    When all 3 return their JSON reports
    Then review-loop.ps1 passes all 3 reports to the review-moderator for consolidation

  Scenario: review-loop.ps1 returns the moderator's consolidated verdict
    Given the review-moderator has consolidated findings
    When review-loop.ps1 completes
    Then it returns the full moderator output including verdict, blockers, and notes

  Scenario: review-loop.ps1 handles reviewer timeout gracefully
    Given ReviewerTimeout is 600 seconds
    And the "compliance" reviewer exceeds 600 seconds
    When the timeout fires
    Then the "compliance" reviewer is terminated
    And review-loop.ps1 proceeds with results from the other reviewers
    And the timeout is logged

  Scenario: review-loop.ps1 handles reviewer parse failure gracefully
    Given the "bug" reviewer returned output that is not valid JSON
    When review-loop.ps1 processes the reviewer results
    Then the malformed output is logged to the task log
    And the "bug" reviewer is treated as if it returned empty findings
    And review-loop.ps1 proceeds with results from the other reviewers

  Scenario: review-loop.ps1 handles reviewer schema violation gracefully
    Given the "bug" reviewer returned valid JSON with wrong structure
    When review-loop.ps1 validates the response
    Then the schema violation is logged to the task log (distinct from parse failure)
    And the "bug" reviewer is treated as if it returned empty findings
    And review-loop.ps1 proceeds with results from the other reviewers

  Scenario: review-loop.ps1 handles moderator parse failure by signaling retry
    Given all reviewers returned valid reports
    And the review-moderator returned non-JSON output
    When review-loop.ps1 processes the moderator response
    Then it returns a retry signal to the caller
    And the caller re-invokes review-loop.ps1 (counting against MaxReviewRounds)

  Scenario: review-loop.ps1 handles moderator schema violation by signaling retry
    Given all reviewers returned valid reports
    And the review-moderator returned valid JSON missing the "verdict" field
    When review-loop.ps1 validates the moderator response
    Then it returns a retry signal to the caller
    And the caller re-invokes review-loop.ps1 (counting against MaxReviewRounds)

  Scenario: Retry-review re-dispatches all reviewers from scratch
    Given the previous review attempt ended with a moderator timeout
    When review-loop.ps1 is re-invoked as a retry-review
    Then the full pre-filter step runs again on the same diff
    And selected reviewers are dispatched fresh (no cached results from the failed attempt)
    And the moderator consolidation runs on the new reviewer outputs

# =============================================================================
# Stage 8 Integration — Pre-Merge Review Gate Placement
# =============================================================================

Feature: Pre-merge review gate integrates into the Stage 8 task lifecycle
  Review runs after cleanup and before merge queue, within existing Stage 8 flow

  Scenario: Task lifecycle with review — happy path
    Given task T1 completes RED, GREEN, and cleanup phases
    When cleanup achieves 2 consecutive clean passes
    Then the pre-merge review gate runs
    And on verdict "pass", T1 enters the merge queue

  Scenario: Task lifecycle with review — blocker found and fixed
    Given task T1 completes cleanup successfully
    And the pre-merge review returns verdict "fail" with 1 blocker
    When the review-fix cycle runs (RED -> GREEN -> Cleanup)
    And the re-review returns verdict "pass"
    Then T1 enters the merge queue

  Scenario: Agent-writer tasks skip the review gate
    Given task T4 has codeWriter "agent-writer" and testWriter null
    When Stage 8 processes T4
    Then no pre-merge review runs for T4
    And T4 proceeds directly to the merge queue

  Scenario: Agent-writer classification is verified before skipping review
    Given task T4 has codeWriter "agent-writer" and testWriter null
    When Stage 8 determines whether to skip the review gate for T4
    Then it verifies that both codeWriter is "agent-writer" and testWriter is null
    And if testWriter is not null, the task is treated as a normal task (review gate applies)

  Scenario: Single-task tier pre-merge review runs on feature branch
    Given tier 2 contains only task T3 (no isolated workspace)
    And T3 completes cleanup on the feature branch
    When the pre-merge review gate runs for T3
    Then the diff is computed on the feature branch (not a workspace branch)

# =============================================================================
# Stage 8 Integration — Post-Merge Final Review Placement
# =============================================================================

Feature: Post-merge final review integrates after final verification
  The final review is the last gate before pipeline completion

  Scenario: Final review runs after final verification double-pass
    Given all tiers have completed and merged
    And the final verification cleanup loop achieves 2 consecutive clean passes
    When final verification completes
    Then the post-merge final review runs
    And only after the final review passes does the pipeline transition to COMPLETE

  Scenario: Final review failure triggers fix cycle on feature branch
    Given the post-merge final review returns verdict "fail"
    When the review-fix cycle starts
    Then RED, GREEN, and cleanup phases run directly on the feature branch
    And after cleanup passes, the final review re-runs

  Scenario: Final review fix cycle respects MaxReviewRounds
    Given MaxReviewRounds is 3
    And the final review has failed 3 times
    When the orchestrator detects review exhaustion
    Then unresolved blockers are appended to user_notes.md
    And Read-Escalation is called with final review context

  Scenario: Final review fix cycle verifies feature branch state before each fix
    Given the post-merge final review returned verdict "fail"
    When the review-fix cycle is about to run on the feature branch
    Then the orchestrator verifies the feature branch exists
    And the orchestrator verifies the feature branch HEAD has not been force-pushed or rebased
    And if the branch state is unexpected, Read-Escalation is called

# =============================================================================
# Error States — TDD Failure Within Review-Fix Cycle
# =============================================================================

Feature: TDD failures within review-fix cycles escalate via existing mechanisms
  The review-fix cycle reuses existing RED/GREEN/Cleanup escalation paths

  Scenario: RED phase exhaustion during review-fix cycle
    Given a review-fix cycle is running for T1
    And the RED phase exhausts MaxRedRetries (3) retries
    When the RED phase escalates
    Then Read-Escalation is called with RED exhaustion context
    And the context includes that this RED failure occurred during a review-fix cycle

  Scenario: GREEN phase exhaustion during review-fix cycle
    Given a review-fix cycle is running for T1
    And the GREEN phase exhausts MaxTddCycles (100) retries
    When the GREEN phase escalates
    Then Read-Escalation is called with GREEN exhaustion context
    And the context includes the review blocker that triggered the fix cycle

  Scenario: Cleanup exhaustion during review-fix cycle
    Given a review-fix cycle is running for T1
    And cleanup exhausts MaxFixRounds (100) remediation cycles
    When cleanup escalates
    Then Read-Escalation is called with cleanup exhaustion context
    And the context includes that this cleanup occurred during a review-fix cycle

  Scenario: Keep Going on TDD failure within review-fix resets only TDD counters
    Given a GREEN phase exhausted during a review-fix cycle for T1
    And the user selects "Keep Going"
    When the GREEN phase resumes
    Then the GREEN retry counter resets to 0
    And the review round counter is not reset

# =============================================================================
# Error States — Zero-Blocker Failure (Moderator Timeout / Malformed JSON)
# =============================================================================

Feature: Zero-blocker failures trigger retry-review instead of review-fix TDD cycles
  When the review fails due to infrastructure (timeout, parse failure, schema violation)
  rather than code quality, there are no blockers to feed into RED. These are retry-reviews.

  Scenario: Moderator timeout produces a retry-review not a fix cycle
    Given the review-moderator timed out during consolidation for task T1
    When the timeout is handled
    Then no review-fix TDD cycle starts
    And review-loop.ps1 is re-invoked from the beginning for T1 (all reviewers re-dispatched)
    And the review round counter increments

  Scenario: Moderator parse failure produces a retry-review not a fix cycle
    Given the review-moderator returned non-JSON output for task T1
    When the failure is handled
    Then no review-fix TDD cycle starts
    And review-loop.ps1 is re-invoked from the beginning for T1 (all reviewers re-dispatched)
    And the review round counter increments

  Scenario: Moderator schema violation produces a retry-review not a fix cycle
    Given the review-moderator returned valid JSON missing the "verdict" field for task T1
    When the failure is handled
    Then no review-fix TDD cycle starts
    And review-loop.ps1 is re-invoked from the beginning for T1 (all reviewers re-dispatched)
    And the review round counter increments

  Scenario: Retry-review log entry distinguishes from post-fix re-review
    Given the review-moderator timed out for task T1 at round 1
    When the retry-review starts as round 2
    Then the log entry for the retry-review is distinguishable from a post-fix re-review

  Scenario: Zero-blocker failure during final review triggers retry-review
    Given the post-merge final review is running
    And the review-moderator times out during consolidation
    When the timeout is handled
    Then no review-fix TDD cycle starts
    And review-loop.ps1 is re-invoked from the beginning for the final review (all reviewers re-dispatched)
    And the review round counter increments

  Scenario: Zero-blocker failure during re-review after fix cycle
    Given a review-fix cycle completed for task T1 (round 1 found blockers, fix ran)
    And the re-review at round 2 started
    And the review-moderator timed out during the re-review's consolidation
    When the timeout is handled
    Then no new review-fix TDD cycle starts
    And review-loop.ps1 is re-invoked from the beginning as round 3 (retry-review)
    And the review round counter increments to 3
