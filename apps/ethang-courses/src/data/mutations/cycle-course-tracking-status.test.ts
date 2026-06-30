import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "../types.ts";

import { NotFoundError } from "../../errors/not-found-error.ts";
import { carryCourseTrackingCommand } from "../../infrastructure/course-tracking/aggregate.ts";
import { getCourseUrlByCourseId } from "../functions/get-course-url-by-course-id.ts";
import { cycleCourseTrackingStatusMutation } from "./cycle-course-tracking-status.ts";

vi.mock(import("../functions/get-course-url-by-course-id.ts"), () => {
  return {
    getCourseUrlByCourseId: vi.fn()
  };
});
vi.mock(import("../../infrastructure/course-tracking/aggregate.ts"), () => {
  return {
    carryCourseTrackingCommand: vi.fn()
  };
});

const COURSE_URL = "https://example.com/c";
const TRACKING_ID = "tracking-1";
const USER_ID = "user-1";

describe("cycleCourseTrackingStatusMutation", () => {
  it("delegates to carryCourseTrackingCommand for a new tracking", async () => {
    vi.mocked(getCourseUrlByCourseId).mockReturnValue(
      Effect.succeed(COURSE_URL)
    );
    vi.mocked(carryCourseTrackingCommand).mockReturnValue(
      Effect.succeed({
        courseUrl: COURSE_URL,
        id: TRACKING_ID,
        status: "COMPLETE",
        userId: USER_ID
      })
    );

    const result = await cycleCourseTrackingStatusMutation(
      {} as unknown as Database,
      {
        courseId: "course-1",
        userId: USER_ID
      }
    );

    expect(carryCourseTrackingCommand).toHaveBeenCalledWith(
      {
        courseUrl: COURSE_URL,
        kind: "CycleStatus",
        userId: USER_ID
      },
      expect.anything()
    );
    expect(result).toStrictEqual({
      courseUrl: COURSE_URL,
      id: TRACKING_ID,
      status: "COMPLETE",
      userId: USER_ID
    });
  });

  it("delegates to carryCourseTrackingCommand for an existing tracking", async () => {
    vi.mocked(getCourseUrlByCourseId).mockReturnValue(
      Effect.succeed(COURSE_URL)
    );
    vi.mocked(carryCourseTrackingCommand).mockReturnValue(
      Effect.succeed({
        courseUrl: COURSE_URL,
        id: TRACKING_ID,
        status: "REVISIT",
        userId: USER_ID
      })
    );

    const result = await cycleCourseTrackingStatusMutation(
      {} as unknown as Database,
      {
        courseId: "course-1",
        userId: USER_ID
      }
    );

    expect(result).toStrictEqual({
      courseUrl: COURSE_URL,
      id: TRACKING_ID,
      status: "REVISIT",
      userId: USER_ID
    });
  });

  it("bubbles lookup errors from course fetch", async () => {
    vi.mocked(getCourseUrlByCourseId).mockReturnValue(
      Effect.fail(new NotFoundError("Course not found"))
    );

    await expect(
      cycleCourseTrackingStatusMutation({} as unknown as Database, {
        courseId: "missing",
        userId: USER_ID
      })
    ).rejects.toThrow("Course not found");
  });
});
