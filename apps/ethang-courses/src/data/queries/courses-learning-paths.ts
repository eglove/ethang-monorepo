import { eq } from "drizzle-orm";
import map from "lodash/map.js";

import type { Database } from "../types.ts";

import { coursesTable, learningPathsTable } from "../../db/schema.ts";
import { populateLearningPath } from "../functions/populate-curriculum.ts";

export const coursesQuery = async (database: Database) => {
  return database.select().from(coursesTable);
};

export const courseQuery = async (
  database: Database,
  parameters: { id: string }
) => {
  const result = await database
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.id, parameters.id))
    .limit(1);

  return result[0] ?? null;
};

export const learningPathsQuery = async (database: Database) => {
  const learningPaths = await database.select().from(learningPathsTable);

  return Promise.all(
    map(learningPaths, async (lp) => {
      return populateLearningPath(database, lp);
    })
  );
};

export const learningPathQuery = async (
  database: Database,
  parameters: { id: string }
) => {
  // Get the learning path
  const [learningPath] = await database
    .select()
    .from(learningPathsTable)
    .where(eq(learningPathsTable.id, parameters.id))
    .limit(1);

  if (!learningPath) {
    return null;
  }

  return populateLearningPath(database, learningPath);
};
