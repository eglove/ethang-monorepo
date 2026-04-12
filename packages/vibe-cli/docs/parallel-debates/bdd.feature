# BDD Scenarios — Parallel Debates
# Date: 2026-04-12
# Source: docs/parallel-debates/elicitor.md
# Revision: addresses 16 debate objections (4 blocking, 9 high, 3 consider)
#
# Glossary — Ubiquitous Language
#   Elicitor briefing        — structured requirements document produced by stage 1 at docs/<feature>/elicitor.md
#   BDD writer               — agent that produces Gherkin scenarios (bdd.feature) from the elicitor briefing
#   TLA+ writer              — agent that produces TLA+ specifications (tla/*.tla) from the elicitor briefing, including TLC verification
#   TLC verification         — model checker run bundled into the TLA+ writer's revision process; a revision is only "done" when TLC passes
#   Parallel writers          — stage 2, where BDD and TLA+ writers run concurrently via PowerShell jobs
#   Unified debate            — stage 3, a single debate loop that reviews both BDD and TLA+ documents together
#   Unified debate moderator  — agent prompt that orchestrates expert opinions across both documents simultaneously
#   Objection                 — a tagged critique from the debate moderator, routed to a specific writer via the "target" field ("bdd" or "tla")
#   Objection routing         — grouping moderator objections by their "target" field and dispatching only to the appropriate writer
#   Consensus                 — moderator declares CONSENSUS_REACHED when no new objections remain for either document
#   Partial consensus         — moderator declares PARTIAL_CONSENSUS when objections remain for one or both documents
#   Post-debate artifacts     — stage 4 outputs: BDD fixture JSON generated from final Gherkin
#   Unified debate session    — single transcript file (unified-debate.md) capturing all rounds of the combined debate
#   Invoke-Parallel           — reusable utility function that dispatches multiple scriptblocks as PowerShell jobs and collects keyed results
#   Invoke-UnifiedDebateLoop  — function managing the two-writer debate: routes objections, dispatches parallel revisions, enforces max rounds
#   Resume-Pipeline           — utility that auto-detects feature name and last completed stage from log markers
#   Resolve-PipelineState     — function that validates required INPUT artifacts exist for a given starting stage (checks prior-stage outputs, not the stage's own outputs)
#   MaxDebateRounds           — maximum debate iterations before moving on (default: 10)
#   Pipeline stage            — one of 7 sequential phases: elicitor (1), parallel-writers (2), unified-debate (3), post-debate (4), implementation-writer (5), implementation-debate (6), coding (7)
#   Recommendation            — per-writer final revision guidance provided at CONSENSUS_REACHED, keyed as "bdd" and "tla" in the moderator schema
#   Fresh run                 — pipeline invocation with a $Seed prompt, starting from stage 1
#   -Resume                   — switch parameter on vibe.ps1 that resumes from the last completed stage
#   Write-PipelineLog         — consolidated logging function: Write-PipelineLog -Message <string> [-Root <path>]; single definition in pipeline-log.ps1
#   Stage completion marker   — log entry written by each stage on success, format: "STAGE_COMPLETE:<N>:<feature-name>"

# =============================================================================
# Item 1 — Parallel Writers (Stage 2)
# =============================================================================

Feature: Stage 2 dispatches BDD and TLA+ writers in parallel
  Both writers receive only the elicitor briefing and produce their artifacts concurrently

  Scenario: Both writers receive the elicitor briefing as sole input
    Given feature "auth-flow" has a completed elicitor briefing at "docs/auth-flow/elicitor.md"
    When stage 2 (parallel-writers) executes for "auth-flow"
    Then the BDD writer receives "docs/auth-flow/elicitor.md" as its input
    And the TLA+ writer receives "docs/auth-flow/elicitor.md" as its input
    And neither writer receives the other writer's output

  Scenario: Both writers run concurrently via Invoke-Parallel
    Given feature "auth-flow" has a completed elicitor briefing
    When stage 2 dispatches the writers
    Then Invoke-Parallel is called with two jobs: "bdd" and "tla"
    And both jobs execute concurrently (not sequentially)

  Scenario: BDD writer produces bdd.feature
    Given the BDD writer completes successfully for feature "auth-flow"
    When stage 2 collects results
    Then "docs/auth-flow/bdd.feature" exists on disk
    And the file contains valid Gherkin syntax

  Scenario: TLA+ writer produces spec files with TLC verification
    Given the TLA+ writer completes successfully for feature "auth-flow"
    When stage 2 collects results
    Then at least one .tla file exists under "docs/auth-flow/tla/"
    And TLC verification passed as part of the writer's process

  Scenario: One writer fails while the other succeeds
    Given feature "auth-flow" has a completed elicitor briefing
    And the BDD writer will fail during execution
    And the TLA+ writer will succeed
    When stage 2 dispatches both writers in parallel
    Then the pipeline waits for the TLA+ writer to complete (does not kill it)
    And stage 2 fails with an error reporting that the BDD writer failed
    And "docs/auth-flow/tla/" contains the TLA+ writer's output (preserved on disk)

  Scenario: Both writers fail
    Given feature "auth-flow" has a completed elicitor briefing
    And both writers will fail during execution
    When stage 2 dispatches both writers in parallel
    Then stage 2 fails with an error reporting that both the BDD writer and TLA+ writer failed

  Scenario: TLA+ writer fails while BDD writer succeeds
    Given feature "auth-flow" has a completed elicitor briefing
    And the TLA+ writer will fail during execution
    And the BDD writer will succeed
    When stage 2 dispatches both writers in parallel
    Then the pipeline waits for the BDD writer to complete (does not kill it)
    And stage 2 fails with an error reporting that the TLA+ writer failed
    And "docs/auth-flow/bdd.feature" exists on disk (preserved)

  # [ADDED — Blocking #4] Stage completion marker
  Scenario: Stage 2 writes a completion marker on success
    Given feature "auth-flow" has a completed elicitor briefing
    And both writers complete successfully
    When stage 2 finishes
    Then pipeline.log contains "STAGE_COMPLETE:2:auth-flow"

