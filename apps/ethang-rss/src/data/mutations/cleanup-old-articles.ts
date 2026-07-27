import type { drizzle } from "drizzle-orm/d1";

import { inArray, lt } from "drizzle-orm";
import { DateTime, Duration } from "effect";
import chunk from "lodash/chunk.js";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";

import { databaseSchema } from "../../db/database-schema.ts";

const CHUNK_SIZE = 100;

export const cleanupOldArticles = async (
  database: Pick<
    ReturnType<typeof drizzle>,
    "delete" | "insert" | "select" | "update"
  >,
  cutoffIso?: null | string
) => {
  const ninetyDaysAgo = DateTime.formatIso(
    DateTime.subtractDuration(DateTime.unsafeNow(), Duration.days(90))
  );

  const effectiveCutoff =
    !isNil(cutoffIso) && !Number.isNaN(Date.parse(cutoffIso))
      ? cutoffIso
      : ninetyDaysAgo;

  const { articlesTable } = databaseSchema;
  const { userItemStatesTable } = databaseSchema;

  const oldArticles = await database
    .select({ id: articlesTable.id })
    .from(articlesTable)
    .where(lt(articlesTable.publishedAt, effectiveCutoff));

  if (isEmpty(oldArticles)) {
    return;
  }

  const allOldIds = map(oldArticles, "id");
  const idChunks = chunk(allOldIds, CHUNK_SIZE);

  await Promise.all(
    map(idChunks, (idChunk) => {
      return database
        .delete(userItemStatesTable)
        .where(inArray(userItemStatesTable.articleId, idChunk));
    })
  );

  await Promise.all(
    map(idChunks, (idChunk) => {
      return database
        .delete(articlesTable)
        .where(inArray(articlesTable.id, idChunk));
    })
  );
};
