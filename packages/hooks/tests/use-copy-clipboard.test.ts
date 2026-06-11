import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCopyClipboard } from "../src/use-copy-clipboard.ts";

describe("useCopyClipboard", () => {
  const originalClipboard = globalThis.navigator.clipboard;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(performance.now());
      return 1;
    });

    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn(),
      } as unknown as Clipboard,
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: originalClipboard,
      writable: true,
    });
  });

  it("should return initial state", () => {
    const { result } = renderHook(() => {
      return useCopyClipboard();
    });

    expect(result.current.isCopied).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(typeof result.current.copyToClipboard).toBe("function");
  });

  it("should set isCopied to true and then false after duration", async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    globalThis.navigator.clipboard.writeText = mockWriteText;

    const { result } = renderHook(() => {
      return useCopyClipboard();
    });

    await act(async () => {
      result.current.copyToClipboard("test text");
    });

    expect(mockWriteText).toHaveBeenCalledWith("test text");
    expect(result.current.isCopied).toBe(true);
    expect(result.current.error).toBeUndefined();

    await act(async () => {
      vi.advanceTimersByTime(2000);
      // It also uses requestAnimationFrame, so we should mock it or flush microtasks
    });

    expect(result.current.isCopied).toBe(false);
  });

  it("should handle error when writeText rejects", async () => {
    const mockError = new Error("Clipboard error");
    const mockWriteText = vi.fn().mockRejectedValue(mockError);
    globalThis.navigator.clipboard.writeText = mockWriteText;

    const { result } = renderHook(() => {
      return useCopyClipboard();
    });

    await act(async () => {
      result.current.copyToClipboard("test text");
    });

    await act(async () => {
      vi.runAllTimers();
    });

    expect(mockWriteText).toHaveBeenCalledWith("test text");
    expect(result.current.isCopied).toBe(false);
    expect(result.current.error).toEqual(mockError);
  });

  it("should handle error in catch block of promise", async () => {
    const mockError = new Error("Async Clipboard error");

    // We can mock the Promise returned by asyncCopy by mocking globalThis.navigator.clipboard.writeText
    // to throw a non-promise error or we can just mock it in a way that triggers the catch.
    // Wait, async function ALWAYS returns a promise. So any error inside try block goes to the local catch.
    // The only way to trigger the outer catch in an async function is if `globalThis.navigator.clipboard.writeText`
    // is a getter that throws synchronously BEFORE the promise is created,
    // OR if we spy on `navigator.clipboard` to throw when `writeText` is accessed.

    vi.spyOn(globalThis.navigator.clipboard, "writeText").mockImplementation(() => {
      throw mockError;
    });

    const { result } = renderHook(() => {
      return useCopyClipboard();
    });

    await act(async () => {
      result.current.copyToClipboard("test text");
    });

    await act(async () => {
      vi.runAllTimers();
    });

    expect(result.current.isCopied).toBe(false);
    expect(result.current.error).toEqual(mockError);
  });

  it("should not set error if asyncError is not an Error instance", async () => {
    vi.spyOn(globalThis.navigator.clipboard, "writeText").mockImplementation(() => {
      throw "string error";
    });

    const { result } = renderHook(() => {
      return useCopyClipboard();
    });

    await act(async () => {
      result.current.copyToClipboard("test text");
    });

    await act(async () => {
      vi.runAllTimers();
    });

    expect(result.current.isCopied).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it("should not set error if error is not an Error instance", async () => {
    const mockWriteText = vi.fn().mockRejectedValue("string error");
    globalThis.navigator.clipboard.writeText = mockWriteText;

    const { result } = renderHook(() => {
      return useCopyClipboard();
    });

    await act(async () => {
      result.current.copyToClipboard("test text");
    });

    expect(mockWriteText).toHaveBeenCalledWith("test text");
    expect(result.current.isCopied).toBe(false);
    expect(result.current.error).toBeUndefined();
  });
});
