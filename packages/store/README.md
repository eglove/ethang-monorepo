# @ethang/store

A tiny pub/sub state container built on [Immer](https://immerjs.github.io/immer/)
drafts and [Effect](https://effect.website/) primitives (`PubSub` + `Stream`).
Works the same on Cloudflare Workers and the browser. The React adapter bridges
the store to `useSyncExternalStore` so React components can subscribe to
selected slices of state.

```shell
pnpm i @ethang/store
```

## API

### `makeStore<T>(initial: T): Store<T>`

Build a store. The store is created synchronously — no `Effect` wrapping at
the call site. The result is a plain object you can hold in module scope.

```ts
import { makeStore, type Store } from "@ethang/store/store.ts";

type CounterState = { count: number };

const counterStore: Store<CounterState> = makeStore<CounterState>({
  count: 0
});
```

### `Store<T>`

| Field | Type | Description |
| --- | --- | --- |
| `get` | `T` | Synchronous getter for the current state. |
| `state` | `T` | Same as `get` — exposed for ergonomic reads in components. |
| `set` | `(value: T) => T` | Replace the state. Synchronous. Returns the new value. |
| `update` | `(recipe: (draft: Draft<T>) => void \| T) => T` | Mutate the draft (Immer style) or return a new value. Synchronous. Returns the new value. |
| `reset` | `(value?: T) => T` | Reset to the most recent `initial` (or the most recent `reset(value)`). Synchronous. Returns the new value. |
| `subscribe` | `(listener: () => void) => () => void` | Synchronous listener shim for React. Returns an unsubscribe function. |
| `changes` | `Stream.Stream<T>` | Every new state, including the factory-time initial value. |
| `waitFor` | `(predicate: (state: T) => boolean) => Effect.Effect<void>` | Wait for a predicate to be true. |

### Immer draft style

`update` accepts an Immer recipe. You can mutate the draft:

```ts
counterStore.update((draft) => {
  draft.count += 1;
});
```

…or return a new value (any non-undefined return replaces the state):

```ts
counterStore.update((current) => ({ count: current.count + 1 }));
```

If the recipe makes no observable change, `update` returns the original state
and skips notifying subscribers (identity check via `Object.is`).

### Reading state

`get` and `state` are both synchronous — no `Effect` wrapper:

```ts
const current: CounterState = counterStore.state;
```

### `useStore<T, S>(store, selector, isEqual?)`

React hook that subscribes a component to a derived slice of state using
`useSyncExternalStoreWithSelector`. Re-renders only when the selected value
changes (per the optional `isEqual`).

```tsx
import { useStore } from "@ethang/store/use-store.ts";
import { counterStore } from "./counter-store.ts";

export const CounterDisplay = () => {
  const count = useStore(counterStore, (state) => state.count);
  return <p>Count: {count}</p>;
};
```

A custom equality function can be supplied to override the default `===`:

```tsx
const { count, isOnline } = useStore(
  counterStore,
  (state) => ({ count: state.count, isOnline: state.isOnline }),
  shallow
);
```

## Errors and lifecycle

- `set`, `update`, and `reset` are all synchronous and non-blocking.
- `update` uses Immer under the hood; mutations to `Map` and `Set` are
  supported (the `MapSet` plugin is enabled at module load).
- `waitFor` returns an `Effect` that resolves on the next matching state.
  Run with `Effect.runPromise` or compose into another `Effect` program.
- The store has no `destroy()` step. Subscriber cleanup is via the
  `subscribe`/`unsubscribe` shim for React, and `Stream` scoped `Effect`s
  for `waitFor`.

## Pattern: action objects

Consumers usually pair the store with an `actions` object so the rest of the
app talks to typed functions:

```ts
export const counterStore: Store<CounterState> = makeStore({ count: 0 });

export const counterActions = {
  increment: () => {
    counterStore.update((draft) => {
      draft.count += 1;
    });
  },
  reset: (value = 0) => {
    counterStore.set({ count: value });
  }
};
```

For async work (network calls, etc.), wrap the body in an `async` function and
call the sync `update` between awaits:

```ts
export const authActions = {
  signIn: async (email: string, password: string) => {
    authStore.update((draft) => {
      draft.isPending = true;
      draft.error = null;
    });

    const user = await fetchUser(email, password);

    authStore.update((draft) => {
      draft.isPending = false;
      draft.user = user;
    });
  }
};
```

## Conventions

- `immer` and `effect` are the runtime dependencies. `use-sync-external-store`
  is a devDependency for the React adapter tests.
- `lodash` is preferred for tiny sync helpers (`forEach`, etc.).
- The package is published without a barrel file. Import from the explicit
  subpath: `@ethang/store/store` and `@ethang/store/use-store`.
- The store is intentionally minimal: no reentrancy counter, no patches, no
  `onPropertyChange`. If you need derived state, compose the `Stream` or
  listen to `changes` directly.
