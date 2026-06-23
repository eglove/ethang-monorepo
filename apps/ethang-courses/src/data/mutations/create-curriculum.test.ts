import { describe, expect, it, vi } from "vitest";

import type * as schema from "../../db/schema.ts";

const { generateIdMock } = vi.hoisted(() => {
  return {
    generateIdMock: vi.fn().mockReturnValue("curriculum-1")
  };
});

vi.mock("../../db/schema.ts", async (importOriginal) => {
  const original = await importOriginal<typeof schema>();
  return {
    ...original,
    generateId: generateIdMock
  };
});

import { createCurriculumMutation } from "./create-curriculum.ts";

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

describe("createCurriculumMutation", () => {
  it("inserts and returns the new curriculum with no learning paths", async () => {
    // 1. insert curriculumsTable
    const mockCurriculumsInsertResult = {
      returning: vi.fn().mockResolvedValue([mockCurriculumData])
    };

    const mockLPConnectionsInsertResult = {
      values: vi.fn().mockReturnValue(mockCurriculumsInsertResult)
    };

    // 2. select curriculumLearningPathsTable (empty)
    const mockLPConnectionsSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([]),
      where: vi.fn().mockReturnThis()
    };

    const mockDatabase = {
      insert: vi.fn().mockReturnValue(mockLPConnectionsInsertResult),
      select: vi.fn().mockReturnValue(mockLPConnectionsSelectResult)
    };

    // @ts-expect-error test double
    const result = await createCurriculumMutation(mockDatabase, {
      name: TEST_CURRICULUM,
      url: EXAMPLE_CURRICULUM
    });

    expect(result).toStrictEqual({
      ...mockCurriculumData,
      learningPaths: []
    });
    expect(mockDatabase.insert).toHaveBeenCalled();
  });

  it("inserts curriculum, creates learning paths relations, and returns populated object", async () => {
    // 1. select validation check
    const mockValidationSelectResult = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: LP_1 }])
    };

    // 2. insert curriculumsTable statement builder
    const mockCurriculumStatement = {};
    const mockLPInsertResult1 = {
      returning: vi.fn().mockReturnValue(mockCurriculumStatement),
      values: vi.fn().mockReturnThis()
    };

    // 3. insert curriculumLearningPathsTable statement builder
    const mockRelationsStatement = {};
    const mockLPConnectionsInsertResult = {
      values: vi.fn().mockReturnValue(mockRelationsStatement)
    };

    // 4. select curriculumLearningPathsTable (populateCurriculum)
    const mockLPConnectionsSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([{ learningPathId: LP_1 }]),
      where: vi.fn().mockReturnThis()
    };

    // 5. select learningPathsTable
    const mockLPsSelectResult = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockLpData])
    };

    // 6. select learningPathCoursesTable (populateLearningPath)
    const mockCourseConnectionsSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([{ courseId: COURSE_1 }]),
      where: vi.fn().mockReturnThis()
    };

    // 7. select coursesTable
    const mockCoursesSelectResult = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockCourseData])
    };

    const mockDatabase = {
      batch: vi.fn().mockResolvedValue([[mockCurriculumData], []]),
      insert: vi
        .fn()
        .mockReturnValueOnce(mockLPInsertResult1) // insert curriculum
        .mockReturnValueOnce(mockLPConnectionsInsertResult), // insert relations
      select: vi
        .fn()
        .mockReturnValueOnce(mockValidationSelectResult) // select validation check
        .mockReturnValueOnce(mockLPConnectionsSelectResult) // select LP connections
        .mockReturnValueOnce(mockLPsSelectResult) // select LP details
        .mockReturnValueOnce(mockCourseConnectionsSelectResult) // select Course connections
        .mockReturnValueOnce(mockCoursesSelectResult) // select Course details
    };

    // @ts-expect-error test double
    const result = await createCurriculumMutation(mockDatabase, {
      learningPathIds: [LP_1],
      name: TEST_CURRICULUM,
      url: EXAMPLE_CURRICULUM
    });

    expect(result).toStrictEqual({
      ...mockCurriculumData,
      learningPaths: [
        {
          ...mockLpData,
          courses: [mockCourseData]
        }
      ]
    });
    expect(mockDatabase.insert).toHaveBeenCalledTimes(2);
    expect(mockDatabase.select).toHaveBeenCalledTimes(5);
    expect(mockDatabase.batch).toHaveBeenCalledWith([
      mockCurriculumStatement,
      mockRelationsStatement
    ]);
    expect(mockLPConnectionsInsertResult.values).toHaveBeenCalledWith([
      {
        curriculumId: CURRICULUM_1,
        learningPathId: LP_1,
        orderRank: 0
      }
    ]);
  });

  it("throws validation error when supplied learning path ID is invalid", async () => {
    // 1. select validation check returning empty (invalid ID)
    const mockValidationSelectResult = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([])
    };

    const mockDatabase = {
      select: vi.fn().mockReturnValue(mockValidationSelectResult)
    };

    await expect(
      // @ts-expect-error test double
      createCurriculumMutation(mockDatabase, {
        learningPathIds: [LP_1],
        name: TEST_CURRICULUM
      })
    ).rejects.toThrow("The following learning path IDs do not exist: lp-1");
  });

  it("throws an error when insertion fails", async () => {
    const mockCurriculumsInsertResult = {
      returning: vi.fn().mockResolvedValue([])
    };

    const mockLPConnectionsInsertResult = {
      values: vi.fn().mockReturnValue(mockCurriculumsInsertResult)
    };

    const mockDatabase = {
      insert: vi.fn().mockReturnValue(mockLPConnectionsInsertResult)
    };

    await expect(
      // @ts-expect-error test double
      createCurriculumMutation(mockDatabase, {
        name: TEST_CURRICULUM
      })
    ).rejects.toThrow("Failed to create curriculum");
  });
});
