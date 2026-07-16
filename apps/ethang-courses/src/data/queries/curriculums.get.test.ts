import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import {
  COURSE_1,
  CURRICULUM_1,
  LP_1,
  makeSelectMock,
  mockCourseData,
  mockCurriculumData,
  mockLpData,
  mockLpDataWithoutUrl,
  MockSelectChain
} from "./curriculums.test-fixtures.ts";
import { curriculumQuery } from "./curriculums.ts";

describe("curriculumQuery", () => {
  it("returns a specific curriculum by ID with populated learning paths and courses", async () => {
    const mockCurriculumSelectResult: MockSelectChain = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockCurriculumData]),
      where: vi.fn().mockReturnThis()
    };
    const mockLPConnectionsSelectResult: MockSelectChain = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([{ learningPathId: LP_1 }]),
      where: vi.fn().mockReturnThis()
    };
    const mockLPsSelectResult: MockSelectChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockLpData])
    };
    const mockCourseConnectionsSelectResult: MockSelectChain = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([{ courseId: COURSE_1 }]),
      where: vi.fn().mockReturnThis()
    };
    const mockCoursesSelectResult: MockSelectChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockCourseData])
    };

    const mockDatabase = makeSelectMock([
      mockCurriculumSelectResult,
      mockLPConnectionsSelectResult,
      mockLPsSelectResult,
      mockCourseConnectionsSelectResult,
      mockCoursesSelectResult
    ]);

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      curriculumQuery(mockDatabase, CURRICULUM_1)
    );

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
    const mockCurriculumSelectResult: MockSelectChain = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockCurriculumData]),
      where: vi.fn().mockReturnThis()
    };
    const mockLPConnectionsSelectResult: MockSelectChain = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([{ learningPathId: LP_1 }]),
      where: vi.fn().mockReturnThis()
    };
    const mockLPsSelectResult: MockSelectChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([])
    };

    const mockDatabase = makeSelectMock([
      mockCurriculumSelectResult,
      mockLPConnectionsSelectResult,
      mockLPsSelectResult
    ]);

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      curriculumQuery(mockDatabase, CURRICULUM_1)
    );

    expect(result).toStrictEqual({
      ...mockCurriculumData,
      learningPaths: []
    });
  });

  it("handles curriculum with no learning paths gracefully", async () => {
    const mockCurriculumSelectResult: MockSelectChain = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockCurriculumData]),
      where: vi.fn().mockReturnThis()
    };
    const mockLPConnectionsSelectResult: MockSelectChain = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([]),
      where: vi.fn().mockReturnThis()
    };

    const mockDatabase = makeSelectMock([
      mockCurriculumSelectResult,
      mockLPConnectionsSelectResult
    ]);

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      curriculumQuery(mockDatabase, CURRICULUM_1)
    );

    expect(result).toStrictEqual({
      ...mockCurriculumData,
      learningPaths: []
    });
  });

  it("returns null when curriculum is not found", async () => {
    const mockSelectResult: MockSelectChain = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
      where: vi.fn().mockReturnThis()
    };

    const mockDatabase = { select: vi.fn().mockReturnValue(mockSelectResult) };

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      curriculumQuery(mockDatabase, "non-existent")
    );

    expect(result).toBeNull();
  });

  it("coerces null learning path URL to null in the populated result", async () => {
    const mockCurriculumSelectResult: MockSelectChain = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockCurriculumData]),
      where: vi.fn().mockReturnThis()
    };
    const mockLPConnectionsSelectResult: MockSelectChain = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([{ learningPathId: LP_1 }]),
      where: vi.fn().mockReturnThis()
    };
    const mockLPsSelectResult: MockSelectChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockLpDataWithoutUrl])
    };
    const mockCourseConnectionsSelectResult: MockSelectChain = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([]),
      where: vi.fn().mockReturnThis()
    };

    const mockDatabase = makeSelectMock([
      mockCurriculumSelectResult,
      mockLPConnectionsSelectResult,
      mockLPsSelectResult,
      mockCourseConnectionsSelectResult
    ]);

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      curriculumQuery(mockDatabase, CURRICULUM_1)
    );

    expect(result).toStrictEqual({
      ...mockCurriculumData,
      learningPaths: [
        {
          ...mockLpDataWithoutUrl,
          courses: []
        }
      ]
    });
    expect(result?.learningPaths[0]?.url).toBeNull();
  });

  it("coerces null curriculum URL to null in curriculumQuery results", async () => {
    const mockCurriculumSelectResult: MockSelectChain = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          createdAt: mockCurriculumData.createdAt,
          id: mockCurriculumData.id,
          name: mockCurriculumData.name,
          updatedAt: mockCurriculumData.updatedAt,
          url: null
        }
      ]),
      where: vi.fn().mockReturnThis()
    };
    const mockLPConnectionsSelectResult: MockSelectChain = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([]),
      where: vi.fn().mockReturnThis()
    };

    const mockDatabase = makeSelectMock([
      mockCurriculumSelectResult,
      mockLPConnectionsSelectResult
    ]);

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      curriculumQuery(mockDatabase, CURRICULUM_1)
    );

    expect(result?.url).toBeNull();
  });
});
