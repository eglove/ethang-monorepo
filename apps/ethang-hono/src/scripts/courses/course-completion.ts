import isNil from "lodash/isNil.js";

type CourseStatus = {
  courseId: string;
  id: string;
  status: string;
  userId: string;
};

type UserToken = {
  email: string;
  exp: number;
  iat: number;
  role?: string;
  sub: string;
  username: string;
};

const init = async () => {
  // eslint-disable-next-line compat/compat
  const token = await cookieStore.get("ethang-auth-token");

  if (isNil(token?.value)) {
    return;
  }

  const verification = await fetch("https://auth.ethang.dev/verify", {
    headers: {
      "X-Token": token.value,
    },
  });

  if (!verification.ok) {
    await cookieStore.delete("ethang-auth-token");
    location.reload();
    return;
  }

  const userData = await verification.json<UserToken>();

  for (const button of document.querySelectorAll<HTMLButtonElement>(
    ".course-completion-button",
  )) {
    button.classList.remove("hidden");

    const { courseId } = button.dataset;

    if (!isNil(courseId)) {
      const statusElement = button.parentElement?.querySelector<HTMLDivElement>(
        ".course-status-text",
      );

      button.addEventListener("click", () => {
        button.disabled = true;
        button.classList.remove("cursor-pointer");
        button.classList.add("animate-spin", "cursor-progress");

        fetch(`/api/course-tracking/${userData.sub}/${courseId}`, {
          body: JSON.stringify({}),
          method: "PUT",
        })
          .then(async (response) => {
            if (response.ok) {
              const data = await response.json<{
                data: CourseStatus;
                status: number;
              }>();
              setUiState(statusElement, button, data.data);
            }
          })
          .finally(() => {
            button.disabled = false;
            button.classList.remove("animate-spin", "cursor-progress");
            button.classList.add("cursor-pointer");
            setPercentages();
          })
          .catch(globalThis.console.error);
      });
    }
  }
};

const setupVideoDialog = () => {
  const dialog = document.querySelector<HTMLDialogElement>("#video-dialog");
  const outer = document.querySelector<HTMLButtonElement>(
    "#video-dialog-outer",
  );
  const inner = document.querySelector<HTMLButtonElement>(
    "#video-dialog-inner",
  );

  outer?.addEventListener("click", () => {
    if (dialog) {
      dialog.showModal();
      dialog.classList.remove("hidden");
      dialog.classList.add("grid");
    }
  });

  inner?.addEventListener("click", () => {
    if (dialog) {
      dialog.close();
      dialog.classList.remove("grid");
      dialog.classList.add("hidden");
    }
  });
};

if ("loading" === document.readyState) {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises,@typescript-eslint/strict-void-return
  document.addEventListener("DOMContentLoaded", init);
} else {
  await init();
  setupVideoDialog();
}

const setUiState = (
  statusElement: HTMLDivElement | null | undefined,
  button: HTMLButtonElement,
  courseStatus: CourseStatus | undefined,
) => {
  if (statusElement) {
    statusElement.textContent = courseStatus?.status ?? "Incomplete";
  }

  if ("Complete" === courseStatus?.status) {
    button.classList.add("bg-brand");
    // eslint-disable-next-line sonar/no-duplicate-string
    button.classList.remove("bg-neutral-secondary-medium", "bg-warning");
  } else if ("Revisit" === courseStatus?.status) {
    button.classList.add("bg-warning");
    button.classList.remove("bg-neutral-secondary-medium", "bg-brand");
  } else {
    button.classList.add("bg-neutral-secondary-medium");
    button.classList.remove("bg-brand", "bg-warning");
  }
};

const setPercentages = () => {
  const statusTexts = document.querySelectorAll<HTMLDivElement>(
    ".course-status-text",
  );

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
