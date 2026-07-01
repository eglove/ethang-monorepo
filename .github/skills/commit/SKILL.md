---
description: Adds and commits uncommitted changes in the repository. Confirms staged vs unstaged files with the user, enforcing Conventional Commits, RFC 2119 key terminology, and emoji bullet points.
name: commit
---

# Git Staging and Commit Workflow

When the user asks you to commit changes, you MUST execute the full staging and commit workflow described below. Do NOT just summarize the steps — run them directly.

## Execution Workflow

1. **Inspect Workspace Changes**: Run `git status --porcelain` to see all modified, untracked, and deleted files.
1. **Categorize Changes**: Present a clear, emoji-bulleted summary to the user separating what will be staged from what won't. List the staged files under a 🟢 heading and the unstaged/untracked files under a 🔴 heading.
1. **Ask for Confirmation**: You MUST explicitly ask the user for confirmation before proceeding. Do NOT run `git commit` until the user approves the staged list.
1. **Build Commit message**: After the user confirms, construct the commit message following the rules below, then run `git commit` with it.

## Commit message Format (Conventional Commits & RFC 2119)

When constructing the commit message, you MUST strictly adhere to these rules:

* 📌 **Commit Header Structure**:
	* The message MUST be prefixed with a noun type indicating the nature of changes (e.g., `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`).
	* A scope MAY be provided after the type, enclosed in parentheses (e.g., `feat(auth): add google sign-in`).
	* A terminal colon (`:`) and space MUST follow the type/scope prefix.
	* A description MUST follow the colon and space. The description is a short summary of the code changes, written in lowercase.
* ⚡ **Breaking Changes**:
	* A breaking change MUST be indicated by a `!` immediately after the type/scope (e.g., `feat(api)!: remove deprecated endpoints`), or by starting the body/footer with `BREAKING CHANGE:`.
* 📝 **Commit Body & Footer**:
	* A commit body MAY be provided after a blank line. The body SHOULD describe the motivation for the change and contrast it with previous behavior.
	* One or more footers MAY be provided after another blank line (e.g., `Refs: #123`).
* 🤖 **Actor-Action Format**:
	* In this repository, the commit body/footers SHOULD use the descriptive `[Actor]: [Action]` format (e.g., `Agent: Implement commit skill`).

## RFC 2119 Key Terminology

* ⚠️ **MUST/SHALL/REQUIRED**: Indicates an absolute requirement. Failing to do this violates the repository's git hygiene rules.
* 🚫 **MUST NOT/SHALL NOT**: Indicates an absolute prohibition.
* 💡 **SHOULD/RECOMMENDED**: Indicates a highly recommended best practice, though valid exceptions may exist.
* ⚙️ **MAY/OPTIONAL**: Indicates a truly optional action.
