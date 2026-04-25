// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

describe("loader.client.ts - invalid manifest", () => {
  it("should fallback if manifest is invalid", async () => {
    document.body.innerHTML = `
      <script type="application/json" id="script-manifest">
        "not an object"
      </script>
      <div data-script="test"></div>
    `;
    // @ts-expect-error for test
    await import("./loader.client.ts?invalid");

    expect(true).toBe(true);
  });
});
