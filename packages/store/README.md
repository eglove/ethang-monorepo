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

const store = new Store();
```

## Get from store

```ts
store.state; // { count: 0 }
```

### Prevent renders

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

const store = new Store();
```

## Subscribe to changes

```ts
const unsubscribe = store.subscribe((state) => {
  console.log(`Count is now ${state.count}`);
});

unsubscribe(); // Don't forget to clean up.
```

## React subscriptions

useBaseStore takes the following parameters:

- store - An instance of your store
- selector - to select the values you want to return
- isEqual (optional) - A comparison function

```tsx
import { useBaseStore } from "@ethang/store/use-base-store";

const count = useBaseStore(store, (draft) => draft.count);

<div>{count}</div>;
```

### Features that won't be implemented

### Async

If you need React Query features, I would suggest using React Query. Within your own classes you can return queryOptions and mutationOptions.

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

const store = new Store();

const { data, isPending } = useQuery(store.getAllCounts());
```

#### Derived Values

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

const store = new Store();
```

#### Effects

This logic is also your responsibility, not the library.

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
          });
        }
      },
    };
  }
}

const store = new Store();
```
