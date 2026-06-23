import { describe, expect, it } from "vitest";

import { courseStore } from "./course-store.ts";

describe("CourseStore", () => {
  it("should increment courseIndex and add id to coursesIndexes", () => {
    courseStore.addCourseOrder("course-1");
    expect(courseStore.state.courseIndex).toBe(1);
    expect(courseStore.state.coursesIndexes.get("course-1")).toBe(1);

    courseStore.addCourseOrder("course-2");
    expect(courseStore.state.courseIndex).toBe(2);
    expect(courseStore.state.coursesIndexes.get("course-2")).toBe(2);
  });
});
