# Fix: Inject Lint/TSC/File Inspection Results into Hermes Context

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Make post-edit ESLint and WebStorm inspections visible to the LLM by switching the hook event from `post_tool_call` (whose stdout is ignored) to `transform_tool_result` (whose stdout rewrites the tool result Hermes feeds back to the model).

**Architecture:** The current hook runs on `post_tool_call` and prints `{}` — Hermes discards that stdout entirely. The `inspectAfterTool` function still returns a Copilot-shaped `hookSpecificOutput` envelope that nothing reads. Switch to `transform_tool_result`: Hermes pipes the original tool result into the script via stdin (`extra.result`), the script runs ESLint fix + WebStorm MCP inspection, and emits the original result with diagnostic markdown appended. The model sees the file edit result plus the post-edit lint/tsc report in one turn — no extra tool calls needed.

**Tech Stack:** Hermes shell hooks (`transform_tool_result`), Bun, Effect, TypeScript, ESLint Node API, WebStorm MCP (HTTP/SSE).

---

## Current Context / Assumptions

1. `~/.hermes/config.yaml` currently has a `post_tool_call` hook with matcher `^(patch|write_file)$`. The script at `.hermes/agent-hooks/post-tool-inspect.sh` runs the Bun CLI at `packages/monorepo-tools/src/cli/post-tool-inspect.cli.ts`.
2. The CLI reads `tool_input.path` and `cwd` from the Hermes stdin payload, calls `inspectAfterTool`, and discards the return by writing `{}`.
3. `inspectAfterTool` (in `packages/monorepo-tools/src/application/inspect-after-tool.ts`) still returns a `hookSpecificOutput` envelope — a leftover from the Copilot migration that nothing consumes.
4. Hermes shell hook docs confirm: `post_tool_call` stdout is **ignored**; only `transform_tool_result` lets a shell hook rewrite what the model sees.
5. Per Hermes shell-hook JSON wire protocol, `transform_tool_result` stdin payload includes `extra.result` (the original tool's return string) alongside `tool_name`, `tool_input` (the args the model called with), `session_id`, `cwd`.
6. ESLint fix is already applied to disk (side-effect), but the pre-fix warnings and post-fix residuals are never reported to the LLM.

---

## Proposed Approach

Two parallel tracks:

**Track A — Hook wiring:**
- Switch the event from `post_tool_call` to `transform_tool_result` in `~/.hermes/config.yaml`.
- Update the shell script to forward stdout from Bun back to Hermes (no longer discard).
- Update the Bun CLI to read `extra.result` from stdin, run inspections, and emit a JSON envelope containing the original result plus diagnostic markdown.

**Track B — Domain logic:**
- Rewrite `inspectAfterTool` to return a `string` (the diagnostics markdown block) instead of the dead `InspectAfterToolResult` envelope.
- Add ESLint result formatting: include pre-fix warnings and post-fix residuals in the diagnostics output, so the LLM can see what autofix did and what it couldn't.
- Update the CLI to combine `extra.result` + ESLint summary + WebStorm inspections into a single transformed result string.

Shell hooks for `transform_tool_result` return `str | None` at the plugin level. For shell hooks, the stdout JSON shape that replaces the result is `{"result": "<new string>"}` (matching the `context` pattern used by `pre_llm_call` — a single top-level `context`/`result` key with the rewrite payload). Verify this at runtime with `hermes hooks test`.

---

## Step-by-step Plan

### Task 1: Write failing test — `inspectAfterTool` returns diagnostics string instead of envelope

**Objective:** Lock the new return type (a plain `string` of markdown — empty when clean, non-empty when there are issues).

**Files:**
- Modify: `packages/monorepo-tools/tests/inspect-after-tool.test.ts:1-122`
- Modify: `packages/monorepo-tools/src/application/inspect-after-tool.ts:42-48` (remove the dead `InspectAfterToolResult` type)

**Step 1: Rewrite the test file with the new expected return shape**

```typescript
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import {
  inspectAfterTool,
  type InspectAfterToolDependencies
} from "../src/application/inspect-after-tool.ts";

const REPO_ROOT = "C:/repo";

const makeDependencies = (
  overrides: Partial<InspectAfterToolDependencies> = {}
) => {
  return {
    applyEslintFix:
      overrides.applyEslintFix ??
      vi.fn(() => {
        return Effect.succeed({
          results: Array.isArray([]),
          cwd: REPO_ROOT,
          files: []
        }) as Effect.Effect<unknown, unknown>;
      }),
    fallbackCwd: overrides.fallbackCwd ?? REPO_ROOT,
    loadFileProblems:
      overrides.loadFileProblems ??
      vi.fn(() => {
        return Effect.succeed({
          errors: [],
          messagePath: "/messages/test"
        });
      })
  };
};

describe(inspectAfterTool, () => {
  it("returns an empty string when file is clean (no lint issues, no inspections)", async () => {
    const dependencies = makeDependencies();
    await expect(
      Effect.runPromise(
        inspectAfterTool({
          dependencies,
          filePath: "src/example.ts",
          cwd: REPO_ROOT
        })
      )
    ).resolves.toBe("");
  });

  it("returns WebStorm inspection markdown when MCP reports errors", async () => {
    const dependencies = makeDependencies({
      loadFileProblems: vi.fn(() => {
        return Effect.succeed({
          errors: [
            {
              column: 4,
              description: " Suspicious   usage ",
              inspectionId: "ExampleInspection",
              line: 8,
              severity: "warning"
            }
          ],
          messagePath: "/messages/test"
        });
      })
    });

    await expect(
      Effect.runPromise(
        inspectAfterTool({
          dependencies,
          filePath: "src/example.ts",
          cwd: REPO_ROOT
        })
      )
    ).resolves.toContain(
      "- [WARNING] `ExampleInspection` at L8:C4 — Suspicious usage"
    );
  });

  it.each(["lint", "inspection"] as const)(
    "returns an empty string when the %s operation fails",
    async (failure) => {
      const deps = {
        inspection: () =>
          makeDependencies({
            loadFileProblems: vi.fn(() => Effect.die(new Error("mcp down")))
          }),
        lint: () =>
          makeDependencies({
            applyEslintFix: vi.fn(() => Effect.fail(new Error("no eslin")))
          })
      };
      await expect(
        Effect.runPromise(
          inspectAfterTool({
            dependencies: deps[failure](),
            filePath: "src/example.ts",
            cwd: REPO_ROOT
          })
        )
      ).resolves.toBe("");
    }
  );
});
```

**Step 2: Run test to verify failure**

Run: `pnpm --filter @ethang/monorepo-tools test -- inspect-after-tool.test.ts`
Expected: FAIL — `inspectAfterTool` currently returns `{hookSpecificOutput: ...}`, not a string.

**Step 3: Commit failing test**

```bash
git add packages/monorepo-tools/tests/inspect-after-tool.test.ts
git commit -m "test: lock inspectAfterTool string-return contract"
```

---

### Task 2: Implement — `inspectAfterTool` returns diagnostics markdown

**Objective:** Make the function return a plain `string` — empty when clean, markdown when there are findings.

**Files:**
- Modify: `packages/monorepo-tools/src/application/inspect-after-tool.ts:42-98`

**Step 1: Replace the `InspectAfterToolResult` type and function body**

```typescript
export type InspectAfterToolDependencies = {
  readonly applyEslintFix: (
    options: LoadAutofixResultsOptions
  ) => Effect.Effect<unknown, unknown>;
  readonly fallbackCwd: string;
  readonly loadFileProblems: (
    options: LoadFileProblemsOptions
  ) => Effect.Effect<LoadFileProblemsResult, unknown>;
};

export type InspectAfterToolOptions = {
  readonly dependencies?: InspectAfterToolDependencies;
  readonly filePath: string;
  readonly cwd: string;
};

// InspectAfterToolResult removed — the function now returns string directly.

const defaultDependencies: InspectAfterToolDependencies = {
  applyEslintFix: loadAutofixResults,
  fallbackCwd: process.cwd(),
  loadFileProblems
};

export const inspectAfterTool = Effect.fn("inspectAfterTool")(function* (
  options: InspectAfterToolOptions
) {
  const dependencies = options.dependencies ?? defaultDependencies;
  const repoRoot = options.cwd;
  const normalizedPath = options.filePath.startsWith(repoRoot)
    ? options.filePath
    : `${repoRoot}/${options.filePath}`;
  const relFilePath = options.filePath.startsWith(repoRoot)
    ? options.filePath.slice(repoRoot.length + 1)
    : options.filePath;

  yield* dependencies
    .applyEslintFix({ cwd: repoRoot, files: [normalizedPath] })
    .pipe(Effect.catchAllCause(() => Effect.void));

  const problems = yield* dependencies
    .loadFileProblems({ filePath: relFilePath, projectPath: repoRoot })
    .pipe(Effect.catchAllCause(() => Effect.succeed(null)));

  return isNil(problems)
    ? ""
    : (formatInspectionsAsMarkdown(relFilePath, problems.errors) ?? "");
});
```

**Step 2: Run tests to verify pass**

Run: `pnpm --filter @ethang/monorepo-tools test -- inspect-after-tool.test.ts`
Expected: PASS — 3 tests green.

**Step 3: Commit**

```bash
git add packages/monorepo-tools/src/application/inspect-after-tool.ts
git commit -m "refactor: inspectAfterTool returns diagnostics string (drop Copilot envelope)"
```

---

### Task 3: Update CLI to read `extra.result` and emit transformed JSON

**Objective:** Make `post-tool-inspect.cli.ts` read the original tool result from stdin, run inspections, and output `{"result": "<original>\n\n<diagnostics>"}` for `transform_tool_result` to consume.

**Files:**
- Modify: `packages/monorepo-tools/src/cli/post-tool-inspect.cli.ts`
- Add test: `packages/monorepo-tools/tests/post-tool-inspect-cli.test.ts`

**Step 1: Rewrite CLI with new contract**

```typescript
#!/usr/bin/env bun

/**
transform_tool_result hook: read Hermes JSON from stdin, apply ESLint --fix,
call WebStorm MCP get_file_problems, emit {"result": <combined>} on stdout.

stdin payload (transform_tool_result):
  {
    "hook_event_name": "transform_tool_result",
    "tool_name": "patch" | "write_file",
    "tool_input": {"path": "...", ...},
    "cwd": "/abs/path/to/repo",
    "extra": {"result": "<original tool return string>", ...}
  }

stdout:
  {"result": "<original tool result>\n\n<diagnostics markdown>"}
  or {} to leave untouched
*/

import { Effect } from "effect";
import process from "node:process";

import { inspectAfterTool } from "../application/inspect-after-tool.ts";

export const readStdinText = async (stdin: AsyncIterable<unknown>) => {
  const chunks: string[] = [];
  for await (const chunk of stdin) {
    chunks.push(String(chunk));
  }
  return chunks.join("");
};

export const buildTransformedResult = (
  originalResult: string,
  diagnostics: string
): string => {
  if (!diagnostics) {
    return originalResult;
  }
  return `${originalResult}\n\n${diagnostics}`;
};

export const main = async (stdin: AsyncIterable<unknown>) => {
  const stdinPayload = await readStdinText(stdin);

  let payload: {
    cwd?: string;
    extra?: { result?: string };
    tool_input?: { path?: string };
  };
  try {
    payload = JSON.parse(stdinPayload);
  } catch {
    process.stdout.write("{}\n");
    return;
  }

  const filePath = payload?.tool_input?.path;
  const cwd = payload?.cwd;
  const originalResult = payload?.extra?.result ?? "";

  if (!filePath || !cwd) {
    process.stdout.write("{}\n");
    return;
  }

  const diagnostics = await Effect.runPromise(
    inspectAfterTool({ filePath, cwd })
  ).catch(() => "");

  const transformed = buildTransformedResult(originalResult, diagnostics);

  if (!diagnostics) {
    // No findings — don't rewrite the tool result
    process.stdout.write("{}\n");
    return;
  }
  process.stdout.write(`${JSON.stringify({ result: transformed })}\n`);
};

/* v8 ignore next 3 -- import.meta.main is true only when Bun launches this CLI. */
if (import.meta.main) {
  await main(process.stdin);
}
```

**Step 2: Write failing test for `buildTransformedResult`**

```typescript
// packages/monorepo-tools/tests/post-tool-inspect-cli.test.ts
import { describe, expect, it } from "vitest";
import { buildTransformedResult } from "../src/cli/post-tool-inspect.cli.ts";

describe(buildTransformedResult, () => {
  it("returns original result when diagnostics is empty", () => {
    expect(buildTransformedResult("patch applied", "")).toBe("patch applied");
  });

  it("appends diagnostics after two newlines when present", () => {
    expect(
      buildTransformedResult(
        "patch applied",
        "WebStorm MCP inspections for `x.ts`:\n- [WARNING] `Foo` at L1:C1 — bar"
      )
    ).toBe(
      "patch applied\n\nWebStorm MCP inspections for `x.ts`:\n- [WARNING] `Foo` at L1:C1 — bar"
    );
  });
});
```

**Step 3: Run, verify PASS**

```bash
pnpm --filter @ethang/monorepo-tools test -- post-tool-inspect-cli.test.ts inspect-after-tool.test.ts
```

**Step 4: Commit**

```bash
git add packages/monorepo-tools/src/cli/post-tool-inspect.cli.ts \
        packages/monorepo-tools/tests/post-tool-inspect-cli.test.ts
git commit -m "fix(cli): emit {result:...} for transform_tool_result hook"
```

---

### Task 4: Update shell script to forward Bun stdout

**Objective:** Make `.hermes/agent-hooks/post-tool-inspect.sh` pass the Bun script's stdout through to Hermes unchanged.

**Files:**
- Modify: `.hermes/agent-hooks/post-tool-inspect.sh`

**Step 1: Update script**

```bash
#!/usr/bin/env bash
# Hermes transform_tool_result hook (repo-local to ethang-monorepo).
# Reads stdin payload, runs post-edit inspections, emits {"result": ...}
# when there are diagnostics, or {} to leave the tool result unchanged.

set -euo pipefail

STDIN_PAYLOAD=$(cat)
CWD=$(echo "$STDIN_PAYLOAD" | jq -r '.cwd // empty')

# Only run in ethang-monorepo
if [[ -z "$CWD" || ! -f "$CWD/package.json" || ! -d "$CWD/packages/monorepo-tools" ]]; then
  echo '{}'
  exit 0
fi

cd "$CWD" || exit 1

# Bun stdout goes directly to Hermes — the script emits either {} or {"result": ...}
echo "$STDIN_PAYLOAD" | bun run packages/monorepo-tools/src/cli/post-tool-inspect.cli.ts
```

**Step 2: Smoke test**

```bash
echo '{"tool_name":"patch","tool_input":{"path":"packages/monorepo-tools/src/application/inspect-after-tool.ts"},"cwd":"C:/Users/glove/projects/ethang-monorepo","extra":{"result":"patch applied"}}' \
  | sh .hermes/agent-hooks/post-tool-inspect.sh
```

Expected: a JSON line (`{}` if no findings, `{"result": "..."}` if diagnostics).

**Step 3: Commit**

```bash
git add .hermes/agent-hooks/post-tool-inspect.sh
git commit -m "fix(hook): forward transformed result from Bun to Hermes"
```

---

### Task 5: Switch hook event in `~/.hermes/config.yaml`

**Objective:** Re-register the hook under `transform_tool_result` so Hermes consumes its stdout.

**Files:**
- Modify: `~/.hermes/config.yaml`

**Step 1: Edit config**

Replace the existing `post_tool_call` entry with:

```yaml
hooks:
  transform_tool_result:
    - matcher: "^(patch|write_file)$"
      command: "sh /c/Users/glove/projects/ethang-monorepo/.hermes/agent-hooks/post-tool-inspect.sh"
      timeout: 20
```

**Step 2: Re-approve the hook** (new `(event, command)` pair)

```bash
hermes hooks list
# Should show the new transform_tool_result entry
# First invocation will prompt approval; or:
HERMES_ACCEPT_HOOKS=1 hermes chat -- -c "edit packages/monorepo-tools/src/application/inspect-after-tool.ts with a trivial whitespace change"
```

**Step 3: Verify end-to-end**

Make a small patch and confirm the model's next turn shows the WebStorm inspection output appended to the tool result.

**Step 4: Commit repo-local bits (no — ~/.hermes is outside repo; no commit needed)**

Document the new event name in AGENTS.md if it mentions the hook.

---

### Task 6: Run full monorepo checks

**Objective:** Confirm no regressions in `@ethang/monorepo-tools`.

**Run:**

```bash
pnpm --filter @ethang/monorepo-tools check
```

Expected: lint clean, tsc clean, all tests pass (old + new).

**Commit (only if something needed fixing):**

```bash
git add -A
git commit -m "chore(monorepo-tools): satisfy post-migration checks"
```

---

## Files Likely to Change

| File | Change |
|------|--------|
| `packages/monorepo-tools/src/application/inspect-after-tool.ts` | Drop `InspectAfterToolResult` envelope; return `string` |
| `packages/monorepo-tools/tests/inspect-after-tool.test.ts` | Rewrite assertions for string return |
| `packages/monorepo-tools/src/cli/post-tool-inspect.cli.ts` | Read `extra.result`, emit `{"result": ...}` |
| `packages/monorepo-tools/tests/post-tool-inspect-cli.test.ts` | New — test `buildTransformedResult` |
| `.hermes/agent-hooks/post-tool-inspect.sh` | Pass Bun stdout through |
| `~/.hermes/config.yaml` | Switch to `transform_tool_result` |
| `AGENTS.md` | Update hook docs to reflect new event |

---

## Verification

1. **Unit:** `pnpm --filter @ethang/monorepo-tools test` — all green.
2. **Integration (manual):** Make any `patch` in `ethang-monorepo`; next model turn should show the appended diagnostics block.
3. **Shell-hook doctor:** `hermes hooks doctor` — hook shows `✓ allowed`, reasonable exec time, valid JSON.
4. **Failure path:** Stop WebStorm MCP (close the IDE) → hook must silently print `{}` and let the tool result through unchanged.

---

## Risks, Tradeoffs, and Open Questions

- **Stale model view of fixed files.** `transform_tool_result` only rewrites the *string* Hermes appends; the model's in-context file snapshot (from the prior `read_file` / tool call) isn't refreshed. If ESLint autofix modified the file beyond what the agent wrote, the model won't see the diff until it calls `read_file` again. Mitigation: include a `Note: ESLint autofix applied; re-read the file to see the current state.` line in the diagnostics block when autofix changed the file.
- **Large tool results.** `patch` diffs can already be long. Appending a 30-line diagnostics block inflates the context. Mitigation: cap diagnostics at ~50 lines, summarize beyond that (future task).
- **Latency budget.** WebStorm MCP round-trips can take 1-3s. `timeout: 20` in the config is generous; if it times out, Hermes emits a warning and passes through. Acceptable.
- **Shell-hook stdout contract for `transform_tool_result`.** The docs show plugin hooks return `str | None`; the shell-hook docs only explicitly document `{decision}`, `{action}`, `{context}` shapes. The `{"result": ...}` shape is the natural mirror but **must be verified at runtime** — if it's not honored, fall back to returning `{}` and writing the diagnostics to a sidecar file (plan B, not planned here).
- **Hermes `cwd` in the payload.** Confirm `cwd` is populated for `transform_tool_result` — the existing `post_tool_call` payload had it, so the shell-hook wire protocol suggests `transform_tool_result` does too. Task 3's smoke test covers this.
- **AGENTS.md drift.** The existing "Hermes Hooks" section still says `post_tool_call`. Update in Task 5 or separately.

---

## Summary

Switching one event name (`post_tool_call` → `transform_tool_result`) and making the Bun CLI honor its stdout contract closes the injection gap. All other changes are mechanical. The model will see post-edit lint/tsc diagnostics inline with the edit result instead of in a separate turn.

---

Plan complete and saved. Ready to execute using subagent-driven-development — I'll dispatch a fresh subagent per task with two-stage review (spec compliance then code quality). Shall I proceed?
