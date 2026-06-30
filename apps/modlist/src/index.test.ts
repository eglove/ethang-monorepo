import { describe, expect, it, vi } from "vitest";

const { TEST_MOD_DATA, TEST_MODLIST_DATA } = vi.hoisted(() => {
  return {
    TEST_MOD_DATA: {
      id: "m1",
      modListId: "ml1",
      title: "Test Mod",
      url: "https://example.com/mod"
    } as const,
    TEST_MODLIST_DATA: { id: "ml1", name: "Test Mod List" } as const
  };
});

vi.mock("cloudflare:workers", () => {
  return {
    WorkerEntrypoint: class {
      public ctx = {};
      public env: Record<string, unknown> = {};
    }
  };
});

vi.mock(import("drizzle-orm/d1"), () => {
  return {
    drizzle: vi.fn().mockReturnValue({ _mockDb: true })
  };
});

vi.mock(import("./data/queries/modlist.ts"), () => {
  return {
    modificationListQuery: vi.fn().mockResolvedValue(TEST_MODLIST_DATA),
    modificationListsQuery: vi.fn().mockResolvedValue([TEST_MODLIST_DATA])
  };
});

vi.mock(import("./data/queries/mods.ts"), () => {
  return {
    conflictQuery: vi.fn().mockResolvedValue(null),
    conflictsQuery: vi.fn().mockResolvedValue([]),
    modificationQuery: vi.fn().mockResolvedValue(TEST_MOD_DATA),
    modsQuery: vi.fn().mockResolvedValue([TEST_MOD_DATA]),
    patchesQuery: vi.fn().mockResolvedValue([]),
    patchQuery: vi.fn().mockResolvedValue(null),
    requirementQuery: vi.fn().mockResolvedValue(null),
    requirementsQuery: vi.fn().mockResolvedValue([])
  };
});

vi.mock(import("./data/mutations/modlist.ts"), () => {
  return {
    createModificationListMutation: vi
      .fn()
      .mockResolvedValue(TEST_MODLIST_DATA),
    deleteModificationListMutation: vi.fn().mockResolvedValue(undefined),
    updateModificationListMutation: vi.fn().mockResolvedValue(TEST_MODLIST_DATA)
  };
});

vi.mock(import("./data/mutations/mods.ts"), () => {
  return {
    createModificationMutation: vi.fn().mockResolvedValue(TEST_MOD_DATA),
    deleteModificationMutation: vi.fn().mockResolvedValue(undefined),
    updateModificationMutation: vi.fn().mockResolvedValue(TEST_MOD_DATA)
  };
});

vi.mock(import("./data/mutations/requirements.ts"), () => {
  return {
    addRequirementMutation: vi.fn().mockResolvedValue({ id: "r1" }),
    removeRequirementMutation: vi.fn().mockResolvedValue(undefined)
  };
});

vi.mock(import("./data/mutations/conflicts.ts"), () => {
  return {
    addConflictMutation: vi.fn().mockResolvedValue({ id: "c1" }),
    removeConflictMutation: vi.fn().mockResolvedValue(undefined)
  };
});

vi.mock(import("./data/mutations/patches.ts"), () => {
  return {
    addPatchMutation: vi.fn().mockResolvedValue({ id: "p1" }),
    removePatchMutation: vi.fn().mockResolvedValue(undefined)
  };
});

import WorkerClass from "./index.ts";

const DEFAULT_ENVIRONMENT: Record<string, unknown> = { ethang_modlist: {} };

const createInstance = (
  environment: Record<string, unknown> = DEFAULT_ENVIRONMENT
): any => {
  // eslint-disable-next-line unicorn/no-unreadable-new-expression
  const instance = new (WorkerClass as unknown as new () => {
    env: Record<string, unknown>;
  })();
  instance.env = environment;
  return instance;
};

