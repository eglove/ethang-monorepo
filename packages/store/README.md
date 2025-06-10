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
- **Efficient React Integration:** The `useStore` hook leverages React’s `useSyncExternalStore` and selectors for
  optimized component re-renders.

## `BaseStore` Class

`BaseStore` is an `abstract` class that provides the foundational structure for creating your own reactive state stores.
It
handles state immutability via `Immer` and provides mechanisms for subscribing to state changes and batching updates.

### Key Concepts

- `state` **(getter):** Provides public access to the current immutable state of the store.
- `_state` **(protected property):** The internal mutable state, managed by `Immer` through the `update` method.
- `update(updater: (draft: State) => void, shouldNotify = true)` **(protected method):**
    - The primary method for modifying the store’s state.
    - It accepts an `updater` function that receives a `draft` of the current state, allowing you to directly mutate
      `draft`
      as if it were the actual state. `Immer` then produces a new immutable state based on your changes.
    - If `shouldNotify` is `true` (default), all subscribers are notified after the state update.
- **`subscribe(callback: (state: State) => void)` (public method):**
    - Allows external components or functions to listen for state changes.
    - Returns an `unsubscribe` function that you should call to clean up the subscription when it’s no longer needed (
      e.g., in a React `useEffect` cleanup).
- **cleanupSignal (protected getter):** Returns an `AbortSignal` that can be used to automatically clean up event
  listeners or other resources when the last subscriber unsubscribes from the store. This is managed internally by the
  `subscribe` and `unsubscribe` methods.

### Usage Example

```ts
import {BaseStore} from './BaseStore'; // Assuming BaseStore is in BaseStore.ts

type CounterState = {
    count: number;
    isOnline: boolean; // Track browser's online status
}

class CounterStore extends BaseStore<CounterState> {
    constructor() {
        super({count: 0, isOnline: navigator.onLine}); // Initialize with current online status
        this.setupOnlineStatusListener(); // Setup the listener on instantiation
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

    // Example: Performing multiple updates and notifying only once at the end.
    // This approach is useful for a series of updates where you want to defer
    // notifications until all changes are applied.
    batchIncrement(amount: number) {
        for (let i = 0; i < amount; i++) {
            // Update the state for each increment, but only notify subscribers
            // on the very last iteration.
            this.update((draft) => {
                draft.count += 1;
            }, i === amount - 1); // Notify only on the final update
        }
    }

    // Example: Using cleanupSignal for automatic cleanup of window event listeners
    private setupOnlineStatusListener() {
        const handleOnline = () => {
            this.update((draft) => {
                draft.isOnline = true;
            });
            console.log("Browser is online!");
        };

        const handleOffline = () => {
            this.update((draft) => {
                draft.isOnline = false;
            });
            console.log("Browser is offline!");
        };

        // Attach event listeners to the window object using cleanupSignal.
        // These listeners will be automatically removed when the last
        // component/resource unsubscribes from this store.
        // When a new subscriber is added, the events will resubscribe
        window.addEventListener('online', handleOnline, {signal: this.cleanupSignal});
        window.addEventListener('offline', handleOffline, {signal: this.cleanupSignal});

        console.log("Online status listener set up.");
    }
}

export const counterStore = new CounterStore();

// Example of manual subscription (less common with React hook)
// const unsubscribe = counterStore.subscribe((state) => {
//   console.log('Counter state changed:', state.count);
// });

// counterStore.increment(); // console will log 'Counter state changed: 1'
// counterStore.batchIncrement(5); // console will log 'Counter state changed: 6' (only once after all increments)

// To observe cleanupSignal in action:
// 1. Subscribe to the store at least once to activate the signal (e.g., via a React component using useStore, or a manual subscription).
// 2. Disconnect your network or toggle airplane mode to trigger 'offline'/'online' events.
// 3. Ensure all subscribers unsubscribe. The console messages for 'online'/'offline' events should stop appearing,
//    indicating that the listeners have been cleaned up.
// const tempUnsubscribe = counterStore.subscribe(() => {}); // Add a temporary subscriber
// tempUnsubscribe(); // Unsubscribing will trigger cleanup if this was the last subscriber

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
    // Select both 'count' and 'isOnline' from the store's state
    const {count, isOnline} = useStore(counterStore, (state) => ({
        count: state.count,
        isOnline: state.isOnline,
    }));

    return (
        <div>
            <h2>Counter</h2>
            <p>Count: {count}</p>
            <p>Status: {isOnline ? 'Online' : 'Offline'}</p>
            <div>
                <button onClick={() => counterStore.decrement()}>
                    Decrement
                </button>
                <button onClick={() => counterStore.increment()}>
                    Increment
                </button>
            </div>
            <div>
                <button onClick={() => counterStore.batchIncrement(10)}>
                    Batch Increment
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
- **Resource Management:** Leveraging `cleanupSignal` for automatic cleanup of event listeners (like network status changes,
  WebSockets, or IndexedDB listeners) or other resources tied to the store's active subscription status, ensuring
  efficient resource management.

## Benefits

- **Simplicity:** Provides a clear and minimalist API for state management.
- **Immutability by Default:** `Immer` eliminates the need for manual immutability, making state updates safer and
  easier.
- **Performance:** `useSyncExternalStore` combined with selectors ensures that components only re-render when necessary.
- **Flexibility:** The `BaseStore` design allows you to extend and customize your stores with specific business logic.
- **Testability:** Decoupling state logic into separate store classes makes your application easier to test.