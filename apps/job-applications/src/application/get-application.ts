/* eslint-disable unicorn/name-replacements */
import { Effect } from "effect";
import isNil from "lodash/isNil.js";

import { NotFoundError } from "../errors/not-found-error.ts";
import { JobApplicationRepository } from "./ports.ts";

export const getApplication = (id: string, email: string) => {
  return Effect.gen(function* () {
    const repo = yield* JobApplicationRepository;
    const application = yield* repo.findById(id, email);
    if (isNil(application)) {
      return yield* Effect.fail(new NotFoundError("application not found"));
    }
    return application;
  });
};