# =============================================================================
# Item 2 — Invoke-Parallel Utility
# =============================================================================

Feature: Invoke-Parallel dispatches scriptblocks as concurrent jobs with keyed results
  Reusable utility used by stage 2 and within the debate loop for parallel revisions

  Scenario: Two jobs both succeed and return keyed results
    Given Invoke-Parallel is called with jobs "alpha" and "beta"
    And both jobs complete successfully
    When results are collected
    Then the result hashtable contains key "alpha" with job alpha's output
    And the result hashtable contains key "beta" with job beta's output
    And $results["alpha"].Success is $true
    And $results["beta"].Success is $true

  # [REVISED — Blocking #2] Specify observable error result shape
  Scenario: One job fails and the other succeeds with typed error result
    Given Invoke-Parallel is called with jobs "alpha" and "beta"
    And job "alpha" throws an error with message "Claude invocation timed out"
    And job "beta" completes successfully with output "beta-output"
    When results are collected
    Then $results["alpha"].Success is $false
    And $results["alpha"].Error is "Claude invocation timed out"
    And $results["alpha"].Output is $null
    And $results["beta"].Success is $true
    And $results["beta"].Error is $null
    And $results["beta"].Output is "beta-output"
    And Invoke-Parallel does not terminate "beta" early

  # [REVISED — Blocking #2] Both fail with typed error results
  Scenario: Both jobs fail with typed error results
    Given Invoke-Parallel is called with jobs "alpha" and "beta"
    And job "alpha" throws an error with message "alpha error"
    And job "beta" throws an error with message "beta error"
    When results are collected
    Then $results["alpha"].Success is $false
    And $results["alpha"].Error is "alpha error"
    And $results["beta"].Success is $false
    And $results["beta"].Error is "beta error"

  Scenario: Results are keyed by the caller-provided job name
    Given Invoke-Parallel is called with jobs "bdd" and "tla"
    And both jobs return different output values
    When results are collected
    Then $results["bdd"] contains the BDD job's output
    And $results["tla"] contains the TLA+ job's output

  Scenario: Invoke-Parallel is used within the debate loop for parallel revisions
    Given the unified debate loop has objections for both "bdd" and "tla" writers
    When the loop dispatches parallel revisions
    Then Invoke-Parallel is called with a "bdd" revision job and a "tla" revision job
    And both revisions execute concurrently

  # [ADDED — High #11] Log write race condition for parallel jobs
  Scenario: Parallel jobs do not corrupt pipeline.log with concurrent writes
    Given Invoke-Parallel is called with jobs "alpha" and "beta"
    And both jobs call Write-PipelineLog during execution
    When both jobs write to pipeline.log concurrently
    Then each log line is written atomically (no interleaved characters)
    And Write-PipelineLog uses a mutex or file lock to serialize writes

  # [ADDED — Consider #14] Invoke-Parallel timeout
  Scenario: Job exceeding timeout is terminated
    Given Invoke-Parallel is called with jobs "alpha" and "beta" and a timeout of 300 seconds
    And job "alpha" hangs indefinitely
    And job "beta" completes in 10 seconds
    When 300 seconds elapse
    Then job "alpha" is terminated
    And $results["alpha"].Success is $false
    And $results["alpha"].Error contains "timed out"
    And $results["beta"].Success is $true
    And $results["beta"].Output contains beta's result

# =============================================================================
# Item 3 — Unified Debate Loop (Stage 3)
# =============================================================================

