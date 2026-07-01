Feature: spec-to-architecture exception and error handling

  Background:
    Given the "spec-to-architecture" skill is executing
    And it depends on artifacts from a prior "/specification" run

  Scenario: E001 - Missing specification directory
    Given no "/docs/<feature-name>/" directory exists
    When the skill attempts to read BDD input files
    Then the skill halts with a clear error message
    And the skill informs the user that they must run "/specification" first
    And no architecture or TLA+ artifacts are generated

  Scenario: E002 - Empty BDD feature files
    Given the "bdd/" subdirectory exists
    But all .feature files are empty or contain no scenarios
    When the skill parses the BDD files
    Then the skill reports that no verifiable behavior was found
    And the skill halts with a warning that the specification contains no actionable content
    And the architecture and TLA+ generation steps are not executed

  Scenario: E003 - Malformed Gherkin syntax
    Given a .feature file contains malformed Gherkin (e.g., missing Feature keyword, invalid indentation, undefined steps)
    When the skill parses the file
    Then the skill attempts automatic correction of the Gherkin syntax
    And if correction succeeds, parsing continues with the corrected file
    And if correction fails, the skill reports the specific line and error
    And the skill continues processing remaining valid files where possible

  Scenario: E004 - BDD scenarios that do not map to TLA+
    Given a BDD scenario describes <concern>
    When the skill attempts to extract TLA+ elements
    Then the scenario is logged as "unmapped" with a reason
    And the TLA+ generation continues with all mappable scenarios
    And the unmapped scenarios are listed in the TLA+ README for manual review

    Examples:
      | concern                          |
      | UI rendering details             |
      | database schema migrations       |
      | network protocol byte layouts    |

  Scenario: E005 - TLA+ spec has syntax errors
    Given the generated .tla file has a syntax error (e.g., missing EXTENDS, malformed operator, unbalanced parentheses)
    When TLC is invoked
    Then the skill captures the TLC error output
    And the skill diagnoses the specific syntax error
    And the skill applies a fix to the .tla file
    And TLC is re-invoked

  Scenario: E006 - TLC encounters an invariant violation
    Given TLC reports that an invariant was violated with a counterexample trace
    When the skill processes the violation
    Then the skill extracts the counterexample trace
    And the skill analyzes which action led to the invariant violation
    And the skill modifies either the invariant or the action predicate to resolve the violation
    And TLC is re-executed

  Scenario: E007 - TLC encounters deadlock
    Given TLC reports deadlock reached (no further actions possible in a non-terminal state)
    When the skill processes the deadlock
    Then the skill identifies the deadlock state from the trace
    And the skill determines whether deadlock is expected behavior
    And if unexpected, the skill adds a liveness property or modifies the Next predicate
    And TLC is re-executed

  Scenario: E008 - Auto-fix loop makes no progress
    Given the auto-fix loop has been iterating for a reasonable number of attempts
    And TLC results are not improving (same error persists or error type is not changing)
    When the skill detects lack of convergence
    Then the skill stops the auto-fix loop
    And the skill reports the current state of the TLA+ spec to the user
    And the skill provides the TLC output for manual diagnosis
    And the skill suggests possible manual fixes based on the pattern of failures

  Scenario: E009 - tla2tools.jar is not accessible
    Given the `tla2tools.jar` file cannot be found in the expected location
    When the skill attempts to invoke TLC
    Then the skill reports the missing dependency
    And the skill provides instructions for locating or downloading tla2tools.jar
    And the skill still generates the .tla and .cfg files for offline use

  Scenario: E010 - TLC runs with unbounded state space
    Given TLC is exploring a state space that is growing without apparent bound
    When the skill monitors the TLC process
    And the state count exceeds practical limits without convergence
    Then the skill terminates the TLC process
    And the skill reports the partial results
    And the skill recommends refining CONSTANTS model values or adding state constraints in the .cfg
