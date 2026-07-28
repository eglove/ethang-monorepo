---
tags: [backlog, eslint, eslint-plugin, effect, policy]
status: todo
priority: low
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-effect-data`

## Goal

Detect hand-rolled error classes that extend `Error`. Suggest `Data.TaggedError` / `Data.TaggedClass` from Effect.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-effect-data.ts`.
2. Detection: `ClassDeclaration` with `extends` clause. The clause resolves to `Error` or error subtypes.
3. Flag only simple error classes. The class has a constructor and maybe one or two properties. The class has no methods.
4. Report-only. Changing error class hierarchy touches all catch sites.
5. Create unit test and integration test.
6. Register in `index.ts`.

## Risks

- Complex error classes have methods or custom serialization. The rule must not flag those classes.
- Some error classes exist for library compatibility. The classes are not for internal use.
- The rule must verify the `extends` clause resolves to `Error`. The clause could be a local class named `Error`.
