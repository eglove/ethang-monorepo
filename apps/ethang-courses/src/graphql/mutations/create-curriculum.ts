import { inArray } from "drizzle-orm";
import chunk from "lodash/chunk.js";
import filter from "lodash/filter.js";
import map from "lodash/map.js";

import type { Database } from "../types.ts";

import {
  curriculumLearningPathsTable,
  curriculumsTable,
  generateId,
  learningPathsTable
} from "../../db/schema.ts";
import { populateCurriculum } from "../functions/populate-curriculum.ts";

export const createCurriculumMutation = (database: Database) => {
  return async (
    _parent: unknown,
    parameters: {
      learningPathIds?: null | string[];
      name: string;
      url?: null | string;
    }
  ) => {
    // 1. Validate learningPathIds if they exist
    if (parameters.learningPathIds && 0 < parameters.learningPathIds.length) {
      const existingLps = await database
        .select({ id: learningPathsTable.id })
        .from(learningPathsTable)
        .where(inArray(learningPathsTable.id, parameters.learningPathIds));

      const existingLpIds = new Set(
        map(existingLps, (lp) => {
          return lp.id;
        })
      );

      const missingIds = filter(parameters.learningPathIds, (id) => {
        return !existingLpIds.has(id);
      });

      if (0 < missingIds.length) {
        throw new Error(
          `The following learning path IDs do not exist: ${missingIds.join(", ")}`
        );
      }
    }

    // 2. Pre-generate the curriculum ID to support atomic batching
    const curriculumId = generateId();

    const insertCurriculumStmt = database
      .insert(curriculumsTable)
      .values({
        id: curriculumId,
        name: parameters.name,
        url: parameters.url
      })
      .returning();

    let inserted: typeof curriculumsTable.$inferSelect | undefined;

    // 3. Batch the insertions atomically using D1 Batch API, chunked to prevent parameter limits
    if (parameters.learningPathIds && 0 < parameters.learningPathIds.length) {
      const relationshipInserts = map(
        parameters.learningPathIds,
        (lpId, index) => {
          return {
            curriculumId,
            learningPathId: lpId,
            orderRank: index
          };
        }
      );

      const chunks = chunk(relationshipInserts, 15);
      const insertRelationsStmts = map(chunks, (itemChunk) => {
        return database.insert(curriculumLearningPathsTable).values(itemChunk);
      });

      const [[insertedCurriculum]] = await database.batch([
        insertCurriculumStmt,
        ...insertRelationsStmts
      ]);

      inserted = insertedCurriculum;
    } else {
      const [insertResults] = await insertCurriculumStmt;
      inserted = insertResults;
    }

    if (inserted === undefined) {
      throw new Error("Failed to create curriculum");
    }

    return populateCurriculum(database, inserted);
  };
};
