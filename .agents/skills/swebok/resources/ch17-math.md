# Mathematical Foundations (SWEBOK v4, Chapter 17)

> Formal logic, set theory, FSMs, grammars, number theory, discrete probability, and numerical precision — the mathematical substrate software engineers translate into code. Emphasis is on logic and reasoning, not arithmetic.

## When to Apply

| Trigger | Apply section |
|---|---|
| Designing stateful UI component or state machine | FSM Formal Definition |
| Floating-point comparison in test assertion or production code | Numerical Precision |
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
| **Predicate** | Verb phrase template describing a property of objects; parameterized by variables |
| **Tautology** | Compound proposition always true |
| **Contradiction** | Compound proposition always false |
| **Bound variable** | Variable introduced by a quantifier (∀ or ∃) in a logical expression |
| **FSM** | Finite-State Machine — mathematical abstraction: finite states + transitions driven by inputs |
| **Accept state** | FSM state marking a successful flow of operation |
| **CFG** | Context-Free Grammar — theoretical basis for most programming language syntax |
| **Absolute error** | \|x* − x\| |
| **Relative error** | \|x* − x\| / \|x\| — preferred; more intuitive than absolute error |
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
- Enables formal specification of preconditions, postconditions, and invariants that propositional logic cannot express (e.g., "a > 1" depends on a variable's value)

---

## 2. Proof Techniques

| Technique | Procedure | Valid for |
|---|---|---|
| Direct proof | Assume p; derive q | Universal claims |
| Proof by contradiction | Assume ¬p; derive contradiction | Universal claims |
| Proof by contrapositive | Prove ¬q → ¬p | Universal claims |
| Proof by induction | Basis P(1); inductive step P(k) → P(k+1) | Recursive structures, all integers |
| Proof by example | Show one instance exists | **Existential claims only** |

**Induction structure:** (1) Basis: prove P(1). (2) IH: assume P(k). (3) Inductive step: using IH prove P(k+1).

---

## 3. Sets, Relations, Functions

| Operation | Notation | Rule |
|---|---|---|
| Union | X ∪ Y | \|X ∪ Y\| = \|X\| + \|Y\| − \|X ∩ Y\| |
| Intersection | X ∩ Y | Elements in both |
| Complement | X̄ | Elements of U not in X |
| Set difference | X − Y | X ∩ Ȳ |
| Cartesian product | X × Y | All ordered pairs (x, y) |
| Power set | ℘(X) | All subsets; \|℘(X)\| = 2^n if \|X\|=n |

**Function:** every element of the domain maps to exactly one range element. **Relation:** ordered pairs; functions are well-behaved relations.

De Morgan's for sets: (X ∪ Y)' = X' ∩ Y'; (X ∩ Y)' = X' ∪ Y'.

---

## 4. Graphs and Trees

### Graph Type Selection

| Type | Property | Use when |
|---|---|---|
| Undirected | Edges unordered; adjacency symmetric | Peer relationships |
| Directed (Digraph) | Edges ordered (u → v) | Dependency modeling |
| DAG | Directed, no cycles | Build order, module deps, state reachability |
| Weighted | Edges carry numeric cost | Routing, optimization |

Key terms: **degree** (incident edges); **in-degree / out-degree** for digraphs; **path** (sequence of adjacent edges); **cycle** (path returning to start).

### Binary Tree — Type Selection

| Type | Property | Use when |
|---|---|---|
| Full | Every internal node has exactly 2 children | Expression trees |
| Complete | All levels filled left-to-right except last | Heaps |
| Balanced | All leaves at levels H or H−1 | Balanced lookup |
| BST | Left subtree keys < node < right subtree keys | Ordered O(log n) lookup |

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
| **f: S × I → S** | State transition function | Reducer / state handler |
| **g: S × I → O** | Output function | Effects / derived values |
| **s₀ ∈ S** | Initial state | Default state value |
| **F ⊆ S** | Set of accept states | Terminal / success states |

Information capacity: C = log|S| bits; a machine with C bits has |S| = 2^C states.

### FSM Procedure for UI State Design

1. Enumerate all states S as a TypeScript string enum — one value per reachable condition.
2. Enumerate all inputs I (user events, HTTP results, timer ticks).
3. Define f as a transition table: for each (state, input) pair, the next state.
4. Mark accept states F (e.g., `'success'`, `'complete'`).
5. Run reachability analysis: every state in S must be reachable from s₀ via some input sequence; unreachable states = dead code.
6. Verify all (state, input) pairs are handled; missing pairs = unhandled transitions = bugs.

---

## 6. Grammars

### Chomsky Hierarchy

| Type | Name | LHS constraint | Basis for |
|---|---|---|---|
| 3 | Regular | Single terminal or terminal+nonterminal on RHS | Regular expressions, lexers |
| 2 | Context-Free (CFG) | LHS is single nonterminal | Programming language syntax, parsers |
| 1 | Context-Sensitive (CSG) | RHS length ≥ LHS length | Natural language |
| 0 | Phrase Structure (PSG) | No constraint | Most general |

Every Type-3 ⊆ Type-2 ⊆ Type-1 ⊆ Type-0.

Regular expression operators: OR (+), PRODUCT (·), CONCATENATION (*). L(A*) = strings x₁x₂…xₙ where each xᵢ ∈ L(A), n ≥ 0.

---

## 7. Number Theory

| Set | Symbol | Description |
|---|---|---|
| Natural numbers | N | {1, 2, 3, …} — 0 inclusion varies by convention |
| Integers | Z | {…, −2, −1, 0, 1, 2, …} |
| Rational | Q | Expressible as a/b; b ≠ 0 |
| Irrational | — | Never terminate, never repeat (π, √2) |
| Real | R | Q ∪ irrationals |
| Complex | C | a + bi; i = √−1 |

**Divisibility:** a|b if ∃c ∈ Z: b = a×c. **Modular:** a ≡ b (mod m) iff m | (a−b). **GCD:** gcd(a,b) = max d: d|a ∧ d|b. **Coprime:** gcd(a,b) = 1. **Prime:** p > 1, only factors are 1 and p (used in public-key crypto: product p×q of two large primes).

---

## 8. Numerical Precision, Accuracy, and Error

### Floating-Point Decision Table

| Situation | Action |
|---|---|
| Comparing two float/double values for equality | Use epsilon: `Math.abs(a - b) < EPSILON` |
| Choosing EPSILON | Use domain-appropriate tolerance; for currency use integer cents instead |
| Loop counter or array index computed from float | Cast to integer; never use float as loop bound |
| Financial or safety-critical integer arithmetic | Guard against overflow before each operation |
| Recursive function | Prove base case exists and every call reduces problem size |

**Fixed-point vs floating-point:** Fixed-point is faster (no FPU overhead) but has limited range; use for performance-critical embedded contexts. Floating-point is standard but requires epsilon comparisons.

**Overflow:** k-bit location stores N = 2^k values (32-bit: ~4.3×10⁹; 64-bit: ~1.84×10¹⁹). Values outside range produce overflow — silent data corruption without a guard.

---

## 9. Discrete Probability (Flaky-Test Reasoning)

| Concept | Formula | Application |
|---|---|---|
| Probability of event A | 0 ≤ P(A) ≤ 1; P(S) = 1 | Test pass rate over N runs |
| Disjoint events | P(A or B) = P(A) + P(B) | Mutually exclusive failure modes |
| Mean (expected value) | μ = Σ xᵢpᵢ | Expected run time, expected failure count |
| Variance | σ² = Σ (xᵢ − μ)²pᵢ | Spread of timing — high σ² = flaky |
| Standard deviation | σ = √σ² | One std dev from mean covers ~68% of outcomes |
| Permutation | nPr = n! / (n−r)! | Ordered selection (order matters) |
| Combination | nCr = n! / (r! × (n−r)!) | Unordered selection (order doesn't matter) |

**Counting rules:** Sum rule (mutually exclusive tasks): |A ∪ B| = |A| + |B|. Product rule (sequential tasks): |A × B| = |A| × |B|. Inclusion-exclusion (overlapping): |A ∪ B| = |A| + |B| − |A ∩ B|.

**Flaky test diagnostic:** If a test fails with probability p on each run, it passes all N runs with probability (1−p)^N. A 5% flake rate means 60% chance of passing a 10-run suite — unreliable. Eliminate non-determinism; do not average it away.

---

## Decision Checklist

### Must Do
- [ ] Every stateful component: define FSM M=(S,I,O,f,g,s₀,F) with explicit TypeScript enum for S
- [ ] Every FSM: verify reachability (all states reachable from s₀) and completeness (all (state,input) pairs handled)
- [ ] Floating-point comparisons: use epsilon tolerance, never ==
- [ ] Integer arithmetic in loops / financial calculations: guard against overflow before each operation
- [ ] Recursive functions: prove base case exists and terminates
- [ ] Negating compound conditions: apply De Morgan's laws explicitly
- [ ] Preconditions and postconditions: express in predicate logic (∀/∃), not prose
- [ ] Proof by example: only for existential claims; never for universal claims

### Must Not Do
- [ ] Encode FSM state with multiple scattered boolean flags
- [ ] Leave any (state, input) pair unhandled (implicit fall-through)
- [ ] Compare floats with === or == in test assertions or production guards
- [ ] Use float as a loop counter or array index
- [ ] Use proof by example to validate a universal claim

---

## Anti-Patterns

| Anti-Pattern | Consequence |
|---|---|
| Floating-point equality with == | Non-deterministic failures; values that should match, don't |
| Implicit state via scattered boolean flags | Untestable; impossible to enumerate all states; hidden transitions |
| Recursive function without base case | Stack overflow; non-termination |
| Integer arithmetic without overflow guard | Silent data corruption in financial or safety-critical calculations |
| Unhandled FSM transition (missing (state,input) pair) | Runtime exception or silent wrong-state behavior |
| Averaging ordinal data (e.g., "average severity") | Statistically invalid; leads to wrong conclusions |
| Proof by example for universal claims | False confidence; one example does not prove all cases |

---

## Standards Referenced

- Rosen, *Discrete Mathematics and Its Applications*, 8th ed., McGraw-Hill, 2018 — ch1 (Logic, Proofs), ch2 (Sets), ch4 (Number Theory), ch6 (Counting), ch7 (Probability), ch10–11 (Graphs/Trees), ch13 (FSM, Grammar)
- Cheney & Kincaid, *Numerical Mathematics and Computing*, 7th ed., Addison Wesley, 2020 — ch1 (Numerical Precision, Accuracy, Error)
