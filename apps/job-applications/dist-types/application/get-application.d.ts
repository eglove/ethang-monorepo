import { Effect } from "effect";
import { NotFoundError } from "../errors/not-found-error.ts";
import { JobApplicationRepository } from "./ports/job-application-repository.ts";
export declare const getApplication: (id: string, email: string) => Effect.Effect<import("../domain/job-application/aggregate.ts").JobApplication, import("../errors/fetch-error.ts").FetchError | NotFoundError, JobApplicationRepository>;
