import { and, desc, eq, lt } from "drizzle-orm";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";

import type { ServerContext } from "../../index.ts";

import { type Database, databaseSchema } from "../../db/database-schema.ts";
import { createConnection } from "../util/pagination.ts";
import { getReadStateFilter } from "../util/read-filter.ts";

export const feedArticlesQuery = (database: Database) => {
  return async (
    _parent: unknown,
    parameters: {
      after?: string;
      feedId: string;
      first?: number;
      isRead?: boolean;
    },
    context: ServerContext
  ) => {
    const { after, feedId, first = 20, isRead } = parameters;
    const limit = first + 1;

    const readStateFilter = getReadStateFilter(database, context.user.sub, {
      isRead
    });

    const articles = await database
      .select()
      .from(databaseSchema.articlesTable)
      .where(
        and(
          eq(databaseSchema.articlesTable.feedId, feedId),
          readStateFilter,
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
