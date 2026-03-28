import { faker } from "@faker-js/faker";
import { describe, expect, it, vi } from "vitest";

const mockSanityFetch = vi.hoisted(() => vi.fn());

vi.mock(import("../clients/sanity.ts"), () => ({
  sanityClient: {
    fetch: mockSanityFetch,
  },
}));
import { COURSE_TRACKING_STATUS } from "../utilities/constants.ts";
import { CourseTracking } from "./course-tracking.ts";

const mockTable = {
  courseUrl: "courseUrl",
  id: "id",
  status: "status",
  userId: "userId",
};
const mockOperators = { and: vi.fn(), eq: vi.fn() };

type MockFindOptions = {
  where?: (table: typeof mockTable, operators: typeof mockOperators) => void;
};

const makeMockDatabase = () => {
  const mockWhere = vi.fn().mockResolvedValue(undefined);
  const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
  const mockValues = vi.fn().mockResolvedValue(undefined);
  const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
  const mockFindMany = vi
    .fn()
    .mockImplementation((options: MockFindOptions) => {
      options.where?.(mockTable, mockOperators);
      return [];
    });
  const mockFindFirst = vi
    .fn()
    .mockImplementation((options: MockFindOptions) => {
      options.where?.(mockTable, mockOperators);
    });

  return {
    _mockFindFirst: mockFindFirst,
    _mockFindMany: mockFindMany,
    _mockSet: mockSet,
    _mockValues: mockValues,
    _mockWhere: mockWhere,
    insert: mockInsert,
    query: {
      courseTrackingTable: {
        findFirst: mockFindFirst,
        findMany: mockFindMany,
      },
    },
    update: mockUpdate,
  };
};

