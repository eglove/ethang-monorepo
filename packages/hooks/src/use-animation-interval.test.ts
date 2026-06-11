import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { animationInterval, useAnimationInterval } from "./use-animation-interval.js";

describe("useAnimationInterval", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should run callback with document.timeline", () => {
    Object.defineProperty(globalThis.document, "timeline", {
      value: { currentTime: 100 },
      configurable: true,
    });
    vi.spyOn(globalThis.performance, "now").mockReturnValue(100);

    let frameCallback: FrameRequestCallback | null = null;
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
      frameCallback = cb;
      return 1;
    });

    const callback = vi.fn();
    renderHook(() => {
      useAnimationInterval(100, callback);
    });

    expect(globalThis.requestAnimationFrame).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(globalThis.requestAnimationFrame).toHaveBeenCalled();

    if (frameCallback) {
      (frameCallback as FrameRequestCallback)(200);
    }
    expect(callback).toHaveBeenCalledWith(200);

    Object.defineProperty(globalThis.document, "timeline", {
      value: undefined,
      configurable: true,
    });
  });

  it("should handle start time being null", () => {
    Object.defineProperty(globalThis.document, "timeline", {
      value: { currentTime: null },
      configurable: true,
    });
    vi.spyOn(globalThis.performance, "now").mockReturnValue(0);

    let frameCallback: FrameRequestCallback | null = null;
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
      frameCallback = cb;
      return 1;
    });

    const callback = vi.fn();
    renderHook(() => {
      useAnimationInterval(100, callback);
    });

    vi.advanceTimersByTime(100);
    expect(globalThis.requestAnimationFrame).toHaveBeenCalled();

    Object.defineProperty(globalThis.document, "timeline", {
      value: undefined,
      configurable: true,
    });
  });

  it("should fallback to performance.now if document.timeline is missing", () => {
    Object.defineProperty(globalThis.document, "timeline", {
      value: undefined,
      configurable: true,
    });
    vi.spyOn(globalThis.performance, "now").mockReturnValue(100);

    let frameCallback: FrameRequestCallback | null = null;
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
      frameCallback = cb;
      return 1;
    });

    const callback = vi.fn();
    renderHook(() => {
      useAnimationInterval(100, callback);
    });

    vi.advanceTimersByTime(100);
    expect(globalThis.requestAnimationFrame).toHaveBeenCalled();
  });

  it("should stop execution when unmounted", () => {
    Object.defineProperty(globalThis.document, "timeline", {
      value: { currentTime: 100 },
      configurable: true,
    });
    vi.spyOn(globalThis.performance, "now").mockReturnValue(100);

    let frameCallback: FrameRequestCallback | null = null;
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
      frameCallback = cb;
      return 1;
    });

    const callback = vi.fn();
    const { unmount } = renderHook(() => {
      useAnimationInterval(100, callback);
    });

    unmount();

    vi.advanceTimersByTime(100);
    expect(globalThis.requestAnimationFrame).toHaveBeenCalled();

    if (frameCallback) {
      (frameCallback as FrameRequestCallback)(200);
    }

    // Callback should not be called because the signal is aborted
    expect(callback).not.toHaveBeenCalled();

    Object.defineProperty(globalThis.document, "timeline", {
      value: undefined,
      configurable: true,
    });
  });

  it("should do nothing if time is undefined in scheduleFrame", () => {
    const controller = new AbortController();
    const callback = vi.fn();
    vi.spyOn(globalThis, "setTimeout");

    let timeoutCallback: Function | null = null;
    vi.spyOn(globalThis, "setTimeout").mockImplementation((cb: Function) => {
      timeoutCallback = cb;
      return 1 as any;
    });

    let frameCallback: FrameRequestCallback | null = null;
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
      frameCallback = cb;
      return 1;
    });

    animationInterval(100, controller.signal, callback);
    expect(globalThis.setTimeout).toHaveBeenCalledTimes(1);

    if (timeoutCallback) {
      (timeoutCallback as Function)();
    }

    if (frameCallback) {
      // frameCallback takes a number, but we can bypass TS
      (frameCallback as any)(undefined);
    }

    // We expect the callback to have been called with undefined.
    expect(callback).toHaveBeenCalledWith(undefined);

    // And scheduleFrame is called with undefined, so it shouldn't call setTimeout again
    expect(globalThis.setTimeout).toHaveBeenCalledTimes(1);
  });
});
