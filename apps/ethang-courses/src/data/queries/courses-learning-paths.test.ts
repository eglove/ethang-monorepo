import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import {
  courseQuery,
  coursesAllQuery,
  coursesQuery,
  learningPathQuery,
  learningPathsQuery
} from "./courses-learning-paths.ts";

const CREATED_AT = "2023-01-01";
const UPDATED_AT = "2023-01-01";
const COURSE_1 = "course-1";
const LP_1 = "lp-1";
const EXAMPLE_COURSE = "https://example.com/course-1";
const TEST_COURSE = "Test Course";
const TEST_AUTHOR = "Test Author";
const TEST_LP = "Test Learning Path";
const TEST_FOCUS = "testing";
const NON_EXISTENT = "non-existent";
const EXAMPLE_LP = "https://example.com/lp-1";

const mockCourseData = {
  author: TEST_AUTHOR,
  createdAt: CREATED_AT,
  id: COURSE_1,
  name: TEST_COURSE,
  updatedAt: UPDATED_AT,
  url: EXAMPLE_COURSE
};

describe("coursesQuery", () => {
  it("returns all courses from the database", async () => {
    const mockSelectResult = {
      from: vi.fn().mockResolvedValue([mockCourseData])
    };
    const mockDatabase = {
      select: vi.fn().mockReturnValue(mockSelectResult)
    };

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      coursesQuery(mockDatabase, null)
    );

    expect(result).toStrictEqual([mockCourseData]);
    expect(mockDatabase.select).toHaveBeenCalled();
    expect(mockSelectResult.from).toHaveBeenCalledWith(expect.any(Object));
  });
});

describe("courseQuery", () => {
  it("returns a specific course by ID", async () => {
    const mockSelectResult = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockCourseData]),
      where: vi.fn().mockReturnThis()
    };
    const mockDatabase = {
      select: vi.fn().mockReturnValue(mockSelectResult)
    };

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      courseQuery(mockDatabase, COURSE_1)
    );

    expect(result).toStrictEqual(mockCourseData);
    expect(mockDatabase.select).toHaveBeenCalled();
    expect(mockSelectResult.from).toHaveBeenCalledWith(expect.any(Object));
    expect(mockSelectResult.where).toHaveBeenCalled();
    expect(mockSelectResult.limit).toHaveBeenCalledWith(1);
  });

  it("returns null when course is not found", async () => {
    const mockSelectResult = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
      where: vi.fn().mockReturnThis()
    };
    const mockDatabase = {
      select: vi.fn().mockReturnValue(mockSelectResult)
    };

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      courseQuery(mockDatabase, NON_EXISTENT)
    );

    expect(result).toBeNull();
  });
});

describe("learningPathsQuery", () => {
  it("returns all learning paths with their courses", async () => {
    const mockLearningPathsSelectResult = {
      from: vi.fn().mockResolvedValue([
        {
          createdAt: CREATED_AT,
          id: LP_1,
          name: TEST_LP,
          swebokFocus: TEST_FOCUS,
          updatedAt: UPDATED_AT,
          url: EXAMPLE_LP
        }
      ])
    };

    const mockLPCoursesSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([{ courseId: COURSE_1 }]),
      where: vi.fn().mockReturnThis()
    };

    const mockCoursesSelectResult = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockCourseData])
    };

    const mockDatabase = {
      select: vi
        .fn()
        .mockReturnValueOnce(mockLearningPathsSelectResult)
        .mockReturnValueOnce(mockLPCoursesSelectResult)
        .mockReturnValueOnce(mockCoursesSelectResult)
    };

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      learningPathsQuery(mockDatabase, null)
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toStrictEqual({
      courses: [mockCourseData],
      createdAt: CREATED_AT,
      id: LP_1,
      name: TEST_LP,
      swebokFocus: TEST_FOCUS,
      updatedAt: UPDATED_AT,
      url: EXAMPLE_LP
    });
  });

  it("returns learning paths with no courses gracefully", async () => {
    const mockLearningPathsSelectResult = {
      from: vi.fn().mockResolvedValue([
        {
          createdAt: CREATED_AT,
          id: LP_1,
          name: TEST_LP,
          swebokFocus: TEST_FOCUS,
          updatedAt: UPDATED_AT,
          url: EXAMPLE_LP
        }
      ])
    };

    const mockLPCoursesSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([]),
      where: vi.fn().mockReturnThis()
    };

    const mockDatabase = {
      select: vi
        .fn()
        .mockReturnValueOnce(mockLearningPathsSelectResult)
        .mockReturnValueOnce(mockLPCoursesSelectResult)
    };

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      learningPathsQuery(mockDatabase, null)
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toStrictEqual({
      courses: [],
      createdAt: CREATED_AT,
      id: LP_1,
      name: TEST_LP,
      swebokFocus: TEST_FOCUS,
      updatedAt: UPDATED_AT,
      url: EXAMPLE_LP
    });
  });
});

