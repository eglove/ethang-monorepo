import { eq } from "drizzle-orm";
import { DateTime } from "effect";

import type { Database } from "../types.ts";

import {
  generateId,
  modificationTable as moduleTable
} from "../../db/schema.ts";

export const createModificationMutation = async (
  database: Database,
  parameters: {
    modListId: string;
    title: string;
    url: string;
  }
) => {
  const id = generateId();

  const [inserted] = await database
    .insert(moduleTable)
    .values({
      id,
      modListId: parameters.modListId,
      title: parameters.title,
      url: parameters.url
    })
    .returning();

  return inserted;
};

export const updateModificationMutation = async (
  database: Database,
  parameters: {
    id: string;
    title: string;
    url: string;
  }
) => {
  const [updated] = await database
    .update(moduleTable)
    .set({
      title: parameters.title,
      updatedAt: DateTime.formatIso(DateTime.unsafeNow()),
      url: parameters.url
    })
    .where(eq(moduleTable.id, parameters.id))
    .returning();

  return updated;
};

export const deleteModificationMutation = async (
  database: Database,
  parameters: { id: string }
) => {
  await database.delete(moduleTable).where(eq(moduleTable.id, parameters.id));
};
