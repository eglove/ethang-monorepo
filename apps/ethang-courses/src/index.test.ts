import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

const { EXAMPLE_URL, TEST_COURSE_DATA, TEST_CURRICULUM_DATA } = vi.hoisted(
  () => {
    return {
      EXAMPLE_URL: "https://example.com",
      TEST_COURSE_DATA: { id: "c1", name: "Test Course" } as const,
      TEST_CURRICULUM_DATA: { id: "cur1", name: "Test Curriculum" } as const
    };
  }
);

vi.mock("cloudflare:workers", () => {
  return {
    WorkerEntrypoint: class {
      public ctx = {};
      public env: Record<string, unknown> = {};
    }
  };
});

vi.mock("drizzle-orm/d1", () => {
  return {
    drizzle: vi.fn().mockReturnValue({ _mockDb: true })
  };
});

vi.mock("./data/queries/courses-learning-paths.ts", () => {
  return {
    courseQuery: vi.fn().mockReturnValue(Effect.succeed(TEST_COURSE_DATA)),
    coursesAllQuery: vi.fn().mockReturnValue(
      Effect.succeed([
        {
          author: TEST_COURSE_DATA.name,
          courseId: TEST_COURSE_DATA.id,
          courseIndex: 1,
          learningPathId: "lp1",
          learningPathName: "Test LP",
          learningPathOrder: 1,
          name: TEST_COURSE_DATA.name,
          swebokFocus: "testing",
          url: "https://example.com"
        }
      ])
    ),
    coursesQuery: vi.fn().mockReturnValue(Effect.succeed([TEST_COURSE_DATA])),
    learningPathQuery: vi.fn().mockReturnValue(Effect.succeed({ id: "lp1" })),
    learningPathsQuery: vi.fn().mockReturnValue(Effect.succeed([{ id: "lp1" }]))
  };
});

vi.mock("./data/queries/course-tracking.ts", () => {
  return {
    courseTrackingQuery: vi.fn().mockReturnValue(
      Effect.succeed({
        courseId: "c1",
        courseUrl: EXAMPLE_URL,
        status: "IN_PROGRESS",
        userId: "u1"
      })
    )
  };
});

vi.mock("./data/queries/course-trackings.ts", () => {
  return {
    courseTrackingsQuery: vi
      .fn()
      .mockReturnValue(Effect.succeed({ edges: [], pageInfo: {} }))
  };
});

vi.mock("./data/mutations/create-curriculum.ts", () => {
  return {
    createCurriculumMutation: vi.fn().mockResolvedValue({ id: "cur1" })
  };
});

vi.mock("./data/mutations/cycle-course-tracking-status.ts", () => {
  return {
    cycleCourseTrackingStatusMutation: vi.fn().mockResolvedValue({
      courseId: "c1",
      courseUrl: EXAMPLE_URL,
      status: "COMPLETED",
      userId: "u1"
    })
  };
});

vi.mock("./data/queries/curriculums.ts", () => {
  return {
    curriculumQuery: vi
      .fn()
      .mockReturnValue(Effect.succeed(TEST_CURRICULUM_DATA)),
    curriculumsQuery: vi
      .fn()
      .mockReturnValue(Effect.succeed([TEST_CURRICULUM_DATA]))
  };
});

import WorkerClass from "./index.ts";

const createInstance = (environment: Record<string, any> = {}): any => {
  // eslint-disable-next-line unicorn/no-unreadable-new-expression
  const instance = new (WorkerClass as unknown as new () => {
    env: Record<string, unknown>;
  })();
  instance.env = environment;
  return instance;
};

