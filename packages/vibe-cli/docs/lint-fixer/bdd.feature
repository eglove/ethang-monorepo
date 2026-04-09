# BDD Scenarios — Lint-Fixer Agent (Revision 4)
# Date: 2026-04-07
# Source: packages/vibe-cli/docs/lint-fixer/elicitor.md
# Debate: packages/vibe-cli/docs/lint-fixer/bdd-debate.md
#
# Revision 4 — addresses all 7 converged debate objections from revision 3:
#
#   1. HIGH — Autofix introducing NEW violations: added scenario for lint --fix
#      resolving some violations but introducing new ones not present before
#   2. HIGH — Reclassified failure codes: "failed:config" renamed to
#      "failed:process" to accurately cover config parse errors, ESLint crashes,
#      and timeouts (all non-retryable ESLint process failures); "failed:io"
#      unchanged (disk/permission/git errors, retry-eligible)
#   3. HIGH — Explicit AUTOFIX → VERIFY transition: "Autofix resolves all
#      violations" scenario now explicitly shows AUTOFIX → VERIFY → LEARN →
#      COMMIT flow; added phase-flow comment block to Autofix Phase
#   4. MEDIUM — Pre-existing changes contract: R3 header incorrectly said
#      "aborts if lint --fix overwrites" but scenario said "continues". Resolved:
#      the agent continues per briefing (pre-existing changes are unrecoverable
#      after lint --fix); header corrected, scenario unchanged
#   5. MEDIUM — VERIFY-MANUAL iteration counting: added comment block defining
#      iteration 1 = first MANUAL pass + first VERIFY check; cap = 10 VERIFY
#      checks; AUTOFIX → VERIFY (when MANUAL is skipped) does not count
#   6. MEDIUM — Cap-triggered suppressions flow to LEARN: added scenario
#      confirming VERIFY-MANUAL cap suppressions are recorded as UNRESOLVED
#      entries in learned-fixes
#   7. LOW — Commit message format: aligned all commit messages to briefing's
#      "resolve N violations" phrasing instead of "fix N"
#
# Prior revision notes (R3 addressed R2 objections 1-10):
#   1. Pre-existing unstaged changes data loss: snapshot + warn + continue
#   2. Bidirectional staging: commit asserts ALL own files staged
#   3. Attempt count reset on re-dispatch: fresh budgets per dispatch
#   4. Line-number drift: re-parse lint output after each fix
#   5. Failed report granularity: split into process vs I/O failures
#   6. Learn phase write failure: logs error, reports failed:io
#   7. Better fix criteria: fewer attempts OR UNRESOLVED→RESOLVED
#   8. Verify-Manual loop boundary: iteration 9 success + 9→10 transition
#   9. Existing inline eslint-disable: append rule to existing comment
#  10. Commit-lands-report-lost: orchestrator detects via git log

Feature: Initialization
  The lint-fixer loads known solutions and validates its knowledge base before processing

  @primary
  Scenario: Load learned fixes on startup
    Given the file "docs/lint-fixer/lint-fixer-learned.md" exists with 3 RESOLVED entries and 1 UNRESOLVED entry
    When the lint-fixer agent initializes
    Then it loads all 4 learned-fix entries into its working context
    And it proceeds to the AUTOFIX phase

  @alternative
  Scenario: Initialize with empty learned fixes file
    Given the file "docs/lint-fixer/lint-fixer-learned.md" exists but contains no entries
    When the lint-fixer agent initializes
    Then it proceeds to the AUTOFIX phase without errors

  @alternative
  Scenario: Initialize when learned fixes file does not exist
    Given the file "docs/lint-fixer/lint-fixer-learned.md" does not exist
    When the lint-fixer agent initializes
    Then it proceeds to the AUTOFIX phase without errors
    And it creates "docs/lint-fixer/lint-fixer-learned.md" during the LEARN phase

  @negative @failure_recovery
  Scenario: Graceful degradation with malformed learned-fixes file
    Given the file "docs/lint-fixer/lint-fixer-learned.md" contains a truncated entry missing the "Fix:" field
    And the file also contains 2 well-formed RESOLVED entries
    When the lint-fixer agent initializes
    Then it loads the 2 well-formed entries
    And it skips the malformed entry with a warning logged to "user_notes.md"
    And it proceeds to the AUTOFIX phase

  @edge_case
  Scenario: Learned fixes from prior pipeline run reference deleted files
    Given the learned-fixes file has a RESOLVED entry for rule "no-console" with pattern "Debug logging in request handler"
    And the source files referenced by that entry no longer exist after a rebase
    When the lint-fixer initializes
    Then it loads the entry as a pattern reference
    And it does not fail or skip initialization due to stale file paths

  @negative @failure_recovery
  Scenario: Pre-existing unstaged changes — snapshot and warn
    Given the git working tree has unstaged modifications in "apps/web/src/page.tsx"
    And these changes were not made by the lint-fixer
    When the lint-fixer agent initializes
    Then it records a snapshot of all pre-existing modified files and their paths
    And it logs a warning to "user_notes.md" noting pre-existing unstaged changes
    And it proceeds to the AUTOFIX phase

