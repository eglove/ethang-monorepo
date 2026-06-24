import { and, eq, inArray, not } from "drizzle-orm";
import isNil from "lodash/isNil.js";

import { type Database, databaseSchema } from "../../db/database-schema.ts";

export const getReadStateFilter = (
  database: Database,
  userId: string,
  options: { isRead?: boolean | undefined } = {}
) => {
  const { isRead } = options;
  if (isNil(isRead)) {
    return;
  }

  const readArticleIds = database
    .select({
      articleId: databaseSchema.userItemStatesTable.articleId
    })
    .from(databaseSchema.userItemStatesTable)
    .where(
      and(
        eq(databaseSchema.userItemStatesTable.userId, userId),
        eq(databaseSchema.userItemStatesTable.isRead, true)
      )
    );

  return isRead
    ? inArray(databaseSchema.articlesTable.id, readArticleIds)
    : not(inArray(databaseSchema.articlesTable.id, readArticleIds));
};
