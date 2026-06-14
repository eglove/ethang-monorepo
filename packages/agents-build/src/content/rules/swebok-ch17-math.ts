import { defineRule } from "../../define.ts";

export const swebokCh17Math = defineRule({
  content: `# Mathematical Foundations (SWEBOK v4, Chapter 17)

> Scope: formal logic, set theory, FSMs, grammars, number theory, discrete probability, and numerical precision — the mathematical substrate of software engineering. Focus is on logic and reasoning.

## When to Apply

| Trigger | Apply section |
|---|---|
| Designing stateful UI component or state machine | FSM Formal Definition |
| Floating-point comparison in test or production | Numerical Precision |
| Reasoning about flaky test failure rates | Discrete Probability |
| Negating compound guard conditions | Propositional Logic / De Morgan's |
| Specifying preconditions, postconditions, invariants | Predicate Logic |
| Validating grammar / regex / parser correctness | Grammars |
| Dependency graph, topological ordering, cycle detection | Graphs and Trees |

---

## Key Definitions

| Term | Definition |
|---|---|
| **Proposition** | Declarative statement that is either true or false, not both |
| **Predicate** | Parameterized logic statement describing a property of objects |
| **Tautology** | Compound proposition always true |
| **Contradiction** | Compound proposition always false |
| **Bound variable** | Variable introduced by a quantifier (∀ or ∃) |
| **FSM** | Finite-State Machine: finite states + transitions driven by inputs |
| **Accept state** | FSM state marking a successful flow |
| **CFG** | Context-Free Grammar: theoretical basis for parser syntax |
| **Absolute error** | \\|x* − x\\| |
| **Relative error** | \\|x* − x\\| / \\|x\\| — preferred; more intuitive |
| **Overflow** | Computation produces a value outside the representable range |
| **Random variable** | Function assigning a number to each outcome in a sample space |
| **Discrete r.v.** | Countable set of values; probabilities sum to 1 |

---

## 1. Logic

### Propositional Logic — Key Equivalences

| Law | Form |
|---|---|
| De Morgan (∧) | ¬(p ∧ q) ≡ ¬p ∨ ¬q |
| De Morgan (∨) | ¬(p ∨ q) ≡ ¬p ∧ ¬q |
| Double negation | ¬(¬p) ≡ p |
| Distributive | p ∧ (q ∨ r) ≡ (p ∧ q) ∨ (p ∧ r) |
| Identity | p ∧ T ≡ p; p ∨ F ≡ p |

Operators: ¬p (not), p ∧ q (and), p ∨ q (or), p ⊕ q (XOR), p → q (implication).

### Predicate Logic

- **∀x P(x)** — universal: "for all x, P(x) holds" — uses implication: ∀x Tiger(x) → Mammal(x)
- **∃x P(x)** — existential: "there exists at least one x" — uses conjunction: ∃x Tiger(x) ∧ Maneater(x)
- Expresses preconditions, postconditions, and invariants that propositional logic cannot.

---

## 2. Proof Techniques

| Technique | Procedure | Valid for |
|---|---|---|
| Direct proof | Assume p; derive q | Universal claims |
| Contradiction | Assume ¬p; derive contradiction | Universal claims |
| Contrapositive | Prove ¬q → ¬p | Universal claims |
| Induction | Basis P(1); induction P(k) → P(k+1) | Recursive structures, all integers |
| Example | Show one instance exists | **Existential claims only** |

**Induction structure**: (1) Basis: prove P(1). (2) IH: assume P(k). (3) Inductive step: using IH prove P(k+1).

---

## 3. Sets, Relations, Functions

| Operation | Notation | Rule |
|---|---|---|
| Union | X ∪ Y | \\|X ∪ Y\\| = \\|X\\| + \\|Y\\| − \\|X ∩ Y\\| |
| Intersection | X ∩ Y | Elements in both |
| Complement | X̄ | Elements of U not in X |
| Set difference | X − Y | X ∩ Ȳ |
| Cartesian product | X × Y | All ordered pairs (x, y) |
| Power set | ℘(X) | All subsets; \\|℘(X)\\| = 2^n if \\|X\\|=n |

**Function**: every element of the domain maps to exactly one range element. **Relation**: set of ordered pairs.

De Morgan's for sets: (X ∪ Y)' = X' ∩ Y'; (X ∩ Y)' = X' ∪ Y'.

---

## 4. Graphs and Trees

### Graph Type Selection

| Type | Property | Use when |
|---|---|---|
| Undirected | Edges unordered; adjacency symmetric | Peer relationships |
| Directed | Edges ordered (u → v) | Dependency modeling |
| DAG | Directed, no cycles | Build order, module deps, reachability |
| Weighted | Edges carry numeric cost | Routing, optimization |

Key terms: **degree** (incident edges); **in-degree / out-degree** for digraphs; **path** (sequence of adjacent edges); **cycle** (path returning to start).

### Binary Tree — Type Selection

| Type | Property | Use when |
|---|---|---|
| Full | Every internal node has exactly 2 children | Expression trees |
| Complete | All levels filled left-to-right except last | Heaps |
| Balanced | All leaves at levels H or H−1 | Balanced lookup |
| BST | Left keys < node < right keys | Ordered O(log n) lookup |

Tree: T(N, E) with |E| = |N| − 1; height H; balanced binary tree has at most 2^H leaves.

### Traversal Order

| Traversal | Order | Use |
|---|---|---|
| Pre-order | Root → Left → Right | Copy tree |
| In-order | Left → Root → Right | Sorted output from BST |
| Post-order | Left → Right → Root | Deletion |

---

## 5. Finite-State Machines (FSMs)

### Formal Definition

**M = (S, I, O, f, g, s₀, F)** where:

| Component | Meaning | Maps to TypeScript |
|---|---|---|
| **S** | Finite set of states | TypeScript string enum of component states |
| **I** | Set of input symbols | Events / actions dispatched |
| **O** | Set of output symbols | Side effects / emitted events |
| **f: S × I → S** | Transition function | Reducer / state handler |
| **g: S × I → O** | Output function | Effects / derived values |
| **s₀ ∈ S** | Initial state | Default state value |
| **F ⊆ S** | Set of accept states | Terminal / success states |

Information capacity: C = log|S| bits; machine has |S| = 2^C states.

### FSM Procedure for UI State Design

1. Enumerate all states S as a TypeScript string enum.
2. Enumerate all inputs I (user events, HTTP results, timers).
3. Define transition function f as a table (or reducer logic).
4. Mark accept states F (e.g. success, complete).
5. Reachability: every state must be reachable from s₀; unreachable = dead code.
6. Verify all (state, input) pairs are handled; missing = bugs.

---

## 6. Grammars

### Chomsky Hierarchy

| Type | Name | LHS constraint | Basis for |
|---|---|---|---|
| 3 | Regular | Single terminal or terminal+nonterminal on RHS | Regex, lexers |
| 2 | Context-Free | LHS is single nonterminal | Programming language syntax, parsers |
| 1 | Context-Sensitive | RHS length ≥ LHS length | Natural language |
| 0 | Phrase Structure | No constraint | Most general |

Every Type-3 ⊆ Type-2 ⊆ Type-1 ⊆ Type-0.

---

## 7. Number Theory

| Set | Symbol | Description |
|---|---|---|
| Natural | N | {1, 2, 3, …} |
| Integers | Z | {…, −2, −1, 0, 1, 2, …} |
| Rational | Q | Expressible as a/b; b ≠ 0 |
| Real | R | Q ∪ irrationals |

**Divisibility**: a|b if ∃c ∈ Z: b = a×c. **Modular**: a ≡ b (mod m) iff m | (a−b). **GCD**: gcd(a,b) = max d: d|a ∧ d|b. **Prime**: p > 1, factors are 1 and p (used in public-key crypto).

---

## 8. Numerical Precision, Accuracy, and Error

### Floating-Point Decision Table

| Situation | Action |
|---|---|
| Comparing floats for equality | Use epsilon: \`Math.abs(a - b) < EPSILON\` |
| Choosing EPSILON | Use domain tolerance; for currency use integer cents |
| Loop counter from float | Cast to integer; never use float as loop bound |
| Safety-critical integer math | Guard against overflow before each operation |
| Recursive function | Prove base case exists and terminability |

**Overflow**: k-bit location stores 2^k values. Values outside range produce overflow — silent data corruption.

---

## 9. Discrete Probability (Flaky-Test Reasoning)

| Concept | Formula | Application |
|---|---|---|
| Probability | 0 ≤ P(A) ≤ 1; P(S) = 1 | Test pass rate over N runs |
| Disjoint events | P(A or B) = P(A) + P(B) | Mutually exclusive failure modes |
| Mean (expected value) | μ = Σ xᵢpᵢ | Expected run time, failure count |
| Variance | σ² = Σ (xᵢ − μ)²pᵢ | Timing spread — high variance = flaky |
| Std dev | σ = √σ² | Timing variation spread |
| Permutation | nPr = n! / (n−r)! | Ordered selection |
| Combination | nCr = n! / (r! × (n−r)!) | Unordered selection |

**Counting**: Sum rule: |A ∪ B| = |A| + |B| (disjoint). Product rule: |A × B| = |A| × |B| (sequential).

**Flaky test diagnostic**: If a test fails with probability p, it passes all N runs with probability (1−p)^N. A 5% flake rate means a 60% chance of passing a 10-run suite. Eliminate non-determinism.

---

## Decision Checklist

### Must Do
- UI components: define FSM M=(S,I,O,f,g,s₀,F) with explicit TypeScript enum for S.
- FSM: verify reachability (all reachable from s₀) and completeness (all (state,input) handled).
- Float comparisons: use epsilon tolerance, never ==.
- Integer arithmetic in loops/finance: guard against overflow before each operation.
- Recursive functions: prove base case exists and terminates.
- Negate compound conditions: apply De Morgan's laws.
- Proof by example: only for existential claims; never for universal claims.

### Must Not Do
- Do not encode FSM state with multiple scattered boolean flags.
- Do not compare floats with === or == in test assertions or production guards.
- Do not use float as a loop counter or array index.

---

## Anti-Patterns

| Anti-Pattern | Consequence |
|---|---|
| Float equality with == | Non-deterministic failures |
| Scattered boolean flags for state | Untestable; hidden transitions; state explosion |
| Recursion without base case | Stack overflow; non-termination |
| Integer arithmetic without overflow guard | Silent data corruption |
| Unhandled FSM transition | Runtime exception or silent wrong-state behavior |
| Proof by example for universal claims | False confidence; fails to prove all cases |
`,
  description:
    "Mathematical Foundations: logic, sets, relations, and probability",
  filename: "swebok-ch17-math",
  trigger: "model_decision"
});
