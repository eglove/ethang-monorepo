import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, onTestFinished } from "vitest";

import { useCopyClipboard } from "../src/use-copy-clipboard.js";

const setupClipboard = (mockFn: () => Promise<void>) => {
  vi.stubGlobal("navigator", {
    clipboard: {
      writeText: mockFn
    }
  });
  onTestFinished(() => {
    vi.unstubAllGlobals();
  });
};

describe("useCopyClipboard", () => {
  it("should successfully copy text to clipboard", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    setupClipboard(writeTextMock);

    const { result } = renderHook(() => {
      return useCopyClipboard();
    });

    expect(result.current.isCopied).toBe(false);
    expect(result.current.error).toBeUndefined();

    act(() => {
      result.current.copyToClipboard("test-text");
    });

    await waitFor(() => {
      expect(result.current.isCopied).toBe(true);
    });

    expect(writeTextMock).toHaveBeenCalledWith("test-text");
    expect(result.current.error).toBeUndefined();
  });

  it("should handle error when copy fails", async () => {
    const mockError = new Error("permission denied");
    const writeTextMock = vi.fn().mockRejectedValue(mockError);
    setupClipboard(writeTextMock);

    const { result } = renderHook(() => {
      return useCopyClipboard();
    });

    act(() => {
      result.current.copyToClipboard("test-text");
    });

    await waitFor(() => {
      expect(result.current.error).toBe(mockError);
    });
  });
});
