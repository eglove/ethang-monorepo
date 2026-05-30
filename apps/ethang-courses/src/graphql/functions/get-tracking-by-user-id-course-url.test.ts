import { describe, expect, it, vi } from "vitest";

import type { Database } from "../types.ts";
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
    } as unknown as Database;

    const result = await getTrackingByUserIdCourseUrl(
      database,
      "user-1",
      "https://example.com/course"
    );

    expect(result).toStrictEqual(expected);
    expect(findFirst).toHaveBeenCalledTimes(1);
  });
});
