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
import { COURSE_TRACKING_STATUS } from "../constants/course-tracking-status.ts";
import { getCourseUrlByCourseId } from "../functions/get-course-url-by-course-id.ts";
import { getTrackingByUserIdCourseUrl } from "../functions/get-tracking-by-user-id-course-url.ts";
import { cycleCourseTrackingStatusMutation } from "./cycle-course-tracking-status.ts";

describe("cycleCourseTrackingStatusMutation", () => {
  it("creates a tracking when one does not exist", async () => {
    vi.mocked(getCourseUrlByCourseId).mockResolvedValue("https://example.com/c");
    vi.mocked(getTrackingByUserIdCourseUrl)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({
        courseUrl: "https://example.com/c",
        id: "tracking-1",
        status: COURSE_TRACKING_STATUS.COMPLETE,
        userId: "user-1"
      });

    const values = vi.fn().mockResolvedValue(undefined);
    const database = {
      insert: vi.fn(() => {
        return { values };
      })
    } as unknown as Database;

    const resolver = cycleCourseTrackingStatusMutation(database);
    const result = await resolver(undefined, {
      courseId: "course-1",
      userId: "user-1"
    });

    expect(values).toHaveBeenCalledWith({
      courseUrl: "https://example.com/c",
      status: COURSE_TRACKING_STATUS.COMPLETE,
      userId: "user-1"
    });
    expect(result).toStrictEqual({
      courseUrl: "https://example.com/c",
      id: "tracking-1",
      status: COURSE_TRACKING_STATUS.COMPLETE,
      userId: "user-1"
    });
  });

  it("cycles existing status and updates row", async () => {
    vi.mocked(getCourseUrlByCourseId).mockResolvedValue("https://example.com/c");
    vi.mocked(getTrackingByUserIdCourseUrl)
      .mockResolvedValueOnce({
        courseUrl: "https://example.com/c",
        id: "tracking-1",
        status: COURSE_TRACKING_STATUS.COMPLETE,
        userId: "user-1"
      })
      .mockResolvedValueOnce({
        courseUrl: "https://example.com/c",
        id: "tracking-1",
        status: COURSE_TRACKING_STATUS.REVISIT,
        userId: "user-1"
      });

    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn(() => {
      return { where };
    });
    const database = {
      update: vi.fn(() => {
        return { set };
      })
    } as unknown as Database;

    const resolver = cycleCourseTrackingStatusMutation(database);
    const result = await resolver(undefined, {
      courseId: "course-1",
      userId: "user-1"
    });

    expect(set).toHaveBeenCalledWith({ status: COURSE_TRACKING_STATUS.REVISIT });
    expect(where).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual({
      courseUrl: "https://example.com/c",
      id: "tracking-1",
      status: COURSE_TRACKING_STATUS.REVISIT,
      userId: "user-1"
    });
  });

  it("bubbles lookup errors from course fetch", async () => {
    vi.mocked(getCourseUrlByCourseId).mockRejectedValue(new Error("Course not found"));

    const resolver = cycleCourseTrackingStatusMutation({} as Database);

    await expect(
      resolver(undefined, { courseId: "missing", userId: "user-1" })
    ).rejects.toThrow("Course not found");
  });
});
