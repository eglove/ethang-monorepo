import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useIsOnscreen } from "./use-is-onscreen.ts";

type MockIntersectionObserver = {
  trigger: (entries: IntersectionObserverEntry[]) => void;
} & IntersectionObserver;

describe("useIsOnscreen", () => {
  let observeMock: ReturnType<typeof vi.fn>;
  let disconnectMock: ReturnType<typeof vi.fn>;
  let intersectionObserverMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    observeMock = vi.fn();
    disconnectMock = vi.fn();

    intersectionObserverMock = vi.fn().mockImplementation(function (
      this: MockIntersectionObserver,
      callback: IntersectionObserverCallback
    ) {
      this.observe = observeMock as unknown as (target: Element) => void;
      this.disconnect = disconnectMock as unknown as () => void;
      // Helper to trigger intersection from tests
      this.trigger = (entries: IntersectionObserverEntry[]) => {
        callback(entries, this);
      };
    });

    vi.stubGlobal("IntersectionObserver", intersectionObserverMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should initialize with false and return the element", () => {
    const element = document.createElement("div");
    const { result } = renderHook(() => {
      return useIsOnscreen(element);
    });

    expect(result.current[0]).toBe(false);
    expect(result.current[1]).toBe(element);
    expect(observeMock).toHaveBeenCalledWith(element);
  });

  it("should update state when element becomes onscreen", () => {
    const element = document.createElement("div");
    const { result } = renderHook(() => {
      return useIsOnscreen(element);
    });

    // Get the mocked instance to trigger intersection
    const observerInstance = intersectionObserverMock.mock
      .instances[0] as unknown as MockIntersectionObserver;

    act(() => {
      observerInstance.trigger([
        { isIntersecting: true } as unknown as IntersectionObserverEntry
      ]);
    });

    expect(result.current[0]).toBe(true);

    act(() => {
      observerInstance.trigger([
        { isIntersecting: false } as unknown as IntersectionObserverEntry
      ]);
    });

    expect(result.current[0]).toBe(false);
  });

  it("should disconnect observer on unmount", () => {
    const element = document.createElement("div");
    const { unmount } = renderHook(() => {
      return useIsOnscreen(element);
    });

    unmount();

    expect(disconnectMock).toHaveBeenCalled();
  });

  it("should handle empty entries safely", () => {
    const element = document.createElement("div");
    const { result } = renderHook(() => {
      return useIsOnscreen(element);
    });

    const observerInstance = intersectionObserverMock.mock
      .instances[0] as unknown as MockIntersectionObserver;

    act(() => {
      observerInstance.trigger([]);
    });

    // Should still be false (initial state)
    expect(result.current[0]).toBe(false);
  });
});
