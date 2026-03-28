import { faker } from "@faker-js/faker";
import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../clients/sanity.ts", () => ({
  sanityClient: { fetch: vi.fn() },
}));
vi.mock("../db/database.ts", () => ({
  getDatabase: vi.fn().mockReturnValue({}),
}));
vi.mock("../models/course-tracking.ts", () => ({
  CourseTracking: vi.fn(),
}));

import type { Mock } from "vitest";

import { sanityClient } from "../clients/sanity.ts";
import { CourseTracking } from "../models/course-tracking.ts";
import { COURSE_TRACKING_STATUS } from "../utilities/constants.ts";
import { CoursePathStore } from "./course-path-store.ts";

const makeCourse = (overrides = {}) => ({
  _id: faker.string.uuid(),
  author: faker.person.fullName(),
  name: faker.lorem.words(2),
  url: faker.internet.url(),
  ...overrides,
});

const makeLearningPath = (courses = [makeCourse()], overrides = {}) => ({
  _id: faker.string.uuid(),
  courseCount: courses.length,
  courses,
  name: faker.lorem.word(),
  swebokFocus: faker.lorem.word(),
  url: faker.internet.url(),
  ...overrides,
});

const makeCourseTracking = (overrides = {}) => ({
  courseUrl: faker.internet.url(),
  id: faker.string.uuid(),
  status: COURSE_TRACKING_STATUS.COMPLETE,
  userId: faker.string.uuid(),
  ...overrides,
});

