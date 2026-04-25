// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

import { CourseCompletionStore } from "./course-completion-store.client.js";
import { CourseCompletionUI } from "./course-completion-ui.client.js";
import { CourseTrackingService } from "./course-tracking-service.client.js";

describe(CourseCompletionUI, () => {
  it("init returns early if already initialized", () => {
    const store = new CourseCompletionStore();
    const service = new CourseTrackingService();
    const ui = new CourseCompletionUI(store, service);

    const subscribeSpy = vi.spyOn(store, "subscribe");

    ui.init();

    expect(subscribeSpy).toHaveBeenCalledTimes(1);

    ui.init();

    expect(subscribeSpy).toHaveBeenCalledTimes(1);
  });

  it("handleButtonClick does nothing if userId is null", () => {
    const store = new CourseCompletionStore();
    const service = new CourseTrackingService();
    const ui = new CourseCompletionUI(store, service);

    document.body.innerHTML = `
      <button class="course-completion-button" data-course-url="url1" data-course-id="id1"></button>
    `;

    const updateSpy = vi.spyOn(service, "updateCourseStatus");

    ui.init();
    const button = document.querySelector<HTMLButtonElement>(
      ".course-completion-button",
    );

    button?.click();

    expect(updateSpy).not.toHaveBeenCalled();
  });
});
