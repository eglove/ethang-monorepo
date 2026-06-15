import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useWindowSize } from "./use-window-size.js";

describe(useWindowSize, () => {
  it("should initialize with globalThis dimensions", () => {
    globalThis.window.innerHeight = 600;
    globalThis.window.innerWidth = 800;

    const { result } = renderHook(() => {
      return useWindowSize();
    });

    expect(result.current.height).toBe(600);
    expect(result.current.width).toBe(800);
  });

  it("should update dimensions on resize event", () => {
    globalThis.window.innerHeight = 600;
    globalThis.window.innerWidth = 800;

    const { result } = renderHook(() => {
      return useWindowSize();
    });

    globalThis.window.innerHeight = 768;
    globalThis.window.innerWidth = 1024;

    act(() => {
      globalThis.dispatchEvent(new Event("resize"));
    });

    expect(result.current.height).toBe(768);
    expect(result.current.width).toBe(1024);

    vi.restoreAllMocks();
  });
});
