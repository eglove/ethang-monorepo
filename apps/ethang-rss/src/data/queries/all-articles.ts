import { and, desc, eq, isNull, lt, or, type SQL } from "drizzle-orm";
import { Effect } from "effect";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import slice from "lodash/slice.js";

import type { User } from "../../index.ts";

import { type Database, databaseSchema } from "../../db/database-schema.ts";
import { combineFilters } from "../util/combine-filters.ts";
import { decodeCursor, encodeCursor } from "../util/cursor.ts";
import { getReadStateFilter } from "../util/read-filter.ts";

export const allArticlesQuery = async (
  database: Database,
  parameters: {
    after?: string;
    first?: number;
    isRead?: boolean;
  },
  user: User
  // eslint-disable-next-line sonar/cyclomatic-complexity
) => {
  const { after, first = 20, isRead } = parameters;
  const limit = first + 1;

  const readStateFilter = getReadStateFilter(database, user.sub, {
    isRead: isRead ?? null
  });

  let lastPublishedAt: null | string = null;
  let lastId: null | string = null;

  if (!isNil(after)) {
    const result = await Effect.runPromise(decodeCursor(after));
    if (!isNil(result)) {
      [lastPublishedAt, lastId] = result;
    }
  }

  let paginationFilter: null | SQL = null;
  if (!isNil(lastId)) {
    paginationFilter = isNil(lastPublishedAt)
      ? (and(
          isNull(databaseSchema.articlesTable.publishedAt),
          lt(databaseSchema.articlesTable.id, lastId)
        ) ?? null)
      : (or(
          lt(databaseSchema.articlesTable.publishedAt, lastPublishedAt),
          and(
            eq(databaseSchema.articlesTable.publishedAt, lastPublishedAt),
            lt(databaseSchema.articlesTable.id, lastId)
          ),
          isNull(databaseSchema.articlesTable.publishedAt)
        ) ?? null);
  }

  const articleFilter = combineFilters(readStateFilter, paginationFilter);

  const articles = await database
    .select({
      content: databaseSchema.articlesTable.content,
      feedIconUrl: databaseSchema.feedsTable.iconUrl,
      feedId: databaseSchema.articlesTable.feedId,
      feedTitle: databaseSchema.feedsTable.title,
      guid: databaseSchema.articlesTable.guid,
      id: databaseSchema.articlesTable.id,
      isRead: databaseSchema.userItemStatesTable.isRead,
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
        eq(databaseSchema.subscriptionsTable.userId, user.sub)
      )
    )
    .leftJoin(
      databaseSchema.feedsTable,
      eq(databaseSchema.articlesTable.feedId, databaseSchema.feedsTable.id)
    )
    .leftJoin(
      databaseSchema.userItemStatesTable,
      and(
        eq(
          databaseSchema.articlesTable.id,
          databaseSchema.userItemStatesTable.articleId
        ),
        eq(databaseSchema.userItemStatesTable.userId, user.sub)
      )
    )
    // eslint-disable-next-line no-undefined
    .where(articleFilter ?? undefined)
    .orderBy(
      desc(databaseSchema.articlesTable.publishedAt),
      desc(databaseSchema.articlesTable.id)
    )
    .limit(limit);

  const hasNextPage = articles.length > first;
  const items = slice(articles, 0, first);

  const edges = map(items, (article) => {
    const {
      feedIconUrl,
      feedId: articleFeedId,
      feedTitle,
      isRead: articleIsRead,
      ...rest
    } = article;
    return {
      cursor: encodeCursor([article.publishedAt, article.id]),
      node: {
        __typename: "Article" as const,
        ...rest,
        feed: isNil(feedTitle)
          ? null
          : { iconUrl: feedIconUrl, id: articleFeedId, title: feedTitle },
        isRead: articleIsRead ?? false
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
