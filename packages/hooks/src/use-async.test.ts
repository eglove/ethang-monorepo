import { act, renderHook } from "@testing-library/react";
import noop from "lodash/noop.js";
import { describe, expect, it, vi } from "vitest";

import { useAsync } from "./use-async.js";

describe(useAsync, () => {
  it("should handle successful execution", async () => {
    let resolvePromise!: (value: string) => void;
    const promise = new Promise<string>((resolve) => {
      resolvePromise = resolve;
    });
    const callback = vi.fn().mockReturnValue(promise);

    const { result } = renderHook(() => {
      return useAsync(callback);
    });

    expect({
      error: result.current.error,
      isLoading: result.current.isLoading,
      result: result.current.result
    }).toStrictEqual({
      error: undefined,
      isLoading: true,
      result: undefined
    });

    await act(async () => {
      resolvePromise("success-data");
      await promise;
    });

    expect({
      error: result.current.error,
      isLoading: result.current.isLoading,
      result: result.current.result
    }).toStrictEqual({
      error: undefined,
      isLoading: false,
      result: "success-data"
    });
  });

  it("should handle error execution", async () => {
    let rejectPromise!: (reason: Error) => void;
    const promise = new Promise<string>((_, reject) => {
      rejectPromise = reject;
    });
    const callback = vi.fn().mockReturnValue(promise);

    const { result } = renderHook(() => {
      return useAsync(callback);
    });

    await act(async () => {
      rejectPromise(new Error("failure-reason"));
      await promise.catch(noop);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.result).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe("failure-reason");
  });
});
