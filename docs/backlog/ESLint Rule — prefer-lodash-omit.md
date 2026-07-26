---
tags: [backlog, eslint, eslint-plugin]
status: todo
priority: medium
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-lodash-omit`

## Goal

Detect `const { a, ...rest } = obj` and suggest `omit(obj, ["a"])` from lodash.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-lodash-omit.ts`
2. Detection: `VariableDeclarator` with `ObjectPattern` `id` containing exactly one `RestElement`
3. Collect non-rest property names for the omit list
4. Use rest element's argument as the result identifier
5. Autofix: `const <restName> = omit(<source>, [<omitKeys>])`
6. Skip if no rest element (that's `pick`), or nested patterns
7. Create unit test and integration test
8. Register in `index.ts`

## Risks

- Computed property keys in non-rest positions should be skipped
- Must handle cases where rest identifier is already declared (shadowing)