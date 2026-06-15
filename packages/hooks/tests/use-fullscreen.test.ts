import { act, renderHook } from "@testing-library/react";
import { type RefObject } from "react";
import { describe, expect, it, vi, onTestFinished } from "vitest";

import { useFullscreen } from "../src/use-fullscreen.js";

const setupFullscreenMocks = (
  exitMock: () => Promise<void>
) => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  document.exitFullscreen = async () => {};
  vi.spyOn(document, "exitFullscreen").mockImplementation(exitMock);
  onTestFinished(() => {
    vi.restoreAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (document as any).exitFullscreen;
  });
};

describe("useFullscreen", () => {
  it("should open and close fullscreen", async () => {
    const exitMock = vi.fn().mockResolvedValue(undefined);
    const requestMock = vi.fn().mockResolvedValue(undefined);
    setupFullscreenMocks(exitMock);

    const element = {
      requestFullscreen: requestMock
    } as unknown as HTMLElement;

    const ref = { current: element };

    const { result } = renderHook(() => {
      return useFullscreen(ref);
    });

    expect(result.current["fullScreen"]).toBe(false);

    act(() => {
      result.current["openFullScreen"]();
    });

    expect(requestMock).toHaveBeenCalled();

    act(() => {
      result.current["closeFullScreen"]();
    });

    expect(exitMock).toHaveBeenCalled();
  });

  it("should do nothing if element is null on openFullScreen", () => {
    const ref = { current: null } as unknown as RefObject<HTMLElement>;
    const { result } = renderHook(() => {
      return useFullscreen(ref);
    });

    act(() => {
      result.current["openFullScreen"]();
    });

    expect(result.current["fullScreen"]).toBe(false);
  });

  it("should handle error in requestFullscreen", async () => {
    const requestMock = vi.fn().mockRejectedValue(new Error("fullscreen error"));
    const element = {
      requestFullscreen: requestMock
    } as unknown as HTMLElement;

    const ref = { current: element };

    const { result } = renderHook(() => {
      return useFullscreen(ref);
    });

    await act(async () => {
      result.current["openFullScreen"]();
    });

    expect(result.current["fullScreen"]).toBe(false);
  });

  it("should handle error in exitFullscreen", async () => {
    const exitMock = vi.fn().mockRejectedValue(new Error("exit error"));
    setupFullscreenMocks(exitMock);

    const ref = { current: {} as HTMLElement };
    const { result } = renderHook(() => {
      return useFullscreen(ref);
    });

    await act(async () => {
      result.current["closeFullScreen"]();
    });

    expect(result.current["fullScreen"]).toBe(false);
  });

  it("should update state when fullscreenchange event is fired", () => {
    const exitMock = vi.fn().mockResolvedValue(undefined);
    setupFullscreenMocks(exitMock);

    const element = {} as HTMLElement;
    const ref = { current: element };

    const { result } = renderHook(() => {
      return useFullscreen(ref);
    });

    expect(result.current["fullScreen"]).toBe(false);

    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: element,
    });

    act(() => {
      globalThis.dispatchEvent(new Event("fullscreenchange"));
    });

    expect(result.current["fullScreen"]).toBe(true);

    act(() => {
      result.current["toggle"]();
    });
    expect(exitMock).toHaveBeenCalled();

    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: null,
    });

    act(() => {
      globalThis.dispatchEvent(new Event("fullscreenchange"));
    });

    expect(result.current["fullScreen"]).toBe(false);
  });
});
