/* eslint-disable unicorn/name-replacements */
import { WorkerEntrypoint } from "cloudflare:workers";
import { Effect, Layer, Schema } from "effect";
import clamp from "lodash/clamp.js";

import { createApplication } from "./application/create-application.ts";
import { cycleStatus } from "./application/cycle-status.ts";
import { deleteApplication } from "./application/delete-application.ts";
import { getApplication } from "./application/get-application.ts";
import { getResume } from "./application/get-resume.ts";
import { listApplications } from "./application/list-applications.ts";
import {
  type JobApplicationRepository,
  type ResumeStore,
  TokenVerifier
} from "./application/ports.ts";
import {
  CreateApplicationInputSchema,
  decodeInput,
  ListApplicationsParamsSchema,
  UpdateApplicationChangesSchema
} from "./application/schemas.ts";
import { updateApplication } from "./application/update-application.ts";
import { uploadResume } from "./application/upload-resume.ts";
import { createJobApplicationRepositoryLayer } from "./infrastructure/drizzle/repository.ts";
import { createResumeStoreLayer } from "./infrastructure/r2/resume-store.ts";
import { createTokenVerifierLayer } from "./infrastructure/token/verifier.ts";
import { toResult } from "./rpc-result.ts";

type Services = JobApplicationRepository | ResumeStore | TokenVerifier;

export class JobApplicationsService extends WorkerEntrypoint<Env> {
  public async createApplication(parameters: unknown) {
    const { run, verify } = this;
    return run(
      Effect.gen(function* () {
        const input = yield* decodeInput(
          CreateApplicationInputSchema,
          parameters
        );
        const email = yield* verify(input.token);
        return yield* createApplication({
          applicationUrl: input.applicationUrl,
          appliedDate: input.appliedDate,
          company: input.company,
          email,
          location: input.location ?? null,
          nextInterviewDate: input.nextInterviewDate ?? null,
          notes: input.notes ?? null,
          salary: input.salary ?? null,
          status: input.status ?? null,
          title: input.title
        });
      })
    );
  }

  public async cycleStatus(parameters: unknown) {
    const { run, verify } = this;
    return run(
      Effect.gen(function* () {
        const input = yield* decodeInput(
          Schema.Struct({
            id: Schema.NonEmptyString,
            token: Schema.NonEmptyString
          }),
          parameters
        );
        const email = yield* verify(input.token);
        return yield* cycleStatus(input.id, email);
      })
    );
  }

  public async deleteApplication(parameters: unknown) {
    const { run, verify } = this;
    return run(
      Effect.gen(function* () {
        const input = yield* decodeInput(
          Schema.Struct({
            id: Schema.NonEmptyString,
            token: Schema.NonEmptyString
          }),
          parameters
        );
        const email = yield* verify(input.token);
        return yield* deleteApplication(input.id, email);
      })
    );
  }

  public override fetch(_request: Request) {
    return new Response("OK", { status: 200 });
  }

  public async getApplication(parameters: unknown) {
    const { run, verify } = this;
    return run(
      Effect.gen(function* () {
        const input = yield* decodeInput(
          Schema.Struct({
            id: Schema.NonEmptyString,
            token: Schema.NonEmptyString
          }),
          parameters
        );
        const email = yield* verify(input.token);
        return yield* getApplication(input.id, email);
      })
    );
  }

  public async getResume(parameters: unknown) {
    const { run, verify } = this;
    return run(
      Effect.gen(function* () {
        const input = yield* decodeInput(
          Schema.Struct({
            id: Schema.NonEmptyString,
            token: Schema.NonEmptyString
          }),
          parameters
        );
        const email = yield* verify(input.token);
        return yield* getResume(input.id, email);
      })
    );
  }

  public async listApplications(parameters: unknown) {
    const { run, verify } = this;
    return run(
      Effect.gen(function* () {
        const input = yield* decodeInput(
          ListApplicationsParamsSchema,
          parameters
        );
        const email = yield* verify(input.token);
        const first = clamp(input.first, 1, 100);
        return yield* listApplications({
          after: input.after ?? null,
          email,
          first,
          status: input.status ?? null
        });
      })
    );
  }

  public async updateApplication(parameters: unknown) {
    const { run, verify } = this;
    return run(
      Effect.gen(function* () {
        const input = yield* decodeInput(
          UpdateApplicationChangesSchema,
          parameters
        );
        const { id, token, ...changes } = input;
        const email = yield* verify(token);
        return yield* updateApplication(id, email, changes);
      })
    );
  }

  public async uploadResume(parameters: unknown) {
    const { run, verify } = this;
    return run(
      Effect.gen(function* () {
        const input = yield* decodeInput(
          Schema.Struct({
            data: Schema.instanceOf(ArrayBuffer),
            filename: Schema.NonEmptyString,
            id: Schema.NonEmptyString,
            token: Schema.NonEmptyString
          }),
          parameters
        );
        const email = yield* verify(input.token);
        return yield* uploadResume({
          data: input.data,
          email,
          filename: input.filename,
          id: input.id
        });
      })
    );
  }

  private readonly layer = () => {
    return Layer.mergeAll(
      createJobApplicationRepositoryLayer(this.env.jobApplications),
      createResumeStoreLayer(this.env.jobResumes),
      createTokenVerifierLayer(this.env["token-auth"])
    );
  };

  private readonly run = async <A, E>(
    program: Effect.Effect<A, E, Services>
  ) => {
    const layer = this.layer();
    const result = toResult(program).pipe(Effect.provide(layer));
    return Effect.runPromise(result);
  };

  private readonly verify = (token: string) => {
    return Effect.gen(function* () {
      const verifier = yield* TokenVerifier;
      return yield* verifier.verify(token);
    });
  };
}

export default JobApplicationsService;
