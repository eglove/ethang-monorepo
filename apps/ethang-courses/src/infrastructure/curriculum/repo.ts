import { inArray } from "drizzle-orm";
import { Effect } from "effect";
import chunk from "lodash/chunk.js";
import filter from "lodash/filter.js";
import map from "lodash/map.js";
import { DateTime } from "luxon";

import type { Database } from "../../data/types.ts";
import type { Curriculum } from "../../domain/curriculum/state.ts";

import {
  curriculumLearningPathsTable,
  curriculumsTable,
  generateId,
  learningPathsTable
} from "../../db/schema.ts";
import { SaveError } from "../../errors/save-error.ts";
import { ValidationError } from "../../errors/validation-error.ts";

export type CurriculumRepo = {
  readonly save: (
    curriculum: Curriculum
  ) => Effect.Effect<Curriculum, SaveError>;
  readonly validateLearningPathIds: (
    ids: readonly string[]
  ) => Effect.Effect<void, ValidationError>;
};

const toCurriculum = (row: {
  id: string;
  name: string;
  url: null | string;
}) => {
  return {
    curriculumId: row.id,
    learningPathIds: [],
    name: row.name,
    url: row.url
  };
};

export const createCurriculumRepo = (database: Database) => {
  return {
    save: (curriculum: Curriculum) => {
      return Effect.tryPromise({
        catch: (cause) => {
          return new SaveError(String(cause));
        },
        try: async () => {
          const now = DateTime.now().toISO();
          const databaseUrl = curriculum.url ?? null;

          const insertCurriculumStatement = database
            .insert(curriculumsTable)
            .values({
              createdAt: now,
              id: curriculum.curriculumId,
              name: curriculum.name,
              updatedAt: now,
              url: databaseUrl
            })
            .returning();

          if (0 === curriculum.learningPathIds.length) {
            const [result] = await insertCurriculumStatement;
            if (!result) {
              throw new Error("Failed to create curriculum");
            }
            return toCurriculum(result);
          }

          const relationshipInserts = map(
            curriculum.learningPathIds,
            (lpId, index) => {
              return {
                createdAt: now,
                curriculumId: curriculum.curriculumId,
                id: generateId(),
                learningPathId: lpId,
                orderRank: index
              };
            }
          );

          const chunks = chunk(relationshipInserts, 15);
          const insertRelationsStatements = map(chunks, (itemChunk) => {
            return database
              .insert(curriculumLearningPathsTable)
              .values(itemChunk);
          });

          const [[insertedCurriculum]] = await database.batch([
            insertCurriculumStatement,
            ...insertRelationsStatements
          ]);

          if (!insertedCurriculum) {
            throw new Error("Failed to create curriculum");
          }

          return {
            ...toCurriculum(insertedCurriculum),
            learningPathIds: curriculum.learningPathIds
          };
        }
      });
    },
    validateLearningPathIds: (ids: readonly string[]) => {
      return Effect.tryPromise({
        catch: (cause) => {
          return new ValidationError(String(cause));
        },
        try: async () => {
          if (0 === ids.length) {
            return;
          }

          const existingLps = await database
            .select({ id: learningPathsTable.id })
            .from(learningPathsTable)
            .where(inArray(learningPathsTable.id, [...ids]));

          const existingLpIds = new Set(
            map(existingLps, (lp) => {
              return lp.id;
            })
          );

          const missingIds = filter(ids, (id) => {
            return !existingLpIds.has(id);
          });

          if (0 < missingIds.length) {
            throw new Error(
              `The following learning path IDs do not exist: ${missingIds.join(", ")}`
            );
          }
        }
      });
    }
  };
};
