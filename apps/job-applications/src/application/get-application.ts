import { Effect } from "effect";
import isNil from "lodash/isNil.js";

import { NotFoundError } from "../errors/not-found-error.ts";
import { JobApplicationRepository } from "./ports/job-application-repository.ts";

export const getApplication = (id: string, email: string) => {
  return Effect.gen(function* () {
    const repo = yield* JobApplicationRepository;
    const application = yield* repo.findById(id, email);
    return isNil(application)
      ? yield* Effect.fail(new NotFoundError("application not found"))
      : application;
  });
};
