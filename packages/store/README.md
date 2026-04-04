# @ethang/store

A lightweight, reactive state management library for React applications. Uses `Immer` for immutable state updates and `useSyncExternalStore` for efficient React integration.

```shell
pnpm i @ethang/store
```

## API

### `BaseStore<State>` (abstract class)

Extend `BaseStore` to create your own reactive store. The constructor takes the initial state as its only argument.

```ts
import { BaseStore } from "@ethang/store";

type CounterState = { count: number; isOnline: boolean };

class CounterStore extends BaseStore<CounterState> {
  public constructor() {
    super({ count: 0, isOnline: navigator.onLine });
  }

  public increment() {
    this.update((draft) => {
      draft.count += 1;
    });
  }

  public decrement() {
    this.update((draft) => {
      draft.count -= 1;
    });
  }
}

export const counterStore = new CounterStore();
```

### Public API

#### `state` (getter)

Returns the current immutable state.

#### `destroyed` (getter)

Returns `true` if the store has been destroyed.

#### `subscribe(callback: (state: State) => void): () => void`

Subscribe to state changes. Returns an unsubscribe function.

After `destroy()`, returns a no-op function (preserves the `useSyncExternalStore` contract).

#### `destroy(): void`

Permanently tears down the store. Aborts the `cleanupSignal`, clears all subscribers. Subsequent `update` calls are silent no-ops, `subscribe` returns a no-op, and `waitFor` returns an error result.

Double `destroy()` is a no-op.

#### `reset(initialState?: State): void`

Resets the store to its initial state and notifies subscribers. If `initialState` is provided, that becomes the new initial state for future `reset()` calls.

Reentrant-safe: if called during a notification drain, the reset is queued and applied after the current drain completes.

After `destroy()`, `reset()` is a no-op. Does not abort `cleanupSignal`.

#### `waitFor(predicate: (state: State) => boolean, signal?: AbortSignal): Promise<Result>`

Returns a promise that resolves when `predicate(state)` returns `true`.

- If the predicate is already satisfied, resolves immediately.
- Uses the store's `cleanupSignal` by default. If an explicit `AbortSignal` is provided, both signals are combined via `AbortSignal.any()`.
- On abort, returns `{ ok: false, error: Error }` (not a rejected promise).
- On destroy while waiting, returns an error result.
- If the predicate throws, returns an error result.
- Cleans up its internal subscription after resolving.

```ts
const result = await store.waitFor((state) => state.count >= 10);
if (result.ok) {
  console.log("Count reached:", result.value.count);
}
```

### Protected API

#### `update(updater: (draft: State) => void, shouldNotify?: boolean): void`

The primary method for modifying state. The `updater` receives an Immer draft. If `shouldNotify` is `false`, subscribers are not notified.

Reentrant-safe: if a subscriber or `onPropertyChange` triggers another `update`, the mutation is applied immediately but notification is batched. A depth guard at 100 prevents infinite loops and surfaces the overflow via `queueMicrotask`.

After `destroy()`, `update` is a silent no-op.

#### `cleanupSignal` (getter)

An `AbortSignal` for automatic cleanup of event listeners and resources. Aborted when the last subscriber unsubscribes or when `destroy()` is called.

A new `AbortController` is created when the first subscriber joins after a cleanup.

#### `onFirstSubscriber?(): void`

Called when the first subscriber registers. Use this to set up event listeners with `this.cleanupSignal`.

```ts
protected onFirstSubscriber() {
  window.addEventListener("online", this.handleOnline, {
    signal: this.cleanupSignal,
  });
}
```

#### `onLastSubscriberRemoved?(): void`

Called when the last subscriber unsubscribes. The `cleanupSignal` is aborted at this point.

#### `onPropertyChange?(patch: StorePatch<State>): void`

Called for each Immer patch before subscriber notification begins. Fires within the batched drain loop. Calling `update` with `shouldNotify: false` from here applies the mutation without triggering notification or incrementing reentrant depth.

### Batched Notification Model

When `update` is called, the store enters a drain loop:

1. Apply the mutation via Immer.
2. Fire `onPropertyChange` for each patch.
3. Notify all subscribers.
4. If any subscriber triggered a reentrant `update`, apply its mutation and repeat from step 2.
5. Continue until the queue is empty or `destroy()` is called.

The `_destroyed` flag is checked before each subscriber callback and before applying queued patches.

### Error Handling

Subscriber errors are caught via `attempt` (lodash) and re-thrown via `queueMicrotask`. This means:

- All subscribers are notified even if one throws.
- Errors surface as uncaught exceptions (visible in browser console and error monitoring).
- Errors are **not** caught by React error boundaries (they escape the synchronous call stack via microtask).

This is a deliberate trade-off: reliable subscriber notification is prioritized over error boundary integration.

Convention: `attempt` (lodash) for synchronous error handling, `attemptAsync` (`@ethang/toolbelt`) for async.

## `useStore` Hook

Integrates `BaseStore` with React via `useSyncExternalStore`.

```tsx
import { useStore } from "@ethang/store/use-store";
import { counterStore } from "../stores/counterStore";

export const CounterDisplay = () => {
  const { count, isOnline } = useStore(counterStore, (state) => ({
    count: state.count,
    isOnline: state.isOnline,
  }));

  return (
    <div>
      <p>Count: {count}</p>
      <p>Status: {isOnline ? "Online" : "Offline"}</p>
      <button onClick={() => counterStore.increment()}>Increment</button>
    </div>
  );
};
```

### Parameters

- `store` -- The `BaseStore` instance.
- `selector` -- Extracts the data your component needs. The component only re-renders when the selector's return value changes.
- `isEqual` (optional) -- Custom equality function for the selected data.
