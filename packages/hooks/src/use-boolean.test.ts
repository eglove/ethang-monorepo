import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useBoolean } from "./use-boolean.js";

describe(useBoolean, () => {
  it("should initialize with default false", () => {
    const { result } = renderHook(() => {
      return useBoolean();
    });

    expect(result.current.value).toBe(false);
  });

  it("should initialize with provided value", () => {
    const { result } = renderHook(() => {
      return useBoolean(true);
    });

    expect(result.current.value).toBe(true);
  });

  it("should set value to true", () => {
    const { result } = renderHook(() => {
      return useBoolean(false);
    });

    act(() => {
      result.current.setTrue();
    });

    expect(result.current.value).toBe(true);
  });

  it("should set value to false", () => {
    const { result } = renderHook(() => {
      return useBoolean(true);
    });

    act(() => {
      result.current.setFalse();
    });

    expect(result.current.value).toBe(false);
  });

  it("should toggle value", () => {
    const { result } = renderHook(() => {
      return useBoolean(false);
    });

    act(() => {
      result.current.toggle();
    });

    expect(result.current.value).toBe(true);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.value).toBe(false);
  });

  it("should set arbitrary value", () => {
    const { result } = renderHook(() => {
      return useBoolean(false);
    });

    act(() => {
      result.current.setValue(true);
    });

    expect(result.current.value).toBe(true);
  });
});
