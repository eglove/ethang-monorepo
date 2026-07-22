#!/usr/bin/env bash
set -euo pipefail

STDIN_PAYLOAD=$(cat)
CWD=$(echo "$STDIN_PAYLOAD" | jq -r '.cwd // empty')

# Only run in target repo
if [[ -z "$CWD" || ! -f "$CWD/package.json" || ! -d "$CWD/packages/monorepo-tools" ]]; then
  echo '{}'
  exit 0
fi

# Run the file-check CLI from the monorepo root so bun can resolve the module
# cd first, then pipe stdin to bun
(cd "$CWD" && echo "$STDIN_PAYLOAD" | bun run packages/monorepo-tools/src/cli/file-check.ts)
