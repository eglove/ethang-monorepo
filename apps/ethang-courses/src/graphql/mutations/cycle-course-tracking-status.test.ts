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

import { courseTracking as COURSE_TRACKING_STATUS } from "@ethang/intl/en/course-tracking.ts";

import { getCourseUrlByCourseId } from "../functions/get-course-url-by-course-id.ts";
import { getTrackingByUserIdCourseUrl } from "../functions/get-tracking-by-user-id-course-url.ts";
import { cycleCourseTrackingStatusMutation } from "./cycle-course-tracking-status.ts";

const COURSE_URL = "https://example.com/c";
const TRACKING_ID = "tracking-1";
const USER_ID = "user-1";

describe("cycleCourseTrackingStatusMutation", () => {
  it("creates a tracking when one does not exist", async () => {
    vi.mocked(getCourseUrlByCourseId).mockResolvedValue(COURSE_URL);
    vi.mocked(getTrackingByUserIdCourseUrl)
      .mockImplementationOnce(async () => {
        // eslint-disable-next-line unicorn/no-useless-promise-resolve-reject
        return Promise.resolve(undefined);
      })
      .mockResolvedValueOnce({
        courseUrl: COURSE_URL,
        id: TRACKING_ID,
        status: COURSE_TRACKING_STATUS.COMPLETE,
        userId: USER_ID
      });

    // eslint-disable-next-line sonar/no-undefined-argument
    const values = vi.fn(undefined);
    const database = {
      insert: vi.fn(() => {
        return { values };
      })
    };

    // @ts-expect-error minimal database test double for this unit test
    const resolver = cycleCourseTrackingStatusMutation(database);
    const result = await resolver(undefined, {
      courseId: "course-1",
      userId: USER_ID
    });

    expect(values).toHaveBeenCalledWith({
      courseUrl: COURSE_URL,
      status: COURSE_TRACKING_STATUS.COMPLETE,
      userId: USER_ID
    });
    expect(result).toStrictEqual({
      courseUrl: COURSE_URL,
      id: TRACKING_ID,
      status: COURSE_TRACKING_STATUS.COMPLETE,
      userId: USER_ID
    });
  });

  it("cycles existing status and updates row", async () => {
    vi.mocked(getCourseUrlByCourseId).mockResolvedValue(COURSE_URL);
    vi.mocked(getTrackingByUserIdCourseUrl)
      .mockResolvedValueOnce({
        courseUrl: COURSE_URL,
        id: TRACKING_ID,
        status: COURSE_TRACKING_STATUS.COMPLETE,
        userId: USER_ID
      })
      .mockResolvedValueOnce({
        courseUrl: COURSE_URL,
        id: TRACKING_ID,
        status: COURSE_TRACKING_STATUS.REVISIT,
        userId: USER_ID
      });

    // eslint-disable-next-line sonar/no-undefined-argument
    const where = vi.fn(undefined);
    const set = vi.fn(() => {
      return { where };
    });
    const database = {
      update: vi.fn(() => {
        return { set };
      })
    };

    // @ts-expect-error minimal database test double for this unit test
    const resolver = cycleCourseTrackingStatusMutation(database);
    const result = await resolver(undefined, {
      courseId: "course-1",
      userId: USER_ID
    });

    expect(set).toHaveBeenCalledWith({
      status: COURSE_TRACKING_STATUS.REVISIT
    });
    expect(where).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual({
      courseUrl: COURSE_URL,
      id: TRACKING_ID,
      status: COURSE_TRACKING_STATUS.REVISIT,
      userId: USER_ID
    });
  });

  it("bubbles lookup errors from course fetch", async () => {
    vi.mocked(getCourseUrlByCourseId).mockRejectedValue(
      new Error("Course not found")
    );

    // @ts-expect-error minimal database test double for this unit test
    const resolver = cycleCourseTrackingStatusMutation({});

    await expect(
      resolver(undefined, { courseId: "missing", userId: USER_ID })
    ).rejects.toThrow("Course not found");
  });
});
