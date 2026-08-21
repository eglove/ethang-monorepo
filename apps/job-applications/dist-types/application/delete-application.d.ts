import { Effect } from "effect";
import { NotFoundError } from "../errors/not-found-error.ts";
import { JobApplicationRepository } from "./ports/job-application-repository.ts";
import { ResumeStore } from "./ports/resume-store.ts";
export declare const deleteApplication: (id: string, email: string) => Effect.Effect<boolean, import("../errors/fetch-error.ts").FetchError | import("../errors/resume-error.ts").ResumeError | NotFoundError, JobApplicationRepository | ResumeStore>;
