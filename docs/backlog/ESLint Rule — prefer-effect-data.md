---
tags: [backlog, eslint, eslint-plugin, effect, policy]
status: todo
priority: low
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-effect-data`

## Goal

Detect hand-rolled error classes extending `Error` and suggest `Data.TaggedError` / `Data.TaggedClass` from Effect.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-effect-data.ts`
2. Detection: `ClassDeclaration` with `extends` clause resolving to `Error` or error subtypes
3. Only flag simple error classes (constructor + maybe a property or two, no methods)
4. Report-only ❌ — changing error class hierarchy touches all catch sites
5. Create unit test and integration test
6. Register in `index.ts`

## Risks

- Complex error classes with methods or custom serialization should not be flagged
- Some error classes exist for library compatibility, not internal use
- Must verify the `extends` clause actually resolves to `Error` (could be a local class named `Error`)