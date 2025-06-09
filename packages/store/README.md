# @ethang/store

A lightweight state management solution for React applications, leveraging `Immer` for immutable state updates and
`useSyncExternalStore` for efficient React integration.

```shell
pnpm i @ethang/store
```

## Features

- **Immutable State Updates:** Powered by `Immer`, state changes are always immutable, simplifying state management and
  preventing common bugs.
- **Reactive Subscriptions:** Stores can be subscribed to for real-time updates when their state changes.
- **Transaction Support:** Batch multiple state updates into a single atomic change, reducing unnecessary re-renders and
  ensuring data consistency.
- **Efficient React Integration:** The `useStore` hook leverages React’s `useSyncExternalStore` and selectors for
  optimized
  component re-renders.

## `BaseStore` Class

`BaseStore` is an `abstract` class that provides the foundational structure for creating your own reactive state stores.
It
handles state immutability via `Immer` and provides mechanisms for subscribing to state changes and batching updates
using
transactions.

### Key Concepts

- `state` **(getter):** Provides public access to the current immutable state of the store.
- `_state` **(protected property):** The internal mutable state, managed by `Immer` through the `update` method.
- `update(updater: (draft: State) => void, shouldNotify = true)` **(protected method):**
    - The primary method for modifying the store's state.
    - It accepts an `updater` function that receives a `draft` of the current state, allowing you to directly mutate
      `draft`
      as if it were the actual state. `Immer` then produces a new immutable state based on your changes.
    - If `shouldNotify` is `true` (default), all subscribers are notified after the state update.
    - If a transaction is active, the updater is queued for later application during `commitTransaction`.
- **Transactions (`startTransaction()`, `commitTransaction()`, `rollbackTransaction()`):**
    - `startTransaction()`**:** Begins a transaction. Subsequent `update` calls will queue their changes without
      immediately applying them or notifying subscribers.
    - `commitTransaction()`**:** Applies all queued updates as a single atomic change, produces a new immutable state,
      and then notifies subscribers.
    - `rollbackTransaction()`**:** Discards all queued updates within the current transaction without applying them.

### Usage Example

```ts
// stores/counterStore.ts
import {BaseStore} from './BaseStore'; // Assuming BaseStore is in BaseStore.ts

type CounterState = {
    count: number;
}

class CounterStore extends BaseStore<CounterState> {
    constructor() {
        super({count: 0});
    }

    increment() {
        this.update((draft) => {
            draft.count += 1;
        });
    }

    decrement() {
        this.update((draft) => {
            draft.count -= 1;
        });
    }

    // Method 1: Using Transactions for batch updates and single notification
    // All 'update' calls between startTransaction and commitTransaction
    // are batched, and subscribers are only notified once at commit.
    batchIncrementWithTransaction(amount: number) {
      this.startTransaction();
      for (let i = 0; i < amount; i++) {
        this.update((draft) => {
          draft.count += 1;
        });
      }
      this.commitTransaction(); // Notifies once after all batched updates are applied
    }

    // Method 2: Preventing intermediate notifications using shouldNotify
    // This approach is useful for a series of updates that don't need
    // transaction semantics, but you still want to defer notifications.
    multiIncrementWithoutImmediateNotify(amount: number) {
      for (let i = 0; i < amount; i++) {
        // This will update the state and only notify subscribers on the last iteration.
        this.update((draft) => {
          draft.count += 1;
        }, i === amount - 1); // Notify only on the final update
      }
    }
}

export const counterStore = new CounterStore();

// Example of manual subscription (less common with React hook)
// const unsubscribe = counterStore.subscribe((state) => {
//   console.log('Counter state changed:', state.count);
// });

// counterStore.increment(); // console will log 'Counter state changed: 1'
// counterStore.batchIncrement(5); // console will log 'Counter state changed: 6' (only once)

// unsubscribe();
```

## `useStore` Hook

### Description

The `useStore` hook is a React hook designed to seamlessly integrate `BaseStore` instances into your React components.
It
leverages `useSyncExternalStoreWithSelector` for optimal performance, ensuring that your components only re-render when
the selected part of the store’s state actually changes.

### Key Concepts

- `store: BaseStore<State>`**:** The instance of your `BaseStore` (e.g., `counterStore`).
- `selector: (snapshot: BaseStore<State>["state"]) => Selection`**:** A function that receives the full store state and
  returns the specific data you want to use in your component. This is crucial for performance, as your component will
  only re-render if the result of this selector changes.
- `isEqual?: (a: Selection, b: Selection) => boolean` **(optional):** An optional comparison function for the selected
  data. If provided, `useStore` will use this function to determine if the selector’s output has changed, allowing for
  custom equality checks (e.g., deep equality for objects if needed, though `Immer` often makes this unnecessary for
  simple state).

### Usage Example

```tsx
import React from 'react';
import {counterStore} from '../stores/counterStore';
import {useStore} from '../hooks/useStore';

export const CounterDisplay = () => {
    // Select only the 'count' property from the store's state
    const count = useStore(counterStore, (state) => state.count);

    return (
        <div>
            <h2>Counter</h2>
            <p>{count}</p>
            <div>
                <button onClick={() => counterStore.decrement()}>
                    Decrement
                </button>
                <button onClick={() => counterStore.increment()}>
                    Increment
                </button>
            </div>
            <div>
              <button onClick={() => counterStore.batchIncrementWithTransaction(10)}>
                Batch Increment (Transaction)
              </button>
              <button onClick={() => counterStore.multiIncrementWithoutImmediateNotify(5)}>
                Multi Increment (No Immediate Notify)
              </button>
            </div>
        </div>
    );
}
```

## Use Cases

This library is well-suited for:

- **Global Application State:** Managing shared state across different parts of your React application.
- **Complex UI State:** Handling the state of forms, modals, or interactive components where state needs to be managed
  outside an individual component scope.
- **Performance-Critical Scenarios:** The `selector` and `isEqual` arguments in `useStore` allow for fine-grained
  control over
  re-renders, making it suitable for applications where rendering performance is crucial.
- **Batching Updates:** Scenarios where you need to perform multiple state modifications but only want a single
  re-render or notification (e.g., during complex calculations or user interactions).

## Benefits

- **Simplicity:** Provides a clear and minimalist API for state management.
- **Immutability by Default:** `Immer` eliminates the need for manual immutability, making state updates safer and
  easier.
- **Performance:** `useSyncExternalStore` combined with selectors ensures that components only re-render when necessary.
- **Flexibility:** The `BaseStore` design allows you to extend and customize your stores with specific business logic.
- **Testability:** Decoupling state logic into separate store classes makes your application easier to test.