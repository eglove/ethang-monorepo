import { describe, expect, it, vi } from "vitest";

vi.mock(import("./mutations/cycle-course-tracking-status.ts"), () => {
  return {
    cycleCourseTrackingStatusMutation: vi.fn()
  };
});
vi.mock(import("./queries/course-tracking.ts"), () => {
  return {
    courseTrackingQuery: vi.fn()
  };
});
vi.mock(import("./queries/course-trackings.ts"), () => {
  return {
    courseTrackingsQuery: vi.fn()
  };
});

import type { Database } from "./types.ts";
import { cycleCourseTrackingStatusMutation } from "./mutations/cycle-course-tracking-status.ts";
import { courseTrackingQuery } from "./queries/course-tracking.ts";
import { courseTrackingsQuery } from "./queries/course-trackings.ts";
import { createResolvers } from "./resolvers.ts";

describe("createResolvers", () => {
  it("wires query and mutation resolvers from feature modules", () => {
    const mutationResolver = vi.fn();
    const trackingResolver = vi.fn();
    const trackingsResolver = vi.fn();
    vi.mocked(cycleCourseTrackingStatusMutation).mockReturnValue(mutationResolver);
    vi.mocked(courseTrackingQuery).mockReturnValue(trackingResolver);
    vi.mocked(courseTrackingsQuery).mockReturnValue(trackingsResolver);

    const database = {} as Database;
    const resolvers = createResolvers(database);

    expect(cycleCourseTrackingStatusMutation).toHaveBeenCalledWith(database);
    expect(courseTrackingQuery).toHaveBeenCalledWith(database);
    expect(courseTrackingsQuery).toHaveBeenCalledWith(database);
    expect(resolvers.Mutation.cycleCourseTrackingStatus).toBe(mutationResolver);
    expect(resolvers.Query.courseTracking).toBe(trackingResolver);
    expect(resolvers.Query.courseTrackings).toBe(trackingsResolver);
  });
});
