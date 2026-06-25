import { eq } from "drizzle-orm";

import type { Database } from "../types.ts";

import {
  conflictTable,
  modificationTable as moduleTable,
  patchTable,
  requirementTable
} from "../../db/schema.ts";

export const modificationQuery = async (
  database: Database,
  parameters: { id: string }
) => {
  const result = await database
    .select()
    .from(moduleTable)
    .where(eq(moduleTable.id, parameters.id))
    .limit(1);

  return result[0] ?? null;
};

export const modsQuery = async (
  database: Database,
  parameters: { modListId: string }
) => {
  return database
    .select()
    .from(moduleTable)
    .where(eq(moduleTable.modListId, parameters.modListId));
};

export const requirementQuery = async (
  database: Database,
  parameters: { id: string }
) => {
  const result = await database
    .select()
    .from(requirementTable)
    .where(eq(requirementTable.id, parameters.id))
    .limit(1);

  return result[0] ?? null;
};

export const requirementsQuery = async (
  database: Database,
  parameters: { modListId: string }
) => {
  return database
    .select()
    .from(requirementTable)
    .where(eq(requirementTable.parentModId, parameters.modListId));
};

export const conflictQuery = async (
  database: Database,
  parameters: { id: string }
) => {
  const result = await database
    .select()
    .from(conflictTable)
    .where(eq(conflictTable.id, parameters.id))
    .limit(1);

  return result[0] ?? null;
};

export const conflictsQuery = async (
  database: Database,
  parameters: { modListId: string }
) => {
  return database
    .select()
    .from(conflictTable)
    .where(eq(conflictTable.modAId, parameters.modListId));
};

export const patchQuery = async (
  database: Database,
  parameters: { id: string }
) => {
  const result = await database
    .select()
    .from(patchTable)
    .where(eq(patchTable.id, parameters.id))
    .limit(1);

  return result[0] ?? null;
};

export const patchesQuery = async (
  database: Database,
  parameters: { modListId: string }
) => {
  return database
    .select()
    .from(patchTable)
    .where(eq(patchTable.modAId, parameters.modListId));
};
