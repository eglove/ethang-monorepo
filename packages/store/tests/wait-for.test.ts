/* eslint-disable lodash/prefer-noop,@typescript-eslint/no-empty-function */
import { describe, expect, it, vi } from "vitest";

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

  public setCount(value: number) {
    this.update((draft) => {
      draft.count = value;
    });
  }

  public setName(value: string) {
    this.update((draft) => {
      draft.name = value;
    });
  }
}

const createStore = () =>
  new ConcreteStore({
    count: 0,
    name: "Initial",
  });

describe("waitFor", () => {
  it("should resolve immediately when predicate is already true", async () => {
    const store = createStore();
    const result = await store.waitFor((state) => 0 === state.count);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.count).toBe(0);
    }
  });

  it("should resolve after state change satisfies predicate", async () => {
    const store = createStore();
    const promise = store.waitFor((state) => 5 === state.count);

    // Trigger updates
    for (let index = 0; 5 > index; index += 1) {
      store.increment();
    }

    const result = await promise;
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.count).toBe(5);
    }
  });

  it("should return error when store is destroyed before predicate matches", async () => {
    const store = createStore();
    store.destroy();
    const result = await store.waitFor((state) => 5 === state.count);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Store is destroyed");
    }
  });

  it("should return error when store is destroyed while waiting", async () => {
    const store = createStore();
    // Subscribe to keep the signal active
    store.subscribe(() => {});

    const promise = store.waitFor((state) => 99 === state.count);

    store.destroy();

    const result = await promise;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Aborted");
    }
  });

  it("should return error when provided AbortSignal is already aborted", async () => {
    const store = createStore();
    const controller = new AbortController();
    controller.abort();

    const result = await store.waitFor(
      (state) => 5 === state.count,
      controller.signal,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Signal already aborted");
    }
  });

  it("should return error when provided AbortSignal aborts while waiting", async () => {
    const store = createStore();
    store.subscribe(() => {});
    const controller = new AbortController();

    const promise = store.waitFor(
      (state) => 99 === state.count,
      controller.signal,
    );

    controller.abort();

    const result = await promise;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Aborted");
    }
  });

  it("should return error when cleanupSignal aborts via destroy", async () => {
    const store = createStore();
    // Add a subscriber so signal becomes active
    store.subscribe(() => {});

    const promise = store.waitFor((state) => 99 === state.count);

    // Destroy triggers controller abort and clears subscribers
    store.destroy();

    const result = await promise;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Aborted");
    }
  });

  it("should return error when predicate throws", async () => {
    const store = createStore();
    const result = await store.waitFor(() => {
      throw new Error("predicate error");
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("predicate error");
    }
  });

  it("should clean up internal subscription after resolving", async () => {
    const store = createStore();
    const subscribeSpy = vi.spyOn(store, "subscribe");

    const promise = store.waitFor((state) => 1 === state.count);
    store.increment();

    await promise;

    // After resolving, the internal subscription should be cleaned up
    // by calling the unsubscribe function. Verify by checking the
    // subscribe spy was called and increment doesn't cause issues
    expect(subscribeSpy).toHaveBeenCalledTimes(1);
    store.increment(); // Should not cause any issues
    expect(store.state.count).toBe(2);

    subscribeSpy.mockRestore();
  });

  it("should handle multiple concurrent waitFor calls with different predicates", async () => {
    const store = createStore();

    const promise1 = store.waitFor((state) => 3 === state.count);
    const promise2 = store.waitFor((state) => "Changed" === state.name);

    store.increment();
    store.increment();
    store.increment();
    store.setName("Changed");

    const [result1, result2] = await Promise.all([promise1, promise2]);

    expect(result1.ok).toBe(true);
    if (result1.ok) {
      expect(result1.value.count).toBe(3);
    }

    expect(result2.ok).toBe(true);
    if (result2.ok) {
      expect(result2.value.name).toBe("Changed");
    }
  });

  it("should return error when predicate throws during subscribe check", async () => {
    const store = createStore();
    let callCount = 0;

    const promise = store.waitFor(() => {
      callCount += 1;
      if (2 === callCount) {
        throw new Error("delayed predicate error");
      }
      return false;
    });

    store.increment();

    const result = await promise;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("delayed predicate error");
    }
  });
});
