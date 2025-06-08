import { beforeEach, describe, expect, it, vi } from "vitest";

import { BaseStore } from "../src/index.js";

type TestState = {
  count: number;
  name: string;
};

class ConcreteStore extends BaseStore<TestState> {
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
});
