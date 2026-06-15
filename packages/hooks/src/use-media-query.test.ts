import { act, renderHook } from "@testing-library/react";
import noop from "lodash/noop.js";
import { describe, expect, it, vi } from "vitest";

import { useMediaQuery } from "./use-media-query.js";

describe(useMediaQuery, () => {
  it("should initialize based on matchMedia value", () => {
    // eslint-disable-next-line vitest/prefer-spy-on,unicorn/no-global-object-property-assignment
    globalThis.matchMedia = vi.fn().mockReturnValue({
      addEventListener: noop,
      matches: true,
      removeEventListener: noop
    });

    const { result } = renderHook(() => {
      return useMediaQuery("(min-width: 500px)");
    });

    expect(result.current).toBe(true);

    delete (globalThis as Record<string, unknown>)["matchMedia"];
  });

  it("should update matches on media query changes", () => {
    let capturedCallback: ((event: MediaQueryListEvent) => void) | null = null;
    const addEventListenerSpy = vi.fn(
      (_event: string, callback: (event: MediaQueryListEvent) => void) => {
        capturedCallback = callback;
      }
    );

    // eslint-disable-next-line vitest/prefer-spy-on,unicorn/no-global-object-property-assignment
    globalThis.matchMedia = vi.fn().mockReturnValue({
      addEventListener: addEventListenerSpy,
      matches: false,
      removeEventListener: noop
    });

    const { result } = renderHook(() => {
      return useMediaQuery("(min-width: 500px)");
    });

    expect(result.current).toBe(false);

    act(() => {
      capturedCallback?.({ matches: true } as MediaQueryListEvent);
    });

    expect(result.current).toBe(true);

    delete (globalThis as Record<string, unknown>)["matchMedia"];
  });
});
