// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

describe("sign-in.client.ts error handling", () => {
  it("should handle missing elements gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn());
    document.body.innerHTML = "";
    // @ts-expect-error for test
    await import("./sign-in.client.ts?2");

    expect(true).toBe(true);

    vi.unstubAllGlobals();
  });

  it("should handle fetch bad response", async () => {
    vi.stubGlobal("fetch", vi.fn());
    document.body.innerHTML = `
      <form id="sign-in-form"></form>
      <button id="sign-in-button"></button>
      <p id="sign-in-error" class="hidden"></p>
    `;

    vi.mocked(fetch).mockResolvedValue({
      ok: false
    } as Response);

    // @ts-expect-error for test
    await import("./sign-in.client.ts?3");

    const form = document.querySelector("form");
    const button = document.querySelector<HTMLButtonElement>("button");
    const errorMessage = document.querySelector("#sign-in-error");

    form?.dispatchEvent(new Event("submit", { cancelable: true }));

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 10);
    });

    expect(button?.disabled).toBe(false);
    expect(errorMessage?.textContent).toBe("Failed to sign in");
    expect(errorMessage?.classList.contains("hidden")).toBe(false);

    vi.unstubAllGlobals();
  });

  it("should handle fetch network error", async () => {
    vi.stubGlobal("fetch", vi.fn());
    document.body.innerHTML = `
      <form id="sign-in-form"></form>
      <button id="sign-in-button"></button>
      <p id="sign-in-error" class="hidden"></p>
    `;

    vi.mocked(fetch).mockRejectedValue(new Error("Network"));

    // @ts-expect-error for test
    await import("./sign-in.client.ts?4");

    const form = document.querySelector("form");
    const button = document.querySelector<HTMLButtonElement>("button");
    const errorMessage = document.querySelector("#sign-in-error");

    form?.dispatchEvent(new Event("submit", { cancelable: true }));

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 10);
    });

    expect(button?.disabled).toBe(false);
    expect(errorMessage?.textContent).toBe("Failed to sign in");
    expect(errorMessage?.classList.contains("hidden")).toBe(false);

    vi.unstubAllGlobals();
  });
});
