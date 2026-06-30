import { eq } from "drizzle-orm";

import type { Database } from "../types.ts";

import { modificationListTable as moduleListTable } from "../../db/schema.ts";

export const modificationListQuery = async (
  database: Database,
  parameters: { id: string }
) => {
  const result = await database
    .select()
    .from(moduleListTable)
    .where(eq(moduleListTable.id, parameters.id))
    .limit(1);

  return result[0] ?? null;
};

export const modificationListsQuery = async (database: Database) => {
  return database.select().from(moduleListTable);
};
