import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useMousePosition } from "./use-mouse-position.js";

describe(useMousePosition, () => {
  it("should initialize with 0, 0", () => {
    const { result } = renderHook(() => {
      return useMousePosition();
    });

    expect(result.current.mouseX).toBe(0);
    expect(result.current.mouseY).toBe(0);
  });

  it("should update coordinates on mousemove event", () => {
    const { result } = renderHook(() => {
      return useMousePosition();
    });

    const event = new MouseEvent("mousemove", {
      clientX: 100,
      clientY: 200
    });

    act(() => {
      globalThis.dispatchEvent(event);
    });

    expect(result.current.mouseX).toBe(100);
    expect(result.current.mouseY).toBe(200);
  });
});
