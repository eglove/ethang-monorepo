import { describe, expect, it, vi } from "vitest";

vi.mock(import("../functions/get-course-url-by-course-id.ts"), () => {
  return {
    getCourseUrlByCourseId: vi.fn()
  };
});
vi.mock(import("../functions/get-tracking-by-user-id-course-url.ts"), () => {
  return {
    getTrackingByUserIdCourseUrl: vi.fn()
  };
});

import type { Database } from "../types.ts";
import { getCourseUrlByCourseId } from "../functions/get-course-url-by-course-id.ts";
import { getTrackingByUserIdCourseUrl } from "../functions/get-tracking-by-user-id-course-url.ts";
import { courseTrackingQuery } from "./course-tracking.ts";

describe("courseTrackingQuery", () => {
  it("looks up courseUrl then fetches tracking for user", async () => {
    vi.mocked(getCourseUrlByCourseId).mockResolvedValue("https://example.com/c");
    const tracking = {
      courseUrl: "https://example.com/c",
      id: "tracking-1",
      status: "Complete",
      userId: "user-1"
    };
    vi.mocked(getTrackingByUserIdCourseUrl).mockResolvedValue(tracking);

    const resolver = courseTrackingQuery({} as Database);
    const result = await resolver(undefined, {
      courseId: "course-1",
      userId: "user-1"
    });

    expect(getCourseUrlByCourseId).toHaveBeenCalledWith("course-1");
    expect(getTrackingByUserIdCourseUrl).toHaveBeenCalledWith(
      expect.anything(),
      "user-1",
      "https://example.com/c"
    );
    expect(result).toStrictEqual(tracking);
  });
});
