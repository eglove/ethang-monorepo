---
tags: [backlog, eslint, eslint-plugin, effect, policy]
status: todo
priority: low
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-effect-pool`

## Goal

Detect manual resource-limiting patterns. The patterns use a counting semaphore or an array-based queue. Suggest `Pool.make` / `KeyedPool.make` from Effect.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-effect-pool.ts`.
2. Detection: array-based queue with length check (`if (active < max)`). The code uses `shift`/`push` operations.
3. Also detect increment/decrement counter semaphore patterns.
4. Report-only.
5. Create unit test and integration test.
6. Register in `index.ts`.

## Risks

- Simple `Promise.all` with array of promises is NOT a pool pattern.
- Array-based queues may be general-purpose data structures. The queues are not resource pools.
- The rule must distinguish task queues from other array-based patterns.
