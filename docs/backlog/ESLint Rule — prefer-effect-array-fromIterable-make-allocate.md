---
tags: [backlog, eslint, eslint-plugin, effect]
status: todo
priority: medium
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-effect-array-fromIterable` / `make` / `allocate`

## Goal

Detect three native array-creation patterns and suggest Effect `Array` equivalents: `[...iter]`/`Array.from()` → `Array.fromIterable`, `Array.from({length:n}, fn)` → `Array.make`, `new Array(n).fill(v)` → `Array.allocate`.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-effect-array-from-iterable.ts` (single file, three messageIds)
2. `fromIterable`: detect `ArrayExpression` with spread or `Array.from(iterable)` call
3. `make`: detect `Array.from({length:n}, (_, i) => fn(i))` or `[...Array(n)].map(fn)`
4. `allocate`: detect `.fill()` on `new Array(n)` or `Array(n)` (without `new`)
5. All three: autofix ✅
6. Create unit test and integration test per sub-pattern
7. Register in `index.ts`

## Risks

- `allocate` must distinguish `new Array(n).fill(value)` from `.fill(value, start, end)` — only flag the simple case
- `make` callback transformation: `(_, i) => fn(i)` may need to preserve parameter position
- `fromIterable` on `[...expr]` where `expr` has side effects must not be autofixed (evaluate-once semantics)