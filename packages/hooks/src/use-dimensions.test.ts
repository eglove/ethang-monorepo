import { act, renderHook } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type MockInstance,
  vi
} from "vitest";

import {
  animationInterval,
  type IntervalCallback
} from "./use-animation-interval";
import { useDimensions } from "./use-dimensions";

vi.mock("./use-animation-interval", () => {
  return {
    animationInterval: vi.fn()
  };
});

describe("useDimensions", () => {
  let requestAnimationFrameSpy: MockInstance;
  let addEventListenerSpy: MockInstance;
  let removeEventListenerSpy: MockInstance;
  let mockElement: HTMLElement;

  beforeEach(() => {
    requestAnimationFrameSpy = vi
      .spyOn(globalThis, "requestAnimationFrame")
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });
    addEventListenerSpy = vi.spyOn(globalThis, "addEventListener");
    removeEventListenerSpy = vi.spyOn(globalThis, "removeEventListener");

    mockElement = document.createElement("div");
    vi.spyOn(mockElement, "getBoundingClientRect").mockReturnValue({
      bottom: 210,
      height: 200,
      left: 20,
      right: 120,
      // eslint-disable-next-line lodash/prefer-noop
      toJSON: () => {
        // ignore error
      },
      top: 10,
      width: 100,
      x: 20,
      y: 10
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return correct initial values", () => {
    const { result } = renderHook(() => {
      return useDimensions({ effectDeps: [] });
    });
    expect(result.current.dimensions).toEqual({});
    expect(result.current.element).toBeUndefined();
    expect(typeof result.current.reference).toBe("function");
  });

  it("should update element and setup event listeners when liveMeasure is true", () => {
    const { result, unmount } = renderHook(() => {
      return useDimensions({ effectDeps: [] });
    });

    act(() => {
      result.current.reference(mockElement);
    });

    expect(result.current.element).toBe(mockElement);

    // Initial measure is called via requestAnimationFrame
    expect(requestAnimationFrameSpy).toHaveBeenCalled();
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "resize",
      expect.any(Function)
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function)
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "resize",
      expect.any(Function)
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function)
    );
  });

  it("should not setup event listeners when liveMeasure is false", () => {
    const { result, unmount } = renderHook(() => {
      return useDimensions({ effectDeps: [], liveMeasure: false });
    });

    act(() => {
      result.current.reference(mockElement);
    });

    expect(result.current.element).toBe(mockElement);

    // Initial measure is still called via requestAnimationFrame
    expect(requestAnimationFrameSpy).toHaveBeenCalled();
    expect(addEventListenerSpy).not.toHaveBeenCalledWith(
      "resize",
      expect.any(Function)
    );
    expect(addEventListenerSpy).not.toHaveBeenCalledWith(
      "scroll",
      expect.any(Function)
    );

    unmount();

    expect(removeEventListenerSpy).not.toHaveBeenCalledWith(
      "resize",
      expect.any(Function)
    );
    expect(removeEventListenerSpy).not.toHaveBeenCalledWith(
      "scroll",
      expect.any(Function)
    );
  });

  it("should call setDimensions when animationInterval triggers callback", () => {
    let intervalCallback: IntervalCallback | undefined;
    vi.mocked(animationInterval).mockImplementation(
      (_delay, _signal, callback) => {
        intervalCallback = callback;
      }
    );

    const { result } = renderHook(() => {
      return useDimensions({ effectDeps: [] });
    });

    act(() => {
      result.current.reference(mockElement);
    });

    expect(animationInterval).toHaveBeenCalled();

    act(() => {
      if (intervalCallback) {
        intervalCallback(0);
      }
    });

    expect(result.current.dimensions).toEqual(
      expect.objectContaining({
        bottom: 210,
        height: 200,
        left: 20,
        right: 120,
        top: 10,
        width: 100,
        x: 20,
        y: 10
      })
    );
  });

  it("should cleanup controller on unmount", () => {
    let passedSignal: AbortSignal | undefined;
    vi.mocked(animationInterval).mockImplementation(
      (_delay, signal, _callback) => {
        passedSignal = signal;
      }
    );

    const { result, unmount } = renderHook(() => {
      return useDimensions({ effectDeps: [] });
    });

    act(() => {
      result.current.reference(mockElement);
    });

    expect(passedSignal?.aborted).toBe(false);

    unmount();

    expect(passedSignal?.aborted).toBe(true);
  });
});
