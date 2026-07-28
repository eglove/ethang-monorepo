---
tags: [backlog, eslint, eslint-plugin, effect, policy]
status: todo
priority: low
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-effect-schedule`

## Goal

Detect `setInterval(fn, ms)`. Suggest `Effect.repeat(Schedule.spaced(Duration.millis(ms)))` from Effect.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-effect-schedule.ts`.
2. Detection: `CallExpression` for `setInterval` with a callback and numeric interval.
3. Extract the callback body and interval value.
4. Report-only. The Effect pattern requires different import and execution model.
5. Create unit test and integration test.
6. Register in `index.ts`.

## Risks

- `setInterval(fn, 0)` is a tight loop. The pattern is not a schedule. Exclude this case.
- `clearInterval` paired with `setInterval` adds complexity. The rule cannot easily detect this pattern.
