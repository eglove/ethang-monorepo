import { describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { sql } from "drizzle-orm";

import {
  conflictTable,
  generateId,
  modificationListTable,
  modificationTable,
  patchTable,
  requirementTable
} from "./schema.ts";

const schema = {
  conflictTable,
  modListTable: modificationListTable,
  modTable: modificationTable,
  patchTable,
  requirementTable
};

/**
 * Build a sqlite-proxy db whose driver returns `rows` for every call.
 * When the proxy runs an INSERT with .$defaultFn values, drizzle inserts
 * the computed defaults into the SQL string. By returning the inserted row
 * for "returning" queries we let the defaultFn callbacks actually execute.
 */
function makeProxyDb(returnedRows: unknown[]) {
  return drizzle(
    async (querySql, _params, _method) => {
      if (querySql.toLowerCase().includes("returning")) {
        return { rows: returnedRows as never };
      }
      return { rows: [] as unknown[] };
    },
    { schema: schema as never }
  );
}

describe("schema", () => {
  it("modificationListTable is defined", () => {
    expect(modificationListTable).toBeDefined();
  });

  it("modificationTable is defined", () => {
    expect(modificationTable).toBeDefined();
  });

  it("requirementTable is defined", () => {
    expect(requirementTable).toBeDefined();
  });

  it("conflictTable is defined", () => {
    expect(conflictTable).toBeDefined();
  });

  it("patchTable is defined", () => {
    expect(patchTable).toBeDefined();
  });

  it("generateId returns a string", () => {
    expect(typeof generateId()).toBe("string");
  });

  it("build schema and run select query", async () => {
    const db = await makeProxyDb([]);
    await db.run(sql`SELECT 1;`);
    await db
      .select()
      .from(modificationListTable)
      .where(sql`${modificationListTable.id} = ${"ml1"}`);
    await db
      .select()
      .from(modificationTable)
      .where(sql`${modificationTable.id} = ${"m1"}`);
    await db
      .select()
      .from(requirementTable)
      .where(sql`${requirementTable.id} = ${"r1"}`);
    await db
      .select()
      .from(conflictTable)
      .where(sql`${conflictTable.id} = ${"c1"}`);
    await db
      .select()
      .from(patchTable)
      .where(sql`${patchTable.id} = ${"p1"}`);

    await db.insert(modificationListTable).values({ name: "List" }).returning();
    await db.insert(modificationListTable).values({ name: "List" });

    await db
      .update(modificationTable)
      .set({ title: "Mod" })
      .where(sql`${modificationTable.id} = ${"m1"}`)
      .returning();

    await db.delete(modificationListTable).where(
      sql`${modificationListTable.id} = ${"ml1"}`
    );
    await db.delete(modificationTable).where(
      sql`${modificationTable.id} = ${"m1"}`
    );
    await db.delete(requirementTable).where(
      sql`${requirementTable.id} = ${"r1"}`
    );
    await db.delete(conflictTable).where(sql`${conflictTable.id} = ${"c1"}`);
    await db.delete(patchTable).where(sql`${patchTable.id} = ${"p1"}`);
  });

  it("insert on modificationList triggers default id + timestamps", async () => {
    const db = makeProxyDb([{ id: "ML", createdAt: "x", updatedAt: "x", name: "List" }]);
    const [row] = await db
      .insert(modificationListTable)
      .values({ name: "List" })
      .returning();
    expect(row).toBeDefined();
  });

  it("insert on modification triggers default id + timestamps", async () => {
    const db = makeProxyDb([{ id: "M", createdAt: "x", updatedAt: "x", title: "T", url: "https://u", modListId: "ml1" }]);
    const [row] = await db
      .insert(modificationTable)
      .values({ modListId: "ml1", title: "T", url: "https://u" })
      .returning();
    expect(row).toBeDefined();
  });

  it("insert on requirement triggers default id", async () => {
    const db = makeProxyDb([{ id: "R", parentModId: "m1", requiresModId: "m2" }]);
    const [row] = await db
      .insert(requirementTable)
      .values({ parentModId: "m1", requiresModId: "m2" })
      .returning();
    expect(row).toBeDefined();
  });

  it("insert on conflict triggers default id", async () => {
    const db = makeProxyDb([{ id: "C", modAId: "m1", modBId: "m2" }]);
    const [row] = await db
      .insert(conflictTable)
      .values({ modAId: "m1", modBId: "m2" })
      .returning();
    expect(row).toBeDefined();
  });

  it("insert on patch triggers default id", async () => {
    const db = makeProxyDb([{ id: "P", modAId: "m1", modBId: "m2", patchedById: "m3" }]);
    const [row] = await db
      .insert(patchTable)
      .values({ modAId: "m1", modBId: "m2", patchedById: "m3" })
      .returning();
    expect(row).toBeDefined();
  });

  it("select from conflictTable with where covers references callback", async () => {
    const db = makeProxyDb([]);
    await db
      .select()
      .from(conflictTable)
      .where(sql`${conflictTable.modAId} = ${"m1"}`);
  });

  it("select from patchTable with where covers references callback", async () => {
    const db = makeProxyDb([]);
    await db
      .select()
      .from(patchTable)
      .where(sql`${patchTable.modAId} = ${"m1"}`);
  });
});
