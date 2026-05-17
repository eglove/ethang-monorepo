import { and, desc, eq, lt } from "drizzle-orm";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";

import { type Database, databaseSchema } from "../../db/database-schema.ts";
import { createConnection } from "../util/pagination.ts";

export const feedArticlesQuery = (database: Database) => {
  return async (
    _parent: unknown,
    parameters: { after?: string; feedId: string; first?: number }
  ) => {
    const { after, feedId, first = 20 } = parameters;
    const limit = first + 1;

    const articles = await database
      .select()
      .from(databaseSchema.articlesTable)
      .where(
        and(
          eq(databaseSchema.articlesTable.feedId, feedId),
          isNil(after) ? undefined : lt(databaseSchema.articlesTable.id, after)
        )
      )
      .orderBy(desc(databaseSchema.articlesTable.id))
      .limit(limit);

    const hasNextPage = articles.length > first;
    const items = articles.slice(0, first);

    return createConnection(
      map(items, (article) => {
        return {
          __typename: "Article" as const,
          ...article
        };
      }),
      hasNextPage
    );
  };
};
