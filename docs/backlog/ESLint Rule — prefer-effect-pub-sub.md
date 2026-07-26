---
tags: [backlog, eslint, eslint-plugin, effect, policy]
status: todo
priority: low
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-effect-pub-sub`

## Goal

Detect manual pub/sub patterns (array of subscribers with notify loop) and suggest `PubSub` from Effect.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-effect-pub-sub.ts`
2. Detection: array/Set used for subscribers + `.push`/`.add` + `.forEach(fn => fn(data))` pattern
3. Must detect the guard pattern: Ref/Mutex/boolean flag used to protect the subscriber list
4. Report-only ❌
5. Create unit test and integration test
6. Register in `index.ts`

## Risks

- Simple event emitters (Node `EventEmitter`, DOM `addEventListener`) should NOT be flagged — only the manual array-of-callbacks pattern
- Distinguishing pub/sub from simple callback lists is context-dependent