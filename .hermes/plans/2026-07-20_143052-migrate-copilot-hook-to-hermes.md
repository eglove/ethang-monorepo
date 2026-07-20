# Migrate Copilot Hook to Hermes Shell Hooks (Repo-Local)

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Remove the GitHub Copilot PostToolUse hook and replace it with Hermes shell hooks that are scoped to this repo only.

**Architecture:** The current `.github/hooks/post-tool-inspect.json` is a Copilot-specific hook that runs ESLint autofix and WebStorm MCP inspections after file edits. We'll migrate this to a Hermes shell hook using the `post_tool_call` event, with the hook script living in `.hermes/agent-hooks/` (repo-local) and a cwd check to ensure it only activates in this repo.

**Tech Stack:** Hermes shell hooks, Bun, TypeScript

---

## Current State

The file `.github/hooks/post-tool-inspect.json` configures a Copilot hook:
- **Event:** `postToolUse` (after tool execution)
- **Matcher:** `^(edit|create)$` (matches edit and create tools)
- **Command:** `bun packages/monorepo-tools/src/cli/post-tool-inspect.cli.ts`
- **Timeout:** 15 seconds

The script (`post-tool-inspect.cli.ts`):
- Reads JSON payload from stdin
- Calls `inspectAfterTool()` which applies ESLint --fix and gets WebStorm MCP file problems
- Returns diagnostics in `{"additionalContext": "..."}` envelope

---

## Task 1: Create Repo-Local Hook Script

**Objective:** Create a shell hook script in `.hermes/agent-hooks/` that wraps the Bun script and checks cwd

**Files:**
- Create: `.hermes/agent-hooks/post-tool-inspect.sh`
- Modify: `packages/monorepo-tools/src/cli/post-tool-inspect.cli.ts`

**Step 1: Create shell hook wrapper script**

Create `.hermes/agent-hooks/post-tool-inspect.sh`:

```bash
#!/usr/bin/env bash
# Hermes shell hook for post-edit inspections (repo-local to ethang-monorepo)
# Only activates when cwd is inside this repo

set -euo pipefail

# Read Hermes hook payload from stdin
STDIN_PAYLOAD=$(cat)

# Extract cwd from payload
CWD=$(echo "$STDIN_PAYLOAD" | jq -r '.cwd // empty')

# Only run in ethang-monorepo
if [[ -z "$CWD" || ! -f "$CWD/package.json" || ! -d "$CWD/packages/monorepo-tools" ]]; then
  # Not in the right repo, return empty response
  echo '{}'
  exit 0
fi

# Change to repo root for relative path resolution
cd "$CWD"

# Forward payload to Bun script
echo "$STDIN_PAYLOAD" | bun run packages/monorepo-tools/src/cli/post-tool-inspect.cli.ts
```

Make it executable:
```bash
chmod +x .hermes/agent-hooks/post-tool-inspect.sh
```

**Step 2: Update post-tool-inspect.cli.ts to handle Hermes payload**

The Bun script needs to accept the Hermes `post_tool_call` JSON format:

```typescript
export const main = async (stdin: AsyncIterable<unknown>) => {
  const stdinPayload = await readStdinText(stdin);

  // Parse Hermes hook payload
  let payload: any;
  try {
    payload = JSON.parse(stdinPayload);
  } catch {
    process.stdout.write('{}\n');
    return;
  }

  // Extract file path from tool args
  const filePath = payload.tool_input?.path;
  if (!filePath) {
    process.stdout.write('{}\n');
    return;
  }

  // Call existing inspection logic
  const result = await Effect.runPromise(
    inspectAfterTool({ filePath, stdinPayload })
  );

  process.stdout.write(`${JSON.stringify(result)}\n`);
};
```

**Step 3: Commit the repo-local script**

```bash
git add .hermes/agent-hooks/post-tool-inspect.sh packages/monorepo-tools/src/cli/post-tool-inspect.cli.ts
git commit -m "feat: add repo-local Hermes hook script for post-edit inspections"
```

**Verification:**
- Script is executable
- Script checks cwd before running
- Bun script handles Hermes JSON payload format

---

## Task 2: Configure Hermes Shell Hook (User-Level Config)

**Objective:** Add the shell hook to `~/.hermes/config.yaml` pointing at the repo-local script

**Files:**
- Modify: `~/.hermes/config.yaml`

**Step 1: Add hook configuration**

Edit `~/.hermes/config.yaml` and add:

```yaml
hooks:
  post_tool_call:
    - matcher: "^(patch|write_file)$"
      command: "{{repo_root}}/.hermes/agent-hooks/post-tool-inspect.sh"
      timeout: 15
```

**Note:** Hermes doesn't support variable expansion in hook commands. Use the absolute path instead:

```yaml
hooks:
  post_tool_call:
    - matcher: "^(patch|write_file)$"
      command: "/c/Users/glove/projects/ethang-monorepo/.hermes/agent-hooks/post-tool-inspect.sh"
      timeout: 15
```

**Step 2: Validate configuration**

```bash
hermes hooks list
```

Expected: Hook appears in the list with event `post_tool_call` and the correct command path.

**Step 3: Test hook registration**

```bash
hermes hooks test post_tool_call --for-tool patch --payload-file <(echo '{"tool_name":"patch","tool_input":{"path":"test.ts"},"cwd":"/c/Users/glove/projects/ethang-monorepo"}')
```

Expected: Hook fires and returns JSON response.

**Verification:**
- `hermes hooks list` shows the hook
- Hook command path is correct
- Manual test fires the hook

---

## Task 3: Test End-to-End Hook Execution

