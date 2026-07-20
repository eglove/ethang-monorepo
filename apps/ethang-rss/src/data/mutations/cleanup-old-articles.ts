import type { drizzle } from "drizzle-orm/d1";

import { inArray, lt } from "drizzle-orm";
import { DateTime, Duration } from "effect";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";

import { databaseSchema } from "../../db/database-schema.ts";

export const cleanupOldArticles = async (
  database: ReturnType<typeof drizzle>,
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

  const oldIds = map(oldArticles, "id");

  await database
    .delete(userItemStatesTable)
    .where(inArray(userItemStatesTable.articleId, oldIds));

  await database.delete(articlesTable).where(inArray(articlesTable.id, oldIds));
};
