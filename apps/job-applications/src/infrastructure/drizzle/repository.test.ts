import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { Array, Effect } from "effect";
import filter from "lodash/filter.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import { beforeAll, beforeEach, describe, expect, inject, it } from "vitest";

import { JobApplicationRepository } from "../../application/ports/job-application-repository.ts";
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
const TITLE = "Engineer";
const COMPANY = "Acme";
const APPLIED_DATE = "2026-08-01";
const JUNE = "2026-06-01";
const JULY = "2026-07-01";

const jobUrl = (slug: string) => {
  return `https://example.com/jobs/${slug}`;
};

const make = (url = jobUrl("1"), appliedDate = APPLIED_DATE) => {
  return Effect.runSync(
    createJobApplication({
      applicationUrl: url,
      appliedDate,
      company: COMPANY,
      email: EMAIL,
      title: TITLE
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
          return yield* repo.insert(make());
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
    const refetched = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.findById(app.id, EMAIL);
      })
    );
    expect(refetched?.salary).toBe("$150k");
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
});

describe("drizzle repository (list)", () => {
  it("lists newest appliedDate first with id tie-break", async () => {
    const june = make(jobUrl("june"), JUNE);
    const july = make(jobUrl("july"), JULY);
    const augustA = make(jobUrl("august-a"), APPLIED_DATE);
    const augustB = make(jobUrl("august-b"), APPLIED_DATE);
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
        yield* repo.insert(june);
        yield* repo.insert(july);
        yield* repo.insert(augustA);
        yield* repo.insert(augustB);
      })
    );
    const page = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.list({
          after: null,
          email: EMAIL,
          first: 10,
          status: null
        });
      })
    );
    expect(map(page, "appliedDate")).toStrictEqual([
      APPLIED_DATE,
      APPLIED_DATE,
      JULY,
      JUNE
    ]);
    const augustIds = map(filter(page, ["appliedDate", APPLIED_DATE]), "id");
    expect(augustIds).toStrictEqual(
      Array.fromIterable(augustIds).toSorted((a, b) => {
        return b.localeCompare(a);
      })
    );
  });

  it("paginates by composite cursor without skipping tied dates", async () => {
    const june = make(jobUrl("june"), JUNE);
    const july = make(jobUrl("july"), JULY);
    const augustA = make(jobUrl("august-a"), APPLIED_DATE);
    const augustB = make(jobUrl("august-b"), APPLIED_DATE);
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
        yield* repo.insert(june);
        yield* repo.insert(july);
        yield* repo.insert(augustA);
        yield* repo.insert(augustB);
      })
    );
    const augustIds = [augustA.id, augustB.id].toSorted((a, b) => {
      return b.localeCompare(a);
    });
    const page1 = await run(
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
    expect(map(page1, "id")).toStrictEqual(augustIds);
    const lastOfPage1 = page1.at(-1);
    if (isNil(lastOfPage1)) {
      throw new Error("the first page must contain rows");
    }
    const page2 = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.list({
          after: {
            appliedDate: lastOfPage1.appliedDate,
            id: lastOfPage1.id
          },
          email: EMAIL,
          first: 2,
          status: null
        });
      })
    );
    expect(map(page2, "id")).toStrictEqual([july.id, june.id]);
    const seenIds = [...map(page1, "id"), ...map(page2, "id")];
    const uniqueIds = new Set(seenIds);
    expect(uniqueIds.size).toBe(seenIds.length);
    expect(seenIds).toStrictEqual([...augustIds, july.id, june.id]);
  });

  it("lists with a composite after cursor", async () => {
    const layerInstance = createJobApplicationRepositoryLayer(
      env.jobApplications
    );
    const run = async <A>(
      effect: Effect.Effect<A, unknown, JobApplicationRepository>
    ) => {
      return Effect.runPromise(Effect.provide(effect, layerInstance));
    };
    const a = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.insert(make(jobUrl("a"), JUNE));
      })
    );
    const b = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.insert(make(jobUrl("b"), "2026-07-15"));
      })
    );
    await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.insert(make(jobUrl("c"), APPLIED_DATE));
      })
    );
    // The cursor sits on b; b itself and anything newer (c) are excluded.
    const page = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.list({
          after: { appliedDate: b.appliedDate, id: b.id },
          email: EMAIL,
          first: 10,
          status: null
        });
      })
    );
    expect(page).toHaveLength(1);
    const [only] = page;
    expect(only?.id).toBe(a.id);
  });
});

describe("drizzle repository (filters)", () => {
  it("lists with status filter", async () => {
    const applied = make(jobUrl("applied"));
    const interview = Effect.runSync(
      createJobApplication({
        applicationUrl: jobUrl("interview"),
        appliedDate: APPLIED_DATE,
        company: COMPANY,
        email: EMAIL,
        status: "interview",
        title: TITLE
      })
    );
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
        yield* repo.insert(applied);
        yield* repo.insert(interview);
      })
    );
    const results = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.list({
          after: null,
          email: EMAIL,
          first: 10,
          status: "applied"
        });
      })
    );
    expect(results).toHaveLength(1);
    const [only] = results;
    expect(only?.status).toBe("applied");
  });

  it("excludes other emails from list", async () => {
    const mine = make(jobUrl("mine"));
    const foreign = Effect.runSync(
      createJobApplication({
        applicationUrl: jobUrl("foreign"),
        appliedDate: APPLIED_DATE,
        company: COMPANY,
        email: "other@example.com",
        title: TITLE
      })
    );
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
        yield* repo.insert(mine);
        yield* repo.insert(foreign);
      })
    );
    const results = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.list({
          after: null,
          email: EMAIL,
          first: 10,
          status: null
        });
      })
    );
    expect(results).toHaveLength(1);
    const [only] = results;
    expect(only?.email).toBe(EMAIL);
  });
});
