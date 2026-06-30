import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "../../data/types.ts";
import type { Curriculum } from "../../domain/curriculum/state.ts";

import { SaveError } from "../../errors/save-error.ts";
import { ValidationError } from "../../errors/validation-error.ts";
import { createCurriculumRepo } from "./repo.ts";

const CURRICULUM_ID = "curriculum-1";
const LP_1 = "lp-1";
const LP_2 = "lp-2";
const TEST_NAME = "Test Curriculum";
const TEST_URL = "https://example.com/curriculum-1";

const CURRICULUM: Curriculum = {
  curriculumId: CURRICULUM_ID,
  learningPathIds: [LP_1, LP_2],
  name: TEST_NAME,
  url: TEST_URL
};

const CURRICULUM_NO_LPS: Curriculum = {
  curriculumId: CURRICULUM_ID,
  learningPathIds: [],
  name: TEST_NAME,
  url: null
};

const CURRICULUM_ROW = { id: CURRICULUM_ID, name: TEST_NAME, url: TEST_URL };
const CURRICULUM_ROW_NO_URL = {
  id: CURRICULUM_ID,
  name: TEST_NAME,
  url: null
};

const createMockDatabase = () => {
  const curriculumReturningMock = vi.fn();
  const batchMock = vi.fn();
  const selectWhereMock = vi.fn();

  const database = {
    batch: batchMock,
    insert: vi.fn(() => {
      return {
        values: vi.fn(() => {
          return {
            returning: curriculumReturningMock
          };
        })
      };
    }),
    select: vi.fn(() => {
      return {
        from: vi.fn(() => {
          return {
            where: selectWhereMock
          };
        })
      };
    })
  } as unknown as Database;

  return {
    batchMock,
    curriculumReturningMock,
    database,
    selectWhereMock
  };
};

describe("createCurriculumRepo", () => {
  describe("save", () => {
    it("saves curriculum with no learning paths", async () => {
      const { curriculumReturningMock, database } = createMockDatabase();
      curriculumReturningMock.mockResolvedValue([CURRICULUM_ROW_NO_URL]);

      const repo = createCurriculumRepo(database);
      const result = await Effect.runPromise(repo.save(CURRICULUM_NO_LPS));

      expect(result.name).toBe(TEST_NAME);
      expect(result.curriculumId).toBe(CURRICULUM_ID);
      expect(result.learningPathIds).toStrictEqual([]);
    });

    it("saves curriculum with learning paths using batch", async () => {
      const { batchMock, curriculumReturningMock, database } =
        createMockDatabase();
      curriculumReturningMock.mockResolvedValue([CURRICULUM_ROW]);
      batchMock.mockResolvedValue([[CURRICULUM_ROW]]);

      const repo = createCurriculumRepo(database);
      const result = await Effect.runPromise(repo.save(CURRICULUM));

      expect(result.learningPathIds).toStrictEqual([LP_1, LP_2]);
      expect(batchMock).toHaveBeenCalledOnce();
    });

    it("fails with SaveError when insert returns no rows (no LPs)", async () => {
      const { curriculumReturningMock, database } = createMockDatabase();
      curriculumReturningMock.mockResolvedValue([]);

      const repo = createCurriculumRepo(database);
      const result = await Effect.runPromise(
        repo.save(CURRICULUM_NO_LPS).pipe(Effect.flip)
      );

      expect(result).toBeInstanceOf(SaveError);
      expect(result.message).toContain("Failed to create curriculum");
    });

    it("fails with SaveError when batch returns no curriculum", async () => {
      const { batchMock, curriculumReturningMock, database } =
        createMockDatabase();
      curriculumReturningMock.mockResolvedValue([CURRICULUM_ROW]);
      batchMock.mockResolvedValue([[undefined]]);

      const repo = createCurriculumRepo(database);
      const result = await Effect.runPromise(
        repo.save(CURRICULUM).pipe(Effect.flip)
      );

      expect(result).toBeInstanceOf(SaveError);
      expect(result.message).toContain("Failed to create curriculum");
    });

    it("fails with SaveError on database error", async () => {
      const { curriculumReturningMock, database } = createMockDatabase();
      curriculumReturningMock.mockRejectedValue(new Error("DB write failed"));

      const repo = createCurriculumRepo(database);
      const result = await Effect.runPromise(
        repo.save(CURRICULUM_NO_LPS).pipe(Effect.flip)
      );

      expect(result).toBeInstanceOf(SaveError);
      expect(result.message).toContain("DB write failed");
    });
  });

  describe("validateLearningPathIds", () => {
    it("passes validation when all IDs exist", async () => {
      const { database, selectWhereMock } = createMockDatabase();
      selectWhereMock.mockResolvedValue([{ id: LP_1 }, { id: LP_2 }]);

      const repo = createCurriculumRepo(database);
      await expect(
        Effect.runPromise(repo.validateLearningPathIds([LP_1, LP_2]))
      ).resolves.toBeUndefined();
    });

    it("passes validation when ids array is empty", async () => {
      const { database } = createMockDatabase();

      const repo = createCurriculumRepo(database);
      await expect(
        Effect.runPromise(repo.validateLearningPathIds([]))
      ).resolves.toBeUndefined();
    });

    it("fails with ValidationError when IDs are missing", async () => {
      const { database, selectWhereMock } = createMockDatabase();
      selectWhereMock.mockResolvedValue([{ id: LP_1 }]);

      const repo = createCurriculumRepo(database);
      const result = await Effect.runPromise(
        repo.validateLearningPathIds([LP_1, LP_2]).pipe(Effect.flip)
      );

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.message).toContain(LP_2);
    });

    it("fails with ValidationError on database error", async () => {
      const { database, selectWhereMock } = createMockDatabase();
      selectWhereMock.mockRejectedValue(new Error("Query failed"));

      const repo = createCurriculumRepo(database);
      const result = await Effect.runPromise(
        repo.validateLearningPathIds([LP_1]).pipe(Effect.flip)
      );

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.message).toContain("Query failed");
    });
  });
});
