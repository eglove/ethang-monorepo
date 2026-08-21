import { Effect } from "effect";
import type { Status } from "../domain/job-application/status.ts";
import { type ApplicationCursor } from "./application-cursor.ts";
import { JobApplicationRepository } from "./ports/job-application-repository.ts";
export declare const listApplications: (parameters: {
    readonly after: ApplicationCursor | null;
    readonly email: string;
    readonly first: number;
    readonly status: null | Status;
}) => Effect.Effect<{
    items: import("../domain/job-application/aggregate.ts").JobApplication[];
    nextCursor: string | null;
}, import("../errors/fetch-error.ts").FetchError, JobApplicationRepository>;
