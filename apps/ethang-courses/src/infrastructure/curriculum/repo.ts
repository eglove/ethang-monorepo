import { inArray } from "drizzle-orm";
import { DateTime, Effect } from "effect";
import chunk from "lodash/chunk.js";
import filter from "lodash/filter.js";
import isEmpty from "lodash/isEmpty.js";
import map from "lodash/map.js";

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
      return Effect.gen(function* () {
        const now = DateTime.formatIso(DateTime.unsafeNow());
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

        if (isEmpty(curriculum.learningPathIds)) {
          const [result] = yield* Effect.tryPromise({
            catch: (cause) => {
              return new SaveError(String(cause));
            },
            try: () => {
              return insertCurriculumStatement;
            }
          });
          if (!result) {
            return yield* Effect.fail(
              new SaveError("Failed to create curriculum")
            );
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

        const [[insertedCurriculum]] = yield* Effect.tryPromise({
          catch: (cause) => {
            return new SaveError(String(cause));
          },
          try: async () => {
            return database.batch([
              insertCurriculumStatement,
              ...insertRelationsStatements
            ]);
          }
        });

        if (!insertedCurriculum) {
          return yield* Effect.fail(
            new SaveError("Failed to create curriculum")
          );
        }

        return {
          ...toCurriculum(insertedCurriculum),
          learningPathIds: curriculum.learningPathIds
        };
      });
    },
    validateLearningPathIds: (ids: readonly string[]) => {
      return Effect.gen(function* () {
        if (isEmpty(ids)) {
          return;
        }

        const existingLps = yield* Effect.tryPromise({
          catch: (cause) => {
            return new ValidationError(String(cause));
          },
          try: () => {
            return database
              .select({ id: learningPathsTable.id })
              .from(learningPathsTable)
              .where(inArray(learningPathsTable.id, Array.fromIterable(ids)));
          }
        });

        const existingLpIds = new Set(map(existingLps, "id"));

        const missingIds = filter(ids, (id) => {
          return !existingLpIds.has(id);
        });

        if (0 < missingIds.length) {
          yield* Effect.fail(
            new ValidationError(
              `The following learning path IDs do not exist: ${missingIds.join(", ")}`
            )
          );
        }
      });
    }
  };
};
