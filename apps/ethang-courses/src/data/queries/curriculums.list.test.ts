import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import {
  COURSE_1,
  LP_1,
  makeSelectMock,
  mockCourseData,
  mockCurriculumData,
  mockCurriculumDataWithoutUrl,
  mockLpData,
  mockLpDataWithoutUrl,
  MockSelectChain
} from "./curriculums.test-fixtures.ts";
import { curriculumsQuery } from "./curriculums.ts";

describe("curriculumsQuery", () => {
  it("returns all curriculums with their learning paths and courses", async () => {
    const mockCurriculumsSelectResult: MockSelectChain = {
      from: vi.fn().mockResolvedValue([mockCurriculumData])
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
      mockCurriculumsSelectResult,
      mockLPConnectionsSelectResult,
      mockLPsSelectResult,
      mockCourseConnectionsSelectResult,
      mockCoursesSelectResult
    ]);

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      curriculumsQuery(mockDatabase, null)
    );

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
    const mockCurriculumsSelectResult: MockSelectChain = {
      from: vi.fn().mockResolvedValue([mockCurriculumData])
    };
    const mockLPConnectionsSelectResult: MockSelectChain = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([]),
      where: vi.fn().mockReturnThis()
    };

    const mockDatabase = makeSelectMock([
      mockCurriculumsSelectResult,
      mockLPConnectionsSelectResult
    ]);

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      curriculumsQuery(mockDatabase, null)
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toStrictEqual({
      ...mockCurriculumData,
      learningPaths: []
    });
  });

  it("handles curriculum with a learning path that has no courses", async () => {
    const mockCurriculumsSelectResult: MockSelectChain = {
      from: vi.fn().mockResolvedValue([mockCurriculumData])
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
      orderBy: vi.fn().mockResolvedValue([]),
      where: vi.fn().mockReturnThis()
    };

    const mockDatabase = makeSelectMock([
      mockCurriculumsSelectResult,
      mockLPConnectionsSelectResult,
      mockLPsSelectResult,
      mockCourseConnectionsSelectResult
    ]);

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      curriculumsQuery(mockDatabase, null)
    );

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

  it("coerces a null LP URL into a null url on the populated LP", async () => {
    const mockCurriculumsSelectResult: MockSelectChain = {
      from: vi.fn().mockResolvedValue([mockCurriculumData])
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
      mockCurriculumsSelectResult,
      mockLPConnectionsSelectResult,
      mockLPsSelectResult,
      mockCourseConnectionsSelectResult
    ]);

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      curriculumsQuery(mockDatabase, null)
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.learningPaths[0]?.url).toBeNull();
  });

  it("coerces a null curriculum URL to null in curriculumsQuery results", async () => {
    const mockCurriculumsSelectResult: MockSelectChain = {
      from: vi.fn().mockResolvedValue([mockCurriculumDataWithoutUrl])
    };
    const mockLPConnectionsSelectResult: MockSelectChain = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([]),
      where: vi.fn().mockReturnThis()
    };

    const mockDatabase = makeSelectMock([
      mockCurriculumsSelectResult,
      mockLPConnectionsSelectResult
    ]);

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      curriculumsQuery(mockDatabase, null)
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.url).toBeNull();
  });

  it("returns an empty array when curriculumsQuery finds no rows", async () => {
    const mockCurriculumsSelectResult: MockSelectChain = {
      from: vi.fn().mockResolvedValue([])
    };

    const mockDatabase = makeSelectMock([mockCurriculumsSelectResult]);

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      curriculumsQuery(mockDatabase, null)
    );

    expect(result).toStrictEqual([]);
  });
});
