---
tags: [backlog, eslint, eslint-plugin, effect, policy]
status: todo
priority: low
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-effect-tracer`

## Goal

Detect manual `performance.now()` span measurements and suggest `Effect.withSpan("name")` from Effect.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-effect-tracer.ts`
2. Detection: `performance.now()` call assigned to variable, later used in subtraction `performance.now() - start` with logging
3. Also detect `performance.mark("start")` / `performance.measure(...)` patterns
4. Report-only ❌
5. Create unit test and integration test
6. Register in `index.ts`

## Risks

- Isolated `performance.now()` calls (e.g., seeding RNG) should NOT be flagged
- The `start` variable may be used in multiple span calculations — flag each pair
- `console.time`/`console.timeEnd` are related but different — should they be covered too?