import { act, renderHook } from "@testing-library/react";
import keys from "lodash/keys.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useLocalStorage } from "../src/use-local-storage.js";

const store: Record<string, string> = {};

const mockLocalStorage = {
  getItem: vi.fn((key: string) => {
    return store[key] ?? null;
  }),
  removeItem: vi.fn((key: string) => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete store[key];
  }),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  })
};

describe("useLocalStorage", () => {
  beforeEach(() => {
    for (const key of keys(store)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete store[key];
    }
    vi.stubGlobal("localStorage", mockLocalStorage);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should handle SSR fallback by returning defaultValue via getServerSnapshot", async () => {
    // Another way to hit `getServerSnapshot` is to render the hook in an environment where `window` is undefined.
    // But since `renderHook` relies on React DOM, we can instead use ReactDOMServer.renderToString
    // Let's dynamically import it to avoid breaking other tests.
    const ReactDOMServer = await import("react-dom/server");
    const React = await import("react");

    const testComponent = () => {
      const [value] = useLocalStorage("ssr-key", {
        defaultValue: "ssr-default"
      });
      return React.createElement("div", null, value);
    };

    const html = ReactDOMServer.renderToString(
      React.createElement(testComponent)
    );
    expect(html).toContain("ssr-default");

    // Also test what happens if defaultValue is not provided in SSR
    const testComponentNoDefault = () => {
      const [value] = useLocalStorage("ssr-no-default");
      return React.createElement(
        "div",
        null,
        null === value ? "null-value" : "other-value"
      );
    };

    const html2 = ReactDOMServer.renderToString(
      React.createElement(testComponentNoDefault)
    );
    expect(html2).toContain("null-value");
  });

  it("should return the default value and set it in localStorage if the key doesn't exist", () => {
    const { result } = renderHook(() => {
      return useLocalStorage("test-key", { defaultValue: "default" });
    });

    expect(result.current[0]).toBe("default");
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "test-key",
      "default"
    );
    expect(store["test-key"]).toBe("default");
  });

  it("should return the existing value from localStorage if it exists", () => {
    store["test-key"] = "existing";

    const { result } = renderHook(() => {
      return useLocalStorage("test-key", { defaultValue: "default" });
    });

    expect(result.current[0]).toBe("existing");
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
  });

  it("should return null if there is no default value and the key doesn't exist", () => {
    const { result } = renderHook(() => {
      return useLocalStorage("test-key");
    });

    expect(result.current[0]).toBeNull();
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
  });

  it("should update the state and localStorage when setValue is called", () => {
    const { result } = renderHook(() => {
      return useLocalStorage("test-key", { defaultValue: "default" });
    });

    act(() => {
      result.current[1]("new value");
    });

    expect(result.current[0]).toBe("new value");
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "test-key",
      "new value"
    );
    expect(store["test-key"]).toBe("new value");
  });

  it("should synchronize state across multiple hooks using the same key", () => {
    const hook1 = renderHook(() => {
      return useLocalStorage("test-key", { defaultValue: "default" });
    });
    const hook2 = renderHook(() => {
      return useLocalStorage("test-key");
    });

    expect(hook1.result.current[0]).toBe("default");
    expect(hook2.result.current[0]).toBe("default");

    act(() => {
      hook1.result.current[1]("updated");
    });

    expect(hook1.result.current[0]).toBe("updated");
    expect(hook2.result.current[0]).toBe("updated");
  });

  it("should handle localStorage errors gracefully when getting an item", () => {
    const getError = new Error("Failed to get item");
    mockLocalStorage.getItem.mockImplementationOnce(() => {
      throw getError;
    });

    const { result } = renderHook(() => {
      return useLocalStorage("error-key");
    });

    expect(result.current[0]).toBeNull();
  });

  it("should unmount and unsubscribe correctly", () => {
    const addEventListenerSpy = vi.spyOn(globalThis, "addEventListener");
    const abortSpy = vi.spyOn(AbortController.prototype, "abort");

    const { unmount } = renderHook(() => {
      return useLocalStorage("unsubscribe-test");
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "useLocalStorage-unsubscribe-test",
      expect.any(Function),
      expect.any(Object)
    );

    unmount();

    expect(abortSpy).toHaveBeenCalled();
  });

  it("should handle localStorage errors gracefully when setting an item", () => {
    const { result } = renderHook(() => {
      return useLocalStorage("error-set-key");
    });

    const setError = new Error("Failed to set item");
    mockLocalStorage.setItem.mockImplementationOnce(() => {
      throw setError;
    });

    act(() => {
      result.current[1]("new value");
    });

    expect(result.current[0]).toBeNull();
  });
});
