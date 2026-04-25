// @vitest-environment jsdom
import includes from "lodash/includes.js";
import isString from "lodash/isString.js";
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
      ok: true,
    }),
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

import type { CourseState } from "./course-completion-types.client.js";

describe("course-completion.client setPercentages tests", () => {
  it("handles all status types and small percentages", async () => {
    await resetTestState();
    const { init, store } = await import("./course-completion.client.js");

    document.cookie = `${AUTH_COOKIE_NAME}=valid-token`;
    // eslint-disable-next-line @typescript-eslint/require-await
    vi.mocked(fetch).mockImplementation(async (url) => {
      if (isString(url) && includes(url, "verify")) {
        return {
          json: () => {
            return { email: "e", exp: 2, iat: 1, sub: "123", username: "u" };
          },
          ok: true,
        } as unknown as Response;
      }
      return {
        json: () => {
          return { data: [] };
        },
        ok: true,
      } as unknown as Response;
    });

    document.body.innerHTML = `
      <div id="complete-progress"></div>
      <div id="incomplete-progress"></div>
      <div id="revisit-progress"></div>
      <div>
        <button class="course-completion-button" data-course-url="url-1"></button>
        <div class="course-status-text">Complete</div>
      </div>
      <div>
        <button class="course-completion-button" data-course-url="url-2"></button>
        <div class="course-status-text">Incomplete</div>
      </div>
      <div>
        <button class="course-completion-button" data-course-url="url-3"></button>
        <div class="course-status-text">Revisit</div>
      </div>
      <div>
        <button class="course-completion-button" data-course-url="url-4"></button>
        <div class="course-status-text">Unknown</div>
      </div>
      ${Array.from({ length: 96 }, (_, index) => `<div><button class="course-completion-button" data-course-url="url-${index + 5}"></button><div class="course-status-text">Complete</div></div>`).join("")}
    `;

    // Set initial store state so we don't default to "Incomplete"
    const courses: Record<string, CourseState> = {
      "url-1": { isLoading: false, status: "Complete" },
      "url-2": { isLoading: false, status: "Incomplete" },
      "url-3": { isLoading: false, status: "Revisit" },
    };
    for (let index = 0; 97 > index; index += 1) {
      courses[`url-${index + 4}`] = { isLoading: false, status: "Complete" };
    }

    // @ts-expect-error for test
    store.update((draft) => {
      draft.courses = courses;
      draft.isAuthenticated = true;
    });

    await init();

    const incompleteProgress = document.querySelector("#incomplete-progress");

    expect(incompleteProgress?.textContent).toBe("");
  });

  it("hides progress bar if percentage is 0", async () => {
    await resetTestState();
    const { init } = await import("./course-completion.client.js");

    document.cookie = `${AUTH_COOKIE_NAME}=valid-token`;
    // eslint-disable-next-line @typescript-eslint/require-await
    vi.mocked(fetch).mockImplementation(async (url) => {
      if (isString(url) && includes(url, "verify")) {
        return {
          json: () => {
            return { email: "e", exp: 2, iat: 1, sub: "123", username: "u" };
          },
          ok: true,
        } as unknown as Response;
      }
      return {
        json: () => {
          return { data: [] };
        },
        ok: true,
      } as unknown as Response;
    });

    document.body.innerHTML = `
      <div id="complete-progress"></div>
      <div id="incomplete-progress"></div>
      <div id="revisit-progress"></div>
      <div>
        <button class="course-completion-button" data-course-url="url-1" data-course-id="id-1"></button>
        <div class="course-status-text">Incomplete</div>
      </div>
    `;

    await init();

    const completeProgress = document.querySelector("#complete-progress");

    expect(completeProgress?.classList.contains("hidden")).toBe(true);
  });
});
