import { describe, expect, it, vi } from "vitest";

import { curriculumQuery, curriculumsQuery } from "./curriculums.ts";

const CREATED_AT = "2023-01-01";
const UPDATED_AT = "2023-01-01";
const COURSE_1 = "course-1";
const LP_1 = "lp-1";
const CURRICULUM_1 = "curriculum-1";
const TEST_COURSE = "Test Course";
const TEST_AUTHOR = "Test Author";
const EXAMPLE_COURSE = "https://example.com/course-1";
const TEST_LP = "Test Learning Path";
const TEST_FOCUS = "testing";
const EXAMPLE_LP = "https://example.com/lp-1";
const TEST_CURRICULUM = "Test Curriculum";
const EXAMPLE_CURRICULUM = "https://example.com/curriculum-1";

const mockCourseData = {
  author: TEST_AUTHOR,
  createdAt: CREATED_AT,
  id: COURSE_1,
  name: TEST_COURSE,
  updatedAt: UPDATED_AT,
  url: EXAMPLE_COURSE
};

const mockLpData = {
  createdAt: CREATED_AT,
  id: LP_1,
  name: TEST_LP,
  swebokFocus: TEST_FOCUS,
  updatedAt: UPDATED_AT,
  url: EXAMPLE_LP
};

const mockCurriculumData = {
  createdAt: CREATED_AT,
  id: CURRICULUM_1,
  name: TEST_CURRICULUM,
  updatedAt: UPDATED_AT,
  url: EXAMPLE_CURRICULUM
};

describe("curriculumsQuery", () => {
  it("returns all curriculums with their learning paths and courses", async () => {
    const mockCurriculumsSelectResult = {
      from: vi.fn().mockResolvedValue([mockCurriculumData])
    };

    const mockLPConnectionsSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([{ learningPathId: LP_1 }]),
      where: vi.fn().mockReturnThis()
    };

    const mockLPsSelectResult = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockLpData])
    };

    const mockCourseConnectionsSelectResult = {
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
        .mockReturnValueOnce(mockCurriculumsSelectResult) // Fetch curriculums
        .mockReturnValueOnce(mockLPConnectionsSelectResult) // Fetch learning paths for curriculum
        .mockReturnValueOnce(mockLPsSelectResult) // Fetch actual learning paths details
        .mockReturnValueOnce(mockCourseConnectionsSelectResult) // Fetch courses for learning path
        .mockReturnValueOnce(mockCoursesSelectResult) // Fetch actual courses details
    };

    // @ts-expect-error test double
    const result = await curriculumsQuery(mockDatabase);

    expect(result).toHaveLength(1);
    expect(result[0]).toStrictEqual({
      ...mockCurriculumData,
      learningPaths: [
        {
          ...mockLpData,
          courses: [mockCourseData]
        }
      ]
    });
  });

  it("handles curriculum with no learning paths gracefully", async () => {
    const mockCurriculumsSelectResult = {
      from: vi.fn().mockResolvedValue([mockCurriculumData])
    };

    const mockLPConnectionsSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([]), // No learning paths
      where: vi.fn().mockReturnThis()
    };

    const mockDatabase = {
      select: vi
        .fn()
        .mockReturnValueOnce(mockCurriculumsSelectResult)
        .mockReturnValueOnce(mockLPConnectionsSelectResult)
    };

    // @ts-expect-error test double
    const result = await curriculumsQuery(mockDatabase);

    expect(result).toHaveLength(1);
    expect(result[0]).toStrictEqual({
      ...mockCurriculumData,
      learningPaths: []
    });
  });

  it("handles curriculum with a learning path that has no courses", async () => {
    const mockCurriculumsSelectResult = {
      from: vi.fn().mockResolvedValue([mockCurriculumData])
    };

    const mockLPConnectionsSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([{ learningPathId: LP_1 }]),
      where: vi.fn().mockReturnThis()
    };

    const mockLPsSelectResult = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockLpData])
    };

    const mockCourseConnectionsSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([]),
      where: vi.fn().mockReturnThis()
    };

    const mockDatabase = {
      select: vi
        .fn()
        .mockReturnValueOnce(mockCurriculumsSelectResult)
        .mockReturnValueOnce(mockLPConnectionsSelectResult)
        .mockReturnValueOnce(mockLPsSelectResult)
        .mockReturnValueOnce(mockCourseConnectionsSelectResult)
    };

    // @ts-expect-error test double
    const result = await curriculumsQuery(mockDatabase);

    expect(result).toHaveLength(1);
    expect(result[0]).toStrictEqual({
      ...mockCurriculumData,
      learningPaths: [
        {
          ...mockLpData,
          courses: []
        }
      ]
    });
  });
});

