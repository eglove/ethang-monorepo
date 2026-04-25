// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

describe("scrollbar-gutter.client.ts missing", () => {
  it("should not throw on click if containers are missing", async () => {
    document.body.innerHTML = `
      <button id="scrollbar-gutter-show-extra-content">Show extra content</button>
    `;

    // @ts-expect-error bad import test
    await import("./scrollbar-gutter.client.ts?missing");

    const button = document.querySelector("button");
    button?.click();

    expect(button?.textContent).toBe("Hide extra content");
  });
});
