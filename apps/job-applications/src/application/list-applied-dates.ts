import { Effect } from "effect";

import { JobApplicationRepository } from "./ports/job-application-repository.ts";

export const listAppliedDates = (parameters: { readonly email: string }) => {
  return Effect.gen(function* () {
    const repo = yield* JobApplicationRepository;
    return yield* repo.listAppliedDates(parameters.email);
  });
};
