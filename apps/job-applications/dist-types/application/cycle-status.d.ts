import { Effect } from "effect";
import { NotFoundError } from "../errors/not-found-error.ts";
import { JobApplicationRepository } from "./ports/job-application-repository.ts";
export declare const cycleStatus: (id: string, email: string) => Effect.Effect<import("../domain/job-application/aggregate.ts").JobApplication, import("../errors/invalid-status-transition-error.ts").InvalidStatusTransitionError | import("../errors/fetch-error.ts").FetchError | import("../errors/save-error.ts").SaveError | NotFoundError, JobApplicationRepository>;
