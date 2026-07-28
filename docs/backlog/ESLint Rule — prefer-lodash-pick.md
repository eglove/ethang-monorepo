---
tags: [backlog, eslint, eslint-plugin]
status: todo
priority: medium
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-lodash-pick`

## Goal

Detect object destructuring (`const { a, b } = obj`). Suggest `pick(obj, ["a", "b"])` from lodash.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-lodash-pick.ts`.
2. Detection: `VariableDeclarator` with `ObjectPattern` `id`. Collect non-rest, non-computed property names.
3. Skip nested destructuring (`{ a: { b } }`). Skip rest patterns (that is `omit`). Skip empty patterns.
4. Autofix: `pick(<source>, [<keys>])`.
5. Create unit test and integration test.
6. Register in `index.ts`.

## Risks

- Renamed destructuring `const { a: x } = obj`. The rule must use source key `"a"`. The rule must not use alias `"x"`.
- Default values `const { a = 1 } = obj`. The autofix is still valid. The default is ignored in pick.
