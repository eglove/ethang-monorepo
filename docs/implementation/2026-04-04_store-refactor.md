# Implementation Plan: @ethang/store Refactor

## Source Artifacts

| Artifact | Path |
|----------|------|
| Briefing | `docs/questioner-sessions/2026-04-04_store-refactor.md` |
| Design Consensus | `docs/debate-moderator-sessions/2026-04-04_store-refactor.md` |
| TLA+ Specification | `docs/tla-specs/store-refactor/StoreRefactor.tla` |
| TLA+ Review Consensus | `docs/debate-moderator-sessions/2026-04-04_store-refactor-tla-re-review.md` |

## TLA+ State Coverage Matrix

### States

- `ACTIVE` (destroyed = FALSE) — store is alive and operational
- `DESTROYED` (destroyed = TRUE) — store has been permanently torn down
- `IDLE` (draining = FALSE) — no notification drain in progress
- `DRAINING` (draining = TRUE, pendingNotify non-empty) — subscriber notification loop active
- `QUEUED` (draining = TRUE, patchQueue non-empty) — reentrant update patches waiting
- `DEPTH_OVERFLOW` (depthOverflow = TRUE) — reentrancy guard exceeded
- `DRAIN_ABORT_ON_DESTROY` (draining = TRUE, destroyed = TRUE, pendingNotify non-empty) — drain stuck post-destroy, must abort
- Waiter states: `pending` (in waiters, not resolved), `ok` (resolved successfully), `error` (resolved with error)

### Transitions

- `Subscribe(s)` — add subscriber, fire onFirstSubscriber if first, create new AbortController
- `SubscribeAfterDestroy(s)` — post-destroy subscribe returns no-op unsubscribe (UNCHANGED)
- `Unsubscribe(s)` — remove subscriber, fire onLastSubscriberRemoved and abort cleanupSignal if last
- `Update(newState)` — non-reentrant update: apply state, start drain loop
- `ReentrantUpdate(newState)` — update during drain: queue patch, increment depth
- `DepthOverflowAction` — reentrancy depth >= MaxReentrantDepth, surface error via queueMicrotask
- `DrainNotify(s)` — notify one subscriber (checks ~destroyed before each callback)
- `DrainComplete` — drain loop ends: dequeue next patch or exit; checks ~destroyed before applying queued patches
- `DrainAbortOnDestroy` — drain stuck post-destroy: clear pendingNotify, patchQueue, exit drain
- `Reset` — reset to initialState (reentrant-safe: enqueues during drain)
- `ResetWithState(newInitial)` — reset with provided state (reentrant-safe)
- `Destroy` — set destroyed, abort cleanupSignal, clear subscribers
- `DoubleDestroy` — second destroy is no-op (UNCHANGED)
- `UpdateAfterDestroy` — post-destroy update is silent no-op (UNCHANGED)
- `WaitForStart(w)` — begin waiting, predicate not yet satisfied
- `WaitForImmediate(w)` — predicate already true, resolve immediately with "ok"
- `WaitForResolve(w)` — state matches predicate, resolve with "ok"
- `WaitForAlreadyAborted(w)` — signal pre-aborted, return "error" immediately
- `WaitForSignalAbort(w)` — signal aborts while waiting, resolve with "error"
- `WaitForDestroyError(w)` — store destroyed while waiting, resolve with "error"
- `WaitForAfterDestroy(w)` — new waitFor call post-destroy, return "error" immediately
- `WaitForPredicateError(w)` — predicate throws, return "error"
- `AbortSignal(w)` — mark a signal as pre-aborted (environment action)

### Safety Invariants

- `TypeOK` — all variables within declared type domains
- `PostDestroyNoNotifications` — destroyed => subscribers = {} (no post-destroy notifications)
- `ReentrantDepthBounded` — reentrantDepth <= MaxReentrantDepth
- `PendingNotifyValid` — pendingNotify is a subset of SubscriberIds
- `WaiterResultConsistent` — resolved waiters have definite result ("ok" or "error")
- `WaiterActiveNotResolved` — active waiters are not yet resolved

