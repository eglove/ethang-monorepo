# PostToolUse WebStorm Inspector Hook

`postToolUse` hook that runs `eslint --fix` against the changed file
(flat-config auto-discovery picks up the right workspace's
`eslint.config.*`) and then calls the running WebStorm MCP server
(`http://127.0.0.1:64506/sse`) to surface remaining diagnostics as
`additionalContext` after every `edit` / `create` tool call.

## Files

- `.github/hooks/post-tool-inspect.json` — hook config (matcher, command, timeout).
- `packages/monorepo-tools/src/cli/post-tool-inspect.cli.ts` — active Bun/TypeScript hook handler.

## Payload shape

```text
stdin (PostToolUse):
{
  toolName: "edit" | "create",
  toolArgs: <JSON-encoded string containing { path, old_str, new_str, ... }>,
  cwd: "<repo root>",
  sessionId, timestamp, toolResult: { resultType, textResultForLlm }
}
```

`toolArgs` is a *string* of JSON, not a JS object — the TypeScript handler
validates and decodes it before reading the file path.

## stdout envelope

```json
{ "additionalContext": "WebStorm MCP inspections for `<file>`:\n- ..." }
```

Empty envelope `{}` is emitted when nothing changed, the file path is
missing, or WebStorm reports zero diagnostics.

## Limitations

- Requires WebStorm to be running with its MCP server on port 64506.
- Timeout is bounded by the `timeoutSec` in the hook config (15s); the
  eslint step is capped at 10s so the WebStorm call still gets a turn.
- Only fires for `edit` and `create` tool names; broaden the matcher to
  receive other events.
- The eslint step is best-effort: failures are swallowed so the hook
  always emits the WebStorm diagnostics (or an empty envelope).
