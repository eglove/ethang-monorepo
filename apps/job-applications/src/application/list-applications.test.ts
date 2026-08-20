import { Array, Effect } from "effect";
import map from "lodash/map.js";
import some from "lodash/some.js";
import { describe, expect, it } from "vitest";

import { createJobApplication } from "../domain/job-application/aggregate.ts";
import { decodeApplicationCursor } from "./application-cursor.ts";
import { listApplications } from "./list-applications.ts";
import { createFakeRepository } from "./test/fake-repo.ts";

const EMAIL = "me@example.com";
const JULY = "2026-07-01";
const AUGUST = "2026-08-01";

const makeDefaults = () => {
  return {
    applicationUrl: `https://example.com/jobs/${crypto.randomUUID()}`,
    appliedDate: AUGUST,
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
  // Created oldest-id first so id order and appliedDate order disagree;
  // the list must follow appliedDate, not insertion id order.
  it("returns owned items newest applied first", () => {
    const august = make({ appliedDate: AUGUST, title: "August" });
    const june = make({ appliedDate: "2026-06-01", title: "June" });
    const july = make({ appliedDate: JULY, title: "July" });
    const { layer } = createFakeRepository([august, june, july]);
    const { items } = Effect.runSync(
      listApplications({
        after: null,
        email: EMAIL,
        first: 10,
        status: null
      }).pipe(Effect.provide(layer))
    );
    expect(map(items, "title")).toStrictEqual(["August", "July", "June"]);
  });

  it("breaks appliedDate ties by newest id", () => {
    const first = make({ title: "first" });
    const second = make({ title: "second" });
    const { layer } = createFakeRepository([first, second]);
    const { items } = Effect.runSync(
      listApplications({
        after: null,
        email: EMAIL,
        first: 10,
        status: null
      }).pipe(Effect.provide(layer))
    );
    const ids = map(items, "id");
    expect(ids).toStrictEqual(
      Array.fromIterable(ids).toSorted((a, b) => {
        return b.localeCompare(a);
      })
    );
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
    expect(items[0]?.id).toBe(applied.id);
  });

  it("encodes the last row into nextCursor on a full page", () => {
    const july = make({ appliedDate: JULY });
    const august = make({ appliedDate: AUGUST });
    const { layer } = createFakeRepository([july, august]);
    const { items, nextCursor } = Effect.runSync(
      listApplications({
        after: null,
        email: EMAIL,
        first: 2,
        status: null
      }).pipe(Effect.provide(layer))
    );
    expect(items).toHaveLength(2);
    expect(nextCursor).not.toBeNull();
    // The cursor sits on the last (oldest) row of the full page.
    expect(decodeApplicationCursor(nextCursor)).toStrictEqual({
      appliedDate: july.appliedDate,
      id: july.id
    });
  });

  it("returns a null nextCursor on a partial page", () => {
    const only = make();
    const { layer } = createFakeRepository([only]);
    const { nextCursor } = Effect.runSync(
      listApplications({
        after: null,
        email: EMAIL,
        first: 2,
        status: null
      }).pipe(Effect.provide(layer))
    );
    expect(nextCursor).toBeNull();
  });

  it("paginates across tied dates without skipping or duplicating", () => {
    const tiedA = make();
    const tiedB = make();
    const earlier = make({ appliedDate: JULY });
    const { layer } = createFakeRepository([tiedA, tiedB, earlier]);
    const page1 = Effect.runSync(
      listApplications({
        after: null,
        email: EMAIL,
        first: 2,
        status: null
      }).pipe(Effect.provide(layer))
    );
    expect(map(page1.items, "appliedDate")).toStrictEqual([AUGUST, AUGUST]);
    const isEarlierLeaked = some(page1.items, ["id", earlier.id]);
    expect(isEarlierLeaked).toBe(false);
    const page1Cursor = page1.nextCursor;
    expect(page1Cursor).not.toBeNull();
    const lastOfPage1 = page1.items.at(-1);
    expect(decodeApplicationCursor(page1Cursor)).toStrictEqual({
      appliedDate: lastOfPage1?.appliedDate,
      id: lastOfPage1?.id
    });
    const page2 = Effect.runSync(
      listApplications({
        after: decodeApplicationCursor(page1Cursor),
        email: EMAIL,
        first: 2,
        status: null
      }).pipe(Effect.provide(layer))
    );
    expect(map(page2.items, "id")).toStrictEqual([earlier.id]);
    expect(page2.nextCursor).toBeNull();
    const seenIds = [...map(page1.items, "id"), earlier.id];
    const uniqueIds = new Set(seenIds);
    expect(uniqueIds.size).toBe(seenIds.length);
  });
});
