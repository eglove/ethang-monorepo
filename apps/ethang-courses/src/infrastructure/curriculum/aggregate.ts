import { Effect } from "effect";

import type { Curriculum } from "../../domain/curriculum/state.ts";
import type { CurriculumRepo } from "./repo.ts";

import { generateId } from "../../db/schema.ts";

export const createCurriculum = (
  parameters: {
    learningPathIds: readonly string[];
    name: string;
    url?: null | string;
  },
  repo: CurriculumRepo
) => {
  return Effect.gen(function* () {
    yield* repo.validateLearningPathIds(parameters.learningPathIds);

    const curriculumId = generateId();
    const curriculum: Curriculum = {
      curriculumId,
      learningPathIds: parameters.learningPathIds,
      name: parameters.name,
      url: parameters.url === undefined ? null : parameters.url
    };

    return yield* repo.save(curriculum);
  });
};