### Liveness Properties

- `DrainTerminates` — draining ~> (~draining or destroyed)
- `PostDestroyDrainTerminates` — (destroyed and draining) ~> ~draining
- `WaitForResolves` — every active waiter eventually resolves or store is destroyed

---

## Implementation Steps

### Step 1: Remove localStorage and simplify constructor

**Files:**
- `packages/store/src/index.ts` (modify)

**Description:**
Remove the `StoreOptions` type, the `_options` field, and all three localStorage methods (`getLocalStorage`, `setLocalStorage`, `syncLocalStorage`). Remove the `isNil` import. Simplify the constructor to `constructor(state: State)` and save the initial state in a new `_initialState` field for use by `reset()`. Remove the `this.setLocalStorage()` call from `update`. This eliminates platform coupling and establishes the simplified constructor that the rest of the refactor builds on.

**Dependencies:** None

**Test (write first):**
Update the `ConcreteStore` constructors in `tests/index.test.ts` and `tests/on-update.test.ts` if needed (current tests already pass `initialState` without options). Write a test asserting that `new ConcreteStore(initialState)` works without a second argument and that no localStorage globals are accessed. The existing test suite should pass unchanged since no test uses localStorage.

**TLA+ Coverage:**
- State: `ACTIVE` (Init — initialState = state)
- Variable: `initialState` (saved at construction)
- Transition: constructor initialization maps to `Init`

**CRITICAL: After every file change, run: test -> fix -> lint -> fix -> tsc -> fix**

---

### Step 2: Add `_destroyed` flag, `destroy()` method, and post-destroy guards

**Files:**
- `packages/store/src/index.ts` (modify)
- `packages/store/tests/index.test.ts` (modify)

**Description:**
Add `_destroyed: boolean` field (initially false). Implement `destroy()`: sets `_destroyed = true`, calls `this._controller.abort("destroy")`, clears `this._subscribers`. Add a `destroyed` public getter. Guard `subscribe` post-destroy to return a no-op unsubscribe (not an error result — preserves useStore contract). Guard `update` post-destroy as a silent no-op. Ensure double `destroy()` is a no-op (check `_destroyed` first).

**Dependencies:** Step 1

**Test (write first):**
In `tests/index.test.ts`, add a `describe("destroy")` block:
- Test that `destroy()` sets `store.destroyed` to true.
- Test that `destroy()` aborts cleanupSignal.
- Test that after destroy, `subscribe` returns a function (not an error) and calling that function is a no-op.
- Test that after destroy, calling `update` (via a public method like `increment`) does not change state.
- Test that double `destroy()` does not throw.
- Test that after destroy, `subscribers` are cleared (subscribe a mock, destroy, increment — mock not called).

**TLA+ Coverage:**
- State: `DESTROYED` (destroyed = TRUE)
- Transition: `Destroy` — set destroyed, abort cleanupSignal, clear subscribers
- Transition: `DoubleDestroy` — no-op when already destroyed
- Transition: `SubscribeAfterDestroy(s)` — returns no-op unsubscribe
- Transition: `UpdateAfterDestroy` — silent no-op
- Invariant: `PostDestroyNoNotifications` — destroyed => subscribers = {}

**CRITICAL: After every file change, run: test -> fix -> lint -> fix -> tsc -> fix**

---

### Step 3: Reentrant-safe update with batched notification drain loop

**Files:**
- `packages/store/src/index.ts` (modify)
- `packages/store/tests/index.test.ts` (modify)