describe("modlist WorkerEntrypoint", () => {
  describe("fetch", () => {
    it("should respond OK on fetch", async () => {
      const instance = createInstance({ ethang_modlist: {} });
      const response = await instance.fetch(
        new Request("https://example.com/")
      );

      expect(response.status).toBe(200);

      const body = await response.text();

      expect(body).toBe("OK");
    });
  });

  describe("rPC methods", () => {
    it("should expose all RPC methods", () => {
      const instance = createInstance();

      expect(instance.modList).toBeInstanceOf(Function);
      expect(instance.modLists).toBeInstanceOf(Function);
      expect(instance.createModList).toBeInstanceOf(Function);
      expect(instance.updateModList).toBeInstanceOf(Function);
      expect(instance.deleteModList).toBeInstanceOf(Function);

      expect(instance.mod).toBeInstanceOf(Function);
      expect(instance.mods).toBeInstanceOf(Function);
      expect(instance.createMod).toBeInstanceOf(Function);
      expect(instance.updateMod).toBeInstanceOf(Function);
      expect(instance.deleteMod).toBeInstanceOf(Function);

      expect(instance.requirement).toBeInstanceOf(Function);
      expect(instance.requirements).toBeInstanceOf(Function);
      expect(instance.addRequirement).toBeInstanceOf(Function);
      expect(instance.removeRequirement).toBeInstanceOf(Function);

      expect(instance.conflict).toBeInstanceOf(Function);
      expect(instance.conflicts).toBeInstanceOf(Function);
      expect(instance.addConflict).toBeInstanceOf(Function);
      expect(instance.removeConflict).toBeInstanceOf(Function);

      expect(instance.patch).toBeInstanceOf(Function);
      expect(instance.patches).toBeInstanceOf(Function);
      expect(instance.addPatch).toBeInstanceOf(Function);
      expect(instance.removePatch).toBeInstanceOf(Function);
    });
  });

  describe("modList operations", () => {
    it("should get a mod list by id", async () => {
      const instance = createInstance();
      const result = await instance.modList({ id: "ml1" });

      expect(result).toEqual(TEST_MODLIST_DATA);
    });

    it("should get all mod lists", async () => {
      const instance = createInstance();
      const result = await instance.modLists();

      expect(result).toEqual([TEST_MODLIST_DATA]);
    });

    it("should create a mod list", async () => {
      const instance = createInstance();
      const result = await instance.createModList({ name: "Test Mod List" });

      expect(result).toEqual(TEST_MODLIST_DATA);
    });

    it("should update a mod list", async () => {
      const instance = createInstance();
      const result = await instance.updateModList({
        id: "ml1",
        name: "Updated"
      });

      expect(result).toEqual(TEST_MODLIST_DATA);
    });

    it("should delete a mod list", async () => {
      const instance = createInstance();
      const result = await instance.deleteModList({ id: "ml1" });

      expect(result).toBeUndefined();
    });
  });

  describe("mod operations", () => {
    it("should get a mod by id", async () => {
      const instance = createInstance();
      const result = await instance.mod({ id: "m1" });

      expect(result).toEqual(TEST_MOD_DATA);
    });

    it("should get mods for a mod list", async () => {
      const instance = createInstance();
      const result = await instance.mods({ modListId: "ml1" });

      expect(result).toEqual([TEST_MOD_DATA]);
    });

    it("should create a mod", async () => {
      const instance = createInstance();
      const result = await instance.createMod({
        modListId: "ml1",
        title: "Test Mod",
        url: "https://example.com/mod"
      });

      expect(result).toEqual(TEST_MOD_DATA);
    });

    it("should update a mod", async () => {
      const instance = createInstance();
      const result = await instance.updateMod({
        id: "m1",
        title: "Updated",
        url: "https://example.com/mod2"
      });

      expect(result).toEqual(TEST_MOD_DATA);
    });

    it("should delete a mod", async () => {
      const instance = createInstance();
      const result = await instance.deleteMod({ id: "m1" });

      expect(result).toBeUndefined();
    });
  });

  describe("requirement operations", () => {
    it("should get a requirement by id", async () => {
      const instance = createInstance();
      const result = await instance.requirement({ id: "r1" });

      expect(result).toBeNull();
    });

    it("should get requirements for a mod list", async () => {
      const instance = createInstance();
      const result = await instance.requirements({ modListId: "ml1" });

      expect(result).toEqual([]);
    });

    it("should add a requirement", async () => {
      const instance = createInstance();
      const result = await instance.addRequirement({
        parentModId: "m1",
        requiresModId: "m2"
      });

      expect(result).toEqual({ id: "r1" });
    });

    it("should remove a requirement", async () => {
      const instance = createInstance();
      const result = await instance.removeRequirement({ id: "r1" });

      expect(result).toBeUndefined();
    });
  });

  describe("conflict operations", () => {
    it("should get a conflict by id", async () => {
      const instance = createInstance();
      const result = await instance.conflict({ id: "c1" });

      expect(result).toBeNull();
    });

    it("should get conflicts for a mod list", async () => {
      const instance = createInstance();
      const result = await instance.conflicts({ modListId: "ml1" });

      expect(result).toEqual([]);
    });

    it("should add a conflict", async () => {
      const instance = createInstance();
      const result = await instance.addConflict({
        modAId: "m1",
        modBId: "m2"
      });

      expect(result).toEqual({ id: "c1" });
    });

    it("should remove a conflict", async () => {
      const instance = createInstance();
      const result = await instance.removeConflict({ id: "c1" });

      expect(result).toBeUndefined();
    });
  });

  describe("patch operations", () => {
    it("should get a patch by id", async () => {
      const instance = createInstance();
      const result = await instance.patch({ id: "p1" });

      expect(result).toBeNull();
    });

    it("should get patches for a mod list", async () => {
      const instance = createInstance();
      const result = await instance.patches({ modListId: "ml1" });

      expect(result).toEqual([]);
    });

    it("should add a patch", async () => {
      const instance = createInstance();
      const result = await instance.addPatch({
        modAId: "m2",
        modBId: "m3",
        patchedById: "m1"
      });

      expect(result).toEqual({ id: "p1" });
    });

    it("should remove a patch", async () => {
      const instance = createInstance();
      const result = await instance.removePatch({ id: "p1" });

      expect(result).toBeUndefined();
    });
  });
});
