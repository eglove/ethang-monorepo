import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const mathematicalFoundationsBasicsOfCounting = defineRule({
  content: [
    {
      level: 1,
      text: "Mathematical Foundations - Basics of Counting",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Counting is a fundamental discipline within discrete mathematics that deals with determining the number of elements in finite sets, the arrangements of objects, and the total ways procedures can be performed. In software engineering, as detailed in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 17, Section 8, the basics of counting are essential for analyzing algorithm complexity, estimating data storage requirements, evaluating system configuration spaces, and calculating probabilistic reliability metrics. A disciplined application of counting rules prevents resource overflow, algorithm inefficiencies, and logic defects in complex systems.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 The Sum Rule and Product Rule",
      type: "header"
    },
    {
      text: "The sum rule and the product rule are the twin pillars of combinatorics, forming the basis for all counting procedures.",
      type: "text"
    },
    {
      items: [
        {
          text: "**The Sum Rule**: If a task t1 can be performed in n1 ways, and a second task t2 can be performed in n2 ways, and if these tasks cannot be performed at the same time (they are mutually exclusive), then there are n1 + n2 ways to perform either task. In set-theoretic terms, if A and B are disjoint sets, the cardinality of their union is the sum of their individual cardinalities:\n|A union B| = |A| + |B|"
        }
      ],
      type: "unorderedList"
    },
    {
      text: "This rule generalizes to any finite number of pairwise disjoint sets. In software design, the sum rule is applied when calculating the total execution paths in conditional branching structures (such as switch-case blocks) where only one branch can execute.",
      type: "text"
    },
    {
      items: [
        {
          text: "**The Product Rule**: If a procedure can be broken down into two successive tasks, t1 and t2, such that t1 can be done in n1 ways and t2 can be done in n2 ways after t1 has been completed, then there are n1 * n2 ways to perform the procedure. In set-theoretic terms, for disjoint sets A and B, the cardinality of their Cartesian product is:\n|A x B| = |A| * |B|"
        }
      ],
      type: "unorderedList"
    },
    {
      text: "This rule generalizes to any finite sequence of tasks. In system engineering, the product rule is used to estimate the configuration space of systems (e.g., the combination of network protocols, database engines, and runtime environments).",
      type: "text"
    },
    {
      level: 3,
      text: "1.2 The Principle of Inclusion-Exclusion",
      type: "header"
    },
    {
      text: "When two or more tasks can be performed simultaneously, they represent non-disjoint sets. Applying the sum rule directly in this context results in double-counting the elements in their intersection. The Principle of Inclusion-Exclusion corrects this by subtracting the intersection:\n|A union B| = |A| + |B| - |A intersection B|",
      type: "text"
    },
    {
      text: "For three sets, the principle includes the individual sets, excludes double intersections, and includes the triple intersection:\n|A union B union C| = |A| + |B| + |C| - |A intersection B| - |A intersection C| - |B intersection C| + |A intersection B intersection C|",
      type: "text"
    },
    {
      text: "This principle is vital when optimizing database queries involving multiple search criteria with logical OR operations. It ensures that the database query optimizer accurately estimates the result set size (cardinality estimation) to choose the most efficient index.",
      type: "text"
    },
    {
      level: 3,
      text: "1.3 Permutations and Combinations",
      type: "header"
    },
    {
      text: "Selecting and arranging objects from a finite set is a common requirement in data processing, testing, and optimization algorithms.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Permutations without Repetition**: A permutation is an arrangement of a set of distinct objects in a particular order, without repetition. The number of ways to choose r objects in order from a total of n objects is denoted by P(n, r) and calculated as:\nP(n, r) = n! / (n - r)!\n"
        },
        {
          text: "**Permutations with Repetition**: When objects can be chosen multiple times and order matters, the number of permutations of n objects taken r at a time is n raised to the power of r. Furthermore, when arranging n objects where some are identical, such as arranging n objects where n1 are of type 1, n2 are of type 2, and so on, the total permutations are n! / (n1! * n2! * ... * nk!).\n"
        },
        {
          text: "**Combinations without Repetition**: A combination is a selection of distinct objects in which the order does not matter, without repetition. Changing the order of the selected objects does not create a new combination. The number of ways to choose r objects from a total of n objects in any order is denoted by C(n, r) and calculated as:\nC(n, r) = n! / [r! * (n - r)!]\n"
        },
        {
          text: "**Combinations with Repetition**: When selecting r elements from a set of n elements where repetition is allowed and order does not matter, the formula utilizes the stars and bars method, calculated as C(n + r - 1, r)."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "Because factorials grow extremely rapidly, computing permutations and combinations directly can lead to integer overflow. Software engineers must utilize modular arithmetic or incremental simplification (such as multiplicative cancellation) to prevent numerical errors in production code.",
      type: "text"
    },
    {
      level: 3,
      text: "1.4 Recursion and Recurrence Relations",
      type: "header"
    },
    {
      text: "Recursion is the process of defining an object, function, set, or algorithm in terms of itself. It is a powerful tool for solving complex problems by decomposing them into smaller, identical subproblems.",
      type: "text"
    },
    {
      text: "A recursive function calls itself with smaller inputs. For example, a function f(n) can be defined recursively as:\nf(n) = 3 * f(n - 1) for all natural numbers n greater than zero, with the base case f(0) = 5.",
      type: "text"
    },
    {
      text: "Another classic recurrence relation is the Fibonacci sequence, where:\nF(n) = F(n - 1) + F(n - 2) for all n greater than or equal to 2, with base cases F(0) = 0 and F(1) = 1.",
      type: "text"
    },
    {
      text: "An algorithm is recursive if it reduces the problem size iteratively. Recurrence relations are classified into linear homogeneous and linear non-homogeneous relations based on the presence of non-recursive terms. To verify a recursive algorithm's correctness and efficiency, engineers must model its execution time using recurrence relations. Solving these relations (for example, using the Master Theorem for divide-and-conquer recurrences) yields the asymptotic time and space complexity of the algorithm, ensuring it meets performance requirements.",
      type: "text"
    },
    {
      level: 3,
      text: "1.5 The Pigeonhole Principle",
      type: "header"
    },
    {
      text: "The Pigeonhole Principle states that if k + 1 or more objects are placed into k boxes, then at least one box must contain two or more objects. ",
      type: "text"
    },
    {
      text: "The generalized version states that if N objects are placed into k boxes, then at least one box must contain at least ceiling(N / k) objects.",
      type: "text"
    },
    {
      text: "In software engineering, the Pigeonhole Principle is used to prove the inevitability of collisions. For example, in hash functions, because the set of possible input keys is larger than the set of available hash table slots, collisions are mathematically guaranteed to occur. Engineers must design collision-resolution strategies (such as chaining or open addressing) to handle these occurrences. It is also used to prove bounds on compression algorithms, showing that no compression algorithm can compress all possible inputs. If a compression utility reduces the size of some files, it must inevitably expand others, a mathematical constraint derived from counting mappings between finite sets.",
      type: "text"
    },
    {
      level: 2,
      text: "2. Compliance Checklist",
      type: "header"
    },
    {
      items: [
        {
          text: "**Cardinality Overlap Verification**: When calculating the total size of combined datasets, has the Principle of Inclusion-Exclusion been applied to subtract overlapping records?"
        },
        {
          text: "**Conditional Branching Completeness**: Have execution path estimates using the sum rule verified that branching statements are mutually exclusive?"
        },
        {
          text: "**State Space Size Estimation**: Has the system configuration state space been calculated using the product rule to identify test matrix boundaries?"
        },
        {
          text: "**Factorial Overflow Guardrails**: Are factorial operations in permutation and combination calculations protected against integer overflow (e.g., by using BigInt or incremental multiplication)?"
        },
        {
          text: "**Permutation Order Dependency**: When utilizing permutation formulas, has the ordering requirement of the system objects been verified as significant?"
        },
        {
          text: "**Combination Order Irrelevance**: When utilizing combination formulas, has it been verified that rearranging the selected elements does not alter the system state?"
        },
        {
          text: "**Recursive Base Case Verification**: Do all recursive functions and algorithms incorporate an explicit, tested base case to prevent infinite loops and stack overflow?"
        },
        {
          text: "**Recursion Depth Limits**: Are there runtime limits on recursion depth to prevent thread stack exhaustion under extreme inputs?"
        },
        {
          text: "**Recurrence Relation Solvability**: Have the recurrence relations representing algorithm execution times been solved to verify asymptotic complexity?"
        },
        {
          text: "**Divide-and-Conquer Allocation Bounds**: Does the recursive data splitter verify that subproblem sizes strictly decrease to guarantee termination?"
        },
        {
          text: "**Hash Collision Resolution Design**: Has a collision resolution strategy been implemented to handle the inevitable collisions proved by the Pigeonhole Principle?"
        },
        {
          text: "**Lossless Compression Boundary Limits**: When designing compression algorithms, is there a handler to prevent file expansion when input data cannot be compressed?"
        },
        {
          text: "**ID Collision Mitigation**: If generating short identifiers (such as shortened URLs) from a larger namespace, does the system incorporate collision detection or salting?"
        },
        {
          text: "**Iterative Multiplication Pruning**: Do combinatorial utility libraries cancel out terms in the numerator and denominator before executing multiplications to maintain precision?"
        },
        {
          text: "**Switch-Case Mutual Exclusion**: Are compiler flags or static analysis rules configured to verify that switch-case statements do not contain overlapping execution states?"
        },
        {
          text: "**Pigeonhole Allocation Check**: When allocating fixed resources (such as thread pools or connections) to a larger number of tasks, does the system implement queuing to prevent resource exhaustion?"
        },
        {
          text: "**Search Space Bounds Auditing**: Has the combinatorics space of search algorithms been mapped to ensure search limits are set for NP-complete operations?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "counting, sum rule, product rule, inclusion-exclusion, permutations, combinations, recursion",
  filename: "mathematical-foundations-basics-of-counting",
  trigger: "model_decision"
});
