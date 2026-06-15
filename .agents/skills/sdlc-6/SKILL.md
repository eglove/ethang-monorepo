---
description: Automates the Phase 6 Maintenance and Troubleshooting workflow by parsing CI/SonarQube reports, running dependency impact scans, applying automated correctives, and verifying changes locally.
name: sdlc-6
---

# Standalone SDLC Phase 6 (sdlc-6) - Maintenance & Troubleshooting Automation

This skill guides an AI troubleshooter agent through an automated Finite State Machine (FSM) workflow to parse build/CI reports, analyze the impact of code modifications, apply programmatic correctives/perfectives, and perform targeted verification of affected packages.

---

## Phase 6 Reference & Alignment
This skill aligns with the following Phase 6 (Maintenance) and implementation guidelines:
- [philosophy](file:///.agents/rules/philosophy.md) - Strict lifecycle execution, complete feedback loops, and user checkpoints.
- [workspace-tools](file:///.agents/rules/workspace-tools.md) - Prioritize WebStorm MCP, ripgrep, jq, and Everything Search. Use `rtk` command prefixes.
- [maintenance-classification](file:///.agents/rules/maintenance-classification.md) - Tag corrective and perfective modifications.
- [maintenance-impact-analysis](file:///.agents/rules/maintenance-impact-analysis.md) - Workspace package dependency impact scans.
- [review-edge-cases](file:///.agents/rules/review-edge-cases.md) - Review boundary conditions and input coverage.
- [reverse-engineering](file:///.agents/rules/reverse-engineering.md) - Trace call stacks and parse log files.

---

## Step-by-Step Execution Plan

### Step 1: Pre-Execution Graph Validation
1. Before beginning any troubleshooting, run the command:
   ```bash
   rtk sara check
   ```
2. If the validation fails, halt execution immediately. Do not make any code changes.

### Step 2: Check Git Diff
1. Query the local repository status to locate modified files and packages in the current PR:
   ```bash
   rtk git diff --name-only
   ```
2. Save the list of modified paths to establish the change scope.

### Step 3: Ingest Failure Reports
1. Retrieve CI build failure logs remotely by inspecting the GitHub PR status and logs:
   - List the status check runs for the active PR:
     ```bash
     rtk gh pr checks
     ```
   - Retrieve logs for the failing workflow run:
     ```bash
     rtk gh run view <run-id> --log
     ```
2. Retrieve SonarCloud quality gate statuses and code issues remotely:
   - View issues using the `/sonarcloud-analysis` command.
3. If any of the reports are missing, empty, or cannot be retrieved, immediately throw a fatal `IngestionException` and terminate with exit code `1`. Do not attempt to fix errors on incomplete or missing remote data.

### Step 4: Categorize and Map Dependencies
1. Tag each issue according to its maintenance classification:
   - Corrective: Fixes for compiler/TSC errors or assertion failures.
   - Perfective: Code smell resolutions (e.g. duplicate strings).
2. Perform a dependency impact scan:
   - Inspect target `package.json` and `tsconfig.json` files.
   - Traverse the workspace package graph to map downstream consumers of the modified files.
   - Extend the verification scope to include all affected consumer test suites.

### Step 5: Safe Programmatic Repairs
Apply targeted, automated repair subroutines using WebStorm VFS-safe methods to keep files synchronized:

1. **duplicate-string-resolver**:
   - For string literals with >=3 duplicate occurrences of length > 10.
   - If isolated in a test file, declare a module-level constant at the top of the file:
     ```typescript
     const MY_CONSTANT = "target string content";
     ```
   - If cross-file, export the constant from `test-constants.ts` in the package root:
     ```typescript
     export const TEST_STRINGS = {
       MY_DUPLICATE_STRING: "target string content",
     } as const;
     ```
   - Replace all occurrences with the constant.

2. **type-loosening-resolver**:
   - For TypeScript compiler errors in tests, inject comment overrides above the violating lines:
     ```typescript
     // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
     myFunction(unsafeArg as any);
     ```
   - Cast arguments with `as any` or `unknown as any` to satisfy compiler checks.

3. **constructible-mock-formatter**:
   - For inline test classes violating `max-classes-per-file` or causing hoisting issues.
   - Extract the mock class to its own file in a local `__mocks__` or `test-utils/` directory.
   - Import the mock class at the top of the test file (before `vi.mock` calls).
   - Enforce explicit accessibility modifiers (`public`/`private`/`protected`) on all mock class properties and methods.
   - All methods MUST use arrow function syntax:
     ```typescript
     export class MockService {
       private isMocked: boolean;
       public constructor() {
         this.isMocked = true;
       }
       public performAction = () => {
         return this.isMocked;
       };
     }
     ```

### Step 6: Targeted Verification Loop
1. Run lint and test suites targeting ONLY the affected packages:
   ```bash
   rtk pnpm --filter <package-name> lint
   ```
2. Check if errors are resolved. Repeat up to a maximum of 3 loop iterations.
3. If errors persist after 3 cycles, halt execution and escalate to the developer. Do not execute further edits.

### Step 7: Final Graph Validation
1. Verify that the requirements, design, and implementation trace graph is still intact:
   ```bash
   rtk sara check
   ```