Feature: Autofix Phase
  The lint-fixer runs pnpm lint --fix to resolve all autofixable violations

  # --- Phase flow ---
  # AUTOFIX always transitions to a VERIFY check via "pnpm lint":
  #   - If VERIFY reports zero violations → skip MANUAL, proceed to LEARN → COMMIT
  #   - If VERIFY reports remaining violations → enter MANUAL phase
  # This AUTOFIX → VERIFY check is NOT counted as a VERIFY-MANUAL iteration
  # (iteration counting begins once the MANUAL phase is entered).

  @primary
  Scenario: Autofix resolves all violations — explicit VERIFY transition
    Given the monorepo has 12 ESLint violations, all autofixable
    When the lint-fixer runs "pnpm lint --fix"
    Then all 12 violations are resolved
    And the lint-fixer runs "pnpm lint" to verify the result
    And the verification reports zero remaining violations
    And the lint-fixer proceeds to LEARN and COMMIT, skipping the MANUAL phase

  @primary
  Scenario: Autofix resolves some violations — remaining enter MANUAL
    Given the monorepo has 12 ESLint violations, 8 autofixable and 4 manual
    When the lint-fixer runs "pnpm lint --fix"
    Then 8 violations are resolved by autofix
    And the lint-fixer runs "pnpm lint" to verify the result
    And the verification reports 4 remaining violations
    And the lint-fixer enters the MANUAL phase with those 4 violations

  @edge_case
  Scenario: Zero violations before autofix — clean short-circuit
    Given "pnpm lint" reports zero violations
    When the lint-fixer runs "pnpm lint --fix"
    Then the output reports zero violations
    And the lint-fixer skips MANUAL, LEARN, and COMMIT phases
    And no git commit is created

  @edge_case
  Scenario: Autofix introduces new violations not present before
    Given the monorepo has 5 ESLint violations, all autofixable
    And none of the files have violations for rule "no-unused-vars"
    When the lint-fixer runs "pnpm lint --fix"
    And "pnpm lint" verification reports that the original 5 violations are resolved
    But 2 new "no-unused-vars" violations appear in files modified by autofix
    Then the lint-fixer enters the MANUAL phase with the 2 new violations

  @negative @failure_recovery
  Scenario: Config parse error during autofix
    Given "pnpm lint --fix" exits with a non-zero code due to an ESLint config parse error
    And the stderr contains "Parsing error" or "Configuration error"
    When the lint-fixer detects the config parse failure
    Then it logs the full error output to "user_notes.md"
    And it reports "failed:process" to the stage 9 orchestrator
    And it does not proceed to the MANUAL phase

  @negative @failure_recovery
  Scenario: Partial autofix failure — autofixable violations remain after lint --fix
    Given the monorepo has 10 ESLint violations, all reported as autofixable
    And "pnpm lint --fix" exits with code 0
    But "pnpm lint" still reports 3 violations for rules that should have been autofixed
    When the lint-fixer detects the remaining violations
    Then it treats the 3 violations as manual-fix candidates
    And it proceeds to the MANUAL phase with those 3 violations

  @negative @edge_case
  Scenario: Autofix overwrites file with pre-existing unstaged changes
    Given the git working tree has unstaged modifications in "apps/web/src/page.tsx"
    And the lint-fixer recorded "apps/web/src/page.tsx" in its pre-existing changes snapshot
    And "pnpm lint --fix" modifies "apps/web/src/page.tsx"
    When the lint-fixer compares the file against its snapshot after autofix
    Then it detects that "apps/web/src/page.tsx" had pre-existing changes that may have been overwritten
    And it logs a data-loss warning to "user_notes.md" with the file path
    And it continues processing (the pre-existing changes are unrecoverable after lint --fix)

  @edge_case
  Scenario: Autofix does not touch files with pre-existing unstaged changes
    Given the git working tree has unstaged modifications in "apps/api/src/server.ts"
    And the lint-fixer recorded "apps/api/src/server.ts" in its pre-existing changes snapshot
    And "pnpm lint --fix" does not modify "apps/api/src/server.ts"
    When the lint-fixer compares files against its snapshot after autofix
    Then it confirms "apps/api/src/server.ts" was not affected
    And no data-loss warning is logged for that file

