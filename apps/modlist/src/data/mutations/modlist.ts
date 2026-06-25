import { eq } from "drizzle-orm";
import { DateTime } from "luxon";

import type { Database } from "../types.ts";

import {
  generateId,
  modificationListTable as moduleListTable
} from "../../db/schema.ts";

export const createModificationListMutation = async (
  database: Database,
  parameters: { name: string }
) => {
  const id = generateId();

  const [inserted] = await database
    .insert(moduleListTable)
    .values({
      id,
      name: parameters.name
    })
    .returning();

  return inserted;
};

export const updateModificationListMutation = async (
  database: Database,
  parameters: { id: string; name: string }
) => {
  const [updated] = await database
    .update(moduleListTable)
    .set({
      name: parameters.name,
      updatedAt: DateTime.now().toISO()
    })
    .where(eq(moduleListTable.id, parameters.id))
    .returning();

  return updated;
};

export const deleteModificationListMutation = async (
  database: Database,
  parameters: { id: string }
) => {
  await database
    .delete(moduleListTable)
    .where(eq(moduleListTable.id, parameters.id));
};
