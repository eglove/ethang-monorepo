import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BaseStore } from "../src/index.js";
import { useStore } from "../src/use-store.js";

type TestState = {
  count: number;
  name: string;
};

class TestStore extends BaseStore<TestState> {
  public constructor(state: TestState) {
    super(state);
  }

  public increment() {
    this.update((draft) => {
      draft.count += 1;
    });
  }

  public override update(updater: (draft: TestState) => void) {
    super.update(updater);
  }
}

describe("useStore", () => {
  it("should return the selected state", () => {
    const store = new TestStore({ count: 0, name: "Initial" });
    const { result } = renderHook(() => {
      return useStore(store, (state) => {
        return state.count;
      });
    });

    expect(result.current).toBe(0);
  });

  it("should update when the selected state changes", () => {
    const store = new TestStore({ count: 0, name: "Initial" });
    const { result } = renderHook(() => {
      return useStore(store, (state) => {
        return state.count;
      });
    });

    act(() => {
      store.increment();
    });

    expect(result.current).toBe(1);
  });

  it("should not update when an unselected part of the state changes", () => {
    const store = new TestStore({ count: 0, name: "Initial" });
    let renderCount = 0;
    const { result } = renderHook(() => {
      renderCount += 1;
      return useStore(store, (state) => {
        return state.count;
      });
    });

    expect(renderCount).toBe(1);

    act(() => {
      store.update((draft) => {
        draft.name = "New Name";
      });
    });

    expect(renderCount).toBe(1);
    expect(result.current).toBe(0);
  });

  it("should use the isEqual function for comparison", () => {
    const store = new TestStore({ count: 0, name: "Initial" });
    let renderCount = 0;
    const { result } = renderHook(() => {
      renderCount += 1;
      return useStore(
        store,
        (state) => {
          return { count: state.count };
        },
        (a, b) => {
          return a.count === b.count;
        },
      );
    });

    expect(renderCount).toBe(1);

    act(() => {
      store.increment();
    });

    expect(renderCount).toBe(2);
    expect(result.current).toEqual({ count: 1 });

    act(() => {
      store.update((draft) => {
        draft.name = "New Name";
      });
    });

    expect(renderCount).toBe(2);
  });
});
