/* eslint-disable unicorn/no-abusive-eslint-disable */
/* eslint-disable */
const getCourseStatusKey = (courseId: string) => {
  return `course-status-${courseId}`;
}

const STATUSES = ["Complete", "Revisit", "Incomplete"] as const;

type Status = (typeof STATUSES)[number];

const getStatus = (courseId: string): Status => {
  const status = localStorage.getItem(
    getCourseStatusKey(courseId),
  ) as unknown as null | Status;

  if (status && (STATUSES as readonly string[]).includes(status)) {
    return status;
  }
  return "Incomplete";
};

const setStatus = (courseId: string, status: Status) => {
  localStorage.setItem(getCourseStatusKey(courseId), status);
};

const getNextStatus = (currentStatus: Status): Status => {
  const currentIndex = STATUSES.indexOf(currentStatus);
  const nextIndex = (currentIndex + 1) % STATUSES.length;
  // @ts-expect-error assume correct index
  return STATUSES[nextIndex];
};

const updateUI = (button: HTMLButtonElement, status: Status) => {
  const { courseId } = button.dataset;

  if (!courseId) {
    return;
  }

  const statusText = button.parentElement?.querySelector(".course-status-text");
  if (statusText) {
    statusText.textContent = status;
  }

  button.dataset["status"] = status;

  if ("Complete" === status) {
    button.classList.add("bg-brand");
    button.classList.remove("bg-neutral-secondary-medium", "bg-warning");
  } else if ("Revisit" === status) {
    button.classList.add("bg-warning");
    button.classList.remove("bg-neutral-secondary-medium", "bg-brand");
  } else {
    button.classList.add("bg-neutral-secondary-medium");
    button.classList.remove("bg-brand", "bg-warning");
  }
};

const init = () => {
  const buttons = document.querySelectorAll<HTMLButtonElement>(
    ".course-completion-button",
  );

  for (const button of buttons) {
    const { courseId } = button.dataset;
    if (!courseId) continue;

    const currentStatus = getStatus(courseId);
    updateUI(button, currentStatus);

    button.addEventListener("click", () => {
      const current = button.dataset["status"] as Status;
      const next = getNextStatus(current);
      setStatus(courseId, next);
      updateUI(button, next);
    });
  }
};

if ("loading" === document.readyState) {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