Feature: Unified debate reviews both BDD and TLA+ documents together
  A single debate loop with a unified moderator evaluates both artifacts simultaneously

  Scenario: Moderator receives both documents for review
    Given feature "auth-flow" has "docs/auth-flow/bdd.feature" and "docs/auth-flow/tla/auth.tla"
    When the unified debate loop starts for "auth-flow"
    Then the debate moderator agent receives both the BDD feature file and the TLA+ spec file
    And all participating experts see both documents

  Scenario: Consensus requires both documents approved simultaneously
    Given the moderator has reviewed both documents
    And the moderator has no objections for the BDD document
    And the moderator has no objections for the TLA+ document
    When the moderator renders a verdict
    Then the result is "CONSENSUS_REACHED"
    And both documents proceed to stage 4

  Scenario: Partial consensus when only one document has objections
    Given the moderator has reviewed both documents
    And the moderator has no objections for the BDD document
    And the moderator has 2 objections for the TLA+ document
    When the moderator renders a verdict
    Then the result is "PARTIAL_CONSENSUS"
    And the debate loop continues (no partial graduation)

  Scenario: Objections are tagged with target field for routing
    Given the moderator produces objections in round 3
    When the objections are parsed
    Then each objection has a "target" field with value "bdd" or "tla"
    And objections are grouped by target before dispatching to writers

  Scenario: Single-writer objections route only to that writer
    Given the moderator has 3 objections all tagged with target "tla"
    And the moderator has 0 objections tagged with target "bdd"
    When the debate loop dispatches revisions
    Then only the TLA+ writer receives revision instructions
    And the BDD writer is not invoked in this round
    And the pipeline waits for the TLA+ revision to complete before the next round

  Scenario: Both-writer objections dispatch parallel revisions
    Given the moderator has 2 objections tagged with target "bdd"
    And the moderator has 1 objection tagged with target "tla"
    When the debate loop dispatches revisions
    Then the BDD writer and TLA+ writer are invoked in parallel via Invoke-Parallel
    And the pipeline waits for both revisions to complete before the next round

  Scenario: TLC verification runs as part of TLA+ revision
    Given the TLA+ writer receives a revision instruction
    When the TLA+ writer completes its revision
    Then TLC verification runs as part of the revision process
    And the revision is only considered "done" when TLC passes

  Scenario: Debate session is captured in unified-debate.md
    Given the unified debate loop runs for 4 rounds
    When the loop completes
    Then "docs/auth-flow/unified-debate.md" contains the full debate history
    And the session file includes all rounds, objections, and revisions for both documents

  Scenario: Consensus reached triggers per-writer final recommendations
    Given the moderator declares "CONSENSUS_REACHED" with recommendations
    When the debate loop processes the consensus result
    Then the BDD writer receives the recommendation keyed under "bdd"
    And the TLA+ writer receives the recommendation keyed under "tla"
    And both final revisions are applied before the loop exits

  Scenario: Max debate rounds (10) reached with unresolved objections
    Given the unified debate loop has completed 10 rounds
    And the moderator still has unresolved objections
    When round 10 completes
    Then the loop exits without consensus
    And unresolved objections are logged
    And the pipeline proceeds to stage 4 with the current document versions

  # [ADDED — Blocking #3] Invoke-UnifiedDebateLoop return contract
  Scenario: Invoke-UnifiedDebateLoop returns structured result to stage 3
    Given the unified debate loop completes with consensus in round 4
    When Invoke-UnifiedDebateLoop returns
    Then the return object contains .Result with value "CONSENSUS_REACHED"
    And .RoundsCompleted is 4
    And .FinalGherkinPath is "docs/auth-flow/bdd.feature"
    And .FinalTlaDir is "docs/auth-flow/tla/"
    And .SessionFile is "docs/auth-flow/unified-debate.md"
    And .UnresolvedObjections is an empty array

  Scenario: Invoke-UnifiedDebateLoop returns unresolved objections when max rounds hit
    Given the unified debate loop exits after 10 rounds without consensus
    When Invoke-UnifiedDebateLoop returns
    Then .Result is "MAX_ROUNDS_REACHED"
    And .RoundsCompleted is 10
    And .UnresolvedObjections contains the remaining objections

  # [ADDED — Blocking #4] Stage completion marker
  Scenario: Stage 3 writes a completion marker on success
    Given the unified debate loop completes for feature "auth-flow"
    When stage 3 finishes
    Then pipeline.log contains "STAGE_COMPLETE:3:auth-flow"

  # [ADDED — High #12] Debate round counter persistence decision
  Scenario: Resume replays stage 3 entirely (round counter resets)
    Given the pipeline crashed during stage 3 round 6 for feature "auth-flow"
    And pipeline.log does NOT contain "STAGE_COMPLETE:3:auth-flow"
    When the user runs "./vibe.ps1 -Resume"
    Then Resume-Pipeline detects last completed stage as 2
    And stage 3 restarts from round 1 with a fresh 10-round budget
    And the prior partial unified-debate.md is overwritten

# =============================================================================
# Item 4 — Unified Debate Error Handling
# =============================================================================