**Description:**
Replace the current `update` method with a reentrant-safe version. Add fields: `_isDraining: boolean`, `_patchQueue: Array<(draft: State) => void>`, `_reentrantDepth: number`. When `update` is called and not draining: apply the updater via immer, set `_isDraining = true`, fire `onPropertyChange` for each patch, then notify all subscribers. If a subscriber or `onPropertyChange` triggers another `update` (reentrant): queue the updater in `_patchQueue` and increment `_reentrantDepth`. After notifying all subscribers, check `_patchQueue`: if non-empty and `~destroyed`, dequeue and apply the next updater, re-notify all subscribers. Repeat until queue is empty. Add depth guard: if `_reentrantDepth >= 100`, set a flag and surface via `queueMicrotask(() => { throw new Error(...) })`. The `shouldNotify` parameter must continue to work: updates with `shouldNotify = false` apply the mutation but do not trigger notification or increment reentrant depth. Check `_destroyed` before each subscriber callback invocation. Check `_destroyed` before applying queued patches in `DrainComplete`.

**Dependencies:** Step 2

**Test (write first):**
In `tests/index.test.ts`, add a `describe("reentrant update")` block:
- Test that a subscriber calling `update` during notification results in a single batched notification (subscribe, in callback call update, assert final state has both mutations, subscriber called correct number of times).
- Test depth guard: create a subscriber that always triggers another update. Assert that after the store stabilizes, `depthOverflow` error was surfaced (spy on `queueMicrotask`).
- Test that destroy during drain stops remaining subscriber callbacks: subscribe two callbacks, first callback calls `destroy()`, second callback should NOT be called.
- Test that existing `on-update.test.ts` passes unchanged (regression canary for onPropertyChange + shouldNotify:false).
- Test error during drain: subscribe a callback that throws, subscribe a second callback. Both should be invoked (error caught), error surfaced via `queueMicrotask`.

**TLA+ Coverage:**
- Transition: `Update(newState)` — non-reentrant update starts drain
- Transition: `ReentrantUpdate(newState)` — queue patch during drain
- Transition: `DepthOverflowAction` — depth guard exceeded
- Transition: `DrainNotify(s)` — notify subscriber, check ~destroyed before each
- Transition: `DrainComplete` — dequeue or exit; check ~destroyed before applying patches
- Transition: `DrainAbortOnDestroy` — drain stuck post-destroy: clear and exit
- Invariant: `ReentrantDepthBounded` — reentrantDepth <= MaxReentrantDepth
- Invariant: `PendingNotifyValid` — pendingNotify subset of subscribers
- Property: `DrainTerminates` — draining eventually ends
- Property: `PostDestroyDrainTerminates` — post-destroy draining eventually ends

**CRITICAL: After every file change, run: test -> fix -> lint -> fix -> tsc -> fix**

---

### Step 4: Add `reset()` method

**Files:**
- `packages/store/src/index.ts` (modify)
- `packages/store/tests/index.test.ts` (modify)

**Description:**
Implement `public reset(initialState?: State): void`. If called outside a drain: set state to `initialState ?? this._initialState`, trigger notification drain. If called during a drain (reentrant): enqueue the state replacement as a reentrant update. If called post-destroy: silent no-op. Leave AbortController/cleanupSignal untouched. If `initialState` argument is provided, update `_initialState` for future resets.

**Dependencies:** Step 3

**Test (write first):**
In `tests/index.test.ts`, add a `describe("reset")` block:
- Test that `reset()` restores original constructor state and notifies subscribers.
- Test that `reset(newState)` sets state to newState and notifies.
- Test that after `reset()`, the `_initialState` reference is still the original (when no arg provided).
- Test that `reset(newState)` updates the stored initial state for subsequent `reset()` calls.
- Test that `reset()` during a drain enqueues the reset (subscribe, in callback call reset, assert final state is the reset state after drain completes).
- Test that `reset()` after destroy is a no-op.
- Test that `reset()` does not abort cleanupSignal.

**TLA+ Coverage:**
- Transition: `Reset` — reset to initialState, reentrant-safe
- Transition: `ResetWithState(newInitial)` — reset with provided state, reentrant-safe

**CRITICAL: After every file change, run: test -> fix -> lint -> fix -> tsc -> fix**