**Objective:** Verify the Hermes hook fires correctly after file editing tools in this repo

**Files:**
- Test: Manual verification in Hermes CLI

**Step 1: Start new Hermes session in repo**

```bash
cd /c/Users/glove/projects/ethang-monorepo
hermes chat
```

**Step 2: Trigger hook with file edit**

In Hermes CLI:
```
> Use the patch tool to add a console.log to any .ts file in packages/monorepo-tools
```

**Step 3: Verify hook execution**

Check that:
1. Hook fires after patch/write_file (check logs)
2. ESLint autofix is applied
3. WebStorm MCP inspections run (if available)
4. Additional context appears in next agent turn

**Step 4: Verify hook does NOT fire outside repo**

```bash
cd /tmp
hermes chat
# In chat: use patch tool
# Hook should NOT fire (cwd check fails)
```

**Step 5: Check logs for errors**

```bash
hermes logs --follow | grep -i "hook\|post-tool-inspect"
```

**Verification:**
- Hook fires on file edit tools within ethang-monorepo
- Hook does NOT fire outside the repo
- No errors in logs
- ESLint fixes are applied automatically

---

## Task 4: Remove Copilot Hook File

**Objective:** Delete the Copilot-specific hook configuration

**Files:**
- Delete: `.github/hooks/post-tool-inspect.json`

**Step 1: Remove the file**

```bash
rm .github/hooks/post-tool-inspect.json
```

**Step 2: Verify removal**

```bash
ls -la .github/hooks/
```

Expected: File no longer exists (or directory is empty).

**Step 3: Commit the removal**

```bash
git add -A
git commit -m "refactor: remove Copilot post-tool-inspect hook, migrated to Hermes"
```

**Verification:**
- File deleted from filesystem
- Change committed to git

---

## Task 5: Update Documentation

**Objective:** Document the new Hermes hook setup in AGENTS.md

**Files:**
- Modify: `AGENTS.md`

**Step 1: Add hook documentation section**

Add to AGENTS.md under a new "## Hermes Hooks (Repo-Local)" section:

```markdown
## Hermes Hooks (Repo-Local)

This repo uses a Hermes shell hook for post-edit inspections:

- **Hook event:** `post_tool_call` (fires after patch/write_file tools)
- **Matcher:** `^(patch|write_file)$`
- **Script:** `.hermes/agent-hooks/post-tool-inspect.sh` (repo-local)
- **Behavior:** Runs ESLint --fix and WebStorm MCP inspections after file edits
- **Scope:** Only activates when cwd is inside this repo (checked in script)
- **Config:** `~/.hermes/config.yaml` (user-level, references repo-local script)

### Setup

1. Ensure `~/.hermes/config.yaml` has the hook configured:
   ```yaml
   hooks:
     post_tool_call:
       - matcher: "^(patch|write_file)$"
         command: "/c/Users/glove/projects/ethang-monorepo/.hermes/agent-hooks/post-tool-inspect.sh"
         timeout: 15
   ```

2. Verify with `hermes hooks list`

3. To modify hook behavior, edit:
   - `.hermes/agent-hooks/post-tool-inspect.sh` (shell wrapper)
   - `packages/monorepo-tools/src/cli/post-tool-inspect.cli.ts` (inspection logic)
```

**Step 2: Commit documentation**

```bash
git add AGENTS.md
git commit -m "docs: add Hermes repo-local hooks documentation"
```

**Verification:**
- Documentation accurately describes hook setup
- Setup steps are clear and complete
- Future developers can understand and modify the hooks

---

## Risks and Tradeoffs

**Risks:**
1. **Hook configured in user-level config:** `~/.hermes/config.yaml` is global, but the script checks cwd
   - Mitigation: Script exits early if not in repo (Task 1)
2. **Different payload formats:** Copilot and Hermes pass different data to the hook script
   - Mitigation: Task 1 updates Bun script to handle Hermes format
3. **WebStorm MCP availability:** The inspection script may depend on WebStorm running
   - Mitigation: Add error handling in the Bun script

**Tradeoffs:**
1. **Shell hooks vs Plugin hooks:** Chose shell hooks for simplicity (drop-in scripts)
   - Plugin hooks would allow more programmatic control but require more setup
2. **Repo-local script, user-level config:** Script lives in repo, but config entry must be added manually to `~/.hermes/config.yaml`
   - This is a limitation of Hermes (no repo-local config discovery)
   - Documented in AGENTS.md for onboarding

---

## Open Questions

1. **Does the current `inspectAfterTool()` function need changes to work with Hermes payload?**
   - Need to examine `packages/monorepo-tools/src/application/inspect-after-tool.ts`
2. **Should we support both Copilot and Hermes hooks during transition?**
   - Recommend cleaning up entirely (Task 4)
3. **What's the exact JSON format Hermes `post_tool_call` hook receives?**
   - Documented in hooks docs: `{"hook_event_name", "tool_name", "tool_input", "cwd", "extra"}`

---

## Success Criteria

- [ ] `.github/hooks/post-tool-inspect.json` deleted
- [ ] `.hermes/agent-hooks/post-tool-inspect.sh` created (repo-local)
- [ ] Hook script checks cwd and only runs in ethang-monorepo
- [ ] `post-tool-inspect.cli.ts` updated to handle Hermes payload
- [ ] Hermes shell hook configured in `~/.hermes/config.yaml`
- [ ] Hook fires after `patch` and `write_file` tool calls (in repo only)
- [ ] ESLint autofix applied automatically
- [ ] WebStorm MCP inspections run (if available)
- [ ] No errors in Hermes logs
- [ ] Documentation updated in AGENTS.md
