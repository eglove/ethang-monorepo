import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useAsync } from "../src/use-async.js";

describe("useAsync", () => {
  it("should handle a successful async call", async () => {
    const mockData = "success data";
    const callback = async () => {
      return new Promise<string>((resolve) => {
        setTimeout(() => resolve(mockData), 10);
      });
    };

    const { result } = renderHook(() => useAsync(callback));

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.result).toBeUndefined();
    expect(result.current.error).toBeUndefined();

    // Wait for the async call to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check final state
    expect(result.current.result).toBe(mockData);
    expect(result.current.error).toBeUndefined();
  });

  it("should handle a failed async call", async () => {
    const mockError = new Error("failed data");
    const callback = async () => {
      return new Promise<string>((_, reject) => {
        setTimeout(() => reject(mockError), 10);
      });
    };

    const { result } = renderHook(() => useAsync<string, Error>(callback));

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.result).toBeUndefined();
    expect(result.current.error).toBeUndefined();

    // Wait for the async call to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check final state
    expect(result.current.result).toBeUndefined();
    expect(result.current.error).toBe(mockError);
  });
});
