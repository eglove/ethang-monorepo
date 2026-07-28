---
tags: [backlog, eslint, eslint-plugin, effect, policy]
status: todo
priority: low
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-effect-stm`

## Goal

Detect mutable `Ref` and compare-and-swap (CAS) patterns. Suggest `STM` from Effect.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-effect-stm.ts`.
2. Detection: `Ref.get(ref)` followed by conditional check. Then `Ref.set(ref, newVal)` in same scope.
3. Also detect CAS loops: `while`/`do...while` reading `Ref.get`. Then conditionally call `Ref.set`.
4. Report-only. The migration is semantic.
5. Create unit test and integration test.
6. Register in `index.ts`.

## Risks

- The rule must identify `Ref` imports from Effect. The rule must not identify `Ref` from other libraries.
- Simple `Ref.set` without preceding `Ref.get` is not a CAS pattern.
- Multiple `Ref` instances in the same scope must be tracked independently.
