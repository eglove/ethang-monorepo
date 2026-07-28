---
tags: [backlog, eslint, eslint-plugin, effect]
status: todo
priority: medium
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-effect-duration-millis`

## Goal

Detect time-duration arithmetic patterns. The patterns use `n * 1000` in `setTimeout`/`Date.now()` contexts. Suggest Effect `Duration.millis(n)` / `Duration.seconds(n)`.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-effect-duration-millis.ts`.
2. Detection: multiplication by `1000` or `1_000`. The multiplication exists in `setTimeout(fn, n * 1000)` or `setInterval(fn, n * 1000)`.
3. Also detect `Date.now() - ts` patterns.
4. Variables named `duration`, `timeout`, `delay`, `millis`, `ms` use multiply-by-1000 pattern.
5. Autofix: `setTimeout(fn, n * 1000)` becomes `setTimeout(fn, Duration.seconds(n))`. Date subtraction is report-only.
6. Create unit test and integration test.
7. Register in `index.ts`.

## Risks

- `Duration.seconds(n)` returns `Duration`. The type is not `number`. `setTimeout` expects `number`. The autofix may produce invalid code. Users must also convert the call site. Verify `setTimeout` can accept `Duration`. The Effect runtime may override it.
- `n * 1000` may be `n * 1000 * 60` for minutes. Detect only single-level multiplication initially.
