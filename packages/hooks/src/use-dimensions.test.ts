import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useDimensions } from "./use-dimensions.js";

vi.mock(import("./use-animation-interval.ts"), () => {
  return {
    animationInterval: (
      _delay: number,
      _signal: AbortSignal,
      callback: (time?: number) => void
    ) => {
      callback(0);
    }
  };
});

describe(useDimensions, () => {
  it("should initialize with initial dimensions", () => {
    const initial = { height: 100, width: 100 };
    const { result } = renderHook(() => {
      return useDimensions({
        effectDeps: [],
        initialDimensions: initial
      });
    });

    expect(result.current.dimensions).toStrictEqual(initial);
    expect(result.current.element).toBeUndefined();
  });

  it("should update element when reference is called", () => {
    const { result } = renderHook(() => {
      return useDimensions({
        effectDeps: []
      });
    });

    const mockRect = { height: 100, width: 100 } as DOMRect;
    const mockElement = {
      getBoundingClientRect: () => {
        return mockRect;
      }
    } as unknown as Element;

    act(() => {
      result.current.reference(mockElement);
    });

    expect(result.current.element).toBe(mockElement);
  });

  it("should handle live measurement resize and scroll events", () => {
    const addListenerSpy = vi.spyOn(globalThis, "addEventListener");
    const removeListenerSpy = vi.spyOn(globalThis, "removeEventListener");

    const rafSpy = vi
      .spyOn(globalThis, "requestAnimationFrame")
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });

    const mockRect = { height: 100, width: 100 } as DOMRect;
    const mockElement = {
      getBoundingClientRect: () => {
        return mockRect;
      }
    } as unknown as Element;

    const { result, unmount } = renderHook(() => {
      return useDimensions({
        effectDeps: []
      });
    });

    act(() => {
      result.current.reference(mockElement);
    });

    expect(addListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(addListenerSpy).toHaveBeenCalledWith("scroll", expect.any(Function));

    expect(result.current.dimensions).toStrictEqual(mockRect);

    unmount();

    expect(removeListenerSpy).toHaveBeenCalledWith(
      "resize",
      expect.any(Function)
    );
    expect(removeListenerSpy).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function)
    );

    rafSpy.mockRestore();
    addListenerSpy.mockRestore();
    removeListenerSpy.mockRestore();
  });

  it("should not add event listeners if liveMeasure is false", () => {
    const addListenerSpy = vi.spyOn(globalThis, "addEventListener");

    const mockRect = { height: 100, width: 100 } as DOMRect;
    const mockElement = {
      getBoundingClientRect: () => {
        return mockRect;
      }
    } as unknown as Element;

    const { result } = renderHook(() => {
      return useDimensions({
        effectDeps: [],
        liveMeasure: false
      });
    });

    act(() => {
      result.current.reference(mockElement);
    });

    expect(addListenerSpy).not.toHaveBeenCalledWith(
      "resize",
      expect.any(Function)
    );
    expect(addListenerSpy).not.toHaveBeenCalledWith(
      "scroll",
      expect.any(Function)
    );

    addListenerSpy.mockRestore();
  });
});
