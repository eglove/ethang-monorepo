import { describe, expect, it } from "vitest";

import { COURSE_TRACKING_STATUS } from "../constants/course-tracking-status.ts";
import { getNextStatus } from "./get-next-status.ts";

describe("getNextStatus", () => {
  it("cycles Complete to Revisit", () => {
    expect(getNextStatus(COURSE_TRACKING_STATUS.COMPLETE)).toBe(
      COURSE_TRACKING_STATUS.REVISIT
    );
  });

  it("cycles Revisit to Incomplete", () => {
    expect(getNextStatus(COURSE_TRACKING_STATUS.REVISIT)).toBe(
      COURSE_TRACKING_STATUS.INCOMPLETE
    );
  });

  it("cycles unknown statuses to Complete", () => {
    expect(getNextStatus(COURSE_TRACKING_STATUS.INCOMPLETE)).toBe(
      COURSE_TRACKING_STATUS.COMPLETE
    );
  });
});
