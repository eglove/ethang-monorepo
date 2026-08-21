import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { Effect } from "effect";
import map from "lodash/map.js";
import { beforeAll, beforeEach, describe, expect, inject, it } from "vitest";

import { JobApplicationRepository } from "../../application/ports/job-application-repository.ts";
import {
  createJobApplication,
  type JobApplication,
} from "../../domain/job-application/aggregate.ts";
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
const FOREIGN_EMAIL = "other@example.com";
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
      title: TITLE,
    }),
  );
};

const run = async <A>(
  effect: Effect.Effect<A, unknown, JobApplicationRepository>,
) => {
  return Effect.runPromise(
    Effect.provide(
      effect,
      createJobApplicationRepositoryLayer(env.jobApplications),
    ),
  );
};

const insertAll = async (apps: readonly JobApplication[]) => {
  await run(
    Effect.gen(function* () {
      const repo = yield* JobApplicationRepository;
      yield* Effect.forEach(
        apps,
        (app) => {
          return repo.insert(app);
        },
        { discard: true },
      );
    }),
  );
};

describe("drizzle repository", () => {
  it("inserts and finds by id (owner only)", async () => {
    const app = make();
    await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.insert(app);
      }),
    );
    const found = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.findById(app.id, EMAIL);
      }),
    );
    expect(found?.title).toBe("Engineer");
    const foreign = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.findById(app.id, FOREIGN_EMAIL);
      }),
    );
    expect(foreign).toBeNull();
  });

  it("maps the unique constraint violation to DuplicateApplicationError", async () => {
    const app = make();
    // first insert must succeed
    await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.insert(app);
      }),
    );
    // second insert with same (email, URL) must fail with DuplicateApplicationError
    const duplicate = await Effect.runPromise(
      Effect.flip(
        Effect.gen(function* () {
          const repo = yield* JobApplicationRepository;
          return yield* repo.insert(make());
        }).pipe(
          Effect.provide(
            createJobApplicationRepositoryLayer(env.jobApplications),
          ),
        ),
      ),
    );
    expect(duplicate).toBeInstanceOf(DuplicateApplicationError);
  });

  it("updates and deletes", async () => {
    const app = make();
    await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.insert(app);
      }),
    );
    const updated = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.update({ ...app, salary: "$150k" });
      }),
    );
    expect(updated.salary).toBe("$150k");
    const refetched = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.findById(app.id, EMAIL);
      }),
    );
    expect(refetched?.salary).toBe("$150k");
    const isDeleted = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.delete(app.id, EMAIL);
      }),
    );
    expect(isDeleted).toBe(true);
    const isAgain = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.delete(app.id, EMAIL);
      }),
    );
    expect(isAgain).toBe(false);
  });
});

describe("drizzle repository (list)", () => {
  it("lists only the requested applied date, newest id first", async () => {
    const june = make(jobUrl("june"), JUNE);
    const july = make(jobUrl("july"), JULY);
    const augustA = make(jobUrl("august-a"), APPLIED_DATE);
    const augustB = make(jobUrl("august-b"), APPLIED_DATE);
    await insertAll([june, july, augustA, augustB]);
    const items = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.list({
          appliedDate: APPLIED_DATE,
          email: EMAIL,
          status: null,
        });
      }),
    );
    const expectedIds = [augustA.id, augustB.id].toSorted((a, b) => {
      return b.localeCompare(a);
    });
    expect(map(items, "id")).toStrictEqual(expectedIds);
  });

  it("returns an empty list for a date without applications", async () => {
    await insertAll([make(jobUrl("june"), JUNE)]);
    const items = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.list({
          appliedDate: APPLIED_DATE,
          email: EMAIL,
          status: null,
        });
      }),
    );
    expect(items).toStrictEqual([]);
  });

  it("lists distinct applied dates newest first", async () => {
    await insertAll([
      make(jobUrl("june"), JUNE),
      make(jobUrl("july"), JULY),
      make(jobUrl("august-a"), APPLIED_DATE),
      make(jobUrl("august-b"), APPLIED_DATE),
    ]);
    const dates = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.listAppliedDates(EMAIL);
      }),
    );
    expect(dates).toStrictEqual([APPLIED_DATE, JULY, JUNE]);
  });

  it("excludes other users from the applied dates", async () => {
    const mine = make(jobUrl("mine"), JUNE);
    const foreign = Effect.runSync(
      createJobApplication({
        applicationUrl: jobUrl("foreign"),
        appliedDate: APPLIED_DATE,
        company: COMPANY,
        email: FOREIGN_EMAIL,
        title: TITLE,
      }),
    );
    await insertAll([mine, foreign]);
    const dates = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.listAppliedDates(EMAIL);
      }),
    );
    expect(dates).toStrictEqual([JUNE]);
  });

  it("returns no dates for a user without applications", async () => {
    const dates = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.listAppliedDates(EMAIL);
      }),
    );
    expect(dates).toStrictEqual([]);
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
        title: TITLE,
      }),
    );
    await insertAll([applied, interview]);
    const results = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.list({
          appliedDate: APPLIED_DATE,
          email: EMAIL,
          status: "applied",
        });
      }),
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
        email: FOREIGN_EMAIL,
        title: TITLE,
      }),
    );
    await insertAll([mine, foreign]);
    const results = await run(
      Effect.gen(function* () {
        const repo = yield* JobApplicationRepository;
        return yield* repo.list({
          appliedDate: APPLIED_DATE,
          email: EMAIL,
          status: null,
        });
      }),
    );
    expect(results).toHaveLength(1);
    const [only] = results;
    expect(only?.email).toBe(EMAIL);
  });
});
