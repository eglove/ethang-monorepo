# Migrate Copilot Hook to Hermes Shell Hooks (Repo-Local) - COMPLETED

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Remove the GitHub Copilot PostToolUse hook and replace it with Hermes shell hooks that are scoped to this repo only.

**Architecture:** The current `.github/hooks/post-tool-inspect.json` is a Copilot-specific hook that runs ESLint autofix and WebStorm MCP inspections after file edits. We'll migrate this to a Hermes shell hook using the `post_tool_call` event, with the hook script living in `.hermes/agent-hooks/` (repo-local) and a cwd check to ensure it only activates in this repo.

**Tech Stack:** Hermes shell hooks, Bun, TypeScript

---

## Status: COMPLETED ✓

All tasks have been completed and verified:

- [x] Task 1: Create repo-local hook script
- [x] Task 2: Configure Hermes shell hook (user-level config)
- [x] Task 3: Test end-to-end hook execution
- [x] Task 4: Remove Copilot hook file
- [x] Task 5: Update documentation
- [x] Verification: TypeScript compilation passes
- [x] Verification: Tests pass (4/4)
- [x] Verification: Hook fires correctly in Hermes

---

## Completed State

### What was done:

1. **Created repo-local hook script** (`.hermes/agent-hooks/post-tool-inspect.sh`):
   - Wraps the Bun inspection script
   - Checks cwd to only activate in this repo
   - Returns empty JSON (Hermes `post_tool_call` hooks ignore return values)

2. **Updated Bun script** (`packages/monorepo-tools/src/cli/post-tool-inspect.cli.ts`):
   - Now accepts Hermes `post_tool_call` JSON payload format
   - Extracts `tool_input.path` and `cwd` directly
   - Removed Copilot format handling

3. **Updated core logic** (`packages/monorepo-tools/src/application/inspect-after-tool.ts`):
   - Changed from parsing stdin payload to accepting `filePath` and `cwd` parameters directly
   - Simplified the inspection flow

4. **Configured Hermes shell hook** (`~/.hermes/config.yaml`):
   - Event: `post_tool_call`
   - Matcher: `^(patch|write_file)$`
   - Command: `sh /c/Users/glove/projects/ethang-monorepo/.hermes/agent-hooks/post-tool-inspect.sh`
   - Timeout: 15 seconds
   - Status: ✓ allowed (approved)

5. **Removed Copilot hook**:
   - Deleted `.github/hooks/post-tool-inspect.json`
   - Removed `.github/hooks/` directory

6. **Updated documentation** (`AGENTS.md`):
   - Added "Hermes Hooks (Repo-Local)" section
   - Documented setup steps and configuration

7. **Verified changes**:
   - TypeScript compilation passes
   - Tests pass (4/4)
   - Hook fires correctly in Hermes

### Key design decisions:
- Hook script is repo-local (`.hermes/agent-hooks/`)
- Config entry is user-level (`~/.hermes/config.yaml`) since Hermes doesn't support repo-local config discovery
- Script checks cwd to ensure it only runs in `ethang-monorepo`
- Only Hermes format supported (no backward compatibility with Copilot needed)

### Git commits:
- `1d97c3c1`: feat: add repo-local Hermes hook script for post-edit inspections
- `eb967c43`: refactor: update inspectAfterTool for Hermes post_tool_call payload format
- `559090df`: refactor: remove Copilot hooks directory, fully migrated to Hermes
- `cbde43df`: docs: add Hermes repo-local hooks documentation to AGENTS.md
- `482a166e`: fix: update inspectAfterTool tests and remove unused code after Hermes migration

---

## Original Plan (Archived)

<details>
<details>
<summary>Click to expand original plan</summary>

[Previous plan content...]

</details>
</details>
