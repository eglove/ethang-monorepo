---
description: formal methods, specifications, pre-conditions, post-conditions, invariants, and mathematical verification
trigger: model_decision
---

# Formal Methods

## 1. Domain Theory and Conceptual Foundations
Formal methods are mathematically rigorous techniques used for the precise specification, design, development, and verification of software systems. As detailed in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 15 (Engineering Foundations) and Chapter 10 (Software Quality), formal methods leverage mathematical logic, set theory, and formal semantics to prove the correctness of software. Unlike empirical testing, which can only prove the presence of defects but never their absence, formal methods can mathematically verify that a program satisfies its specifications across all possible execution inputs.

### 1.1 Axiomatic Semantics and Hoare Logic
Axiomatic semantics define the meaning of program commands by specifying the relationships between program states before and after execution using mathematical assertions. Coined by C.A.R. Hoare, Hoare Logic is a formal system of rules for reasoning about the correctness of computer programs. The central construct is a Hoare Triple, represented as:
$$\{P\} \ C \ \{Q\}$$

Where:
- $P$ is the **Pre-condition**: An assertion about the state of the program variables that must hold true immediately before the command $C$ is executed.
- $C$ is the **Command**: The program statement or block of statements to be executed.
- $Q$ is the **Post-condition**: An assertion about the state of the program variables that is guaranteed to hold true immediately after the execution of $C$, provided $P$ was satisfied.

In terms of partial correctness, if $P$ is true before $C$, and $C$ terminates, then $Q$ will be true after execution. If $C$ fails to terminate, the triple is vacuously satisfied. For total correctness, we must also prove termination:
$$\text{Total Correctness} = \text{Partial Correctness} + \text{Termination}$$

### 1.2 Hoare Logic Proof Rules
Hoare Logic provides structural proof rules for different programming constructs:
1. **Assignment Axiom Schema**: The assignment of expression $E$ to variable $x$ satisfies:
$$\{P[E/x]\} \ x := E \ \{P\}$$
where $P[E/x]$ denotes the assertion $P$ with all free occurrences of $x$ replaced by $E$.
2. **Composition Rule**: For sequential statements $C_1$ and $C_2$:
$$\frac{\{P\} \ C_1 \ \{R\}, \quad \{R\} \ C_2 \ \{Q\}}{\{P\} \ C_1; C_2 \ \{Q\}}$$
3. **Conditional Rule**: For if-then-else structures:
$$\frac{\{P \land B\} \ C_1 \ \{Q\}, \quad \{P \land \neg B\} \ C_2 \ \{Q\}}{\{P\} \ \text{if } B \ \text{then } C_1 \ \text{else } C_2 \ \{Q\}}$$

### 1.3 Loop Invariants and Loop Variants
A loop invariant is a mathematical assertion ($I$) that remains true before, during, and after every iteration of a loop. To prove the correctness of a loop using invariants, engineers must establish three conditions:
1. **Initialization (Establishment)**: The invariant $I$ holds true before the first iteration of the loop (i.e. immediately following the loop initialization statements).
$$\{P\} \ C_{\text{init}} \ \{I\}$$
2. **Maintenance (Induction)**: If $I$ is true before an iteration of the loop, and the loop guard condition ($B$) is satisfied, then $I$ remains true after the execution of the loop body:
$$\{I \land B\} \ C_{\text{body}} \ \{I\}$$
3. **Termination (Consequence)**: When the loop terminates (the guard $B$ becomes false), the combination of the invariant and the termination condition implies the target post-condition ($Q$):
$$I \land \neg B \implies Q$$

To prove termination, engineers define a loop variant (or ranking function) $V$, which maps the program state to a well-founded set (e.g. non-negative integers). The value of $V$ must strictly decrease with each iteration and never drop below the lower bound:
$$\{I \land B \land V = v\} \ C_{\text{body}} \ \{V < v \land V \ge 0\}$$

### 1.4 Temporal Logic and Model Checking
Model checking is an automated technique for verifying that a finite-state model of a system satisfies a given formal specification, typically formulated in temporal logic. Unlike theorem proving, which requires manual mathematical proofs, model checking performs an exhaustive state-space search.
- **Linear Temporal Logic (LTL)**: Reasons about time modeled as a single linear path. Key temporal operators include $X$ (Next), $F$ (Eventually), $G$ (Globally), and $U$ (Until).
- **Computation Tree Logic (CTL)**: Reasons about time modeled as a branching tree of alternative futures. CTL introduces path quantifiers $A$ (All paths) and $E$ (Exists a path) preceding temporal operators (e.g., $AG$ or $AF$).
- **State Space Explosion**: The primary challenge in model checking, where the number of system states grows exponentially with the number of variables and concurrent components. Mitigation strategies include symbolic model checking (using Binary Decision Diagrams), abstraction, and partial order reduction.