describe(CourseTracking, () => {
  describe("createCourseTracking", () => {
    it("inserts a new tracking record with COMPLETE status", async () => {
      vi.clearAllMocks();
      const courseUrl = faker.internet.url();
      const database = makeMockDatabase();
      const courseTracking = new CourseTracking(
        database as unknown as ConstructorParameters<typeof CourseTracking>[0],
      );
      mockSanityFetch.mockResolvedValue({ url: courseUrl });
      const userId = faker.string.uuid();
      const courseId = faker.string.uuid();

      await courseTracking.createCourseTracking(userId, courseId);

      expect(database._mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          courseUrl,
          status: COURSE_TRACKING_STATUS.COMPLETE,
          userId,
        }),
      );
    });

    it("fetches the course URL from Sanity using courseId", async () => {
      vi.clearAllMocks();
      const courseUrl = faker.internet.url();
      const database = makeMockDatabase();
      const courseTracking = new CourseTracking(
        database as unknown as ConstructorParameters<typeof CourseTracking>[0],
      );
      mockSanityFetch.mockResolvedValue({ url: courseUrl });
      const courseId = "sanity-course-id";
      await courseTracking.createCourseTracking("user-1", courseId);

      expect(mockSanityFetch).toHaveBeenCalledWith(
        expect.stringContaining(courseId),
      );
    });
  });

  describe("getCourseTrackingByUserId", () => {
    it("queries the database for the given userId", async () => {
      vi.clearAllMocks();
      const courseUrl = faker.internet.url();
      const database = makeMockDatabase();
      const courseTracking = new CourseTracking(
        database as unknown as ConstructorParameters<typeof CourseTracking>[0],
      );
      mockSanityFetch.mockResolvedValue({ url: courseUrl });
      const userId = faker.string.uuid();
      const trackings = [
        {
          courseUrl: faker.internet.url(),
          id: faker.string.uuid(),
          status: COURSE_TRACKING_STATUS.COMPLETE,
          userId,
        },
      ];
      database._mockFindMany.mockResolvedValue(trackings);

      const result = await courseTracking.getCourseTrackingByUserId(userId);

      expect(result).toStrictEqual(trackings);
      expect(database._mockFindMany).toHaveBeenCalledTimes(1);
    });

    it("returns an empty array when user has no trackings", async () => {
      vi.clearAllMocks();
      const courseUrl = faker.internet.url();
      const database = makeMockDatabase();
      const courseTracking = new CourseTracking(
        database as unknown as ConstructorParameters<typeof CourseTracking>[0],
      );
      mockSanityFetch.mockResolvedValue({ url: courseUrl });
      database._mockFindMany.mockResolvedValue([]);

      const result = await courseTracking.getCourseTrackingByUserId("unknown");

      expect(result).toStrictEqual([]);
    });

    it("passes a where clause that filters by userId", async () => {
      vi.clearAllMocks();
      const courseUrl = faker.internet.url();
      const database = makeMockDatabase();
      const courseTracking = new CourseTracking(
        database as unknown as ConstructorParameters<typeof CourseTracking>[0],
      );
      mockSanityFetch.mockResolvedValue({ url: courseUrl });
      const userId = faker.string.uuid();
      await courseTracking.getCourseTrackingByUserId(userId);

      // The default mockImplementation invokes the where callback — verify it called eq on userId
      expect(mockOperators.eq).toHaveBeenCalledWith(mockTable.userId, userId);
    });
  });

  describe("getCourseTrackingByUserIdCourseId", () => {
    it("resolves the course URL from Sanity and queries the database", async () => {
      vi.clearAllMocks();
      const courseUrl = faker.internet.url();
      const database = makeMockDatabase();
      const courseTracking = new CourseTracking(
        database as unknown as ConstructorParameters<typeof CourseTracking>[0],
      );
      mockSanityFetch.mockResolvedValue({ url: courseUrl });
      const userId = faker.string.uuid();
      const courseId = faker.string.uuid();
      const tracking = {
        courseUrl,
        id: faker.string.uuid(),
        status: COURSE_TRACKING_STATUS.REVISIT,
        userId,
      };
      database._mockFindFirst.mockResolvedValue(tracking);

      const result = await courseTracking.getCourseTrackingByUserIdCourseId(
        userId,
        courseId,
      );

      expect(result).toStrictEqual(tracking);
      expect(mockSanityFetch).toHaveBeenCalledWith(
        expect.stringContaining(courseId),
      );
    });

    it("returns undefined when no matching tracking entry exists", async () => {
      vi.clearAllMocks();
      const courseUrl = faker.internet.url();
      const database = makeMockDatabase();
      const courseTracking = new CourseTracking(
        database as unknown as ConstructorParameters<typeof CourseTracking>[0],
      );
      mockSanityFetch.mockResolvedValue({ url: courseUrl });
      database._mockFindFirst.mockResolvedValue(undefined);

      const result = await courseTracking.getCourseTrackingByUserIdCourseId(
        "user",
        "course",
      );

      expect(result).toBeUndefined();
    });

    it("passes a where clause that filters by userId and courseUrl", async () => {
      vi.clearAllMocks();
      const courseUrl = faker.internet.url();
      const database = makeMockDatabase();
      const courseTracking = new CourseTracking(
        database as unknown as ConstructorParameters<typeof CourseTracking>[0],
      );
      mockSanityFetch.mockResolvedValue({ url: courseUrl });
      const userId = faker.string.uuid();
      const courseId = faker.string.uuid();
      await courseTracking.getCourseTrackingByUserIdCourseId(userId, courseId);

      // The default mockImplementation invokes the where callback — verify it called eq for both filters and combined them with and
      expect(mockOperators.eq).toHaveBeenCalledWith(mockTable.userId, userId);
      expect(mockOperators.eq).toHaveBeenCalledWith(
        mockTable.courseUrl,
        courseUrl,
      );
      expect(mockOperators.and).toHaveBeenCalledTimes(1);
    });
  });

  describe("updateCourseTrackingStatus", () => {
    it("updates the status of the record with the given id", async () => {
      vi.clearAllMocks();
      const courseUrl = faker.internet.url();
      const database = makeMockDatabase();
      const courseTracking = new CourseTracking(
        database as unknown as ConstructorParameters<typeof CourseTracking>[0],
      );
      mockSanityFetch.mockResolvedValue({ url: courseUrl });
      const id = faker.string.uuid();
      const newStatus = COURSE_TRACKING_STATUS.REVISIT;

      await courseTracking.updateCourseTrackingStatus(id, newStatus);

      expect(database._mockSet).toHaveBeenCalledWith({ status: newStatus });
      expect(database._mockWhere).toHaveBeenCalledTimes(1);
    });

    it("accepts all valid status values", async () => {
      vi.clearAllMocks();
      const courseUrl = faker.internet.url();
      const database = makeMockDatabase();
      const courseTracking = new CourseTracking(
        database as unknown as ConstructorParameters<typeof CourseTracking>[0],
      );
      mockSanityFetch.mockResolvedValue({ url: courseUrl });

      await courseTracking.updateCourseTrackingStatus(
        faker.string.uuid(),
        COURSE_TRACKING_STATUS.COMPLETE,
      );

      expect(database._mockSet).toHaveBeenCalledWith({
        status: COURSE_TRACKING_STATUS.COMPLETE,
      });

      database._mockSet.mockClear();

      await courseTracking.updateCourseTrackingStatus(
        faker.string.uuid(),
        COURSE_TRACKING_STATUS.REVISIT,
      );

      expect(database._mockSet).toHaveBeenCalledWith({
        status: COURSE_TRACKING_STATUS.REVISIT,
      });

      database._mockSet.mockClear();

      await courseTracking.updateCourseTrackingStatus(
        faker.string.uuid(),
        COURSE_TRACKING_STATUS.INCOMPLETE,
      );

      expect(database._mockSet).toHaveBeenCalledWith({
        status: COURSE_TRACKING_STATUS.INCOMPLETE,
      });
    });
  });
});
