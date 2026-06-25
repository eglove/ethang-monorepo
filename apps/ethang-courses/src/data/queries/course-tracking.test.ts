import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { courseTrackingQuery } from "./course-tracking.ts";

const COURSE_URL = "https://example.com/course";
const COURSE_ID = "course-1";
const USER_ID = "user-1";

describe("courseTrackingQuery", () => {
  it("returns tracking record when course exists and tracking exists", async () => {
    const mockRecord = {
      courseUrl: COURSE_URL,
      id: "tracking-1",
      status: "INCOMPLETE",
      userId: USER_ID
    };

    const mockSelectResult = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ url: COURSE_URL }]),
      where: vi.fn().mockReturnThis()
    };

    const mockDatabase = {
      query: {
        courseTrackingTable: {
          findFirst: vi.fn().mockResolvedValue(mockRecord)
        }
      },
      select: vi.fn().mockReturnValue(mockSelectResult)
    };

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      courseTrackingQuery(mockDatabase, {
        courseId: COURSE_ID,
        userId: USER_ID
      })
    );

    expect(result).toStrictEqual(mockRecord);
  });

  it("returns null when no tracking record exists", async () => {
    const mockSelectResult = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ url: COURSE_URL }]),
      where: vi.fn().mockReturnThis()
    };

    const mockDatabase = {
      query: {
        courseTrackingTable: {
          findFirst: vi.fn().mockResolvedValue(null)
        }
      },
      select: vi.fn().mockReturnValue(mockSelectResult)
    };

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      courseTrackingQuery(mockDatabase, {
        courseId: COURSE_ID,
        userId: USER_ID
      })
    );

    expect(result).toBeNull();
  });
});
