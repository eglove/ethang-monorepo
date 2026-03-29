import { describe, expect, it } from "vitest";

import { COURSE_TRACKING_STATUS } from "./utilities/constants.ts";

describe("course Tracking Status", () => {
  it("exports Complete status", () => {
    expect(COURSE_TRACKING_STATUS.COMPLETE).toBe("Complete");
  });

  it("exports Incomplete status", () => {
    expect(COURSE_TRACKING_STATUS.INCOMPLETE).toBe("Incomplete");
  });

  it("exports Revisit status", () => {
    expect(COURSE_TRACKING_STATUS.REVISIT).toBe("Revisit");
  });
});