Feature: Debate loop handles revision failures gracefully
  Failed revisions are logged and preserved; the other writer's work is not lost

  Scenario: BDD revision fails during a debate round
    Given the debate loop dispatched parallel revisions for both writers
    And the BDD writer's revision fails (e.g., Claude invocation error)
    And the TLA+ writer's revision succeeds
    When the revision results are collected
    Then the TLA+ writer's revision is preserved on disk
    And the debate round fails with an error logging the BDD revision failure
    And stage 3 exits

  Scenario: TLA+ revision fails due to TLC check exhaustion
    Given the debate loop dispatched a revision for the TLA+ writer
    And the TLA+ writer exhausts all TLC check attempts
    When the revision results are collected
    Then the debate round fails with an error logging the TLC exhaustion
    And any successful BDD revision from the same round is preserved on disk
    And stage 3 exits

  Scenario: Both revisions fail in the same round
    Given the debate loop dispatched parallel revisions for both writers
    And both writers' revisions fail
    When the revision results are collected
    Then the debate round fails with an error logging both failures
    And stage 3 exits

  Scenario: Revision failure preserves prior successful revisions
    Given the debate loop completed rounds 1 and 2 successfully
    And in round 3 the TLA+ revision fails
    When stage 3 exits
    Then "docs/auth-flow/bdd.feature" reflects the round 2 revision (latest successful)
    And "docs/auth-flow/tla/" reflects the round 2 TLA+ revision (latest successful)

# =============================================================================
# Item 5 — Unified Debate Moderator Schema
# =============================================================================

Feature: Unified debate moderator outputs structured JSON with per-writer fields
  The moderator schema supports tagged objections and split recommendations

  Scenario: Moderator output contains required fields
    Given the unified debate moderator completes a round
    When its JSON output is parsed
    Then it contains a "result" field with value "CONSENSUS_REACHED" or "PARTIAL_CONSENSUS"
    And it contains an "objections" array
    And it contains an "experts" array listing participating experts
    And it contains a "recommendation" object with "bdd" and "tla" keys
    And it contains a "sessionFile" field set to "unified-debate.md"

  Scenario: Each objection has a target field
    Given the moderator outputs 3 objections
    When the objections array is inspected
    Then each objection object has a "target" field with value "bdd" or "tla"
    And each objection object has an "objection" field with the critique text

  Scenario: Recommendation is split per writer at consensus
    Given the moderator declares "CONSENSUS_REACHED"
    When the recommendation object is inspected
    Then recommendation.bdd contains final guidance for the BDD writer
    And recommendation.tla contains final guidance for the TLA+ writer

  Scenario: Empty objections array at consensus
    Given the moderator declares "CONSENSUS_REACHED"
    When the objections array is inspected
    Then the objections array is empty

  Scenario: Partial consensus includes at least one objection
    Given the moderator declares "PARTIAL_CONSENSUS"
    When the objections array is inspected
    Then the objections array contains at least one objection

# =============================================================================
# Item 6 — Post-Debate Artifacts (Stage 4)
# =============================================================================

Feature: Stage 4 generates BDD fixture and post-debate artifacts
  After the unified debate concludes, fixture JSON is generated from final Gherkin

  Scenario: BDD fixture is generated from final bdd.feature
    Given the unified debate has completed for feature "auth-flow"
    And "docs/auth-flow/bdd.feature" contains the final Gherkin scenarios
    When stage 4 (post-debate) executes
    Then "fixtures/auth-flow/bdd/fixture.json" is generated
    And the fixture JSON is parsed from the final Gherkin using ConvertFrom-Gherkin and Export-BddFixture

  Scenario: Fixture JSON is written atomically
    Given stage 4 is generating the BDD fixture for feature "auth-flow"
    When the fixture is written to disk
    Then the write uses atomic write (temp file then Move-Item -Force)
    And readers never see partial fixture content

  Scenario: Stage 4 fails if bdd.feature is missing
    Given the unified debate completed but "docs/auth-flow/bdd.feature" does not exist
    When stage 4 attempts to generate the fixture
    Then stage 4 fails with an error indicating the BDD feature file is missing

  Scenario: Stage 4 fails if bdd.feature contains invalid Gherkin
    Given "docs/auth-flow/bdd.feature" exists but contains unparseable syntax
    When stage 4 attempts to parse and generate the fixture
    Then stage 4 fails with a Gherkin parse error

  # [ADDED — Blocking #4] Stage completion marker
  Scenario: Stage 4 writes a completion marker on success
    Given stage 4 generates the fixture for feature "auth-flow"
    When stage 4 finishes successfully
    Then pipeline.log contains "STAGE_COMPLETE:4:auth-flow"

# =============================================================================
# Item 7 — Pipeline Entry Point and Resume
# =============================================================================

