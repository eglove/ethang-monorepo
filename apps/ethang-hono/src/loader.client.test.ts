// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

describe("loader.client.ts", () => {
  it("should process initial elements and dynamically added elements", async () => {
    vi.stubGlobal("console", { error: vi.fn() });

    document.body.innerHTML = `
      <script type="application/json" id="script-manifest">
        { "test-script": "http://example.com/test.js", "test-script-2": "http://example.com/test2.js" }
      </script>
      <div data-script="test-script"></div>
      <div data-script="non-existent"></div>
    `;

    await import("./loader.client.ts");

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 10);
    });

    // It should have called import which fails and calls console.error
    expect(globalThis.console.error).toHaveBeenCalledWith(expect.any(Error));

    // Now add an element dynamically to trigger MutationObserver
    const newDiv = document.createElement("div");
    newDiv.dataset["script"] = "test-script"; // Already loaded, should return early
    // @ts-expect-error allow for test
    document.body.append(newDiv);

    const newDiv2 = document.createElement("div");
    newDiv2.dataset["script"] = "test-script-2"; // Not loaded yet
    // @ts-expect-error allow for test
    document.body.append(newDiv2);

    const newDiv3 = document.createElement("div");
    // No data-script
    // @ts-expect-error allow for test
    document.body.append(newDiv3);

    const textNode = document.createTextNode("text");
    // @ts-expect-error allow for test
    document.body.append(textNode); // To hit isHtmlElementNode false branch

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 10);
    });

    vi.unstubAllGlobals();
  });
});
