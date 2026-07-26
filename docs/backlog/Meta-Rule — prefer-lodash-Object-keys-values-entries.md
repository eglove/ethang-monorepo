---
tags: [backlog, eslint, eslint-plugin, lodash, meta]
status: todo
priority: low
created: 2026-07-26
requires-decision: true
related: [ESLint — Make Private, Stop Publishing]
---

# Meta-Rule Extension: `prefer-lodash` on `Object.keys` / `values` / `entries`

> **Not a new rule.** Extension to the umbrella `prefer-lodash` rule. **Requires explicit user buy-in.**

## Goal

Extend the umbrella `prefer-lodash` rule to flag `Object.keys(obj)`, `Object.values(obj)`, `Object.entries(obj)` by removing them from `NATIVE_EQUIVALENT_METHODS`.

## Plan

1. In `packages/eslint-plugin/src/utils/ast.ts`, remove `"keys"`, `"values"`, and `"entries"` from `NATIVE_EQUIVALENT_METHODS`
2. Verify `lodashApi` already includes `_.keys`, `_.values`, `_.entries`
3. Test that `Object.keys(obj)` is now flagged with `preferLodash` messageId
4. Verify no regressions
5. Run full eslint-plugin test suite

## Risks

- `Object.keys` is ubiquitous in JavaScript — flagging ALL instances is a major policy shift
- `Object.entries` combined with array methods (`.map`, `.filter`) is extremely common and the lodash equivalents have different ergonomics
- Backlog gotcha #7: "Open policy question" — needs user decision before proceeding
- This is the inverse of the policy trend (lodash → native); the backlog prefers lodash forms