describe("CoursePathStore", () => {
  let store: CoursePathStore;

  beforeEach(() => {
    store = new CoursePathStore();
  });

  describe("initial state", () => {
    it("starts with empty courseTrackings", () => {
      expect(store.courseTrackings).toEqual([]);
    });

    it("starts with zero totalCourseCount", () => {
      expect(store.totalCourseCount).toBe(0);
    });

    it("starts with undefined learningPaths", () => {
      expect(store.learningPaths).toBeUndefined();
    });

    it("starts with undefined latestUpdate", () => {
      expect(store.latestUpdate).toBeUndefined();
    });
  });

  describe("getCourse", () => {
    it("returns the course matching the given id", () => {
      const courseId = faker.string.uuid();
      const course = makeCourse({ _id: courseId });
      store.learningPaths = [makeLearningPath([course])];

      const result = store.getCourse(courseId);

      expect(result?._id).toBe(courseId);
    });

    it("searches across all learning paths", () => {
      const courseId = faker.string.uuid();
      const targetCourse = makeCourse({ _id: courseId });
      store.learningPaths = [
        makeLearningPath([makeCourse()]),
        makeLearningPath([targetCourse]),
      ];

      const result = store.getCourse(courseId);

      expect(result?._id).toBe(courseId);
    });

    it("returns undefined when course is not found", () => {
      store.learningPaths = [makeLearningPath([makeCourse()])];

      const result = store.getCourse("nonexistent-id");

      expect(result).toBeUndefined();
    });

    it("returns undefined when learningPaths is undefined", () => {
      store.learningPaths = undefined;

      const result = store.getCourse("any-id");

      expect(result).toBeUndefined();
    });
  });

  describe("getCourseTracking", () => {
    it("returns the tracking entry matching the courseUrl", () => {
      const courseUrl = faker.internet.url();
      const tracking = makeCourseTracking({ courseUrl });
      store.courseTrackings = [tracking];

      const result = store.getCourseTracking(courseUrl);

      expect(result?.courseUrl).toBe(courseUrl);
    });

    it("returns undefined when no matching courseUrl", () => {
      store.courseTrackings = [makeCourseTracking()];

      const result = store.getCourseTracking("https://not-found.com");

      expect(result).toBeUndefined();
    });

    it("returns undefined when courseTrackings is empty", () => {
      store.courseTrackings = [];

      const result = store.getCourseTracking("https://any.com");

      expect(result).toBeUndefined();
    });
  });

  describe("getStatusPercentages", () => {
    it("returns 100% complete when all courses are complete", () => {
      store.totalCourseCount = 2;
      store.courseTrackings = [
        makeCourseTracking({ status: COURSE_TRACKING_STATUS.COMPLETE }),
        makeCourseTracking({ status: COURSE_TRACKING_STATUS.COMPLETE }),
      ];

      const result = store.getStatusPercentages();

      expect(result.complete).toBe(100);
      expect(result.revisit).toBe(0);
      expect(result.incomplete).toBe(0);
    });

    it("calculates percentages for mixed statuses", () => {
      store.totalCourseCount = 4;
      store.courseTrackings = [
        makeCourseTracking({ status: COURSE_TRACKING_STATUS.COMPLETE }),
        makeCourseTracking({ status: COURSE_TRACKING_STATUS.COMPLETE }),
        makeCourseTracking({ status: COURSE_TRACKING_STATUS.REVISIT }),
        makeCourseTracking({ status: COURSE_TRACKING_STATUS.INCOMPLETE }),
      ];

      const result = store.getStatusPercentages();

      expect(result.complete).toBe(50);
      expect(result.revisit).toBe(25);
      expect(result.incomplete).toBe(25);
    });

    it("counts untracked courses toward incomplete", () => {
      store.totalCourseCount = 5;
      store.courseTrackings = [
        makeCourseTracking({ status: COURSE_TRACKING_STATUS.COMPLETE }),
      ];

      const result = store.getStatusPercentages();

      expect(result.complete).toBe(20);
      expect(result.incomplete).toBe(80);
      expect(result.revisit).toBe(0);
    });

    it("returns NaN percentages when totalCourseCount is 0 (division by zero)", () => {
      store.totalCourseCount = 0;
      store.courseTrackings = [];

      const result = store.getStatusPercentages();

      expect(Number.isNaN(result.complete)).toBe(true);
    });

    it("returns 0% complete when all courses are revisit or incomplete", () => {
      store.totalCourseCount = 2;
      store.courseTrackings = [
        makeCourseTracking({ status: COURSE_TRACKING_STATUS.REVISIT }),
        makeCourseTracking({ status: COURSE_TRACKING_STATUS.INCOMPLETE }),
      ];

      const result = store.getStatusPercentages();

      expect(result.complete).toBe(0);
      expect(result.revisit).toBe(50);
      expect(result.incomplete).toBe(50);
    });
  });

  describe("setup", () => {
    const makeContext = async (store: CoursePathStore) => {
      const testApp = new Hono();
      testApp.get("/", async (c) => {
        await store.setup(c as never);
        return c.json({ ok: true });
      });
      await testApp.request("/");
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("sets learningPaths from sanity data", async () => {
      const learningPaths = [
        {
          _id: faker.string.uuid(),
          courseCount: 2,
          courses: [],
          name: "Test Path",
          swebokFocus: "testing",
          url: faker.internet.url(),
        },
      ];
      (sanityClient.fetch as Mock).mockResolvedValue({
        latestUpdate: { _id: "lu1", _updatedAt: "2024-01-01" },
        learningPaths,
      });
      (CourseTracking as Mock).mockImplementation(
        class {
          getCourseTrackingByUserId = vi.fn().mockResolvedValue([]);
        } as never,
      );

      await makeContext(store);

      expect(store.learningPaths).toEqual(learningPaths);
    });

    it("sums courseCount across all learning paths for totalCourseCount", async () => {
      (sanityClient.fetch as Mock).mockResolvedValue({
        latestUpdate: { _id: "lu1", _updatedAt: "2024-01-01" },
        learningPaths: [
          { _id: "lp1", courseCount: 3, courses: [], name: "A", swebokFocus: "testing" },
          { _id: "lp2", courseCount: 5, courses: [], name: "B", swebokFocus: "quality" },
        ],
      });
      (CourseTracking as Mock).mockImplementation(
        class {
          getCourseTrackingByUserId = vi.fn().mockResolvedValue([]);
        } as never,
      );

      await makeContext(store);

      expect(store.totalCourseCount).toBe(8);
    });

    it("sets courseTrackings from database", async () => {
      const trackings = [makeCourseTracking()];
      (sanityClient.fetch as Mock).mockResolvedValue({
        latestUpdate: { _id: "lu1", _updatedAt: "2024-01-01" },
        learningPaths: [],
      });
      (CourseTracking as Mock).mockImplementation(
        class {
          getCourseTrackingByUserId = vi.fn().mockResolvedValue(trackings);
        } as never,
      );

      await makeContext(store);

      expect(store.courseTrackings).toEqual(trackings);
    });

    it("sets latestUpdate from sanity data", async () => {
      const latestUpdate = { _id: "lu-1", _updatedAt: "2024-06-01T00:00:00Z" };
      (sanityClient.fetch as Mock).mockResolvedValue({
        latestUpdate,
        learningPaths: [],
      });
      (CourseTracking as Mock).mockImplementation(
        class {
          getCourseTrackingByUserId = vi.fn().mockResolvedValue([]);
        } as never,
      );

      await makeContext(store);

      expect(store.latestUpdate).toEqual(latestUpdate);
    });
  });
});
