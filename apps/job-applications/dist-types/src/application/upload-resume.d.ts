import { Effect } from "effect";
import { NotFoundError } from "../errors/not-found-error.ts";
import { ResumeError } from "../errors/resume-error.ts";
import { JobApplicationRepository } from "./ports/job-application-repository.ts";
import { ResumeStore } from "./ports/resume-store.ts";
export declare const uploadResume: (parameters: {
    readonly data: ArrayBuffer;
    readonly email: string;
    readonly filename: string;
    readonly id: string;
}) => Effect.Effect<import("../domain/job-application/aggregate.ts").JobApplication, import("../errors/fetch-error.ts").FetchError | import("../errors/save-error.ts").SaveError | ResumeError | NotFoundError, JobApplicationRepository | ResumeStore>;
