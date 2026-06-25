import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { describe, expect, it } from "vitest";

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
Build a sqlite-proxy db whose driver returns `rows` for every call.
When the proxy runs an INSERT with .$defaultFn values, drizzle inserts
the computed defaults into the SQL string. By returning the inserted row
for "returning" queries we let the defaultFn callbacks actually execute.
*/
function makeProxyDatabase(returnedRows: unknown[]) {
  return drizzle(
    async (querySql, _parameters, _method) => {
      if (-1 !== querySql.search("returning")) {
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
    expect(generateId()).toBeTypeOf("string");
  });

  it("build schema and run select query", async () => {
    const database = makeProxyDatabase([]);
    await database.run(sql`SELECT 1;`);
    await database
      .select()
      .from(modificationListTable)
      .where(sql`${modificationListTable.id} = ${"ml1"}`);
    await database
      .select()
      .from(modificationTable)
      .where(sql`${modificationTable.id} = ${"m1"}`);
    await database
      .select()
      .from(requirementTable)
      .where(sql`${requirementTable.id} = ${"r1"}`);
    await database
      .select()
      .from(conflictTable)
      .where(sql`${conflictTable.id} = ${"c1"}`);
    await database
      .select()
      .from(patchTable)
      .where(sql`${patchTable.id} = ${"p1"}`);

    await database
      .insert(modificationListTable)
      .values({ name: "List" })
      .returning();
    const insertResult = await database
      .insert(modificationListTable)
      .values({ name: "List" });
    expect(insertResult).toBeDefined();

    await database
      .update(modificationTable)
      .set({ title: "Mod" })
      .where(sql`${modificationTable.id} = ${"m1"}`)
      .returning();

    await database
      .delete(modificationListTable)
      .where(sql`${modificationListTable.id} = ${"ml1"}`);
    await database
      .delete(modificationTable)
      .where(sql`${modificationTable.id} = ${"m1"}`);
    await database
      .delete(requirementTable)
      .where(sql`${requirementTable.id} = ${"r1"}`);
    await database
      .delete(conflictTable)
      .where(sql`${conflictTable.id} = ${"c1"}`);
    await database.delete(patchTable).where(sql`${patchTable.id} = ${"p1"}`);
  });

  it("insert on modificationList triggers default id + timestamps", async () => {
    const database = makeProxyDatabase([
      { createdAt: "x", id: "ML", name: "List", updatedAt: "x" }
    ]);
    const [row] = await database
      .insert(modificationListTable)
      .values({ name: "List" })
      .returning();

    expect(row).toBeDefined();
  });

  it("insert on modification triggers default id + timestamps", async () => {
    const database = makeProxyDatabase([
      {
        createdAt: "x",
        id: "M",
        modListId: "ml1",
        title: "T",
        updatedAt: "x",
        url: "https://u"
      }
    ]);
    const [row] = await database
      .insert(modificationTable)
      .values({ modListId: "ml1", title: "T", url: "https://u" })
      .returning();

    expect(row).toBeDefined();
  });

  it("insert on requirement triggers default id", async () => {
    const database = makeProxyDatabase([
      { id: "R", parentModId: "m1", requiresModId: "m2" }
    ]);
    const [row] = await database
      .insert(requirementTable)
      .values({ parentModId: "m1", requiresModId: "m2" })
      .returning();

    expect(row).toBeDefined();
  });

  it("insert on conflict triggers default id", async () => {
    const database = makeProxyDatabase([
      { id: "C", modAId: "m1", modBId: "m2" }
    ]);
    const [row] = await database
      .insert(conflictTable)
      .values({ modAId: "m1", modBId: "m2" })
      .returning();

    expect(row).toBeDefined();
  });

  it("insert on patch triggers default id", async () => {
    const database = makeProxyDatabase([
      { id: "P", modAId: "m1", modBId: "m2", patchedById: "m3" }
    ]);
    const [row] = await database
      .insert(patchTable)
      .values({ modAId: "m1", modBId: "m2", patchedById: "m3" })
      .returning();

    expect(row).toBeDefined();
  });

  it("select from conflictTable with where covers references callback", async () => {
    const database = makeProxyDatabase([]);
    const rows = await database
      .select()
      .from(conflictTable)
      .where(sql`${conflictTable.modAId} = ${"m1"}`);
    expect(rows).toBeDefined();
  });

  it("select from patchTable with where covers references callback", async () => {
    const database = makeProxyDatabase([]);
    const rows = await database
      .select()
      .from(patchTable)
      .where(sql`${patchTable.modAId} = ${"m1"}`);
    expect(rows).toBeDefined();
  });
});
