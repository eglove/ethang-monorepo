import { eq } from "drizzle-orm";

import type { Database } from "../types.ts";

import { generateId, requirementTable } from "../../db/schema.ts";

export const addRequirementMutation = async (
  database: Database,
  parameters: {
    parentModId: string;
    requiresModId: string;
  }
) => {
  const id = generateId();

  const [inserted] = await database
    .insert(requirementTable)
    .values({
      id,
      parentModId: parameters.parentModId,
      requiresModId: parameters.requiresModId
    })
    .returning();

  return inserted;
};

export const removeRequirementMutation = async (
  database: Database,
  parameters: { id: string }
) => {
  await database
    .delete(requirementTable)
    .where(eq(requirementTable.id, parameters.id));
};
