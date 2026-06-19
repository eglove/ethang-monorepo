import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const mathematicalFoundationsFundamentals = defineRule({
  content: [
    {
      level: 1,
      text: "Mathematical Foundations: Basic Logic",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software engineering is the systematic application of engineering principles to software systems. As established in SWEBOK v4 Chapter 17, software engineers write code for systems that follow well-understood, unambiguous logic. The Mathematical Foundations Knowledge Area (KA) helps engineers apply this logic to source code. Unlike arithmetic dealing with numbers, this area focuses on logic, reasoning, and formal systems, which form the mathematical abstractions engineers must design, build, and verify.",
      type: "text"
    },
    {
      text: "Mathematics is the study of formal systems characterized by preciseness, ensuring there can be no ambiguous or erroneous interpretation of facts. It is the study of all certain truths about any concept, whether that concept relates to numbers, symbols, images, sounds, video, or complex software architectures. A software engineer must establish precise abstractions over complex, diverse application domains. Developing the skill to identify, describe, and verify logic ensures that the implementation in code is consistent with these architectural and functional abstractions.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Propositional Logic",
      type: "header"
    },
    {
      text: 'Propositional logic is the branch of logic that deals with propositions. A proposition is defined as a declarative statement that is either true or false, but not both. For example, statements such as "The sun is a star" or "2 + 3 = 5" are valid propositions because they can be unambiguously assigned a truth value. Conversely, an algebraic expression like "a + 3 = b" is not a proposition because its truth value depends entirely on the unspecified values of variables a and b.',
      type: "text"
    },
    {
      text: "Two fundamental principles govern propositional logic:",
      type: "text"
    },
    {
      items: [
        {
          text: "**The Law of Excluded Middle**: For every proposition p, either p is true, or p is false. There is no third middle state."
        },
        {
          text: "**The Law of Contradiction**: For every proposition p, it is not the case that p is both true and false simultaneously."
        }
      ],
      type: "numberedList"
    },
    {
      text: "A truth table is a mathematical table that displays the relationships between the truth values of propositions and the compound propositions formed from them. In computer systems, Boolean variables represent variables whose values are either true or false. These correspond directly to bitwise operations performed by computer hardware.",
      type: "text"
    },
    {
      text: "Compound propositions are constructed by combining individual propositions using logical operators. The basic logical operators include:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Negation (not, ¬p)**: Reverses the truth value of proposition p."
        },
        {
          text: "**Conjunction (and, p ∧ q)**: True only if both p and q are true."
        },
        {
          text: "**Disjunction (or, p ∨ q)**: True if at least one of p or q is true."
        },
        {
          text: "**Exclusion (xor, p ⊕ q)**: True if p and q have different truth values."
        },
        {
          text: "**Implication (conditional, p → q)**: True in all cases except when p is true and q is false. Here, p is the hypothesis (or premise) and q is the conclusion."
        },
        {
          text: "**Biconditional (p ↔ q)**: True only when both p and q have the same truth values."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "Compound propositions are classified based on their truth tables:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Tautology**: A compound proposition that is always true, regardless of the truth values of its individual propositions (e.g., p ∨ ¬p)."
        },
        {
          text: "**Contradiction**: A compound proposition that is always false, regardless of individual truth values (e.g., p ∧ ¬p)."
        },
        {
          text: "**Contingency**: A compound proposition that is neither a tautology nor a contradiction (it can be true or false depending on the components)."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "Two compound propositions are logically equivalent (denoted by ≡) if they always have the same truth value under all possible assignments. Understanding logical equivalences is critical for code optimization and refactoring conditional logic. The key logical equivalences defined in SWEBOK v4 include:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Identity Laws**: p ∧ T ≡ p; p ∨ F ≡ p"
        },
        {
          text: "**Domination Laws**: p ∨ T ≡ T; p ∧ F ≡ F"
        },
        {
          text: "**Idempotent Laws**: p ∨ p ≡ p; p ∧ p ≡ p"
        },
        {
          text: "**Double Negation Law**: ¬(¬p) ≡ p"
        },
        {
          text: "**Commutative Laws**: p ∨ q ≡ q ∨ p; p ∧ q ≡ q ∧ p"
        },
        {
          text: "**Associative Laws**: (p ∨ q) ∨ r ≡ p ∨ (q ∨ r); (p ∧ q) ∧ r ≡ p ∧ (q ∧ r)"
        },
        {
          text: "**Distributive Laws**: p ∨ (q ∧ r) ≡ (p ∨ q) ∧ (p ∨ r); p ∧ (q ∨ r) ≡ (p ∧ q) ∨ (p ∧ r)"
        },
        {
          text: "**De Morgan's Laws**: ¬(p ∧ q) ≡ ¬p ∨ ¬q; ¬(p ∨ q) ≡ ¬p ∧ ¬q"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Predicate Logic",
      type: "header"
    },
    {
      text: 'While propositional logic is highly effective for basic logical combinations, it falls short in representing assertions commonly used in mathematics, computer science, and software engineering. It cannot deal with parameterized statements, compare relationships between elements, or apply general formulas. For instance, the statement "a is greater than 1" cannot be modeled as a proposition because its truth value depends on the value of the variable a. Furthermore, propositional logic cannot capture the structural equivalence between statements like "Not all programmers are testers" and "Some programmers do not test."',
      type: "text"
    },
    {
      text: "Predicate logic (also known as first-order logic or predicate calculus) addresses these limitations by extending propositional logic to formulas involving terms, variables, predicates, and quantifiers.",
      type: "text"
    },
    {
      text: 'A predicate is a template that describes a property of objects or a relationship among objects represented by variables. For example, in the statement "The system is online," the template "is online" is a predicate. We can assign a name to this predicate, such as Online(x), where x represents an arbitrary object. The statement Online(x) reads as "x is online."',
      type: "text"
    },
    {
      text: "To make assertions about collections of objects without enumerating each object by name, predicate logic introduces quantifiers:",
      type: "text"
    },
    {
      items: [
        {
          text: "**The Universal Quantifier (∀x)**: Asserts that a predicate P(x) is true for all values of the variable x in its domain. For example, ∀x (Developer(x) → Technical(x)) asserts that every developer is technical. Universal quantification naturally pairs with implication."
        },
        {
          text: "**The Existential Quantifier (∃x)**: Asserts that a predicate P(x) is true for at least one value of the variable x in its domain. For example, ∃x (Server(x) ∧ Overloaded(x)) asserts that there exists at least one server that is overloaded. Existential quantification naturally pairs with conjunction."
        }
      ],
      type: "numberedList"
    },
    {
      text: "A variable introduced by a quantifier is a bound variable. A bound variable is bound to the closest enclosing quantifier. This scoping behavior is analogous to variable scoping in block-structured programming languages, where a variable reference resolves to the nearest declaration in the nesting hierarchy. For example, in the expression ∃x (Service(x) ∧ ∀x (Active(x))), the variable x inside Active(x) is bound to the universal quantifier (∀x), whereas the x inside Service(x) is bound to the existential quantifier (∃x). If a variable in a logical expression is not bound to any quantifier, it is called a free variable. The truth value of an expression containing free variables cannot be determined without assigning values to those free variables.",
      type: "text"
    },
    {
      level: 3,
      text: "1.3 Application of Logic to Software Construction",
      type: "header"
    },
    {
      text: "In software engineering, basic logic is not merely a theoretical exercise; it is the mathematical foundation of code correctness, requirements validation, and system verification. Software engineers use logic to write clean code, refine complex branching logic, model system states, and specify constraints.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Simplifying Conditionals**: De Morgan's laws and distributive properties simplify nested conditionals in code, reducing logic errors."
        },
        {
          text: "**Formulating Specifications**: Preconditions, postconditions, and invariants use predicates to define module boundaries."
        },
        {
          text: "**Verifying Critical Paths**: Model checkers and SAT solvers analyze predicate logic formulas to prove the absence of deadlocks."
        },
        {
          text: "**Testing Logic**: Unit tests map the input state space to ensure coverage of all logical paths and deterministic behavior."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 2,
      text: "2. Compliance Checklist",
      type: "header"
    },
    {
      text: "This compliance checklist provides specific questions based on SWEBOK guidelines to verify the application of basic logic principles in software design and construction.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Propositional Mapping**: Have all conditional states, feature flags, and business branching decisions been modeled as explicit propositions with clear true/false mappings?"
        },
        {
          text: "**Law of Excluded Middle Application**: Does every conditional structure in the code account for all possible states, ensuring no undefined or unhandled third-state conditions exist?"
        },
        {
          text: "**Law of Contradiction Resolution**: Have conflicting states or variables been analyzed to ensure no variable can resolve to mutually exclusive values simultaneously?"
        },
        {
          text: "**Truth Table Verification**: For complex multi-variable logical expressions (three or more variables), has a truth table been drafted to verify that all permutations yield correct outcomes?"
        },
        {
          text: "**Operator Selection**: Have logical operators (conjunction, disjunction, exclusion, negation, implication) been selected precisely according to requirements (e.g., using exclusive-or instead of generic disjunction when states are mutually exclusive)?"
        },
        {
          text: '**Boolean Variable Cohesion**: Are Boolean variables named as clear declarative propositions (e.g., "isServerOnline", "hasWriteAccess") rather than ambiguous nouns or verbs?'
        },
        {
          text: "**Logical Equivalence Refactoring**: Have De Morgan's laws and distributive laws been applied to simplify nested or complex Boolean checks to improve code readability and maintainability?"
        },
        {
          text: "**Tautology and Contradiction Audit**: Have conditional blocks been inspected to ensure no branch contains a tautology (always executing) or a contradiction (dead code that never executes)?"
        },
        {
          text: "**Predicate Definition**: Have business rules that depend on dynamic inputs or parameterized variables been defined as formal predicates with clear parameter sets?"
        },
        {
          text: '**Quantifier Contextual Matching**: When translating business requirements containing terms like "all," "none," or "at least one," have they been translated to universal (∀) or existential (∃) logic patterns?'
        },
        {
          text: "**Implication and Conjunction Pairings**: Have universal quantifiers (∀) been paired with implication (→) and existential quantifiers (∃) with conjunction (∧) to avoid common scoping and logical fallacies?"
        },
        {
          text: "**Bound Variable Scoping**: Have nested loops, functions, and closures been reviewed to ensure that variable names do not accidentally shadow outer variables, maintaining correct binding scopes?"
        },
        {
          text: "**Free Variable Elimination**: Have all variables within conditional block scope been bound or defined, leaving no free variables that could resolve to undefined or trigger runtime exceptions?"
        },
        {
          text: "**Precondition and Postcondition Logic**: Are function contracts (preconditions and postconditions) expressed as logical assertions that can be statically verified or tested?"
        },
        {
          text: "**State Machine Logic Integrity**: If the component implements a state machine, has the transition logic been mapped to verify that all transitions represent valid logical implications?"
        },
        {
          text: "**Logic-Based Test Coverage**: Does the test suite cover all edges of the logical state space, including boundary values, empty inputs, and error states, rather than just basic line execution?"
        },
        {
          text: "**Refactoring Verification**: After refactoring logic structures, has the local test suite been executed to verify that no functional regressions were introduced?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "mathematical foundations, basic logic, propositional logic, predicate logic, truth tables, boolean variables, quantifiers, tautology, contradiction, logic gates, model_decision, engineering reasoning, formal methods",
  filename: "mathematical-foundations-fundamentals",
  trigger: "model_decision"
});
