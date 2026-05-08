import constant from "lodash/constant.js";
// @vitest-environment jsdom
import includes from "lodash/includes.js";
import isString from "lodash/isString.js";
import split from "lodash/split.js";
import trim from "lodash/trim.js";
import { describe, expect, it, vi } from "vitest";

const AUTH_COOKIE_NAME = "ethang-auth-token";
const VERIFY_URL = "https://auth.ethang.dev/verify";
const X_TOKEN = "X-Token";
const VALID_TOKEN = "valid-token";

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

describe("course-completion.client applyStoredStatuses", () => {
  it("returns early if response is not ok", async () => {
    await resetTestState();
    const { init } = await import("./course-completion.client.js");
    document.cookie = `${AUTH_COOKIE_NAME}=${VALID_TOKEN}`;
    // eslint-disable-next-line @typescript-eslint/require-await
    vi.mocked(fetch).mockImplementation(async (url) => {
      if (isString(url) && includes(url, "verify")) {
        return {
          json: () => {
            return { email: "e", exp: 2, iat: 1, sub: "123", username: "u" };
          },
          ok: true
        } as unknown as Response;
      }
      return { ok: false } as Response;
    });

    await init();

    expect(fetch).toHaveBeenCalledWith(VERIFY_URL, {
      headers: {
        [X_TOKEN]: VALID_TOKEN
      }
    });
  });

  it("returns early if verification fails and uses cookieStore", async () => {
    await resetTestState();
    const { init } = await import("./course-completion.client.js");
    document.cookie = `${AUTH_COOKIE_NAME}=${VALID_TOKEN}`;
    const deleteSpy = vi.fn();
    vi.stubGlobal("cookieStore", { delete: deleteSpy });

    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);

    await init();

    expect(fetch).toHaveBeenCalledWith(VERIFY_URL, {
      headers: {
        [X_TOKEN]: VALID_TOKEN
      }
    });
    expect(deleteSpy).toHaveBeenCalledWith(AUTH_COOKIE_NAME);
  });

  it("returns early if verification fails without cookieStore", async () => {
    await resetTestState();
    const { init } = await import("./course-completion.client.js");
    document.cookie = `${AUTH_COOKIE_NAME}=${VALID_TOKEN}`;

    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);

    await init();

    expect(fetch).toHaveBeenCalledWith(VERIFY_URL, {
      headers: {
        [X_TOKEN]: VALID_TOKEN
      }
    });
    expect(document.cookie).toBe("");
  });

  it("returns early if parsing fails in applyStoredStatuses", async () => {
    await resetTestState();
    const { init } = await import("./course-completion.client.js");
    document.cookie = `${AUTH_COOKIE_NAME}=${VALID_TOKEN}`;
    // eslint-disable-next-line @typescript-eslint/require-await
    vi.mocked(fetch).mockImplementation(async (url) => {
      if (isString(url) && includes(url, "verify")) {
        return {
          json: () => {
            return { email: "e", exp: 2, iat: 1, sub: "123", username: "u" };
          },
          ok: true
        } as unknown as Response;
      }
      return {
        json: () => {
          return { data: [{ invalid: "object" }] };
        },
        ok: true
      } as unknown as Response;
    });

    await init();

    expect(fetch).toHaveBeenCalledWith(VERIFY_URL, {
      headers: {
        [X_TOKEN]: VALID_TOKEN
      }
    });
  });

  it("handles non-object response in applyStoredStatuses", async () => {
    await resetTestState();
    const { init } = await import("./course-completion.client.js");
    document.cookie = `${AUTH_COOKIE_NAME}=${VALID_TOKEN}`;
    // eslint-disable-next-line @typescript-eslint/require-await
    vi.mocked(fetch).mockImplementation(async (url) => {
      if (isString(url) && includes(url, "verify")) {
        return {
          json: () => {
            return { email: "e", exp: 2, iat: 1, sub: "123", username: "u" };
          },
          ok: true
        } as unknown as Response;
      }
      return {
        json: constant(null),
        ok: true
      } as unknown as Response;
    });

    await init();

    expect(fetch).toHaveBeenCalledWith(VERIFY_URL, {
      headers: {
        [X_TOKEN]: VALID_TOKEN
      }
    });
  });

  it("handles response without data property in applyStoredStatuses", async () => {
    await resetTestState();
    const { init } = await import("./course-completion.client.js");
    document.cookie = `${AUTH_COOKIE_NAME}=${VALID_TOKEN}`;
    // eslint-disable-next-line @typescript-eslint/require-await
    vi.mocked(fetch).mockImplementation(async (url) => {
      if (isString(url) && includes(url, "verify")) {
        return {
          json: () => {
            return { email: "e", exp: 2, iat: 1, sub: "123", username: "u" };
          },
          ok: true
        } as unknown as Response;
      }
      return {
        json: () => {
          return { other: [] };
        },
        ok: true
      } as unknown as Response;
    });

    await init();

    expect(fetch).toHaveBeenCalledWith(VERIFY_URL, {
      headers: {
        [X_TOKEN]: VALID_TOKEN
      }
    });
  });
});
