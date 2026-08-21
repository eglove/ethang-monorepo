import { Effect } from "effect";
import map from "lodash/map.js";
import { describe, expect, it } from "vitest";

import { createJobApplication } from "../domain/job-application/aggregate.ts";
import { listApplications } from "./list-applications.ts";
import { createFakeRepository } from "./test/fake-repo.ts";

const EMAIL = "me@example.com";
const AUGUST = "2026-08-01";

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

describe("listApplications", () => {
  it("returns only items applied on the requested date, newest id first", () => {
    const augustA = make({ title: "August A" });
    const augustB = make({ title: "August B" });
    const july = make({ appliedDate: "2026-07-01", title: "July" });
    const { layer } = createFakeRepository([augustA, july, augustB]);
    const { items } = Effect.runSync(
      listApplications({
        appliedDate: AUGUST,
        email: EMAIL,
        status: null,
      }).pipe(Effect.provide(layer)),
    );
    const expectedIds = map([augustA, augustB], "id").toSorted((a, b) => {
      return b.localeCompare(a);
    });
    expect(map(items, "id")).toStrictEqual(expectedIds);
  });

  it("returns only items without cursor metadata", () => {
    const only = make();
    const { layer } = createFakeRepository([only]);
    const result = Effect.runSync(
      listApplications({
        appliedDate: AUGUST,
        email: EMAIL,
        status: null,
      }).pipe(Effect.provide(layer)),
    );
    expect(result).toStrictEqual({ items: [only] });
  });

  it("filters by status and excludes other users", () => {
    const applied = make({ status: "applied" });
    const interview = make({ status: "interview" });
    const foreign = make({ email: "other@example.com", status: "applied" });
    const { layer } = createFakeRepository([applied, interview, foreign]);
    const { items } = Effect.runSync(
      listApplications({
        appliedDate: AUGUST,
        email: EMAIL,
        status: "applied",
      }).pipe(Effect.provide(layer)),
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe(applied.id);
  });

  it("returns empty items for a date without applications", () => {
    const only = make({ appliedDate: "2026-07-01" });
    const { layer } = createFakeRepository([only]);
    const { items } = Effect.runSync(
      listApplications({
        appliedDate: AUGUST,
        email: EMAIL,
        status: null,
      }).pipe(Effect.provide(layer)),
    );
    expect(items).toStrictEqual([]);
  });
});
