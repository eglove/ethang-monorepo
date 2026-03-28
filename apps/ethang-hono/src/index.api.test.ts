import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("flowbite", () => ({}));
vi.mock("@ethang/toolbelt/http/cookie.js", () => ({
  getCookieValue: vi.fn().mockReturnValue(new Error("no cookie")),
}));
vi.mock("./models/blog-model.ts", () => ({
  BlogModel: vi.fn(),
}));
vi.mock("./clients/sanity.ts", () => ({
  sanityClient: { fetch: vi.fn() },
}));
vi.mock("./db/database.ts", () => ({
  getDatabase: vi.fn(),
}));
vi.mock("./stores/course-path-store.ts", () => {
  const mockStore = {
    courseTrackings: [],
    getCourse: vi.fn(),
    getCourseTracking: vi.fn(),
    getStatusPercentages: vi
      .fn()
      .mockReturnValue({ complete: 0, incomplete: 100, revisit: 0 }),
    latestUpdate: undefined,
    learningPaths: [],
    setup: vi.fn().mockResolvedValue(undefined),
    totalCourseCount: 0,
  };
  return {
    coursePathData: mockStore,
    CoursePathStore: vi.fn(),
  };
});

import { sanityClient } from "./clients/sanity.ts";
import { getDatabase } from "./db/database.ts";
import { app } from "./index.tsx";
import { COURSE_TRACKING_STATUS } from "./utilities/constants.ts";

const COURSE_EXAMPLE_URL = "https://course.example.com";
const TRACKING_API_URL = "https://ethang.dev/api/course-tracking/user1/course1";

const makeMockDatabase = () => {
  const mockFindFirst = vi.fn();
  const mockFindMany = vi.fn().mockResolvedValue([]);
  const mockValues = vi.fn().mockResolvedValue(undefined);
  const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
  const mockWhere = vi.fn().mockResolvedValue(undefined);
  const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });

  return {
    _findFirst: mockFindFirst,
    _findMany: mockFindMany,
    _set: mockSet,
    _values: mockValues,
    _where: mockWhere,
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

describe("app — API", () => {
  describe("PUT /api/course-tracking/:userId/:courseId — status cycle", () => {
    let mockDatabase: ReturnType<typeof makeMockDatabase>;

    beforeEach(() => {
      mockDatabase = makeMockDatabase();
      vi.mocked(getDatabase).mockReturnValue(mockDatabase as never);
      vi.mocked(sanityClient).fetch.mockResolvedValue({
        url: COURSE_EXAMPLE_URL,
      } as never);
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("creates a new tracking entry with COMPLETE status when none exists", async () => {
      mockDatabase._findFirst.mockResolvedValue(undefined);

      const response = await app.request(TRACKING_API_URL, { method: "PUT" });

      expect(response.status).toBe(200);
      expect(mockDatabase._values).toHaveBeenCalledWith(
        expect.objectContaining({
          status: COURSE_TRACKING_STATUS.COMPLETE,
          userId: "user1",
        }),
      );
    });

    it("cycles COMPLETE status to REVISIT", async () => {
      const existing = {
        courseUrl: COURSE_EXAMPLE_URL,
        id: "track-id",
        status: COURSE_TRACKING_STATUS.COMPLETE,
        userId: "user1",
      };
      mockDatabase._findFirst
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({
          ...existing,
          status: COURSE_TRACKING_STATUS.REVISIT,
        });

      const response = await app.request(TRACKING_API_URL, { method: "PUT" });

      expect(response.status).toBe(200);
      expect(mockDatabase._set).toHaveBeenCalledWith({
        status: COURSE_TRACKING_STATUS.REVISIT,
      });
    });

    it("cycles REVISIT status to INCOMPLETE", async () => {
      const existing = {
        courseUrl: COURSE_EXAMPLE_URL,
        id: "track-id",
        status: COURSE_TRACKING_STATUS.REVISIT,
        userId: "user1",
      };
      mockDatabase._findFirst
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({
          ...existing,
          status: COURSE_TRACKING_STATUS.INCOMPLETE,
        });

      const response = await app.request(TRACKING_API_URL, { method: "PUT" });

      expect(response.status).toBe(200);
      expect(mockDatabase._set).toHaveBeenCalledWith({
        status: COURSE_TRACKING_STATUS.INCOMPLETE,
      });
    });

    it("cycles INCOMPLETE status to COMPLETE", async () => {
      const existing = {
        courseUrl: COURSE_EXAMPLE_URL,
        id: "track-id",
        status: COURSE_TRACKING_STATUS.INCOMPLETE,
        userId: "user1",
      };
      mockDatabase._findFirst
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({
          ...existing,
          status: COURSE_TRACKING_STATUS.COMPLETE,
        });

      const response = await app.request(TRACKING_API_URL, { method: "PUT" });

      expect(response.status).toBe(200);
      expect(mockDatabase._set).toHaveBeenCalledWith({
        status: COURSE_TRACKING_STATUS.COMPLETE,
      });
    });

    it("returns updated tracking data as JSON", async () => {
      const existing = {
        courseUrl: COURSE_EXAMPLE_URL,
        id: "track-id",
        status: COURSE_TRACKING_STATUS.COMPLETE,
        userId: "user1",
      };
      const updated = { ...existing, status: COURSE_TRACKING_STATUS.REVISIT };
      mockDatabase._findFirst
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(updated);

      const response = await app.request(TRACKING_API_URL, { method: "PUT" });

      const json = await response.json<Record<string, unknown>>();
      expect(json["status"]).toBe(200);
    });
  });

  describe("GET /api/course-tracking/:userId", () => {
    let mockDatabase: ReturnType<typeof makeMockDatabase>;

    beforeEach(() => {
      mockDatabase = makeMockDatabase();
      vi.mocked(getDatabase).mockReturnValue(mockDatabase as never);
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("returns course trackings for a user", async () => {
      const trackings = [
        {
          courseUrl: COURSE_EXAMPLE_URL,
          id: "t1",
          status: COURSE_TRACKING_STATUS.COMPLETE,
          userId: "user1",
        },
      ];
      mockDatabase._findMany.mockResolvedValue(trackings);

      const response = await app.request(
        "https://ethang.dev/api/course-tracking/user1",
      );
      const json = await response.json<Record<string, unknown>>();

      expect(response.status).toBe(200);
      expect(json["data"]).toEqual(trackings);
    });
  });

  describe("GET /api/course-tracking/:userId/:courseId", () => {
    let mockDatabase: ReturnType<typeof makeMockDatabase>;

    beforeEach(() => {
      mockDatabase = makeMockDatabase();
      vi.mocked(getDatabase).mockReturnValue(mockDatabase as never);
      vi.mocked(sanityClient).fetch.mockResolvedValue({
        url: COURSE_EXAMPLE_URL,
      } as never);
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("returns the course tracking entry", async () => {
      const tracking = {
        courseUrl: COURSE_EXAMPLE_URL,
        id: "t1",
        status: COURSE_TRACKING_STATUS.COMPLETE,
        userId: "user1",
      };
      mockDatabase._findFirst.mockResolvedValue(tracking);

      const response = await app.request(TRACKING_API_URL);
      const json = await response.json<Record<string, unknown>>();

      expect(response.status).toBe(200);
      expect(json["data"]).toEqual(tracking);
    });

    it("returns null data when tracking does not exist", async () => {
      mockDatabase._findFirst.mockResolvedValue(undefined);

      const response = await app.request(TRACKING_API_URL);
      const json = await response.json<Record<string, unknown>>();

      expect(response.status).toBe(200);
      expect(json["data"]).toBeUndefined();
    });
  });
});
