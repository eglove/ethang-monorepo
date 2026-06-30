Feature: spec-to-architecture boundary conditions

  Background:
    Given the "spec-to-architecture" skill is processing BDD input

  Scenario: B001 - Single scenario in BDD files
    Given the BDD .feature files contain exactly one scenario total
    When the skill generates the TLA+ spec
    Then the spec contains exactly one action predicate in the Next disjunction
    And the spec contains exactly one safety invariant
    And TLC still executes and produces valid results

  Scenario: B002 - Very large number of BDD scenarios
    Given the BDD .feature files contain hundreds of scenarios
    When the skill generates the TLA+ spec
    Then the spec includes a corresponding number of action predicates
    And the skill monitors memory usage during TLC execution
    And the TLC config uses minimal CONSTANTS to bound the state space

  Scenario: B003 - BDD scenario with no Then clause (incomplete scenario)
    Given a BDD scenario has Given and When clauses but no Then clause
    When the skill extracts TLA+ elements
    Then the action predicate is still generated from the When clause
    And no invariant is generated for this scenario
    And the skill logs a warning about the incomplete scenario

  Scenario: B004 - BDD scenario with nested And/But keywords
    Given a scenario step uses "And" or "But" keywords to chain multiple conditions
    When the skill parses the scenario
    Then all chained conditions are extracted (not just the first Given/When/Then)
    And conjoined preconditions are correctly represented in Init or action guards
    And multiple assertions in Then clauses are represented as conjoined invariants

  Scenario: B005 - Scenario Outline generates distinct action predicates per row
    Given a BDD scenario uses Scenario Outline with an Examples table containing multiple rows
    When the skill generates TLA+ spec
    Then each row in the Examples table generates a distinct action predicate variant
    And the TLC config assigns model values from the Examples table data

  Scenario: B005b - Scenario Outline parameterizes action predicates with CONSTANTS
    Given a BDD scenario uses Scenario Outline with an Examples table containing multiple rows
    When the skill generates TLA+ spec
    Then the skill parameterizes the action predicate with CONSTANTS from the Examples
    And the TLC config assigns the CONSTANTS as a set of all example values

  Scenario: B006 - Minimal CONSTANTS model values in TLC config
    Given a TLA+ spec with CONSTANTS like Users, Sessions, Resources
    When the skill generates the .cfg file
    Then CONSTANTS are assigned sets of 2–3 elements each
    And the total state space is bounded and tractable for exhaustive checking
    And the skill avoids model values that cause state space explosion

  Scenario: B007 - All BDD scenarios unmappable to TLA+
    Given every BDD scenario describes only UI or infrastructure concerns
    When the skill attempts TLA+ extraction
    Then zero action predicates are generated
    And the skill reports that no formal model could be derived
    And the architecture C4 document is still generated from the BDD input
    And no TLA+ files are written (or a minimal placeholder module is created)

  Scenario: B008 - BDD with maximum nesting depth
    Given BDD scenarios use deeply nested Background → Scenario → Given → And → But chains
    When the skill parses and extracts elements
    Then all nesting levels are correctly flattened into TLA+ predicates
    And the resulting Init predicate correctly represents all Background conditions

  Scenario: B009 - Unicode and special characters in BDD step text
    Given BDD steps contain Unicode characters, emoji, or special symbols
    When the skill generates TLA+ identifiers
    Then identifiers are sanitized to valid TLA+ variable names (alphanumeric and underscores only)
    And the original step text is preserved as a TLA+ comment above the corresponding predicate

  Scenario: B010 - Concurrent action predicates in Next
    Given multiple BDD scenarios describe actions that can occur in any order
    When the skill generates the Next predicate
    Then actions are combined as a disjunction (�) allowing TLC to explore all interleavings
    And the skill includes a fairness condition if liveness properties depend on eventual execution
