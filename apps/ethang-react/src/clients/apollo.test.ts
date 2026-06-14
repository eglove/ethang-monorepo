import { beforeEach, describe, expect, it, vi } from "vitest";

const mockError = vi.fn();

vi.mock("@ethang/logger-sdk", () => {
  return {
    LoggerClient: class {
      public debug = vi.fn();
      public error = mockError;
      public fatal = vi.fn();
      public info = vi.fn();
      public warn = vi.fn();
    }
  };
});

describe("apolloClient window refocus", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    mockError.mockClear();
  });

  it("registers focus event listener on globalThis when addEventListener is a function", async () => {
    const addEventListenerSpy = vi.spyOn(globalThis, "addEventListener");

    await import("./apollo.ts");

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "focus",
      expect.any(Function)
    );
  });

  it("does not register listener and does not throw when addEventListener is not a function", async () => {
    // @ts-expect-error allow undefined
    vi.stubGlobal("addEventListener");

    const { apolloClient } = await import("./apollo.ts");

    expect(apolloClient).toBeDefined();
  });

  it("calls apolloClient.refetchQueries with active queries when focus event is triggered", async () => {
    const { apolloClient } = await import("./apollo.ts");
    const refetchSpy = vi
      .spyOn(apolloClient, "refetchQueries")
      .mockResolvedValue([]);

    globalThis.dispatchEvent(new Event("focus"));

    expect(refetchSpy).toHaveBeenCalledWith({ include: "active" });
  });

  it("catches and logs errors when refetchQueries rejects", async () => {
    const { apolloClient } = await import("./apollo.ts");
    const testError = new Error("Refetch queries failed");
    const refetchSpy = vi
      .spyOn(apolloClient, "refetchQueries")
      .mockRejectedValue(testError);

    globalThis.dispatchEvent(new Event("focus"));

    // Wait for the microtask queue / promises to resolve
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(refetchSpy).toHaveBeenCalledWith({ include: "active" });
    expect(mockError).toHaveBeenCalledWith(
      "Failed to refetch queries on refocus",
      undefined,
      testError.stack
    );
  });
});
