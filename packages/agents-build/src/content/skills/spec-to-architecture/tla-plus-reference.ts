import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

export const tlaPlusReference: MarkdownBlock[] = [
  {
    level: 1,
    text: "TLA+ Formal Specification Guidelines",
    type: "header"
  },
  {
    text: "TLA+ (Temporal Logic of Actions) is a formal specification language for modeling and verifying concurrent and distributed systems. This reference guides the extraction of TLA+ specifications from BDD Gherkin scenarios per SWEBOK v4 Chapter 11 (Models & Methods).",
    type: "text"
  },
  {
    level: 2,
    text: "1. Module Structure",
    type: "header"
  },
  {
    text: "Every TLA+ specification MUST follow this canonical structure:",
    type: "text"
  },
  {
    code: '---------------------------- MODULE FeatureName ----------------------------\nEXTENDS Naturals, Sequences, FiniteSets\n\nCONSTANTS Users, Resources, MaxRetries  \\* Model values for bounded checking\n\nVARIABLES state, requests, responses\n\nvars  ==  <<state, requests, responses>>\n\nTypeInvariant  ==  /\\ state \\in {"idle", "processing", "done", "error"}\n                   /\\ requests \\in SUBSET (Users \\times Resources)\n\nInit  ==  /\\ state = "idle"\n           /\\ requests = {}\n           /\\ responses = {}\n\nAction1  ==  /\\ state = "idle"\n              /\\ state\' = "processing"\n              /\\ UNCHANGED <<requests, responses>>\n\nNext  ==  Action1 \\/ Action2 \\/ ... \\/ ActionN\n\nSpec  ==  Init /\\ [][Next]_vars\n\nSafetyInvariant1  ==  state = "done" => responses /= {}\nLivenessProperty1  ==  [](state = "processing" <> state = "done")\n\n=============================================================================',
    language: "",
    type: "codeBlock"
  },
  {
    level: 2,
    text: "2. Extracting TLA+ from BDD Scenarios",
    type: "header"
  },
  {
    text: "Map Gherkin BDD elements to TLA+ constructs as follows:",
    type: "text"
  },
  {
    headers: ["BDD Element", "TLA+ Construct", "Extraction Rule"],
    rows: [
      [
        "Background Given clauses",
        "Init predicate",
        "All Background conditions become conjoined predicates in Init"
      ],
      [
        "Given clause (scenario-level)",
        "Action precondition (guard)",
        String.raw`Each Given becomes a guard predicate on the action: state = "..." /\ ...`
      ],
      [
        "When clause",
        "Action predicate (Next disjunction member)",
        "Each When clause becomes a named action in the Next disjunction"
      ],
      [
        "Then clause (state assertion)",
        "INVARIANT",
        "Then clauses asserting always-true conditions become safety invariants"
      ],
      [
        "Then clause (eventual outcome)",
        "Temporal property",
        'Then clauses using "eventually" become <>[] or <>P temporal formulas'
      ],
      [
        "Scenario Outline Examples",
        "Parameterized CONSTANTS and action predicates",
        "Each column header becomes a CONSTANT; each row populates model values in .cfg"
      ],
      [
        "And/But keywords",
        String.raw`Conjuncts (/\)`,
        "And/But steps are conjoined to their parent step's predicate"
      ]
    ],
    type: "table"
  },
  {
    level: 2,
    text: "3. TLC Configuration Generation",
    type: "header"
  },
  {
    text: "The TLC model checker requires a .cfg file with concrete values for CONSTANTS and explicit lists of what to verify. Generate .cfg files with these rules:",
    type: "text"
  },
  {
    code: "CONSTANTS\n  Users = {u1, u2}\n  Resources = {r1, r2}\n  MaxRetries = 3\n\nSPECIFICATION\n  Spec\n\nINVARIANTS\n  TypeInvariant\n  SafetyInvariant1\n  SafetyInvariant2\n\nPROPERTIES\n  LivenessProperty1\n  LivenessProperty2\n\nCONSTRAINTS\n  \\* Bound state space if needed\n  Cardinality(states) <= 100\n",
    language: "",
    type: "codeBlock"
  },
  {
    level: 3,
    text: "3.1 CONSTANTS Model Values",
    type: "header"
  },
  {
    items: [
      {
        text: "Sets: use 2-3 literal elements (e.g., {u1, u2}) to bound state space."
      },
      {
        text: "Scalars: use small integers (e.g., MaxRetries = 3) that are sufficient to test invariants."
      },
      {
        text: "Strings: represent states as string literals in TLA+ (use model values)."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 2,
    text: "4. Running TLC",
    type: "header"
  },
  {
    text: "Execute TLC via tla2tools.jar. The skill monitors the TLC process for unbounded state space growth and terminates if no progress is detected. Convergence is measured by error type changing across iterations, or state count plateauing.",
    type: "text"
  },
  {
    code: "java -cp tla2tools.jar tlc2.TLC -workers 4 -model FeatureName",
    language: "",
    type: "codeBlock"
  },
  {
    level: 2,
    text: "5. Auto-Fix Loop",
    type: "header"
  },
  {
    items: [
      {
        text: "If TLC reports a syntax error: diagnose the error type, apply a minimal fix to the .tla file, re-run TLC."
      },
      {
        text: "If TLC reports an invariant violation: analyze the counterexample trace, modify the action predicate or invariant, re-run TLC."
      },
      {
        text: "If TLC reports deadlock: determine if deadlock is expected; if not, add weak fairness to Spec or add a stuttering-tolerant Next predicate."
      },
      {
        text: "The loop continues while progress is being made (error type changes, state count increases toward a plateau)."
      },
      {
        text: "The loop stops if the same error persists across iterations with no improvement, or if the agent determines the issue requires user input."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 2,
    text: "6. Unmappable Scenarios",
    type: "header"
  },
  {
    text: "Some BDD scenarios describe behavior that does not map to TLA+ (UI rendering, database CRUD mechanics, network protocol details). These scenarios are logged as unmapped with a reason and listed in the tla-plus/README.md for manual review. The TLA+ generation continues with all mappable scenarios.",
    type: "text"
  }
];
