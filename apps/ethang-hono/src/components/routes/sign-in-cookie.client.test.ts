// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

describe("sign-in.client.ts cookieStore success", () => {
  it("should handle successful sign in with cookieStore", async () => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("location", { href: "" });
    const mockSet = vi.fn();
    vi.stubGlobal("cookieStore", { set: mockSet });

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
      ok: true,
    } as unknown as Response);

    // @ts-expect-error for test
    await import("./sign-in.client.ts?5");

    const form = document.querySelector("form");
    const button = document.querySelector<HTMLButtonElement>("button");
    const errorMessage = document.querySelector("#sign-in-error");

    form?.dispatchEvent(new Event("submit", { cancelable: true }));

    expect(button?.disabled).toBe(true);

    // Wait for async operations
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 10);
    });

    expect(mockSet).toHaveBeenCalledWith("ethang-auth-token", "test-token");
    expect(globalThis.location.href).toBe("/courses");
    expect(button?.disabled).toBe(false);
    expect(errorMessage?.classList.contains("hidden")).toBe(true);

    vi.unstubAllGlobals();
  });
});
