import { Effect } from "effect";

import type { Status } from "../domain/job-application/status.ts";

import { JobApplicationRepository } from "./ports/job-application-repository.ts";

export const listApplications = (parameters: {
  readonly appliedDate: string;
  readonly email: string;
  readonly status: null | Status;
}) => {
  return Effect.gen(function* () {
    const repo = yield* JobApplicationRepository;
    const items = yield* repo.list(parameters);
    return { items };
  });
};
