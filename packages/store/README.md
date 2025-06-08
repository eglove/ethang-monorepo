# "state management"

This library was primarily created with the realization of how simple state
management actually is. While I see great value in current libraries (I love
Redux Toolkit), and populus alternatives like Zustand, we can do even better.

In fact, it is so simple I would argue we should be comfortable with regularly
rolling our own.

"State Management" is objects in an observer pattern. Things like derived values
and effects are secondary features, these can be implemented in your own classes.
All changes are made through immer for immutability.

```shell
pnpm i @ethang/store
```

## Create a store:

```ts
import { BaseStore } from "@ethang/store";

class MyStore extends BaseStore<{ count: number }> {
  public constructor() {
    super({ count: 0 });
  }

  public increment() {
    this.update((draft) => {
      draft.count += 1;
    });
  }
}

const store = new MyStore();
```

## Get from store

```ts
store.state; // { count: 0 }
```

## Prevent renders

```ts
import { BaseStore } from "@ethang/store";

class MyStore extends BaseStore<{ count: number }> {
  public constructor() {
    super({ count: 0 });
  }

  public increment() {
    this.update((draft) => {
      draft.count += 1;
    }, false); // Passing false will update state, but not notify subscribers
  }
}

export const store = new MyStore();
```

## Subscribe to changes

```ts
const unsubscribe = store.subscribe((state) => {
  console.log(`Count is now ${state.count}`);
});

unsubscribe(); // Don't forget to clean up.
```

## React subscriptions

useStore takes the following parameters:

- store - An instance of your store
- selector - to select the values you want to return
- isEqual (optional) - A comparison function

```tsx
import { useStore } from "@ethang/store/use-base-store";

// Do not waste renders and abstractions on trying to instantiate classes inside components or hooks
// If you want a particular store instance to be reusuable across components, export it from the module.
const store = new MyStore();

const MyComponent = () => {
    const count = useStore(store, (state) => state.count);

    <div>{count}</div>;
}
```

### Global Cleanup

When the # of subscribers reaches 0 after an unsubscription, an AbortController will run abort(), this can be used to cleanup event listeners, or cancel async operations such as fetch.

When the first subscription is added the controller will be reset.

```ts
const defaultState = {
    // eslint-disable-next-line compat/compat
    isOnline: globalThis.navigator.onLine,
    onOffline: undefined as (() => void) | undefined,
    onOnline: undefined as (() => void) | undefined,
};

type ExampleStoreState = typeof defaultState;

class OnlineStore extends BaseStore<ExampleStoreState> {
    public constructor(initialState?: Omit<ExampleStoreState, "isOnline">) {
        super({
            ...defaultState,
            ...initialState,
        });

        globalThis.addEventListener(
            "online",
            () => {
                this.update((state) => {
                    state.isOnline = true;
                });
                this.state.onOnline?.();
            },
            { signal: this.cleanupSignal },
        );

        globalThis.addEventListener(
            "offline",
            () => {
                this.update((state) => {
                    state.isOnline = false;
                });
                this.state.onOffline?.();
            },
            { signal: this.cleanupSignal },
        );
    }
}
```

## Features that won't be implemented

### Async

If you need TanStack Query features, I would recommend using [TanStack Query](https://tanstack.com/query/latest). Within your own classes you can return queryOptions and mutationOptions.

```ts
import { queryOptions, useQuery } from "@tanstack/react-query";

class MyStore extends BaseStore<{ count: number }> {
  public constructor() {
    super({ count: 0 });
  }

  public increment() {
    this.update((draft) => {
      draft.count += 1;
    });
  }

  public getAllCounts() {
    return queryOptions({
      queryKey: ["allCounts"],
      queryFn: async () => {
        // logic
      },
    });
  }
}

const store = new MyStore();

const MyComponent = () => {
    const { data, isPending } = useQuery(store.getAllCounts());
    
    // UI
}
```

### Derived Values

With control over your own class, this is not the responsibility of the library. You can also memoize this value on your own.

```ts
type Person = {
  firstName: string;
  lastName: string;
  fullName: string;
};

class MyStore extends BaseStore<Person> {
  public constructor() {
    super({ firstName: "John", lastName: "Doe" });
    this.state.fullName = `${this.firstName} ${this.lastName}`;
  }

  public increment() {
    this.update((draft) => {
      draft.count += 1;
    });
  }
}

const store = new MyStore();
```

### Effects

This logic is also not the library's responsibility.

```ts
import { queryOptions } from "@tanstack/react-query";

class MyStore extends BaseStore<Person & { isLoggedIn: boolean }> {
  public constructor() {
    super({ firstName: "John", lastName: "Doe", isLoggedIn: false });
    this.state.fullName = `${this.firstName} ${this.lastName}`;
  }

  public login() {
    return {
      mutationFn: async () => {
        const response = await fetch("/api/login", {
          ...requestInit,
        });

        if (response.ok) {
          this.update((draft) => {
            this.isLoggedIn = true;
          }, false); // Let TanStack Query notify subscribers
        }
      },
    };
  }
}

const store = new MyStore();
```
