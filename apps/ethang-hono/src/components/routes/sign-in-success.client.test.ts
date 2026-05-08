// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

describe("sign-in.client.ts success no cookieStore", () => {
  it("should handle successful sign in without cookieStore", async () => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("location", { href: "" });
    document.cookie = "";

    const globalThisWithCookieStore = globalThis as unknown as {
      cookieStore?: unknown;
    };
    delete globalThisWithCookieStore.cookieStore;

    document.body.innerHTML = `
      <form id="sign-in-form">
        <input name="email" value="test@test.com" />
      </form>
      <button id="sign-in-button"></button>
      <p id="sign-in-error"></p>
    `;

    vi.mocked(fetch).mockResolvedValue({
      json: () => {
        return { sessionToken: "test-token" };
      },
      ok: true
    } as unknown as Response);

    // @ts-expect-error for test
    await import("./sign-in.client.ts?1");

    const form = document.querySelector("form");
    const button = document.querySelector<HTMLButtonElement>("button");

    form?.dispatchEvent(new Event("submit", { cancelable: true }));

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 10);
    });

    expect(document.cookie).toContain("ethang-auth-token=test-token");
    expect(globalThis.location.href).toBe("/courses");
    expect(button?.disabled).toBe(false);

    vi.unstubAllGlobals();
  });
});
