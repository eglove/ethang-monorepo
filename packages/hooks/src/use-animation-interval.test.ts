import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  animationInterval,
  useAnimationInterval
} from "./use-animation-interval.js";

describe("useAnimationInterval", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should run callback with document.timeline", () => {
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
    expect(globalThis.requestAnimationFrame).toHaveBeenCalled();

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions
    if (capturedFrameCallback) {
      (capturedFrameCallback as FrameRequestCallback)(200);
    }
    expect(callback).toHaveBeenCalledWith(200);

    Object.defineProperty(globalThis.document, "timeline", {
      configurable: true,
      value: undefined
    });
  });

  it("should handle start time being null", () => {
    Object.defineProperty(globalThis.document, "timeline", {
      configurable: true,
      value: { currentTime: null }
    });
    vi.spyOn(globalThis.performance, "now").mockReturnValue(0);

    // eslint-disable-next-line lodash/prefer-constant
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation(() => {
      return 1;
    });

    const callback = vi.fn();
    renderHook(() => {
      // eslint-disable-next-line @typescript-eslint/strict-void-return
      useAnimationInterval(100, callback);
    });

    vi.advanceTimersByTime(100);
    expect(globalThis.requestAnimationFrame).toHaveBeenCalled();

    Object.defineProperty(globalThis.document, "timeline", {
      configurable: true,
      value: undefined
    });
  });

  it("should fallback to performance.now if document.timeline is missing", () => {
    Object.defineProperty(globalThis.document, "timeline", {
      configurable: true,
      value: undefined
    });
    vi.spyOn(globalThis.performance, "now").mockReturnValue(100);

    // eslint-disable-next-line lodash/prefer-constant
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation(() => {
      return 1;
    });

    const callback = vi.fn();
    renderHook(() => {
      // eslint-disable-next-line @typescript-eslint/strict-void-return
      useAnimationInterval(100, callback);
    });

    vi.advanceTimersByTime(100);
    expect(globalThis.requestAnimationFrame).toHaveBeenCalled();
  });

  it("should stop execution when unmounted", () => {
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
    expect(globalThis.requestAnimationFrame).toHaveBeenCalled();

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions
    if (capturedFrameCallback) {
      (capturedFrameCallback as FrameRequestCallback)(200);
    }

    expect(callback).not.toHaveBeenCalled();

    Object.defineProperty(globalThis.document, "timeline", {
      configurable: true,
      value: undefined
    });
  });

  it("should do nothing if time is undefined in scheduleFrame", () => {
    const controller = new AbortController();
    const callback = vi.fn();
    vi.spyOn(globalThis, "setTimeout");

    let capturedTimeoutCallback: (() => void) | null = null;
    vi.spyOn(globalThis, "setTimeout").mockImplementation((timerCallback) => {
      capturedTimeoutCallback = timerCallback as () => void;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
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

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions
    if (capturedTimeoutCallback) {
      (capturedTimeoutCallback as () => void)();
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions
    if (capturedFrameCallback) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      (capturedFrameCallback as unknown as (time?: number) => void)();
    }

    expect(callback).toHaveBeenCalledWith(undefined);
    expect(globalThis.setTimeout).toHaveBeenCalledTimes(1);
  });
});
