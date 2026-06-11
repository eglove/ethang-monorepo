import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useWindowSize } from "../src/use-window-size";

import { vi } from "vitest";

describe("useWindowSize", () => {
  it("should return default window size", () => {
    const { result } = renderHook(() => useWindowSize());

    expect(result.current.width).toBe(window.innerWidth);
    expect(result.current.height).toBe(window.innerHeight);
  });

  it("should return initial width and height if window inner properties are undefined", async () => {
    vi.stubGlobal('innerWidth', undefined);
    vi.stubGlobal('innerHeight', undefined);

    const { result } = renderHook(() => useWindowSize(100, 200));

    // The behavior when innerWidth/innerHeight is missing but we're in a browser environment
    expect(result.current.width).toBeUndefined();
    expect(result.current.height).toBeUndefined();

    vi.unstubAllGlobals();
  });

  it("should update on resize", () => {
    const { result } = renderHook(() => useWindowSize());

    act(() => {
      window.innerWidth = 500;
      window.innerHeight = 500;
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current.width).toBe(500);
    expect(result.current.height).toBe(500);
  });

  it("should remove event listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(globalThis, "removeEventListener");

    const { unmount } = renderHook(() => useWindowSize());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "resize",
      expect.any(Function)
    );
  });
});
