---
tags: [backlog, eslint, eslint-plugin, effect, policy]
status: todo
priority: low
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-effect-tracer`

## Goal

Detect manual `performance.now()` span measurements. Suggest `Effect.withSpan("name")` from Effect.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-effect-tracer.ts`.
2. Detection: `performance.now()` call assigned to variable. Later the code uses subtraction `performance.now() - start` with logging.
3. Also detect `performance.mark("start")` and `performance.measure(...)` patterns.
4. Report-only.
5. Create unit test and integration test.
6. Register in `index.ts`.

## Risks

- Isolated `performance.now()` calls are not span measurements. The calls seed RNG. The rule must NOT flag those calls.
- The `start` variable may be used in multiple span calculations. Flag each pair.
- `console.time` and `console.timeEnd` are related but different. The rule must decide whether to cover those patterns.
