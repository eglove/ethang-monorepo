import { act, renderHook } from "@testing-library/react";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeStore, type Store } from "../src/store.js";
import { useStore } from "../src/use-store.js";

vi.mock("use-sync-external-store/with-selector", async (importOriginal) => {
  const actual = (await importOriginal()) as {
    useSyncExternalStoreWithSelector: (
      subscribe: (onStoreChange: () => void) => () => void,
      getSnapshot: () => State,
      getServerSnapshot: () => State,
      selector: (snapshot: State) => unknown,
      isEqual?: (a: unknown, b: unknown) => boolean
    ) => unknown;
  };

  return {
    ...actual,
    useSyncExternalStoreWithSelector: vi.fn(
      (
        subscribe: (onStoreChange: () => void) => () => void,
        getSnapshot: () => State,
        getServerSnapshot: () => State,
        selector: (snapshot: State) => unknown,
        isEqual?: (a: unknown, b: unknown) => boolean
      ) => {
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

type State = { count: number; name: string };

let store: Store<State>;

beforeEach(() => {
  store = makeStore({ count: 0, name: "Initial" });
});

describe("useStore", () => {
  it("returns the selected state", () => {
    const { result } = renderHook(() => {
      return useStore(store, (s) => {
        return s.count;
      });
    });

    expect(result.current).toBe(0);
  });

  it("updates when the selected state changes", () => {
    const { result } = renderHook(() => {
      return useStore(store, (s) => {
        return s.count;
      });
    });

    act(() => {
      store.update((draft) => {
        draft.count += 1;
      });
    });

    expect(result.current).toBe(1);
  });

  it("does not re-render when an unselected part of the state changes", () => {
    let renderCount = 0;
    const { result } = renderHook(() => {
      renderCount += 1;
      return useStore(store, (s) => {
        return s.count;
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

  it("uses the isEqual function for comparison", () => {
    let renderCount = 0;
    const { result } = renderHook(() => {
      renderCount += 1;
      return useStore(
        store,
        (s) => {
          return { count: s.count };
        },
        (a, b) => {
          return a.count === b.count;
        }
      );
    });

    expect(renderCount).toBe(1);

    act(() => {
      store.update((draft) => {
        draft.count += 1;
      });
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

  it("provides getServerSnapshot to useSyncExternalStoreWithSelector", () => {
    renderHook(() => {
      return useStore(store, (s) => {
        return s.count;
      });
    });

    const mockFunction = (
      useSyncExternalStoreWithSelector as unknown as {
        mock: { calls: unknown[][] };
      }
    );
    const lastCall = mockFunction.mock.calls.at(-1);
    const getServerSnapshot = lastCall?.[2] as () => State;

    expect(getServerSnapshot()).toEqual({ count: 0, name: "Initial" });
  });
});
