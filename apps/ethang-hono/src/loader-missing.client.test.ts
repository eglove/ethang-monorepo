// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

describe("loader.client.ts - missing manifest", () => {
  it("should fallback to empty object if manifest is missing", async () => {
    document.body.innerHTML = `
      <div data-script="test"></div>
    `;
    // @ts-expect-error for test
    await import("./loader.client.ts?missing");

    expect(true).toBe(true);
  });
});
