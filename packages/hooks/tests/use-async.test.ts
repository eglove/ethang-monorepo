import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useAsync } from "../src/use-async.js";

describe("useAsync", () => {
  it("should handle successful callback execution", async () => {
    const callback = async () => {
      return "success-value";
    };

    const { result } = renderHook(() => {
      return useAsync(callback);
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.result).toBe("success-value");
    expect(result.current.error).toBeUndefined();
  });

  it("should handle failed callback execution", async () => {
    const mockError = new Error("failed-error");
    const callback = async () => {
      throw mockError;
    };

    const { result } = renderHook(() => {
      return useAsync(callback);
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.result).toBeUndefined();
    expect(result.current.error).toBe(mockError);
  });
});
