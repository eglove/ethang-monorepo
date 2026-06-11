import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi, Mock } from "vitest";

import { useDimensions } from "./use-dimensions";
import { animationInterval } from "./use-animation-interval";

vi.mock("./use-animation-interval", () => ({
  animationInterval: vi.fn(),
}));

describe("useDimensions", () => {
  let requestAnimationFrameSpy: any;
  let addEventListenerSpy: any;
  let removeEventListenerSpy: any;
  let mockElement: HTMLElement;
  let getBoundingClientRectSpy: any;

  beforeEach(() => {
    requestAnimationFrameSpy = vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 1;
    });
    addEventListenerSpy = vi.spyOn(globalThis, "addEventListener");
    removeEventListenerSpy = vi.spyOn(globalThis, "removeEventListener");

    mockElement = document.createElement("div");
    getBoundingClientRectSpy = vi.spyOn(mockElement, "getBoundingClientRect").mockReturnValue({
      width: 100,
      height: 200,
      top: 10,
      left: 20,
      bottom: 210,
      right: 120,
      x: 20,
      y: 10,
      toJSON: () => {},
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return correct initial values", () => {
    const { result } = renderHook(() => useDimensions({ effectDeps: [] }));
    expect(result.current.dimensions).toEqual({});
    expect(result.current.element).toBeUndefined();
    expect(typeof result.current.reference).toBe("function");
  });

  it("should update element and setup event listeners when liveMeasure is true", () => {
    const { result, unmount } = renderHook(() => useDimensions({ effectDeps: [] }));

    act(() => {
      result.current.reference(mockElement);
    });

    expect(result.current.element).toBe(mockElement);

    // Initial measure is called via requestAnimationFrame
    expect(requestAnimationFrameSpy).toHaveBeenCalled();
    expect(addEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith("scroll", expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
  });

  it("should not setup event listeners when liveMeasure is false", () => {
    const { result, unmount } = renderHook(() => useDimensions({ effectDeps: [], liveMeasure: false }));

    act(() => {
      result.current.reference(mockElement);
    });

    expect(result.current.element).toBe(mockElement);

    // Initial measure is still called via requestAnimationFrame
    expect(requestAnimationFrameSpy).toHaveBeenCalled();
    expect(addEventListenerSpy).not.toHaveBeenCalledWith("resize", expect.any(Function));
    expect(addEventListenerSpy).not.toHaveBeenCalledWith("scroll", expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).not.toHaveBeenCalledWith("resize", expect.any(Function));
    expect(removeEventListenerSpy).not.toHaveBeenCalledWith("scroll", expect.any(Function));
  });

  it("should call setDimensions when animationInterval triggers callback", () => {
    let intervalCallback: any;
    (animationInterval as Mock).mockImplementation((delay, signal, cb) => {
      intervalCallback = cb;
    });

    const { result } = renderHook(() => useDimensions({ effectDeps: [] }));

    act(() => {
      result.current.reference(mockElement);
    });

    expect(animationInterval).toHaveBeenCalled();

    act(() => {
      intervalCallback();
    });

    expect(result.current.dimensions).toEqual(expect.objectContaining({
      width: 100,
      height: 200,
      top: 10,
      left: 20,
      bottom: 210,
      right: 120,
      x: 20,
      y: 10,
    }));
  });

  it("should cleanup controller on unmount", () => {
    let passedSignal: AbortSignal | undefined;
    (animationInterval as Mock).mockImplementation((delay, signal, cb) => {
      passedSignal = signal;
    });

    const { result, unmount } = renderHook(() => useDimensions({ effectDeps: [] }));

    act(() => {
      result.current.reference(mockElement);
    });

    expect(passedSignal!.aborted).toBe(false);

    unmount();

    expect(passedSignal!.aborted).toBe(true);
  });
});
