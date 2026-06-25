import { eq } from "drizzle-orm";

import type { Database } from "../types.ts";

import { generateId, patchTable } from "../../db/schema.ts";

export const addPatchMutation = async (
  database: Database,
  parameters: {
    modAId: string;
    modBId: string;
    patchedById: string;
  }
) => {
  const id = generateId();

  const [inserted] = await database
    .insert(patchTable)
    .values({
      id,
      modAId: parameters.modAId,
      modBId: parameters.modBId,
      patchedById: parameters.patchedById
    })
    .returning();

  return inserted;
};

export const removePatchMutation = async (
  database: Database,
  parameters: { id: string }
) => {
  await database.delete(patchTable).where(eq(patchTable.id, parameters.id));
};
