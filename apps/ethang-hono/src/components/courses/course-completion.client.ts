import find from "lodash/find.js";
import isArray from "lodash/isArray.js";
import isNil from "lodash/isNil.js";
import isObject from "lodash/isObject.js";
import split from "lodash/split.js";
import startsWith from "lodash/startsWith.js";
import { z } from "zod";

const AUTH_COOKIE_NAME = "ethang-auth-token";

// CookieStore API is not supported in WebKit (Safari). Fall back to parsing
// document.cookie directly when the API is unavailable.
const getCookieValue = async (name: string): Promise<string | undefined> => {
  if ("cookieStore" in globalThis) {
    const entry = await cookieStore.get(name);
    return entry?.value;
  }

  const match = find(split(document.cookie, "; "), (row) =>
    startsWith(row, `${name}=`),
  );

  return isNil(match) ? undefined : split(match, "=")[1];
};

const deleteCookie = async (name: string): Promise<void> => {
  if ("cookieStore" in globalThis) {
    await cookieStore.delete(name);
    return;
  }

  document.cookie = `${name}=; Max-Age=0; path=/`;
};

const courseStatusSchema = z.object({
  courseUrl: z.string(),
  id: z.string(),
  status: z.string(),
  userId: z.string(),
});

type CourseStatus = z.infer<typeof courseStatusSchema>;

const userTokenSchema = z.object({
  email: z.string(),
  exp: z.number(),
  iat: z.number(),
  role: z.string().optional(),
  sub: z.string(),
  username: z.string(),
});

const BUTTON_SELECTOR = ".course-completion-button";
const STATUS_SELECTOR = ".course-status-text";
const INCOMPLETE = "bg-slate-700";
const REVISIT = "bg-amber-400";
const COMPLETE = "bg-sky-300";

// All helpers that are called during the top-level await (init → applyStoredStatuses)
// must be declared before the if/else block at the bottom of this module. ES modules
// suspend at top-level awaits, so any var/const assignments below that point are
// not yet executed when those functions are first called.

const setUiState = (
  statusElement: HTMLDivElement | null | undefined,
  button: HTMLButtonElement,
  courseStatus: CourseStatus | undefined,
) => {
  if (statusElement) {
    statusElement.textContent = courseStatus?.status ?? "Incomplete";
  }

  if ("Complete" === courseStatus?.status) {
    button.classList.add(COMPLETE);
    button.classList.remove(INCOMPLETE, REVISIT);
  } else if ("Revisit" === courseStatus?.status) {
    button.classList.add(REVISIT);
    button.classList.remove(INCOMPLETE, COMPLETE);
  } else {
    button.classList.add(INCOMPLETE);
    button.classList.remove(COMPLETE, REVISIT);
  }
};

const formatter = new Intl.NumberFormat("en-US", {
  style: "percent",
});

const setPercentageContent = (
  element: HTMLDivElement | null,
  elementTotal: number,
  total: number,
) => {
  if (element) {
    const decimal = elementTotal / total;
    const wholePercent = decimal * 100;
    element.textContent = formatter.format(decimal);
    element.setAttribute("style", `width: ${wholePercent}%`);

    element.classList.toggle("hidden", 0 === wholePercent);

    element.textContent = 7 > wholePercent ? "" : formatter.format(decimal);
  }
};

const setPercentages = () => {
  const statusTexts =
    document.querySelectorAll<HTMLDivElement>(STATUS_SELECTOR);

  let complete = 0;
  let incomplete = 0;
  let revisit = 0;
  let total = 0;

  for (const statusText of statusTexts) {
    total += 1;

    switch (statusText.textContent) {
      case "Complete": {
        complete += 1;

        break;
      }
      case "Incomplete": {
        incomplete += 1;

        break;
      }
      case "Revisit": {
        revisit += 1;

        break;
      }
      // No default
    }
  }

  const completeProgress =
    document.querySelector<HTMLDivElement>("#complete-progress");
  const incompleteProgress = document.querySelector<HTMLDivElement>(
    "#incomplete-progress",
  );
  const revisitProgress =
    document.querySelector<HTMLDivElement>("#revisit-progress");

  setPercentageContent(completeProgress, complete, total);
  setPercentageContent(incompleteProgress, incomplete, total);
  setPercentageContent(revisitProgress, revisit, total);
};

