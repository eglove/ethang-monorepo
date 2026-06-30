import { eq } from "drizzle-orm";

import type { Database } from "../types.ts";

import { conflictTable, generateId } from "../../db/schema.ts";

export const addConflictMutation = async (
  database: Database,
  parameters: {
    modAId: string;
    modBId: string;
  }
) => {
  const id = generateId();

  const [inserted] = await database
    .insert(conflictTable)
    .values({
      id,
      modAId: parameters.modAId,
      modBId: parameters.modBId
    })
    .returning();

  return inserted;
};

export const removeConflictMutation = async (
  database: Database,
  parameters: { id: string }
) => {
  await database
    .delete(conflictTable)
    .where(eq(conflictTable.id, parameters.id));
};
