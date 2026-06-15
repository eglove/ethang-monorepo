import { and, desc, eq, isNull, lt, or } from "drizzle-orm";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";

import type { ServerContext } from "../../index.ts";

import { type Database, databaseSchema } from "../../db/database-schema.ts";
import { decodeCursor, encodeCursor } from "../util/cursor.ts";
import { getReadStateFilter } from "../util/read-filter.ts";

export const allArticlesQuery = (database: Database) => {
  return async (
    _parent: unknown,
    parameters: {
      after?: string;
      first?: number;
      isRead?: boolean;
    },
    context: ServerContext
  ) => {
    const { after, first = 20, isRead } = parameters;
    const limit = first + 1;

    const readStateFilter = getReadStateFilter(database, context.user.sub, {
      isRead
    });

    let lastPublishedAt: null | string = null;
    let lastId: null | string = null;

    if (!isNil(after)) {
      const decoded = decodeCursor(after);
      if (!isNil(decoded)) {
        [lastPublishedAt, lastId] = decoded;
      }
    }

    let paginationFilter;
    if (!isNil(lastId)) {
      paginationFilter = isNil(lastPublishedAt)
        ? and(
            isNull(databaseSchema.articlesTable.publishedAt),
            lt(databaseSchema.articlesTable.id, lastId)
          )
        : or(
            lt(databaseSchema.articlesTable.publishedAt, lastPublishedAt),
            and(
              eq(databaseSchema.articlesTable.publishedAt, lastPublishedAt),
              lt(databaseSchema.articlesTable.id, lastId)
            ),
            isNull(databaseSchema.articlesTable.publishedAt)
          );
    }

    const articles = await database
      .select({
        content: databaseSchema.articlesTable.content,
        feedId: databaseSchema.articlesTable.feedId,
        guid: databaseSchema.articlesTable.guid,
        id: databaseSchema.articlesTable.id,
        link: databaseSchema.articlesTable.link,
        publishedAt: databaseSchema.articlesTable.publishedAt,
        title: databaseSchema.articlesTable.title
      })
      .from(databaseSchema.articlesTable)
      .innerJoin(
        databaseSchema.subscriptionsTable,
        and(
          eq(
            databaseSchema.articlesTable.feedId,
            databaseSchema.subscriptionsTable.feedId
          ),
          eq(databaseSchema.subscriptionsTable.userId, context.user.sub)
        )
      )
      .where(and(readStateFilter, paginationFilter))
      .orderBy(
        desc(databaseSchema.articlesTable.publishedAt),
        desc(databaseSchema.articlesTable.id)
      )
      .limit(limit);

    const hasNextPage = articles.length > first;
    const items = articles.slice(0, first);

    const edges = map(items, (article) => {
      return {
        cursor: encodeCursor([article.publishedAt, article.id]),
        node: {
          __typename: "Article" as const,
          ...article
        }
      };
    });

    return {
      edges,
      pageInfo: {
        endCursor: edges.at(-1)?.cursor ?? null,
        hasNextPage,
        hasPreviousPage: false,
        startCursor: edges.at(0)?.cursor ?? null
      }
    };
  };
};
