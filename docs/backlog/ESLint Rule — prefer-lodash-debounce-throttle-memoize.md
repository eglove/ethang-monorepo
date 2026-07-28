---
tags: [backlog, eslint, eslint-plugin, lodash, policy]
status: todo
priority: medium
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-lodash-debounce` / `throttle` / `memoize`

## Goal

Detect hand-rolled debounce, throttle, and memoize implementations. Suggest lodash equivalents.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-lodash-debounce.ts`.
2. Debounce detection: `setTimeout`/`clearTimeout` pair with a timer variable. The timer delays function execution.
3. Throttle detection: timer and last-call-time tracking using `Date.now()`.
4. Memoize detection: manual `Map`/object cache with `has`/`get`/`set` pattern around function calls.
5. Autofix: simple debounce and throttle patterns are autofixable. Memoize is harder.
6. Create unit test and integration test.
7. Register in `index.ts`.

## Risks

- Debounce and throttle patterns are highly variable. Pattern matching will be fragile.
- The rule must verify the function being wrapped is the intended function. The rule must not wrap another function.
- React `useMemo` and `useCallback` are NOT hand-rolled memoize. Exclude these patterns.
