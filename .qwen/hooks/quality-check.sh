#!/usr/bin/env bash
# Runs tests and lint scoped to the package containing the edited file.
# Falls back to full recursive run if the file is outside apps/ or packages/.
# Outputs hookSpecificOutput JSON so Qwen sees failures and continues fixing.
# On success, prompts Qwen to review INTERNAL_MAP.md per progressive-mapper guidelines.

set -uo pipefail

# Read JSON input from stdin
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only run for file editing tools
if [[ -z "$FILE_PATH" ]] || [[ "$TOOL_NAME" != "Write" && "$TOOL_NAME" != "Edit" ]]; then
  echo '{"decision": "allow"}'
  exit 0
fi

# Skip quality checks for documentation-only changes
if echo "$FILE_PATH" | grep -qE 'INTERNAL_MAP\.md$|\.md$'; then
  echo '{"decision": "allow"}'
  exit 0
fi

# Determine package scope from file path
REL="${FILE_PATH#*/}"
PKG=$(echo "$REL" | cut -d'/' -f1-2)

# Change to project directory
cd "${INPUT.cwd}" 2>/dev/null || cd "$(pwd)"

# Run scoped or full checks
if echo "$PKG" | grep -qE '^(apps|packages)/'; then
  FILTER="./$PKG"
  TEST_OUT=$(pnpm --filter "$FILTER" test 2>&1); TEST_CODE=$?
  LINT_OUT=$(pnpm --filter "$FILTER" lint 2>&1); LINT_CODE=$?
  TSC_OUT=$(pnpm --filter "$FILTER" exec tsc --noEmit 2>&1); TSC_CODE=$?
else
  TEST_OUT=$(pnpm -r test 2>&1); TEST_CODE=$?
  LINT_OUT=$(pnpm -r lint 2>&1); LINT_CODE=$?
  TSC_OUT=$(pnpm -r exec tsc --noEmit 2>&1); TSC_CODE=$?
fi

if [ "$TEST_CODE" -ne 0 ] || [ "$LINT_CODE" -ne 0 ] || [ "$TSC_CODE" -ne 0 ]; then
  TF=false; LF=false; TSCF=false
  [ "$TEST_CODE" -ne 0 ] && TF=true
  [ "$LINT_CODE" -ne 0 ] && LF=true
  [ "$TSC_CODE" -ne 0 ] && TSCF=true

  # Build failure message
  jq -n \
    --arg t "$TEST_OUT" \
    --arg l "$LINT_OUT" \
    --arg tsc "$TSC_OUT" \
    --argjson tf "$TF" \
    --argjson lf "$LF" \
    --argjson tscf "$TSCF" \
    '{
      decision: "allow",
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: (
          "⚠️ QUALITY CHECK FAILED — you MUST fix all issues before continuing. Do not move on, do not skip, do not mark any task complete until every failure below is resolved.\n\n" +
          (if $tf then "❌ TESTS FAILED:\n" + $t + "\n\n" else "" end) +
          (if $lf then "❌ LINT FAILED:\n" + $l + "\n\n" else "" end) +
          (if $tscf then "❌ TYPE CHECK FAILED:\n" + $tsc + "\n\n" else "" end) +
          "Fix the failures above, then re-run the checks. If you are stuck or cannot determine how to fix an issue, stop and ask the user for guidance before proceeding."
        )
      }
    }'
  exit 2
fi

# Quality checks passed — prompt to maintain the progressive map
jq -n '{
  decision: "allow",
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: "✅ Quality checks passed (lint, type-check, tests).\n\n💡 Review INTERNAL_MAP.md per progressive-mapper guidelines:\n- Add any non-obvious file connections or search hints discovered this session\n- Remove or correct any entries that are now stale or misleading\n- If nothing changed, leave it as-is"
  }
}'
exit 0
