import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

const { EXAMPLE_URL, TEST_COURSE_DATA, TEST_CURRICULUM_DATA } = vi.hoisted(
  () => {
    return {
      EXAMPLE_URL: "https://example.com",
      TEST_COURSE_DATA: { id: "c1", name: "Test Course" } as const,
      TEST_CURRICULUM_DATA: {
        id: "cur1",
        name: "Test Curriculum"
      } as const
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
    coursesAllQuery: vi
      .fn()
      .mockReturnValue(Effect.succeed([TEST_COURSE_DATA])),
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

const CACHE_CONTROL_HEADER = "Cache-Control";
const CACHE_TAG_HEADER = "Cache-Tag";
const PUBLIC_CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=3600";
const PRIVATE_CACHE_CONTROL = "private, no-store";
const NO_STORE_CACHE_CONTROL = "no-store";

const createInstance = (environment: Record<string, any> = {}): any => {
  const initializer = WorkerClass as unknown as new () => {
    env: Record<string, unknown>;
  };

  const instance = new initializer();
  instance.env = environment;
  return instance;
};

const callRpc = async (
  instance: unknown,
  method: string,
  parameters: unknown
): Promise<Response> => {
  const worker = instance as Record<
    string,
    ((arguments_: unknown) => Promise<Response>) | undefined
  >;
  const rpcMethod = worker[method];
  if (!rpcMethod) {
    throw new Error(`Missing RPC method: ${method}`);
  }
  return rpcMethod.call(instance, parameters);
};

describe("cache headers", () => {
  describe("public read methods", () => {
    it.each([
      {
        expectedTags: ["courses", "course:c1"],
        expectedTagsString: "courses, course:c1",
        method: "course",
        parameters: { id: "c1" }
      },
      {
        expectedTags: ["courses"],
        expectedTagsString: "courses",
        method: "courses",
        parameters: {}
      },
      {
        expectedTags: ["courses"],
        expectedTagsString: "courses",
        method: "coursesAll",
        parameters: {}
      },
      {
        expectedTags: ["curriculums", "curriculum:cur1"],
        expectedTagsString: "curriculums, curriculum:cur1",
        method: "curriculum",
        parameters: { id: "cur1" }
      },
      {
        expectedTags: ["curriculums"],
        expectedTagsString: "curriculums",
        method: "curriculums",
        parameters: {}
      },
      {
        expectedTags: ["learningPaths", "learningPath:lp1"],
        expectedTagsString: "learningPaths, learningPath:lp1",
        method: "learningPath",
        parameters: { id: "lp1" }
      },
      {
        expectedTags: ["learningPaths"],
        expectedTagsString: "learningPaths",
        method: "learningPaths",
        parameters: {}
      }
    ])(
      "sets public cache headers for $method",
      async ({ expectedTags, expectedTagsString, method, parameters }) => {
        const instance = createInstance({ ethang_courses: {} });
        const response = await callRpc(instance, method, parameters);

        expect(response).toBeInstanceOf(Response);
        expect(response.headers.get(CACHE_CONTROL_HEADER)).toBe(
          PUBLIC_CACHE_CONTROL
        );
        expect(response.headers.get(CACHE_TAG_HEADER)).toBe(expectedTagsString);
        expect(expectedTags.length).toBeGreaterThan(0);
      }
    );
  });

  describe("per-user methods", () => {
    it.each([
      {
        method: "courseTracking",
        parameters: { courseId: "c1", userId: "u1" }
      },
      {
        method: "courseTrackings",
        parameters: {
          after: "cursor1",
          first: 10,
          userId: "u1"
        }
      }
    ])(
      "sets private, no-store cache headers for $method",
      async ({ method, parameters }) => {
        const instance = createInstance({ ethang_courses: {} });
        const response = await callRpc(instance, method, parameters);

        expect(response).toBeInstanceOf(Response);
        expect(response.headers.get(CACHE_CONTROL_HEADER)).toBe(
          PRIVATE_CACHE_CONTROL
        );
      }
    );
  });

  describe("mutations", () => {
    it.each([
      {
        method: "createCurriculum",
        parameters: { name: "New Curriculum", url: EXAMPLE_URL }
      },
      {
        method: "cycleCourseTrackingStatus",
        parameters: { courseId: "c1", userId: "u1" }
      }
    ])(
      "sets no-store cache headers for $method",
      async ({ method, parameters }) => {
        const instance = createInstance({ ethang_courses: {} });
        const response = await callRpc(instance, method, parameters);

        expect(response).toBeInstanceOf(Response);
        expect(response.headers.get(CACHE_CONTROL_HEADER)).toBe(
          NO_STORE_CACHE_CONTROL
        );
      }
    );
  });

  describe("health check", () => {
    it("fetch stays uncached", async () => {
      const instance = createInstance({ ethang_courses: {} });
      const response = await instance.fetch(new Request(`${EXAMPLE_URL}/`));
      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toBe("OK");
    });
  });
});
