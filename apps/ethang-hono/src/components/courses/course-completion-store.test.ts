import { describe, expect, it } from "vitest";

import { CourseCompletionStore } from "./course-completion-store.client.js";

describe(CourseCompletionStore, () => {
  it("setStatus covers both branches", () => {
    const store = new CourseCompletionStore();

    // Branch: isNil(draft.courses[courseUrl]) is true
    store.setStatus("url1", "Complete");

    expect(store.state.courses["url1"]?.status).toBe("Complete");

    // Branch: isNil(draft.courses[courseUrl]) is false
    store.setStatus("url1", "Incomplete");

    expect(store.state.courses["url1"]?.status).toBe("Incomplete");
  });

  it("setStatuses covers both branches", () => {
    const store = new CourseCompletionStore();

    // Branch: isNil(course) is true
    store.setStatuses([{ courseUrl: "url1", status: "Complete" }]);

    expect(store.state.courses["url1"]?.status).toBe("Complete");

    // Branch: isNil(course) is false
    store.setStatuses([{ courseUrl: "url1", status: "Revisit" }]);

    expect(store.state.courses["url1"]?.status).toBe("Revisit");
  });

  it("setLoading covers both branches", () => {
    const store = new CourseCompletionStore();

    // Branch: isNil(draft.courses[courseUrl]) is true
    store.setLoading("url1", true);

    expect(store.state.courses["url1"]?.isLoading).toBe(true);

    // Branch: isNil(draft.courses[courseUrl]) is false
    store.setLoading("url1", false);

    expect(store.state.courses["url1"]?.isLoading).toBe(false);
  });
});
