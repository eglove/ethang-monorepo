---
tags: [backlog, eslint, eslint-plugin, effect]
status: todo
priority: medium
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-effect-order`

## Goal

Detect manual comparison functions (`a.x < b.x ? -1 : a.x > b.x ? 1 : 0`) and suggest `Order.make(...)` / `Order.number` from Effect.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-effect-order.ts`
2. Detection: nested ternary or if-else returning -1, 1, 0 based on property comparisons
3. Also detect `a.localeCompare(b)` → `Order.string`
4. Check for `a - b` in sort context (covered by `prefer-lodash-sortBy` — don't duplicate)
5. Report-only ❌
6. Create unit test and integration test
7. Register in `index.ts`

## Risks

- Must not conflict with `prefer-lodash-sortBy` which already handles sort callbacks
- Ternary chains with more than 2 branches (3 or more conditions) are not simple Order patterns
- The `-1`/`1`/`0` convention must be exact — other comparison return values are not Order patterns