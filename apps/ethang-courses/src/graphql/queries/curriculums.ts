import { eq } from "drizzle-orm";
import map from "lodash/map.js";

import type { Database } from "../types.ts";

import { curriculumsTable } from "../../db/schema.ts";
import { populateCurriculum } from "../functions/populate-curriculum.ts";

export const curriculumsQuery = (database: Database) => {
  return async () => {
    const curriculums = await database.select().from(curriculumsTable);

    return Promise.all(
      map(curriculums, async (curriculum) => {
        return populateCurriculum(database, curriculum);
      })
    );
  };
};

export const curriculumQuery = (database: Database) => {
  return async (_parent: unknown, parameters: { id: string }) => {
    const [curriculum] = await database
      .select()
      .from(curriculumsTable)
      .where(eq(curriculumsTable.id, parameters.id))
      .limit(1);

    if (!curriculum) {
      return null;
    }

    return populateCurriculum(database, curriculum);
  };
};
