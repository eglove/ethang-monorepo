import { Context, type Effect } from "effect";

import type { ResumeError } from "../../errors/resume-error.ts";

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
