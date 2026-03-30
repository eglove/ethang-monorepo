#!/usr/bin/env bash
# [Hook name] — [one-line purpose]
# Trigger: [PostToolUse | PreToolUse]
# Event filter (in settings.json): [tool name(s) this hook fires on, or "all"]

set -uo pipefail

# Read tool input from stdin
TOOL_INPUT=$(cat)
FILE=$(echo "$TOOL_INPUT" | jq -r '.tool_input.file_path // empty')

# --- Guard conditions ---
# Skip early if this hook doesn't apply to the current context.
# Example: skip if file is outside a specific directory
# if ! echo "$FILE" | grep -qE 'some/path'; then
#   exit 0
# fi

# --- Hook logic ---
# Replace this block with the actual check or action.
# Capture output and exit code separately so both can be reported.
HOOK_OUT=""
HOOK_CODE=0

# Example:
# HOOK_OUT=$(some-command 2>&1); HOOK_CODE=$?

# --- Output ---
if [ "$HOOK_CODE" -ne 0 ]; then
  jq -n \
    --arg detail "$HOOK_OUT" \
    '{
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: ("HOOK FAILED — [hook name]\n\n" + $detail + "\n\nFix the issue above before continuing.")
      }
    }'
else
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: "[Hook name] passed."
    }
  }'
fi
