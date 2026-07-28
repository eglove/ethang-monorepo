---
tags: [backlog, eslint, eslint-plugin, lodash]
status: todo
priority: medium
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-lodash-sortBy` / `prefer-lodash-orderBy`

## Goal

Detect `arr.sort((a, b) => a.x - b.x)`. Suggest `sortBy(arr, "x")` or `orderBy(arr, ["x"], ["asc"])`. Also cover ES2023 non-mutating `toSorted`.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-lodash-sort-by.ts`.
2. `sortBy`: detect simple single-property comparisons in `.sort()` callback.
3. `orderBy`: detect multi-field sorting in `.sort()` callback.
4. Numeric subtraction maps to sortBy. String localeCompare maps to sortBy or orderBy.
5. Descending order maps to `orderBy(arr, ["x"], ["desc"])`.
6. `toSorted((a, b) => ...)` maps to equivalent autofix. Convert data-first to data-last.
7. Autofix: simple single-property sorts are autofixable. Multi-field comparators are report-only.
8. Create unit test and integration test.
9. Register in `index.ts`.

## Risks

- The sort callback body may span multiple lines. The body may contain intermediate variables.
- `localeCompare` with sensitivity options cannot be auto-fixed.
- `toSorted` is not mutating. The data-first to data-last conversion (`sortBy(arr, ...)` vs `arr.toSorted(...)`) is correct. The conversion may surprise users.
