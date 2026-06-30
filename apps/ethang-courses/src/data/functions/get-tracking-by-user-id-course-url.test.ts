import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { getTrackingByUserIdCourseUrl } from "./get-tracking-by-user-id-course-url.ts";

const USER_ID = "user-1";
const COURSE_URL = "https://example.com/course";

describe("getTrackingByUserIdCourseUrl", () => {
  it("returns tracking record when found", async () => {
    const mockRecord = {
      courseUrl: COURSE_URL,
      id: "tracking-1",
      status: "INCOMPLETE",
      userId: USER_ID
    };

    const mockDatabase = {
      query: {
        courseTrackingTable: {
          findFirst: vi.fn().mockResolvedValue(mockRecord)
        }
      }
    };

    const result = await Effect.runPromise(
      // @ts-expect-error for test
      getTrackingByUserIdCourseUrl(mockDatabase, USER_ID, COURSE_URL)
    );

    expect(result).toStrictEqual(mockRecord);
  });

  it("returns null when no tracking record exists", async () => {
    const mockDatabase = {
      query: {
        courseTrackingTable: {
          findFirst: vi.fn().mockResolvedValue(null)
        }
      }
    };

    const result = await Effect.runPromise(
      // @ts-expect-error for test
      getTrackingByUserIdCourseUrl(mockDatabase, USER_ID, COURSE_URL)
    );

    expect(result).toBeNull();
  });
});
