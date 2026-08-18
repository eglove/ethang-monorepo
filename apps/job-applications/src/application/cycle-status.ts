import { Effect } from "effect";
import isNull from "lodash/isNull.js";

import { advanceStatus } from "../domain/job-application/aggregate.ts";
import { NotFoundError } from "../errors/not-found-error.ts";
import { JobApplicationRepository } from "./ports/job-application-repository.ts";

export const cycleStatus = (id: string, email: string) => {
  return Effect.gen(function* () {
    const repo = yield* JobApplicationRepository;
    const existing = yield* repo.findById(id, email);
    if (isNull(existing)) {
      return yield* Effect.fail(new NotFoundError("application not found"));
    }
    const advanced = yield* advanceStatus(existing);
    return yield* repo.update(advanced);
  });
};
