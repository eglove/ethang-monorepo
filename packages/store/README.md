# "state management"

```shell
pnpm i @ethang/store
```

## Create a store:

```ts
import { Store } from "@ethang/store";

const store = new Store({ count: 0 });
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

* Sync w/ React reconciliation, triggers component rerenders on state changes.

```tsx
import { useSyncExternalStore } from "react";

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
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector.js";

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
import { Store } from "@ethang/store";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector.js";

const initialCountStoreState = {count: 0};
const initialTextStoreState = {hello: "Hello", world: "World!"};

const countStore = new Store(initialCountStoreState);
const textStore = new Store(initialTextStoreState)

const useCountStore = <T,>(selector: (state: typeof initialTextStoreState) => T) => {
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
            <ThirdPartyComponent text={hello} />
        </div>
    );
}
```

## Async

Use [TanStack Query](https://tanstack.com/query/latest)
