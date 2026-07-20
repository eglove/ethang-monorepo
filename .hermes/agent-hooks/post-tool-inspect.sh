#!/usr/bin/env bash
# Hermes transform_tool_result hook (repo-local to ethang-monorepo).
# Reads stdin JSON, runs ESLint fix + WebStorm inspection, emits
# {"result": "<original>\n\n<diagnostics>"} or {} to pass through.

set -euo pipefail

STDIN_PAYLOAD=$(cat)
CWD=$(echo "$STDIN_PAYLOAD" | jq -r '.cwd // empty')

# Only run in ethang-monorepo
if [[ -z "$CWD" || ! -f "$CWD/package.json" || ! -d "$CWD/packages/monorepo-tools" ]]; then
  echo '{}'
  exit 0
fi

cd "$CWD" || exit 1

# Bun script emits either {} or {"result": "..."} — forward unchanged to Hermes.
echo "$STDIN_PAYLOAD" | bun run packages/monorepo-tools/src/cli/post-tool-inspect.cli.ts
