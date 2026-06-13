import { renderHook } from "@testing-library/react";
import { describe, expect, it, onTestFinished, vi } from "vitest";

import {
  animationInterval,
  useAnimationInterval
} from "./use-animation-interval.js";

const setupTest = () => {
  vi.useFakeTimers();
  onTestFinished(() => {
    vi.restoreAllMocks();
  });
};

describe(useAnimationInterval, () => {
  it("should run callback with document.timeline", () => {
    setupTest();
    Object.defineProperty(globalThis.document, "timeline", {
      configurable: true,
      value: { currentTime: 100 }
    });
    vi.spyOn(globalThis.performance, "now").mockReturnValue(100);

    let capturedFrameCallback: FrameRequestCallback | null = null;
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation(
      (requestCallback) => {
        capturedFrameCallback = requestCallback;
        return 1;
      }
    );

    const callback = vi.fn();
    renderHook(() => {
      // eslint-disable-next-line @typescript-eslint/strict-void-return
      useAnimationInterval(100, callback);
    });

    expect(globalThis.requestAnimationFrame).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(globalThis.requestAnimationFrame).toHaveBeenCalledWith(
      expect.any(Function)
    );

    expect(capturedFrameCallback).toBeTypeOf("function");

    const frameCallback =
      capturedFrameCallback as unknown as FrameRequestCallback;
    frameCallback(200);

    expect(callback).toHaveBeenCalledWith(200);

    Object.defineProperty(globalThis.document, "timeline", {
      configurable: true,
      value: undefined
    });
  });

  it("should handle start time being null", () => {
    setupTest();
    Object.defineProperty(globalThis.document, "timeline", {
      configurable: true,
      value: { currentTime: null }
    });
    vi.spyOn(globalThis.performance, "now").mockReturnValue(0);

    vi.spyOn(globalThis, "requestAnimationFrame").mockReturnValue(1);

    const callback = vi.fn();
    renderHook(() => {
      // eslint-disable-next-line @typescript-eslint/strict-void-return
      useAnimationInterval(100, callback);
    });

    vi.advanceTimersByTime(100);

    expect(globalThis.requestAnimationFrame).toHaveBeenCalledWith(
      expect.any(Function)
    );

    Object.defineProperty(globalThis.document, "timeline", {
      configurable: true,
      value: undefined
    });
  });

  it("should fallback to performance.now if document.timeline is missing", () => {
    setupTest();
    Object.defineProperty(globalThis.document, "timeline", {
      configurable: true,
      value: undefined
    });
    vi.spyOn(globalThis.performance, "now").mockReturnValue(100);

    vi.spyOn(globalThis, "requestAnimationFrame").mockReturnValue(1);

    const callback = vi.fn();
    renderHook(() => {
      // eslint-disable-next-line @typescript-eslint/strict-void-return
      useAnimationInterval(100, callback);
    });

    vi.advanceTimersByTime(100);

    expect(globalThis.requestAnimationFrame).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  it("should stop execution when unmounted", () => {
    setupTest();
    Object.defineProperty(globalThis.document, "timeline", {
      configurable: true,
      value: { currentTime: 100 }
    });
    vi.spyOn(globalThis.performance, "now").mockReturnValue(100);

    let capturedFrameCallback: FrameRequestCallback | null = null;
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation(
      (requestCallback) => {
        capturedFrameCallback = requestCallback;
        return 1;
      }
    );

    const callback = vi.fn();
    const { unmount } = renderHook(() => {
      // eslint-disable-next-line @typescript-eslint/strict-void-return
      useAnimationInterval(100, callback);
    });

    unmount();

    vi.advanceTimersByTime(100);

    expect(globalThis.requestAnimationFrame).toHaveBeenCalledWith(
      expect.any(Function)
    );

    expect(capturedFrameCallback).toBeTypeOf("function");

    const frameCallback =
      capturedFrameCallback as unknown as FrameRequestCallback;
    frameCallback(200);

    expect(callback).not.toHaveBeenCalled();

    Object.defineProperty(globalThis.document, "timeline", {
      configurable: true,
      value: undefined
    });
  });

  it("should do nothing if time is undefined in scheduleFrame", () => {
    setupTest();
    const controller = new AbortController();
    const callback = vi.fn();
    vi.spyOn(globalThis, "setTimeout");

    let capturedTimeoutCallback: (() => void) | null = null;
    vi.spyOn(globalThis, "setTimeout").mockImplementation((timerCallback) => {
      capturedTimeoutCallback = timerCallback as () => void;
      return 1 as unknown as NodeJS.Timeout;
    });

    let capturedFrameCallback: FrameRequestCallback | null = null;
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation(
      (requestCallback) => {
        capturedFrameCallback = requestCallback;
        return 1;
      }
    );

    // eslint-disable-next-line @typescript-eslint/strict-void-return
    animationInterval(100, controller.signal, callback);

    expect(globalThis.setTimeout).toHaveBeenCalledTimes(1);

    expect(capturedTimeoutCallback).toBeTypeOf("function");

    const timeoutCallback = capturedTimeoutCallback as unknown as () => void;
    timeoutCallback();

    expect(capturedFrameCallback).toBeTypeOf("function");

    const frameCallback = capturedFrameCallback as unknown as (
      time?: number
    ) => void;
    frameCallback();

    expect(callback).toHaveBeenCalledWith(undefined);
    expect(globalThis.setTimeout).toHaveBeenCalledTimes(1);
  });
});
