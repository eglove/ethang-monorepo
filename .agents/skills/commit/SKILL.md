---
description: Adds and commits uncommitted changes in the repository. Confirms staged vs unstaged files with the user, enforcing Conventional Commits, RFC 2119 key terminology, and emoji bullet points.
name: commit
---

# Git Staging and Commit Workflow Guide (/commit)

This skill guides you through the process of staging and committing changes within this repository. It enforces structured git hygiene, Conventional Commits specification, RFC 2119 key terminology, and an interactive confirmation flow.

## Staging & Confirmation Flow
You MUST execute the following steps:
- 🔍 **Inspect Workspace Changes**:
  - Run `rtk git status --porcelain` or `rtk git status` to check all modified, untracked, and deleted files.
- 📋 **Categorize and Summarize Changes**:
  - Present a clear, emoji-bulleted summary separating what will be staged from what won't:
    - 🟢 **Staged**: Files that are currently staged or planned to be staged.
    - 🔴 **Unstaged/Untracked**: Files that are modified or untracked but will NOT be staged.
- 💬 **Ask for User Confirmation**:
  - You MUST explicitly ask the user for confirmation before proceeding to commit.
  - Do NOT run `git commit` until the user approves the staged list.

## Commit Message Format (Conventional Commits & RFC 2119)
When constructing the commit message, you MUST strictly adhere to these rules:
- 📌 **Commit Header Structure**:
  - The message MUST be prefixed with a noun type indicating the nature of changes (e.g., `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`).
  - A scope MAY be provided after the type, enclosed in parentheses (e.g., `feat(auth): add google sign-in`).
  - A terminal colon (`:`) and space MUST follow the type/scope prefix.
  - A description MUST follow the colon and space. The description is a short summary of the code changes, written in lowercase.
- ⚡ **Breaking Changes**:
  - A breaking change MUST be indicated by a `!` immediately after the type/scope (e.g., `feat(api)!: remove deprecated endpoints`), or by starting the body/footer with `BREAKING CHANGE:`.
- 📝 **Commit Body & Footer**:
  - A commit body MAY be provided after a blank line. The body SHOULD describe the motivation for the change and contrast it with previous behavior.
  - One or more footers MAY be provided after another blank line (e.g., `Refs: #123`).
- 🤖 **Actor-Action Format**:
  - In this repository, the commit body/footers SHOULD use the descriptive `[Actor]: [Action]` format (e.g., `Agent: Implement commit skill`).

## RFC 2119 Key Terminology
- ⚠️ **MUST/SHALL/REQUIRED**: Indicates an absolute requirement. Failing to do this violates the repository's git hygiene rules.
- 🚫 **MUST NOT/SHALL NOT**: Indicates an absolute prohibition.
- 💡 **SHOULD/RECOMMENDED**: Indicates a highly recommended best practice, though valid exceptions may exist.
- ⚙️ **MAY/OPTIONAL**: Indicates a truly optional action.
