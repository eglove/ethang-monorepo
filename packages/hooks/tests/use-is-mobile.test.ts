import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const mockMatchMedia = vi.fn();
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

describe("useIsMobile", () => {
  let useIsMobile: any;

  beforeEach(async () => {
    vi.resetModules();

    mockMatchMedia.mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
      dispatchEvent: vi.fn(),
    }));

    vi.stubGlobal("matchMedia", mockMatchMedia);
    vi.stubGlobal("window", { innerWidth: 1000 });

    const module = await import("../src/use-is-mobile");
    useIsMobile = module.useIsMobile;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("should evaluate correctly if globalThis matchMedia is undefined", () => {
    vi.stubGlobal("matchMedia", undefined);
    vi.stubGlobal("window", { innerWidth: 500 });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current.isMobile).toBe(true);
  });

  it("should return true if window.innerWidth is less than mobileBreakPoint", () => {
    vi.stubGlobal("window", { innerWidth: 500 });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current.isMobile).toBe(true);
  });

  it("should return false if window.innerWidth is greater than or equal to mobileBreakPoint", () => {
    vi.stubGlobal("window", { innerWidth: 1000 });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current.isMobile).toBe(false);
  });

  it("should update isMobile when media query changes", () => {
    vi.stubGlobal("window", { innerWidth: 1000 });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current.isMobile).toBe(false);

    act(() => {
      vi.stubGlobal("window", { innerWidth: 500 });
      // Event listener is attached in useEffect
      const changeCallback = mockAddEventListener.mock.calls[0]?.[1] as () => void;
      changeCallback();
    });

    expect(result.current.isMobile).toBe(true);
  });

  it("should use custom breakpoint if provided", () => {
    vi.stubGlobal("window", { innerWidth: 800 });
    const { result } = renderHook(() => useIsMobile(1000));
    expect(result.current.isMobile).toBe(true);
  });

  it("should remove event listener on unmount", () => {
    const { unmount } = renderHook(() => useIsMobile());
    unmount();
  });
});

describe("useIsMobile without window", () => {
  it("should evaluate correctly when window is absent", async () => {
    vi.resetModules();

    // Stub react to avoid it blowing up when window is undefined during rendering
    vi.doMock("react", async (importOriginal) => {
        const actual = await importOriginal<typeof import('react')>();
        return {
            ...actual,
            useState: vi.fn().mockImplementation((init) => [typeof init === 'function' ? init() : init, vi.fn()]),
            useEffect: vi.fn(),
        }
    });

    // We also must ensure globalThis is preserved, but we mock the behavior of `!globalThis.window` by stubbing `window`
    const originalWindow = globalThis.window;
    // @ts-ignore
    delete globalThis.window;

    try {
        const module = await import("../src/use-is-mobile");
        const hook = module.useIsMobile;
        const result = hook();
        expect(result.isMobile).toBe(false);
    } finally {
        // @ts-ignore
        globalThis.window = originalWindow;
    }
  });
});
