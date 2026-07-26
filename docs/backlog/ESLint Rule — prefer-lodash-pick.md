---
tags: [backlog, eslint, eslint-plugin]
status: todo
priority: medium
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-lodash-pick`

## Goal

Detect object destructuring (`const { a, b } = obj`) and suggest `pick(obj, ["a", "b"])` from lodash.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-lodash-pick.ts`
2. Detection: `VariableDeclarator` with `ObjectPattern` `id` — collect non-rest, non-computed property names
3. Skip nested destructuring (`{ a: { b } }`), rest patterns (that's `omit`), empty patterns
4. Autofix: `pick(<source>, [<keys>])`
5. Create unit test and integration test
6. Register in `index.ts`

## Risks

- Renamed destructuring `const { a: x } = obj` — must use source key `"a"`, not alias `"x"`
- Default values `const { a = 1 } = obj` — still auto-fixable, default is ignored in pick