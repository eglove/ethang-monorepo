import { describe, expect, it, vi } from "vitest";

vi.mock(import("../functions/get-tracking-by-user-id-course-url.ts"), () => {
  return {
    getTrackingByUserIdCourseUrl: vi.fn()
  };
});

vi.mock(import("../functions/get-course-url-by-course-id.ts"), () => {
  return {
    getCourseUrlByCourseId: vi.fn()
  };
});

import { getCourseUrlByCourseId } from "../functions/get-course-url-by-course-id.ts";
import { getTrackingByUserIdCourseUrl } from "../functions/get-tracking-by-user-id-course-url.ts";
import { courseTrackingQuery } from "./course-tracking.ts";

const COURSE_URL = "https://example.com/c";

describe("courseTrackingQuery", () => {
  it("looks up courseUrl then fetches tracking for user", async () => {
    vi.mocked(getCourseUrlByCourseId).mockResolvedValue(COURSE_URL);
    const tracking = {
      courseUrl: COURSE_URL,
      id: "tracking-1",
      status: "Complete",
      userId: "user-1"
    };
    vi.mocked(getTrackingByUserIdCourseUrl).mockResolvedValue(tracking);

    const result = await courseTrackingQuery(
      // @ts-expect-error minimal database test double for this unit test
      {},
      {
        courseId: "course-1",
        userId: "user-1"
      }
    );

    expect(getCourseUrlByCourseId).toHaveBeenCalledWith({}, "course-1");
    expect(getTrackingByUserIdCourseUrl).toHaveBeenCalledWith(
      {},
      "user-1",
      COURSE_URL
    );
    expect(result).toStrictEqual(tracking);
  });
});
