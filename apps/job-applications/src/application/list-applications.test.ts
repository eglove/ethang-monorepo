/* eslint-disable unicorn/name-replacements */
import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { createJobApplication } from "../domain/job-application/aggregate.ts";
import { listApplications } from "./list-applications.ts";
import { createFakeRepository } from "./test/fake-repository.ts";

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
    const result = Effect.runSync(
      listApplications({
        after: null,
        email: EMAIL,
        first: 10,
        status: null
      }).pipe(Effect.provide(layer))
    );
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const typedResult = result as {
      items: (typeof a)[];
      nextCursor: null | string;
    };
    expect(typedResult.items).toHaveLength(2);
    const [first, second] = typedResult.items;
    // eslint-disable-next-line sonar/strings-comparison
    expect(first && second && first.id > second.id).toBe(true);
    expect(typedResult.nextCursor).toBeNull();
  });

  it("filters by status and excludes other users", () => {
    const applied = make({ status: "applied" });
    const interview = make({ status: "interview" });
    const foreign = make({ email: "other@example.com", status: "applied" });
    const { layer } = createFakeRepository([applied, interview, foreign]);
    const result = Effect.runSync(
      listApplications({
        after: null,
        email: EMAIL,
        first: 10,
        status: "applied"
      }).pipe(Effect.provide(layer))
    );

    const typedResult = result as { items: (typeof applied)[] };
    expect(typedResult.items).toHaveLength(1);
    const [item] = typedResult.items;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(item!.id).toBe(applied.id);
  });

  it("paginates with after cursor and returns nextCursor on a full page", () => {
    const a = make();
    const b = make();
    const c = make();
    const { layer } = createFakeRepository([a, b, c]);
    const page1Result = Effect.runSync(
      listApplications({
        after: null,
        email: EMAIL,
        first: 2,
        status: null
      }).pipe(Effect.provide(layer))
    );
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const page1 = page1Result as {
      items: (typeof a)[];
      nextCursor: null | string;
    };
    expect(page1.items).toHaveLength(2);
    expect(page1.nextCursor).not.toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const cursor = page1.nextCursor!;
    const page2Result = Effect.runSync(
      listApplications({
        after: cursor,
        email: EMAIL,
        first: 2,
        status: null
      }).pipe(Effect.provide(layer))
    );
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const page2 = page2Result as {
      items: (typeof a)[];
      nextCursor: null | string;
    };
    expect(page2.items).toHaveLength(1);
    expect(page2.nextCursor).toBeNull();
  });
});
