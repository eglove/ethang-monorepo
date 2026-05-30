import { describe, expect, it } from "vitest";

import { COURSE_TRACKING_STATUS } from "./course-tracking-status.ts";

describe("COURSE_TRACKING_STATUS", () => {
  it("exposes expected status values", () => {
    expect(COURSE_TRACKING_STATUS).toStrictEqual({
      COMPLETE: "Complete",
      INCOMPLETE: "Incomplete",
      REVISIT: "Revisit"
    });
  });
});
