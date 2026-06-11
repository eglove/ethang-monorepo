import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useMap } from "../src/use-map.js";

describe("useMap", () => {
  it("should initialize with an empty map if no values are provided", () => {
    const { result } = renderHook(() => {
      return useMap();
    });

    expect(result.current.size).toBe(0);
  });

  it("should initialize with the provided values", () => {
    const { result } = renderHook(() => {
      return useMap([
        ["key1", "value1"],
        ["key2", "value2"],
      ]);
    });

    expect(result.current.size).toBe(2);
    expect(result.current.get("key1")).toBe("value1");
    expect(result.current.get("key2")).toBe("value2");
  });

  it("should add a new key-value pair when set is called", () => {
    const { result } = renderHook(() => {
      return useMap<string, string>();
    });

    act(() => {
      result.current.set("key1", "value1");
    });

    expect(result.current.size).toBe(1);
    expect(result.current.get("key1")).toBe("value1");
  });

  it("should update an existing key when set is called", () => {
    const { result } = renderHook(() => {
      return useMap([["key1", "value1"]]);
    });

    act(() => {
      result.current.set("key1", "new_value");
    });

    expect(result.current.size).toBe(1);
    expect(result.current.get("key1")).toBe("new_value");
  });

  it("should remove a key-value pair when delete is called", () => {
    const { result } = renderHook(() => {
      return useMap([["key1", "value1"]]);
    });

    let deleteResult: boolean | undefined;

    act(() => {
      deleteResult = result.current.delete("key1");
    });

    expect(result.current.size).toBe(0);
    expect(result.current.has("key1")).toBe(false);
    expect(deleteResult).toBe(true);
  });

  it("should return false when deleting a non-existent key", () => {
    const { result } = renderHook(() => {
      return useMap();
    });

    let deleteResult: boolean | undefined;

    act(() => {
      deleteResult = result.current.delete("non_existent_key");
    });

    expect(deleteResult).toBe(false);
  });

  it("should remove all key-value pairs when clear is called", () => {
    const { result } = renderHook(() => {
      return useMap([
        ["key1", "value1"],
        ["key2", "value2"],
      ]);
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.size).toBe(0);
  });
});
