import { renderHook, act, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { useIsLoading } from "./use-is-loading";

test("should manage loading state correctly", async () => {
  let resolvePromise: (value: string) => void;
  const mockPromise = () => new Promise<string>((resolve) => {
    resolvePromise = resolve;
  });

  const { result } = renderHook(() => {
    return useIsLoading(mockPromise);
  });

  // initial state should not be loading, caller should be a function
  expect(typeof result.current.caller).toBe("function");
  expect(result.current.isLoading).toBe(false);
  expect(result.current.results).toBeUndefined();

  act(() => {
    result.current.caller!();
  });

  expect(result.current.isLoading).toBe(true);

  act(() => {
    resolvePromise!("data");
  });

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
    expect(result.current.results).toBe("data");
  });
});

test("should manage error state correctly", async () => {
  let rejectPromise: (reason?: any) => void;
  const mockPromise = () => new Promise<string>((_, reject) => {
    rejectPromise = reject;
  });

  const { result } = renderHook(() => {
    return useIsLoading(mockPromise);
  });

  expect(typeof result.current.caller).toBe("function");
  expect(result.current.isLoading).toBe(false);
  expect(result.current.error).toBeUndefined();

  act(() => {
    result.current.caller!();
  });

  expect(result.current.isLoading).toBe(true);

  act(() => {
    rejectPromise!(new Error("failed"));
  });

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toEqual(new Error("failed"));
  });
});
