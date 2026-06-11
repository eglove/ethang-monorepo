import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useMediaQuery } from "./use-media-query";

describe("useMediaQuery", () => {
  let mockMatchMedia: ReturnType<typeof vi.fn>;
  let mockAddEventListener: ReturnType<typeof vi.fn>;
  let mockRemoveEventListener: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockAddEventListener = vi.fn();
    mockRemoveEventListener = vi.fn();

    mockMatchMedia = vi.fn().mockImplementation((query: string) => {
      return {
        addEventListener: mockAddEventListener,
        matches: "(min-width: 768px)" === query,
        removeEventListener: mockRemoveEventListener
      };
    });

    vi.stubGlobal("matchMedia", mockMatchMedia);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("should return true when matches", () => {
    const { result, unmount } = renderHook(() => {
      return useMediaQuery("(min-width: 768px)");
    });

    expect(result.current).toBe(true);

    unmount();
  });

  it("should return false when doesn't match", () => {
    const { result } = renderHook(() => {
      return useMediaQuery("(min-width: 1024px)");
    });

    expect(result.current).toBe(false);
  });

  it("should update matches state on change event", async () => {
    let changeHandler: ((event: { matches: boolean }) => void) | undefined;

    mockAddEventListener.mockImplementation(
      (
        event: string,
        handler: (event: { matches: boolean }) => void,
        _options?: unknown
      ) => {
        if ("change" === event) {
          changeHandler = handler;
        }
      }
    );

    const { result } = renderHook(() => {
      return useMediaQuery("(min-width: 1024px)");
    });

    expect(result.current).toBe(false);

    if (changeHandler) {
      // simulate matchMedia matches change to true

      mockMatchMedia.mockImplementation(() => {
        return {
          addEventListener: mockAddEventListener,
          matches: true,
          removeEventListener: mockRemoveEventListener
        };
      });

      const { act } = await import("@testing-library/react");
      act(() => {
        if (changeHandler) {
          changeHandler({ matches: true });
        }
      });

      expect(result.current).toBe(true);
    }
  });
});
