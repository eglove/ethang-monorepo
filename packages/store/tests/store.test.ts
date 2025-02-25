import { beforeEach, describe, expect, it, vi } from "vitest";

import { Store } from "../src/index.js";

type TestState = {
  count: number;
  name: string;
  nested: {
    value: string;
  };
};

describe("Store", () => {
  let store: Store<TestState>;
  const initialState: TestState = {
    count: 0,
    name: "test",
    nested: {
      value: "initial",
    },
  };

  beforeEach(() => {
    store = new Store<TestState>(initialState);
  });

  describe("get", () => {
    it("should return the entire state when called without selector", () => {
      expect(store.get()).toEqual(initialState);
    });

    it("should return selected state when called with selector", () => {
      expect(store.get((state) => state.count)).toBe(0);
      expect(store.get((state) => state.name)).toBe("test");
    });
  });

  describe("set", () => {
    it("should update the state immutably", () => {
      store.set((draft) => {
        draft.count = 1;
      });

      expect(store.get((state) => state.count)).toBe(1);
      expect(store.get()).not.toBe(initialState);
    });

    it("should handle nested updates", () => {
      store.set((draft) => {
        draft.nested.value = "updated";
      });

      expect(store.get((state) => state.nested.value)).toBe("updated");
    });
  });

  describe("subscribe", () => {
    it("should notify listeners when state changes", () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.set((draft) => {
        draft.count = 1;
      });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ count: 1 }),
      );
    });

    it("should allow unsubscribing", () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      unsubscribe();

      store.set((draft) => {
        draft.count = 1;
      });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("resetState", () => {
    it("should reset state to initial values", () => {
      store.set((draft) => {
        draft.count = 100;
        draft.name = "changed";
      });

      store.resetState();

      expect(store.get()).toEqual(initialState);
    });
  });

  describe("derived values", () => {
    it("should compute derived values based on state", () => {
      store.addDerived("doubleCount", (state) => state.count * 2, "count");

      store.set((draft) => {
        draft.count = 5;
      });

      expect(store.getDerived<number>("doubleCount")).toBe(10);
    });

    it("should remove derived values", () => {
      store.addDerived("doubleCount", (state) => state.count * 2, "count");
      store.removeDerived("doubleCount");

      store.set((draft) => {
        draft.count = 5;
      });

      expect(store.getDerived<number>("doubleCount")).toBe(undefined);
    });
  });

  describe("effects", () => {
    it("should execute effects when state changes", () => {
      const effectFunction = vi.fn();
      store.addEffect("testEffect", effectFunction, "count");

      store.set((draft) => {
        draft.count = 1;
      });

      expect(effectFunction).toHaveBeenCalledWith(
        expect.objectContaining({ count: 1 }),
      );
    });

    it("should remove derived effects", () => {
      const effectFunction = vi.fn();
      store.addEffect("testEffect", effectFunction, "count");
      store.removeEffect("testEffect");

      store.set((draft) => {
        draft.count = 5;
      });

      store.set((draft) => {
        draft.count = 1;
      });

      expect(effectFunction).not.toHaveBeenCalledWith(
        expect.objectContaining({ count: 1 }),
      );
    });
  });
});
