Feature: spec-to-architecture normal course

Background:
  Given the "/specification" skill has completed successfully
  And the "/docs/<feature-name>/" directory exists
  And the "bdd/" subdirectory contains at least one .feature file

Scenario: F001 - Automatic invocation after /specification
  Given a feature has been specified via "/specification"
  And the BDD documents have been written to "/docs/<feature-name>/bdd/"
  When the pipeline transitions to the architecture phase
  Then the "spec-to-architecture" skill is invoked automatically
  And no manual user intervention is required

Scenario: F002 - Parse all BDD feature files
  Given the "bdd/" subdirectory contains "normal-course.feature", "exceptions.feature", and "boundaries.feature"
  When the skill reads the BDD input files
  Then all three .feature files are successfully parsed
  And the skill has access to all Given-When-Then scenarios
  And malformed Gherkin is automatically corrected where possible

Scenario: F003 - Generate C4 architecture documentation
  Given BDD scenarios have been parsed into actions, states, and invariants
  When the architecture generation step executes
  Then "architecture/system-context.md" is created with a Mermaid C4 System Context diagram
  And "architecture/container.md" is created with a Mermaid C4 Container diagram
  And each identified component has a description, responsibilities, and interface contracts
  And quality attributes from non-functional requirements are mapped to architectural decisions

Scenario: F004 - Generate complete TLA+ specification
  Given BDD scenarios have been parsed and state variables, actions, invariants, and temporal properties have been extracted
  When the TLA+ generation step executes
  Then "<feature>.tla" is created containing a valid TLA+ module
  And the module includes CONSTANTS declarations for bounded model checking
  And the module includes VARIABLES declarations for all identified state variables
  And the module includes an Init predicate defining the initial system state
  And the module includes a Next predicate as a disjunction of all action predicates
  And the module includes a Spec temporal formula defined as Init ∧ □[Next]_vars
  And the module includes INVARIANT declarations for all safety properties
  And the module includes ACTION declarations or temporal formulas for liveness properties
  And the .tla file passes TLC syntax checking

Scenario: F009 - Generate TLC configuration file
  Given a TLA+ module has been generated with CONSTANTS and invariants
  When the TLC config generation step executes
  Then "<feature>.cfg" is created
  And CONSTANTS are assigned concrete model value sets (e.g., {u1, u2, u3})
  And SPECIFICATION refers to the generated Spec formula
  And INVARIANT lists all named safety invariants
  And PROPERTY lists all named temporal properties

Scenario: F010 - Execute TLC model checker
  Given valid "<feature>.tla" and "<feature>.cfg" files exist
  When the skill invokes TLC via tla2tools.jar
  Then "<feature>-TLC-output.log" is created with full model checking results
  And the log indicates whether all invariants held
  And the log indicates whether all temporal properties held
  And the log reports the number of states explored and distinct states found

Scenario: F011 - Auto-fix and re-run on TLC failure
  Given TLC reports a spec error, invariant violation, or deadlock
  When the auto-fix loop executes
  Then the skill diagnoses the failure from the TLC output
  And the skill modifies the TLA+ spec to address the root cause
  And TLC is re-executed with the modified spec
  And the skill monitors convergence (improving results) vs divergence
  And the skill continues iterating while progress is being made
  And the skill stops and reports to the user if no progress is detected after reasonable iteration