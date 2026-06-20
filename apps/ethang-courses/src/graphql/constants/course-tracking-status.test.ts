import { courseTracking as COURSE_TRACKING_STATUS } from "@ethang/intl/en/course-tracking.ts";
import { describe, expect, it } from "vitest";

describe("COURSE_TRACKING_STATUS", () => {
  it("exposes expected status values", () => {
    expect(COURSE_TRACKING_STATUS).toStrictEqual({
      COMPLETE: "Complete",
      INCOMPLETE: "Incomplete",
      REVISIT: "Revisit"
    });
  });
});