Feature: Manual Fix Phase
  The lint-fixer applies fixes to remaining violations, consulting learned patterns first

  # --- Learned-fixes matching ---
  # Match key: rule ID + contextual pattern description.
  # The LLM compares the violation's rule ID and surrounding code context against
  # each learned-fixes entry's rule ID and pattern description. A match means
  # the rule ID is identical and the code context is semantically similar to the
  # pattern description. Observable outcome: the lint-fixer applies the entry's
  # fix strategy as its first attempt.

  @primary
  Scenario: Known fix from learned-fixes resolves violation
    Given a violation of "@typescript-eslint/no-floating-promises" in "apps/web/src/handler.ts"
    And the learned-fixes file contains a RESOLVED entry for "@typescript-eslint/no-floating-promises" with pattern "Async function called without await in event handler"
    And the violation context is an async function call without await inside an event handler
    When the lint-fixer processes this violation
    Then it consults the entry whose rule and pattern match the violation context
    And it applies the entry's fix strategy as its first attempt
    And "pnpm lint" confirms the violation is resolved

  @primary
  Scenario: Known fix not consulted when rule matches but context differs
    Given a violation of "@typescript-eslint/no-floating-promises" in "apps/web/src/middleware.ts"
    And the learned-fixes file contains a RESOLVED entry for "@typescript-eslint/no-floating-promises" with pattern "Async function called without await in event handler"
    And the violation context is a top-level promise chain in middleware setup (not an event handler)
    When the lint-fixer processes this violation
    Then it does not apply the learned-fixes entry's strategy
    And it attempts a fresh fix based on the violation context

  @primary
  Scenario: Fix violation without learned fix — single attempt
    Given a violation of "no-console" in "packages/utils/src/logger.ts" at line 15
    And no matching entry exists in learned-fixes
    When the lint-fixer fixes the violation
    Then the violation is resolved
    And no entry is written to learned-fixes (single-try solutions are not recorded)

  @primary
  Scenario: Fix violation after multiple attempts
    Given a violation of "@typescript-eslint/consistent-type-imports" in "apps/web/src/types.ts" at line 8
    And no matching entry exists in learned-fixes
    When the lint-fixer eventually resolves the violation after more than 1 attempt
    Then the violation is resolved
    And a RESOLVED entry is written to learned-fixes with the attempt count

  @boundary
  Scenario: Fix succeeds on the 5th and final attempt
    Given a violation of "prefer-const" in "apps/web/src/config.ts" at line 3
    And the lint-fixer has failed 4 consecutive fix attempts for this violation
    When the lint-fixer succeeds on attempt 5
    Then the violation is resolved (not suppressed)
    And a RESOLVED entry is written to learned-fixes with "Attempts before solution: 5"

  @edge_case
  Scenario: Violations in subsequent files detected after fixing first file
    Given violations in "apps/web/src/a.ts" and "apps/web/src/b.ts"
    When the lint-fixer finishes fixing violations in "apps/web/src/a.ts"
    And runs "pnpm lint" to check the result
    Then it discovers the current violation state of remaining files
    And newly discovered violations (if any) are added to the work queue

  @edge_case
  Scenario: Fixing one violation cascades to resolve others in same file
    Given 3 violations in "apps/web/src/component.tsx"
    When the lint-fixer fixes the first violation
    And the subsequent "pnpm lint" shows the other 2 are also resolved
    Then the lint-fixer does not attempt fixes for the already-resolved violations
    And it moves to the next file

  @edge_case
  Scenario: Fix introduces new violation in same file
    Given 1 violation of "no-unused-vars" in "apps/web/src/utils.ts" at line 10
    When the lint-fixer fixes the violation
    And "pnpm lint" reveals a new "no-undef" violation at line 25 in the same file
    Then the new violation is added to the work queue
    And the lint-fixer attempts to fix it

  @edge_case
  Scenario: Fix introduces new violation in a different file
    Given a violation of "import/no-cycle" in "apps/web/src/a.ts"
    When the lint-fixer fixes the cycle by restructuring the import
    And "pnpm lint" reveals a new "no-unused-vars" violation in "apps/web/src/b.ts"
    Then the violation in "apps/web/src/b.ts" is added to the work queue

  @negative @edge_case
  Scenario: Learned-fix false positive — applied fix does not resolve violation
    Given the learned-fixes file contains a RESOLVED entry for "@typescript-eslint/no-floating-promises" with pattern "Async function called without await in event handler"
    And the lint-fixer applies that entry's fix to a violation with a similar but different context
    When "pnpm lint" still reports the violation after the learned fix is applied
    Then the lint-fixer treats it as a failed attempt (attempt 1 of 5)
    And it continues with alternative fix strategies using its remaining 4 attempts

  @edge_case
  Scenario: Agent fixes unfamiliar rule by exploring config at runtime
    Given the lint-fixer encounters a violation for rule "react/no-unstable-nested-components" in "apps/web/src/page.tsx"
    And no matching entry exists in learned-fixes
    When the lint-fixer explores the ESLint config files to understand the rule's options
    And applies a fix based on the rule's configuration
    Then "pnpm lint" confirms the violation in "apps/web/src/page.tsx" is resolved

  @edge_case
  Scenario: Conflicting rules — fix for one rule triggers another
    Given a fix for rule "@typescript-eslint/prefer-nullish-coalescing" introduces a new violation for "no-extra-boolean-cast"
    When the lint-fixer detects the new violation via "pnpm lint"
    Then it adds the new violation to the work queue
    And it resolves or suppresses both violations within their respective attempt budgets

  @edge_case
  Scenario: Line-number drift after fix inserts or deletes lines
    Given violations at lines 10, 25, and 40 in "apps/web/src/utils.ts"
    And the lint-fixer fixes the violation at line 10 by inserting 3 new lines
    When the lint-fixer runs "pnpm lint" after the fix
    Then it uses the fresh lint output with updated line numbers for remaining violations
    And it does not attempt to edit line 25 or 40 using the stale pre-fix positions
    And the violations formerly at lines 25 and 40 are addressed at their current positions

  @negative @failure_recovery
  Scenario: pnpm lint crashes during MANUAL phase
    Given the lint-fixer is processing violations in the MANUAL phase
    And "pnpm lint" exits with a non-zero code that is not an ESLint violation report
    And the stderr contains a stack trace or segfault
    When the lint-fixer detects the abnormal lint exit
    Then it logs the full error output to "user_notes.md"
    And it reports "failed:process" to the stage 9 orchestrator
    And it does not proceed to the VERIFY phase

  @negative @failure_recovery
  Scenario: pnpm lint hangs during MANUAL phase — no output within timeout
    Given the lint-fixer runs "pnpm lint" to verify a file fix
    And the command produces no output for longer than the configured timeout
    When the lint-fixer detects the timeout
    Then it terminates the lint process
    And it logs the timeout to "user_notes.md" with the file being processed
    And it reports "failed:process" to the stage 9 orchestrator

