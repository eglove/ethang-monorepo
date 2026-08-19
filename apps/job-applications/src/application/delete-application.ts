import { Effect } from "effect";
import isNull from "lodash/isNull.js";

import { NotFoundError } from "../errors/not-found-error.ts";
import { JobApplicationRepository } from "./ports/job-application-repository.ts";
import { ResumeStore } from "./ports/resume-store.ts";

export const deleteApplication = (id: string, email: string) => {
  return Effect.gen(function* () {
    const repo = yield* JobApplicationRepository;
    const store = yield* ResumeStore;
    const existing = yield* repo.findById(id, email);
    if (isNull(existing)) {
      return yield* Effect.fail(new NotFoundError("application not found"));
    }
    if (!isNull(existing.resumeKey)) {
      yield* store.delete(existing.resumeKey);
    }
    return yield* repo.delete(id, email);
  });
};
