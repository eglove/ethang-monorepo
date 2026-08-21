import { Context, type Effect } from "effect";

import type { JobApplication } from "../../domain/job-application/aggregate.ts";
import type { Status } from "../../domain/job-application/status.ts";
import type { DuplicateApplicationError } from "../../errors/duplicate-application-error.ts";
import type { FetchError } from "../../errors/fetch-error.ts";
import type { SaveError } from "../../errors/save-error.ts";
import type { ApplicationCursor } from "../application-cursor.ts";

export class JobApplicationRepository extends Context.Tag(
  "JobApplicationRepository"
)<
  JobApplicationRepository,
  {
    readonly delete: (
      id: string,
      email: string
    ) => Effect.Effect<boolean, FetchError>;
    readonly findByEmailAndUrl: (
      email: string,
      appUrl: string
    ) => Effect.Effect<JobApplication | null, FetchError>;
    readonly findById: (
      id: string,
      email: string
    ) => Effect.Effect<JobApplication | null, FetchError>;
    readonly insert: (
      app: JobApplication
    ) => Effect.Effect<JobApplication, DuplicateApplicationError | SaveError>;
    readonly list: (parameters: {
      readonly after: ApplicationCursor | null;
      readonly email: string;
      readonly first: number;
      readonly status: null | Status;
    }) => Effect.Effect<JobApplication[], FetchError>;
    readonly update: (
      app: JobApplication
    ) => Effect.Effect<JobApplication, SaveError>;
  }
>() {}
