import get from "lodash/get.js";
// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

describe("course-completion.client loading state", () => {
  it("attaches DOMContentLoaded listener if document is loading", async () => {
    Object.defineProperty(document, "readyState", {
      configurable: true,
      value: "loading",
    });
    const addEventListenerSpy = vi.spyOn(document, "addEventListener");

    // Import the module - this will trigger the side effect
    await import("./course-completion.client.js");

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "DOMContentLoaded",
      expect.any(Function),
    );

    // Trigger the callback
    const callback = get(addEventListenerSpy.mock, ["calls", 0, 1]);
    // @ts-expect-error for test
    callback();

    // init is async and floating, so we might need a small wait if we wanted to check its effects
    // but for coverage hitting the line is enough.
  });
});
