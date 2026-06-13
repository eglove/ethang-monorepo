import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useToggle } from "../src/use-toggle.js";

describe("useToggle", () => {
  it("should return the correct default value", () => {
    const { result } = renderHook(() => {
      return useToggle();
    });

    expect(result.current[0]).toBe(false);
  });

  it("should return the correct custom initial value", () => {
    const { result } = renderHook(() => {
      return useToggle(true);
    });

    expect(result.current[0]).toBe(true);
  });

  it("should toggle the value when handleToggle is called without arguments", () => {
    const { result } = renderHook(() => {
      return useToggle(false);
    });

    act(() => {
      const [, handleToggle] = result.current;
      handleToggle();
    });

    expect(result.current[0]).toBe(true);

    act(() => {
      const [, handleToggle] = result.current;
      handleToggle();
    });

    expect(result.current[0]).toBe(false);
  });

  it("should set the value to a specific boolean when handleToggle is called with arguments", () => {
    const { result } = renderHook(() => {
      return useToggle(false);
    });

    act(() => {
      const [, handleToggle] = result.current;
      (handleToggle as (value?: boolean) => void)(true);
    });

    expect(result.current[0]).toBe(true);

    act(() => {
      const [, handleToggle] = result.current;
      (handleToggle as (value?: boolean) => void)(false);
    });

    expect(result.current[0]).toBe(false);
  });
});
