import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const mathematicalFoundationsSetsRelationsFunctions = defineRule({
  content: [
    {
      level: 1,
      text: "Mathematical Foundations: Sets, Relations, and Functions",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software engineering deals with data structures, databases, typing systems, and software models. To construct correct and robust systems, software engineers must represent data groupings, map associations between data structures, and define operations precisely. As established in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 17, sets, relations, and functions provide the mathematical foundations for modeling these concepts. A software engineer must understand how these discrete structures are defined, manipulated, and evaluated to build clean, consistent, and error-free codebases.",
      type: "text"
    },
    {
      level: 3,
      text: "3.1 Sets and Subsets",
      type: "header"
    },
    {
      text: "A set is defined as an unordered collection of distinct objects, called elements or members. A set can be represented by listing its elements explicitly between braces (e.g., S = {1, 2, 3}). The symbol ∈ is used to denote membership (e.g., 1 ∈ S), whereas ∉ denotes that an object is not an element of the set (e.g., 4 ∉ S).",
      type: "text"
    },
    {
      text: "For complex or large sets, set-builder notation is used: {x | P(x)} represents the set of all objects x such that the predicate P(x) is true within a specified universe of discourse (also known as the universal set, U). Important standard sets in computer science include:",
      type: "text"
    },
    {
      items: [
        {
          text: "**ℕ**: The set of nonnegative integers (natural numbers), {0, 1, 2, 3, ...}."
        },
        {
          text: "**ℤ**: The set of all integers, {..., -3, -2, -1, 0, 1, 2, 3, ...}."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "A set is finite if it contains a finite number of elements. Otherwise, it is an infinite set (e.g., the set of all natural numbers). The cardinality of a finite set S, denoted by |S|, is the number of elements in S.",
      type: "text"
    },
    {
      text: "Sets can be compared and nested:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Set Equality**: Two sets are equal if and only if they contain exactly the same elements."
        },
        {
          text: "**Subset (X ⊆ Y)**: Set X is a subset of set Y if all elements of X are also included in Y. This is formally defined as: ∀p (p ∈ X → p ∈ Y)."
        },
        {
          text: "**Proper Subset (X ⊂ Y)**: Set X is a proper subset of Y if X is a subset of Y but not equal to Y. That is, (X ⊆ Y) ∧ (X ≠ Y), meaning there is at least one element in Y that is not in X."
        },
        {
          text: "**Superset (Y ⊇ X)**: If X is a subset of Y, then Y is a superset of X."
        },
        {
          text: "**Empty Set (φ)**: A set with no elements, also called a null or void set."
        },
        {
          text: "**Power Set (℘(X))**: The set of all subsets of a set X. If a finite set X has cardinality n, then its power set has cardinality 2^n. For example, if X = {a, b}, then ℘(X) = {φ, {a}, {b}, {a, b}}, and |℘(X)| = 2^2 = 4."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "Venn diagrams are graphic representations of sets as enclosed areas in a plane, where a rectangle represents the universal set U and circles represent sets, which is highly useful for visualizing relationships.",
      type: "text"
    },
    {
      level: 3,
      text: "3.2 Set Operations and Properties",
      type: "header"
    },
    {
      text: "Software systems constantly perform queries, filter collections, and transform datasets. These actions map directly to set operations:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Intersection (X ∩ Y)**: The set containing all elements common to both X and Y. Formally: {p | (p ∈ X) ∧ (p ∈ Y)}. If X ∩ Y = φ, the sets X and Y are disjoint."
        },
        {
          text: "**Union (X ∪ Y)**: The set containing all elements that are in X, in Y, or in both. Formally: {p | (p ∈ X) ∨ (p ∈ Y)}. The cardinality of the union is given by the inclusion-exclusion principle: |X ∪ Y| = |X| + |Y| - |X ∩ Y|."
        },
        {
          text: "**Complement Set (X')**: The set of elements in the universal set U that do not belong to X. Formally: {p | (p ∈ U) ∧ (p ∉ X)}."
        },
        {
          text: "**Set Difference (X - Y)**: The set of elements that belong to X but not to Y, also called the relative complement. Formally: {p | (p ∈ X) ∧ (p ∉ Y)}. It is equivalent to X ∩ Y'."
        },
        {
          text: "**Cartesian Product (X × Y)**: The set of all ordered pairs (p, q) such that p ∈ X and q ∈ Y. Formally: {(p, q) | (p ∈ X) ∧ (q ∈ Y)}. Unlike sets where order is irrelevant (i.e., {p, q} = {q, p}), in ordered pairs the order matters (i.e., (p, q) ≠ (q, p) unless p = q). If |X| = m and |Y| = n, then |X × Y| = m * n."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "The algebra of sets is governed by several laws, which software engineers apply when optimizing queries and data filters:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Associative Laws**: X ∪ (Y ∪ Z) = (X ∪ Y) ∪ Z; X ∩ (Y ∩ Z) = (X ∩ Y) ∩ Z"
        },
        {
          text: "**Commutative Laws**: X ∪ Y = Y ∪ X; X ∩ Y = Y ∩ X"
        },
        {
          text: "**Distributive Laws**: X ∪ (Y ∩ Z) = (X ∪ Y) ∩ (X ∪ Z); X ∩ (Y ∪ Z) = (X ∩ Y) ∪ (X ∩ Z)"
        },
        {
          text: "**Identity Laws**: X ∪ φ = X; X ∩ U = X"
        },
        {
          text: "**Complement Laws**: X ∪ X' = U; X ∩ X' = φ"
        },
        {
          text: "**Idempotent Laws**: X ∪ X = X; X ∩ X = X"
        },
        {
          text: "**Bound Laws**: X ∪ U = U; X ∩ φ = φ"
        },
        {
          text: "**Absorption Laws**: X ∪ (X ∩ Y) = X; X ∩ (X ∪ Y) = X"
        },
        {
          text: "**De Morgan's Laws**: (X ∪ Y)' = X' ∩ Y'; (X ∩ Y)' = X' ∪ Y'"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "3.3 Relations and Functions",
      type: "header"
    },
    {
      text: "In software engineering, mapping relationships between entities is a core task, particularly in database design, domain modeling, and functional programming.",
      type: "text"
    },
    {
      text: "A relation is defined as an association between two sets of information. Formally, a binary relation R from set X to set Y is a subset of the Cartesian product X × Y. The set X is called the domain set (what you start with), and the set Y is called the range set (what you end with). For example, a set of residents paired with their phone numbers is a relation.",
      type: "text"
    },
    {
      text: "A function is a well-behaved relation. A relation R(X, Y) is a function if and only if every element in the domain set X corresponds to one and exactly one element in the range set Y. While all functions are relations, not all relations are functions.",
      type: "text"
    },
    {
      items: [
        {
          text: "Consider a domain set X representing residents and a range set Y representing phone numbers. If a resident can have more than one phone number, the relation is not a function."
        },
        {
          text: "If we map residents to their dates of birth, this is a well-behaved relation (a function) because each resident has exactly one date of birth, even if multiple residents share the same date of birth."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "To determine if a graphed relation is a function, we apply the **Vertical Line Test**: if any vertical line drawn on the graph of a relation intersects the graph in more than one place, then that relation is not a function. If the vertical line crosses the graph multiple times, it signifies that a single domain value x maps to multiple range values y, violating the definition of a function.",
      type: "text"
    },
    {
      text: "Functions are further classified based on the nature of their domain-to-range mappings:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Injection (One-to-One)**: A function where distinct elements in the domain map to distinct elements in the range. If f(a) = f(b), then a = b. In software, unique key mappings or hash functions strive to be injective."
        },
        {
          text: "**Surjection (Onto)**: A function where every element in the range is mapped to by at least one element in the domain. For every y in the range Y, there exists an x in the domain X such that f(x) = y."
        },
        {
          text: "**Bijection (One-to-One Correspondence)**: A function that is both injective and surjective. Bijections are critical in cryptography and encoding because they are invertible, allowing a unique inverse function to map range values back to their original domain values."
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
      text: "This compliance checklist provides specific questions based on SWEBOK guidelines to verify that sets, relations, and functions are modeled and implemented correctly in software engineering tasks.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Set Representation**: Have data groupings been modeled using appropriate collections (e.g., standard unique sets) rather than arrays when duplicate elements are logically invalid?"
        },
        {
          text: "**Membership and Domain Constraints**: Are elements validated to verify that they belong to the correct universe of discourse (domain) before insertion into a set?"
        },
        {
          text: "**Cardinality Verification**: Has the size of finite collections been monitored to prevent out-of-memory errors, and is it correctly evaluated using cardinality calculations?"
        },
        {
          text: "**Subset Logic Application**: When modeling hierarchical classifications (e.g., user roles, permission sets), has the subset relationship (⊆) been verified to ensure proper inheritance bounds?"
        },
        {
          text: "**Proper Subset Constraints**: If a child role must not have the exact same capabilities as the parent, has the relationship been enforced as a proper subset (⊂)?"
        },
        {
          text: "**Power Set Resource Guarding**: If the application computes power sets (e.g., checking all possible combinations of settings), has the exponential growth (2^n) been audited to prevent resource exhaustion?"
        },
        {
          text: "**Disjoint Set Operations**: When combining two data sources that must not share elements, has a disjoint check (X ∩ Y = φ) been implemented and tested?"
        },
        {
          text: "**Inclusion-Exclusion Cardinality**: When calculating the union of two collections, is the cardinality calculated as |X| + |Y| - |X ∩ Y| to prevent double-counting?"
        },
        {
          text: "**Difference and Complement Operations**: When filtering lists (e.g., finding unassigned tasks), is the logic implemented using set difference (X - Y) to ensure precision?"
        },
        {
          text: "**Cartesian Product Bounds**: When generating grid pairs, permutations, or nested matrices, has the Cartesian product cardinality (m * n) been audited to ensure execution times remain within limits?"
        },
        {
          text: "**Ordered Pair Distinction**: When mapping relationships, is the ordering of pairs checked (i.e., verifying if (p, q) and (q, p) have distinct semantic meanings in the system)?"
        },
        {
          text: "**Set Algebraic Simplification**: Have set algebra properties (distributive, absorption, and De Morgan's laws for sets) been applied to simplify database queries or filter predicates?"
        },
        {
          text: "**Database Relation Normalization**: Are database tables structured with clear foreign keys representing mathematical relations between domain sets and range sets?"
        },
        {
          text: "**Function Determinism**: Has it been verified that every function in the code maps a single input to one and exactly one output, avoiding side effects that make the mapping non-deterministic?"
        },
        {
          text: "**Domain/Range Mapping**: Are function inputs (domain) and outputs (range) typed explicitly using TypeScript type definitions or schemas to prevent runtime signature violations?"
        },
        {
          text: "**Non-Function Separation**: If a database query or API endpoint can return multiple results for a single key (e.g., a one-to-many relationship), is it explicitly handled as a relation (returning a list) rather than assumed to be a function?"
        },
        {
          text: "**Vertical Line Test Analogy**: Has the API or route behavior been verified to ensure that query parameters (x) do not resolve to conflicting states or duplicate resources (y) on a single lookup?"
        },
        {
          text: "**Collection Test Coverage**: Does the test suite assert correct behavior for empty sets (φ), single-element sets, and universal boundaries to verify robustness?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "mathematical foundations, sets, relations, functions, set operations, cartesian product, venn diagrams, power set, bijective, domain, range, vertical line test",
  filename: "mathematical-foundations-sets-relations-functions",
  trigger: "model_decision"
});
