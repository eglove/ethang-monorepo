/* eslint-disable lodash/prefer-noop,@typescript-eslint/no-empty-function,@typescript-eslint/strict-void-return,lodash/prefer-lodash-method,@typescript-eslint/no-unsafe-type-assertion */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BaseStore } from "../src/index.js";

type TestState = {
  count: number;
  items: string[];
  name: string;
  person: {
    name: {
      firstName: string;
      lastName: string;
    };
  };
};

class ConcreteStore extends BaseStore<TestState> {
  public onFirstSubscriberMock = vi.fn();

  public get publicCleanupSignal() {
    return this.cleanupSignal;
  }

  public constructor(initialState: TestState) {
    super(initialState);
  }

  public getPublicCleanupSignal() {
    return this.cleanupSignal;
  }

  public increment() {
    this.update((draft) => {
      draft.count += 1;
    });
  }

  public publicUpdate(
    updater: (draft: TestState) => void,
    shouldNotify = true,
  ) {
    this.update(updater, shouldNotify);
  }

  public setName(newName: string, notify = true) {
    this.update((draft) => {
      draft.name = newName;
    }, notify);
  }

  protected override onFirstSubscriber() {
    this.onFirstSubscriberMock();
  }
}

// eslint-disable-next-line sonar/max-lines-per-function
describe("BaseStore", () => {
  let store: ConcreteStore;
  const initialState: TestState = {
    count: 0,
    items: [],
    name: "Initial",
    person: {
      name: {
        firstName: "John",
        lastName: "Doe",
      },
    },
  };

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
    });

    it("should allow multiple subscribers", () => {
      const subscriber1 = vi.fn();
      const subscriber2 = vi.fn();
      store.subscribe(subscriber1);
      store.subscribe(subscriber2);

      store.increment();

      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber2).toHaveBeenCalledTimes(1);
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
    });

    it("should not notify subscribers if shouldNotify is false", () => {
      const subscriber = vi.fn();
      store.subscribe(subscriber);

      store.setName("New Name", false);

      expect(store.state.name).toBe("New Name");
      expect(subscriber).not.toHaveBeenCalled();

      store.increment();
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it("should handle updates that do not change the state (immer optimization)", () => {
      const subscriber = vi.fn();
      store.subscribe(subscriber);

      // @ts-expect-error ignore for test
      store.update((draft) => {
        draft.count = initialState.count;
      });

      expect(store.state.count).toBe(initialState.count);
      expect(subscriber).toHaveBeenCalledTimes(0);
    });
  });

  describe("cleanupSignal", () => {
    it("should initialize with an active signal", () => {
      expect(store.publicCleanupSignal.aborted).toBe(false);
    });

    it("should abort the signal when the last subscriber unsubscribes", () => {
      const unsubscribe1 = store.subscribe(() => {});

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
      const unsubscribe1 = store.subscribe(() => {});
      const initialSignal = store.publicCleanupSignal;
      unsubscribe1();

      expect(initialSignal.aborted).toBe(true);

      const unsubscribe2 = store.subscribe(() => {});
      const newSignal = store.publicCleanupSignal;

      expect(newSignal).not.toBe(initialSignal);
      expect(newSignal.aborted).toBe(false);

      unsubscribe2();
      expect(newSignal.aborted).toBe(true);
    });

    it("should not abort the signal if there are still active subscribers", () => {
      const unsubscribe1 = store.subscribe(() => {});
      const unsubscribe2 = store.subscribe(() => {});

      const initialSignal = store.publicCleanupSignal;

      unsubscribe1();
      expect(initialSignal.aborted).toBe(false);

      unsubscribe2();
      expect(initialSignal.aborted).toBe(true);
    });
  });

  describe("onFirstSubscriber", () => {
    it("should call onFirstSubscriber when the first subscriber is added", () => {
      const unsubscribe = store.subscribe(() => {});
      expect(store.onFirstSubscriberMock).toHaveBeenCalledTimes(1);
      unsubscribe();
    });

    it("should NOT call onFirstSubscriber for subsequent subscribers if already active", () => {
      const unsubscribe1 = store.subscribe(() => {});
      expect(store.onFirstSubscriberMock).toHaveBeenCalledTimes(1);

      const unsubscribe2 = store.subscribe(() => {});
      expect(store.onFirstSubscriberMock).toHaveBeenCalledTimes(1); // Still 1 call

      unsubscribe1();
      unsubscribe2();
    });

    it("should call onFirstSubscriber again if all subscribers leave and then a new one joins", () => {
      const unsubscribe1 = store.subscribe(() => {});
      expect(store.onFirstSubscriberMock).toHaveBeenCalledTimes(1);

      unsubscribe1(); // All subscribers leave, _controller should abort

      const unsubscribe2 = store.subscribe(() => {});
      expect(store.onFirstSubscriberMock).toHaveBeenCalledTimes(2); // Called again
      unsubscribe2();
    });

    it("should create a new AbortController when the first subscriber is added", () => {
      const initialSignal = store.getPublicCleanupSignal();
      const unsubscribe1 = store.subscribe(() => {});
      const afterFirstSubscriberSignal = store.getPublicCleanupSignal();

      expect(afterFirstSubscriberSignal).not.toBe(initialSignal); // A new controller was made
      expect(afterFirstSubscriberSignal.aborted).toBe(false);

      unsubscribe1();
      expect(afterFirstSubscriberSignal.aborted).toBe(true); // Should be aborted after unsubscribe

      const unsubscribe2 = store.subscribe(() => {});
      const afterSecondSubscriberSignal = store.getPublicCleanupSignal();
      expect(afterSecondSubscriberSignal).not.toBe(afterFirstSubscriberSignal); // A new controller again
      expect(afterSecondSubscriberSignal.aborted).toBe(false);

      unsubscribe2();
    });

    it("cleanupSignal should be aborted when the last subscriber unsubscribes", () => {
      const unsubscribe1 = store.subscribe(() => {});
      const signal = store.getPublicCleanupSignal();
      expect(signal.aborted).toBe(false);

      const unsubscribe2 = store.subscribe(() => {});
      expect(signal.aborted).toBe(false); // Still false as subscribers exist

      unsubscribe1();
      expect(signal.aborted).toBe(false); // Still false, one subscriber left

      unsubscribe2(); // Last subscriber leaves
      expect(signal.aborted).toBe(true);
      expect(signal.reason).toBe("unmount");
    });
  });

  describe("update method and path logic", () => {
    it("should update the state correctly", () => {
      const newCount = 5;
      store.publicUpdate((draft) => {
        draft.count = newCount;
      });
      expect(store.state.count).toBe(newCount);
      expect(store.state.name).toBe(initialState.name); // Other properties should remain unchanged
    });

    it("should notify all subscribers with the new state when changes occur", () => {
      const subscriber1 = vi.fn();
      const subscriber2 = vi.fn();

      store.subscribe(subscriber1);
      store.subscribe(subscriber2);

      const newCount = 10;
      store.publicUpdate((draft) => {
        draft.count = newCount;
      });

      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber1).toHaveBeenCalledWith(
        expect.objectContaining({ count: newCount }),
      );
      expect(subscriber2).toHaveBeenCalledTimes(1);
      expect(subscriber2).toHaveBeenCalledWith(
        expect.objectContaining({ count: newCount }),
      );
      expect(store.state.count).toBe(newCount);
    });

    it("should NOT notify subscribers if shouldNotify is false", () => {
      const subscriber = vi.fn();
      store.subscribe(subscriber);

      store.publicUpdate((draft) => {
        draft.count = 20;
      }, false); // shouldNotify is false

      expect(subscriber).not.toHaveBeenCalled();
      expect(store.state.count).toBe(20); // State still updates
    });

    it("should NOT notify subscribers if no patches are generated (state did not change)", () => {
      const subscriber = vi.fn();
      store.subscribe(subscriber);

      // Update function that makes no actual change to the state
      store.publicUpdate((draft) => {
        // eslint-disable-next-line no-self-assign
        draft.count = draft.count; // No change
      });

      expect(subscriber).not.toHaveBeenCalled();
      expect(store.state.count).toBe(initialState.count);
    });

    it("should notify subscribers with a complex state change", () => {
      const subscriber = vi.fn();
      store.subscribe(subscriber);

      const newItem = "new-item";
      store.publicUpdate((draft) => {
        draft.count = 1;
        draft.name = "updated";
        draft.items.push(newItem);
      });

      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 1,
          items: [newItem],
          name: "updated",
        }),
      );
      expect(store.state.items).toContain(newItem);
    });
  });

  describe("destroy", () => {
    it("should set destroyed to true", () => {
      expect(store.destroyed).toBe(false);
      store.destroy();
      expect(store.destroyed).toBe(true);
    });

    it("should abort cleanupSignal", () => {
      const unsubscribe = store.subscribe(() => {});
      const signal = store.publicCleanupSignal;
      expect(signal.aborted).toBe(false);

      store.destroy();
      expect(signal.aborted).toBe(true);
      expect(signal.reason).toBe("destroy");
      unsubscribe();
    });

    it("should return a function from subscribe after destroy", () => {
      store.destroy();
      const result = store.subscribe(vi.fn());
      expect(typeof result).toBe("function");
      // Calling the returned noop should not throw
      result();
    });

    it("should not change state after destroy when update is called", () => {
      store.destroy();
      const stateBefore = store.state;
      store.increment();
      expect(store.state).toBe(stateBefore);
      expect(store.state.count).toBe(0);
    });

    it("should not throw on double destroy", () => {
      store.destroy();
      expect(() => {
        store.destroy();
      }).not.toThrow();
      expect(store.destroyed).toBe(true);
    });

    it("should clear subscribers on destroy", () => {
      const subscriber = vi.fn();
      store.subscribe(subscriber);
      store.destroy();
      store.increment(); // This is a no-op since destroyed
      expect(subscriber).not.toHaveBeenCalled();
    });

    it("should stop remaining callbacks when destroy is called during drain", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      store.subscribe(() => {
        callback1();
        store.destroy();
      });
      store.subscribe(() => {
        callback2();
      });

      store.increment();

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe("reentrant update", () => {
    it("should batch reentrant updates from subscriber callbacks", () => {
      const subscriber = vi.fn();
      let reentrantDone = false;

      store.subscribe((state) => {
        subscriber(state);
        // Trigger a reentrant update only once
        if (!reentrantDone) {
          reentrantDone = true;
          store.setName("Reentrant");
        }
      });

      store.increment();

      // Final state should have both mutations
      expect(store.state.count).toBe(1);
      expect(store.state.name).toBe("Reentrant");
      // subscriber called twice: once for increment, once for reentrant
      expect(subscriber).toHaveBeenCalledTimes(2);
    });

    it("should surface depth overflow error via queueMicrotask", () => {
      const captured: (() => void)[] = [];
      const queueMicrotaskSpy = vi
        .spyOn(globalThis, "queueMicrotask")
        .mockImplementation((callback: () => void) => {
          captured.push(callback);
        });

      // Subscribe a callback that always triggers another update (infinite loop)
      store.subscribe(() => {
        store.increment();
      });

      store.increment();

      // Find the overflow error callback
      const overflowCallback = captured.find((callback) => {
        try {
          callback();
          return false;
        } catch (error) {
          return (error as Error).message.includes("reentrant depth overflow");
        }
      });
      expect(overflowCallback).toBeDefined();

      queueMicrotaskSpy.mockRestore();
    });

    it("should catch throwing subscriber and still notify other subscribers", () => {
      const captured: (() => void)[] = [];
      const queueMicrotaskSpy = vi
        .spyOn(globalThis, "queueMicrotask")
        .mockImplementation((callback: () => void) => {
          captured.push(callback);
        });

      const errorSubscriber = vi.fn(() => {
        throw new Error("subscriber error");
      });
      const normalSubscriber = vi.fn();

      store.subscribe(errorSubscriber);
      store.subscribe(normalSubscriber);

      store.increment();

      // Both should be invoked
      expect(errorSubscriber).toHaveBeenCalledTimes(1);
      expect(normalSubscriber).toHaveBeenCalledTimes(1);

      // Error surfaced via queueMicrotask
      const errorCallback = captured.find((callback) => {
        try {
          callback();
          return false;
        } catch (error) {
          return "subscriber error" === (error as Error).message;
        }
      });
      expect(errorCallback).toBeDefined();

      queueMicrotaskSpy.mockRestore();
    });
  });

  describe("reset", () => {
    it("should restore original constructor state and notify subscribers", () => {
      const subscriber = vi.fn();
      store.subscribe(subscriber);

      store.increment();
      store.increment();
      expect(store.state.count).toBe(2);

      store.reset();
      expect(store.state).toEqual(initialState);
      // subscriber called for 2 increments + 1 reset
      expect(subscriber).toHaveBeenCalledTimes(3);
    });

    it("should reset to provided state and notify subscribers", () => {
      const subscriber = vi.fn();
      store.subscribe(subscriber);

      const newState: TestState = {
        count: 99,
        items: ["x"],
        name: "Reset",
        person: { name: { firstName: "A", lastName: "B" } },
      };
      store.reset(newState);
      expect(store.state).toEqual(newState);
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it("should preserve original initialState when reset() called with no arg", () => {
      store.increment();
      store.reset();
      expect(store.state).toEqual(initialState);

      // Reset again — should still be original
      store.increment();
      store.reset();
      expect(store.state).toEqual(initialState);
    });

    it("should update stored initialState when reset(newState) is called", () => {
      const newState: TestState = {
        count: 50,
        items: [],
        name: "New Init",
        person: { name: { firstName: "X", lastName: "Y" } },
      };
      store.reset(newState);
      expect(store.state).toEqual(newState);

      // Subsequent reset() without arg should use the new initialState
      store.increment();
      store.reset();
      expect(store.state).toEqual(newState);
    });

    it("should enqueue reset during drain (reentrant-safe)", () => {
      let resetDone = false;

      store.subscribe(() => {
        if (!resetDone) {
          resetDone = true;
          store.reset();
        }
      });

      store.increment();
      // After drain completes, state should be the reset (initial) state
      expect(store.state).toEqual(initialState);
    });

    it("should be a no-op after destroy", () => {
      store.increment();
      const stateBeforeDestroy = store.state;
      store.destroy();
      store.reset();
      expect(store.state).toBe(stateBeforeDestroy);
    });

    it("should not abort cleanupSignal", () => {
      const unsubscribe = store.subscribe(() => {});
      const signal = store.publicCleanupSignal;

      store.reset();
      expect(signal.aborted).toBe(false);
      unsubscribe();
    });
  });
});
