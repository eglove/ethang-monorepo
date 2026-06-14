import { act, renderHook } from "@testing-library/react";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";
import { describe, expect, it, vi } from "vitest";

import { BaseStore } from "../src/index.js";
import { useStore } from "../src/use-store.js";

vi.mock("use-sync-external-store/with-selector", async (importOriginal) => {
  const actual = await importOriginal<object>();

  return {
    ...actual,
    useSyncExternalStoreWithSelector: vi.fn(
      (subscribe, getSnapshot, getServerSnapshot, selector, isEqual) => {
        // @ts-expect-error for test
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call
        return actual.useSyncExternalStoreWithSelector(
          subscribe,
          getSnapshot,
          getServerSnapshot,
          selector,
          isEqual
        );
      }
    )
  };
});

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
        }
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

  it("should provide getServerSnapshot to useSyncExternalStoreWithSelector", () => {
    const store = new TestStore({ count: 0, name: "Initial" });
    renderHook(() => {
      return useStore(store, (state) => {
        return state.count;
      });
    });

    const mockFunction = useSyncExternalStoreWithSelector;
    expect(mockFunction).toHaveBeenCalled();
    // @ts-expect-error for test
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const lastCall = mockFunction.mock.calls.at(-1);
    // eslint-disable-next-line @typescript-eslint/prefer-destructuring,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const getServerSnapshot = lastCall[2];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    expect(getServerSnapshot()).toEqual({ count: 0, name: "Initial" });
  });
});
