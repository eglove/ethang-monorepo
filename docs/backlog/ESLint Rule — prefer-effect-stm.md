---
tags: [backlog, eslint, eslint-plugin, effect, policy]
status: todo
priority: low
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-effect-stm`

## Goal

Detect mutable `Ref` + compare-and-swap (CAS) patterns and suggest `STM` from Effect.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-effect-stm.ts`
2. Detection: `Ref.get(ref)` followed by conditional check, then `Ref.set(ref, newVal)` in same scope
3. Also detect CAS loops: `while/do...while` reading `Ref.get` then conditionally calling `Ref.set`
4. Report-only ❌ — semantic migration
5. Create unit test and integration test
6. Register in `index.ts`

## Risks

- Must correctly identify `Ref` imports from Effect vs other libraries
- Simple `Ref.set` without preceding `Ref.get` is not a CAS pattern
- Multiple `Ref` instances in the same scope must be tracked independently