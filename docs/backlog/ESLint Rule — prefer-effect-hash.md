---
tags: [backlog, eslint, eslint-plugin, effect]
status: todo
priority: medium
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-effect-hash`

## Goal

Detect primary-key comparisons in maps and sets. Suggest `Hash.hash(a) === Hash.hash(b)` from Effect. The function provides structural equality.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-effect-hash.ts`.
2. Detection: equality (`===`, `!==`) comparisons. The operands are used in `Map.get`/`Map.set`/`Set.has` patterns.
3. Look for variable identifiers. The identifiers appear as Map keys or Set entries. The identifiers are compared in the same scope.
4. Report-only.
5. Create unit test and integration test.
6. Register in `index.ts`.

## Risks

- `===` comparisons on primitives (number, string) do not need `Hash.hash`.
- The rule must verify the identifier resolves to a complex object. The identifier must not be any variable.
- The rule needs scope analysis. The analysis tracks variable usage across statements.
