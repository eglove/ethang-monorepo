import { defineRule } from "../../define.ts";

export const maintenanceImpactAnalysis = defineRule({
  content: `# Maintenance Impact Analysis

## 1. Domain Theory and Conceptual Foundations
Before modifying any software system, engineers must systematically evaluate the consequences of the proposed changes. As outlined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 12 (Software Maintenance), Maintenance Impact Analysis is the process of identifying all systems, modules, database schemas, APIs, and documentation that must be modified or could be affected by a change request. Skipping this analysis is a leading cause of regression defects, architectural degradation, and cost overruns in software evolution.

### 1.1 The Ripple Effect and Coupling Risks
The primary technical risk in software maintenance is the "ripple effect"—where a change to a single component propagates through the dependency graph, triggering unexpected failures in remote, seemingly unrelated modules. SWEBOK guides that the ripple effect is driven by two main factors:
- **Logical Coupling**: Direct code dependencies, such as function calls, imports, class inheritance, or shared global state.
- **Data Coupling**: Indirect dependencies through shared database schemas, message queues, file systems, or API payloads.

An impact analysis must trace both logical and data coupling chains to ensure that all side effects are anticipated.

### 1.2 Static and Dynamic Dependency Mapping
To perform impact analysis accurately, engineers utilize two primary analysis models:
- **Static Analysis**: Analyzing source code without executing it. This includes inspecting import trees, building call graphs (mapping which functions call which other functions), and running compilers to check type compatibility.
- **Dynamic Analysis**: Monitoring program execution. This involves analyzing runtime execution traces, analyzing database query plans, and reviewing test coverage logs to determine what paths are exercised under operational conditions.

### 1.3 The Requirements Traceability Matrix (RTM)
Impact analysis is not restricted to source code. SWEBOK v4 emphasizes that changes must be traced up to requirements and down to test suites using a Requirements Traceability Matrix (RTM):
- **Traceability Link**: An explicit connection linking a requirement to its architectural design, source files, and verifying test cases:
$$\\text{Requirement ID} \\longleftrightarrow \\text{Design Module} \\longleftrightarrow \\text{Source Code Files} \\longleftrightarrow \\text{Vitest Test Files}$$

If a requirement changes, the RTM immediately reveals which code modules must be refactored and which test suites must be rerun to validate the change. Consider the following example RTM:

| Requirement ID | Description | Design Module | Source Code Files | Verification Test Cases |
| :--- | :--- | :--- | :--- | :--- |
| REQ-001 | Secure User Authentication | AuthGuard | [auth.ts](file:///c:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/auth.ts) | [auth.test.ts](file:///c:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/auth.test.ts) |
| REQ-002 | Database Transaction Log | LogManager | [logger.ts](file:///c:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/logger.ts) | [logger.test.ts](file:///c:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/logger.test.ts) |

### 1.4 Architectural Decoupling Tactics to Minimize Impact Volatility
To prevent changes from propagating widely across the codebase, software architectures employ specific decoupling tactics. These tactics are designed to keep the impact propagation probability $P_{prop}$ close to zero:
- **Dependency Injection (DI)**: Passing dependencies to a class or function rather than hardcoding instantiations, allowing components to be swapped or mocked easily.
- **Interface Control Gates**: Programming to abstract interfaces rather than concrete implementations. If the implementation changes, the interface remains unchanged, protecting callers from regressions.
- **Event-Driven (Pub-Sub) Architecture**: Communicating via asynchronous events. The emitting module does not know about the receiving modules, reducing coupling to zero.

### 1.5 Impact Propagation Probability Models
To quantitatively estimate the scope of regressions, release engineers utilize impact propagation models. The probability of a change in module $A$ causing a defect in module $B$ is modeled as:
$$P_{prop}(A \\to B) = \\gamma \\times C(A, B)$$
Where:
- $C(A, B)$ is the coupling density between $A$ and $B$, measured by the ratio of shared interface symbols to total symbols in $B$.
- $\\gamma$ is a propagation factor ($0 \\le \\gamma \\le 1$) representing the historical volatility and defect rate of the interface.

If the computed propagation probability $P_{prop}$ exceeds an established risk threshold (e.g. $\\ge 0.25$), module $B$ is automatically added to the targeted regression testing boundary.

### 1.6 Taxonomy of Coupling in Impact Analysis
SWEBOK-aligned impact analysis evaluates the severity of coupling using the standard software engineering hierarchy (from tightest/worst to loosest/best):
1. **Content Coupling**: One module directly modifies or accesses the internal data of another module. This has the highest ripple probability.
2. **Common (Global) Coupling**: Multiple modules share the same global state or variables. Changes to the global structure impact all consumer modules.
3. **Control Coupling**: One module directs the execution flow of another by passing control flags or parameters.
4. **Stamp (Data-Structured) Coupling**: Modules share a composite data structure (e.g. an object or interface) but only consume a subset of its properties.
5. **Data Coupling**: Modules communicate solely by passing simple, atomic data parameters. This has the lowest ripple probability and is the ideal target for refactoring.

### 1.7 Defining the Regression Testing Scope
The output of a thorough impact analysis is a precisely bounded regression testing scope. SWEBOK notes that instead of blindly executing all tests (Retest-All) or only running modified unit tests, engineers must define a subset of tests that matches the impact footprint. This selection includes:
- All unit tests for the modified files.
- Integration tests for direct dependencies.
- End-to-end user journeys for affected business rules.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures when performing impact analysis:

### Step 2.1: Identify Target Components and Change Scope
Analyze the change request:
- Determine which files, folders, and packages in the monorepo must be modified directly.
- Identify database tables or external API payloads affected by the change.

### Step 2.2: Build the Dependency Call Graph
Map upstream and downstream relations:
- Trace import statements to see what modules import the target files.
- Inspect the classes and functions, identifying all external callers (upstream dependencies) and internal callees (downstream dependencies).
- Build a list of all affected components.

### Step 2.3: Trace Requirements and Verification Assets
Cross-reference the codebase and documentation:
- Consult the requirements or user stories in the repository.
- Identify which existing unit, integration, and E2E tests target the affected components.

### Step 2.4: Define the Specific Regression Boundary
Select the targeted test suite to execute:
- Map out which tests cover the modified code paths and their callers.
- Enforce that this selected test boundary is executed to ensure side-effect safety without incurring the cost of running slow, unrelated suites.

### Step 2.5: Document the Impact Analysis in the Implementation Plan
Before writing code, record the findings in \`implementation_plan.md\`:
- Detail the files to be modified.
- List the upstream/downstream dependencies identified.
- Specify the exact test commands to run to verify the change.

### Step 2.6: Execute the Verification Plan
Perform the change, then execute the regression boundary:
\`\`\`bash
rtk pnpm --filter <package-name> exec vitest run src/path/to/targeted-tests.test.ts
\`\`\`
- Verify that all local tests pass cleanly.

### Step 2.7: Perform Post-Change Verification Audits
Verify overall build and type stability:
\`\`\`bash
rtk pnpm test
rtk pnpm lint
\`\`\`
- Ensure compiling works without warning-level errors or type regressions across package boundaries.

### Step 2.8: Run Code Complexity and Coupling Audits
Before finalizing the impact analysis:
- Check for cognitive complexity and coupling violations. Ensure no refactored module introduces tight content coupling or increases cyclomatic complexity beyond the project gates.
- Verify that index signature accesses on record objects use bracket notation, and that typescript interfaces remain closed against unintended mutations.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria regarding maintenance impact analysis:

- [ ] **Direct Files Identified**: Has the agent listed all files that will be modified directly by the change?
- [ ] **Upstream Dependency Trace**: Were all upstream callers and importing files identified and documented?
- [ ] **Downstream Callee Trace**: Were all downstream dependencies and libraries traced?
- [ ] **Database Impact Checked**: Did the agent check if database schemas or API payloads are affected?
- [ ] **RTM Consultation**: Were requirements and related test cases traced using traceability links?
- [ ] **Regression Boundary Defined**: Is a targeted subset of regression tests specified in the plan?
- [ ] **Implementation Plan Documented**: Is the complete impact analysis documented in \`implementation_plan.md\`?
- [ ] **Local Verification Done**: Were the targeted regression tests run and verified (green)?
- [ ] **Monorepo Build Simulation**: Did the agent compile all affected packages to check for build regressions?
- [ ] **Typecheck Verification**: Was type integrity checked using the TypeScript compiler (\`pnpm build\` or \`tsc\`)?
- [ ] **No Destructive Reverts**: Were revert operations done using targeted \`git restore\` instead of global resets?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content escaped to prevent string termination?
- [ ] **Walkthrough Record Completed**: Does \`walkthrough.md\` document the regression testing commands and outcomes?
- [ ] **Task List Sync**: Are impact analysis tasks, call graph mapping, and regression validation tracked in \`task.md\`?
- [ ] **Index Signature Safety**: Do analysis scripts use bracket notation to access properties on index-signature dependency objects?
- [ ] **Sonar Assertions wrapped**: Do test cases verifying that a void method executes without issues wrap the call in \`expect(() => ...).not.toThrow()\`?
- [ ] **Explicit Member Access**: Are all methods and properties on dependency tracer classes declared with explicit accessibility modifiers?`,
  description:
    "maintenance impact analysis, dependency inspection, and regression scope",
  filename: "maintenance-impact-analysis",
  trigger: "model_decision"
});
