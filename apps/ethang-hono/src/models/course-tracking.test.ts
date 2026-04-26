/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/unbound-method */
import { describe, expect, it, vi } from "vitest";

import { sanityClient } from "../clients/sanity.ts";
import { CourseTracking } from "./course-tracking.ts";

// @ts-expect-error it's fine
vi.mock(import("../clients/sanity.ts"), () => {return {
  sanityClient: {
    fetch: vi.fn(),
  },
}});

type MockDatabase = {
  insert: ReturnType<typeof vi.fn>;
  query: {
    courseTrackingTable: {
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
  };
  set: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
};

describe(CourseTracking, () => {
  const mockDatabase: MockDatabase = {
    insert: vi.fn().mockReturnThis(),
    query: {
      courseTrackingTable: {
        findFirst: vi
          .fn()
          .mockImplementation(
            (options: { where: (table: any, operators: any) => void }) => {
              options.where({}, { and: vi.fn(), eq: vi.fn() });
            },
          ),
        findMany: vi
          .fn()
          .mockImplementation(
            (options: { where: (table: any, operators: any) => void }) => {
              options.where({}, { eq: vi.fn() });
            },
          ),
      },
    },
    set: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
  };

  it("createCourseTracking calls insert with correct data", async () => {
    vi.mocked(sanityClient.fetch).mockResolvedValue({ url: "test-url" } as any);

    const model = new CourseTracking(mockDatabase as any);

    await model.createCourseTracking("user-1", "course-1");

    expect(mockDatabase.insert).toHaveBeenCalledWith(expect.anything());

    expect(mockDatabase.values).toHaveBeenCalledWith({
      courseUrl: "test-url",
      status: "Complete",
      userId: "user-1",
    });
  });

  it("getCourseTrackingByUserId calls findMany and executes where callback", async () => {
    const model = new CourseTracking(mockDatabase as any);
    await model.getCourseTrackingByUserId("user-1");

    expect(
      mockDatabase.query.courseTrackingTable.findMany,
      // eslint-disable-next-line vitest/prefer-called-with
    ).toHaveBeenCalled();
  });

  it("getCourseTrackingByUserIdCourseId calls findFirst and executes where callback", async () => {
    vi.mocked(sanityClient.fetch).mockResolvedValue({ url: "test-url" } as any);

    const model = new CourseTracking(mockDatabase as any);
    await model.getCourseTrackingByUserIdCourseId("user-1", "course-1");

    expect(
      mockDatabase.query.courseTrackingTable.findFirst,
      // eslint-disable-next-line vitest/prefer-called-with
    ).toHaveBeenCalled();
  });

  it("updateCourseTrackingStatus calls update", async () => {
    const model = new CourseTracking(mockDatabase as any);
    await model.updateCourseTrackingStatus("id-1", "Revisit");

    expect(mockDatabase.update).toHaveBeenCalledWith(expect.anything());

    expect(mockDatabase.set).toHaveBeenCalledWith({ status: "Revisit" });
  });
});
