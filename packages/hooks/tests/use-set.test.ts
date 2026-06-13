import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useSet } from "../src/use-set.js";

describe("useSet", () => {
  it("should initialize with an empty set if no values are provided", () => {
    const { result } = renderHook(() => {
      return useSet();
    });

    expect(result.current.size).toBe(0);
  });

  it("should initialize with the provided values", () => {
    const { result } = renderHook(() => {
      return useSet([1, 2, 3]);
    });

    expect(result.current.size).toBe(3);
    expect(result.current.has(1)).toBe(true);
    expect(result.current.has(2)).toBe(true);
    expect(result.current.has(3)).toBe(true);
  });

  it("should add a new value when add is called", () => {
    const { result } = renderHook(() => {
      return useSet<number>();
    });

    let addResult: Set<number> | undefined;

    act(() => {
      addResult = result.current.add(1);
    });

    expect(result.current.size).toBe(1);
    expect(result.current.has(1)).toBe(true);
    expect(addResult).toBeInstanceOf(Set);
    expect(addResult?.has(1)).toBe(true);
  });

  it("should remove a value when delete is called", () => {
    const { result } = renderHook(() => {
      return useSet([1, 2]);
    });

    let deleteResult: boolean | undefined;

    act(() => {
      deleteResult = result.current.delete(1);
    });

    expect(result.current.size).toBe(1);
    expect(result.current.has(1)).toBe(false);
    expect(result.current.has(2)).toBe(true);
    expect(deleteResult).toBe(true);
  });

  it("should return false when deleting a non-existent value", () => {
    const { result } = renderHook(() => {
      return useSet([1]);
    });

    let deleteResult: boolean | undefined;

    act(() => {
      deleteResult = result.current.delete(2);
    });

    expect(result.current.size).toBe(1);
    expect(deleteResult).toBe(false);
  });

  it("should remove all values when clear is called", () => {
    const { result } = renderHook(() => {
      return useSet([1, 2, 3]);
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.size).toBe(0);
  });
});