describe("curriculumQuery", () => {
  it("returns a specific curriculum by ID with populated learning paths and courses", async () => {
    const mockCurriculumSelectResult = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockCurriculumData]),
      where: vi.fn().mockReturnThis()
    };

    const mockLPConnectionsSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([{ learningPathId: LP_1 }]),
      where: vi.fn().mockReturnThis()
    };

    const mockLPsSelectResult = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockLpData])
    };

    const mockCourseConnectionsSelectResult = {
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
        .mockReturnValueOnce(mockCurriculumSelectResult) // Fetch curriculum by ID
        .mockReturnValueOnce(mockLPConnectionsSelectResult) // Fetch learning paths connections
        .mockReturnValueOnce(mockLPsSelectResult) // Fetch actual learning path details
        .mockReturnValueOnce(mockCourseConnectionsSelectResult) // Fetch course connections for learning path
        .mockReturnValueOnce(mockCoursesSelectResult) // Fetch actual course details
    };

    // @ts-expect-error test double
    const result = await curriculumQuery(mockDatabase, { id: CURRICULUM_1 });

    expect(result).toStrictEqual({
      ...mockCurriculumData,
      learningPaths: [
        {
          ...mockLpData,
          courses: [mockCourseData]
        }
      ]
    });
  });

  it("filters out undefined learning paths if they are missing in the DB", async () => {
    const mockCurriculumSelectResult = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockCurriculumData]),
      where: vi.fn().mockReturnThis()
    };

    const mockLPConnectionsSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([{ learningPathId: LP_1 }]),
      where: vi.fn().mockReturnThis()
    };

    const mockLPsSelectResult = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]) // Simulate missing learning path in database
    };

    const mockDatabase = {
      select: vi
        .fn()
        .mockReturnValueOnce(mockCurriculumSelectResult)
        .mockReturnValueOnce(mockLPConnectionsSelectResult)
        .mockReturnValueOnce(mockLPsSelectResult)
    };

    // @ts-expect-error test double
    const result = await curriculumQuery(mockDatabase, { id: CURRICULUM_1 });

    expect(result).toStrictEqual({
      ...mockCurriculumData,
      learningPaths: []
    });
  });

  it("handles curriculum with no learning paths gracefully", async () => {
    const mockCurriculumSelectResult = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockCurriculumData]),
      where: vi.fn().mockReturnThis()
    };

    const mockLPConnectionsSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([]), // No learning paths
      where: vi.fn().mockReturnThis()
    };

    const mockDatabase = {
      select: vi
        .fn()
        .mockReturnValueOnce(mockCurriculumSelectResult)
        .mockReturnValueOnce(mockLPConnectionsSelectResult)
    };

    // @ts-expect-error test double
    const result = await curriculumQuery(mockDatabase, { id: CURRICULUM_1 });

    expect(result).toStrictEqual({
      ...mockCurriculumData,
      learningPaths: []
    });
  });

  it("returns null when curriculum is not found", async () => {
    const mockSelectResult = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
      where: vi.fn().mockReturnThis()
    };
    const mockDatabase = {
      select: vi.fn().mockReturnValue(mockSelectResult)
    };

    // @ts-expect-error test double
    const result = await curriculumQuery(mockDatabase, { id: "non-existent" });

    expect(result).toBeNull();
  });
});
