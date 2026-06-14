import { defineRule } from "../../define.ts";

export const linterQualityGates = defineRule({
  content: `# Linter and Quality Gates

## 1. Domain Theory and Conceptual Foundations
Static analysis represents a primary quality assurance technique, applying mathematical and algorithmic checks to source code without executing it. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 10 (Software Quality) and Chapter 12 (Software Engineering Quality), quality gates are strict checkpoints that software artifacts must satisfy before passing to subsequent lifecycle stages.

### 1.1 AST Parsing and Tree Walking
A linter is a tool that parses source code into an Abstract Syntax Tree (AST) and runs checks to identify syntax errors, potential bugs, style violations, and code smells. Linters enforce architectural constraints and style guidelines automatically:
- **Lexical and Syntactic Analysis**: The linter first tokenizes the source characters (lexical phase) and then builds the tree hierarchy matching the language grammar (syntactic phase).
- **AST Traversals**: Static analysis engines traverse AST nodes to flag violations (e.g., enforcing arrow functions over standard function declarations). Rules act as visitor patterns, matching specific AST node types (e.g., \`FunctionDeclaration\` or \`MethodDefinition\`) and asserting constraints on their properties.

### 1.2 Quality Gates and the Cost of Quality (CoSQ)
The Cost of Software Quality (CoSQ) is a model that categorizes quality-related costs into:
1. **Conformance Costs**: Investments in preventing defects:
   - **Prevention Costs**: Actions taken to prevent defects from occurring in the first place (writing lint rules, developer training, tooling setups).
   - **Appraisal Costs**: Costs of evaluating software products (running tests, static analysis, code reviews).
2. **Non-Conformance Costs**: Expenses resulting from defects:
   - **Internal Failure Costs**: Defects detected before release (debugging time, rerun of builds, compilation fixes).
   - **External Failure Costs**: Defects escaping to production (hotfixes, customer support overhead, downtime, data recovery, reputational damage).

Quality gates enforce conformance checks early in the development loop, when defects are cheapest to resolve. Failing a quality gate blocks integration, preventing bad code smells or regressions from polluting the release baseline. This is known as "shift-left" quality engineering, moving verification to the earliest possible phase.

### 1.3 TypeScript Strict Type Safety Rules
Static analysis in TypeScript environments is significantly enhanced by strict compiler checks. Quality gates must enforce rules that prevent runtime crashes:
- **Floating Promises**: Enforcing that all async operations are either awaited or handled with catch blocks (using \`no-floating-promises\`).
- **Explicit Any**: Restricting the use of the unsafe \`any\` type to preserve compilation-phase verification (using \`no-explicit-any\`).
- **Null and Undefined Checks**: Enforcing strict null checks to eliminate "undefined is not a function" errors.

### 1.4 Cognitive vs. Cyclomatic Complexity
SonarQube and other advanced static analyzers compute metrics across the codebase:
- **Cyclomatic Complexity**: Measures the number of linearly independent paths through a program's source code (based on control flow graphs).
- **Cognitive Complexity**: Measures how difficult a function's control flow is to understand for a human reader. It increments for nesting, breaks in linear reading paths, and compound boolean operations. Keeping cognitive complexity low directly improves maintainability.
- **Duplication Density**: The percentage of duplicate lines of code. High duplication increases technical debt and maintenance costs. Dedicated test constants files help centralize duplicate string literals to pass quality gates.

## 2. Standard Operating Procedures (SOP)
The agent must enforce static analysis quality gates as strict commit and integration blockers.

### Step 2.1: Executing ESLint Quality Checks
Before completing any task, run the package's linter and format checker:
\`\`\`bash
rtk pnpm --filter <package-name> lint
\`\`\`
All linting errors and warnings must be resolved before proceeding.

### Step 2.2: Applying ESLint Fixes Safely
When resolving linter violations:
1. **Single Category Fixes**: Resolve only one category of ESLint issues at a time. Run tests and verify the build passes before moving to the next category.
2. **No Auto-Revert on Failure**: If a linter fix fails or breaks code behavior, do not auto-revert the changes globally. Review the error details and resolve them manually, or prompt the user for guidance.
3. **Bypass Policy**: If ESLint rules or autofixes cause persistent loops or blocking issues during development, bypass the lint runner after two failed attempts and focus on verifying tests and functional correctness.

### Step 2.3: Reducing Cognitive Complexity
When a method exceeds cognitive complexity quality limits:
1. **Extract Methods**: Factor out nested conditional blocks into dedicated helper functions.
2. **Simplify Boolean Logic**: Apply De Morgan's laws or lookup tables to flatten nested logical conditions.
3. **Avoid Deep Nesting**: Use guard clauses (early returns) to exit functions early.

### Step 2.4: Resolving Duplication Smells
To satisfy SonarQube's \`no-duplicate-string\` rules:
1. **Identify Duplication**: Look for identical string literals repeated across tests or methods.
2. **Centralize Constants**: Extract duplicate strings into a dedicated constants file (e.g., \`test-constants.ts\`).
3. **Import Constants**: Import and reference these constants in both mock factories and test cases.

### Step 2.5: Implementation of a Custom Quality Gate Auditor
Below is a TypeScript class implementing a static quality gate validator that verifies class properties and method formats against monorepo coding guidelines.

\`\`\`typescript
import { vi } from "vitest";

interface ASTNode {
  type: string;
  name: string;
  accessibility?: "public" | "private" | "protected";
  isArrowFunction?: boolean;
}

class QualityGateAuditor {
  public auditAST = (nodes: ASTNode[]): string[] => {
    const violations: string[] = [];

    for (const node of nodes) {
      if ("MethodDefinition" === node["type"]) {
        if (undefined === node["accessibility"]) {
          violations.push(\`Accessibility modifier missing on \${node["name"]}\`);
        }
        if (true !== node["isArrowFunction"]) {
          violations.push(\`Method \${node["name"]} must be defined as an arrow function\`);
        }
      }
    }

    return violations;
  };
}

describe("QualityGateAuditor static checks", () => {
  it("should detect missing accessibility modifiers and non-arrow functions", () => {
    const auditor = new QualityGateAuditor();
    const badNodes: ASTNode[] = [
      { type: "MethodDefinition", name: "saveUser", isArrowFunction: false },
      { type: "MethodDefinition", name: "deleteUser", accessibility: "public", isArrowFunction: true }
    ];

    const violations = auditor.auditAST(badNodes);
    expect(violations).toContain("Accessibility modifier missing on saveUser");
    expect(violations).toContain("Method saveUser must be defined as an arrow function");
    expect(violations).not.toContain("Accessibility modifier missing on deleteUser");
  });
});
\`\`\`

## 3. Agent Compliance Checklist
The agent must verify compliance with linter and quality gates before concluding the task:

- [ ] **Linter Swept**: Was the package-level linter (\`pnpm lint\`) executed post-implementation?
- [ ] **Zero Linter Violations**: Did the linter run complete with zero errors or warnings?
- [ ] **Single Category Fixes**: Did the agent resolve linter issues one category at a time?
- [ ] **No Auto-Revert on Fail**: Did the agent avoid auto-reverting all files globally when a lint fix failed?
- [ ] **Bypass Rule Followed**: Was the linter bypassed only after two documented, failed attempts?
- [ ] **Duplication Checked**: Was the codebase analyzed to verify that no duplicate string literals were introduced?
- [ ] **Constants Centralized**: Were duplicate test strings extracted into a dedicated test constants file?
- [ ] **SonarQube Conformance**: Did the code changes satisfy SonarQube cognitive complexity limits?
- [ ] **AST Compliance**: Did the agent verify that no syntax violations (e.g., function declarations) remain?
- [ ] **Typecheck Verification**: Did the TypeScript compiler (\`tsc --noEmit\`) pass successfully?
- [ ] **Arrow Functions Enforced**: Are all functions, mappers, and callbacks written as arrow functions?
- [ ] **No Explicit Return Types**: Do all TypeScript function declarations omit explicit return types?
- [ ] **Explicit Member Modifiers**: Are mock class members decorated with explicit public/private modifiers?
- [ ] **Bracket notation**: Are dynamic property checks in the linter scripts written using bracket notation?
- [ ] **Void assertion wrapping**: Are void linter scripts verified using \`expect(() => ...).not.toThrow()\`?
- [ ] **No Forbidden Terminology**: Has the source code been scanned to verify zero forbidden words?
- [ ] **No Git Commit executed**: Did the agent ensure that no git commits or pushes were made?
- [ ] **SWEBOK Quality Alignment**: Does the static analysis process align with SWEBOK v4 Chapter 10/12 standards?
- [ ] **Cognitive Complexity Audited**: Did the agent review control structures to keep cognitive complexity low?
- [ ] **Format Consistency Checked**: Was prettier or eslint formatting applied successfully to modified files?
- [ ] **Pre-commit Quality Gate Verified**: Were the local configuration gates executed prior to testing?
- [ ] **No Destructive Workspace Actions**: Did the agent ensure that no git resets were executed?
- [ ] **Strict compiler flags verified**: Has the agent verified that \`noImplicitAny\` and \`strictNullChecks\` are active?
- [ ] **No floating promises allowed**: Did the agent confirm that all async operations are fully awaited?`,
  description:
    "linter quality gates, static analysis, ESLint, and cost of software quality",
  filename: "linter-quality-gates",
  trigger: "model_decision"
});
