# "state management"

This library was primarily created with the realization of how simple state
management actually is. While I see great value in current libraries (I love
Redux Toolkit), and populus alternatives like Zustand, we can do even better.

In fact, it is so simple I would argue we should be comfortable with regularly
rolling our own.

"State Management" is objects in an observer pattern. Things like derived values
and effects are secondary features. The current implementation of derived values
and effects here are incomplete. All changes are made through immer for
immutability.

### With vanilla HTML/JS

This library can be used to add subscriptions to HTML
elements. Subscriptions will be automatically cleaned up when the event fires
and no element is found. Note that you still need a modern bundler with
dependency management such as vite to work with vanilla.

### With React Refs

This library can act the same as it does in vanilla. By
using refs to point to an exact element you can prevent React from rerunning
render functions for simple state changes such as form inputs with dynamic error
handling.

### With React State

This library implements a useSyncExternalStore interface to
trigger rerenders on state changes. You can even use React's official
useSyncExternalStoreWithSelector
shim ([using this package](https://www.npmjs.com/package/use-sync-external-store))
to prevent some rerenders.

```shell
pnpm i @ethang/store
```

## Create a store:

```ts
import {Store} from "@ethang/store";

const store = new Store({count: 0});
```

## Update store

```ts
store.set((state) => {
    state.count += 1; // Immutable changes via Immer
})
```

## Get from store

```ts
store.get(); // { count: 1 }

store.get(state => state.count); // 1
```

## Subscribe to changes

```ts
const unsubscribe = store.subscribe((state) => {
    console.log(`Count is now ${state.count}`);
})

unsubscribe(); // Don't forget to clean up.
```

## Subscribe HTML element

```ts
const counterButton = document.querySelector('#counter');

counterButton.onclick = () => store.set(state => {
    state.count += 1;
})

const bindFn = store.bind((state, element) => {
    element.textContent = state.count;
})

bindFn(counterButton);

// Automatically cleans up after element is removed from DOM
```

## Bind React Ref*

* Fine-grained reactivity, does not trigger rerenders.

```tsx
<button
    onClick={() => {
        store.set(state => {
            state.count += 1;
        })
    }}
    ref={store.bind((state, element) => {
        element.textContent = state.count;
    })}
/>
```

## React useSyncExternalStore*

* Sync w/ React reconciliation, triggers component function calls on state
  changes (rerenders).

```tsx
import {useSyncExternalStore} from "react";

const state = useSyncExternalStore(
    listener => store.subcribe(listener),
    () => store.get(), // get client snapshot
    () => store.get(), // get server snaphot
);

<div>{state.count}</div>
```

## React useSyncExternalStoreWithSelector*

* A few less rerenders.

```tsx
import {
    useSyncExternalStoreWithSelector
} from "use-sync-external-store/with-selector.js";

const count = useSyncExternalStoreWithSelector(
    listener => store.subscribe(listener),
    () => store.get(), // get client snapshot
    () => store.get(), // get server snaphot
    state => state.count,
);

<div>{count}</div>
```

## Batch Updates

```ts
// Subscribers aren't notified until after work in set is done
store.set(state => {
    state.count += 1;
    state.count += 1;
    state.count += 1;
})
```

## Altogether Now

```tsx
import {Store} from "@ethang/store";
import {
    useSyncExternalStoreWithSelector
} from "use-sync-external-store/with-selector.js";

const initialCountStoreState = {count: 0};
const initialTextStoreState = {hello: "Hello", world: "World!"};

const countStore = new Store(initialCountStoreState);
const textStore = new Store(initialTextStoreState)

const useCountStore = <T, >(selector: (state: typeof initialTextStoreState) => T) => {
    return useSyncExternalStoreWithSelector(
        listener => textStore.subscribe(listener),
        () => textStore.get(),
        () => textStore.get(),
        selector,
    );
}

const incrementCount = () => {
    store.set(state => {
        state.count += 1;
    })
}

const MyComponent = () => {
    const {hello} = useCountStore(state => {
        return {
            hello: state.hello,
        }
    });

    return (
        <div>
            <div>Count</div>
            <button
                onClick={incrementCount}
                ref={countStore.bind((state, element) => {
                    element.textContent = state.count;
                })}
            />
            <ThirdPartyComponent text={hello}/>
        </div>
    );
}
```

## Async

Use [TanStack Query](https://tanstack.com/query/latest)

### Features that won't be implemented

Part of what this library highlights is that the deeper you get into "state
management" the deeper you get into "reactive programming." And that the
problems we're often solving with "state management" are more often than not
problems with React. This library is meant to ignore the issues of what is
really React render management, and explore the concepts behind state management
and reactive programming.

#### Derived Values

```ts
const store = new Store({
    firstName: 'John',
    lastName: 'Doe',
    fullName() { // Do not use arrow functions here, otherwise `this` well have a lexical binding.
        return `${this.firstName} ${this.lastName}`;
    }
});

const fullName = store.get(state => {
    return state.fullName();
})
```

#### Effects (they're just subscriptions)

```ts
const unsubscribe = store.subscrie(state => {
    if (state.isLoggedIn) {
        console.log('User logged in');
    } else {
        console.log('User logged out');
    }
})
```
