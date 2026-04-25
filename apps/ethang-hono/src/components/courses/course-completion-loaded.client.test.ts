// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

describe("course-completion.client loaded state", () => {
  it("calls init immediately if document is already loaded", async () => {
    Object.defineProperty(document, "readyState", {
      configurable: true,
      value: "complete",
    });

    // Mock fetch for the immediate init call
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: () => {
          return {};
        },
        ok: true,
      }),
    );
    document.cookie = "ethang-auth-token=test-token";

    // Import the module - this will trigger the side effect (init())
    await import("./course-completion.client.js");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
    );
  });
});
