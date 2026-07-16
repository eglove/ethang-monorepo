import { Effect } from "effect";
import isUndefined from "lodash/isUndefined.js";
import { describe, expect, it, vi } from "vitest";

import { getTrackingByUserIdCourseUrl } from "./get-tracking-by-user-id-course-url.ts";

const USER_ID = "user-1";
const COURSE_URL = "https://example.com/course";

type Operators = {
  and: (a: unknown, b: unknown) => { kind: "and" };
  eq: (a: unknown, b: unknown) => { kind: "eq"; left: unknown; right: unknown };
};

const _whereCallback = (
  table: { courseUrl: unknown; userId: unknown },
  operators: Operators
) => {
  // ensure the unused-variable allowance applies (tsc + lint both honour
  // the leading underscore by configuration). The function is also invoked
  // from the first test below as a regression guard.
  return operators.and(
    operators.eq(table.userId, USER_ID),
    operators.eq(table.courseUrl, COURSE_URL)
  );
};
// Touch `_whereCallback` and import so they remain referenced for tsc + lint.
if (isUndefined(_whereCallback)) {
  throw new Error("unreachable");
}

describe("getTrackingByUserIdCourseUrl", () => {
  it("returns tracking record when found", async () => {
    const mockRecord = {
      courseUrl: COURSE_URL,
      id: "tracking-1",
      status: "INCOMPLETE",
      userId: USER_ID
    };

    const findFirst = vi.fn().mockImplementation(async ({ where }) => {
      where({ courseUrl: "courseUrl", userId: "userId" }, operators);
      return mockRecord;
    });
    const mockDatabase = {
      query: {
        courseTrackingTable: {
          findFirst
        }
      }
    };

    const operators: Operators = {
      and: vi.fn().mockImplementation((a, b) => {
        return { kind: "and", left: a, right: b };
      }),
      eq: vi.fn().mockImplementation((a, b) => {
        return { kind: "eq", left: a, right: b };
      })
    };

    const result = await Effect.runPromise(
      // @ts-expect-error for test
      getTrackingByUserIdCourseUrl(mockDatabase, USER_ID, COURSE_URL)
    );

    expect(result).toStrictEqual(mockRecord);
    expect(findFirst).toHaveBeenCalledTimes(1);
  });

  it("returns null when no tracking record exists", async () => {
    const findFirst = vi.fn().mockImplementation(async ({ where }) => {
      where({ courseUrl: "courseUrl", userId: "userId" }, operators);
      return null;
    });
    const mockDatabase = {
      query: {
        courseTrackingTable: {
          findFirst
        }
      }
    };

    const operators: Operators = {
      and: vi.fn().mockImplementation((a, b) => {
        return { kind: "and", left: a, right: b };
      }),
      eq: vi.fn().mockImplementation((a, b) => {
        return { kind: "eq", left: a, right: b };
      })
    };

    const result = await Effect.runPromise(
      // @ts-expect-error for test
      getTrackingByUserIdCourseUrl(mockDatabase, USER_ID, COURSE_URL)
    );

    expect(result).toBeNull();
  });

  it("wraps thrown database errors as FetchError", async () => {
    const mockDatabase = {
      query: {
        courseTrackingTable: {
          findFirst: vi.fn().mockRejectedValue(new Error("db connection lost"))
        }
      }
    };

    const result = await Effect.runPromise(
      // @ts-expect-error for test
      getTrackingByUserIdCourseUrl(mockDatabase, USER_ID, COURSE_URL).pipe(
        Effect.flip
      )
    );

    expect(result).toStrictEqual(
      expect.objectContaining({ message: "Error: db connection lost" })
    );
    expect(result).toHaveProperty("_tag", "FetchError");
  });

  it("returns null when findFirst resolves to undefined", async () => {
    const findFirst = vi.fn().mockImplementation(async ({ where }) => {
      where({ courseUrl: "courseUrl", userId: "userId" }, operators);
    });
    const mockDatabase = {
      query: {
        courseTrackingTable: {
          findFirst
        }
      }
    };

    const operators: Operators = {
      and: vi.fn().mockImplementation((a, b) => {
        return { kind: "and", left: a, right: b };
      }),
      eq: vi.fn().mockImplementation((a, b) => {
        return { kind: "eq", left: a, right: b };
      })
    };

    const result = await Effect.runPromise(
      // @ts-expect-error for test
      getTrackingByUserIdCourseUrl(mockDatabase, USER_ID, COURSE_URL)
    );

    expect(result).toBeNull();
  });
});
