import { describe, expect, it, vi } from "vitest";

vi.mock(import("./mutations/cycle-course-tracking-status.ts"), () => {
  return {
    cycleCourseTrackingStatusMutation: vi.fn()
  };
});
vi.mock(import("./mutations/create-curriculum.ts"), () => {
  return {
    createCurriculumMutation: vi.fn()
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

import { createCurriculumMutation } from "./mutations/create-curriculum.ts";
import { cycleCourseTrackingStatusMutation } from "./mutations/cycle-course-tracking-status.ts";
import { courseTrackingQuery } from "./queries/course-tracking.ts";
import { courseTrackingsQuery } from "./queries/course-trackings.ts";
import { createResolvers } from "./resolvers.ts";

describe("createResolvers", () => {
  it("wires query and mutation resolvers from feature modules", () => {
    const cycleMutationResolver = vi.fn();
    const createCurriculumResolver = vi.fn();
    const trackingResolver = vi.fn();
    const trackingsResolver = vi.fn();
    vi.mocked(cycleCourseTrackingStatusMutation).mockReturnValue(
      cycleMutationResolver
    );
    vi.mocked(createCurriculumMutation).mockReturnValue(
      createCurriculumResolver
    );
    vi.mocked(courseTrackingQuery).mockReturnValue(trackingResolver);
    vi.mocked(courseTrackingsQuery).mockReturnValue(trackingsResolver);

    const database = {};
    // @ts-expect-error minimal database test double for this unit test
    const resolvers = createResolvers(database);

    expect(cycleCourseTrackingStatusMutation).toHaveBeenCalledWith(database);
    expect(createCurriculumMutation).toHaveBeenCalledWith(database);
    expect(courseTrackingQuery).toHaveBeenCalledWith(database);
    expect(courseTrackingsQuery).toHaveBeenCalledWith(database);
    expect(resolvers.Mutation.cycleCourseTrackingStatus).toBe(
      cycleMutationResolver
    );
    expect(resolvers.Mutation.createCurriculum).toBe(createCurriculumResolver);
    expect(resolvers.Query.courseTracking).toBe(trackingResolver);
    expect(resolvers.Query.courseTrackings).toBe(trackingsResolver);
  });
});
