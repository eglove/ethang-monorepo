import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useBoolean } from "../src/use-boolean.js";

describe("useBoolean", () => {
  it("should return the correct default value", () => {
    const { result } = renderHook(() => {
      return useBoolean();
    });

    expect(result.current.value).toBe(false);
  });

  it("should return the correct custom initial value", () => {
    const { result } = renderHook(() => {
      return useBoolean(true);
    });

    expect(result.current.value).toBe(true);
  });

  it("should set the value to true when setTrue is called", () => {
    const { result } = renderHook(() => {
      return useBoolean(false);
    });

    act(() => {
      result.current.setTrue();
    });

    expect(result.current.value).toBe(true);
  });

  it("should set the value to false when setFalse is called", () => {
    const { result } = renderHook(() => {
      return useBoolean(true);
    });

    act(() => {
      result.current.setFalse();
    });

    expect(result.current.value).toBe(false);
  });

  it("should toggle the value when toggle is called", () => {
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

  it("should set the value to a specific boolean when setValue is called", () => {
    const { result } = renderHook(() => {
      return useBoolean(false);
    });

    act(() => {
      result.current.setValue(true);
    });

    expect(result.current.value).toBe(true);

    act(() => {
      result.current.setValue(false);
    });

    expect(result.current.value).toBe(false);
  });
});
