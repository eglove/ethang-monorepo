import { act, renderHook } from "@testing-library/react";
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

    expect(result.current.fullScreen).toBe(false);

    act(() => {
      result.current.openFullScreen();
    });

    expect(requestMock).toHaveBeenCalled();

    act(() => {
      result.current.closeFullScreen();
    });

    expect(exitMock).toHaveBeenCalled();
  });
});