---

### Step 5: Add `waitFor()` method

**Files:**
- `packages/store/src/index.ts` (modify)
- `packages/store/tests/wait-for.test.ts` (create)

**Description:**
Implement `public waitFor(predicate: (state: State) => boolean, signal?: AbortSignal): Promise<ResultAsync<State, Error>>`. Uses `attemptAsync` from `@ethang/toolbelt` for error wrapping. If predicate is already true at call time, resolve immediately with ok result. If store is destroyed, return error result immediately. If signal is already aborted, return error result immediately. Wrap predicate call in `attempt` — if it throws, return error result. Otherwise, subscribe to store changes and resolve when predicate becomes true. Use `AbortSignal.any([this.cleanupSignal, signal])` if signal is provided, else use `this.cleanupSignal` alone, to abort waitFor when store is cleaned up or signal fires. On abort, return error result (not rejected promise). Clean up subscription on resolve/abort.

**Dependencies:** Step 3

**Test (write first):**
Create `tests/wait-for.test.ts`:
- Test immediate resolve when predicate is already true.
- Test resolve after state change satisfies predicate.
- Test error result when store is destroyed before predicate matches.
- Test error result when store is destroyed while waiting.
- Test error result when provided AbortSignal is already aborted at call time.
- Test error result when provided AbortSignal aborts while waiting.
- Test error result when cleanupSignal aborts (all subscribers unsubscribe).
- Test error result when predicate throws.
- Test that waitFor cleans up its internal subscription after resolving.
- Test multiple concurrent waitFor calls with different predicates.

**TLA+ Coverage:**
- Transition: `WaitForStart(w)` — begin waiting
- Transition: `WaitForImmediate(w)` — predicate already true
- Transition: `WaitForResolve(w)` — state matches predicate
- Transition: `WaitForAlreadyAborted(w)` — signal pre-aborted
- Transition: `WaitForSignalAbort(w)` — signal aborts while waiting
- Transition: `WaitForDestroyError(w)` — store destroyed while waiting
- Transition: `WaitForAfterDestroy(w)` — new waitFor post-destroy
- Transition: `WaitForPredicateError(w)` — predicate throws
- Transition: `AbortSignal(w)` — environment marks signal as aborted
- Invariant: `WaiterResultConsistent` — resolved waiters have definite result
- Invariant: `WaiterActiveNotResolved` — active waiters not yet resolved
- Property: `WaitForResolves` — every waiter eventually resolves

**CRITICAL: After every file change, run: test -> fix -> lint -> fix -> tsc -> fix**

---

### Step 6: Modernize `onPropertyChange` for batched model

**Files:**
- `packages/store/src/index.ts` (modify)
- `packages/store/tests/on-update.test.ts` (modify — only if needed)

**Description:**
Verify that `onPropertyChange` fires as a derived side-effect within the reentrant batch (Step 3 should already handle this). The key behavior: `onPropertyChange` fires for each patch from the current updater, BEFORE subscriber notification begins. An `update` called from `onPropertyChange` with `shouldNotify: false` applies the mutation without triggering additional notification or incrementing reentrant depth. This step is primarily a verification pass — ensure the existing `on-update.test.ts` passes unchanged. If the batched model from Step 3 broke this behavior, fix it here. Add a comment at the `onPropertyChange` call site documenting the scoping limitation noted in the TLA+ spec header.

**Dependencies:** Step 3

**Test (write first):**
Run existing `tests/on-update.test.ts` unchanged. It tests: calling `increment()` triggers `onPropertyChange`, which calls `update(shouldNotify: false)` to apply a secondary mutation. Final state should show count=2 and firstName="Jane". If this test fails, the batched model needs adjustment. Add one additional test: `onPropertyChange` calling `update(shouldNotify: true)` triggers a reentrant update that is batched (not infinite loop).

