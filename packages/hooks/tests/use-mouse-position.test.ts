import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useMousePosition } from "../src/use-mouse-position.ts";

describe("useMousePosition", () => {
  it("should return initial position 0, 0", () => {
    const { result } = renderHook(() => useMousePosition());
    expect(result.current).toEqual({ mouseX: 0, mouseY: 0 });
  });

  it("should update position on mousemove", () => {
    const { result } = renderHook(() => useMousePosition());

    act(() => {
      window.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: 100,
          clientY: 200,
        })
      );
    });

    expect(result.current).toEqual({ mouseX: 100, mouseY: 200 });
  });
});
