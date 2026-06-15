import { defineRule } from "../../define.ts";

export const booleanLogic = defineRule({
  content: `# Boolean Logic

## 1. Domain Theory and Conceptual Foundations
Boolean logic and propositional calculus provide the mathematical foundation for constructing, simplifying, and verifying conditional logic in computer programs. As described in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 15 (Engineering Foundations) and Chapter 10 (Software Quality), logical reasoning ensures that software control flows are correct, complete, and free of redundant evaluations.

### 1.1 Propositional Logic Connectives and Truth Tables
Propositional logic evaluates statements (propositions) that can be either true ($1$) or false ($0$). These propositions are combined using logical connectives:
- **Conjunction (AND / $\\land$)**: True only if both operands are true.
- **Disjunction (OR / $\\lor$)**: True if at least one operand is true.
- **Negation (NOT / $\\neg$)**: Inverts the logical value of the operand.
- **Exclusive OR (XOR / $\\oplus$)**: True if exactly one of the operands is true.
- **Implication ($\\implies$)**: Represents "if $A$, then $B$". Mathematically equivalent to $\\neg A \\lor B$.
- **Biconditional ($\\iff$)**: True if both operands have the same truth value.

Truth tables systematically map every possible combination of input values to determine the output state of a compound expression. For Implication ($A \\implies B$), the truth table is:

| $A$ | $B$ | $A \\implies B$ |
| :---: | :---: | :---: |
| 0 | 0 | 1 |
| 0 | 1 | 1 |
| 1 | 0 | 0 |
| 1 | 1 | 1 |

In programming, implication is frequently used in assertions or contract validation: "If the process is complete ($A$), then the status code must be success ($B$)." This is written as \`if (A) { assert(B); }\` or simplified as \`!A || B\`. By mapping out truth tables, developers can guarantee that no execution paths or boundary states are left unhandled.

### 1.2 Laws of Boolean Algebra
Boolean algebra properties allow engineers to simplify complex conditions to improve readability and performance:
1. **Identity Laws**: $A \\land 1 = A$ and $A \\lor 0 = A$
2. **Domination Laws**: $A \\lor 1 = 1$ and $A \\land 0 = 0$
3. **Idempotent Laws**: $A \\lor A = A$ and $A \\land A = A$
4. **Double Negation Law**: $\\neg(\\neg A) = A$
5. **Commutative Laws**: $A \\lor B = B \\lor A$ and $A \\land B = B \\land A$
6. **Associative Laws**: $(A \\lor B) \\lor C = A \\lor (B \\lor C)$ and $(A \\land B) \\land C = A \\land (B \\land C)$
7. **Distributive Laws**: $A \\land (B \\lor C) = (A \\land B) \\lor (A \\land C)$ and $A \\lor (B \\land C) = (A \\lor B) \\land (A \\lor C)$
8. **Absorption Laws**: $A \\lor (A \\land B) = A$ and $A \\land (A \\lor B) = A$

### 1.3 De Morgan's Laws and Logic Minimization
De Morgan's Laws are critical for simplifying negated compound expressions:
- **Negation of Conjunction**: The negation of a conjunction is logically equivalent to the disjunction of the negations:
$$\\neg(A \\land B) \\iff \\neg A \\lor \\neg B$$
- **Negation of Disjunction**: The negation of a disjunction is logically equivalent to the conjunction of the negations:
$$\\neg(A \\lor B) \\iff \\neg A \\land \\neg B$$

For complex logic involving 3 or 4 variables, designers use **Karnaugh Maps (K-Maps)** to visually group adjacent true states and find the minimum Sum of Products (SOP) or Product of Sums (POS) form. This prevents redundant logic checks at compile or run time.

### 1.4 Short-Circuit Evaluation
Modern programming languages (including JavaScript/TypeScript) utilize short-circuit evaluation for efficiency:
- In $A \\land B$, if $A$ evaluates to false, $B$ is not evaluated because the entire expression is guaranteed to be false.
- In $A \\lor B$, if $A$ evaluates to true, $B$ is not evaluated because the entire expression is guaranteed to be true.

Engineers must leverage short-circuiting to place light computational checks or null checks before heavy database queries or function calls.

### 1.5 Cognitive Complexity and SonarQube Rules
SonarQube's cognitive complexity metric measures how difficult a control flow is for a human to understand. Unlike cyclomatic complexity, which counts the number of mathematical branches, cognitive complexity:
- Increments for every nesting level of \`if\`, \`for\`, \`while\`, or \`catch\`.
- Increments for every logical group of operators (e.g. alternating \`&&\` and \`||\` in a single condition).
- Can be lowered significantly by extracting complex boolean conditions into helper variables or functions with descriptive names.

### 1.6 Bitwise Logic vs. Logical Operators
Engineers must distinguish between bitwise operators (\`&\`, \`|\`, \`~\`, \`^\`) and logical operators (\`&&\`, \`||\`, \`!\`):
- **Logical Operators**: Evaluate expressions as truthy or falsy and employ short-circuit evaluation. They are designed for control flow logic.
- **Bitwise Operators**: Perform bit-by-bit operations on the binary representations of integers and do *not* short-circuit.
Using bitwise operators in control-flow conditionals (e.g. \`if (a & b)\` instead of \`if (a && b)\`) is an anti-pattern that leads to logical errors, performance overhead due to evaluating both sides, and reduced readability.

## 2. Standard Operating Procedures (SOP)
The agent must design and structure logical conditions according to the following procedures:

### Step 2.1: Apply De Morgan's Laws to Simplify Negations
If you write a negated compound check:
1. Apply De Morgan's formula to distribute the negation over all inner terms.
2. Flip all ANDs to ORs, and ORs to ANDs.
3. Simplify double negations.
- **Example**: Simplify \`if (!(status !== "success" || !isAdmin || attempts >= 3))\`
  - Let $A$ be \`status !== "success"\` -> $\\neg A$ is \`status === "success"\`
  - Let $B$ be \`!isAdmin\` -> $\\neg B$ is \`isAdmin\`
  - Let $C$ be \`attempts >= 3\` -> $\\neg C$ is \`attempts < 3\`
  - Distribute NOT: \`\\neg(A \\lor B \\lor C) \\iff \\neg A \\land \\neg B \\land \\neg C\`
  - Resulting simplified code: \`if ("success" === status && isAdmin && attempts < 3)\`

### Step 2.2: Enforce Yoda Conditions (Constant First)
To avoid accidental assignment bugs (e.g. using \`=\` instead of \`===\`) and maintain styling compliance, place the literal constant or expected value first:
\`\`\`typescript
// Incorrect
if (env === "production") {}

// Correct
if ("production" === env) {}
\`\`\`

### Step 2.3: Implement Trailing Else for Else-If blocks
To comply with styling standards and ensure comprehensive logical branching, every \`else if\` block must terminate with an \`else\` block:
- If no action is required in the default case, include a comment indicating so inside the else block:
\`\`\`typescript
if ("admin" === user.role) {
  grantAdminAccess();
} else if ("user" === user.role) {
  grantUserAccess();
} else {
  // do nothing or raise warning
}
\`\`\`

### Step 2.4: Eliminate Nesting via Early Guard Clauses
To reduce cognitive and nested complexity:
- Restructure deep \`if-else\` nests into linear guard clauses that return early.
- Keep the main execution path at the lowest indentation level:
\`\`\`typescript
// Incorrect
const processOrder = (order) => {
  if (order) {
    if (order.isValid) {
      saveOrder(order);
    }
  }
};

// Correct
const processOrder = (order) => {
  if (!order) {
    return;
  }
  if (!order.isValid) {
    return;
  }
  saveOrder(order);
};
\`\`\`

### Step 2.5: Run Quality Verification
- Compile and test the project to ensure no logical flow errors or syntax bugs:
\`\`\`bash
rtk pnpm --filter @ethang/agents-build build
rtk pnpm --filter @ethang/agents-build test
rtk pnpm --filter @ethang/agents-build lint
\`\`\`

## 3. Agent Compliance Checklist
The agent must verify compliance with the following boolean logic rules:

- [ ] **Yoda Condition Used**: Are all comparison conditions structured with the constant or literal value first?
- [ ] **Trailing Else Present**: Do all \`else if\` code blocks terminate with a trailing \`else\` statement?
- [ ] **De Morgan's Laws Applied**: Are negated conjunctions and disjunctions simplified using De Morgan's formulas?
- [ ] **Guard Clauses Preferred**: Are nested conditional statements refactored into early exits to minimize indentation?
- [ ] **Short-Circuit Null Checks Used**: Are null/undefined checks placed before property accesses using short-circuit evaluation?
- [ ] **Double Negation Simplified**: Did the agent eliminate redundant double negations?
- [ ] **No Redundant Boolean Literals**: Are comparisons like \`if (isValid === true)\` simplified to \`if (isValid)\`?
- [ ] **Exhaustive Cases Handled**: Do switch-case controls include a default block throwing an error or asserting \`never\`?
- [ ] **Dead Code Branches Eliminated**: Has the logic been checked to ensure there are no unreachable conditions?
- [ ] **No Native Dates**: Are any timing or interval comparisons executed strictly using Luxon (\`DateTime\`)?
- [ ] **Forbidden Words Checked**: Has the rule text been scanned to confirm no forbidden enterprise vocabularies are present?
- [ ] **Size Bounds Confirmed**: Is the compiled markdown file size strictly between 10,000 and 11,800 characters?
- [ ] **Escaped Backticks**: Are all code blocks and backticks inside the rule template properly escaped?
- [ ] **Verification Command Run**: Did the agent run verification (build, test, lint) using the \`rtk\` command prefix?
- [ ] **Walkthrough Updated**: Are logic simplifications, truth tables, and build results documented in \`walkthrough.md\`?
- [ ] **Index Signature Bracket Access**: Are properties on index-signature objects accessed via bracket notation?
- [ ] **Void Assertions Wrapped**: Are unit test cases verifying lack of exceptions wrapped in \`expect(() => ...).not.toThrow()\`?
- [ ] **Arrow Functions Enforced**: Are all function declarations defined as arrow functions?
- [ ] **Tuple Typing Explicit**: Are tuples in Vitest \`it.each\` tables explicitly typed to prevent compiler resolution mismatches?
- [ ] **Karnaugh Map Justification**: For conditions with 4+ variables, did the agent document the simplified state space?
- [ ] **No Unchecked Index Access**: Does the code use optional chaining when accessing array indices?
- [ ] **Tautologies Avoided**: Did the agent verify that conditions do not simplify to constant truths (e.g. \`A || !A\`)?`,
  description:
    "boolean logic, logic simplification, De Morgan's laws, and truth tables",
  filename: "boolean-logic",
  trigger: "model_decision"
});