**TLA+ Coverage:**
- Note: onPropertyChange is explicitly documented as NOT modeled in the TLA+ spec (module header lines 9-17). This step covers the implementation detail below the spec's abstraction level. The `shouldNotify: false` path is an implementation-only concern.

**CRITICAL: After every file change, run: test -> fix -> lint -> fix -> tsc -> fix**

---

### Step 7: Functional error handling audit

**Files:**
- `packages/store/src/index.ts` (modify)

**Description:**
Audit all error-handling paths in the store and ensure they use functional error handling throughout. Specifically: (1) subscriber notification drain uses `attempt(() => callback(state))` with `isError` check, surfacing errors via `queueMicrotask`. (2) `waitFor` predicate evaluation uses `attempt`. (3) No try/catch blocks anywhere in the file. (4) Add a code comment at the import site explaining the convention: `attempt` from lodash for sync, `attemptAsync` from `@ethang/toolbelt` for async. Retain `attempt` and `isError` imports from lodash. Verify `isNil` is removed (from Step 1).

**Dependencies:** Steps 3, 5

**Test (write first):**
Tests for error handling should already exist from Steps 3 and 5 (error during drain, predicate throws). This step verifies no try/catch exists in the source and that the `attempt`/`isError` pattern is used consistently. Add a test that a throwing subscriber does not prevent other subscribers from being notified AND that the error is re-thrown via queueMicrotask (spy on queueMicrotask, assert it was called with a function that throws the original error).

**TLA+ Coverage:**
- Transition: `DrainNotify(s)` — error handling during notification (attempt pattern)
- Transition: `WaitForPredicateError(w)` — predicate throws, caught via attempt
- Invariant: `TypeOK` — all paths produce well-typed results

**CRITICAL: After every file change, run: test -> fix -> lint -> fix -> tsc -> fix**

---

### Step 8: Update PipelineStore consumer

**Files:**
- `packages/design-pipeline/src/engine/pipeline-store.ts` (modify)

**Description:**
The PipelineStore constructor currently calls `super(createInitialState())` with no options argument, so it already matches the new `constructor(state: State)` signature. Verify this compiles. If any other call sites in the design-pipeline package reference removed APIs (StoreOptions, localStorage methods), update them. This step should be a no-op verification but is included to ensure the single consumer is validated.

**Dependencies:** Step 1

**Test (write first):**
Run the existing design-pipeline test suite to verify PipelineStore still works. No new tests needed unless compilation fails. Assert that `new PipelineStore()` creates a store with the expected initial state and that all existing transition tests pass.

**TLA+ Coverage:**
- Not directly mapped to TLA+ spec (consumer-side impact of constructor change)

**CRITICAL: After every file change, run: test -> fix -> lint -> fix -> tsc -> fix**

---

### Step 9: Rewrite README

**Files:**
- `packages/store/README.md` (modify)

**Description:**
Rewrite the README to document the new API surface. Include: constructor signature, `state` getter, `subscribe`, `waitFor`, `reset`, `destroy`, `update` (protected), `cleanupSignal` (protected), lifecycle hooks (`onFirstSubscriber`, `onLastSubscriberRemoved`, `onPropertyChange`). Document the batched notification model. Document that subscriber errors are surfaced via `queueMicrotask` and will not be caught by React error boundaries (consensus item 10). Document the `attempt`/`attemptAsync` convention. Remove all localStorage references.

**Dependencies:** Steps 1-7

**Test (write first):**
No automated test. Manual review that all public and protected APIs are documented, no removed APIs are mentioned, and the error surfacing trade-off is documented.

**TLA+ Coverage:**
- Not directly mapped to TLA+ spec (documentation)

**CRITICAL: After every file change, run: test -> fix -> lint -> fix -> tsc -> fix**

---

## State Coverage Audit

### States

