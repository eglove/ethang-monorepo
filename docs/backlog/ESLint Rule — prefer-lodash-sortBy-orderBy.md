---
tags: [backlog, eslint, eslint-plugin, lodash]
status: todo
priority: medium
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-lodash-sortBy` / `prefer-lodash-orderBy`

## Goal

Detect `arr.sort((a, b) => a.x - b.x)` and suggest `sortBy(arr, "x")` or `orderBy(arr, ["x"], ["asc"])`. Also cover ES2023 non-mutating `toSorted`.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-lodash-sort-by.ts`
2. `sortBy`: detect simple single-property comparisons in `.sort()` callback
3. `orderBy`: detect multi-field sorting in `.sort()` callback
4. Numeric subtraction → sortBy; string localeCompare → sortBy or orderBy
5. Descending order → `orderBy(arr, ["x"], ["desc"])`
6. `toSorted((a, b) => ...)` → equivalent autofix with data-first→data-last conversion
7. Autofix ⚠: simple single-property sorts autofixable; multi-field comparators report-only
8. Create unit test and integration test
9. Register in `index.ts`

## Risks

- `sort` callback body may span multiple lines with intermediate variables
- `localeCompare` with sensitivity options can't be auto-fixed
- `toSorted` is not mutating — data-first to data-last conversion (`sortBy(arr, ...)` vs `arr.toSorted(...)`) is correct but may surprise users