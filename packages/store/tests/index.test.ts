import { beforeEach, describe, expect, it, vi } from "vitest";

import { BaseStore } from "../src/index.js";

type TestState = {
  count: number;
  name: string;
};

class ConcreteStore extends BaseStore<TestState> {
  public get publicCleanupSignal() {
    return this.cleanupSignal;
  }

  public constructor(initialState: TestState) {
    super(initialState);
  }

  public increment() {
    this.update((draft) => {
      draft.count += 1;
    });
  }

  public setName(newName: string, notify = true) {
    this.update((draft) => {
      draft.name = newName;
    }, notify);
  }
}

describe("BaseStore", () => {
  let store: ConcreteStore;
  const initialState: TestState = { count: 0, name: "Initial" };

  beforeEach(() => {
    store = new ConcreteStore(initialState);
  });

  it("should initialize with the provided state", () => {
    expect(store.state).toEqual(initialState);
  });

  it("should return the current state via the getter", () => {
    expect(store.state.count).toBe(0);
    expect(store.state.name).toBe("Initial");
  });

  describe("subscribe", () => {
    it("should allow subscribing to state changes", () => {
      const subscriber = vi.fn();
      store.subscribe(subscriber);

      store.increment();

      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith({ count: 1, name: "Initial" });
    });

    it("should allow multiple subscribers", () => {
      const subscriber1 = vi.fn();
      const subscriber2 = vi.fn();
      store.subscribe(subscriber1);
      store.subscribe(subscriber2);

      store.increment();

      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber2).toHaveBeenCalledTimes(1);
      expect(subscriber1).toHaveBeenCalledWith({ count: 1, name: "Initial" });
      expect(subscriber2).toHaveBeenCalledWith({ count: 1, name: "Initial" });
    });

    it("should return an unsubscribe function", () => {
      const subscriber = vi.fn();
      const unsubscribe = store.subscribe(subscriber);

      unsubscribe();
      store.increment();

      expect(subscriber).not.toHaveBeenCalled();
    });

    it("should not call unsubscribed functions", () => {
      const subscriber1 = vi.fn();
      const subscriber2 = vi.fn();
      const unsubscribe1 = store.subscribe(subscriber1);
      store.subscribe(subscriber2);

      unsubscribe1();
      store.increment();

      expect(subscriber1).not.toHaveBeenCalled();
      expect(subscriber2).toHaveBeenCalledTimes(1);
    });
  });

  describe("update", () => {
    it("should update the state immutably using immer", () => {
      const originalState = store.state;
      store.increment();
      const newState = store.state;

      expect(newState.count).toBe(1);
      // Ensure the original state object reference is different
      expect(newState).not.toBe(originalState);
      // Ensure immutability for nested objects if applicable
      expect(newState.name).toBe(originalState.name); // Primitive property is copied
    });

    it("should notify subscribers by default when state is updated", () => {
      const subscriber = vi.fn();
      store.subscribe(subscriber);

      store.increment();

      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith({ count: 1, name: "Initial" });
    });

    it("should not notify subscribers if shouldNotify is false", () => {
      const subscriber = vi.fn();
      store.subscribe(subscriber);

      store.setName("New Name", false);

      expect(store.state.name).toBe("New Name");
      expect(subscriber).not.toHaveBeenCalled();

      store.increment();
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith({ count: 1, name: "New Name" });
    });

    it("should handle updates that do not change the state (immer optimization)", () => {
      const subscriber = vi.fn();
      store.subscribe(subscriber);

      // @ts-expect-error ignore for test
      store.update((draft) => {
        draft.count = initialState.count;
      });

      expect(store.state.count).toBe(initialState.count);
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith(initialState);
    });
  });

  describe("cleanupSignal", () => {
    it("should initialize with an active signal", () => {
      expect(store.publicCleanupSignal.aborted).toBe(false);
    });

    it("should abort the signal when the last subscriber unsubscribes", () => {
      // eslint-disable-next-line lodash/prefer-noop,@typescript-eslint/no-empty-function
      const unsubscribe1 = store.subscribe(() => {});
      // eslint-disable-next-line lodash/prefer-noop,@typescript-eslint/no-empty-function
      const unsubscribe2 = store.subscribe(() => {});

      // AbortController is recreated when the first subscriber is added,
      // so we need to get a reference to the signal *after* the first subscribe.
      const initialSignal = store.publicCleanupSignal;
      const abortSpyOnSignal = vi.spyOn(initialSignal, "aborted", "get"); // Spy on the 'aborted' getter

      unsubscribe1();
      expect(initialSignal.aborted).toBe(false); // Still active because one subscriber remains

      unsubscribe2();
      expect(initialSignal.aborted).toBe(true); // Should be aborted now
      expect(abortSpyOnSignal).toHaveBeenCalledTimes(2); // Ensure 'aborted' getter was accessed after unsubscribe
    });

    it("should create a new AbortController when a subscriber is added after a cleanup", () => {
      // eslint-disable-next-line lodash/prefer-noop,@typescript-eslint/no-empty-function
      const unsubscribe1 = store.subscribe(() => {});
      const initialSignal = store.publicCleanupSignal;
      unsubscribe1();

      expect(initialSignal.aborted).toBe(true);

      // eslint-disable-next-line lodash/prefer-noop,@typescript-eslint/no-empty-function
      const unsubscribe2 = store.subscribe(() => {});
      const newSignal = store.publicCleanupSignal;

      expect(newSignal).not.toBe(initialSignal);
      expect(newSignal.aborted).toBe(false);

      unsubscribe2();
      expect(newSignal.aborted).toBe(true);
    });

    it("should not abort the signal if there are still active subscribers", () => {
      // eslint-disable-next-line lodash/prefer-noop,@typescript-eslint/no-empty-function
      const unsubscribe1 = store.subscribe(() => {});
      // eslint-disable-next-line lodash/prefer-noop,@typescript-eslint/no-empty-function
      const unsubscribe2 = store.subscribe(() => {});

      const initialSignal = store.publicCleanupSignal;

      unsubscribe1();
      expect(initialSignal.aborted).toBe(false);

      unsubscribe2();
      expect(initialSignal.aborted).toBe(true);
    });
  });
});
