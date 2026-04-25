// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

describe("navigation.client.ts", () => {
  it("should toggle menu on button click", async () => {
    document.body.innerHTML = `
      <button aria-controls="navbar-default" aria-expanded="false"></button>
      <div id="navbar-default" class="hidden"></div>
    `;

    await import("./navigation.client.ts");

    const button = document.querySelector("button");
    const menu = document.querySelector("#navbar-default");

    button?.click();

    expect(button?.getAttribute("aria-expanded")).toBe("true");
    expect(menu?.classList.contains("hidden")).toBe(false);

    button?.click();

    expect(button?.getAttribute("aria-expanded")).toBe("false");
    expect(menu?.classList.contains("hidden")).toBe(true);
  });
});