Feature: Violation Suppression
  After 5 failed attempts per violation, the lint-fixer suppresses with documentation

  @negative @failure_recovery
  Scenario: Suppress violation after 5 failed attempts with full documentation
    Given a violation of "sonarjs/cognitive-complexity" in "apps/api/src/handler.ts" at line 42
    And the lint-fixer has failed 5 consecutive fix attempts for this specific violation
    When the lint-fixer exhausts its attempts
    Then it adds an eslint-disable-next-line comment above line 42 with:
      | field   | value                                                              |
      | rule    | sonarjs/cognitive-complexity                                       |
      | reason  | lint-fixer: unable to resolve after 5 attempts. [strategy summary] |
    And it records an UNRESOLVED entry in "docs/lint-fixer/lint-fixer-learned.md"
    And it appends to "user_notes.md" with the rule name, file path, line number, and all attempted strategies

  @boundary
  Scenario: Attempt tracking is per file:line:rule — independent budgets
    Given a violation of "no-console" in "apps/web/src/a.ts" at line 10
    And a violation of "no-console" in "apps/web/src/b.ts" at line 20
    When the lint-fixer exhausts 5 attempts on the violation in "a.ts" at line 10
    Then only the violation in "a.ts" at line 10 is suppressed
    And the violation in "b.ts" at line 20 retains a full 5-attempt budget

  @edge_case
  Scenario: Suppression comment itself triggers a new violation
    Given the lint-fixer adds an eslint-disable-next-line comment above line 42
    And the comment causes the line to exceed the "max-len" rule threshold
    When "pnpm lint" detects the new "max-len" violation
    Then the lint-fixer treats it as a fresh work item with its own 5-attempt budget

  @edge_case
  Scenario: Suppression on line with existing eslint-disable-next-line for different rule
    Given "apps/web/src/handler.ts" line 41 already contains "// eslint-disable-next-line @typescript-eslint/no-explicit-any"
    And the lint-fixer needs to suppress "sonarjs/cognitive-complexity" on line 42
    When the lint-fixer adds the suppression
    Then it appends the rule to the existing comment: "// eslint-disable-next-line @typescript-eslint/no-explicit-any, sonarjs/cognitive-complexity -- lint-fixer: unable to resolve after 5 attempts. [strategy summary]"
    And it does not create a duplicate eslint-disable-next-line comment

  @edge_case
  Scenario: Suppression on line with existing eslint-disable-next-line for same rule
    Given "apps/web/src/handler.ts" line 41 already contains "// eslint-disable-next-line sonarjs/cognitive-complexity -- manual suppression"
    And the lint-fixer detects that "sonarjs/cognitive-complexity" is already suppressed on the target line
    When the lint-fixer evaluates the violation
    Then it does not add a duplicate suppression
    And it logs the pre-existing suppression to "user_notes.md" noting the rule is already disabled

