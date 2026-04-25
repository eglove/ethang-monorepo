// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

describe("scrollbar-gutter.client.ts", () => {
  it("should toggle visibility on button click", async () => {
    document.body.innerHTML = `
      <button id="scrollbar-gutter-show-extra-content">Show extra content</button>
      <div id="scrollbar-gutter-with-example" class="hidden"></div>
      <div id="scrollbar-gutter-without-example" class="hidden"></div>
    `;

    await import("./scrollbar-gutter.client.ts");

    const button = document.querySelector("button");
    const withContainer = document.querySelector(
      "#scrollbar-gutter-with-example",
    );
    const withoutContainer = document.querySelector(
      "#scrollbar-gutter-without-example",
    );

    button?.click();

    expect(button?.textContent).toBe("Hide extra content");
    expect(withContainer?.classList.contains("hidden")).toBe(false);
    expect(withoutContainer?.classList.contains("hidden")).toBe(false);

    button?.click();

    expect(button?.textContent).toBe("Show extra content");
    expect(withContainer?.classList.contains("hidden")).toBe(true);
    // eslint-disable-next-line vitest/max-expects
    expect(withoutContainer?.classList.contains("hidden")).toBe(true);
  });
});
