import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useSet } from "../src/use-set.js";

describe("useSet", () => {
  it("should initialize with no values", () => {
    const { result } = renderHook(() => {
      return useSet();
    });

    expect(result.current.size).toBe(0);
  });

  it("should initialize with initial values", () => {
    const { result } = renderHook(() => {
      return useSet([1, 2, 3]);
    });

    expect(result.current.size).toBe(3);
    expect(result.current.has(1)).toBe(true);
    expect(result.current.has(2)).toBe(true);
    expect(result.current.has(3)).toBe(true);
  });

  it("should add a value", () => {
    const { result } = renderHook(() => {
      return useSet<number>();
    });

    act(() => {
      result.current.add(1);
    });

    expect(result.current.size).toBe(1);
    expect(result.current.has(1)).toBe(true);
  });

  it("should return the set when adding a value", () => {
    const { result } = renderHook(() => {
      return useSet<number>();
    });

    let returnedSet: Set<number>;
    act(() => {
      returnedSet = result.current.add(1);
    });

    // @ts-expect-error - assigned in act
    expect(returnedSet.size).toBe(1);
    // @ts-expect-error - assigned in act
    expect(returnedSet.has(1)).toBe(true);
  });

  it("should not add duplicate values", () => {
    const { result } = renderHook(() => {
      return useSet([1]);
    });

    act(() => {
      result.current.add(1);
    });

    expect(result.current.size).toBe(1);
  });

  it("should delete a value", () => {
    const { result } = renderHook(() => {
      return useSet([1, 2, 3]);
    });

    act(() => {
      result.current.delete(2);
    });

    expect(result.current.size).toBe(2);
    expect(result.current.has(2)).toBe(false);
  });

  it("should return true when deleting an existing value", () => {
    const { result } = renderHook(() => {
      return useSet([1]);
    });

    let returnedValue = false;
    act(() => {
      returnedValue = result.current.delete(1);
    });

    expect(returnedValue).toBe(true);
  });

  it("should return false when deleting a non-existing value", () => {
    const { result } = renderHook(() => {
      return useSet([1]);
    });

    let returnedValue = true;
    act(() => {
      returnedValue = result.current.delete(2);
    });

    expect(returnedValue).toBe(false);
  });

  it("should clear all values", () => {
    const { result } = renderHook(() => {
      return useSet([1, 2, 3]);
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.size).toBe(0);
  });
});