Feature: Verify-Manual Loop
  The lint-fixer loops between VERIFY and MANUAL phases with a bounded iteration cap

  # --- Iteration counting ---
  # Iteration 1 = the first time the MANUAL phase runs and is followed by a
  #   VERIFY check. The AUTOFIX → VERIFY transition (when MANUAL is skipped)
  #   does NOT count as an iteration.
  # Iteration N = the Nth MANUAL pass + its subsequent VERIFY check.
  # Cap = 10 iterations. On the 10th VERIFY check, if violations remain,
  #   the lint-fixer suppresses all remaining violations instead of looping
  #   back to MANUAL for an 11th pass.

  @primary
  Scenario: Verification passes on first check — iteration 1
    Given the MANUAL phase resolved all violations on its first pass
    When the lint-fixer runs "pnpm lint" in the VERIFY phase (iteration 1)
    Then the lint output reports zero violations
    And the lint-fixer proceeds to the LEARN phase

  @alternative
  Scenario: Verification finds remaining violations — loop back to manual
    Given the MANUAL phase completed (iteration 1) but 2 violations were missed
    When the lint-fixer runs "pnpm lint" in the VERIFY phase
    And the output shows 2 remaining violations
    Then the lint-fixer loops back to the MANUAL phase for iteration 2 with those 2 violations

  @primary
  Scenario: Verification clean after looping back — iteration 2
    Given the VERIFY phase (iteration 1) found 2 remaining violations
    And the lint-fixer looped back to MANUAL and resolved both
    When the lint-fixer runs "pnpm lint" in the VERIFY phase (iteration 2)
    Then the lint output reports zero violations
    And the lint-fixer proceeds to the LEARN phase

  @boundary
  Scenario: Iteration 9 succeeds — no cap triggered
    Given the lint-fixer has completed 8 VERIFY-MANUAL iterations with violations persisting
    And on iteration 9 the MANUAL phase resolves all remaining violations
    When the lint-fixer runs "pnpm lint" in the 9th VERIFY check
    Then the lint output reports zero violations
    And the lint-fixer proceeds to the LEARN phase without triggering the cap
    And no VERIFY-MANUAL cap suppression comments are added

  @boundary @edge_case
  Scenario: Transition from iteration 9 to iteration 10 — cap triggered
    Given the lint-fixer has completed 9 VERIFY-MANUAL iterations
    And the 9th VERIFY check still reports 2 remaining violations
    When the lint-fixer enters iteration 10
    Then the MANUAL phase runs one final time
    And the 10th VERIFY check reports 2 remaining violations
    And the lint-fixer does not loop back for an 11th MANUAL pass
    And it suppresses all 2 remaining violations with eslint-disable-next-line comments
    And each suppression comment notes "lint-fixer: VERIFY-MANUAL cap reached"
    And it logs the remaining violations to "user_notes.md"
    And it proceeds to the LEARN phase

  @boundary @edge_case
  Scenario: Cross-file ping-pong bounded by VERIFY-MANUAL cap
    Given a fix in "apps/web/src/a.ts" introduces a violation in "apps/web/src/b.ts"
    And fixing "apps/web/src/b.ts" introduces a new violation back in "apps/web/src/a.ts"
    And this cross-file cycle repeats across multiple VERIFY-MANUAL iterations
    When the lint-fixer reaches the 10th iteration's VERIFY check with violations remaining
    Then it suppresses all remaining violations with eslint-disable-next-line comments
    And each suppression comment notes "lint-fixer: VERIFY-MANUAL cap reached"
    And it logs the ping-pong pattern to "user_notes.md"
    And it proceeds to the LEARN phase

  @boundary @edge_case
  Scenario: VERIFY-MANUAL loop hits cap — non-repeating chain
    Given the lint-fixer has cycled between VERIFY and MANUAL for 10 iterations
    And 3 violations still remain (each fix introduces a different new violation)
    When the lint-fixer reaches the 10th VERIFY check with 3 violations remaining
    Then it suppresses all 3 remaining violations with eslint-disable-next-line comments
    And each suppression comment notes "lint-fixer: VERIFY-MANUAL cap reached"
    And it logs the remaining violations to "user_notes.md"
    And it proceeds to the LEARN phase

