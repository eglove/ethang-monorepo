import { describe, expect, it, vi } from "vitest";

import {
  courseQuery,
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

    // @ts-expect-error test double
    const resolver = coursesQuery(mockDatabase);
    const result = await resolver();

    expect(result).toStrictEqual([mockCourseData]);
    expect(mockDatabase.select).toHaveBeenCalled();
    expect(mockSelectResult.from).toHaveBeenCalledWith(expect.any(Object)); // coursesTable
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

    // @ts-expect-error test double
    const resolver = courseQuery(mockDatabase);
    const result = await resolver({}, { id: COURSE_1 });

    expect(result).toStrictEqual(mockCourseData);
    expect(mockDatabase.select).toHaveBeenCalled();
    expect(mockSelectResult.from).toHaveBeenCalledWith(expect.any(Object)); // coursesTable
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

    // @ts-expect-error test double
    const resolver = courseQuery(mockDatabase);
    const result = await resolver({}, { id: NON_EXISTENT });

    expect(result).toBeNull();
  });
});

describe("learningPathsQuery", () => {
  it("returns all learning paths with their courses", async () => {
    // Mock the learning paths query result
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

    // Mock the learning path courses query result
    const mockLPCoursesSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([{ courseId: COURSE_1 }]),
      where: vi.fn().mockReturnThis()
    };

    // Mock the courses query result
    const mockCoursesSelectResult = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockCourseData])
    };

    const mockDatabase = {
      select: vi
        .fn()
        .mockReturnValueOnce(mockLearningPathsSelectResult) // First call for learning paths
        .mockReturnValueOnce(mockLPCoursesSelectResult) // Second call for learning path courses
        .mockReturnValueOnce(mockCoursesSelectResult) // Third call for courses
        .mockReturnValue(mockCoursesSelectResult) // Additional calls for courses
    };

    // @ts-expect-error test double
    const resolver = learningPathsQuery(mockDatabase);
    const result = await resolver();

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

    // @ts-expect-error test double
    const resolver = learningPathsQuery(mockDatabase);
    const result = await resolver();

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
    // Mock getting the learning path
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

    // Mock the learning path courses query
    const mockLPCoursesSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([{ courseId: COURSE_1 }]),
      where: vi.fn().mockReturnThis()
    };

    // Mock the courses query
    const mockCoursesSelectResult = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockCourseData])
    };

    const mockDatabase = {
      select: vi
        .fn()
        .mockReturnValueOnce(mockLearningPathSelectResult) // First call for learning path
        .mockReturnValueOnce(mockLPCoursesSelectResult) // Second call for learning path courses
        .mockReturnValue(mockCoursesSelectResult) // Third call for courses
    };

    // @ts-expect-error test double
    const resolver = learningPathQuery(mockDatabase);
    const result = await resolver({}, { id: LP_1 });

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
    // Mock the learning paths query result
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

    // Mock the learning path courses query result
    const mockLPCoursesSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([{ courseId: COURSE_1 }]),
      where: vi.fn().mockReturnThis()
    };

    // Mock the courses query result - RETURN EMPTY (simulating a missing course)
    const mockCoursesSelectResult = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([])
    };

    const mockDatabase = {
      select: vi
        .fn()
        .mockReturnValueOnce(mockLearningPathsSelectResult) // First call for learning paths
        .mockReturnValueOnce(mockLPCoursesSelectResult) // Second call for learning path courses
        .mockReturnValue(mockCoursesSelectResult) // Third call for courses
    };

    // @ts-expect-error test double
    const resolver = learningPathsQuery(mockDatabase);
    const result = await resolver();

    expect(result).toHaveLength(1);
    expect(result[0]).toStrictEqual({
      courses: [], // Should be empty because course wasn't found
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

    // @ts-expect-error test double
    const resolver = learningPathQuery(mockDatabase);
    const result = await resolver({}, { id: LP_1 });

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

    // @ts-expect-error test double
    const resolver = learningPathQuery(mockDatabase);
    const result = await resolver({}, { id: "non-existent" });

    expect(result).toBeNull();
  });
});
