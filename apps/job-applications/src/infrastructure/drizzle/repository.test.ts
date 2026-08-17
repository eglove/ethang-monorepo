/* eslint-disable unicorn/name-replacements */
import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { Effect } from "effect";
import { beforeAll, beforeEach, describe, expect, inject, it } from "vitest";

import { JobApplicationRepository } from "../../application/ports.ts";
import { createJobApplication } from "../../domain/job-application/aggregate.ts";
import { DuplicateApplicationError } from "../../errors/duplicate-application-error.ts";
import { createJobApplicationRepositoryLayer } from "./repository.ts";

beforeAll(async () => {
  const migrations = inject("migrations");
  await applyD1Migrations(env.jobApplications, migrations);
});

beforeEach(async () => {
  await env.jobApplications.exec("DELETE FROM job_applications");
});

const EMAIL = "me@example.com";

const make = (url = "https://example.com/jobs/1") => {
  return Effect.runSync(
    createJobApplication({
      applicationUrl: url,
      appliedDate: "2026-08-01",
      company: "Acme",
      email: EMAIL,
      title: "Engineer"
    })
  );
};

describe("drizzle repository", () => {
  it("inserts and finds by id (owner only)", async () => {
    const app = make();
    const layerInstance = createJobApplicationRepositoryLayer(
      env.jobApplications
    );
    const run = async <A>(
      effect: Effect.Effect<A, unknown, JobApplicationRepository>
    ) => {
      return Effect.runPromise(Effect.provide(effect, layerInstance));
    };
    await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.insert(app);
      })
    );
    const found = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.findById(app.id, EMAIL);
      })
    );
    expect(found?.title).toBe("Engineer");
    const foreign = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.findById(app.id, "other@example.com");
      })
    );
    expect(foreign).toBeNull();
  });

  it("maps the unique constraint violation to DuplicateApplicationError", async () => {
    const app = make();
    const layerInstance = createJobApplicationRepositoryLayer(
      env.jobApplications
    );
    const run = async <A>(
      effect: Effect.Effect<A, unknown, JobApplicationRepository>
    ) => {
      return Effect.runPromise(Effect.provide(effect, layerInstance));
    };
    // first insert must succeed
    await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.insert(app);
      })
    );
    // second insert with same (email, URL) must fail with DuplicateApplicationError
    const duplicate = await Effect.runPromise(
      Effect.flip(
        Effect.gen(function* () {
          const repo = yield* JobApplicationRepository;
          return yield* repo.insert(make("https://example.com/jobs/1"));
        }).pipe(Effect.provide(layerInstance))
      )
    );
    expect(duplicate).toBeInstanceOf(DuplicateApplicationError);
  });

  it("updates and deletes", async () => {
    const app = make();
    const layerInstance = createJobApplicationRepositoryLayer(
      env.jobApplications
    );
    const run = async <A>(
      effect: Effect.Effect<A, unknown, JobApplicationRepository>
    ) => {
      return Effect.runPromise(Effect.provide(effect, layerInstance));
    };
    await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.insert(app);
      })
    );
    const updated = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.update({ ...app, salary: "$150k" });
      })
    );
    expect(updated.salary).toBe("$150k");
    const isDeleted = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.delete(app.id, EMAIL);
      })
    );
    expect(isDeleted).toBe(true);
    const isAgain = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.delete(app.id, EMAIL);
      })
    );
    expect(isAgain).toBe(false);
  });

  it("lists newest-first, filtered and paginated", async () => {
    const a = make("https://example.com/jobs/a");
    const b = make("https://example.com/jobs/b");
    const c = make("https://example.com/jobs/c");
    const layerInstance = createJobApplicationRepositoryLayer(
      env.jobApplications
    );
    const run = async <A>(
      effect: Effect.Effect<A, unknown, JobApplicationRepository>
    ) => {
      return Effect.runPromise(Effect.provide(effect, layerInstance));
    };
    await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        yield* repo.insert(a);
        yield* repo.insert(b);
        yield* repo.insert(c);
        return yield* repo.list({
          after: null,
          email: EMAIL,
          first: 10,
          status: null
        });
      })
    );
    const page = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.list({
          after: null,
          email: EMAIL,
          first: 2,
          status: null
        });
      })
    );
    expect(page).toHaveLength(2);
    const [first, second] = page;
    // ULID ids are lexicographically ordered; string comparison is valid here
    // eslint-disable-next-line sonar/strings-comparison
    expect((first?.id ?? "") > (second?.id ?? "")).toBe(true);
  });
});
