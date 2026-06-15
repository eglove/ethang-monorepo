import { defineRule } from "../../define.ts";

export const configurationChangeProcess = defineRule({
  content: `# Configuration Change Process

## 1. Domain Theory and Conceptual Foundations
Configuration Change Control is the SCM process concerned with managing changes to configuration items throughout their lifecycle. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 8 (Software Configuration Management), change control ensures that all modifications to the baseline are formally requested, analyzed for impact, approved, implemented, and verified. 

In professional software engineering, uncontrolled changes lead to a phenomenon known as "configuration drift," where different environments (development, staging, production) diverge in undocumented ways. Change control establishes the organizational structure and procedural constraints necessary to prevent drift.

### 1.1 The Change Control Board (CCB)
According to SWEBOK v4, the Change Control Board (CCB) is the authority responsible for reviewing, approving, or rejecting proposed modifications to configuration items. The CCB is composed of representatives from engineering, quality assurance, product management, and operations. In smaller projects or agentic development flows, the user acts as the sole member of the CCB, approving change plans before implementation. The CCB ensures that:
- The technical benefits of the proposed change justify the associated risks.
- The change is scheduled to minimize impact on development velocity.
- Adequate roll-back plans are documented in case of migration failures.

### 1.2 The Change Control Lifecycle
A formal change process prevents unauthorized modifications (scope creep) and ensures that all stakeholders are aware of changes to the system:
1. **Change Request (CR)**: Identification of a defect, requirement update, or enhancement.
2. **Impact Analysis**: Technical evaluation of the proposed change to determine its effect on other components, dependencies, build speed, security, and performance.
3. **Change Approval**: Formal review and authorization by the project lead or customer.
4. **Implementation & Verification**: The developer makes the change in their workspace and verifies it against the quality gates (build, test, lint).
5. **Change Audit**: Verification that only the approved change was implemented and that the baseline remains consistent.

### 1.3 Git Hygiene and Targeted Recovery
In modern distributed version control systems (like Git), maintaining a clean, linear commit history is critical for auditability and rollback capabilities:
- **Conventional Commits**: Structuring commit messages (e.g., \`feat:\`, \`fix:\`, \`refactor:\`) to enable automated changelog generation and version calculation (SemVer).
- **Targeted Restores**: When reverting changes, developers must restore only the specific files modified by the task (using \`git restore <file>\`). Running global resets (like \`git reset --hard\` or \`git checkout -- .\`) destroys unrelated workspace changes made by the developer, violating SCM safety rules.
- **Commit Atomicity**: Each commit should represent a single logical change, ensuring that if a rollback is required, it can be executed cleanly without affecting unrelated features.
- **Pre-Commit and Pre-Push Quality Hooks**: Automated scripts executed before commit and push events to ensure that formatting, static analysis, and unit test suites are fully passing. This prevents invalid, non-compiling configuration states from reaching the staging or integration repositories.

## 2. Standard Operating Procedures (SOP)
The agent must control baseline modifications using a formal change request and verification process.

### Step 2.1: Performing Impact Analysis
Before modifying any configuration file (e.g., adding a package to \`package.json\` or changing a compiler flag in \`tsconfig.json\`):
1. **Identify Dependents**: Determine which other packages in the monorepo workspace import the modified package or rely on the configuration.
2. **Check Build Impacts**: Verify that the change does not introduce circular dependencies or break compiler settings in other workspaces.
3. **Document Decisions**: Record the rationales, alternative choices, and trade-offs of the configuration change.

### Step 2.2: Applying Changes and Running Verification
1. **Implement minimal changes**: Apply only the approved edits.
2. **Verify locally**: Run the affected package's test suite and typecheck commands:
   \`\`\`bash
   rtk pnpm --filter <package-name> lint
   rtk pnpm --filter <package-name> test
   \`\`\`

### Step 2.3: Reverting Unwanted Workspace Changes
If a change fails verification or must be reverted, recover only the specific target files:
1. **Check status**: List modified files:
   \`\`\`bash
   rtk git status --porcelain
   \`\`\`
2. **Targeted Restore**: Revert only the specific files modified by the task:
   \`\`\`bash
   rtk git restore packages/agents-build/src/content/rules/target-file.ts
   \`\`\`
3. **Never Reset Globally**: Refrain from running \`git reset --hard\` or \`git restore .\` to preserve the user's unsaved changes in the workspace.

### Step 2.4: Implementing a SCM Change Control Manager
Below is a TypeScript class implementing a SCM Change Request log and audit process to programmatically track and verify modifications.

\`\`\`typescript
import { vi } from "vitest";

interface ChangeRequest {
  id: string;
  targetFile: string;
  status: "pending" | "approved" | "implemented" | "rejected";
  impactSeverity: "low" | "medium" | "high";
}

class ChangeControlManager {
  private requestsLog: Record<string, ChangeRequest>;

  public constructor() {
    this.requestsLog = {};
  }

  public submitRequest = (request: ChangeRequest) => {
    this.requestsLog[request["id"]] = request;
  };

  public approveRequest = (id: string) => {
    const request = this.requestsLog[id];
    if (undefined !== request) {
      request["status"] = "approved";
    }
  };

  public verifyRequest = (id: string, fileExists: boolean): boolean => {
    const request = this.requestsLog[id];
    if (undefined === request) {
      return false;
    }
    
    if ("approved" === request["status"] && fileExists) {
      request["status"] = "implemented";
      return true;
    }
    return false;
  };
}

describe("ChangeControlManager SCM test cases", () => {
  it("should record, approve, and verify configuration change requests", () => {
    const manager = new ChangeControlManager();
    const cr: ChangeRequest = {
      id: "CR-101",
      targetFile: "tsconfig.json",
      status: "pending",
      impactSeverity: "medium"
    };

    manager.submitRequest(cr);
    manager.approveRequest("CR-101");
    
    const verified = manager.verifyRequest("CR-101", true);
    expect(verified).toBe(true);
  });

  it("should fail verification if request was not approved", () => {
    const manager = new ChangeControlManager();
    const cr: ChangeRequest = {
      id: "CR-102",
      targetFile: "package.json",
      status: "pending",
      impactSeverity: "high"
    };

    manager.submitRequest(cr);
    const verified = manager.verifyRequest("CR-102", true);
    expect(verified).toBe(false);
  });
});
\`\`\`

## 3. Agent Compliance Checklist
The agent must verify compliance with SCM change control procedures before completing a configuration change:

- [ ] **Change Request trace**: Is the change traceable to a specific user request or task?
- [ ] **Impact Analysis Run**: Did the agent identify and evaluate all dependent modules and packages?
- [ ] **Minimal Changes Made**: Were changes restricted strictly to the files required for the task?
- [ ] **Git Status Checked**: Was \`git status\` run to list the exact set of modified files?
- [ ] **Targeted Restores Used**: Did the agent use targeted \`git restore\` on specific files to undo changes?
- [ ] **No Global Resets**: Did the agent refrain from running global checkouts or resets?
- [ ] **Typecheck Verification**: Did the TypeScript compiler compile successfully post-change?
- [ ] **Linter Quality Verification**: Was the linter run to verify compliance with code quality rules?
- [ ] **Conventional Commit Format**: If drafting a commit, does the commit message follow the Conventional Commits spec?
- [ ] **SemVer Impact Checked**: Was the change evaluated for semantic versioning impact (major, minor, patch)?
- [ ] **Build Manifest Updated**: Was the rule manifest rebuilt successfully via the build script?
- [ ] **Arrow Functions Enforced**: Are all callbacks and helpers in the git hooks written as arrow functions?
- [ ] **No Explicit Return Types**: Do all TypeScript configuration scripts rely on type inference?
- [ ] **Explicit Member Modifiers**: Are mock objects in change control tests decorated with public/private?
- [ ] **Bracket notation**: Are dynamic property checks in SCM scripts written using bracket notation?
- [ ] **Void assertion wrapping**: Are void git commands tested using \`expect(() => ...).not.toThrow()\`?
- [ ] **No Forbidden Terminology**: Has the configuration code been scanned to verify zero forbidden words?
- [ ] **No Git Commit executed**: Did the agent ensure that no git commits or pushes were made?
- [ ] **SWEBOK Process Alignment**: Does the change control flow align with SWEBOK v4 Chapter 8 standards?
- [ ] **User Checkpoint Suspended**: Did the agent pause and obtain user approval prior to modifying configurations?
- [ ] **Audit Trail Logged**: Was the change request ID referenced in the implementation notes?
- [ ] **Branching Strategy Integrity**: Did the agent verify that the changes are isolated to a developer-level branch?
- [ ] **Merge Conflict Assessment**: Has the agent verified that the changes do not conflict with the remote baseline?
- [ ] **Targeted restore verification**: Did the agent verify that only SCM-approved files were updated?
- [ ] **Pre-commit quality gates validation**: Have pre-commit and pre-push hooks been verified to block compilation failures or unformatted configuration files?`,
  description:
    "configuration change control, SCM change requests, and git hygiene",
  filename: "configuration-change-process",
  trigger: "model_decision"
});
