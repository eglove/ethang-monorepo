import { defineRule } from "../../define.ts";

export const requirementsTraceability = defineRule({
  content: `# Requirements Traceability

## 1. Domain Theory and Conceptual Foundations
Requirements traceability is the software engineering discipline of establishing and maintaining a verifiable link between the requirements of a system and all downstream engineering artifacts (architectural designs, source code modules, database schemas, and verification test cases) throughout the software development lifecycle. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 1, traceability is a critical component of Requirements Management. It ensures that the software product conforms exactly to the stakeholder's intent, and it provides the empirical basis for software verification and validation.

### 1.1 Bidirectional Traceability
Traceability must be bidirectional, meaning it operates in two distinct directions:
- **Forward Traceability**: Tracing from the source requirements forward through design components, source code files, and finally to test cases. This ensures that every approved requirement is fully implemented and tested. If a requirement has no mapped code file, it represents a *functional omission*.
- **Backward Traceability**: Tracing from code files, database columns, and test cases backward to the specific requirements that justify their existence. This ensures that no extraneous code has been introduced into the codebase. If code exists that does not trace back to any requirement, it represents *gold-plating* or *dead code*, which increases complexity and maintenance costs without providing business value.

### 1.2 The Traceability Matrix
The primary instrument for documenting and auditing traceability is the **Traceability Matrix (TM)** (sometimes called the Requirements Traceability Matrix, or RTM). The matrix maps requirements to technical assets in a structured format:

| Requirement ID | Source / User Story | Design Component | Implementation File | Verification Test |
| :--- | :--- | :--- | :--- | :--- |
| REQ-001 | Story: User Authentication | auth-service.ts | auth-handler.ts | auth.test.ts |

By utilizing the Traceability Matrix, engineers can achieve several quality assurance benefits:
- **Comprehensive Verification**: Validating that 100% of the requirements are covered by automated tests.
- **Rapid Impact Analysis**: When a requirements change is requested, the matrix immediately identifies which code modules and test files must be modified, reducing analysis effort and preventing regression bugs.
- **Defect Mapping**: When a test fails, engineers can quickly trace the failure back to the specific requirement it was designed to verify.

### 1.3 Configuration Audits (FCA and PCA)
Requirements traceability provides the foundation for formal Software Configuration Management (SCM) audits, specifically:
- **Functional Configuration Audit (FCA)**: Verifies that the actual performance of the software matches its requirements. The audit uses the traceability matrix to trace every requirement to its test report, proving that the software has passed all functional criteria.
- **Physical Configuration Audit (PCA)**: Verifies that the software build matches the design documentation and that all configuration items (source files, assets, environment files) are present. The traceability matrix helps verify that no undocumented configuration items are present in the release package.

### 1.4 Impact Analysis Algorithms
When a change request is submitted, traceability enables mathematical tracing of its impact propagation to predict downstream failure rates and guide refactoring effort:
- **Forward Impact Analysis (FIA)**: Identifies the set of downstream files ($D$) affected by a change to requirement ($R$). This includes transitive dependencies where design components reference other design components, propagating the impact throughout the network:
  $$D = \\{ f \\in Files \\mid \\exists r \\in Requirements, \\text{traces}(r, f) \\land \\text{depends}(r, R) \\}$$
- **Backward Impact Analysis (BIA)**: Traces code level issues, compiler failures, or failed test cases ($T$) back to the parent requirement ($R$) to evaluate which business rule is compromised:
  $$R = \\{ r \\in Requirements \\mid \\exists t \\in Tests, \\text{verifies}(t, r) \\land \\text{fails}(t) \\}$$
  This mathematical mapping allows teams to quickly assess the severity of test failures on the overall release readiness.

### 1.5 DDD Context Bound Integrity
In Domain-Driven Design (DDD), traceability extends to mapping Ubiquitous Language terms and Bounded Context boundaries. Every entity, value object, and service in the domain model must trace back to domain rules. Similarly, API endpoints and events used to integrate contexts must be traceable to cross-context requirements, preserving the integrity of the Bounded Context.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures to establish and maintain traceability in this workspace:

### Step 2.1: Assign Unique IDs to Requirements
During the requirements elicitation phase, the agent must assign a unique alphanumeric identifier to every requirement, use case, and storyboard scenario. The ID format must be \`REQ-XX\` (e.g., \`REQ-01\`, \`REQ-02\`). These IDs must be documented in the "Requirements Baseline" section of the \`implementation_plan.md\`.

### Step 2.2: Initialize the Traceability Matrix
The agent must construct a "Traceability Matrix" table in the \`implementation_plan.md\`. This table must contain columns for:
- **Requirement ID**: The unique ID of the requirement.
- **Description**: The summary of the requirement.
- **Design / Component**: Clickable file link to the architectural design or component definition.
- **Implementation**: Clickable file link to the source code file implementing the feature.
- **Test Case**: Clickable file link to the unit or integration test verifying the requirement.

### Step 2.3: Maintain Matrix during Code Modification
As code files are created or edited in the workspace, the agent must update the corresponding rows in the Traceability Matrix.
- All file links must use absolute paths in the format \`[filename](file:///absolute/path/to/file)\`.
- For specific lines within files (e.g., a specific React component or API handler function), use line links, for example: \`[handler](file:///absolute/path/to/file#L123)\`.

### Step 2.4: Perform Bidirectional Traceability Audit
Before completing any task, the agent must execute a manual audit of the Traceability Matrix to verify:
- **Forward Audit**: Every requirement ID in the table maps to at least one active source code file and one passing test file.
- **Backward Audit**: Every new file created or modified in the workspace is associated with at least one requirement ID. Any file that cannot be traced back must be pruned or refactored.

### Step 2.5: Document Verification results in Walkthrough
The agent must reference the Traceability Matrix in the \`walkthrough.md\` artifact, summarizing the mapping of requirements to code and test outcomes. The agent must verify that the test commands executed (e.g., \`rtk pnpm test\`) cover all the test files listed in the matrix.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria during traceability activities:

- [ ] **Unique ID Assignment**: Has every requirement in the baseline been assigned a unique, consistent ID (e.g. REQ-01)?
- [ ] **Matrix Initialization**: Is the Traceability Matrix table initialized in the implementation plan?
- [ ] **Forward Traceability Audit**: Does every requirement ID map to a corresponding source code file and test case?
- [ ] **Backward Traceability Audit**: Have all newly created or edited files been traced back to a specific requirement ID?
- [ ] **Gold-Plating Prevention**: Has the agent verified that no code has been added that lacks a corresponding requirement ID?
- [ ] **Clickable File Links**: Are all file paths in the matrix formatted as clickable links using the \`file:///\` protocol?
- [ ] **Line-Level Accuracy**: Do complex files contain links pointing to the specific line ranges where the logic is located?
- [ ] **Test Coverage Mapping**: Is every requirement verified by at least one automated unit or integration test case in the matrix?
- [ ] **Impact Analysis Reference**: Has the matrix been used to identify affected files during a change request?
- [ ] **Database Schema Tracking**: Are database tables and columns mapped back to the data storage requirements?
- [ ] **Walkthrough Sync**: Does the \`walkthrough.md\` reference the Traceability Matrix and confirm successful verification?
- [ ] **Task List Integration**: Are tasks in \`task.md\` structured around implementing and verifying specific requirement IDs?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **DDD Naming Alignment**: Are Bounded Context boundaries and entities traced to domain rules?
- [ ] **Code Comment Traceability**: If complex workarounds are implemented, do code comments reference the requirement ID?
- [ ] **API Endpoint Mapping**: Are all new API routes mapped to integration requirements in the matrix?
- [ ] **Matrix Accuracy check**: Has the agent verified that none of the file links in the matrix are broken or point to deleted files?
- [ ] **Version Control Correlation**: Are commit messages (if any are explicitly requested) formatted with reference to the requirement IDs?
- [ ] **Non-Functional Traceability**: Are non-functional requirements (such as performance bounds or security scans) mapped to tests in the matrix?
- [ ] **FCA Verifiability**: Has a Functional Configuration Audit been performed, verifying each requirement has a passing test?
- [ ] **PCA Verifiability**: Has a Physical Configuration Audit confirmed all modified files are listed in the matrix?
- [ ] **Impact Propagation Computed**: Have the downstream dependencies been analyzed for all modified components?
- [ ] **Requirement Source Record**: Are the stakeholder sources for each requirement tracked in the baseline?`,
  description:
    "requirements traceability, tracking implementation, and test mappings",
  filename: "requirements-traceability",
  trigger: "model_decision"
});
