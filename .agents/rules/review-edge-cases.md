---
description: reviewing a pull request or diff
trigger: model_decision
---

# Review Edge Cases

## No PR description

When `gh pr view` returns an empty or missing body: note in the verdict that the PR lacks a description. Flag as a non-blocking documentation finding. Proceed with review using only the diff and branch name as context.

## Draft PR

When `gh pr view` shows `isDraft: true`: note in the review output. Reduce the blocking threshold — treat High findings as advisory rather than blocking unless the author requests a full blocking review. State explicitly: "This is a draft PR — findings are advisory."

## Very large PR (>2000 lines)

Warn the user before proceeding: "This PR changes more than 2000 lines. Review accuracy may be reduced. Consider splitting the PR." Split the diff per-file when passing to individual review perspectives — do not pass the full diff as a single blob to each perspective.

## CI already red

Capture CI status from `gh pr checks {number}`. Flag pre-existing failures separately from review findings with the label "Pre-existing CI failure." Do not let CI failures block posting review findings — but call them out prominently in the verdict block.

## Config-only PR

When the diff contains only config or build files (`*.json`, `*.toml`, `*.jsonc`, `wrangler.jsonc`, lockfiles, `tsconfig.json`): skip correctness and component review perspectives. Run Security and Architecture perspectives only.
