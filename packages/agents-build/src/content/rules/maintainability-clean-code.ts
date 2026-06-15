import { defineRule } from "../../define.ts";

export const maintainabilityCleanCode = defineRule({
  content: `# Maintainability and Clean Code

## 1. Domain Theory and Conceptual Foundations
Maintainability is a critical software quality attribute defining the ease with which a software system or component can be modified to correct defects, adapt to new environments, or implement new features. As detailed in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 12 (Software Maintenance) and Chapter 6 (Software Construction), maintainability is not an afterthought; it is a design-time discipline that determines the long-term viability of a codebase. Statistically, software maintenance consumes $60\\%$ to $80\\%$ of the total lifecycle cost of a system, making maintainability the primary driver of software engineering economics.

### 1.1 The ISO/IEC 25010 Maintainability Sub-characteristics
Modern software engineering models maintainability using five distinct sub-characteristics:
- **Analyzability**: The ease with which the impact of an intended change can be assessed, defects diagnosed, or parts to be modified identified.
- **Modifiability**: The ease with which a system can be modified without introducing defects or degrading existing quality.
- **Testability**: The ease with which a system can be tested to verify that modifications are correct and have not introduced regressions.
- **Reusability**: The extent to which a system asset can be used in more than one system, or in building other assets.
- **Modularization**: The degree to which a system is composed of discrete components such that a change to one component has minimal impact on others.

### 1.2 The Single Responsibility Principle (SRP)
Coined by Robert C. Martin, the Single Responsibility Principle states that a class or module should have one, and only one, reason to change. SRP is a mathematical formulation of cohesion:
$$\\text{Cohesion}(M) \\propto \\frac{1}{\\text{Responsibilities}(M)}$$

Where:
- $M$ is a module.
- $\\text{Responsibilities}(M)$ is the number of distinct business actors whose requirements can force modifications to $M$.

When a module carries multiple responsibilities, it becomes tightly coupled to unrelated parts of the system. This increases the probability of regression defects, as changes made to satisfy actor $A$ accidentally disrupt the features supporting actor $B$.

### 1.3 Naming Conventions and Cognitive Load
Clean code relies heavily on reducing the cognitive load of the engineer reading the code. Descriptive naming is the primary tool for self-documentation. Names must be:
- **Intention-Revealing**: The name of a variable, function, or class must explain why it exists, what it does, and how it is used.
- **Pronounceable and Searchable**: Avoid cryptic abbreviations (e.g., use \`retriesRemaining\` instead of \`rR\`).
- **Context-Proportional**: The length of a variable name should be proportional to its scope. A loop index variable can be \`i\`, but a global configuration object must be fully descriptive.

### 1.4 Complexity Metrics: Cyclomatic and Cognitive
To quantitatively evaluate maintainability, engineers measure Cyclomatic Complexity ($M$) using McCabe's formulation:
$$M = E - V + 2P$$

Where:
- $E$ is the number of edges in the control flow graph of the program.
- $V$ is the number of vertices (nodes) representing sequential code blocks.
- $P$ is the number of connected components (usually $P=1$ for a single function).

SWEBOK v4 highlights that high cyclomatic complexity directly correlates with defect density and low maintainability. While cyclomatic complexity measures the number of linear paths through code, **Cognitive Complexity** measures how difficult it is for a human to understand the control flow. Clean code enforces strict limits on cognitive complexity by avoiding nested conditionals, deep loops, and complex boolean expressions.

### 1.5 The Role of Comments: Explaining Why, Not How
A common misconception is that clean code requires extensive comments. In reality, comments are often code smells indicating that the code itself is unclear. Code should be self-documenting. Comments must be reserved for:
- Documenting non-obvious engineering trade-offs and decisions.
- Explaining complex business rules or mathematical algorithms that cannot be simplified.
- Providing regulatory or license attributions.
Comments explaining *how* the code works are redundant and prone to drifting out of sync as code is modified.

### 1.6 Monorepo Clean Code and Refactoring Boundaries
In large-scale monorepos, clean code requires enforcing strict boundaries between packages. Relative imports that cross package roots (e.g., \`import { helper } from "../../../another-package/src"\`) are strictly forbidden. Such imports bypass package interfaces, creating implicit coupling and breaking build encapsulation. All inter-package communication must occur through declared workspace dependencies and public API exports.

## 2. Standard Operating Procedures (SOP)
The agent must execute maintainability and clean code practices according to the following step-by-step procedures:

### Step 2.1: Apply Descriptive Naming Schemes
When creating or modifying variables, functions, or classes:
- Choose nouns for classes and objects (e.g., \`LogManager\`, \`RequestFilter\`).
- Choose verbs or verb phrases for functions and methods (e.g., \`validatePayload\`, \`fetchUserRecord\`).
- Enforce camelCase for variables and functions, PascalCase for classes and types, and UPPER_CASE for constants.

### Step 2.2: Enforce Single Responsibility Boundaries
Audit modified classes and functions to ensure they satisfy SRP:
- If a function contains more than 15 lines of code, evaluate if it is performing multiple operations and refactor it into smaller helper functions.
- Ensure class helper methods are scoped correctly, utilizing explicit accessibility modifiers (\`public\`, \`private\`, \`protected\`).
- Prefer arrow functions for all function declarations to ensure consistency across the workspace:
\`\`\`typescript
const formatUserPayload = (user: UserRecord): FormattedUser => {
  return { ... };
};
\`\`\`

### Step 2.3: Simplify Control Flow and Reduce Complexity
Refactor nested control structures to simplify code paths:
- Replace nested \`if\` statements with guard clauses that return early, avoiding the "arrowhead" code shape.
- Simplify complex boolean expressions by extracting logical evaluations into descriptively named variables.
- Wrap all void-returning function test cases in \`expect(() => ...).not.toThrow()\` to ensure robust error safety assertions.

### Step 2.4: Clean Up Dead Code and Temporary Artifacts
Actively prune unused assets:
- Delete commented-out code, unused variables, and deprecated methods immediately rather than archiving them in place.
- Verify that no temporary scratch files or unused imports remain in modified files.
- Run static checks before committing changes:
\`\`\`bash
rtk pnpm --filter @ethang/agents-build lint
\`\`\`

### Step 2.5: Document the "Why" in Comments
When writing comments, explain the underlying intent:
- Do not write comments like \`// increment counter\` before \`counter++\`.
- Write comments like \`// Using a retry limit of 3 to prevent API rate exhaustion under high network load\`.
- Ensure all comment formatting matches project standards, and preserve existing unrelated comments.

### Step 2.6: Verify and Run Automated Checks
Verify that refactored code meets all maintainability standards:
- Run unit tests to confirm that refactoring has not broken existing behaviors:
\`\`\`bash
rtk pnpm --filter @ethang/agents-build test
\`\`\`
- Check the compiler output to confirm that no warnings or character violations are introduced.

### Step 2.7: Monitor Package Boundaries and Imports
Inspect import lists in modified files. Ensure that no relative paths cross package boundaries. Verify that all shared modules are consumed via local workspace package configurations.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following maintainability and clean code rules:

- [ ] **Descriptive Naming Enforced**: Are all variable, function, and class names self-documenting and descriptive?
- [ ] **Single Responsibility Verified**: Do all modified functions and classes perform a single logical task?
- [ ] **Arrow Functions Preferred**: Are all new functions declared as arrow functions instead of function declarations?
- [ ] **Explicit Member Modifiers**: Are all class members and methods explicitly marked as \`public\`, \`private\`, or \`protected\`?
- [ ] **Guard Clauses Used**: Were nested conditionals replaced with early return guard clauses?
- [ ] **Dead Code Deleted**: Were all commented-out code blocks and unused imports purged from modified files?
- [ ] **Comments Explain Why**: Do comments explain non-obvious engineering decisions rather than repeating what the code does?
- [ ] **No Native Dates**: Are date and time operations handled strictly via Luxon (\`DateTime\`)?
- [ ] **Index Signature Safety**: Do typescript index-signature accesses use bracket notation (\`obj["prop"]\`)?
- [ ] **Void Assertions Wrapped**: Are unit test cases for void methods wrapped in \`expect(() => ...).not.toThrow()\`?
- [ ] **Complexity Bounds Respected**: Has the cognitive complexity of modified functions been evaluated and minimized?
- [ ] **No Destructive Reverts**: Were code reverts restricted to targeted \`git restore\` on modified files, preserving user changes?
- [ ] **Forbidden Words Scanned**: Has the rule been checked to ensure no forbidden workspace vocabulary or platforms are referenced?
- [ ] **Size Bounds Confirmed**: Is the final compiled markdown file size strictly between 10,000 and 11,800 characters?
- [ ] **Escaped Backticks**: Are all code blocks and backticks inside the rule template properly escaped?
- [ ] **Verification Command Run**: Did the agent execute compile, test, and lint validations using the \`rtk\` command prefix?
- [ ] **Walkthrough Updated**: Is the refactoring strategy, name choices, and validation results documented in \`walkthrough.md\`?
- [ ] **No Explicit Return Types**: Do TS functions rely on type inference rather than declaring explicit return types unless strictly necessary?
- [ ] **Tuple Typing Explicit**: Are tuples in Vitest \`it.each\` tables explicitly typed to prevent resolution mismatches?
- [ ] **Monorepo Imports Checked**: Have relative imports crossing package roots been eliminated?`,
  description:
    "maintainability, clean code, descriptive naming, and single responsibility",
  filename: "maintainability-clean-code",
  trigger: "model_decision"
});
