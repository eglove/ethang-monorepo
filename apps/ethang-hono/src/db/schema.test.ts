import { describe, expect, it } from "vitest";

import { generateCourseTrackingId } from "./schema.ts";

const UUID_V7_PATTERN =
  /^[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[\da-f]{4}-[\da-f]{12}$/iu;

describe(generateCourseTrackingId, () => {
  it("generates a valid uuid v7 string", () => {
    expect(generateCourseTrackingId()).toMatch(UUID_V7_PATTERN);
  });

  it("generates a unique id on each call", () => {
    expect(generateCourseTrackingId()).not.toBe(generateCourseTrackingId());
  });
});