describe("learningPathQuery", () => {
  it("returns a specific learning path by ID with its courses", async () => {
    const mockLearningPathSelectResult = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          createdAt: CREATED_AT,
          id: LP_1,
          name: TEST_LP,
          swebokFocus: TEST_FOCUS,
          updatedAt: UPDATED_AT,
          url: EXAMPLE_LP
        }
      ]),
      where: vi.fn().mockReturnThis()
    };

    const mockLPCoursesSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([{ courseId: COURSE_1 }]),
      where: vi.fn().mockReturnThis()
    };

    const mockCoursesSelectResult = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockCourseData])
    };

    const mockDatabase = {
      select: vi
        .fn()
        .mockReturnValueOnce(mockLearningPathSelectResult)
        .mockReturnValueOnce(mockLPCoursesSelectResult)
        .mockReturnValue(mockCoursesSelectResult)
    };

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      learningPathQuery(mockDatabase, LP_1)
    );

    expect(result).toStrictEqual({
      courses: [mockCourseData],
      createdAt: CREATED_AT,
      id: LP_1,
      name: TEST_LP,
      swebokFocus: TEST_FOCUS,
      updatedAt: UPDATED_AT,
      url: EXAMPLE_LP
    });
  });

  it("filters out missing courses", async () => {
    const mockLearningPathsSelectResult = {
      from: vi.fn().mockResolvedValue([
        {
          createdAt: CREATED_AT,
          id: LP_1,
          name: TEST_LP,
          swebokFocus: TEST_FOCUS,
          updatedAt: UPDATED_AT,
          url: EXAMPLE_LP
        }
      ])
    };

    const mockLPCoursesSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([{ courseId: COURSE_1 }]),
      where: vi.fn().mockReturnThis()
    };

    const mockCoursesSelectResult = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([])
    };

    const mockDatabase = {
      select: vi
        .fn()
        .mockReturnValueOnce(mockLearningPathsSelectResult)
        .mockReturnValueOnce(mockLPCoursesSelectResult)
        .mockReturnValue(mockCoursesSelectResult)
    };

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      learningPathsQuery(mockDatabase, null)
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toStrictEqual({
      courses: [],
      createdAt: CREATED_AT,
      id: LP_1,
      name: TEST_LP,
      swebokFocus: TEST_FOCUS,
      updatedAt: UPDATED_AT,
      url: EXAMPLE_LP
    });
  });

  it("returns a specific learning path with no courses gracefully", async () => {
    const mockLearningPathSelectResult = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          createdAt: CREATED_AT,
          id: LP_1,
          name: TEST_LP,
          swebokFocus: TEST_FOCUS,
          updatedAt: UPDATED_AT,
          url: EXAMPLE_LP
        }
      ]),
      where: vi.fn().mockReturnThis()
    };

    const mockLPCoursesSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([]),
      where: vi.fn().mockReturnThis()
    };

    const mockDatabase = {
      select: vi
        .fn()
        .mockReturnValueOnce(mockLearningPathSelectResult)
        .mockReturnValueOnce(mockLPCoursesSelectResult)
    };

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      learningPathQuery(mockDatabase, LP_1)
    );

    expect(result).toStrictEqual({
      courses: [],
      createdAt: CREATED_AT,
      id: LP_1,
      name: TEST_LP,
      swebokFocus: TEST_FOCUS,
      updatedAt: UPDATED_AT,
      url: EXAMPLE_LP
    });
  });

  it("returns null when learning path is not found", async () => {
    const mockSelectResult = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
      where: vi.fn().mockReturnThis()
    };
    const mockDatabase = {
      select: vi.fn().mockReturnValue(mockSelectResult)
    };

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      learningPathQuery(mockDatabase, "non-existent")
    );

    expect(result).toBeNull();
  });
});