Feature: vibe.ps1 uses -Resume switch instead of -Stage and -Feature parameters
  The entry point is simplified to fresh runs ($Seed) and resume (-Resume)

  Scenario: Fresh run with $Seed starts from stage 1
    Given the user runs "./vibe.ps1 'Build an auth module'"
    When the pipeline starts
    Then stage 1 (elicitor) begins with the seed "Build an auth module"
    And a new runId is generated
    And pipeline.log records PIPELINE START

  Scenario: -Resume auto-detects feature and last completed stage
    Given pipeline.log records that feature "auth-flow" completed through stage 3
    When the user runs "./vibe.ps1 -Resume"
    Then Resume-Pipeline detects feature "auth-flow" from the log
    And Resume-Pipeline detects last completed stage as 3
    And the pipeline resumes at stage 4 (post-debate)

  Scenario: -Resume requires no other arguments
    Given the user runs "./vibe.ps1 -Resume" with no additional parameters
    When Resume-Pipeline reads pipeline.log
    Then the feature name is auto-detected from the log
    And the resume stage is auto-detected from the log
    And no $Seed is required

  Scenario: Fresh run requires $Seed
    Given the user runs "./vibe.ps1" with no arguments
    When parameter validation occurs
    Then the pipeline fails because $Seed is required for a fresh run

  Scenario: -Stage and -Feature parameters are removed
    Given vibe.ps1 defines its parameter block
    When the parameters are inspected
    Then there is no -Stage parameter
    And there is no -Feature parameter
    And there is a $Seed positional parameter
    And there is a -Resume switch parameter

  Scenario: Resume detects correct stage with 7-stage numbering
    Given pipeline.log records stage completions using the new 7-stage numbering
    And the last completed stage marker is for stage 5 (implementation-writer)
    When the user runs "./vibe.ps1 -Resume"
    Then Resume-Pipeline returns ResumeStage = 6 (implementation-debate)

  # [ADDED — High #5] -Resume and $Seed mutual exclusivity
  Scenario: -Resume and $Seed together fails parameter validation
    Given the user runs "./vibe.ps1 'Build an auth module' -Resume"
    When parameter validation occurs
    Then the pipeline fails with an error indicating $Seed and -Resume are mutually exclusive

  # [ADDED — High #6] Resume with missing pipeline.log
  Scenario: -Resume fails when pipeline.log does not exist
    Given no pipeline.log file exists
    When the user runs "./vibe.ps1 -Resume"
    Then Resume-Pipeline fails with an error indicating pipeline.log is missing

  # [ADDED — High #6] Resume with empty pipeline.log
  Scenario: -Resume fails when pipeline.log is empty
    Given pipeline.log exists but contains no stage completion markers
    When the user runs "./vibe.ps1 -Resume"
    Then Resume-Pipeline fails with an error indicating no completed stages found

  # [ADDED — High #6] Resume with corrupted pipeline.log
  Scenario: -Resume fails when pipeline.log contains malformed entries
    Given pipeline.log exists but contains garbled text with no parseable markers
    When the user runs "./vibe.ps1 -Resume"
    Then Resume-Pipeline fails with an error indicating the log is corrupted or unreadable

  # [ADDED — High #7] Resume with multiple features in log
  Scenario: -Resume uses the most recent feature when multiple features exist in log
    Given pipeline.log contains "STAGE_COMPLETE:3:auth-flow" from a prior run
    And pipeline.log later contains "STAGE_COMPLETE:2:payment-flow" from a newer run
    When the user runs "./vibe.ps1 -Resume"
    Then Resume-Pipeline detects feature "payment-flow" (most recent)
    And Resume-Pipeline detects last completed stage as 2
    And the pipeline resumes at stage 3

  # [ADDED — Consider #15] Old 8-stage log migration
  Scenario: -Resume rejects pipeline.log with old 8-stage numbering
    Given pipeline.log contains "STAGE_COMPLETE:8:auth-flow" from an old 8-stage pipeline run
    When the user runs "./vibe.ps1 -Resume"
    Then Resume-Pipeline fails with an error indicating the log uses an incompatible stage format
    And the error suggests starting a fresh run

  # [ADDED — Blocking #4] Stage 1 completion marker
  Scenario: Stage 1 writes a completion marker on success
    Given the user starts a fresh run with seed "Build an auth module"
    And stage 1 (elicitor) completes successfully for feature "auth-flow"
    When stage 1 finishes
    Then pipeline.log contains "STAGE_COMPLETE:1:auth-flow"

# =============================================================================
# Item 8 — Resolve-PipelineState for 7-Stage Pipeline
# =============================================================================

# [REVISED — Blocking #1] All stages now validate INPUTS (prior-stage outputs), not own outputs
# [REVISED — High #8] Validation is cumulative: stage N checks all artifacts from stages 1 through N-1
# [REVISED — High #9] Stage 5 includes unified-debate.md
# [REVISED — High #10] Stages 6-7 have specific artifact paths

