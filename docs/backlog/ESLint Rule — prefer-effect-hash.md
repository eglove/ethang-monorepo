---
tags: [backlog, eslint, eslint-plugin, effect]
status: todo
priority: medium
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-effect-hash`

## Goal

Detect primary-key comparisons in maps/sets and suggest `Hash.hash(a) === Hash.hash(b)` from Effect for structural equality.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-effect-hash.ts`
2. Detection: equality (`===`, `!==`) comparisons where operands are used in `Map.get`/`Map.set`/`Set.has` patterns
3. Look for variable identifiers that appear as Map keys or Set entries being compared in the same scope
4. Report-only ❌
5. Create unit test and integration test
6. Register in `index.ts`

## Risks

- `===` comparisons on primitives (number, string) don't need `Hash.hash`
- Must verify the identifier actually resolves to a complex object (not just any variable)
- Scope analysis needed to track variable usage across statements