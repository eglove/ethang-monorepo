import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const mathematicalFoundationsProofTechniques = defineRule({
  content: [
    {
      level: 1,
      text: "Mathematical Foundations: Proof Techniques",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software engineering requires high-reliability designs and correct software implementations. In complex software structures, developers must prove that algorithms terminate, systems satisfy invariant properties, and protocols behave securely. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 17, a proof is an argument that rigorously establishes the truth of a statement. Within the context of a formal system, proofs provide absolute mathematical certainty. Software engineers use mathematical proofs as discrete structures to analyze and verify software correctness, going beyond manual code inspections or partial testing.",
      type: "text"
    },
    {
      text: "Statements in a proof rely on structured logical components:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Axioms and Postulates**: The underlying assumptions about mathematical or system structures that are accepted as true without proof."
        },
        {
          text: "**Theorems**: Statements that have been shown to be true using a rigorous argument."
        },
        {
          text: "**Lemmas**: Simple theorems used primarily as helper blocks in proving other, more complex theorems."
        },
        {
          text: "**Corollaries**: Propositions that can be established directly from a theorem that has already been proved."
        },
        {
          text: "**Conjectures**: Statements whose truth values are currently unknown. When a proof is found for a conjecture, it is elevated to a theorem. If a counterexample is found, the conjecture is proved false."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "Understanding and applying various proof techniques allows software engineers to reason about systems systematically and verify code compliance with high-level specifications.",
      type: "text"
    },
    {
      level: 3,
      text: "2.1 Direct Proof (Proof by Deduction)",
      type: "header"
    },
    {
      text: "A direct proof establishes that the implication p → q is true by demonstrating that the conclusion q must be true whenever the hypothesis p is true. This is also called Proof by Deduction. In a direct proof, we assume the premise p is true, apply standard rules of inference, axioms, and previously proven theorems, and directly derive the truth of q.",
      type: "text"
    },
    {
      text: "For example, to prove that if an integer n is odd, then n^2 - 1 is even:",
      type: "text"
    },
    {
      items: [
        {
          text: "Assume the hypothesis p is true: n is an odd integer. By definition, n can be written as n = 2k + 1 for some integer k."
        },
        {
          text: "Substitute n into the expression n^2 - 1:\nn^2 - 1 = (2k + 1)^2 - 1\n        = (4k^2 + 4k + 1) - 1\n        = 4k^2 + 4k\n        = 2(2k^2 + 2k)"
        },
        {
          text: "Since k is an integer, (2k^2 + 2k) is also an integer. Let m = 2k^2 + 2k."
        },
        {
          text: "The expression is now 2m, which is a multiple of 2 and therefore even."
        },
        {
          text: "This concludes the proof that n^2 - 1 is even when n is odd."
        }
      ],
      type: "numberedList"
    },
    {
      text: "In software engineering, direct proof is commonly used to trace code execution paths and verify that a specific output state is reached when preconditions are satisfied.",
      type: "text"
    },
    {
      level: 3,
      text: "2.2 Proof by Contradiction and Proof by Contrapositive",
      type: "header"
    },
    {
      text: "When a direct proof is difficult to formulate, indirect proof techniques like contradiction and contraposition are highly effective.",
      type: "text"
    },
    {
      level: 3,
      text: "Proof by Contradiction",
      type: "header"
    },
    {
      text: "A proposition p is proved true by contradiction based on the implication ¬p → q, where q is a known contradiction (a statement that is always false, such as a ∧ ¬a). We assume that the statement we want to prove is false (¬p) and show that this assumption leads logically to an impossible or contradictory situation.",
      type: "text"
    },
    {
      text: "For example, to show that the sum of 2x + 1 and 2y - 1 is even:",
      type: "text"
    },
    {
      items: [
        {
          text: "Assume the negation of the conclusion: the sum is odd."
        },
        {
          text: "Formulate the sum: (2x + 1) + (2y - 1) = 2x + 2y = 2(x + y)."
        },
        {
          text: "The sum is clearly a multiple of 2, which makes it even by definition."
        },
        {
          text: "However, our assumption was that the sum is odd. This yields a contradiction: the sum is both even and odd."
        },
        {
          text: "Therefore, the assumption must be false, proving that the sum is indeed even."
        }
      ],
      type: "numberedList"
    },
    {
      text: "In software, proof by contradiction is often used to prove safety properties. To prove that a system will never enter an insecure state, we assume it does enter that state and show that this violates system constraints or invariants.",
      type: "text"
    },
    {
      level: 3,
      text: "Proof by Contrapositive",
      type: "header"
    },
    {
      text: "This technique is based on the logical equivalence between the conditional statement p → q and its contrapositive ¬q → ¬p. To prove p → q, we assume that the conclusion q is false (¬q) and prove that the hypothesis p must also be false (¬p).",
      type: "text"
    },
    {
      text: 'This is highly useful in proving code boundaries. For instance, if we want to prove "If the system processed the request, the user was authenticated," we can instead prove the contrapositive: "If the user was not authenticated, the system did not process the request."',
      type: "text"
    },
    {
      level: 3,
      text: "2.3 Proof by Induction",
      type: "header"
    },
    {
      text: "Proof by induction is a powerful mathematical technique used to prove that a proposition P(n) is true for all positive integers n. It is performed in two essential steps:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Basis Step**: Establish that the proposition is true for the base case—typically n = 1 (or the smallest element in the domain)."
        },
        {
          text: "**Inductive Step**: Prove the conditional statement P(k) → P(k + 1) for any arbitrary positive integer k. We assume the Inductive Hypothesis (IH) that P(k) is true, and use it to show that P(k + 1) must also be true."
        }
      ],
      type: "numberedList"
    },
    {
      text: "For example, to prove that the sum of the first n odd positive integers is n^2 (P(n): 1 + 3 + 5 + ... + (2n - 1) = n^2):",
      type: "text"
    },
    {
      items: [
        {
          text: "**Basis Step**: For n = 1, P(1) = 1^2 = 1. The basis step is complete."
        },
        {
          text: "**Inductive Step**: Assume the induction hypothesis P(k) is true for an arbitrary positive integer k:\n1 + 3 + 5 + ... + (2k - 1) = k^2"
        },
        {
          text: "Now, we show that P(k + 1) is true:\n1 + 3 + 5 + ... + (2k - 1) + (2(k + 1) - 1) = (k + 1)^2"
        },
        {
          text: "The left-hand side can be grouped using the induction hypothesis:\n[1 + 3 + 5 + ... + (2k - 1)] + (2k + 1) = k^2 + (2k + 1)\n                                       = k^2 + 2k + 1\n                                       = (k + 1)^2"
        },
        {
          text: "Since the basis step and the inductive step are both proved, the proposition P(n) is true for all positive integers n."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "In software construction, induction is the formal basis for verifying loops (using loop invariants) and recursive functions. We prove that the base case of the recursion is correct, and that if the recursive step holds for k, it holds for k + 1, thereby proving the recursive function works correctly for all inputs.",
      type: "text"
    },
    {
      level: 3,
      text: "2.4 Proof by Example",
      type: "header"
    },
    {
      text: 'Proof by example is a valid proof technique if and only if the statement to be proven is existential (e.g., "there exists an x such that P(x)"). In this case, finding a single valid instance that satisfies the predicate is sufficient to establish truth.',
      type: "text"
    },
    {
      text: 'However, using a few examples to prove a universal statement (e.g., "for all x, P(x)") is a logical fallacy known as **Inappropriate Generalization**. Demonstrating that a software routine works correctly for a few sample inputs does not prove that it is correct for all possible inputs. Testing, which is an exercise in checking specific examples, can show the presence of bugs but cannot prove their absence (Dijkstra\'s aphorism). To prove a universal statement false, however, a single counterexample is sufficient.',
      type: "text"
    },
    {
      level: 2,
      text: "2. Compliance Checklist",
      type: "header"
    },
    {
      text: "This compliance checklist provides specific questions based on SWEBOK guidelines to verify that proof and verification techniques are applied rigorously to software engineering tasks.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Methodological Verification**: Has the correctness of the core algorithm or safety protocol been established using a formal proof technique rather than relying solely on passing tests?"
        },
        {
          text: "**Precondition/Postcondition Implication**: For critical functions, has the direct implication (preconditions → postconditions) been verified to ensure no execution path violates the output contract?"
        },
        {
          text: "**Axiom and Invariant Identification**: Have all underlying system axioms, environment constraints, and state invariants been explicitly defined and documented before attempting verification?"
        },
        {
          text: "**Direct Path Deduction**: Did the analysis trace the logic of the code directly from inputs to outputs, showing that every step is a valid logical inference?"
        },
        {
          text: "**Safety Invariant Verification**: Has a proof by contradiction been used to verify safety properties (e.g., assuming a deadlock state occurs and showing it violates the protocol rules)?"
        },
        {
          text: "**Contrapositive Logic Application**: When validating complex access controls or error boundaries, has the logic been validated via its contrapositive (i.e., verifying that the absence of permissions guarantees the absence of action)?"
        },
        {
          text: "**Recursive Function Induction**: If the algorithm uses recursion, has its correctness been verified using mathematical induction (basis step and inductive step)?"
        },
        {
          text: "**Loop Invariant Verification**: For loops that process critical data, has a loop invariant been defined, showing it holds before the loop starts (basis), is preserved by each iteration (inductive step), and guarantees correctness upon termination?"
        },
        {
          text: "**Termination Proof**: Has a loop variant (termination function) been defined and proved to decrease with every iteration to guarantee the loop cannot execute infinitely?"
        },
        {
          text: "**Existential Example Validation**: When verifying existential properties (e.g., showing a valid configuration exists), has a concrete, reproducible example been provided?"
        },
        {
          text: '**Universal Assertion Isolation**: Has the code avoided "inappropriate generalization" by not assuming a function is universally correct based on a limited set of test cases?'
        },
        {
          text: "**Counterexample Audit**: Have edge cases, error inputs, and boundary values been analyzed as potential counterexamples to the system's correctness hypothesis?"
        },
        {
          text: "**Inference Rule Verification**: Have logic structures and transition rules been verified against standard rules of inference (such as addition, simplification, and conjunction) to avoid fallacies?"
        },
        {
          text: "**State Machine Invariant Check**: For state transitions, has it been proved that no sequence of events can transition the system from a valid state to an invalid state?"
        },
        {
          text: "**Data Flow Boundary Proof**: Has it been verified that data values remain within mathematical limits (preventing overflow, underflow, or division by zero) under all input scenarios?"
        },
        {
          text: "**Verification Documentation**: Are the proofs, rationale, and formal logic assumptions checked in alongside the codebase to ensure long-term maintenance and prevent technical debt?"
        },
        {
          text: "**Peer Verification Review**: Has the logical verification model been subjected to peer review to identify potential flaws in the proof steps?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "mathematical foundations, proof techniques, direct proof, contradiction, induction, contrapositive, proof by example, theorems, lemmas, corollaries, conjectures, inference rules",
  filename: "mathematical-foundations-proof-techniques",
  trigger: "model_decision"
});