Feature: Resolve-PipelineState validates input artifacts for the new 7-stage pipeline
  Each stage validates that all required artifacts from ALL prior stages exist before executing

  Scenario: Stage 2 requires elicitor.md
    Given feature "auth-flow" has "docs/auth-flow/elicitor.md" on disk
    When Resolve-PipelineState is called with FromStage 2 and Dir "docs/auth-flow"
    Then validation passes
    And the returned state includes Briefing = "docs/auth-flow/elicitor.md"

  Scenario: Stage 2 fails if elicitor.md is missing
    Given feature "auth-flow" does not have "docs/auth-flow/elicitor.md"
    When Resolve-PipelineState is called with FromStage 2
    Then validation throws an error indicating elicitor.md is missing

  Scenario: Stage 3 requires elicitor.md AND bdd.feature AND a .tla file
    Given feature "auth-flow" has "docs/auth-flow/elicitor.md"
    And "docs/auth-flow/bdd.feature" exists
    And "docs/auth-flow/tla/auth.tla" exists
    When Resolve-PipelineState is called with FromStage 3
    Then validation passes
    And the returned state includes Briefing, GherkinFile, and TlaFile paths

  Scenario: Stage 3 fails if bdd.feature is missing
    Given feature "auth-flow" has "docs/auth-flow/elicitor.md" and "docs/auth-flow/tla/auth.tla" but no bdd.feature
    When Resolve-PipelineState is called with FromStage 3
    Then validation throws an error indicating bdd.feature is missing

  Scenario: Stage 3 fails if no .tla file exists
    Given feature "auth-flow" has "docs/auth-flow/elicitor.md" and "docs/auth-flow/bdd.feature" but no .tla files
    When Resolve-PipelineState is called with FromStage 3
    Then validation throws an error indicating TLA+ spec is missing

  Scenario: Stage 3 fails if elicitor.md is missing (cumulative)
    Given feature "auth-flow" has "docs/auth-flow/bdd.feature" and "docs/auth-flow/tla/auth.tla" but no elicitor.md
    When Resolve-PipelineState is called with FromStage 3
    Then validation throws an error indicating elicitor.md is missing

  Scenario: Stage 4 requires bdd.feature AND .tla file AND unified-debate.md
    Given feature "auth-flow" has all stage 1-2 artifacts
    And "docs/auth-flow/bdd.feature" exists (final version)
    And "docs/auth-flow/tla/auth.tla" exists (final version)
    And "docs/auth-flow/unified-debate.md" exists
    When Resolve-PipelineState is called with FromStage 4
    Then validation passes
    And the returned state includes GherkinFile, TlaFile, and DebateSession paths

  Scenario: Stage 4 fails if unified-debate.md is missing
    Given feature "auth-flow" has bdd.feature and .tla files but no unified-debate.md
    When Resolve-PipelineState is called with FromStage 4
    Then validation throws an error indicating unified-debate.md is missing

  Scenario: Stage 5 requires fixture JSON AND unified-debate.md AND bdd.feature AND .tla files
    Given feature "auth-flow" has all stage 1-3 artifacts
    And "fixtures/auth-flow/bdd/fixture.json" exists
    And "docs/auth-flow/unified-debate.md" exists
    When Resolve-PipelineState is called with FromStage 5
    Then validation passes
    And the returned state includes FixtureJson, DebateSession, GherkinFile, and TlaFile paths

  Scenario: Stage 5 fails if fixture JSON is missing
    Given feature "auth-flow" has all stage 1-3 artifacts but no "fixtures/auth-flow/bdd/fixture.json"
    When Resolve-PipelineState is called with FromStage 5
    Then validation throws an error indicating fixture JSON is missing

  Scenario: Stage 5 fails if unified-debate.md is missing (cumulative)
    Given feature "auth-flow" has "fixtures/auth-flow/bdd/fixture.json" but no "docs/auth-flow/unified-debate.md"
    When Resolve-PipelineState is called with FromStage 5
    Then validation throws an error indicating unified-debate.md is missing

  Scenario: Stage 6 requires implementation-plan.md AND implementation-plan.json
    Given feature "auth-flow" has all stage 1-4 artifacts
    And "docs/auth-flow/implementation-plan.md" exists
    And "docs/auth-flow/implementation-plan.json" exists
    When Resolve-PipelineState is called with FromStage 6
    Then validation passes
    And the returned state includes ImplPlanMd and ImplPlanJson paths

  Scenario: Stage 6 fails if implementation-plan.md is missing
    Given feature "auth-flow" has all stage 1-4 artifacts but no "docs/auth-flow/implementation-plan.md"
    When Resolve-PipelineState is called with FromStage 6
    Then validation throws an error indicating implementation-plan.md is missing

  Scenario: Stage 7 requires implementation-debate.md
    Given feature "auth-flow" has all stage 1-5 artifacts
    And "docs/auth-flow/implementation-debate.md" exists
    When Resolve-PipelineState is called with FromStage 7
    Then validation passes
    And the returned state includes ImplDebateSession path

  Scenario: Stage 7 fails if implementation-debate.md is missing
    Given feature "auth-flow" has all stage 1-5 artifacts but no "docs/auth-flow/implementation-debate.md"
    When Resolve-PipelineState is called with FromStage 7
    Then validation throws an error indicating implementation-debate.md is missing

