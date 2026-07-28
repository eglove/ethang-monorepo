---
tags: [backlog, cleanup, monorepo-tools, agents]
status: todo
priority: medium
created: 2026-07-28
---

# Remove Tool Usage Notes from AGENTS.md, Delete monorepo-tools and .hermes/agent-hooks

## Goal

Remove the "Tool Usage" section from AGENTS.md, delete the `packages/monorepo-tools` package entirely, and remove the `.hermes/agent-hooks` directory.

## Current Context

- AGENTS.md has a "CRITICAL: Tool Usage" section (lines 51-57) prescribing WebStorm MCP as primary tool and PowerShell+CLIs as fallback.
- `packages/monorepo-tools` is a Bun/TypeScript package for monorepo validation and Copilot hooks. It is referenced in vitest.config.ts exclude list, README.md, AGENTS.md item 7, and the existing docs/backlog/Package Cleanup plan.
- `.hermes/agent-hooks/transform-tool-result.sh` exists but has no active callers outside monorepo-tools.

## Proposed Approach

Delete monorepo-tools first (it is a self-contained package). Then clean up all references in AGENTS.md, vitest.config.ts, and README.md. Finally delete `.hermes/agent-hooks/`.

## Step-by-Step Plan

### Task 1: Delete the monorepo-tools package directory

**Files:**
- Delete: `packages/monorepo-tools/` (entire directory)

**Step 1: Verify no active imports remain**

Run: `rg "from ['\"]@ethang/monorepo-tools"` from repo root.

Expected: Zero matches, or only matches in monorepo-tools source itself.

If any matches exist outside the package, note them for Task 2.

**Step 2: Delete the directory**

```bash
rm -rf packages/monorepo-tools
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: delete monorepo-tools package"
```

### Task 2: Remove tool usage section from AGENTS.md

**Files:**
- Modify: `AGENTS.md` (lines 51-57)

**Step 1: Delete the entire "CRITICAL: Tool Usage" section**

Remove lines 51-58 (the header, the two priority items, and the trailing `---` separator):

```markdown
---

## CRITICAL: Tool Usage

AI agents must follow this tool priority order:

1. **WebStorm MCP** — use for: file reads/writes/creates/renames, refactoring, builds, database/SQL queries, code search, symbol navigation, rename refactoring
2. **PowerShell + Specialized CLIs** (fallback) — use `rg`, `jq`, `es` (Everything Search), `gh`

---
```

Keep the preceding `---` and following section ("Package Dependency Conventions") intact.

**Step 2: Update AGENTS.md item 7 to remove monorepo-tools references**

The current text mentions:
- "`pnpm --filter @ethang/monorepo-tools check` runs `eslint --fix`"
- "read `lint.autofix` (from the monorepo-tools checker's JSON output, or `pnpm -r lint:fix` summary)"

Replace with generic language that does not reference monorepo-tools:

```markdown
   - `pnpm -r lint --fix` (or any equivalent that passes `--fix`) does the same per-file before `tsc` / `vitest` re-runs.
   - Hooks wired into the IDE / editor may also trigger autofix on save.

   **When you encounter this:**
   - Treat the post-autofix diff as expected, not adversarial. Do not re-introduce a removed return type or undo a `prefer-*` migration just to "match what you wrote" — the autofix is enforcing `@ethang/eslint-config`, which is the source of truth.
   - When fixing a tsc / lint / test failure, run `pnpm -r lint:fix` **before** re-running the script to apply any pending fixes.
```

**Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs: remove tool usage section and monorepo-tools references"
```

### Task 3: Remove monorepo-tools from vitest.config.ts exclude list

**Files:**
- Modify: `vitest.config.ts` (lines 25, 30)

**Step 1: Delete the two monorepo-tools exclude entries**

Remove these lines:
```typescript
"packages/monorepo-tools/src/cli/run-workspace.worker.ts",
"packages/monorepo-tools/tests/**"
```

**Step 2: Verify vitest still configures correctly**

Run: `pnpm run test` from repo root.

Expected: Tests pass (without the deleted package to exclude).

**Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "chore: remove monorepo-tools excludes from vitest config"
```

### Task 4: Remove monorepo-tools references from README.md

**Files:**
- Modify: `README.md` (line 42)

**Step 1: Delete the monorepo-tools package description line**

Remove this line:
```markdown
- **[monorepo-tools](packages/monorepo-tools)**: Bun/TypeScript monorepo checker and Copilot hook tooling.
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: remove monorepo-tools from README"
```

### Task 5: Delete .hermes/agent-hooks directory

**Files:**
- Delete: `.hermes/agent-hooks/transform-tool-result.sh` (entire directory)

**Step 1: Verify no active callers outside deleted package**

Run: `rg "agent-hooks|transform-tool-result" --glob '!packages/monorepo-tools/**'`.

Expected: Zero matches.

**Step 2: Delete the directory**

```bash
rm -rf .hermes/agent-hooks
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: delete .hermes/agent-hooks"
```

## Verification

- `pnpm run test` passes.
- `pnpm run lint` passes.
- `rg "@ethang/monorepo-tools"` returns zero matches across the repo.
- `rg "agent-hooks"` returns zero matches across the repo.
- AGENTS.md has no "Tool Usage" section.
- `.hermes/agent-hooks/` does not exist.

## Risks and Tradeoffs

- If monorepo-tools is still imported anywhere (e.g., by CI scripts or other tooling not yet audited), deleting it will break the build. The import audit in Task 1 step 1 catches this.
- Removing the Tool Usage section from AGENTS.md removes guidance about WebStorm MCP preference. This is intentional per the user's request; if that guidance needs to live elsewhere, document it there before deleting.

## Open Questions

1. Is the Tool Usage section referenced by any external documentation or onboarding materials outside this repo?
2. Does `.hermes/agent-hooks/transform-tool-result.sh` have any hooks in hermes config that reference it directly (not via monorepo-tools)?
