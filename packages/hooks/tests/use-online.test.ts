import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useOnline } from "../src/use-online.js";

describe("useOnline", () => {
  it("should return the current online status", () => {
    const { result } = renderHook(() => {
      return useOnline();
    });

    expect(typeof result.current.isOnline).toBe("boolean");
  });

  it("should handle online and offline events", () => {
    const onOnline = vi.fn();
    const onOffline = vi.fn();

    const { result, unmount } = renderHook(() => {
      return useOnline({ onOffline, onOnline });
    });

    act(() => {
      globalThis.dispatchEvent(new Event("offline"));
    });

    expect(result.current.isOnline).toBe(false);
    expect(onOffline).toHaveBeenCalled();

    act(() => {
      globalThis.dispatchEvent(new Event("online"));
    });

    expect(result.current.isOnline).toBe(true);
    expect(onOnline).toHaveBeenCalled();

    unmount();
  });
});
