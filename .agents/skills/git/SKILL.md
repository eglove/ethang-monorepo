---
description: "Create a well-formed git commit using native CLI tools: ask_question inline prompts for staging and commit approvals, invoke_subagent with research for quality checks in parallel."
name: git
---

# Git Workflow

Create a well-formed commit for this monorepo, with an optional pull request step.

## Step 1: Propose and Stage Files

1. Run `git status --porcelain` to list all changed and untracked files.
2. Partition files into **include** and **skip** buckets:

   **Skip:**
   - `dist/`, `node_modules/`, `coverage/`, `.wrangler/`, `storybook-static/`
   - `*.log`
   - `.env`, `.env.*`, `*.local.*`

   Everything else goes in **include**.

3. **Present both lists to the user inline in the conversation:**
   Print the list of files to stage and the list of files to skip clearly.
   
   **This is an approval gate.** Call the `ask_question` tool directly to ask:
   - "Stage these files and continue?" with options: Yes / Edit list / Cancel.
   On confirmation, `git add` each included file.

## Step 2: Read Git Context

Run in parallel:

- `git status`
- `git diff --staged`
- `git branch --show-current`
- `git log --oneline "@{u}..HEAD"` — unpushed commits ahead of upstream. If the command errors (no upstream set), fall back to `git log --oneline -1`.

## Step 3: Update Learned Lessons

1. Analyze the session history for any new learned lessons (rules you got wrong/corrected) or proven patterns (approaches confirmed to work well).
2. Propose these additions/changes to `AGENTS.md` using the `ask_question` tool:
   - "Would you like me to update AGENTS.md with these additions before we commit?" with options: Yes / No / Cancel.
3. On approval, write the changes to the "Learned Lessons" section at the bottom of `AGENTS.md` and stage it (`git add AGENTS.md`).

## Step 4: Amend vs. New Commit

- At least one unpushed commit AND staged content exists, and the new work belongs to that commit → **default to amend**: load the existing message, update it only if the new staged content warrants it.
- Otherwise → create a **new commit**.
- **Never amend a commit that already exists on the remote.** When in doubt, ask the user before amending.

## Step 5: Pre-Commit Quality Review

Fan out checks on `git diff --staged` in parallel using `invoke_subagent` with the `research` subagent type:

1. **Debug artifacts** — `console.log` left behind, commented-out code, stray TODOs without context.
2. **Weakened tests** — deleted or skipped tests, loosened assertions, lowered coverage thresholds.
3. **Atomicity & Scope** — is this one logical change matching the user's task?

Verdict:
- All clear → proceed to Step 6.
- Blocking findings (broken behavior, weakened tests) → stop, report, and wait for fixes.
- Minor findings only → ask "Proceed anyway? Yes / Fix first / Cancel" using `ask_question` and wait.

## Step 6: Draft + Execute

### Subject line

Imperative mood, lowercase, under 72 characters, describe the *why* rather than the *how*. Example: `add vitest test suite for git workflow`.

### Body

Bullet points summarizing the logical changes, with emoji prefixes where they add clarity. At most 72 characters per bullet, 2-5 bullets, omit the body entirely for a single trivial change.

### Execution

Use two `-m` flags — git uses the second as the body paragraph. In PowerShell, pass multi-line bodies with a single-quoted here-string.

**Present the commit draft inline in the conversation:**
Print the drafted subject line and body paragraphs clearly.

**This is a hard gate.** Call the `ask_question` tool directly to ask:
- "Execute this commit?" with options: Yes / Edit message / Cancel.
On confirmation, run the commit commands.

## Step 7: Pull Request (only when asked)

Only when the user explicitly asks: push the branch and open a PR against `master` with `gh pr create`, using a short summary plus a test plan. Never push or open a PR otherwise.
