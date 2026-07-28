---
tags: [backlog, eslint, eslint-plugin, lodash, meta]
status: todo
priority: low
created: 2026-07-26
requires-decision: true
related: [ESLint — Make Private, Stop Publishing]
---

# Meta-Rule Extension: `prefer-lodash` on `arr.head()` / `arr.last()`

> **Not a new rule.** Extension to the umbrella `prefer-lodash` rule. **Requires explicit user buy-in.**

## Goal

Extend the umbrella `prefer-lodash` rule. The rule flags `arr.at(0)` and suggests `head(arr)`. The rule flags `arr.at(-1)` and suggests `last(arr)`. Remove `at` from `NATIVE_EQUIVALENT_METHODS`.

## Plan

1. In `packages/eslint-plugin/src/utils/ast.ts`, remove `"at"` from `NATIVE_EQUIVALENT_METHODS`.
2. Verify `lodashApi` already includes `head` and `last`.
3. Test that `arr.at(0)` is flagged with `preferLodash` messageId.
4. Test that `arr.at(-1)` is flagged.
5. Verify no regressions in existing tests.
6. Run the full eslint-plugin test suite.

## Risks

- **Global policy shift**: removing `at` from `NATIVE_EQUIVALENT_METHODS` flags ALL `.at()` calls in the codebase. The rule does not flag only `at(0)` and `at(-1)`.
- `arr.at(2)` is not equivalent to `head` or `last`. The umbrella rule needs `nativeAliases` entries. The entries map specific `at` call patterns to the right lodash function.
- Backlog gotcha #7 explicitly notes this needs user buy-in before proceeding.