const hideAuthenticatedUi = () => {
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    BUTTON_SELECTOR,
  )) {
    button.classList.add("hidden");
  }

  for (const status of document.querySelectorAll<HTMLDivElement>(
    STATUS_SELECTOR,
  )) {
    status.classList.add("hidden");
  }

  document.querySelector("#auth-section-header")?.classList.add("hidden");
  document.querySelector("#course-progress-bar")?.classList.add("hidden");
  document.querySelector("#sign-in-prompt")?.classList.remove("hidden");
};

const showAuthenticatedUi = () => {
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    BUTTON_SELECTOR,
  )) {
    button.classList.remove("hidden");
  }

  for (const status of document.querySelectorAll<HTMLDivElement>(
    STATUS_SELECTOR,
  )) {
    status.classList.remove("hidden");
  }

  document.querySelector("#auth-section-header")?.classList.remove("hidden");
  document.querySelector("#course-progress-bar")?.classList.remove("hidden");
  document.querySelector("#sign-in-prompt")?.classList.add("hidden");
};

const applyStoredStatuses = async (userId: string) => {
  const response = await fetch(
    `/api/course-tracking?userId=${encodeURIComponent(userId)}`,
  );

  if (!response.ok) return;

  const json = await response.json();

  let trackingsData: unknown = [];
  if (isObject(json) && "data" in json && isArray(json.data)) {
    trackingsData = json.data;
  }

  const trackingsResult = z.array(courseStatusSchema).safeParse(trackingsData);

  if (!trackingsResult.success) return;

  const trackings = trackingsResult.data;

  for (const button of document.querySelectorAll<HTMLButtonElement>(
    BUTTON_SELECTOR,
  )) {
    const { courseUrl } = button.dataset;
    const tracking = find(trackings, ["courseUrl", courseUrl]);

    const statusElement =
      button.parentElement?.querySelector<HTMLDivElement>(STATUS_SELECTOR);

    setUiState(statusElement, button, tracking);
  }

  setPercentages();
};

const handleButtonClick = (
  button: HTMLButtonElement,
  courseId: string,
  userId: string,
  statusElement: HTMLDivElement | null | undefined,
) => {
  button.disabled = true;
  button.classList.remove("cursor-pointer");
  button.classList.add("animate-spin", "cursor-progress");

  fetch(
    `/api/course-tracking/${encodeURIComponent(courseId)}?userId=${encodeURIComponent(userId)}`,
    {
      body: JSON.stringify({}),
      method: "PUT",
    },
  )
    .then(async (response) => {
      if (!response.ok) {
        return;
      }

      const data = await response.json();

      let courseStatusData: unknown;
      if (isObject(data) && "data" in data) {
        courseStatusData = data.data;
      }

      const courseStatusResult = courseStatusSchema.safeParse(courseStatusData);

      if (courseStatusResult.success) {
        setUiState(statusElement, button, courseStatusResult.data);
      }
    })
    .finally(() => {
      button.disabled = false;
      button.classList.remove("animate-spin", "cursor-progress");
      button.classList.add("cursor-pointer");
      setPercentages();
    })
    .catch(globalThis.console.error);
};

const init = async () => {
  const tokenValue = await getCookieValue(AUTH_COOKIE_NAME);

  if (isNil(tokenValue)) {
    // No auth token — the SW may have served a cached authenticated page.
    // Actively reset auth-dependent UI to the logged-out state.
    hideAuthenticatedUi();
    return;
  }

  const verification = await fetch("https://auth.ethang.dev/verify", {
    headers: {
      "X-Token": tokenValue,
    },
  });

  if (!verification.ok) {
    await deleteCookie(AUTH_COOKIE_NAME);
    location.reload();
    return;
  }

  const json = await verification.json();
  const userDataResult = userTokenSchema.safeParse(json);

  if (!userDataResult.success) {
    return;
  }

  const userData = userDataResult.data;

  // Authenticated — ensure auth-dependent UI is visible (the SW may have
  // served a cached unauthenticated page) and populate button states from
  // the server before attaching click handlers.
  showAuthenticatedUi();
  await applyStoredStatuses(userData.sub);

  for (const button of document.querySelectorAll<HTMLButtonElement>(
    BUTTON_SELECTOR,
  )) {
    const { courseId } = button.dataset;

    if (!isNil(courseId)) {
      const statusElement =
        button.parentElement?.querySelector<HTMLDivElement>(STATUS_SELECTOR);

      button.addEventListener("click", () => {
        handleButtonClick(button, courseId, userData.sub, statusElement);
      });
    }
  }
};

if ("loading" === document.readyState) {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises,@typescript-eslint/strict-void-return
  document.addEventListener("DOMContentLoaded", init);
} else {
  await init();
}
