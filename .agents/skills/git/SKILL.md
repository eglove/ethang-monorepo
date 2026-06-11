---
name: git
description: "Create a well-formed git commit: staged-file proposal, pre-commit quality review, formatted subject and emoji body, optional gh pull request. Use when the user asks to commit, amend, or open a PR."
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

3. Present both lists to the user and ask: "Stage these files and continue?" — Yes / Edit list / Cancel. Wait for the answer.
4. On confirmation, `git add` each included file.

## Step 2: Read Git Context

Run in parallel:

- `git status`
- `git diff --staged`
- `git branch --show-current`
- `git log --oneline "@{u}..HEAD"` — unpushed commits ahead of upstream. If the command errors (no upstream set), fall back to `git log --oneline -1`.

## Step 3: Amend vs. New Commit

- At least one unpushed commit AND staged content exists, and the new work belongs to that commit → **default to amend**: load the existing message, update it only if the new staged content warrants it.
- Otherwise → create a **new commit**.
- **Never amend a commit that already exists on the remote.** When in doubt, ask the user before amending.

## Step 4: Pre-Commit Quality Review

Apply these checks to `git diff --staged`:

1. **Debug artifacts** — `console.log` left behind, commented-out code, stray TODOs without context.
2. **Weakened tests** — deleted or skipped tests, loosened assertions, lowered coverage thresholds.
3. **Atomicity** — is this one logical change? Is unrelated refactoring mixed in?
4. **Scope** — do the changes match the task the user described?

Verdict:

- All clear → proceed to Step 5.
- Blocking findings (broken behavior, weakened tests) → stop, report, and wait for fixes.
- Minor findings only → ask "Proceed anyway? Yes / Fix first / Cancel" and wait.

## Step 5: Draft + Execute

### Subject line

Imperative mood, lowercase, under 72 characters, describe the *why* rather than the *how*. Example: `add offset dedupe to lessons stop hook`.

### Body

Bullet points summarizing the logical changes, with emoji prefixes where they add clarity:

| Emoji | Use for |
|-------|---------|
| ✨ | new feature or behavior |
| 🐛 | bug fix |
| ♻️ | refactor / cleanup |
| 🧪 | test changes |
| 📝 | docs / comments |
| 🔧 | config / build changes |

Rules: at most 72 characters per bullet, 2-5 bullets, omit the body entirely for a single trivial change, and describe the behavior covered rather than naming test tooling in bullet text.

### Execution

Use two `-m` flags — git uses the second as the body paragraph. In PowerShell, pass multi-line bodies with a single-quoted here-string (the closing `'@` must start at column 0):

```powershell
git commit -m "subject line" -m @'
- ✨ bullet one
- 🐛 bullet two
'@
```

**Show the full drafted message** (subject + body) to the user and wait for confirmation before executing. The same applies to `--amend`.

## Step 6: Pull Request (only when asked)

Only when the user explicitly asks: push the branch and open a PR against `master` with `gh pr create`, using a short summary plus a test plan. Never push or open a PR otherwise.
