---
tags: [backlog, eslint, eslint-plugin, lodash, policy]
status: todo
priority: medium
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-lodash-debounce` / `throttle` / `memoize`

## Goal

Detect hand-rolled debounce, throttle, and memoize implementations and suggest lodash equivalents.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-lodash-debounce.ts`
2. Debounce detection: `setTimeout`/`clearTimeout` pair with a timer variable that delays function execution
3. Throttle detection: timer + last-call-time tracking using `Date.now()`
4. Memoize detection: manual `Map`/object cache with `has`/`get`/`set` pattern around function calls
5. Autofix ⚠: simple debounce/throttle patterns autofixable; memoize harder
6. Create unit test and integration test
7. Register in `index.ts`

## Risks

- Debounce/throttle patterns are highly variable — pattern matching will be fragile
- Must verify the function being wrapped is actually the one the user intends (not a wrapper around another function)
- React's `useMemo`/`useCallback` are NOT hand-rolled memoize — exclude