describe("ethang-courses WorkerEntrypoint", () => {
  describe("fetch", () => {
    it("should respond OK on fetch", async () => {
      const instance = createInstance({ ethang_courses: {} });
      const response = await instance.fetch(new Request(`${EXAMPLE_URL}/`));
      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toBe("OK");
    });
  });

  describe("RPC methods", () => {
    it("should expose all RPC methods", () => {
      const instance = createInstance();

      expect(instance.courses).toBeInstanceOf(Function);
      expect(instance.course).toBeInstanceOf(Function);
      expect(instance.courseTracking).toBeInstanceOf(Function);
      expect(instance.courseTrackings).toBeInstanceOf(Function);
      expect(instance.curriculum).toBeInstanceOf(Function);
      expect(instance.curriculums).toBeInstanceOf(Function);
      expect(instance.learningPath).toBeInstanceOf(Function);
      expect(instance.learningPaths).toBeInstanceOf(Function);
      expect(instance.createCurriculum).toBeInstanceOf(Function);
      expect(instance.cycleCourseTrackingStatus).toBeInstanceOf(Function);
      expect(instance.coursesAll).toBeInstanceOf(Function);
    });

    it("courses returns all courses", async () => {
      const instance = createInstance({ ethang_courses: {} });
      const result = await instance.courses();
      expect(result).toEqual([TEST_COURSE_DATA]);
    });

    it("course returns a single course", async () => {
      const instance = createInstance({ ethang_courses: {} });
      const result = await instance.course({ id: "c1" });
      expect(result).toEqual(TEST_COURSE_DATA);
    });

    it("courseTracking returns tracking info", async () => {
      const instance = createInstance({ ethang_courses: {} });
      const result = await instance.courseTracking({
        courseId: "c1",
        userId: "u1"
      });
      expect(result).toEqual({
        courseId: "c1",
        courseUrl: EXAMPLE_URL,
        status: "IN_PROGRESS",
        userId: "u1"
      });
    });

    it("courseTrackings returns paginated trackings", async () => {
      const instance = createInstance({ ethang_courses: {} });
      const result = await instance.courseTrackings({
        after: "cursor1",
        first: 10,
        userId: "u1"
      });
      expect(result).toEqual({ edges: [], pageInfo: {} });
    });

    it("curriculum returns a single curriculum", async () => {
      const instance = createInstance({ ethang_courses: {} });
      const result = await instance.curriculum({ id: "cur1" });
      expect(result).toEqual(TEST_CURRICULUM_DATA);
    });

    it("curriculums returns all curriculums", async () => {
      const instance = createInstance({ ethang_courses: {} });
      const result = await instance.curriculums();
      expect(result).toEqual([TEST_CURRICULUM_DATA]);
    });

    it("createCurriculum creates a new curriculum", async () => {
      const instance = createInstance({ ethang_courses: {} });
      const result = await instance.createCurriculum({
        name: "New Curriculum",
        url: EXAMPLE_URL
      });
      expect(result).toEqual({ id: "cur1" });
    });

    it("cycleCourseTrackingStatus cycles tracking status", async () => {
      const instance = createInstance({ ethang_courses: {} });
      const result = await instance.cycleCourseTrackingStatus({
        courseId: "c1",
        userId: "u1"
      });
      expect(result).toEqual({
        courseId: "c1",
        courseUrl: EXAMPLE_URL,
        status: "COMPLETED",
        userId: "u1"
      });
    });

    it("learningPath returns a single learning path", async () => {
      const instance = createInstance({ ethang_courses: {} });
      const result = await instance.learningPath({ id: "lp1" });
      expect(result).toEqual({ id: "lp1" });
    });

    it("learningPaths returns all learning paths", async () => {
      const instance = createInstance({ ethang_courses: {} });
      const result = await instance.learningPaths();
      expect(result).toEqual([{ id: "lp1" }]);
    });

    it("coursesAll returns all courses with indices and learning path context", async () => {
      const instance = createInstance({ ethang_courses: {} });
      const result = await instance.coursesAll();
      expect(result).toHaveLength(1);
      expect(result[0]).toStrictEqual({
        author: TEST_COURSE_DATA.name,
        courseId: TEST_COURSE_DATA.id,
        courseIndex: 1,
        learningPathId: "lp1",
        learningPathName: "Test LP",
        learningPathOrder: 1,
        name: TEST_COURSE_DATA.name,
        swebokFocus: "testing",
        url: "https://example.com"
      });
    });
  });
});
