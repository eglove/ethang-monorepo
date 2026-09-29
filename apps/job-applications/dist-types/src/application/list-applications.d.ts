import { Effect } from "effect";
import type { Status } from "../domain/job-application/status.ts";
import { JobApplicationRepository } from "./ports/job-application-repository.ts";
export declare const listApplications: (parameters: {
    readonly appliedDate: string;
    readonly email: string;
    readonly status: null | Status;
}) => Effect.Effect<{
    items: import("../domain/job-application/aggregate.ts").JobApplication[];
}, import("../errors/fetch-error.ts").FetchError, JobApplicationRepository>;
