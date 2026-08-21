import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { createJobApplication } from "../domain/job-application/aggregate.ts";
import { listAppliedDates } from "./list-applied-dates.ts";
import { createFakeRepository } from "./test/fake-repo.ts";

const EMAIL = "me@example.com";
const AUGUST = "2026-08-01";
const JULY = "2026-07-01";

const makeDefaults = () => {
  return {
    applicationUrl: `https://example.com/jobs/${crypto.randomUUID()}`,
    appliedDate: AUGUST,
    company: "Acme",
    email: EMAIL,
    title: "Engineer",
  };
};

const make = (
  overrides?: Partial<Parameters<typeof createJobApplication>[0]>,
) => {
  return Effect.runSync(
    createJobApplication({ ...makeDefaults(), ...overrides }),
  );
};

describe("listAppliedDates", () => {
  it("returns owned distinct dates newest first", () => {
    const august = make({ appliedDate: AUGUST });
    const augustAgain = make({ appliedDate: AUGUST, title: "Second" });
    const july = make({ appliedDate: JULY });
    const { layer } = createFakeRepository([august, july, augustAgain]);
    const dates = Effect.runSync(
      listAppliedDates({ email: EMAIL }).pipe(Effect.provide(layer)),
    );
    expect(dates).toStrictEqual([AUGUST, JULY]);
  });

  it("excludes other users' dates", () => {
    const mine = make({ appliedDate: AUGUST });
    const foreign = make({
      appliedDate: JULY,
      email: "other@example.com",
    });
    const { layer } = createFakeRepository([mine, foreign]);
    const dates = Effect.runSync(
      listAppliedDates({ email: EMAIL }).pipe(Effect.provide(layer)),
    );
    expect(dates).toStrictEqual([AUGUST]);
  });

  it("returns an empty list when the user has no applications", () => {
    const { layer } = createFakeRepository([]);
    const dates = Effect.runSync(
      listAppliedDates({ email: EMAIL }).pipe(Effect.provide(layer)),
    );
    expect(dates).toStrictEqual([]);
  });
});
