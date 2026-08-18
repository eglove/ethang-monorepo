import { Effect } from "effect";

import {
  type CreateApplicationInput,
  createJobApplication,
} from "../domain/job-application/aggregate.ts";
import { JobApplicationRepository } from "./ports/job-application-repository.ts";

export const createApplication = (input: CreateApplicationInput) => {
  return Effect.gen(function* () {
    const repo = yield* JobApplicationRepository;
    const app = yield* createJobApplication(input);
    return yield* repo.insert(app);
  });
};
