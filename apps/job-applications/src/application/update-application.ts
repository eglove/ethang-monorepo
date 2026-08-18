import { Effect } from "effect";
import isNil from "lodash/isNil.js";

import {
  type UpdateApplicationChanges,
  withChanges,
} from "../domain/job-application/aggregate.ts";
import { NotFoundError } from "../errors/not-found-error.ts";
import { JobApplicationRepository } from "./ports/job-application-repository.ts";

export const updateApplication = (
  id: string,
  email: string,
  changes: UpdateApplicationChanges,
) => {
  return Effect.gen(function* () {
    const repo = yield* JobApplicationRepository;
    const existing = yield* repo.findById(id, email);
    if (isNil(existing)) {
      return yield* Effect.fail(new NotFoundError("application not found"));
    }
    const updated = yield* withChanges(existing, changes);
    return yield* repo.update(updated);
  });
};