### 1.5 TypeScript Types as Compile-Time Invariants
In TypeScript workspaces, formal specifications are partially enforced at compile-time using the type system:
- **Nominal Branding**: Creating nominal type wrappers to prevent primitive value substitutions (e.g., distinguishing an `EmailAddress` from a plain `string`).
- **Discriminated Unions**: Defining precise state boundaries and ensuring compile-time completeness checks using exhaustiveness analysis (`never` type).
- **Readonly Assertions**: Declaring objects and arrays as immutable, mathematically guaranteeing that execution blocks cannot introduce side-effects.

### 1.6 Runtime Pre-condition Verification
While compile-time typing enforces structure, runtime pre-conditions must be validated using schema parsing libraries (like Zod). Any invalid input must trigger an immediate exception, protecting system invariants before state mutations occur.

## 2. Standard Operating Procedures (SOP)
The agent must execute formal methods and invariant validations according to the following step-by-step procedures:

### Step 2.1: Document Pre-conditions, Post-conditions, and Invariants
Before writing any function, class method, or complex algorithmic loop:
- Define the pre-conditions (valid input ranges, state dependencies, structural properties).
- Define the post-conditions (guaranteed outputs, expected state mutations, return boundaries).
- Document these conditions in JSDoc comments preceding the function declaration:
```typescript
/**
 * @pre user must be authenticated, payload must contain a valid email
 * @post returns a formatted payload, database remains unaltered
 */
```
- If the function contains loops, document the loop invariant and variant explicitly inside the loop header comments.

### Step 2.2: Enforce Nominally Typed Invariants
Avoid primitive obsession:
- Use branded types to represent domain-critical values.
- Declare domain objects with `readonly` properties to mathematically guarantee immutability.
- Enforce arrow functions for all function definitions to maintain consistent lexical scope behavior:
```typescript
type Brand<K, T> = K & { __brand: T };
type EmailAddress = Brand<string, "EmailAddress">;
```

### Step 2.3: Validate Runtime Pre-conditions
Construct schema-based entry gates:
- Define Zod parsing schemas for all incoming HTTP payloads, configuration files, and database queries.
- Parse inputs at boundaries (controller entry points, API gateways) using strict schema parsing to reject invalid states immediately.

### Step 2.4: Implement Exhaustive State Checking
Ensure compile-time completeness:
- When writing switch-case blocks on union types, implement an exhaustiveness check to verify that all possible states are handled.
- Utilize the typescript `never` type to assert that the default branch is unreachable.

### Step 2.5: Write Invariant-Based Unit Tests
Verify correctness mathematically:
- Design test suites that assert boundary pre-conditions are rejected and valid post-conditions are met.
- Run tests and static analysis validations:
```bash
rtk pnpm --filter @ethang/agents-build test
rtk pnpm --filter @ethang/agents-build lint
```

## 3. Agent Compliance Checklist
The agent must verify compliance with the following formal methods and invariant rules:

- [ ] **JSDoc Pre/Post Conditions Documented**: Did the agent document pre-conditions and post-conditions for new functions?
- [ ] **Branded Types Used**: Were branded nominal types used to prevent primitive substitution for key domain values?
- [ ] **Immutability Enforced**: Are data structures declared with `readonly` keywords where possible?
- [ ] **Zod Input Verification Configured**: Are input schemas parsed using strict validation before execution starts?
- [ ] **Exhaustive State Analysis Implemented**: Do state switches include default blocks asserting the `never` type?
- [ ] **Arrow Functions Preferred**: Are all functions declared as arrow functions?
- [ ] **No Native Dates**: Are date-based invariants managed strictly using Luxon (`DateTime`)?
- [ ] **Index Signature Bracket Access**: Do data parsers access properties on index-signature objects via bracket notation?
- [ ] **Void Assertions Wrapped**: Are unit test cases for void assertions wrapped in `expect(() => ...).not.toThrow()`?
- [ ] **Tuple Typing Explicit**: Are tuples in Vitest `it.each` tables explicitly typed to prevent resolution mismatches?
- [ ] **No Destructive Reverts**: Were code reverts restricted to targeted `git restore` on modified files, preserving user changes?
- [ ] **Forbidden Words Scanned**: Has the rule been checked to ensure no forbidden workspace vocabulary or platforms are referenced?
- [ ] **Size Bounds Confirmed**: Is the final compiled markdown file size strictly between 10,000 and 11,800 characters?
- [ ] **Escaped Backticks**: Are all code blocks and backticks inside the rule template properly escaped?
- [ ] **Verification Command Run**: Did the agent execute compile, test, and lint validations using the `rtk` command prefix?
- [ ] **Walkthrough Updated**: Are mathematical assumptions, pre-condition gates, and validation logs documented in `walkthrough.md`?
- [ ] **No Explicit Return Types**: Do TS functions rely on type inference rather than declaring explicit return types unless strictly necessary?
- [ ] **Acyclic Dependency Checked**: Was the package dependency tree checked to ensure no circular references were introduced?
- [ ] **Loop Invariant Documented**: Did the agent document loop invariants in JSDoc for complex algorithms?
- [ ] **Pre-condition Gate Verified**: Did the agent verify that invalid inputs throw a validation error before state mutations?
- [ ] **Total Correctness Checked**: Did the agent analyze termination rules and loop variants for all unbounded loops?