# =============================================================================
# Item 9 — Stage Renumbering and Wiring
# =============================================================================

Feature: Downstream stages are renumbered and wired in the 7-stage pipeline
  Old stages 6-8 become stages 5-7; all stages are called from vibe.ps1

  Scenario: Pipeline executes all 7 stages in order for a fresh run
    Given the user starts a fresh run with seed "Build an auth module"
    When the pipeline completes without errors
    Then the stages execute in order: 1 (elicitor), 2 (parallel-writers), 3 (unified-debate), 4 (post-debate), 5 (implementation-writer), 6 (implementation-debate), 7 (coding)

  Scenario: Stage 5 (implementation-writer) reads unified-debate.md
    Given the unified debate produced "docs/auth-flow/unified-debate.md"
    When stage 5 (implementation-writer) executes for "auth-flow"
    Then the implementation writer receives "docs/auth-flow/unified-debate.md" as context
    And it does not look for "bdd-debate.md" or "tla-debate.md"

  Scenario: Stage 6 (implementation-debate) uses existing Invoke-DebateLoop
    Given stage 5 produced the implementation plan for "auth-flow"
    When stage 6 (implementation-debate) executes
    Then it uses the existing Invoke-DebateLoop function (not Invoke-UnifiedDebateLoop)

  Scenario: Stage 7 (coding) is the existing stage 8 renumbered
    Given the pipeline reaches stage 7
    When stage 7 executes
    Then it runs the existing coding stage logic (worktree dispatch, review gates, merge queue)

  Scenario: vibe.ps1 calls all stage scripts in sequence
    Given vibe.ps1 defines its stage pipeline
    When the stage list is inspected
    Then it includes: 1-elicitor.ps1, 2-parallel-writers.ps1, 3-unified-debate.ps1, 4-post-debate.ps1, 5-implementation-writer.ps1, 6-implementation-debate.ps1, 7-coding.ps1

  Scenario: No stage script exists but is uncalled from vibe.ps1
    Given the stages/ directory contains stage scripts
    When vibe.ps1's stage dispatch logic is inspected
    Then every .ps1 file in stages/ is referenced and called by vibe.ps1

  Scenario: No utility is built but unwired
    Given utils/invoke-parallel.ps1 defines Invoke-Parallel
    And utils/ defines Invoke-UnifiedDebateLoop
    When the stage scripts are inspected
    Then 2-parallel-writers.ps1 calls Invoke-Parallel
    And 3-unified-debate.ps1 calls Invoke-UnifiedDebateLoop
    And Invoke-UnifiedDebateLoop internally calls Invoke-Parallel for parallel revisions

  # [ADDED — Blocking #4] Stage completion markers for stages 5-7
  Scenario: Stages 5-7 write completion markers on success
    Given the pipeline executes stages 5, 6, and 7 for feature "auth-flow"
    When each stage completes successfully
    Then pipeline.log contains "STAGE_COMPLETE:5:auth-flow"
    And pipeline.log contains "STAGE_COMPLETE:6:auth-flow"
    And pipeline.log contains "STAGE_COMPLETE:7:auth-flow"

# =============================================================================
# Item 10 — Deleted Files
# =============================================================================

Feature: Old sequential writer and debate stages are deleted
  The 4 replaced stages no longer exist in the stages/ directory

  Scenario: 2-bdd-writer.ps1 is deleted
    Given the parallel-debates feature is implemented
    When the stages/ directory is inspected
    Then "stages/2-bdd-writer.ps1" does not exist

  Scenario: 3-bdd-debate.ps1 is deleted
    Given the parallel-debates feature is implemented
    When the stages/ directory is inspected
    Then "stages/3-bdd-debate.ps1" does not exist

  Scenario: 4-tla-writer.ps1 is deleted
    Given the parallel-debates feature is implemented
    When the stages/ directory is inspected
    Then "stages/4-tla-writer.ps1" does not exist

  Scenario: 5-tla-debate.ps1 is deleted
    Given the parallel-debates feature is implemented
    When the stages/ directory is inspected
    Then "stages/5-tla-debate.ps1" does not exist

# =============================================================================
# Item 11 — Unified Debate Moderator Agent Prompt
# =============================================================================

