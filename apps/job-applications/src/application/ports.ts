/* eslint-disable max-classes-per-file, unicorn/name-replacements */
import { Context, type Effect } from "effect";

import type { JobApplication } from "../domain/job-application/aggregate.ts";
import type { Status } from "../domain/job-application/status.ts";
import type { DuplicateApplicationError } from "../errors/duplicate-application-error.ts";
import type { FetchError } from "../errors/fetch-error.ts";
import type { ResumeError } from "../errors/resume-error.ts";
import type { SaveError } from "../errors/save-error.ts";
import type { TokenError } from "../errors/token-error.ts";

export class JobApplicationRepository extends Context.Tag(
  "JobApplicationRepository",
)<
  JobApplicationRepository,
  {
    readonly delete: (
      id: string,
      email: string,
    ) => Effect.Effect<boolean, FetchError>;
    readonly findByEmailAndUrl: (
      email: string,
      appUrl: string,
    ) => Effect.Effect<JobApplication | null, FetchError>;
    readonly findById: (
      id: string,
      email: string,
    ) => Effect.Effect<JobApplication | null, FetchError>;
    readonly insert: (
      app: JobApplication,
    ) => Effect.Effect<JobApplication, DuplicateApplicationError | SaveError>;
    readonly list: (parameters: {
      readonly after: null | string;
      readonly email: string;
      readonly first: number;
      readonly status: null | Status;
    }) => Effect.Effect<JobApplication[], FetchError>;
    readonly update: (
      app: JobApplication,
    ) => Effect.Effect<JobApplication, SaveError>;
  }
>() {}

export class ResumeStore extends Context.Tag("ResumeStore")<
  ResumeStore,
  {
    readonly delete: (key: string) => Effect.Effect<void, ResumeError>;
    readonly get: (key: string) => Effect.Effect<
      {
        readonly data: ArrayBuffer;
        readonly filename: string;
        readonly size: number;
      } | null,
      ResumeError
    >;
    readonly put: (
      key: string,
      data: ArrayBuffer,
      filename: string,
    ) => Effect.Effect<void, ResumeError>;
  }
>() {}

export class TokenVerifier extends Context.Tag("TokenVerifier")<
  TokenVerifier,
  {
    readonly verify: (token: string) => Effect.Effect<string, TokenError>;
  }
>() {}
