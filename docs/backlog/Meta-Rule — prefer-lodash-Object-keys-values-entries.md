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

Extend the umbrella `prefer-lodash` rule. The rule flags `Object.keys(obj)`, `Object.values(obj)`, and `Object.entries(obj)`. Remove the methods from `NATIVE_EQUIVALENT_METHODS`.

## Plan

1. In `packages/eslint-plugin/src/utils/ast.ts`, remove `"keys"`, `"values"`, and `"entries"` from `NATIVE_EQUIVALENT_METHODS`.
2. Verify `lodashApi` already includes `_.keys`, `_.values`, and `_.entries`.
3. Test that `Object.keys(obj)` is flagged with `preferLodash` messageId.
4. Verify no regressions.
5. Run the full eslint-plugin test suite.

## Risks

- `Object.keys` is ubiquitous in JavaScript. Flagging ALL instances is a major policy shift.
- `Object.entries` combined with array methods (`.map`, `.filter`) is extremely common. The lodash equivalents have different ergonomics.
- Backlog gotcha #7: "Open policy question". The user needs to make a decision before proceeding.
- This is the inverse of the policy trend (lodash to native). The backlog prefers lodash forms.
