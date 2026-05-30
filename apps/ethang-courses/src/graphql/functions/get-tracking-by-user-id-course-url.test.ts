import { describe, expect, it, vi } from "vitest";

import { getTrackingByUserIdCourseUrl } from "./get-tracking-by-user-id-course-url.ts";

describe("getTrackingByUserIdCourseUrl", () => {
  it("delegates to findFirst and returns the result", async () => {
    const expected = {
      courseUrl: "https://example.com/course",
      id: "tracking-1",
      status: "Complete",
      userId: "user-1"
    };
    const findFirst = vi.fn().mockResolvedValue(expected);
    const database = {
      query: {
        courseTrackingTable: {
          findFirst
        }
      }
    };

    const result = await getTrackingByUserIdCourseUrl(
      // @ts-expect-error minimal database test double for this unit test
      database,
      "user-1",
      "https://example.com/course"
    );

    expect(result).toStrictEqual(expected);
    expect(findFirst).toHaveBeenCalledTimes(1);
  });
});
