import { defineRule } from "../../define.ts";

export const interfaceControl = defineRule({
  content: `# Interface Control

## 1. Domain Theory and Conceptual Foundations
Interface control is a critical configuration management and software integration process concerned with defining, documenting, and controlling the boundary interfaces between different software components, subsystems, or external systems. As detailed in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 11 (Software Configuration Management) and Chapter 6 (Software Construction), interfaces are the boundaries where different software units interact. Proper control of these boundaries is a prerequisite for parallel development, system integration, and software evolvability.

### 1.1 Interface Control Documents (ICDs) and Contracts
An Interface Control Document (ICD) or interface contract defines the technical specifications of a boundary interface:
- **Data Schemas**: The exact format, types, and constraints of data payloads (e.g., JSON Schema, OpenAPI/Swagger specifications, Protocol Buffers, or TypeScript type definitions).
- **Communication Protocols**: The serialization formats and transfer mechanisms (e.g., RESTful HTTP, GraphQL, WebSockets, or gRPC).
- **Behavioral Semantics**: The expected state transitions, side effects, error codes, and rate limits associated with interface invocations.

In a SWEBOK-aligned engineering lifecycle, interfaces are designed using a **Contract-First** approach: the ICD is drafted, reviewed, and finalized before any code implementation begins. This decoupling allows frontend and backend teams, or service-to-service engineers, to develop and test in parallel using mocked implementations of the contract.

### 1.2 Mathematical Versioning Model: Semantic Versioning (SemVer)
Interface control relies on Semantic Versioning (SemVer) to programmatically communicate compatibility guarantees. A version is represented as a tuple of three non-negative integers:
$$Version = X.Y.Z$$

Where:
- $X$ is the **Major** version, incremented when making incompatible (breaking) API changes.
- $Y$ is the **Minor** version, incremented when adding functionality in a backward-compatible manner.
- $Z$ is the **Patch** version, incremented when making backward-compatible bug fixes.

Compatibility transitions are mathematically modeled as:
- Let $API(X, Y, Z)$ be the set of public symbols, endpoints, and behaviors exposed by version $X.Y.Z$.
- A client targeting $API(X, Y_0, Z_0)$ is guaranteed to compile and execute without modifications against any $API(X, Y_1, Z_1)$ where $Y_1 \\ge Y_0$ and $Z_1 \\ge Z_0$:
$$API(X, Y_0, Z_0) \\subseteq API(X, Y_1, Z_1)$$

- An increment in the Major version ($X_1 > X_0$) invalidates this subset guarantee, indicating that breaking changes have been introduced:
$$API(X_0, Y_0, Z_0) \\not\\subseteq API(X_1, Y_1, Z_1)$$

### 1.3 Monorepo Package Isolation and Boundary Gates
In a monorepo, packages are physically co-located, making it tempting to import internal source files from adjacent packages. This is a severe violation of interface control. SWEBOK-compliant monorepos enforce strict encapsulation:
- **Public Entry Points**: A package must expose its API solely through a single entry point (e.g., \`index.ts\`) or explicit \`exports\` configurations in its \`package.json\`.
- **Private Internals**: Any file not exported by the public entry point is considered private. External packages must never import these files directly, preventing coupling to unstable, internal refactoring details.
- **Dependency Graphs**: Static analysis tools must enforce that the dependency graph remains acyclic and that packages only import declared workspace dependencies.

### 1.4 Database Schema Evolution: Expand and Contract Pattern
Shared database schemas are interfaces between code execution instances. Modifying a schema requires the **Expand and Contract** pattern to allow zero-downtime deployments:
1. **Expand Phase**: Add the new database columns or tables without removing or modifying old ones. The code is updated to write to both old and new schemas, but read from the old.
2. **Migration Phase**: Backfill data from old columns to new columns.
3. **Transition Phase**: Update the code to read from the new columns.
4. **Contract Phase**: Safely remove the old database columns and tables once all instances of the old code have been retired.

### 1.5 The Cost of Integration Failures
SWEBOK v4 emphasizes that fixing a defect at the integration phase is significantly more expensive than resolving it during unit construction. When a boundary interface drifts and breaks compatibility, the cost of repair grows exponentially:
$$Cost_{\\text{integration}} = \\gamma \\cdot Cost_{\\text{unit}}$$

Where $\\gamma$ is the amplification coefficient representing the number of dependent downstream services affected by the contract breach (typically $\\gamma \\ge 10$). Interface control acts as a preventive gate to keep $\\gamma$ at 0.

## 2. Standard Operating Procedures (SOP)
The agent must execute interface control and boundary management according to the following step-by-step procedures:

### Step 2.1: Define and Document Interface Contracts
Before implementing or modifying a shared interface:
- Create or update the contract specification file (e.g., an OpenAPI yaml, JSON schema, or TypeScript interfaces in a shared types package).
- Secure consensus on the contract through a structured peer review before implementing any production logic.

### Step 2.2: Enforce Package Boundary Encapsulation
Lock down package internals:
- Define all public exports in the package's primary entry file (\`index.ts\`).
- Ensure the \`package.json\` exports block is configured correctly.
- Review all import statements in modified files to confirm that no relative paths cross package roots.

### Step 2.3: Implement Semantic Versioning Transitions
When releasing changes to a shared library or package:
- Analyze the diff to identify if the changes are breaking (Major), additive (Minor), or corrective (Patch).
- Increment the version in \`package.json\` according to SemVer rules.
- Maintain a changelog detailing the modifications, deprecation notices, and migration instructions for breaking changes.

### Step 2.4: Execute Database Schema Changes Safely
Follow the expand-and-contract pattern for schema modifications:
- Draft Drizzle migrations to add new entities rather than renaming existing ones.
- Run database tests locally to confirm that the schema is backward-compatible with current application code.
- Execute validation commands using the token-saving workspace prefix:
\`\`\`bash
rtk pnpm --filter @ethang/agents-build test
\`\`\`

### Step 2.5: Verify Client Conformance and Integration
Verify that dependent packages compile and execute against the updated interface:
- Run integration tests that exercise the shared boundaries.
- Run typecheck and lint checks to ensure no compile-time contract breakages exist:
\`\`\`bash
rtk pnpm --filter @ethang/agents-build lint
\`\`\`

### Step 2.6: Configure API Contract Mock Verification
Set up and run contract validation tests to verify that mock responses generated by consumer packages accurately match the live interface schemas. These API contract tests should run in CI/CD pipeline runs for every pull request, acting as a mandatory gate before merging code.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following interface control and boundary rules:

- [ ] **Contract Defined First**: Was the interface contract documented and approved before implementation?
- [ ] **SemVer Rules Applied**: Were package version increments selected in strict accordance with SemVer rules?
- [ ] **Public Entry Point Exported**: Are all public symbols exposed solely through the package's \`index.ts\` entry point?
- [ ] **No Cross-Package Relative Imports**: Are all imports from external packages resolved through workspace configurations?
- [ ] **Database Schema Expanded first**: Did database modifications follow the expand-and-contract pattern to avoid breaking active code?
- [ ] **Mock Configurations Verified**: Were mocked implementations updated to reflect the new interface contracts?
- [ ] **Deprecated Items Tagged**: Are obsolete interface symbols tagged with \`@deprecated\` JSDoc comments?
- [ ] **No Native Dates**: Are dates across interface payloads serialized using standardized ISO formats and parsed with Luxon?
- [ ] **Index Signature Safety**: Do deserialization and payload traversal scripts use bracket notation (\`obj["prop"]\`)?
- [ ] **Void Assertions Wrapped**: Are unit tests for integration boundary handlers wrapped in \`expect(() => ...).not.toThrow()\`?
- [ ] **Tuple Typing Explicit**: Are tuples in Vitest \`it.each\` tables explicitly typed to prevent resolution mismatches?
- [ ] **No Destructive Reverts**: Were code reverts restricted to targeted \`git restore\` on modified files, preserving user changes?
- [ ] **Forbidden Words Scanned**: Has the rule been checked to ensure no forbidden workspace vocabulary or platforms are referenced?
- [ ] **Size Bounds Confirmed**: Is the final compiled markdown file size strictly between 10,000 and 11,800 characters?
- [ ] **Escaped Backticks**: Are all code blocks and backticks inside the rule template properly escaped?
- [ ] **Verification Command Run**: Did the agent execute compile, test, and lint validations using the \`rtk\` command prefix?
- [ ] **Walkthrough Updated**: Is the interface modifications, version updates, and integration test logs documented in \`walkthrough.md\`?
- [ ] **Acyclic Dependency Checked**: Was the package dependency tree checked to ensure no circular references were introduced?
- [ ] **No Explicit Return Types**: Do TS functions rely on type inference rather than declaring explicit return types unless strictly necessary?
- [ ] **Error Payloads Standardized**: Do all error payloads returned by public API endpoints conform to a standardized error schema?`,
  description: "interface control, API stability, and inter-module isolation",
  filename: "interface-control",
  trigger: "model_decision"
});
