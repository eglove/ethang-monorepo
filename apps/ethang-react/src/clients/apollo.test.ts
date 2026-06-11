import noop from "lodash/noop.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("apolloClient window refocus", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
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
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(noop);
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
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to refetch queries on refocus:",
      testError
    );
  });
});