Feature: Learning Phase
  The lint-fixer updates its knowledge base with multi-try solutions and unresolved patterns

  @primary
  Scenario: Record a multi-try solution
    Given the lint-fixer resolved "@typescript-eslint/no-floating-promises" after 3 attempts
    When the LEARN phase executes
    Then "docs/lint-fixer/lint-fixer-learned.md" contains a new RESOLVED entry
    And the entry includes the rule name, contextual pattern description, fix description, and attempt count

  @primary
  Scenario: Update existing entry with fewer attempts
    Given the learned-fixes file has a RESOLVED entry for "@typescript-eslint/no-floating-promises" with "Attempts before solution: 3"
    And the lint-fixer resolved a matching pattern this run in 2 attempts
    When the LEARN phase executes
    Then the entry is updated with the new fix description
    And "Attempts before solution" is set to 2

  @alternative
  Scenario: Update existing entry — UNRESOLVED to RESOLVED
    Given the learned-fixes file has an UNRESOLVED entry for "sonarjs/cognitive-complexity"
    And the lint-fixer resolved a matching violation on this run in 4 attempts
    When the LEARN phase executes
    Then the entry status is updated from UNRESOLVED to RESOLVED
    And the fix description and attempt count are recorded

  @boundary
  Scenario: Existing entry not updated when current attempt count is equal and status unchanged
    Given the learned-fixes file has a RESOLVED entry for "prefer-const" with "Attempts before solution: 3"
    And the lint-fixer resolved a matching pattern this run in 3 attempts
    When the LEARN phase executes
    Then the existing entry is not modified
    And the fix description and attempt count remain unchanged

  @primary
  Scenario: Record an unresolved pattern
    Given the lint-fixer suppressed "sonarjs/cognitive-complexity" after 5 failed attempts
    When the LEARN phase executes
    Then "docs/lint-fixer/lint-fixer-learned.md" contains a new UNRESOLVED entry
    And the entry lists all fix strategies that were attempted

  @boundary
  Scenario: Single-try fix is not recorded in learned-fixes
    Given the lint-fixer resolved "no-console" on the first attempt
    When the LEARN phase executes
    Then no entry for this specific fix is written to the learned-fixes file

  @edge_case
  Scenario: Existing entry not updated when current attempt count is higher
    Given the learned-fixes file has a RESOLVED entry for "prefer-const" with "Attempts before solution: 2"
    And the lint-fixer resolved a matching pattern this run in 4 attempts
    When the LEARN phase executes
    Then the existing entry is not modified
    And the "Attempts before solution" remains 2

  @edge_case
  Scenario: VERIFY-MANUAL cap suppressions recorded as UNRESOLVED in learned-fixes
    Given the lint-fixer suppressed 2 violations due to the VERIFY-MANUAL cap being reached
    And both violations had fewer than 5 per-violation attempts
    When the LEARN phase executes
    Then "docs/lint-fixer/lint-fixer-learned.md" contains 2 new UNRESOLVED entries
    And each entry notes "VERIFY-MANUAL cap reached" as the reason
    And each entry lists the fix strategies attempted during the available iterations

  @negative @failure_recovery
  Scenario: Write failure during LEARN phase — disk or permission error
    Given the lint-fixer has source fixes applied in the working tree
    And writing to "docs/lint-fixer/lint-fixer-learned.md" fails due to a disk-full or permission error
    When the LEARN phase detects the write failure
    Then it logs the error to "user_notes.md" including the entries that failed to persist
    And it reports "failed:io" to the stage 9 orchestrator
    And the source file fixes already applied in the working tree are preserved
    And the COMMIT phase is skipped (learned-fixes state is inconsistent)

