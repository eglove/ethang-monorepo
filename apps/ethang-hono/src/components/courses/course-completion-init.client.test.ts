// @vitest-environment jsdom
import split from "lodash/split.js";
import trim from "lodash/trim.js";
import { describe, expect, it, vi } from "vitest";

const AUTH_COOKIE_NAME = "ethang-auth-token";

vi.stubGlobal("SKIP_INIT", true);

const resetTestState = async () => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();

  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      json: () => {
        return {};
      },
      ok: true
    })
  );
  vi.stubGlobal("location", { reload: vi.fn() });
  document.body.innerHTML = "";

  for (const cookie of split(document.cookie, ";")) {
    const eqPos = cookie.indexOf("=");
    const name = -1 < eqPos ? trim(cookie.slice(0, eqPos)) : trim(cookie);
    if (name) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  }

  const { store, ui } = await import("./course-completion.client.js");
  store.reset();
  ui.reset();
};

describe("course-completion.client init tests", () => {
  it("hides authenticated UI when no token is present (cookieStore)", async () => {
    await resetTestState();
    const { init } = await import("./course-completion.client.js");
    vi.stubGlobal("cookieStore", {
      get: vi.fn().mockResolvedValue(undefined)
    });
    document.body.innerHTML = `
      <div id="auth-section-header"></div>
      <div id="sign-in-prompt" class="hidden"></div>
      <button class="course-completion-button"></button>
      <div class="course-status-text"></div>
    `;

    await init();

    expect(
      document
        .querySelector("#auth-section-header")
        ?.classList.contains("hidden")
    ).toBe(true);
    expect(
      document.querySelector("#sign-in-prompt")?.classList.contains("hidden")
    ).toBe(false);
    expect(
      document
        .querySelector(".course-completion-button")
        ?.classList.contains("hidden")
    ).toBe(true);
    expect(
      document
        .querySelector(".course-status-text")
        ?.classList.contains("hidden")
    ).toBe(true);
  });

  it("hides authenticated UI when no token is present (document.cookie)", async () => {
    await resetTestState();
    const { init } = await import("./course-completion.client.js");
    document.cookie = "other-cookie=value";
    document.body.innerHTML = `
      <div id="auth-section-header"></div>
      <div id="sign-in-prompt" class="hidden"></div>
    `;

    await init();

    expect(
      document
        .querySelector("#auth-section-header")
        ?.classList.contains("hidden")
    ).toBe(true);
  });

  it("uses token from document.cookie when cookieStore is absent", async () => {
    await resetTestState();
    const { init } = await import("./course-completion.client.js");
    document.cookie = `${AUTH_COOKIE_NAME}=test-token`;
    vi.mocked(fetch).mockResolvedValue({
      json: () => {
        return { email: "e", exp: 2, iat: 1, sub: "123", username: "u" };
      },
      ok: true
    } as unknown as Response);
    document.body.innerHTML = '<div id="auth-section-header"></div>';

    await init();

    expect(fetch).toHaveBeenCalledWith(
      "https://auth.ethang.dev/verify",
      expect.objectContaining({
        headers: { "X-Token": "test-token" }
      })
    );
  });

  it("deletes cookie using document.cookie when cookieStore is absent", async () => {
    await resetTestState();
    const { init } = await import("./course-completion.client.js");
    document.cookie = `${AUTH_COOKIE_NAME}=test-token`;
    vi.mocked(fetch).mockResolvedValue({
      ok: false
    } as Response);

    await init();

    expect(document.cookie).not.toContain(`${AUTH_COOKIE_NAME}=`);
  });
});
