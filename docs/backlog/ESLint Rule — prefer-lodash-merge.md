---
tags: [backlog, eslint, eslint-plugin, lodash, policy]
status: todo
priority: low
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-lodash-merge`

## Goal

Detect hand-rolled recursive merge functions and suggest `merge(a, b)` from lodash.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-lodash-merge.ts`
2. Detection: recursive function iterating object keys with `for...in` or `Object.keys()`, calling itself on nested objects, assigning to a target
3. Distinguish from simple `Object.assign` or spread `{ ...a, ...b }` (those are already handled by `prefer-lodash`)
4. Report-only ❌
5. Create unit test and integration test
6. Register in `index.ts`

## Risks

- Deep merge implementations vary widely — pattern matching must be conservative
- `Object.assign` and spread `...` are not recursive merges — don't flag those
- Some hand-rolled merges include array concatenation or custom conflict resolution — skip those