Feature: Commit Phase
  The lint-fixer creates a single commit per round including source fixes and learned-fixes updates

  @primary
  Scenario: Single commit includes source fixes and learned-fixes updates
    Given the lint-fixer resolved 7 violations across 4 files (2 multi-try)
    And the LEARN phase updated "docs/lint-fixer/lint-fixer-learned.md"
    When the COMMIT phase executes
    Then a single git commit is created containing both source file changes and "docs/lint-fixer/lint-fixer-learned.md"
    And the commit message is "fix(lint): resolve 7 violations from global review"

  @primary
  Scenario: Commit message distinguishes resolved from suppressed
    Given the lint-fixer resolved 5 violations and suppressed 2 violations
    When the COMMIT phase executes
    Then the commit message is "fix(lint): resolve 5, suppress 2 violations from global review"

  @alternative
  Scenario: Commit message for suppression-only changes
    Given the lint-fixer resolved 0 violations and suppressed 3 violations
    When the COMMIT phase executes
    Then the commit message is "fix(lint): suppress 3 violations from global review"

  @primary
  Scenario: Commit with source fixes only — no learned-fixes changes
    Given the lint-fixer resolved 4 violations, all on the first attempt
    And the LEARN phase did not modify "docs/lint-fixer/lint-fixer-learned.md"
    When the COMMIT phase executes
    Then a single git commit is created containing only the source file changes
    And the commit message is "fix(lint): resolve 4 violations from global review"

  @boundary
  Scenario: No commit when no violations found
    Given "pnpm lint" reported zero violations after autofix
    When the lint-fixer completes
    Then no git commit is created
    And no files are modified

  @primary @quality_attribute
  Scenario: Idempotency — running on clean codebase is a no-op
    Given the monorepo is already lint-clean
    And "pnpm lint --fix" produces no changes
    And "pnpm lint" reports zero violations
    When the lint-fixer completes its full lifecycle
    Then no git commit is created
    And no files are modified
    And "docs/lint-fixer/lint-fixer-learned.md" is unchanged

  @edge_case
  Scenario: Commit stages ALL files modified by the lint-fixer and no others
    Given the git working tree has pre-existing unstaged changes in "apps/api/src/server.ts"
    And the lint-fixer modified "apps/web/src/page.tsx" and "packages/utils/src/helper.ts"
    And the LEARN phase updated "docs/lint-fixer/lint-fixer-learned.md"
    And the lint-fixer appended warnings to "user_notes.md"
    When the COMMIT phase executes
    Then the commit includes "apps/web/src/page.tsx", "packages/utils/src/helper.ts", and "docs/lint-fixer/lint-fixer-learned.md"
    And the commit does not include "user_notes.md" (log file, not a lint fix artifact)
    And "apps/api/src/server.ts" remains unstaged and is not included in the commit

  @negative @failure_recovery
  Scenario: Commit failure — hook rejection
    Given the lint-fixer has staged all modified files
    And the pre-commit hook rejects the commit (e.g., formatting check fails)
    When the commit fails
    Then the lint-fixer logs the hook failure details to "user_notes.md"
    And it reports "failed:io" to the stage 9 orchestrator
    And it does not leave partially committed changes

  @negative @failure_recovery
  Scenario: Commit failure — disk full or I/O error
    Given the lint-fixer attempts to create a commit
    And the git commit fails due to a disk-full or I/O error
    When the commit fails
    Then the lint-fixer logs the error to "user_notes.md"
    And it reports "failed:io" to the stage 9 orchestrator
    And the working tree retains the applied fixes (no rollback of file changes)

