import { act, renderHook } from "@testing-library/react";
import noop from "lodash/noop.js";
import { describe, expect, it, vi } from "vitest";

import { useOnline } from "./use-online.js";

describe(useOnline, () => {
  it("should initialize with navigator.onLine value", () => {
    vi.spyOn(globalThis.navigator, "onLine", "get").mockReturnValue(true);
    const { result } = renderHook(() => {
      return useOnline();
    });

    expect(result.current.isOnline).toBe(true);
  });

  it("should respond to online and offline events", () => {
    vi.spyOn(globalThis.navigator, "onLine", "get").mockReturnValue(false);
    const onOnline = vi.fn(noop);
    const onOffline = vi.fn(noop);

    const { result } = renderHook(() => {
      return useOnline({ onOffline, onOnline });
    });

    expect(result.current.isOnline).toBe(false);

    act(() => {
      globalThis.dispatchEvent(new Event("online"));
    });

    expect(result.current.isOnline).toBe(true);
    expect(onOnline).toHaveBeenCalledTimes(1);

    act(() => {
      globalThis.dispatchEvent(new Event("offline"));
    });

    expect(result.current.isOnline).toBe(false);
    expect(onOffline).toHaveBeenCalledTimes(1);

    vi.restoreAllMocks();
  });
});