| State | Covered By |
|-------|-----------|
| `ACTIVE` (destroyed=FALSE) | Step 1 (Init), Step 2 (destroy guards) |
| `DESTROYED` (destroyed=TRUE) | Step 2 (destroy method) |
| `IDLE` (draining=FALSE) | Step 3 (drain loop exit) |
| `DRAINING` (draining=TRUE, pendingNotify non-empty) | Step 3 (notification loop) |
| `QUEUED` (patchQueue non-empty) | Step 3 (reentrant update) |
| `DEPTH_OVERFLOW` (depthOverflow=TRUE) | Step 3 (depth guard) |
| `DRAIN_ABORT_ON_DESTROY` | Step 3 (destroy during drain test) |
| Waiter: `pending` | Step 5 (WaitForStart) |
| Waiter: `ok` | Step 5 (WaitForResolve, WaitForImmediate) |
| Waiter: `error` | Step 5 (all error paths) |

### Transitions

| Transition | Covered By |
|-----------|-----------|
| `Subscribe(s)` | Step 2 (existing tests preserved) |
| `SubscribeAfterDestroy(s)` | Step 2 |
| `Unsubscribe(s)` | Step 2 (existing tests preserved) |
| `Update(newState)` | Step 3 |
| `ReentrantUpdate(newState)` | Step 3 |
| `DepthOverflowAction` | Step 3 |
| `DrainNotify(s)` | Step 3, Step 7 |
| `DrainComplete` | Step 3 |
| `DrainAbortOnDestroy` | Step 3 |
| `Reset` | Step 4 |
| `ResetWithState(newInitial)` | Step 4 |
| `Destroy` | Step 2 |
| `DoubleDestroy` | Step 2 |
| `UpdateAfterDestroy` | Step 2 |
| `WaitForStart(w)` | Step 5 |
| `WaitForImmediate(w)` | Step 5 |
| `WaitForResolve(w)` | Step 5 |
| `WaitForAlreadyAborted(w)` | Step 5 |
| `WaitForSignalAbort(w)` | Step 5 |
| `WaitForDestroyError(w)` | Step 5 |
| `WaitForAfterDestroy(w)` | Step 5 |
| `WaitForPredicateError(w)` | Step 5 |
| `AbortSignal(w)` | Step 5 |

### Safety Invariants

| Invariant | Verified By |
|-----------|-------------|
| `TypeOK` | All steps (TypeScript compiler enforces type domains) |
| `PostDestroyNoNotifications` | Step 2 (destroy clears subscribers test) |
| `ReentrantDepthBounded` | Step 3 (depth guard test) |
| `PendingNotifyValid` | Step 3 (subscriber set is source of truth) |
| `WaiterResultConsistent` | Step 5 (all waitFor tests assert definite results) |
| `WaiterActiveNotResolved` | Step 5 (waitFor cleanup removes subscription on resolve) |

### Liveness Properties

| Property | Verified By |
|----------|-------------|
| `DrainTerminates` | Step 3 (drain loop exits after queue empty; depth guard terminates infinite loops) |
| `PostDestroyDrainTerminates` | Step 3 (destroy during drain test — remaining callbacks skipped) |
| `WaitForResolves` | Step 5 (all waitFor paths resolve: predicate match, abort, destroy, error) |

All TLA+ states, transitions, and properties are covered by the implementation plan.

---

## Execution Tiers

### Tier 1: Foundation (independent entry points)

These steps have no dependencies on each other and can execute in parallel. Step 1 modifies `packages/store/src/index.ts` (shared file), so Steps that also modify it cannot run in the same tier. However, Step 1 is the foundational change and Step 8 only reads the result, so Step 8 depends on Step 1 and goes to Tier 2.

| Task ID | Step | Title |
|---------|------|-------|
| T1 | Step 1 | Remove localStorage and simplify constructor |

### Tier 2: Core lifecycle (depends on Tier 1 — constructor must be simplified first)

Step 2 adds destroy/guards to the simplified store. Step 8 validates the consumer after constructor change.

| Task ID | Step | Title |
|---------|------|-------|
| T2 | Step 2 | Add `_destroyed` flag, `destroy()`, post-destroy guards |
| T3 | Step 8 | Update PipelineStore consumer |

