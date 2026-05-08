import hljs from "highlight.js";
// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

// @ts-expect-error allow for test
vi.mock(import("highlight.js"), () => {
  return {
    default: {
      highlightAll: vi.fn()
    }
  };
});

describe("code.client.ts", () => {
  it("should call highlightAll on import", async () => {
    vi.clearAllMocks();
    await import("./code.client.ts");

    expect(hljs.highlightAll).toHaveBeenCalledWith();
  });
});
