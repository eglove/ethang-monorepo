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
      from: vi.fn().mockResolvedValue([mockCourseData])
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
      from: vi.fn().mockResolvedValue([mockCourseData])
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
      from: vi.fn().mockResolvedValue([])
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
  const mockCurriculumLPSelectResult = {
    from: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([
      { curriculumId: "cur-1", learningPathId: LP_1, orderRank: 1 }
    ]),
    where: vi.fn().mockReturnThis()
  };

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
      from: vi.fn().mockResolvedValue([mockCourseData])
    };

    const mockLPSelectResult = {
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

    const mockDatabase = {
      select: vi
        .fn()
        .mockReturnValueOnce(mockLPCSelectResult)
        .mockReturnValueOnce(mockCoursesSelectResult)
        .mockReturnValueOnce(mockLPSelectResult)
        .mockReturnValue(mockCurriculumLPSelectResult)
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
      learningPathUrl: EXAMPLE_LP,
      name: TEST_COURSE,
      swebokFocus: TEST_FOCUS,
      updatedAt: UPDATED_AT,
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
      from: vi.fn().mockResolvedValue([mockCourseData])
    };

    const mockLPSelectResult = {
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

    const mockDatabase = {
      select: vi
        .fn()
        .mockReturnValueOnce(mockLPCSelectResult)
        .mockReturnValueOnce(mockCoursesSelectResult)
        .mockReturnValueOnce(mockLPSelectResult)
        .mockReturnValue(mockCurriculumLPSelectResult)
    };

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      coursesAllQuery(mockDatabase, null)
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.courseId).toBe(COURSE_1);
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
      from: vi.fn().mockResolvedValue([mockCourseData])
    };

    const mockLPSelectResult = {
      from: vi.fn().mockResolvedValue([])
    };

    const mockDatabase = {
      select: vi
        .fn()
        .mockReturnValueOnce(mockLPCSelectResult)
        .mockReturnValueOnce(mockCoursesSelectResult)
        .mockReturnValueOnce(mockLPSelectResult)
        .mockReturnValue({
          from: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue([]),
          where: vi.fn().mockReturnThis()
        })
    };

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      coursesAllQuery(mockDatabase, null)
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.courseId).toBe(COURSE_1);
    expect(result[0]?.learningPathName).toBeNull();
    expect(result[0]?.swebokFocus).toBeNull();
  });

  it("sorts courses by curriculum learning path order and then course orderRank", async () => {
    const LP_2 = "lp-2";
    const LP_3 = "lp-3";

    const mockLearningPathCourses = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([
        { courseId: "c3", learningPathId: LP_3, orderRank: 1 },
        { courseId: "c3b", learningPathId: LP_3, orderRank: 2 },
        { courseId: "c1", learningPathId: LP_1, orderRank: 1 },
        { courseId: "c2", learningPathId: LP_2, orderRank: 1 }
      ]),
      where: vi.fn().mockReturnThis()
    };

    const mockCoursesData = [
      { author: "Author", createdAt: CREATED_AT, id: "c1", name: "Course 1", updatedAt: UPDATED_AT, url: "https://example.com/c1" },
      { author: "Author", createdAt: CREATED_AT, id: "c2", name: "Course 2", updatedAt: UPDATED_AT, url: "https://example.com/c2" },
      { author: "Author", createdAt: CREATED_AT, id: "c3", name: "Course 3", updatedAt: UPDATED_AT, url: "https://example.com/c3" },
      { author: "Author", createdAt: CREATED_AT, id: "c3b", name: "Course 3b", updatedAt: UPDATED_AT, url: "https://example.com/c3b" }
    ];

    const mockCoursesSelectResult = {
      from: vi.fn().mockResolvedValue(mockCoursesData)
    };

    const mockLPRecords = [
      { createdAt: CREATED_AT, id: LP_1, name: "LP 1", swebokFocus: "construction", updatedAt: UPDATED_AT, url: null },
      { createdAt: CREATED_AT, id: LP_2, name: "LP 2", swebokFocus: "design", updatedAt: UPDATED_AT, url: null },
      { createdAt: CREATED_AT, id: LP_3, name: "LP 3", swebokFocus: "testing", updatedAt: UPDATED_AT, url: null }
    ];

    const mockLPSelectResult = {
      from: vi.fn().mockResolvedValue(mockLPRecords)
    };

    // Curriculum ordering: LP_3 at orderRank 2, LP_1 at orderRank 0, LP_2 at orderRank 1
    const mockCurriculumsData = [
      { curriculumId: "cur-1", learningPathId: LP_1, orderRank: 0 },
      { curriculumId: "cur-1", learningPathId: LP_2, orderRank: 1 },
      { curriculumId: "cur-1", learningPathId: LP_3, orderRank: 2 }
    ];

    const mockCurriculumSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue(mockCurriculumsData),
      where: vi.fn().mockReturnThis()
    };

    const mockDatabase = {
      select: vi
        .fn()
        .mockReturnValueOnce(mockLearningPathCourses)
        .mockReturnValueOnce(mockCoursesSelectResult)
        .mockReturnValueOnce(mockLPSelectResult)
        .mockReturnValue(mockCurriculumSelectResult)
    };

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      coursesAllQuery(mockDatabase, null)
    );

    expect(result).toHaveLength(4);

    // LP_1 (orderRank 0) comes first: c1
    expect(result[0]?.courseId).toBe("c1");
    expect(result[0]?.courseIndex).toBe(1);
    // LP_2 (orderRank 1) comes second: c2
    expect(result[1]?.courseId).toBe("c2");
    expect(result[1]?.courseIndex).toBe(2);
    // LP_3 (orderRank 2) comes third: c3, c3b
    expect(result[2]?.courseId).toBe("c3");
    expect(result[2]?.courseIndex).toBe(3);
    expect(result[3]?.courseId).toBe("c3b");
    expect(result[3]?.courseIndex).toBe(4);
  });
});