Feature: Unified debate moderator agent prompt is created and referenced
  A new agent prompt orchestrates expert opinions across both documents

  Scenario: Unified debate moderator prompt exists at agents/unified-debate-moderator.md
    Given the parallel-debates feature is implemented
    When the agents/ directory is inspected
    Then "agents/unified-debate-moderator.md" exists

  Scenario: Moderator does not evaluate documents directly
    Given the unified-debate-moderator.md prompt is loaded
    When its instructions are followed
    Then the moderator orchestrates expert opinions
    And the moderator determines consensus based on expert feedback
    And the moderator does not substitute its own judgment for the experts'

  Scenario: Moderator uses existing experts directory
    Given the unified debate moderator is invoked
    When it selects experts for the debate
    Then it draws from the existing agents/experts/ directory
    And no new expert prompts are created for this feature

  Scenario: Stage 3 references the unified debate moderator prompt
    Given 3-unified-debate.ps1 invokes Invoke-UnifiedDebateLoop
    When the debate moderator file path is inspected
    Then it points to "agents/unified-debate-moderator.md"

# =============================================================================
# Item 12 — End-to-End Pipeline Flow
# =============================================================================

Feature: Full pipeline flows from elicitor through parallel writes, debate, and into implementation
  Artifacts produced by each stage are correctly consumed by the next

  Scenario: Elicitor output flows into parallel writers
    Given stage 1 produced "docs/auth-flow/elicitor.md"
    When stage 2 starts
    Then both writers receive "docs/auth-flow/elicitor.md" as input

  Scenario: Parallel writer output flows into unified debate
    Given stage 2 produced "docs/auth-flow/bdd.feature" and "docs/auth-flow/tla/auth.tla"
    When stage 3 starts
    Then the unified debate loop receives both files for review

  Scenario: Unified debate output flows into post-debate
    Given stage 3 produced final versions of bdd.feature and tla/*.tla
    And stage 3 produced "docs/auth-flow/unified-debate.md"
    When stage 4 starts
    Then the post-debate stage reads the final bdd.feature to generate fixture JSON

  Scenario: Post-debate output flows into implementation writer
    Given stage 4 produced "fixtures/auth-flow/bdd/fixture.json"
    And unified debate produced "docs/auth-flow/unified-debate.md"
    When stage 5 starts
    Then the implementation writer has access to the fixture, both specs, and unified-debate.md

  Scenario: Resume at stage 3 loads correct state
    Given pipeline.log shows stage 2 completed for feature "auth-flow"
    And "docs/auth-flow/bdd.feature" and "docs/auth-flow/tla/auth.tla" exist
    When the user runs "./vibe.ps1 -Resume"
    Then the pipeline resumes at stage 3 (unified-debate)
    And Resolve-PipelineState validates elicitor.md, bdd.feature, and .tla file presence

  Scenario: Resume at stage 4 loads correct state
    Given pipeline.log shows stage 3 completed for feature "auth-flow"
    And "docs/auth-flow/bdd.feature", "docs/auth-flow/tla/auth.tla", and "docs/auth-flow/unified-debate.md" exist
    When the user runs "./vibe.ps1 -Resume"
    Then the pipeline resumes at stage 4 (post-debate)
    And Resolve-PipelineState validates all cumulative artifacts through stage 3

  Scenario: Resume at stage 5 loads correct state
    Given pipeline.log shows stage 4 completed for feature "auth-flow"
    And "fixtures/auth-flow/bdd/fixture.json" and "docs/auth-flow/unified-debate.md" exist
    When the user runs "./vibe.ps1 -Resume"
    Then the pipeline resumes at stage 5 (implementation-writer)
    And Resolve-PipelineState validates fixture JSON and unified-debate.md presence

  # [ADDED — Consider #16] Fresh-run inter-stage validation
  Scenario: Fresh run validates stage outputs before proceeding to next stage
    Given the user starts a fresh run with seed "Build an auth module"
    And stage 2 completes but "docs/auth-flow/bdd.feature" was not written (writer bug)
    When stage 3 is about to start
    Then Resolve-PipelineState runs for stage 3 and detects bdd.feature is missing
    And the pipeline fails with an error instead of passing garbage artifacts forward

# =============================================================================
# Item 13 — Write-PipelineLog Consolidation
# =============================================================================

# [ADDED — High #13] Resolve existing codebase defect

Feature: Write-PipelineLog has a single consolidated definition
  Only one Write-PipelineLog function exists to prevent signature collisions

  Scenario: Write-PipelineLog is defined only in pipeline-log.ps1
    Given the codebase is inspected for Write-PipelineLog definitions
    When all .ps1 files are searched
    Then Write-PipelineLog is defined exactly once in "utils/pipeline-log.ps1"
    And no other file defines a function named Write-PipelineLog

  Scenario: Write-PipelineLog accepts -Message and -Root parameters
    Given Write-PipelineLog is called with -Message "STAGE_COMPLETE:2:auth-flow" and -Root "."
    When the function executes
    Then "STAGE_COMPLETE:2:auth-flow" is appended to pipeline.log under the given root
    And the write is atomic (no partial lines from concurrent callers)

  Scenario: Old Write-PipelineLog with -Color parameter is removed
    Given the codebase previously had a Write-PipelineLog in config.ps1 with -Color parameter
    When the parallel-debates feature is implemented
    Then the config.ps1 definition is removed
    And callers that used -Color are updated to use the pipeline-log.ps1 signature
