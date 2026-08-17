/* eslint-disable unicorn/name-replacements */
import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { createJobApplication } from "../domain/job-application/aggregate.ts";
import { listApplications } from "./list-applications.ts";
import { createFakeRepository } from "./test/fake-repo.ts";

const EMAIL = "me@example.com";

const makeDefaults = () => {
  return {
    applicationUrl: `https://example.com/jobs/${crypto.randomUUID()}`,
    appliedDate: "2026-08-01",
    company: "Acme",
    email: EMAIL,
    title: "Engineer"
  };
};

const make = (
  overrides?: Partial<Parameters<typeof createJobApplication>[0]>
) => {
  return Effect.runSync(
    createJobApplication({ ...makeDefaults(), ...overrides })
  );
};

describe("listApplications", () => {
  it("returns owned items newest-first", () => {
    const a = make({ title: "A" });
    const b = make({ title: "B" });
    const { layer } = createFakeRepository([a, b]);
    const { items, nextCursor } = Effect.runSync(
      listApplications({
        after: null,
        email: EMAIL,
        first: 10,
        status: null
      }).pipe(Effect.provide(layer))
    );
    expect(items).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion,sonar/strings-comparison
    expect(items[0]!.id > items[1]!.id).toBe(true);
    expect(nextCursor).toBeNull();
  });

  it("filters by status and excludes other users", () => {
    const applied = make({ status: "applied" });
    const interview = make({ status: "interview" });
    const foreign = make({ email: "other@example.com", status: "applied" });
    const { layer } = createFakeRepository([applied, interview, foreign]);
    const { items } = Effect.runSync(
      listApplications({
        after: null,
        email: EMAIL,
        first: 10,
        status: "applied"
      }).pipe(Effect.provide(layer))
    );

    expect(items).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(items[0]!.id).toBe(applied.id);
  });

  it("paginates with after cursor and returns nextCursor on a full page", () => {
    const a = make();
    const b = make();
    const c = make();
    const { layer } = createFakeRepository([a, b, c]);
    const { items: page1Items, nextCursor: page1Cursor } = Effect.runSync(
      listApplications({
        after: null,
        email: EMAIL,
        first: 2,
        status: null
      }).pipe(Effect.provide(layer))
    );
    expect(page1Items).toHaveLength(2);
    expect(page1Cursor).not.toBeNull();
    const { items: page2Items, nextCursor: page2Cursor } = Effect.runSync(
      listApplications({
        after: page1Cursor,
        email: EMAIL,
        first: 2,
        status: null
      }).pipe(Effect.provide(layer))
    );
    expect(page2Items).toHaveLength(1);
    expect(page2Cursor).toBeNull();
  });
});