describe("coursesAllQuery", () => {
  it("returns all courses with learning path context", async () => {
    const mockLPCSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi
        .fn()
        .mockResolvedValue([
          { courseId: COURSE_1, learningPathId: LP_1, orderRank: 1 }
        ]),
      where: vi.fn().mockReturnThis()
    };

    const mockCoursesSelectResult = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockCourseData])
    };

    const mockLPSelectResult = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          createdAt: CREATED_AT,
          id: LP_1,
          name: TEST_LP,
          swebokFocus: TEST_FOCUS,
          updatedAt: UPDATED_AT,
          url: EXAMPLE_LP
        }
      ])
    };

    const mockDatabase = {
      select: vi
        .fn()
        .mockReturnValueOnce(mockLPCSelectResult)
        .mockReturnValueOnce(mockCoursesSelectResult)
        .mockReturnValueOnce(mockLPSelectResult)
    };

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      coursesAllQuery(mockDatabase, null)
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toStrictEqual({
      author: TEST_AUTHOR,
      courseId: COURSE_1,
      courseIndex: 1,
      learningPathId: LP_1,
      learningPathName: TEST_LP,
      learningPathOrder: 1,
      name: TEST_COURSE,
      swebokFocus: TEST_FOCUS,
      url: EXAMPLE_COURSE
    });
  });

  it("returns empty array when no learning path courses exist", async () => {
    const mockLPCSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([]),
      where: vi.fn().mockReturnThis()
    };

    const mockDatabase = {
      select: vi.fn().mockReturnValue(mockLPCSelectResult)
    };

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      coursesAllQuery(mockDatabase, null)
    );

    expect(result).toStrictEqual([]);
  });

  it("filters out entries where the course is not found in courseMap", async () => {
    const mockLPCSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([
        { courseId: COURSE_1, learningPathId: LP_1, orderRank: 1 },
        { courseId: "missing-course", learningPathId: LP_1, orderRank: 2 }
      ]),
      where: vi.fn().mockReturnThis()
    };

    const mockCoursesSelectResult = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockCourseData])
    };

    const mockLPSelectResult = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          createdAt: CREATED_AT,
          id: LP_1,
          name: TEST_LP,
          swebokFocus: TEST_FOCUS,
          updatedAt: UPDATED_AT,
          url: EXAMPLE_LP
        }
      ])
    };

    const mockDatabase = {
      select: vi
        .fn()
        .mockReturnValueOnce(mockLPCSelectResult)
        .mockReturnValueOnce(mockCoursesSelectResult)
        .mockReturnValueOnce(mockLPSelectResult)
    };

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      coursesAllQuery(mockDatabase, null)
    );

    expect(result).toHaveLength(1);
    expect(result[0].courseId).toBe(COURSE_1);
  });

  it("handles missing learning path gracefully (null name/swebokFocus)", async () => {
    const mockLPCSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi
        .fn()
        .mockResolvedValue([
          { courseId: COURSE_1, learningPathId: "missing-lp", orderRank: 1 }
        ]),
      where: vi.fn().mockReturnThis()
    };

    const mockCoursesSelectResult = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockCourseData])
    };

    const mockLPSelectResult = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([])
    };

    const mockDatabase = {
      select: vi
        .fn()
        .mockReturnValueOnce(mockLPCSelectResult)
        .mockReturnValueOnce(mockCoursesSelectResult)
        .mockReturnValueOnce(mockLPSelectResult)
    };

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      coursesAllQuery(mockDatabase, null)
    );

    expect(result).toHaveLength(1);
    expect(result[0].courseId).toBe(COURSE_1);
    expect(result[0].learningPathName).toBeNull();
    expect(result[0].swebokFocus).toBeNull();
  });
});
