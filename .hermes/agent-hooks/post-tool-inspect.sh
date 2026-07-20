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
cd "$CWD" || exit 1

# Forward payload to Bun script
echo "$STDIN_PAYLOAD" | bun run packages/monorepo-tools/src/cli/post-tool-inspect.cli.ts
