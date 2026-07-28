---
tags: [backlog, eslint, eslint-plugin, effect]
status: todo
priority: medium
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-effect-array-fromIterable` / `make` / `allocate`

## Goal

Detect three native array-creation patterns. Suggest Effect `Array` equivalents. Pattern `[...iter]` or `Array.from()` becomes `Array.fromIterable`. Pattern `Array.from({length:n}, fn)` becomes `Array.make`. Pattern `new Array(n).fill(v)` becomes `Array.allocate`.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-effect-array-from-iterable.ts`. Use a single file with three messageIds.
2. `fromIterable`: detect `ArrayExpression` with spread or `Array.from(iterable)` call.
3. `make`: detect `Array.from({length:n}, (_, i) => fn(i))` or `[...Array(n)].map(fn)`.
4. `allocate`: detect `.fill()` on `new Array(n)` or `Array(n)` (without `new`).
5. All three: autofix.
6. Create unit test and integration test per sub-pattern.
7. Register in `index.ts`.

## Risks

- `allocate` must distinguish `new Array(n).fill(value)` from `.fill(value, start, end)`. Flag only the simple case.
- `make` callback transformation: `(_, i) => fn(i)` may need to preserve parameter position.
- `fromIterable` on `[...expr]` where `expr` has side effects must not be autofixed. The pattern requires evaluate-once semantics.
