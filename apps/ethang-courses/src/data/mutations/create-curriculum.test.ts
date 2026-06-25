import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { ValidationError } from "../../errors/validation-error.ts";
import { createCurriculum } from "../../infrastructure/curriculum/aggregate.ts";
import { createCurriculumMutation } from "./create-curriculum.ts";

const LP_1 = "lp-1";
const CURRICULUM_1 = "curriculum-1";
const TEST_CURRICULUM = "Test Curriculum";
const EXAMPLE_CURRICULUM = "https://example.com/curriculum-1";

vi.mock(import("../../infrastructure/curriculum/aggregate.ts"), () => {
  return {
    createCurriculum: vi.fn()
  };
});

vi.mock(import("../../infrastructure/curriculum/repo.ts"), () => {
  return {
    createCurriculumRepo: vi.fn().mockReturnValue({})
  };
});

describe("createCurriculumMutation", () => {
  it("delegates to createCurriculum for a new curriculum with no learning paths", async () => {
    vi.mocked(createCurriculum).mockReturnValue(
      Effect.succeed({
        curriculumId: CURRICULUM_1,
        learningPathIds: [],
        name: TEST_CURRICULUM,
        url: EXAMPLE_CURRICULUM
      })
    );

    const result = await createCurriculumMutation({} as any, {
      name: TEST_CURRICULUM,
      url: EXAMPLE_CURRICULUM
    });

    expect(createCurriculum).toHaveBeenCalledWith(
      {
        learningPathIds: [],
        name: TEST_CURRICULUM,
        url: EXAMPLE_CURRICULUM
      },
      expect.anything()
    );
    expect(result).toStrictEqual({
      curriculumId: CURRICULUM_1,
      learningPathIds: [],
      name: TEST_CURRICULUM,
      url: EXAMPLE_CURRICULUM
    });
  });

  it("delegates to createCurriculum with learning path IDs", async () => {
    vi.mocked(createCurriculum).mockReturnValue(
      Effect.succeed({
        curriculumId: CURRICULUM_1,
        learningPathIds: [LP_1],
        name: TEST_CURRICULUM,
        url: EXAMPLE_CURRICULUM
      })
    );

    const result = await createCurriculumMutation({} as any, {
      learningPathIds: [LP_1],
      name: TEST_CURRICULUM,
      url: EXAMPLE_CURRICULUM
    });

    expect(createCurriculum).toHaveBeenCalledWith(
      {
        learningPathIds: [LP_1],
        name: TEST_CURRICULUM,
        url: EXAMPLE_CURRICULUM
      },
      expect.anything()
    );
    expect(result).toStrictEqual({
      curriculumId: CURRICULUM_1,
      learningPathIds: [LP_1],
      name: TEST_CURRICULUM,
      url: EXAMPLE_CURRICULUM
    });
  });

  it("propagates errors from createCurriculum", async () => {
    vi.mocked(createCurriculum).mockReturnValue(
      Effect.fail(
        new ValidationError(
          "The following learning path IDs do not exist: lp-1"
        )
      )
    );

    await expect(
      createCurriculumMutation({} as any, {
        learningPathIds: [LP_1],
        name: TEST_CURRICULUM
      })
    ).rejects.toThrow("The following learning path IDs do not exist: lp-1");
  });
});
