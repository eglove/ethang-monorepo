import { faker } from "@faker-js/faker";
import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";

vi.mock(import("../clients/sanity.ts"), (() => ({
  sanityClient: { fetch: vi.fn() },
})) as never);
vi.mock(import("../db/database.ts"), () => ({
  getDatabase: vi.fn().mockReturnValue({}),
}));
vi.mock(import("../models/course-tracking.ts"), () => ({
  CourseTracking: vi.fn(),
}));

import { sanityClient } from "../clients/sanity.ts";
import { CourseTracking } from "../models/course-tracking.ts";
import { COURSE_TRACKING_STATUS } from "../utilities/constants.ts";
import { CoursePathStore } from "./course-path-store.ts";

const LATEST_UPDATE_DATE = "2024-01-01";

const makeContext = async (courseStore: CoursePathStore) => {
  const testApp = new Hono();
  testApp.get("/", async (c) => {
    await courseStore.setup(
      c as unknown as Parameters<typeof courseStore.setup>[0],
    );
    return c.json({ ok: true });
  });
  await testApp.request("/");
};

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

const mockCourseTrackingWith = (
  getCourseTrackingByUserId: ReturnType<typeof vi.fn>,
) => {
  vi.mocked(CourseTracking).mockImplementation(
    class {
      public getCourseTrackingByUserId = getCourseTrackingByUserId;
    } as never,
  );
};

describe("coursePathStore — initial state", () => {
  it("starts with empty courseTrackings", () => {
    const store = new CoursePathStore();

    expect(store.courseTrackings).toStrictEqual([]);
  });

  it("starts with zero totalCourseCount", () => {
    const store = new CoursePathStore();

    expect(store.totalCourseCount).toBe(0);
  });

  it("starts with undefined learningPaths", () => {
    const store = new CoursePathStore();

    expect(store.learningPaths).toBeUndefined();
  });

  it("starts with undefined latestUpdate", () => {
    const store = new CoursePathStore();

    expect(store.latestUpdate).toBeUndefined();
  });
});

describe("coursePathStore — getCourse", () => {
  it("returns the course matching the given id", () => {
    const store = new CoursePathStore();
    const courseId = faker.string.uuid();
    const course = makeCourse({ _id: courseId });
    store.learningPaths = [makeLearningPath([course])];

    const result = store.getCourse(courseId);

    expect(result?._id).toBe(courseId);
  });

  it("searches across all learning paths", () => {
    const store = new CoursePathStore();
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
    const store = new CoursePathStore();
    store.learningPaths = [makeLearningPath([makeCourse()])];

    const result = store.getCourse("nonexistent-id");

    expect(result).toBeUndefined();
  });

  it("returns undefined when learningPaths is undefined", () => {
    const store = new CoursePathStore();
    store.learningPaths = undefined;

    const result = store.getCourse("any-id");

    expect(result).toBeUndefined();
  });
});

describe("coursePathStore — getCourseTracking", () => {
  it("returns the tracking entry matching the courseUrl", () => {
    const store = new CoursePathStore();
    const courseUrl = faker.internet.url();
    const tracking = makeCourseTracking({ courseUrl });
    store.courseTrackings = [tracking];

    const result = store.getCourseTracking(courseUrl);

    expect(result?.courseUrl).toBe(courseUrl);
  });

  it("returns undefined when no matching courseUrl", () => {
    const store = new CoursePathStore();
    store.courseTrackings = [makeCourseTracking()];

    const result = store.getCourseTracking("https://not-found.com");

    expect(result).toBeUndefined();
  });

  it("returns undefined when courseTrackings is empty", () => {
    const store = new CoursePathStore();
    store.courseTrackings = [];

    const result = store.getCourseTracking("https://any.com");

    expect(result).toBeUndefined();
  });
});

describe("coursePathStore — getStatusPercentages", () => {
  it("returns 100% complete when all courses are complete", () => {
    const store = new CoursePathStore();
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
    const store = new CoursePathStore();
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
    const store = new CoursePathStore();
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
    const store = new CoursePathStore();
    store.totalCourseCount = 0;
    store.courseTrackings = [];

    const result = store.getStatusPercentages();

    expect(Number.isNaN(result.complete)).toBe(true);
  });

  it("returns 0% complete when all courses are revisit or incomplete", () => {
    const store = new CoursePathStore();
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

describe("coursePathStore — setup", () => {
  it("sets learningPaths from sanity data", async () => {
    vi.clearAllMocks();
    const mockGetCourseTrackingByUserId = vi.fn().mockResolvedValue([]);
    mockCourseTrackingWith(mockGetCourseTrackingByUserId);
    const store = new CoursePathStore();
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
    vi.mocked(sanityClient).fetch.mockResolvedValue({
      latestUpdate: { _id: "lu1", _updatedAt: LATEST_UPDATE_DATE },
      learningPaths,
    } as never);

    await makeContext(store);

    expect(store.learningPaths).toStrictEqual(learningPaths);
  });

  it("sums courseCount across all learning paths for totalCourseCount", async () => {
    vi.clearAllMocks();
    const mockGetCourseTrackingByUserId = vi.fn().mockResolvedValue([]);
    mockCourseTrackingWith(mockGetCourseTrackingByUserId);
    const store = new CoursePathStore();
    vi.mocked(sanityClient).fetch.mockResolvedValue({
      latestUpdate: { _id: "lu1", _updatedAt: LATEST_UPDATE_DATE },
      learningPaths: [
        {
          _id: "lp1",
          courseCount: 3,
          courses: [],
          name: "A",
          swebokFocus: "testing",
        },
        {
          _id: "lp2",
          courseCount: 5,
          courses: [],
          name: "B",
          swebokFocus: "quality",
        },
      ],
    } as never);

    await makeContext(store);

    expect(store.totalCourseCount).toBe(8);
  });

  it("sets courseTrackings from database", async () => {
    vi.clearAllMocks();
    const trackings = [makeCourseTracking()];
    const mockGetCourseTrackingByUserId = vi.fn().mockResolvedValue(trackings);
    mockCourseTrackingWith(mockGetCourseTrackingByUserId);
    const store = new CoursePathStore();
    vi.mocked(sanityClient).fetch.mockResolvedValue({
      latestUpdate: { _id: "lu1", _updatedAt: LATEST_UPDATE_DATE },
      learningPaths: [],
    } as never);

    await makeContext(store);

    expect(store.courseTrackings).toStrictEqual(trackings);
  });

  it("sets latestUpdate from sanity data", async () => {
    vi.clearAllMocks();
    const mockGetCourseTrackingByUserId = vi.fn().mockResolvedValue([]);
    mockCourseTrackingWith(mockGetCourseTrackingByUserId);
    const store = new CoursePathStore();
    const latestUpdate = { _id: "lu-1", _updatedAt: "2024-06-01T00:00:00Z" };
    vi.mocked(sanityClient).fetch.mockResolvedValue({
      latestUpdate,
      learningPaths: [],
    } as never);

    await makeContext(store);

    expect(store.latestUpdate).toStrictEqual(latestUpdate);
  });
});
