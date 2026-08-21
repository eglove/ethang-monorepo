import { Effect } from "effect";
import { JobApplicationRepository } from "./ports/job-application-repository.ts";
export declare const listAppliedDates: (parameters: {
    readonly email: string;
}) => Effect.Effect<string[], import("../errors/fetch-error.ts").FetchError, JobApplicationRepository>;
