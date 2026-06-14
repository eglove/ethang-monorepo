import { defineRule } from "../../define.ts";

export const verification = defineRule({
  content: `# Verification Commands

## 1. Domain Theory and Conceptual Foundations
Verification represents the disciplined engineering process of evaluating a software system or component to determine whether the products of a given development phase satisfy the conditions imposed at the start of that phase. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 10 (Software Quality) and Chapter 5 (Software Testing), verification is distinguished from validation. Verification answers the question, "Are we building the product right?" (conformance to specifications), whereas validation answers, "Are we building the right product?" (conformance to user needs).

### 1.1 Static vs. Dynamic Verification
Verification is categorized into static and dynamic techniques:
- **Static Verification**: Analyzes software artifacts without executing the code. This includes reviews, walkthroughs, inspections, and automated static analysis (linting, typechecking, and data-flow analysis). Static verification is highly cost-effective, detecting defects early in the lifecycle before they propagate into executable binaries.
- **Dynamic Verification**: Requires execution of the software with concrete test inputs. This includes unit testing, integration testing, system testing, and acceptance testing. Dynamic verification assesses runtime behavior, performance under load, and correctness of state transitions.

### 1.2 Mathematical Foundations of Static Analysis
Static verification tools rely on compiler theory and formal logic:
- **Abstract Syntax Trees (ASTs)**: A hierarchical tree representing the syntactic structure of source code. Linters use visitor patterns to traverse this tree and identify anti-patterns.
- **Control Flow Graphs (CFGs)**: Graphs where nodes represent basic blocks of code and edges represent control flow paths. CFGs are used to detect unreachable code, infinite loops, and cognitive complexity spikes.
- **Data-Flow Analysis**: Algorithmic tracking of variable values along CFG paths, used to find uninitialized variables, null pointer dereferences, or resource leaks.

### 1.3 Test Coverage Ratcheting and Quality Gates
Software Quality Assurance (SQA) frameworks enforce quality gates—conditions that must be met before a software artifact can proceed to the next lifecycle stage (e.g., merging a pull request). A key metric in quality gates is test coverage (statement, branch, and path coverage). Test coverage ratcheting is the practice of automatically updating coverage thresholds to match the highest achieved coverage, preventing developers from committing code that lowers the overall test density of the package.

## 2. Standard Operating Procedures (SOP)
Developers and agents must execute verification commands at the narrowest scope necessary to validate their changes, but must always perform a complete verification sweep (build, test, and lint) of the affected packages before declaring a task complete.

### Step 2.1: Executing Repository-Wide Verification
To verify the health of the entire monorepo, execute the following commands from the root directory:

| Goal | Command | Description |
|---|---|---|
| Build all workspaces | \`pnpm build\` | Compiles all packages and applications, verifying type safety and compiling configurations. |
| Run all test suites | \`pnpm test\` | Executes all unit and integration tests across all packages, outputting coverage reports. |
| Lint all source files | \`pnpm lint\` | Runs static analysis checks and formats code using ESLint across all workspaces. |
| Run full repository sweep | \`./repo-check.ps1\` | Executes a comprehensive PowerShell script covering build, test, lint, dependency deduplication, and store pruning. |

### Step 2.2: Executing Package-Specific Verification
To verify changes within a specific package (e.g., \`packages/agents-build\`), run the following commands:

| Goal | Command |
|---|---|
| Run package tests | \`pnpm --filter <package-name> test\` |
| Start Vitest watch mode | \`pnpm --filter <package-name> exec vitest\` |
| Test a single file | \`pnpm --filter <package-name> exec vitest run <path/to/file.test.ts> --no-coverage\` |
| Build single package | \`pnpm --filter <package-name> build\` |
| Lint single package | \`pnpm --filter <package-name> lint\` |

### Step 2.3: Cloudflare Workers Development Lifecycle
When modifying Cloudflare Workers applications or their configurations:
1. **Regenerate Types**: Whenever you modify \`wrangler.jsonc\` or environment bindings, regenerate the binding types immediately:
   \`\`\`bash
   rtk pnpm -r cf-typegen
   \`\`\`
2. **Local Execution**: Run the local wrangler development server to verify runtime correctness:
   \`\`\`bash
   rtk pnpm --filter <app-name> dev
   \`\`\`

### Step 2.4: Managing Auto-Ratcheting Coverage Gates
This monorepo configures Vitest to auto-ratchet coverage thresholds. If coverage increases, the configuration file is updated automatically. Do not manually edit or lower these thresholds in \`vitest.config.ts\`. If a change causes coverage to drop, you must write additional tests to cover the new branches rather than adjusting the gates.

### Step 2.5: Implementation of a Verification Runner
Below is a TypeScript class illustrating how to build a dynamic test suite execution runner that programmatically checks a mock package's files, lint status, and test coverage before allowing build deployment.

\`\`\`typescript
import { vi } from "vitest";

interface PackageMetadata {
  name: string;
  hasLintErrors: boolean;
  testCoverage: number;
  buildsSuccessfully: boolean;
}

class VerificationRunner {
  private targetPackage: PackageMetadata;
  private minCoverageGate: number;

  public constructor(targetPackage: PackageMetadata, minCoverageGate: number) {
    this.targetPackage = targetPackage;
    this.minCoverageGate = minCoverageGate;
  }

  public runVerificationSuite = (): boolean => {
    if (this.targetPackage["hasLintErrors"]) {
      return false;
    }
    if (this.targetPackage["testCoverage"] < this.minCoverageGate) {
      return false;
    }
    return this.targetPackage["buildsSuccessfully"];
  };
}

describe("VerificationRunner quality gate tests", () => {
  it("should pass verification when package meets all gates", () => {
    const pkg: PackageMetadata = {
      name: "agents-build",
      hasLintErrors: false,
      testCoverage: 95,
      buildsSuccessfully: true
    };
    const runner = new VerificationRunner(pkg, 90);
    const result = runner.runVerificationSuite();
    expect(result).toBe(true);
  });

  it("should fail verification when lint errors are present", () => {
    const pkg: PackageMetadata = {
      name: "agents-build",
      hasLintErrors: true,
      testCoverage: 95,
      buildsSuccessfully: true
    };
    const runner = new VerificationRunner(pkg, 90);
    const result = runner.runVerificationSuite();
    expect(result).toBe(false);
  });

  it("should fail verification when test coverage falls below the gate", () => {
    const pkg: PackageMetadata = {
      name: "agents-build",
      hasLintErrors: false,
      testCoverage: 85,
      buildsSuccessfully: true
    };
    const runner = new VerificationRunner(pkg, 90);
    const result = runner.runVerificationSuite();
    expect(result).toBe(false);
  });
});
\`\`\`

## 3. Agent Compliance Checklist
The agent must verify that all verification gates are satisfied before completing any code changes:

- [ ] **Verification vs. Validation**: Has the agent verified that the code conforms to the specifications (verification) and validated it meets user requirements (validation)?
- [ ] **Static Analysis Sweep**: Was the package-level linter (\`pnpm lint\`) run and did it complete with zero errors?
- [ ] **Typecheck Execution**: Did the TypeScript compiler (\`tsc --noEmit\`) execute with zero compilation errors?
- [ ] **Local Build Conformance**: Did the package compile successfully (\`pnpm build\`) without warning messages?
- [ ] **Targeted Test Execution**: Were unit tests run specifically for all modified files using Vitest?
- [ ] **Package-Level Test Success**: Did the package-wide test suite pass with 100% success rate?
- [ ] **Coverage Ratchet Checked**: Did the test execution preserve or raise the established coverage thresholds?
- [ ] **No Manual Gate Lowering**: Did the agent verify that no coverage thresholds in \`vitest.config.ts\` were manually modified?
- [ ] **Workers Typegen Updated**: If working on Cloudflare Workers, was \`cf-typegen\` run after configuration edits?
- [ ] **Local Runtime Verified**: Was the dev server (\`wrangler dev\`) used to verify runtime execution of the application?
- [ ] **Narrowest Command First**: Did the agent run specific test files first to minimize test execution latency?
- [ ] **Full Package Verification**: Was a full build, test, and lint sweep run on the package before finishing the task?
- [ ] **No Git Diff on Lint**: Did the agent verify that running the linter did not produce uncommitted formatting changes?
- [ ] **AST Structure Validation**: Did the agent verify that all new syntax constructs conform to the project's clean coding rules?
- [ ] **Verification Log Observability**: Were the full, untruncated logs of the test runs streamed to the console?
- [ ] **Forbidden Words Scanned**: Has the source code been scanned to ensure zero forbidden words (e.g. deprecated system names) are present?
- [ ] **Arrow Functions Enforced**: Are all callback functions in test files and scripts formatted as arrow functions?
- [ ] **Accessibility Modifiers Verified**: Do all mock classes in test files have explicit accessibility modifiers?
- [ ] **Bracket Notation Applied**: Are dynamic index-signature properties accessed via bracket notation?
- [ ] **No Git Push executed**: Did the agent ensure that no git commits or pushes were executed?
- [ ] **Targeted File Restores**: Were only agent-modified files restored in the event of a test failure?
- [ ] **SWEBOK Reference Validated**: Does the verification process align with SWEBOK v4 Chapter 10 guidelines?
- [ ] **Auto-ratcheted thresholds confirmed**: Did the agent verify that the coverage gate was updated successfully in configuration files?
- [ ] **No global git resets executed**: Did the agent ensure that no destructive global git checkouts or resets were executed?
- [ ] **Static verification tool constraints**: Have compiler flags been verified to maintain strict null checking?`,
  description: "running tests, builds, or lint in this monorepo",
  filename: "verification",
  trigger: "model_decision"
});
