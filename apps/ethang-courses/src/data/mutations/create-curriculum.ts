import { Effect } from "effect";

import type { Database } from "../types.ts";

import { createCurriculum } from "../../infrastructure/curriculum/aggregate.ts";
import { createCurriculumRepo } from "../../infrastructure/curriculum/repo.ts";

export const createCurriculumMutation = async (
  database: Database,
  parameters: {
    learningPathIds?: null | string[];
    name: string;
    url?: null | string;
  }
) => {
  const repo = createCurriculumRepo(database);
  return Effect.runPromise(
    createCurriculum(
      {
        learningPathIds: parameters.learningPathIds ?? [],
        name: parameters.name,
        url: parameters.url === undefined ? null : parameters.url
      },
      repo
    )
  );
};
