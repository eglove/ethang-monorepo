import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { CurriculumRepo } from "./repo.ts";

import { SaveError } from "../../errors/save-error.ts";
import { ValidationError } from "../../errors/validation-error.ts";
import { createCurriculum } from "./aggregate.ts";

const CURRICULUM_ID = "curriculum-1";
const LP_1 = "lp-1";
const TEST_NAME = "Test Curriculum";
const TEST_URL = "https://example.com/curriculum-1";

const PARAMS: Parameters<typeof createCurriculum>[0] = {
  learningPathIds: [],
  name: TEST_NAME,
  url: TEST_URL
};

const createMockRepo = (overrides?: Partial<CurriculumRepo>) => {
  return {
    save: vi.fn().mockReturnValue(
      Effect.succeed({
        curriculumId: CURRICULUM_ID,
        learningPathIds: [],
        name: TEST_NAME,
        url: TEST_URL
      })
    ),
    validateLearningPathIds: vi.fn().mockReturnValue(Effect.void),
    ...overrides
  };
};

describe("createCurriculum", () => {
  it("creates curriculum with no learning paths", async () => {
    const repo = createMockRepo();

    const result = await Effect.runPromise(createCurriculum(PARAMS, repo));

    expect(result).toStrictEqual({
      curriculumId: CURRICULUM_ID,
      learningPathIds: [],
      name: TEST_NAME,
      url: TEST_URL
    });
  });

  it("creates curriculum with learning paths", async () => {
    const repo = createMockRepo({
      save: vi.fn().mockReturnValue(
        Effect.succeed({
          curriculumId: CURRICULUM_ID,
          learningPathIds: [LP_1],
          name: TEST_NAME,
          url: TEST_URL
        })
      )
    });

    const result = await Effect.runPromise(
      createCurriculum({ ...PARAMS, learningPathIds: [LP_1] }, repo)
    );

    expect(result.learningPathIds).toStrictEqual([LP_1]);
  });

  it("validates learning path IDs before saving", async () => {
    const repo = createMockRepo();

    await Effect.runPromise(createCurriculum(PARAMS, repo));

    expect(repo.validateLearningPathIds).toHaveBeenCalledWith([]);
  });

  it("propagates validation errors", async () => {
    const validateMock = vi
      .fn()
      .mockReturnValue(Effect.fail(new ValidationError("Invalid LP IDs")));
    const repo = createMockRepo({ validateLearningPathIds: validateMock });

    await expect(
      Effect.runPromise(createCurriculum(PARAMS, repo))
    ).rejects.toThrow("Invalid LP IDs");
  });

  it("propagates save errors", async () => {
    const saveMock = vi
      .fn()
      .mockReturnValue(Effect.fail(new SaveError("Save failed")));
    const repo = createMockRepo({ save: saveMock });

    await expect(
      Effect.runPromise(createCurriculum(PARAMS, repo))
    ).rejects.toThrow("Save failed");
  });

  it("sets url to null when undefined", async () => {
    const saveMock = vi.fn().mockReturnValue(
      Effect.succeed({
        curriculumId: CURRICULUM_ID,
        learningPathIds: [],
        name: TEST_NAME,
        url: null
      })
    );
    const repo = createMockRepo({ save: saveMock });
    const parameters = { learningPathIds: [], name: TEST_NAME };

    await Effect.runPromise(createCurriculum(parameters, repo));

    expect(saveMock).toHaveBeenCalledWith(
      expect.objectContaining({ url: null })
    );
  });
});
