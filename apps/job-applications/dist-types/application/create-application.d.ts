import { Effect } from "effect";
import { type CreateApplicationInput } from "../domain/job-application/aggregate.ts";
import { JobApplicationRepository } from "./ports/job-application-repository.ts";
export declare const createApplication: (input: CreateApplicationInput) => Effect.Effect<import("../domain/job-application/aggregate.ts").JobApplication, import("../errors/validation-error.ts").ValidationError | import("../errors/duplicate-application-error.ts").DuplicateApplicationError | import("../errors/save-error.ts").SaveError, JobApplicationRepository>;
