import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useIsLoading } from "../src/use-is-loading.js";

describe("useIsLoading", () => {
  it("should return caller and handle success case", async () => {
    const callback = async () => {
      return "callback-result";
    };

    const { result } = renderHook(() => {
      return useIsLoading(callback);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.results).toBeUndefined();
    expect(result.current.caller).toBeTypeOf("function");

    act(() => {
      result.current.caller?.();
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.results).toBe("callback-result");
    expect(result.current.error).toBeUndefined();
  });

  it("should handle error case", async () => {
    const mockError = new Error("callback-error");
    const callback = async () => {
      throw mockError;
    };

    const { result } = renderHook(() => {
      return useIsLoading(callback);
    });

    act(() => {
      result.current.caller?.();
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.results).toBeUndefined();
    expect(result.current.error).toBe(mockError);
  });
});
