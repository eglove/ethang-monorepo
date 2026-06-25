import { describe, expect, it, vi } from "vitest";

const mockDatabase: Record<string, unknown> = {};

vi.mock(import("drizzle-orm/d1"), () => {
  return {
    drizzle: vi.fn().mockReturnValue(mockDatabase)
  };
});

const { modificationListQuery, modificationListsQuery } =
  await import("./queries/modlist.ts");
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

function createMockDatabase(result: unknown) {
  const rows = toArray(result);
  const queryable: any = Promise.resolve(rows);
  queryable.where = () => {
    return queryable;
  };
  queryable.limit = () => {
    return queryable;
  };
  return {
    select: () => {
      return {
        from: () => {
          return queryable;
        }
      };
    }
  } as unknown as Record<string, unknown>;
}

function toArray(value: unknown): unknown[] {
  return "[object Array]" === Object.prototype.toString.call(value)
    ? (value as unknown[])
    : [value];
}

describe("modlist queries", () => {
  it("modificationListQuery returns first result", async () => {
    const row = { id: "ml1", name: "List" };
    const database = createMockDatabase(row);
    const result = await modificationListQuery(database as never, {
      id: "ml1"
    });

    expect(result).toEqual(row);
  });

  it("modificationListQuery returns null when no rows", async () => {
    const database = createMockDatabase([]);
    const result = await modificationListQuery(database as never, {
      id: "none"
    });

    expect(result).toBeNull();
  });

  it("modificationListsQuery returns all rows", async () => {
    const rows = [{ id: "ml1" }, { id: "ml2" }];
    const database = createMockDatabase(rows);
    const result = await modificationListsQuery(database as never);

    expect(result).toEqual(rows);
  });
});

describe("mods queries", () => {
  it("modificationQuery returns first result", async () => {
    const row = { id: "m1", title: "Mod" };
    const database = createMockDatabase(row);
    const result = await modificationQuery(database as never, { id: "m1" });

    expect(result).toEqual(row);
  });

  it("modificationQuery returns null when no rows", async () => {
    const database = createMockDatabase([]);
    const result = await modificationQuery(database as never, { id: "none" });

    expect(result).toBeNull();
  });

  it("modsQuery returns rows for a mod list", async () => {
    const rows = [{ id: "m1" }, { id: "m2" }];
    const database = createMockDatabase(rows);
    const result = await modsQuery(database as never, { modListId: "ml1" });

    expect(result).toEqual(rows);
  });

  it("requirementQuery returns first result", async () => {
    const row = { id: "r1" };
    const database = createMockDatabase(row);
    const result = await requirementQuery(database as never, { id: "r1" });

    expect(result).toEqual(row);
  });

  it("requirementQuery returns null when no rows", async () => {
    const database = createMockDatabase([]);
    const result = await requirementQuery(database as never, { id: "none" });

    expect(result).toBeNull();
  });

  it("requirementsQuery returns rows for a mod list", async () => {
    const rows = [{ id: "r1" }];
    const database = createMockDatabase(rows);
    const result = await requirementsQuery(database as never, {
      modListId: "ml1"
    });

    expect(result).toEqual(rows);
  });

  it("conflictQuery returns first result", async () => {
    const row = { id: "c1" };
    const database = createMockDatabase(row);
    const result = await conflictQuery(database as never, { id: "c1" });

    expect(result).toEqual(row);
  });

  it("conflictQuery returns null when no rows", async () => {
    const database = createMockDatabase([]);
    const result = await conflictQuery(database as never, { id: "none" });

    expect(result).toBeNull();
  });

  it("conflictsQuery returns rows for a mod list", async () => {
    const rows = [{ id: "c1" }];
    const database = createMockDatabase(rows);
    const result = await conflictsQuery(database as never, {
      modListId: "ml1"
    });

    expect(result).toEqual(rows);
  });

  it("patchQuery returns first result", async () => {
    const row = { id: "p1" };
    const database = createMockDatabase(row);
    const result = await patchQuery(database as never, { id: "p1" });

    expect(result).toEqual(row);
  });

  it("patchQuery returns null when no rows", async () => {
    const database = createMockDatabase([]);
    const result = await patchQuery(database as never, { id: "none" });

    expect(result).toBeNull();
  });

  it("patchesQuery returns rows for a mod list", async () => {
    const rows = [{ id: "p1" }];
    const database = createMockDatabase(rows);
    const result = await patchesQuery(database as never, { modListId: "ml1" });

    expect(result).toEqual(rows);
  });
});
