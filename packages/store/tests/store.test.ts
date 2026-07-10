import { Effect, Fiber, Stream } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeStore, readUnsafe, type Store } from "../src/store.js";

type TestState = {
  count: number;
  items: string[];
  name: string;
};

const initialState: TestState = {
  count: 0,
  items: [],
  name: "Initial"
};

let store: Store<TestState>;

beforeEach(() => {
  // eslint-disable-next-line unicorn/no-top-level-assignment-in-function
  store = makeStore(initialState);
});

describe("makeStore", () => {
  it("initializes with the provided state", () => {
    expect(store.state).toEqual(initialState);
  });

  it("returns the current state via the synchronous getter", () => {
    expect(store.state.count).toBe(0);
    expect(store.state.name).toBe("Initial");
  });

  it("returns the current state via get", () => {
    expect(store.get).toEqual(initialState);
  });
});

describe("set", () => {
  it("replaces the state and notifies subscribers", async () => {
    return Effect.runPromise(
      Effect.gen(function* () {
        const subscriber = vi.fn();
        const fiber = yield* store.changes.pipe(
          Stream.tap((v) => {
            return Effect.sync(() => {
              return subscriber(v);
            });
          }),
          Stream.take(2),
          Stream.runDrain,
          Effect.fork
        );

        // Let the forked fiber subscribe to the underlying pubsub
        // before we publish. Without this yield, the parent's
        // `set` races the fiber and the publish happens before
        // the subscription is established.
        yield* Effect.yieldNow();

        store.set({ count: 1, items: [], name: "Updated" });
        yield* Fiber.join(fiber);

        expect(store.state.count).toBe(1);
        expect(subscriber).toHaveBeenCalledTimes(2);
        expect(subscriber).toHaveBeenNthCalledWith(1, initialState);
        expect(subscriber).toHaveBeenNthCalledWith(2, {
          count: 1,
          items: [],
          name: "Updated"
        });
      })
    );
  });
});

describe("update", () => {
  it("supports immer draft mutations and notifies subscribers", async () => {
    return Effect.runPromise(
      Effect.gen(function* () {
        const subscriber = vi.fn();
        const fiber = yield* store.changes.pipe(
          Stream.tap((v) => {
            return Effect.sync(() => {
              return subscriber(v);
            });
          }),
          Stream.take(2),
          Stream.runDrain,
          Effect.fork
        );

        yield* Effect.yieldNow();

        const next = store.update((draft) => {
          draft.count += 1;
        });
        yield* Fiber.join(fiber);

        expect(next).toEqual({ count: 1, items: [], name: "Initial" });
        expect(store.state.count).toBe(1);
        expect(subscriber).toHaveBeenCalledTimes(2);
      })
    );
  });

  it("preserves unchanged fields after a draft mutation", () => {
    const next = store.update((draft) => {
      draft.count = 5;
    });
    expect(next.count).toBe(5);
    expect(next.name).toBe(initialState.name);
    expect(next.items).toEqual([]);
  });

  it("returns the next state synchronously", () => {
    expect(store.state.count).toBe(0);
    const first = store.update((draft) => {
      draft.count += 1;
    });
    expect(first.count).toBe(1);
    expect(store.state.count).toBe(1);
    const second = store.update((draft) => {
      draft.count += 1;
    });
    expect(second.count).toBe(2);
    expect(store.state.count).toBe(2);
  });

  it("supports recipes that return a new value", () => {
    const next = store.update((draft) => {
      return { ...draft, count: 7 };
    });
    expect(next.count).toBe(7);
    expect(store.state.count).toBe(7);
  });

  it("skips the notify path when the recipe produces no change", () => {
    const listener = vi.fn();
    store.subscribe(listener);
    const next = store.update((draft) => {
      // Touching nothing: Immer returns the same reference.
      return draft;
    });
    expect(next).toBe(initialState);
    expect(store.state).toBe(initialState);
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("changes stream", () => {
  it("emits the initial value", async () => {
    return Effect.runPromise(
      store.changes.pipe(Stream.take(1), Stream.runCollect)
    ).then((chunk) => {
      const values = [...chunk];
      expect(values[0]).toEqual(initialState);
    });
  });

  it("emits subsequent updates", async () => {
    return Effect.runPromise(
      Effect.gen(function* () {
        const fiber = yield* store.changes.pipe(
          Stream.take(3),
          Stream.runCollect,
          Effect.fork
        );

        yield* Effect.yieldNow();

        store.update((draft) => {
          draft.count = 1;
        });
        store.update((draft) => {
          draft.count = 2;
        });

        const chunk = yield* Fiber.join(fiber);
        const values = [...chunk];
        expect(values).toHaveLength(3);
        expect(values[0]).toEqual(initialState);
        expect(values[1]?.count).toBe(1);
        expect(values[2]?.count).toBe(2);
      })
    );
  });
});

describe("reset", () => {
  it("resets to the original initial state when called with no argument", () => {
    store.update((draft) => {
      draft.count = 5;
    });
    expect(store.state.count).toBe(5);

    store.reset();
    expect(store.state.count).toBe(0);
  });

  it("resets to a new state when called with an argument", () => {
    const newState: TestState = {
      count: 42,
      items: ["a", "b"],
      name: "Fresh"
    };

    store.reset(newState);
    expect(store.state).toEqual(newState);

    store.update((draft) => {
      draft.count = 100;
    });
    store.reset();
    expect(store.state).toEqual(newState);
  });
});

describe("subscribe", () => {
  it("invokes a listener on every set/update/reset", () => {
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.set({ count: 1, items: [], name: "A" });
    expect(listener).toHaveBeenCalledTimes(1);

    store.update((draft) => {
      draft.count += 1;
    });
    expect(listener).toHaveBeenCalledTimes(2);

    store.reset();
    expect(listener).toHaveBeenCalledTimes(3);

    unsubscribe();
    store.set({ count: 9, items: [], name: "B" });
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("supports multiple subscribers and only unsubscribes the right one", () => {
    const a = vi.fn();
    const b = vi.fn();
    const unsubscribeA = store.subscribe(a);
    store.subscribe(b);

    store.set({ count: 1, items: [], name: "A" });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);

    unsubscribeA();
    store.set({ count: 2, items: [], name: "B" });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);
  });
});

describe("readUnsafe", () => {
  it("returns the current state synchronously", () => {
    expect(readUnsafe(store)).toEqual(initialState);

    store.set({ count: 7, items: [], name: "X" });
    expect(readUnsafe(store)).toEqual({
      count: 7,
      items: [],
      name: "X"
    });
  });
});
