import { defineRule } from "../../define.ts";

export const gitWorkflow = defineRule({
  content: `# Git Workflow

Create a well-formed commit for this monorepo, with an optional pull request step.

## Step 1: Stage Files

1. Run \`git status --porcelain\` to list all changed and untracked files.
2. Partition files into **include** and **skip** buckets:

   **Skip:**
   - \`dist/\`, \`node_modules/\`, \`coverage/\`, \`.wrangler/\`, \`storybook-static/\`
   - \`*.log\`
   - \`.env\`, \`.env.*\`, \`*.local.*\`

   Everything else goes in **include**.

3. Directly stage all files in the **include** bucket using \`git add <file>\`.

## Step 2: Read Git Context

To minimize token consumption, check the size of the changes first:
1. Run \`git diff --staged --stat\` or \`git diff --staged --name-only\`.
2. If the total diff size is small (under 100 lines), run \`git diff --staged\` to get the full diff.
3. If the total diff size is large, inspect files individually or in batches (or use WebStorm MCP tools to view file edits) to avoid bloating the conversation history.

Run in parallel with the diff size check:
- \`git status\`
- \`git branch --show-current\`
- \`git log --oneline "@{u}..HEAD"\` — unpushed commits ahead of upstream. If the command errors (no upstream set), fall back to \`git log --oneline -1\`.

## Step 3: Update Learned Lessons & Agent Configurations

1. Analyze the session history for:
   - Any new learned lessons (rules you got wrong/corrected) or proven patterns (approaches confirmed to work well).
   - Any opportunities to improve the agent rules, skills, or validation configuration located in \`.agents\` (for performance, usage, and quality).
2. Propose these additions/changes to the user inline in the chat and wait for confirmation.
3. On approval:
   - For global rules/lessons, write them to the "Learned Lessons" section of \`AGENTS.md\`.
   - For rules/skills defined in \`.agents\`, modify the source configurations under \`packages/agents-build/\` and run \`pnpm --filter @ethang/agents-build build\` to compile the changes.
   - Stage all updated and generated files (e.g. \`git add AGENTS.md packages/agents-build/ .agents/\`).

## Step 4: Amend vs. New Commit

- At least one unpushed commit AND staged content exists, and the new work belongs to that commit → **default to amend**: load the existing message, update it only if the new staged content warrants it.
- Otherwise → create a **new commit**.
- **Never amend a commit that already exists on the remote.** When in doubt, ask the user before amending.

## Step 5: Pre-Commit Quality Review

Fan out checks on \`git diff --staged\` in parallel using \`invoke_subagent\` with the \`research\` subagent type:

1. **Debug artifacts** — \`console.log\` left behind, commented-out code, stray TODOs without context.
2. **Weakened tests** — deleted or skipped tests, loosened assertions, lowered coverage thresholds.
3. **Atomicity & Scope** — is this one logical change matching the user's task?

Verdict:
- All clear → proceed to Step 6.
- Blocking findings (broken behavior, weakened tests) → stop, report, and wait for fixes.
- Minor findings only → ask the user inline and wait for confirmation.

## Step 6: Draft + Execute

### Subject line

Imperative mood, lowercase, under 72 characters, describe the *why* rather than the *how*. Example: \`add vitest test suite for git workflow\`.

### Body

Bullet points summarizing the logical changes, with emoji prefixes where they add clarity. At most 72 characters per bullet, 2-5 bullets, omit the body entirely for a single trivial change.

### Execution

Use two \`-m\` flags — git uses the second as the body paragraph. In PowerShell, pass multi-line bodies with a single-quoted here-string.

**Present the consolidated git plan inline:**
Present a detailed summary of the consolidated git plan (including staged files and the commit draft) inline in the chat.

**This is a hard gate.** Stop calling tools to end your turn, and wait for the user to approve inline in the chat before executing the commit.
On confirmation, run the commit commands.

## Step 7: Pull Request (only when asked)

Only when the user explicitly asks: push the branch and open a PR against \`master\` with \`gh pr create\`, using a short summary plus a test plan. Never push or open a PR otherwise.`,
  description:
    "staging changes, creating commits, amending commits, or generating git PRs",
  filename: "git-workflow",
  trigger: "model_decision"
});
