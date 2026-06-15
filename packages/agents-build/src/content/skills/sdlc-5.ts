import { defineSkill } from "../../define.ts";

export const sdlc5 = defineSkill({
  content: `# Standalone SDLC Phase 5 (sdlc-5) - Release & Pull Request Automation

This skill guides an AI developer agent through safely and systematically releasing completed features using a Finite State Machine (FSM) workflow, performing staging, analyzing diffs, generating conventional commit messages with actor-action bodies, pushing commits, and submitting GitHub Pull Requests.

---

## Phase 5 Reference & Alignment
This skill aligns with the following Phase 5 (Release) guidelines:
- [philosophy](file:///.agents/rules/philosophy.md) - Strict lifecycle execution, complete feedback loops, and user checkpoints.
- [workspace-tools](file:///.agents/rules/workspace-tools.md) - Prioritize WebStorm MCP, ripgrep, jq, and Everything Search. Use \`rtk\` command prefixes.
- [conventional-commits](file:///.agents/rules/conventional-commits.md) - Conventional Commit formatting, header construction.
- [actor-action-format](file:///.agents/rules/actor-action-format.md) - Atomic Actor-Action body messages.
- [automated-release-engineering](file:///.agents/rules/automated-release-engineering.md) - Deployment repeatability and VCS management.
- [configuration-change-process](file:///.agents/rules/configuration-change-process.md) - Git hygiene and branch management.
- [rollback-revert-planning](file:///.agents/rules/rollback-revert-planning.md) - Target Git restores and recovery.

---

## Step-by-Step Execution Plan

### Step 1: Pre-Execution Graph Validation
1. Before performing any release tasks, run the command:
   \`\`\`bash
   rtk sara check
   \`\`\`
2. If the graph validation fails (e.g., broken links, loops, or orphaned design elements), halt execution immediately. Do not make any commits or pushes.

### Step 2: Branch Safety Gate
1. Query the current active branch name:
   \`\`\`bash
   rtk git branch --show-current
   \`\`\`
2. If the active branch is \`master\` or \`main\` (protected branches):
   - Prompt the user to input a name for a new feature branch.
   - Sanitize the input to strip whitespace, semicolons, shell pipes, or redirection operators.
   - Run the checkout command to switch to the new feature branch:
     \`\`\`bash
     rtk git checkout -b <new-branch>
     \`\`\`
   - Verify that the switch was successful (exit code 0).
3. If the active branch is already a non-protected feature branch, proceed directly to Step 3.

### Step 3: Staging Changes
1. Stage all modified and untracked files:
   \`\`\`bash
   rtk git add .
   \`\`\`
2. Verify that there are staged changes to commit by running:
   \`\`\`bash
   rtk git status --porcelain
   \`\`\`
3. If the command output is empty, halt execution with the message: "No changes to commit".

### Step 4: Diff Analysis & Message Generation
1. Inspect the staged files in the index:
   \`\`\`bash
   rtk git diff --cached --name-only
   \`\`\`
2. Dynamically compile a Conventional Commit message based on the modifications:
   - **Header format**: \`<type>(<scope>): <lowercase description>\` (no trailing period).
     - **type**: Choose \`feat\` (if new features, packages, or main application code/skills are added), \`fix\` (if correcting bugs or test assertions), \`refactor\` (if restructuring code without changing behavior), or \`docs\` (if only markdown/documentation is modified).
     - **scope**: The package name extracted dynamically from the path of the modified files (e.g., \`agents-build\` for files under \`packages/agents-build\`). If files in multiple packages are modified, the scope defaults to \`monorepo\`.
     - **description**: A short, present-tense, imperative description in lowercase (e.g., "add release automation skill").
   - **Body format**: One or more atomic statements in Actor-Action format, separated by a blank line from the header:
     \`\`\`
     <Actor>: <Action>
     \`\`\`
     - **Actor**: The component, class, or system layer responsible for the change (e.g., \`compiler\`, \`sdlc5\`).
     - **Action**: An imperative, present-tense verb phrase (e.g., \`define Phase 5 release automation schema\`).

### Step 5: Commit changes
1. Commit the staged changes using the generated commit message header and body:
   \`\`\`bash
   rtk git commit -m "<commit-header>

   <commit-body>"
   \`\`\`
2. Ensure the commit succeeds.

### Step 6: Push Branch
1. Push the local branch commits to the remote tracking origin:
   \`\`\`bash
   rtk git push -u origin <branch>
   \`\`\`
2. Ensure the push succeeds without authentication or network errors.

### Step 7: Open Pull Request
1. Invoke the GitHub CLI to construct a new Pull Request:
   \`\`\`bash
   rtk gh pr create --title "<commit-header>" --body "<commit-body>"
   \`\`\`
2. Verify that the Pull Request is successfully opened.

### Step 8: Final Graph Verification
1. Run the SARA validation check once more:
   \`\`\`bash
   rtk sara check
   \`\`\`
2. Verify that the requirements, design, and implementation graph remains intact and valid.
`,
  description:
    "Automates the Release process for completed feature work by checking branch safety, staging changes, analyzing diffs, committing with conventional/actor-action messages, pushing to origin, and creating a pull request.",
  name: "sdlc-5"
});
