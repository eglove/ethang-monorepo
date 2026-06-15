import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useToggle } from "./use-toggle.js";

describe(useToggle, () => {
  it("should initialize with default false", () => {
    const { result } = renderHook(() => {
      return useToggle();
    });

    expect(result.current[0]).toBe(false);
  });

  it("should initialize with provided value", () => {
    const { result } = renderHook(() => {
      return useToggle(true);
    });

    expect(result.current[0]).toBe(true);
  });

  it("should toggle value when called with no arguments", () => {
    const { result } = renderHook(() => {
      return useToggle(false);
    });

    act(() => {
      result.current[1]();
    });

    expect(result.current[0]).toBe(true);
  });

  it("should set exact value when called with arguments", () => {
    const { result } = renderHook(() => {
      return useToggle(false);
    });

    act(() => {
      result.current[1](true);
    });

    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[1](false);
    });

    expect(result.current[0]).toBe(false);
  });
});
