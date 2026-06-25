import { describe, expect, it, vi } from "vitest";

vi.mock(import("drizzle-orm/d1"), () => {
  return {
    drizzle: vi.fn().mockReturnValue({})
  };
});

await import("../db/schema.ts");

const {
  createModificationListMutation,
  deleteModificationListMutation,
  updateModificationListMutation
} = await import("./mutations/modlist.ts");
const {
  createModificationMutation,
  deleteModificationMutation,
  updateModificationMutation
} = await import("./mutations/mods.ts");
const { addRequirementMutation, removeRequirementMutation } =
  await import("./mutations/requirements.ts");
const { addConflictMutation, removeConflictMutation } =
  await import("./mutations/conflicts.ts");
const { addPatchMutation, removePatchMutation } =
  await import("./mutations/patches.ts");

function createDeleteMockDatabase() {
  return {
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined)
    })
  } as any;
}

function createInsertMockDatabase(returning: unknown) {
  return {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([returning])
      })
    })
  } as unknown as Record<string, unknown>;
}

function createUpdateMockDatabase(returning: unknown) {
  const chain = {
    returning: vi.fn().mockResolvedValue([returning])
  };
  return {
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue(chain)
      })
    })
  } as unknown as Record<string, unknown>;
}

describe("modlist mutations", () => {
  it("createModificationListMutation inserts and returns row", async () => {
    const row = { id: "ml1", name: "List" };
    const database = createInsertMockDatabase(row);
    const result = await createModificationListMutation(database as never, {
      name: "List"
    });

    expect(result).toEqual(row);
  });

  it("updateModificationListMutation updates and returns row", async () => {
    const row = { id: "ml1", name: "Updated" };
    const database = createUpdateMockDatabase(row);
    const result = await updateModificationListMutation(database as never, {
      id: "ml1",
      name: "Updated"
    });

    expect(result).toEqual(row);
  });

  it("deleteModificationListMutation deletes", async () => {
    const database = createDeleteMockDatabase();
    await deleteModificationListMutation(database as never, { id: "ml1" });
    expect(database.delete).toHaveBeenCalled();
  });
});

describe("mods mutations", () => {
  it("createModificationMutation inserts and returns row", async () => {
    const row = { id: "m1", title: "Mod", url: "https://x" };
    const database = createInsertMockDatabase(row);
    const result = await createModificationMutation(database as never, {
      modListId: "ml1",
      title: "Mod",
      url: "https://x"
    });

    expect(result).toEqual(row);
  });

  it("updateModificationMutation updates and returns row", async () => {
    const row = { id: "m1", title: "Mod", url: "https://x" };
    const database = createUpdateMockDatabase(row);
    const result = await updateModificationMutation(database as never, {
      id: "m1",
      title: "Mod",
      url: "https://x"
    });

    expect(result).toEqual(row);
  });

  it("deleteModificationMutation deletes", async () => {
    const database = createDeleteMockDatabase();
    await deleteModificationMutation(database as never, { id: "m1" });
    expect(database.delete).toHaveBeenCalled();
  });
});

describe("requirements mutations", () => {
  it("addRequirementMutation inserts and returns row", async () => {
    const row = { id: "r1" };
    const database = createInsertMockDatabase(row);
    const result = await addRequirementMutation(database as never, {
      parentModId: "m1",
      requiresModId: "m2"
    });

    expect(result).toEqual(row);
  });

  it("removeRequirementMutation deletes", async () => {
    const database = createDeleteMockDatabase();
    await removeRequirementMutation(database as never, { id: "r1" });
    expect(database.delete).toHaveBeenCalled();
  });
});

describe("conflicts mutations", () => {
  it("addConflictMutation inserts and returns row", async () => {
    const row = { id: "c1" };
    const database = createInsertMockDatabase(row);
    const result = await addConflictMutation(database as never, {
      modAId: "m1",
      modBId: "m2"
    });

    expect(result).toEqual(row);
  });

  it("removeConflictMutation deletes", async () => {
    const database = createDeleteMockDatabase();
    await removeConflictMutation(database as never, { id: "c1" });
    expect(database.delete).toHaveBeenCalled();
  });
});

describe("patches mutations", () => {
  it("addPatchMutation inserts and returns row", async () => {
    const row = { id: "p1" };
    const database = createInsertMockDatabase(row);
    const result = await addPatchMutation(database as never, {
      modAId: "m1",
      modBId: "m2",
      patchedById: "m3"
    });

    expect(result).toEqual(row);
  });

  it("removePatchMutation deletes", async () => {
    const database = createDeleteMockDatabase();
    await removePatchMutation(database as never, { id: "p1" });
    expect(database.delete).toHaveBeenCalled();
  });
});
