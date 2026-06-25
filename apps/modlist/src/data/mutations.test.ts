import { describe, expect, it, vi } from "vitest";

vi.mock("drizzle-orm/d1", () => ({
  drizzle: vi.fn().mockReturnValue({})
}));

const { modificationListTable } = await import("../db/schema.ts");
const { modificationTable } = await import("../db/schema.ts");
const { requirementTable } = await import("../db/schema.ts");
const { conflictTable } = await import("../db/schema.ts");
const { patchTable } = await import("../db/schema.ts");

const {
  createModificationListMutation,
  updateModificationListMutation,
  deleteModificationListMutation
} = await import("./mutations/modlist.ts");
const {
  createModificationMutation,
  updateModificationMutation,
  deleteModificationMutation
} = await import("./mutations/mods.ts");
const {
  addRequirementMutation,
  removeRequirementMutation
} = await import("./mutations/requirements.ts");
const {
  addConflictMutation,
  removeConflictMutation
} = await import("./mutations/conflicts.ts");
const { addPatchMutation, removePatchMutation } = await import(
  "./mutations/patches.ts"
);

function createInsertMockDb(returning: unknown) {
  return {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([returning])
      })
    })
  } as unknown as Record<string, unknown>;
}

function createUpdateMockDb(returning: unknown) {
  return {
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([returning])
        })
      })
    })
  } as unknown as Record<string, unknown>;
}

function createDeleteMockDb() {
  return {
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined)
    })
  } as unknown as Record<string, unknown>;
}

describe("modlist mutations", () => {
  it("createModificationListMutation inserts and returns row", async () => {
    const row = { id: "ml1", name: "List" };
    const db = createInsertMockDb(row);
    const result = await createModificationListMutation(db as never, {
      name: "List"
    });
    expect(result).toEqual(row);
  });

  it("updateModificationListMutation updates and returns row", async () => {
    const row = { id: "ml1", name: "Updated" };
    const db = createUpdateMockDb(row);
    const result = await updateModificationListMutation(db as never, {
      id: "ml1",
      name: "Updated"
    });
    expect(result).toEqual(row);
  });

  it("deleteModificationListMutation deletes", async () => {
    const db = createDeleteMockDb();
    await deleteModificationListMutation(db as never, { id: "ml1" });
  });
});

describe("mods mutations", () => {
  it("createModificationMutation inserts and returns row", async () => {
    const row = { id: "m1", title: "Mod", url: "https://x" };
    const db = createInsertMockDb(row);
    const result = await createModificationMutation(db as never, {
      modListId: "ml1",
      title: "Mod",
      url: "https://x"
    });
    expect(result).toEqual(row);
  });

  it("updateModificationMutation updates and returns row", async () => {
    const row = { id: "m1", title: "Mod", url: "https://x" };
    const db = createUpdateMockDb(row);
    const result = await updateModificationMutation(db as never, {
      id: "m1",
      title: "Mod",
      url: "https://x"
    });
    expect(result).toEqual(row);
  });

  it("deleteModificationMutation deletes", async () => {
    const db = createDeleteMockDb();
    await deleteModificationMutation(db as never, { id: "m1" });
  });
});

describe("requirements mutations", () => {
  it("addRequirementMutation inserts and returns row", async () => {
    const row = { id: "r1" };
    const db = createInsertMockDb(row);
    const result = await addRequirementMutation(db as never, {
      parentModId: "m1",
      requiresModId: "m2"
    });
    expect(result).toEqual(row);
  });

  it("removeRequirementMutation deletes", async () => {
    const db = createDeleteMockDb();
    await removeRequirementMutation(db as never, { id: "r1" });
  });
});

describe("conflicts mutations", () => {
  it("addConflictMutation inserts and returns row", async () => {
    const row = { id: "c1" };
    const db = createInsertMockDb(row);
    const result = await addConflictMutation(db as never, {
      modAId: "m1",
      modBId: "m2"
    });
    expect(result).toEqual(row);
  });

  it("removeConflictMutation deletes", async () => {
    const db = createDeleteMockDb();
    await removeConflictMutation(db as never, { id: "c1" });
  });
});

describe("patches mutations", () => {
  it("addPatchMutation inserts and returns row", async () => {
    const row = { id: "p1" };
    const db = createInsertMockDb(row);
    const result = await addPatchMutation(db as never, {
      modAId: "m1",
      modBId: "m2",
      patchedById: "m3"
    });
    expect(result).toEqual(row);
  });

  it("removePatchMutation deletes", async () => {
    const db = createDeleteMockDb();
    await removePatchMutation(db as never, { id: "p1" });
  });
});
