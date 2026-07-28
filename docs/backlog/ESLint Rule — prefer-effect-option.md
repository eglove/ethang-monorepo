---
tags: [backlog, eslint, eslint-plugin, effect, policy]
status: todo
priority: medium
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-effect-option`

## Goal

Detect `T | null` and `T | undefined` in type signatures. Suggest `Option<T>` from Effect.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-effect-option.ts`.
2. Detection: `TSUnionType` nodes containing `TSNullKeyword` or `TSUndefinedKeyword`.
3. Visit: function parameters, return types, type aliases, interface properties, and variable type annotations.
4. Report-only. Changing types touches every consumer. Never autofix.
5. Create unit test and integration test.
6. Register in `index.ts`.

## Risks

- `T | null` where `T` is a generic may already include nullable.
- `string | number` is NOT an Option pattern.
- Third-party type declarations must be excluded.
