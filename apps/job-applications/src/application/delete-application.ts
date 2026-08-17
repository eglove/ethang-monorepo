/* eslint-disable unicorn/name-replacements, @ethang/no-null-undefined-check */
import { Effect } from "effect";

import { NotFoundError } from "../errors/not-found-error.ts";
import { JobApplicationRepository, ResumeStore } from "./ports.ts";

export const deleteApplication = (id: string, email: string) => {
  return Effect.gen(function* () {
    const repo = yield* JobApplicationRepository;
    const store = yield* ResumeStore;
    const existing = yield* repo.findById(id, email);
    if (null === existing) {
      return yield* Effect.fail(new NotFoundError("application not found"));
    }
    if (null !== existing.resumeKey) {
      yield* store.delete(existing.resumeKey);
    }
    return yield* repo.delete(id, email);
  });
};
