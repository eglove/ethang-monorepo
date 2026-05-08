// @vitest-environment jsdom
import constant from "lodash/constant.js";
import includes from "lodash/includes.js";
import isString from "lodash/isString.js";
import noop from "lodash/noop.js";
import split from "lodash/split.js";
import trim from "lodash/trim.js";
import { describe, expect, it, vi } from "vitest";

const AUTH_COOKIE_NAME = "ethang-auth-token";
const TRACKING_URL = "course-tracking";

vi.stubGlobal("SKIP_INIT", true);

const UNKNOWN_URL = "Unknown URL";
const COURSE_COMPLETION_BUTTON_CLASS = ".course-completion-button";
const COURSE_STATUS_TEXT_CLASS = ".course-status-text";

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

// eslint-disable-next-line sonar/max-lines-per-function
describe("course-completion.client authenticated functionality", () => {
  const userData = {
    email: "test@example.com",
    exp: 2,
    iat: 1,
    sub: "user-123",
    username: "testuser"
  };
  const trackingData = [
    { courseUrl: "url-1", id: "id-1", status: "Complete", userId: "user-123" },
    { courseUrl: "url-2", id: "id-2", status: "Revisit", userId: "user-123" }
  ];

  it("applies stored statuses and sets percentages", async () => {
    await resetTestState();
    const { init } = await import("./course-completion.client.js");
    document.cookie = `${AUTH_COOKIE_NAME}=valid-token`;
    // eslint-disable-next-line @typescript-eslint/require-await
    vi.mocked(fetch).mockImplementation(async (url) => {
      if (isString(url) && includes(url, "verify")) {
        return {
          json: () => {
            return userData;
          },
          ok: true
        } as unknown as Response;
      }
      if (isString(url) && includes(url, TRACKING_URL)) {
        return {
          json: () => {
            return { data: trackingData };
          },
          ok: true
        } as unknown as Response;
      }
      throw new Error(UNKNOWN_URL);
    });

    document.body.innerHTML = `
      <div id="auth-section-header" class="hidden"></div>
      <div id="course-progress-bar" class="hidden"></div>
      <div id="sign-in-prompt"></div>
      <div id="complete-progress"></div>
      <div id="incomplete-progress"></div>
      <div id="revisit-progress"></div>
      <div>
        <button class="course-completion-button" data-course-url="url-1" data-course-id="id-1"></button>
        <div class="course-status-text"></div>
      </div>
      <div>
        <button class="course-completion-button" data-course-url="url-2" data-course-id="id-2"></button>
        <div class="course-status-text"></div>
      </div>
      <div>
        <button class="course-completion-button" data-course-url="url-3" data-course-id="id-3"></button>
        <div class="course-status-text"></div>
      </div>
      <div>
        <button class="course-completion-button"></button>
      </div>
    `;

    await init();

    const buttons = document.querySelectorAll(COURSE_COMPLETION_BUTTON_CLASS);
    const statusTexts = document.querySelectorAll(COURSE_STATUS_TEXT_CLASS);

    expect(statusTexts[0]?.textContent).toBe("Complete");
    expect(buttons[0]?.classList.contains("bg-sky-300")).toBe(true);

    expect(statusTexts[1]?.textContent).toBe("Revisit");
    expect(buttons[1]?.classList.contains("bg-amber-400")).toBe(true);

    expect(statusTexts[2]?.textContent).toBe("Incomplete");
    // eslint-disable-next-line vitest/max-expects
    expect(buttons[2]?.classList.contains("bg-slate-700")).toBe(true);
  });

  it("handles button clicks", async () => {
    await resetTestState();
    const { init } = await import("./course-completion.client.js");
    document.cookie = `${AUTH_COOKIE_NAME}=valid-token`;
    // eslint-disable-next-line @typescript-eslint/require-await
    vi.mocked(fetch).mockImplementation(async (url) => {
      if (isString(url) && includes(url, "verify")) {
        return {
          json: () => {
            return userData;
          },
          ok: true
        } as unknown as Response;
      }
      if (isString(url) && includes(url, TRACKING_URL)) {
        return {
          json: () => {
            return { data: trackingData };
          },
          ok: true
        } as unknown as Response;
      }
      throw new Error(UNKNOWN_URL);
    });

    document.body.innerHTML = `
      <div id="auth-section-header" class="hidden"></div>
      <div id="course-progress-bar" class="hidden"></div>
      <div id="sign-in-prompt"></div>
      <div id="complete-progress"></div>
      <div id="incomplete-progress"></div>
      <div id="revisit-progress"></div>
      <div>
        <button class="course-completion-button" data-course-url="url-1" data-course-id="id-1"></button>
        <div class="course-status-text"></div>
      </div>
    `;

    await init();

    const button = document.querySelector<HTMLButtonElement>(
      COURSE_COMPLETION_BUTTON_CLASS
    );
    const statusText = button?.parentElement?.querySelector(
      COURSE_STATUS_TEXT_CLASS
    );

    vi.mocked(fetch).mockResolvedValue({
      json: () => {
        return { data: { ...trackingData[0], status: "Revisit" } };
      },
      ok: true
    } as unknown as Response);

    button?.click();
    await vi.waitFor(() => {
      expect(statusText?.textContent).toBe("Revisit");
    });
  });

  it("handles failed button clicks", async () => {
    await resetTestState();
    const { init } = await import("./course-completion.client.js");
    document.cookie = `${AUTH_COOKIE_NAME}=valid-token`;
    // eslint-disable-next-line @typescript-eslint/require-await
    vi.mocked(fetch).mockImplementation(async (url) => {
      if (isString(url) && includes(url, "verify")) {
        return {
          json: () => {
            return { email: "e", exp: 2, iat: 1, sub: "user-1", username: "u" };
          },
          ok: true
        } as unknown as Response;
      }
      if (isString(url) && includes(url, TRACKING_URL)) {
        return {
          json: () => {
            return { data: [] };
          },
          ok: true
        } as unknown as Response;
      }
      throw new Error(UNKNOWN_URL);
    });
    document.body.innerHTML = `
      <div>
        <button class="course-completion-button" data-course-url="url-1" data-course-id="id-1"></button>
        <div class="course-status-text">Original</div>
      </div>
    `;

    await init();
    const button = document.querySelector<HTMLButtonElement>(
      COURSE_COMPLETION_BUTTON_CLASS
    );
    const statusText = document.querySelector(COURSE_STATUS_TEXT_CLASS);

    vi.mocked(fetch).mockResolvedValue({
      ok: false
    } as Response);

    button?.click();
    await vi.waitFor(() => {
      expect(button?.disabled).toBe(false);
    });

    expect(statusText?.textContent).toBe("Incomplete");
  });

  it("handles button without courseId", async () => {
    await resetTestState();
    const { init } = await import("./course-completion.client.js");
    document.cookie = `${AUTH_COOKIE_NAME}=valid-token`;
    vi.mocked(fetch).mockResolvedValue({
      json: () => {
        return { email: "e", exp: 2, iat: 1, sub: "123", username: "u" };
      },
      ok: true
    } as unknown as Response);
    document.body.innerHTML = `
      <button class="course-completion-button" data-course-url="url-1"></button>
    `;

    await init();

    expect(fetch).toHaveBeenCalledWith("https://auth.ethang.dev/verify", {
      headers: {
        "X-Token": "valid-token"
      }
    });
  });

  it("handles missing statusElement in setUiState", async () => {
    await resetTestState();
    const { init } = await import("./course-completion.client.js");
    document.cookie = `${AUTH_COOKIE_NAME}=valid-token`;
    // eslint-disable-next-line @typescript-eslint/require-await
    vi.mocked(fetch).mockImplementation(async (url) => {
      if (isString(url) && includes(url, "verify")) {
        return {
          json: () => {
            return { email: "e", exp: 2, iat: 1, sub: "user-1", username: "u" };
          },
          ok: true
        } as unknown as Response;
      }
      if (isString(url) && includes(url, TRACKING_URL)) {
        return {
          json: () => {
            return { data: [] };
          },
          ok: true
        } as unknown as Response;
      }
      throw new Error(UNKNOWN_URL);
    });
    document.body.innerHTML = `
      <button class="course-completion-button" data-course-url="url-1" data-course-id="id-1"></button>
    `;

    await init();
    const button = document.querySelector<HTMLButtonElement>(
      COURSE_COMPLETION_BUTTON_CLASS
    );

    vi.mocked(fetch).mockResolvedValue({
      json: () => {
        return {
          data: {
            courseUrl: "url-1",
            id: "id-1",
            status: "Complete",
            userId: "user-1"
          }
        };
      },
      ok: true
    } as unknown as Response);

    button?.click();
    await vi.waitFor(() => {
      expect(button?.disabled).toBe(false);
    });
  });

  it("handles parsing failure in handleButtonClick", async () => {
    await resetTestState();
    const { init } = await import("./course-completion.client.js");
    document.cookie = `${AUTH_COOKIE_NAME}=valid-token`;
    // eslint-disable-next-line @typescript-eslint/require-await
    vi.mocked(fetch).mockImplementation(async (url) => {
      if (isString(url) && includes(url, "verify")) {
        return {
          json: () => {
            return { email: "e", exp: 2, iat: 1, sub: "user-1", username: "u" };
          },
          ok: true
        } as unknown as Response;
      }
      if (isString(url) && includes(url, TRACKING_URL)) {
        return {
          json: () => {
            return { data: [] };
          },
          ok: true
        } as unknown as Response;
      }
      throw new Error(UNKNOWN_URL);
    });
    document.body.innerHTML = `
      <div>
        <button class="course-completion-button" data-course-url="url-1" data-course-id="id-1"></button>
        <div class="course-status-text"></div>
      </div>
    `;

    await init();
    const button = document.querySelector<HTMLButtonElement>(
      COURSE_COMPLETION_BUTTON_CLASS
    );

    vi.mocked(fetch).mockResolvedValue({
      json: () => {
        return { data: "invalid" };
      },
      ok: true
    } as unknown as Response);

    button?.click();
    await vi.waitFor(() => {
      expect(button?.disabled).toBe(false);
    });
  });

  it("handles non-object response in handleButtonClick", async () => {
    await resetTestState();
    const { init } = await import("./course-completion.client.js");
    document.cookie = `${AUTH_COOKIE_NAME}=valid-token`;
    // eslint-disable-next-line @typescript-eslint/require-await
    vi.mocked(fetch).mockImplementation(async (url) => {
      if (isString(url) && includes(url, "verify")) {
        return {
          json: () => {
            return { email: "e", exp: 2, iat: 1, sub: "user-1", username: "u" };
          },
          ok: true
        } as unknown as Response;
      }
      if (isString(url) && includes(url, TRACKING_URL)) {
        return {
          json: () => {
            return { data: [] };
          },
          ok: true
        } as unknown as Response;
      }
      throw new Error(UNKNOWN_URL);
    });
    document.body.innerHTML = `
      <button class="course-completion-button" data-course-url="url-1" data-course-id="id-1"></button>
    `;

    await init();
    const button = document.querySelector<HTMLButtonElement>(
      COURSE_COMPLETION_BUTTON_CLASS
    );

    vi.mocked(fetch).mockResolvedValue({
      json: constant(null),
      ok: true
    } as unknown as Response);

    button?.click();
    await vi.waitFor(() => {
      expect(button?.disabled).toBe(false);
    });
  });

  it("handles fetch error in handleButtonClick", async () => {
    await resetTestState();
    const { init } = await import("./course-completion.client.js");
    document.cookie = `${AUTH_COOKIE_NAME}=valid-token`;
    // eslint-disable-next-line @typescript-eslint/require-await
    vi.mocked(fetch).mockImplementation(async (url) => {
      if (isString(url) && includes(url, "verify")) {
        return {
          json: () => {
            return { email: "e", exp: 2, iat: 1, sub: "user-1", username: "u" };
          },
          ok: true
        } as unknown as Response;
      }
      if (isString(url) && includes(url, TRACKING_URL)) {
        return {
          json: () => {
            return { data: [] };
          },
          ok: true
        } as unknown as Response;
      }
      throw new Error(UNKNOWN_URL);
    });
    document.body.innerHTML = `
      <button class="course-completion-button" data-course-url="url-1" data-course-id="id-1"></button>
    `;

    await init();
    const button = document.querySelector<HTMLButtonElement>(
      COURSE_COMPLETION_BUTTON_CLASS
    );

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(noop);
    vi.mocked(fetch).mockRejectedValue(new Error("Network Error"));

    button?.click();
    await vi.waitFor(() => {
      expect(button?.disabled).toBe(false);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));

    consoleErrorSpy.mockRestore();
  });
});
