export const ch11Models = {
  content: `# Software Engineering Models and Methods (SWEBOK v4, Chapter 11)

> Scope: How to choose and analyze models (structural, behavioral) so they are complete, consistent, correct, and traceable to tests — plus the pre/post/invariant contracts that bind a function's behavior. A **model** gives a notation and construction/analysis procedure; a **method** gives a systematic specify→design→build→verify approach.

## When to Apply

- Deciding what to diagram or specify before coding a feature: pick a model type (§ Model Selection).
- Specifying a function/method contract: write preconditions, postconditions, invariants (§ Contract Checks).
- Building a test inventory for stateful UI/logic: derive states/transitions and prove completeness (§ State-Machine Completeness → tdd-state-coverage overlay).
- Confirming requirements reach code and tests: build traceability links (§ Model↔Test Traceability).
- Choosing a delivery method: heuristic / formal / prototyping / Agile (§ Method Selection).

## Key Definitions

| Term | Definition |
|---|---|
| Model | Abstraction/simplification of a system; always an aggregation of submodels |
| Completeness | All specified requirements implemented and verified within the model |
| Consistency | No conflicting requirements, assertions, constraints, functions, or descriptions |
| Correctness | Model satisfies its requirements/design specs and is free of defects |
| Precondition | Must hold before execution; if violated, results may be erroneous — caller's fault |
| Postcondition | Guaranteed true after successful execution; describes state/param/return changes — function's fault if unmet |
| Invariant | Condition that persists unchanged before and after execution |
| Traceability | Trace history/application/location of a work product via uses/implements/tests relations |
| Structural model | Logical/physical composition; the software↔environment boundary |
| Behavioral model | Identifies/defines functions: state-machine, control-flow, data-flow |

## Model Selection (Structural vs Behavioral)

Pick the model whose **question** you need answered. One model is never enough — aggregate submodels.

| Question you are answering | Model type | Construct / UML diagram |
|---|---|---|
| What are the parts and how do they compose? | Structural | composition/decomposition, generalization, cardinality; class/component/object/deployment/package |
| Where is the boundary with the environment? | Structural | interface definitions, deployment diagram |
| What does the data look like? | Structural — Information model | conceptual → logical → physical data model |
| What states exist and how do they change? | Behavioral — state machine | states, events, guarded/unguarded transitions; state-machine diagram |
| What sequence of events activates processes? | Behavioral — control-flow | activity diagram |
| How does data move through processes? | Behavioral — data-flow | data toward stores/sinks |
| How do parts interact at runtime? | Behavioral — interaction | sequence/communication/timing diagrams |

## Contract Checks (Pre/Post/Invariant)

Treat every function with non-trivial behavior as a **Design-by-Contract** unit. Fault assignment is fixed:

| Clause | Verify by | If violated |
|---|---|---|
| Precondition | guard/assertion at entry; caller-side test | Caller is at fault — reject input, do not proceed |
| Postcondition | assertion at exit; result test | Function is at fault — bug in the unit |
| Invariant | check holds before AND after; property test | State corruption — silent failure source |

Rules: state the contract before writing the body; encode preconditions as input guards (not silent fallbacks); cover each clause with a test (valid, boundary, violating input).

## State-Machine Completeness

A behavioral state-machine model is **complete** only when:

- [ ] Every state is **reachable** by some input path.
- [ ] Every transition has a defined trigger (guarded or unguarded event).
- [ ] Every guard is exercised both true and false.
- [ ] Terminal/error states are explicit, not implicit.
- [ ] No dead state (entered but no exit) unless intentionally terminal.

This is the model-completeness theory behind the test inventory — operationalize it via the **tdd-state-coverage** overlay (state table, transition-both-ways coverage, web-app patterns).

## Model↔Test Traceability

Maintain links across the chain: **requirement → design/model → code → test case** using uses/implements/tests relations.

- Demonstrates each requirement is satisfied by some test.
- Enables change-impact analysis: traverse links to find affected tests when code changes.
- Must be re-checked on every significant change — stale links defeat the purpose.

Analysis dimensions: Completeness (reachability), Consistency (no conflicts), Correctness (syntactic = grammar; semantic = meaning, needs review/simulation), Interaction (dynamic behavior between parts/layers/UI).

## Method Selection

| Family | Use when | Examples |
|---|---|---|
| Heuristic | Experience-based, typical projects | structured, data modeling, OO (UP/RUP), aspect-oriented, MDD/MBD |
| Formal | Safety-/security-critical; need mathematical proof | spec languages, program refinement, model checking, logical inference, lightweight (Alloy) |
| Prototyping | Least-understood aspect needs exploration first | throwaway, evolutionary, executable spec |
| Agile | Short cycles, frequent feedback, working product each iteration | XP, Scrum, FDD, Lean/Kanban, RAD |

Notes: **MDD** = models are primary artifacts (code transformed from them); **MBD** = models analyze the system, not necessarily primary. Prototyping attacks the **least-understood** part first (opposite of best-first). Agile = incremental PDCA; release engineering + CI keep pace with short cycles.

## Decision Checklist

**Must Do**
- Choose the model type by the question being answered; aggregate structural + behavioral when both apply.
- Document preconditions, postconditions, and invariants for every behaviorally significant function.
- Run reachability/completeness analysis on any state model before treating it as a test basis.
- Maintain requirement→model→code→test traceability and re-check on change.
- Verify semantic assumptions of any imported/reused model part in the new context.
- Label prototypes throwaway vs evolutionary; evolutionary needs architectural discipline.

**Must Not Do**
- Rely on a single model view and assume complete understanding.
- Encode preconditions as silent fallbacks instead of explicit guards.
- Track state via scattered boolean flags instead of an explicit state machine.
- Promote a throwaway prototype to production without architectural rework.
- Treat Agile as the absence of modeling.

## Anti-Patterns

| Anti-Pattern | Consequence |
|---|---|
| Single-view modeling | Illusion of complete understanding from one abstraction |
| Skipped traceability | Requirements become untraceable; no change-impact analysis |
| Model drift | Model diverges from code, never updated |
| Implicit state via flags | Untestable transitions, missed states |
| Unidentified invariants | Silent boundary-condition failures |
| Prototype promoted as-is | Unstructured throwaway code in production |

## Standards Referenced

ISO/IEC 19505-1:2012 (OMG UML Part 1); ISO/IEC/IEEE 32675:2022 (DevOps build/package/deploy). Lightweight formal methods: Alloy (Jackson, *Software Abstractions*).
`,
  path: "resources/ch11-models.md",
  title: "Software Engineering Models and Methods",
  triggers: [
    "model",
    "precondition",
    "postcondition",
    "invariant",
    "state-machine",
    "UML",
    "traceability",
    "formal-method"
  ] as const
};
