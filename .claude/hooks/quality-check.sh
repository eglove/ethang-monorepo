#!/usr/bin/env bash
# Runs tests and lint scoped to the package containing the edited file.
# Falls back to full recursive run if the file is outside apps/ or packages/.
# Outputs hookSpecificOutput JSON so Claude sees failures and continues fixing.
# On success, prompts Claude to consult the librarian index for codebase context.

set -uo pipefail

FILE=$(jq -r '.tool_input.file_path')

# Skip quality checks when editing librarian index files — no need to re-run
# tests for documentation-only changes to docs/librarian/.
if echo "$FILE" | grep -qE 'docs/librarian/'; then
  exit 0
fi

REL="${FILE#$CLAUDE_PROJECT_DIR/}"
PKG=$(echo "$REL" | cut -d'/' -f1-2)

# shellcheck disable=SC2164
cd "$CLAUDE_PROJECT_DIR"

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

  jq -n \
    --arg t "$TEST_OUT" \
    --arg l "$LINT_OUT" \
    --arg tsc "$TSC_OUT" \
    --argjson tf "$TF" \
    --argjson lf "$LF" \
    --argjson tscf "$TSCF" \
    '{
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: (
          "QUALITY CHECK FAILED — you MUST fix all issues before continuing. Do not move on, do not skip, do not mark any task complete until every failure below is resolved.\n\n" +
          (if $tf then "TESTS FAILED:\n" + $t + "\n\n" else "" end) +
          (if $lf then "LINT FAILED:\n" + $l + "\n\n" else "" end) +
          (if $tscf then "TYPE CHECK FAILED:\n" + $tsc + "\n\n" else "" end) +
          "Fix the failures above, then re-run the checks. If you are stuck or cannot determine how to fix an issue, stop and ask the user for guidance before proceeding."
        )
      }
    }'
else
  # Quality checks passed — prompt to consult librarian index.
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: "Quality checks passed.\n\nConsult docs/librarian/INDEX.md for codebase context if needed."
    }
  }'
fi
