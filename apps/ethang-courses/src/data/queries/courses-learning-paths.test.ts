import { Effect } from "effect";
import map from "lodash/map.js";
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
const EXAMPLE_COURSE_2 = "https://example.com/course-2";
const EXAMPLE_COURSE_3 = "https://example.com/course-3";
const TEST_COURSE = "Test Course";
const TEST_COURSE_2 = "Test Course 2";
const TEST_COURSE_3 = "Test Course 3";
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
  describe("basic functionality", () => {
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
        from: vi.fn().mockResolvedValue([
          {
            author: TEST_AUTHOR,
            createdAt: CREATED_AT,
            id: COURSE_1,
            name: TEST_COURSE,
            updatedAt: UPDATED_AT,
            url: EXAMPLE_COURSE
          }
        ])
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

      const mockCurriculumLPSelectResult = {
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
        where: vi.fn().mockReturnThis()
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
        from: vi.fn().mockResolvedValue([
          {
            author: TEST_AUTHOR,
            createdAt: CREATED_AT,
            id: COURSE_1,
            name: TEST_COURSE,
            updatedAt: UPDATED_AT,
            url: EXAMPLE_COURSE
          }
        ])
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
  });

  describe("context resolution", () => {
    const mockCurriculumLPSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi
        .fn()
        .mockResolvedValue([
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
        from: vi.fn().mockResolvedValue([
          {
            author: TEST_AUTHOR,
            createdAt: CREATED_AT,
            id: COURSE_1,
            name: TEST_COURSE,
            updatedAt: UPDATED_AT,
            url: EXAMPLE_COURSE
          }
        ])
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
  });
});

describe("catch handlers", () => {
  it("wraps thrown Error cause from coursesQuery", async () => {
    const mockSelectResult = {
      from: vi.fn().mockRejectedValue(new Error("db failure"))
    };
    const mockDatabase = {
      select: vi.fn().mockReturnValue(mockSelectResult)
    };

    const result = await Effect.runPromise(
      Effect.flip(
        // @ts-expect-error test double
        coursesQuery(mockDatabase, null)
      )
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("db failure");
  });

  it("wraps non-Error cause from coursesQuery", async () => {
    const mockSelectResult = {
      from: vi.fn().mockRejectedValue("string failure")
    };
    const mockDatabase = {
      select: vi.fn().mockReturnValue(mockSelectResult)
    };

    const result = await Effect.runPromise(
      Effect.flip(
        // @ts-expect-error test double
        coursesQuery(mockDatabase, null)
      )
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("string failure");
  });

  it("wraps thrown Error cause from courseQuery", async () => {
    const mockSelectResult = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockRejectedValue(new Error("lookup failed")),
      where: vi.fn().mockReturnThis()
    };
    const mockDatabase = {
      select: vi.fn().mockReturnValue(mockSelectResult)
    };

    const result = await Effect.runPromise(
      Effect.flip(
        // @ts-expect-error test double
        courseQuery(mockDatabase, COURSE_1)
      )
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("lookup failed");
  });

  it("wraps non-Error cause from courseQuery", async () => {
    const mockSelectResult = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockRejectedValue(42),
      where: vi.fn().mockReturnThis()
    };
    const mockDatabase = {
      select: vi.fn().mockReturnValue(mockSelectResult)
    };

    const result = await Effect.runPromise(
      Effect.flip(
        // @ts-expect-error test double
        courseQuery(mockDatabase, COURSE_1)
      )
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("42");
  });

  it("wraps thrown Error cause from learningPathsQuery", async () => {
    const mockSelectResult = {
      from: vi.fn().mockRejectedValue(new Error("lp db failure"))
    };
    const mockDatabase = {
      select: vi.fn().mockReturnValue(mockSelectResult)
    };

    const result = await Effect.runPromise(
      Effect.flip(
        // @ts-expect-error test double
        learningPathsQuery(mockDatabase, null)
      )
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("lp db failure");
  });

  it("wraps non-Error cause from learningPathsQuery", async () => {
    const mockSelectResult = {
      from: vi.fn().mockRejectedValue("oops")
    };
    const mockDatabase = {
      select: vi.fn().mockReturnValue(mockSelectResult)
    };

    const result = await Effect.runPromise(
      Effect.flip(
        // @ts-expect-error test double
        learningPathsQuery(mockDatabase, null)
      )
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("oops");
  });

  it("wraps thrown Error cause from learningPathQuery", async () => {
    const mockSelectResult = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockRejectedValue(new Error("lp lookup failed")),
      where: vi.fn().mockReturnThis()
    };
    const mockDatabase = {
      select: vi.fn().mockReturnValue(mockSelectResult)
    };

    const result = await Effect.runPromise(
      Effect.flip(
        // @ts-expect-error test double
        learningPathQuery(mockDatabase, LP_1)
      )
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("lp lookup failed");
  });

  it("wraps non-Error cause from learningPathQuery", async () => {
    const mockSelectResult = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockRejectedValue(false),
      where: vi.fn().mockReturnThis()
    };
    const mockDatabase = {
      select: vi.fn().mockReturnValue(mockSelectResult)
    };

    const result = await Effect.runPromise(
      Effect.flip(
        // @ts-expect-error test double
        learningPathQuery(mockDatabase, LP_1)
      )
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("false");
  });

  it("wraps thrown Error cause from coursesAllQuery", async () => {
    const mockSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockRejectedValue(new Error("all-query failure"))
    };
    const mockDatabase = {
      select: vi.fn().mockReturnValue(mockSelectResult)
    };

    const result = await Effect.runPromise(
      Effect.flip(
        // @ts-expect-error test double
        coursesAllQuery(mockDatabase, null)
      )
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("all-query failure");
  });

  it("wraps non-Error cause from coursesAllQuery", async () => {
    const mockSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockRejectedValue({ reason: "weird" })
    };
    const mockDatabase = {
      select: vi.fn().mockReturnValue(mockSelectResult)
    };

    const result = await Effect.runPromise(
      Effect.flip(
        // @ts-expect-error test double
        coursesAllQuery(mockDatabase, null)
      )
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("[object Object]");
  });
});

describe("null url handling", () => {
  it("coerces null learning path url to null in learningPathsQuery", async () => {
    const mockLearningPathsSelectResult = {
      from: vi.fn().mockResolvedValue([
        {
          createdAt: CREATED_AT,
          id: LP_1,
          name: TEST_LP,
          swebokFocus: TEST_FOCUS,
          updatedAt: UPDATED_AT,
          url: null
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

    expect(result[0]?.url).toBeNull();
  });

  it("coerces null learning path url to null in learningPathQuery", async () => {
    const mockLearningPathSelectResult = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          createdAt: CREATED_AT,
          id: LP_1,
          name: TEST_LP,
          swebokFocus: TEST_FOCUS,
          updatedAt: UPDATED_AT,
          url: null
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

    expect(result?.url).toBeNull();
  });
});

describe("coursesAllQuery curriculum ordering", () => {
  it("falls back to Number.MAX_SAFE_INTEGER for learning paths missing from curriculum order", async () => {
    const COURSE_2 = "course-2";
    const COURSE_3 = "course-3";
    const LP_2 = "lp-2";
    const LP_3 = "lp-3";

    // Three learning paths with mixed curriculum presence so the toSorted
    // comparator is guaranteed to be called with at least one missing LP
    // in both `a` and `b` positions.
    const mockLPCSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([
        { courseId: COURSE_2, learningPathId: LP_2, orderRank: 1 },
        { courseId: COURSE_3, learningPathId: LP_3, orderRank: 1 },
        { courseId: COURSE_1, learningPathId: LP_1, orderRank: 1 }
      ]),
      where: vi.fn().mockReturnThis()
    };
    const mockCoursesSelectResult = {
      from: vi.fn().mockResolvedValue([
        {
          author: TEST_AUTHOR,
          createdAt: CREATED_AT,
          id: COURSE_1,
          name: TEST_COURSE,
          updatedAt: UPDATED_AT,
          url: EXAMPLE_COURSE
        },
        {
          author: TEST_AUTHOR,
          createdAt: CREATED_AT,
          id: COURSE_2,
          name: TEST_COURSE_2,
          updatedAt: UPDATED_AT,
          url: EXAMPLE_COURSE_2
        },
        {
          author: TEST_AUTHOR,
          createdAt: CREATED_AT,
          id: COURSE_3,
          name: TEST_COURSE_3,
          updatedAt: UPDATED_AT,
          url: EXAMPLE_COURSE_3
        }
      ])
    };
    // Only LP_1 is in curriculum order with rank 1; LP_2 and LP_3 are NOT,
    // so they fall back to Number.MAX_SAFE_INTEGER.
    const mockLPSelectResult = {
      from: vi.fn().mockResolvedValue([
        {
          createdAt: CREATED_AT,
          id: LP_1,
          name: TEST_LP,
          swebokFocus: TEST_FOCUS,
          updatedAt: UPDATED_AT,
          url: EXAMPLE_LP
        },
        {
          createdAt: CREATED_AT,
          id: LP_2,
          name: "Other LP",
          swebokFocus: null,
          updatedAt: UPDATED_AT,
          url: null
        },
        {
          createdAt: CREATED_AT,
          id: LP_3,
          name: "Another LP",
          swebokFocus: null,
          updatedAt: UPDATED_AT,
          url: null
        }
      ])
    };
    const mockCurriculumLPSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi
        .fn()
        .mockResolvedValue([
          { curriculumId: "cur-1", learningPathId: LP_1, orderRank: 1 }
        ]),
      where: vi.fn().mockReturnThis()
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

    // LP_1 (rank 1) should come first; LP_2 and LP_3 fall back to MAX_SAFE_INTEGER
    // and retain their stable insertion order.
    const learningPathIds = map(result, "learningPathId");
    expect(result[0]?.learningPathId).toBe(LP_1);
    expect(learningPathIds).toContain(LP_2);
    expect(learningPathIds).toContain(LP_3);
  });

  it("exercises groupCoursesByLp push branch with multiple courses for same learning path", async () => {
    const COURSE_2 = "course-2";

    const mockLPCSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([
        { courseId: COURSE_1, learningPathId: LP_1, orderRank: 1 },
        { courseId: COURSE_2, learningPathId: LP_1, orderRank: 2 }
      ]),
      where: vi.fn().mockReturnThis()
    };
    const mockCoursesSelectResult = {
      from: vi.fn().mockResolvedValue([
        {
          author: TEST_AUTHOR,
          createdAt: CREATED_AT,
          id: COURSE_1,
          name: TEST_COURSE,
          updatedAt: UPDATED_AT,
          url: EXAMPLE_COURSE
        },
        {
          author: TEST_AUTHOR,
          createdAt: CREATED_AT,
          id: COURSE_2,
          name: "Course 2",
          updatedAt: UPDATED_AT,
          url: EXAMPLE_COURSE_2
        }
      ])
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
    const mockCurriculumLPSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi
        .fn()
        .mockResolvedValue([
          { curriculumId: "cur-1", learningPathId: LP_1, orderRank: 1 }
        ]),
      where: vi.fn().mockReturnThis()
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

    expect(result).toHaveLength(2);
    expect(result[0]?.courseId).toBe(COURSE_1);
    expect(result[1]?.courseId).toBe(COURSE_2);
  });
});

describe("buildLpCurriculumOrder duplicates", () => {
  it("includes duplicate learning path entries in curriculumLearningPaths", async () => {
    const COURSE_2 = "course-2";
    const COURSE_3 = "course-3";
    const LP_2 = "lp-2";
    const LP_3 = "lp-3";

    const mockLPCSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([
        { courseId: COURSE_1, learningPathId: LP_1, orderRank: 1 },
        { courseId: COURSE_2, learningPathId: LP_2, orderRank: 1 },
        { courseId: COURSE_3, learningPathId: LP_3, orderRank: 1 }
      ]),
      where: vi.fn().mockReturnThis()
    };
    const mockCoursesSelectResult = {
      from: vi.fn().mockResolvedValue([
        {
          author: TEST_AUTHOR,
          createdAt: CREATED_AT,
          id: COURSE_1,
          name: TEST_COURSE,
          updatedAt: UPDATED_AT,
          url: EXAMPLE_COURSE
        },
        {
          author: TEST_AUTHOR,
          createdAt: CREATED_AT,
          id: COURSE_2,
          name: "Course 2",
          updatedAt: UPDATED_AT,
          url: EXAMPLE_COURSE_2
        },
        {
          author: TEST_AUTHOR,
          createdAt: CREATED_AT,
          id: COURSE_3,
          name: "Course 3",
          updatedAt: UPDATED_AT,
          url: EXAMPLE_COURSE_3
        }
      ])
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
        },
        {
          createdAt: CREATED_AT,
          id: LP_2,
          name: "LP 2",
          swebokFocus: null,
          updatedAt: UPDATED_AT,
          url: null
        },
        {
          createdAt: CREATED_AT,
          id: LP_3,
          name: "LP 3",
          swebokFocus: null,
          updatedAt: UPDATED_AT,
          url: null
        }
      ])
    };
    // LP_1 appears twice in curriculum order — second entry should be ignored.
    const mockCurriculumLPSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([
        { curriculumId: "cur-1", learningPathId: LP_1, orderRank: 1 },
        { curriculumId: "cur-1", learningPathId: LP_1, orderRank: 2 }
      ]),
      where: vi.fn().mockReturnThis()
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

    // LP_1 should still be ranked first; duplicates ignored.
    expect(result[0]?.learningPathId).toBe(LP_1);
    expect(result[0]?.learningPathOrder).toBe(1);
  });
});
