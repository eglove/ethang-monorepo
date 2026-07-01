# TLA+ Formal Specification Guidelines

TLA+ (Temporal Logic of Actions) is a formal specification language for modeling and verifying concurrent and distributed systems. This reference guides the extraction of TLA+ specifications from BDD Gherkin scenarios per SWEBOK v4 Chapter 11 (Models & Methods).

## 1. Module Structure

Every TLA+ specification MUST follow this canonical structure:

```
---------------------------- MODULE FeatureName ----------------------------
EXTENDS Naturals, Sequences, FiniteSets

CONSTANTS Users, Resources, MaxRetries  \* Model values for bounded checking

VARIABLES state, requests, responses

vars  ==  <<state, requests, responses>>

TypeInvariant  ==  /\ state \in {"idle", "processing", "done", "error"}
                   /\ requests \in SUBSET (Users \times Resources)

Init  ==  /\ state = "idle"
           /\ requests = {}
           /\ responses = {}

Action1  ==  /\ state = "idle"
              /\ state' = "processing"
              /\ UNCHANGED <<requests, responses>>

Next  ==  Action1 \/ Action2 \/ ... \/ ActionN

Spec  ==  Init /\ [][Next]_vars

SafetyInvariant1  ==  state = "done" => responses /= {}
LivenessProperty1  ==  [](state = "processing" <> state = "done")

=============================================================================
```

## 2. Extracting TLA+ from BDD Scenarios

Map Gherkin BDD elements to TLA+ constructs as follows:

| BDD Element | TLA+ Construct | Extraction Rule |
| --- | --- | --- |
| Background Given clauses | Init predicate | All Background conditions become conjoined predicates in Init |
| Given clause (scenario-level) | Action precondition (guard) | Each Given becomes a guard predicate on the action: state = "..." /\ ... |
| When clause | Action predicate (Next disjunction member) | Each When clause becomes a named action in the Next disjunction |
| Then clause (state assertion) | INVARIANT | Then clauses asserting always-true conditions become safety invariants |
| Then clause (eventual outcome) | Temporal property | Then clauses using "eventually" become <>[] or <>P temporal formulas |
| Scenario Outline Examples | Parameterized CONSTANTS and action predicates | Each column header becomes a CONSTANT; each row populates model values in .cfg |
| And/But keywords | Conjuncts (/\) | And/But steps are conjoined to their parent step's predicate |

## 3. TLC Configuration Generation

The TLC model checker requires a .cfg file with concrete values for CONSTANTS and explicit lists of what to verify. Generate .cfg files with these rules:

```
CONSTANTS
  Users = {u1, u2}
  Resources = {r1, r2}
  MaxRetries = 3

SPECIFICATION
  Spec

INVARIANTS
  TypeInvariant
  SafetyInvariant1
  SafetyInvariant2

PROPERTIES
  LivenessProperty1
  LivenessProperty2

CONSTRAINTS
  \* Bound state space if needed
  Cardinality(states) <= 100

```

### 3.1 CONSTANTS Model Values

* Sets: use 2-3 literal elements (e.g., {u1, u2}) to bound state space.
* Scalars: use small integers (e.g., MaxRetries = 3) that are sufficient to test invariants.
* Strings: represent states as string literals in TLA+ (use model values).

## 4. Running TLC

Execute TLC via tla2tools.jar. The skill monitors the TLC process for unbounded state space growth and terminates if no progress is detected. Convergence is measured by error type changing across iterations, or state count plateauing.

```
java -cp tla2tools.jar tlc2.TLC -workers 4 -model FeatureName
```

## 5. Auto-Fix Loop

* If TLC reports a syntax error: diagnose the error type, apply a minimal fix to the .tla file, re-run TLC.
* If TLC reports an invariant violation: analyze the counterexample trace, modify the action predicate or invariant, re-run TLC.
* If TLC reports deadlock: determine if deadlock is expected; if not, add weak fairness to Spec or add a stuttering-tolerant Next predicate.
* The loop continues while progress is being made (error type changes, state count increases toward a plateau).
* The loop stops if the same error persists across iterations with no improvement, or if the agent determines the issue requires user input.

## 6. Unmappable Scenarios

Some BDD scenarios describe behavior that does not map to TLA+ (UI rendering, database CRUD mechanics, network protocol details). These scenarios are logged as unmapped with a reason and listed in the tla-plus/README.md for manual review. The TLA+ generation continues with all mappable scenarios.
