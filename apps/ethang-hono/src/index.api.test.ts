import { describe, expect, it, vi } from "vitest";

vi.mock(import("@ethang/toolbelt/http/cookie.js"), () => {
  return {
    getCookieValue: vi.fn().mockReturnValue(new Error("no cookie"))
  };
});
vi.mock(import("./models/blog-model.ts"), () => {
  return {
    BlogModel: vi.fn()
  };
});
vi.mock(import("./clients/course-tracking-graphql.ts"), () => {
  return {
    cycleCourseTrackingStatus: vi.fn(),
    getCourseTrackingByUserIdCourseId: vi.fn(),
    getCourseTrackingsByUserId: vi.fn()
  };
});
vi.mock(import("./stores/course-path-store.ts"), () => {
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
    totalCourseCount: 0
  };
  return {
    coursePathData: mockStore,
    CoursePathStore: vi.fn()
  };
});

import {
  cycleCourseTrackingStatus,
  getCourseTrackingByUserIdCourseId,
  getCourseTrackingsByUserId
} from "./clients/course-tracking-graphql.ts";
import { app } from "./index.tsx";
import { COURSE_TRACKING_STATUS } from "./utilities/constants.ts";

const COURSE_EXAMPLE_URL = "https://course.example.com";
const TRACKING_API_URL =
  "https://ethang.dev/api/course-tracking/course1?userId=user1";

describe("app — API", () => {
  describe("pUT /api/course-tracking/:userId/:courseId — status cycle", () => {
    it("returns updated tracking data from GraphQL mutation", async () => {
      vi.clearAllMocks();

      vi.mocked(cycleCourseTrackingStatus).mockResolvedValue({
        courseUrl: COURSE_EXAMPLE_URL,
        id: "track-id",
        status: COURSE_TRACKING_STATUS.REVISIT,
        userId: "user1"
      });

      const response = await app.request(TRACKING_API_URL, { method: "PUT" });

      expect(response.status).toBe(200);
      expect(cycleCourseTrackingStatus).toHaveBeenCalledWith(
        expect.anything(),
        "user1",
        "course1"
      );

      const json = await response.json<Record<string, unknown>>();

      expect(json["data"]).toStrictEqual({
        courseUrl: COURSE_EXAMPLE_URL,
        id: "track-id",
        status: COURSE_TRACKING_STATUS.REVISIT,
        userId: "user1"
      });
      expect(json["status"]).toBe(200);
    });

    it("returns 400 when userId is missing on PUT", async () => {
      vi.clearAllMocks();

      const response = await app.request(
        "https://ethang.dev/api/course-tracking/course1",
        { method: "PUT" }
      );

      expect(response.status).toBe(200);

      const json = await response.json<Record<string, unknown>>();

      expect(json["status"]).toBe(400);
      expect(cycleCourseTrackingStatus).not.toHaveBeenCalled();
    });
  });

  describe("gET /api/course-tracking/:userId", () => {
    it("returns course trackings for a user", async () => {
      vi.clearAllMocks();

      const trackings = [
        {
          courseUrl: COURSE_EXAMPLE_URL,
          id: "t1",
          status: COURSE_TRACKING_STATUS.COMPLETE,
          userId: "user1"
        }
      ];

      vi.mocked(getCourseTrackingsByUserId).mockResolvedValue(trackings);

      const response = await app.request(
        "https://ethang.dev/api/course-tracking?userId=user1"
      );
      const json = await response.json<Record<string, unknown>>();

      expect(response.status).toBe(200);
      expect(json["data"]).toStrictEqual(trackings);
      expect(getCourseTrackingsByUserId).toHaveBeenCalledWith(
        expect.anything(),
        "user1"
      );
    });

    it("returns 400 when userId is missing on GET", async () => {
      vi.clearAllMocks();

      const response = await app.request(
        "https://ethang.dev/api/course-tracking"
      );

      expect(response.status).toBe(200);

      const json = await response.json<Record<string, unknown>>();

      expect(json["status"]).toBe(400);
      expect(getCourseTrackingsByUserId).not.toHaveBeenCalled();
    });
  });

  describe("gET /api/course-tracking/:userId/:courseId", () => {
    it("returns the course tracking entry", async () => {
      vi.clearAllMocks();

      const tracking = {
        courseUrl: COURSE_EXAMPLE_URL,
        id: "t1",
        status: COURSE_TRACKING_STATUS.COMPLETE,
        userId: "user1"
      };

      vi.mocked(getCourseTrackingByUserIdCourseId).mockResolvedValue(tracking);

      const response = await app.request(TRACKING_API_URL);
      const json = await response.json<Record<string, unknown>>();

      expect(response.status).toBe(200);
      expect(json["data"]).toStrictEqual(tracking);
      expect(getCourseTrackingByUserIdCourseId).toHaveBeenCalledWith(
        expect.anything(),
        "user1",
        "course1"
      );
    });

    it("returns null data when tracking does not exist", async () => {
      vi.clearAllMocks();

      vi.mocked(getCourseTrackingByUserIdCourseId).mockResolvedValue(undefined);

      const response = await app.request(TRACKING_API_URL);
      const json = await response.json<Record<string, unknown>>();

      expect(response.status).toBe(200);
      expect(json["data"]).toBeUndefined();
    });

    it("returns 400 when userId is missing on GET by courseId", async () => {
      vi.clearAllMocks();

      const response = await app.request(
        "https://ethang.dev/api/course-tracking/course1"
      );

      expect(response.status).toBe(200);

      const json = await response.json<Record<string, unknown>>();

      expect(json["status"]).toBe(400);
      expect(getCourseTrackingByUserIdCourseId).not.toHaveBeenCalled();
    });
  });
});
