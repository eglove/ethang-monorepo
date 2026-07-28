---
tags: [backlog, cleanup, skills, hermes]
status: todo
priority: medium
created: 2026-07-28
---

# Remove skills.sh References and .agents/skills Directory

## Goal

Remove all references to skills.sh external skill installation from the repo: delete `.agents/skills` contents, remove `skills.external_dirs` from hermes config, remove skill-install lines from update.ps1, and clean up any remaining references.

## Current Context

- `.agents/skills/` exists with compiled skills installed by `npx skills add`.
- `update.ps1` runs 9 `npx skills add` commands (lines 21-29) to install external skills from various GitHub repos.
- `C:\Users\glove\AppData\Local\hermes\config.yaml` has a `skills.external_dirs` entry pointing at `.agents/skills`.
- `vitest.config.ts` excludes `**/.agents/**` from coverage (line 8).
- `sonar-project.properties` excludes `packages/agents-build/src/content/**` (not directly related, keep as-is).
- `packages/intl/src/en/home.ts` contains a string describing "Agent skills compiler (agents-build)" — this is UI text about agents-build functionality, not about skills.sh; do not modify.

## Proposed Approach

Delete the `.agents/skills/` directory content. Remove external_dirs from hermes config.yaml. Remove npx skills add lines from update.ps1. Clean up any remaining in-repo references to skills.sh or .agents/skills installation.

## Step-by-Step Plan

### Task 1: Delete .agents/skills directory contents

**Files:**
- Delete: `.agents/skills/` (all files and subdirectories inside)

**Step 1: Inspect the current contents**

Run: `ls -R .agents/skills/` from repo root.

Expected: A list of skill directories (effect-ts, cloudflare, git-commit, playwright-cli, tanstack-skills, chrome-devtools-mcp, find-skills, sonarcloud-analysis, grill-me).

**Step 2: Delete the directory contents**

```bash
rm -rf .agents/skills/*
```

Do not delete `.agents/.manifest.json` or `.agents/test-output.txt` — only the `skills/` subdirectory.

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove installed external skills from .agents/skills"
```

### Task 2: Remove external_dirs from hermes config.yaml

**Files:**
- Modify: `C:\Users\glove\AppData\Local\hermes\config.yaml` (lines 122-124)

**Step 1: Delete the skills.external_dirs block**

Remove these lines:
```yaml
skills:
  external_dirs:
    - C:\\Users\\glove\\projects\\ethang-monorepo\\.agents\\skills
  creation_nudge_interval: 15
```

Replace with:
```yaml
skills:
  creation_nudge_interval: 15
```

**Step 2: Verify YAML syntax is valid**

Run: `python -c "import yaml; yaml.safe_load(open(r'C:\\Users\\glove\\AppData\\Local\\hermes\\config.yaml'))"` from terminal.

Expected: No error output.

**Step 3: Commit this change as a user config change (do not commit to repo)**

This file is outside the repo. Do not commit it. Document the change for the user.

### Task 3: Remove npx skills add lines from update.ps1

**Files:**
- Modify: `packages/scripts/update.ps1` (lines 20-29)

**Step 1: Replace the skills installation block**

Remove lines 20-29 and replace with an empty block or comment explaining that external skills are no longer installed from this script:

```powershell
Set-Location ~/projects/ethang-monorepo/
# External skills are managed outside this repo; .agents/skills is not populated here.
```

**Step 2: Verify the script syntax is valid PowerShell**

Run: `pwsh -NoProfile -Command "Get-Content packages/scripts/update.ps1 | ForEach-Object { [scriptblock]::Create($_) }" 2>&1` — or simply run the script with `-WhatIf` on a dry-run to confirm no parse errors.

Expected: No syntax errors.

**Step 3: Commit**

```bash
git add packages/scripts/update.ps1
git commit -m "chore: remove skills.sh install lines from update.ps1"
```

### Task 4: Clean up remaining in-repo references to .agents/skills installation

**Files to check:**
- `vitest.config.ts` — line 8 excludes `**/.agents/**`. This is a coverage exclude pattern. Since `.agents/` still exists (manifest, test-output), keep this exclusion. Do not modify.
- `sonar-project.properties` — excludes `packages/agents-build/src/content/**`. Unrelated; do not modify.
- Any CI workflow files that reference skills installation.

**Step 1: Search for remaining references**

Run: `rg "npx skills|skills add|\.agents/skills" --glob '!package-lock*' --glob '!pnpm-lock.yaml'` from repo root.

Expected: Zero matches (pnpm-lock.yaml may still contain transitive entries; those are fine to leave).

**Step 2: If any in-repo references remain, remove them**

If the search returns matches in markdown files or config files, delete those references inline.

**Step 3: Commit if changes were made**

```bash
git add -A
git commit -m "chore: remove remaining skills.sh references"
```

## Verification

- `pnpm run test` passes.
- `pnpm run lint` passes.
- `rg "npx skills|skills add"` returns zero matches in repo files (excluding lockfiles).
- `.agents/skills/` is empty or does not exist.
- hermes config.yaml has no `external_dirs` under `skills:`.

## Risks and Tradeoffs

- Deleting `.agents/skills/` removes locally installed skills from this machine. The user can re-install them manually if needed, but the automated update path is removed.
- Removing `external_dirs` from hermes config means Hermes will no longer load skills from that path. This is the intended outcome — those skills were installed by a pattern we are retiring.
- If any CI workflow or GitHub Action references `npx skills add`, it must also be updated. The search in Task 4 step 1 should catch this.

## Open Questions

1. Are there GitHub Actions workflows that run `npx skills add`? Search `.github/workflows/` explicitly if Task 4 step 1 does not cover them.
2. Should the `.agents/.manifest.json` file be kept or deleted as part of this cleanup? It tracks installed skills and will become stale once skills are removed.
