import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

import { JobApplicationRepository as JobAppRepo } from "./ports/job-application-repository.ts";
import { ResumeStore } from "./ports/resume-store.ts";
import { TokenVerifier } from "./ports/token-verifier.ts";

describe("ports", () => {
  it("provides all three tags through a merged layer", () => {
    const layer = Layer.mergeAll(
      Layer.succeed(JobAppRepo, {
        delete: () => {
          return Effect.succeed(true);
        },
        findByEmailAndUrl: () => {
          return Effect.succeed(null);
        },
        findById: () => {
          return Effect.succeed(null);
        },
        insert: (app) => {
          return Effect.succeed(app);
        },
        list: () => {
          return Effect.succeed([]);
        },
        listAppliedDates: () => {
          return Effect.succeed([]);
        },
        update: (app) => {
          return Effect.succeed(app);
        }
      }),
      Layer.succeed(ResumeStore, {
        delete: () => {
          return Effect.succeed(undefined);
        },
        get: () => {
          return Effect.succeed(null);
        },
        put: () => {
          return Effect.succeed(undefined);
        }
      }),
      Layer.succeed(TokenVerifier, {
        verify: () => {
          return Effect.succeed("me@example.com");
        }
      })
    );
    const program = Effect.gen(function* () {
      const repo = yield* JobAppRepo;
      const store = yield* ResumeStore;
      const verifier = yield* TokenVerifier;
      return [repo, store, verifier] as const;
    });
    const [repo, store, verifier] = Effect.runSync(
      Effect.provide(program, layer)
    );
    expect(repo).toBeDefined();
    expect(store).toBeDefined();
    expect(verifier).toBeDefined();
  });
});
