// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

describe("navigation.client.ts missing", () => {
  it("should handle missing elements gracefully", async () => {
    document.body.innerHTML = `
      <button aria-controls="navbar-default" aria-expanded="false"></button>
    `;

    // Simulate different file import since we can't easily reset module graph without isolateModules
    // @ts-expect-error for test
    await import("./navigation.client.ts?missing");

    const button = document.querySelector("button");
    button?.click(); // Should not throw even if menu is missing

    expect(button?.getAttribute("aria-expanded")).toBe("true");
  });
});
