import { describe, expect, it, vi } from "vitest";

const mockDb: Record<string, unknown> = {};

vi.mock("drizzle-orm/d1", () => ({
  drizzle: vi.fn().mockReturnValue(mockDb)
}));

const { modificationListQuery, modificationListsQuery } = await import(
  "./queries/modlist.ts"
);
const {
  conflictQuery,
  conflictsQuery,
  modificationQuery,
  modsQuery,
  patchesQuery,
  patchQuery,
  requirementQuery,
  requirementsQuery
} = await import("./queries/mods.ts");

function createMockDb(result: unknown) {
  const rows = Array.isArray(result) ? result : [result];
  const whereable: Record<string, unknown> = () => Promise.resolve(rows);
  whereable.limit = () => Promise.resolve(rows);
  whereable.then = (
    resolve: ((v: unknown) => void) | null,
    reject?: ((e: unknown) => void) | null
  ) => Promise.resolve(rows).then(resolve ?? (() => {}), reject ?? (() => {}));
  const fromable: Record<string, unknown> = {
    where: () => whereable
  };
  fromable.then = (
    resolve: ((v: unknown) => void) | null,
    reject?: ((e: unknown) => void) | null
  ) => Promise.resolve(rows).then(resolve ?? (() => {}), reject ?? (() => {}));
  return {
    select: () => ({
      from: () => fromable
    })
  } as unknown as Record<string, unknown>;
}

describe("modlist queries", () => {
  it("modificationListQuery returns first result", async () => {
    const row = { id: "ml1", name: "List" };
    const db = createMockDb(row);
    const result = await modificationListQuery(db as never, { id: "ml1" });
    expect(result).toEqual(row);
  });

  it("modificationListQuery returns null when no rows", async () => {
    const db = createMockDb([]);
    const result = await modificationListQuery(db as never, { id: "none" });
    expect(result).toBeNull();
  });

  it("modificationListsQuery returns all rows", async () => {
    const rows = [{ id: "ml1" }, { id: "ml2" }];
    const db = createMockDb(rows);
    const result = await modificationListsQuery(db as never);
    expect(result).toEqual(rows);
  });
});

describe("mods queries", () => {
  it("modificationQuery returns first result", async () => {
    const row = { id: "m1", title: "Mod" };
    const db = createMockDb(row);
    const result = await modificationQuery(db as never, { id: "m1" });
    expect(result).toEqual(row);
  });

  it("modificationQuery returns null when no rows", async () => {
    const db = createMockDb([]);
    const result = await modificationQuery(db as never, { id: "none" });
    expect(result).toBeNull();
  });

  it("modsQuery returns rows for a mod list", async () => {
    const rows = [{ id: "m1" }, { id: "m2" }];
    const db = createMockDb(rows);
    const result = await modsQuery(db as never, { modListId: "ml1" });
    expect(result).toEqual(rows);
  });

  it("requirementQuery returns first result", async () => {
    const row = { id: "r1" };
    const db = createMockDb(row);
    const result = await requirementQuery(db as never, { id: "r1" });
    expect(result).toEqual(row);
  });

  it("requirementQuery returns null when no rows", async () => {
    const db = createMockDb([]);
    const result = await requirementQuery(db as never, { id: "none" });
    expect(result).toBeNull();
  });

  it("requirementsQuery returns rows for a mod list", async () => {
    const rows = [{ id: "r1" }];
    const db = createMockDb(rows);
    const result = await requirementsQuery(db as never, { modListId: "ml1" });
    expect(result).toEqual(rows);
  });

  it("conflictQuery returns first result", async () => {
    const row = { id: "c1" };
    const db = createMockDb(row);
    const result = await conflictQuery(db as never, { id: "c1" });
    expect(result).toEqual(row);
  });

  it("conflictQuery returns null when no rows", async () => {
    const db = createMockDb([]);
    const result = await conflictQuery(db as never, { id: "none" });
    expect(result).toBeNull();
  });

  it("conflictsQuery returns rows for a mod list", async () => {
    const rows = [{ id: "c1" }];
    const db = createMockDb(rows);
    const result = await conflictsQuery(db as never, { modListId: "ml1" });
    expect(result).toEqual(rows);
  });

  it("patchQuery returns first result", async () => {
    const row = { id: "p1" };
    const db = createMockDb(row);
    const result = await patchQuery(db as never, { id: "p1" });
    expect(result).toEqual(row);
  });

  it("patchQuery returns null when no rows", async () => {
    const db = createMockDb([]);
    const result = await patchQuery(db as never, { id: "none" });
    expect(result).toBeNull();
  });

  it("patchesQuery returns rows for a mod list", async () => {
    const rows = [{ id: "p1" }];
    const db = createMockDb(rows);
    const result = await patchesQuery(db as never, { modListId: "ml1" });
    expect(result).toEqual(rows);
  });
});
