/* eslint-disable unicorn/name-replacements, @ethang/no-null-undefined-check */
import { Effect } from "effect";

import { advanceStatus } from "../domain/job-application/aggregate.ts";
import { NotFoundError } from "../errors/not-found-error.ts";
import { JobApplicationRepository } from "./ports.ts";

export const cycleStatus = (id: string, email: string) => {
  return Effect.gen(function* () {
    const repo = yield* JobApplicationRepository;
    const existing = yield* repo.findById(id, email);
    if (null === existing) {
      return yield* Effect.fail(new NotFoundError("application not found"));
    }
    const advanced = yield* advanceStatus(existing);
    return yield* repo.update(advanced);
  });
};
