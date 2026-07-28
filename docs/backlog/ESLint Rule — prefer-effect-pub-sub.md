---
tags: [backlog, eslint, eslint-plugin, effect, policy]
status: todo
priority: low
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-effect-pub-sub`

## Goal

Detect manual pub/sub patterns. The pattern uses an array of subscribers with a notify loop. Suggest `PubSub` from Effect.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-effect-pub-sub.ts`.
2. Detection: array or Set used for subscribers. The code uses `.push`/`.add`. The code uses `.forEach(fn => fn(data))`.
3. The rule must detect the guard pattern. The guard uses a Ref or Mutex or boolean flag to protect the subscriber list.
4. Report-only.
5. Create unit test and integration test.
6. Register in `index.ts`.

## Risks

- The rule must NOT flag simple event emitters. Node `EventEmitter` and DOM `addEventListener` are not manual patterns. Flag only the manual array-of-callbacks pattern.
- Distinguishing pub/sub from simple callback lists depends on context.
