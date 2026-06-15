import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useIsLoading } from "./use-is-loading.js";

describe(useIsLoading, () => {
  it("should handle successful execution", async () => {
    const callback = vi.fn().mockResolvedValue("success-data");
    const { result } = renderHook(() => {
      return useIsLoading(callback);
    });

    expect({
      error: result.current.error,
      isLoading: result.current.isLoading,
      results: result.current.results
    }).toStrictEqual({
      error: undefined,
      isLoading: false,
      results: undefined
    });

    await act(async () => {
      result.current.caller?.();
      await Promise.resolve();
    });

    expect({
      error: result.current.error,
      isLoading: result.current.isLoading,
      results: result.current.results
    }).toStrictEqual({
      error: undefined,
      isLoading: false,
      results: "success-data"
    });
  });

  it("should handle error execution", async () => {
    const callback = vi.fn().mockRejectedValue(new Error("failure-reason"));
    const { result } = renderHook(() => {
      return useIsLoading(callback);
    });

    await act(async () => {
      result.current.caller?.();
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.results).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe("failure-reason");
  });
});
