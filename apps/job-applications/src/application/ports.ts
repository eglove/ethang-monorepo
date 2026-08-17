/* eslint-disable max-classes-per-file, unicorn/name-replacements */
import { Context, type Effect } from "effect";

import type { JobApplication as JobApp } from "../domain/job-application/aggregate.ts";
import type { Status } from "../domain/job-application/status.ts";
import type { DuplicateApplicationError as DuplicateAppError } from "../errors/duplicate-application-error.ts";
import type { FetchError } from "../errors/fetch-error.ts";
import type { ResumeError } from "../errors/resume-error.ts";
import type { SaveError } from "../errors/save-error.ts";
import type { TokenError } from "../errors/token-error.ts";

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
    ) => Effect.Effect<JobApp | null, FetchError>;
    readonly findById: (
      id: string,
      email: string
    ) => Effect.Effect<JobApp | null, FetchError>;
    readonly insert: (
      app: JobApp
    ) => Effect.Effect<JobApp, DuplicateAppError | SaveError>;
    readonly list: (parameters: {
      readonly after: null | string;
      readonly email: string;
      readonly first: number;
      readonly status: null | Status;
    }) => Effect.Effect<JobApp[], FetchError>;
    readonly update: (app: JobApp) => Effect.Effect<JobApp, SaveError>;
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
      filename: string
    ) => Effect.Effect<void, ResumeError>;
  }
>() {}

export class TokenVerifier extends Context.Tag("TokenVerifier")<
  TokenVerifier,
  {
    readonly verify: (token: string) => Effect.Effect<string, TokenError>;
  }
>() {}
