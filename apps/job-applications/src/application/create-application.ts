import { Effect } from "effect";

import {
  type CreateApplicationInput as CreateAppInput,
  createJobApplication as createJobApp
} from "../domain/job-application/aggregate.ts";
import { JobApplicationRepository as JobAppRepo } from "./ports.ts";

export const createApplication = (input: CreateAppInput) => {
  return Effect.gen(function* () {
    const repo = yield* JobAppRepo;
    const app = yield* createJobApp(input);
    return yield* repo.insert(app);
  });
};