Feature: Scope and Boundaries
  The lint-fixer operates on the entire monorepo and stays within its lint-only domain

  @primary
  Scenario: Fix violations in files outside the pipeline diff
    Given the pipeline modified "apps/web/src/page.tsx"
    And "pnpm lint" also reports a violation in "packages/utils/src/helper.ts" which was not modified by the pipeline
    When the lint-fixer processes violations
    Then it fixes the violation in "packages/utils/src/helper.ts"
    And it fixes any violation in "apps/web/src/page.tsx"

  @boundary
  Scenario: Lint-fixer does not run tests or type checking
    Given the lint-fixer is in any phase
    When it verifies its work
    Then it only runs "pnpm lint" commands
    And it never runs "pnpm test" or "pnpm tsc"

  @boundary
  Scenario: Lint-fixer does not fix test failures
    Given "pnpm lint" output is clean
    And "pnpm test" has 2 failing tests (reported by the orchestrator)
    When the lint-fixer evaluates its work
    Then it reports "clean" to the stage 9 orchestrator
    And it does not attempt to fix test failures

Feature: Stage 9 Handoff Interface
  Minimal contract defining how the lint-fixer integrates with the stage 9 orchestrator

  # --- Report status codes ---
  # "clean"           — zero violations found; no changes made
  # "fixed"           — violations resolved/suppressed and committed
  # "failed:process"  — ESLint process failure: config parse error, crash,
  #                     segfault, or timeout (non-retryable; the ESLint
  #                     environment itself is broken)
  # "failed:io"       — disk, permission, or git I/O error (retry-eligible;
  #                     the ESLint process was healthy but a side effect failed)
  #
  # Rationale for grouping config + crash + timeout under "failed:process":
  # All three indicate the ESLint process cannot produce valid output. The
  # orchestrator's only meaningful distinction is retryability — none of these
  # are retry-eligible without external intervention (fix the config, debug the
  # crash, or increase resources). Splitting into "failed:config" vs
  # "failed:runtime" would force the orchestrator to handle two codes identically.

  @integration
  Scenario: Lint-fixer receives ESLint output and produces a typed result
    Given the stage 9 orchestrator dispatches the lint-fixer with raw "pnpm lint" output
    When the lint-fixer completes its lifecycle
    Then it reports one of: "clean", "fixed", "failed:process", or "failed:io"
    And the orchestrator can distinguish retry-eligible failures ("failed:io") from non-retryable ones ("failed:process")

  @integration
  Scenario: Lint-fixer changes do not prevent subsequent typescript-writer runs
    Given the lint-fixer committed source fixes that introduced a test regression
    When the orchestrator runs the typescript-writer in the next iteration
    Then the typescript-writer can detect and fix the regression independently
    And no special cross-agent communication is required

  @integration
  Scenario: Lint-fixer re-dispatched after typescript-writer introduces new lint violations
    Given the lint-fixer completed a prior round with a "clean" result
    And the typescript-writer subsequently fixed test failures, introducing 3 new lint violations
    When the stage 9 orchestrator dispatches the lint-fixer again with the new "pnpm lint" output
    Then the lint-fixer initializes fresh (reloading learned-fixes from disk)
    And it processes all 3 new violations through its normal AUTOFIX → MANUAL → VERIFY → LEARN → COMMIT lifecycle
    And each violation starts with a fresh 5-attempt budget (not carried from prior rounds)
    And the attempt tracker contains no entries from the previous dispatch

  @integration @boundary
  Scenario: Orchestrator max rounds reached — lint-fixer reports remaining violations
    Given the stage 9 orchestrator has reached its maximum round count
    And the lint-fixer still has 2 unresolved violations
    When the orchestrator signals termination
    Then the lint-fixer reports the 2 remaining violations in its output

  @integration @failure_recovery
  Scenario: Agent crashes after commit but before reporting to orchestrator
    Given the lint-fixer successfully created a commit "fix(lint): resolve 4 violations from global review"
    And the agent crashes before reporting its status to the stage 9 orchestrator
    When the stage 9 orchestrator detects the lint-fixer did not report
    Then the orchestrator checks the git log for a lint-fixer commit since the last known state
    And it finds the "fix(lint): resolve 4 violations from global review" commit
    And it re-dispatches the lint-fixer (which initializes fresh and finds a clean lint state)
    And no duplicate commit is created because "pnpm lint" reports zero violations
