import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MockIntersectionObserver } from "./mock-intersection-observer.js";
import { useIsOnscreen } from "./use-is-onscreen.js";

describe(useIsOnscreen, () => {
  it("should observe element and update state on intersection change", () => {
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

    const mockElement = {} as Element;

    const { result } = renderHook(() => {
      return useIsOnscreen(mockElement);
    });

    expect(result.current[0]).toBe(false);

    act(() => {
      MockIntersectionObserver.callback?.([{ isIntersecting: true }]);
    });

    expect(result.current[0]).toBe(true);

    act(() => {
      MockIntersectionObserver.callback?.([{ isIntersecting: false }]);
    });

    expect(result.current[0]).toBe(false);

    vi.restoreAllMocks();
    MockIntersectionObserver.callback = null;
  });
});
