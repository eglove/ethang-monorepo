---
tags: [backlog, eslint, eslint-plugin, effect]
status: todo
priority: medium
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-effect-order`

## Goal

Detect manual comparison functions. The functions use `a.x < b.x ? -1 : a.x > b.x ? 1 : 0`. Suggest `Order.make(...)` / `Order.number` from Effect.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-effect-order.ts`.
2. Detection: nested ternary or if-else returning -1, 1, 0. The return values are based on property comparisons.
3. Also detect `a.localeCompare(b)`. Suggest `Order.string`.
4. Check for `a - b` in sort context. The pattern is covered by `prefer-lodash-sortBy`. Do not duplicate.
5. Report-only.
6. Create unit test and integration test.
7. Register in `index.ts`.

## Risks

- The rule must not conflict with `prefer-lodash-sortBy`. That rule already handles sort callbacks.
- Ternary chains have more than 2 branches. The chains have 3 or more conditions. The chains are not simple Order patterns.
- The `-1`/`1`/`0` convention must be exact. Other comparison return values are not Order patterns.