### Tier 3: Reentrant drain engine (depends on Tier 2 — destroy guards must exist)

The drain loop checks `_destroyed` throughout, so Step 2 must be complete.

| Task ID | Step | Title |
|---------|------|-------|
| T4 | Step 3 | Reentrant-safe update with batched notification drain loop |

### Tier 4: Features built on drain engine (depends on Tier 3 — drain loop must exist)

Steps 4, 5, and 6 all depend on the drain engine but are independent of each other. However, Steps 4 and 6 both modify `packages/store/src/index.ts`, and Step 5 also modifies `packages/store/src/index.ts`. File overlap within a tier is a race condition. Steps 4 and 5 create different test files (`index.test.ts` vs `wait-for.test.ts`) but both modify `src/index.ts`. To avoid file conflicts, we serialize Steps 4 and 5, but Step 6 (primarily verification) can run after Step 4.

| Task ID | Step | Title |
|---------|------|-------|
| T5 | Step 4 | Add `reset()` method |
| T6 | Step 5 | Add `waitFor()` method |

### Tier 5: Verification and polish (depends on Tier 4)

Step 6 verifies onPropertyChange compatibility with the batched model. Step 7 audits error handling across all paths. Both modify `src/index.ts` so they must be serialized.

| Task ID | Step | Title |
|---------|------|-------|
| T7 | Step 6 | Modernize `onPropertyChange` for batched model |
| T8 | Step 7 | Functional error handling audit |

### Tier 6: Documentation (depends on Tiers 1-5 — all API changes must be complete)

| Task ID | Step | Title |
|---------|------|-------|
| T9 | Step 9 | Rewrite README |

---

## Task Assignment Table

| Task ID | Title | Tier | Code Writer | Test Writer | Dependencies | Rationale |
|---------|-------|------|-------------|-------------|--------------|-----------|
| T1 | Remove localStorage and simplify constructor | 1 | typescript-writer | vitest-writer | None | Pure TypeScript refactor removing code and simplifying types — domain logic task. |
| T2 | Add `_destroyed` flag, `destroy()`, post-destroy guards | 2 | typescript-writer | vitest-writer | T1 | State lifecycle logic with boolean flags and guards — pure TypeScript domain. |
| T3 | Update PipelineStore consumer | 2 | typescript-writer | vitest-writer | T1 | Verifying TypeScript compilation of a consumer after constructor signature change. |
| T4 | Reentrant-safe update with batched notification drain loop | 3 | typescript-writer | vitest-writer | T2 | Core state machine logic with queues and depth counters — pure TypeScript. |
| T5 | Add `reset()` method | 4 | typescript-writer | vitest-writer | T4 | State mutation method integrated with drain loop — pure TypeScript domain logic. |
| T6 | Add `waitFor()` method | 4 | typescript-writer | vitest-writer | T4 | Async predicate-based subscription with AbortSignal — TypeScript with async patterns. |
| T7 | Modernize `onPropertyChange` for batched model | 5 | typescript-writer | vitest-writer | T4 | Verification of existing protected hook within new batched architecture — TypeScript domain. |
| T8 | Functional error handling audit | 5 | typescript-writer | vitest-writer | T4, T6 | Cross-cutting audit of attempt/isError patterns across all store methods. |
| T9 | Rewrite README | 6 | typescript-writer | vitest-writer | T1-T8 | Markdown documentation of new API surface — typescript-writer for technical accuracy, vitest-writer validates structure. |

---

## Blocker Analysis

| Task ID | Is Blocker? | Blocks |
|---------|-------------|--------|
| T1 | Yes | T2, T3 |
| T2 | Yes | T4 |
| T3 | No | - |
| T4 | Yes | T5, T6, T7, T8 |
| T5 | No | - |
| T6 | Yes | T8 |
| T7 | No | - |
| T8 | No | - |
| T9 | No | - |
