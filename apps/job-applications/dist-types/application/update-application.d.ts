import { Effect } from "effect";
import { type UpdateApplicationChanges } from "../domain/job-application/aggregate.ts";
import { NotFoundError } from "../errors/not-found-error.ts";
import { JobApplicationRepository } from "./ports/job-application-repository.ts";
export declare const updateApplication: (id: string, email: string, changes: UpdateApplicationChanges) => Effect.Effect<import("../domain/job-application/aggregate.ts").JobApplication, import("../errors/validation-error.ts").ValidationError | import("../errors/fetch-error.ts").FetchError | import("../errors/save-error.ts").SaveError | NotFoundError, JobApplicationRepository>;
