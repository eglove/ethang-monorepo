import { act, renderHook } from "@testing-library/react";
import noop from "lodash/noop.js";
import { describe, expect, it, vi } from "vitest";

import { useIsMobile } from "./use-is-mobile.js";

describe(useIsMobile, () => {
  it("should initialize based on innerWidth", () => {
    // eslint-disable-next-line vitest/prefer-spy-on,unicorn/no-global-object-property-assignment
    globalThis.matchMedia = vi.fn().mockReturnValue({
      addEventListener: noop,
      removeEventListener: noop
    });

    globalThis.window.innerWidth = 500;
    const { result: r1 } = renderHook(() => {
      return useIsMobile(768);
    });

    expect(r1.current.isMobile).toBe(true);

    globalThis.window.innerWidth = 1000;
    const { result: r2 } = renderHook(() => {
      return useIsMobile(768);
    });

    expect(r2.current.isMobile).toBe(false);

    delete (globalThis as Record<string, unknown>)["matchMedia"];
  });

  it("should respond to media query change events", () => {
    let capturedCallback: (() => void) | null = null;
    const addEventListenerSpy = vi.fn(
      (_event: string, callback: () => void) => {
        capturedCallback = callback;
      }
    );

    // eslint-disable-next-line vitest/prefer-spy-on,unicorn/no-global-object-property-assignment
    globalThis.matchMedia = vi.fn().mockReturnValue({
      addEventListener: addEventListenerSpy,
      removeEventListener: noop
    });

    globalThis.window.innerWidth = 1000;
    const { result } = renderHook(() => {
      return useIsMobile(768);
    });

    expect(result.current.isMobile).toBe(false);

    globalThis.window.innerWidth = 500;
    act(() => {
      capturedCallback?.();
    });

    expect(result.current.isMobile).toBe(true);

    delete (globalThis as Record<string, unknown>)["matchMedia"];
  });
});
