---
id: "SCEN-005"
type: "scenario"
name: "Staging, Committing, and Creating PR on Feature Branch"
refines:
  - "UC-005"
---

# Scenario: Staging, Committing, and Creating PR on Feature Branch

This scenario describes a concrete walkthrough of the agent validating branch state, staging modified files, analyzing the diff to construct a conventional commit, committing/pushing, and opening a PR.

## 1. Initial State
- The developer has completed feature implementation under a package in the monorepo.
- The developer is currently on branch \`main\` with modified files.
- The developer runs \`/sdlc-5\`.

## 2. Interactive Execution Steps
- **Step 1**: The assistant validates the current branch (\`main\`) and flags it as protected.
- **Step 2**: The assistant prompts the developer for a new branch name (e.g. \`feat/sdlc-5-skill\`).
- **Step 3**: The assistant creates and checks out the new branch \`feat/sdlc-5-skill\`.
- **Step 4**: The assistant runs \`git add .\` to stage all unstaged/modified changes.
- **Step 5**: The assistant executes \`git diff --cached\` to analyze the scope and modified lines.
- **Step 6**: The assistant formats a conventional commit message (e.g. \`feat(sdlc): add Phase 5 Release skill\`) conforming to actor-action rules.
- **Step 7**: The assistant commits the staged changes using the generated commit message.
- **Step 8**: The assistant pushes the changes to the remote repository.
- **Step 9**: The assistant executes \`gh pr create\` with automated title and description parameters.

## 3. End State
- The changes are successfully pushed to the remote feature branch and a pull request has been opened on GitHub.
