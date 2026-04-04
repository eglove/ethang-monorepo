# Briefing: @ethang/store Refactor

**Date:** 2026-04-04
**Status:** SIGNED OFF
**Pipeline:** design-pipeline

---

## Purpose

Modernize `@ethang/store` (BaseStore) by adding reentrant-safe update, `waitFor`, lifecycle methods (`reset`, `destroy`), removing `StoreOptions`/localStorage coupling, and adopting functional error handling throughout. The store shifts from persistence to synchronization — platform-agnostic, capable of representing state machines and aiding event-driven architecture.

## Breaking Changes (Acceptable)

- Remove `StoreOptions` type and all localStorage logic (`getLocalStorage`, `setLocalStorage`, `syncLocalStorage`, `localStorageKey`).
- Constructor simplifies from `constructor(state: State, options?: StoreOptions)` to `constructor(state: State)`.
- Single consumer affected: `PipelineStore` in `packages/design-pipeline` (does not use localStorage).

## Resolved Decisions

### 1. No State-Machine DSL

`waitFor` + reentrant-safe `update` are sufficient to unlock event-driven coordination. Subclasses (like PipelineStore) continue to enforce their own transition guards. No `defineTransitions` API or guard declarations in BaseStore.

### 2. Reentrant-Safe Update

Mutations apply immediately to the immer draft. If `update` is called during notification (reentrant), the inner update's patches are queued. A single notification fires with the fully-settled state after all reentrant calls complete. `onPropertyChange` fires as a derived side-effect within the batch.

### 3. waitFor

```typescript
public waitFor(predicate: (state: State) => boolean, signal?: AbortSignal): Promise<State>
```

- Uses the store's built-in `cleanupSignal` by default for cancellation.
- Also accepts an explicit `AbortSignal` argument as a fallback/override.
- No built-in numeric timeout — callers compose via `AbortSignal.timeout(ms)`.
- Resolves immediately if predicate is already true at call time.
- Returns error result (not rejected promise) if store is destroyed or signal aborts.

### 4. Error During Notification Drain

- Catch all errors during the subscriber notification loop so every subscriber is notified regardless of other subscribers throwing.
- Surface errors via `queueMicrotask`.
- Internal implementation uses functional error handling (`attempt` from lodash) — no try/catch.

### 5. React Hook (useStore)

Keep `useStore` exactly as-is. It delegates to `useSyncExternalStoreWithSelector` and the batched-notification change is invisible to it. No new React hooks for `waitFor` — callers use `waitFor` in effects with `cleanupSignal`.

### 6. Dependency Graphs

Dropped. Immer patches already provide change-path information. Any subclass can filter patches in `onPropertyChange` to build dependency logic if ever needed.

### 7. Dependencies

- **Keep:** immer (with patches), lodash, use-sync-external-store, type-fest.
- **Lodash** is preferred over vanilla methods — keep even though current usages are in localStorage code being removed.

### 8. Lifecycle Hooks

Keep `onFirstSubscriber()` and `onLastSubscriberRemoved()`. Zero-cost when not overridden, already tested, provide clean extension points for resource-lifecycle patterns (connect on mount, disconnect on unmount).

### 9. onPropertyChange

Keep and modernize to fit the batched notification model. Fires as a derived side-effect within the reentrant batch, not per-patch during iteration.

### 10. New Public API: reset()

```typescript
public reset(initialState?: State): void
```

- Accepts an optional new state argument (defaults to the state originally passed to the constructor).
- Notifies all subscribers with the new state.
- Leaves AbortController/cleanupSignal untouched — reset is about data, not subscription lifecycle.

### 11. New Public API: destroy()

```typescript
public destroy(): void
```

- Aborts `cleanupSignal`.
- Clears all subscribers.
- Sets `_destroyed` flag.
- Post-destroy behavior:
  - `update` → silent no-op (safe for in-flight code).
  - `subscribe` → returns error result (no throw) using functional error handling.
  - `waitFor` → returns error result (no rejected promise) using functional error handling.

### 12. Functional Error Handling

Use `attemptAsync` from `@ethang/toolbelt` and `attempt` from lodash throughout. No throwing, no try/catch. Specifically:
- `subscribe` after destroy returns an error value.
- `waitFor` after destroy returns an error result.
- Notification drain catches errors functionally via `attempt`, surfaces via `queueMicrotask`.

### 13. Constructor

Remove `StoreOptions` type entirely. Constructor becomes `constructor(state: State)`. Store internally saves the initial state for use by `reset()`.

### 14. API Surface Summary

**Public:**
- `state` (getter) — read current state
- `subscribe(callback)` — subscribe to changes, returns unsubscribe function
- `waitFor(predicate, signal?)` — async wait for state condition
- `reset(initialState?)` — reset state to initial or provided value
- `destroy()` — teardown store permanently

**Protected:**
- `update(updater, shouldNotify?)` — immer-based state mutation (stays protected by design)
- `cleanupSignal` — AbortSignal tied to subscriber lifecycle
- `onFirstSubscriber()` — optional lifecycle hook
- `onLastSubscriberRemoved()` — optional lifecycle hook
- `onPropertyChange(patch)` — optional derived side-effect hook

**Removed:**
- `StoreOptions` type
- `localStorageKey` option
- `getLocalStorage()`, `setLocalStorage()`, `syncLocalStorage()`
- All localStorage-related imports (lodash `attempt`, `isError`, `isNil` call sites removed, but lodash stays as a dependency)

## Test Strategy

- Keep existing `tests/index.test.ts` and `tests/on-update.test.ts`.
- Add `tests/wait-for.test.ts` for waitFor-specific tests (predicate match, immediate resolve, AbortSignal cancellation, cleanupSignal cancellation, destroyed store).
- Add reentrant-batch and error-drain tests into `index.test.ts` alongside existing update/subscribe blocks.

## Additional Deliverables

- Rewrite `packages/store/README.md` to reflect the new API.

## Critical Agent Instructions

**All agents making file changes MUST run this loop after every change:**

```
test → fix → lint → fix → tsc → fix
```

Test changes can break lint. Lint changes can break tsc. If this isn't actively done for every change, it creates a huge cleanup project afterward. This is NOT optional.

## Codebase Context

- Package: `packages/store/`
- Source: `packages/store/src/index.ts` (~154 lines), `packages/store/src/use-store.ts`
- Tests: `packages/store/tests/index.test.ts`, `packages/store/tests/on-update.test.ts`
- Single consumer: `PipelineStore extends BaseStore` in `packages/design-pipeline/`
- `ethang-hono`'s `GlobalStore` does NOT extend BaseStore (no impact).
