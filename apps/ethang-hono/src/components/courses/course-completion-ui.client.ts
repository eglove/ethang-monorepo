import isNil from "lodash/isNil.js";

import type { CourseCompletionStore } from "./course-completion-store.client.js";
import type {
  CourseCompletionState,
  CourseState
} from "./course-completion-types.client.js";
import type { CourseTrackingService } from "./course-tracking-service.client.js";

const BUTTON_SELECTOR = ".course-completion-button";
const STATUS_SELECTOR = ".course-status-text";
const INCOMPLETE = "bg-slate-700";
const REVISIT = "bg-amber-400";
const COMPLETE = "bg-sky-300";

const formatter = new Intl.NumberFormat("en-US", {
  style: "percent"
});

export class CourseCompletionUI {
  private isInitialized = false;

  public constructor(
    private readonly store: CourseCompletionStore,
    private readonly service: CourseTrackingService
  ) {}

  public init() {
    if (this.isInitialized) {
      return;
    }

    this.store.subscribe((state) => {
      this.render(state);
    });

    this.render(this.store.state);
    this.attachEventListeners();
    this.isInitialized = true;
  }

  public reset() {
    this.isInitialized = false;
  }

  private attachEventListeners() {
    for (const button of document.querySelectorAll<HTMLButtonElement>(
      BUTTON_SELECTOR
    )) {
      const { courseId, courseUrl } = button.dataset;

      if (!isNil(courseId) && !isNil(courseUrl)) {
        button.addEventListener("click", () => {
          const { userId } = this.store.state;

          if (!isNil(userId)) {
            this.handleButtonClick(courseUrl, courseId, userId).catch(
              globalThis.console.error
            );
          }
        });
      }
    }
  }

  private async handleButtonClick(
    courseUrl: string,
    courseId: string,
    userId: string
  ) {
    this.store.setLoading(courseUrl, true);

    try {
      const status = await this.service.updateCourseStatus(courseId, userId);
      if (status) {
        this.store.setStatus(courseUrl, status);
      }
    } catch (error) {
      globalThis.console.error(error);
    } finally {
      this.store.setLoading(courseUrl, false);
    }
  }

  private hideAuthenticatedUi() {
    for (const button of document.querySelectorAll<HTMLButtonElement>(
      BUTTON_SELECTOR
    )) {
      button.classList.add("hidden");
    }

    for (const status of document.querySelectorAll<HTMLDivElement>(
      STATUS_SELECTOR
    )) {
      status.classList.add("hidden");
    }

    document.querySelector("#auth-section-header")?.classList.add("hidden");
    document.querySelector("#course-progress-bar")?.classList.add("hidden");
    document.querySelector("#sign-in-prompt")?.classList.remove("hidden");
  }

  private render(state: CourseCompletionState) {
    if (!state.isAuthenticated) {
      this.hideAuthenticatedUi();
      return;
    }

    this.showAuthenticatedUi();

    let complete = 0;
    let incomplete = 0;
    let revisit = 0;
    let total = 0;

    for (const button of document.querySelectorAll<HTMLButtonElement>(
      BUTTON_SELECTOR
    )) {
      const { courseUrl } = button.dataset;

      if (!isNil(courseUrl)) {
        total += 1;
        const courseState = state.courses[courseUrl] ?? {
          isLoading: false,
          status: "Incomplete"
        };

        const statusElement =
          button.parentElement?.querySelector<HTMLDivElement>(STATUS_SELECTOR);

        if (statusElement) {
          statusElement.textContent = courseState.status;
        }

        this.updateButtonState(button, courseState);

        if ("Complete" === courseState.status) {
          complete += 1;
        } else if ("Revisit" === courseState.status) {
          revisit += 1;
        } else {
          incomplete += 1;
        }
      }
    }

    this.updateProgressBars(complete, incomplete, revisit, total);
  }

  private setPercentageContent(
    element: HTMLDivElement | null,
    elementTotal: number,
    total: number
  ) {
    if (element) {
      const decimal = elementTotal / total;
      const wholePercent = decimal * 100;
      element.textContent = formatter.format(decimal);
      element.setAttribute("style", `width: ${wholePercent}%`);

      element.classList.toggle("hidden", 0 === wholePercent);

      element.textContent = 7 > wholePercent ? "" : formatter.format(decimal);
    }
  }

  private showAuthenticatedUi() {
    for (const button of document.querySelectorAll<HTMLButtonElement>(
      BUTTON_SELECTOR
    )) {
      button.classList.remove("hidden");
    }

    for (const status of document.querySelectorAll<HTMLDivElement>(
      STATUS_SELECTOR
    )) {
      status.classList.remove("hidden");
    }

    document.querySelector("#auth-section-header")?.classList.remove("hidden");
    document.querySelector("#course-progress-bar")?.classList.remove("hidden");
    document.querySelector("#sign-in-prompt")?.classList.add("hidden");
  }

  private updateButtonState(
    button: HTMLButtonElement,
    courseState: CourseState
  ) {
    button.disabled = courseState.isLoading;

    if (courseState.isLoading) {
      button.classList.remove("cursor-pointer");
      button.classList.add("animate-spin", "cursor-progress");
    } else {
      button.classList.remove("animate-spin", "cursor-progress");
      button.classList.add("cursor-pointer");
    }

    if ("Complete" === courseState.status) {
      button.classList.add(COMPLETE);
      button.classList.remove(INCOMPLETE, REVISIT);
    } else if ("Revisit" === courseState.status) {
      button.classList.add(REVISIT);
      button.classList.remove(INCOMPLETE, COMPLETE);
    } else {
      button.classList.add(INCOMPLETE);
      button.classList.remove(COMPLETE, REVISIT);
    }
  }

  private updateProgressBars(
    complete: number,
    incomplete: number,
    revisit: number,
    total: number
  ) {
    const completeProgress =
      document.querySelector<HTMLDivElement>("#complete-progress");
    const incompleteProgress = document.querySelector<HTMLDivElement>(
      "#incomplete-progress"
    );
    const revisitProgress =
      document.querySelector<HTMLDivElement>("#revisit-progress");

    this.setPercentageContent(completeProgress, complete, total);
    this.setPercentageContent(incompleteProgress, incomplete, total);
    this.setPercentageContent(revisitProgress, revisit, total);
  }
}
